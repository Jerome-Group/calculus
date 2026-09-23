import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import katex from "katex";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { planarModel } = await vite.ssrLoadModule("/lib/curriculum/planar.ts");
const { readoutTex, parameterTex } = await vite.ssrLoadModule(
  "/lib/curriculum/readouts.ts",
);
const { sceneInfo, sceneTex } = await vite.ssrLoadModule(
  "/lib/atlas/scenes.ts",
);
const concepts = JSON.parse(
  await readFile(new URL("../lib/curriculum/concepts.json", import.meta.url)),
);
const sources = JSON.parse(
  await readFile(new URL("../lib/curriculum/sources.json", import.meta.url)),
);
const render = (s) =>
  katex.renderToString(s, {
    throwOnError: true,
    strict: "error",
    trust: false,
  });
const prose = (s) => {
  for (const match of s.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g))
    render(match[1] ?? match[2]);
};
test("each course unit has concepts with resolvable source pages and parseable mathematics", () => {
  assert.equal(new Set(concepts.map((c) => c.id)).size, concepts.length);
  for (const [course, n] of [
    ["MH1100", 13],
    ["MH1101", 6],
    ["MH2100", 12],
  ]) {
    for (let lecture = 1; lecture <= n; lecture++)
      assert.ok(
        concepts.some((c) => c.course === course && c.lecture === lecture),
        `${course} ${lecture}`,
      );
  }
  for (const c of concepts) {
    assert.ok(c.sources.length, c.id);
    render(c.formula);
    for (const field of [
      "definition",
      "conditions",
      "proof",
      "example",
      "pitfall",
      "task",
      "insight",
      "enrichment",
    ])
      if (c[field]) prose(c[field]);
    for (const ref of c.sources) {
      const source = sources[ref.sourceId];
      assert.ok(source, `${c.id} ${ref.sourceId}`);
      assert.match(source.url, /^https:\/\//);
      assert.ok(ref.detail);
      assert.ok(ref.pages.length);
      for (const page of ref.pages)
        assert.ok(
          Number.isInteger(page) && page >= 1 && page <= source.pages,
          `${c.id}: page ${page}/${source.pages}`,
        );
    }
  }
});
test("every scene renders finite geometry and complete LaTex readouts throughout its parameter range", () => {
  const ids = new Set([
    ...concepts.map((c) => c.scene),
    "curveCircle",
    "curveEllipse",
    "curveCusp",
    "curveLine",
    "curveCycloid",
    "mobius",
    "vortex",
  ]);
  for (const id of ids) {
    const plane = id.startsWith("plane-");
    const info = plane ? planarModel(id) : sceneInfo(id);
    prose(parameterTex(info.label));
    for (const p of [
      info.min,
      info.initial,
      (info.min + info.max) / 2,
      info.max,
    ]) {
      if (plane) {
        const m = planarModel(id, p);
        assert.ok(m.traces.length, id);
        render(m.formula);
        render(m.readout);
        render(m.symbol);
        prose(m.note);
        for (const t of m.traces) {
          prose(t.label);
          for (const xy of t.points)
            assert.ok(xy.every(Number.isFinite), `${id} at ${p}`);
        }
      } else {
        assert.ok(sceneTex(id), id);
        render(sceneTex(id));
        render(readoutTex(id, p));
        for (const l of info.legend) prose(l);
      }
    }
  }
});
test("known calculus values and parameter symbols remain correct", () => {
  assert.match(readoutTex("directional", Math.PI / 4), /2\.8284/);
  assert.match(readoutTex("divergence", 1), /12\.5664/);
  assert.equal(planarModel("plane-epsilon").symbol, "\\varepsilon");
  assert.equal(planarModel("plane-squeeze").symbol, "\\delta");
  assert.match(planarModel("plane-secant", 0.1).readout, /2\.1/);
  assert.equal(parameterTex("Angle θ"), "Angle $\\theta$");
});

test("all spatial scene variants construct finite geometry at range endpoints", async () => {
  const { buildScene } = await vite.ssrLoadModule("/lib/atlas/geometry.ts");
  const { Group } = await import("three");
  const ids = new Set([
    ...concepts
      .filter((c) => !c.scene.startsWith("plane-"))
      .map((c) => c.scene),
    "curveCircle",
    "curveEllipse",
    "curveCusp",
    "curveLine",
    "curveCycloid",
    "mobius",
    "vortex",
  ]);
  for (const id of ids) {
    const info = sceneInfo(id);
    for (const p of [info.min, info.initial, info.max]) {
      const group = new Group();
      group.userData.lowQuality = true;
      buildScene(id, p, group);
      assert.ok(group.children.length, id);
      group.traverse((o) => {
        const positions = o.geometry?.getAttribute("position")?.array;
        if (positions)
          assert.ok([...positions].every(Number.isFinite), `${id} at ${p}`);
        o.geometry?.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m?.dispose();
      });
    }
  }
});

test("workspace tools validate the whole layout request before changing state", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  let layout = "split",
    sidebar = true;
  const state = {
    setVisualLayout: (v) => (layout = v),
    setSidebarOpen: (v) => (sidebar = v),
  };
  const tool = studyTools(concepts, () => state).find(
    (t) => t.name === "set_workspace_layout",
  );
  assert.throws(
    () => tool.execute({ visualisation: "wide", sidebarOpen: "false" }),
    /boolean/,
  );
  assert.equal(layout, "split");
  assert.equal(sidebar, true);
  tool.execute({ visualisation: "minimised", sidebarOpen: false });
  assert.equal(layout, "minimised");
  assert.equal(sidebar, false);
});

test("WebMCP concept read returns the same practice and source data as the visible lesson", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const concept = concepts.find(
    (item) => item.id === "partials-do-not-make-a-plane",
  );
  const tool = studyTools(concepts, () => ({})).find(
    (item) => item.name === "read_concept",
  );
  const result = tool.execute({ conceptId: concept.id });
  assert.deepEqual(result.lesson.exercise, learningGuides[concept.id].exercise);
  assert.ok(result.sources.every((source) => source.source.url));
});

test("WebMCP state includes the mathematical readout and its evidence limit", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const state = {
    visualLayout: "split",
    sidebarOpen: false,
    route: "lesson",
    course: "MH2100",
    search: "",
    concept: concepts.find(
      (item) => item.id === "partials-do-not-make-a-plane",
    ),
    activeScene: "differential",
    p: 0,
    info: { min: 0, max: 1, step: 0.1, readout: () => "Dᵤf(0)=1" },
    noteTab: "intuition",
    playing: false,
    graph: {},
  };
  const tool = studyTools(concepts, () => state).find(
    (item) => item.name === "get_study_state",
  );
  const result = tool.execute({});
  assert.equal(result.mathematicalReadout, "Dᵤf(0)=1");
  assert.match(result.representation, /Sampled illustration/);
});

test("WebMCP manual control stops animation and respects reduced motion", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const oldWindow = globalThis.window;
  const oldFrame = globalThis.requestAnimationFrame;
  globalThis.window = {
    matchMedia: () => ({ matches: true }),
  };
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  const state = {
    route: "lesson",
    concept: concepts.find((item) => item.id === "total-differentiability"),
    info: { min: 0, max: 1, step: 0.1 },
    playing: true,
    p: 0.5,
    setPlaying(value) {
      this.playing = value;
    },
    setP(value) {
      this.p = value;
    },
  };
  try {
    const tools = studyTools(concepts, () => state);
    await assert.rejects(
      tools
        .find((tool) => tool.name === "set_experiment_animation")
        .execute({
          playing: true,
        }),
      /reduced motion/,
    );
    await tools
      .find((tool) => tool.name === "set_visual_parameter")
      .execute({
        value: 0.7,
      });
    assert.equal(state.playing, false);
    assert.equal(state.p, 0.7);
  } finally {
    globalThis.window = oldWindow;
    globalThis.requestAnimationFrame = oldFrame;
  }
});

test("the geometric first-N control exposes N=1 and shows its exact first term", async () => {
  const { planarModel } = await vite.ssrLoadModule("/lib/curriculum/planar.ts");
  const model = planarModel("plane-geometric", 1);
  assert.equal(model.min, 1);
  assert.equal(model.label, "Terms shown");
  assert.match(model.formula, /N-1/);
  assert.match(model.readout, /N=1/);
  assert.match(model.readout, /1(?:\.0+)?/);
});

test("a stale graph frame cannot settle a superseding graph request", async () => {
  const { settleGraphRender } = await vite.ssrLoadModule(
    "/lib/atlas/render-completion.ts",
  );
  const completions = [];
  const pending = {
    fingerprint: JSON.stringify({ expressions: ["cos(t)", "sin(t)", "t/3"] }),
    resolve: (r) => completions.push(r),
    reject: (e) => completions.push(e),
  };
  assert.equal(
    settleGraphRender(
      pending,
      JSON.stringify({ expressions: ["sin(x)*cos(y)"] }),
      "Scene rendered",
    ),
    false,
  );
  assert.deepEqual(completions, []);
  assert.equal(
    settleGraphRender(pending, pending.fingerprint, "601 finite curve samples"),
    true,
  );
  assert.deepEqual(completions, [
    { status: "rendered", detail: "601 finite curve samples" },
  ]);
});
