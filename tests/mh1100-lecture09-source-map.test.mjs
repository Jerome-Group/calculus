import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import katex from "katex";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const sourceManifest = read("../lib/curriculum/source-manifest.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceId = "MH1100_Lecture_09";
const sourceSha =
  "a1d14b5a5528b49dc3775dd0963ea215a0945ee97ff9015b999f6ff97b6ad05b";
const expected = {
  "MH1100_Lecture_09:01": [
    "extrema-fermat:local-vs-absolute-extrema",
    "extrema-fermat:extreme-value-theorem-hypotheses",
  ],
  "MH1100_Lecture_09:02": [
    "extrema-fermat:fermat-theorem-one-sided-proof",
    "extrema-fermat:fermat-converse-counterexamples",
    "extrema-fermat:critical-number-candidates",
    "extrema-fermat:closed-interval-method",
  ],
  "MH1100_Lecture_09:03": [
    "rolle-mean-value:rolle-theorem-and-proof",
    "rolle-mean-value:rolle-proves-unique-root",
    "rolle-mean-value:mean-value-theorem-slope-interpretation",
    "rolle-mean-value:mean-value-theorem-proof",
    "rolle-mean-value:solve-mean-value-point",
    "rolle-mean-value:bound-endpoint-from-derivative",
    "rolle-mean-value:zero-derivative-constant-on-interval",
    "rolle-mean-value:equal-derivatives-constant-difference",
  ],
};
const batch = ledger.atomic_outcomes.filter((entry) =>
  Object.keys(expected).includes(entry.source_section_id),
);
const close = (actual, expectedValue, tolerance = 1e-11) =>
  assert.ok(
    Math.abs(actual - expectedValue) <= tolerance,
    `${actual} ≈ ${expectedValue}`,
  );
const hasRenderedMath = (value, key = "") => {
  if (typeof value === "string")
    return ["equation", "tex"].includes(key) || /\$[^$]+\$/u.test(value);
  if (Array.isArray(value))
    return value.some((item) => hasRenderedMath(item, key));
  if (value && typeof value === "object")
    return Object.entries(value).some(([childKey, item]) =>
      hasRenderedMath(item, childKey),
    );
  return false;
};

test("Lecture 09 canonical identity, physical boundaries, and atomic evidence", () => {
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.equal(sources[sourceId].pages, 31);
  const manifest = sourceManifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(manifest?.status, "canonical");
  assert.equal(manifest?.sha256, sourceSha);
  assert.deepEqual(
    Object.keys(expected).map(
      (id) => ledger.source_sections.find((x) => x.id === id)?.id,
    ),
    Object.keys(expected),
  );

  const mappedPages = new Set();
  for (const [sectionId, expectedIds] of Object.entries(expected)) {
    const section = ledger.source_sections.find(
      (item) => item.id === sectionId,
    );
    assert.ok(section, sectionId);
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.equal(section.coverage_decision, "partial_atomic_mapping");
    assert.deepEqual(section.atomic_outcome_ids, expectedIds);
    assert.match(section.physical_pages_from_audit, /Physical pages/);
    assert.match(
      section.gap,
      /No outcome-level scene alignment or learner performance check/,
    );
    assert.deepEqual(Object.keys(section.evidence).sort(), [
      "checked",
      "named",
      "practiced",
      "stated",
      "visualized",
      "worked",
    ]);
    assert.deepEqual(section.evidence, {
      named: [],
      stated: [],
      worked: [],
      practiced: [],
      visualized: [],
      checked: [],
    });
  }
  assert.deepEqual(
    ledger.source_sections
      .find((item) => item.id === "MH1100_Lecture_09:01")
      .reviewed_exclusions.map((item) => item.physical_page),
    [1, 2, 3],
  );

  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  assert.deepEqual(
    batch.map((item) => item.id),
    Object.values(expected).flat(),
  );
  for (const [sectionId, ids] of Object.entries(expected)) {
    const pagesForSection = [];
    for (const id of ids) {
      const entry = batch.find((item) => item.id === id);
      assert.ok(entry, id);
      assert.equal(entry.source_section_id, sectionId);
      assert.equal(entry.core_source.id, sourceId);
      assert.equal(entry.core_source.sha256, sourceSha);
      assert.equal(entry.core_source.page_validation.status, "page_verified");
      assert.ok(entry.core_source.page_validation.claim_observed);
      assert.ok(
        entry.core_source.page_validation.pages.includes(
          entry.core_source.physical_page,
        ),
      );
      assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
      assert.equal(entry.depth, "source_page_and_cited_guide_inspected");
      assert.equal(entry.evidence.named.length, 1);
      assert.equal(entry.evidence.stated.length, 1);
      assert.equal(entry.evidence.worked.length, 1);
      assert.equal(entry.evidence.practiced.length, 1);
      assert.deepEqual(entry.evidence.visualized, []);
      assert.deepEqual(entry.evidence.checked, []);
      assert.equal(entry.visual_candidate.verified_for_outcome, false);
      assert.match(
        entry.gap,
        /No guide-scene alignment or learner performance check/,
      );
      for (const page of entry.core_source.page_validation.pages) {
        mappedPages.add(page);
        pagesForSection.push(page);
        assert.ok(Number.isInteger(page) && page >= 4 && page <= 31, id);
      }
      const lesson = concepts.find((item) => item.id === entry.concept_id);
      assert.ok(lesson, entry.concept_id);
      assert.ok(
        lesson.sources.some(
          (reference) =>
            reference.sourceId === sourceId &&
            reference.pages[0] <= entry.core_source.physical_page &&
            reference.pages[1] >= entry.core_source.physical_page,
        ),
        entry.id,
      );
    }
    assert.ok(pagesForSection.length > 0, sectionId);
  }
  assert.deepEqual(
    [...mappedPages].sort((a, b) => a - b),
    Array.from({ length: 28 }, (_, i) => i + 4),
  );

  const note = sources[sourceId].errata.find((item) => item.page === 24);
  assert.ok(note);
  assert.match(note.printed, /Imaging fix the curve/);
  assert.match(note.correction, /unclear; do not infer a correction/);
  assert.match(note.provenance, /canonical PDF unchanged/);
});

test("source examples and transfer tasks have independent mathematical checks", () => {
  const f = (x) => x ** 3 - 3 * x ** 2 + 1;
  const candidates = [f(-0.5), f(0), f(2), f(4)];
  assert.deepEqual(candidates, [1 / 8, 1, -3, 17]);
  assert.equal(Math.min(...candidates), -3);
  assert.equal(Math.max(...candidates), 17);

  const g = (x) => x ** 3 - 3 * x ** 2;
  assert.deepEqual([g(0), g(2), g(4)], [0, -4, 16]);
  for (const n of [-3, 0, 4]) {
    close(Math.cos(2 * n * Math.PI), 1);
    close(Math.cos((2 * n + 1) * Math.PI), -1);
  }

  const sourceRoot = (x) => x ** 3 + x - 1;
  assert.ok(sourceRoot(0) < 0 && sourceRoot(1) > 0);
  for (const x of [-10, -1, 0, 1, 10]) assert.ok(3 * x ** 2 + 1 >= 1);
  const transferRoot = (x) => x ** 3 + 2 * x + 1;
  assert.ok(transferRoot(-1) < 0 && transferRoot(0) > 0);
  for (const x of [-10, -1, 0, 1, 10]) assert.ok(3 * x ** 2 + 2 >= 2);

  const mvt = (x) => x ** 3 - x;
  const c = 2 / Math.sqrt(3);
  const secantSlope = (mvt(2) - mvt(0)) / 2;
  assert.equal(secantSlope, 3);
  close(3 * c ** 2 - 1, secantSlope);
  assert.ok(c > 0 && c < 2);

  assert.ok(-3 + 2 * 5 === 7);
  assert.equal(5 * 2 - 3, 7);
  assert.ok(4 + 3 * -2 === -2);

  const sign = (x) => x / Math.abs(x);
  assert.equal(sign(-2), -1);
  assert.equal(sign(2), 1);
  for (const x of [-2, 2]) close((sign(x + 1e-5) - sign(x)) / 1e-5, 0);
  assert.equal(2 - -1, 3);
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

test("guide formulas compile strictly and preserve semantic MathML", async () => {
  const formulas = [];
  const auditMathText = (value, path) => {
    if (Array.isArray(value))
      return value.forEach((item, index) =>
        auditMathText(item, path + "[" + index + "]"),
      );
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return;
      assert.equal((value.match(/\$/gu) ?? []).length % 2, 0, path);
      assert.doesNotMatch(value, /\$\$|\$\s+\$|\$ -|\$ \+|- \$|\+ \$/u, path);
      return;
    }
    for (const [key, item] of Object.entries(value))
      auditMathText(item, path + "." + key);
  };
  const collect = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => collect(item, `${path}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      const itemPath = `${path}.${key}`;
      if (
        typeof item === "string" &&
        ["equation", "solutionTex", "tex"].includes(key)
      ) {
        formulas.push({ path: itemPath, source: item });
      } else if (typeof item === "string") {
        for (const match of item.matchAll(/\$([^$]+)\$/gu))
          formulas.push({ path: itemPath, source: match[1] });
      } else {
        collect(item, itemPath);
      }
    }
  };
  for (const conceptId of ["extrema-fermat", "rolle-mean-value"]) {
    auditMathText(guides[conceptId], conceptId);
    collect(guides[conceptId], conceptId);
    const concept = concepts.find((item) => item.id === conceptId);
    formulas.push({ path: `${conceptId}.formula`, source: concept.formula });
  }
  assert.ok(formulas.length > 0);

  const mathml = (source) => {
    const markup = katex.renderToString(source, {
      throwOnError: true,
      strict: "error",
      output: "htmlAndMathml",
    });
    const start = markup.indexOf("<math");
    const end = markup.indexOf("</math>") + "</math>".length;
    assert.ok(start >= 0 && end > start, source);
    return markup.slice(start, end);
  };
  for (const { path, source } of formulas) {
    assert.doesNotMatch(
      source,
      /[−→Σπ≠]|(?<!\\)\b(?:lim|sin|cos|tan|sec|csc|cot|sqrt|binom)\b|(?<!\\)\bd\(/u,
      path,
    );
    assert.doesNotThrow(() => mathml(source), path);
  }

  const cosine = mathml(
    guides["extrema-fermat"].supplementalBlocks.find(
      (block) => block.id === "local-vs-absolute-worked",
    ).steps[2].equation,
  );
  assert.match(cosine, /<mi>cos<\/mi><mo>⁡<\/mo>/);
  assert.doesNotMatch(cosine, /<mi>c<\/mi><mi>o<\/mi><mi>s<\/mi>/);

  const quotient = mathml(
    guides["extrema-fermat"].supplementalBlocks.find(
      (block) => block.id === "fermat-one-sided-proof",
    ).steps[0].equation,
  );
  assert.match(quotient, /<mfrac>/);
  assert.match(quotient, /<mo>≥<\/mo>/);

  const mvt = mathml(
    guides["rolle-mean-value"].supplementalBlocks.find(
      (block) => block.id === "mvt-cubic-source-example",
    ).steps[2].equation,
  );
  assert.match(mvt, /<msqrt>/);
  assert.match(mvt, /<mfrac>/);
  assert.doesNotMatch(mvt, /<mi>s<\/mi><mi>q<\/mi><mi>r<\/mi><mi>t<\/mi>/);

  const theoremStatement = guides["rolle-mean-value"].supplementalBlocks.find(
    (block) => block.id === "mvt-statement",
  ).statement;
  const theoremEquations = [...theoremStatement.matchAll(/\$([^$]+)\$/gu)]
    .map((match) => match[1])
    .filter((source) => source.startsWith("f'(c)="));
  assert.deepEqual(theoremEquations, ["f'(c)=\\frac{f(b)-f(a)}{b-a}"]);
  const theoremMathml = mathml(theoremEquations[0]);
  assert.match(theoremMathml, /<mo>=<\/mo><mfrac>/);
  assert.match(
    theoremMathml,
    /<mfrac><mrow>.*?<mi>b<\/mi>.*?<mi>a<\/mi>.*?<\/mrow><mrow>.*?<mi>b<\/mi>.*?<mi>a<\/mi>.*?<\/mrow><\/mfrac>/su,
  );
});

test("WebMCP exposes all mapped blocks and independent practice with rendered MathML", async () => {
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts: appConcepts } = await vite.ssrLoadModule(
    "/lib/curriculum/index.ts",
  );
  const readConcept = studyTools(appConcepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  assert.ok(readConcept);
  for (const conceptId of ["extrema-fermat", "rolle-mean-value"]) {
    const lesson = readConcept.execute({ conceptId }).lesson;
    const guide = guides[conceptId];
    for (const block of guide.supplementalBlocks) {
      assert.ok(
        lesson.supplementalBlocks.some((item) => item.id === block.id),
        `${conceptId} WebMCP block ${block.id}`,
      );
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      if (hasRenderedMath(block)) assert.match(markup, /<math\b/, block.id);
      assert.doesNotMatch(markup, /katex-error/, block.id);
    }
    for (const task of guide.exercises) {
      assert.ok(
        lesson.exercises.some((item) => item.id === task.id),
        `${conceptId} WebMCP task ${task.id}`,
      );
      assert.ok(
        task.prompt && task.hint && task.solution && task.rubric.length >= 2,
      );
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, {
          text: task.prompt + " " + task.solution,
        }),
      );
      if (/\$[^$]+\$/u.test(task.prompt + task.solution)) {
        assert.match(proseMarkup, /<math\b/, task.id);
        assert.doesNotMatch(proseMarkup, /katex-error/, task.id);
      }
      const solutionMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, task.solutionTex),
      );
      assert.match(solutionMarkup, /<math\b/, `${task.id} solution MathML`);
      assert.doesNotMatch(solutionMarkup, /katex-error/, task.id);
    }
  }
});
