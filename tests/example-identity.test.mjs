import test, { after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

test("each differentiability function owns its origin definition, plane and graph", async () => {
  const { exampleById } = await vite.ssrLoadModule(
    "/lib/curriculum/example-registry.ts",
  );
  const f = exampleById("review-differentiable-f");
  const g = exampleById("review-counterexample-g");
  assert.match(f.formula, /x\^4\+y\^4/);
  assert.match(g.formula, /x\^3-xy\^2/);
  assert.match(f.formula, /0,&\(x,y\)=\(0,0\)/);
  assert.match(g.formula, /0,&\(x,y\)=\(0,0\)/);
  assert.match(f.annotation, /L=0/);
  assert.match(g.annotation, /L\(x,y\)=x/);
  assert.equal(f.graph.kind, "preset");
  assert.equal(g.graph.kind, "preset");
  assert.match(f.graph.preset.expressions[0], /x\^4\+y\^4/);
  assert.match(g.graph.preset.expressions[0], /x\^3-x\*y\^2/);
  assert.notEqual(f.graph.preset.expressions[0], g.graph.preset.expressions[0]);
  const { ReviewDifferentiabilityExperiments } = await vite.ssrLoadModule(
    "/components/atlas/review-differentiability-experiments.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(ReviewDifferentiabilityExperiments),
  );
  assert.match(html, /data-example-id="review-differentiable-f"/);
  assert.match(html, /data-example-id="review-counterexample-g"/);
});

test("original review integrals retain their fields, paths and orientations", async () => {
  const { exampleById } = await vite.ssrLoadModule(
    "/lib/curriculum/example-registry.ts",
  );
  const green = exampleById("review-green-original");
  const greenScaffold = exampleById("review-green-scaffold");
  const potential = exampleById("review-potential-original");
  const straight = exampleById("review-potential-scaffold");
  assert.match(green.formula, /y\\cos x-xy\\sin x/);
  assert.match(green.formula, /xy\+x\\cos x/);
  assert.match(green.orientation, /Clockwise.*−72/);
  assert.match(greenScaffold.formula, /P=0/);
  assert.equal(greenScaffold.status, "scaffold");
  assert.match(potential.formula, /e\^\{t\^2-t\}-\\cos/);
  assert.match(potential.formula, /2\\sin\(\\pi t\^2\/2\)-t\^9/);
  assert.match(potential.orientation, /opposite increasing t.*−1\/π/);
  assert.match(straight.formula, /1-t/);
  assert.equal(straight.status, "scaffold");
  for (const identity of [green, greenScaffold, potential, straight]) {
    assert.equal(identity.graph.kind, "none");
  }
  const integral = -0.5 * (144 * 3 - (96 * 9) / 2 + (16 * 27) / 3);
  assert.equal(integral, -72);
  assert.equal(0 - 1 / Math.PI, -1 / Math.PI);
});

test("WebMCP read_concept returns the same typed example identities", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const read = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  const result = read.execute({ conceptId: "review-integral-methods" });
  assert.equal(result.examples.length, 4);
  assert.equal(result.examples[0].id, "review-green-original");
  assert.equal(result.examples[2].id, "review-potential-original");
});
