import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import katex from "katex";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sources = read("../lib/curriculum/sources.json");
const manifest = read("../lib/curriculum/source-manifest.json");
const sourceId = "MH2100_Lecture_09";
const sourceSha =
  "e71806081bf3eb4d4989a0bb578c711181a2a47e7346e14ccb264d9632a72992";
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const sectionSpecs = [
  {
    id: "MH2100_Lecture_09:01",
    span: "2–10",
    concepts: ["coordinate-line-integrals", "vector-line-integrals"],
    ids: [
      "coordinate-line-integrals:coordinate-riemann-sum-definition",
      "coordinate-line-integrals:finite-length-existence",
      "coordinate-line-integrals:plane-smooth-formulas",
      "coordinate-line-integrals:space-three-kinds",
      "vector-line-integrals:vector-is-sum-of-coordinate-integrals",
    ],
    exclusions: [1],
  },
  {
    id: "MH2100_Lecture_09:02",
    span: "11–17",
    concepts: [
      "piecewise-paths",
      "coordinate-line-integrals",
      "scalar-line-integrals",
    ],
    ids: [
      "piecewise-paths:directed-segment-parametrization",
      "piecewise-paths:line-integral-additivity",
      "scalar-line-integrals:piecewise-arclength-example",
    ],
    exclusions: [17],
  },
  {
    id: "MH2100_Lecture_09:03",
    span: "18–30",
    concepts: ["vector-fields", "work-and-circulation", "piecewise-paths"],
    ids: [
      "vector-fields:force-field-domain",
      "work-and-circulation:constant-force-displacement",
      "work-and-circulation:work-line-integral-definition",
      "work-and-circulation:source-plane-work",
      "work-and-circulation:source-space-piecewise-work",
    ],
    exclusions: [28, 30],
  },
  {
    id: "MH2100_Lecture_09:04",
    span: "31–41",
    concepts: [
      "fundamental-line-theorem",
      "conservative-domains",
      "work-and-circulation",
    ],
    ids: [
      "fundamental-line-theorem:endpoint-theorem",
      "conservative-domains:conservative-definition-potential",
      "conservative-domains:unequal-cross-partials-test",
      "conservative-domains:planar-zero-curl-domain-criterion",
      "conservative-domains:space-zero-curl-domain-criterion",
      "conservative-domains:source-plane-potential",
      "conservative-domains:nonzero-loop-rejection",
      "work-and-circulation:method-selection",
    ],
    exclusions: [35],
  },
  {
    id: "MH2100_Lecture_09:05",
    span: "42–48",
    concepts: ["greens-theorem"],
    ids: [
      "greens-theorem:positive-orientation",
      "greens-theorem:jordan-simple-boundary",
      "greens-theorem:source-skill-1",
      "greens-theorem:green-triangle-source",
      "greens-theorem:green-disk-source",
    ],
    exclusions: [43, 46, 48],
  },
  {
    id: "MH2100_Lecture_09:06",
    span: "49–52",
    concepts: ["area-from-boundary", "greens-theorem"],
    ids: [
      "area-from-boundary:curl-one-area-fields",
      "area-from-boundary:signed-area-orientation",
      "area-from-boundary:ellipse-area-source",
    ],
    exclusions: [51],
  },
];
const expectedPages = new Map([
  ["coordinate-line-integrals:coordinate-riemann-sum-definition", [3, 7]],
  ["coordinate-line-integrals:finite-length-existence", [4, 8]],
  ["coordinate-line-integrals:plane-smooth-formulas", [4, 5]],
  ["coordinate-line-integrals:space-three-kinds", [7, 9]],
  ["vector-line-integrals:vector-is-sum-of-coordinate-integrals", [10]],
  ["piecewise-paths:directed-segment-parametrization", [11, 12]],
  ["piecewise-paths:line-integral-additivity", [14, 15]],
  ["scalar-line-integrals:piecewise-arclength-example", [13, 16, 17]],
  ["vector-fields:force-field-domain", [18, 24]],
  ["work-and-circulation:constant-force-displacement", [25]],
  ["work-and-circulation:work-line-integral-definition", [26]],
  ["work-and-circulation:source-plane-work", [27]],
  ["work-and-circulation:source-space-piecewise-work", [29]],
  ["fundamental-line-theorem:endpoint-theorem", [32, 33]],
  ["conservative-domains:conservative-definition-potential", [33, 34]],
  ["conservative-domains:unequal-cross-partials-test", [36]],
  ["conservative-domains:planar-zero-curl-domain-criterion", [37, 38]],
  ["conservative-domains:space-zero-curl-domain-criterion", [39]],
  ["conservative-domains:source-plane-potential", [40]],
  ["work-and-circulation:method-selection", [41]],
  ["conservative-domains:nonzero-loop-rejection", [36]],
  ["greens-theorem:positive-orientation", [42]],
  ["greens-theorem:jordan-simple-boundary", [43]],
  ["greens-theorem:source-skill-1", [44]],
  ["greens-theorem:green-triangle-source", [45]],
  ["greens-theorem:green-disk-source", [47]],
  ["area-from-boundary:curl-one-area-fields", [49]],
  ["area-from-boundary:signed-area-orientation", [50]],
  ["area-from-boundary:ellipse-area-source", [52]],
]);
const guideIds = [
  ...new Set([...expectedPages.keys()].map((id) => id.split(":")[0])),
];
const newBlocks = Object.fromEntries(
  guideIds.map((id) => [
    id,
    (guides[id].contentBlocks ?? []).filter((block) =>
      block.id.startsWith("lecture09-"),
    ),
  ]),
);
const newExercises = Object.fromEntries(
  guideIds.map((id) => [
    id,
    (guides[id].exercises ?? []).filter((item) =>
      item.id.startsWith("lecture09-"),
    ),
  ]),
);

test("canonical source identity, exact page spans, erratum, and stable routes", () => {
  assert.equal(sources[sourceId].file, "MH2100_Lecture_09.pdf");
  assert.equal(sources[sourceId].pages, 52);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.equal(concepts.length, 125);
  assert.equal(new Set(concepts.map((item) => item.id)).size, 125);
  const sourceManifest = manifest.find(
    (source) => source.sourceId === sourceId,
  );
  assert.equal(sourceManifest.status, "canonical");
  assert.equal(sourceManifest.sha256, sourceSha);
  assert.equal(sourceManifest.driveFileId, "1-4Gz31Pj86vWlc3SFzor0HZExY9XOycM");
  assert.deepEqual(sources[sourceId].errata, [
    {
      page: 38,
      printed:
        "The final derivative equality in the planar conservative-field criterion is printed as $Q_y$.",
      correction: "Read the final term as $Q_x$: $P_y=f_{xy}=f_{yx}=Q_x$.",
      justification:
        "The page’s preceding equality is $Q_x=f_{yx}$ and the planar curl condition is $P_y=Q_x$. The canonical rendered page visibly has $Q_y$ in the final position.",
      provenance:
        "Canonical SHA-matched PDF visually inspected; mathematical correction independently checked; PDF unchanged.",
    },
  ]);

  for (const spec of sectionSpecs) {
    const section = ledger.source_sections.find((item) => item.id === spec.id);
    assert.ok(section, spec.id);
    assert.equal(section.source_id, sourceId);
    assert.equal(section.physical_page_span, spec.span);
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.deepEqual(section.linked_concept_ids, spec.concepts);
    assert.deepEqual(
      [...section.atomic_outcome_ids].sort(),
      [...spec.ids].sort(),
    );
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, spec.id + " " + state);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
    assert.deepEqual(
      section.reviewed_exclusions.map((item) => item.physical_page),
      spec.exclusions,
    );
    const [first, last] = spec.span.split("–").map(Number);
    for (const page of section.inspected_physical_pages)
      assert.ok(page >= first && page <= last, spec.id + " page " + page);
  }
  assert.match(
    ledger.source_sections.find((item) => item.id === "MH2100_Lecture_09:02")
      .gap,
    /page 17.*no solution|page 17.*calculation is supplied/iu,
  );
  assert.match(
    ledger.source_sections.find((item) => item.id === "MH2100_Lecture_09:04")
      .gap,
    /page 38.*typo/u,
  );
  assert.match(
    ledger.source_sections.find((item) => item.id === "MH2100_Lecture_09:05")
      .gap,
    /parody proof/u,
  );
  assert.match(
    ledger.source_sections.find((item) => item.id === "MH2100_Lecture_09:06")
      .gap,
    /planimeter context only/u,
  );
});

test("every mapped atomic skill has page-specific lesson and transfer evidence", () => {
  const mapped = ledger.atomic_outcomes.filter((entry) =>
    expectedPages.has(entry.id),
  );
  assert.equal(mapped.length, expectedPages.size);
  assert.deepEqual(
    mapped.map((item) => item.id).sort(),
    [...expectedPages.keys()].sort(),
  );
  assert.equal(
    new Set(ledger.atomic_outcomes.map((item) => item.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const [id, pages] of expectedPages) {
    const entry = mapped.find((item) => item.id === id);
    const [conceptId, skillId] = id.split(":");
    const guideSkillId =
      skillId === "source-skill-1" ? "green-hypotheses" : skillId;
    assert.equal(entry.concept_id, conceptId);
    assert.equal(entry.core_source.id, sourceId);
    assert.equal(entry.core_source.sha256, sourceSha);
    assert.deepEqual(entry.core_source.page_validation.pages, pages);
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.match(entry.core_source.page_validation.method, /SHA-256/u);
    assert.match(
      entry.core_source.page_validation.method,
      /rendered and visually checked/u,
    );
    assert.ok(entry.core_source.page_validation.claim_observed);
    assert.ok(pages.includes(entry.core_source.physical_page));
    const section = sectionSpecs.find((spec) => spec.ids.includes(id));
    assert.equal(entry.source_section_id, section.id);
    assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
    assert.deepEqual(Object.keys(entry.evidence), states);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(entry.evidence[state].length, 1, id + " " + state);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
    assert.match(entry.gap, /not rendered and checked|not verified/u);
    assert.match(entry.gap, /learner performance is unverified/u);

    const lesson = guides[conceptId];
    const blocks = [
      ...(lesson.contentBlocks ?? []),
      ...(lesson.supplementalBlocks ?? []),
    ];
    const namedLocator = entry.evidence.named[0].locator;
    const match = namedLocator.match(
      /learning-guides\.json#([^.]+)\.contentBlocks\[([^\]]+)\]\.title$/u,
    );
    assert.ok(match, id + " named locator");
    const [, namedConcept, namedId] = match;
    assert.equal(namedConcept, conceptId);
    assert.ok(
      blocks.some(
        (block) =>
          block.id === namedId && block.kind === "strategy" && block.title,
      ),
      id + " named block",
    );
    assert.ok(
      blocks.some(
        (block) =>
          entry.evidence.stated[0].locator.endsWith("[" + block.id + "]") &&
          block.kind === "strategy",
      ),
      id + " stated block",
    );
    assert.ok(
      blocks.some(
        (block) =>
          entry.evidence.worked[0].locator.endsWith("[" + block.id + "]") &&
          block.kind === "worked-example" &&
          block.steps.length >= 2,
      ),
      id + " worked block",
    );
    const exercise = lesson.exercises.find((item) =>
      entry.evidence.practiced[0].locator.endsWith("[" + item.id + "]"),
    );
    assert.ok(
      exercise?.prompt &&
        exercise.hint &&
        exercise.solution &&
        exercise.solutionTex,
      id + " changed-data practice",
    );
    assert.ok(exercise.rubric.length >= 2, id + " rubric");
    assert.ok(
      concepts
        .find((concept) => concept.id === conceptId)
        .sources.some(
          (ref) =>
            ref.sourceId === sourceId &&
            ref.pages[0] <= entry.core_source.physical_page &&
            ref.pages[1] >= entry.core_source.physical_page,
        ),
      id + " concept source page",
    );
    assert.ok(
      entry.evidence.named[0].locator.includes(`lecture09-${guideSkillId}`),
    );
  }
  assert.equal(Object.values(newBlocks).flat().length, 58);
  assert.equal(Object.values(newExercises).flat().length, 29);
});

test("source examples, Green signs, and domain hypotheses agree with calculations", () => {
  // Page 12: r(t)=(t,2+2t); the sine term spans a full period.
  const sineTerm =
    2 * ((-Math.cos(4 * Math.PI) + Math.cos(2 * Math.PI)) / (2 * Math.PI));
  const sourceSegmentIntegral = 2 / 3 + 1 / 2 + sineTerm;
  assert.ok(Math.abs(sourceSegmentIntegral - 7 / 6) < 1e-12);

  // Page 16: integrate 2x ds on y=x^2, then on the vertical unit segment.
  const p16 = (5 * Math.sqrt(5) - 1) / 6 + 2;
  assert.ok(Math.abs(p16 - (5 * Math.sqrt(5) + 11) / 6) < 1e-12);

  // Page 27: source path orientation is t=1 down to t=-2.
  const p27 = -((-2) ** 3 / 3 + -2) - (-(1 / 3) - 1);
  assert.ok(Math.abs(p27 - 6) < 1e-12);

  // Page 29: source cubic and segment contribute +3/2 and -3/2.
  const cubicWork = 1 + 1 / 2;
  const segmentWork = -2 + 1 / 2;
  assert.equal(cubicWork + segmentWork, 0);

  // Page 38 erratum: the planar cross partial is Q_x, not Q_y.
  const P = (x, y) => 3 * x ** 2 * y;
  const Q = (x, y) => x ** 3 + 2 * y;
  const h = 1e-5;
  const py = (P(1, h) - P(1, -h)) / (2 * h);
  const qx = (Q(1 + h, 0) - Q(1 - h, 0)) / (2 * h);
  assert.ok(Math.abs(py - 3) < 1e-8);
  assert.ok(Math.abs(qx - 3) < 1e-8);

  // Page 45: source curl density y over x>=0, y>=0, x+y<=1.
  const triangleCurlIntegral = (1 / 2) * ((1 - 0) ** 3 / 3);
  assert.ok(Math.abs(triangleCurlIntegral - 1 / 6) < 1e-12);

  // Page 47: curl 7-3=4 over the radius-three disk.
  const p = (x, y) => 3 * y - Math.exp(Math.sin(x));
  const q = (x, y) => 7 * x + Math.sqrt(1 + y ** 4);
  assert.ok(Math.abs((q(1 + h, 0) - q(1 - h, 0)) / (2 * h) - 7) < 1e-8);
  assert.ok(Math.abs((p(0, h) - p(0, -h)) / (2 * h) - 3) < 1e-8);
  assert.ok(Math.abs(4 * Math.PI * 9 - 36 * Math.PI) < 1e-12);
  // Positive orientation gives +area; reversal gives negative signed area.
  assert.equal(4 * Math.PI * 9, 36 * Math.PI);
  assert.equal(-4 * Math.PI * 9, -36 * Math.PI);

  // Page 44 hole orientation: outer CCW plus inner CW yields annulus area.
  assert.equal(Math.PI * 9 - Math.PI, Math.PI * 8);

  // Page 52: ellipse boundary determinant is ab, hence area pi*a*b.
  for (const [a, b] of [
    [3, 2],
    [4, 1.5],
  ]) {
    assert.ok(Math.abs((a * b * 2 * Math.PI) / 2 - Math.PI * a * b) < 1e-12);
  }

  const sourceWork = guides["work-and-circulation"].contentBlocks.find(
    (block) => block.id === "lecture09-source-plane-work-worked",
  );
  assert.equal(sourceWork.steps[1].equation, "\\int_1^{-2}-(t^2+1)\\,dt=6");
  const typoCorrection = sources[sourceId].errata.find(
    (item) => item.page === 38,
  );
  assert.match(typoCorrection.correction, /Q_x/u);
  assert.doesNotMatch(typoCorrection.correction, /Q_y/u);
});

const renderedKeys = new Set([
  "equation",
  "solutionTex",
  "title",
  "text",
  "strategy",
  "setup",
  "label",
  "result",
  "verification",
  "outcome",
  "prompt",
  "hint",
  "solution",
  "rubric",
]);
function* strings(value, path, key = "") {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries())
      yield* strings(item, path + "[" + index + "]", key);
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value))
      yield* strings(child, path + "." + childKey, childKey);
    return;
  }
  if (typeof value === "string" && renderedKeys.has(key))
    yield [path, key, value];
}
function* allStrings(value, path) {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries())
      yield* allStrings(item, path + "[" + index + "]");
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value))
      yield* allStrings(child, path + "." + key);
    return;
  }
  if (typeof value === "string") yield [path, value];
}

test("Lecture 09 guide strings use complete TeX and compile to strict MathML", () => {
  const formulas = [];
  for (const conceptId of guideIds) {
    const guide = guides[conceptId];
    const lesson = {
      contentBlocks: (guide.contentBlocks ?? []).filter((block) =>
        block.id.startsWith("lecture09-"),
      ),
      exercises: (guide.exercises ?? []).filter((item) =>
        item.id.startsWith("lecture09-"),
      ),
    };
    for (const [path, key, value] of strings(lesson, conceptId)) {
      if (key === "equation" || key === "solutionTex") {
        formulas.push({ path, source: value });
        continue;
      }
      assert.doesNotMatch(value, /\$\$|\$\s+\$|\$ -|- \$|\$ \+|\+ \$/u, path);
      assert.equal((value.match(/\$/gu) ?? []).length % 2, 0, path);
      const prose = value.replace(/\$([^$]+)\$/gu, (_match, source) => {
        formulas.push({ path, source });
        return "";
      });
      assert.doesNotMatch(
        prose,
        /[=<>≤≥±∞∈↦√^|]|[′″]|\b(?:f|g|h|p|q|r|s|u)\s*'{1,2}\s*(?:\(|=)|\b\d+\s*\/\s*[a-zA-Z]/u,
        path + " has unmarked mathematical notation",
      );
    }
  }
  assert.ok(
    formulas.length > 160,
    "collected " + formulas.length + " formulas",
  );
  for (const { path, source } of formulas) {
    assert.ok(source.trim(), path);
    let markup;
    assert.doesNotThrow(() => {
      markup = katex.renderToString(source, {
        throwOnError: true,
        strict: "error",
        output: "htmlAndMathml",
      });
    }, path);
    assert.match(markup, /<math\b/u, path);
    assert.doesNotMatch(markup, /katex-error/u, path);
  }
});

test("Lecture 09 JSON strings preserve TeX commands without decoded controls", () => {
  const exercises = new Map(
    Object.values(newExercises)
      .flat()
      .map((item) => [item.id, item]),
  );
  const records = [
    ...Object.values(newBlocks).flat(),
    ...Object.values(newExercises).flat(),
  ];
  for (const record of records)
    for (const [path, value] of allStrings(record, record.id))
      assert.doesNotMatch(value, /[\u0000-\u001f\u007f]/u, path);

  const expectedTex = new Map([
    [
      "lecture09-unequal-cross-partials-test-transfer",
      String.raw`P_y=3\ne5=Q_x`,
    ],
    [
      "lecture09-space-zero-curl-domain-criterion-transfer",
      String.raw`\nabla\times\mathbf G=\mathbf0,\quad\mathbb R^3\text{ simply connected}`,
    ],
    [
      "lecture09-source-plane-potential-transfer",
      String.raw`\phi=4xy+y^2,\quad\nabla\phi=(4y,4x+2y)`,
    ],
    [
      "lecture09-positive-orientation-transfer",
      String.raw`\mathbf r\prime(0)=(0,-1),\quad\text{negative orientation}`,
    ],
    [
      "lecture09-jordan-simple-boundary-transfer",
      String.raw`\text{simple image; traversal multiplicity }2`,
    ],
  ]);
  for (const [id, tex] of expectedTex)
    assert.equal(exercises.get(id)?.solutionTex, tex, id);
});

const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("WebMCP read_concept exposes Lecture 09 blocks and MathML", async () => {
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
  for (const conceptId of guideIds) {
    const lesson = readConcept.execute({ conceptId }).lesson;
    for (const block of newBlocks[conceptId]) {
      assert.ok(
        [
          ...(lesson.contentBlocks ?? []),
          ...(lesson.supplementalBlocks ?? []),
        ].some((item) => item.id === block.id),
        conceptId + " WebMCP block " + block.id,
      );
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      if (
        JSON.stringify(block).includes("$") ||
        block.kind === "worked-example"
      )
        assert.match(markup, /<math\b/u, block.id);
      assert.doesNotMatch(markup, /katex-error/u, block.id);
    }
    for (const exercise of newExercises[conceptId]) {
      assert.ok(
        lesson.exercises.some((item) => item.id === exercise.id),
        conceptId + " WebMCP exercise " + exercise.id,
      );
      const prose =
        exercise.prompt + " " + exercise.hint + " " + exercise.solution;
      const textMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      if (prose.includes("$"))
        assert.match(textMarkup, /<math\b/u, exercise.id + " prose MathML");
      assert.doesNotMatch(textMarkup, /katex-error/u, exercise.id);
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(formulaMarkup, /<math\b/u, exercise.id + " solution MathML");
      assert.doesNotMatch(formulaMarkup, /katex-error/u, exercise.id);
    }
  }
});
