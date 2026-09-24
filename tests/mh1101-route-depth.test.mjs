import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import katex from "katex";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const ledger = read("../lib/curriculum/outcome-ledger.json");

test("all MH1101 routes carry mapped source reasoning and independent feedback", () => {
  const routes = concepts.filter((concept) => concept.course === "MH1101");
  assert.equal(routes.length, 30);
  for (const route of routes) {
    const guide = guides[route.id];
    const blocks = [
      ...(guide.contentBlocks ?? []),
      ...(guide.supplementalBlocks ?? []),
    ];
    const outcomes = ledger.atomic_outcomes.filter(
      (outcome) => outcome.concept_id === route.id,
    );
    assert.ok(route.sources.length > 0, `${route.id}: source citation`);
    assert.ok(outcomes.length > 0, `${route.id}: atomic source outcome`);
    assert.ok(
      blocks.some((block) => block.kind === "worked-example"),
      `${route.id}: checked worked reasoning`,
    );
    assert.ok(guide.exercises.length > 0, `${route.id}: changed-data work`);
    for (const block of blocks) {
      if (block.kind === "theorem") {
        assert.ok(block.hypotheses?.length > 0, `${route.id}:${block.id}`);
        assert.ok(block.status, `${route.id}:${block.id}: proof status`);
      }
      if (block.kind === "worked-example") {
        assert.ok(block.steps?.length > 0, `${route.id}:${block.id}`);
        assert.ok(block.verification, `${route.id}:${block.id}: check`);
      }
    }
    for (const exercise of guide.exercises) {
      assert.ok(exercise.prompt && exercise.hint && exercise.solution);
      assert.ok(exercise.rubric?.length >= 2, `${route.id}:${exercise.id}`);
    }
  }
});

test("the absolute convergence proof status matches the supplied comparison", () => {
  const blocks = guides["absolute-conditional-alternating"].contentBlocks;
  const statement = blocks.find(
    (block) => block.id === "ch05-absolute-implies-convergence-statement",
  );
  const proof = blocks.find(
    (block) => block.id === "ch05-absolute-implies-convergence-worked",
  );
  assert.match(statement.status, /proof follows/i);
  assert.match(proof.steps[0].equation, /0\\le/u);
  assert.match(proof.steps[1].equation, /\\sum a_n/u);
});

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

test("WebMCP reads every MH1101 route with the same guide and semantic math", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts: allConcepts } = await vite.ssrLoadModule(
    "/lib/curriculum/index.ts",
  );
  const readConcept = studyTools(allConcepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  for (const route of concepts.filter(
    (concept) => concept.course === "MH1101",
  )) {
    const response = readConcept.execute({ conceptId: route.id });
    assert.equal(response.id, route.id);
    assert.deepEqual(response.lesson.sections, guides[route.id].sections);
    assert.deepEqual(response.lesson.exercise, guides[route.id].exercise);
    assert.ok(response.sources.length, `${route.id}: WebMCP source`);
    const html = katex.renderToString(route.formula, {
      throwOnError: true,
      strict: "error",
      output: "htmlAndMathml",
    });
    assert.match(html, /<math\b/u, `${route.id}: MathML`);
    assert.doesNotMatch(html, /katex-error/u, route.id);
  }
});

test("all MH1101 Learn, example, pitfall, Practice, and Revise panels render semantic math", async () => {
  const { LessonContent } = await vite.ssrLoadModule(
    "/components/atlas/lesson-content.tsx",
  );
  const { LessonPractice } = await vite.ssrLoadModule(
    "/components/atlas/lesson-practice.tsx",
  );
  const { RevisionView } = await vite.ssrLoadModule(
    "/components/atlas/revision-view.tsx",
  );
  for (const concept of concepts.filter((item) => item.course === "MH1101")) {
    const guide = guides[concept.id];
    const learn = renderToStaticMarkup(
      React.createElement(LessonContent, {
        study: { concept, openPrerequisite: () => {}, plot: () => {} },
      }),
    );
    assert.match(learn, /id="notes-intuition"/u, concept.id);
    assert.match(learn, /id="notes-example"/u, concept.id);
    assert.match(learn, /id="notes-pitfall"/u, concept.id);
    const practice = renderToStaticMarkup(
      React.createElement(LessonPractice, {
        id: concept.id,
        exerciseId: "core",
        exercise: guide.exercise,
      }),
    );
    const revise = renderToStaticMarkup(
      React.createElement(RevisionView, {
        concept,
        showReasoning: () => {},
      }),
    );
    for (const [mode, html] of [
      ["learn", learn],
      ["practice", practice],
      ["revise", revise],
    ]) {
      assert.match(html, /<math\b/u, `${concept.id}:${mode}`);
      assert.doesNotMatch(html, /katex-error/u, `${concept.id}:${mode}`);
    }
  }
});
