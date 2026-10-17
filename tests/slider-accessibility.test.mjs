import assert from "node:assert/strict";
import test, { after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const scratch = await mkdtemp(path.join(tmpdir(), "calculus-slider-"));
const vite = await createServer({
  root,
  cacheDir: path.join(scratch, "cache"),
  appType: "custom",
  configFile: false,
  logLevel: "silent",
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(async () => {
  await vite.close();
  await rm(scratch, { recursive: true, force: true });
});

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
