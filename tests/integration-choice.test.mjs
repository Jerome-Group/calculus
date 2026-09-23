import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guides = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    "utf8",
  ),
);
const ledger = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/outcome-ledger.json", import.meta.url),
    "utf8",
  ),
);
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("fixed region and axis give the same shell and washer volume", () => {
  const washers = Math.PI * (1 / 3 - 1 / 5);
  const shells = 2 * Math.PI * (2 / 5 - 1 / 3);
  near(washers, shells);
  near(shells, (2 * Math.PI) / 15);
  assert.ok(
    guides["cylindrical-shells"].sections.some((section) =>
      section.text.includes("SAME region"),
    ),
  );
  assert.ok(
    guides["cylindrical-shells"].exercise.prompt.includes(
      "both shells and perpendicular disks",
    ),
  );
});

test("noncircular cross-section transfer uses triangle area", () => {
  const squaredWidthIntegral = 1 / 3 - 1 / 2 + 1 / 5;
  near((Math.sqrt(3) / 4) * squaredWidthIntegral, Math.sqrt(3) / 120);
  assert.ok(
    guides["disk-washer-volumes"].exercise.prompt.includes(
      "equilateral triangles",
    ),
  );
});

test("trigonometric branches and staged algebra give consistent answers", () => {
  near(Math.acosh(2), Math.log(2 + Math.sqrt(3)));
  near(1 / (9 * Math.sqrt(2)), Math.sqrt(2) / 18);
  near(Math.atan(1) - 1 / 2, Math.PI / 4 - 1 / 2);
  for (const x of [0.2, 2]) {
    const decomposed = 3 / x - 3 / (x + 1) - 1 / (x + 1) ** 2;
    near(decomposed, (2 * x + 3) / (x * (x + 1) ** 2));
  }
  assert.ok(
    guides["trigonometric-substitution"].exercise.prompt.includes("branches"),
  );
  assert.ok(
    guides["integration-by-parts"].exercise.prompt.includes(
      "Choose and justify",
    ),
  );
  assert.ok(
    guides["partial-fractions"].exercise.prompt.includes(
      "first algebraic step",
    ),
  );
});

test("improper partial fractions divide first and transfer across poles", () => {
  const guide = guides["partial-fractions"];
  const worked = guide.supplementalBlocks.find(
    (block) => block.id === "divide-then-decompose-repeated-factor",
  );
  const transfer = guide.exercises.find(
    (exercise) => exercise.id === "improper-repeated-factor-transfer",
  );
  assert.equal(worked.kind, "derivation");
  assert.equal(transfer.kind, "method-choice");
  assert.match(transfer.prompt, /division comes first/);
  for (const x of [-3, 0, 3]) {
    const sourceDenominator = x ** 3 - x ** 2 - x + 1;
    const sourceIntegrand =
      (x ** 4 - 2 * x ** 2 + 4 * x + 1) / sourceDenominator;
    const sourceDecomposition =
      x + 1 + 1 / (x - 1) + 2 / (x - 1) ** 2 - 1 / (x + 1);
    near(sourceIntegrand, sourceDecomposition);

    const transferDenominator = (x + 1) ** 2 * (x - 2);
    const transferIntegrand =
      (x ** 4 - 3 * x ** 2 - 3 * x - 7) / transferDenominator;
    const derivativeOfSolution =
      x + 1 / (x + 1) + 2 / (x + 1) ** 2 - 1 / (x - 2);
    near(transferIntegrand, derivativeOfSolution);
  }
  const outcome = ledger.atomic_outcomes.find(
    (entry) => entry.id === "partial-fractions:divide-before-decompose",
  );
  assert.deepEqual(outcome.core_source.page_validation.pages, [21, 23, 24]);
  assert.equal(outcome.evidence.worked.length, 1);
  assert.equal(outcome.evidence.practiced.length, 1);
  assert.deepEqual(outcome.evidence.checked, []);
});
