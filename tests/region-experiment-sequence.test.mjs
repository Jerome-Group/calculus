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

test("physical and transformed slices describe the same shifted disk", async () => {
  const { shiftedDiskVerticalSlice, shiftedDiskRadialBound } =
    await vite.ssrLoadModule("/lib/curriculum/polar-region.ts");
  for (const theta of [
    -Math.PI / 3,
    -Math.PI / 6,
    0,
    Math.PI / 4,
    Math.PI / 2,
  ]) {
    const r = shiftedDiskRadialBound(theta);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const vertical = shiftedDiskVerticalSlice(x);
    assert.ok(vertical);
    assert.ok(Math.abs((x - 1) ** 2 + y ** 2 - 1) < 1e-10);
    assert.ok(y >= vertical.lower - 1e-10);
    assert.ok(y <= vertical.upper + 1e-10);
  }
  assert.equal(shiftedDiskRadialBound(Math.PI), null);
  assert.equal(shiftedDiskVerticalSlice(-0.1), null);
});

test("narrative has ordered independent experiment IDs and visible text equivalents", async () => {
  const { RegionExperimentSequence, shiftedDiskExperiments } =
    await vite.ssrLoadModule(
      "/components/atlas/region-experiment-sequence.tsx",
    );
  assert.deepEqual(
    shiftedDiskExperiments.map((experiment) => experiment.id),
    ["domain", "slice", "transformed-domain"],
  );
  const html = renderToStaticMarkup(
    React.createElement(RegionExperimentSequence),
  );
  assert.match(html, /data-experiment-id="domain"/);
  assert.match(html, /data-experiment-id="slice"/);
  assert.match(html, /data-experiment-id="transformed-domain"/);
  assert.match(html, /vertical slice/i);
  assert.match(html, /parameter region/i);
  assert.match(html, /type="range"/);
  assert.doesNotMatch(html, /<svg viewBox="0 0 (?:320|340) 280"/);
});
