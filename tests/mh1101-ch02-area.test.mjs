import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import katex from "katex";

const guide = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    "utf8",
  ),
)["area-between-curves"];
const ledger = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/outcome-ledger.json", import.meta.url),
    "utf8",
  ),
);

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
const integral = (f, a, b, n = 10000) => {
  const width = (b - a) / n;
  return Array.from({ length: n }, (_, i) => f(a + (i + 0.5) * width)).reduce(
    (sum, value) => sum + value * width,
    0,
  );
};

test("Chapter 02 area source examples and transfers have the claimed values", () => {
  near(
    integral((x) => x * x + 1 - x, 0, 1),
    5 / 6,
  );
  near(
    integral((x) => Math.cos(x) - Math.sin(x), 0, Math.PI / 4) +
      integral((x) => Math.sin(x) - Math.cos(x), Math.PI / 4, Math.PI / 2),
    2 * Math.SQRT2 - 2,
  );
  near(
    integral((x) => 3 - 2 * x * x, -1, 1),
    14 / 3,
  );
  near(
    integral((x) => x * x - x, -1, 0) +
      integral((x) => x - x * x, 0, 1) +
      integral((x) => x * x - x, 1, 2),
    11 / 6,
  );
  const section = ledger.source_sections.find(
    (entry) => entry.id === "MH1101_Chapter_02_Notes:01",
  );
  assert.equal(section.atomic_outcome_ids.length, 2);
  for (const id of section.atomic_outcome_ids) {
    const outcome = ledger.atomic_outcomes.find((entry) => entry.id === id);
    assert.ok(outcome);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
  }
});

test("new area lesson expressions parse to MathML without control escapes", () => {
  let count = 0;
  const strings = [
    ...guide.contentBlocks.flatMap((block) => [
      ...Object.values(block).filter((value) => typeof value === "string"),
      ...(block.steps?.map((step) => step.text) ?? []),
    ]),
    ...guide.exercises.flatMap((exercise) =>
      Object.values(exercise).filter((value) => typeof value === "string"),
    ),
  ];
  for (const value of strings) {
    for (const match of value.matchAll(/\$([^$]+)\$/g)) {
      assert.doesNotMatch(match[1], /[\n\r\t]/);
      const html = katex.renderToString(match[1], {
        throwOnError: true,
        strict: "error",
        output: "htmlAndMathml",
      });
      assert.match(html, /<math\b/);
      count++;
    }
  }
  assert.ok(count >= 25);
});
