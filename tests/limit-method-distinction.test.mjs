import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = JSON.parse(
  await readFile(
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
    "infinite-limits",
    "infinite-limits:one-sided-asymptote",
    "MH1100_Lecture_02:04",
    46,
    "vertical-asymptote-one-sided-criterion",
    "tangent-vertical-asymptote",
    "rational-asymptote-transfer",
  ],
  [
    "limit-laws-squeeze",
    "limit-laws-squeeze:replacement-law",
    "MH1100_Lecture_03:02",
    23,
    "replacement-law-punctured-neighborhood",
    "replacement-law-factor-cancellation",
    "replacement-law-transfer",
  ],
  [
    "limit-laws-squeeze",
    "limit-laws-squeeze:squeeze-hypotheses",
    "MH1100_Lecture_03:04",
    31,
    "squeeze-theorem-hypotheses",
    "squeeze-oscillating-factor",
    "squeeze-bounds-transfer",
  ],
];

test("three source-checked limit outcomes have distinct lesson and practice evidence", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const readConcept = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  for (const [
    concept,
    id,
    sectionId,
    page,
    theorem,
    worked,
    practice,
  ] of cases) {
    const source = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.equal(source.core_source.physical_page, page);
    assert.equal(source.source_section_id, sectionId);
    assert.deepEqual(source.evidence.visualized, []);
    assert.deepEqual(source.evidence.checked, []);
    assert.equal(source.evidence.stated.length, 1);
    assert.equal(source.evidence.worked.length, 1);
    assert.equal(source.evidence.practiced.length, 1);
    const exposed = readConcept.execute({ conceptId: concept });
    assert.equal(source.visual_candidate.scene_id, exposed.scene);
    const lesson = exposed.lesson;
    assert.equal(
      lesson.contentBlocks.find((block) => block.id === theorem).kind,
      "theorem",
    );
    assert.equal(
      lesson.contentBlocks.find((block) => block.id === worked).kind,
      "worked-example",
    );
    const exercise = lesson.exercises.find((item) => item.id === practice);
    assert.ok(exercise.prompt && exercise.hint && exercise.solution);
    assert.ok(exercise.rubric.length >= 3);
  }
});

test("the new source-backed blocks and practice render mathematics as MathML", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  for (const [concept, , , , theorem, worked, practice] of cases) {
    const lesson = learningGuides[concept];
    const blocks = [theorem, worked].map((id) =>
      lesson.contentBlocks.find((block) => block.id === id),
    );
    const exercise = lesson.exercises.find((item) => item.id === practice);
    const html = [
      ...blocks.map((block) =>
        renderToStaticMarkup(
          React.createElement(StructuredLessonBlockView, { block }),
        ),
      ),
      ...[exercise.prompt, exercise.hint, exercise.solution].map((text) =>
        renderToStaticMarkup(React.createElement(MathText, { text })),
      ),
    ].join("");
    assert.match(html, /<math\b/, concept);
    assert.doesNotMatch(html, /katex-error/, concept);
    assert.doesNotMatch(html, /\$\\?lim|\$x=/, concept);
  }
});

test("transfer conclusions follow from signs, deleted equality, and bounds", () => {
  const f = (x) => (x + 1) / (x * x - 4);
  for (const h of [0.1, 0.01, 0.001]) {
    assert.ok(f(2 - h) < 0);
    assert.ok(f(2 + h) > 0);
    assert.ok(Math.abs(f(2 - h)) > 0.5 / h);
    assert.ok(f(2 + h) > 0.5 / h);
  }
  for (const h of [-0.1, -0.01, 0.01, 0.1]) {
    const x = 2 + h;
    assert.ok(Math.abs((x * x - 4) / (x - 2) - (x + 2)) < 1e-12);
  }
  for (const x of [-0.1, -0.01, 0.01, 0.1]) {
    const middle = x * x * (1 + Math.sin(1 / x));
    assert.ok(middle >= 0 && middle <= 2 * x * x);
  }
});
