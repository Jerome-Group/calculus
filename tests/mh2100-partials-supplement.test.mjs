import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import katex from "katex";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  inspectNotation,
  inspectTexSemantics,
} from "./helpers/math-notation.mjs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const ledger = read("../lib/curriculum/outcome-ledger.json");
const manifest = read("../lib/curriculum/source-manifest.json");
const sources = read("../lib/curriculum/sources.json");
const sourceId =
  "MH2100_Supplement_Partial_Derivatives_And_Total_Differentiability";
const sha256 =
  "93598442f95467b7214f3f8398b33341e778bd71e8acd1594bbcd4ab88a3a2fc";
const sectionOutcomes = {
  [sourceId + ":01"]: ["total-differentiability:candidate-plane-function"],
  [sourceId + ":02"]: [
    "partials-do-not-make-a-plane:failed-implications",
    "partials-do-not-make-a-plane:partials-do-not-imply-continuity",
    "partials-do-not-make-a-plane:partials-do-not-imply-approximation",
    "certifying-differentiability-and-errors:partial-domain-neighborhood-condition",
    "total-differentiability:supplement-derivative-implies-continuity",
    "total-differentiability:supplement-derivative-implies-coordinate-partials",
    "total-differentiability:supplement-unique-linear-approximation",
  ],
  [sourceId + ":03"]: [
    "certifying-differentiability-and-errors:neighborhood-partials-criterion",
  ],
  [sourceId + ":04"]: ["total-differentiability:normalized-remainder-decision"],
};
const outcomeById = new Map(
  ledger.atomic_outcomes.map((outcome) => [outcome.id, outcome]),
);
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

function close(actual, expected, tolerance = 1e-12) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    actual + " should be within " + tolerance + " of " + expected,
  );
}

function collectMath(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectMath(item, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === "string" &&
      ["equation", "solutionTex", "tex"].includes(key)
    )
      output.push(child);
    else if (typeof child === "string")
      for (const match of child.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/gu))
        output.push(match[1] ?? match[2]);
    else collectMath(child, output);
  }
  return output;
}

function inspectNarrative(value, locator, failures) {
  if (typeof value === "string") {
    inspectNotation(value, locator, failures);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectNarrative(item, locator + "[" + index + "]", failures),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value))
    if (!["equation", "solutionTex", "tex"].includes(key))
      inspectNarrative(child, locator + "." + key, failures);
}

function assertSingleSlashTex(tex, locator) {
  const doubled = [...tex.matchAll(/\\+/gu)]
    .map((match) => match[0].length)
    .filter((length) => length > 1);
  assert.deepEqual(
    doubled,
    tex.includes("\\begin{cases}") ? [2] : [],
    locator + ": only cases row breaks may use doubled backslashes",
  );
}

test("the canonical supplement and its four physical-page sections are mapped", () => {
  const source = sources[sourceId];
  assert.equal(source.pages, 1);
  assert.equal(source.sha256, sha256);
  assert.match(source.url, /1s-K8ci2kb0P0dbRgkwbHLHSEaqlvFcBw/);
  const entry = manifest.find((item) => item.sourceId === sourceId);
  assert.equal(entry.status, "canonical");
  assert.equal(entry.sha256, sha256);
  assert.deepEqual(entry.affectedConcepts, [
    "total-differentiability",
    "partials-do-not-make-a-plane",
    "certifying-differentiability-and-errors",
  ]);

  const errata = source.errata;
  assert.equal(errata.length, 2);
  assert.match(errata[0].printed, /GENERALLY FALSE/);
  assert.match(errata[0].correction, /exist throughout an open neighborhood/);
  assert.match(errata[0].justification, /coordinate-segment mean-value proof/);
  assert.match(errata[1].printed, /complete algorithm/);
  assert.match(
    errata[1].correction,
    /necessary-and-sufficient limit criterion/,
  );

  for (const [sectionId, expectedIds] of Object.entries(sectionOutcomes)) {
    const section = ledger.source_sections.find(
      (item) => item.id === sectionId,
    );
    assert.ok(section, sectionId);
    assert.equal(section.source_id, sourceId);
    assert.equal(section.physical_pages_from_audit, "1");
    assert.equal(
      section.outcome_status,
      "source_pages_reviewed_atomic_mapping_added_with_evidence_limits",
    );
    assert.deepEqual(section.atomic_outcome_ids, expectedIds);
    assert.ok(section.gap.includes("learner"));
    for (const id of expectedIds) {
      const outcome = outcomeById.get(id);
      assert.ok(outcome, id);
      assert.equal(outcome.source_section_id, sectionId);
      assert.equal(outcome.core_source.id, sourceId);
      assert.equal(outcome.core_source.sha256, sha256);
      assert.equal(outcome.core_source.page_validation.status, "page_verified");
      assert.deepEqual(outcome.core_source.page_validation.pages, [1]);
      assert.match(
        outcome.core_source.page_validation.method,
        /SHA-256 matched sources\.json/,
      );
      assert.deepEqual(Object.keys(outcome.evidence), [
        "named",
        "stated",
        "worked",
        "practiced",
        "visualized",
        "checked",
      ]);
      assert.deepEqual(outcome.evidence.named, []);
      assert.match(outcome.inspection_check.named, /parent topic/);
      for (const state of ["stated", "worked", "practiced"])
        assert.equal(outcome.evidence[state].length, 1, id + " " + state);
      assert.deepEqual(outcome.evidence.visualized, []);
      assert.deepEqual(outcome.evidence.checked, []);
      assert.equal(outcome.visual_candidate.verified_for_outcome, false);
      assert.match(outcome.gap, /learner performance|learner check/i);
    }
  }
  assert.equal(
    new Set(ledger.atomic_outcomes.map((outcome) => outcome.id)).size,
    ledger.atomic_outcomes.length,
  );
  assert.equal(Object.values(sectionOutcomes).flat().length, 10);

  for (const conceptId of [
    "total-differentiability",
    "partials-do-not-make-a-plane",
    "certifying-differentiability-and-errors",
  ]) {
    assert.ok(
      concepts
        .find((concept) => concept.id === conceptId)
        .sources.some(
          (sourceRef) =>
            sourceRef.sourceId === sourceId &&
            sourceRef.pages[0] === 1 &&
            sourceRef.pages[1] === 1,
        ),
      conceptId + " links physical page 1",
    );
  }
});

test("the source-specific counterexamples and theorem hypotheses recompute", () => {
  const continuous = (x, y) =>
    x === 0 && y === 0 ? 0 : x ** 3 / (x ** 2 + y ** 2);
  const discontinuous = (x, y) =>
    x === 0 && y === 0 ? 0 : (x * y) / (x ** 2 + y ** 2);
  for (const t of [1, 0.1, 0.01]) {
    close(continuous(t, t), t / 2);
    close(
      Math.abs(continuous(t, t) - t) / (Math.SQRT2 * t),
      1 / (2 * Math.SQRT2),
    );
    close(discontinuous(t, t), 0.5);
    close(
      Math.abs(discontinuous(t, t)) / (Math.SQRT2 * t),
      1 / (2 * Math.SQRT2 * t),
    );
    close(Math.abs(continuous(t, 0)), t);
    close(continuous(0, t), 0);
  }

  const derivativeRemainderRatio = (h, k) =>
    Math.pow(h ** 2 + k ** 2, 0.75) / Math.sqrt(h ** 2 + k ** 2);
  for (const t of [1, 0.1, 0.01]) {
    close((2 * t + t ** 1.5) / t, 2 + Math.sqrt(t));
    close((-3 * t + t ** 1.5) / t, -3 + Math.sqrt(t));
    close(derivativeRemainderRatio(t, 0), Math.sqrt(t));
  }
  assert.ok(
    derivativeRemainderRatio(0.01, 0) < derivativeRemainderRatio(0.1, 0),
  );

  for (const coefficient of [3, -2])
    close(Math.abs(coefficient * 0.01) / Math.abs(0.01), Math.abs(coefficient));

  const sparseLineResidual = (t) => Math.abs(t) / (Math.SQRT2 * Math.abs(t));
  const transferResidual = (t) =>
    (2 * Math.abs(t)) / Math.sqrt(t ** 2 + (2 * t) ** 2);
  const transferredValues = [];
  for (const t of [1, 0.1, 0.01]) {
    close(sparseLineResidual(t), 1 / Math.SQRT2);
    close(transferResidual(t), 2 / Math.sqrt(5));
    transferredValues.push(2 * Math.abs(t));
  }
  assert.ok(transferredValues[0] > transferredValues[1]);
  assert.ok(transferredValues[1] > transferredValues[2]);
  assert.ok(transferredValues[2] < 0.1);

  const radius = 0.01;
  const differentiableWithoutNeighborhoodPartials =
    (radius * radius) / 2 / radius;
  close(differentiableWithoutNeighborhoodPartials, radius / 2);
  assert.ok(differentiableWithoutNeighborhoodPartials < radius);

  const consequenceBlock = guides[
    "total-differentiability"
  ].supplementalBlocks.find(
    (item) => item.id === "supplement-necessary-consequences",
  );
  assert.deepEqual(
    consequenceBlock.steps.map((step) => step.label),
    ["Continuity", "Coordinate partials", "Unique linear approximation"],
  );
  assert.match(
    consequenceBlock.result,
    /necessary consequences, not converses/,
  );

  for (const exercise of [
    guides["partials-do-not-make-a-plane"].exercises.find(
      (item) => item.id === "partial-discontinuity-transfer",
    ),
    guides["partials-do-not-make-a-plane"].exercises.find(
      (item) => item.id === "partial-domains-transfer",
    ),
  ])
    assert.ok(exercise?.solution && exercise.solutionTex);
});

test("stable WebMCP routes expose source-linked proofs and independent practice", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { concepts: appConcepts } = await vite.ssrLoadModule(
    "/lib/curriculum/index.ts",
  );
  const readConcept = studyTools(appConcepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  assert.ok(readConcept);

  const routes = {
    "total-differentiability": {
      blocks: [
        "candidate-plane-is-not-yet-approximation",
        "supplement-necessary-consequences-statement",
        "supplement-necessary-consequences",
        "total-polynomial-remainder",
      ],
      exercises: [
        "uniform-mixed-remainder",
        "derivative-consequences-transfer",
        "unique-linear-approximation-transfer",
      ],
    },
    "partials-do-not-make-a-plane": {
      blocks: [
        "supplement-failed-implications",
        "directional-counterexample-obstruction",
        "supplement-partials-without-continuity",
        "supplement-partial-domain-continuity",
      ],
      exercises: [
        "candidate-plane-transfer",
        "partial-discontinuity-transfer",
        "partial-domains-transfer",
      ],
    },
    "certifying-differentiability-and-errors": {
      blocks: [
        "continuous-partials-sufficient-theorem",
        "criterion-versus-direct-remainder",
        "supplement-neighborhood-partials-mvt-proof",
      ],
      exercises: [
        "criterion-not-necessary",
        "continuous-partials-neighborhood-transfer",
      ],
    },
  };
  const failures = [];
  for (const [conceptId, ids] of Object.entries(routes)) {
    const guide = guides[conceptId];
    const exposed = readConcept.execute({ conceptId });
    for (const id of ids.blocks) {
      const block = guide.supplementalBlocks.find((item) => item.id === id);
      assert.ok(block, conceptId + "." + id);
      assert.ok(
        exposed.lesson.supplementalBlocks.some((item) => item.id === id),
        "WebMCP " + conceptId + "." + id,
      );
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      assert.doesNotMatch(markup, /katex-error/, id);
      const math = collectMath(block);
      if (math.length) assert.match(markup, /<math\b/, id);
      inspectNarrative(block, conceptId + "." + id, failures);
      for (const tex of math) {
        assertSingleSlashTex(tex, conceptId + "." + id);
        inspectTexSemantics(tex, conceptId + "." + id, failures);
        const rendered = katex.renderToString(tex, {
          throwOnError: true,
          strict: "error",
          trust: false,
          output: "htmlAndMathml",
        });
        assert.match(rendered, /<math\b/, conceptId + "." + id + " MathML");
        assert.doesNotMatch(rendered, /katex-error/, id);
      }
      for (const [field, value] of Object.entries(block)) {
        if (typeof value === "string")
          inspectNotation(value, conceptId + "." + id + "." + field, failures);
        if (Array.isArray(value))
          value.forEach((step, index) =>
            inspectNotation(
              step?.text,
              conceptId + "." + id + "." + field + "[" + index + "]",
              failures,
            ),
          );
      }
    }
    for (const id of ids.exercises) {
      const exercise = guide.exercises.find((item) => item.id === id);
      assert.ok(exercise, conceptId + "." + id);
      assert.ok(
        exposed.lesson.exercises.some((item) => item.id === id),
        "WebMCP " + conceptId + "." + id,
      );
      const prose = [
        exercise.prompt,
        exercise.hint,
        exercise.solution,
        ...exercise.rubric,
      ]
        .filter(Boolean)
        .join(" ");
      inspectNotation(prose, conceptId + "." + id, failures);
      inspectNarrative(exercise, conceptId + "." + id, failures);
      const markup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      assert.match(markup, /<math\b/, id + " MathML");
      assert.doesNotMatch(markup, /katex-error/, id);
      assert.ok(exercise.solutionTex, id + " has a rendered solution formula");
      assertSingleSlashTex(exercise.solutionTex, id + ".solutionTex");
      inspectTexSemantics(exercise.solutionTex, id + ".solutionTex", failures);
      const formula = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(formula, /<math\b/, id + " solution MathML");
      assert.doesNotMatch(formula, /katex-error/, id);
    }
    assert.ok(
      exposed.sources.some(
        (ref) =>
          ref.sourceId === sourceId &&
          ref.pages.includes(1) &&
          ref.source.sha256 === sha256,
      ),
      conceptId + " WebMCP source identity",
    );
  }
  assert.deepEqual(failures, []);
});
