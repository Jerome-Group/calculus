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
const { expression } = await vite.ssrLoadModule("/lib/atlas/math.ts");
const { shiftedDiskRadialBound } = await vite.ssrLoadModule(
  "/lib/curriculum/polar-region.ts",
);
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
test("a bounded jump is split, and repeated circle traversal keeps orientation", () => {
  const jump = new THREE.Group();
  const report = buildGraph(graph("curve", ["t", "sign(t-0.001)", "0"]), jump);
  assert.match(report, /discontinuity checks/);
  const jumpLines = jump.children.filter((child) => child.isLine);
  assert.ok(jumpLines.length >= 2);
  for (const line of jumpLines) {
    const p = line.geometry.attributes.position;
    const side = Math.sign(p.getY(0));
    for (let i = 1; i < p.count; i++) assert.equal(Math.sign(p.getY(i)), side);
  }

  const twice = new THREE.Group();
  buildGraph(
    { ...graph("curve", ["cos(t)", "sin(t)", "0"]), min: 0, max: 4 * Math.PI },
    twice,
  );
  const line = twice.children.find((child) => child.isLine);
  assert.ok(line);
  const positions = line.geometry.attributes.position;
  assert.ok(positions.count > 1200);
  assert.ok(positions.getY(1) > positions.getY(0));
  assert.ok(
    Math.hypot(
      positions.getX(0) - positions.getX(positions.count - 1),
      positions.getY(0) - positions.getY(positions.count - 1),
    ) < 1e-6,
  );
});
test("a removable hole excludes its undefined point without joining across it", () => {
  const group = new THREE.Group();
  const report = buildGraph(graph("curve", ["t", "t/t", "0"]), group);
  const lines = group.children.filter((child) => child.isLine);
  assert.ok(lines.length >= 2);
  assert.match(report, /excluded by clipping or discontinuity checks/);
  for (const line of lines) {
    const positions = line.geometry.attributes.position;
    for (let i = 1; i < positions.count; i++) {
      assert.ok(!(positions.getX(i - 1) < 0 && positions.getX(i) > 0));
      assert.ok(Math.abs(positions.getY(i) - 1) < 1e-6);
    }
  }
  assert.equal(expression("t/t")({ t: 0 }), Number.NaN);
  assert.equal(expression("t/t")({ t: 0.5 }), 1);
});
test("a periodic parameter seam repeats coordinates without becoming a boundary claim", () => {
  const group = new THREE.Group();
  const spec = {
    ...graph("parametric", ["cos(u)", "sin(u)", "v"]),
    min: 0,
    max: 2 * Math.PI,
    vmin: -1,
    vmax: 1,
  };
  const report = buildGraph(spec, group);
  const positions = group.children.find((child) => child.isMesh).geometry
    .attributes.position;
  assert.ok(positions.count > 0);
  const at = (u, v) =>
    spec.expressions.map((source) => expression(source)({ u, v }));
  for (const v of [-1, 0, 1]) {
    const first = at(0, v),
      last = at(2 * Math.PI, v);
    assert.ok(Math.hypot(...first.map((value, i) => value - last[i])) < 1e-12);
  }
  assert.match(
    report,
    /repeated parameter seam is not necessarily a geometric edge/,
  );
});
test("known exact values agree with plotted expressions and disk bounds", () => {
  const plane = expression("2*x+3*y");
  assert.equal(plane({ x: 1, y: 2 }), 8);
  const group = new THREE.Group();
  const report = buildGraph(graph("surface", ["2*x+3*y"]), group);
  const positions = group.children.find((child) => child.isMesh).geometry
    .attributes.position;
  assert.ok(positions.count > 0);
  for (let i = 0; i < positions.count; i++) {
    assert.ok(
      Math.abs(
        positions.getZ(i) - 2 * positions.getX(i) - 3 * positions.getY(i),
      ) < 1e-5,
    );
  }
  assert.match(report, /sampled points displayed/);
  // Area of (x−1)²+y²≤1: 1/2∫(2 cos θ)² dθ = π.
  const n = 600,
    h = Math.PI / n,
    integrand = (theta) => shiftedDiskRadialBound(theta) ** 2 / 2;
  let sum = integrand(-Math.PI / 2) + integrand(Math.PI / 2);
  for (let i = 1; i < n; i++)
    sum += (i % 2 ? 4 : 2) * integrand(-Math.PI / 2 + i * h);
  assert.ok(Math.abs((h / 3) * sum - Math.PI) < 1e-10);
});
test("surface result qualifies undefined and clipped samples beside the plot", () => {
  const hole = buildGraph(
    graph("surface", ["x*y/(x^2+y^2)"]),
    new THREE.Group(),
  );
  assert.match(hole, /1 undefined or nonfinite samples/);
  assert.match(
    hole,
    /display window and clip do not define the mathematical domain/,
  );
  const clipped = buildGraph(
    { ...graph("surface", ["x+y"]), clip: 0.5 },
    new THREE.Group(),
  );
  assert.match(clipped, /samples outside the height clip excluded/);
  assert.doesNotMatch(clipped, /0 samples outside the height clip excluded/);
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
