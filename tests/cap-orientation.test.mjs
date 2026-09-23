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

test("closing and orienting the cap controls theorem eligibility and flux sign", async () => {
  const { capDecision } = await vite.ssrLoadModule(
    "/lib/curriculum/cap-orientation.ts",
  );
  const open = capDecision({ closed: false, outward: true, regular: true });
  const positive = capDecision({ closed: true, outward: true, regular: true });
  const negative = capDecision({ closed: true, outward: false, regular: true });
  assert.equal(open.theoremEligible, false);
  assert.equal(open.totalFlux, null);
  assert.equal(positive.theoremEligible, true);
  assert.equal(positive.capFlux, 16 * Math.PI);
  assert.equal(positive.diskFlux, 0);
  assert.equal(positive.totalFlux, 3 * ((16 * Math.PI) / 3));
  assert.equal(negative.theoremEligible, false);
  assert.equal(negative.totalFlux, -positive.totalFlux);
  assert.equal(negative.scalarArea, positive.scalarArea);
  assert.equal(positive.scalarArea, 8 * Math.PI);
});

test("a singularity on the closing disk bars direct theorem use", async () => {
  const { capDecision } = await vite.ssrLoadModule(
    "/lib/curriculum/cap-orientation.ts",
  );
  const singular = capDecision({ closed: true, outward: true, regular: false });
  assert.equal(singular.theoremEligible, false);
  assert.equal(singular.totalFlux, null);
  assert.match(singular.reason, /undefined at the origin/);
  const { CapOrientationDecision } = await vite.ssrLoadModule(
    "/components/atlas/cap-orientation-decision.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(CapOrientationDecision),
  );
  assert.match(html, /Open cap only/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /scalar cap area <span class="formula">/);
  assert.match(
    html,
    /<annotation encoding="application\/x-tex">8\\pi<\/annotation>/,
  );
  assert.doesNotMatch(html, /scalar cap area 8π/);
});
