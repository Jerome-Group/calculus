import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { derivative, evaluate } from "mathjs";
import {
  inspectNotation,
  inspectTexSemantics,
} from "./helpers/math-notation.mjs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const manifest = read("../lib/curriculum/source-manifest.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceId = "MH2100_Lecture_12_Final_Exam_Review";
const sourceSha =
  "ce83ad7e22cc6674292ed4b2875d60dbbc10397f7144cc0b1a407c3020295e07";
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
    id: sourceId + ":01",
    span: "1–12",
    concepts: ["review-integral-methods"],
    outcomeIds: [
      "review-integral-methods:lecture12-stokes-cone-cylinder-flux",
      "review-integral-methods:lecture12-stokes-triangle-circulation",
      "review-integral-methods:lecture12-green-clockwise-triangle",
      "review-integral-methods:lecture12-potential-reversed-parameter",
    ],
    exclusions: [2, 3, 5, 6, 8, 9, 11, 12],
  },
  {
    id: sourceId + ":02",
    span: "13–15",
    concepts: ["review-change-of-variables"],
    outcomeIds: ["review-change-of-variables:lecture12-curvilinear-area"],
    exclusions: [14, 15],
  },
  {
    id: sourceId + ":03",
    span: "16–18",
    concepts: ["review-lagrange-box"],
    outcomeIds: ["review-lagrange-box:lecture12-ellipsoid-box"],
    exclusions: [17, 18],
  },
  {
    id: sourceId + ":04",
    span: "19–21",
    concepts: ["review-critical-points"],
    outcomeIds: ["review-critical-points:lecture12-six-stationary-points"],
    exclusions: [20, 21],
  },
  {
    id: sourceId + ":05",
    span: "22–27",
    concepts: ["review-total-differentiability"],
    outcomeIds: [
      "review-total-differentiability:lecture12-origin-positive-remainder",
      "review-total-differentiability:lecture12-origin-negative-remainder",
    ],
    exclusions: [23, 24, 26, 27],
  },
];
const expected = new Map([
  [
    "review-integral-methods:lecture12-stokes-cone-cylinder-flux",
    {
      page: 1,
      section: "MH2100_Lecture_12_Final_Exam_Review:01",
      stated: "Work the cone–cylinder curl flux",
      worked: "Work the cone–cylinder curl flux",
      practice: "lecture12-stokes-cone-cylinder-transfer",
    },
  ],
  [
    "review-integral-methods:lecture12-stokes-triangle-circulation",
    {
      page: 4,
      section: "MH2100_Lecture_12_Final_Exam_Review:01",
      stated: "Work the Stokes triangle circulation",
      worked: "Work the Stokes triangle circulation",
      practice: "lecture12-stokes-triangle-transfer",
    },
  ],
  [
    "review-integral-methods:lecture12-green-clockwise-triangle",
    {
      page: 7,
      section: "MH2100_Lecture_12_Final_Exam_Review:01",
      stated: "Original Green task: cancellation before integration",
      worked: "Original Green task: cancellation before integration",
      practice: "lecture12-green-clockwise-transfer",
    },
  ],
  [
    "review-integral-methods:lecture12-potential-reversed-parameter",
    {
      page: 10,
      section: "MH2100_Lecture_12_Final_Exam_Review:01",
      stated: "Original potential task: endpoints and reversed orientation",
      worked: "Original potential task: endpoints and reversed orientation",
      practice: "lecture12-potential-reversed-parameter-transfer",
    },
  ],
  [
    "review-change-of-variables:lecture12-curvilinear-area",
    {
      page: 13,
      section: "MH2100_Lecture_12_Final_Exam_Review:02",
      stated: "Map every boundary",
      worked: "Check sign, scale, and bounds",
      practice: "lecture12-curvilinear-area-transfer",
    },
  ],
  [
    "review-lagrange-box:lecture12-ellipsoid-box",
    {
      page: 16,
      section: "MH2100_Lecture_12_Final_Exam_Review:03",
      stated: "Why the box is centered",
      worked: "Apply the requested Lagrange multipliers",
      practice: "exercise",
    },
  ],
  [
    "review-critical-points:lecture12-six-stationary-points",
    {
      page: 19,
      section: "MH2100_Lecture_12_Final_Exam_Review:04",
      stated: "Enumerate rather than sample",
      worked: "Keep all values and types",
      practice: "lecture12-six-stationary-transfer",
    },
  ],
  [
    "review-total-differentiability:lecture12-origin-positive-remainder",
    {
      page: 22,
      section: "MH2100_Lecture_12_Final_Exam_Review:05",
      stated: "A successful all-direction estimate",
      worked: "A successful all-direction estimate",
      practice: "new-uniform-bound-transfer",
    },
  ],
  [
    "review-total-differentiability:lecture12-origin-negative-remainder",
    {
      page: 25,
      section: "MH2100_Lecture_12_Final_Exam_Review:05",
      stated: "A continuous failure",
      worked: "A continuous failure",
      practice: "lecture12-failed-remainder-transfer",
    },
  ],
]);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());
const midpointIntegral = (fn, a, b, n = 20000) => {
  const width = (b - a) / n;
  return Array.from({ length: n }, (_, i) => fn(a + (i + 0.5) * width)).reduce(
    (sum, value) => sum + value * width,
    0,
  );
};
const simpsonIntegral = (fn, a, b, n = 20000) => {
  assert.equal(n % 2, 0, "Simpson interval count must be even");
  const width = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * fn(a + i * width);
  return (sum * width) / 3;
};

test("canonical PDF identity, every physical page, exclusions, and stable review routes", () => {
  assert.equal(
    sources[sourceId].file,
    "MH2100_Lecture_12_Final_Exam_Review.pdf",
  );
  assert.equal(sources[sourceId].pages, 27);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.deepEqual(sources[sourceId].errata ?? [], []);
  const source = manifest.find((entry) => entry.sourceId === sourceId);
  assert.equal(source.status, "canonical");
  assert.equal(source.sha256, sourceSha);
  assert.equal(source.driveFileId, "10zC5vlK8Muh2OE8LEkAprYheJvQW-efX");
  assert.equal(concepts.length, 125);
  assert.equal(new Set(concepts.map((item) => item.id)).size, concepts.length);

  const allPromptPages = [1, 4, 7, 10, 13, 16, 19, 22, 25];
  const allExcludedPages = [];
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
    assert.deepEqual(section.atomic_outcome_ids, spec.outcomeIds);
    assert.deepEqual(
      section.inspected_physical_pages,
      spec.span
        .split("–")
        .map(Number)
        .reduce((pages, start, index, bounds) => {
          if (index === 0) {
            for (let page = start; page <= bounds[1]; page++) pages.push(page);
          }
          return pages;
        }, []),
    );
    assert.deepEqual(
      section.reviewed_exclusions.map((item) => item.physical_page),
      spec.exclusions,
    );
    allExcludedPages.push(...spec.exclusions);
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, spec.id + " " + state);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
    assert.match(section.source_review_notes.join(" "), /rendered/iu);
    assert.match(section.source_review_notes.join(" "), /blank/iu);
    assert.match(section.source_review_notes.join(" "), /erratum/iu);
    assert.match(section.gap, /learner performance/iu);
  }
  assert.deepEqual(
    [...allPromptPages, ...allExcludedPages].sort((a, b) => a - b),
    Array.from({ length: 27 }, (_, index) => index + 1),
  );
  assert.deepEqual(
    [...expected.keys()].sort(),
    sectionSpecs.flatMap((spec) => spec.outcomeIds).sort(),
  );
});

test("nine page-verified outcomes map the source prompts without fixing global counts", () => {
  const outcomes = ledger.atomic_outcomes.filter(
    (entry) => entry.core_source.id === sourceId,
  );
  assert.equal(outcomes.length, expected.size);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((entry) => entry.id)).size,
    ledger.atomic_outcomes.length,
  );
  assert.deepEqual(
    outcomes.map((entry) => entry.id).sort(),
    [...expected.keys()].sort(),
  );
  for (const [id, spec] of expected) {
    const entry = outcomes.find((candidate) => candidate.id === id);
    const conceptId = id.split(":")[0];
    const guide = guides[conceptId];
    assert.equal(entry.concept_id, conceptId);
    assert.equal(entry.source_section_id, spec.section);
    assert.equal(entry.core_source.sha256, sourceSha);
    assert.equal(entry.core_source.physical_page, spec.page);
    assert.deepEqual(entry.core_source.page_validation.pages, [
      spec.page,
      spec.page + 1,
      spec.page + 2,
    ]);
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.match(entry.core_source.page_validation.method, /SHA-256/u);
    assert.match(
      entry.core_source.page_validation.method,
      /visually inspected/u,
    );
    assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
    assert.equal(entry.depth, "source_page_and_cited_guide_inspected");
    assert.deepEqual(Object.keys(entry.evidence), states);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(entry.evidence[state].length, 1, id + " " + state);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
    assert.match(entry.gap, /no source-written solution/u);
    assert.match(entry.gap, /learner-performance/u);
    assert.equal(
      entry.evidence.named[0].locator,
      "lib/curriculum/concepts.json#" + conceptId + ".title",
    );
    assert.equal(
      entry.evidence.stated[0].locator,
      "lib/curriculum/learning-guides.json#" +
        conceptId +
        ".sections[" +
        spec.stated +
        "]",
    );
    assert.equal(
      entry.evidence.worked[0].locator,
      "lib/curriculum/learning-guides.json#" +
        conceptId +
        ".sections[" +
        spec.worked +
        "]",
    );
    const practiceLocator = entry.evidence.practiced[0].locator;
    if (spec.practice === "exercise")
      assert.equal(
        practiceLocator,
        "lib/curriculum/learning-guides.json#" + conceptId + ".exercise",
      );
    else {
      assert.equal(
        practiceLocator,
        "lib/curriculum/learning-guides.json#" +
          conceptId +
          ".exercises[" +
          spec.practice +
          "]",
      );
      assert.ok(
        guide.exercises.some((exercise) => exercise.id === spec.practice),
        id + " transfer task",
      );
    }
    assert.ok(guide.sections.some((section) => section.title === spec.stated));
    assert.ok(guide.sections.some((section) => section.title === spec.worked));
  }
});

test("source and transfer calculations agree with the prompts and changed data", () => {
  const close = (actual, expectedValue, label) =>
    assert.ok(
      Math.abs(actual - expectedValue) < 1e-11,
      label + ": " + actual + " != " + expectedValue,
    );
  close(
    midpointIntegral(
      (t) => Math.sin(t) ** 2 + Math.cos(t) ** 2,
      0,
      2 * Math.PI,
    ),
    2 * Math.PI,
    "cone–cylinder source flux",
  );
  const p = "y*cos(x)-x*y*sin(x)";
  const q = "x*y+x*cos(x)";
  for (const [x, y] of [
    [0, 1],
    [0.7, 4],
    [2, 3],
  ]) {
    const curl =
      derivative(q, "x").evaluate({ x, y }) -
      derivative(p, "y").evaluate({ x, y });
    close(curl, y, "original Green cross-derivative cancellation");
  }
  const stokesP = "x+y^2";
  const stokesQ = "y+z^2";
  const stokesR = "z+x^2";
  for (const [x, y, z] of [
    [0.4, 0.6, 2],
    [1, 1, 1],
    [2.2, 0.3, 0.5],
  ]) {
    const normalCurl =
      derivative(stokesR, "y").evaluate({ x, y, z }) -
      derivative(stokesQ, "z").evaluate({ x, y, z }) +
      derivative(stokesP, "z").evaluate({ x, y, z }) -
      derivative(stokesR, "x").evaluate({ x, y, z }) +
      derivative(stokesQ, "x").evaluate({ x, y, z }) -
      derivative(stokesP, "y").evaluate({ x, y, z });
    close(normalCurl, -6, "source Stokes curl against upward vector area");
  }
  close(
    simpsonIntegral((x) => -6 * (3 - x), 0, 3),
    -27,
    "Stokes source triangle",
  );
  close(
    simpsonIntegral((x) => -((12 - 4 * x) ** 2) / 2, 0, 3),
    -72,
    "clockwise Green source triangle",
  );
  const sourceP = "2*x*y+exp(-x^2)";
  const sourceQ = "x^2+y*cos(pi*y^2/2)";
  const potentialY = derivative("x^2*y+sin(pi*y^2/2)/pi", "y");
  for (const [x, y] of [
    [0, 0],
    [0.4, 0.7],
    [2, 1],
  ])
    close(
      potentialY.evaluate({ x, y }),
      evaluate("x^2+y*cos(pi*y^2/2)", { x, y }),
      "source potential y-derivative",
    );
  for (const [x, y] of [
    [0, 0],
    [0.4, 0.7],
    [2, 1],
  ])
    close(
      derivative(sourceP, "y").evaluate({ x, y }) -
        derivative(sourceQ, "x").evaluate({ x, y }),
      0,
      "source potential curl condition",
    );
  const endpointPotentialAtX0 = (y) =>
    Math.sin((Math.PI * y ** 2) / 2) / Math.PI;
  close(
    endpointPotentialAtX0(0) - endpointPotentialAtX0(1),
    -1 / Math.PI,
    "reversed potential source endpoints",
  );
  close(
    simpsonIntegral((u) => 2 / (4 * u), 1, 2),
    Math.log(2) / 2,
    "curvilinear source area",
  );
  const halfLengths = [4 * Math.sqrt(3), 2 / Math.sqrt(3), 4 / Math.sqrt(3)];
  close(
    2 * halfLengths[0] ** 2 +
      72 * halfLengths[1] ** 2 +
      18 * halfLengths[2] ** 2,
    288,
    "ellipsoid constraint",
  );
  close(halfLengths[0], 6 * halfLengths[1], "Lagrange x-to-y ratio");
  close(halfLengths[0], 3 * halfLengths[2], "Lagrange x-to-z ratio");
  close(
    8 * halfLengths[0] * halfLengths[1] * halfLengths[2],
    256 / Math.sqrt(3),
    "maximum box volume",
  );
  const sourcePoints = [-1, 0, 1].flatMap((x) => [-1, 1].map((y) => [x, y]));
  const sourceFunction = (x, y) => x ** 4 - 2 * x ** 2 + y ** 3 - 3 * y;
  const classify = (xx, yy) =>
    xx > 0 && yy > 0 ? "minimum" : xx < 0 && yy < 0 ? "maximum" : "saddle";
  const sourceClassifications = sourcePoints.map(([x, y]) => ({
    point: [x, y],
    value: sourceFunction(x, y),
    kind: classify(12 * x ** 2 - 4, 6 * y),
  }));
  for (const {
    point: [x, y],
  } of sourceClassifications) {
    close(4 * x * (x ** 2 - 1), 0, "source x-stationarity");
    close(3 * (y ** 2 - 1), 0, "source y-stationarity");
  }
  assert.deepEqual(sourceClassifications, [
    { point: [-1, -1], value: 1, kind: "saddle" },
    { point: [-1, 1], value: -3, kind: "minimum" },
    { point: [0, -1], value: 2, kind: "maximum" },
    { point: [0, 1], value: -2, kind: "saddle" },
    { point: [1, -1], value: 1, kind: "saddle" },
    { point: [1, 1], value: -3, kind: "minimum" },
  ]);
  const sourceFailure = (x, y) => (x ** 3 - x * y ** 2) / (x ** 2 + y ** 2);
  const t = 0.25;
  close(
    Math.abs(sourceFailure(t, t) - t) / Math.hypot(t, t),
    1 / Math.sqrt(2),
    "failed source diagonal remainder",
  );

  const integralGuide = guides["review-integral-methods"];
  assert.equal(integralGuide.exercises.length, 4);
  close(
    midpointIntegral(
      (t) => 2 * Math.sin(t) ** 2 + Math.cos(t) ** 2,
      0,
      2 * Math.PI,
    ),
    3 * Math.PI,
    "changed cone–cylinder transfer",
  );
  close(
    simpsonIntegral((x) => -4 * (2 - x), 0, 2),
    -8,
    "changed Stokes triangle transfer",
  );
  close(
    simpsonIntegral((x) => -((6 - 3 * x) ** 2) / 2, 0, 2),
    -12,
    "changed Green triangle transfer",
  );
  const transferPotential = (x, y) => x ** 2 * y + Math.sin(x) + y ** 2;
  for (const [x, y] of [
    [0, 0],
    [0.4, 0.7],
    [1, 1],
  ]) {
    close(
      derivative("x^2*y+sin(x)+y^2", "x").evaluate({ x, y }),
      2 * x * y + Math.cos(x),
      "changed potential x-derivative",
    );
    close(
      derivative("x^2*y+sin(x)+y^2", "y").evaluate({ x, y }),
      x ** 2 + 2 * y,
      "changed potential y-derivative",
    );
  }
  close(
    transferPotential(0, 0) - transferPotential(1, 1),
    -2 - Math.sin(1),
    "reversed changed-data potential",
  );
  close(
    simpsonIntegral((u) => 3 / (4 * u), 1, 4),
    1.5 * Math.log(2),
    "changed region transfer",
  );
  const changedPoints = [0, -Math.sqrt(2), Math.sqrt(2)].flatMap((x) =>
    [-Math.sqrt(2), Math.sqrt(2)].map((y) => ({ x, y })),
  );
  const changedFunction = (x, y) => x ** 4 - 4 * x ** 2 + y ** 3 - 6 * y;
  const changedClassifications = changedPoints.map(({ x, y }) => ({
    point: [x, y],
    value: changedFunction(x, y),
    kind: classify(12 * x ** 2 - 8, 6 * y),
  }));
  for (const {
    point: [x, y],
  } of changedClassifications) {
    close(4 * x * (x ** 2 - 2), 0, "changed x-stationarity");
    close(3 * (y ** 2 - 2), 0, "changed y-stationarity");
  }
  const sqrt2 = Math.sqrt(2);
  const expectedChangedPoints = [
    { point: [0, -sqrt2], value: 4 * sqrt2, kind: "maximum" },
    { point: [0, sqrt2], value: -4 * sqrt2, kind: "saddle" },
    { point: [-sqrt2, -sqrt2], value: -4 + 4 * sqrt2, kind: "saddle" },
    { point: [-sqrt2, sqrt2], value: -4 - 4 * sqrt2, kind: "minimum" },
    { point: [sqrt2, -sqrt2], value: -4 + 4 * sqrt2, kind: "saddle" },
    { point: [sqrt2, sqrt2], value: -4 - 4 * sqrt2, kind: "minimum" },
  ];
  assert.deepEqual(
    changedClassifications.map(({ point, kind }) => ({ point, kind })),
    expectedChangedPoints.map(({ point, kind }) => ({ point, kind })),
  );
  for (const [index, actual] of changedClassifications.entries())
    close(
      actual.value,
      expectedChangedPoints[index].value,
      "changed critical value",
    );
  const changedFailure = (x, y) =>
    (2 * x ** 3 - x * y ** 2) / (x ** 2 + y ** 2);
  close(
    Math.abs(changedFailure(0.25, 0.25) - 2 * 0.25) / Math.hypot(0.25, 0.25),
    3 / (2 * Math.sqrt(2)),
    "changed failure path",
  );

  const allExercises = [
    ...integralGuide.exercises,
    guides["review-change-of-variables"].exercises.find(
      (item) => item.id === "lecture12-curvilinear-area-transfer",
    ),
    guides["review-critical-points"].exercises.find(
      (item) => item.id === "lecture12-six-stationary-transfer",
    ),
    guides["review-total-differentiability"].exercises.find(
      (item) => item.id === "lecture12-failed-remainder-transfer",
    ),
  ];
  assert.equal(allExercises.filter(Boolean).length, 7);
  for (const exercise of allExercises) {
    assert.ok(exercise.prompt && exercise.hint && exercise.solution);
    assert.ok(exercise.solutionTex);
    assert.ok(exercise.rubric.length >= 2);
  }
});

test("WebMCP preserves all five review routes and exposes the same MathML-ready practice", async () => {
  const { Formula, MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
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
  const conceptIds = [
    ...new Set([...expected.keys()].map((id) => id.split(":")[0])),
  ];
  for (const conceptId of conceptIds) {
    const catalogEntry = concepts.find((item) => item.id === conceptId);
    assert.ok(catalogEntry);
    const response = readConcept.execute({ conceptId });
    assert.equal(response.id, conceptId);
    assert.deepEqual(response.lesson, guides[conceptId]);
    assert.ok(
      response.sources.some((entry) => entry.sourceId === sourceId),
      conceptId + " source reference",
    );
    for (const spec of [...expected.entries()]
      .filter(([id]) => id.startsWith(conceptId + ":"))
      .map(([, value]) => value)) {
      assert.ok(
        response.lesson.sections.some(
          (section) => section.title === spec.worked,
        ),
        conceptId + " worked section",
      );
      const exercise =
        spec.practice === "exercise"
          ? response.lesson.exercise
          : response.lesson.exercises.find((item) => item.id === spec.practice);
      assert.ok(exercise && exercise.prompt && exercise.solution);
    }

    const prose = [
      catalogEntry.definition,
      catalogEntry.conditions,
      catalogEntry.proof,
      catalogEntry.example,
      catalogEntry.pitfall,
      ...response.lesson.sections.flatMap((section) => [
        section.title,
        section.text,
      ]),
      response.lesson.exercise.prompt,
      response.lesson.exercise.hint,
      response.lesson.exercise.solution,
      ...(response.lesson.exercises ?? []).flatMap((exercise) => [
        exercise.prompt,
        exercise.hint,
        exercise.solution,
      ]),
    ];
    for (const [index, text] of prose.entries()) {
      const failures = [];
      inspectNotation(
        text,
        conceptId + ".visibleText[" + index + "]",
        failures,
      );
      assert.deepEqual(failures, [], conceptId + " notation");
      const markup = renderToStaticMarkup(
        React.createElement(MathText, { text }),
      );
      if (text.includes("$")) assert.match(markup, /<math\b/u);
      assert.doesNotMatch(markup, /katex-error/u);
    }
    const formulaFailures = [];
    inspectTexSemantics(
      catalogEntry.formula,
      conceptId + ".formula",
      formulaFailures,
    );
    assert.deepEqual(formulaFailures, [], conceptId + " formula");
    const formulaMarkup = renderToStaticMarkup(
      React.createElement(Formula, { block: true }, catalogEntry.formula),
    );
    assert.match(formulaMarkup, /<math\b/u, conceptId + " formula MathML");
    assert.doesNotMatch(formulaMarkup, /katex-error/u);
    for (const exercise of [
      response.lesson.exercise,
      ...(response.lesson.exercises ?? []),
    ]) {
      const failures = [];
      inspectTexSemantics(
        exercise.solutionTex,
        conceptId + "." + exercise.id + ".solutionTex",
        failures,
      );
      assert.deepEqual(failures, [], conceptId + " solution TeX");
      const mathMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      if (exercise.solutionTex) assert.match(mathMarkup, /<math\b/u);
      assert.doesNotMatch(mathMarkup, /katex-error/u);
    }
  }
});
