import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  inspectNotation,
  inspectTexSemantics,
} from "./helpers/math-notation.mjs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const sources = read("../lib/curriculum/sources.json");
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceId = "MH1101_Chapter_02_Notes";
const sourceSha =
  "50b7ceb64c602b7eb61a63af778efe082467487d1daa21b90a20e18aec83b998";
const expected = {
  "MH1101_Chapter_02_Notes:02": [
    "disk-washer-volumes:ch02-cross-section-volume",
    "disk-washer-volumes:source-skill-1",
    "disk-washer-volumes:ch02-vertical-disk",
    "disk-washer-volumes:ch02-vertical-washer",
    "disk-washer-volumes:ch02-horizontal-washer",
  ],
  "MH1101_Chapter_02_Notes:03": [
    "cylindrical-shells:source-skill-1",
    "cylindrical-shells:ch02-shell-versus-washer",
    "cylindrical-shells:ch02-horizontal-shell",
    "cylindrical-shells:ch02-between-curves-shell",
  ],
};
const batch = ledger.atomic_outcomes.filter((outcome) =>
  Object.keys(expected).includes(outcome.source_section_id),
);
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

const near = (actual, target) =>
  assert.ok(Math.abs(actual - target) < 1e-10, `${actual} ≈ ${target}`);

test("Chapter 02 physical sections and printed variable erratum are recorded", () => {
  assert.equal(sources[sourceId].pages, 19);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.equal(sources[sourceId].errata[0].page, 12);
  assert.match(sources[sourceId].errata[0].printed, /dy/u);
  assert.match(sources[sourceId].errata[0].correction, /dx/u);
  assert.deepEqual(
    ledger.source_sections
      .filter((section) => Object.keys(expected).includes(section.id))
      .map((section) => section.physical_page_span),
    ["5–12", "13–19"],
  );
  for (const [sectionId, ids] of Object.entries(expected)) {
    const section = ledger.source_sections.find(
      (item) => item.id === sectionId,
    );
    assert.deepEqual(section.atomic_outcome_ids, ids);
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, `${sectionId}:${state}`);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
  }
});

test("nine source skills resolve to cited lesson and changed-data evidence", () => {
  assert.equal(batch.length, 9);
  assert.equal(new Set(batch.map((outcome) => outcome.id)).size, 9);
  for (const outcome of batch) {
    assert.equal(outcome.core_source.id, sourceId);
    assert.equal(outcome.core_source.sha256, sourceSha);
    assert.ok(
      outcome.core_source.page_validation.pages.includes(
        outcome.core_source.physical_page,
      ),
    );
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(outcome.evidence[state].length > 0, `${outcome.id}:${state}`);
    assert.match(outcome.gap, /learner performance/u);
  }
});

test("source and changed volumes agree through independent calculations", () => {
  near(Math.PI * (2 * (1 - 1 / 3)), (4 * Math.PI) / 3);
  near(Math.PI * ((3 / 5) * 8 ** (5 / 3)), (96 * Math.PI) / 5);
  near(Math.PI * ((16 * 8) / 3 - 128 / 7), (512 * Math.PI) / 21);
  near(Math.PI * (1 / 2 - 1 / 5), (3 * Math.PI) / 10);
  near(2 * Math.PI * (8 - 32 / 5), (16 * Math.PI) / 5);
  near(2 * Math.PI * (1 / 2 - 1 / 4), Math.PI / 2);
  near(2 * Math.PI * (1 / 3 - 1 / 4), Math.PI / 6);
  near(Math.PI * (2 - 1 - 1 / 5), (4 * Math.PI) / 5);
  near(
    Math.PI * (9 * Math.sqrt(3) - (27 * Math.sqrt(3)) / 7),
    (36 * Math.sqrt(3) * Math.PI) / 7,
  );
  near(2 * Math.PI * (27 - 81 / 4), (27 * Math.PI) / 2);
  near(2 * Math.PI * (1 / 2 - 2 / 5), Math.PI / 5);
});

test("new formulas render as MathML and WebMCP serves both stable routes", async () => {
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const readConcept = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  assert.ok(readConcept);
  for (const conceptId of ["disk-washer-volumes", "cylindrical-shells"]) {
    const guide = guides[conceptId];
    const lesson = readConcept.execute({ conceptId }).lesson;
    assert.equal(lesson.contentBlocks.length, guide.contentBlocks.length);
    assert.equal(lesson.exercises.length, guide.exercises.length);
    const failures = [];
    for (const block of guide.contentBlocks) {
      for (const [key, value] of Object.entries(block)) {
        if (typeof value === "string")
          inspectNotation(value, `${block.id}.${key}`, failures);
        if (key === "steps")
          for (const step of value)
            for (const [stepKey, text] of Object.entries(step))
              if (stepKey === "equation")
                inspectTexSemantics(text, `${block.id}.equation`, failures);
              else inspectNotation(text, `${block.id}.${stepKey}`, failures);
      }
      if (block.kind === "theorem") {
        for (const hypothesis of block.hypotheses)
          inspectNotation(hypothesis, `${block.id}.hypothesis`, failures);
      }
      const html = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      assert.match(html, /<math\b/u, block.id);
      assert.doesNotMatch(html, /katex-error/u, block.id);
    }
    for (const exercise of guide.exercises) {
      for (const field of ["prompt", "hint", "solution"])
        inspectNotation(exercise[field], `${exercise.id}.${field}`, failures);
      for (const criterion of exercise.rubric)
        inspectNotation(criterion, `${exercise.id}.rubric`, failures);
      inspectTexSemantics(exercise.solutionTex, exercise.id, failures);
      const prose = renderToStaticMarkup(
        React.createElement(MathText, {
          text: `${exercise.prompt} ${exercise.hint} ${exercise.solution}`,
        }),
      );
      const answer = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(prose + answer, /<math\b/u, exercise.id);
      assert.doesNotMatch(prose + answer, /katex-error/u, exercise.id);
    }
    assert.deepEqual(failures, []);
  }
});
