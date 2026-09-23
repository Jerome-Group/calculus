import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import * as Three from "three";
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

const { buildScene, C } = await vite.ssrLoadModule("/lib/atlas/geometry.ts");
const { sceneInfo } = await vite.ssrLoadModule("/lib/atlas/scenes.ts");
const { readoutTex } = await vite.ssrLoadModule("/lib/curriculum/readouts.ts");

function footprintSpan(angle) {
  const group = new Three.Group();
  buildScene("implicit", angle, group);
  const outlines = group.children.filter(
    (child) => child.isLine && child.material?.color?.getHex() === C.pink,
  );
  assert.equal(outlines.length, 1, "one projected footprint outline");
  const positions = outlines[0].geometry.getAttribute("position");
  const xs = Array.from({ length: positions.count }, (_, i) =>
    positions.getX(i),
  );
  const ys = Array.from({ length: positions.count }, (_, i) =>
    positions.getY(i),
  );
  const zs = Array.from({ length: positions.count }, (_, i) =>
    positions.getZ(i),
  );
  assert.ok(
    zs.every((z) => z === 0),
    "projection lies on xy plane",
  );
  group.clear();
  return {
    x: Math.max(...xs) - Math.min(...xs),
    y: Math.max(...ys) - Math.min(...ys),
  };
}

test("sphere tangent projection loses one dimension at the equator", () => {
  const pole = footprintSpan(0);
  const middle = footprintSpan(Math.PI / 3);
  const equator = footprintSpan(Math.PI / 2);
  assert.ok(Math.abs(pole.x - 0.9) < 1e-6);
  assert.ok(Math.abs(pole.y - 0.9) < 1e-6);
  assert.ok(Math.abs(middle.x - pole.x / 2) < 1e-6);
  assert.ok(equator.x < 1e-6);
  assert.ok(Math.abs(equator.y - 0.9) < 1e-6);
});

test("MathML and WebMCP expose the same projection factor and graph limit", async () => {
  const info = sceneInfo("implicit");
  assert.match(info.note, /linearized drawing/u);
  assert.match(info.note, /implicit-function theorem/u);
  const pole = readoutTex("implicit", 0);
  const equator = readoutTex("implicit", Math.PI / 2);
  assert.match(pole, /J_\{xy\}=\|\\cos\\alpha\|\\approx1/u);
  assert.match(equator, /J_\{xy\}=\|\\cos\\alpha\|\\approx0/u);
  for (const expression of [pole, equator]) {
    const html = katex.renderToString(expression, {
      throwOnError: true,
      strict: "error",
      output: "htmlAndMathml",
    });
    assert.match(html, /<math\b/u);
    assert.doesNotMatch(html, /katex-error/u);
  }
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const state = {
    visualLayout: "split",
    sidebarOpen: false,
    route: "lesson",
    course: "MH2100",
    search: "",
    concept: concepts.find(
      (item) => item.id === "implicit-functions-and-tangents",
    ),
    activeScene: "implicit",
    p: Math.PI / 2,
    info,
    noteTab: "intuition",
    playing: false,
    graph: {},
  };
  const tool = studyTools(concepts, () => state).find(
    (item) => item.name === "get_study_state",
  );
  const response = tool.execute({});
  assert.equal(response.parameter, Math.PI / 2);
  assert.equal(response.mathematicalReadoutTex, equator);
  assert.equal(
    response.mathematicalReadoutTexFormat,
    "LaTeX for typeset display",
  );
  assert.match(response.mathematicalReadout, /solve locally for x/u);
});
