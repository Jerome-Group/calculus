import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { unmarkedNotation } from "./helpers/math-notation.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

function ordinaryText(html) {
  const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  const stack = [];
  let text = "";
  for (const token of html.match(/<[^>]+>|[^<]+/g) ?? []) {
    const tag = token.match(/^<\s*(\/?)\s*([a-z][\w:-]*)\b([^>]*)>/i);
    if (!tag) {
      if (!stack.some((entry) => entry.excluded))
        text += token.replace(
          /&(?:#(\d+)|#x([\da-f]+)|amp|lt|gt|quot|apos|nbsp);/gi,
          (entity, decimal, hex) => {
            if (decimal) return String.fromCodePoint(Number(decimal));
            if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
            return {
              "&amp;": "&",
              "&lt;": "<",
              "&gt;": ">",
              "&quot;": '"',
              "&apos;": "'",
              "&nbsp;": " ",
            }[entity.toLowerCase()];
          },
        );
      continue;
    }
    const [, closing, name, attributes] = tag;
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name.toLowerCase()) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const lowerName = name.toLowerCase();
    const className = attributes.match(/\bclass="([^"]*)"/)?.[1] ?? "";
    const excluded =
      stack.some((entry) => entry.excluded) ||
      ["code", "math", "script", "style", "textarea"].includes(lowerName) ||
      /(?:^|\s)(?:katex|sr-only|visually-hidden)(?:\s|$)/.test(className) ||
      /\baria-hidden="true"/.test(attributes);
    if (!voidTags.has(lowerName) && !/\/\s*>$/.test(token))
      stack.push({ name: lowerName, excluded });
  }
  return text;
}

function assertNoUnmarkedVisibleMath(html, label) {
  const visibleText = ordinaryText(html);
  assert.doesNotMatch(visibleText, unmarkedNotation, label);
  assert.doesNotMatch(html, /katex-error/, label);
  assert.match(html, /<math\b/, `${label} has rendered MathML`);
}

test("block equations expose a named keyboard scroll region and MathML", async () => {
  const { Formula } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const equation = String.raw`\forall\varepsilon>0\;\exists\delta>0:\;|x-a|<\delta`;
  const block = renderToStaticMarkup(
    React.createElement(Formula, { block: true }, equation),
  );
  const inline = renderToStaticMarkup(
    React.createElement(Formula, null, equation),
  );

  assert.match(block, /role="region"/);
  assert.match(
    block,
    /aria-label="Mathematical expression; scroll horizontally if needed"/,
  );
  assert.match(block, /tabindex="0"/);
  assert.match(block, /<math\b/);
  assert.doesNotMatch(inline, /role="region"|tabindex="0"/);
  assert.match(inline, /<math\b/);
});

test("graph expression and reported implicit theorem render MathML", async () => {
  const { ExpressionPreview } = await vite.ssrLoadModule(
    "/components/atlas/expression-preview.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const graph = renderToStaticMarkup(
    React.createElement(ExpressionPreview, {
      graph: { ...initialGraph, expressions: ["x^2+y^2-a"] },
    }),
  );
  const theorem = renderToStaticMarkup(
    React.createElement(MathText, {
      text: learningGuides["implicit-functions-and-tangents"].sections[0].text,
    }),
  );
  for (const html of [graph, theorem]) {
    assert.match(html, /<math\b/);
    assert.doesNotMatch(html, /katex-error/);
  }
  assert.match(graph, /<msup>/);
  assert.match(theorem, /<msub>/);
});

test("Graph Studio and the sampled implicit lesson keep math out of ordinary text nodes", async () => {
  const { GraphStudio } = await vite.ssrLoadModule(
    "/components/atlas/graph-studio.tsx",
  );
  const { QuickGraphExpression } = await vite.ssrLoadModule(
    "/components/atlas/quick-graph-expression.tsx",
  );
  const { LessonExperiment } = await vite.ssrLoadModule(
    "/components/atlas/lesson-experiment.tsx",
  );
  const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");
  const { sceneInfo } = await vite.ssrLoadModule("/lib/atlas/scenes.ts");
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const graphState = {
    ...initialGraph,
    expressions: ["x^2+y^2-a"],
  };
  const graphStudio = renderToStaticMarkup(
    React.createElement(GraphStudio, {
      study: {
        status: "Ready",
        graph: graphState,
        setGraph() {},
        draft: graphState,
        setDraft() {},
        graphError: "",
        plot() {},
        rendered() {},
      },
    }),
  );
  assert.match(
    graphStudio,
    /aria-label="Quick graph expression"[^>]*value="x\^2\+y\^2-a"/,
  );
  assert.match(graphStudio, /quick-graph-expression-display/);
  assert.match(graphStudio, /quick-graph-edit/);
  assert.match(graphStudio, /<msup>/);
  for (const syntax of [
    "sqrt(x^2+y^2)",
    "exp(-x^2-y^2)",
    "x &gt; 0 ? x^2 : -x",
  ])
    assert.ok(graphStudio.includes(syntax), `paired syntax example ${syntax}`);
  assertNoUnmarkedVisibleMath(graphStudio, "Graph Studio");

  const invalid = renderToStaticMarkup(
    React.createElement(QuickGraphExpression, {
      value: "sqrt(",
      onChange() {},
    }),
  );
  assert.match(invalid, /<code>sqrt\(<\/code>/);
  assert.match(invalid, /aria-label="Quick graph expression"/);

  const concept = concepts.find(
    (item) => item.id === "implicit-functions-and-tangents",
  );
  const implicitLesson = renderToStaticMarkup(
    React.createElement(LessonExperiment, {
      study: {
        planar: null,
        visualLayout: "split",
        setVisualLayout() {},
        p: 0.5,
        setP() {},
        playing: false,
        setPlaying() {},
        resetKey: 0,
        setReset() {},
        concept,
        readingMode: "explore",
        activeScene: "implicit",
        info: sceneInfo("implicit"),
        chooseModel() {},
      },
    }),
  );
  assertNoUnmarkedVisibleMath(implicitLesson, "implicit lesson at p=0.5");
});

test("all 125 lesson scenes render their initial learner-facing surfaces without raw math text", async () => {
  const { LessonExperiment } = await vite.ssrLoadModule(
    "/components/atlas/lesson-experiment.tsx",
  );
  const { sceneInfo } = await vite.ssrLoadModule("/lib/atlas/scenes.ts");
  const { planarModel } = await vite.ssrLoadModule("/lib/curriculum/planar.ts");
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  assert.equal(concepts.length, 125);
  for (const concept of concepts) {
    const scene = concept.scene;
    const isPlanar = scene.startsWith("plane-");
    const info = isPlanar
      ? {
          ...planarModel(scene),
          readout: (parameter) => planarModel(scene, parameter).readout,
          legend: [],
        }
      : sceneInfo(scene);
    const parameter = info.initial;
    const html = renderToStaticMarkup(
      React.createElement(LessonExperiment, {
        study: {
          planar: isPlanar ? planarModel(scene, parameter) : null,
          visualLayout: "split",
          setVisualLayout() {},
          p: parameter,
          setP() {},
          playing: false,
          setPlaying() {},
          resetKey: 0,
          setReset() {},
          concept,
          readingMode: "explore",
          activeScene: scene,
          info,
          chooseModel() {},
        },
      }),
    );
    assertNoUnmarkedVisibleMath(
      html,
      `${concept.id} / ${scene} at ${parameter}`,
    );
  }
});

test("graph_function keeps the WebMCP expression connected to the typeset preview", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { ExpressionPreview } = await vite.ssrLoadModule(
    "/components/atlas/expression-preview.tsx",
  );
  const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");
  const { readoutTex } = await vite.ssrLoadModule(
    "/lib/curriculum/readouts.ts",
  );
  const oldRequestAnimationFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  const state = {
    visualLayout: "split",
    sidebarOpen: false,
    route: "graph",
    readingMode: "explore",
    course: "MH2100",
    search: "",
    concept: { id: "implicit-functions-and-tangents" },
    activeScene: null,
    p: 0,
    info: { min: 0, max: 1, step: 0.1 },
    noteTab: "intuition",
    playing: false,
    graph: initialGraph,
    async plotAndWait(graph) {
      this.graph = graph;
    },
  };
  try {
    const tool = studyTools([], () => state).find(
      (item) => item.name === "graph_function",
    );
    const result = await tool.execute({ expression: "x^2+y^2-a" });
    assert.equal(result.graph.expressions[0], "x^2+y^2-a");
    assert.equal(result.mathematicalReadoutFormat, "plain-text compatibility");
    assert.equal(
      result.mathematicalReadoutTexFormat,
      "LaTeX for typeset display",
    );
    const preview = renderToStaticMarkup(
      React.createElement(ExpressionPreview, { graph: result.graph }),
    );
    assert.match(preview, /<math\b/);
    assert.match(preview, /<msup>/);
    assert.doesNotMatch(preview, /katex-error/);

    state.activeScene = "differential";
    state.info = {
      min: 0,
      max: 1,
      step: 0.1,
      readout: () => "Dᵤf(0)=1",
    };
    const stateTool = studyTools([], () => state).find(
      (item) => item.name === "get_study_state",
    );
    const snapshot = stateTool.execute({});
    assert.equal(snapshot.mathematicalReadout, "Dᵤf(0)=1");
    assert.equal(
      snapshot.mathematicalReadoutTex,
      readoutTex("differential", 0),
    );
    assert.equal(
      snapshot.mathematicalReadoutFormat,
      "plain-text compatibility",
    );
    assert.equal(
      snapshot.mathematicalReadoutTexFormat,
      "LaTeX for typeset display",
    );
  } finally {
    globalThis.requestAnimationFrame = oldRequestAnimationFrame;
  }
});
