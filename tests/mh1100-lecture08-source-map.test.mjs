import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import katex from "katex";
import { createServer } from "vite";

const read = (name) =>
  JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sources = read("../lib/curriculum/sources.json");
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

const cases = [
  [
    "chain-rule-single",
    "composition-rule",
    "01",
    4,
    "lecture08-chain-composition",
    "contentBlocks",
    "lecture08-source-sine-quotient",
    "lecture08-chain-composition-transfer",
  ],
  [
    "chain-rule-single",
    "composition-order",
    "01",
    7,
    "lecture08-composition-order",
    "contentBlocks",
    "lecture08-source-sine-order",
    "lecture08-composition-order-transfer",
  ],
  [
    "chain-rule-single",
    "general-power",
    "01",
    8,
    "lecture08-general-power",
    "contentBlocks",
    "lecture08-source-reciprocal-cuberoot",
    "lecture08-general-power-transfer",
  ],
  [
    "chain-rule-single",
    "nested-chain",
    "01",
    10,
    "lecture08-nested-chain",
    "contentBlocks",
    "lecture08-source-nested-sine-root",
    "lecture08-nested-chain-transfer",
  ],
  [
    "chain-rule-single",
    "nested-real-domain",
    "01",
    11,
    "lecture08-nested-real-domain",
    "contentBlocks",
    "lecture08-source-root-secant-domain",
    "lecture08-nested-domain-transfer",
  ],
  [
    "chain-rule-single",
    "increment-proof",
    "01",
    13,
    "lecture08-increment-proof",
    "supplementalBlocks",
    "chain-rule-remainder",
    "zero-inner-increment",
  ],
  [
    "implicit-related-rates",
    "local-branches",
    "02",
    16,
    "lecture08-implicit-branches",
    "contentBlocks",
    "lecture08-source-circle-branches",
    "lecture08-implicit-branches-transfer",
  ],
  [
    "implicit-related-rates",
    "implicit-chain",
    "02",
    19,
    "lecture08-implicit-chain",
    "contentBlocks",
    "lecture08-source-circle-slope",
    "lecture08-implicit-chain-transfer",
  ],
  [
    "implicit-related-rates",
    "implicit-product",
    "02",
    22,
    "lecture08-implicit-product",
    "contentBlocks",
    "lecture08-source-cubic-product",
    "lecture08-implicit-product-transfer",
  ],
  [
    "implicit-related-rates",
    "implicit-trig",
    "02",
    24,
    "lecture08-implicit-trig",
    "contentBlocks",
    "lecture08-source-trig-implicit",
    "lecture08-implicit-trig-transfer",
  ],
  [
    "implicit-related-rates",
    "conic-tangent",
    "02",
    25,
    "lecture08-implicit-conic-tangent",
    "contentBlocks",
    "lecture08-source-ellipse-tangent",
    "lecture08-implicit-conic-transfer",
  ],
];

test("Lecture 08 source identity, physical spans, and outcome evidence", () => {
  assert.equal(sources.MH1100_Lecture_08.pages, 56);
  assert.equal(
    sources.MH1100_Lecture_08.sha256,
    "f81f07e967c22465bfe847444c2f0921aa36ce2a0aa0452a4fdbb1f2ebc5c8e1",
  );
  assert.deepEqual(
    sources.MH1100_Lecture_08.errata.map((item) => item.page),
    [10, 25],
  );
  assert.match(sources.MH1100_Lecture_08.errata[0].correction, /\$x\$/);
  assert.match(sources.MH1100_Lecture_08.errata[1].correction, /y_0\\ne0/);
  for (const [number, span] of Object.entries({
    "01": "4–15",
    "02": "16–26",
  })) {
    const section = ledger.source_sections.find(
      (item) => item.id === `MH1100_Lecture_08:${number}`,
    );
    assert.equal(section.physical_page_span, span);
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.deepEqual(
      section.atomic_outcome_ids,
      cases
        .filter((item) => item[2] === number)
        .map(([concept, id]) => `${concept}:${id}`),
    );
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
    assert.match(
      section.gap,
      number === "01" ? /with respect to t/ : /divid.*y0/,
    );
  }
  for (const [
    concept,
    id,
    section,
    page,
    theoremId,
    field,
    workedId,
    exerciseId,
  ] of cases) {
    const entry = ledger.atomic_outcomes.find(
      (item) => item.id === `${concept}:${id}`,
    );
    assert.equal(entry.core_source.physical_page, page);
    assert.equal(entry.source_section_id, `MH1100_Lecture_08:${section}`);
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.ok(entry.core_source.page_validation.pages.includes(page));
    assert.match(
      entry.evidence.stated[0].locator,
      new RegExp(`\\[${theoremId}\\]$`),
    );
    assert.match(
      entry.evidence.worked[0].locator,
      new RegExp(`\\[${workedId}\\]$`),
    );
    assert.match(
      entry.evidence.practiced[0].locator,
      new RegExp(`\\[${exerciseId}\\]$`),
    );
    assert.ok(guides[concept][field].some((item) => item.id === workedId));
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
  }
  assert.ok(
    ledger.atomic_outcomes.some(
      (item) =>
        item.id === "linearization-differentials:source-skill-1" &&
        item.source_section_id === "MH1100_Lecture_08:04",
    ),
  );
});

test("source calculations, branch restrictions, and conic endpoints are correct", () => {
  const chain = guides["chain-rule-single"];
  const implicit = guides["implicit-related-rates"];
  const quotient = chain.contentBlocks.find(
    (item) => item.id === "lecture08-source-sine-quotient",
  );
  assert.match(quotient.steps[0].text, /4x\/\(x\^2\+1\)\^2/);
  assert.match(
    chain.exercises.find(
      (item) => item.id === "lecture08-nested-domain-transfer",
    ).solution,
    /\\cos\(x\^2\)>0/,
  );
  assert.match(
    chain.contentBlocks.find(
      (item) => item.id === "lecture08-source-nested-sine-root",
    ).verification,
    /with respect to t/,
  );
  assert.match(
    implicit.contentBlocks.find(
      (item) => item.id === "lecture08-source-ellipse-tangent",
    ).verification,
    /y_0\\ne0/,
  );
  const conic = implicit.exercises.find(
    (item) => item.id === "lecture08-implicit-conic-transfer",
  );
  assert.match(conic.solution, /vertical/);
  assert.match(conic.solutionTex, /T_\{\(0,2\)\}.*T_\{\(3,0\)\}/);
  for (const concept of [chain, implicit]) {
    const ids = concept.exercises.map((item) => item.id);
    assert.equal(ids.length, new Set(ids).size);
  }
  const h = 1e-5;
  const f = (x) => Math.sin((x * x - 1) / (x * x + 1));
  const x = 1.3;
  const analytic =
    ((4 * x) / (x * x + 1) ** 2) * Math.cos((x * x - 1) / (x * x + 1));
  assert.ok(Math.abs((f(x + h) - f(x - h)) / (2 * h) - analytic) < 1e-8);
  assert.equal((2 * 3 - 3 ** 2) / (3 ** 2 - 2 * 3), -1);
});

test("WebMCP exposes source-linked lessons and semantic MathML", async () => {
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const tool = studyTools(concepts, () => null).find(
    (item) => item.name === "read_concept",
  );
  for (const [
    concept,
    id,
    ,
    page,
    theoremId,
    field,
    workedId,
    exerciseId,
  ] of cases) {
    const guide = guides[concept];
    const theorem = guide.contentBlocks.find((item) => item.id === theoremId);
    const worked = guide[field].find((item) => item.id === workedId);
    const exercise = guide.exercises.find((item) => item.id === exerciseId);
    assert.ok(theorem && worked && exercise, id);
    assert.ok(
      exercise.hint && exercise.solution && exercise.rubric.length >= 3,
    );
    const exposed = tool.execute({ conceptId: concept });
    assert.ok(
      exposed.lesson.contentBlocks.some((item) => item.id === theoremId),
      id,
    );
    assert.ok(
      exposed.lesson.exercises.some((item) => item.id === exerciseId),
      id,
    );
    assert.ok(
      exposed.sources.some(
        (source) =>
          source.sourceId === "MH1100_Lecture_08" &&
          source.pages.includes(page),
      ),
      `source page ${page}`,
    );
    const html =
      renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block: theorem }),
      ) +
      renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block: worked }),
      ) +
      renderToStaticMarkup(
        React.createElement(MathText, { text: `$${exercise.solutionTex}$` }),
      );
    assert.match(html, /<math\b/, id);
    assert.doesNotMatch(html, /katex-error/, id);
    assert.doesNotThrow(
      () =>
        katex.renderToString(exercise.solutionTex, {
          throwOnError: true,
          output: "mathml",
        }),
      id,
    );
    if (id === "composition-rule") assert.match(html, /<mfrac>/);
    if (id === "nested-chain") assert.match(html, /<msqrt>/);
    if (id === "implicit-trig")
      assert.match(html, /<mi>sin<\/mi>|<mo[^>]*>sin<\/mo>/);
  }
});
