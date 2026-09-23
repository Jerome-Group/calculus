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
  assert.deepEqual(
    rolle
      .filter((block) => block.kind === "theorem")
      .map((block) => block.status),
    ["Complete proof", "Complete proof"],
  );
  assert.deepEqual(
    inverse
      .filter((block) => block.kind === "theorem")
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
