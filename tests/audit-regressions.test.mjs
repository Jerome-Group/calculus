import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import katex from "katex";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { buildGraph } = await vite.ssrLoadModule("/lib/atlas/geometry.ts");
const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");
const graph = (mode, expressions) => ({
  ...initialGraph,
  mode,
  expressions,
  min: -1,
  max: 1,
  vmin: -1,
  vmax: 1,
  clip: 10,
});
test("an unsampled pole never bridges its two branches", () => {
  const group = new THREE.Group();
  buildGraph(graph("curve", ["t", "1/(t-0.001)", "0"]), group);
  let lines = 0;
  group.traverse((child) => {
    if (!child.isLine) return;
    lines++;
    const p = child.geometry.attributes.position;
    for (let i = 1; i < p.count; i++) {
      assert.ok(!(p.getX(i - 1) < 0.001 && p.getX(i) > 0.001));
      for (const value of [p.getX(i), p.getY(i), p.getZ(i)])
        assert.ok(Math.abs(value) <= 10.00001);
    }
  });
  assert.ok(lines >= 2);
});
test("a continuous circle remains a connected closed curve", () => {
  const group = new THREE.Group();
  buildGraph(
    { ...graph("curve", ["cos(t)", "sin(t)", "0"]), min: 0, max: 2 * Math.PI },
    group,
  );
  const lines = group.children.filter((c) => c.isLine);
  assert.equal(lines.length, 1);
  const p = lines[0].geometry.attributes.position;
  assert.ok(
    Math.hypot(
      p.getX(0) - p.getX(p.count - 1),
      p.getY(0) - p.getY(p.count - 1),
    ) < 1e-6,
  );
});
test("a non-sign-changing zero set is reported as undetected, not empty", () => {
  const message = buildGraph(graph("implicit", ["z^2"]), new THREE.Group());
  assert.match(message, /No sign-changing surface was detected/);
  assert.match(message, /Non-sign-changing zero sets/);
});
test("learning guides have real prerequisites and parseable exercise mathematics", async () => {
  const concepts = JSON.parse(
    await readFile(new URL("../lib/curriculum/concepts.json", import.meta.url)),
  );
  const guides = JSON.parse(
    await readFile(
      new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    ),
  );
  const ids = new Set(concepts.map((c) => c.id));
  assert.equal(Object.keys(guides).length, concepts.length);
  for (const [id, guide] of Object.entries(guides)) {
    assert.ok(ids.has(id), id);
    for (const pre of guide.prerequisites) {
      assert.ok(ids.has(pre), `${id}: ${pre}`);
      assert.notEqual(pre, id);
    }
    assert.ok(guide.sections.length >= 2);
    assert.ok(guide.exercise.solutionTex, id);
    katex.renderToString(guide.exercise.solutionTex, {
      throwOnError: true,
      strict: "error",
    });
    assert.ok(guide.exercise.rubric.length >= 2);
    for (const text of [
      guide.exercise.prompt,
      guide.exercise.hint,
      guide.exercise.solution,
      ...guide.exercise.rubric,
      ...guide.sections.map((s) => s.text),
    ]) {
      for (const match of text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g))
        katex.renderToString(match[1] ?? match[2], {
          throwOnError: true,
          strict: "error",
        });
    }
  }
});

test("practice records discard corrupt and unsupported self-assessments", async () => {
  const { parseProgress } = await vite.ssrLoadModule(
    "/lib/curriculum/progress-store.ts",
  );
  assert.deepEqual(parseProgress("not json"), {});
  assert.deepEqual(parseProgress("null"), {});
  assert.deepEqual(parseProgress('["Needs practice"]'), {});
  assert.deepEqual(
    parseProgress(
      JSON.stringify({
        valid: { status: "Needs practice", date: "2026-09-16" },
        unsupported: { status: "Mastered", date: "2026-09-16" },
        invalid: null,
      }),
    ),
    { valid: { status: "Needs practice", date: "2026-09-16" } },
  );
});
