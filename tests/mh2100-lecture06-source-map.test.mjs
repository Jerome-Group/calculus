import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  inspectNotation,
  inspectTexSemantics,
} from "./helpers/math-notation.mjs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sources = read("../lib/curriculum/sources.json");
const sourceManifest = read("../lib/curriculum/source-manifest.json");
const sourceId = "MH2100_Lecture_06";
const sourceSha =
  "653b25f9e66353ab059fd79147c10030c975c802ad9951449b2eb7648f7014ec";
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const sectionSpecs = [
  {
    id: sourceId + ":01",
    span: "2–12",
    concepts: ["linearity-additivity"],
    ids: [
      "linearity-additivity:lecture06-linear-combination-integral",
      "linearity-additivity:lecture06-restricted-domain-integral",
      "linearity-additivity:lecture06-additivity-null-overlap",
      "linearity-additivity:lecture06-decompose-nonsimple-region",
      "linearity-additivity:lecture06-three-piece-integral-example",
    ],
    pages: [[3], [4], [5], [6], [7, 8, 9, 10, 11, 12]],
    exclusionPages: [1],
  },
  {
    id: sourceId + ":02",
    span: "13–18",
    concepts: ["polar-rectangles"],
    ids: [
      "polar-rectangles:lecture06-polar-rectangle-image",
      "polar-rectangles:lecture06-annular-cell-area-factor",
      "polar-rectangles:lecture06-polar-volume-riemann-sum",
      "polar-rectangles:lecture06-polar-rectangle-integration-theorem",
      "polar-rectangles:lecture06-annular-sector-integral",
    ],
    pages: [[13], [14], [15], [16], [17, 18]],
    exclusionPages: [],
  },
  {
    id: sourceId + ":03",
    span: "19–23",
    concepts: ["polar-regions"],
    ids: [
      "polar-regions:lecture06-single-interval-polar-region",
      "polar-regions:lecture06-variable-radial-integration",
      "polar-regions:lecture06-shifted-disk-volume",
    ],
    pages: [[19], [20], [21, 22, 23]],
    exclusionPages: [],
  },
];
const outcomeById = new Map(
  ledger.atomic_outcomes.map((outcome) => [outcome.id, outcome]),
);
const lessonIds = sectionSpecs.flatMap((section) => section.concepts);
const newOutcomes = sectionSpecs.flatMap((section) =>
  section.ids.map((id, index) => ({
    id,
    pages: section.pages[index],
    sectionId: section.id,
    conceptId: section.concepts[0],
  })),
);
const newBlockIds = newOutcomes.flatMap(({ id }) => {
  const skill = id.split(":")[1];
  return [skill + "-statement", skill + "-worked"];
});
const newExerciseIds = newOutcomes.map(
  ({ id }) => id.split(":")[1].replace(/^lecture06-/, "") + "-transfer",
);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

function simpson(fn, left, right, intervals = 2000) {
  const width = (right - left) / intervals;
  let sum = fn(left) + fn(right);
  for (let index = 1; index < intervals; index++)
    sum += (index % 2 === 0 ? 2 : 4) * fn(left + index * width);
  return (sum * width) / 3;
}
function close(actual, expected, tolerance = 1e-10) {
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} should be within ${tolerance} of ${expected}`,
  );
}
function inspectNewGuide(value, locator, failures, key = "") {
  if (typeof value === "string") {
    if (["equation", "solutionTex", "tex"].includes(key))
      inspectTexSemantics(value, locator, failures);
    else inspectNotation(value, locator, failures);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectNewGuide(item, `${locator}[${index}]`, failures, key),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [childKey, child] of Object.entries(value))
    inspectNewGuide(child, `${locator}.${childKey}`, failures, childKey);
}

test("canonical Lecture 06 page map and stable routes are exact", () => {
  assert.equal(sources[sourceId].file, "MH2100_Lecture_06.pdf");
  assert.equal(sources[sourceId].pages, 23);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.deepEqual(sources[sourceId].errata ?? [], []);
  const manifest = sourceManifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(manifest?.status, "canonical");
  assert.equal(manifest?.sha256, sourceSha);
  assert.equal(manifest?.driveFileId, "1G0gF6HAaKPbmssGHZsjEIhLaiZhY4YxD");
  assert.deepEqual(manifest?.affectedConcepts, lessonIds);

  for (const spec of sectionSpecs) {
    const section = ledger.source_sections.find((item) => item.id === spec.id);
    assert.ok(section, spec.id);
    assert.equal(section.source_id, sourceId);
    assert.equal(section.physical_page_span, spec.span);
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.deepEqual(section.linked_concept_ids, spec.concepts);
    assert.deepEqual(section.atomic_outcome_ids, spec.ids);
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, spec.id + " " + state);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
    assert.deepEqual(
      section.reviewed_exclusions.map((item) => item.physical_page),
      spec.exclusionPages,
    );
    const [first, last] = spec.span.split("–").map(Number);
    for (const page of section.inspected_physical_pages)
      assert.ok(page >= first && page <= last, spec.id + " page " + page);
    assert.match(section.gap, /scene alignment/u);
    assert.match(section.gap, /learner performance/u);
  }
  const split = ledger.source_sections.find(
    (item) => item.id === sourceId + ":01",
  );
  assert.match(split.source_review_notes.join(" "), /1304\/105/u);
  assert.match(
    split.source_review_notes.join(" "),
    /no mathematical correction/u,
  );
  const polar = ledger.source_sections.find(
    (item) => item.id === sourceId + ":02",
  );
  assert.match(
    polar.source_review_notes.join(" "),
    /nonnegative integrand for volume/u,
  );
  assert.match(polar.source_review_notes.join(" "), /−14\/3/u);
  const variable = ledger.source_sections.find(
    (item) => item.id === sourceId + ":03",
  );
  assert.match(variable.source_review_notes.join(" "), /5π\/2/u);
  assert.equal(lessonIds.length, 3);
  assert.deepEqual(
    concepts
      .filter((concept) => lessonIds.includes(concept.id))
      .map((item) => item.id),
    lessonIds,
  );
});

test("each Lecture 06 skill has page evidence, route evidence, and honest scene limits", () => {
  assert.equal(newOutcomes.length, 13);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const expected of newOutcomes) {
    const outcome = outcomeById.get(expected.id);
    assert.ok(outcome, expected.id);
    assert.equal(outcome.concept_id, expected.conceptId);
    assert.equal(outcome.source_section_id, expected.sectionId);
    assert.equal(outcome.core_source.id, sourceId);
    assert.equal(outcome.core_source.sha256, sourceSha);
    assert.deepEqual(outcome.core_source.page_validation.pages, expected.pages);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.match(
      outcome.core_source.page_validation.method,
      /SHA-256 matched sources\.json/u,
    );
    assert.match(
      outcome.core_source.page_validation.method,
      /rendered and visually checked/u,
    );
    assert.ok(outcome.core_source.page_validation.claim_observed);
    assert.ok(expected.pages.includes(outcome.core_source.physical_page));
    assert.equal(outcome.verification, "source_page_and_cited_guide_inspected");
    assert.deepEqual(Object.keys(outcome.evidence), states);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(
        outcome.evidence[state].length,
        1,
        `${expected.id} ${state}`,
      );
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
    assert.match(outcome.gap, /scene alignment/u);
    assert.match(outcome.gap, /learner performance/u);
    assert.match(
      outcome.evidence.named[0].claim,
      /broader catalog title remains a parent-topic label/u,
    );
    assert.match(
      outcome.evidence.named[0].method,
      /did not infer atomic naming/u,
    );

    const lesson = guides[expected.conceptId];
    const blocks = [
      ...(lesson.contentBlocks ?? []),
      ...(lesson.supplementalBlocks ?? []),
    ];
    const strategy = blocks.find((block) =>
      outcome.evidence.named[0].locator.endsWith(`[${block.id}].title`),
    );
    assert.equal(strategy?.kind, "strategy", expected.id + " named block");
    assert.notEqual(
      strategy.title,
      concepts.find((item) => item.id === expected.conceptId).title,
    );
    const stated = blocks.find((block) =>
      outcome.evidence.stated[0].locator.endsWith(`[${block.id}]`),
    );
    const worked = blocks.find((block) =>
      outcome.evidence.worked[0].locator.endsWith(`[${block.id}]`),
    );
    const practice = lesson.exercises.find((exercise) =>
      outcome.evidence.practiced[0].locator.endsWith(`[${exercise.id}]`),
    );
    assert.equal(stated?.kind, "strategy", expected.id + " statement");
    assert.equal(worked?.kind, "worked-example", expected.id + " worked block");
    assert.ok(
      practice?.prompt &&
        practice.hint &&
        practice.solution &&
        practice.solutionTex,
      expected.id + " transfer",
    );
    assert.ok(practice.rubric.length >= 2, expected.id + " rubric");
    assert.ok(
      concepts
        .find((item) => item.id === expected.conceptId)
        .sources.some(
          (reference) =>
            reference.sourceId === sourceId &&
            reference.pages[0] <= outcome.core_source.physical_page &&
            reference.pages[1] >= outcome.core_source.physical_page,
        ),
      expected.id + " catalog source locator",
    );
  }
  for (const id of newBlockIds) {
    const owners = lessonIds.filter((lessonId) =>
      guides[lessonId].contentBlocks.some((block) => block.id === id),
    );
    assert.equal(owners.length, 1, id);
  }
  for (const id of newExerciseIds) {
    const owners = lessonIds.filter((lessonId) =>
      guides[lessonId].exercises.some((exercise) => exercise.id === id),
    );
    assert.equal(owners.length, 1, id);
  }
});

test("source examples and transfer calculations agree with independent integration", () => {
  close(2 * 1.5 - 3 * 0.5, 1.5);
  close(
    simpson((x) => x, 0, 1),
    0.5,
  );
  close((4 * 4) / 2, 8);
  const lShapeLeft = simpson((x) => simpson((y) => x + y, 0, 2), 0, 2);
  const lShapeRight = simpson((x) => simpson((y) => x + y, 0, 1), 2, 3);
  close(lShapeLeft, 8);
  close(lShapeRight, 3);
  close(lShapeLeft + lShapeRight, 11);
  const leftDiamondPiece = simpson((x) => 2 * (x + 3), -3, 0);
  const rightDiamondPiece = simpson((x) => 2 * (3 - x), 0, 3);
  close(leftDiamondPiece, 9);
  close(rightDiamondPiece, 9);
  close(leftDiamondPiece + rightDiamondPiece, 18);
  const diamondTransfer = guides["linearity-additivity"].exercises.find(
    (exercise) => exercise.id === "decompose-nonsimple-region-transfer",
  );
  assert.match(diamondTransfer.solution, /area \$9\$ each; total area is 18/u);
  assert.ok(diamondTransfer.solutionTex.includes("9+9=18"));
  const d1 = (x) => 2 * x * (x + 2) ** 2 + 2.5 * (x + 2) ** 4;
  const upper = (y) => y - y ** 3 / 16;
  const d2 = (y) => upper(y) ** 2 + 5 * y * upper(y);
  const d3 = (y) => {
    const x = upper(y);
    return x ** 2 + 5 * y * x - 4 + 10 * y;
  };
  close(simpson(d1, -2, 0), 40 / 3);
  close(simpson(d2, 0, 4), 1664 / 35);
  close(simpson(d3, -4, 0), -1696 / 35);
  close(40 / 3 + 1664 / 35 - 1696 / 35, 1304 / 105);
  close(((2 ** 2 - 1 ** 2) / 2) * Math.PI, (3 * Math.PI) / 2);
  const annularRadialIntegral = (2 ** 3 - 1 ** 3) / 3;
  const annularAngularIntegral =
    Math.sin((3 * Math.PI) / 2) -
    Math.sin(Math.PI / 2) -
    Math.cos((3 * Math.PI) / 2) +
    Math.cos(Math.PI / 2);
  close(annularRadialIntegral * annularAngularIntegral, -14 / 3);
  close(
    simpson(
      (theta) => Math.sin(theta) * simpson((r) => r ** 2, 0, 3),
      0,
      Math.PI / 2,
    ),
    9,
  );
  close(
    simpson(
      (theta) =>
        0.5 * ((2 + Math.cos(theta)) ** 2 - (1 + Math.cos(theta)) ** 2),
      0,
      Math.PI / 2,
    ),
    1 + (3 * Math.PI) / 4,
  );
  close(
    simpson((theta) => 0.5 * (1 + Math.cos(theta)) ** 2, 0, Math.PI / 2),
    1 + (3 * Math.PI) / 8,
  );
  close(
    simpson((theta) => 0.5 * (2 + Math.sin(theta)) ** 2, 0, Math.PI),
    4 + (9 * Math.PI) / 4,
  );
  close(
    simpson(
      (theta) => simpson((r) => (r * Math.cos(theta) + 3) * r, 0, 2),
      0,
      Math.PI / 2,
    ),
    8 / 3 + 3 * Math.PI,
  );
  const polarVolumeTransfer = guides["polar-rectangles"].exercises.find(
    (exercise) => exercise.id === "polar-volume-riemann-sum-transfer",
  );
  assert.ok(
    polarVolumeTransfer.solutionTex.includes("\\sum_{i,j}\\Delta V_{ij}"),
  );
  assert.ok(
    polarVolumeTransfer.solutionTex.includes("\\int_0^{\\pi/2}\\int_0^2"),
  );
  assert.ok(polarVolumeTransfer.solutionTex.includes("3\\pi+\\frac{8}{3}"));
  close(8 * (Math.PI / 2) - 4 * ((3 * Math.PI) / 8), (5 * Math.PI) / 2);
  close(18 * (Math.PI / 2) - 4 * ((3 * Math.PI) / 8), (15 * Math.PI) / 2);
  const polar = guides["polar-regions"].contentBlocks.find(
    (block) => block.id === "lecture06-shifted-disk-volume-worked",
  );
  assert.match(polar.steps[0].equation, /2\\cos\\theta/u);
  assert.match(polar.steps[0].text, /origin/u);
});

test("new Lecture 06 guide strings use complete LaTeX and pass semantic notation checks", () => {
  const failures = [];
  for (const conceptId of lessonIds) {
    const guide = guides[conceptId];
    const blocks = (guide.contentBlocks ?? []).filter((block) =>
      block.id.startsWith("lecture06-"),
    );
    const exercises = guide.exercises.filter((item) =>
      newExerciseIds.includes(item.id),
    );
    inspectNewGuide(blocks, conceptId + ".contentBlocks", failures);
    inspectNewGuide(exercises, conceptId + ".exercises", failures);
  }
  assert.deepEqual(failures, []);
});

test("WebMCP serves each stable Lecture 06 route, source block, practice, and MathML", async () => {
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts: appConcepts } = await vite.ssrLoadModule(
    "/lib/curriculum/index.ts",
  );
  const readConcept = studyTools(appConcepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  assert.ok(readConcept);
  for (const conceptId of lessonIds) {
    const response = readConcept.execute({ conceptId });
    const lesson = response.lesson;
    const expectedBlocks = guides[conceptId].contentBlocks.filter((block) =>
      block.id.startsWith("lecture06-"),
    );
    const expectedExercises = guides[conceptId].exercises.filter((item) =>
      newExerciseIds.includes(item.id),
    );
    for (const block of expectedBlocks) {
      assert.ok(
        lesson.contentBlocks.some((item) => item.id === block.id),
        block.id,
      );
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      if (JSON.stringify(block).includes("$"))
        assert.match(markup, /<math\b/u, block.id);
      assert.doesNotMatch(markup, /katex-error/u, block.id);
    }
    for (const exercise of expectedExercises) {
      assert.ok(
        lesson.exercises.some((item) => item.id === exercise.id),
        exercise.id,
      );
      const prose = [exercise.prompt, exercise.hint, exercise.solution].join(
        " ",
      );
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      assert.match(proseMarkup, /<math\b/u, exercise.id + " prose MathML");
      assert.doesNotMatch(proseMarkup, /katex-error/u, exercise.id);
      const solutionMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(
        solutionMarkup,
        /<math\b/u,
        exercise.id + " solution MathML",
      );
      assert.doesNotMatch(solutionMarkup, /katex-error/u, exercise.id);
    }
    assert.equal(response.id, conceptId);
    assert.ok(response.sources.some((item) => item.sourceId === sourceId));
  }
});
