import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import katex from "katex";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const load = (name) =>
  JSON.parse(
    readFileSync(new URL(`../lib/curriculum/${name}.json`, import.meta.url)),
  );
const guides = load("learning-guides");
const ledger = load("outcome-ledger");
const source = "MH1101_Chapter_01_Notes";
const concepts = [
  "integral-antiderivatives",
  "riemann-integral",
  "integral-average",
  "fundamental-theorem",
  "substitution-integral",
  "improper-integrals",
];

const near = (actual, expected, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );

test("Chapter 01 maps every inspected section to source-page atomic outcomes", () => {
  const sections = ledger.source_sections.filter((x) => x.source_id === source);
  assert.equal(sections.length, 6);
  assert.deepEqual(
    sections.map((x) => x.atomic_outcome_ids.length),
    [3, 7, 2, 3, 2, 4],
  );
  for (const section of sections) {
    assert.equal(section.coverage_decision, "partial_atomic_mapping");
    for (const id of section.atomic_outcome_ids) {
      const item = ledger.atomic_outcomes.find((x) => x.id === id);
      assert.ok(item);
      assert.equal(item.core_source.id, source);
      assert.equal(item.core_source.page_validation.status, "page_verified");
      assert.ok(item.core_source.page_validation.pages.length > 0);
      assert.ok(item.evidence.worked.length > 0);
      assert.deepEqual(item.evidence.visualized, []);
      assert.deepEqual(item.evidence.checked, []);
      assert.equal(item.visual_candidate.verified_for_outcome, false);
    }
  }
});

test("new source calculations and transfer answers agree independently", () => {
  for (const n of [10, 100, 1000]) {
    const sum = Array.from(
      { length: n },
      (_, k) => ((k + 1) / n) ** 2 / n,
    ).reduce((a, b) => a + b, 0);
    near(sum, ((n + 1) * (2 * n + 1)) / (6 * n * n));
  }
  near((3 ** 3 - 1) / 3, 26 / 3);
  near((3 ** 3 - 1) / 3 / 2, 13 / 3);
  near(1 / (5 * (3 - 5 * 2)) - 1 / (5 * (3 - 5)), 1 / 14);
  near((2 ** 3 - 1) / 3, 7 / 3);
  near(Math.atan(100000) - Math.atan(-100000), Math.PI, 2e-5);
  for (const x of [0.2, 0.8, 1.6]) {
    const h = 1e-6;
    const f = (t) => 1 / (5 * (3 - 5 * t));
    near((f(x + h) - f(x - h)) / (2 * h), (3 - 5 * x) ** -2, 1e-7);
  }
});

test("new lesson math renders into MathML", () => {
  const expressions = [];
  for (const id of concepts) {
    const guide = guides[id];
    assert.ok(guide.supplementalBlocks?.length);
    assert.ok(guide.exercises?.length);
    for (const item of [
      ...guide.supplementalBlocks.filter((x) => x.id.startsWith("ch1-")),
      ...guide.exercises.filter((x) => x.id.startsWith("ch1-")),
    ]) {
      for (const value of Object.values(item)) {
        if (typeof value === "string") expressions.push(value);
        else if (Array.isArray(value))
          for (const step of value)
            if (typeof step === "string") expressions.push(step);
            else if (step?.text) expressions.push(step.text);
      }
    }
  }
  let rendered = 0;
  for (const text of expressions)
    for (const match of text.matchAll(/\$([^$]+)\$/g)) {
      const html = katex.renderToString(match[1], {
        throwOnError: true,
        strict: "error",
        output: "htmlAndMathml",
      });
      assert.match(html, /<math/);
      rendered++;
    }
  assert.ok(rendered > 60);
});

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("WebMCP read_concept returns the repaired guides", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts: catalog } = await vite.ssrLoadModule(
    "/lib/curriculum/index.ts",
  );
  const read = studyTools(catalog, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  for (const id of concepts) {
    const lesson = read.execute({ conceptId: id }).lesson;
    assert.ok(lesson.supplementalBlocks.some((x) => x.id.startsWith("ch1-")));
    assert.ok(lesson.exercises.some((x) => x.id.startsWith("ch1-")));
  }
});
