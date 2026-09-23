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
const sourceId = "MH2100_Lecture_07";
const sourceSha =
  "7749dd614cf6b912a05676c4be9594ce13c71eb60373d8721fe6c273245a8478";
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
    span: "2–9",
    concepts: ["triple-riemann-sums"],
    ids: [
      "triple-riemann-sums:lecture07-standard-box-partition",
      "triple-riemann-sums:lecture07-sampling-independent-limit",
      "triple-riemann-sums:lecture07-fubini-six-orders",
      "triple-riemann-sums:lecture07-product-box-integral",
      "triple-riemann-sums:lecture07-zero-extension-general-region",
      "triple-riemann-sums:lecture07-volume-boundary-criterion",
      "triple-riemann-sums:lecture07-graph-surface-zero-volume",
    ],
    pages: [[2, 3], [4], [5], [6, 7], [8], [9], [9]],
  },
  {
    id: sourceId + ":02",
    span: "10–24",
    concepts: ["simple-solid-bounds"],
    ids: [
      "simple-solid-bounds:source-skill-1",
      "simple-solid-bounds:lecture07-type-one-fiber-theorem",
      "simple-solid-bounds:lecture07-type-two-fiber-theorem",
      "simple-solid-bounds:lecture07-type-three-fiber-theorem",
      "simple-solid-bounds:lecture07-tetrahedron-integral",
      "simple-solid-bounds:lecture07-paraboloid-projection-integral",
      "simple-solid-bounds:lecture07-parabolic-roof-volume",
    ],
    pages: [
      [10],
      [11],
      [12, 13],
      [14, 15],
      [16, 17, 18],
      [19, 20, 21],
      [22, 23, 24],
    ],
  },
  {
    id: sourceId + ":03",
    span: "25–52",
    concepts: [
      "cylindrical-coordinates",
      "cylindrical-integration",
      "spherical-coordinates",
      "spherical-integration",
    ],
    ids: [
      "cylindrical-coordinates:lecture07-cartesian-conversion",
      "cylindrical-coordinates:lecture07-cone-surface",
      "cylindrical-coordinates:lecture07-cylinder-surface",
      "cylindrical-integration:lecture07-region-theorem",
      "cylindrical-integration:lecture07-cylinder-paraboloid-integral",
      "cylindrical-integration:lecture07-iterated-integral-conversion",
      "spherical-coordinates:source-skill-1",
      "spherical-coordinates:lecture07-radius-level-surface",
      "spherical-coordinates:lecture07-azimuth-level-surface",
      "spherical-coordinates:lecture07-inclination-level-surface",
      "spherical-integration:lecture07-nice-wedge-theorem",
      "spherical-integration:lecture07-type-two-wedge-theorem",
      "spherical-integration:lecture07-unit-ball-exponential-integral",
      "spherical-integration:variable-radial-bounds",
    ],
    pages: [
      [26, 27],
      [28],
      [29],
      [30, 31],
      [32, 33, 34],
      [35, 36, 37],
      [39, 40, 41],
      [42],
      [43],
      [44],
      [45, 46],
      [47],
      [48, 49],
      [47, 50, 51, 52],
    ],
  },
];
const specs = sectionSpecs.flatMap((section) =>
  section.ids.map((id, index) => ({
    id,
    pages: section.pages[index],
    sectionId: section.id,
    conceptId: id.split(":")[0],
  })),
);
const outcomes = new Map(
  ledger.atomic_outcomes.map((outcome) => [outcome.id, outcome]),
);
const lessonIds = sectionSpecs.flatMap((section) => section.concepts);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    actual + " should be within " + tolerance + " of " + expected,
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
      inspectNewGuide(item, locator + "[" + index + "]", failures, key),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [childKey, child] of Object.entries(value))
    inspectNewGuide(child, locator + "." + childKey, failures, childKey);
}

test("canonical Lecture 07 page map and stable routes are exact", () => {
  assert.equal(sources[sourceId].file, "MH2100_Lecture_07.pdf");
  assert.equal(sources[sourceId].pages, 52);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.deepEqual(sources[sourceId].errata ?? [], []);
  const manifest = sourceManifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(manifest?.status, "canonical");
  assert.equal(manifest?.sha256, sourceSha);
  assert.equal(manifest?.driveFileId, "1gRzVmri9Hbc1uaZXmK3KPiaNt6mS_2mw");
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
      section.inspected_physical_pages,
      Array.from(
        {
          length:
            Number(spec.span.split("–")[1]) -
            Number(spec.span.split("–")[0]) +
            1,
        },
        (_, index) => Number(spec.span.split("–")[0]) + index,
      ),
    );
  }
  const triple = ledger.source_sections.find(
    (item) => item.id === sourceId + ":01",
  );
  assert.equal(triple.reviewed_exclusions[0].physical_page, 1);
  assert.match(triple.source_review_notes.join(" "), /pages 7/u);
  assert.match(triple.source_review_notes.join(" "), /no source solution/u);
  const solids = ledger.source_sections.find(
    (item) => item.id === sourceId + ":02",
  );
  assert.match(solids.source_review_notes.join(" "), /17–18/u);
  assert.match(solids.source_review_notes.join(" "), /128\/5/u);
  const coordinates = ledger.source_sections.find(
    (item) => item.id === sourceId + ":03",
  );
  assert.match(coordinates.source_review_notes.join(" "), /16π\/5/u);
  assert.match(coordinates.source_review_notes.join(" "), /4π\/3/u);
  assert.match(coordinates.source_review_notes.join(" "), /pages 51–52/u);
});

test("each Lecture 07 outcome has page evidence, exact route evidence, and honest limits", () => {
  assert.equal(specs.length, 28);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const expected of specs) {
    const outcome = outcomes.get(expected.id);
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
    assert.deepEqual(Object.keys(outcome.evidence).sort(), [...states].sort());
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(
        outcome.evidence[state].length,
        1,
        expected.id + " " + state,
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
    const blocks = lesson.contentBlocks ?? [];
    const strategy = blocks.find((block) =>
      outcome.evidence.named[0].locator.endsWith("[" + block.id + "].title"),
    );
    const stated = blocks.find((block) =>
      outcome.evidence.stated[0].locator.endsWith("[" + block.id + "]"),
    );
    const worked = blocks.find((block) =>
      outcome.evidence.worked[0].locator.endsWith("[" + block.id + "]"),
    );
    const practiced = lesson.exercises.find((exercise) =>
      outcome.evidence.practiced[0].locator.endsWith("[" + exercise.id + "]"),
    );
    assert.equal(strategy?.kind, "strategy", expected.id + " title");
    assert.equal(stated?.kind, "strategy", expected.id + " statement");
    assert.equal(worked?.kind, "worked-example", expected.id + " worked");
    assert.ok(
      practiced?.prompt &&
        practiced.hint &&
        practiced.solution &&
        practiced.solutionTex,
      expected.id + " transfer",
    );
    assert.ok(practiced.rubric.length >= 2, expected.id + " rubric");
    assert.ok(
      concepts
        .find((item) => item.id === expected.conceptId)
        .sources.some(
          (reference) =>
            reference.sourceId === sourceId &&
            reference.pages[0] <= outcome.core_source.physical_page &&
            reference.pages[1] >= outcome.core_source.physical_page,
        ),
      expected.id + " catalog page reference",
    );
  }
});

test("source examples and independent transfers agree with exact integration", () => {
  close((1 / 2) * (3 / 2) * 9, 27 / 4);
  close((1 / 6) * (1 / 4), 1 / 24);
  close(2 * Math.PI * (32 / 3 - 32 / 5), (128 * Math.PI) / 15);
  close(32 - 32 / 5, 128 / 5);
  close(2 * Math.PI * (1 + 1 / 5), (12 * Math.PI) / 5);
  close(2 * Math.PI * (8 - 32 / 5), (16 * Math.PI) / 5);
  close((4 * Math.PI * (Math.E - 1)) / 3, 7.197522092111697);
  close((2 * Math.PI * Math.pow(1.5, 3)) / 3, (9 * Math.PI) / 4);
  close(((2 * Math.PI) / 3) * (3 / 16), Math.PI / 8);

  for (const [conceptId, blockId, answer] of [
    [
      "triple-riemann-sums",
      "lecture07-product-box-integral-worked",
      "\\frac{27}{4}",
    ],
    [
      "simple-solid-bounds",
      "lecture07-tetrahedron-density-integral-worked",
      "\\frac1{24}",
    ],
    [
      "simple-solid-bounds",
      "lecture07-paraboloid-projection-integral-worked",
      "\\frac{128\\pi}{15}",
    ],
    [
      "simple-solid-bounds",
      "lecture07-parabolic-roof-volume-worked",
      "\\frac{128}{5}",
    ],
    [
      "cylindrical-integration",
      "lecture07-cylinder-paraboloid-integral-worked",
      "\\frac{12\\pi}{5}",
    ],
    [
      "cylindrical-integration",
      "lecture07-iterated-integral-conversion-worked",
      "\\frac{16\\pi}{5}",
    ],
    [
      "spherical-integration",
      "lecture07-spherical-unit-ball-exponential-integral-worked",
      "\\frac{4\\pi(e-1)}{3}",
    ],
    ["spherical-integration", "cone-shifted-sphere-volume", "\\frac\\pi8"],
  ]) {
    const work = guides[conceptId].contentBlocks.find(
      (block) => block.id === blockId,
    );
    assert.ok(work, blockId);
    assert.ok(
      work.steps.some((step) => step.equation?.includes(answer)),
      blockId + " derivation result",
    );
  }

  for (const [conceptId, exerciseId, answer] of [
    [
      "triple-riemann-sums",
      "lecture07-product-box-integral-transfer",
      "\\frac{20}{3}",
    ],
    [
      "simple-solid-bounds",
      "lecture07-tetrahedron-integral-transfer",
      "\\frac{1}{48}",
    ],
    [
      "simple-solid-bounds",
      "lecture07-paraboloid-projection-transfer",
      "\\frac{324\\pi}{5}",
    ],
    [
      "simple-solid-bounds",
      "lecture07-parabolic-roof-volume-transfer",
      "\\frac{32}{15}",
    ],
    [
      "cylindrical-integration",
      "lecture07-cylinder-paraboloid-transfer",
      "\\frac{64\\pi}{5}",
    ],
    [
      "cylindrical-integration",
      "lecture07-iterated-integral-transfer",
      "\\frac{11\\pi}{10}",
    ],
    [
      "spherical-integration",
      "lecture07-nice-wedge-transfer",
      "\\frac{9\\pi}{4}",
    ],
    [
      "spherical-integration",
      "lecture07-type-two-wedge-transfer",
      "\\frac{8\\pi}{5}",
    ],
    [
      "spherical-integration",
      "lecture07-unit-ball-exponential-integral-transfer",
      "\\frac{32\\pi}{15}",
    ],
  ]) {
    const exercise = guides[conceptId].exercises.find(
      (item) => item.id === exerciseId,
    );
    assert.ok(exercise, exerciseId);
    assert.ok(exercise.solutionTex.includes(answer), exerciseId);
  }
});

test("new Lecture 07 guide strings use complete LaTeX and semantic notation", () => {
  const failures = [];
  for (const conceptId of lessonIds) {
    const lesson = guides[conceptId];
    inspectNewGuide(
      (lesson.contentBlocks ?? []).filter((block) =>
        block.id.startsWith("lecture07-"),
      ),
      conceptId + ".contentBlocks",
      failures,
    );
    inspectNewGuide(
      lesson.exercises.filter((exercise) =>
        exercise.id.startsWith("lecture07-"),
      ),
      conceptId + ".exercises",
      failures,
    );
  }
  assert.deepEqual(failures, []);
});

test("WebMCP serves the Lecture 07 source blocks, transfer practice, and MathML", async () => {
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
    const blocks = (guides[conceptId].contentBlocks ?? []).filter((block) =>
      block.id.startsWith("lecture07-"),
    );
    const exercises = guides[conceptId].exercises.filter((exercise) =>
      exercise.id.startsWith("lecture07-"),
    );
    for (const block of blocks) {
      assert.ok(lesson.contentBlocks.some((item) => item.id === block.id));
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      assert.match(markup, /<math\b/u, block.id);
      assert.doesNotMatch(markup, /katex-error/u, block.id);
    }
    for (const exercise of exercises) {
      assert.ok(lesson.exercises.some((item) => item.id === exercise.id));
      const prose = [exercise.prompt, exercise.hint, exercise.solution].join(
        " ",
      );
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      assert.match(proseMarkup, /<math\b/u, exercise.id + " prose");
      assert.doesNotMatch(proseMarkup, /katex-error/u, exercise.id);
      const solutionMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(solutionMarkup, /<math\b/u, exercise.id + " formula");
      assert.doesNotMatch(solutionMarkup, /katex-error/u, exercise.id);
    }
    assert.equal(response.id, conceptId);
    assert.ok(response.sources.some((item) => item.sourceId === sourceId));
  }
});
