import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/outcome-ledger.json", import.meta.url),
  ),
);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

const outcomes = [
  [
    "cross-products-and-planes:component-calculation",
    "MH2100_Lecture_03:01",
    8,
    [8],
  ],
  [
    "cross-products-and-planes:geometric-area-normal",
    "MH2100_Lecture_03:01",
    9,
    [9],
  ],
  [
    "cross-products-and-planes:algebraic-properties-and-nonassociativity",
    "MH2100_Lecture_03:01",
    10,
    [10],
  ],
  [
    "cross-products-and-planes:point-normal-plane",
    "MH2100_Lecture_03:02",
    11,
    [11],
  ],
  [
    "cross-products-and-planes:two-direction-plane",
    "MH2100_Lecture_03:02",
    12,
    [12],
  ],
  [
    "cross-products-and-planes:graph-tangent-plane-construction",
    "MH2100_Lecture_03:02",
    13,
    [13],
  ],
  [
    "cross-products-and-planes:source-quadratic-plane-example",
    "MH2100_Lecture_03:02",
    15,
    [15],
  ],
  [
    "certifying-differentiability-and-errors:linear-approximation-error-theorem",
    "MH2100_Lecture_03:04",
    25,
    [25],
  ],
  [
    "certifying-differentiability-and-errors:cone-first-order-error-estimate",
    "MH2100_Lecture_03:04",
    26,
    [26],
  ],
];

test("Lecture 03 outcomes point to reviewed physical pages with separate evidence states", () => {
  for (const [id, sectionId, page, pages] of outcomes) {
    const outcome = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.ok(outcome, id);
    assert.equal(outcome.source_section_id, sectionId);
    assert.equal(outcome.core_source.id, "MH2100_Lecture_03");
    assert.equal(outcome.core_source.physical_page, page);
    assert.deepEqual(outcome.core_source.page_validation.pages, pages);
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    assert.match(outcome.core_source.page_validation.method, /SHA-256 matched/);
    assert.match(
      outcome.core_source.page_validation.method,
      /visually checked/,
    );
    assert.equal(outcome.evidence.named.length, 1);
    assert.equal(outcome.evidence.stated.length, 1);
    assert.equal(outcome.evidence.worked.length, 1);
    assert.equal(outcome.evidence.practiced.length, 1);
    assert.deepEqual(outcome.evidence.visualized, []);
    assert.deepEqual(outcome.evidence.checked, []);
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
  }

  const planeSection = ledger.source_sections.find(
    (section) => section.id === "MH2100_Lecture_03:02",
  );
  assert.match(
    planeSection.gap,
    /Page 14 repeats the candidate-plane function/,
  );
  assert.match(planeSection.gap, /duplicates the supplement outcome .*\(#66\)/);
  const crossSection = ledger.source_sections.find(
    (section) => section.id === "MH2100_Lecture_03:01",
  );
  assert.match(crossSection.gap, /scalar-product recap.*prerequisite review/);
  assert.deepEqual(
    planeSection.atomic_outcome_ids,
    outcomes
      .filter(([, sectionId]) => sectionId === "MH2100_Lecture_03:02")
      .map(([id]) => id),
  );
});

test("cross products, plane equations, and error calculations agree with the lesson", async () => {
  const cross = ([a1, a2, a3], [b1, b2, b3]) => [
    a2 * b3 - a3 * b2,
    a3 * b1 - a1 * b3,
    a1 * b2 - a2 * b1,
  ];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const u = [1, 2, 0];
  const v = [3, -1, 4];
  const normal = cross(u, v);
  assert.deepEqual(normal, [8, -4, -7]);
  assert.equal(dot(u, normal), 0);
  assert.equal(dot(v, normal), 0);
  assert.deepEqual(
    cross(v, u),
    normal.map((value) => -value),
  );
  assert.deepEqual(cross([1, 0, 1], [0, 1, 1]), [-1, -1, 1]);

  const dependentPair = cross([1, 2, 0], [2, 4, 0]);
  assert.deepEqual(dependentPair, [0, 0, 0]);

  const lawU = [1, 0, 1];
  const lawV = [0, 1, 1];
  const lawW = [1, 1, 0];
  const lawProduct = cross(lawU, lawV);
  assert.deepEqual(lawProduct, [-1, -1, 1]);
  assert.deepEqual(
    cross(
      lawU.map((value) => -2 * value),
      lawV,
    ),
    lawProduct.map((value) => -2 * value),
  );
  assert.deepEqual(
    cross(lawV, lawU),
    lawProduct.map((value) => -value),
  );
  assert.deepEqual(
    cross(
      lawU,
      lawV.map((value, i) => value + lawW[i]),
    ),
    lawProduct.map((value, i) => value + cross(lawU, lawW)[i]),
  );

  const point0 = [2, -1, 3];
  const point = [0, 1, 2];
  const pointNormal = [2, 1, -2];
  assert.equal(
    dot(
      pointNormal,
      point.map((value, i) => value - point0[i]),
    ),
    0,
  );
  assert.equal(2 * 0 + 1 - 2 * 2 + 3, 0);

  const p0 = [1, 2, 0];
  const planeU = [1, 0, 1];
  const planeV = [0, 1, 1];
  const planeNormal = cross(planeU, planeV);
  assert.deepEqual(planeNormal, [-1, -1, 1]);
  assert.equal(dot(planeNormal, planeU), 0);
  assert.equal(dot(planeNormal, planeV), 0);
  assert.equal(p0[2] - p0[0] - p0[1] + 3, 0);
  assert.equal(planeU[2] - planeU[0] - planeU[1], 0);
  assert.equal(planeV[2] - planeV[0] - planeV[1], 0);

  const basis = {
    i: [1, 0, 0],
    j: [0, 1, 0],
    k: [0, 0, 1],
  };
  const iiCrossJ = cross(cross(basis.i, basis.i), basis.j);
  const iCrossIj = cross(basis.i, cross(basis.i, basis.j));
  assert.deepEqual(iiCrossJ, [0, 0, 0]);
  assert.deepEqual(iCrossIj, [0, -1, 0]);

  const cone = (r, h) => (Math.PI / 3) * r ** 2 * h;
  const coneCenter = cone(10, 25);
  const coneUpper = cone(10.1, 25.1) - coneCenter;
  const coneLower = coneCenter - cone(9.9, 24.9);
  const coneEstimate = (500 * Math.PI * 0.1) / 3 + (100 * Math.PI * 0.1) / 3;
  assert.ok(Math.abs(coneEstimate - 20 * Math.PI) < 1e-12);
  assert.ok(Math.abs(coneUpper - (60.451 * Math.PI) / 3) < 1e-12);
  assert.ok(Math.abs(coneLower - (59.551 * Math.PI) / 3) < 1e-12);
  assert.ok(coneUpper > 20 * Math.PI);
  assert.ok(coneUpper > coneLower);

  const volume = (x, y) => x ** 2 * y;
  const exactTransfer = volume(2.05, 3.1) - volume(2, 3);
  const linearTransfer = 12 * 0.05 + 4 * 0.1;
  assert.ok(Math.abs(linearTransfer - 1) < 1e-12);
  assert.ok(Math.abs(exactTransfer - 1.02775) < 1e-12);
  assert.ok(exactTransfer > linearTransfer);
});

test("MathML renders the page-backed theorem, work, and independent practice", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const cases = [
    [
      "cross-products-and-planes",
      [
        "cross-product-geometric-characterization",
        "point-normal-plane-theorem",
        "plane-from-two-directions-theorem",
        "graph-tangent-plane-from-slices",
      ],
      "graph-tangent-plane-source-example",
      "graph-plane-from-slices-transfer",
    ],
    [
      "certifying-differentiability-and-errors",
      ["linear-approximation-formula"],
      "cone-volume-sensitivity-example",
      "sensitivity-versus-exact-box",
    ],
  ];

  for (const [conceptId, theoremIds, workedId, exerciseId] of cases) {
    const guide = learningGuides[conceptId];
    const blocks = [...theoremIds, workedId].map((id) => {
      const block = guide.contentBlocks.find((item) => item.id === id);
      assert.ok(block, `${conceptId}:${id}`);
      return block;
    });
    const exercise = guide.exercises.find((item) => item.id === exerciseId);
    assert.ok(exercise, `${conceptId}:${exerciseId}`);
    const html = [
      ...blocks.map((block) =>
        renderToStaticMarkup(
          React.createElement(StructuredLessonBlockView, { block }),
        ),
      ),
      ...[exercise.prompt, exercise.hint, exercise.solution].map((text) =>
        renderToStaticMarkup(React.createElement(MathText, { text })),
      ),
    ].join("");
    assert.match(html, /<math\b/, conceptId);
    assert.doesNotMatch(html, /katex-error/, conceptId);
  }
});

test("cross-product zero and law contrasts render as MathML", async () => {
  const { learningGuides } = await vite.ssrLoadModule(
    "/lib/curriculum/learning.ts",
  );
  const { StructuredLessonBlockView } = await vite.ssrLoadModule(
    "/components/atlas/structured-lesson-block.tsx",
  );
  const { MathText } = await vite.ssrLoadModule(
    "/components/atlas/math-text.tsx",
  );
  const guide = learningGuides["cross-products-and-planes"];
  const blocks = [
    "cross-product-components",
    "cross-product-algebraic-properties",
  ].map((id) => {
    const block = guide.contentBlocks.find((item) => item.id === id);
    assert.ok(block, id);
    return block;
  });
  const exercises = [
    "cross-product-component-area-transfer",
    "cross-product-laws-transfer",
  ].map((id) => {
    const exercise = guide.exercises.find((item) => item.id === id);
    assert.ok(exercise, id);
    return exercise;
  });
  const html = [
    ...blocks.map((block) =>
      renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      ),
    ),
    ...exercises.flatMap((exercise) =>
      [exercise.prompt, exercise.hint, exercise.solution].map((text) =>
        renderToStaticMarkup(React.createElement(MathText, { text })),
      ),
    ),
  ].join("");
  assert.match(html, /<math\b/);
  assert.doesNotMatch(html, /katex-error/);
});

test("WebMCP exposes lesson blocks, practice, and exact source pages", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const readConcept = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );

  const cross = readConcept.execute({ conceptId: "cross-products-and-planes" });
  assert.ok(
    cross.lesson.contentBlocks.some(
      (block) => block.id === "graph-tangent-plane-from-slices",
    ),
  );
  for (const id of [
    "cross-product-components",
    "cross-product-algebraic-properties",
  ])
    assert.ok(
      cross.lesson.contentBlocks.some((block) => block.id === id),
      id,
    );
  for (const id of [
    "cross-product-component-area-transfer",
    "cross-product-laws-transfer",
  ])
    assert.ok(
      cross.lesson.exercises.some((exercise) => exercise.id === id),
      id,
    );
  assert.ok(
    cross.lesson.exercises.some(
      (exercise) => exercise.id === "plane-from-directions-transfer",
    ),
  );
  const graphTask = cross.lesson.exercises.find(
    (exercise) => exercise.id === "graph-plane-from-slices-transfer",
  );
  assert.doesNotMatch(graphTask.prompt, /linear approximation/);
  assert.match(
    cross.lesson.sections.find(
      (section) =>
        section.title === "Graph slices give a candidate tangent plane",
    ).text,
    /differentiability supplement/,
  );
  const crossPages = cross.sources
    .filter((source) => source.sourceId === "MH2100_Lecture_03")
    .flatMap((source) => source.pages);
  for (const page of [8, 9, 10, 11, 12, 13, 15])
    assert.ok(crossPages.includes(page), `cross product source page ${page}`);

  const error = readConcept.execute({
    conceptId: "certifying-differentiability-and-errors",
  });
  assert.ok(
    error.lesson.contentBlocks.some(
      (block) => block.id === "cone-volume-sensitivity-example",
    ),
  );
  assert.ok(
    error.lesson.exercises.some(
      (exercise) => exercise.id === "sensitivity-versus-exact-box",
    ),
  );
  const errorPages = error.sources
    .filter((source) => source.sourceId === "MH2100_Lecture_03")
    .flatMap((source) => source.pages);
  assert.ok(errorPages.includes(25));
  assert.ok(errorPages.includes(26));
});
