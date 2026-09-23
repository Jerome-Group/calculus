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

test("every practice entry renders, including solutions without display TeX", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { LessonPractice } = await vite.ssrLoadModule(
    "/components/atlas/lesson-practice.tsx",
  );
  let withoutDisplayTex = 0;
  for (const [conceptId, guide] of Object.entries(learningGuides)) {
    for (const exercise of [guide.exercise, ...(guide.exercises ?? [])]) {
      for (const key of ["prompt", "hint", "solution"])
        assert.equal(typeof exercise[key], "string", `${conceptId}: ${key}`);
      assert.ok(Array.isArray(exercise.rubric), conceptId);
      if (exercise.solutionTex === undefined) withoutDisplayTex++;
      else
        assert.equal(
          typeof exercise.solutionTex,
          "string",
          `${conceptId}: solutionTex`,
        );
      const html = renderToStaticMarkup(
        React.createElement(LessonPractice, {
          id: conceptId,
          exerciseId: exercise.id ?? "core",
          exercise,
        }),
      );
      assert.match(html, /Compare with a solution/, conceptId);
      assert.doesNotMatch(html, /katex-error/, conceptId);
    }
  }
  assert.ok(withoutDisplayTex > 0, "regression sample is present");
});
