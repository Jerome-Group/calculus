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
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const manifest = read("../lib/curriculum/source-manifest.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceId = "MH1100_Lecture_13";
const sourceSha =
  "7aae00a0abab034a81b96be4c4ff09feae30648dc66bde87b25619eb05ec9693";
const conceptId = "lhopital";
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const expected = [
  ["lecture13-zero-over-zero-form", 3, [3, 6]],
  ["lecture13-infinity-over-infinity-form", 5, [5, 6]],
  ["lecture13-choose-limit-method", 4, [4]],
  ["lecture13-apply-lhopital-hypotheses", 6, [6, 8]],
  ["lecture13-extend-lhopital-endpoints", 7, [7]],
  ["lecture13-special-case-derivative-proof", 7, [7]],
  ["lecture13-convert-indeterminate-product", 9, [9, 10]],
  ["lecture13-convert-indeterminate-difference", 11, [11, 12]],
  ["lecture13-convert-variable-power", 13, [13, 14]],
  ["lecture13-cauchy-mean-value-theorem", 15, [15]],
  ["lecture13-cauchy-mean-value-proof", 15, [15]],
].map(([slug, page, citedPages]) => ({
  id: conceptId + ":" + slug,
  slug,
  page,
  citedPages,
}));
const expectedIds = expected.map((entry) => entry.id);
const outcomes = ledger.atomic_outcomes.filter(
  (entry) => entry.source_section_id === sourceId + ":01",
);
const guide = guides[conceptId];
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

function resolveLocator(locator) {
  const match = locator.match(
    /#lhopital\.(contentBlocks|supplementalBlocks|exercises)\[([^\]]+)\](?:\.(\w+))?$/u,
  );
  assert.ok(match, locator);
  const block = guide[match[1]].find((entry) => entry.id === match[2]);
  assert.ok(block, locator);
  return { block, field: match[3] };
}

function collectChangedGuideContent() {
  return [
    ...guide.contentBlocks.filter(
      (block) =>
        block.id.startsWith("lecture13-") ||
        block.id === "cauchy-mean-value-theorem",
    ),
    guide.supplementalBlocks.find(
      (block) => block.id === "lhopital-convert-product",
    ),
    ...guide.exercises.filter((exercise) =>
      exercise.id.startsWith("lecture13-"),
    ),
  ];
}

test("Lecture 13 identity, physical pages, exclusions, and atomic mapping", () => {
  assert.equal(sources[sourceId].pages, 15);
  assert.equal(sources[sourceId].sha256, sourceSha);
  const sourceManifest = manifest.find((entry) => entry.sourceId === sourceId);
  assert.equal(sourceManifest?.status, "canonical");
  assert.equal(sourceManifest?.sha256, sourceSha);

  const section = ledger.source_sections.find(
    (entry) => entry.id === sourceId + ":01",
  );
  assert.ok(section);
  assert.equal(section.physical_page_span, "3–15");
  assert.deepEqual(
    section.inspected_physical_pages,
    Array.from({ length: 13 }, (_value, index) => index + 3),
  );
  assert.deepEqual(
    section.reviewed_exclusions.map((entry) => entry.physical_page),
    [1, 2],
  );
  assert.match(section.reviewed_exclusions[0].reason, /[Cc]over page/u);
  assert.match(section.reviewed_exclusions[1].reason, /[Ss]ynopsis/u);
  assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
  assert.equal(
    section.verification,
    "canonical_sha_and_physical_pages_verified",
  );
  assert.deepEqual(section.atomic_outcome_ids, expectedIds);
  assert.deepEqual(
    section.evidence,
    Object.fromEntries(states.map((state) => [state, []])),
  );
  assert.match(section.gap, /No outcome-specific scene alignment/u);
  assert.match(section.gap, /learner performance\/mastery/u);
  assert.ok(
    section.source_review_notes.some((note) => note.includes("p14, rendered")),
  );
  assert.ok(
    section.source_review_notes.some((note) =>
      note.includes("Cauchy’s mean value theorem"),
    ),
  );

  assert.equal(outcomes.length, expected.length);
  assert.deepEqual(
    outcomes.map((entry) => entry.id),
    expectedIds,
  );
  assert.equal(
    new Set(ledger.atomic_outcomes.map((entry) => entry.id)).size,
    ledger.atomic_outcomes.length,
  );
  const concept = concepts.find((entry) => entry.id === conceptId);
  assert.ok(concept);
  assert.ok(
    concept.sources.some(
      (entry) =>
        entry.sourceId === sourceId &&
        entry.pages[0] === 3 &&
        entry.pages[1] === 15,
    ),
  );
  assert.equal(
    guide.contentBlocks.filter(
      (block) => block.id === "cauchy-mean-value-theorem",
    ).length,
    1,
  );
  const mappedBlocks = guide.contentBlocks.filter(
    (block) =>
      block.id.startsWith("lecture13-") ||
      block.id === "cauchy-mean-value-theorem",
  );
  assert.equal(
    new Set(mappedBlocks.map((block) => block.id)).size,
    mappedBlocks.length,
  );

  for (const expectedOutcome of expected) {
    const outcome = ledger.atomic_outcomes.find(
      (entry) => entry.id === expectedOutcome.id,
    );
    assert.ok(outcome, expectedOutcome.id);
    assert.equal(outcome.concept_id, conceptId);
    assert.equal(outcome.core_source.id, sourceId);
    assert.equal(outcome.core_source.sha256, sourceSha);
    assert.equal(outcome.core_source.physical_page, expectedOutcome.page);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.deepEqual(
      outcome.core_source.page_validation.pages,
      expectedOutcome.citedPages,
    );
    assert.ok(outcome.core_source.page_validation.claim_observed);
    assert.deepEqual(Object.keys(outcome.evidence), states);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(
        outcome.evidence[state].length,
        1,
        expectedOutcome.id + " " + state,
      );
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    assert.equal(outcome.visual_candidate.scene_id, "plane-lhopital");
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
    assert.match(outcome.gap, /scene is only a candidate/u);
    assert.match(outcome.gap, /learner performance or mastery are unverified/u);

    const named = resolveLocator(outcome.evidence.named[0].locator);
    const stated = resolveLocator(outcome.evidence.stated[0].locator);
    const worked = resolveLocator(outcome.evidence.worked[0].locator);
    const practiced = resolveLocator(outcome.evidence.practiced[0].locator);
    assert.equal(named.field, "title", expectedOutcome.id);
    assert.ok(named.block.title, expectedOutcome.id);
    assert.ok(stated.block.statement || stated.block.text, expectedOutcome.id);
    assert.ok(
      ["derivation", "worked-example"].includes(worked.block.kind),
      expectedOutcome.id,
    );
    assert.ok(practiced.block.prompt, expectedOutcome.id);
    assert.ok(practiced.block.hint, expectedOutcome.id);
    assert.ok(practiced.block.solution, expectedOutcome.id);
    assert.ok(practiced.block.solutionTex, expectedOutcome.id);
    assert.ok(practiced.block.rubric.length >= 2, expectedOutcome.id);
  }

  const coveredPages = [
    ...new Set(
      outcomes.flatMap((entry) => entry.core_source.page_validation.pages),
    ),
  ].sort((left, right) => left - right);
  assert.deepEqual(
    coveredPages,
    Array.from({ length: 13 }, (_value, index) => index + 3),
  );
});

test("Lecture 13 source reasoning preserves the worked methods and hypotheses", () => {
  const block = (id) => guide.contentBlocks.find((entry) => entry.id === id);
  const cancellation = block("lecture13-method-contrast-worked").steps[0];
  assert.ok(cancellation.equation.includes("\\frac{x^2-x}{x^2-1}"));
  assert.ok(cancellation.equation.includes("\\frac12"));

  const rule = block("lecture13-lhopital-rule-statement");
  assert.ok(rule.statement.includes("g\\prime(x)\\ne0"));
  assert.ok(rule.statement.includes("finite value"));
  assert.ok(rule.statement.includes("\\infty"));
  assert.equal(rule.status, "Theorem used without proof");
  const endpointText = block("lecture13-endpoint-variants-statement").text;
  for (const symbol of ["a^+", "a^-", "+\\infty", "-\\infty"])
    assert.ok(endpointText.includes(symbol), symbol);

  const specialCase = block("lecture13-special-case-proof-statement");
  assert.equal(specialCase.status, "Complete proof");
  assert.ok(specialCase.statement.includes("not the full L’Hôpital theorem"));
  const cauchy = block("cauchy-mean-value-theorem");
  assert.equal(cauchy.status, "Complete proof");
  assert.ok(cauchy.statement.includes("continuous on $[a,b]$"));
  assert.ok(cauchy.statement.includes("g\\prime(x)\\ne0"));
  const proof = block("lecture13-cauchy-mean-value-proof-worked");
  assert.ok(JSON.stringify(proof).includes("Rolle"));
  assert.ok(JSON.stringify(proof).includes("h(x)=f(x)-f(a)"));

  const power = block("lecture13-variable-power-example-worked");
  assert.ok(
    power.steps[2].equation.includes("\\frac{4\\cos(4x)}{1+\\sin(4x)}"),
  );
  assert.ok(power.steps[2].equation.includes("\\sec^2x"));
  assert.ok(power.steps[3].equation.includes("e^4"));
  assert.ok(power.verification.includes("rendered p14"));
});

test("Lecture 13 formulas parse as semantic MathML and practice remains on WebMCP", async () => {
  const content = collectChangedGuideContent();
  const failures = [];
  const formulaKeys = new Set(["equation", "solutionTex", "tex"]);
  const inspect = (value, path, key = "") => {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        inspect(item, path + "[" + index + "]", key),
      );
      return;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return;
      if (formulaKeys.has(key)) {
        assert.doesNotThrow(
          () => inspectTexSemantics(value, path, failures),
          path,
        );
      } else inspectNotation(value, path, failures);
      return;
    }
    for (const [childKey, child] of Object.entries(value))
      inspect(child, path + "." + childKey, childKey);
  };
  content.forEach((entry) => inspect(entry, "lhopital." + entry.id));
  assert.deepEqual(failures, []);

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
  const result = readConcept.execute({ conceptId });
  assert.equal(result.id, conceptId);
  assert.equal(result.scene, "plane-lhopital");
  assert.deepEqual(result.lesson, guide);
  assert.deepEqual(result.sources[0].pages, [3, 15]);

  for (const entry of content) {
    if (entry.prompt) {
      assert.ok(
        result.lesson.exercises.some((exercise) => exercise.id === entry.id),
        entry.id,
      );
      const prose = [entry.prompt, entry.hint, entry.solution].join(" ");
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, entry.solutionTex),
      );
      assert.match(proseMarkup, /<math\b/u, entry.id + " prose");
      assert.match(formulaMarkup, /<math\b/u, entry.id + " solution");
      assert.doesNotMatch(
        proseMarkup + formulaMarkup,
        /katex-error/u,
        entry.id,
      );
    } else {
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block: entry }),
      );
      assert.ok(
        result.lesson.contentBlocks.some((block) => block.id === entry.id) ||
          result.lesson.supplementalBlocks.some(
            (block) => block.id === entry.id,
          ),
        entry.id,
      );
      assert.match(markup, /<math\b/u, entry.id);
      assert.doesNotMatch(markup, /katex-error/u, entry.id);
    }
  }
});

test("independent limits check the new examples and changed-data practice", () => {
  const close = (actual, target, tolerance, label) =>
    assert.ok(
      Math.abs(actual - target) <= tolerance,
      label + ": " + actual + " should be near " + target,
    );
  const x = 1.000001;
  close((x * x - x) / (x * x - 1), 0.5, 1e-6, "source cancellation");
  close(Math.log(x) / (x - 1), 1, 1e-6, "logarithmic quotient");
  assert.ok(Math.log(1e8) / (1e8 - 1) < 1e-6, "horizontal asymptote");
  close(
    (Math.sqrt(0.9999) - 1) / (0.9999 - 1),
    0.5,
    2e-5,
    "one-sided square-root quotient",
  );
  close((2 * -1e8 + 3) / (-1e8 - 1), 2, 1e-7, "negative-tail quotient");
  close((Math.exp(2e-6) - 1) / 3e-6, 2 / 3, 1e-6, "local 0/0 case");
  assert.ok(Math.abs(1e-6 ** 2 * Math.log(1e-6)) < 1e-9, "product conversion");
  const nearPiOverTwo = Math.PI / 2 - 1e-3;
  assert.ok(
    Math.abs(1 / Math.cos(nearPiOverTwo) - Math.tan(nearPiOverTwo)) < 1e-3,
    "difference conversion",
  );
  const nearZero = 1e-6;
  close(
    (1 + Math.sin(4 * nearZero)) ** (1 / Math.tan(nearZero)),
    Math.exp(4),
    1e-3,
    "source variable power",
  );
  close(
    Math.log(1 + Math.sin(4 * nearZero)) / Math.tan(nearZero),
    4,
    1e-4,
    "source logarithmic derivative ratio",
  );
  assert.equal((1 - 0) / (3 - 1), 0.5);
  assert.equal((2 * 0.5) / 2, 0.5);
  const rollePoint = Math.sqrt(7 / 3);
  assert.ok(rollePoint > 1 && rollePoint < 2, "Cauchy proof point is interior");
});
