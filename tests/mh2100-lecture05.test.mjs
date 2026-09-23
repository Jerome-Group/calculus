import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const section = ledger.source_sections.find(
  (item) => item.id === "MH2100_Lecture_05:01",
);
const skills = [
  ["lagrange-circle:regular-one-constraint-2d", 7, "l05-circle-theorem"],
  ["lagrange-circle:compact-candidate-comparison", 8, "l05-circle-example"],
  ["lagrange-circle:circle-factor-branches", 10, "l05-circle-example"],
  ["lagrange-sphere:regular-one-constraint-3d", 12, "l05-box-method"],
  ["lagrange-sphere:open-box-model", 14, "l05-box-method"],
  ["lagrange-sphere:box-stationary-candidate", 15, "l05-box-candidate"],
  ["lagrange-sphere:noncompact-amgm-certificate", 17, "l05-box-amgm"],
  [
    "lagrange-two-constraints:independent-gradients",
    18,
    "l05-rank-counterexample",
  ],
  [
    "lagrange-two-constraints:source-prompt-feasible-set",
    19,
    "l05-cone-plane-derived",
  ],
];

test("Lecture 05 source outcomes retain physical pages and honest evidence", () => {
  assert.equal(section.coverage_decision, "partial_atomic_mapping");
  assert.equal(section.atomic_outcome_ids.length, skills.length);
  assert.match(section.gap, /20–23 visually blank/);
  for (const [id, page, blockId] of skills) {
    const outcome = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.equal(outcome.core_source.physical_page, page, id);
    assert.match(outcome.core_source.inspection, /7250bc655e8850d1/);
    assert.ok(section.atomic_outcome_ids.includes(id));
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    assert.ok(
      guides[outcome.concept_id].supplementalBlocks.some(
        (block) => block.id === blockId,
      ),
    );
  }
});

test("the source's nonzero pair cannot replace rank two", () => {
  const constraintGradientOne = [1, 0, 0];
  const constraintGradientTwo = [1, 0, 0];
  const objectiveGradient = [0, 1, 0];
  assert.deepEqual(constraintGradientOne, constraintGradientTwo);
  assert.notDeepEqual(objectiveGradient, constraintGradientOne);
  assert.match(
    guides["lagrange-two-constraints"].sections.find(
      (item) => item.title === "Two gradients must have rank two",
    ).text,
    /linearly independent/,
  );
});

test("independent cone-plane and weighted-box calculations satisfy constraints", () => {
  const x = 1 / Math.SQRT2 - 1;
  const y = x;
  const z = Math.SQRT2 - 1;
  assert.ok(Math.abs(z * z - x * x - y * y) < 1e-12);
  assert.ok(Math.abs(x + y - z + 1) < 1e-12);
  assert.ok(Math.abs(x * x + y * y + z * z - 2 * z * z) < 1e-12);
  const unboundedX = 100 - 1;
  const unboundedY = 1 / 200 - 1;
  const unboundedZ = unboundedX + unboundedY + 1;
  assert.ok(
    Math.abs(unboundedZ ** 2 - unboundedX ** 2 - unboundedY ** 2) < 1e-10,
  );
  assert.ok(unboundedX ** 2 + unboundedY ** 2 + unboundedZ ** 2 > 1000);
  const length = Math.sqrt(6);
  const width = length;
  const height = length / 3;
  assert.ok(
    Math.abs(length * width + 3 * length * height + 3 * width * height - 18) <
      1e-12,
  );
  assert.ok(Math.abs(length * width * height - 2 * Math.sqrt(6)) < 1e-12);
});

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("Lecture 05 worked math renders as MathML and reaches WebMCP", async () => {
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const readConcept = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  for (const [conceptId, blockId, exerciseId] of [
    ["lagrange-circle", "l05-circle-example", "l05-circle-transfer"],
    ["lagrange-sphere", "l05-box-amgm", "l05-box-transfer"],
    ["lagrange-two-constraints", "l05-cone-plane-derived", "l05-two-transfer"],
  ]) {
    const guide = guides[conceptId];
    const block = guide.supplementalBlocks.find((item) => item.id === blockId);
    const html = renderToStaticMarkup(
      React.createElement(StructuredLessonBlockView, { block }),
    );
    assert.match(html, /<math\b/, conceptId);
    assert.doesNotMatch(html, /katex-error/, conceptId);
    const result = readConcept.execute({ conceptId });
    assert.ok(
      result.lesson.supplementalBlocks.some((item) => item.id === blockId),
    );
    assert.ok(result.lesson.exercises.some((item) => item.id === exerciseId));
  }
});
