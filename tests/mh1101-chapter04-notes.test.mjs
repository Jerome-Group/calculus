import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import katex from "katex";

const read = (name) =>
  JSON.parse(
    readFileSync(new URL(`../lib/curriculum/${name}.json`, import.meta.url)),
  );
const ledger = read("outcome-ledger");
const sources = read("sources");
const guides = read("learning-guides");
const sourceId = "MH1101_Chapter_04_Notes";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

const mapped = [
  [
    "sequence-limits",
    "01",
    "chapter04-indexed-sequence",
    2,
    "ch04-index",
    "ch04-index-work",
    "ch04-index-transfer",
  ],
  [
    "sequence-limits",
    "01",
    "chapter04-epsilon-n-definition",
    5,
    "ch04-epsilon",
    "ch04-epsilon-work",
    "ch04-epsilon-quantifiers",
  ],
  [
    "sequence-limits",
    "01",
    "chapter04-direct-epsilon-n-proof",
    6,
    "ch04-epsilon",
    "ch04-epsilon-work",
    "ch04-epsilon-proof",
  ],
  [
    "sequence-limits",
    "01",
    "chapter04-informal-limit-language",
    4,
    "ch04-informal",
    "ch04-informal-work",
    "ch04-informal-transfer",
  ],
  [
    "subsequences-bounded",
    "02",
    "chapter04-subsequence-inheritance",
    7,
    "ch04-subseq-inherit",
    "ch04-subseq-work",
    "ch04-subseq-inherit",
  ],
  [
    "subsequences-bounded",
    "02",
    "chapter04-subsequence-divergence-test",
    8,
    "ch04-subseq-diverge",
    "ch04-subseq-work",
    "ch04-subseq-test",
  ],
  [
    "subsequences-bounded",
    "02",
    "chapter04-growth-to-infinity",
    9,
    "ch04-growth",
    "ch04-growth-work",
    "ch04-growth-transfer",
  ],
  [
    "subsequences-bounded",
    "02",
    "chapter04-factorial-root-growth",
    10,
    "ch04-growth",
    "ch04-factorial-work",
    "ch04-factorial-transfer",
  ],
  [
    "subsequences-bounded",
    "02",
    "chapter04-reciprocal-growth",
    9,
    "ch04-reciprocal",
    "ch04-reciprocal-work",
    "ch04-reciprocal-transfer",
  ],
  [
    "sequence-limit-laws",
    "03",
    "chapter04-limit-law-hypotheses",
    11,
    "ch04-laws",
    "ch04-laws-work",
    "ch04-laws-transfer",
  ],
  [
    "sequence-limit-laws",
    "03",
    "chapter04-sequence-squeeze",
    13,
    "ch04-squeeze",
    "ch04-squeeze-work",
    "ch04-squeeze-transfer",
  ],
  [
    "sequence-limit-laws",
    "03",
    "chapter04-function-limit-restriction",
    13,
    "ch04-function",
    "ch04-function-work",
    "ch04-function-transfer",
  ],
  [
    "sequence-limit-laws",
    "03",
    "chapter04-continuous-composition",
    13,
    "ch04-function",
    "ch04-continuity-work",
    "ch04-continuity-transfer",
  ],
  [
    "sequence-limit-laws",
    "03",
    "chapter04-geometric-sequence-cases",
    15,
    "ch04-geometric",
    "ch04-geometric-work",
    "ch04-geometric-transfer",
  ],
  [
    "sequence-limit-laws",
    "03",
    "chapter04-lhopital-real-extension",
    17,
    "ch04-lhopital",
    "ch04-lhopital-work",
    "ch04-lhopital-transfer",
  ],
  [
    "monotone-sequences",
    "04",
    "chapter04-monotonicity-bounds",
    19,
    "ch04-monotone",
    "ch04-monotone-work",
    "ch04-monotone-transfer",
  ],
  [
    "monotone-sequences",
    "04",
    "chapter04-monotone-convergence",
    20,
    "ch04-monotone-theorem",
    "ch04-completeness-proof",
    "ch04-monotone-theorem-transfer",
  ],
  [
    "monotone-sequences",
    "04",
    "chapter04-recursive-fixed-point",
    21,
    "ch04-recursive",
    "ch04-fixedpoint-work",
    "ch04-recursive-transfer",
  ],
];

test("Chapter 04 note sections match inspected physical page boundaries", () => {
  const spans = {
    "01": "2–6",
    "02": "7–10",
    "03": "11–18",
    "04": "19–21",
  };

  for (const [section, span] of Object.entries(spans)) {
    const entry = ledger.source_sections.find(
      (item) => item.id === `${sourceId}:${section}`,
    );
    assert.ok(entry, section);
    assert.equal(entry.physical_page_span, span);
    assert.deepEqual(
      entry.inspected_physical_pages,
      Array.from(
        { length: Number(span.split("–")[1]) - Number(span.split("–")[0]) + 1 },
        (_, index) => Number(span.split("–")[0]) + index,
      ),
    );
    assert.equal(
      entry.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.equal(entry.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.ok(entry.atomic_outcome_ids.length > 0, section);
    assert.ok(entry.inspected_physical_pages.length > 0, section);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
  }
  assert.deepEqual(
    ledger.source_sections.find((item) => item.id === `${sourceId}:05`)
      .atomic_outcome_ids,
    [
      "series-geometric-telescoping:finite-geometric-decision",
      "series-geometric-telescoping:telescoping-boundaries",
      "series-divergence-test:harmonic-blocks",
    ],
  );
  const ids = mapped.map(([concept, , suffix]) => `${concept}:${suffix}`);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const [concept, section, suffix, page] of mapped) {
    const id = `${concept}:${suffix}`;
    const outcome = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.ok(outcome, id);
    assert.equal(outcome.source_section_id, `${sourceId}:${section}`);
    assert.equal(outcome.core_source.physical_page, page);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.ok(outcome.core_source.page_validation.pages.includes(page), id);
    assert.deepEqual(outcome.evidence.named, []);
    for (const state of ["stated", "worked", "practiced"])
      assert.equal(outcome.evidence[state].length, 1, `${id}:${state}`);
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
  }
  for (const id of [
    "sequence-limit-laws:chapter04-sequence-squeeze",
    "sequence-limit-laws:chapter04-continuous-composition",
  ])
    assert.deepEqual(
      ledger.atomic_outcomes.find((item) => item.id === id).core_source
        .page_validation.pages,
      [13, 14, 18],
    );
});

test("subsequence inheritance allows any fixed starting index", () => {
  const statement = guides["subsequences-bounded"].contentBlocks.find(
    (block) => block.id === "ch04-subseq-inherit",
  ).statement;

  assert.match(
    statement,
    /increasing integer indices eventually exceed any fixed cutoff/,
  );
  assert.doesNotMatch(statement, /n_k\s*\\ge\s*k/);
});

test("Chapter 04 page 8 parity labels are documented as a source erratum", () => {
  const source = sources[sourceId];
  assert.equal(source.pages, 32);
  assert.equal(
    source.sha256,
    "8436a45c67c64106e9c79ba5d61babdf31421d22729c0470febefc49aed3f3de",
  );

  const erratum = source.errata.find((item) => item.page === 8);
  assert.ok(erratum);
  assert.match(erratum.printed, /even subsequence.*-1/i);
  assert.match(erratum.correction, /even.*1.*odd.*-1/i);
  assert.match(erratum.justification, /indices? start(?:ing)? at 1/i);
});

test("mapped lessons and practice render as MathML and are returned by WebMCP", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
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
  const readConcept = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );

  for (const [
    conceptId,
    ,
    suffix,
    ,
    statedId,
    workedId,
    exerciseId,
  ] of mapped) {
    const guide = learningGuides[conceptId];
    const stated = guide.contentBlocks.find((block) => block.id === statedId);
    const worked = guide.contentBlocks.find((block) => block.id === workedId);
    const practice = guide.exercises.find((item) => item.id === exerciseId);
    assert.ok(stated && worked && practice, suffix);
    assert.ok(
      practice.hint && practice.solution && practice.rubric.length >= 3,
    );

    const exposed = readConcept.execute({ conceptId });
    assert.ok(
      exposed.lesson.contentBlocks.some((block) => block.id === statedId),
    );
    assert.ok(
      exposed.lesson.contentBlocks.some((block) => block.id === workedId),
    );
    assert.ok(exposed.lesson.exercises.some((item) => item.id === exerciseId));
    const pages = exposed.sources
      .filter((item) => item.sourceId === sourceId)
      .flatMap((item) => item.pages);
    assert.ok(pages.includes(mapped.find((row) => row[2] === suffix)[3]));

    const html = [stated, worked]
      .map((block) =>
        renderToStaticMarkup(
          React.createElement(StructuredLessonBlockView, { block }),
        ),
      )
      .concat(
        [practice.prompt, practice.hint, practice.solution].map((text) =>
          renderToStaticMarkup(React.createElement(MathText, { text })),
        ),
      )
      .join("");
    assert.match(html, /<math\b/, suffix);
    assert.doesNotMatch(html, /katex-error/, suffix);
    for (const block of [stated, worked])
      for (const item of block.steps ?? []) {
        const equation = katex.renderToString(item.equation, {
          output: "mathml",
          throwOnError: false,
        });
        assert.match(equation, /<math\b/, `${suffix}:${item.label}`);
        assert.doesNotMatch(equation, /katex-error/, `${suffix}:${item.label}`);
      }
    assert.doesNotMatch(practice.solutionTex, /\$\$|\$\s+[+-]/, exerciseId);
    const solutionEquation = katex.renderToString(practice.solutionTex, {
      output: "mathml",
      throwOnError: false,
    });
    assert.match(solutionEquation, /<math\b/, exerciseId);
    assert.doesNotMatch(solutionEquation, /katex-error/, exerciseId);
  }
});
