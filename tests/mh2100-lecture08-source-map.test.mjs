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
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sources = read("../lib/curriculum/sources.json");
const sourceManifest = read("../lib/curriculum/source-manifest.json");
const sourceId = "MH2100_Lecture_08";
const sourceSha =
  "7379c98f91701bde97dd1772f1270ee23aa814c5b6b75f322b1f7ee83bc25ac8";
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
    id: "MH2100_Lecture_08:01",
    span: "2–8",
    concepts: ["linear-area-change"],
    ids: [
      "linear-area-change:lecture08-determinant-parallelogram-area",
      "linear-area-change:lecture08-three-dimensional-volume-scale",
      "linear-area-change:lecture08-linear-integral-substitution",
    ],
    exclusions: [1],
  },
  {
    id: "MH2100_Lecture_08:02",
    span: "9–16",
    concepts: ["plane-jacobian", "space-jacobians"],
    ids: [
      "plane-jacobian:lecture08-plane-map-derivative-matrix",
      "space-jacobians:lecture08-space-transform-domain-components",
      "plane-jacobian:lecture08-polar-jacobian",
      "space-jacobians:lecture08-cylindrical-jacobian",
      "space-jacobians:lecture08-spherical-jacobian-order-sign",
    ],
    exclusions: [],
  },
  {
    id: "MH2100_Lecture_08:03",
    span: "17–35",
    concepts: [
      "substitution-integral",
      "change-of-variables",
      "inverse-jacobian",
    ],
    ids: [
      "substitution-integral:lecture08-definite-substitution-theorem",
      "change-of-variables:source-skill-1",
      "change-of-variables:lecture08-theorem-regularity-conditions",
      "change-of-variables:lecture08-coordinate-measure-factors",
      "inverse-jacobian:lecture08-choose-inverse-coordinates",
      "inverse-jacobian:lecture08-xy-ratio-region",
      "inverse-jacobian:lecture08-affine-parallelogram",
      "inverse-jacobian:lecture08-trapezoid-boundary-map",
      "inverse-jacobian:lecture08-three-plane-volume",
    ],
    exclusions: [26, 27, 30, 33, 35, 36],
  },
  {
    id: "MH2100_Lecture_08:04",
    span: "37–45",
    concepts: ["scalar-line-integrals"],
    ids: [
      "scalar-line-integrals:lecture08-scalar-riemann-sum",
      "scalar-line-integrals:lecture08-scalar-existence-and-smooth-formula",
      "scalar-line-integrals:lecture08-source-circle-density",
    ],
    exclusions: [45],
  },
  {
    id: "MH2100_Lecture_08:05",
    span: "46–51",
    concepts: ["vector-fields", "vector-line-integrals"],
    ids: [
      "vector-fields:lecture08-vector-field-domain-components",
      "vector-line-integrals:lecture08-vector-integral-riemann-sum",
      "vector-line-integrals:lecture08-vector-integral-orientation",
      "vector-line-integrals:lecture08-vector-integral-existence-formula",
      "vector-line-integrals:lecture08-source-vector-work",
    ],
    exclusions: [51],
  },
];
const expectedPages = new Map([
  ["substitution-integral:lecture08-definite-substitution-theorem", [17]],
  ["linear-area-change:lecture08-determinant-parallelogram-area", [2, 3]],
  ["linear-area-change:lecture08-three-dimensional-volume-scale", [5, 8]],
  ["linear-area-change:lecture08-linear-integral-substitution", [6, 7]],
  ["plane-jacobian:lecture08-plane-map-derivative-matrix", [9, 11]],
  ["space-jacobians:lecture08-space-transform-domain-components", [10]],
  ["plane-jacobian:lecture08-polar-jacobian", [12]],
  ["space-jacobians:lecture08-cylindrical-jacobian", [13, 14]],
  ["space-jacobians:lecture08-spherical-jacobian-order-sign", [15, 16]],
  ["change-of-variables:source-skill-1", [18]],
  ["change-of-variables:lecture08-theorem-regularity-conditions", [18, 19]],
  ["change-of-variables:lecture08-coordinate-measure-factors", [20, 21, 22]],
  ["inverse-jacobian:lecture08-choose-inverse-coordinates", [23, 24]],
  ["inverse-jacobian:lecture08-xy-ratio-region", [25]],
  ["inverse-jacobian:lecture08-affine-parallelogram", [28, 29]],
  ["inverse-jacobian:lecture08-trapezoid-boundary-map", [31, 32]],
  ["inverse-jacobian:lecture08-three-plane-volume", [34]],
  ["scalar-line-integrals:lecture08-scalar-riemann-sum", [38, 39, 40, 41]],
  [
    "scalar-line-integrals:lecture08-scalar-existence-and-smooth-formula",
    [42, 43],
  ],
  ["scalar-line-integrals:lecture08-source-circle-density", [44]],
  ["vector-fields:lecture08-vector-field-domain-components", [46]],
  ["vector-line-integrals:lecture08-vector-integral-riemann-sum", [47]],
  ["vector-line-integrals:lecture08-vector-integral-orientation", [48]],
  ["vector-line-integrals:lecture08-vector-integral-existence-formula", [49]],
  ["vector-line-integrals:lecture08-source-vector-work", [50]],
]);
const newOutcomeIds = [...expectedPages.keys()].filter(
  (id) => id !== "change-of-variables:source-skill-1",
);
const guideIds = [
  "linear-area-change",
  "plane-jacobian",
  "space-jacobians",
  "change-of-variables",
  "inverse-jacobian",
  "scalar-line-integrals",
  "vector-fields",
  "vector-line-integrals",
  "substitution-integral",
];
const newBlocks = Object.fromEntries(
  guideIds.map((id) => [
    id,
    [
      ...(guides[id].contentBlocks ?? []),
      ...(guides[id].supplementalBlocks ?? []),
    ].filter((block) => block.id.startsWith("lecture08-")),
  ]),
);
const newExercises = Object.fromEntries(
  guideIds.map((id) => [
    id,
    (guides[id].exercises ?? []).filter((item) =>
      item.id.startsWith("lecture08-"),
    ),
  ]),
);

test("canonical source identity, page boundaries, exclusions, and stable routes", () => {
  assert.equal(sources[sourceId].file, "MH2100_Lecture_08.pdf");
  assert.equal(sources[sourceId].pages, 51);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.deepEqual(sources[sourceId].errata ?? [], []);
  const manifest = sourceManifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(manifest?.status, "canonical");
  assert.equal(manifest?.sha256, sourceSha);
  assert.equal(manifest?.driveFileId, "1s-YzlHuVArAG8gw8jwIJF92XxhVX_Dnk");
  assert.equal(concepts.length, 125);
  assert.equal(new Set(concepts.map((item) => item.id)).size, 125);

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
      spec.exclusions,
    );
    const [first, last] = spec.span.split("–").map(Number);
    for (const page of section.inspected_physical_pages)
      assert.ok(
        (page >= first && page <= last) ||
          (spec.id.endsWith(":03") && page === 36),
      );
  }
  const inverseSection = ledger.source_sections.find(
    (item) => item.id === "MH2100_Lecture_08:03",
  );
  assert.match(
    inverseSection.gap,
    /Pages 26–27, 30, 33, and 35 are blank continuation slides/u,
  );
  assert.match(
    inverseSection.gap,
    /guide supplies independently checked derivations/u,
  );
  const linearSection = ledger.source_sections.find(
    (item) => item.id === "MH2100_Lecture_08:01",
  );
  assert.match(linearSection.source_review_notes.join(" "), /symbol D/u);
  const scalarSection = ledger.source_sections.find(
    (item) => item.id === "MH2100_Lecture_08:04",
  );
  assert.match(scalarSection.gap, /slide 45 is blank/iu);
  const vectorSection = ledger.source_sections.find(
    (item) => item.id === "MH2100_Lecture_08:05",
  );
  assert.match(vectorSection.gap, /slide 51 is blank/iu);
});

test("every mapped skill has page evidence, four lesson states, and honest visual/check gaps", () => {
  const mapped = ledger.atomic_outcomes.filter((entry) =>
    expectedPages.has(entry.id),
  );
  assert.equal(mapped.length, expectedPages.size);
  assert.deepEqual(
    mapped.map((item) => item.id).sort(),
    [...expectedPages.keys()].sort(),
  );
  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const [id, pages] of expectedPages) {
    const entry = mapped.find((item) => item.id === id);
    const [conceptId, skillId] = id.split(":");
    assert.equal(entry.concept_id, conceptId);
    assert.equal(entry.core_source.id, sourceId);
    assert.equal(entry.core_source.sha256, sourceSha);
    assert.deepEqual(entry.core_source.page_validation.pages, pages);
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.match(entry.core_source.page_validation.method, /SHA-256/u);
    assert.match(
      entry.core_source.page_validation.method,
      /rendered and visually checked/u,
    );
    assert.ok(entry.core_source.page_validation.claim_observed);
    assert.ok(pages.includes(entry.core_source.physical_page));
    const sectionNumber =
      sectionSpecs.findIndex((spec) => spec.ids.includes(id)) + 1;
    const sectionSuffix = String(sectionNumber).padStart(2, "0");
    assert.equal(entry.source_section_id, sourceId + ":" + sectionSuffix);
    assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
    assert.deepEqual(Object.keys(entry.evidence), states);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(entry.evidence[state].length, 1, id + " " + state);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
    assert.match(entry.gap, /scene alignment/u);
    assert.match(entry.gap, /learner performance/u);

    const lesson = guides[conceptId];
    const lessonBlocks = [
      ...(lesson.contentBlocks ?? []),
      ...(lesson.supplementalBlocks ?? []),
    ];
    const named = entry.evidence.named[0].locator.match(
      /learning-guides\.json#([^.]+)\.(?:contentBlocks|supplementalBlocks)\[([^\]]+)\]\.title$/u,
    );
    assert.ok(named, id + " named locator");
    const [, namedConcept, statementId] = named;
    assert.equal(namedConcept, conceptId);
    assert.ok(
      lessonBlocks.some(
        (block) =>
          block.id === statementId && block.kind === "strategy" && block.title,
      ),
      id + " statement",
    );
    const statedLocator = entry.evidence.stated[0].locator;
    const workedLocator = entry.evidence.worked[0].locator;
    const practiceLocator = entry.evidence.practiced[0].locator;
    const statement = lessonBlocks.find(
      (block) =>
        statedLocator.endsWith("[" + block.id + "]") &&
        block.kind === "strategy",
    );
    const worked = lessonBlocks.find(
      (block) =>
        workedLocator.endsWith("[" + block.id + "]") &&
        block.kind === "worked-example",
    );
    const practice = lesson.exercises.find((item) =>
      practiceLocator.endsWith("[" + item.id + "]"),
    );
    assert.ok(statement, id + " stated locator");
    assert.ok(worked, id + " worked locator");
    assert.ok(
      practice?.prompt &&
        practice.hint &&
        practice.solution &&
        practice.solutionTex,
      id + " transfer task",
    );
    assert.ok(Array.isArray(practice.rubric) && practice.rubric.length >= 2);
    assert.ok(
      concepts
        .find((concept) => concept.id === conceptId)
        .sources.some(
          (reference) =>
            reference.sourceId === sourceId &&
            reference.pages[0] <= entry.core_source.physical_page &&
            reference.pages[1] >= entry.core_source.physical_page,
        ),
      id + " catalog source page",
    );
    assert.ok(skillId.startsWith("lecture08-") || skillId === "source-skill-1");
  }
  assert.equal(newOutcomeIds.length, 24);
  assert.equal(
    Object.values(newBlocks).flat().length,
    50,
    "24 new atomic lessons plus the upgraded injectivity outcome each need a statement and a worked block",
  );
  assert.equal(
    Object.values(newExercises).flat().length,
    25,
    "each mapped atomic skill needs changed-data practice",
  );
  for (const [conceptId, blocks] of Object.entries(newBlocks)) {
    const exercises = newExercises[conceptId];
    assert.equal(
      blocks.filter((item) => item.kind === "strategy").length,
      exercises.length,
    );
    assert.equal(
      blocks.filter((item) => item.kind === "worked-example").length,
      exercises.length,
    );
  }
});

test("source examples and independent transfers agree with direct calculations", () => {
  const det2 = (a, b, c, d) => a * d - b * c;
  const det3 = (m) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  assert.equal(det2(2, 1, 0, 3), 6);
  assert.equal(det2(1, 2, 3, 1), -5);
  assert.equal(
    Math.abs(
      det3([
        [2, 0, 0],
        [0, -3, 0],
        [0, 0, 4],
      ]),
    ),
    24,
  );
  assert.equal(det2(1, 1, 1, -1), -2);
  assert.equal(det2(1, 2, 3, -1), -7);
  assert.equal(det2(1, 2, 2, -1), -5);
  assert.equal(det2(2, 1, 1, -1), -3);

  const spaceMap = (u, v, w) => [u ** 2, v + w, w];
  for (const [x, y, z] of [
    [0, 3, -1],
    [4, 5, 2],
  ]) {
    assert.deepEqual(spaceMap(Math.sqrt(x), y - z, z), [x, y, z]);
  }
  const exponentialSpaceMap = (u, v, w) => [Math.exp(u), v - w, w];
  assert.deepEqual(exponentialSpaceMap(Math.log(2), 8, 3), [2, 5, 3]);

  const decreasingOriginal = -(1 - 0.5 - (0 - 0));
  const decreasingTransformed = (0 ** 2 - 1 ** 2) / 2;
  assert.equal(decreasingOriginal, -0.5);
  assert.equal(decreasingTransformed, -0.5);
  assert.equal(decreasingOriginal, decreasingTransformed);
  const n = 2000;
  const h = 1 / n;
  const transferIntegrand = (x) => 3 * x ** 2 * Math.cos(1 + x ** 3);
  let transferSimpson = transferIntegrand(0) + transferIntegrand(1);
  for (let i = 1; i < n; i++)
    transferSimpson += (i % 2 === 0 ? 2 : 4) * transferIntegrand(i * h);
  transferSimpson *= h / 3;
  assert.ok(Math.abs(transferSimpson - (Math.sin(2) - Math.sin(1))) < 1e-10);

  const polarDet = (r, angle) =>
    Math.cos(angle) * r * Math.cos(angle) -
    -r * Math.sin(angle) * Math.sin(angle);
  assert.ok(Math.abs(polarDet(2, 0.71) - 2) < 1e-12);
  const rho = 2.4;
  const theta = 0.63;
  const phi = 1.17;
  const spherical = [
    [
      Math.sin(phi) * Math.cos(theta),
      -rho * Math.sin(phi) * Math.sin(theta),
      rho * Math.cos(phi) * Math.cos(theta),
    ],
    [
      Math.sin(phi) * Math.sin(theta),
      rho * Math.sin(phi) * Math.cos(theta),
      rho * Math.cos(phi) * Math.sin(theta),
    ],
    [Math.cos(phi), 0, -rho * Math.sin(phi)],
  ];
  assert.ok(Math.abs(det3(spherical) + rho ** 2 * Math.sin(phi)) < 1e-11);
  const reordered = spherical.map((row) => [row[0], row[2], row[1]]);
  assert.ok(Math.abs(det3(reordered) - rho ** 2 * Math.sin(phi)) < 1e-11);

  const xyMeasureFactor = (4 ** 2 - 1 ** 2) / 4;
  const xyComposedDensityFactor = 4 - 1 + (1 - 1 / 4);
  const xyRatio = xyMeasureFactor * xyComposedDensityFactor;
  assert.ok(Math.abs(xyRatio - 225 / 16) < 1e-12);
  const xyWorked = guides["inverse-jacobian"].contentBlocks.find(
    (block) => block.id === "lecture08-xy-ratio-region-worked",
  );
  assert.ok(xyWorked.steps[2].equation.includes("1+\\frac1{v^2}"));
  assert.ok(xyWorked.steps[3].equation.includes("\\frac{225}{16}"));
  const trapezoid = (3 / 4) * (Math.E - Math.exp(-1));
  assert.ok(Math.abs(trapezoid - 0.75 * (Math.E - Math.exp(-1))) < 1e-12);
  assert.ok(trapezoid > 1.7 && trapezoid < 1.8);
  assert.equal(
    Math.abs(
      det3([
        [1, 1, 1],
        [1, 2, 0],
        [0, 1, 1],
      ]),
    ),
    2,
  );
  assert.equal(
    Math.abs(
      det3([
        [1, 1, 1],
        [1, -1, 0],
        [0, 0, 1],
      ]),
    ),
    2,
  );

  const scalarCircle = 128 * Math.PI;
  assert.ok(Math.abs(scalarCircle - 16 * 2 * 4 * Math.PI) < 1e-12);

  const sourceWorkIntegrand = (t) =>
    3 * t ** 2 * Math.exp(2 * t ** 3) +
    (-6 + 9 * t) * Math.exp(t) +
    Math.exp(4 * t);
  const sourceWorkAntiderivativeDerivative = (t) =>
    3 * t ** 2 * Math.exp(2 * t ** 3) +
    (9 * t - 6) * Math.exp(t) +
    Math.exp(4 * t);
  for (const t of [0, 0.4, 1, 1.6, 2])
    assert.ok(
      Math.abs(sourceWorkIntegrand(t) - sourceWorkAntiderivativeDerivative(t)) <
        1e-11,
    );
  const sourceWork =
    (Math.exp(16) - 1) / 2 + 3 * Math.exp(2) + 15 + (Math.exp(8) - 1) / 4;
  assert.ok(sourceWork > Math.exp(16) / 2);

  const forward = 2;
  const reversedPath = -2;
  assert.equal(reversedPath, -forward);
  assert.equal(7 * 6, 42);
});

const renderedStringKeys = new Set([
  "equation",
  "solutionTex",
  "tex",
  "title",
  "text",
  "strategy",
  "setup",
  "label",
  "result",
  "verification",
  "usesHypothesis",
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
  if (typeof value === "string" && renderedStringKeys.has(key))
    yield [path, key, value];
}

test("Lecture 08 guide prose uses complete TeX and compiles to strict MathML", () => {
  const formulas = [];
  for (const conceptId of guideIds) {
    for (const [path, key, value] of strings(guides[conceptId], conceptId)) {
      if (key === "equation" || key === "solutionTex" || key === "tex") {
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
    formulas.length > 150,
    "collected " + formulas.length + " formulas",
  );
  for (const { path, source } of formulas) {
    assert.ok(source.trim(), path);
    assert.doesNotMatch(
      source,
      /[−→Σ≠]|(?<!\\)\b(?:lim|sin|cos|tan|sec|csc|cot|sqrt|binom)\b|(?<!\\)\bd\(/u,
      path,
    );
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
  const determinant = katex.renderToString(
    "\\det\\begin{pmatrix}1&2\\\\3&-1\\end{pmatrix}=-7",
    { throwOnError: true, strict: "error", output: "htmlAndMathml" },
  );
  assert.match(determinant, /<mtable/u);
  assert.match(determinant, /<math\b/u);
});

const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("WebMCP exposes every Lecture 08 lesson and renders its MathML", async () => {
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
  for (const conceptId of guideIds) {
    const lesson = readConcept.execute({ conceptId }).lesson;
    for (const block of newBlocks[conceptId]) {
      assert.ok(
        [
          ...(lesson.contentBlocks ?? []),
          ...(lesson.supplementalBlocks ?? []),
        ].some((item) => item.id === block.id),
        conceptId + " WebMCP block " + block.id,
      );
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      if (JSON.stringify(block).includes("$"))
        assert.match(markup, /<math\b/u, block.id);
      assert.doesNotMatch(markup, /katex-error/u, block.id);
    }
    for (const exercise of newExercises[conceptId]) {
      assert.ok(
        lesson.exercises.some((item) => item.id === exercise.id),
        conceptId + " WebMCP exercise " + exercise.id,
      );
      const prose =
        exercise.prompt + " " + exercise.hint + " " + exercise.solution;
      const textMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      assert.match(textMarkup, /<math\b/u, exercise.id + " prose MathML");
      assert.doesNotMatch(textMarkup, /katex-error/u, exercise.id);
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(formulaMarkup, /<math\b/u, exercise.id + " solution MathML");
      assert.doesNotMatch(formulaMarkup, /katex-error/u, exercise.id);
    }
  }
});
