import test, { after } from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createStudyWorker } from "./helpers/study-worker.mjs";
const worker = await createStudyWorker();
const missingDb = await createStudyWorker({ database: false });
after(async () => {
  await Promise.all([worker.dispose(), missingDb.dispose()]);
});
const key = {
  kind: "practice-draft",
  lessonId: "derivative-definition",
  exerciseId: "core",
};
const value = (answer) => ({ answer, hintOpen: false, solutionOpen: false });
const write = (
  owner,
  answer,
  baseRevision = 0,
  mutationId = crypto.randomUUID(),
  record = key,
) => ({
  operation: "write",
  expectedOwner: owner,
  key: record,
  value: answer === null ? null : value(answer),
  baseRevision,
  mutationId,
});
async function call(owner, body, query = "", instance = worker, extras = {}) {
  const response = await instance.dispatchFetch(
    `http://account.test/api/study${query}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        ...(owner ? { "oai-authenticated-user-id": owner } : {}),
        ...(body
          ? {
              "Content-Type": "application/json",
              Origin: "http://account.test",
            }
          : {}),
        ...extras,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: JSON.parse(text),
  };
}

test("native stable ID is required, display headers do not authorize, and account responses are private", async () => {
  assert.equal((await call(null)).status, 401);
  assert.equal(
    (
      await call(null, undefined, "?scope=identity", worker, {
        "oai-authenticated-user-email": "display@example.test",
      })
    ).status,
    401,
  );
  const signed = await call(
    "identity-a",
    undefined,
    "?scope=identity",
    worker,
    {
      "oai-authenticated-user-email": "display@example.test",
      "oai-authenticated-user-full-name": "A%20Visitor",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
  );
  assert.equal(signed.body.user.id, "identity-a");
  assert.equal(signed.body.user.displayName, "A Visitor");
  assert.match(signed.headers.get("cache-control"), /private, no-store/);
  assert.equal(
    (await call(null, write("identity-a", "anonymous"))).status,
    401,
  );
});

test("every account operation isolates owners and rejects stale A writes after cookies switch to B", async () => {
  const a = await call(
    "isolation-a",
    write("isolation-a", "A private reasoning"),
  );
  assert.equal(a.status, 200);
  const b = await call(
    "isolation-b",
    undefined,
    "?scope=lesson&lessonId=derivative-definition&owner=isolation-a",
  );
  assert.deepEqual(b.body.records, []);
  const stale = await call(
    "isolation-b",
    write("isolation-a", "A stale tab", 1),
  );
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error, "account-changed");
  assert.deepEqual(
    (
      await call(
        "isolation-b",
        undefined,
        "?scope=lesson&lessonId=derivative-definition",
      )
    ).body.records,
    [],
  );
  assert.equal(
    (
      await call(
        "isolation-a",
        undefined,
        "?scope=lesson&lessonId=derivative-definition",
      )
    ).body.records[0].value.answer,
    "A private reasoning",
  );
  assert.equal(
    (
      await call("isolation-b", {
        ...write("isolation-b", "spoof"),
        ownerId: "isolation-a",
      })
    ).status,
    422,
  );
});

test("long lesson IDs retain readable drafts after account writes", async () => {
  const owner = "long-lesson-a";
  assert.equal((await call(owner, write(owner, "another lesson"))).status, 200);
  for (const lessonId of [
    "directional-derivatives-and-gradient",
    "tangents-velocity-and-singularities",
  ]) {
    const query = `?scope=lesson&lessonId=${lessonId}`;
    const empty = await call(owner, undefined, query);
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.records, []);
    const saved = await call(
      owner,
      write(owner, `${lessonId} reasoning`, 0, crypto.randomUUID(), {
        ...key,
        lessonId,
      }),
    );
    assert.equal(saved.status, 200);
    const restored = await call(owner, undefined, query);
    assert.equal(restored.status, 200);
    assert.deepEqual(restored.body.records, [saved.body.record]);
  }
});

test("mutable revision CAS is atomic, retries compare payloads, and tombstones prevent stale recreation", async () => {
  const owner = "cas-a";
  const original = write(owner, "first");
  const first = await call(owner, original);
  assert.equal(first.body.record.revision, 1);
  const replay = await call(owner, original);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.record.revision, 1);
  assert.equal(
    (await call(owner, { ...original, value: value("different payload") }))
      .status,
    409,
  );
  const results = await Promise.all([
    call(owner, write(owner, "left", 1)),
    call(owner, write(owner, "right", 1)),
  ]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [200, 409]);
  const winner = results.find(({ status }) => status === 200).body.record;
  const conflict = results.find(({ status }) => status === 409).body.record;
  assert.equal(winner.revision, 2);
  assert.equal(conflict.value.answer, winner.value.answer);
  assert.equal((await call(owner, original)).status, 409);
  const cleared = await call(owner, write(owner, null, 2));
  assert.equal(cleared.body.record.revision, 3);
  assert.equal(cleared.body.record.value, null);
  const stale = await call(owner, write(owner, "resurrected", 2));
  assert.equal(stale.status, 409);
  assert.equal(stale.body.record.value, null);
  assert.equal(
    (await call(owner, write(owner, "explicit new draft", 3))).status,
    200,
  );
});

test("independent records do not contend and known domain membership is enforced before SQL", async () => {
  const owner = "independent-a";
  const second = { ...key, lessonId: "epsilon-delta-one-variable" };
  const responses = await Promise.all([
    call(owner, write(owner, "one")),
    call(owner, write(owner, "two", 0, crypto.randomUUID(), second)),
  ]);
  assert.ok(responses.every(({ status }) => status === 200));
  assert.equal(
    (
      await call(
        owner,
        write(owner, "unknown", 0, crypto.randomUUID(), {
          ...key,
          exerciseId: "made-up",
        }),
      )
    ).status,
    422,
  );
  assert.equal(
    (await call(owner, write(owner, "x".repeat(16385)))).status,
    422,
  );
  assert.equal(
    (await call(owner, write(owner, "x".repeat(70000)))).status,
    413,
  );
  assert.equal(
    (await call(owner, write(owner, "x".repeat(270000)))).status,
    413,
  );
  const crossOrigin = await call(
    owner,
    write(owner, "cross origin"),
    "",
    worker,
    { Origin: "https://attacker.test" },
  );
  assert.ok([403, 422].includes(crossOrigin.status));
  assert.equal(
    (
      await call(owner, write(owner, "wrong type"), "", worker, {
        "Content-Type": "text/plain",
      })
    ).status,
    422,
  );
});

const attempt = (
  id = crypto.randomUUID(),
  choice = "correct",
  at = "2026-01-01T00:00:00.000Z",
) => ({
  id,
  lessonId: "epsilon-delta-one-variable",
  taskId: "quantifiers",
  choice,
  support: "none",
  at,
});
test("immutable attempts preserve independent inserts, payload idempotency, and captured time", async () => {
  const owner = "attempt-a";
  const input = attempt();
  const first = await call(owner, {
    operation: "attempt",
    expectedOwner: owner,
    attempt: input,
  });
  assert.equal(first.status, 200);
  assert.equal(first.body.record.value.correct, true);
  assert.equal(first.body.record.value.kind, "recognition");
  assert.equal(first.body.record.value.at, input.at);
  assert.ok(Date.parse(first.body.record.updatedAt) > Date.parse(input.at));
  const repeat = await call(owner, {
    operation: "attempt",
    expectedOwner: owner,
    attempt: input,
  });
  assert.deepEqual(repeat.body.record, first.body.record);
  assert.equal(
    (
      await call(owner, {
        operation: "attempt",
        expectedOwner: owner,
        attempt: { ...input, choice: "reversed" },
      })
    ).status,
    409,
  );
  const choices = await Promise.all([
    call(owner, {
      operation: "attempt",
      expectedOwner: owner,
      attempt: attempt(),
    }),
    call(owner, {
      operation: "attempt",
      expectedOwner: owner,
      attempt: attempt(),
    }),
  ]);
  assert.ok(choices.every(({ status }) => status === 200));
  const page = await call(
    owner,
    undefined,
    "?scope=history&lessonId=epsilon-delta-one-variable&limit=2",
  );
  assert.equal(page.body.records.length, 2);
  assert.equal(page.body.total, 3);
  assert.ok(page.body.cursor);
  const next = await call(
    owner,
    undefined,
    `?scope=history&lessonId=epsilon-delta-one-variable&limit=2&cursor=${encodeURIComponent(page.body.cursor)}`,
  );
  assert.equal(next.body.records.length, 1);
  assert.equal(next.body.cursor, null);
  assert.equal(
    new Set([...page.body.records, ...next.body.records].map(({ key }) => key))
      .size,
    3,
  );
  assert.equal((await call(owner)).body.overview.choices, 3);
  assert.equal(
    (
      await call(
        owner,
        undefined,
        "?scope=history&lessonId=epsilon-delta-one-variable&limit=101",
      )
    ).status,
    422,
  );
  assert.equal((await call("attempt-b")).body.overview.choices, 0);
});

test("legacy imports fill missing mutable records, preserve tombstones, deduplicate attempts, and report partial outcomes", async () => {
  const owner = "import-a";
  await call(owner, write(owner, "keep account"));
  const legacyAttempt = {
    id: crypto.randomUUID(),
    lessonId: "epsilon-delta-one-variable",
    taskId: "quantifiers",
    kind: "recognition",
    correct: false,
    support: "hint",
    at: "2025-01-01T00:00:00.000Z",
    source: "legacy",
  };
  const command = {
    operation: "import",
    expectedOwner: owner,
    items: [
      { kind: "mutable", key, value: value("old device") },
      {
        kind: "mutable",
        key: { kind: "resume" },
        value: { lessonId: "derivative-definition" },
      },
      { kind: "attempt", value: legacyAttempt },
      {
        kind: "mutable",
        key: { ...key, lessonId: "unknown" },
        value: value("bad"),
      },
    ],
  };
  const first = await call(owner, command);
  assert.deepEqual(
    first.body.results.map(({ outcome }) => outcome),
    ["retained-existing", "imported", "imported", "rejected"],
  );
  const repeated = await call(owner, command);
  assert.deepEqual(
    repeated.body.results.map(({ outcome }) => outcome),
    ["retained-existing", "retained-existing", "retained-existing", "rejected"],
  );
  assert.equal((await call(owner)).body.overview.choices, 1);
  assert.equal(
    (
      await call(owner, {
        ...command,
        items: [
          { kind: "attempt", value: { ...legacyAttempt, correct: true } },
        ],
      })
    ).body.results[0].outcome,
    "rejected",
  );
  const removed = await call(owner, write(owner, null, 1));
  assert.equal(removed.status, 200);
  assert.equal(
    (await call(owner, command)).body.results[0].outcome,
    "retained-existing",
  );
  assert.equal(
    (
      await call(owner, {
        ...command,
        items: Array(201).fill(command.items[0]),
      })
    ).status,
    422,
  );
});

test("missing DB fails visibly while native identity remains available", async () => {
  assert.equal(
    (await call("missing-a", undefined, "?scope=identity", missingDb)).status,
    200,
  );
  const read = await call("missing-a", undefined, "", missingDb);
  assert.equal(read.status, 503);
  assert.equal(read.body.user.id, "missing-a");
  assert.match(read.headers.get("cache-control"), /no-store/);
  assert.equal(
    (await call("missing-a", write("missing-a", "unsaved"), "", missingDb))
      .status,
    503,
  );
});

test("account overview keeps assessments and latest choice evidence independent", async () => {
  const owner = "summary-contract";
  const now = Date.now();
  for (const [lessonId, status] of [
    ["derivative-definition", "Can explain independently"],
    ["partial-fractions", "Needs practice"],
  ]) {
    const result = await call(owner, {
      ...write(owner, ""),
      key: { kind: "assessment", lessonId, exerciseId: "core" },
      value: { status, date: new Date(now).toISOString() },
    });
    assert.equal(result.status, 200);
  }
  const record = async (choice, support, offset, account = owner) => {
    const result = await call(account, {
      operation: "attempt",
      expectedOwner: account,
      attempt: {
        ...attempt(
          crypto.randomUUID(),
          choice,
          new Date(now + offset).toISOString(),
        ),
        support,
      },
    });
    assert.equal(result.status, 200);
    return (await call(account)).body.overview;
  };
  const wrong = await record("reversed", "none", -10000);
  assert.ok(wrong.practice.includes("epsilon-delta-one-variable"));
  const corrected = await record("correct", "none", -9000);
  assert.deepEqual(
    {
      explainable: corrected.explainable,
      needsPractice: corrected.needsPractice,
      choices: corrected.choices,
    },
    { explainable: 1, needsPractice: 1, choices: 2 },
  );
  assert.deepEqual(corrected.practice, ["partial-fractions"]);
  assert.ok(
    (await record("correct", "hint", -8000)).practice.includes(
      "epsilon-delta-one-variable",
    ),
  );
  assert.ok(
    (
      await record("correct", "none", -4 * 86400000, "summary-due")
    ).practice.includes("epsilon-delta-one-variable"),
  );
});

test("the migrated Worker fixture loads from a project path with spaces and Unicode", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "calculus project é-"));
  let fixture;
  try {
    const project = fileURLToPath(new URL("../", import.meta.url));
    const helper = path.join(directory, "tests/helpers/study-worker.mjs");
    await mkdir(path.dirname(helper), { recursive: true });
    for (const name of ["dist", "drizzle", "node_modules"])
      await symlink(
        path.join(project, name),
        path.join(directory, name),
        "dir",
      );
    await copyFile(
      new URL("./helpers/study-worker.mjs", import.meta.url),
      helper,
    );
    const { createStudyWorker: createFixture } = await import(
      pathToFileURL(helper).href
    );
    fixture = await createFixture();
    const response = await fixture.dispatchFetch(
      "http://encoded.test/api/study?scope=overview",
      {
        headers: { "oai-authenticated-user-id": "encoded-path" },
      },
    );
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).records, []);
  } finally {
    await fixture?.dispose();
    await rm(directory, { recursive: true, force: true });
  }
});
