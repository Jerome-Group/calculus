import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const guides = JSON.parse(
  await readFile(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
  ),
);
const concepts = JSON.parse(
  await readFile(new URL("../lib/curriculum/concepts.json", import.meta.url)),
);

test("differentiability path is ordered, resolvable, and reaches the exact review pair", () => {
  const path = [
    "partial-derivatives-as-slices",
    "total-differentiability",
    "partials-do-not-make-a-plane",
    "certifying-differentiability-and-errors",
    "multivariable-chain-rule",
    "directional-derivatives-and-gradient",
    "gradient-normals-and-steepest-ascent",
    "review-total-differentiability",
  ];
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  for (let i = 0; i < path.length; i++) {
    const guide = guides[path[i]];
    assert.ok(conceptIds.has(path[i]));
    assert.ok(guide.supplementalBlocks.length > 0);
    assert.ok(guide.exercises.length > 0);
    if (i < path.length - 1) assert.equal(guide.nextStep.id, path[i + 1]);
  }
  assert.equal(
    guides["partials-do-not-make-a-plane"].relatedStep.id,
    "review-total-differentiability",
  );
  assert.equal(
    guides["certifying-differentiability-and-errors"].relatedStep.id,
    "review-total-differentiability",
  );
  assert.match(
    guides["review-total-differentiability"].supplementalBlocks[0].text,
    /inline controls compare two distinct review functions/i,
  );
});

test("the counterexample, sufficient criterion, and composed rates agree with the stated math", () => {
  for (const t of [0.5, 0.1, 0.01]) {
    const q = t ** 3 / (2 * t ** 2);
    const normalized = Math.abs(q - t) / (Math.SQRT2 * t);
    assert.ok(Math.abs(normalized - 1 / (2 * Math.SQRT2)) < 1e-12);
    const directBound = Math.abs(t * t) / (Math.SQRT2 * t);
    assert.ok(directBound <= (Math.SQRT2 * t) / 2 + 1e-12);
    const composed = t ** 3 * (2 * t) + t ** 2 * (3 * t ** 2);
    assert.ok(Math.abs(composed - 5 * t ** 4) < 1e-12);
  }
  const criterion =
    guides["certifying-differentiability-and-errors"].supplementalBlocks[0];
  assert.equal(criterion.status, "Theorem used without proof");
  assert.match(criterion.hypotheses.join(" "), /neighborhood/);
});
