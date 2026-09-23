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

test("split annulus exposes two fibers and the false central inclusion", async () => {
  const { RegionBoundsIllustration } = await vite.ssrLoadModule(
    "/components/atlas/region-bounds-illustration.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(RegionBoundsIllustration, {
      lessonId: "linearity-additivity",
    }),
  );
  assert.match(html, /fill-rule="evenodd"/);
  assert.match(html, /minus two to minus one and one to two/);
  assert.match(html, /erroneous inclusion/);
  assert.match(html, /area 3π/);
  assert.equal(4 * Math.PI - Math.PI, 3 * Math.PI);
});

test("offset sphere keeps variable radial bound separate from Jacobian", async () => {
  const { RegionBoundsIllustration } = await vite.ssrLoadModule(
    "/components/atlas/region-bounds-illustration.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(RegionBoundsIllustration, {
      lessonId: "spherical-integration",
    }),
  );
  assert.match(html, /radius cos pi over four/);
  assert.match(html, /cos\\phi/);
  assert.match(html, /ρ² sin φ/);
  assert.match(html, /substitute x, y, z into f/);
  assert.ok(Math.abs(Math.cos(Math.PI / 4) - 1 / Math.sqrt(2)) < 1e-12);
});
