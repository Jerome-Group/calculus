import { z } from "zod";
import {
  attemptInputSchema,
  attemptSchema,
  checkedAttempt,
  conflictResponseSchema,
  emptyOverview,
  emptyStudyValue,
  importResultSchema,
  mutableKeySchema,
  parseMutableValue,
  parseRecordKey,
  readResponseSchema,
  recordKey,
  userSchema,
  writeResponseSchema,
  type AttemptInput,
  type ImportResult,
  type MutableStudyKey,
  type MutableValue,
  type StudyAttempt,
  type StudyOverview,
  type StudyUser,
  type Persistence,
  type SaveOutcome,
  type WireRecord,
} from "@/lib/study/model";
import {
  legacyChunks,
  previewLegacy,
  type LegacyPreview,
} from "@/lib/study/legacy";
import {
  initialInlineExperimentValue,
  inlineExperimentSnapshot,
  normalizeInlineExperimentValue,
  type Parameter,
} from "@/lib/curriculum/inline-experiments";

type Edit = {
  value: MutableValue | null;
  mutationId: string;
  seq: number;
  resolve: (outcome: SaveOutcome) => void;
};
type Entry = {
  key: MutableStudyKey;
  value: MutableValue | null;
  confirmed: WireRecord | null;
  loaded: boolean;
  seq: number;
  pending?: Edit;
  flight?: Edit;
  persistence: Persistence;
};
type AttemptEntry = {
  input: AttemptInput;
  value: StudyAttempt;
  persistence: Persistence;
  resolve: (outcome: SaveOutcome) => void;
  sending: boolean;
};
type History = {
  records: StudyAttempt[];
  total: number;
  cursor: string | null;
  loading: boolean;
  error: string;
};
const loading: Persistence = {
  kind: "loading",
  message: "Loading account data…",
};
const guest: Persistence = {
  kind: "guest",
  message: "Sign in to save. This work stays in this tab.",
};
const saving: Persistence = {
  kind: "saving",
  message: "Saving to your account…",
};
const saved: Persistence = { kind: "saved", message: "Saved to your account." };
const ready: Persistence = {
  kind: "ready",
  message: "No saved account record yet.",
};
const conflict: Persistence = {
  kind: "conflict",
  message: "Your account has another version. Compare both before choosing.",
};
const failed = (
  reason: "offline" | "service" | "invalid" = navigator.onLine === false
    ? "offline"
    : "service",
): Persistence => ({
  kind: "unsaved",
  reason,
  message:
    reason === "invalid"
      ? "Not saved. This value exceeds the allowed format or size. Keep or copy your work."
      : "Not saved to your account. Keep this tab open and retry.",
});
const emptyHistory = (): History => ({
  records: [],
  total: 0,
  cursor: null,
  loading: false,
  error: "",
});
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export function createStudySession() {
  const entries = new Map<string, Entry>();
  const attempts = new Map<string, AttemptEntry>();
  const histories = new Map<string, History>();
  const lessonLoads = new Map<string, Promise<void>>();
  const seenLessons = new Set<string>();
  const loadedLessons = new Set<string>();
  const controllers = new Set<AbortController>();
  const subscribers = new Set<() => void>();
  let version = 0,
    epoch = 0;
  let user: StudyUser | null = null;
  let phase: "loading" | "guest" | "account" | "unavailable" = "loading";
  let visible = false;
  let overview: StudyOverview = emptyOverview;
  let overviewError = "";
  let overviewRequest = 0;
  let accountNotice = "";
  let channel: BroadcastChannel | undefined;
  let validating: Promise<void> | undefined;
  let resumeLoad: Promise<void> | undefined;
  let preview: (LegacyPreview & { owner: string }) | null = null;
  let importResults: ImportResult[] = [];
  let importing = false;
  let importError = "";
  const notify = () => {
    version++;
    subscribers.forEach((fn) => fn());
  };
  function entry(key: MutableStudyKey) {
    const id = recordKey(key);
    let value = entries.get(id);
    if (!value) {
      const loaded =
        phase === "guest" ||
        ("lessonId" in key && loadedLessons.has(key.lessonId));
      value = {
        key,
        value: emptyStudyValue(key),
        confirmed: null,
        loaded,
        seq: 0,
        persistence:
          phase === "guest"
            ? guest
            : loaded
              ? ready
              : phase === "unavailable"
                ? failed("service")
                : loading,
      };
      entries.set(id, value);
    }
    return value;
  }
  function queueCurrentEdit(value: Entry, edit: Edit) {
    if (edit.seq !== value.seq) {
      edit.resolve({ kind: "superseded" });
      return false;
    }
    value.pending = edit;
    return true;
  }
  function invalidate(clear: boolean, broadcast = false) {
    epoch++;
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
    lessonLoads.clear();
    resumeLoad = undefined;
    loadedLessons.clear();
    for (const value of entries.values()) {
      if (clear) {
        value.pending?.resolve({ kind: "account-changed" });
        value.flight?.resolve({ kind: "account-changed" });
      } else if (value.flight) {
        queueCurrentEdit(value, value.flight);
        value.flight = undefined;
      }
    }
    for (const value of attempts.values()) {
      value.sending = false;
      if (clear) value.resolve({ kind: "account-changed" });
    }
    for (const history of histories.values()) history.loading = false;
    importing = false;
    visible = false;
    if (clear) {
      entries.clear();
      attempts.clear();
      histories.clear();
      seenLessons.clear();
      overview = emptyOverview;
      overviewError = "";
      preview = null;
      importResults = [];
      importError = "";
      user = null;
      phase = "loading";
    }
    if (broadcast) channel?.postMessage("invalidate");
    notify();
  }
  async function request(path: string, body?: unknown) {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      const response = await fetch(`/api/study${path}`, {
        method: body ? "POST" : "GET",
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });
      const data: unknown = await response.json();
      return { response, data };
    } finally {
      controllers.delete(controller);
    }
  }
  function responseOwner(data: unknown, generation: number) {
    if (generation !== epoch) return false;
    const parsed = z.object({ user: userSchema.nullable() }).safeParse(data);
    if (parsed.success && parsed.data.user?.id !== user?.id) {
      accountNotice =
        "Your account changed. Previous account work was cleared from this tab.";
      invalidate(true, true);
      validating = undefined;
      void validate();
      return false;
    }
    return true;
  }
  function install(record: WireRecord | null, value: Entry) {
    if ((record?.revision ?? 0) < (value.confirmed?.revision ?? 0)) return;
    const pending = value.pending;
    const locallyChanged =
      value.seq > 0 &&
      !same(
        value.value ?? emptyStudyValue(value.key),
        value.confirmed?.value ?? emptyStudyValue(value.key),
      );
    const previousRevision = value.confirmed?.revision ?? 0;
    value.confirmed = record;
    value.loaded = true;
    if (!pending && locallyChanged) {
      if ((record?.revision ?? 0) !== previousRevision)
        value.persistence = conflict;
      return;
    }
    if (pending) {
      if (
        record?.mutationId === pending.mutationId &&
        same(record.value, pending.value)
      ) {
        value.pending = undefined;
        value.value = record.value as MutableValue | null;
        value.persistence = saved;
        pending.resolve({ kind: "saved" });
      } else if ((record?.revision ?? 0) !== previousRevision) {
        value.persistence = conflict;
        pending.resolve({ kind: "conflict" });
      } else value.persistence = saving;
    } else {
      value.value =
        (record?.value as MutableValue | null) ?? emptyStudyValue(value.key);
      value.persistence = record ? saved : ready;
    }
  }
  async function loadOverview() {
    const generation = epoch;
    const requestId = ++overviewRequest;
    try {
      const result = await request("?scope=overview");
      if (requestId !== overviewRequest || generation !== epoch) return;
      if (!responseOwner(result.data, generation)) return;
      if (!result.response.ok) throw new Error("service");
      const data = readResponseSchema.parse(result.data);
      overview = data.overview ?? emptyOverview;
      overviewError = "";
      for (const record of data.records) {
        const value = entries.get(record.key);
        if (value && !value.flight) install(record, value);
      }
    } catch {
      if (generation === epoch && requestId === overviewRequest)
        overviewError =
          "Account summary unavailable. Keep this tab open and retry.";
    }
    if (generation === epoch) notify();
  }
  async function loadLesson(lessonId: string) {
    seenLessons.add(lessonId);
    if (phase === "guest") return;
    if (!user || !visible) return;
    const existing = lessonLoads.get(lessonId);
    if (existing) return existing;
    const generation = epoch;
    const promise = (async () => {
      try {
        const result = await request(
          `?scope=lesson&lessonId=${encodeURIComponent(lessonId)}`,
        );
        if (!responseOwner(result.data, generation)) return;
        if (!result.response.ok) throw new Error("service");
        const data = readResponseSchema.parse(result.data);
        const rows = new Map(
          data.records.map((record) => [record.key, record]),
        );
        for (const record of data.records) entry(parseRecordKey(record.key));
        loadedLessons.add(lessonId);
        for (const value of entries.values())
          if (
            "lessonId" in value.key &&
            value.key.lessonId === lessonId &&
            !value.flight
          )
            install(rows.get(recordKey(value.key)) ?? null, value);
      } catch {
        if (generation === epoch)
          for (const value of entries.values())
            if ("lessonId" in value.key && value.key.lessonId === lessonId) {
              value.persistence = failed("service");
              value.pending?.resolve({ kind: "unsaved" });
            }
      }
      if (generation === epoch) {
        notify();
        for (const value of entries.values())
          if (
            value.loaded &&
            value.pending &&
            value.persistence.kind !== "conflict"
          )
            void pump(value);
      }
    })();
    lessonLoads.set(lessonId, promise);
    await promise;
  }
  async function loadResume() {
    const value = entry({ kind: "resume" });
    if (value.loaded || !user || !visible) return;
    if (resumeLoad) return resumeLoad;
    const generation = epoch;
    const promise = (async () => {
      try {
        const result = await request("?scope=overview");
        if (!responseOwner(result.data, generation)) return;
        if (!result.response.ok) throw new Error("service");
        const data = readResponseSchema.parse(result.data);
        install(
          data.records.find(({ key }) => key === "resume") ?? null,
          value,
        );
        overview = data.overview ?? overview;
        notify();
        if (value.pending && value.persistence.kind !== "conflict")
          void pump(value);
      } catch {
        if (generation === epoch) {
          value.persistence = failed("service");
          value.pending?.resolve({ kind: "unsaved" });
          notify();
        }
      }
    })();
    resumeLoad = promise;
    await promise;
  }
  async function loadEntry(value: Entry) {
    if ("lessonId" in value.key) await loadLesson(value.key.lessonId);
    else await loadResume();
    if (!value.loaded) value.pending?.resolve({ kind: "unsaved" });
  }
  async function loadHistory(lessonId: string, more = false) {
    const history = histories.get(lessonId) ?? emptyHistory();
    histories.set(lessonId, history);
    if (!user || !visible || history.loading || (more && !history.cursor))
      return;
    const generation = epoch;
    history.loading = true;
    history.error = "";
    notify();
    try {
      const result = await request(
        `?scope=history&lessonId=${encodeURIComponent(lessonId)}${more ? `&cursor=${encodeURIComponent(history.cursor!)}` : ""}`,
      );
      if (!responseOwner(result.data, generation)) return;
      if (!result.response.ok) throw new Error("service");
      const data = readResponseSchema.parse(result.data);
      const records = data.records.map(({ value }) =>
        attemptSchema.parse(value),
      );
      history.records = [
        ...new Map(
          [...(more ? history.records : []), ...records].map((attempt) => [
            attempt.id,
            attempt,
          ]),
        ).values(),
      ];
      history.total = data.total ?? records.length;
      history.cursor = data.cursor ?? null;
    } catch {
      if (generation === epoch)
        history.error = "Attempt history unavailable. Retry when connected.";
    }
    if (generation === epoch) {
      history.loading = false;
      notify();
    }
  }
  async function validate() {
    if (validating) return validating;
    invalidate(false);
    const generation = epoch;
    const promise = (async () => {
      try {
        const result = await request("?scope=identity");
        if (generation !== epoch) return;
        const identity = z
          .object({ user: userSchema.nullable() })
          .parse(result.data).user;
        if (identity?.id !== user?.id) {
          if (user)
            accountNotice =
              "Your account changed. Previous account work was cleared from this tab.";
          invalidate(true);
          user = identity;
        }
        if (!identity) {
          phase = "guest";
          visible = true;
          for (const value of entries.values()) {
            value.loaded = true;
            value.persistence = guest;
          }
          notify();
          return;
        }
        user = identity;
        phase = "account";
        visible = true;
        notify();
        await loadOverview();
        await loadResume();
        await Promise.all(
          [...seenLessons].map(async (lessonId) => {
            await loadLesson(lessonId);
            if (histories.has(lessonId)) await loadHistory(lessonId);
          }),
        );
        for (const value of attempts.values())
          if (
            value.persistence.kind !== "saved" &&
            value.persistence.kind !== "conflict"
          )
            void pumpAttempt(value);
      } catch {
        if (generation === epoch) {
          phase = "unavailable";
          visible = user === null;
          for (const value of entries.values())
            value.persistence = failed("service");
          notify();
        }
      }
    })();
    validating = promise;
    await promise;
    if (validating === promise) validating = undefined;
  }
  async function pump(value: Entry) {
    if (
      entries.get(recordKey(value.key)) !== value ||
      !user ||
      !visible ||
      !value.loaded ||
      value.flight ||
      !value.pending ||
      value.persistence.kind === "conflict"
    )
      return;
    const edit = value.pending;
    value.pending = undefined;
    value.flight = edit;
    value.persistence = saving;
    notify();
    const generation = epoch;
    const owner = user.id;
    try {
      const result = await request("", {
        operation: "write",
        expectedOwner: owner,
        key: value.key,
        value: edit.value,
        mutationId: edit.mutationId,
        baseRevision: value.confirmed?.revision ?? 0,
      });
      if (!responseOwner(result.data, generation)) {
        edit.resolve({ kind: "account-changed" });
        return;
      }
      if (result.response.ok) {
        const data = writeResponseSchema.parse(result.data);
        if (
          data.record.key !== recordKey(value.key) ||
          data.record.mutationId !== edit.mutationId ||
          !same(data.record.value, edit.value)
        )
          throw new Error("Mismatched save acknowledgement");
        value.confirmed = data.record;
        if (edit.seq === value.seq) {
          value.value = data.record.value as MutableValue | null;
          value.persistence = saved;
          edit.resolve({ kind: "saved" });
        } else edit.resolve({ kind: "superseded" });
        void loadOverview();
      } else if (result.response.status === 409) {
        const data = conflictResponseSchema.parse(result.data);
        const current = queueCurrentEdit(value, edit);
        install(data.record, value);
        if (current) {
          value.persistence = conflict;
          edit.resolve({ kind: "conflict" });
        }
      } else {
        if (queueCurrentEdit(value, edit)) {
          value.persistence = failed(
            result.response.status === 422 || result.response.status === 413
              ? "invalid"
              : "service",
          );
          edit.resolve({ kind: "unsaved" });
        }
      }
    } catch {
      if (generation !== epoch) return;
      if (queueCurrentEdit(value, edit)) {
        value.persistence = failed();
        edit.resolve({ kind: "unsaved" });
      }
    }
    if (generation === epoch) {
      value.flight = undefined;
      notify();
      if (
        value.pending &&
        value.persistence.kind !== "conflict" &&
        value.persistence.kind !== "unsaved"
      )
        void pump(value);
    }
  }
  function save(
    key: MutableStudyKey,
    desired: MutableValue | null,
    expectedEpoch = epoch,
  ): Promise<SaveOutcome> {
    if (expectedEpoch !== epoch)
      return Promise.resolve({ kind: "account-changed" });
    const value = entry(key);
    let parsed: MutableValue | null;
    try {
      parsed = parseMutableValue(key, desired);
    } catch {
      value.seq++;
      value.pending?.resolve({ kind: "superseded" });
      value.pending = undefined;
      value.value = desired;
      value.persistence = failed("invalid");
      notify();
      return Promise.resolve({ kind: "unsaved" });
    }
    if (phase === "loading" || !visible)
      return Promise.resolve({ kind: "unsaved" });
    value.value = parsed;
    value.seq++;
    value.pending?.resolve({ kind: "superseded" });
    if (!user) {
      value.persistence = phase === "guest" ? guest : failed("service");
      notify();
      return Promise.resolve({ kind: phase === "guest" ? "guest" : "unsaved" });
    }
    const promise = new Promise<SaveOutcome>((resolve) => {
      value.pending = {
        value: parsed,
        seq: value.seq,
        mutationId: crypto.randomUUID(),
        resolve,
      };
    });
    if (value.persistence.kind !== "conflict")
      value.persistence = value.loaded ? saving : failed("service");
    notify();
    if (value.loaded) void pump(value);
    else void loadEntry(value);
    return promise;
  }
  async function retry(
    key: MutableStudyKey,
    expectedEpoch = epoch,
  ): Promise<SaveOutcome> {
    if (expectedEpoch !== epoch) return { kind: "account-changed" };
    const value = entry(key);
    if (!visible) await validate();
    if (entries.get(recordKey(key)) !== value)
      return { kind: "account-changed" };
    if (!visible || !user) return { kind: user ? "unsaved" : "guest" };
    if (!value.loaded) {
      if ("lessonId" in key) lessonLoads.delete(key.lessonId);
      else resumeLoad = undefined;
      await loadEntry(value);
    }
    const edit = value.pending ?? value.flight;
    if (!value.loaded || !edit)
      return { kind: value.persistence.kind === "saved" ? "saved" : "unsaved" };
    if (value.persistence.kind === "conflict") return { kind: "conflict" };
    const promise = new Promise<SaveOutcome>((resolve) => {
      const previous = edit.resolve;
      edit.resolve = (outcome) => {
        previous(outcome);
        resolve(outcome);
      };
    });
    value.persistence = saving;
    void pump(value);
    return promise;
  }
  function resolve(
    key: MutableStudyKey,
    choice: "keep-mine" | "use-account",
    expectedEpoch = epoch,
  ): Promise<SaveOutcome> {
    if (expectedEpoch !== epoch)
      return Promise.resolve({ kind: "account-changed" });
    const value = entry(key);
    if (choice === "use-account") {
      value.pending?.resolve({ kind: "superseded" });
      value.pending = undefined;
      value.value =
        (value.confirmed?.value as MutableValue | null) ?? emptyStudyValue(key);
      value.persistence = value.confirmed ? saved : ready;
      notify();
      return Promise.resolve({
        kind: value.confirmed ? "saved" : "superseded",
      });
    }
    const mine = value.value;
    value.persistence = saved;
    return save(key, mine);
  }
  async function pumpAttempt(value: AttemptEntry) {
    if (
      attempts.get(value.input.id) !== value ||
      !user ||
      !visible ||
      value.sending
    )
      return;
    value.sending = true;
    value.persistence = saving;
    notify();
    const generation = epoch;
    try {
      const result = await request("", {
        operation: "attempt",
        expectedOwner: user.id,
        attempt: value.input,
      });
      if (!responseOwner(result.data, generation)) {
        value.resolve({ kind: "account-changed" });
        return;
      }
      if (result.response.ok) {
        const data = writeResponseSchema.parse(result.data);
        if (
          data.record.key !== `attempt:${value.input.id}` ||
          data.record.mutationId !== value.input.id ||
          !same(data.record.value, value.value)
        )
          throw new Error("Mismatched attempt acknowledgement");
        value.persistence = saved;
        value.resolve({ kind: "saved" });
        void loadOverview();
        void loadHistory(value.input.lessonId);
      } else {
        value.persistence =
          result.response.status === 409
            ? conflict
            : failed(
                result.response.status === 422 || result.response.status === 413
                  ? "invalid"
                  : "service",
              );
        value.resolve({
          kind: value.persistence.kind === "conflict" ? "conflict" : "unsaved",
        });
      }
    } catch {
      if (generation === epoch) {
        value.persistence = failed();
        value.resolve({ kind: "unsaved" });
      }
    }
    if (generation === epoch) {
      value.sending = false;
      notify();
    }
  }
  function recordAttempt(
    input: AttemptInput,
    expectedEpoch = epoch,
  ): Promise<SaveOutcome> {
    if (expectedEpoch !== epoch)
      return Promise.resolve({ kind: "account-changed" });
    const parsed = attemptInputSchema.parse(input);
    const existing = attempts.get(parsed.id);
    if (existing) {
      if (!same(existing.input, parsed))
        return Promise.resolve({ kind: "conflict" });
      return retryAttempt(parsed.id);
    }
    if (!visible || phase === "loading")
      return Promise.resolve({ kind: "unsaved" });
    const promise = new Promise<SaveOutcome>((resolve) => {
      attempts.set(parsed.id, {
        input: parsed,
        value: checkedAttempt(parsed),
        persistence: user ? saving : guest,
        resolve,
        sending: false,
      });
    });
    const value = attempts.get(parsed.id)!;
    notify();
    if (user) void pumpAttempt(value);
    else value.resolve({ kind: "guest" });
    return promise;
  }
  function retryAttempt(
    id: string,
    expectedEpoch = epoch,
  ): Promise<SaveOutcome> {
    if (expectedEpoch !== epoch)
      return Promise.resolve({ kind: "account-changed" });
    const value = attempts.get(id);
    if (!value) return Promise.resolve({ kind: "account-changed" });
    if (value.persistence.kind === "saved")
      return Promise.resolve({ kind: "saved" });
    if (value.persistence.kind === "conflict")
      return Promise.resolve({ kind: "conflict" });
    if (!user) return Promise.resolve({ kind: "guest" });
    const promise = new Promise<SaveOutcome>((resolve) => {
      const previous = value.resolve;
      value.resolve = (outcome) => {
        previous(outcome);
        resolve(outcome);
      };
    });
    void pumpAttempt(value);
    return promise;
  }
  async function prepareImport() {
    if (!user || !visible) return;
    const owner = user.id,
      generation = epoch;
    const data = await previewLegacy(localStorage);
    if (generation !== epoch || owner !== user?.id) return;
    preview = { ...data, owner };
    importResults = [];
    importError = "";
    notify();
  }
  async function importLegacy(retryFailed = false) {
    if (!preview || !user || !visible || preview.owner !== user.id || importing)
      return;
    const generation = epoch,
      owner = user.id;
    const indices = retryFailed
      ? importResults
          .filter(({ outcome }) => outcome === "failed")
          .map(({ index }) => index)
      : preview.items.map((_, index) => index);
    const selected = indices.map((index) => preview!.items[index]);
    if (!retryFailed)
      importResults = preview.items.map((_, index) => ({
        index,
        outcome: "failed",
        message: "Not attempted",
      }));
    importing = true;
    importError = "";
    notify();
    let offset = 0;
    for (const items of legacyChunks(selected)) {
      if (generation !== epoch || owner !== user?.id) break;
      try {
        const result = await request("", {
          operation: "import",
          expectedOwner: owner,
          items,
        });
        if (!responseOwner(result.data, generation)) return;
        if (!result.response.ok) throw new Error("service");
        const data = z
          .object({
            user: userSchema,
            results: z.array(importResultSchema).max(200),
          })
          .parse(result.data);
        if (
          data.results.length !== items.length ||
          new Set(data.results.map(({ index }) => index)).size !==
            items.length ||
          data.results.some(({ index }) => index >= items.length)
        )
          throw new Error("invalid response");
        for (const value of data.results) {
          const index = indices[offset + value.index];
          importResults[index] = { ...value, index };
        }
      } catch {
        if (generation === epoch)
          importError =
            "Import partially completed. Retry failed items. All source data remains on this device.";
      }
      offset += items.length;
      notify();
    }
    if (generation !== epoch) return;
    importing = false;
    await loadOverview();
    lessonLoads.clear();
    await Promise.all(
      [...seenLessons].map(async (lessonId) => {
        await loadLesson(lessonId);
        if (histories.has(lessonId)) await loadHistory(lessonId);
      }),
    );
    notify();
  }
  return {
    subscribe: (fn: () => void) => {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },
    snapshot: () => version,
    generation: () => epoch,
    account: () => ({
      user: visible ? user : null,
      phase: visible || phase === "unavailable" ? phase : "loading",
      notice: accountNotice,
      overview: visible ? overview : emptyOverview,
      overviewError: visible ? overviewError : "",
      preview: visible ? preview : null,
      importResults: visible ? importResults : [],
      importing,
      importError,
      hasUnsaved:
        [...entries.values()].some(
          (value) =>
            value.pending ||
            value.flight ||
            (value.seq > 0 &&
              value.persistence.kind !== "saved" &&
              value.persistence.kind !== "ready"),
        ) ||
        [...attempts.values()].some(
          ({ persistence }) =>
            persistence.kind === "unsaved" || persistence.kind === "saving",
        ),
    }),
    read: (key: MutableStudyKey) => {
      const value = entry(key);
      return {
        value: visible
          ? (value.value ?? emptyStudyValue(key))
          : emptyStudyValue(key),
        theirs:
          visible && value.persistence.kind === "conflict"
            ? (value.confirmed?.value ?? emptyStudyValue(key))
            : null,
        persistence: visible ? value.persistence : loading,
        generation: epoch,
      };
    },
    save,
    retry,
    resolve,
    recordAttempt,
    retryAttempt,
    loadHistory,
    prepareImport,
    importLegacy,
    validate,
    ensure: (key: MutableStudyKey) => loadEntry(entry(key)),
    history: (lessonId: string) => {
      const history = histories.get(lessonId) ?? emptyHistory();
      return visible
        ? {
            ...history,
            pending: [...attempts.values()]
              .filter(({ input }) => input.lessonId === lessonId)
              .map(({ input, persistence }) => ({ input, persistence })),
            records: [
              ...new Map(
                [
                  ...history.records,
                  ...[...attempts.values()]
                    .filter(({ input }) => input.lessonId === lessonId)
                    .map(({ value }) => value),
                ].map((value) => [value.id, value]),
              ).values(),
            ].sort((a, b) => b.at.localeCompare(a.at)),
          }
        : { ...emptyHistory(), pending: [] };
    },
    inlineSnapshot: (lessonId: string) =>
      inlineExperimentSnapshot(lessonId, (id, parameter) => {
        const value = entry({
          kind: "inline-control",
          lessonId,
          experimentId: id,
          parameter,
        });
        return visible && typeof value.value === "number"
          ? value.value
          : initialInlineExperimentValue(lessonId, id, parameter);
      }),
    setInline: (
      lessonId: string,
      experimentId: string,
      parameter: Parameter,
      value: number,
      expectedEpoch = epoch,
    ) =>
      save(
        mutableKeySchema.parse({
          kind: "inline-control",
          lessonId,
          experimentId,
          parameter,
        }),
        normalizeInlineExperimentValue(
          lessonId,
          experimentId,
          parameter,
          value,
        ),
        expectedEpoch,
      ),
    leave: () => {
      invalidate(true, true);
      validating = undefined;
    },
    start: () => {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("calculus-account");
        channel.onmessage = () => {
          accountNotice =
            "Account changed in another tab. Previous account work was cleared. Focus this tab or check the current account.";
          invalidate(true);
          validating = undefined;
        };
      }
      const revalidate = () => {
        void validate();
      };
      window.addEventListener("focus", revalidate);
      window.addEventListener("pageshow", revalidate);
      const onVisible = () => {
        if (document.visibilityState === "visible") revalidate();
      };
      document.addEventListener("visibilitychange", onVisible);
      void validate();
      return () => {
        invalidate(true);
        validating = undefined;
        window.removeEventListener("focus", revalidate);
        window.removeEventListener("pageshow", revalidate);
        document.removeEventListener("visibilitychange", onVisible);
        channel?.close();
      };
    },
  };
}
