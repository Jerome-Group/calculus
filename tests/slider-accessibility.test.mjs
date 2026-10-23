import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createSsrServer } from "./helpers/ssr-server.mjs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createSsrServer(
  {
    root,
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    resolve: { alias: { "@": root } },
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  },
  after,
);

test("focusable slider controls expose their supplied name and explanation", async () => {
  const { Slider } = await vite.ssrLoadModule("/components/ui/slider.tsx");
  for (const [attribute, value] of [
    ["aria-label", "Expression parameter"],
    ["aria-labelledby", "parameter-label"],
  ]) {
    const html = renderToStaticMarkup(
      React.createElement(Slider, {
        value: [1],
        max: 2,
        [attribute]: value,
        "aria-describedby": "parameter-explanation",
      }),
    );
    const control = html.match(/<[^>]*role="slider"[^>]*>/)?.[0];
    assert.ok(control, "A slider control is rendered");
    assert.match(control, /tabindex="0"/);
    assert.ok(
      control.includes(attribute + '="' + value + '"'),
      "The focusable control exposes its supplied accessible name",
    );
    assert.ok(
      control.includes('aria-describedby="parameter-explanation"'),
      "The focusable control exposes its explanation",
    );
  }
});
