import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { inspectNotation as inspect } from "./helpers/math-notation.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { pilotLessons } = await vite.ssrLoadModule(
  "/lib/curriculum/learning-modes.ts",
);
const { exampleRegistry } = await vite.ssrLoadModule(
  "/lib/curriculum/example-registry.ts",
);
const { integrationSteps, integrationFailure } = await vite.ssrLoadModule(
  "/lib/curriculum/integration-framework.ts",
);
const { sceneInfo } = await vite.ssrLoadModule("/lib/atlas/scenes.ts");
const { planarModel } = await vite.ssrLoadModule("/lib/curriculum/planar.ts");
const { checkLinearDelta } = await vite.ssrLoadModule(
  "/lib/curriculum/linear-delta.ts",
);
const { forwardBridges } = await vite.ssrLoadModule(
  "/lib/curriculum/prerequisite-routes.ts",
);
function visit(value, place, failures) {
  if (typeof value === "string") inspect(value, place, failures);
  else if (Array.isArray(value))
    value.forEach((item, i) => visit(item, `${place}[${i}]`, failures));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value))
      visit(item, `${place}.${key}`, failures);
}
test("pilot, example, and integration prose marks mathematical notation", () => {
  const failures = [];
  visit(pilotLessons, "pilotLessons", failures);
  for (const example of exampleRegistry)
    for (const field of ["title", "domain", "orientation", "annotation"])
      inspect(example[field], `${example.id}.${field}`, failures);
  for (const [i, step] of integrationSteps.entries())
    for (const field of ["title", "hypothesis", "conclusion", "boundary"])
      inspect(step[field], `integrationSteps[${i}].${field}`, failures);
  inspect(integrationFailure, "integrationFailure", failures);
  for (const [id, bridge] of Object.entries(forwardBridges))
    inspect(bridge.explanation, `${id}.bridge`, failures);
  for (const [epsilon, delta] of [
    [0.4, "0.2"],
    [0.4, "0.3"],
    [0.4, "bad"],
  ])
    inspect(
      checkLinearDelta(epsilon, delta),
      `checkLinearDelta(${epsilon}, ${delta})`,
      failures,
    );
  assert.equal(failures.length, 0, failures.join("\n"));
});
test("scene and planar prose mark mathematical notation", () => {
  const failures = [];
  const concepts = JSON.parse(
    readFileSync(
      new URL("../lib/curriculum/concepts.json", import.meta.url),
      "utf8",
    ),
  );
  const ids = [
    ...new Set([
      ...concepts
        .map((concept) => concept.scene)
        .filter((scene) => !scene.startsWith("plane-")),
      "curveCircle",
      "curveEllipse",
      "curveCusp",
      "curveLine",
      "mobius",
      "vortex",
    ]),
  ];
  for (const id of ids) {
    const info = sceneInfo(id);
    inspect(info.note, `${id}.note`, failures);
    info.legend.forEach((label, i) =>
      inspect(label, `${id}.legend[${i}]`, failures),
    );
  }
  const planarIds = [
    ...new Set(
      concepts
        .map((concept) => concept.scene)
        .filter((scene) => scene.startsWith("plane-")),
    ),
  ];
  for (const id of planarIds) {
    const model = planarModel(id);
    inspect(model.note, `${id}.note`, failures);
    model.traces.forEach((trace, i) =>
      inspect(trace.label, `${id}.traces[${i}]`, failures),
    );
  }
  assert.equal(failures.length, 0, failures.join("\n"));
});

test("pilot numeric contexts use mathematical spans", () => {
  const epsilon = pilotLessons["epsilon-delta-one-variable"];
  assert.match(epsilon.learn.quickCheck, /\$a=1\$/);
  assert.match(epsilon.practice[0].feedback.QUANTIFIER_REVERSED, /\$x\$/);
  const regions = pilotLessons["type-one-two-regions"];
  assert.match(regions.practice[2].hint, /\$0\$ and \$1\$/);
});
