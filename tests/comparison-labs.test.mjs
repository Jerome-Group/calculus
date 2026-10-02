import test, { after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const root = fileURLToPath(new URL("..", import.meta.url));
const cacheDir = await mkdtemp(path.join(os.tmpdir(), "calculus-lab-vite-"));
const vite = await createServer({
  cacheDir,
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => {
  await vite.close();
  await rm(cacheDir, { recursive: true, force: true });
});
const models = await vite.ssrLoadModule("/lib/curriculum/comparison-labs.ts");
const close = (a, b) =>
  assert.ok(Math.abs(a - b) < 1e-10, `${a} differs from ${b}`);
test("path witnesses disagree exactly, and excluded origin remains absent", () => {
  close(models.rayHeight(0), 0);
  close(models.rayHeight(Math.PI / 4), 0.5);
  close(models.rayHeight((3 * Math.PI) / 4), -0.5);
  for (const x of [-1, -0.001, 0.1, 1]) {
    close(models.hiddenPath(x, 1, true).height, 0.5);
    close(models.hiddenPath(x, -1, true).height, -0.5);
    close(models.hiddenPath(x, 0, false).height, 0);
  }
  close(models.hiddenPath(0.001, 2, false).height, 0.002 / 4.000001);
  assert.equal(models.hiddenPath(0, 1, true), null);
});
test("absolute convergence and normalized failure are different facts", () => {
  const large = models.approximationErrors(0.8, Math.PI / 4);
  const small = models.approximationErrors(0.01, Math.PI / 4);
  close(large.bowlAbsolute, 0.64);
  close(small.bowlRelative, 0.01);
  close(small.counterRelative, 1 / (2 * Math.SQRT2));
  close(large.counterRelative, small.counterRelative);
  assert.ok(small.counterAbsolute < large.counterAbsolute);
  close(models.approximationErrors(0.2, 0).counterRelative, 0);
  assert.throws(() => models.approximationErrors(0, 0), RangeError);
});
test("a saddle has positive and negative sections; degeneracy still has minima", () => {
  close(models.saddleSlice(-1, 0).coefficient, 1);
  close(models.saddleSlice(-1, Math.PI / 2).coefficient, -1);
  assert.equal(models.saddleSlice(-1, 0).classification, "saddle");
  assert.equal(models.saddleSlice(1, 0).classification, "strict minimum");
  close(models.saddleSlice(0, Math.PI / 2).coefficient, 0);
  assert.equal(
    models.saddleSlice(0, 0).classification,
    "non-strict minima along x = 0",
  );
});
test("onto cubic clock preserves endpoints and can stop on regular helix", () => {
  for (const endpoint of [-1, 1])
    assert.deepEqual(
      models.helixClock(endpoint, true).point,
      models.helixClock(endpoint, false).point,
    );
  const stopped = models.helixClock(0, true);
  assert.deepEqual(stopped.point, [1, 0, 0]);
  close(stopped.speed, 0);
  close(models.helixClock(0, false).speed, Math.SQRT2);
  close(models.helixClock(0.5, true).t, 0.125);
  close(models.helixClock(0.5, true).speed, 0.75 * Math.SQRT2);
});
test("triangle fibres and annular tile reproduce independent exact integrals", () => {
  assert.deepEqual(models.triangleFibre(0), {
    lower: 0,
    upper: 2,
    innerIntegral: 4,
    mass: 14 / 3,
    area: 2,
  });
  close(models.triangleFibre(1).innerIntegral, 2.5);
  close(models.triangleFibre(2).innerIntegral, 0);
  assert.equal(models.triangleFibre(-0.1), null);
  assert.equal(models.triangleFibre(2.1), null);
  const tile = models.polarTile(1, 0.5, Math.PI / 2);
  close(tile.exactArea, (5 * Math.PI) / 16);
  close(tile.linearArea, Math.PI / 4);
  close(tile.exactArea - tile.linearArea, Math.PI / 16);
  const origin = models.polarTile(0, 2, 2 * Math.PI);
  close(origin.exactArea, 4 * Math.PI);
  close(origin.linearArea, 0);
  assert.throws(() => models.polarTile(1, 0, 1), RangeError);
  assert.throws(() => models.rayHeight(NaN), RangeError);
});
test("all covered labs render labeled ranges, descriptions, predictions and full reset", async () => {
  const { ComparisonLab } = await vite.ssrLoadModule(
    "/components/atlas/comparison-labs.tsx",
  );
  assert.equal(models.comparisonKind("toString"), null);
  assert.equal(models.comparisonKind("nonexistent"), null);
  assert.equal(
    renderToStaticMarkup(
      React.createElement(ComparisonLab, { conceptId: "nonexistent" }),
    ),
    "",
  );
  const covered = models.comparisonCoverage();
  assert.equal(covered.length, 11);
  for (const { conceptId, kind } of covered) {
    assert.equal(models.comparisonKind(conceptId), kind);
    const html = renderToStaticMarkup(
      React.createElement(ComparisonLab, { conceptId }),
    );
    assert.match(html, /type="range"/);
    assert.match(html, /<label[^>]*for=/);
    assert.match(html, /role="img" aria-labelledby=/);
    assert.match(html, /<desc[^>]*>/);
    assert.match(html, /aria-pressed="false"/);
    assert.match(html, /Reset comparison and prediction/);
    assert.doesNotMatch(html, /katex-error/);
  }
});

test("domain projection preserves circles and diagonal angles without clipping path endpoints", () => {
  const [cx, cy] = models.pathProjection(0, 0);
  for (const theta of [
    0,
    Math.PI / 4,
    Math.PI / 2,
    (3 * Math.PI) / 4,
    Math.PI,
  ]) {
    const [x, y] = models.pathProjection(Math.cos(theta), Math.sin(theta));
    close(Math.hypot(x - cx, y - cy), 40);
  }
  const [x, y] = models.pathProjection(1, 1);
  close(Math.abs(x - cx), Math.abs(y - cy));
  for (const k of [-2, 2]) {
    const [px, py] = models.pathProjection(1, k);
    assert.ok(px > 0 && px < 320 && py > 0 && py < 210);
  }
});

test("ray feedback distinguishes axis agreement and rounded heights from diagonal witnesses", () => {
  for (const theta of [0, Math.PI / 2, Math.PI]) {
    const caption = models.rayComparisonCaption(models.rayHeight(theta));
    assert.match(caption, /displayed heights agree/);
    assert.match(caption, /Choose a diagonal/);
    assert.doesNotMatch(caption, /preserves/);
  }
  assert.match(models.rayComparisonCaption(0.00001), /displayed heights agree/);
  for (const theta of [Math.PI / 4, (3 * Math.PI) / 4]) {
    assert.match(
      models.rayComparisonCaption(models.rayHeight(theta)),
      /These heights disagree/,
    );
  }
});
