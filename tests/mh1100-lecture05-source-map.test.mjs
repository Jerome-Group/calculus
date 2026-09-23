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
    "point-three-conditions",
    "01",
    4,
    "continuity-three-conditions",
    "source-root-sum-continuity",
    "continuity-point-transfer",
  ],
  [
    "discontinuity-types",
    "01",
    7,
    "discontinuity-classification",
    "source-discontinuity-four-cases",
    "discontinuity-type-transfer",
  ],
  [
    "one-sided-continuity",
    "01",
    14,
    "one-sided-continuity",
    "source-floor-one-sided",
    "one-sided-continuity-transfer",
  ],
  [
    "interval-continuity",
    "01",
    16,
    "interval-continuity",
    "source-interval-root",
    "interval-continuity-transfer",
  ],
  [
    "continuity-algebra",
    "02",
    18,
    "continuity-algebra",
    "source-rational-direct-substitution",
    "continuity-algebra-transfer",
  ],
  [
    "polynomial-rational-continuity",
    "02",
    19,
    "polynomial-rational-continuity",
    "source-polynomial-proof",
    "polynomial-rational-transfer",
  ],
  [
    "elementary-family-domains",
    "02",
    23,
    "elementary-family-domains",
    "source-tangent-domain",
    "elementary-family-transfer",
  ],
  [
    "continuous-outer-limit",
    "02",
    25,
    "continuous-outer-limit",
    "root-law-from-continuity",
    "continuous-outer-transfer",
  ],
  [
    "continuous-composition",
    "02",
    27,
    "continuous-composition",
    "source-nested-root-domain",
    "continuous-composition-transfer",
  ],
  [
    "continuous-extension",
    "02",
    29,
    "continuous-extension",
    "source-extension-at-three",
    "continuous-extension-transfer",
  ],
  [
    "source-skill-1",
    "03",
    31,
    "ivt-eligibility",
    "source-large-polynomial-root",
    "ivt-eligibility-transfer",
  ],
  [
    "ivt-source-polynomial",
    "03",
    34,
    "ivt-eligibility",
    "source-large-polynomial-root",
    "ivt-polynomial-transfer",
  ],
  [
    "ivt-bound-target",
    "03",
    36,
    "ivt-bound-target",
    "source-thousand-target",
    "ivt-bound-transfer",
  ],
  [
    "ivt-disjoint-roots",
    "03",
    37,
    "ivt-disjoint-roots",
    "source-cubic-three-roots",
    "ivt-disjoint-transfer",
  ],
  [
    "trig-translation-continuity",
    "02",
    22,
    "trig-continuity-addition",
    "trig-continuity-at-a",
    "trig-continuity-transfer",
  ],
];

test("Lecture 05 has physical section spans and separate page-verified evidence", () => {
  const spans = { "01": "3–17", "02": "18–29", "03": "30–37" };
  for (const [section, span] of Object.entries(spans)) {
    const entry = ledger.source_sections.find(
      (item) => item.id === `MH1100_Lecture_05:${section}`,
    );
    assert.equal(entry.physical_page_span, span);
    assert.equal(entry.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.deepEqual(
      entry.atomic_outcome_ids,
      cases
        .filter(([, candidate]) => candidate === section)
        .map(([id]) => `continuity-ivt:${id}`),
    );
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
  }
  for (const [id, section, page, theoremId, workedId, exerciseId] of cases) {
    const item = ledger.atomic_outcomes.find(
      (entry) => entry.id === `continuity-ivt:${id}`,
    );
    assert.ok(item, id);
    assert.equal(item.core_source.physical_page, page);
    assert.equal(item.source_section_id, `MH1100_Lecture_05:${section}`);
    assert.equal(item.core_source.page_validation.status, "page_verified");
    assert.ok(item.core_source.page_validation.pages.includes(page));
    assert.match(
      item.core_source.page_validation.method,
      /SHA-256 matched.*visually checked/,
    );
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(item.evidence[state].length, 1, `${id}:${state}`);
    assert.deepEqual(item.evidence.visualized, []);
    assert.deepEqual(item.evidence.checked, []);
    assert.equal(item.visual_candidate.verified_for_outcome, false);
    assert.match(
      item.evidence.stated[0].locator,
      new RegExp(`\\[${theoremId}\\]$`),
    );
    assert.match(
      item.evidence.worked[0].locator,
      new RegExp(`\\[${workedId}\\]$`),
    );
    assert.match(
      item.evidence.practiced[0].locator,
      new RegExp(`\\[${exerciseId}\\]$`),
    );
  }
});

test("source arithmetic, extension, and IVT root brackets are accurate", () => {
  const p = (x) => x ** 200 * (x - 5) + 6 * x ** 2 - 21 * x - 46;
  assert.equal(p(5), -1);
  // Keep the high power factored to avoid floating-point overflow.
  assert.equal(6 * 6 ** 2 - 21 * 6 - 46, 44);
  assert.ok(6 ** 200 + 44 > 0);
  assert.equal((3 + 2) / (3 + 3), 5 / 6);
  const lesson = JSON.parse(
    readFileSync(
      new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    ),
  )["continuity-ivt"];
  const cancellation = lesson.contentBlocks.find(
    (block) => block.id === "source-extension-at-three",
  ).steps[0].text;
  assert.ok(cancellation.includes(String.raw`x\ne\pm3`));
  for (const x of [-2.9, 2.9, 3.1]) {
    assert.ok(
      Math.abs((x * x - x - 6) / (x * x - 9) - (x + 2) / (x + 3)) < 1e-10,
    );
  }
  assert.equal(-8 + 12 - 1, 3);
  assert.equal(5 - 3 * -2, 11);
  const cubic = (x) => x ** 3 - 15 * x + 1;
  assert.deepEqual([-4, -3, 1, 4].map(cubic), [-3, 19, -13, 5]);
  assert.ok(32 ** 2 - 10 > 1000);
});

test("MathML and WebMCP expose the mapped lesson and independent tasks", async () => {
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
  const exposed = studyTools(concepts, () => null)
    .find((tool) => tool.name === "read_concept")
    .execute({ conceptId: "continuity-ivt" });
  const guide = learningGuides["continuity-ivt"];
  for (const [id, , , theoremId, workedId, exerciseId] of cases) {
    const theorem = guide.contentBlocks.find((block) => block.id === theoremId);
    const worked = guide.contentBlocks.find((block) => block.id === workedId);
    const exercise = guide.exercises.find((item) => item.id === exerciseId);
    assert.ok(theorem && worked && exercise, id);
    assert.ok(
      exposed.lesson.contentBlocks.some((block) => block.id === theoremId),
      theoremId,
    );
    assert.ok(
      exposed.lesson.exercises.some((item) => item.id === exerciseId),
      exerciseId,
    );
    assert.ok(
      exercise.hint && exercise.solution && exercise.rubric.length >= 3,
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
      [exercise.prompt, exercise.hint, exercise.solution]
        .map((text) =>
          renderToStaticMarkup(React.createElement(MathText, { text })),
        )
        .join("");
    assert.match(html, /<math\b/, id);
    assert.doesNotMatch(html, /katex-error/, id);
  }
  const pages = exposed.sources
    .filter((source) => source.sourceId === "MH1100_Lecture_05")
    .flatMap((source) => source.pages);
  for (const page of cases.map(([, , page]) => page))
    assert.ok(pages.includes(page), `physical page ${page}`);
});
