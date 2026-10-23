import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());

test("inline control validation preserves known mathematical ranges without reading device records", async () => {
  const inline = await vite.ssrLoadModule(
    "/lib/curriculum/inline-experiments.ts",
  );
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem() {
      throw new Error("Pure control math must not read storage");
    },
    setItem() {
      throw new Error("Pure control math must not write storage");
    },
  };
  try {
    assert.equal(
      inline.initialInlineExperimentValue("polar-regions", "domain", "value"),
      1,
    );
    assert.equal(
      inline.normalizeInlineExperimentValue(
        "polar-regions",
        "domain",
        "value",
        1.374,
      ),
      1.37,
    );
    assert.throws(
      () =>
        inline.normalizeInlineExperimentValue(
          "polar-regions",
          "domain",
          "value",
          Infinity,
        ),
      /finite/,
    );
    assert.throws(
      () =>
        inline.normalizeInlineExperimentValue(
          "polar-regions",
          "domain",
          "value",
          3,
        ),
      /between/,
    );
    assert.throws(
      () =>
        inline.normalizeInlineExperimentValue("unknown", "domain", "value", 1),
      /Unknown/,
    );
    assert.match(
      inline
        .inlineExperimentSnapshot("polar-regions")
        .find(({ id }) => id === "domain").readout,
      /x = 1.00/,
    );
  } finally {
    globalThis.localStorage = original;
  }
});

test("WebMCP reads account-owned inline values and reports the actual save outcome", async () => {
  const originalFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  try {
    const inline = await vite.ssrLoadModule(
      "/lib/curriculum/inline-experiments.ts",
    );
    const { studyTools } = await vite.ssrLoadModule(
      "/components/atlas/study-tools.ts",
    );
    const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
    const values = new Map();
    const state = {
      route: "lesson",
      readingMode: "revise",
      setReadingMode(mode) {
        this.readingMode = mode;
      },
      concept: concepts.find(({ id }) => id === "polar-regions"),
      info: { min: 0, max: 2 },
      inlineSnapshot(lessonId) {
        return inline.inlineExperimentSnapshot(
          lessonId,
          (id, parameter) =>
            values.get(`${lessonId}:${id}:${parameter}`) ??
            inline.initialInlineExperimentValue(lessonId, id, parameter),
        );
      },
      async setInline(lessonId, id, parameter, value) {
        values.set(
          `${lessonId}:${id}:${parameter}`,
          inline.normalizeInlineExperimentValue(lessonId, id, parameter, value),
        );
        return { kind: "guest" };
      },
    };
    const tools = studyTools(concepts, () => state);
    const set = tools.find(({ name }) => name === "set_inline_experiment");
    const result = await set.execute({
      id: "domain",
      parameter: "value",
      value: 1.42,
    });
    assert.equal(result.persistence, "guest");
    assert.equal(
      result.inlineExperiments.find(({ id }) => id === "domain").parameters
        .value,
      1.42,
    );
    assert.match(
      result.inlineExperiments.find(({ id }) => id === "domain").readout,
      /x = 1.42/,
    );
    assert.equal(state.readingMode, "learn");
    await assert.rejects(
      set.execute({ id: "domain", parameter: "value", value: 5 }),
      /between/,
    );
  } finally {
    globalThis.requestAnimationFrame = originalFrame;
  }
});
