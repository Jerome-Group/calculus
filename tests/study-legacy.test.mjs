import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { previewLegacy, legacyChunks } = await vite.ssrLoadModule(
  "/lib/study/legacy.ts",
);
const attempt = {
  taskId: "quantifiers",
  kind: "recognition",
  correct: true,
  support: "none",
  at: "2026-01-01T00:00:00Z",
};
const source = (attempts) =>
  JSON.stringify({
    "epsilon-delta-one-variable": { attempts, confidence: "unsure" },
  });

test("explicit legacy preview is read-only, validates each record, and preserves historical provenance", async () => {
  const values = new Map([
    ["calculus-pilot-progress-v2", source([attempt, null, attempt])],
    [
      "calculus-practice",
      JSON.stringify({
        "derivative-definition": {
          status: "Needs practice",
          date: "2026-01-01",
        },
        unknown: { status: "Mastered", date: "bad" },
      }),
    ],
    [
      "calculus-practice-draft:v1:derivative-definition:core",
      JSON.stringify({
        answer: "Original device reasoning",
        hintOpen: true,
        solutionOpen: false,
      }),
    ],
    ["calculus:inline-experiment:v1:polar-regions:domain:value", "1.37"],
    ["calculus-last-lesson", "derivative-definition"],
  ]);
  const original = JSON.stringify([...values]);
  const storage = { getItem: (key) => values.get(key) ?? null };
  const preview = await previewLegacy(storage);
  assert.equal(JSON.stringify([...values]), original);
  assert.equal(preview.sources, 5);
  assert.equal(preview.rejected.length, 2);
  const attempts = preview.items.filter(({ kind }) => kind === "attempt");
  assert.equal(attempts.length, 2);
  assert.notEqual(attempts[0].value.id, attempts[1].value.id);
  assert.ok(attempts.every(({ value }) => value.source === "legacy"));
  assert.deepEqual((await previewLegacy(storage)).items, preview.items);
  values.set("calculus-last-lesson", "epsilon-delta-one-variable");
  const afterUnrelatedEdit = await previewLegacy(storage);
  assert.deepEqual(
    afterUnrelatedEdit.items.filter(({ kind }) => kind === "attempt"),
    attempts,
  );
  values.set(
    "calculus-pilot-progress-v2",
    source([
      attempt,
      null,
      attempt,
      { ...attempt, at: "2026-01-02T00:00:00Z" },
    ]),
  );
  const afterAppend = (await previewLegacy(storage)).items.filter(
    ({ kind }) => kind === "attempt",
  );
  assert.deepEqual(afterAppend.slice(0, 2), attempts);
  assert.equal(afterAppend.length, 3);
  assert.equal(new Set(afterAppend.map(({ value }) => value.id)).size, 3);
});

test("bounded legacy chunks retain every validated item and visibly reject oversize source data", async () => {
  const items = Array.from({ length: 450 }, (_, i) => ({
    kind: "mutable",
    key: {
      kind: "practice-draft",
      lessonId: "derivative-definition",
      exerciseId: "core",
    },
    value: {
      answer: "x".repeat(i % 2 ? 16384 : 100),
      hintOpen: false,
      solutionOpen: false,
    },
  }));
  const chunks = legacyChunks(items);
  assert.deepEqual(chunks.flat(), items);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 200);
    assert.ok(
      new TextEncoder().encode(
        JSON.stringify({
          operation: "import",
          expectedOwner: "test",
          items: chunk,
        }),
      ).length < 262144,
    );
  }
  const oversized = await previewLegacy({
    getItem: (key) =>
      key === "calculus-practice" ? "x".repeat(1048577) : null,
  });
  assert.equal(oversized.items.length, 0);
  assert.match(
    oversized.rejected[0],
    /exceeds import preview limit.*preserved/,
  );
});
