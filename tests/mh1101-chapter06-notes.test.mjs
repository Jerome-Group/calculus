import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import katex from "katex";
import {
  inspectNotation,
  inspectTexSemantics,
} from "./helpers/math-notation.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceId = "MH1101_Chapter_06_Notes";
const sha = "acd8ab414ffd751e538a6104a40e83699eccac9a1e997909c4fdf0163999432f";
const mapped = [
  [
    "power-series-radius",
    "convergence-patterns",
    "01",
    2,
    [2, 3, 4],
    "ch06-convergence-patterns",
    "ch06-convergence-patterns-work",
    "ch06-convergence-patterns-transfer",
  ],
  [
    "power-series-radius",
    "ratio-radius",
    "01",
    3,
    [3, 5, 6, 7],
    "ch06-ratio-radius-rule",
    "ch06-ratio-radius-work",
    "ch06-ratio-radius-transfer",
  ],
  [
    "power-series-radius",
    "endpoint-convergence",
    "01",
    3,
    [3, 4, 5, 6, 7],
    "ch06-endpoint-protocol",
    "ch06-endpoint-casework",
    "ch06-endpoint-transfer",
  ],
  [
    "power-series-operations",
    "geometric-transformations",
    "02",
    8,
    [8, 9],
    "ch06-geometric-substitution-rule",
    "ch06-geometric-substitution-work",
    "ch06-geometric-substitution-transfer",
  ],
  [
    "power-series-operations",
    "multiply-reindex",
    "02",
    9,
    [9, 10],
    "ch06-multiply-reindex-rule",
    "ch06-multiply-reindex-work",
    "ch06-multiply-reindex-transfer",
  ],
  [
    "power-series-operations",
    "termwise-calculus",
    "02",
    11,
    [11],
    "ch06-termwise-calculus-rule",
    "ch06-termwise-calculus-work",
    "ch06-termwise-calculus-transfer",
  ],
  [
    "power-series-operations",
    "arctangent-integration",
    "02",
    12,
    [12],
    "ch06-arctangent-series-rule",
    "ch06-arctangent-series-work",
    "ch06-arctangent-transfer",
  ],
  [
    "taylor-series",
    "coefficient-uniqueness",
    "03",
    13,
    [13, 14, 15],
    "ch06-taylor-coefficient-rule",
    "ch06-taylor-coefficient-work",
    "ch06-taylor-coefficient-transfer",
  ],
  [
    "taylor-series",
    "source-skill-1",
    "03",
    15,
    [15, 16, 18],
    "ch06-polynomial-vs-series",
    "ch06-taylor-remainder-contrast-work",
    "ch06-taylor-finite-vs-infinite-transfer",
  ],
  [
    "taylor-series",
    "remainder-formula-bound",
    "03",
    16,
    [16, 17, 18],
    "ch06-remainder-theorems",
    "ch06-remainder-bound-work",
    "ch06-remainder-bound-transfer",
  ],
  [
    "taylor-series",
    "remainder-to-series-equality",
    "03",
    19,
    [19, 20],
    "ch06-remainder-criterion",
    "ch06-exponential-series-proof",
    "ch06-remainder-proof-transfer",
  ],
  [
    "taylor-series",
    "trigonometric-series-operations",
    "03",
    20,
    [20, 21],
    "ch06-trig-series-operations-rule",
    "ch06-trig-series-operations-work",
    "ch06-trig-series-operations-transfer",
  ],
  [
    "taylor-series",
    "nonzero-center-sine",
    "03",
    22,
    [22],
    "ch06-nonzero-center-rule",
    "ch06-nonzero-center-work",
    "ch06-nonzero-center-transfer",
  ],
  [
    "binomial-series",
    "generalized-binomial",
    "04",
    23,
    [23, 24, 25],
    "ch06-general-binomial-rule",
    "ch06-general-binomial-work",
    "ch06-general-binomial-transfer",
  ],
  [
    "binomial-series",
    "scaled-binomial-radius",
    "04",
    25,
    [25, 26],
    "ch06-scaled-binomial-rule",
    "ch06-scaled-binomial-work",
    "ch06-scaled-binomial-transfer",
  ],
  [
    "limits-with-series",
    "known-series-sum",
    "05",
    27,
    [27, 28],
    "ch06-known-series-table",
    "ch06-log-series-sum-work",
    "ch06-log-series-sum-transfer",
  ],
  [
    "limits-with-series",
    "limit-cancellation",
    "05",
    28,
    [28],
    "ch06-limit-series-rule",
    "ch06-limit-exp-work",
    "ch06-limit-transfer",
  ],
];
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

const close = (actual, expected, tolerance = 1e-11) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} ≈ ${expected}`,
  );

test("canonical Chapter 06 source sections and atomic evidence are page-verified", () => {
  const source = sources[sourceId];
  assert.equal(source.file, "MH1101_Chapter_06_Notes.pdf");
  assert.equal(source.pages, 28);
  assert.equal(source.sha256, sha);
  assert.match(source.url, /1bJENGCezSXxkZXB9RjCLbpDR-QBoQ_Js/);

  const sections = ledger.source_sections.filter((section) =>
    section.id.startsWith(`${sourceId}:`),
  );
  assert.deepEqual(
    sections.map((section) => [section.id, section.physical_page_span]),
    [
      [`${sourceId}:01`, "2–7"],
      [`${sourceId}:02`, "8–12"],
      [`${sourceId}:03`, "13–22"],
      [`${sourceId}:04`, "23–26"],
      [`${sourceId}:05`, "27–28"],
    ],
  );
  assert.deepEqual(
    [
      ...new Set(
        sections.flatMap((section) => section.inspected_physical_pages),
      ),
    ],
    Array.from({ length: 27 }, (_, index) => index + 2),
  );
  assert.deepEqual(
    ledger.source_sections.find((section) => section.id === `${sourceId}:05`)
      .linked_concept_ids,
    ["limits-with-series"],
  );
  assert.equal(
    ledger.atomic_outcomes.find(
      (item) => item.id === "taylor-series:source-skill-1",
    ).source_section_id,
    `${sourceId}:03`,
  );

  const ids = mapped.map(([concept, suffix]) => `${concept}:${suffix}`);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const [
    concept,
    suffix,
    sectionNumber,
    page,
    pages,
    stated,
    worked,
    exercise,
  ] of mapped) {
    const id = `${concept}:${suffix}`;
    const item = ledger.atomic_outcomes.find((outcome) => outcome.id === id);
    assert.ok(item, id);
    assert.equal(item.source_section_id, `${sourceId}:${sectionNumber}`, id);
    assert.equal(item.core_source.id, sourceId, id);
    assert.equal(item.core_source.sha256, sha, id);
    assert.equal(item.core_source.physical_page, page, id);
    assert.equal(item.core_source.page_validation.status, "page_verified", id);
    assert.deepEqual(item.core_source.page_validation.pages, pages, id);
    assert.deepEqual(
      item.evidence.named,
      [],
      `${id}: no exact atomic title in catalog`,
    );
    assert.equal(item.evidence.stated.length, 1, `${id}: stated`);
    assert.equal(item.evidence.worked.length, 1, `${id}: worked`);
    assert.equal(item.evidence.practiced.length, 1, `${id}: practiced`);
    assert.deepEqual(item.evidence.visualized, [], `${id}: visualized`);
    assert.deepEqual(item.evidence.checked, [], `${id}: checked`);
    assert.equal(item.visual_candidate.verified_for_outcome, false, id);
    assert.match(
      item.inspection_check.named,
      /parent topic only.*exact atomic outcome title/i,
      id,
    );
    assert.ok(
      item.evidence.stated[0].locator.endsWith(`[${stated}]`),
      `${id}: statement locator`,
    );
    assert.ok(
      item.evidence.worked[0].locator.endsWith(`[${worked}]`),
      `${id}: worked locator`,
    );
    assert.ok(
      item.evidence.practiced[0].locator.endsWith(`[${exercise}]`),
      `${id}: practice locator`,
    );
  }

  const oldOutcome = ledger.atomic_outcomes.find(
    (item) => item.id === "taylor-series:source-skill-1",
  );
  assert.ok(oldOutcome, "preserve the pre-existing atomic outcome ID");
  assert.equal(oldOutcome.evidence.named.length, 0);
  assert.match(oldOutcome.gap, /no learner performance check is claimed/);
  for (const [conceptId, firstPage, lastPage] of [
    ["power-series-radius", 2, 7],
    ["power-series-operations", 8, 12],
    ["taylor-series", 13, 22],
    ["binomial-series", 23, 26],
    ["limits-with-series", 27, 28],
  ]) {
    assert.ok(
      concepts
        .find((concept) => concept.id === conceptId)
        .sources.some(
          (reference) =>
            reference.sourceId === sourceId &&
            reference.pages[0] <= firstPage &&
            reference.pages[1] >= lastPage,
        ),
      `${conceptId} cites the inspected Chapter 06 span`,
    );
  }
});

test("source errata and source-specific endpoint claims stay explicit", () => {
  const errata = sources[sourceId].errata;
  assert.deepEqual(
    errata.map((item) => item.page),
    [22, 27, 28],
  );
  assert.match(errata[0].correction, /Theorem 4/);
  assert.match(errata[1].correction, /nonnegative integer.*infinite radius/i);
  assert.match(errata[2].correction, /lower index is \$?n=1\$?/);

  const binomialGuide = guides["binomial-series"];
  assert.match(
    binomialGuide.sections.find(
      (section) =>
        section.title === "Do not universalize the endpoint behavior",
    ).text,
    /endpoint convergence dependent on \$k\$|endpoints depend on \$k\$.*no general endpoint criteria/i,
  );
  const unsolved = guides["limits-with-series"].contentBlocks.find(
    (block) => block.id === "ch06-unsolved-limit-guide-work",
  );
  assert.match(
    unsolved.strategy,
    /source itself supplies only the prompt|not attributed as source work/i,
  );
  assert.match(unsolved.result, /guide-created solution/i);
});

test("radius, endpoints, transformations, Taylor bounds, binomial coefficients, and limits check out", () => {
  const n = 1_000_000;
  const alternatingHarmonicRatio = n / (n + 1);
  const alternatingRootRatio = Math.sqrt((n + 1) / (n + 2));
  assert.ok(alternatingHarmonicRatio < 1);
  assert.ok(alternatingRootRatio < 1);
  close(alternatingHarmonicRatio, 1, 1e-6);
  close(alternatingRootRatio, 1, 1e-6);
  const example65CoefficientRatio = (n + 1) / n / 3;
  close(example65CoefficientRatio, 1 / 3, 1e-6);
  close(1 / example65CoefficientRatio, 3, 1e-5);
  const example65EndpointTerm = (index) =>
    (index * 3 ** index) / 3 ** (index + 1);
  close(example65EndpointTerm(10), 10 / 3);
  close(example65EndpointTerm(100), 100 / 3, 1e-11);
  assert.ok(example65EndpointTerm(100) > example65EndpointTerm(10));

  const squareRootTerms = Array.from(
    { length: 10000 },
    (_, index) => 1 / Math.sqrt(index + 1),
  );
  const positivePartial = squareRootTerms.reduce((sum, term) => sum + term, 0);
  const alternatingPartial = squareRootTerms.reduce(
    (sum, term, index) => sum + (-1) ** index * term,
    0,
  );
  assert.ok(positivePartial > 190);
  assert.ok(alternatingPartial > 0.5 && alternatingPartial < 0.7);

  const alternatingLog = Array.from({ length: 40 }, (_, index) => {
    const n = index + 1;
    return (-1) ** (n - 1) / (n * 2 ** n);
  }).reduce((sum, term) => sum + term, 0);
  close(alternatingLog, Math.log(3 / 2), 1e-12);

  assert.deepEqual(
    [1, 2, 3, 4].map((degree) => {
      let coefficient = 1;
      for (let index = 0; index < degree; index++)
        coefficient *= (0.5 - index) / (index + 1);
      return coefficient;
    }),
    [1 / 2, -1 / 8, 1 / 16, -5 / 128],
  );

  const h = 0.2;
  const p3 = h - h ** 2 / 2 + h ** 3 / 3;
  close(p3, 0.18266666666666667);
  assert.ok(0.2 ** 4 / 24 < 0.001);
  assert.ok(0.2 ** 3 / 6 > 0.001);

  const taylorAtPi6 = [
    Math.sin(Math.PI / 6),
    Math.cos(Math.PI / 6),
    -Math.sin(Math.PI / 6) / 2,
    -Math.cos(Math.PI / 6) / 6,
  ];
  assert.ok(Math.abs(taylorAtPi6[0] - 1 / 2) < 1e-15);
  assert.ok(Math.abs(taylorAtPi6[1] - Math.sqrt(3) / 2) < 1e-15);
  assert.ok(Math.abs(taylorAtPi6[2] + 1 / 4) < 1e-15);
  assert.ok(Math.abs(taylorAtPi6[3] + Math.sqrt(3) / 12) < 1e-15);

  const expLimitAtSmallX = (x) => (Math.exp(x) - 1 - x) / x ** 2;
  close(expLimitAtSmallX(1e-4), 0.5, 2e-4);
  const cosineExpLimitAtSmallX = (x) =>
    (1 - Math.cos(x)) / (1 + x - Math.exp(x));
  close(cosineExpLimitAtSmallX(1e-4), -1, 2e-4);
});

test("new guide prose marks notation and pure formulas render semantic MathML", async () => {
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const blockIds = new Set(
    mapped.flatMap(([, , , , , stated, worked]) => [stated, worked]),
  );
  blockIds.add("ch06-unsolved-limit-guide-work");
  const exerciseIds = new Set(
    mapped.map(([, , , , , , , exercise]) => exercise),
  );
  const sectionTitles = new Set([
    "The radius is not the interval",
    "Same radius, different endpoint behavior",
    "Coefficients, convergence, and equality are separate claims",
    "Source correction at the nonzero center",
    "Do not universalize the endpoint behavior",
    "A source prompt without a source solution",
  ]);

  const failures = [];
  const collectedEquations = [];
  for (const [conceptId, guide] of Object.entries(guides)) {
    for (const section of guide.sections ?? []) {
      if (!sectionTitles.has(section.title)) continue;
      inspectNotation(
        section.title,
        `${conceptId}.${section.title}.title`,
        failures,
      );
      inspectNotation(
        section.text,
        `${conceptId}.${section.title}.text`,
        failures,
      );
    }
    for (const block of guide.contentBlocks ?? []) {
      if (!blockIds.has(block.id)) continue;
      const html = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      assert.match(html, /<math\b/, `${conceptId}:${block.id}`);
      assert.doesNotMatch(html, /katex-error/, `${conceptId}:${block.id}`);
      for (const [key, value] of Object.entries(block)) {
        if (key === "steps") continue;
        if (typeof value === "string") {
          if (key === "tex")
            collectedEquations.push([`${block.id}.${key}`, value]);
          else inspectNotation(value, `${block.id}.${key}`, failures);
        } else if (Array.isArray(value) && key !== "prerequisites") {
          for (const [index, item] of value.entries())
            if (typeof item === "string")
              inspectNotation(item, `${block.id}.${key}[${index}]`, failures);
        }
      }
      for (const item of block.steps ?? []) {
        inspectNotation(
          item.label,
          `${block.id}.${item.label}.label`,
          failures,
        );
        inspectNotation(item.text, `${block.id}.${item.label}.text`, failures);
        if (item.usesHypothesis)
          inspectNotation(
            item.usesHypothesis,
            `${block.id}.${item.label}.usesHypothesis`,
            failures,
          );
        if (item.equation)
          collectedEquations.push([`${block.id}.${item.label}`, item.equation]);
      }
    }
    for (const exercise of guide.exercises ?? []) {
      if (!exerciseIds.has(exercise.id)) continue;
      for (const field of ["prompt", "hint", "solution"])
        inspectNotation(exercise[field], `${exercise.id}.${field}`, failures);
      exercise.rubric.forEach((line, index) =>
        inspectNotation(line, `${exercise.id}.rubric[${index}]`, failures),
      );
      collectedEquations.push([
        `${exercise.id}.solutionTex`,
        exercise.solutionTex,
      ]);
      const html = [exercise.prompt, exercise.hint, exercise.solution]
        .map((text) =>
          renderToStaticMarkup(React.createElement(MathText, { text })),
        )
        .join("");
      assert.match(html, /<math\b/, exercise.id);
      assert.doesNotMatch(html, /katex-error/, exercise.id);
    }
  }
  assert.deepEqual(failures, [], failures.join("\n"));

  const semantics = new Map();
  for (const [locator, tex] of collectedEquations) {
    const mathml = katex.renderToString(tex, {
      output: "mathml",
      throwOnError: true,
      strict: "error",
    });
    assert.match(mathml, /<math\b/, locator);
    assert.doesNotMatch(mathml, /katex-error/, locator);
    const semanticFailures = [];
    inspectTexSemantics(tex, locator, semanticFailures);
    assert.deepEqual(semanticFailures, [], semanticFailures.join("\n"));
    semantics.set(locator, mathml);
  }
  assert.match(
    semantics.get("ch06-arctangent-series-work.Integrate term by term"),
    /<mo[^>]*>∑<\/mo>/,
  );
  assert.match(
    semantics.get("ch06-remainder-bound-work.Set the integral remainder"),
    /<mo[^>]*>∫<\/mo>/,
  );
  assert.match(
    semantics.get(
      "ch06-general-binomial-work.Convert to binomial coefficients",
    ),
    /<mfrac linethickness="0px">/,
  );
});

test("stable WebMCP read_concept exposes source pages, guide blocks, practice, and MathML", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts: curriculum } = await vite.ssrLoadModule(
    "/lib/curriculum/index.ts",
  );
  const readConcept = studyTools(curriculum, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  assert.ok(readConcept);

  for (const [
    conceptId,
    suffix,
    sectionNumber,
    page,
    ,
    stated,
    worked,
    exerciseId,
  ] of mapped) {
    const response = readConcept.execute({ conceptId });
    const outcome = ledger.atomic_outcomes.find(
      (item) => item.id === `${conceptId}:${suffix}`,
    );
    assert.ok(
      response.lesson.contentBlocks.some((block) => block.id === stated),
    );
    assert.ok(
      response.lesson.contentBlocks.some((block) => block.id === worked),
    );
    assert.ok(
      response.lesson.exercises.some((exercise) => exercise.id === exerciseId),
    );
    assert.ok(
      response.sources.some(
        (source) =>
          source.sourceId === sourceId &&
          source.pages[0] <= page &&
          source.pages[1] >= page,
      ),
      `${conceptId} exposes source page ${page}`,
    );
    assert.equal(outcome.source_section_id, `${sourceId}:${sectionNumber}`);
  }
});
