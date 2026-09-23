import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import katex from "katex";

const read = (name) =>
  JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const guides = read("../lib/curriculum/learning-guides.json");
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

const cases = [
  [
    "derivative-definition",
    "source-skill-1",
    "01",
    6,
    "finite-derivative-definition",
    "source-cubic-difference-quotient",
    "derivative-definition-transfer",
  ],
  [
    "derivative-definition",
    "tangent-and-velocity",
    "01",
    3,
    "tangent-and-velocity",
    "source-tangent-rate",
    "tangent-velocity-transfer",
  ],
  [
    "derivative-definition",
    "derivative-function-domain",
    "01",
    9,
    "derivative-function-domain",
    "source-square-root-domain",
    "derivative-domain-transfer",
  ],
  [
    "derivative-definition",
    "derivative-graph-reading",
    "01",
    10,
    "derivative-graph-reading",
    "source-derivative-graph",
    "derivative-graph-transfer",
  ],
  [
    "derivative-definition",
    "derivative-notation",
    "01",
    13,
    "derivative-notation",
    "source-notation-translation",
    "derivative-notation-transfer",
  ],
  [
    "differentiability-corners",
    "derivative-implies-continuity",
    "02",
    14,
    "derivative-implies-continuity",
    "source-implication-and-converse",
    "derivative-continuity-transfer",
  ],
  [
    "differentiability-corners",
    "discontinuity-obstruction",
    "03",
    20,
    "discontinuity-obstruction",
    "source-jump-obstruction",
    "discontinuity-obstruction-transfer",
  ],
  [
    "differentiability-corners",
    "corner-one-sided-slopes",
    "03",
    16,
    "corner-one-sided-slopes",
    "source-absolute-value-derivative",
    "corner-transfer",
  ],
  [
    "differentiability-corners",
    "vertical-tangent-infinite-slope",
    "03",
    22,
    "vertical-tangent-infinite-slope",
    "source-signed-root-vertical",
    "vertical-tangent-transfer",
  ],
  [
    "differentiability-corners",
    "second-derivative-definition",
    "04",
    24,
    "higher-derivative-iteration",
    "second-derivative-from-definition",
    "second-derivative-definition-transfer",
  ],
  [
    "differentiability-corners",
    "acceleration-second-rate",
    "04",
    26,
    "acceleration-second-rate",
    "source-motion-interpretation",
    "acceleration-transfer",
  ],
  [
    "differentiability-corners",
    "higher-derivative-iteration",
    "04",
    27,
    "higher-derivative-iteration",
    "source-third-fourth-polynomial",
    "higher-order-polynomial-transfer",
  ],
];

test("Lecture 06 has four verified sections and distinct guide evidence", () => {
  const spans = { "01": "3–13", "02": "14–15", "03": "16–23", "04": "24–27" };
  for (const [number, span] of Object.entries(spans)) {
    const section = ledger.source_sections.find(
      (entry) => entry.id === `MH1100_Lecture_06:${number}`,
    );
    assert.equal(section.physical_page_span, span);
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.deepEqual(
      section.atomic_outcome_ids,
      cases
        .filter((item) => item[2] === number)
        .map(([concept, id]) => `${concept}:${id}`),
    );
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
  }
  for (const [concept, id, section, page, theorem, worked, exercise] of cases) {
    const entry = ledger.atomic_outcomes.find(
      (item) => item.id === `${concept}:${id}`,
    );
    assert.equal(entry.core_source.physical_page, page);
    assert.equal(entry.source_section_id, `MH1100_Lecture_06:${section}`);
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.ok(entry.core_source.page_validation.pages.includes(page));
    assert.match(
      entry.evidence.stated[0].locator,
      new RegExp(`\\[${theorem}\\]$`),
    );
    assert.match(
      entry.evidence.worked[0].locator,
      new RegExp(`\\[${worked}\\]$`),
    );
    assert.match(
      entry.evidence.practiced[0].locator,
      new RegExp(`\\[${exercise}\\]$`),
    );
    assert.equal(entry.evidence.named.length, section === "04" ? 0 : 1);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
  }
});

test("new transfer tasks respect limiting slopes and rate units", () => {
  const derivative = guides["derivative-definition"];
  const corners = guides["differentiability-corners"];
  const sourceGraph = derivative.contentBlocks.find(
    (item) => item.id === "source-derivative-graph",
  );
  assert.match(sourceGraph.setup, /m\\approx3\/2/);
  assert.match(sourceGraph.steps[1].text, /near \$\(5,1\.5\)\$/);
  assert.doesNotMatch(sourceGraph.steps[1].text, /P\\prime\(5,1\.5\)/);
  assert.match(
    derivative.exercises.find((item) => item.id === "derivative-graph-transfer")
      .solution,
    /nonpositive.*nonnegative.*nonpositive/,
  );
  assert.match(
    corners.exercises.find((item) => item.id === "vertical-tangent-transfer")
      .solution,
    /no.*finite/i,
  );
  assert.match(
    corners.exercises.find((item) => item.id === "acceleration-transfer")
      .solution,
    /-12\$ m\/s.*0\$ metres per second squared/,
  );
  assert.match(
    corners.contentBlocks.find((item) => item.id === "acceleration-second-rate")
      .statement,
    /Signed velocity uses displacement per unit time/,
  );
  for (const concept of [derivative, corners]) {
    const ids = concept.exercises.map((item) => item.id);
    assert.equal(ids.length, new Set(ids).size);
  }
});

test("Lecture 06 guide formulas are genuine parseable TeX", () => {
  function* strings(value) {
    if (typeof value === "string") yield value;
    else if (Array.isArray(value)) {
      for (const item of value) yield* strings(item);
    } else if (value && typeof value === "object") {
      for (const item of Object.values(value)) yield* strings(item);
    }
  }
  for (const [concept, id, , , theoremId, workedId, exerciseId] of cases) {
    const guide = guides[concept];
    const items = [
      guide.contentBlocks.find((item) => item.id === theoremId),
      guide.contentBlocks.find((item) => item.id === workedId),
      guide.exercises.find((item) => item.id === exerciseId),
    ];
    for (const item of items) {
      for (const value of strings(item)) {
        const formulas = [...value.matchAll(/\$([^$]+)\$/g)].map(
          (match) => match[1],
        );
        if (value === item.solutionTex) formulas.push(value);
        for (const formula of formulas) {
          assert.doesNotMatch(formula, /(?<!\\)lim_\{|sqrt\(|binom\(|Σ|→/, id);
          assert.doesNotThrow(
            () =>
              katex.renderToString(formula, {
                throwOnError: true,
                output: "mathml",
              }),
            `${id}: ${formula}`,
          );
        }
      }
    }
  }
});

test("WebMCP exposes every task and MathML contains semantic calculus operators", async () => {
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const tool = studyTools(concepts, () => null).find(
    (item) => item.name === "read_concept",
  );
  for (const [concept, id, , , theoremId, workedId, exerciseId] of cases) {
    const guide = guides[concept];
    const theorem = guide.contentBlocks.find((item) => item.id === theoremId);
    const worked = guide.contentBlocks.find((item) => item.id === workedId);
    const exercise = guide.exercises.find((item) => item.id === exerciseId);
    assert.ok(theorem && worked && exercise, id);
    assert.ok(
      exercise.hint && exercise.solution && exercise.rubric.length >= 3,
      id,
    );
    const exposed = tool.execute({ conceptId: concept });
    assert.ok(
      exposed.lesson.contentBlocks.some((item) => item.id === theoremId),
      id,
    );
    assert.ok(
      exposed.lesson.exercises.some((item) => item.id === exerciseId),
      id,
    );
    const html =
      [theorem, worked]
        .map((block) =>
          renderToStaticMarkup(
            React.createElement(StructuredLessonBlockView, { block }),
          ),
        )
        .join("") +
      renderToStaticMarkup(
        React.createElement(MathText, { text: `$${exercise.solutionTex}$` }),
      );
    assert.match(html, /<math\b/, id);
    assert.doesNotMatch(html, /katex-error/, id);
    assert.doesNotMatch(
      exercise.solutionTex,
      /(?<!\\)lim_\{|sqrt\(|binom\(|Σ|→/,
      id,
    );
    if (id === "source-skill-1")
      assert.match(html, /<mfrac>/, "difference quotient is a MathML fraction");
    if (id === "derivative-function-domain")
      assert.match(html, /<msqrt>/, "root domain uses a MathML square root");
    if (id === "derivative-implies-continuity")
      assert.match(
        html,
        /<mo[^>]*>lim<\/mo>|<mi[^>]*>lim<\/mi>/,
        "limit is a MathML operator",
      );
    if (id === "derivative-graph-reading") {
      const feedbackHtml = renderToStaticMarkup(
        React.createElement(MathText, { text: exercise.solution }),
      );
      assert.match(html, /<mo>≈<\/mo>/);
      assert.match(exercise.solutionTex, /\\le0.*\\ge0.*\\le0/);
      assert.match(html, /<mo>≤<\/mo>/);
      assert.match(html, /<mo>≥<\/mo>/);
      assert.match(feedbackHtml, /<math\b/);
      assert.doesNotMatch(feedbackHtml, /katex-error/);
    }
  }
});
