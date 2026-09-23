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
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sources = read("../lib/curriculum/sources.json");
const manifest = read("../lib/curriculum/source-manifest.json");
const sourceId = "MH1100_Lecture_11";
const sourceSha =
  "229859c9033beb2d9ea68bd209222e47f9ae3cf0de3516f687b1ca6ff807cdc5";
const expected = {
  "MH1100_Lecture_11:01": {
    span: "4–17",
    pages: Array.from({ length: 14 }, (_, index) => index + 4),
    outcomes: [
      "optimization-single:lecture11-one-variable-model",
      "optimization-single:lecture11-closed-interval-candidates",
      "optimization-single:lecture11-first-derivative-absolute-test",
      "optimization-single:lecture11-squared-distance",
      "optimization-single:lecture11-travel-time",
      "optimization-single:lecture11-semicircle-rectangle",
    ],
  },
  "MH1100_Lecture_11:02": {
    span: "18–28",
    pages: Array.from({ length: 11 }, (_, index) => index + 18),
    outcomes: [
      "newton-method:lecture11-graphical-root-location",
      "newton-method:lecture11-tangent-intercept-update",
      "newton-method:lecture11-bad-starting-value",
      "newton-method:lecture11-polynomial-iteration",
      "newton-method:lecture11-decimal-agreement",
      "newton-method:lecture11-cosine-fixed-point",
    ],
  },
  "MH1100_Lecture_11:03": {
    span: "29–39",
    pages: Array.from({ length: 11 }, (_, index) => index + 29),
    outcomes: [
      "antiderivatives-single:lecture11-constant-on-interval",
      "antiderivatives-single:lecture11-power-rule",
      "antiderivatives-single:lecture11-linearity-and-trig-table",
      "antiderivatives-single:lecture11-rewrite-integrand",
      "antiderivatives-single:lecture11-two-initial-values",
      "antiderivatives-single:lecture11-motion-from-acceleration",
      "antiderivatives-single:lecture11-projectile-apex",
      "antiderivatives-single:lecture11-impact-time",
    ],
  },
};
const outcomeById = new Map(
  ledger.atomic_outcomes.map((outcome) => [outcome.id, outcome]),
);
const lecture11Outcomes = Object.values(expected).flatMap((section) =>
  section.outcomes.map((id) => outcomeById.get(id)),
);
const root = fileURLToPath(new URL("..", import.meta.url));
const missingLatexCommand =
  /(?<!\\)(?:sin|cos|tan|sec|csc|cot|sqrt|approx|Rightarrow|Longrightarrow|leq|geq|mathbb|int|pm|ldots)|(?<!\\)[A-Za-z]+prime/u;
const doubledLatexCommand =
  /\\\\(?:sin|cos|tan|sec|csc|cot|sqrt|approx|Rightarrow|Longrightarrow|leq|geq|mathbb|int|pm|prime|mathrm|text|pi|infty|ldots)/u;
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

function close(actual, target, tolerance = 1e-8) {
  assert.ok(
    Math.abs(actual - target) <= tolerance,
    `${actual} should be within ${tolerance} of ${target}`,
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
      for (const match of child.matchAll(/\$([^$]+)\$/gu))
        output.push(match[1]);
    else collectMath(child, output);
  }
  return output;
}

function assertGenuineLatex(tex, locator) {
  const multiSlashRuns = [...tex.matchAll(/\\+/g)]
    .map((match) => match[0].length)
    .filter((length) => length > 1);
  assert.deepEqual(
    multiSlashRuns,
    tex.includes("\\begin{cases}") ? [2] : [],
    `${locator}: only cases-row breaks may use a doubled slash`,
  );
  const mathOnly = tex.replace(
    /\\(?:text|mathrm|operatorname|mathsf|mathbf|mathit)\s*\{[^{}]*\}/g,
    "",
  );
  assert.doesNotMatch(mathOnly, missingLatexCommand, locator);
  assert.doesNotMatch(tex, doubledLatexCommand, locator);
}

test("Lecture 11 identity, physical page boundaries, and source omission are recorded", () => {
  assert.equal(sources[sourceId].pages, 39);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.match(sources[sourceId].url, /1fBY_XFdJ_2yW8Feq1WLKsk9znj7GATkD/);
  const manifestEntry = manifest.find((entry) => entry.sourceId === sourceId);
  assert.equal(manifestEntry.status, "canonical");
  assert.equal(manifestEntry.sha256, sourceSha);
  assert.deepEqual(manifestEntry.affectedConcepts, [
    "optimization-single",
    "newton-method",
    "antiderivatives-single",
  ]);

  const erratum = sources[sourceId].errata.find((entry) => entry.page === 38);
  assert.ok(erratum);
  assert.match(erratum.printed, /omits its numerical value/);
  assert.match(erratum.correction, /-9\.8/);
  assert.match(erratum.justification, /solution explicitly/);
  assert.match(erratum.provenance, /canonical SHA-matched PDF/);

  for (const [sectionId, expectedSection] of Object.entries(expected)) {
    const section = ledger.source_sections.find(
      (entry) => entry.id === sectionId,
    );
    assert.ok(section, sectionId);
    assert.equal(section.physical_page_span, expectedSection.span);
    assert.deepEqual(section.inspected_physical_pages, expectedSection.pages);
    assert.equal(section.outcome_status, "page_verified_atomic_mapping");
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.deepEqual(section.atomic_outcome_ids, expectedSection.outcomes);
    assert.deepEqual(Object.keys(section.evidence), [
      "named",
      "stated",
      "worked",
      "practiced",
      "visualized",
      "checked",
    ]);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, `${sectionId} ${state}`);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
    assert.ok(section.gap.includes("learner"));
    assert.ok(Array.isArray(section.source_checked_exclusions));
  }
  const excluded = ledger.source_sections.find(
    (entry) => entry.id === "MH1100_Lecture_11:01",
  ).source_checked_exclusions;
  assert.ok(excluded.some((entry) => entry.pages.includes(1)));
  assert.ok(
    excluded.some(
      (entry) => entry.pages.includes(2) && entry.pages.includes(3),
    ),
  );
});

test("each Lecture 11 atomic skill has distinct source, statement, work, transfer, and gaps", () => {
  const newIds = Object.values(expected).flatMap((section) => section.outcomes);
  assert.equal(lecture11Outcomes.filter(Boolean).length, newIds.length);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((entry) => entry.id)).size,
    ledger.atomic_outcomes.length,
  );
  const sourcesBySection = new Map(
    Object.entries(expected).map(([id, value]) => [id, new Set(value.pages)]),
  );

  for (const outcome of lecture11Outcomes) {
    assert.ok(outcome, "every stable Lecture 11 ID resolves");
    const pages = sourcesBySection.get(outcome.source_section_id);
    assert.ok(pages);
    assert.equal(outcome.core_source.id, sourceId);
    assert.equal(outcome.core_source.sha256, sourceSha);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.ok(outcome.core_source.page_validation.pages.length > 0, outcome.id);
    for (const page of outcome.core_source.page_validation.pages)
      assert.ok(
        pages.has(page),
        `${outcome.id} cites out-of-section page ${page}`,
      );
    assert.ok(outcome.core_source.page_validation.claim_observed);
    assert.deepEqual(Object.keys(outcome.evidence), [
      "named",
      "stated",
      "worked",
      "practiced",
      "visualized",
      "checked",
    ]);
    assert.equal(outcome.evidence.named.length, 1, outcome.id);
    assert.match(outcome.evidence.named[0].claim, /only the parent topic/);
    assert.match(
      outcome.evidence.named[0].claim,
      /does not name this atomic outcome/,
    );
    assert.equal(outcome.evidence.stated.length, 1, outcome.id);
    assert.equal(outcome.evidence.worked.length, 1, outcome.id);
    assert.equal(outcome.evidence.practiced.length, 1, outcome.id);
    assert.deepEqual(outcome.evidence.visualized, [], outcome.id);
    assert.deepEqual(outcome.evidence.checked, [], outcome.id);
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
    assert.match(outcome.gap, /learner performance is unobserved/);
    const guide = guides[outcome.concept_id];
    const statement =
      outcome.evidence.stated[0].locator.match(/\[([^\]]+)\]$/)?.[1];
    const worked =
      outcome.evidence.worked[0].locator.match(/\[([^\]]+)\]$/)?.[1];
    const exerciseId =
      outcome.evidence.practiced[0].locator.match(/\[([^\]]+)\]$/)?.[1];
    assert.ok(
      guide.contentBlocks.some((block) => block.id === statement),
      outcome.id,
    );
    assert.ok(
      guide.contentBlocks.some(
        (block) => block.id === worked && block.kind === "worked-example",
      ),
      outcome.id,
    );
    assert.ok(
      guide.exercises.some(
        (exercise) =>
          exercise.id === exerciseId &&
          exercise.hint &&
          exercise.solution &&
          exercise.rubric.length >= 3,
      ),
      outcome.id,
    );
  }
});

test("source and guide calculations recompute within the Lecture 11 claims", () => {
  const area = (x) => 2400 * x - 2 * x * x;
  assert.equal(area(0), 0);
  assert.equal(area(600), 720000);
  assert.equal(area(1200), 0);
  const boatTime = (x) => Math.sqrt(x * x + 9) / 6 + (8 - x) / 8;
  close(boatTime(9 / Math.sqrt(7)), 1 + Math.sqrt(7) / 8);
  assert.ok(boatTime(9 / Math.sqrt(7)) < boatTime(0));
  assert.ok(boatTime(9 / Math.sqrt(7)) < boatTime(8));
  close(2 * (2 / Math.sqrt(2)) * Math.sqrt(4 - 2), 4);

  const f = (x) => x ** 3 - 2 * x - 5;
  const df = (x) => 3 * x * x - 2;
  const next = (x) => x - f(x) / df(x);
  close(next(2), 2.1);
  close(next(next(2)), 2.094568121104185);
  const c = (x) => Math.cos(x) - x;
  const dc = (x) => -Math.sin(x) - 1;
  const cosineNext = (x) => x - c(x) / dc(x);
  close(cosineNext(1), 0.7503638678402439);
  close(cosineNext(cosineNext(1)), 0.7391128909113617);

  close(-4.9 * 0 * 0 + 15 * 0 + 140, 140);
  close(-4.9 * (15 / 9.8) ** 2 + 15 * (15 / 9.8) + 140, 151.4795918367347);
  close(
    -4.9 * ((15 + Math.sqrt(2969)) / 9.8) ** 2 +
      15 * ((15 + Math.sqrt(2969)) / 9.8) +
      140,
    0,
  );
});

test("WebMCP exposes the mapped routes, source pages, and accessible mathematical blocks", async () => {
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
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

  const semanticFailures = [];
  for (const conceptId of [
    "optimization-single",
    "newton-method",
    "antiderivatives-single",
  ]) {
    const guide = guides[conceptId];
    const exposed = readConcept.execute({ conceptId });
    assert.deepEqual(
      exposed.lesson.contentBlocks.map((block) => block.id),
      guide.contentBlocks.map((block) => block.id),
    );
    assert.deepEqual(
      exposed.lesson.exercises.map((exercise) => exercise.id),
      guide.exercises.map((exercise) => exercise.id),
    );
    assert.ok(
      exposed.sources.some(
        (ref) =>
          ref.sourceId === sourceId &&
          ref.pages.some((page) => page >= 4 && page <= 39),
      ),
    );

    for (const block of guide.contentBlocks.filter((entry) =>
      entry.id.includes("lecture11-"),
    )) {
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      const blockMath = collectMath(block);
      if (blockMath.length > 0) assert.match(markup, /<math\b/, block.id);
      assert.doesNotMatch(markup, /katex-error/, block.id);
      for (const tex of blockMath) {
        assertGenuineLatex(tex, `${conceptId}.${block.id}`);
        inspectTexSemantics(tex, `${conceptId}.${block.id}`, semanticFailures);
      }
      for (const step of block.steps ?? []) {
        if (!step.equation) continue;
        assertGenuineLatex(step.equation, `${block.id}.${step.label}`);
        const formula = renderToStaticMarkup(
          React.createElement(Formula, { block: true }, step.equation),
        );
        assert.match(formula, /<math\b/, `${block.id}.${step.label}`);
        assert.doesNotMatch(
          formula,
          /katex-error/,
          `${block.id}.${step.label}`,
        );
      }
    }
    for (const exercise of guide.exercises.filter((entry) =>
      entry.id.includes("lecture11-"),
    )) {
      for (const [field, value] of Object.entries({
        prompt: exercise.prompt,
        hint: exercise.hint,
        solution: exercise.solution,
        rubric: exercise.rubric.join(" "),
      })) {
        inspectNotation(
          value,
          `${conceptId}.${exercise.id}.${field}`,
          semanticFailures,
        );
        for (const match of value.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/gu))
          assertGenuineLatex(
            match[1] ?? match[2],
            `${conceptId}.${exercise.id}.${field}`,
          );
      }
      const prose = renderToStaticMarkup(
        React.createElement(MathText, {
          text: `${exercise.prompt} ${exercise.solution}`,
        }),
      );
      assert.match(prose, /<math\b/, exercise.id);
      assert.doesNotMatch(prose, /katex-error/, exercise.id);
      const tex = katex.renderToString(exercise.solutionTex, {
        throwOnError: true,
        strict: "error",
        trust: false,
        output: "htmlAndMathml",
      });
      assertGenuineLatex(exercise.solutionTex, `${exercise.id}.solutionTex`);
      inspectTexSemantics(
        exercise.solutionTex,
        `${exercise.id}.solutionTex`,
        semanticFailures,
      );
      assert.match(tex, /<math\b/, `${exercise.id} MathML`);
      assert.doesNotMatch(tex, /katex-error/, exercise.id);
      const formula = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(formula, /<math\b/, `${exercise.id} rendered MathML`);
      assert.doesNotMatch(formula, /katex-error/, exercise.id);
    }
  }
  assert.deepEqual(semanticFailures, []);
});
