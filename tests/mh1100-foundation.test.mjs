import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const guides = JSON.parse(
  await readFile(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
  ),
);
const ledger = JSON.parse(
  await readFile(
    new URL("../lib/curriculum/outcome-ledger.json", import.meta.url),
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
      "base-derivatives-from-definition",
      "binomial-theorem-for-integer-power-proof",
      "binomial-increment-expansion",
      "positive-power-rule-from-binomial-limit",
      "linearity-rules-at-a-point",
      "linearity-difference-quotient-proof",
      "linearity-polynomial-example",
      "product-rule-pointwise-hypotheses",
      "quotient-rule-pointwise-hypotheses",
      "quotient-rule-difference-quotient-proof",
      "sum-of-cubes-quotient-example",
      "negative-integer-power-rule-statement",
      "negative-integer-power-rule-proof",
      "real-power-rule-positive-domain",
      "square-root-real-power-example",
      "tangent-normal-line-equations",
      "source-tangent-normal-example",
      "product-quotient-misrule-diagnosis",
      "radian-convention-and-trig-limits",
      "degree-input-contrast",
      "sine-derivative-definition-proof",
      "cosine-derivative-definition-proof",
      "sine-cosine-rules-all-real",
      "sine-cosine-linear-combination-example",
      "tangent-derivative-quotient-proof",
      "reciprocal-trig-rules-with-domains",
      "reciprocal-trig-quotient-derivations",
      "constant-and-identity-derivative-statements",
      "positive-integer-power-rule-statement",
      "preserve-domain-when-canceling",
      "common-misrule-check",
      "tangent-derivative-domain-statement",
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
    const blockIds = guide.supplementalBlocks.map((block) => block.id);
    assert.deepEqual(blockIds, expected);
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

test("Lecture 06 second derivative uses a new quotient and independent transfer", () => {
  const guide = guides["differentiability-corners"];
  const worked = guide.contentBlocks.find(
    (block) => block.id === "second-derivative-from-definition",
  );
  const exercise = guide.exercises.find(
    (item) => item.id === "second-derivative-definition-transfer",
  );
  const outcome = ledger.atomic_outcomes.find(
    (item) =>
      item.id === "differentiability-corners:second-derivative-definition",
  );
  assert.equal(worked.kind, "worked-example");
  assert.ok(
    worked.steps.some((step) => step.equation.includes("f'(x+h)-f'(x)")),
  );
  assert.ok(exercise.prompt.includes("g'(x+h)-g'(x)"));
  assert.deepEqual(outcome.core_source.page_validation.pages, [24, 25]);
  assert.equal(outcome.evidence.visualized.length, 0);
  assert.equal(outcome.evidence.checked.length, 0);

  for (const x of [-2, 0, 1.5]) {
    for (const h of [-0.1, 0.1]) {
      const sourcePrime = (t) => 3 * t * t - 1;
      const transferPrime = (t) => 3 * t * t + 4 * t;
      assert.ok(
        Math.abs((sourcePrime(x + h) - sourcePrime(x)) / h - (6 * x + 3 * h)) <
          1e-10,
      );
      assert.ok(
        Math.abs(
          (transferPrime(x + h) - transferPrime(x)) / h - (6 * x + 3 * h + 4),
        ) < 1e-10,
      );
    }
  }
});
