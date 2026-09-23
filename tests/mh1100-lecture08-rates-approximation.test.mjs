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
  ["03", "implicit-related-rates", "motion-direction", 27],
  ["03", "implicit-related-rates", "motion-distance", 30],
  ["03", "implicit-related-rates", "speeding-signs", 32],
  ["03", "implicit-related-rates", "sphere-rate", 35],
  ["03", "implicit-related-rates", "cone-rate", 39],
  ["03", "implicit-related-rates", "ladder-rate", 42],
  ["04", "linearization-differentials", "source-skill-1", 44],
  ["04", "linearization-differentials", "anchor-and-bias", 46],
  ["04", "linearization-differentials", "differential-change", 51],
  ["04", "linearization-differentials", "measurement-error", 55],
];

test("canonical physical sections have distinct atomic outcomes and honest evidence", () => {
  assert.equal(sources.MH1100_Lecture_08.pages, 56);
  assert.equal(
    sources.MH1100_Lecture_08.sha256,
    "f81f07e967c22465bfe847444c2f0921aa36ce2a0aa0452a4fdbb1f2ebc5c8e1",
  );
  for (const [section, span] of [
    ["03", "27–43"],
    ["04", "44–56"],
  ]) {
    const sourceSection = ledger.source_sections.find(
      (item) => item.id === `MH1100_Lecture_08:${section}`,
    );
    assert.equal(sourceSection.physical_page_span, span);
    assert.equal(
      sourceSection.coverage_decision,
      "mapped_with_reasoned_exclusions",
    );
    assert.deepEqual(
      sourceSection.atomic_outcome_ids,
      cases
        .filter((item) => item[0] === section)
        .map((item) => `${item[1]}:${item[2]}`),
    );
    assert.deepEqual(sourceSection.evidence.visualized, []);
    assert.deepEqual(sourceSection.evidence.checked, []);
  }
  for (const [section, concept, id, page] of cases) {
    const outcome = ledger.atomic_outcomes.find(
      (item) => item.id === `${concept}:${id}`,
    );
    assert.equal(outcome.source_section_id, `MH1100_Lecture_08:${section}`);
    assert.equal(outcome.core_source.physical_page, page);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    const theorem = guides[concept].contentBlocks.find(
      (block) => block.id === `lecture08-${id}`,
    );
    const worked = guides[concept].contentBlocks.find(
      (block) => block.id === `lecture08-source-${id}`,
    );
    const exercise = guides[concept].exercises.find(
      (item) => item.id === `lecture08-${id}-transfer`,
    );
    assert.ok(theorem && worked && exercise);
    assert.doesNotMatch(
      theorem.hypotheses.join(" "),
      /Use the source quantities/,
    );
    assert.doesNotMatch(worked.strategy, /Identify varying quantities/);
    assert.notDeepEqual(exercise.rubric, [
      "Set up the correct derivative or tangent relation.",
      "Evaluate at the given point with units or domain.",
      "Explain the sign, approximation, or error interpretation.",
    ]);
    assert.doesNotMatch(
      JSON.stringify([theorem, worked, exercise]),
      /(?<![a-zA-Z])d[Vrxhy]\/dt/,
    );
  }
  assert.equal(
    ledger.atomic_outcomes.filter(
      (item) => item.id === "linearization-differentials:source-skill-1",
    ).length,
    1,
  );
});

test("source examples preserve signs, units, and approximation limits", () => {
  const motion = guides["implicit-related-rates"];
  const linear = guides["linearization-differentials"];
  assert.match(
    motion.contentBlocks.find(
      (item) => item.id === "lecture08-source-motion-distance",
    ).result,
    /28/,
  );
  assert.match(
    motion.contentBlocks.find(
      (item) => item.id === "lecture08-source-ladder-rate",
    ).result,
    /descends/,
  );
  assert.match(
    linear.contentBlocks.find(
      (item) => item.id === "lecture08-source-measurement-error",
    ).verification,
    /maximum error.*approximation/,
  );
  assert.match(
    sources.MH1100_Lecture_08.errata.find((item) => item.page === 50)
      .correction,
    /29/,
  );
  assert.match(
    sources.MH1100_Lecture_08.errata.find((item) => item.page === 55)
      .correction,
    /277\.75/,
  );
  assert.equal(4 + 4 + 20, 28);
  assert.ok(Math.abs(8 / (9 * Math.PI) - 0.28294) < 0.00001);
  assert.ok(
    ((4 * Math.PI) / 3) * (21.05 ** 3 - 21 ** 3) > 4 * Math.PI * 21 ** 2 * 0.05,
  );
});

test("WebMCP serves each source skill and actual LaTeX renders semantic MathML", async () => {
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
  for (const [, concept, id, page] of cases) {
    const theorem = guides[concept].contentBlocks.find(
      (item) => item.id === `lecture08-${id}`,
    );
    const worked = guides[concept].contentBlocks.find(
      (item) => item.id === `lecture08-source-${id}`,
    );
    const exercise = guides[concept].exercises.find(
      (item) => item.id === `lecture08-${id}-transfer`,
    );
    const exposed = tool.execute({ conceptId: concept });
    assert.ok(
      exposed.lesson.contentBlocks.some((item) => item.id === theorem.id),
    );
    assert.ok(exposed.lesson.exercises.some((item) => item.id === exercise.id));
    assert.ok(
      exposed.sources.some(
        (item) =>
          item.sourceId === "MH1100_Lecture_08" &&
          item.pages[0] <= page &&
          item.pages[1] >= page,
      ),
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
    const strings = [
      theorem.statement,
      ...theorem.hypotheses,
      worked.setup,
      ...worked.steps.map((step) => step.text),
      worked.result,
      worked.verification,
      exercise.prompt,
      exercise.hint,
      exercise.solution,
    ];
    for (const value of strings)
      for (const match of value.matchAll(/\$([^$]+)\$/g))
        assert.doesNotThrow(
          () =>
            katex.renderToString(match[1], {
              throwOnError: true,
              output: "mathml",
            }),
          `${id}: ${match[1]}`,
        );
  }
});
