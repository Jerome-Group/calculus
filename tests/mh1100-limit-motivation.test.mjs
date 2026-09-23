import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import katex from "katex";

const guides = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    "utf8",
  ),
);
const limits = guides["limits-one-sided"];
const infinite = guides["infinite-limits"];

const block = (guide, id) =>
  guide.contentBlocks.find((entry) => entry.id === id);

test("source secant and average velocity formulas approach their claimed rates", () => {
  const secant = block(limits, "lecture02-secant-tangent-motivation");
  const velocity = block(limits, "lecture02-cn-tower-velocity-motivation");
  assert.ok(secant && velocity);
  for (const h of [-0.1, -0.001, 0.001, 0.1]) {
    const x = 1 + h;
    const sourceSlope = (x * x - 1) / (x - 1);
    assert.ok(Math.abs(sourceSlope - (2 + h)) < 1e-10);
    const sourceAverage = (4.9 * (5 + h) ** 2 - 4.9 * 25) / h;
    assert.ok(Math.abs(sourceAverage - (49 + 4.9 * h)) < 1e-9);
  }
  assert.match(secant.result, /y=2x-1/);
  assert.match(velocity.result, /downward/);
  assert.ok(
    limits.exercises.some(
      (exercise) => exercise.id === "cubic-secant-tangent-transfer",
    ),
  );
});

test("infinite-limit work uses a deleted neighborhood and valid LaTeX", () => {
  const example = block(infinite, "lecture02-two-sided-infinite-thresholds");
  const transfer = infinite.exercises.find(
    (exercise) => exercise.id === "negative-infinite-threshold-transfer",
  );
  assert.ok(example && transfer);
  assert.match(transfer.solution, /both sides/);
  assert.match(transfer.solution, /-M/);
  for (const equation of example.steps.map((step) => step.equation))
    if (equation)
      assert.doesNotThrow(() =>
        katex.renderToString(equation, { throwOnError: true }),
      );
  assert.doesNotThrow(() =>
    katex.renderToString(transfer.solutionTex, { throwOnError: true }),
  );
});
