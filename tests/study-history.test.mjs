import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createSsrServer } from "./helpers/ssr-server.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createSsrServer(
  {
    appType: "custom",
    configFile: false,
    root,
    resolve: { alias: { "@": root } },
    server: { middlewareMode: true, hmr: false, ws: false },
  },
  after,
);
const { readLessonHistory, lessonUrl, routeUrl, graphUrl, readGraphHistory } =
  await vite.ssrLoadModule("/components/atlas/study-history.ts");
const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");
const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
const { sceneInfo } = await vite.ssrLoadModule("/lib/atlas/scenes.ts");
const { readLessonInterruption } = await vite.ssrLoadModule(
  "/components/atlas/lesson-interruption.ts",
);
const concept = concepts.find((c) => c.scene === "elementarycurves");

test("versioned shared URL restores model, bounded parameter and reading section", () => {
  const state = {
    version: 1,
    scene: "curveCircle",
    parameter: 1.25,
    mode: "explore",
    notesTab: "example",
  };
  const url = lessonUrl(
    new URL("https://example.test/?source=friend#course"),
    concept.id,
    state,
  );
  assert.match(url, /source=friend/);
  assert.match(url, new RegExp(`#${concept.id}$`));
  assert.deepEqual(
    readLessonHistory(new URL(url, "https://example.test"), concept, sceneInfo),
    { kind: "valid", value: state },
  );
  assert.equal(
    routeUrl(new URL(url, "https://example.test"), "course"),
    "/?source=friend#course",
  );
});

for (const [conceptId, scene] of [
  ["multivariable-chain-rule", "chain"],
  ["plane-jacobian", "plane-nonlinear-cell"],
  ["plane-jacobian", "jacobian"],
  ["change-of-variables", "plane-nonlinear-cell"],
  ["change-of-variables", "jacobian"],
  ["flux-through-surfaces", "fluxOblique"],
]) {
  test(`shared URL restores ${scene} in ${conceptId}`, () => {
    const lesson = concepts.find((c) => c.id === conceptId);
    assert.ok(lesson);
    const state = {
      version: 1,
      scene,
      parameter: sceneInfo(scene).initial,
      mode: "explore",
      notesTab: "example",
    };
    const url = new URL(
      lessonUrl(new URL("https://example.test/"), lesson.id, state),
      "https://example.test",
    );
    assert.deepEqual(readLessonHistory(url, lesson, sceneInfo), {
      kind: "valid",
      value: state,
    });
  });
}

test("legacy IDs work and malformed or obsolete state explains fallback", () => {
  assert.deepEqual(
    readLessonHistory(
      new URL(`https://example.test/#${concept.id}`),
      concept,
      sceneInfo,
    ),
    { kind: "legacy" },
  );
  for (const value of [
    "{",
    JSON.stringify({ version: 2, scene: concept.scene, parameter: 1 }),
    JSON.stringify({
      version: 1,
      scene: "plane-secant",
      parameter: 1,
      mode: "learn",
      notesTab: "intuition",
    }),
    JSON.stringify({
      version: 1,
      scene: concept.scene,
      parameter: 1e6,
      mode: "learn",
      notesTab: "intuition",
    }),
  ]) {
    const url = new URL(`https://example.test/#${concept.id}`);
    url.searchParams.set("study", value);
    const result = readLessonHistory(url, concept, sceneInfo);
    assert.equal(result.kind, "invalid");
    assert.match(result.explanation, /Showing default settings/);
  }
});

test("graph links restore exact expressions and parameter; invalid state falls back visibly", () => {
  const graph = {
    ...initialGraph,
    expressions: ["x^2+y^2-a"],
    a: 1.25,
  };
  const url = new URL(
    graphUrl(new URL("https://example.test/?source=friend#course"), graph),
    "https://example.test",
  );
  assert.equal(url.hash, "#graph");
  assert.equal(url.searchParams.get("source"), "friend");
  assert.deepEqual(readGraphHistory(url), { kind: "valid", graph });
  assert.equal(routeUrl(url, "course"), "/?source=friend#course");
  url.searchParams.set("graph", JSON.stringify({ version: 1, graph: null }));
  const invalid = readGraphHistory(url);
  assert.equal(invalid.kind, "invalid");
  assert.match(invalid.explanation, /Showing the default graph/);
});

test("opening a lesson from a shared graph drops stale graph state", () => {
  const graph = { ...initialGraph, expressions: ["x^2+y^2-a"], a: 1.25 };
  const graphLink = graphUrl(
    new URL("https://example.test/?source=friend#course"),
    graph,
  );
  const state = {
    version: 1,
    scene: "curveCircle",
    parameter: 1.25,
    mode: "explore",
    notesTab: "example",
  };
  const lessonLink = new URL(
    lessonUrl(new URL(graphLink, "https://example.test"), concept.id, state),
    "https://example.test",
  );
  assert.equal(lessonLink.searchParams.get("graph"), null);
  assert.equal(lessonLink.searchParams.get("source"), "friend");
  assert.deepEqual(readLessonHistory(lessonLink, concept, sceneInfo), {
    kind: "valid",
    value: state,
  });
});

test("shared graph parameters obey the expression slider's complete range", () => {
  for (const a of [-6, -5.01, 5.01, 6]) {
    const url = new URL(
      graphUrl(new URL("https://example.test/"), { ...initialGraph, a }),
      "https://example.test",
    );
    assert.equal(readGraphHistory(url).kind, "invalid", `parameter ${a}`);
  }
  for (const a of [-5, 0, 5]) {
    const graph = { ...initialGraph, a };
    const url = new URL(
      graphUrl(new URL("https://example.test/"), graph),
      "https://example.test",
    );
    assert.deepEqual(readGraphHistory(url), { kind: "valid", graph });
  }
});

for (const [id, origin] of [
  [
    "rolle-mean-value",
    {
      clinicReturn: {
        version: 1,
        caseId: "rolle-corner",
        focus: "diagnosis",
        scrollY: 400,
      },
      workshopReturn: null,
    },
  ],
  [
    "total-differentiability",
    {
      clinicReturn: null,
      workshopReturn: {
        version: 1,
        id: "linear-bound",
        focus: "result",
        scrollY: 300,
      },
    },
  ],
]) {
  test(`${id} prerequisite history retains its exact first anchor and validated workspace origin`, () => {
    const anchor = concepts.find((item) => item.id === id);
    const base = new URL("https://example.test/#derivative-definition");
    const point = {
      version: 1,
      id,
      url: lessonUrl(base, id, {
        version: 1,
        scene: anchor.scene,
        parameter: 0,
        mode: "learn",
        notesTab: "example",
      }),
      scrollY: 250,
      ...origin,
    };
    const bounds = () => ({ min: -100, max: 100 });
    assert.deepEqual(
      readLessonInterruption({ prerequisiteReturn: point }, base, bounds),
      point,
    );
    assert.equal(readLessonInterruption({}, base, bounds), null);
    assert.equal(
      readLessonInterruption(
        { prerequisiteReturn: point },
        new URL("https://example.test/#course"),
        bounds,
      ),
      null,
    );
    for (const invalid of [
      { ...point, scrollY: -1 },
      { ...point, scrollY: 10_000_001 },
      { ...point, url: "https://other.test/" + point.url },
      { ...point, url: "/elsewhere" + point.url },
      { ...point, id: "not-a-lesson" },
      { ...point, url: point.url.replace("study=", "study=invalid") },
    ])
      assert.equal(
        readLessonInterruption({ prerequisiteReturn: invalid }, base, bounds),
        null,
      );
    const unrelated = {
      ...point,
      clinicReturn: {
        version: 1,
        caseId: "rolle-corner",
        focus: "diagnosis",
        scrollY: 400,
      },
      workshopReturn: {
        version: 1,
        id: "linear-bound",
        focus: "result",
        scrollY: 300,
      },
    };
    const read = readLessonInterruption(
      { prerequisiteReturn: unrelated },
      base,
      bounds,
    );
    assert.equal(
      id === "rolle-mean-value" ? read.workshopReturn : read.clinicReturn,
      null,
    );
  });
}
