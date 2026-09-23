import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import katex from "katex";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const sourceManifest = read("../lib/curriculum/source-manifest.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceId = "MH1100_Lecture_10";
const sourceSha =
  "0c7e98f04190c1c37ead08918d6ce215d42e5187618bb7baa63d925d4dc4c39e";
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const expected = {
  "MH1100_Lecture_10:01": {
    pages: [4, 21],
    ids: [
      "derivative-tests:lecture10-increasing-decreasing-sign-intervals",
      "derivative-tests:lecture10-first-derivative-extremum-test",
      "derivative-tests:lecture10-same-sign-no-extremum",
      "derivative-tests:lecture10-concavity-sign-test",
      "derivative-tests:lecture10-inflection-requires-concavity-change",
      "derivative-tests:lecture10-second-derivative-test-hypotheses",
      "derivative-tests:lecture10-second-derivative-inconclusive",
      "derivative-tests:lecture10-nondifferentiable-candidates-and-vertical-tangents",
    ],
    coverage: "mapped_with_reasoned_exclusions",
  },
  "MH1100_Lecture_10:02": {
    pages: [22, 39],
    ids: [
      "infinity-curve-sketching:lecture10-finite-limits-at-either-tail",
      "infinity-curve-sketching:lecture10-reciprocal-power-decay",
      "infinity-curve-sketching:lecture10-rational-limit-degree-method",
      "infinity-curve-sketching:lecture10-signed-infinite-tail-limits",
      "infinity-curve-sketching:lecture10-epsilon-n-tail-proof",
      "infinity-curve-sketching:lecture10-m-n-infinite-tail-definition",
    ],
    coverage: "partial_atomic_mapping",
  },
  "MH1100_Lecture_10:03": {
    pages: [24, 41],
    ids: [
      "infinity-curve-sketching:lecture10-horizontal-asymptote-tail-condition",
      "infinity-curve-sketching:lecture10-radical-tail-sign",
      "infinity-curve-sketching:lecture10-vertical-asymptote-one-sided-sign",
      "infinity-curve-sketching:lecture10-slant-asymptote-remainder",
    ],
    coverage: "partial_atomic_mapping",
  },
  "MH1100_Lecture_10:04": {
    pages: [42, 51],
    ids: [
      "infinity-curve-sketching:lecture10-domain-and-intercepts",
      "infinity-curve-sketching:lecture10-symmetry-and-domain-invariance",
      "infinity-curve-sketching:lecture10-asymptotes-in-sketch-checklist",
      "infinity-curve-sketching:lecture10-monotonicity-in-curve-sketch",
      "infinity-curve-sketching:lecture10-local-extrema-in-sketch",
      "infinity-curve-sketching:lecture10-concavity-in-curve-sketch",
      "infinity-curve-sketching:lecture10-assemble-curve-sketch",
    ],
    coverage: "partial_atomic_mapping",
  },
};
const mapped = ledger.atomic_outcomes.filter((entry) =>
  Object.hasOwn(expected, entry.source_section_id),
);
const guideIds = ["derivative-tests", "infinity-curve-sketching"];
const newBlocks = Object.fromEntries(
  guideIds.map((id) => [
    id,
    guides[id].contentBlocks.filter((block) => block.id.includes("lecture10")),
  ]),
);
const newExercises = Object.fromEntries(
  guideIds.map((id) => [
    id,
    guides[id].exercises.filter((exercise) =>
      exercise.id.includes("lecture10"),
    ),
  ]),
);

test("Lecture 10 source identity, page map, stable routes, and atomic evidence", () => {
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.equal(sources[sourceId].pages, 51);
  const manifest = sourceManifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(manifest?.status, "canonical");
  assert.equal(manifest?.sha256, sourceSha);
  assert.equal(concepts.length, 125);
  assert.equal(new Set(concepts.map((item) => item.id)).size, 125);
  assert.equal(mapped.length, 25);
  assert.deepEqual(
    Object.keys(expected).map(
      (id) => ledger.source_sections.find((section) => section.id === id)?.id,
    ),
    Object.keys(expected),
  );

  const mappedPages = new Set();
  for (const [sectionId, spec] of Object.entries(expected)) {
    const section = ledger.source_sections.find(
      (item) => item.id === sectionId,
    );
    assert.ok(section, sectionId);
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.equal(section.coverage_decision, spec.coverage);
    assert.deepEqual(section.atomic_outcome_ids, spec.ids);
    assert.match(section.physical_pages_from_audit, /Physical pages/);
    assert.match(
      section.gap,
      /no outcome-specific scene alignment or learner performance check/iu,
    );
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    assert.deepEqual(section.evidence, {
      named: [],
      stated: [],
      worked: [],
      practiced: [],
      visualized: [],
      checked: [],
    });
  }
  assert.match(
    ledger.source_sections.find((item) => item.id === "MH1100_Lecture_10:01")
      .physical_pages_from_audit,
    /4–21/,
  );
  assert.deepEqual(
    ledger.source_sections
      .find((item) => item.id === "MH1100_Lecture_10:01")
      .reviewed_exclusions.map((item) => item.physical_page),
    [1, 2, 3],
  );

  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  assert.deepEqual(
    mapped.map((item) => item.id),
    Object.values(expected).flatMap((spec) => spec.ids),
  );
  for (const [sectionId, spec] of Object.entries(expected)) {
    for (const id of spec.ids) {
      const entry = mapped.find((item) => item.id === id);
      assert.ok(entry, id);
      assert.equal(entry.source_section_id, sectionId);
      assert.equal(entry.core_source.id, sourceId);
      assert.equal(entry.core_source.sha256, sourceSha);
      assert.equal(entry.core_source.page_validation.status, "page_verified");
      assert.ok(entry.core_source.page_validation.claim_observed, id);
      assert.ok(
        entry.core_source.page_validation.pages.includes(
          entry.core_source.physical_page,
        ),
        id,
      );
      assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
      assert.equal(entry.depth, "source_page_and_cited_guide_inspected");
      assert.deepEqual(Object.keys(entry.evidence), states);
      for (const state of ["named", "stated", "worked", "practiced"])
        assert.equal(entry.evidence[state].length, 1, `${id} ${state}`);
      assert.deepEqual(entry.evidence.visualized, []);
      assert.deepEqual(entry.evidence.checked, []);
      assert.equal(entry.visual_candidate.verified_for_outcome, false);
      assert.match(entry.gap, /No outcome-specific scene alignment/);
      assert.match(entry.gap, /learner performance check/);

      const [conceptId, namedId] = id.split(":");
      assert.equal(entry.concept_id, conceptId);
      const lesson = concepts.find((item) => item.id === conceptId);
      assert.ok(lesson, conceptId);
      assert.ok(
        lesson.sources.some(
          (reference) =>
            reference.sourceId === sourceId &&
            reference.pages[0] <= entry.core_source.physical_page &&
            reference.pages[1] >= entry.core_source.physical_page,
        ),
        id,
      );
      assert.equal(namedId.startsWith("lecture10-"), true);
      for (const state of states.slice(0, 4)) {
        const evidence = entry.evidence[state][0];
        const match = evidence.locator.match(
          /learning-guides\.json#([^.]*)\.(contentBlocks|exercises)\[([^\]]+)\](\.title)?$/u,
        );
        assert.ok(match, `${id} ${state}: ${evidence.locator}`);
        const [, locatorConcept, collection, itemId, titleSuffix] = match;
        assert.equal(locatorConcept, conceptId);
        const item = guides[conceptId][collection].find(
          (candidate) => candidate.id === itemId,
        );
        assert.ok(item, `${id} ${state} locator`);
        if (state === "named") {
          assert.equal(collection, "contentBlocks");
          assert.equal(titleSuffix, ".title");
          assert.ok(item.title.trim());
        } else if (state === "stated") {
          assert.equal(collection, "contentBlocks");
          assert.equal(item.kind, "strategy");
        } else if (state === "worked") {
          assert.equal(collection, "contentBlocks");
          assert.equal(item.kind, "worked-example");
        } else {
          assert.equal(collection, "exercises");
          assert.ok(item.prompt && item.hint && item.solution);
          assert.ok(Array.isArray(item.rubric) && item.rubric.length >= 2);
        }
      }
      assert.equal(
        entry.evidence.named[0].locator,
        `lib/curriculum/learning-guides.json#${conceptId}.contentBlocks[${namedId}-statement].title`,
      );
      for (const page of entry.core_source.page_validation.pages) {
        mappedPages.add(page);
        assert.ok(
          Number.isInteger(page) &&
            page >= spec.pages[0] &&
            page <= spec.pages[1],
          id,
        );
      }
    }
  }
  assert.deepEqual(
    [...mappedPages].sort((a, b) => a - b),
    Array.from({ length: 48 }, (_, index) => index + 4),
  );
});

test("handout examples and transfer tasks have independent mathematical checks", () => {
  const firstDerivativeStatement = newBlocks["derivative-tests"].find(
    (block) =>
      block.id === "lecture10-first-derivative-extremum-test-statement",
  ).text;
  assert.match(
    firstDerivativeStatement,
    /continuous throughout an open interval/u,
  );
  assert.match(
    firstDerivativeStatement,
    /differentiable at every point.*except possibly/u,
  );
  assert.match(
    firstDerivativeStatement,
    /positive to negative.*local maximum/u,
  );
  assert.match(
    firstDerivativeStatement,
    /negative-to-positive.*local minimum/u,
  );
  const discontinuityContrast = guides["derivative-tests"].sections[0].text;
  assert.ok(discontinuityContrast.includes("$f(x)=-|x|$"));
  assert.ok(discontinuityContrast.includes("$x\\ne 0$"));
  assert.ok(discontinuityContrast.includes("$f(0)=-1$"));
  const secondDerivativeStatement = newBlocks["derivative-tests"].find(
    (block) =>
      block.id === "lecture10-second-derivative-test-hypotheses-statement",
  ).text;
  assert.match(
    secondDerivativeStatement,
    /twice continuously differentiable near \$c\$/u,
  );
  assert.ok(secondDerivativeStatement.includes("$f'(c)=0$"));
  const verticalTangentStatement = newBlocks["derivative-tests"].find(
    (block) =>
      block.id ===
      "lecture10-nondifferentiable-candidates-and-vertical-tangents-statement",
  ).text;
  assert.ok(verticalTangentStatement.includes("$|f'(x)|\\to\\infty$"));

  const sourceSignChart = newBlocks["derivative-tests"].find(
    (block) =>
      block.id === "lecture10-source-increasing-decreasing-sign-intervals",
  ).steps[1].equation;
  assert.equal(
    sourceSignChart,
    "(-1,0):(-)(-)(+) = +,\\qquad (0,2):(+)(-)(+) = -",
  );
  const derivativeFactorSigns = (x) => [12 * x, x - 2, x + 1].map(Math.sign);
  assert.deepEqual(derivativeFactorSigns(-0.5), [-1, -1, 1]);
  assert.deepEqual(derivativeFactorSigns(0.5), [1, -1, 1]);
  assert.ok(derivativeFactorSigns(-0.5).reduce((a, b) => a * b) > 0);
  assert.ok(derivativeFactorSigns(0.5).reduce((a, b) => a * b) < 0);

  const sourceRational = (x) => (2 * x ** 2) / (x ** 2 - 1);
  const sourceDerivative = (x) => (-4 * x) / (x ** 2 - 1) ** 2;
  for (const x of [-3, -2, -0.5, 0.5, 2, 3]) {
    const h = 1e-6;
    const differenceQuotient =
      (sourceRational(x + h) - sourceRational(x - h)) / (2 * h);
    assert.ok(Math.abs(differenceQuotient - sourceDerivative(x)) < 1e-7);
  }
  assert.ok(sourceDerivative(-2) > 0 && sourceDerivative(2) < 0);
  assert.equal(Math.abs(sourceRational(0)), 0);
  assert.equal(sourceRational(2), 8 / 3);
  assert.equal(sourceRational(-2), 8 / 3);

  const radicalTail = (x) => Math.sqrt(x ** 2 + 1) / x;
  assert.ok(Math.abs(radicalTail(1e8) - 1) < 1e-8);
  assert.ok(Math.abs(radicalTail(-1e8) + 1) < 1e-8);
  const slantRemainder = (x) => x ** 3 / (x ** 2 + 1) - x;
  for (const x of [-1e4, -100, 100, 1e4])
    assert.ok(Math.abs(slantRemainder(x)) < 0.011);

  const exercises = [
    ...newExercises["derivative-tests"],
    ...newExercises["infinity-curve-sketching"],
  ];
  assert.equal(exercises.length, 25);
  const firstDerivative = exercises.find((item) =>
    item.id.endsWith("first-derivative-extremum-test-transfer"),
  );
  assert.match(firstDerivative.solution, /local maximum/u);
  assert.match(firstDerivative.solution, /local minimum/u);
  const epsilonProof = exercises.find((item) =>
    item.id.endsWith("epsilon-n-tail-proof-transfer"),
  );
  assert.match(epsilonProof.solution, /N=5\/\\varepsilon/u);
  assert.match(epsilonProof.solution, /5\/x<\\varepsilon/u);
  const mNProof = exercises.find((item) =>
    item.id.endsWith("m-n-infinite-tail-definition-transfer"),
  );
  assert.ok(mNProof.solution.includes("N=\\sqrt M"));
  const slantTask = exercises.find((item) =>
    item.id.endsWith("slant-asymptote-remainder-transfer"),
  );
  assert.match(slantTask.solution, /both tails/u);
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

test("Lecture 10 guide math is complete TeX and compiles to strict MathML", () => {
  const formulas = [];
  const renderedStringKeys = new Set([
    "title",
    "text",
    "strategy",
    "setup",
    "label",
    "result",
    "verification",
    "prompt",
    "hint",
    "solution",
    "rubric",
  ]);
  const visit = (value, path, key = "") => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`, key));
      return;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return;
      if (["equation", "solutionTex", "tex"].includes(key)) {
        formulas.push({ path, source: value });
        return;
      }
      if (!renderedStringKeys.has(key)) return;
      assert.doesNotMatch(value, /\$\$|\$\s+\$|\$ -|- \$|\$ \+|\+ \$/u, path);
      assert.equal((value.match(/\$/gu) ?? []).length % 2, 0, path);
      const prose = value.replace(/\$([^$]+)\$/gu, (_match, source) => {
        formulas.push({ path, source });
        return "";
      });
      assert.doesNotMatch(
        prose,
        /[=<>≤≥±∞∈↦√^|]|[′″]|\b(?:f|g|h|p|q|r|s|u)\s*'{1,2}\s*(?:\(|=)|\b\d+\s*\/\s*[a-zA-Z]/u,
        `${path} has unmarked mathematical notation`,
      );
      return;
    }
    for (const [childKey, child] of Object.entries(value))
      visit(child, `${path}.${childKey}`, childKey);
  };
  for (const conceptId of guideIds) {
    visit(newBlocks[conceptId], `${conceptId}.contentBlocks`);
    visit(newExercises[conceptId], `${conceptId}.exercises`);
  }
  assert.ok(
    formulas.length > 100,
    `collected ${formulas.length} math expressions`,
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

  const radical = katex.renderToString(
    "\\lim_{x\\to-\\infty}\\frac{\\sqrt{x^2+1}}{x}=-1",
    { throwOnError: true, strict: "error", output: "htmlAndMathml" },
  );
  assert.match(radical, /<msqrt>/u);
  assert.match(radical, /<mfrac>/u);
});

test("WebMCP exposes every new lesson block and transfer task with rendered MathML", async () => {
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
        lesson.contentBlocks.some((item) => item.id === block.id),
        `${conceptId} WebMCP block ${block.id}`,
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
        `${conceptId} WebMCP exercise ${exercise.id}`,
      );
      const prose = `${exercise.prompt} ${exercise.hint} ${exercise.solution}`;
      const textMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      assert.match(textMarkup, /<math\b/u, `${exercise.id} prose MathML`);
      assert.doesNotMatch(textMarkup, /katex-error/u, exercise.id);
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(formulaMarkup, /<math\b/u, `${exercise.id} solution MathML`);
      assert.doesNotMatch(formulaMarkup, /katex-error/u, exercise.id);
    }
  }
});
