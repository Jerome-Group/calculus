import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import katex from "katex";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const ruleGuide = read("../lib/curriculum/learning-guides.json")[
  "differentiation-rules"
];
const conceptId = "differentiation-rules";
const sourceId = "MH1100_Lecture_07";
const sectionId = `${sourceId}:01`;
const sha = "1bf8c6d88189eb46c2eb80c47f7a33aec51a32a50d368e4b45f0244a80ac8193";
const expectedIds = [
  "constant-function-derivative-definition",
  "identity-derivative-definition",
  "binomial-expansion-coefficients",
  "positive-integer-power-rule",
  "linearity-constant-sum-difference",
  "product-rule",
  "quotient-rule",
  "simplify-quotient-before-differentiating",
  "negative-integer-power-rule",
  "real-power-rule-positive-domain",
  "tangent-and-normal-lines",
  "product-quotient-misrules",
  "radian-trig-convention",
  "sine-derivative-from-definition",
  "cosine-derivative-from-definition",
  "apply-sine-cosine-rules",
  "tangent-derivative-from-quotient",
  "reciprocal-trig-derivatives",
].map((id) => `${conceptId}:${id}`);
const batch = ledger.atomic_outcomes.filter(
  (entry) => entry.source_section_id === sectionId,
);
const close = (actual, expected, tolerance = 1e-11) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} ≈ ${expected}`,
  );

test("Lecture 07 pages 3–31 have atomic source mappings and honest evidence states", () => {
  assert.equal(sources[sourceId].sha256, sha);
  assert.equal(sources[sourceId].pages, 31);
  const section = ledger.source_sections.find((item) => item.id === sectionId);
  assert.ok(section);
  assert.equal(section.outcome_status, "atomic_source_review_completed");
  assert.equal(section.coverage_decision, "partial_atomic_mapping");
  assert.equal(
    new Set(ledger.atomic_outcomes.map((entry) => entry.id)).size,
    ledger.atomic_outcomes.length,
  );
  assert.equal(batch.length, expectedIds.length);
  assert.deepEqual(
    batch.map((entry) => entry.id),
    expectedIds,
  );
  assert.deepEqual(section.atomic_outcome_ids, expectedIds);
  assert.deepEqual(
    [
      ...new Set(
        batch.flatMap((entry) => entry.core_source.page_validation.pages),
      ),
    ].sort((a, b) => a - b),
    Array.from({ length: 29 }, (_, index) => index + 3),
  );
  for (const page of Array.from({ length: 29 }, (_, index) => index + 3))
    assert.ok(
      concepts
        .find((item) => item.id === conceptId)
        .sources.some(
          (reference) =>
            reference.sourceId === sourceId &&
            reference.pages[0] <= page &&
            reference.pages[1] >= page,
        ),
      `physical page ${page} is in the concept source references`,
    );
  assert.deepEqual(
    section.reviewed_exclusions.map((item) => item.physical_page),
    [14, 18, 24],
  );
  for (const entry of batch) {
    assert.equal(entry.core_source.sha256, sha);
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
    assert.equal(entry.evidence.named.length, 1);
    assert.match(entry.evidence.named[0].claim, /parent .* route/i);
    assert.equal(entry.evidence.stated.length, 1);
    assert.equal(entry.evidence.worked.length, 1);
    assert.equal(entry.evidence.practiced.length, 1);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
  }
  assert.match(
    batch.find((entry) => entry.id.endsWith("real-power-rule-positive-domain"))
      .core_source.page_validation.claim_observed,
    /guide/i,
  );
});

test("worked and transfer calculations have independent mathematical checks", () => {
  assert.equal((7 - 7) / 0.2, 0);
  close((3 + 0.2 - 3) / 0.2, 1);

  const choose = (n, k) => {
    let value = 1;
    for (let j = 1; j <= k; j++) value = (value * (n - j + 1)) / j;
    return value;
  };
  const binomial = Array.from(
    { length: 5 },
    (_, k) => choose(4, k) * 2 ** k * 3 ** (4 - k),
  ).reduce((sum, term) => sum + term, 0);
  close(binomial, (2 + 3) ** 4);
  assert.equal(6 * 2 ** 5, 192);
  assert.equal(4 * (-1) ** 3, -4);
  assert.equal(-6 + 10 - 6, -2);

  close(
    2 * Math.PI * Math.sin(Math.PI) + Math.PI ** 2 * Math.cos(Math.PI),
    -(Math.PI ** 2),
  );
  close((2 * 0 * (0 + 1) - (0 ** 2 - 3)) / (0 + 1) ** 2, 3);
  close(
    (-(0 ** 4) + 4 * 0 ** 3 - 12 * 0 ** 2 + 16 * 0 - 16) / (0 ** 3 + 8) ** 2,
    -1 / 4,
  );
  close(-4 * 2 ** -5, -1 / 8);
  close((-3 / 2) * 4 ** (-5 / 2), -3 / 64);

  const tangentValue = 1 ** 2 / (1 + 1);
  const tangentSlope = (2 * 1 * (1 + 1) - 1 ** 2) / (1 + 1) ** 2;
  assert.equal(tangentValue, 1 / 2);
  assert.equal(tangentSlope, 3 / 4);
  close(tangentSlope * (-4 / 3), -1);
  assert.equal(1 / 2 + (3 / 4) * (1 - 1), 1 / 2);
  assert.equal(1 / 2 - (4 / 3) * (1 - 1), 1 / 2);

  const productCorrect = 1 * 4 + 2 * 1;
  assert.equal(productCorrect, 6);
  assert.equal(1 * 1, 1);
  const quotientCorrect = (2 * 4 - 3 * 1) / 4 ** 2;
  assert.equal(quotientCorrect, 5 / 16);
  assert.equal((3 * 1 - 2 * 4) / 4 ** 2, -5 / 16);
  assert.equal(2 / 1, 2);

  close(
    (Math.PI / 180) * Math.cos(Math.PI / 6),
    (Math.PI * Math.sqrt(3)) / 360,
  );
  close(Math.cos(Math.PI / 6), Math.sqrt(3) / 2);
  close(-Math.sin(Math.PI / 6), -1 / 2);
  close(
    -2 * Math.sin(Math.PI / 6) + Math.cos(Math.PI / 6),
    -1 + Math.sqrt(3) / 2,
  );
  assert.equal(2 / Math.cos(0) ** 2, 2);
  close(
    2 * (1 / Math.cos(Math.PI / 4)) * Math.tan(Math.PI / 4) +
      3 * (1 / Math.sin(Math.PI / 4)) * (1 / Math.tan(Math.PI / 4)) -
      1 / Math.sin(Math.PI / 4) ** 2,
    5 * Math.sqrt(2) - 2,
  );
});

test("derivative formulas use valid TeX operators and semantic MathML", () => {
  const formulas = [];
  const collectFormulaFields = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        collectFormulaFields(item, path + "[" + index + "]"),
      );
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      const itemPath = path + "." + key;
      if (
        typeof item === "string" &&
        ["equation", "solutionTex", "tex"].includes(key)
      ) {
        formulas.push({ path: itemPath, source: item });
      } else if (typeof item === "string") {
        for (const match of item.matchAll(/\$([^$]+)\$/gu))
          formulas.push({ path: itemPath, source: match[1] });
      } else {
        collectFormulaFields(item, itemPath);
      }
    }
  };
  collectFormulaFields(ruleGuide, "differentiation-rules");

  assert.ok(formulas.length > 0);
  for (const { path, source } of formulas) {
    assert.doesNotMatch(
      source,
      /[−→Σπ≠]|(?<!\\)\b(?:lim|sin|cos|tan|sec|csc|cot|sqrt|binom)\b|(?<!\\)\bd\(/u,
      path + " uses TeX commands instead of pseudo-TeX",
    );
    assert.doesNotThrow(
      () =>
        katex.renderToString(source, {
          throwOnError: true,
          strict: "error",
          output: "htmlAndMathml",
        }),
      path,
    );
  }

  const mathml = (source) => {
    const markup = katex.renderToString(source, {
      throwOnError: true,
      strict: "error",
      output: "htmlAndMathml",
    });
    const start = markup.indexOf("<math");
    const end = markup.indexOf("</math>") + "</math>".length;
    assert.ok(start >= 0 && end > start, source);
    return markup.slice(start, end);
  };
  const block = (id) =>
    ruleGuide.supplementalBlocks.find((entry) => entry.id === id);
  const limit = mathml(
    block("base-derivatives-from-definition").steps[0].equation,
  );
  assert.match(limit, /<mi>lim<\/mi><mo>⁡<\/mo>/);
  assert.doesNotMatch(limit, /<mi>l<\/mi><mi>i<\/mi>/);

  const binomial = mathml(
    block("positive-power-rule-from-binomial-limit").steps[0].equation,
  );
  assert.match(binomial, /<mo>∑<\/mo>/);
  assert.match(binomial, /<mfrac linethickness="0px">/);

  const rootDerivative = mathml(
    block("square-root-real-power-example").steps[0].equation,
  );
  assert.match(
    rootDerivative,
    /<mfrac><mi>d<\/mi><mrow><mi>d<\/mi><mi>x<\/mi><\/mrow><\/mfrac>/,
  );
  assert.match(rootDerivative, /<msqrt><mi>x<\/mi><\/msqrt>/);

  const secant = mathml(
    block("reciprocal-trig-quotient-derivations").steps[0].equation,
  );
  assert.match(secant, /<mi>sec<\/mi><mo>⁡<\/mo><mi>x<\/mi>/);
  assert.doesNotMatch(secant, /<mi>s<\/mi><mi>e<\/mi><mi>c<\/mi>/);
});

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

test("WebMCP exposes the mapped guide blocks and the guide math renders to MathML", async () => {
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
  const lesson = readConcept.execute({ conceptId }).lesson;
  for (const entry of batch) {
    const blockId = entry.evidence.worked[0].locator.match(/\[([^\]]+)\]$/)[1];
    const taskId =
      entry.evidence.practiced[0].locator.match(/\[([^\]]+)\]$/)[1];
    const block = lesson.supplementalBlocks.find((item) => item.id === blockId);
    const task = lesson.exercises.find((item) => item.id === taskId);
    assert.ok(block && task, entry.id);
    const blockMarkup = renderToStaticMarkup(
      React.createElement(StructuredLessonBlockView, { block }),
    );
    assert.match(blockMarkup, /<math\b/, `${entry.id} renders math as MathML`);
    assert.doesNotMatch(blockMarkup, /katex-error/, entry.id);
    assert.ok(task.hint && task.solution && task.rubric.length >= 2, entry.id);
    if (task.solutionTex) {
      const solutionMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, task.solutionTex),
      );
      assert.match(solutionMarkup, /<math\b/, `${entry.id} solution MathML`);
      assert.doesNotMatch(solutionMarkup, /katex-error/, entry.id);
    }
    for (const prose of [task.prompt, task.solution])
      if (/\$[^$]+\$/.test(prose)) {
        const proseMarkup = renderToStaticMarkup(
          React.createElement(MathText, { text: prose }),
        );
        assert.match(proseMarkup, /<math\b/, `${entry.id} prose MathML`);
        assert.doesNotMatch(proseMarkup, /katex-error/, entry.id);
      }
  }
});
