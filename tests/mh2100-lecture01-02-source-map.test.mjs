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
const root = fileURLToPath(new URL("..", import.meta.url));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const concepts = read("../lib/curriculum/concepts.json");
const sources = read("../lib/curriculum/sources.json");
const manifest = read("../lib/curriculum/source-manifest.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sourceIds = ["MH2100_Lecture_01", "MH2100_Lecture_02"];
const sourceMeta = {
  MH2100_Lecture_01: {
    sha256: "eca98d020c44d4d42fb9bcbb4c624da6c150e7e88ec5b4d48951e358fa84cb83",
    pages: 41,
    concepts: [
      "vectors-and-coordinates",
      "curves-and-parametrizations",
      "constructing-curves",
      "tangents-velocity-and-singularities",
      "surfaces-and-level-sets",
    ],
  },
  MH2100_Lecture_02: {
    sha256: "a35fceaafaabcfb672f816bcd0e553034bbbdd41cf6437b3df56af9268490097",
    pages: 49,
    concepts: [
      "distance-and-neighborhoods",
      "epsilon-delta-limits",
      "different-paths-different-limits",
      "curved-paths-hide-obstructions",
      "squeeze-and-continuity",
      "limits-at-infinity",
      "partial-derivatives-as-slices",
    ],
  },
};
const states = [
  "named",
  "stated",
  "worked",
  "practiced",
  "visualized",
  "checked",
];
const pageRange = (first, last) =>
  Array.from({ length: last - first + 1 }, (_, index) => first + index);
const sectionSpecs = [
  {
    id: "MH2100_Lecture_01:01",
    sourceId: sourceIds[0],
    span: "5–14 (content 6–14; page 5 is course context)",
    inspected: pageRange(5, 14),
    concepts: ["vectors-and-coordinates"],
    outcomes: [
      "vectors-and-coordinates:lecture01-cartesian-points",
      "vectors-and-coordinates:lecture01-position-displacement",
      "vectors-and-coordinates:lecture01-component-algebra",
      "vectors-and-coordinates:lecture01-dot-angle",
      "vectors-and-coordinates:lecture01-standard-basis",
    ],
    exclusions: [1, 2, 3, 4, 5],
  },
  {
    id: "MH2100_Lecture_01:02",
    sourceId: sourceIds[0],
    span: "15–25",
    inspected: pageRange(15, 25),
    concepts: ["curves-and-parametrizations", "constructing-curves"],
    outcomes: [
      "curves-and-parametrizations:lecture01-curve-image",
      "constructing-curves:lecture01-line-parametrization",
      "constructing-curves:lecture01-circle",
      "constructing-curves:lecture01-cycloid",
      "constructing-curves:lecture01-helix",
      "constructing-curves:lecture01-eliminate-parameter",
    ],
    exclusions: [],
  },
  {
    id: "MH2100_Lecture_01:03",
    sourceId: sourceIds[0],
    span: "26–33",
    inspected: pageRange(26, 33),
    concepts: ["tangents-velocity-and-singularities"],
    outcomes: [
      "tangents-velocity-and-singularities:lecture01-tangent-regularity",
      "tangents-velocity-and-singularities:lecture01-motion",
      "tangents-velocity-and-singularities:lecture01-parametric-tangent-line",
      "tangents-velocity-and-singularities:lecture01-cusp",
    ],
    exclusions: [],
  },
  {
    id: "MH2100_Lecture_01:04",
    sourceId: sourceIds[0],
    span: "34–40",
    inspected: pageRange(34, 40),
    concepts: ["surfaces-and-level-sets"],
    outcomes: [
      "surfaces-and-level-sets:two-variable-domain",
      "surfaces-and-level-sets:lecture01-graph-surface",
      "surfaces-and-level-sets:lecture01-level-set",
      "surfaces-and-level-sets:hemisphere-contours",
      "surfaces-and-level-sets:lecture01-contour-interval",
    ],
    exclusions: [41],
  },
  {
    id: "MH2100_Lecture_02:01",
    sourceId: sourceIds[1],
    span: "2–3",
    inspected: [2, 3],
    concepts: ["distance-and-neighborhoods"],
    outcomes: [
      "distance-and-neighborhoods:lecture02-euclidean-distance",
      "distance-and-neighborhoods:lecture02-metric-nonnegative",
      "distance-and-neighborhoods:lecture02-limit-point",
    ],
    exclusions: [1],
  },
  {
    id: "MH2100_Lecture_02:02",
    sourceId: sourceIds[1],
    span: "4–36",
    inspected: pageRange(4, 36),
    concepts: [
      "epsilon-delta-limits",
      "different-paths-different-limits",
      "curved-paths-hide-obstructions",
      "squeeze-and-continuity",
    ],
    outcomes: [
      "epsilon-delta-limits:lecture02-restricted-domain",
      "different-paths-different-limits:lecture02-two-restrictions",
      "different-paths-different-limits:lecture02-equal-axes-fail",
      "curved-paths-hide-obstructions:lecture02-nonlinear-path",
      "squeeze-and-continuity:lecture02-limit-laws",
      "squeeze-and-continuity:lecture02-full-domain-squeeze",
      "squeeze-and-continuity:lecture02-vector-limit-components",
      "squeeze-and-continuity:lecture02-scalar-continuity",
      "squeeze-and-continuity:lecture02-continuity-closure",
      "squeeze-and-continuity:lecture02-piecewise-squeeze",
      "squeeze-and-continuity:lecture02-composition-continuity",
      "squeeze-and-continuity:lecture02-vector-continuity",
    ],
    exclusions: [],
  },
  {
    id: "MH2100_Lecture_02:03",
    sourceId: sourceIds[1],
    span: "37–41",
    inspected: pageRange(37, 41),
    concepts: ["limits-at-infinity"],
    outcomes: [
      "limits-at-infinity:lecture02-all-directions",
      "limits-at-infinity:lecture02-iterated-not-joint",
      "limits-at-infinity:lecture02-vector-squeeze",
    ],
    exclusions: [],
  },
  {
    id: "MH2100_Lecture_02:04",
    sourceId: sourceIds[1],
    span: "42–43",
    inspected: [42, 43],
    concepts: ["distance-and-neighborhoods"],
    outcomes: ["distance-and-neighborhoods:open-closed-witnesses"],
    exclusions: [],
  },
  {
    id: "MH2100_Lecture_02:05",
    sourceId: sourceIds[1],
    span: "44–49",
    inspected: pageRange(44, 49),
    concepts: ["partial-derivatives-as-slices"],
    outcomes: [
      "partial-derivatives-as-slices:source-skill-1",
      "partial-derivatives-as-slices:lecture02-compute-partials",
      "partial-derivatives-as-slices:lecture02-special-point-partials",
      "partial-derivatives-as-slices:lecture02-slice-tangent-plane",
    ],
    exclusions: [],
  },
];
const outcomeSpecs = [
  [
    "partial-derivatives-as-slices:source-skill-1",
    "MH2100_Lecture_02:05",
    45,
    [45],
  ],
  [
    "surfaces-and-level-sets:two-variable-domain",
    "MH2100_Lecture_01:04",
    35,
    [34, 35],
  ],
  [
    "surfaces-and-level-sets:hemisphere-contours",
    "MH2100_Lecture_01:04",
    38,
    [37, 38, 39],
  ],
  [
    "distance-and-neighborhoods:open-closed-witnesses",
    "MH2100_Lecture_02:04",
    42,
    [42, 43],
  ],
  [
    "vectors-and-coordinates:lecture01-position-displacement",
    "MH2100_Lecture_01:01",
    9,
    [8, 9],
  ],
  [
    "vectors-and-coordinates:lecture01-component-algebra",
    "MH2100_Lecture_01:01",
    10,
    [10, 12],
  ],
  [
    "vectors-and-coordinates:lecture01-dot-angle",
    "MH2100_Lecture_01:01",
    13,
    [13],
  ],
  [
    "vectors-and-coordinates:lecture01-standard-basis",
    "MH2100_Lecture_01:01",
    14,
    [14],
  ],
  [
    "curves-and-parametrizations:lecture01-curve-image",
    "MH2100_Lecture_01:02",
    16,
    [15, 16, 17],
  ],
  [
    "constructing-curves:lecture01-line-parametrization",
    "MH2100_Lecture_01:02",
    18,
    [18, 19, 20],
  ],
  ["constructing-curves:lecture01-circle", "MH2100_Lecture_01:02", 21, [21]],
  ["constructing-curves:lecture01-cycloid", "MH2100_Lecture_01:02", 22, [22]],
  ["constructing-curves:lecture01-helix", "MH2100_Lecture_01:02", 23, [23]],
  [
    "constructing-curves:lecture01-eliminate-parameter",
    "MH2100_Lecture_01:02",
    24,
    [24, 25],
  ],
  [
    "tangents-velocity-and-singularities:lecture01-tangent-regularity",
    "MH2100_Lecture_01:03",
    26,
    [26, 27],
  ],
  [
    "tangents-velocity-and-singularities:lecture01-motion",
    "MH2100_Lecture_01:03",
    28,
    [28],
  ],
  [
    "tangents-velocity-and-singularities:lecture01-parametric-tangent-line",
    "MH2100_Lecture_01:03",
    29,
    [29, 30],
  ],
  [
    "tangents-velocity-and-singularities:lecture01-cusp",
    "MH2100_Lecture_01:03",
    31,
    [31, 32, 33],
  ],
  [
    "surfaces-and-level-sets:lecture01-graph-surface",
    "MH2100_Lecture_01:04",
    36,
    [34, 36],
  ],
  [
    "surfaces-and-level-sets:lecture01-level-set",
    "MH2100_Lecture_01:04",
    37,
    [37, 39],
  ],
  [
    "surfaces-and-level-sets:lecture01-contour-interval",
    "MH2100_Lecture_01:04",
    40,
    [40],
  ],
  [
    "vectors-and-coordinates:lecture01-cartesian-points",
    "MH2100_Lecture_01:01",
    7,
    [6, 7],
  ],
  [
    "distance-and-neighborhoods:lecture02-euclidean-distance",
    "MH2100_Lecture_02:01",
    2,
    [2],
  ],
  [
    "distance-and-neighborhoods:lecture02-metric-nonnegative",
    "MH2100_Lecture_02:01",
    2,
    [2],
  ],
  [
    "distance-and-neighborhoods:lecture02-limit-point",
    "MH2100_Lecture_02:01",
    3,
    [3],
  ],
  [
    "epsilon-delta-limits:lecture02-restricted-domain",
    "MH2100_Lecture_02:02",
    6,
    [4, 5, 6, 7, 8],
  ],
  [
    "different-paths-different-limits:lecture02-two-restrictions",
    "MH2100_Lecture_02:02",
    10,
    [10, 11, 12],
  ],
  [
    "different-paths-different-limits:lecture02-equal-axes-fail",
    "MH2100_Lecture_02:02",
    13,
    [13, 14],
  ],
  [
    "curved-paths-hide-obstructions:lecture02-nonlinear-path",
    "MH2100_Lecture_02:02",
    15,
    [15],
  ],
  [
    "squeeze-and-continuity:lecture02-limit-laws",
    "MH2100_Lecture_02:02",
    18,
    [18, 20],
  ],
  [
    "squeeze-and-continuity:lecture02-full-domain-squeeze",
    "MH2100_Lecture_02:02",
    19,
    [19, 21],
  ],
  [
    "squeeze-and-continuity:lecture02-vector-limit-components",
    "MH2100_Lecture_02:02",
    23,
    [22, 23, 24],
  ],
  [
    "squeeze-and-continuity:lecture02-scalar-continuity",
    "MH2100_Lecture_02:02",
    26,
    [25, 26],
  ],
  [
    "squeeze-and-continuity:lecture02-continuity-closure",
    "MH2100_Lecture_02:02",
    28,
    [27, 28],
  ],
  [
    "squeeze-and-continuity:lecture02-piecewise-squeeze",
    "MH2100_Lecture_02:02",
    30,
    [29, 30],
  ],
  [
    "squeeze-and-continuity:lecture02-composition-continuity",
    "MH2100_Lecture_02:02",
    32,
    [31, 32, 35, 36],
  ],
  [
    "squeeze-and-continuity:lecture02-vector-continuity",
    "MH2100_Lecture_02:02",
    34,
    [33, 34, 35, 36],
  ],
  [
    "limits-at-infinity:lecture02-all-directions",
    "MH2100_Lecture_02:03",
    37,
    [37, 38],
  ],
  [
    "limits-at-infinity:lecture02-iterated-not-joint",
    "MH2100_Lecture_02:03",
    39,
    [39, 40],
  ],
  [
    "limits-at-infinity:lecture02-vector-squeeze",
    "MH2100_Lecture_02:03",
    41,
    [41],
  ],
  [
    "partial-derivatives-as-slices:lecture02-special-point-partials",
    "MH2100_Lecture_02:05",
    48,
    [48],
  ],
  [
    "partial-derivatives-as-slices:lecture02-slice-tangent-plane",
    "MH2100_Lecture_02:05",
    49,
    [49],
  ],
  [
    "partial-derivatives-as-slices:lecture02-compute-partials",
    "MH2100_Lecture_02:05",
    47,
    [46, 47],
  ],
];
const newOutcomeIds = outcomeSpecs
  .map(([id]) => id)
  .filter((id) => id.includes(":lecture01-") || id.includes(":lecture02-"));
const conceptIds = [...new Set(outcomeSpecs.map(([id]) => id.split(":")[0]))];
const sourceBySection = new Map(
  sectionSpecs.map((section) => [section.id, section.sourceId]),
);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("canonical PDFs, page maps, exclusions, and stable source sections are verified", () => {
  assert.equal(
    new Set(outcomeSpecs.map(([id]) => id)).size,
    outcomeSpecs.length,
  );
  assert.deepEqual(
    newOutcomeIds,
    outcomeSpecs
      .map(([id]) => id)
      .filter((id) => id.includes(":lecture01-") || id.includes(":lecture02-")),
  );
  for (const sourceId of sourceIds) {
    const expected = sourceMeta[sourceId];
    assert.equal(sources[sourceId].file, sourceId + ".pdf");
    assert.equal(sources[sourceId].pages, expected.pages);
    assert.equal(sources[sourceId].sha256, expected.sha256);
    const entry = manifest.find((item) => item.sourceId === sourceId);
    assert.equal(entry?.status, "canonical");
    assert.equal(entry?.sha256, expected.sha256);
    for (const conceptId of expected.concepts) {
      assert.ok(
        concepts.some((item) => item.id === conceptId),
        conceptId,
      );
      assert.ok(entry.affectedConcepts.includes(conceptId), conceptId);
    }
  }

  for (const spec of sectionSpecs) {
    const section = ledger.source_sections.find((item) => item.id === spec.id);
    assert.ok(section, spec.id);
    assert.equal(section.source_id, spec.sourceId);
    assert.equal(section.physical_pages_from_audit, spec.span);
    assert.equal(
      section.verification,
      "canonical_sha_and_physical_pages_verified",
    );
    assert.equal(section.coverage_decision, "mapped_with_reasoned_exclusions");
    assert.equal(section.outcome_status, "atomic_source_review_completed");
    assert.deepEqual(section.inspected_physical_pages, spec.inspected);
    assert.deepEqual(section.linked_concept_ids, spec.concepts);
    assert.deepEqual(section.atomic_outcome_ids, spec.outcomes);
    assert.deepEqual(
      section.reviewed_exclusions.map((item) => item.physical_page),
      spec.exclusions,
    );
    assert.ok(
      section.reviewed_exclusions.every(
        (item) => item.reason.trim().length > 0,
      ),
      spec.id + " exclusion reasons",
    );
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, spec.id + " " + state);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
  }
  assert.match(
    ledger.source_sections
      .find((item) => item.id === "MH2100_Lecture_01:03")
      .source_review_notes.join(" "),
    /pages 32–33 are not blank/,
  );
  assert.match(
    ledger.source_sections.find((item) => item.id === "MH2100_Lecture_01:04")
      .reviewed_exclusions[0].reason,
    /GeoGebra URL/,
  );
  assert.match(
    ledger.source_sections
      .find((item) => item.id === "MH2100_Lecture_02:02")
      .source_review_notes.join(" "),
    /page 16 warns/,
  );
});

test("source outcomes retain exact physical anchors and separate six-state evidence", () => {
  for (const [id, sectionId, page, validationPages] of outcomeSpecs) {
    const outcome = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.ok(outcome, id);
    assert.equal(outcome.source_section_id, sectionId);
    assert.equal(outcome.core_source.id, sourceBySection.get(sectionId));
    if (newOutcomeIds.includes(id))
      assert.equal(
        outcome.core_source.sha256,
        sourceMeta[outcome.core_source.id].sha256,
      );
    assert.equal(outcome.core_source.physical_page, page);
    assert.deepEqual(
      outcome.core_source.page_validation.pages,
      validationPages,
    );
    assert.equal(outcome.core_source.page_validation.status, "page_verified");
    if (newOutcomeIds.includes(id))
      assert.match(
        outcome.core_source.page_validation.method,
        /SHA-256 matched/,
      );
    else assert.ok(outcome.core_source.page_validation.method.length > 0);
    assert.equal(outcome.visual_candidate.verified_for_outcome, false);
  }

  for (const id of newOutcomeIds) {
    const outcome = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.deepEqual(
      Object.keys(outcome.evidence).sort(),
      [...states].sort(),
      id,
    );
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(outcome.evidence[state].length, 1, id + " " + state);
    assert.deepEqual(outcome.evidence.visualized, [], id);
    assert.deepEqual(outcome.evidence.checked, [], id);
    assert.match(outcome.gap, /scene match.*learner performance/i);
    const [conceptId, skillId] = id.split(":");
    const guide = guides[conceptId];
    assert.ok(guide, conceptId);
    assert.ok(
      guide.contentBlocks.some(
        (item) => item.id === "mh2100-" + skillId + "-statement",
      ),
      id + " statement",
    );
    assert.ok(
      guide.contentBlocks.some(
        (item) => item.id === "mh2100-" + skillId + "-worked",
      ),
      id + " worked reasoning",
    );
    assert.ok(
      guide.exercises.some(
        (item) => item.id === "mh2100-" + skillId + "-transfer",
      ),
      id + " transfer practice",
    );
  }
});

test("Lecture 01–02 source guide content renders valid MathML through the stable WebMCP routes", async () => {
  const formulaKeys = new Set(["equation", "solutionTex", "tex"]);
  const rawSourceMath =
    /\\(?:[A-Za-z]+)|[=<>^_²³⁴×πθΣ√∈→↦∞]|\b(?:lim|sqrt|sin|cos|tan|exp|ln|log)\b|\b[A-Za-z]_[A-Za-z0-9]|\b[A-Za-z]\([A-Za-z0-9, ]+\)/u;
  const failures = [];
  const scan = (value, locator, key = "") => {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        scan(item, locator + "[" + index + "]", key),
      );
      return;
    }
    if (value && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value))
        scan(child, locator + "." + childKey, childKey);
      return;
    }
    if (typeof value !== "string") return;
    const delimiterCount = value.match(/\$/gu)?.length ?? 0;
    assert.equal(delimiterCount % 2, 0, locator + " unpaired math delimiter");
    assert.doesNotMatch(
      value,
      /\\in fty/u,
      locator + " split infinity command",
    );
    if (formulaKeys.has(key)) {
      assert.doesNotMatch(
        value,
        /\\{2,}[A-Za-z]/u,
        locator + " repeated TeX slash",
      );
      assert.doesNotThrow(
        () => inspectTexSemantics(value, locator, failures),
        locator,
      );
    } else {
      inspectNotation(value, locator, failures);
      const plain = value.replace(/\$\$[\s\S]+?\$\$|\$[^$]+?\$/gu, "");
      if (rawSourceMath.test(plain))
        failures.push(
          locator + ": unmarked source math " + plain.slice(0, 160),
        );
      for (const match of value.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/gu))
        if (/\\{2,}[A-Za-z]/u.test(match[1] ?? match[2]))
          failures.push(locator + ": repeated TeX slash in math span");
    }
  };
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

  for (const conceptId of conceptIds) {
    const guide = guides[conceptId];
    const blocks = guide.contentBlocks.filter(
      (item) =>
        item.id.startsWith("mh2100-lecture01-") ||
        item.id.startsWith("mh2100-lecture02-"),
    );
    const exercises = guide.exercises.filter(
      (item) =>
        item.id.startsWith("mh2100-lecture01-") ||
        item.id.startsWith("mh2100-lecture02-"),
    );
    blocks.forEach((item) => scan(item, conceptId + "." + item.id));
    exercises.forEach((item) => scan(item, conceptId + "." + item.id));

    const result = readConcept.execute({ conceptId });
    assert.equal(result.id, conceptId);
    assert.equal(
      result.scene,
      concepts.find((item) => item.id === conceptId).scene,
    );
    assert.deepEqual(result.lesson, guide);
    for (const outcome of outcomeSpecs.filter(
      ([id]) => id.startsWith(conceptId + ":") && newOutcomeIds.includes(id),
    )) {
      const [, sectionId, page] = outcome;
      const sourceId = sourceBySection.get(sectionId);
      assert.ok(
        result.sources.some(
          (source) =>
            source.sourceId === sourceId &&
            source.pages[0] <= page &&
            source.pages.at(-1) >= page,
        ),
        conceptId + " source page " + page,
      );
    }

    for (const item of blocks) {
      const rendered = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block: item }),
      );
      if (JSON.stringify(item).includes("$"))
        assert.match(rendered, /<math\b/u, item.id);
      assert.doesNotMatch(rendered, /katex-error/u, item.id);
    }
    for (const item of exercises) {
      for (const text of [
        item.prompt,
        item.hint,
        item.solution,
        ...(item.rubric ?? []),
      ]) {
        const rendered = renderToStaticMarkup(
          React.createElement(MathText, { text }),
        );
        if (text.includes("$")) assert.match(rendered, /<math\b/u, item.id);
        assert.doesNotMatch(rendered, /katex-error/u, item.id);
      }
      if (item.solutionTex) {
        const rendered = renderToStaticMarkup(
          React.createElement(Formula, { block: true }, item.solutionTex),
        );
        assert.match(rendered, /<math\b/u, item.id + " solution MathML");
        assert.doesNotMatch(rendered, /katex-error/u, item.id);
      }
    }
  }
  assert.deepEqual(failures, []);
});
