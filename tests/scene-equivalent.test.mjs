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
  for (const className of ["scene-equation", "scale-note", "live-value"]) {
    assert.match(html, new RegExp(`class="${className}" id="[^"]+"`));
  }
  assert.match(html, /The graph is sampled/);
  assert.match(html, /aria-live="polite"/);
});
