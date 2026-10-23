import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
const source = argument("--source") ?? "lib/study/session.ts";
const reportPath = argument("--out");
const chosen = argument("--case");
const traceFiles = process.argv.flatMap((value, index) =>
  value === "--tlc-trace" ? [process.argv[index + 1]] : [],
);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
const { createStudySession } = await vite.ssrLoadModule(`/${source}`);
const { recordKey, emptyOverview } = await vite.ssrLoadModule(
  "/lib/study/model.ts",
);
const originalFetch = globalThis.fetch;
const draft = {
  kind: "practice-draft",
  lessonId: "derivative-definition",
  exerciseId: "core",
};
const assessment = { ...draft, kind: "assessment" };
const draftValue = (answer) => ({
  answer,
  hintOpen: false,
  solutionOpen: false,
});
const assessmentValue = (day, status = "Needs practice") => ({
  status,
  date: `2026-01-0${day}T00:00:00.000Z`,
});
const identity = (id) => ({
  id,
  email: `${id}@example.invalid`,
  displayName: id,
  fullName: null,
});
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const response = (data, status = 200) => Response.json(data, { status });
const turn = () => new Promise((done) => setImmediate(done));
function gate() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function until(predicate) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    assert(Date.now() < deadline, "Controlled response did not settle");
    await turn();
  }
}
class PropertyViolation extends Error {
  constructor(property, expected, actual) {
    super(
      `${property}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(actual)}`,
    );
    this.property = property;
    this.expected = expected;
    this.actual = actual;
  }
}
function expect(property, actual, expected) {
  if (!same(actual, expected))
    throw new PropertyViolation(property, expected, actual);
}
function environment() {
  const env = {
    owner: "A",
    rows: new Map(),
    writes: [],
    reads: [],
    intercept: null,
  };
  env.seed = (key, value, revision = 1, owner = env.owner) => {
    const row = {
      key: recordKey(key),
      value,
      revision,
      mutationId: crypto.randomUUID(),
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    env.rows.set(`${owner}:${row.key}`, row);
    return row;
  };
  env.dispatch = (path, command) => {
    const user = identity(env.owner);
    if (command) {
      assert.equal(command.operation, "write");
      env.writes.push(structuredClone(command));
      assert.equal(
        command.expectedOwner,
        env.owner,
        "Fixture only accepts current-owner writes",
      );
      const id = `${env.owner}:${recordKey(command.key)}`;
      const current = env.rows.get(id);
      if (
        current?.mutationId === command.mutationId &&
        same(current.value, command.value)
      )
        return response({ user, record: current });
      if ((current?.revision ?? 0) !== command.baseRevision)
        return response(
          { error: "conflict", user, record: current ?? null },
          409,
        );
      const row = env.seed(
        command.key,
        command.value,
        (current?.revision ?? 0) + 1,
      );
      row.mutationId = command.mutationId;
      return response({ user, record: row });
    }
    const url = new URL(path, "http://formal.test");
    const scope = url.searchParams.get("scope");
    env.reads.push({ scope, owner: env.owner });
    if (scope === "identity") return response({ user });
    const rows = [...env.rows.entries()]
      .filter(([id]) => id.startsWith(`${env.owner}:`))
      .map(([, row]) => row);
    const records =
      scope === "lesson"
        ? rows.filter((row) =>
            row.key.includes(`:${url.searchParams.get("lessonId")}:`),
          )
        : rows.filter((row) =>
            /^(assessment:|confidence:|resume$)/.test(row.key),
          );
    return response({ user, records, overview: { ...emptyOverview } });
  };
  globalThis.fetch = async (path, init = {}) => {
    const command = init.body ? JSON.parse(init.body) : null;
    const dispatch = () => env.dispatch(path, command);
    return env.intercept
      ? env.intercept({ path, command, dispatch })
      : dispatch();
  };
  return env;
}
async function ready(env, key = draft) {
  const session = createStudySession();
  await session.validate();
  await session.ensure(key);
  return session;
}
function observe(trace, action, session, key = assessment, extra = {}) {
  const data = session.read(key);
  trace.push({
    action,
    value: structuredClone(data.value),
    persistence: data.persistence.kind,
    generation: session.generation(),
    owner: session.account().user?.id ?? null,
    overviewChoices: session.account().overview.choices,
    ...extra,
  });
}

async function replayCounterexample(path) {
  const states = JSON.parse(await readFile(path, "utf8")).counterexample.state;
  const env = environment();
  env.seed(assessment, assessmentValue(1));
  const session = await ready(env, assessment);
  const writes = new Map(),
    overviews = [],
    trace = [];
  const keys = { assessment, draft };
  const value = (kind, edit) =>
    kind === "assessment"
      ? assessmentValue(edit + 1)
      : draftValue(edit === 0 ? "" : `edit-${edit}`);
  env.intercept = async ({ path: requestPath, command, dispatch }) => {
    const job = {
      start: gate(),
      captured: gate(),
      release: gate(),
      fail: false,
    };
    if (command)
      writes.set(
        command.key.kind === "assessment" ? "assessment" : "draft",
        job,
      );
    else {
      assert(
        requestPath.includes("scope=overview"),
        "Counterexample added an unhandled read",
      );
      overviews.push(job);
    }
    await job.start.promise;
    if (job.fail)
      throw new TypeError("TLC scheduled failure before server reply");
    const result = dispatch();
    job.captured.resolve();
    await job.release.promise;
    if (job.fail) throw new TypeError("TLC scheduled acknowledgement loss");
    return result;
  };
  const compare = (index, state, action) => {
    const projection = {};
    for (const [kind, key] of Object.entries(keys)) {
      const actual = session.read(key),
        modeled = state.entries[kind];
      assert.deepEqual(
        actual.value,
        value(kind, modeled.local),
        `${action} state ${index} ${kind} local value`,
      );
      assert.equal(
        actual.persistence.kind,
        modeled.persistence,
        `${action} state ${index} ${kind} persistence`,
      );
      const stored = env.rows.get(`A:${recordKey(key)}`);
      assert.equal(
        stored?.revision ?? 0,
        state.database[kind].revision,
        `${action} state ${index} ${kind} server revision`,
      );
      if (stored)
        assert.deepEqual(
          stored.value,
          value(kind, state.database[kind].edit),
          `${action} state ${index} ${kind} server value`,
        );
      projection[kind] = {
        value: actual.value,
        persistence: actual.persistence.kind,
        revision: stored?.revision ?? 0,
      };
    }
    trace.push({ state: index, action, projection });
  };
  compare(states[0][0], states[0][1], "Init");
  for (let offset = 1; offset < states.length; offset++) {
    const [index, state] = states[offset],
      previous = states[offset - 1][1];
    let action;
    for (const kind of Object.keys(keys)) {
      const before = previous.entries[kind],
        after = state.entries[kind];
      if (after.seq > before.seq) {
        action = `Save(${kind})`;
        void session.save(keys[kind], value(kind, after.seq));
        break;
      }
      if (before.stage === "request" && after.stage === "response") {
        action = `ServerReply(${kind})`;
        const job = writes.get(kind);
        assert(job, `${action} has a captured real request`);
        job.start.resolve();
        await job.captured.promise;
        break;
      }
      if (before.flight > 0 && after.flight === 0) {
        action =
          after.persistence === "unsaved"
            ? `WriteFailure(${kind})`
            : before.replyKind === "conflict"
              ? `WriteConflict(${kind})`
              : `WriteSuccess(${kind})`;
        const job = writes.get(kind);
        assert(job, `${action} has a captured real request`);
        if (after.persistence === "unsaved") job.fail = true;
        job.start.resolve();
        job.release.resolve();
        await turn();
        break;
      }
    }
    if (!action && !previous.otherWriter && state.otherWriter) {
      action = "OtherWriter";
      env.seed(
        assessment,
        value("assessment", state.database.assessment.edit),
        state.database.assessment.revision,
      );
    }
    if (!action)
      for (let i = 0; i < state.overviews.length; i++) {
        const before = previous.overviews[i],
          after = state.overviews[i];
        if (before.stage === "request" && after.stage === "response") {
          action = `CaptureOverview(${i + 1})`;
          assert(overviews[i], `${action} has a real overview request`);
          overviews[i].start.resolve();
          await overviews[i].captured.promise;
          break;
        }
        if (before.stage === "response" && after.stage === "done") {
          action = `DeliverOverview(${i + 1})`;
          overviews[i].release.resolve();
          await turn();
          break;
        }
      }
    assert(
      action,
      `Unsupported counterexample transition at state ${index}; extend replay from source boundaries`,
    );
    compare(index, state, action);
  }
  return { path, outcome: "PASS", comparedStates: states.length, trace };
}

const cases = {
  async RecoveryActionable(trace) {
    const env = environment();
    env.seed(assessment, assessmentValue(1));
    const session = await ready(env, assessment);
    observe(trace, "Init: hydrated revision 1", session);
    env.intercept = ({ command, dispatch }) => {
      if (command?.key.kind === "assessment")
        throw new TypeError("Controlled transport failure");
      return dispatch();
    };
    assert.equal(
      (await session.save(assessment, assessmentValue(2))).kind,
      "unsaved",
    );
    observe(trace, "Save(assessment); WriteFailure(assessment)", session);
    expect(
      "RecoveryActionable",
      session.read(assessment).persistence.kind,
      "unsaved",
    );
    env.intercept = null;
    assert.equal(
      (await session.save(draft, draftValue("unrelated draft"))).kind,
      "saved",
    );
    await turn();
    observe(
      trace,
      "Save(draft); ServerReply; WriteSuccess; CaptureOverview; DeliverOverview",
      session,
    );
    expect(
      "RecoveryActionable",
      session.read(assessment).value,
      assessmentValue(2),
    );
    expect(
      "RecoveryActionable",
      session.read(assessment).persistence.kind,
      "unsaved",
    );
  },
  async ConflictActionable(trace) {
    const env = environment();
    env.seed(assessment, assessmentValue(1));
    const session = await ready(env, assessment);
    env.seed(assessment, assessmentValue(3), 2);
    observe(trace, "OtherWriter: account revision 2", session);
    assert.equal(
      (await session.save(assessment, assessmentValue(2))).kind,
      "conflict",
    );
    observe(
      trace,
      "Save(assessment); ServerReply(conflict); WriteConflict",
      session,
    );
    expect(
      "ConflictActionable",
      session.read(assessment).persistence.kind,
      "conflict",
    );
    assert.equal(
      (await session.save(draft, draftValue("unrelated draft"))).kind,
      "saved",
    );
    await turn();
    observe(
      trace,
      "Save(draft); WriteSuccess; CaptureOverview; DeliverOverview",
      session,
    );
    expect(
      "ConflictActionable",
      session.read(assessment).persistence.kind,
      "conflict",
    );
    expect(
      "ConflictActionable",
      session.read(assessment).theirs,
      assessmentValue(3),
    );
  },
  async LatestEditRecoverable(trace) {
    const env = environment();
    const session = await ready(env);
    env.intercept = ({ command, dispatch }) => {
      if (command) throw new TypeError("Controlled transport failure");
      return dispatch();
    };
    assert.equal(
      (await session.save(draft, draftValue("latest local work"))).kind,
      "unsaved",
    );
    observe(trace, "Save(draft); WriteFailure", session, draft);
    env.intercept = null;
    const result = await session.retry(draft);
    observe(trace, "Retry(draft); ServerReply; WriteSuccess", session, draft, {
      outcome: result.kind,
    });
    expect("LatestEditRecoverable", result.kind, "saved");
    expect(
      "LatestEditRecoverable",
      env.rows.get(`A:${recordKey(draft)}`)?.value,
      draftValue("latest local work"),
    );
    expect("LatestEditRecoverable", env.writes.length, 1);
  },
  async OnlyCurrentAcknowledged(trace) {
    const env = environment();
    const session = await ready(env);
    const firstCaptured = gate(),
      firstRelease = gate(),
      secondCaptured = gate(),
      secondRelease = gate();
    let count = 0;
    env.intercept = async ({ command, dispatch }) => {
      if (!command) return dispatch();
      const result = dispatch();
      if (++count === 1) {
        firstCaptured.resolve();
        await firstRelease.promise;
      } else {
        secondCaptured.resolve();
        await secondRelease.promise;
      }
      return result;
    };
    const first = session.save(draft, draftValue("first"));
    await firstCaptured.promise;
    const latest = session.save(draft, draftValue("latest"));
    observe(trace, "Save(first); ServerReply; Save(latest)", session, draft);
    firstRelease.resolve();
    const result = await first;
    await secondCaptured.promise;
    observe(
      trace,
      "WriteSuccess(first); Drain(latest); ServerReply(latest) held",
      session,
      draft,
      { firstOutcome: result.kind },
    );
    try {
      expect("OnlyCurrentAcknowledged", result.kind, "superseded");
      expect(
        "OnlyCurrentAcknowledged",
        session.read(draft).value,
        draftValue("latest"),
      );
      expect(
        "OnlyCurrentAcknowledged",
        session.read(draft).persistence.kind,
        "saving",
      );
    } finally {
      secondRelease.resolve();
      await latest;
    }
  },
  async EpochIsolation(trace) {
    const env = environment();
    env.seed(draft, draftValue("A private work"));
    const session = createStudySession();
    await session.validate();
    const captured = gate(),
      release = gate();
    let held = false;
    env.intercept = async ({ path, dispatch }) => {
      const result = dispatch();
      if (path.includes("scope=lesson") && !held) {
        held = true;
        captured.resolve();
        await release.promise;
      }
      return result;
    };
    const old = session.ensure(draft);
    await captured.promise;
    observe(
      trace,
      "IssueRead(A lesson); CaptureRead; hold response",
      session,
      draft,
    );
    env.owner = "B";
    env.seed(draft, draftValue("B private work"));
    await session.validate();
    await session.ensure(draft);
    const generation = session.generation();
    observe(
      trace,
      "ChangeCookie; BeginValidate; IdentityResponse(B); hydrate B",
      session,
      draft,
    );
    release.resolve();
    await old;
    await turn();
    observe(trace, "DeliverRead(old A lesson)", session, draft);
    expect("EpochIsolation", session.generation(), generation);
    expect(
      "EpochIsolation",
      session.read(draft).value,
      draftValue("B private work"),
    );
    expect("EpochIsolation", session.account().user?.id, "B");
  },
  async LatestOverviewWins(trace) {
    const env = environment();
    const session = await ready(env);
    const captured = gate(),
      release = gate();
    let oldOverview = true;
    env.intercept = async ({ path, dispatch }) => {
      if (path.includes("scope=overview")) {
        const result = await dispatch().json();
        if (oldOverview) {
          oldOverview = false;
          result.overview.choices = 7;
          captured.resolve();
          await release.promise;
        } else result.overview.choices = 9;
        return response(result);
      }
      return dispatch();
    };
    assert.equal(
      (await session.save(draft, draftValue("first"))).kind,
      "saved",
    );
    await captured.promise;
    assert.equal(
      (await session.save(draft, draftValue("second"))).kind,
      "saved",
    );
    await until(() => session.account().overview.choices === 9);
    observe(
      trace,
      "IssueRead(overview1); IssueRead(overview2); DeliverRead(overview2)",
      session,
      draft,
    );
    release.resolve();
    await turn();
    observe(trace, "DeliverRead(overview1)", session, draft);
    expect("LatestOverviewWins", session.account().overview.choices, 9);
  },
  async ResponseOwnerIsolation(trace) {
    const env = environment();
    const session = await ready(env);
    const otherAssessment = {
      ...assessment,
      lessonId: "epsilon-delta-one-variable",
    };
    env.owner = "B";
    env.seed(otherAssessment, assessmentValue(3));
    observe(trace, "ChangeCookie(B), client still A", session, otherAssessment);
    const observations = [];
    const unsubscribe = session.subscribe(() => {
      const data = session.read(otherAssessment);
      observations.push({
        owner: session.account().user?.id ?? null,
        value: data.value,
      });
    });
    try {
      await session.ensure(otherAssessment);
      await turn();
      observe(
        trace,
        "IssueRead(lesson, server B); CaptureRead; DeliverRead",
        session,
        otherAssessment,
      );
      const foreign = observations.filter(
        (state) => state.owner === "A" && same(state.value, assessmentValue(3)),
      );
      expect("ResponseOwnerIsolation", foreign, []);
      expect("ResponseOwnerIsolation", session.account().user?.id, "B");
    } finally {
      unsubscribe();
    }
  },
};

const results = [];
try {
  if (chosen && !Object.hasOwn(cases, chosen))
    throw new Error(`Unknown property ${chosen}`);
  for (const [property, run] of Object.entries(cases)) {
    if (chosen && chosen !== property) continue;
    const trace = [];
    try {
      await run(trace);
      results.push({ property, outcome: "PASS", trace });
    } catch (error) {
      if (!(error instanceof PropertyViolation)) throw error;
      results.push({
        property,
        outcome: "BUG",
        expected: error.expected,
        actual: error.actual,
        trace,
      });
    }
  }
  const counterexamples = [];
  for (const path of traceFiles)
    counterexamples.push(await replayCounterexample(path));
  const report = {
    source,
    sourceBytes: (await readFile(resolve(root, source))).length,
    results,
    counterexamples,
  };
  if (reportPath) {
    await mkdir(dirname(resolve(reportPath)), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  for (const result of results)
    console.log(`${result.outcome} actual-code ${result.property}`);
  for (const replay of counterexamples)
    console.log(
      `PASS actual-code TLC counterexample replay (${replay.comparedStates} states)`,
    );
  process.exitCode = results.some((result) => result.outcome === "BUG") ? 1 : 0;
} finally {
  globalThis.fetch = originalFetch;
  await vite.close();
}
