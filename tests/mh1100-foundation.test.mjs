import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const guides = JSON.parse(
  await readFile(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
  ),
);

test("named MH1100 foundations have purpose-built blocks and independent transfer", () => {
  const paths = {
    "limit-laws-squeeze": ["unit-circle-trig-limit", "rationalized-root-limit"],
    "differentiability-corners": ["higher-derivatives-motion"],
    "differentiation-rules": [
      "basic-rule-families",
      "product-rule-increments",
      "trigonometric-rule-families",
    ],
    "chain-rule-single": ["chain-rule-remainder"],
    "linearization-differentials": [
      "asymptotic-notation-assumptions",
      "quadratic-linearization-remainder",
    ],
    lhopital: [
      "lhopital-zero-zero-one-sided",
      "lhopital-cauchy-bridge",
      "lhopital-infinity-infinity-one-sided",
      "lhopital-convert-product",
    ],
  };
  for (const [id, expected] of Object.entries(paths)) {
    const guide = guides[id];
    assert.deepEqual(
      guide.supplementalBlocks.map((block) => block.id),
      expected,
    );
    assert.ok(
      guide.exercises.length > 0,
      `${id} needs transfer beyond its core exercise`,
    );
    assert.equal(
      new Set(guide.exercises.map((exercise) => exercise.id)).size,
      guide.exercises.length,
    );
    for (const exercise of guide.exercises) {
      assert.ok(exercise.outcome && exercise.prompt && exercise.solution);
      assert.ok(exercise.rubric.length >= 2);
    }
  }
  assert.equal(guides.lhopital.supplementalBlocks[0].status, "Proof sketch");
  assert.equal(
    guides.lhopital.supplementalBlocks[2].status,
    "Theorem used without proof",
  );
});

test("worked limits and higher derivative values are mathematically coherent", () => {
  for (const h of [0.1, 0.01, -0.01]) {
    const original = (Math.sqrt(1 + h) - 1) / h;
    const rationalized = 1 / (Math.sqrt(1 + h) + 1);
    assert.ok(Math.abs(original - rationalized) < 1e-12);
  }
  for (const x of [0.1, 0.01, 0.001]) {
    assert.ok(Math.cos(x) < Math.sin(x) / x);
    assert.ok(Math.sin(x) / x < 1);
  }
  const velocity = (t) => 3 * t * t - 6 * t;
  const acceleration = (t) => 6 * t - 6;
  assert.equal(velocity(1), -3);
  assert.equal(acceleration(1), 0);
  for (const h of [0.1, 0.01, 0.001]) {
    assert.ok(Math.abs(h) ** 1.5 / Math.abs(h) < Math.sqrt(0.1) + 1e-12);
    assert.ok(Math.abs(h) ** 1.5 / (h * h) >= 1 / Math.sqrt(0.1) - 1e-12);
  }
});
