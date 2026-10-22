import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createStudyWorker } from "./helpers/study-worker.mjs";
import { createServer } from "vite";
const root = fileURLToPath(new URL("..", import.meta.url));
const worker = await createStudyWorker();
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
const { createStudySession } = await vite.ssrLoadModule(
  "/lib/study/session.ts",
);
const { previewLegacy } = await vite.ssrLoadModule("/lib/study/legacy.ts");
const originalFetch = globalThis.fetch;
after(async () => {
  globalThis.fetch = originalFetch;
  await Promise.all([worker.dispose(), vite.close()]);
});
let owner = "session-a";
let intercept;
beforeEach(() => {
  intercept = undefined;
  owner = crypto.randomUUID();
  globalThis.fetch = async (path, init = {}) => {
    const command = init.body ? JSON.parse(init.body) : null;
    const dispatch = (target = worker) =>
      target.dispatchFetch(new URL(path, "http://session.test").href, {
        ...init,
        headers: {
          ...init.headers,
          ...(owner ? { "oai-authenticated-user-id": owner } : {}),
          ...(command ? { Origin: "http://session.test" } : {}),
        },
      });
    return intercept
      ? intercept({ path, init, command, dispatch })
      : dispatch();
  };
});
const key = {
  kind: "practice-draft",
  lessonId: "derivative-definition",
  exerciseId: "core",
};
const value = (answer) => ({ answer, hintOpen: false, solutionOpen: false });
const pause = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
async function until(predicate) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) assert.fail("State did not settle");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
async function ready() {
  const session = createStudySession();
  await session.validate();
  await session.ensure(key);
  return session;
}

test("coalesced drafts keep newer text unsaved until its own D1 acknowledgement", async () => {
  const session = await ready();
  const gate = pause(),
    captured = pause();
  let writes = 0;
  intercept = async ({ command, dispatch }) => {
    if (command?.operation === "write" && ++writes === 1) {
      const response = await dispatch();
      captured.resolve();
      await gate.promise;
      return response;
    }
    return dispatch();
  };
  const first = session.save(key, value("first"));
  await captured.promise;
  const middle = session.save(key, value("middle"));
  const last = session.save(key, value("newest"));
  assert.equal((await middle).kind, "superseded");
  assert.equal(session.read(key).value.answer, "newest");
  assert.equal(session.read(key).persistence.kind, "saving");
  gate.resolve();
  assert.equal((await first).kind, "superseded");
  assert.equal((await last).kind, "saved");
  assert.equal(writes, 2);
  const restored = await ready();
  assert.equal(restored.read(key).value.answer, "newest");
});

test("network failure keeps tab text and retries without promising a save", async () => {
  const session = await ready();
  intercept = ({ command, dispatch }) => {
    if (command) throw new TypeError("injected offline");
    return dispatch();
  };
  assert.equal(
    (await session.save(key, value("offline work"))).kind,
    "unsaved",
  );
  assert.equal(session.read(key).value.answer, "offline work");
  assert.equal(session.read(key).persistence.kind, "unsaved");
  intercept = undefined;
  assert.equal((await session.retry(key)).kind, "saved");
  assert.equal((await ready()).read(key).value.answer, "offline work");
});

test("same-record conflict preserves both versions and explicit resolution is conditional", async () => {
  const a = await ready(),
    b = await ready();
  await a.save(key, value("account edit"));
  assert.equal((await b.save(key, value("my tab edit"))).kind, "conflict");
  assert.equal(b.read(key).value.answer, "my tab edit");
  assert.equal(b.read(key).theirs.answer, "account edit");
  assert.equal((await b.retry(key)).kind, "conflict");
  assert.equal((await b.resolve(key, "keep-mine")).kind, "saved");
  assert.equal((await ready()).read(key).value.answer, "my tab edit");
});

test("late A responses cannot populate B and a stale A write is rejected before mutation", async () => {
  const session = await ready();
  const originalOwner = owner;
  const gate = pause(),
    captured = pause();
  intercept = async ({ command, dispatch }) => {
    if (command?.operation === "write") {
      const response = await dispatch();
      captured.resolve();
      await gate.promise;
      return response;
    }
    return dispatch();
  };
  const pending = session.save(key, value("private A work"));
  await captured.promise;
  owner = crypto.randomUUID();
  await session.validate();
  await session.ensure(key);
  assert.equal(session.read(key).value.answer, "");
  gate.resolve();
  assert.equal((await pending).kind, "account-changed");
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(session.account().user.id, owner);
  assert.equal(session.read(key).value.answer, "");
  const stale = await worker.dispatchFetch("http://session.test/api/study", {
    method: "POST",
    headers: {
      "oai-authenticated-user-id": owner,
      Origin: "http://session.test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operation: "write",
      expectedOwner: originalOwner,
      key,
      value: value("leak"),
      baseRevision: 0,
      mutationId: crypto.randomUUID(),
    }),
  });
  assert.equal(stale.status, 409);
});

test("failed identity revalidation hides private values until identity is verified again", async () => {
  const session = await ready();
  await session.save(key, value("private reasoning"));
  intercept = () => {
    throw new TypeError("injected connection failure");
  };
  await session.validate();
  assert.equal(session.account().phase, "unavailable");
  assert.equal(session.account().user, null);
  assert.equal(session.read(key).value.answer, "");
  assert.equal(session.read(key).persistence.kind, "loading");
  intercept = undefined;
  await session.validate();
  assert.equal(session.read(key).value.answer, "private reasoning");
});

test("guest work stays tab-only and never becomes account data automatically", async () => {
  owner = null;
  const session = await ready();
  assert.equal(
    (await session.save(key, value("guest reasoning"))).kind,
    "guest",
  );
  assert.equal(session.read(key).value.answer, "guest reasoning");
  owner = crypto.randomUUID();
  await session.validate();
  await session.ensure(key);
  assert.equal(session.read(key).value.answer, "");
  assert.equal((await ready()).read(key).value.answer, "");
});

test("legacy re-import after an appended attempt adds only that attempt", async () => {
  const first = {
    taskId: "quantifiers",
    kind: "recognition",
    correct: true,
    support: "none",
    at: "2026-01-01T00:00:00Z",
  };
  let attempts = [first, first];
  const preview = () =>
    previewLegacy({
      getItem: (key) =>
        key === "calculus-pilot-progress-v2"
          ? JSON.stringify({ "epsilon-delta-one-variable": { attempts } })
          : null,
    });
  const imported = async (data) => {
    const response = await fetch("/api/study", {
      method: "POST",
      body: JSON.stringify({
        operation: "import",
        expectedOwner: owner,
        items: data.items,
      }),
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.deepEqual(
    (await imported(await preview())).results.map(({ outcome }) => outcome),
    ["imported", "imported"],
  );
  assert.deepEqual(
    (await imported(await preview())).results.map(({ outcome }) => outcome),
    ["retained-existing", "retained-existing"],
  );
  attempts = [...attempts, { ...first, at: "2026-01-02T00:00:00Z" }];
  assert.deepEqual(
    (await imported(await preview())).results.map(({ outcome }) => outcome),
    ["retained-existing", "retained-existing", "imported"],
  );
});

test("a draft whose initial read fails stays usable and retry returns an honest outcome", async () => {
  const session = createStudySession();
  await session.validate();
  intercept = ({ path, dispatch }) => {
    if (String(path).includes("scope=lesson"))
      throw new TypeError("injected initial read failure");
    return dispatch();
  };
  await session.ensure(key);
  assert.equal(session.read(key).persistence.kind, "unsaved");
  const outcome = session.save(key, value("work after failed read"));
  assert.equal((await outcome).kind, "unsaved");
  assert.equal((await session.retry(key)).kind, "unsaved");
  assert.equal(session.read(key).value.answer, "work after failed read");
  intercept = undefined;
  assert.equal((await session.retry(key)).kind, "saved");
});

test("failed resume reads stay bounded until an explicit retry or revalidation", async () => {
  const unavailable = await createStudyWorker({ database: false });
  const resume = { kind: "resume" };
  let available = false,
    overviewReads = 0;
  intercept = ({ path, dispatch }) => {
    if (String(path).includes("scope=overview")) overviewReads++;
    return dispatch(available ? worker : unavailable);
  };
  try {
    const session = createStudySession();
    await session.validate();
    assert.equal(overviewReads, 2);
    assert.equal(session.read(resume).persistence.kind, "unsaved");
    for (let render = 0; render < 20; render++) await session.ensure(resume);
    assert.equal(overviewReads, 2);
    assert.equal((await session.retry(resume)).kind, "unsaved");
    assert.equal(overviewReads, 3);
    available = true;
    assert.equal((await session.retry(resume)).kind, "unsaved");
    assert.equal(overviewReads, 4);
    assert.equal(session.read(resume).persistence.kind, "ready");
    assert.equal(
      (await session.save(resume, { lessonId: "derivative-definition" })).kind,
      "saved",
    );
    assert.equal(session.read(resume).value.lessonId, "derivative-definition");
    available = false;
    await session.validate();
    const failedReads = overviewReads;
    for (let render = 0; render < 20; render++) await session.ensure(resume);
    assert.equal(overviewReads, failedReads);
    available = true;
    await session.validate();
    assert.equal(session.read(resume).value.lessonId, "derivative-definition");
    assert.equal(session.read(resume).persistence.kind, "saved");
  } finally {
    await unavailable.dispose();
  }
});

test("a cached failed lesson read keeps edits unsaved and recovers the actual account version", async () => {
  await (await ready()).save(key, value("existing account reasoning"));
  const unavailable = await createStudyWorker({ database: false });
  let available = false,
    lessonReads = 0,
    writes = 0;
  intercept = ({ path, command, dispatch }) => {
    if (String(path).includes("scope=lesson")) lessonReads++;
    if (command?.operation === "write") writes++;
    return dispatch(available ? worker : unavailable);
  };
  try {
    const session = await ready();
    assert.equal(session.read(key).persistence.kind, "unsaved");
    for (let edit = 0; edit < 5; edit++) {
      assert.equal(
        (await session.save(key, value(`unsaved reasoning ${edit}`))).kind,
        "unsaved",
      );
      await session.ensure(key);
    }
    assert.equal(lessonReads, 1);
    assert.equal(writes, 0);
    assert.equal(session.read(key).value.answer, "unsaved reasoning 4");
    assert.equal(session.read(key).persistence.kind, "unsaved");
    assert.equal(session.account().hasUnsaved, true);
    available = true;
    assert.equal((await session.retry(key)).kind, "conflict");
    assert.equal(lessonReads, 2);
    assert.equal(writes, 0);
    assert.equal(session.read(key).value.answer, "unsaved reasoning 4");
    assert.equal(session.read(key).theirs.answer, "existing account reasoning");
    assert.equal((await session.resolve(key, "keep-mine")).kind, "saved");
    assert.equal(writes, 1);
    assert.equal((await ready()).read(key).value.answer, "unsaved reasoning 4");
  } finally {
    await unavailable.dispose();
  }
});

test("a lost attempt acknowledgement retries the same captured event exactly once", async () => {
  const session = await ready();
  let lost = false;
  intercept = async ({ command, dispatch }) => {
    const response = await dispatch();
    if (command?.operation === "attempt" && !lost) {
      lost = true;
      throw new TypeError("injected lost acknowledgement");
    }
    return response;
  };
  const input = {
    id: crypto.randomUUID(),
    lessonId: "epsilon-delta-one-variable",
    taskId: "quantifiers",
    choice: "correct",
    support: "none",
    at: "2026-01-01T00:00:00.000Z",
  };
  assert.equal((await session.recordAttempt(input)).kind, "unsaved");
  assert.equal((await session.retryAttempt(input.id)).kind, "saved");
  await until(() => session.account().overview.choices === 1);
  assert.equal(session.history(input.lessonId).records[0].at, input.at);
});

test("a delayed read cannot replace a newer acknowledged draft", async () => {
  const session = await ready();
  await session.save(key, value("older"));
  const gate = pause(),
    captured = pause();
  let held = false;
  intercept = async ({ path, dispatch }) => {
    const response = await dispatch();
    if (String(path).includes("scope=lesson") && !held) {
      held = true;
      captured.resolve();
      await gate.promise;
    }
    return response;
  };
  const revalidation = session.validate();
  await captured.promise;
  assert.equal(
    (await session.save(key, value("newer acknowledged"))).kind,
    "saved",
  );
  gate.resolve();
  await revalidation;
  assert.equal(session.read(key).value.answer, "newer acknowledged");
  assert.equal(session.read(key).persistence.kind, "saved");
});

test("a denied storage getter resolves import preview with a readable rejection", async () => {
  const session = await ready();
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new DOMException("Denied", "SecurityError");
    },
  });
  try {
    await session.prepareImport();
    assert.deepEqual(session.account().preview.items, []);
    assert.deepEqual(session.account().preview.rejected, [
      "Device storage is unavailable. Source data was not changed.",
    ]);
    assert.equal(session.account().preview.sources, 0);
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
});

test("partial import retains outcomes and retries only failed items", async () => {
  const session = await ready();
  const savedStorage = globalThis.localStorage;
  const attempt = {
    taskId: "quantifiers",
    kind: "recognition",
    correct: true,
    support: "none",
    at: "2026-01-01T00:00:00Z",
  };
  const raw = JSON.stringify({
    "epsilon-delta-one-variable": { attempts: Array(201).fill(attempt) },
  });
  globalThis.localStorage = {
    getItem: (key) => (key === "calculus-pilot-progress-v2" ? raw : null),
    setItem() {
      throw new Error("Source must remain read-only");
    },
  };
  try {
    await session.prepareImport();
    let chunks = 0;
    const chunkSizes = [];
    intercept = ({ command, dispatch }) => {
      if (command?.operation === "import") {
        chunkSizes.push(command.items.length);
        if (++chunks === 2)
          throw new TypeError("injected second-chunk failure");
      }
      return dispatch();
    };
    await session.importLegacy();
    assert.equal(
      session
        .account()
        .importResults.filter(({ outcome }) => outcome === "imported").length,
      200,
    );
    assert.equal(
      session
        .account()
        .importResults.filter(({ outcome }) => outcome === "failed").length,
      1,
    );
    await session.importLegacy(true);
    assert.deepEqual(chunkSizes, [200, 1, 1]);
    assert.equal(
      session
        .account()
        .importResults.filter(({ outcome }) => outcome === "failed").length,
      0,
    );
    assert.equal(session.account().overview.choices, 201);
  } finally {
    globalThis.localStorage = savedStorage;
  }
});

test("callbacks captured before an account change cannot write under the new account", async () => {
  const session = await ready();
  const generation = session.read(key).generation;
  owner = crypto.randomUUID();
  await session.validate();
  await session.ensure(key);
  assert.equal(
    (await session.save(key, value("old callback text"), generation)).kind,
    "account-changed",
  );
  assert.equal((await session.retry(key, generation)).kind, "account-changed");
  assert.equal(
    (await session.resolve(key, "keep-mine", generation)).kind,
    "account-changed",
  );
  assert.equal((await ready()).read(key).value.answer, "");
});

test("invalid newer text survives older acknowledgements and same-owner revalidation", async () => {
  const session = await ready();
  const gate = pause(),
    captured = pause();
  intercept = async ({ command, dispatch }) => {
    const response = await dispatch();
    if (command?.operation === "write") {
      captured.resolve();
      await gate.promise;
    }
    return response;
  };
  const older = session.save(key, value("older valid text"));
  await captured.promise;
  const tooLong = "x".repeat(16385);
  assert.equal((await session.save(key, value(tooLong))).kind, "unsaved");
  gate.resolve();
  assert.equal((await older).kind, "superseded");
  assert.equal(session.read(key).value.answer, tooLong);
  assert.equal(session.read(key).persistence.kind, "unsaved");
  intercept = undefined;
  await session.validate();
  assert.equal(session.read(key).value.answer, tooLong);
  assert.equal(session.read(key).persistence.kind, "unsaved");
  assert.equal(
    (await session.save(key, value("shorter valid text"))).kind,
    "saved",
  );
});

test("a lost draft acknowledgement cannot reinstall an obsolete edit over invalid local text", async () => {
  const session = await ready();
  const gate = pause(),
    captured = pause();
  let writes = 0;
  intercept = async ({ command, dispatch }) => {
    const response = await dispatch();
    if (command?.operation === "write" && ++writes === 1) {
      assert.equal(response.status, 200);
      captured.resolve();
      await gate.promise;
      throw new TypeError("injected lost acknowledgement after D1 commit");
    }
    return response;
  };
  const older = session.save(key, value("older valid reasoning"));
  await captured.promise;
  const tooLong = "x".repeat(16385);
  assert.equal((await session.save(key, value(tooLong))).kind, "unsaved");
  gate.resolve();
  const outcome = await older;
  const before = session.read(key);
  await session.validate();
  assert.equal(session.read(key).value.answer.length, 16385);
  assert.equal(session.read(key).value.answer, tooLong);
  assert.notEqual(session.read(key).persistence.kind, "saved");
  assert.equal(session.account().hasUnsaved, true);
  assert.equal(before.persistence.kind, "unsaved");
  assert.equal(before.persistence.reason, "invalid");
  assert.equal(outcome.kind, "superseded");
  await session.validate();
  assert.equal(session.read(key).value.answer.length, 16385);
  assert.equal(session.account().hasUnsaved, true);
  assert.equal((await session.retry(key)).kind, "unsaved");
  assert.equal(writes, 1);
  assert.equal((await ready()).read(key).value.answer, "older valid reasoning");
});

for (const completion of [409, 413, 422, 503, "mismatched acknowledgement"]) {
  test(`a superseded ${completion} completion preserves invalid local text`, async () => {
    const session = await ready();
    if (completion === 409)
      await (await ready()).save(key, value("account version"));
    const gate = pause(),
      captured = pause();
    let writes = 0;
    intercept = async ({ command, dispatch }) => {
      const response = await dispatch();
      if (command?.operation !== "write" || ++writes !== 1) return response;
      const data = await response.json();
      if (completion === "mismatched acknowledgement")
        data.record.mutationId = crypto.randomUUID();
      captured.resolve();
      await gate.promise;
      return new Response(JSON.stringify(data), {
        status: typeof completion === "number" ? completion : 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const older = session.save(key, value("older valid reasoning"));
    await captured.promise;
    const tooLong = "x".repeat(16385);
    assert.equal((await session.save(key, value(tooLong))).kind, "unsaved");
    gate.resolve();
    assert.equal((await older).kind, "superseded");
    assert.equal(session.read(key).value.answer.length, 16385);
    assert.equal(
      session.read(key).persistence.kind,
      completion === 409 ? "conflict" : "unsaved",
    );
    if (completion !== 409)
      assert.equal(session.read(key).persistence.reason, "invalid");
    for (let validation = 0; validation < 2; validation++) {
      await session.validate();
      assert.equal(session.read(key).value.answer.length, 16385);
      assert.equal(session.read(key).value.answer, tooLong);
      assert.equal(session.account().hasUnsaved, true);
      assert.notEqual(session.read(key).persistence.kind, "saved");
    }
    assert.equal((await session.retry(key)).kind, "unsaved");
    assert.equal(writes, 1);
  });
}

test("a superseded lost acknowledgement preserves the newer valid pending draft", async () => {
  const session = await ready();
  const gate = pause(),
    captured = pause();
  let writes = 0;
  intercept = async ({ command, dispatch }) => {
    const response = await dispatch();
    if (command?.operation === "write" && ++writes === 1) {
      assert.equal(response.status, 200);
      captured.resolve();
      await gate.promise;
      throw new TypeError("injected lost acknowledgement after D1 commit");
    }
    return response;
  };
  const older = session.save(key, value("older valid reasoning"));
  await captured.promise;
  const newer = session.save(key, value("newer valid reasoning"));
  gate.resolve();
  assert.equal((await older).kind, "superseded");
  assert.equal((await newer).kind, "conflict");
  assert.equal(session.read(key).value.answer, "newer valid reasoning");
  assert.equal(session.read(key).theirs.answer, "older valid reasoning");
  assert.equal((await session.resolve(key, "keep-mine")).kind, "saved");
  assert.equal((await ready()).read(key).value.answer, "newer valid reasoning");
  assert.equal(writes, 3);
});

test(
  "a superseded conflict settles the newer pending draft without discarding it",
  { timeout: 3000 },
  async () => {
    const session = await ready();
    await (await ready()).save(key, value("account version"));
    const gate = pause(),
      captured = pause();
    intercept = async ({ command, dispatch }) => {
      const response = await dispatch();
      if (command?.operation === "write") {
        assert.equal(response.status, 409);
        captured.resolve();
        await gate.promise;
      }
      return response;
    };
    const older = session.save(key, value("older reasoning"));
    await captured.promise;
    const newer = session.save(key, value("newer reasoning"));
    gate.resolve();
    assert.equal((await older).kind, "superseded");
    assert.equal((await newer).kind, "conflict");
    assert.equal(session.read(key).value.answer, "newer reasoning");
    assert.equal(session.read(key).theirs.answer, "account version");
    intercept = undefined;
    assert.equal((await session.resolve(key, "keep-mine")).kind, "saved");
    assert.equal((await ready()).read(key).value.answer, "newer reasoning");
  },
);

test(
  "same-owner revalidation settles a newer pending draft against an older committed mutation",
  { timeout: 3000 },
  async () => {
    const session = await ready();
    const gate = pause(),
      captured = pause();
    intercept = async ({ command, dispatch }) => {
      const response = await dispatch();
      if (command?.operation === "write") {
        captured.resolve();
        await gate.promise;
      }
      return response;
    };
    const older = session.save(key, value("older committed reasoning"));
    await captured.promise;
    const newer = session.save(key, value("newer pending reasoning"));
    try {
      await session.validate();
      assert.equal((await older).kind, "superseded");
      assert.equal((await newer).kind, "conflict");
      assert.equal(session.read(key).value.answer, "newer pending reasoning");
      assert.equal(
        session.read(key).theirs.answer,
        "older committed reasoning",
      );
    } finally {
      gate.resolve();
      await older;
    }
  },
);

test("a current lost draft acknowledgement retries the same mutation idempotently", async () => {
  const session = await ready();
  const mutations = [];
  intercept = async ({ command, dispatch }) => {
    const response = await dispatch();
    if (command?.operation === "write") {
      mutations.push(command.mutationId);
      if (mutations.length === 1)
        throw new TypeError("injected lost acknowledgement after D1 commit");
      assert.equal((await response.clone().json()).record.revision, 1);
    }
    return response;
  };
  assert.equal(
    (await session.save(key, value("current valid reasoning"))).kind,
    "unsaved",
  );
  assert.equal((await session.retry(key)).kind, "saved");
  assert.equal(mutations.length, 2);
  assert.equal(mutations[0], mutations[1]);
  assert.equal(
    (await ready()).read(key).value.answer,
    "current valid reasoning",
  );
});

test("an acknowledged cleared draft refreshes normally when the account changes", async () => {
  const session = await ready();
  await session.save(key, value("initial reasoning"));
  assert.equal((await session.save(key, null)).kind, "saved");
  await session.validate();
  await (await ready()).save(key, value("restored account reasoning"));
  await session.validate();
  assert.equal(session.read(key).value.answer, "restored account reasoning");
  assert.equal(session.read(key).persistence.kind, "saved");
  assert.equal(session.account().hasUnsaved, false);
});

test("same-owner revalidation cannot replace invalid local text with an older committed draft", async () => {
  const session = await ready();
  const gate = pause(),
    captured = pause();
  intercept = async ({ command, dispatch }) => {
    const response = await dispatch();
    if (command?.operation === "write") {
      captured.resolve();
      await gate.promise;
    }
    return response;
  };
  const older = session.save(key, value("older valid text"));
  await captured.promise;
  const tooLong = "x".repeat(16385);
  assert.equal((await session.save(key, value(tooLong))).kind, "unsaved");
  try {
    await session.validate();
    assert.equal(session.read(key).value.answer.length, 16385);
    assert.equal(session.read(key).value.answer, tooLong);
    assert.notEqual(session.read(key).persistence.kind, "saved");
    assert.equal(session.account().hasUnsaved, true);
    assert.equal((await older).kind, "superseded");
  } finally {
    gate.resolve();
    await older;
  }
  await until(() => session.read(key).persistence.kind !== "saving");
  assert.equal(session.read(key).value.answer, tooLong);
  assert.notEqual(session.read(key).persistence.kind, "saved");
});

test("same-owner revalidation acknowledges a matching current draft without replaying it", async () => {
  const session = await ready();
  const gate = pause(),
    captured = pause();
  let writes = 0;
  intercept = async ({ command, dispatch }) => {
    const response = await dispatch();
    if (command?.operation === "write") {
      writes++;
      captured.resolve();
      await gate.promise;
    }
    return response;
  };
  const current = session.save(key, value("current committed text"));
  await captured.promise;
  try {
    await session.validate();
    assert.equal((await current).kind, "saved");
    assert.equal(session.read(key).value.answer, "current committed text");
    assert.equal(session.read(key).persistence.kind, "saved");
    assert.equal(writes, 1);
  } finally {
    gate.resolve();
    await current;
  }
});

test("same-owner revalidation restarts cancelled history and ignores its late response", async () => {
  const session = await ready();
  const lessonId = "epsilon-delta-one-variable";
  await session.ensure({ kind: "confidence", lessonId });
  const gate = pause(),
    captured = pause();
  let loads = 0;
  intercept = async ({ path, dispatch }) => {
    const response = await dispatch();
    if (String(path).includes("scope=history") && ++loads === 1) {
      captured.resolve();
      await gate.promise;
    }
    return response;
  };
  const initial = session.loadHistory(lessonId);
  await captured.promise;
  assert.equal(session.history(lessonId).loading, true);
  const attempt = {
    id: crypto.randomUUID(),
    lessonId,
    taskId: "quantifiers",
    choice: "correct",
    support: "none",
    at: "2026-01-01T00:00:00.000Z",
  };
  const response = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operation: "attempt",
      expectedOwner: owner,
      attempt,
    }),
  });
  assert.equal(response.status, 200);
  try {
    await session.validate();
    assert.equal(session.history(lessonId).loading, false);
    assert.equal(loads, 2);
    assert.deepEqual(
      session.history(lessonId).records.map(({ id }) => id),
      [attempt.id],
    );
  } finally {
    gate.resolve();
    await initial;
  }
  assert.deepEqual(
    session.history(lessonId).records.map(({ id }) => id),
    [attempt.id],
  );
  await session.loadHistory(lessonId);
  assert.equal(loads, 3);
  assert.equal(session.history(lessonId).loading, false);
});

test("same-owner revalidation cancels import activity and permits idempotent retry", async () => {
  const session = await ready();
  const savedStorage = globalThis.localStorage;
  const gate = pause(),
    captured = pause();
  let chunks = 0;
  globalThis.localStorage = {
    getItem: (name) =>
      name === "calculus-practice-draft:v1:derivative-definition:core"
        ? JSON.stringify(value("imported reasoning"))
        : null,
  };
  try {
    await session.prepareImport();
    assert.equal(session.account().preview.items.length, 1);
    intercept = async ({ command, dispatch }) => {
      const response = await dispatch();
      if (command?.operation === "import" && ++chunks === 1) {
        captured.resolve();
        await gate.promise;
      }
      return response;
    };
    const initial = session.importLegacy();
    await captured.promise;
    try {
      assert.equal(session.account().importing, true);
      await session.validate();
      assert.equal(session.account().importing, false);
      await session.importLegacy(true);
      assert.equal(chunks, 2);
      assert.equal(session.account().importing, false);
      assert.deepEqual(
        session.account().importResults.map(({ outcome }) => outcome),
        ["retained-existing"],
      );
    } finally {
      gate.resolve();
      await initial;
    }
    assert.deepEqual(
      session.account().importResults.map(({ outcome }) => outcome),
      ["retained-existing"],
    );
    assert.equal(session.read(key).value.answer, "imported reasoning");
    assert.equal((await ready()).read(key).value.answer, "imported reasoning");
  } finally {
    globalThis.localStorage = savedStorage;
  }
});
