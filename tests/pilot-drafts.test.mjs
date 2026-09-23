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

test("pilot drafts survive navigation, isolate tasks, and keep memory on storage failure", async () => {
  const drafts = await vite.ssrLoadModule("/lib/curriculum/pilot-drafts.ts");
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const first = {
    choice: "correct",
    reasoning: "Choose delta from epsilon before x.",
    support: "none",
    feedback: "",
  };
  const second = {
    choice: "large",
    reasoning: "A different task draft",
    support: "hint",
    feedback: "Try again.",
  };
  assert.equal(drafts.writePilotDraft("epsilon", "setup", first), true);
  assert.equal(drafts.writePilotDraft("epsilon", "transfer", second), true);
  assert.deepEqual(drafts.readPilotDraft("epsilon", "setup").draft, first);
  assert.deepEqual(drafts.readPilotDraft("epsilon", "transfer").draft, second);

  values.set(drafts.pilotDraftKey("other-lesson", "recognition"), "{invalid");
  assert.deepEqual(drafts.readPilotDraft("other-lesson", "recognition").draft, {
    choice: "",
    reasoning: "",
    support: "none",
    feedback: "",
  });

  values.set(drafts.pilotDraftKey("epsilon", "setup"), "{invalid");
  assert.deepEqual(drafts.readPilotDraft("epsilon", "setup").draft, first);

  globalThis.localStorage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  const revised = { ...first, reasoning: "Revised without storage" };
  assert.equal(drafts.writePilotDraft("epsilon", "setup", revised), false);
  assert.deepEqual(drafts.readPilotDraft("epsilon", "setup").draft, revised);

  globalThis.localStorage.setItem = (key, value) => values.set(key, value);
  assert.equal(drafts.deletePilotDraft("epsilon", "setup"), true);
  assert.equal(drafts.readPilotDraft("epsilon", "setup").draft.reasoning, "");
  assert.deepEqual(drafts.readPilotDraft("epsilon", "transfer").draft, second);
  delete globalThis.localStorage;
});
