import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

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
