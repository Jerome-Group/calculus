import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sectionIds = ["02", "04", "05", "06", "07", "08"].map(
  (n) => `MH1100_Lecture_01:${n}`,
);
const batch = ledger.atomic_outcomes.filter(
  (entry) =>
    sectionIds.includes(entry.source_section_id) &&
    entry.id !== "sets-functions-domains:source-skill-1",
);

test("all six Lecture 01 sections expose distinct source-mapped worked and transfer evidence", () => {
  assert.equal(batch.length, 27);
  for (const id of sectionIds)
    assert.ok(
      batch.some((entry) => entry.source_section_id === id),
      id,
    );
  for (const entry of batch) {
    assert.equal(
      entry.core_source.sha256,
      "6a5e5849c8fb01ebb4afe9a687def9af66c17b13522f25c180516652b0fd0856",
    );
    assert.equal(entry.evidence.worked.length, 1);
    assert.equal(entry.evidence.practiced.length, 1);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    const guide = guides[entry.concept_id];
    const blockId = entry.evidence.worked[0].locator.match(/\[([^\]]+)\]$/)[1];
    const taskId =
      entry.evidence.practiced[0].locator.match(/\[([^\]]+)\]$/)[1];
    const block = guide.contentBlocks.find((item) => item.id === blockId);
    const task = guide.exercises.find((item) => item.id === taskId);
    assert.equal(block.kind, "worked-example");
    assert.ok(
      block.steps.length >= 2 && block.result && block.verification,
      entry.id,
    );
    assert.ok(task.hint && task.solution && task.rubric.length >= 2, entry.id);
    assert.notEqual(task.prompt, block.setup);
  }
});

test("boundary, parity, strict order, and composition examples have independent mathematical witnesses", () => {
  const piecewise = (x) => (x <= -1 ? 1 - x : x * x);
  assert.equal(piecewise(-1), 2);
  assert.equal(piecewise(-1 + 1e-6) < 1, true);
  const f = (x) => x ** 3 + 2 * x ** 2 + 4;
  const even = (x) => (f(x) + f(-x)) / 2;
  const odd = (x) => (f(x) - f(-x)) / 2;
  for (const x of [-2, -1, 0, 1, 2]) {
    assert.equal(even(x), 2 * x ** 2 + 4);
    assert.equal(odd(x), x ** 3);
    assert.equal(even(x) + odd(x), f(x));
  }
  const square = (x) => x * x;
  for (const [a, b] of [
    [0, 1],
    [1, 2],
    [2, 3],
  ])
    assert.ok(square(a) < square(b));
  assert.ok(square(-2) > square(-1));
  const g = (x) => x + 1 / x;
  assert.equal(g(-1), -2);
  assert.equal(g(0), Infinity);
  assert.equal((g(2) + 1) / (g(2) + 2), 7 / 9);
});

test("addition formulas support the assigned trigonometric and hyperbolic transfers", () => {
  for (const [a, b] of [
    [0.3, 0.8],
    [-1.2, 0.4],
    [2, -0.7],
  ]) {
    const trig = (Math.sin(a + b) + Math.sin(a - b)) / 2;
    const hyperbolic = (Math.cosh(a + b) - Math.cosh(a - b)) / 2;
    assert.ok(Math.abs(trig - Math.sin(a) * Math.cos(b)) < 1e-12);
    assert.ok(Math.abs(hyperbolic - Math.sinh(a) * Math.sinh(b)) < 1e-12);
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

test("new worked math renders as MathML and WebMCP reads all six sections", async () => {
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
  for (const entry of batch) {
    const blockId = entry.evidence.worked[0].locator.match(/\[([^\]]+)\]$/)[1];
    const taskId =
      entry.evidence.practiced[0].locator.match(/\[([^\]]+)\]$/)[1];
    const lesson = readConcept.execute({ conceptId: entry.concept_id }).lesson;
    const block = lesson.contentBlocks.find((item) => item.id === blockId);
    const task = lesson.exercises.find((item) => item.id === taskId);
    assert.ok(block && task, entry.id);
    for (const prose of [
      block.setup,
      block.result,
      task.prompt,
      task.solution,
    ]) {
      if (prose.includes("$")) {
        const html = renderToStaticMarkup(
          React.createElement(MathText, { text: prose }),
        );
        assert.match(html, /<math\b/, entry.id);
      }
    }
  }
});
