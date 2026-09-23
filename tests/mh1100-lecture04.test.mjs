import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const concepts = read("../lib/curriculum/concepts.json");
const sourceSha =
  "302f899ef913f98fc4bca65ef3304a41118ec5dded4cb51b6d17b3950e9b4dbf";
const expectedSections = {
  "MH1100_Lecture_04:01": {
    span: "5–19, 23–24",
    outcomes: [
      "epsilon-delta-one-variable:source-skill-1",
      "epsilon-delta-one-variable:affine-error-delta",
      "epsilon-delta-one-variable:limit-nonexistence-negation",
      "epsilon-delta-one-variable:interval-formulation",
      "epsilon-delta-one-variable:bounded-factor-proof",
    ],
  },
  "MH1100_Lecture_04:02": {
    span: "20–22, 34–38",
    outcomes: [
      "limits-one-sided:lecture04-precise-one-sided",
      "infinite-limits:lecture04-positive-threshold",
      "infinite-limits:lecture04-negative-threshold",
    ],
  },
  "MH1100_Lecture_04:03": {
    span: "25–28",
    outcomes: ["epsilon-delta-one-variable:local-estimation"],
  },
  "MH1100_Lecture_04:04": {
    span: "29–32",
    outcomes: [
      "limit-laws-squeeze:lecture04-triangle-error",
      "limit-laws-squeeze:lecture04-sum-law-proof",
    ],
  },
};
const outcomeById = new Map(
  ledger.atomic_outcomes.map((entry) => [entry.id, entry]),
);
const lecture04Outcomes = [
  ...new Set(
    Object.values(expectedSections).flatMap((section) => section.outcomes),
  ),
].map((id) => outcomeById.get(id));

function expandSpan(span) {
  return span.split(", ").flatMap((part) => {
    const [start, end = start] = part.split("–").map(Number);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });
}

function referenceId(locator) {
  return locator.match(/\[([^\]]+)\]$/)?.[1];
}

function guideId(locator) {
  return locator.match(/#([^.]+)\./)?.[1];
}

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

test("Lecture 04 source sections use verified physical pages and distinct source outcomes", () => {
  const allIds = ledger.atomic_outcomes.map((entry) => entry.id);
  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(lecture04Outcomes.filter(Boolean).length, 11);

  for (const [sectionId, expected] of Object.entries(expectedSections)) {
    const section = ledger.source_sections.find(
      (entry) => entry.id === sectionId,
    );
    assert.ok(section, sectionId);
    assert.equal(section.physical_page_span, expected.span);
    assert.equal(section.outcome_status, "page_verified_atomic_mapping");
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.deepEqual(section.atomic_outcome_ids, expected.outcomes);
    assert.ok(Array.isArray(section.source_checked_exclusions));
    assert.deepEqual(Object.keys(section.evidence), [
      "named",
      "stated",
      "worked",
      "practiced",
      "visualized",
      "checked",
    ]);

    const sectionPages = new Set(expandSpan(expected.span));
    for (const id of expected.outcomes) {
      const outcome = outcomeById.get(id);
      assert.ok(outcome, id);
      assert.equal(outcome.source_section_id, sectionId);
      assert.equal(outcome.core_source.id, "MH1100_Lecture_04");
      assert.equal(outcome.core_source.sha256, sourceSha);
      assert.equal(outcome.core_source.page_validation.status, "page_verified");
      assert.ok(outcome.core_source.page_validation.pages.length > 0, id);
      for (const page of outcome.core_source.page_validation.pages)
        assert.ok(
          sectionPages.has(page),
          `${id} cites page ${page} outside ${expected.span}`,
        );
    }
  }

  const lecture02Infinity = outcomeById.get(
    "infinite-limits:two-sided-threshold-definition",
  );
  const lecture04Infinity = outcomeById.get(
    "infinite-limits:lecture04-positive-threshold",
  );
  assert.equal(lecture02Infinity.core_source.id, "MH1100_Lecture_02");
  assert.equal(lecture04Infinity.core_source.id, "MH1100_Lecture_04");
  assert.notEqual(lecture02Infinity.id, lecture04Infinity.id);
});

test("each adopted outcome separates guide statements, worked reasoning, and feedback", () => {
  for (const outcome of lecture04Outcomes) {
    assert.ok(outcome, "every section outcome resolves");
    assert.deepEqual(Object.keys(outcome.evidence), [
      "named",
      "stated",
      "worked",
      "practiced",
      "visualized",
      "checked",
    ]);
    assert.equal(outcome.evidence.worked.length, 1, outcome.id);
    assert.equal(outcome.evidence.practiced.length, 1, outcome.id);
    assert.deepEqual(outcome.evidence.visualized, [], outcome.id);
    assert.deepEqual(outcome.evidence.checked, [], outcome.id);
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);

    for (const statement of outcome.evidence.stated) {
      const guide = guides[guideId(statement.locator)];
      const block = guide.contentBlocks.find(
        (item) => item.id === referenceId(statement.locator),
      );
      assert.ok(block, `${outcome.id} stated locator resolves`);
    }

    const workEvidence = outcome.evidence.worked[0];
    const guide = guides[guideId(workEvidence.locator)];
    const worked = guide.contentBlocks.find(
      (item) => item.id === referenceId(workEvidence.locator),
    );
    assert.equal(worked.kind, "worked-example", outcome.id);
    assert.ok(worked.steps.length >= 2 && worked.result && worked.verification);

    const practiceEvidence = outcome.evidence.practiced[0];
    const practiceGuide = guides[guideId(practiceEvidence.locator)];
    const exercise = practiceGuide.exercises.find(
      (item) => item.id === referenceId(practiceEvidence.locator),
    );
    assert.ok(
      exercise.hint && exercise.solution && exercise.rubric.length >= 3,
    );
    assert.notEqual(exercise.prompt, worked.setup, outcome.id);
    assert.match(outcome.gap, /learner performance/i);
  }

  const identityOutcome = outcomeById.get(
    "epsilon-delta-one-variable:source-skill-1",
  );
  const parentConcept = concepts.find(
    (concept) => concept.id === identityOutcome.concept_id,
  );
  assert.notEqual(identityOutcome.outcome, parentConcept.title);
  assert.match(
    identityOutcome.evidence.named[0].claim,
    /names only the parent concept/,
  );
  assert.match(
    identityOutcome.evidence.named[0].claim,
    /does not name the atomic outcome/,
  );
  const nonexistenceTransfer = guides[
    "epsilon-delta-one-variable"
  ].exercises.find(
    (exercise) => exercise.id === "lecture04-nonexistence-transfer",
  );
  assert.match(nonexistenceTransfer.solutionTex, /\\forall L/);

  assert.match(
    guides["epsilon-delta-one-variable"].contentBlocks.find(
      (block) => block.id === "lecture04-nonexistence-negation",
    ).setup,
    /Added guide example/,
  );
  assert.match(
    guides["epsilon-delta-one-variable"].contentBlocks.find(
      (block) => block.id === "lecture04-cubic-estimation-example",
    ).setup,
    /Lecture 04 Example 4/,
  );
  assert.match(
    guides["epsilon-delta-one-variable"].sections[1].title,
    /new guide example/i,
  );
});

test("Lecture 04 prose marks its quantified variables for math rendering", () => {
  const rightRoot = guides["limits-one-sided"].contentBlocks.find(
    (block) => block.id === "lecture04-right-root-limit",
  );
  assert.ok(rightRoot.verification.includes("uses $x>4$"));

  const positiveInfinite = guides["infinite-limits"].contentBlocks.find(
    (block) => block.id === "lecture04-positive-infinite-example",
  );
  assert.ok(positiveInfinite.verification.includes("positive $M$"));

  const negativeDefinition = guides["infinite-limits"].contentBlocks.find(
    (block) => block.id === "lecture04-negative-infinite-definition",
  );
  assert.ok(negativeDefinition.statement.includes("allowed $x$"));
  assert.ok(negativeDefinition.statement.includes("restrict $x$"));
  assert.ok(negativeDefinition.hypotheses[0].includes("threshold $N$"));

  const negativeTransfer = guides["infinite-limits"].exercises.find(
    (exercise) => exercise.id === "lecture04-negative-infinite-transfer",
  );
  assert.ok(negativeTransfer.solution.includes("monotonicity of $\\ln$"));
  assert.ok(negativeTransfer.rubric[2].includes("monotonicity of $\\ln$"));

  const nonexistence = guides["epsilon-delta-one-variable"].contentBlocks.find(
    (block) => block.id === "lecture04-nonexistence-negation",
  );
  assert.ok(nonexistence.result.includes("real $L$"));
});

test("WebMCP exposes the mapped lessons and all new mathematics renders as MathML", async () => {
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const readConcept = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );

  const operatorLike = /(?<!\\)\b(?:lim|sqrt|sum|binom|sin|cos|ln|log)\b/;
  const auditedTex = [];
  for (const [conceptId, guide] of Object.entries(guides)) {
    for (const block of guide.contentBlocks ?? []) {
      if (block.id?.startsWith("lecture04-") && block.tex)
        auditedTex.push([`${conceptId}.${block.id}.tex`, block.tex]);
      for (const step of block.id?.startsWith("lecture04-")
        ? (block.steps ?? [])
        : [])
        if (step.equation)
          auditedTex.push([
            `${conceptId}.${block.id}.${step.label}`,
            step.equation,
          ]);
    }
    for (const exercise of guide.exercises ?? [])
      if (exercise.id?.startsWith("lecture04-") && exercise.solutionTex)
        auditedTex.push([
          `${conceptId}.${exercise.id}.solutionTex`,
          exercise.solutionTex,
        ]);
  }
  for (const [locator, tex] of auditedTex)
    assert.doesNotMatch(
      tex,
      operatorLike,
      `${locator} must use LaTeX operators`,
    );

  const rightRoot = guides["limits-one-sided"].contentBlocks.find(
    (block) => block.id === "lecture04-right-root-limit",
  );
  const rootSetup = renderToStaticMarkup(
    React.createElement(MathText, { text: rightRoot.setup }),
  );
  const rootEquation = renderToStaticMarkup(
    React.createElement(Formula, { block: true }, rightRoot.steps[1].equation),
  );
  assert.match(rootSetup, /<mi>lim<\/mi>/);
  assert.match(rootSetup, /<msqrt>/);
  assert.match(rootEquation, /<msqrt>/);

  const logExample = guides["infinite-limits"].contentBlocks.find(
    (block) => block.id === "lecture04-negative-infinite-log-example",
  );
  const logSetup = renderToStaticMarkup(
    React.createElement(MathText, { text: logExample.setup }),
  );
  assert.match(logSetup, /<mi>lim<\/mi>/);
  assert.match(logSetup, /<mi>ln<\/mi><mo>⁡<\/mo>/);

  for (const outcome of lecture04Outcomes) {
    const lesson = readConcept.execute({
      conceptId: outcome.concept_id,
    }).lesson;
    const workEvidence = outcome.evidence.worked[0];
    const practiceEvidence = outcome.evidence.practiced[0];
    const blockId = referenceId(workEvidence.locator);
    const exerciseId = referenceId(practiceEvidence.locator);
    const block = lesson.contentBlocks.find((item) => item.id === blockId);
    const exercise = lesson.exercises.find((item) => item.id === exerciseId);
    assert.ok(block && exercise, outcome.id);

    const prose = [block.title, block.setup, block.result, block.verification];
    if (block.kind === "worked-example")
      prose.push(block.strategy, ...block.steps.map((step) => step.text));
    for (const text of prose.filter((value) => value?.includes("$"))) {
      const html = renderToStaticMarkup(
        React.createElement(MathText, { text }),
      );
      assert.match(html, /<math\b/, outcome.id);
    }
    for (const equation of [
      ...(block.steps ?? []).map((step) => step.equation),
      exercise.solutionTex,
    ].filter(Boolean)) {
      const html = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, equation),
      );
      assert.match(html, /<math\b/, outcome.id);
    }
    for (const text of [exercise.prompt, exercise.hint, exercise.solution]) {
      if (text.includes("$")) {
        const html = renderToStaticMarkup(
          React.createElement(MathText, { text }),
        );
        assert.match(html, /<math\b/, outcome.id);
      }
    }
  }
});
