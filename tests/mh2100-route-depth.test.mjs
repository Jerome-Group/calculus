import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const load = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const concepts = load("../lib/curriculum/concepts.json").filter(
  (concept) => concept.course === "MH2100",
);
const guides = load("../lib/curriculum/learning-guides.json");
const ledger = load("../lib/curriculum/outcome-ledger.json");
const sources = load("../lib/curriculum/sources.json");
const reviewRoutes = new Set([
  "review-integral-methods",
  "review-change-of-variables",
  "review-lagrange-box",
  "review-critical-points",
  "review-total-differentiability",
]);

test("route review records every MH2100 route and current instruction counts", () => {
  const report = readFileSync(
    new URL("../docs/audits/mh2100-route-depth-2026-09-24.md", import.meta.url),
    "utf8",
  );
  const rows = [
    ...report.matchAll(
      /^\| \d\d \| `([^`]+)` \| (\d+) \| (\d+) \| (\d+) \|/gmu,
    ),
  ];
  assert.equal(rows.length, concepts.length);
  assert.deepEqual(
    new Set(rows.map(([, id]) => id)),
    new Set(concepts.map((concept) => concept.id)),
  );
  for (const [, id, outcomeCount, workedCount, exerciseCount] of rows) {
    const guide = guides[id];
    const blocks = [
      ...(guide.contentBlocks ?? []),
      ...(guide.supplementalBlocks ?? []),
    ];
    assert.equal(
      Number(outcomeCount),
      ledger.atomic_outcomes.filter((outcome) => outcome.concept_id === id)
        .length,
      `${id}: source outcomes`,
    );
    assert.equal(
      Number(workedCount),
      blocks.filter((block) =>
        ["worked-example", "derivation"].includes(block.kind),
      ).length,
      `${id}: worked blocks`,
    );
    assert.equal(
      Number(exerciseCount),
      guide.exercises?.length ?? 0,
      `${id}: extra practice`,
    );
  }
});

// The final-review PDF's worked calculations live in named narrative sections;
// other source routes use structured derivation or worked-example blocks.
test("all 71 MH2100 routes have source-backed instruction and independent practice", () => {
  assert.equal(concepts.length, 71);
  for (const concept of concepts) {
    const guide = guides[concept.id];
    assert.ok(guide, concept.id);
    assert.ok(
      concept.sources.some(
        (citation) => sources[citation.sourceId]?.kind !== "textbook",
      ),
      `${concept.id}: core source citation`,
    );
    assert.ok(
      ledger.atomic_outcomes.some(
        (outcome) => outcome.concept_id === concept.id,
      ),
      `${concept.id}: atomic source outcome`,
    );
    assert.ok(guide.prerequisites, `${concept.id}: prerequisites`);
    assert.ok(guide.reasoning, `${concept.id}: proof status`);
    const blocks = [
      ...(guide.contentBlocks ?? []),
      ...(guide.supplementalBlocks ?? []),
    ];
    for (const theorem of blocks.filter((block) => block.kind === "theorem")) {
      assert.ok(theorem.hypotheses?.length, `${concept.id}:${theorem.id}`);
      assert.ok(theorem.status, `${concept.id}:${theorem.id}`);
    }
    if (reviewRoutes.has(concept.id)) {
      assert.ok(
        guide.sections.some((section) => /\$[^$]+\$/.test(section.text)),
        `${concept.id}: exact worked review calculation`,
      );
    } else {
      assert.ok(
        blocks.some(
          (block) =>
            block.kind === "worked-example" || block.kind === "derivation",
        ),
        `${concept.id}: worked reasoning`,
      );
    }
    assert.ok(guide.exercise?.solution, `${concept.id}: feedback`);
    assert.ok(guide.exercise?.rubric?.length, `${concept.id}: rubric`);
    if (concept.id !== "review-lagrange-box")
      assert.ok(guide.exercises?.length, `${concept.id}: transfer practice`);
  }
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

test("WebMCP reads all stable MH2100 routes with the visible guide and source", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts: allConcepts } = await vite.ssrLoadModule(
    "/lib/curriculum/index.ts",
  );
  const tool = studyTools(allConcepts, () => null).find(
    (item) => item.name === "read_concept",
  );
  for (const concept of concepts) {
    const response = tool.execute({ conceptId: concept.id });
    assert.equal(response.id, concept.id);
    assert.deepEqual(response.lesson.sections, guides[concept.id].sections);
    assert.deepEqual(response.lesson.exercise, guides[concept.id].exercise);
    assert.ok(response.sources.length, `${concept.id}: WebMCP source`);
    assert.ok(response.lesson.reasoning, `${concept.id}: WebMCP status`);
  }
});

test("MH2100 Learn, example, pitfall, Practice, and Revise panels render semantic math", async () => {
  const { LessonContent } = await vite.ssrLoadModule(
    "/components/atlas/lesson-content.tsx",
  );
  const { LessonPractice } = await vite.ssrLoadModule(
    "/components/atlas/lesson-practice.tsx",
  );
  const { RevisionView } = await vite.ssrLoadModule(
    "/components/atlas/revision-view.tsx",
  );
  for (const concept of concepts) {
    const guide = guides[concept.id];
    const learn = renderToStaticMarkup(
      React.createElement(LessonContent, {
        study: {
          concept,
          open: () => {},
          openPrerequisite: () => {},
          plot: () => {},
        },
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

test("lesson continuation and integration links use study navigation", async () => {
  const { LessonContent } = await vite.ssrLoadModule(
    "/components/atlas/lesson-content.tsx",
  );
  const opened = [];
  const open = (id) => opened.push(id);
  const elements = (node, found = []) => {
    if (Array.isArray(node)) {
      node.forEach((child) => elements(child, found));
    } else if (React.isValidElement(node)) {
      found.push(node);
      elements(node.props.children, found);
    }
    return found;
  };
  const study = (id) => ({
    concept: concepts.find((concept) => concept.id === id),
    open,
    openPrerequisite() {},
    plot() {},
  });
  const proofPath = elements(
    LessonContent({ study: study("partials-do-not-make-a-plane") }),
  );
  const button = (prefix) =>
    proofPath.find(
      (element) =>
        element.type === "button" &&
        React.Children.toArray(element.props.children)
          .filter((child) => typeof child === "string")
          .join("")
          .startsWith(prefix),
    );
  button("Next:").props.onClick();
  button("Compare:").props.onClick();
  assert.deepEqual(opened, [
    "certifying-differentiability-and-errors",
    "review-total-differentiability",
  ]);

  const integration = elements(
    LessonContent({ study: study("double-riemann-sums") }),
  ).find((element) => element.type?.name === "IntegrationFramework");
  assert.equal(integration.props.open, open);
});
