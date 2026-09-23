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
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const sourceManifest = read("../lib/curriculum/source-manifest.json");
const guides = read("../lib/curriculum/learning-guides.json");
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());
const sourceId = "MH1101_Chapter_05_Notes";
const sourceSha =
  "bbc200fe851ebf5e77c1225b13d617fb4cdb8364c13645e5ced59be730130385";
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const expected = [
  [
    "integral-test",
    "source-skill-1",
    "01",
    3,
    [2, 3, 4, 5],
    [
      "ch05-integral-test-hypotheses-worked",
      "ch05-integral-test-arctangent-worked",
      "ch05-integral-test-log-over-n-worked",
    ],
    "ch05-integral-test-hypotheses-transfer",
  ],
  [
    "integral-test",
    "ch05-p-series-threshold",
    "01",
    4,
    [4, 5],
    ["ch05-p-series-threshold-worked"],
    "ch05-p-series-threshold-transfer",
  ],
  [
    "integral-test",
    "ch05-integral-remainder-estimate",
    "01",
    3,
    [3],
    ["ch05-integral-remainder-estimate-worked"],
    "ch05-integral-remainder-estimate-transfer",
  ],
  [
    "integral-test",
    "ch05-log-p-series-threshold",
    "01",
    6,
    [6],
    ["ch05-log-p-series-threshold-worked"],
    "ch05-log-p-series-threshold-transfer",
  ],
  [
    "comparison-tests",
    "ch05-direct-comparison",
    "02",
    7,
    [7, 8, 9],
    ["ch05-direct-comparison-worked"],
    "ch05-direct-comparison-transfer",
  ],
  [
    "comparison-tests",
    "ch05-limit-comparison",
    "02",
    9,
    [9, 10, 11, 12],
    ["ch05-limit-comparison-worked"],
    "ch05-limit-comparison-transfer",
  ],
  [
    "absolute-conditional-alternating",
    "ch05-absolute-implies-convergence",
    "03",
    14,
    [13, 14],
    [
      "ch05-absolute-implies-convergence-worked",
      "ch05-absolute-source-example-worked",
    ],
    "ch05-absolute-implies-convergence-transfer",
  ],
  [
    "absolute-conditional-alternating",
    "ch05-absolute-majorant",
    "03",
    15,
    [15],
    ["ch05-absolute-majorant-worked"],
    "ch05-absolute-majorant-transfer",
  ],
  [
    "absolute-conditional-alternating",
    "alternating-hypotheses",
    "03",
    16,
    [16, 17],
    ["ch05-alternating-hypotheses-worked"],
    "ch05-alternating-hypotheses-transfer",
  ],
  [
    "absolute-conditional-alternating",
    "conditional-classification",
    "03",
    16,
    [15, 16, 17, 18],
    [
      "ch05-conditional-logarithmic-worked",
      "ch05-conditional-rational-worked",
      "alternating-root-series-classification",
    ],
    "alternating-rational-transfer",
  ],
  [
    "absolute-conditional-alternating",
    "ch05-alternating-remainder-estimate",
    "03",
    16,
    [16],
    ["ch05-alternating-remainder-estimate-worked"],
    "ch05-alternating-remainder-estimate-transfer",
  ],
  [
    "ratio-root-tests",
    "ch05-ratio-test-criteria",
    "04",
    19,
    [19, 20, 21, 22],
    ["ch05-ratio-test-criteria-worked"],
    "ch05-ratio-test-criteria-transfer",
  ],
  [
    "ratio-root-tests",
    "source-skill-1",
    "04",
    19,
    [19, 21, 23],
    ["ch05-test-limit-one-worked"],
    "ch05-test-limit-one-transfer",
  ],
  [
    "ratio-root-tests",
    "ch05-root-test-criteria",
    "04",
    23,
    [23, 24],
    ["ch05-root-test-criteria-worked"],
    "ch05-root-test-criteria-transfer",
  ],
  [
    "ratio-root-tests",
    "ch05-test-selection",
    "04",
    24,
    [19, 20, 21, 23, 24],
    ["ch05-test-selection-worked"],
    "ch05-test-selection-transfer",
  ],
];
const outcomeId = ([concept, slug]) => `${concept}:${slug}`;
const sectionId = (section) => `${sourceId}:${section}`;
const ch05Outcomes = ledger.atomic_outcomes.filter(
  (item) => item.core_source.id === sourceId,
);
const guideAssets = Object.fromEntries(
  [
    "integral-test",
    "comparison-tests",
    "absolute-conditional-alternating",
    "ratio-root-tests",
  ].map((id) => [
    id,
    {
      blocks: guides[id].contentBlocks.filter(
        (item) =>
          item.id.startsWith("ch05-") ||
          item.id === "alternating-root-series-classification",
      ),
      exercises: guides[id].exercises.filter(
        (item) =>
          item.id.startsWith("ch05-") ||
          item.id === "alternating-rational-transfer",
      ),
    },
  ]),
);

test("Chapter 05 canonical identity, errata, exclusions, and page spans are verified", () => {
  assert.equal(sources[sourceId].pages, 24);
  assert.equal(sources[sourceId].sha256, sourceSha);
  const manifest = sourceManifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(manifest?.status, "canonical");
  assert.equal(manifest?.sha256, sourceSha);
  assert.deepEqual(
    sources[sourceId].errata.map((item) => item.page),
    [6, 17],
  );
  assert.match(sources[sourceId].errata[0].correction, /u=\\ln x/u);
  assert.match(sources[sourceId].errata[1].correction, /p=1\/2\\le1/u);

  const spans = {
    "01": ["2–6", [1]],
    "02": ["7–12", []],
    "03": ["13–18", []],
    "04": ["19–24", []],
  };
  for (const [number, [span, exclusions]] of Object.entries(spans)) {
    const section = ledger.source_sections.find(
      (item) => item.id === sectionId(number),
    );
    assert.ok(section, number);
    assert.equal(section.physical_page_span, span);
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    const [start, end] = span.split("–").map(Number);
    assert.deepEqual(
      section.inspected_physical_pages,
      Array.from({ length: end - start + 1 }, (_, index) => start + index),
    );
    assert.deepEqual(
      section.reviewed_exclusions.map((item) => item.physical_page),
      exclusions,
    );
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    assert.deepEqual(
      section.evidence,
      Object.fromEntries(states.map((state) => [state, []])),
    );
    assert.deepEqual(
      section.atomic_outcome_ids,
      expected.filter((item) => item[2] === number).map(outcomeId),
    );
    assert.match(section.gap, /scene alignment/iu);
    assert.match(section.gap, /learner performance/iu);
  }
  assert.deepEqual(
    ledger.source_sections
      .filter((section) => section.source_id === sourceId)
      .map((section) => section.physical_page_span),
    ["2–6", "7–12", "13–18", "19–24"],
  );
});

test("Chapter 05 maps distinct source skills with four evidence states and honest gaps", () => {
  assert.equal(ch05Outcomes.length, expected.length);
  assert.equal(
    new Set(ch05Outcomes.map((item) => item.id)).size,
    expected.length,
  );
  const chosen = expected.map((item) =>
    ch05Outcomes.find((outcome) => outcome.id === outcomeId(item)),
  );
  assert.ok(chosen.every(Boolean));

  for (const [
    conceptId,
    slug,
    section,
    page,
    pages,
    workIds,
    exerciseId,
  ] of expected) {
    const id = `${conceptId}:${slug}`;
    const outcome = ch05Outcomes.find((item) => item.id === id);
    assert.ok(outcome, id);
    assert.equal(outcome.source_section_id, sectionId(section), id);
    assert.equal(outcome.core_source.id, sourceId, id);
    assert.equal(outcome.core_source.sha256, sourceSha, id);
    assert.equal(outcome.core_source.physical_page, page, id);
    assert.deepEqual(outcome.core_source.page_validation.pages, pages, id);
    assert.equal(
      outcome.core_source.page_validation.status,
      "page_verified",
      id,
    );
    assert.equal(
      outcome.verification,
      "source_page_and_cited_guide_inspected",
      id,
    );
    assert.equal(outcome.depth, "source_page_and_cited_guide_inspected", id);
    assert.deepEqual(Object.keys(outcome.evidence), states, id);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(outcome.evidence[state].length > 0, `${id} ${state}`);
    assert.deepEqual(outcome.evidence.visualized, [], id);
    assert.deepEqual(outcome.evidence.checked, [], id);
    assert.equal(outcome.visual_candidate.verified_for_outcome, false, id);
    assert.match(outcome.gap, /scene alignment/iu, id);
    assert.match(outcome.gap, /learner performance/iu, id);

    const concept = concepts.find((item) => item.id === conceptId);
    const expectedSpan = {
      "01": [2, 6],
      "02": [7, 12],
      "03": [13, 18],
      "04": [19, 24],
    }[section];
    assert.ok(
      concept.sources.some(
        (source) =>
          source.sourceId === sourceId &&
          source.pages[0] <= page &&
          source.pages[1] >= page &&
          source.pages[0] === expectedSpan[0] &&
          source.pages[1] === expectedSpan[1],
      ),
      `${id} stable concept source link`,
    );

    const lesson = guideAssets[conceptId];
    const statement = lesson.blocks.find(
      (block) =>
        block.id ===
        outcome.evidence.named[0].locator.match(/\[([^\]]+)\]/u)?.[1],
    );
    assert.ok(statement?.title, `${id} named`);
    assert.equal(
      statement.id,
      outcome.evidence.named[0].locator.match(/\[([^\]]+)\]/u)?.[1],
    );
    for (const workId of workIds)
      assert.ok(
        lesson.blocks.some((block) => block.id === workId),
        `${id} ${workId}`,
      );
    assert.ok(
      lesson.exercises.some((exercise) => exercise.id === exerciseId),
      `${id} transfer`,
    );
    assert.match(
      outcome.evidence.practiced[0].locator,
      new RegExp(`\\[${exerciseId}\\]$`, "u"),
    );
  }

  assert.deepEqual(
    [
      ...new Set(
        chosen.flatMap((item) => item.core_source.page_validation.pages),
      ),
    ].sort((a, b) => a - b),
    Array.from({ length: 23 }, (_, index) => index + 2),
  );
});

test("source examples preserve comparison signs and strict test boundaries", () => {
  const close = (actual, expectedValue, tolerance, label) =>
    assert.ok(
      Math.abs(actual - expectedValue) <= tolerance,
      `${label}: ${actual} is not within ${tolerance} of ${expectedValue}`,
    );

  for (const n of [3, 10, 100]) {
    assert.ok(100 / (2 * n ** 2 + 5 * n + 4) < 50 / n ** 2);
    assert.ok(Math.log(n) / n > 1 / n);
    close(2 ** n / (2 ** n - 1), 1, 2 / 2 ** n, "Example 5.6 ratio");
  }
  for (const n of [100, 10_000, 1_000_000]) {
    const limitComparisonRatio = (1 + 3 / (2 * n)) / Math.sqrt(1 + 5 / n ** 5);
    close(limitComparisonRatio, 1, 0.02, "Example 5.7 ratio");
  }

  for (let n = 1; n < 100; n++) {
    const b = (index) => index ** 2 / (index ** 3 + 1);
    assert.ok(b(n + 1) < b(n), `rational alternating magnitude at n=${n}`);
  }
  close(
    10_000 * (10_000 ** 2 / (10_000 ** 3 + 1)),
    1,
    0.001,
    "rational magnitude limit",
  );
  assert.ok(
    4 / 9 < 1 / 2,
    "the initial rational-magnitude transition decreases",
  );
  assert.ok((1 - 2 ** 2) / (1 + 2 ** 2) ** 2 < 0);
  close(10_000 ** 2 / (10_000 ** 2 + 1), 1, 0.001, "absolute-series ratio");

  close(1 / 10_001, 0, 0.0001, "factorial-denominator ratio limit");
  close(
    (1 / 2) * (1 + 1 / 10_000) ** 2,
    0.5,
    0.001,
    "polynomial-over-exponential ratio limit",
  );
  assert.ok(100_001 / 100 > 1, "factorial-growth ratios eventually exceed one");
  close(10_000 / (2 * 10_000 + 3), 0.5, 0.001, "source root limit");
  close(999_999 ** (1 / 999_999) / 2, 0.5, 0.001, "odd root subsequence");
  assert.equal((1 / 2 ** 100) ** (1 / 100), 0.5, "even root subsequence");
  close(10_000 ** (-1 / 10_000), 1, 0.001, "root limit for harmonic terms");
  close(10_000 ** (-2 / 10_000), 1, 0.003, "root limit for reciprocal squares");
});

test("Chapter 05 rendered guide formulas parse strictly and produce MathML", async () => {
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const formulaSources = [];
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
    "hypotheses",
    "prerequisites",
    "usesHypothesis",
  ]);
  const visit = (value, path, key = "") => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`, key));
      return;
    }
    if (value && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value))
        visit(child, `${path}.${childKey}`, childKey);
      return;
    }
    if (typeof value !== "string") return;
    if (["equation", "solutionTex", "tex"].includes(key)) {
      formulaSources.push({ path, source: value });
      return;
    }
    if (!renderKeys.has(key)) return;
    const math = value.matchAll(/\$([^$]+)\$/gu);
    for (const match of math) formulaSources.push({ path, source: match[1] });
    const prose = value.replace(/\$([^$]+)\$/gu, "");
    assert.doesNotMatch(
      prose,
      /[=<>≤≥±∞∈↦√^|]|[′″]|\b(?:f|g|h|p|q|r|s|u)\s*'{1,2}\s*(?:\(|=)|\b\d+\s*\/\s*[a-zA-Z]/u,
      `${path} has unmarked mathematical notation`,
    );
  };

  for (const [conceptId, assets] of Object.entries(guideAssets)) {
    for (const block of assets.blocks) {
      visit(block, `${conceptId}.${block.id}`);
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      assert.match(markup, /<math\b/u, block.id);
      assert.doesNotMatch(markup, /katex-error/u, block.id);
    }
    for (const exercise of assets.exercises) {
      visit(exercise, `${conceptId}.${exercise.id}`);
      const prose = `${exercise.prompt} ${exercise.hint} ${exercise.solution} ${exercise.rubric.join(" ")}`;
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
  assert.ok(
    formulaSources.length >= 90,
    `collected ${formulaSources.length} formulas`,
  );
  for (const { path, source } of formulaSources) {
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
});

test("WebMCP read_concept preserves Chapter 05 routes and serves the new content", async () => {
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

  for (const conceptId of Object.keys(guideAssets)) {
    const concept = appConcepts.find((item) => item.id === conceptId);
    assert.ok(concept, conceptId);
    assert.equal(
      concept.scene,
      concepts.find((item) => item.id === conceptId).scene,
    );
    const lesson = readConcept.execute({ conceptId }).lesson;
    for (const block of guideAssets[conceptId].blocks) {
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
    for (const exercise of guideAssets[conceptId].exercises) {
      assert.ok(
        lesson.exercises.some((item) => item.id === exercise.id),
        exercise.id,
      );
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, {
          text: `${exercise.prompt} ${exercise.hint} ${exercise.solution}`,
        }),
      );
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(proseMarkup, /<math\b/u, `${exercise.id} prompt`);
      assert.match(formulaMarkup, /<math\b/u, `${exercise.id} answer`);
      assert.doesNotMatch(
        `${proseMarkup}${formulaMarkup}`,
        /katex-error/u,
        exercise.id,
      );
    }
  }
});
