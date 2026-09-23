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

test("scene state has stable rendered targets for the viewport description", async () => {
  const { LessonExperiment } = await vite.ssrLoadModule(
    "/components/atlas/lesson-experiment.tsx",
  );
  const study = {
    planar: null,
    visualLayout: "split",
    setVisualLayout() {},
    p: 0.5,
    setP() {},
    playing: false,
    setPlaying() {},
    resetKey: 0,
    setReset() {},
    concept: {
      id: "test",
      title: "Test scene",
      subtitle: "A sampled scene",
      task: "Inspect the derivative.",
      insight: "Compare the current value.",
    },
    activeScene: "differential",
    info: {
      label: "Parameter",
      min: 0,
      max: 1,
      initial: 0.5,
      step: 0.1,
      legend: ["Sampled surface"],
      note: "The graph is sampled.",
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(LessonExperiment, { study }),
  );
  for (const className of [
    "model-status",
    "scene-equation",
    "scale-note",
    "live-value",
  ]) {
    assert.match(html, new RegExp(`class="${className}" id="[^"]+"`));
  }
  assert.match(html, /The graph is sampled/);
  assert.match(html, /aria-live="polite"/);
});

test("landmark controls use readable pi labels beside typeset values", async () => {
  const { LessonExperiment } = await vite.ssrLoadModule(
    "/components/atlas/lesson-experiment.tsx",
  );
  const study = {
    planar: null,
    visualLayout: "split",
    setVisualLayout() {},
    p: Math.PI / 4,
    setP() {},
    playing: false,
    setPlaying() {},
    resetKey: 0,
    setReset() {},
    concept: {
      id: "test",
      title: "Angle experiment",
      subtitle: "A sampled scene",
      task: "Inspect the value.",
      insight: "Compare the angles.",
    },
    activeScene: "implicit",
    info: {
      label: "Angle",
      min: 0,
      max: Math.PI,
      initial: Math.PI / 4,
      step: 0.01,
      legend: ["Sampled surface"],
      note: "The graph is sampled.",
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(LessonExperiment, { study }),
  );
  assert.match(html, /aria-label="Set parameter to π\/4"/u);
  assert.match(html, /aria-label="Set parameter to π"/u);
  assert.doesNotMatch(html, /aria-label="[^"]*\\pi/u);
  assert.match(html, /<math\b/u);
});

test("planar and spatial graph names avoid source syntax and link math descriptions", async () => {
  const { PlanarViewport } = await vite.ssrLoadModule(
    "/components/atlas/planar-viewport.tsx",
  );
  const { planarModel } = await vite.ssrLoadModule("/lib/curriculum/planar.ts");
  const { viewportAccessibleLabel } = await vite.ssrLoadModule(
    "/components/atlas/viewport.tsx",
  );
  const planar = renderToStaticMarkup(
    React.createElement(PlanarViewport, {
      model: planarModel("plane-limit", 0.5),
      descriptionId: "model-status formula note value",
    }),
  );
  const svg = planar.match(/<svg[^>]+>/u)?.[0] ?? "";
  assert.match(svg, /aria-describedby="model-status formula note value"/u);
  assert.doesNotMatch(svg, /\$|\\[A-Za-z]+/u);

  const spatial = viewportAccessibleLabel("graph", {
    mode: "surface",
    expressions: ["x^2+y^2-a"],
  });
  assert.match(spatial, /Graph studio visualization/u);
  assert.doesNotMatch(spatial, /\$|\\[A-Za-z]+|x\^2/u);
});

test("Graph studio describes the rendered expression separately from the draft", async () => {
  const { GraphStudio } = await vite.ssrLoadModule(
    "/components/atlas/graph-studio.tsx",
  );
  const graph = {
    mode: "surface",
    expressions: ["x^2+y^2-a"],
    min: -2,
    max: 2,
    vmin: -2,
    vmax: 2,
    clip: 5,
    a: 1,
  };
  const html = renderToStaticMarkup(
    React.createElement(GraphStudio, {
      study: {
        status: "Graph rendered",
        graph,
        setGraph() {},
        draft: { ...graph, expressions: ["x^2-y^2"] },
        setDraft() {},
        graphError: "",
        plot() {},
        rendered() {},
      },
    }),
  );
  assert.match(html, /class="sr-only" id="[^"]+">Rendered graph:/u);
  assert.match(html, /<math\b/u);
  assert.match(html, /aria-label="Expression preview"/u);
});
