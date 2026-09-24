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

const skills = [
  [
    "l03-path-worked",
    29,
    "l03-source-path-exponential",
    "l03-two-input-transfer",
  ],
  ["l03-two-input", 30, "l03-two-input-composition", "l03-two-input-transfer"],
  [
    "l03-matrix-dimensions",
    33,
    "l03-chain-matrix-shapes",
    "l03-general-dimensions-transfer",
  ],
  [
    "l03-balanced-cancellation",
    36,
    "l03-source-balanced-dependency",
    "l03-balanced-cancellation-transfer",
  ],
];

test("chain-rule source pages map distinct skills without certifying scenes or learners", () => {
  const section = ledger.source_sections.find(
    (item) => item.id === "MH2100_Lecture_03:05",
  );
  for (const [suffix, page, blockId, exerciseId] of skills) {
    const id = `multivariable-chain-rule:${suffix}`;
    const item = ledger.atomic_outcomes.find((outcome) => outcome.id === id);
    assert.ok(item, id);
    assert.ok(section.atomic_outcome_ids.includes(id));
    assert.equal(item.core_source.physical_page, page);
    assert.equal(item.core_source.page_validation.status, "page_verified");
    assert.equal(
      item.core_source.sha256,
      "d7f2a92a540030d59333f129ca38a9909e8255c4192f4d069329875b4955ecbb",
    );
    assert.ok(item.evidence.worked[0].locator.includes(blockId));
    assert.ok(item.evidence.practiced[0].locator.includes(exerciseId));
    assert.deepEqual(item.evidence.visualized, []);
    assert.deepEqual(item.evidence.checked, []);
    assert.equal(item.visual_candidate.verified_for_outcome, false);
  }
});

test("independent differentiation confirms source and changed-data calculations", () => {
  const t = 1.4;
  const sourceDerivative =
    Math.exp(Math.sin(t)) *
    (4 * t * (t * t - 1) + (t * t - 1) ** 2 * Math.cos(t));
  const sourceFunction = (x) => (x * x - 1) ** 2 * Math.exp(Math.sin(x));
  const h = 1e-5;
  assert.ok(
    Math.abs(
      sourceDerivative -
        (sourceFunction(t + h) - sourceFunction(t - h)) / (2 * h),
    ) < 1e-7,
  );
  assert.deepEqual([6 * 2 + 3 * 1, 6 * 1 + 3 * -4], [15, -6]);
  const twoInput = (s, u) => (s * s + u) ** 2 + 3 * (s - u * u);
  assert.ok(
    Math.abs((twoInput(1 + h, 2) - twoInput(1 - h, 2)) / (2 * h) - 15) < 1e-7,
  );
  assert.ok(
    Math.abs((twoInput(1, 2 + h) - twoInput(1, 2 - h)) / (2 * h) + 6) < 1e-7,
  );
  const outer = [
    [1, 1, 0],
    [0, 4, 1],
  ];
  const inner = [
    [1, 1],
    [2, 0],
    [0, 4],
  ];
  assert.deepEqual(
    outer.map((row) =>
      [0, 1].map((j) =>
        row.reduce((sum, value, i) => sum + value * inner[i][j], 0),
      ),
    ),
    [
      [3, 1],
      [8, 4],
    ],
  );
  const x = 2,
    y = 3,
    A = 7;
  assert.equal(4 * y * (2 * x * A) + x * (-8 * y * A), 0);
});

test("WebMCP exposes the full chain-rule lesson and every new block renders MathML", async () => {
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const read = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  const response = read.execute({ conceptId: "multivariable-chain-rule" });
  const guide = learningGuides["multivariable-chain-rule"];
  assert.equal(response.id, "multivariable-chain-rule");
  for (const [suffix, , blockId, exerciseId] of skills) {
    const block = guide.contentBlocks.find((item) => item.id === blockId);
    assert.ok(block, suffix);
    assert.ok(
      response.lesson.contentBlocks.some((item) => item.id === blockId),
    );
    const blockHtml = renderToStaticMarkup(
      React.createElement(StructuredLessonBlockView, { block }),
    );
    assert.match(blockHtml, /<math\b/u);
    assert.doesNotMatch(blockHtml, /katex-error/u);
    const exercise = guide.exercises.find((item) => item.id === exerciseId);
    assert.ok(exercise, exerciseId);
    assert.ok(response.lesson.exercises.some((item) => item.id === exerciseId));
    const exerciseHtml = renderToStaticMarkup(
      React.createElement(MathText, { text: exercise.solution }),
    );
    assert.match(exerciseHtml, /<math\b/u);
    assert.doesNotMatch(exerciseHtml, /katex-error/u);
  }
  const sourcePages = response.sources
    .filter((source) => source.sourceId === "MH2100_Lecture_03")
    .flatMap((source) => source.pages);
  for (const page of [29, 30, 33, 36]) assert.ok(sourcePages.includes(page));
});
