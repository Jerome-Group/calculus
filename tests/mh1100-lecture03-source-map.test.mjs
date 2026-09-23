import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/outcome-ledger.json", import.meta.url),
  ),
);
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
    "finite-limit-algebra",
    "01",
    3,
    "finite-limit-algebra",
    "finite-limit-polynomial",
    "finite-limit-algebra-transfer",
  ],
  [
    "quotient-root-eligibility",
    "01",
    7,
    "quotient-root-eligibility",
    "quotient-root-calculation",
    "quotient-root-transfer",
  ],
  [
    "one-sided-limit-algebra",
    "01",
    17,
    "one-sided-limit-algebra",
    "one-sided-product-failure",
    "one-sided-product-transfer",
  ],
  [
    "direct-substitution-domain",
    "02",
    21,
    "direct-substitution-domain",
    "direct-substitution-contrast",
    "direct-substitution-transfer",
  ],
  [
    "replacement-law",
    "02",
    23,
    "replacement-law-punctured-neighborhood",
    "replacement-law-factor-cancellation",
    "replacement-law-transfer",
  ],
  [
    "factor-cancellation",
    "03",
    25,
    "replacement-law-punctured-neighborhood",
    "source-common-factor-exercise",
    "replacement-law-transfer",
  ],
  [
    "root-conjugate",
    "03",
    26,
    "replacement-law-punctured-neighborhood",
    "source-radical-conjugate-exercise",
    "root-rationalization-transfer",
  ],
  [
    "two-sided-one-sided-criterion",
    "03",
    27,
    "two-sided-one-sided-criterion",
    "absolute-ratio-jump",
    "two-sided-abs-transfer",
  ],
  [
    "order-preservation",
    "04",
    30,
    "order-preservation",
    "order-preservation-equality",
    "order-preservation-transfer",
  ],
  [
    "squeeze-hypotheses",
    "04",
    31,
    "squeeze-theorem-hypotheses",
    "squeeze-oscillating-factor",
    "squeeze-bounds-transfer",
  ],
  [
    "trig-chord-bound",
    "04",
    37,
    "trig-chord-bound",
    "trig-squeeze-continuity",
    "trig-chord-transfer",
  ],
  [
    "sine-ratio",
    "04",
    41,
    "trig-chord-bound",
    "unit-circle-trig-limit",
    "trig-limit-transfer",
  ],
  [
    "graph-sum-reading",
    "01",
    5,
    "graph-limit-reading",
    "source-graph-sum-contrast",
    "graph-sum-transfer",
  ],
  [
    "absolute-zero-rule",
    "04",
    40,
    "absolute-zero-squeeze",
    "absolute-zero-oscillation",
    "absolute-zero-transfer",
  ],
];

test("Lecture 03 maps distinct outcomes to verified physical pages and separate evidence", () => {
  const spans = { "01": "3–20", "02": "21–24", "03": "25–29", "04": "30–41" };
  for (const [section, span] of Object.entries(spans)) {
    const entry = ledger.source_sections.find(
      (item) => item.id === `MH1100_Lecture_03:${section}`,
    );
    assert.equal(entry.physical_page_span, span);
    assert.equal(entry.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    assert.deepEqual(
      entry.atomic_outcome_ids,
      cases
        .filter(([, candidate]) => candidate === section)
        .map(([id]) => `limit-laws-squeeze:${id}`),
    );
  }
  for (const [id, section, page] of cases) {
    const outcome = ledger.atomic_outcomes.find(
      (item) => item.id === `limit-laws-squeeze:${id}`,
    );
    assert.ok(outcome, id);
    assert.equal(outcome.source_section_id, `MH1100_Lecture_03:${section}`);
    assert.equal(outcome.core_source.physical_page, page);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.match(
      outcome.core_source.page_validation.method,
      /SHA-256 matched.*visually checked/,
    );
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(outcome.evidence[state].length, 1, `${id}:${state}`);
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
  }
});

test("source exercises and failure contrasts have the claimed results", () => {
  for (const x of [-2.2, -2.1, -1.9, -1.8]) {
    const original = (x * x + x - 2) / (x * x + 2 * x);
    assert.ok(Math.abs(original - (x - 1) / x) < 1e-12);
  }
  assert.equal((-2 - 1) / -2, 1.5);
  for (const t of [-0.1, -0.01, 0.01, 0.1]) {
    const conjugate = 1 / (Math.sqrt(t * t + 400) + 20);
    assert.ok(Math.abs(conjugate - 1 / 40) < 0.000001);
  }
  assert.equal(2 * -2, -4);
  assert.equal(2 * -1, -2);
  assert.equal(Math.sign(-0.1), -1);
  assert.equal(Math.sign(0.1), 1);
});

test("MathML and WebMCP expose all mapped lesson and practice components", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
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
  const readConcept = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  const exposed = readConcept.execute({ conceptId: "limit-laws-squeeze" });
  const guide = learningGuides["limit-laws-squeeze"];
  for (const [id, , , theoremId, workedId, practiceId] of cases) {
    const theorem = [...guide.contentBlocks, ...guide.supplementalBlocks].find(
      (block) => block.id === theoremId,
    );
    const worked = [...guide.contentBlocks, ...guide.supplementalBlocks].find(
      (block) => block.id === workedId,
    );
    const practice = guide.exercises.find((item) => item.id === practiceId);
    assert.ok(theorem && worked && practice, id);
    assert.ok(
      exposed.lesson.contentBlocks.some((block) => block.id === theoremId),
      theoremId,
    );
    assert.ok(
      exposed.lesson.exercises.some((item) => item.id === practiceId),
      practiceId,
    );
    assert.ok(
      practice.hint && practice.solution && practice.rubric.length >= 3,
      id,
    );
    const html =
      [theorem, worked]
        .map((block) =>
          renderToStaticMarkup(
            React.createElement(StructuredLessonBlockView, { block }),
          ),
        )
        .join("") +
      [practice.prompt, practice.hint, practice.solution]
        .map((text) =>
          renderToStaticMarkup(React.createElement(MathText, { text })),
        )
        .join("");
    assert.match(html, /<math\b/, id);
    assert.doesNotMatch(html, /katex-error/, id);
  }
  const pages = exposed.sources
    .filter((source) => source.sourceId === "MH1100_Lecture_03")
    .flatMap((source) => source.pages);
  for (const page of [3, 5, 7, 17, 21, 23, 25, 26, 27, 30, 31, 37, 40, 41])
    assert.ok(pages.includes(page), `physical page ${page}`);
});
