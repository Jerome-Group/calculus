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

test("exact review residuals distinguish all-direction decay from diagonal obstruction", async () => {
  const { reviewValue, reviewPlane, reviewResidual } = await vite.ssrLoadModule(
    "/lib/curriculum/review-differentiability.ts",
  );
  for (const radius of [0.5, 0.1, 0.01]) {
    for (const angle of [0, Math.PI / 6, Math.PI / 4, Math.PI / 2]) {
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const normalized = reviewResidual("differentiable", x, y);
      assert.ok(normalized >= 0 && normalized <= radius ** 2 + 1e-12);
      assert.ok(
        Math.abs(
          normalized -
            (reviewValue("differentiable", x, y) -
              reviewPlane("differentiable", x)) /
              radius,
        ) < 1e-12,
      );
    }
    const t = radius / Math.SQRT2;
    assert.ok(
      Math.abs(reviewResidual("counterexample", t, t) + 1 / Math.SQRT2) < 1e-12,
    );
    assert.ok(Math.abs(reviewResidual("counterexample", radius, 0)) < 1e-12);
    assert.ok(Math.abs(reviewResidual("counterexample", 0, radius)) < 1e-12);
  }
});

test("inline comparison names both exact functions and leaves sampled meshes inactive", async () => {
  const { ReviewDifferentiabilityExperiments } = await vite.ssrLoadModule(
    "/components/atlas/review-differentiability-experiments.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(ReviewDifferentiabilityExperiments),
  );
  assert.match(html, /data-review-function="differentiable"/);
  assert.match(html, /data-review-function="counterexample"/);
  assert.match(html, /candidate plane/i);
  assert.match(html, /normalized remainder/i);
  assert.match(html, /type="range"/);
  assert.doesNotMatch(html, /viewBox="0 0 360 290"/);
});
