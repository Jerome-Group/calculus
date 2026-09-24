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
const sources = read("../lib/curriculum/sources.json");
const sourceManifest = read("../lib/curriculum/source-manifest.json");
const concepts = read("../lib/curriculum/concepts.json");
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceId = "MH1101_Chapter_03_Notes";
const sourceSha =
  "f8b86e97960de4ba1798d3abc8be5bb0e3cd9fd8236496e251911e5067b44505";
const expected = {
  "MH1101_Chapter_03_Notes:01": [
    "integration-by-parts:source-skill-1",
    "integration-by-parts:ch03-definite-boundary-term",
    "integration-by-parts:ch03-cyclic-integral",
    "integration-by-parts:ch03-sine-power-reduction",
    "integration-by-parts:ch03-liate-heuristic",
  ],
  "MH1101_Chapter_03_Notes:02": [
    "trigonometric-integrals:ch03-odd-power-substitution",
    "trigonometric-integrals:ch03-even-half-angle",
    "trigonometric-integrals:ch03-tangent-secant-parity",
    "trigonometric-integrals:ch03-product-to-sum",
  ],
  "MH1101_Chapter_03_Notes:03": [
    "trigonometric-substitution:source-skill-1",
    "trigonometric-substitution:ch03-scaled-definite-substitution",
    "trigonometric-substitution:ch03-ellipse-symmetry-prompt",
  ],
  "MH1101_Chapter_03_Notes:04": [
    "partial-fractions:source-skill-1",
    "partial-fractions:ch03-repeated-quadratic-template",
    "partial-fractions:ch03-coefficient-matching",
    "partial-fractions:divide-before-decompose",
  ],
  "MH1101_Chapter_03_Notes:05": [
    "quadrature-midpoint-trapezoid:ch03-midpoint-rule",
    "quadrature-midpoint-trapezoid:ch03-trapezoid-rule",
    "quadrature-midpoint-trapezoid:ch03-signed-error-comparison",
    "quadrature-midpoint-trapezoid:ch03-error-bound",
  ],
  "MH1101_Chapter_03_Notes:06": [
    "simpson-rule:ch03-composite-weights",
    "simpson-rule:ch03-error-bound",
  ],
};
const spans = ["2–7", "8–16", "17–20", "21–25", "26–31", "32–35"];
const cohortIds = Object.values(expected).flat();
const cohort = ledger.atomic_outcomes.filter((item) =>
  cohortIds.includes(item.id),
);
const routeIds = [
  "integration-by-parts",
  "trigonometric-integrals",
  "trigonometric-substitution",
  "partial-fractions",
  "quadrature-midpoint-trapezoid",
  "simpson-rule",
];
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

const near = (actual, target, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - target) < tolerance,
    `${actual} ≈ ${target} (tolerance ${tolerance})`,
  );

test("canonical Chapter 03 identity, six physical spans, and exclusions are recorded", () => {
  const source = sources[sourceId];
  const manifest = sourceManifest.find((item) => item.sourceId === sourceId);
  assert.equal(source.file, "MH1101_Chapter_03_Notes.pdf");
  assert.equal(source.pages, 35);
  assert.equal(source.sha256, sourceSha);
  assert.equal(manifest.driveFileId, "1uyd0BHKm3bcDZQJCU9sIuEzFe6GUsSp5");
  assert.equal(manifest.sha256, sourceSha);
  assert.deepEqual(
    Object.keys(expected)
      .map((id) => ledger.source_sections.find((section) => section.id === id))
      .map((section) => section.physical_page_span),
    spans,
  );
  for (const [sectionId, ids] of Object.entries(expected)) {
    const section = ledger.source_sections.find(
      (item) => item.id === sectionId,
    );
    assert.deepEqual(section.atomic_outcome_ids, ids);
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, `${sectionId}:${state}`);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
  }
  assert.match(
    ledger.source_sections.find(
      (item) => item.id === "MH1101_Chapter_03_Notes:01",
    ).reviewed_exclusions[0].reason,
    /title and table-of-contents/iu,
  );
  const unsolved = [":03", ":04"].flatMap(
    (suffix) =>
      ledger.source_sections.find((item) => item.id === `${sourceId}${suffix}`)
        .reviewed_exclusions,
  );
  assert.ok(unsolved.some((item) => /Example 3\.16/u.test(item.reason)));
  assert.ok(unsolved.some((item) => /Example 3\.20/u.test(item.reason)));
  assert.ok(unsolved.some((item) => /Example 3\.21/u.test(item.reason)));
  assert.match(
    ledger.source_sections.find((item) => item.id === `${sourceId}:05`).gap,
    /proof is beyond the syllabus/u,
  );
  assert.match(
    ledger.source_sections.find((item) => item.id === `${sourceId}:06`).gap,
    /without proof/u,
  );
  assert.equal(source.errata[0].page, 29);
  assert.match(source.errata[0].printed, /Mipoint/u);
  assert.match(source.errata[0].correction, /typography|spelling/iu);
});

test("each atomic source skill has separate evidence and an explicit scene and learner gap", () => {
  assert.equal(cohort.length, cohortIds.length);
  assert.equal(new Set(cohort.map((item) => item.id)).size, cohortIds.length);
  for (const outcome of cohort) {
    assert.equal(outcome.core_source.id, sourceId, outcome.id);
    assert.equal(outcome.core_source.sha256, sourceSha, outcome.id);
    assert.ok(
      outcome.core_source.page_validation.pages.includes(
        outcome.core_source.physical_page,
      ),
      outcome.id,
    );
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(outcome.evidence[state].length > 0, `${outcome.id}:${state}`);
    assert.match(outcome.gap, /learner performance/u, outcome.id);
    assert.match(outcome.gap, /[Ss]cene/u, outcome.id);
  }
  for (const id of [
    "integration-by-parts:source-skill-1",
    "trigonometric-substitution:source-skill-1",
    "partial-fractions:source-skill-1",
    "partial-fractions:divide-before-decompose",
  ])
    assert.ok(
      ledger.atomic_outcomes.some((item) => item.id === id),
      id,
    );
  for (const route of routeIds) {
    const sourceRef = concepts
      .find((item) => item.id === route)
      .sources.find((item) => item.sourceId === sourceId);
    assert.deepEqual(sourceRef.pages, [
      Number(spans[routeIds.indexOf(route)].split("–")[0]),
      Number(spans[routeIds.indexOf(route)].split("–")[1]),
    ]);
  }
});

test("source and changed-data calculations are independently consistent", () => {
  const cyclic = (x) => (Math.exp(2 * x) * (2 * Math.sin(x) - Math.cos(x))) / 5;
  const derivative = (f, x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;
  for (const x of [-0.4, 0.1, 0.7])
    near(derivative(cyclic, x), Math.exp(2 * x) * Math.sin(x), 1e-8);

  near((3 / 16) * (-1 / 1 - 1 - (-1 / 0.5 - 0.5)), 3 / 32);
  const rational18 = (x) =>
    (x ** 2 + 2 * x - 1) / (2 * x ** 3 + 3 * x ** 2 - 2 * x);
  const parts18 = (x) =>
    1 / (2 * x) + 1 / (5 * (2 * x - 1)) - 1 / (10 * (x + 2));
  near(rational18(2), parts18(2));
  const rational19 = (x) =>
    (x ** 4 - 2 * x ** 2 + 4 * x + 1) / (x ** 3 - x ** 2 - x + 1);
  const parts19 = (x) => x + 1 + 1 / (x - 1) + 2 / (x - 1) ** 2 - 1 / (x + 1);
  near(rational19(2), parts19(2));

  const midpoint =
    (1 / 5) * [1.1, 1.3, 1.5, 1.7, 1.9].reduce((sum, x) => sum + 1 / x, 0);
  const trapezoid =
    (1 / 10) *
    (1 + 2 * [1.2, 1.4, 1.6, 1.8].reduce((sum, x) => sum + 1 / x, 0) + 0.5);
  near(midpoint, 0.6919078857159353);
  near(trapezoid, 0.6956349206349207);
  near((1 / 2) * (0.25 ** 2 + 0.75 ** 2 + 1.25 ** 2 + 1.75 ** 2), 21 / 8);
  assert.ok(9 / (32 * 54 ** 2) < 1e-4);
  assert.ok(9 / (32 * 53 ** 2) > 1e-4);

  const f = (x) => Math.sqrt(1 + x ** 3);
  const values = Array.from({ length: 9 }, (_, i) => f(2 + i / 4));
  const simpson =
    (1 / 12) *
    (values[0] +
      values[8] +
      4 * (values[1] + values[3] + values[5] + values[7]) +
      2 * (values[2] + values[4] + values[6]));
  near(simpson, 10.741592951936626, 1e-11);
  near(1 / 5 + 2 / (15 * 4 ** 4), 77 / 384);
  assert.ok(64 / (15 * 46 ** 4) <= 1e-6);
  assert.ok(64 / (15 * 44 ** 4) > 1e-6);
});

test("all six rendered guide routes expose valid MathML and stable WebMCP reads", async () => {
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
  for (const conceptId of routeIds) {
    const guide = guides[conceptId];
    const lesson = readConcept.execute({ conceptId }).lesson;
    assert.equal(lesson.contentBlocks.length, guide.contentBlocks.length);
    assert.equal(lesson.exercises.length, guide.exercises.length);
    const failures = [];
    for (const field of ["sections", "exercise"]) {
      const value = guide[field];
      for (const [index, item] of (Array.isArray(value)
        ? value
        : [value]
      ).entries())
        for (const [key, text] of Object.entries(item ?? {}))
          if (typeof text === "string" && key !== "solutionTex")
            inspectNotation(
              text,
              `${conceptId}.${field}.${index}.${key}`,
              failures,
            );
    }
    for (const block of [
      ...guide.contentBlocks,
      ...(guide.supplementalBlocks ?? []),
    ]) {
      for (const [key, value] of Object.entries(block)) {
        if (typeof value === "string")
          inspectNotation(value, `${conceptId}.${block.id}.${key}`, failures);
        if (key === "steps")
          for (const [index, item] of value.entries())
            for (const [stepKey, text] of Object.entries(item))
              if (typeof text === "string")
                if (stepKey === "equation")
                  inspectTexSemantics(
                    text,
                    `${conceptId}.${block.id}.steps[${index}].equation`,
                    failures,
                  );
                else
                  inspectNotation(
                    text,
                    `${conceptId}.${block.id}.steps[${index}].${stepKey}`,
                    failures,
                  );
      }
      for (const hypothesis of block.hypotheses ?? [])
        inspectNotation(
          hypothesis,
          `${conceptId}.${block.id}.hypothesis`,
          failures,
        );
      const html = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      if (/\$[^$]+\$/u.test(JSON.stringify(block)))
        assert.match(html, /<math\b/u, `${conceptId}:${block.id}`);
      assert.doesNotMatch(html, /katex-error/u, `${conceptId}:${block.id}`);
    }
    for (const exercise of [
      ...(guide.exercise ? [{ id: "core", ...guide.exercise }] : []),
      ...guide.exercises,
    ]) {
      for (const field of ["prompt", "hint", "solution"])
        inspectNotation(
          exercise[field],
          `${conceptId}.${exercise.id}.${field}`,
          failures,
        );
      for (const criterion of exercise.rubric ?? [])
        inspectNotation(
          criterion,
          `${conceptId}.${exercise.id}.rubric`,
          failures,
        );
      inspectTexSemantics(
        exercise.solutionTex,
        `${conceptId}.${exercise.id}`,
        failures,
      );
      const prose = renderToStaticMarkup(
        React.createElement(MathText, {
          text: `${exercise.prompt} ${exercise.hint} ${exercise.solution}`,
        }),
      );
      const answer = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(prose + answer, /<math\b/u, `${conceptId}:${exercise.id}`);
      assert.doesNotMatch(
        prose + answer,
        /katex-error/u,
        `${conceptId}:${exercise.id}`,
      );
    }
    assert.deepEqual(failures, [], conceptId);
  }
});
