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
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("inline experiment state survives remounts, isolates controls, and survives storage failure", async () => {
  const savedStorage = globalThis.localStorage;
  const stored = new Map([
    [
      "calculus:inline-experiment:v1:polar-regions:transformed-domain:value",
      "0.3",
    ],
  ]);
  globalThis.localStorage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  };
  try {
    const state = await vite.ssrLoadModule(
      "/lib/curriculum/inline-experiments.ts",
    );
    assert.equal(
      state.getInlineExperimentValue(
        "polar-regions",
        "transformed-domain",
        "value",
      ),
      0.3,
    );
    state.setInlineExperimentValue("polar-regions", "domain", "value", 1.37);
    state.setInlineExperimentValue("polar-regions", "slice", "value", 0.4);
    assert.equal(
      stored.get("calculus:inline-experiment:v1:polar-regions:domain:value"),
      "1.37",
    );
    assert.equal(
      state.getInlineExperimentValue("polar-regions", "domain", "value"),
      1.37,
    );
    assert.equal(
      state.getInlineExperimentValue("polar-regions", "slice", "value"),
      0.4,
    );
    assert.equal(
      state.getInlineExperimentValue(
        "polar-regions",
        "transformed-domain",
        "value",
      ),
      0.3,
    );
    assert.throws(
      () =>
        state.setInlineExperimentValue(
          "polar-regions",
          "domain",
          "value",
          Infinity,
        ),
      /finite/,
    );
    assert.throws(
      () =>
        state.setInlineExperimentValue("polar-regions", "domain", "value", 3),
      /between/,
    );
    assert.equal(
      state.getInlineExperimentValue("polar-regions", "domain", "value"),
      1.37,
    );
    globalThis.localStorage = {
      getItem() {
        throw Error("disabled");
      },
      setItem() {
        throw Error("disabled");
      },
    };
    state.setInlineExperimentValue("polar-regions", "domain", "value", 1.25);
    assert.equal(
      state.getInlineExperimentValue("polar-regions", "domain", "value"),
      1.25,
    );
  } finally {
    globalThis.localStorage = savedStorage;
  }
});

test("WebMCP reads and sets region and review controls without a DOM", async () => {
  const savedFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  try {
    const inline = await vite.ssrLoadModule(
      "/lib/curriculum/inline-experiments.ts",
    );
    inline.setInlineExperimentValue("polar-regions", "slice", "value", 0.4);
    const { studyTools } = await vite.ssrLoadModule(
      "/components/atlas/study-tools.ts",
    );
    const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
    const state = {
      route: "lesson",
      readingMode: "revise",
      setReadingMode(mode) {
        this.readingMode = mode;
      },
      concept: concepts.find((item) => item.id === "polar-regions"),
      info: { min: 0, max: 2 },
    };
    const tools = studyTools(concepts, () => state);
    const set = tools.find((tool) => tool.name === "set_inline_experiment");
    const read = tools.find((tool) => tool.name === "get_study_state");
    await set.execute({ id: "domain", parameter: "value", value: 1.42 });
    let snapshot = read.execute({}).inlineExperiments;
    assert.equal(
      snapshot.find((item) => item.id === "domain").parameters.value,
      1.42,
    );
    assert.match(
      snapshot.find((item) => item.id === "domain").readout,
      /x = 1.42/,
    );
    assert.equal(snapshot.find((item) => item.id === "domain").open, true);
    assert.equal(state.readingMode, "learn");
    assert.equal(
      snapshot.find((item) => item.id === "slice").parameters.value,
      0.4,
    );
    await assert.rejects(
      set.execute({ id: "domain", parameter: "value", value: 5 }),
      /between/,
    );
    state.concept = concepts.find(
      (item) => item.id === "review-total-differentiability",
    );
    await set.execute({
      id: "counterexample",
      parameter: "radius",
      value: 0.31,
    });
    snapshot = read.execute({}).inlineExperiments;
    assert.equal(
      snapshot.find((item) => item.id === "counterexample").parameters.radius,
      0.31,
    );
    assert.equal(
      snapshot.find((item) => item.id === "differentiable").parameters.radius,
      0.25,
    );
  } finally {
    globalThis.requestAnimationFrame = savedFrame;
  }
});
