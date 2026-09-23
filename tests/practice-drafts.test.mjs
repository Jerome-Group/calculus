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

test("practice drafts survive remounts, isolate exercises, and retain memory on storage failure", async () => {
  const drafts = await vite.ssrLoadModule("/lib/curriculum/practice-drafts.ts");
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const first = {
    answer: "A justified limit",
    hintOpen: true,
    solutionOpen: false,
  };
  const second = {
    answer: "A distinct task",
    hintOpen: false,
    solutionOpen: true,
  };
  assert.equal(drafts.writePracticeDraft("limits", first), true);
  assert.equal(drafts.writePracticeDraft("limits", second, "transfer"), true);
  assert.deepEqual(drafts.readPracticeDraft("limits").draft, first);
  assert.deepEqual(
    drafts.readPracticeDraft("limits", "transfer").draft,
    second,
  );
  assert.match(drafts.practiceDraftKey("limits"), /:v1:limits:core$/);

  globalThis.localStorage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  const revised = { ...first, answer: "Revised while storage is denied" };
  assert.equal(drafts.writePracticeDraft("limits", revised), false);
  assert.deepEqual(drafts.readPracticeDraft("limits").draft, revised);
  globalThis.localStorage.getItem = () => {
    throw new Error("Storage denied");
  };
  assert.deepEqual(drafts.readPracticeDraft("limits").draft, revised);

  globalThis.localStorage.getItem = (key) => values.get(key) ?? null;
  globalThis.localStorage.setItem = (key, value) => values.set(key, value);
  assert.equal(drafts.deletePracticeDraft("limits"), true);
  assert.equal(drafts.readPracticeDraft("limits").draft.answer, "");
  assert.deepEqual(
    drafts.readPracticeDraft("limits", "transfer").draft,
    second,
  );
  delete globalThis.localStorage;
});
