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
const { readLessonHistory, lessonUrl, routeUrl, graphUrl, readGraphHistory } =
  await vite.ssrLoadModule("/components/atlas/study-history.ts");
const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");
const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
const { sceneInfo } = await vite.ssrLoadModule("/lib/atlas/scenes.ts");
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
