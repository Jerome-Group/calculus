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
const sourceId = "MH1100_Lecture_12";
const sourceSha =
  "7f27aae06453b925ce419ee020d82a4c4ba9a358e4ac452e097e0abcaa7a096d";
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const expected = [
  ["inverse-functions", "one-to-one-horizontal-line-test", 5, [4, 5, 6], "01"],
  ["inverse-functions", "inverse-domain-range-identities", 7, [7], "01"],
  ["inverse-functions", "solve-for-inverse", 8, [8, 10], "01"],
  ["inverse-functions", "graph-inverse-reflection", 9, [9, 12], "01"],
  ["inverse-functions", "inverse-continuity", 11, [11], "01"],
  [
    "inverse-functions",
    "inverse-derivative-reciprocal-slope",
    14,
    [11, 13, 14],
    "01",
  ],
  [
    "inverse-functions",
    "compute-inverse-derivative-at-output",
    15,
    [15, 16],
    "01",
  ],
  [
    "exponential-logarithmic",
    "exponential-base-behavior",
    17,
    [17, 18, 19, 20],
    "02",
  ],
  [
    "exponential-logarithmic",
    "exponential-end-behavior-limits",
    21,
    [20, 21, 22],
    "02",
  ],
  [
    "exponential-logarithmic",
    "general-exponential-derivative",
    23,
    [23, 24, 35],
    "02",
  ],
  [
    "exponential-logarithmic",
    "chain-and-product-exponential-rules",
    25,
    [25],
    "02",
  ],
  ["exponential-logarithmic", "log-as-inverse-and-domain", 26, [26, 27], "02"],
  [
    "exponential-logarithmic",
    "log-laws-and-evaluation",
    29,
    [28, 29, 30],
    "02",
  ],
  ["exponential-logarithmic", "logarithmic-end-behavior", 29, [29], "02"],
  ["exponential-logarithmic", "logarithm-slower-than-powers", 31, [31], "02"],
  ["exponential-logarithmic", "natural-log-chain-rule", 32, [32, 33], "02"],
  ["exponential-logarithmic", "change-of-base-log-derivative", 34, [34], "02"],
  [
    "exponential-logarithmic",
    "log-differentiate-products-and-quotients",
    36,
    [36, 37],
    "02",
  ],
  [
    "exponential-logarithmic",
    "log-differentiate-variable-powers",
    38,
    [38, 39],
    "02",
  ],
  ["exponential-logarithmic", "derive-e-limit", 41, [41, 42], "02"],
];
const idFor = ([concept, slug]) => `${concept}:lecture12-${slug}`;
const sectionFor = (section) => `MH1100_Lecture_12:${section}`;
const guideIds = [...new Set(expected.map(([concept]) => concept))];
const guideBlocks = Object.fromEntries(
  guideIds.map((id) => [
    id,
    (guides[id].contentBlocks ?? []).filter((block) =>
      block.id.startsWith("lecture12-"),
    ),
  ]),
);
const guideExercises = Object.fromEntries(
  guideIds.map((id) => [
    id,
    (guides[id].exercises ?? []).filter((exercise) =>
      exercise.id.startsWith("lecture12-"),
    ),
  ]),
);

test("Lecture 12 identity, physical spans, exclusions, and atomic evidence", () => {
  assert.equal(sources[sourceId].pages, 42);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.equal(sources[sourceId].errata[0].page, 27);
  assert.match(sources[sourceId].errata[0].correction, /requires \$b>1\$/u);
  assert.match(sources[sourceId].errata[0].correction, /0<b<1/u);
  const manifest = sourceManifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(manifest?.status, "canonical");
  assert.equal(manifest?.sha256, sourceSha);

  for (const [sectionNumber, span, excludedPages] of [
    ["01", "4–16", [1, 2, 3]],
    ["02", "17–42", [40]],
  ]) {
    const section = ledger.source_sections.find(
      (item) => item.id === sectionFor(sectionNumber),
    );
    assert.ok(section, sectionNumber);
    assert.equal(section.physical_page_span, span);
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.deepEqual(
      section.atomic_outcome_ids,
      expected.filter((item) => item[4] === sectionNumber).map(idFor),
    );
    assert.deepEqual(
      section.reviewed_exclusions.map((item) => item.physical_page),
      excludedPages,
    );
    assert.match(
      section.gap,
      /no outcome-specific scene alignment or learner performance check/iu,
    );
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    assert.deepEqual(
      section.evidence,
      Object.fromEntries(states.map((state) => [state, []])),
    );
  }

  assert.equal(ledger.atomic_outcomes.length, 320);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    320,
  );
  const selected = expected.map((item) =>
    ledger.atomic_outcomes.find((outcome) => outcome.id === idFor(item)),
  );
  assert.ok(selected.every(Boolean));
  assert.equal(guideBlocks["inverse-functions"].length, 21);
  assert.equal(guideExercises["inverse-functions"].length, 7);
  assert.equal(guideBlocks["exponential-logarithmic"].length, 39);
  assert.equal(guideExercises["exponential-logarithmic"].length, 13);

  for (const [conceptId, slug, page, pageEvidence, sectionNumber] of expected) {
    const id = `${conceptId}:lecture12-${slug}`;
    const entry = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.equal(entry.source_section_id, sectionFor(sectionNumber), id);
    assert.equal(entry.core_source.id, sourceId, id);
    assert.equal(entry.core_source.sha256, sourceSha, id);
    assert.equal(entry.core_source.physical_page, page, id);
    assert.equal(entry.core_source.page_validation.status, "page_verified", id);
    assert.deepEqual(entry.core_source.page_validation.pages, pageEvidence, id);
    assert.ok(entry.core_source.page_validation.claim_observed, id);
    assert.equal(
      entry.verification,
      "source_page_and_cited_guide_inspected",
      id,
    );
    assert.equal(entry.depth, "source_page_and_cited_guide_inspected", id);
    assert.deepEqual(Object.keys(entry.evidence), states, id);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(entry.evidence[state].length, 1, `${id} ${state}`);
    assert.deepEqual(entry.evidence.visualized, [], id);
    assert.deepEqual(entry.evidence.checked, [], id);
    assert.equal(entry.visual_candidate.verified_for_outcome, false, id);
    assert.match(entry.gap, /No outcome-specific scene alignment/iu, id);
    assert.match(entry.gap, /learner performance check/iu, id);

    const concept = concepts.find((item) => item.id === conceptId);
    assert.ok(
      concept.sources.some(
        (source) =>
          source.sourceId === sourceId &&
          source.pages[0] <= page &&
          source.pages[1] >= page,
      ),
      `${id} retained in stable concept source links`,
    );
    const blockId = `lecture12-${slug}`;
    const namedBlock = guides[conceptId].contentBlocks.find(
      (block) => block.id === `${blockId}-statement`,
    );
    const statedBlock = guides[conceptId].contentBlocks.find(
      (block) => block.id === `${blockId}-strategy`,
    );
    const workedBlock = guides[conceptId].contentBlocks.find(
      (block) => block.id === `${blockId}-worked`,
    );
    const exercise = guides[conceptId].exercises.find(
      (task) => task.id === `${blockId}-transfer`,
    );
    assert.ok(namedBlock?.title, `${id} named`);
    assert.equal(statedBlock?.kind, "strategy", `${id} stated`);
    assert.equal(workedBlock?.kind, "worked-example", `${id} worked`);
    assert.ok(
      exercise?.prompt && exercise.hint && exercise.solution,
      `${id} practiced`,
    );
    assert.ok(exercise.rubric.length >= 2, `${id} rubric`);
    assert.match(
      entry.evidence.named[0].locator,
      new RegExp(`\\[${blockId}-statement\\]\\.title$`, "u"),
    );
    assert.match(
      entry.evidence.stated[0].locator,
      new RegExp(`\\[${blockId}-strategy\\]$`, "u"),
    );
    assert.match(
      entry.evidence.worked[0].locator,
      new RegExp(`\\[${blockId}-worked\\]$`, "u"),
    );
    assert.match(
      entry.evidence.practiced[0].locator,
      new RegExp(`\\[${blockId}-transfer\\]$`, "u"),
    );
  }

  assert.deepEqual(
    [
      ...new Set(
        selected.flatMap((entry) => entry.core_source.page_validation.pages),
      ),
    ].sort((a, b) => a - b),
    [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42,
    ],
  );
});

test("source-specific examples distinguish hypotheses, methods, and domains", () => {
  const inverse = guides["inverse-functions"].contentBlocks;
  const exponential = guides["exponential-logarithmic"].contentBlocks;
  const block = (blocks, id) => blocks.find((item) => item.id === id);

  const injectivity = block(
    inverse,
    "lecture12-one-to-one-horizontal-line-test-worked",
  );
  assert.match(injectivity.result, /horizontal line/u);
  const inverseDerivative = block(
    inverse,
    "lecture12-inverse-derivative-reciprocal-slope-worked",
  );
  assert.ok(JSON.stringify(inverseDerivative).includes("f(f^{-1}(y))=y"));
  assert.ok(
    JSON.stringify(inverseDerivative).includes("f'(f^{-1}(y))(f^{-1})'(y)=1"),
  );
  const cubicOutput = block(
    inverse,
    "lecture12-compute-inverse-derivative-at-output-worked",
  );
  assert.match(JSON.stringify(cubicOutput), /f\(1\)=1/u);
  assert.ok(cubicOutput.steps[2].equation.includes("\\frac12"));
  const inverseTransfer = guides["inverse-functions"].exercises.find(
    (exercise) =>
      exercise.id === "lecture12-compute-inverse-derivative-at-output-transfer",
  );
  assert.match(inverseTransfer.solution, /f\(0\)=1/u);
  assert.match(inverseTransfer.solution, /1\/2/u);

  const baseBehavior = block(
    exponential,
    "lecture12-exponential-base-behavior-statement",
  );
  assert.match(baseBehavior.statement, /0<b<1/u);
  assert.match(baseBehavior.statement, /b>1/u);
  const exponentialDerivative = block(
    exponential,
    "lecture12-general-exponential-derivative-worked",
  );
  assert.ok(exponentialDerivative.steps[0].text.includes("b^x=e^{x\\ln b}"));
  assert.ok(exponentialDerivative.steps[2].equation.includes("\\ln(10)"));
  const logDomain = block(
    exponential,
    "lecture12-log-as-inverse-and-domain-statement",
  );
  assert.match(logDomain.statement, /b>0/u);
  assert.match(logDomain.statement, /b\\ne1/u);
  assert.match(logDomain.statement, /x>0/u);
  const variablePower = block(
    exponential,
    "lecture12-log-differentiate-variable-powers-worked",
  );
  assert.match(JSON.stringify(variablePower), /x>0/u);
  assert.ok(variablePower.setup.includes("x^{\\sin x}"));

  const logarithmicEndBehavior = block(
    exponential,
    "lecture12-logarithmic-end-behavior-worked",
  );
  assert.match(logarithmicEndBehavior.setup, /\\tan\^2 x/u);
  assert.match(logarithmicEndBehavior.result, /-\\infty/u);
  assert.ok(JSON.stringify(logarithmicEndBehavior).includes("10^{-M}"));
  assert.equal(
    logarithmicEndBehavior.steps[2].equation.includes("\\\\"),
    false,
    "the raw TeX stores single command slashes",
  );
  assert.match(
    guides["exponential-logarithmic"].exercises.find(
      (exercise) =>
        exercise.id === "lecture12-logarithmic-end-behavior-transfer",
    ).solution,
    /\\sin\^2x/u,
  );

  const statement = block(
    exponential,
    "lecture12-logarithm-slower-than-powers-statement",
  );
  assert.match(statement.status, /result stated; proof deferred/u);
  const growth = guides["exponential-logarithmic"].sections.find(
    (item) => item.title === "Base condition in the growth comparison",
  );
  assert.match(growth.text, /0<b<1/u);
});

test("independent calculations check the source-derived formulas", () => {
  const close = (actual, expectedValue, tolerance, label) =>
    assert.ok(
      Math.abs(actual - expectedValue) < tolerance,
      `${label}: ${actual}`,
    );
  const derivative = (fn, x, h = 1e-5) => (fn(x + h) - fn(x - h)) / (2 * h);

  const oneToOne = (x) => x ** 3 - 3 * x;
  close(oneToOne(Math.sqrt(3)), 0, 1e-14, "first repeated output");
  close(oneToOne(-Math.sqrt(3)), 0, 1e-14, "second repeated output");

  const inverseSource = (x) => x ** 3 + x;
  assert.equal(inverseSource(1), 2);
  assert.equal(3 * 1 ** 2 + 1, 4);
  close(1 / (3 * 1 ** 2 + 1), 0.25, 1e-14, "inverse reciprocal slope");

  const exponential = (x) => 10 ** (x ** 2);
  const exponentialSlope = (x) => 2 * x * Math.log(10) * exponential(x);
  close(
    derivative(exponential, 0.7),
    exponentialSlope(0.7),
    1e-7,
    "general exponential derivative",
  );

  const quotientExponential = (x) => Math.exp(2 * x) / (Math.exp(2 * x) + 1);
  close(quotientExponential(25), 1, 1e-12, "exponential tail quotient");

  const baseLog = (x) => Math.log(2 + Math.sin(x)) / Math.log(10);
  close(
    derivative(baseLog, 0.4),
    Math.cos(0.4) / ((2 + Math.sin(0.4)) * Math.log(10)),
    1e-8,
    "change-of-base derivative",
  );

  const logProduct = (x) =>
    (x ** (3 / 4) * Math.sqrt(x ** 2 + 1)) / (3 * x + 2) ** 5;
  const logProductSlope = (x) =>
    logProduct(x) * (3 / (4 * x) + x / (x ** 2 + 1) - 15 / (3 * x + 2));
  close(
    derivative(logProduct, 2),
    logProductSlope(2),
    1e-9,
    "logarithmic differentiation",
  );

  const variablePower = (x) => x ** Math.sin(x);
  const variablePowerSlope = (x) =>
    variablePower(x) * (Math.cos(x) * Math.log(x) + Math.sin(x) / x);
  close(
    derivative(variablePower, 1.3),
    variablePowerSlope(1.3),
    1e-8,
    "variable exponent derivative",
  );

  const logTanSquared = (x) => Math.log10(Math.tan(x) ** 2);
  assert.ok(logTanSquared(1e-4) < -7);
  assert.ok(logTanSquared(1e-4) < logTanSquared(1e-3));
  assert.equal(Math.tan(0) ** 2, 0, "endpoint argument is not positive");

  close((1 + 1 / 1_000_000) ** 1_000_000, Math.E, 3e-6, "sequence limit for e");
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

test("Lecture 12 guide mathematics parses and preserves rendered MathML", () => {
  const formulas = [];
  const renderKeys = new Set([
    "title",
    "text",
    "strategy",
    "setup",
    "label",
    "result",
    "verification",
    "statement",
    "status",
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
      if (!renderKeys.has(key)) return;
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
    visit(guideBlocks[conceptId], `${conceptId}.contentBlocks`);
    visit(guideExercises[conceptId], `${conceptId}.exercises`);
  }
  assert.ok(formulas.length > 120, `collected ${formulas.length} expressions`);
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
});

test("WebMCP read_concept exposes the new lesson content and rendered practice", async () => {
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
    for (const block of guideBlocks[conceptId]) {
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
    for (const exercise of guideExercises[conceptId]) {
      assert.ok(
        lesson.exercises.some((item) => item.id === exercise.id),
        exercise.id,
      );
      const prose = `${exercise.prompt} ${exercise.hint} ${exercise.solution}`;
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      assert.match(proseMarkup, /<math\b/u, `${exercise.id} prose`);
      assert.doesNotMatch(proseMarkup, /katex-error/u, exercise.id);
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(formulaMarkup, /<math\b/u, `${exercise.id} solution`);
      assert.doesNotMatch(formulaMarkup, /katex-error/u, exercise.id);
    }
  }
});
