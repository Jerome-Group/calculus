import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
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
const manifest = read("../lib/curriculum/source-manifest.json");
const sourceId = "MH2100_Lecture_10";
const sourceSha =
  "2808e65d5eaf3aa2c3fbfa566c98514df21a6cda438193c8896f520685faa32e";
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
    id: "MH2100_Lecture_10:01",
    span: "2–9",
    topic: "Surface charts",
    concepts: ["surface-charts", "surface-tangent-vectors"],
    ids: [
      "surface-charts:interior-chart-is-a-homeomorphism",
      "surface-charts:surface-interior-and-edge",
      "surface-charts:source-radius-two-cylinder-chart",
      "surface-charts:source-hemisphere-chart-boundary",
      "surface-tangent-vectors:smooth-chart-rank-two-condition",
      "surface-tangent-vectors:piecewise-smooth-patch-union",
      "surface-tangent-vectors:two-unit-normals-from-tangent-cross-product",
    ],
    exclusions: [2],
  },
  {
    id: "MH2100_Lecture_10:02",
    span: "10–20",
    topic: "tangent vectors/area",
    concepts: ["scalar-surface-integrals", "surface-area-element"],
    ids: [
      "surface-area-element:nice-parametrization-hypotheses",
      "scalar-surface-integrals:parametric-scalar-density-integral",
      "scalar-surface-integrals:piecewise-scalar-integral-additivity",
      "scalar-surface-integrals:source-closed-surface-z-density",
      "scalar-surface-integrals:graph-surface-jacobian",
      "surface-area-element:source-paraboloid-area",
    ],
    exclusions: [14, 15, 20],
  },
  {
    id: "MH2100_Lecture_10:03",
    span: "21–29",
    topic: "surface orientation",
    concepts: ["surface-orientation"],
    ids: [
      "surface-orientation:source-skill-1",
      "surface-orientation:mobius-strip-seam-reverses-normal",
      "surface-orientation:choose-normal-sign-from-chart",
      "surface-orientation:graph-upward-and-downward-normal",
      "surface-orientation:positive-outward-boundary-orientation",
    ],
    exclusions: [21],
  },
  {
    id: "MH2100_Lecture_10:04",
    span: "30–40",
    topic: "surface flux",
    concepts: ["flux-through-surfaces"],
    ids: [
      "flux-through-surfaces:flux-is-normal-component",
      "flux-through-surfaces:orientation-respecting-flux-parametrization",
      "flux-through-surfaces:source-paraboloid-boundary-flux",
      "flux-through-surfaces:source-hemisphere-flux",
      "flux-through-surfaces:source-cone-hemisphere-closed-flux",
    ],
    exclusions: [33, 34, 36, 37, 39, 40],
  },
];
const expectedPages = new Map([
  ["surface-charts:interior-chart-is-a-homeomorphism", [3]],
  ["surface-charts:surface-interior-and-edge", [4]],
  ["surface-charts:source-radius-two-cylinder-chart", [5, 6]],
  ["surface-charts:source-hemisphere-chart-boundary", [6]],
  ["surface-tangent-vectors:smooth-chart-rank-two-condition", [7]],
  ["surface-tangent-vectors:piecewise-smooth-patch-union", [8]],
  ["surface-tangent-vectors:two-unit-normals-from-tangent-cross-product", [9]],
  ["surface-area-element:nice-parametrization-hypotheses", [10]],
  ["scalar-surface-integrals:parametric-scalar-density-integral", [11]],
  ["scalar-surface-integrals:piecewise-scalar-integral-additivity", [12]],
  ["scalar-surface-integrals:source-closed-surface-z-density", [13, 14, 15]],
  ["scalar-surface-integrals:graph-surface-jacobian", [16, 17]],
  ["surface-area-element:source-paraboloid-area", [18, 19, 20]],
  ["surface-orientation:source-skill-1", [22, 23, 24]],
  ["surface-orientation:mobius-strip-seam-reverses-normal", [25]],
  ["surface-orientation:choose-normal-sign-from-chart", [26, 27]],
  ["surface-orientation:graph-upward-and-downward-normal", [28]],
  ["surface-orientation:positive-outward-boundary-orientation", [29]],
  ["flux-through-surfaces:flux-is-normal-component", [30]],
  ["flux-through-surfaces:orientation-respecting-flux-parametrization", [31]],
  ["flux-through-surfaces:source-paraboloid-boundary-flux", [32, 33, 34]],
  ["flux-through-surfaces:source-hemisphere-flux", [35, 36, 37]],
  ["flux-through-surfaces:source-cone-hemisphere-closed-flux", [38, 39, 40]],
]);
const newIds = [...expectedPages.keys()].filter(
  (id) => id !== "surface-orientation:source-skill-1",
);
const guideIds = [
  ...new Set([...expectedPages.keys()].map((id) => id.split(":")[0])),
];
const newBlocks = Object.fromEntries(
  guideIds.map((id) => [
    id,
    (guides[id].contentBlocks ?? []).filter((block) =>
      block.id.startsWith("lecture10-"),
    ),
  ]),
);
const newExercises = Object.fromEntries(
  guideIds.map((id) => [
    id,
    (guides[id].exercises ?? []).filter((item) =>
      item.id.startsWith("lecture10-"),
    ),
  ]),
);
const idHash = (ids) =>
  crypto
    .createHash("sha256")
    .update([...ids].sort().join("\n"))
    .digest("hex");

test("canonical source, stable routes and outcome IDs, page spans, and exclusions", () => {
  assert.equal(sources[sourceId].file, "MH2100_Lecture_10.pdf");
  assert.equal(sources[sourceId].pages, 40);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.deepEqual(sources[sourceId].errata, []);
  assert.equal(concepts.length, 125);
  assert.equal(
    idHash(concepts.map((item) => item.id)),
    "8426adcc19d9c1f0023ce36c4c585f67d8b1f1bafa38fa039a1ea9d4e4fd4579",
  );
  const sourceManifest = manifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(sourceManifest.status, "canonical");
  assert.equal(sourceManifest.sha256, sourceSha);
  assert.equal(sourceManifest.driveFileId, "1kQYpUg1P4dFPxEpwlKp9hufqedM0EhQV");

  assert.equal(newIds.length, 22);
  const ledgerOutcomeIds = new Set(
    ledger.atomic_outcomes.map((item) => item.id),
  );
  for (const id of newIds) assert.ok(ledgerOutcomeIds.has(id), id);
  assert.equal(ledgerOutcomeIds.size, ledger.atomic_outcomes.length);

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
    assert.deepEqual(
      [...section.atomic_outcome_ids].sort(),
      [...spec.ids].sort(),
    );
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
      assert.ok(page >= first && page <= last, spec.id + " page " + page);
  }
  assert.equal(
    ledger.atomic_outcomes.find(
      (item) => item.id === "surface-orientation:source-skill-1",
    ).source_section_id,
    "MH2100_Lecture_10:03",
  );
  assert.match(
    ledger.source_sections.find((item) => item.id === "MH2100_Lecture_10:03")
      .gap,
    /Week 11 scope boundary|scene candidate/u,
  );
  for (const id of [
    "scalar-surface-integrals:source-closed-surface-z-density",
    "surface-area-element:source-paraboloid-area",
    "flux-through-surfaces:source-paraboloid-boundary-flux",
    "flux-through-surfaces:source-hemisphere-flux",
    "flux-through-surfaces:source-cone-hemisphere-closed-flux",
  ]) {
    const item = ledger.atomic_outcomes.find((entry) => entry.id === id);
    assert.match(
      item.core_source.page_validation.claim_observed,
      /no solution|blank/u,
      id,
    );
  }
});

test("each distinct skill has page-specific evidence, worked derivation, and transfer", () => {
  const mapped = ledger.atomic_outcomes.filter((entry) =>
    expectedPages.has(entry.id),
  );
  assert.equal(mapped.length, expectedPages.size);
  assert.deepEqual(
    mapped.map((item) => item.id).sort(),
    [...expectedPages.keys()].sort(),
  );
  for (const [id, pages] of expectedPages) {
    const entry = mapped.find((item) => item.id === id);
    const [conceptId, skillId] = id.split(":");
    assert.equal(entry.concept_id, conceptId);
    assert.equal(entry.core_source.id, sourceId);
    assert.equal(entry.core_source.sha256, sourceSha);
    assert.deepEqual(entry.core_source.page_validation.pages, pages);
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.match(
      entry.core_source.page_validation.method,
      /rendered and visually checked/u,
    );
    assert.ok(entry.core_source.page_validation.claim_observed);
    assert.ok(pages.includes(entry.core_source.physical_page));
    const section = sectionSpecs.find((spec) => spec.ids.includes(id));
    assert.equal(entry.source_section_id, section.id);
    assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
    assert.deepEqual(Object.keys(entry.evidence), states);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(entry.evidence[state].length, 1, id + " " + state);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
    assert.match(entry.gap, /not rendered and checked|not verified/u);
    assert.match(entry.gap, /learner performance is unverified/u);

    const lesson = guides[conceptId];
    const blocks = [
      ...(lesson.contentBlocks ?? []),
      ...(lesson.supplementalBlocks ?? []),
    ];
    const namedLocator = entry.evidence.named[0].locator;
    const match = namedLocator.match(
      /learning-guides\.json#([^.]+)\.contentBlocks\[([^\]]+)\]\.title$/u,
    );
    assert.ok(match, id + " named locator");
    const [, namedConcept, namedId] = match;
    assert.equal(namedConcept, conceptId);
    assert.ok(
      blocks.some(
        (block) =>
          block.id === namedId && block.kind === "strategy" && block.title,
      ),
      id + " named block",
    );
    assert.ok(
      blocks.some(
        (block) =>
          entry.evidence.stated[0].locator.endsWith("[" + block.id + "]") &&
          block.kind === "strategy",
      ),
      id + " stated block",
    );
    assert.ok(
      blocks.some(
        (block) =>
          entry.evidence.worked[0].locator.endsWith("[" + block.id + "]") &&
          block.kind === "worked-example" &&
          block.steps.length >= 2,
      ),
      id + " worked block",
    );
    const exercise = lesson.exercises.find((item) =>
      entry.evidence.practiced[0].locator.endsWith("[" + item.id + "]"),
    );
    assert.ok(
      exercise?.prompt &&
        exercise.hint &&
        exercise.solution &&
        exercise.solutionTex,
      id + " transfer",
    );
    assert.ok(exercise.rubric.length >= 2, id + " rubric");
    assert.ok(
      concepts
        .find((concept) => concept.id === conceptId)
        .sources.some(
          (ref) =>
            ref.sourceId === sourceId &&
            ref.pages[0] <= entry.core_source.physical_page &&
            ref.pages[1] >= entry.core_source.physical_page,
        ),
      id + " concept source page",
    );
    assert.ok(
      namedId.includes(`lecture10-${skillId}`),
      id + " stable block id",
    );
  }
  assert.equal(Object.values(newBlocks).flat().length, 46);
  assert.equal(Object.values(newExercises).flat().length, 23);
});

test("the five source prompts and the geometric sign checks recompute", () => {
  const cylinderAreaDensity = Math.hypot(-2 * Math.sin(0), 2 * Math.cos(0));
  assert.equal(cylinderAreaDensity, 2);
  const example1Side = 0.5 * (2 * Math.PI + Math.PI);
  const example1Top = Math.sqrt(2) * Math.PI;
  assert.ok(
    Math.abs(example1Side + example1Top - Math.PI * (1.5 + Math.sqrt(2))) <
      1e-12,
  );

  const example2 = (2 * Math.PI * (37 ** 1.5 - 1)) / 12;
  assert.ok(
    Math.abs(example2 - (Math.PI * (37 * Math.sqrt(37) - 1)) / 6) < 1e-12,
  );

  const example3 = 2 * Math.PI * (0.5 - 0.25);
  assert.equal(example3, Math.PI / 2);
  const example4 = 2 * Math.PI * 216 * (1 / 3);
  assert.ok(Math.abs(example4 - 144 * Math.PI) < 1e-12);
  const example5Cap = 8 * Math.PI;
  const example5Cone = -2 * (2 ** 2 / 2) * (2 * Math.PI);
  assert.equal(example5Cap + example5Cone, 0);

  const mobiusTransitionDeterminant = 1 * -1 - 0 * 0;
  assert.equal(mobiusTransitionDeterminant, -1);
  const mobiusTransfer = guides["surface-orientation"].exercises.find(
    (item) =>
      item.id === "lecture10-mobius-strip-seam-reverses-normal-transfer",
  );
  assert.match(mobiusTransfer.prompt, /\(2\\pi,-v\)/u);
  assert.match(mobiusTransfer.solution, /\[-1,1\].*maps onto itself/u);
  assert.equal(
    mobiusTransfer.solutionTex,
    String.raw`v\mapsto-v,\qquad\det\begin{pmatrix}1&0\\0&-1\end{pmatrix}=-1`,
  );
  assert.deepEqual([-1, 1].map((v) => -v).sort(), [-1, 1]);
  assert.equal(Math.hypot(2, -1, 2), 3);
  const graphNormalLength = Math.hypot(-5, 12, 1);
  assert.equal(graphNormalLength, Math.sqrt(170));
  assert.notEqual(graphNormalLength, 13);
  const graphNormalTransfer = guides["surface-orientation"].exercises.find(
    (item) => item.id === "lecture10-graph-upward-and-downward-normal-transfer",
  );
  assert.match(graphNormalTransfer.solutionTex, /\\sqrt\{170\}/u);
  assert.doesNotMatch(graphNormalTransfer.solutionTex, /\/13/u);
  const graphDensity = 3 / 2 + 2 + 1;
  const graphFactor = Math.hypot(1, 3, 4);
  assert.equal(graphDensity, 9 / 2);
  assert.ok(
    Math.abs(graphDensity * graphFactor - (9 * Math.sqrt(26)) / 2) < 1e-12,
  );
  const graphIntegralTransfer = guides[
    "scalar-surface-integrals"
  ].exercises.find(
    (item) => item.id === "lecture10-graph-surface-jacobian-transfer",
  );
  assert.match(
    graphIntegralTransfer.solutionTex,
    /\\sqrt\{26\}.*9\\sqrt\{26\}/u,
  );
  assert.doesNotMatch(graphIntegralTransfer.solutionTex, /45\/2/u);
  const graphUp = [-2 * 3, -3, 1];
  const graphDown = graphUp.map((component) => -component);
  assert.ok(graphUp[2] > 0);
  assert.ok(graphDown[2] < 0);
  assert.equal(
    graphUp[0] * graphDown[0] +
      graphUp[1] * graphDown[1] +
      graphUp[2] * graphDown[2],
    -46,
  );
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
function* allStrings(value, path) {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries())
      yield* allStrings(item, path + "[" + index + "]");
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value))
      yield* allStrings(child, path + "." + key);
    return;
  }
  if (typeof value === "string") yield [path, value];
}

test("Lecture 10 guide math compiles to strict MathML", () => {
  const formulas = [];
  for (const conceptId of guideIds) {
    const lesson = {
      contentBlocks: (guides[conceptId].contentBlocks ?? []).filter((block) =>
        block.id.startsWith("lecture10-"),
      ),
      exercises: (guides[conceptId].exercises ?? []).filter((item) =>
        item.id.startsWith("lecture10-"),
      ),
    };
    for (const [path, key, value] of strings(lesson, conceptId)) {
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
    assert.ok(source.trim(), path);
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
  for (const record of [
    ...Object.values(newBlocks).flat(),
    ...Object.values(newExercises).flat(),
  ])
    for (const [path, value] of allStrings(record, record.id))
      assert.doesNotMatch(value, /[\u0000-\u001f\u007f]/u, path);
});

const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("WebMCP read_concept exposes every Lecture 10 block and rendered MathML", async () => {
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
      if (
        JSON.stringify(block).includes("$") ||
        block.kind === "worked-example"
      )
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
      if (prose.includes("$"))
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
