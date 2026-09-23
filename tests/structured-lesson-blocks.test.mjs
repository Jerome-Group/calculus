import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("Rolle and inverse paths distinguish proof status and hypothesis use", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const rolle = learningGuides["rolle-mean-value"].contentBlocks;
  const inverse = learningGuides["inverse-functions"].contentBlocks;
  const originalInverseTheorems = new Set([
    "inverse-existence",
    "inverse-derivative-theorem",
  ]);
  assert.deepEqual(
    rolle
      .filter((block) => block.kind === "theorem")
      .map((block) => block.status),
    ["Complete proof", "Complete proof"],
  );
  assert.deepEqual(
    inverse
      .filter((block) => originalInverseTheorems.has(block.id))
      .map((block) => block.status),
    ["Theorem used without proof", "Theorem used without proof"],
  );
  assert.ok(
    rolle.some(
      (block) =>
        block.kind === "derivation" &&
        block.steps.some((step) => step.usesHypothesis),
    ),
  );
  assert.ok(
    inverse.some(
      (block) =>
        block.kind === "derivation" &&
        block.steps.some((step) =>
          step.usesHypothesis?.includes("does not prove existence"),
        ),
    ),
  );
  assert.equal(learningGuides["rolle-mean-value"].exercises[0].kind, "proof");
  assert.equal(
    learningGuides["inverse-functions"].exercises[0].kind,
    "method-choice",
  );
  assert.equal(
    learningGuides.lhopital.contentBlocks[0].status,
    "Theorem used without proof",
  );
  assert.equal(
    learningGuides["taylor-series"].contentBlocks[0].status,
    "Theorem used without proof",
  );
});

test("structured renderer shows statement, status, hypothesis, and worked verification", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const blocks = learningGuides["inverse-functions"].contentBlocks;
  const theorem = renderToStaticMarkup(
    React.createElement(StructuredLessonBlockView, { block: blocks[1] }),
  );
  const calculation = renderToStaticMarkup(
    React.createElement(StructuredLessonBlockView, { block: blocks[3] }),
  );
  assert.match(theorem, /Theorem used without proof/);
  assert.match(theorem, /Hypotheses/);
  assert.match(theorem, /Local inverse theorem/);
  assert.match(calculation, /Strategy/);
  assert.match(calculation, /Setup/);
  assert.match(calculation, /Result/);
  assert.match(calculation, /Verification/);
});

test("one-sided limits teach equal, unequal, and missing side limits", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const guide = learningGuides["limits-one-sided"];
  const blocks = guide.contentBlocks;
  assert.equal(blocks[0].status, "Proof sketch");
  assert.ok(
    blocks.filter((block) => block.kind === "worked-example").length >= 2,
  );
  const rendered = blocks
    .map((block) =>
      renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      ),
    )
    .join("");
  assert.match(rendered, /Equal sides, missing point value/);
  assert.match(rendered, /Unequal sides, no two-sided limit/);
  assert.match(rendered, /<math\b/);
  assert.doesNotMatch(rendered, /katex-error/);
  const transfer = guide.exercises.find(
    (exercise) => exercise.id === "oscillating-right-side",
  );
  assert.ok(transfer?.solution.includes("right-hand limit does not exist"));
  for (const n of [1, 2, 10, 100]) {
    assert.ok(Math.abs(Math.sin(Math.PI / 2 + 2 * Math.PI * n) - 1) < 1e-12);
    assert.ok(
      Math.abs(Math.sin((3 * Math.PI) / 2 + 2 * Math.PI * n) + 1) < 1e-12,
    );
  }
});

test("alternating series lesson renders both convergence verdicts", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const guide = learningGuides["absolute-conditional-alternating"];
  const rendered = guide.contentBlocks
    .map((block) =>
      renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      ),
    )
    .join("");
  assert.match(rendered, /Alternating Series Test/);
  assert.match(rendered, /conditionally convergent/);
  assert.match(rendered, /<math\b/);
  assert.doesNotMatch(rendered, /katex-error/);
  assert.equal(guide.exercises[0].id, "alternating-rational-transfer");
});

test("candidate plane distinction renders as accessible mathematics", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const block = learningGuides[
    "total-differentiability"
  ].supplementalBlocks.find(
    (item) => item.id === "candidate-plane-is-not-yet-approximation",
  );
  const rendered = renderToStaticMarkup(
    React.createElement(StructuredLessonBlockView, { block }),
  );
  assert.match(rendered, /tangent plane function/);
  assert.match(rendered, /<math\b/);
  assert.doesNotMatch(rendered, /katex-error/);
});
