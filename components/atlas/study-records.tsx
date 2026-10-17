"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createStudySession } from "@/lib/study/session";
import {
  recordKey,
  parseRecordKey,
  type MutableStudyKey,
  type StudyValue,
  type Persistence,
  type SaveOutcome,
} from "@/lib/study/model";
export type { Persistence, SaveOutcome } from "@/lib/study/model";

const StudyContext = createContext<ReturnType<
  typeof createStudySession
> | null>(null);
export function StudyRecordsProvider({ children }: { children: ReactNode }) {
  const [session] = useState(createStudySession);
  useEffect(() => session.start(), [session]);
  return (
    <StudyContext.Provider value={session}>{children}</StudyContext.Provider>
  );
}
function useSession() {
  const session = useContext(StudyContext);
  if (!session) throw new Error("StudyRecordsProvider is required");
  const version = useSyncExternalStore(
    session.subscribe,
    session.snapshot,
    () => 0,
  );
  return { session, version };
}
export function useStudyRecord<K extends MutableStudyKey>(key: K) {
  const { session, version } = useSession();
  const id = recordKey(key);
  useEffect(() => {
    void session.ensure(parseRecordKey(id));
  }, [session, id, version]);
  const data = session.read(key);
  return {
    value: data.value as StudyValue<K> | null,
    theirs: data.theirs as StudyValue<K> | null,
    persistence: data.persistence,
    save: (value: StudyValue<K>) => session.save(key, value, data.generation),
    clear: () => session.save(key, null, data.generation),
    retry: () => session.retry(key, data.generation),
    resolve: (choice: "keep-mine" | "use-account") =>
      session.resolve(key, choice, data.generation),
  };
}
export function useStudyAttempts(lessonId: string) {
  const { session, version } = useSession();
  const phase = session.account().phase;
  const generation = session.generation();
  useEffect(() => {
    void session.loadHistory(lessonId);
  }, [session, lessonId, phase, generation]);
  void version;
  return {
    ...session.history(lessonId),
    record: (input: Parameters<typeof session.recordAttempt>[0]) =>
      session.recordAttempt(input, generation),
    retry: (id: string) => session.retryAttempt(id, generation),
    loadMore: () => session.loadHistory(lessonId, true),
    refresh: () => session.loadHistory(lessonId),
  };
}
export function useStudyAccount() {
  const { session, version } = useSession();
  void version;
  const account = session.account();
  return {
    ...account,
    user: account.user
      ? {
          displayName: account.user.displayName,
          email: account.user.email,
          fullName: account.user.fullName,
        }
      : null,
    preview: account.preview
      ? {
          items: account.preview.items,
          rejected: account.preview.rejected,
          sources: account.preview.sources,
        }
      : null,
    refresh: session.validate,
    previewLegacy: session.prepareImport,
    importLegacy: session.importLegacy,
    leave: session.leave,
  };
}
export function useInlineStudy() {
  const { session } = useSession();
  const generation = session.generation();
  return {
    snapshot: session.inlineSnapshot,
    set: (
      lessonId: string,
      experimentId: string,
      parameter: Parameters<typeof session.setInline>[2],
      value: number,
    ) =>
      session.setInline(lessonId, experimentId, parameter, value, generation),
  };
}

export function StudySaveStatus({
  record,
}: {
  record: {
    persistence: Persistence;
    value: unknown;
    theirs: unknown;
    retry: () => Promise<SaveOutcome>;
    resolve: (choice: "keep-mine" | "use-account") => Promise<SaveOutcome>;
  };
}) {
  return (
    <div className="study-save-status">
      <p role="status">{record.persistence.message}</p>
      {record.persistence.kind === "unsaved" && (
        <button type="button" onClick={() => void record.retry()}>
          Retry save
        </button>
      )}
      {record.persistence.kind === "conflict" && (
        <>
          <details>
            <summary>Compare versions</summary>
            <p>Your tab</p>
            <pre>{JSON.stringify(record.value, null, 2)}</pre>
            <p>Your account</p>
            <pre>{JSON.stringify(record.theirs, null, 2)}</pre>
          </details>
          <button
            type="button"
            onClick={() => void record.resolve("keep-mine")}
          >
            Keep my version
          </button>
          <button
            type="button"
            onClick={() => void record.resolve("use-account")}
          >
            Use account version
          </button>
        </>
      )}
    </div>
  );
}
