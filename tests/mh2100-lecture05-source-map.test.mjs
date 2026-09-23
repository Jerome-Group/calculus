import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import katex from "katex";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const root = fileURLToPath(new URL("..", import.meta.url));
const baseline = read("./fixtures/mh2100-lecture05-baseline-ids.json");
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sources = read("../lib/curriculum/sources.json");
const manifest = read("../lib/curriculum/source-manifest.json");
const sourceId = "MH2100_Lecture_05";
const sourceSha =
  "7250bc655e8850d1d212c66061b7504e172e7378578d5134a0de2a23bb4693bd";
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const oldFiberId = "type-one-two-regions:source-skill-1";
const sectionSpecs = [
  {
    id: sourceId + ":02",
    span: "24–31",
    topic: "closed-rectangle double Riemann sums and integral",
    concepts: ["double-riemann-sums"],
    ids: [
      "double-riemann-sums:lecture05-rectangular-mesh-cell-area",
      "double-riemann-sums:lecture05-tagged-double-riemann-sum",
      "double-riemann-sums:lecture05-double-integral-tagged-limit",
      "double-riemann-sums:lecture05-nonnegative-graph-volume",
    ],
    pages: [24, 25, 26, 27, 28, 29, 30, 31],
    exclusions: [24, 25],
  },
  {
    id: sourceId + ":03",
    span: "32–40",
    topic: "general bounded regions and integral applications",
    concepts: ["general-double-integrals"],
    ids: [
      "general-double-integrals:lecture05-zero-extension-definition",
      "general-double-integrals:lecture05-enclosing-rectangle-independence",
      "general-double-integrals:lecture05-area-as-integral-of-one",
      "general-double-integrals:lecture05-boundary-zero-area-criterion",
      "general-double-integrals:lecture05-riemann-integrability-criterion",
      "general-double-integrals:lecture05-volume-over-general-region",
      "general-double-integrals:lecture05-mass-density",
      "general-double-integrals:lecture05-joint-density-probability",
    ],
    pages: [32, 33, 34, 35, 36, 37, 38, 39, 40],
    exclusions: [],
  },
  {
    id: sourceId + ":04",
    span: "41–48",
    topic: "iterated rectangular integrals and Fubini",
    concepts: ["fubini-double"],
    ids: [
      "fubini-double:lecture05-iterated-orders-slices",
      "fubini-double:lecture05-source-monomial-either-order",
      "fubini-double:lecture05-continuous-rectangle-hypotheses",
      "fubini-double:lecture05-source-oscillatory-integral-two-orders",
    ],
    pages: [41, 42, 43, 44, 45, 46, 47, 48],
    exclusions: [],
  },
  {
    id: sourceId + ":05",
    span: "49–61",
    topic: "Type I/II regions and source applications",
    concepts: ["type-one-two-regions"],
    ids: [
      oldFiberId,
      "type-one-two-regions:lecture05-type-i-integral-bounds",
      "type-one-two-regions:lecture05-type-ii-integral-bounds",
      "type-one-two-regions:lecture05-slice-orientation-choice",
      "type-one-two-regions:lecture05-source-type-i-parabola-integral",
      "type-one-two-regions:lecture05-source-type-ii-parabola-integral",
      "type-one-two-regions:lecture05-source-tetrahedron-projection-volume",
    ],
    pages: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61],
    exclusions: [],
  },
];
const expectedPages = new Map([
  [sectionSpecs[0].ids[0], [27, 28]],
  [sectionSpecs[0].ids[1], [27, 29]],
  [sectionSpecs[0].ids[2], [30, 31]],
  [sectionSpecs[0].ids[3], [26, 28, 29, 30]],
  [sectionSpecs[1].ids[0], [32, 33, 34]],
  [sectionSpecs[1].ids[1], [35]],
  [sectionSpecs[1].ids[2], [36]],
  [sectionSpecs[1].ids[3], [36]],
  [sectionSpecs[1].ids[4], [37]],
  [sectionSpecs[1].ids[5], [38]],
  [sectionSpecs[1].ids[6], [39]],
  [sectionSpecs[1].ids[7], [40]],
  [sectionSpecs[2].ids[0], [41, 42]],
  [sectionSpecs[2].ids[1], [43, 44]],
  [sectionSpecs[2].ids[2], [45]],
  [sectionSpecs[2].ids[3], [46, 47, 48]],
  [oldFiberId, [49, 50, 51]],
  [sectionSpecs[3].ids[1], [52]],
  [sectionSpecs[3].ids[2], [53]],
  [sectionSpecs[3].ids[3], [56, 57]],
  [sectionSpecs[3].ids[4], [54, 55]],
  [sectionSpecs[3].ids[5], [57, 58]],
  [sectionSpecs[3].ids[6], [59, 60, 61]],
]);
const mappedConceptIds = [
  ...new Set([...expectedPages.keys()].map((id) => id.split(":")[0])),
];
const mappedBlocks = Object.fromEntries(
  mappedConceptIds.map((id) => [
    id,
    (guides[id].contentBlocks ?? []).filter((block) =>
      block.id.startsWith("lecture05-"),
    ),
  ]),
);
const mappedExercises = Object.fromEntries(
  mappedConceptIds.map((id) => [
    id,
    (guides[id].exercises ?? []).filter((exercise) =>
      exercise.id.startsWith("lecture05-"),
    ),
  ]),
);
const outcomeById = new Map(
  ledger.atomic_outcomes.map((item) => [item.id, item]),
);

test("canonical identity, erratum, baseline outcomes, routes, and section map", () => {
  assert.equal(baseline.commit, "0bf47a9c9c20114dbea48fa249876ff1ed226d68");
  assert.equal(sources[sourceId].file, "MH2100_Lecture_05.pdf");
  assert.equal(sources[sourceId].pages, 61);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.deepEqual(sources[sourceId].errata, [
    {
      page: 27,
      printed:
        "The upper endpoint of the jth $y$-subinterval is printed as $d+j(d-c)/n$.",
      correction:
        "Read the endpoint as $c+j(d-c)/n$, so the interval is $[c+(j-1)(d-c)/n, c+j(d-c)/n]$.",
      justification:
        "A uniform partition of $[c,d]$ into $n$ equal intervals has those endpoints. The printed endpoint exceeds $d$ for positive $j$ and is not in $R$. Pages 28–31 use the common cell area $((b-a)/m)((d-c)/n)$.",
      provenance:
        "Canonical Drive PDF SHA-256 matched and page 27 visually inspected; correction independently checked; source PDF unchanged.",
    },
  ]);
  const sourceManifest = manifest.find((item) => item.sourceId === sourceId);
  assert.equal(sourceManifest.status, "canonical");
  assert.equal(sourceManifest.sha256, sourceSha);
  assert.equal(sourceManifest.driveFileId, "1vlUmaphnoY1lu1prslvBdsZ7h2Fm3a0c");
  for (const conceptId of [
    "double-riemann-sums",
    "general-double-integrals",
    "fubini-double",
    "type-one-two-regions",
  ])
    assert.ok(sourceManifest.affectedConcepts.includes(conceptId));

  const currentConceptIds = new Set(concepts.map((item) => item.id));
  assert.equal(currentConceptIds.size, concepts.length);
  for (const id of baseline.conceptIds)
    assert.ok(currentConceptIds.has(id), id);
  const currentRouteIds = new Set(concepts.map((item) => item.id));
  assert.equal(baseline.routeIds.length, 125);
  assert.equal(currentRouteIds.size, baseline.routeIds.length);
  for (const id of baseline.routeIds) assert.ok(currentRouteIds.has(id), id);
  const currentOutcomeIds = new Set(
    ledger.atomic_outcomes.map((item) => item.id),
  );
  assert.equal(currentOutcomeIds.size, ledger.atomic_outcomes.length);
  for (const id of baseline.atomicOutcomeIds)
    assert.ok(currentOutcomeIds.has(id), id);
  const currentSectionIds = new Set(
    ledger.source_sections.map((item) => item.id),
  );
  for (const id of baseline.sourceSectionIds)
    assert.ok(currentSectionIds.has(id), id);

  for (const spec of sectionSpecs) {
    const section = ledger.source_sections.find((item) => item.id === spec.id);
    assert.ok(section, spec.id);
    assert.equal(section.source_id, sourceId);
    assert.equal(section.physical_page_span, spec.span);
    assert.equal(section.topic_from_audit_inventory, spec.topic);
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.deepEqual(section.linked_concept_ids, spec.concepts);
    assert.deepEqual(section.atomic_outcome_ids, spec.ids);
    assert.deepEqual(section.inspected_physical_pages, spec.pages);
    assert.deepEqual(
      section.reviewed_exclusions.map((entry) => entry.physical_page),
      spec.exclusions,
    );
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(
        section.evidence[state].length,
        spec.ids.length,
        spec.id + " " + state,
      );
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
    assert.match(
      section.gap,
      /learner performance remains unverified|learner performance remain unverified/u,
    );
    assert.match(
      section.gap,
      /scene alignment and learner performance remain unverified/iu,
    );
  }
  assert.ok(baseline.atomicOutcomeIds.includes(oldFiberId));
});

test("every mapped skill has exact page, guide, practice, and six evidence states", () => {
  assert.deepEqual(
    [...outcomeById.keys()]
      .filter((id) => id.startsWith("double-riemann-sums:lecture05-"))
      .sort(),
    [...sectionSpecs[0].ids].sort(),
  );
  const mappedIds = [...expectedPages.keys()];
  const newIds = mappedIds.filter(
    (id) => !baseline.atomicOutcomeIds.includes(id),
  );
  assert.deepEqual(
    newIds,
    mappedIds.filter((id) => id !== oldFiberId),
  );

  for (const [id, pages] of expectedPages) {
    const entry = outcomeById.get(id);
    assert.ok(entry, id);
    const conceptId = id.split(":")[0];
    const suffix = id.split(":")[1].replace(/^lecture05-/u, "");
    const statementId = "lecture05-" + suffix + "-statement";
    const workedId = "lecture05-" + suffix + "-worked";
    const exerciseId = "lecture05-" + suffix + "-transfer";
    const guide = guides[conceptId];
    const statement = guide.contentBlocks.find(
      (item) => item.id === statementId,
    );
    const worked = guide.contentBlocks.find((item) => item.id === workedId);
    const exercise = guide.exercises.find((item) => item.id === exerciseId);
    assert.ok(statement, id + " statement");
    assert.ok(worked, id + " worked");
    assert.ok(exercise, id + " transfer");
    assert.equal(entry.concept_id, conceptId);
    assert.equal(
      entry.source_section_id,
      sectionSpecs.find((section) => section.ids.includes(id)).id,
    );
    assert.equal(entry.core_source.id, sourceId);
    assert.equal(entry.core_source.sha256, sourceSha);
    assert.deepEqual(entry.core_source.page_validation.pages, pages);
    assert.ok(pages.includes(entry.core_source.physical_page));
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.match(
      entry.core_source.page_validation.method,
      /61 physical pages rendered and visually swept/u,
    );
    assert.ok(entry.core_source.page_validation.claim_observed);
    assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
    assert.deepEqual(Object.keys(entry.evidence), states);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(entry.evidence[state].length, 1, id + " " + state);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
    assert.match(entry.gap, /learner performance is unverified/u);
    assert.equal(statement.kind, "strategy");
    assert.equal(worked.kind, "worked-example");
    assert.ok(worked.steps.length >= 2, id);
    assert.ok(
      exercise.prompt &&
        exercise.hint &&
        exercise.solution &&
        exercise.solutionTex,
    );
    assert.ok(exercise.rubric.length >= 2, id);
    assert.match(
      entry.evidence.named[0].locator,
      new RegExp("contentBlocks\\[" + statementId + "\\]\\.title$", "u"),
    );
    assert.ok(
      entry.evidence.stated[0].locator.endsWith("[" + statementId + "]"),
    );
    assert.ok(entry.evidence.worked[0].locator.endsWith("[" + workedId + "]"));
    assert.ok(
      entry.evidence.practiced[0].locator.endsWith("[" + exerciseId + "]"),
    );
    for (const page of pages)
      assert.ok(
        concepts
          .find((item) => item.id === conceptId)
          .sources.some(
            (ref) =>
              ref.sourceId === sourceId &&
              ref.pages[0] <= page &&
              ref.pages[1] >= page,
          ),
        id + " source reference page " + page,
      );
  }
  assert.equal(Object.values(mappedBlocks).flat().length, mappedIds.length * 2);
  assert.equal(Object.values(mappedExercises).flat().length, mappedIds.length);
});

test("source examples and changed-data practice recompute independently", () => {
  const close = (actual, expected) =>
    assert.ok(Math.abs(actual - expected) < 1e-11, `${actual} != ${expected}`);
  const integratePolynomial = (coefficients, a, b) =>
    coefficients.reduce(
      (sum, coefficient, power) =>
        sum +
        (coefficient * (b ** (power + 1) - a ** (power + 1))) / (power + 1),
      0,
    );

  // Source p.43–44: integrate x^2 y in either order.
  close(9 * ((2 ** 2 - 1 ** 2) / 2), 27 / 2);
  close((3 ** 3 / 3) * ((2 ** 2 - 1 ** 2) / 2), 27 / 2);
  // Source p.46–48: both cosine endpoint integrals vanish; the other order is a boundary term.
  close(
    Math.sin(Math.PI) - Math.sin(0) - (Math.sin(2 * Math.PI) - Math.sin(0)) / 2,
    0,
  );
  close(-(Math.sin(2 * Math.PI) / 2 - Math.sin(Math.PI)), 0);
  const x = 1.4;
  close(
    (-Math.PI * Math.cos(Math.PI * x)) / x + Math.sin(Math.PI * x) / x ** 2,
    -((Math.PI * Math.cos(Math.PI * x) * x - Math.sin(Math.PI * x)) / x ** 2),
  );
  // Source p.55 polynomial and p.58 polynomial primitive.
  close(integratePolynomial([1, 1, 2, -1, -3], -1, 1), 32 / 15);
  const source58Primitive = (y) =>
    -(y ** 6) / 48 + y ** 4 / 2 + y ** 3 / 3 - 2 * y ** 2;
  close(source58Primitive(4) - source58Primitive(-2), 36);
  // Source p.61 inner integral reduces to (x-1)^2.
  close(integratePolynomial([1, -2, 1], 0, 1), 1 / 3);

  // Guide transfers use new data; recompute each numerical answer by exercise ID.
  const expectedExerciseValues = new Map([
    ["lecture05-rectangular-mesh-cell-area-transfer", 24],
    ["lecture05-tagged-double-riemann-sum-transfer", 10],
    ["lecture05-double-integral-tagged-limit-transfer", 12],
    ["lecture05-nonnegative-graph-volume-transfer", 6],
    ["lecture05-area-as-integral-of-one-transfer", 9 / 2],
    ["lecture05-boundary-zero-area-criterion-transfer", 2],
    ["lecture05-volume-over-general-region-transfer", 6],
    ["lecture05-mass-density-transfer", 15 / 2],
    ["lecture05-joint-density-probability-transfer", 1 / 2],
    ["lecture05-iterated-orders-slices-transfer", 27 / 2],
    ["lecture05-source-monomial-either-order-transfer", 52 / 3],
    ["lecture05-continuous-rectangle-hypotheses-transfer", 4 * (Math.E - 1)],
    ["lecture05-source-oscillatory-integral-two-orders-transfer", 0],
    ["lecture05-type-i-integral-bounds-transfer", 9],
    ["lecture05-type-ii-integral-bounds-transfer", 12],
    ["lecture05-slice-orientation-choice-transfer", 18],
    ["lecture05-source-type-i-parabola-integral-transfer", 4 / 3],
    ["lecture05-source-type-ii-parabola-integral-transfer", 18],
    ["lecture05-source-tetrahedron-projection-volume-transfer", 3],
  ]);
  const recomputedExerciseValues = new Map([
    ["lecture05-rectangular-mesh-cell-area-transfer", 24 * (6 / 3) * (4 / 8)],
    [
      "lecture05-tagged-double-riemann-sum-transfer",
      [2, 1, 4, 3].reduce((sum, value) => sum + value, 0),
    ],
    ["lecture05-double-integral-tagged-limit-transfer", 2 * (4 - 1) * (1 - -1)],
    [
      "lecture05-nonnegative-graph-volume-transfer",
      integratePolynomial([1, 2], 0, 2),
    ],
    [
      "lecture05-area-as-integral-of-one-transfer",
      integratePolynomial([3, -1], 0, 3),
    ],
    ["lecture05-boundary-zero-area-criterion-transfer", (1 - 0) * (2 - 0)],
    [
      "lecture05-volume-over-general-region-transfer",
      3 * integratePolynomial([2, -1], 0, 2),
    ],
    ["lecture05-mass-density-transfer", integratePolynomial([1, 1], 0, 3)],
    [
      "lecture05-joint-density-probability-transfer",
      (1 / 12) * (3 - 1) * (4 - 1),
    ],
    [
      "lecture05-iterated-orders-slices-transfer",
      3 * integratePolynomial([0, 1], 1, 2) + integratePolynomial([0, 2], 0, 3),
    ],
    [
      "lecture05-source-monomial-either-order-transfer",
      integratePolynomial([0, 1], 0, 2) * integratePolynomial([0, 0, 1], 1, 3),
    ],
    ["lecture05-continuous-rectangle-hypotheses-transfer", 4 * (Math.E - 1)],
    [
      "lecture05-source-oscillatory-integral-two-orders-transfer",
      Math.sin(Math.PI) -
        Math.sin(0) -
        (Math.sin(3 * Math.PI) - Math.sin(0)) / 3,
    ],
    [
      "lecture05-type-i-integral-bounds-transfer",
      2 * integratePolynomial([3, -1], 0, 3),
    ],
    [
      "lecture05-type-ii-integral-bounds-transfer",
      integratePolynomial([6, -2], -1, 1),
    ],
    [
      "lecture05-slice-orientation-choice-transfer",
      integratePolynomial([4, 1, -0.5], -2, 4),
    ],
    [
      "lecture05-source-type-i-parabola-integral-transfer",
      integratePolynomial([1, 0, -1], -1, 1),
    ],
    [
      "lecture05-source-type-ii-parabola-integral-transfer",
      integratePolynomial([4, 1, -0.5], -2, 4),
    ],
    [
      "lecture05-source-tetrahedron-projection-volume-transfer",
      integratePolynomial([4.5, -4.5, 1.125], 0, 2),
    ],
  ]);
  assert.deepEqual(
    [...recomputedExerciseValues.keys()].sort(),
    [...expectedExerciseValues.keys()].sort(),
  );
  assert.deepEqual(
    [
      ...mappedExercises["double-riemann-sums"],
      ...mappedExercises["general-double-integrals"],
      ...mappedExercises["fubini-double"],
      ...mappedExercises["type-one-two-regions"],
    ]
      .filter((exercise) => expectedExerciseValues.has(exercise.id))
      .map((exercise) => exercise.id)
      .sort(),
    [...expectedExerciseValues.keys()].sort(),
  );
  for (const [id, expected] of expectedExerciseValues)
    close(recomputedExerciseValues.get(id), expected);
});

const renderedKeys = new Set([
  "equation",
  "solutionTex",
  "title",
  "text",
  "strategy",
  "setup",
  "label",
  "result",
  "verification",
  "outcome",
  "prompt",
  "hint",
  "solution",
  "rubric",
]);
function* strings(value, path, key = "") {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries())
      yield* strings(item, path + "[" + index + "]", key);
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value))
      yield* strings(child, path + "." + childKey, childKey);
    return;
  }
  if (typeof value === "string" && renderedKeys.has(key))
    yield [path, key, value];
}

test("Lecture 05 guide TeX compiles with strict MathML output", () => {
  const formulas = [];
  for (const [conceptId, blocks] of Object.entries(mappedBlocks)) {
    const records = [...blocks, ...mappedExercises[conceptId]];
    for (const [path, key, value] of strings(records, conceptId)) {
      if (key === "equation" || key === "solutionTex") {
        formulas.push({ path, source: value });
        continue;
      }
      assert.doesNotMatch(value, /\$\$|\$\s+\$|\$ -|- \$|\$ \+|\+ \$/u, path);
      assert.equal((value.match(/\$/gu) ?? []).length % 2, 0, path);
      const prose = value.replace(/\$([^$]+)\$/gu, (_match, source) => {
        formulas.push({ path, source });
        return "";
      });
      assert.doesNotMatch(
        prose,
        /[=<>≤≥±∞∈↦√^|]|[′″]|\b(?:f|g|h|p|q|r|s|u)\s*'{1,2}\s*(?:\(|=)|\b\d+\s*\/\s*[a-zA-Z]/u,
        path + " has unmarked mathematical notation",
      );
    }
  }
  assert.ok(
    formulas.length > 100,
    "collected " + formulas.length + " formulas",
  );
  for (const { path, source } of formulas) {
    let markup;
    assert.doesNotThrow(() => {
      markup = katex.renderToString(source, {
        throwOnError: true,
        strict: "error",
        output: "htmlAndMathml",
      });
    }, path);
    assert.match(markup, /<math\b/u, path);
    assert.doesNotMatch(markup, /katex-error/u, path);
  }
});

const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("WebMCP read_concept exposes all Lecture 05 blocks, exercises, and rendered MathML", async () => {
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
  for (const conceptId of mappedConceptIds) {
    const lesson = readConcept.execute({ conceptId }).lesson;
    for (const block of mappedBlocks[conceptId]) {
      assert.ok(
        lesson.contentBlocks.some((item) => item.id === block.id),
        block.id,
      );
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      assert.match(markup, /<math\b/u, block.id);
      assert.doesNotMatch(markup, /katex-error/u, block.id);
    }
    for (const exercise of mappedExercises[conceptId]) {
      assert.ok(
        lesson.exercises.some((item) => item.id === exercise.id),
        exercise.id,
      );
      const prose =
        exercise.prompt + " " + exercise.hint + " " + exercise.solution;
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      if (prose.includes("$"))
        assert.match(proseMarkup, /<math\b/u, exercise.id);
      assert.doesNotMatch(proseMarkup, /katex-error/u, exercise.id);
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(formulaMarkup, /<math\b/u, exercise.id + " solution MathML");
      assert.doesNotMatch(formulaMarkup, /katex-error/u, exercise.id);
    }
  }
});
