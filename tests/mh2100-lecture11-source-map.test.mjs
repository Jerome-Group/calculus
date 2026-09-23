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
const sourceId = "MH2100_Lecture_11";
const sourceSha =
  "eaf91ecc57b7fd0814686d598723bf376fee3cea3ce1cf579b2839241fb4d519";
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
    span: "1–9",
    concepts: ["flux-through-surfaces", "divergence-theorem"],
    ids: [
      "flux-through-surfaces:lecture11-top-hemisphere-flux",
      "flux-through-surfaces:lecture11-cone-boundary-flux",
      "flux-through-surfaces:lecture11-semicylinder-flux",
    ],
    exclusions: [2, 3, 5, 6, 8, 9],
  },
  {
    id: sourceId + ":02",
    span: "11–21",
    concepts: [
      "curl-and-local-rotation",
      "divergence-and-local-flow",
      "gradient-curl-divergence",
    ],
    ids: [
      "curl-and-local-rotation:lecture11-curl-components",
      "curl-and-local-rotation:lecture11-curl-orientation",
      "curl-and-local-rotation:lecture11-conservative-domain-test",
      "divergence-and-local-flow:lecture11-divergence-at-a-point",
      "divergence-and-local-flow:lecture11-divergence-sign",
      "gradient-curl-divergence:lecture11-divergence-of-curl",
    ],
    exclusions: [10],
  },
  {
    id: sourceId + ":03",
    span: "22–33",
    concepts: ["stokes-theorem", "divergence-theorem"],
    ids: [
      "stokes-theorem:source-skill-1",
      "stokes-theorem:tilted-spanning-disk",
      "stokes-theorem:lecture11-hypotheses",
      "stokes-theorem:lecture11-spherical-cap",
      "divergence-theorem:source-skill-1",
      "divergence-theorem:lecture11-hypotheses",
      "divergence-theorem:lecture11-parabolic-solid",
    ],
    exclusions: [25, 26, 28, 29, 33],
  },
];
const expectedPages = new Map([
  ["flux-through-surfaces:lecture11-top-hemisphere-flux", [1, 30]],
  ["flux-through-surfaces:lecture11-cone-boundary-flux", [4, 30]],
  ["flux-through-surfaces:lecture11-semicylinder-flux", [7, 30]],
  ["curl-and-local-rotation:lecture11-curl-components", [11, 14]],
  ["curl-and-local-rotation:lecture11-curl-orientation", [12]],
  ["curl-and-local-rotation:lecture11-conservative-domain-test", [13]],
  ["divergence-and-local-flow:lecture11-divergence-at-a-point", [15, 20]],
  ["divergence-and-local-flow:lecture11-divergence-sign", [16, 17, 18, 19]],
  ["gradient-curl-divergence:lecture11-divergence-of-curl", [21]],
  ["stokes-theorem:lecture11-hypotheses", [22, 23]],
  ["stokes-theorem:lecture11-spherical-cap", [22, 23, 27]],
  ["divergence-theorem:lecture11-hypotheses", [30]],
  ["divergence-theorem:lecture11-parabolic-solid", [30, 31, 32]],
]);
const newOutcomeIds = [...expectedPages.keys()];
const oldOutcomeIds = [
  "stokes-theorem:source-skill-1",
  "stokes-theorem:tilted-spanning-disk",
  "divergence-theorem:source-skill-1",
];
const guideIds = [
  "flux-through-surfaces",
  "curl-and-local-rotation",
  "divergence-and-local-flow",
  "gradient-curl-divergence",
  "stokes-theorem",
  "divergence-theorem",
];
const guidesForSource = Object.fromEntries(
  guideIds.map((id) => [
    id,
    {
      blocks: (guides[id].contentBlocks ?? []).filter((entry) =>
        entry.id.startsWith("mh2100-l11-"),
      ),
      exercises: (guides[id].exercises ?? []).filter((entry) =>
        entry.id.startsWith("mh2100-l11-"),
      ),
    },
  ]),
);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("canonical source identity, exact section pages, exclusions, and stable routes", () => {
  assert.equal(sources[sourceId].file, "MH2100_Lecture_11.pdf");
  assert.equal(sources[sourceId].pages, 33);
  assert.equal(sources[sourceId].sha256, sourceSha);
  assert.deepEqual(sources[sourceId].errata, []);
  const sourceManifest = manifest.find((entry) => entry.sourceId === sourceId);
  assert.equal(sourceManifest?.status, "canonical");
  assert.equal(sourceManifest?.sha256, sourceSha);
  assert.equal(
    sourceManifest?.driveFileId,
    "1UwnNmPDpeJj33xM9JdE9CEtRuX8o8Q5B",
  );
  assert.ok(sourceManifest.affectedConcepts.includes("flux-through-surfaces"));
  assert.equal(concepts.length, 125);
  assert.equal(new Set(concepts.map((item) => item.id)).size, 125);

  for (const spec of sectionSpecs) {
    const section = ledger.source_sections.find(
      (entry) => entry.id === spec.id,
    );
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
    assert.deepEqual(section.atomic_outcome_ids, spec.ids);
    assert.deepEqual(
      section.inspected_physical_pages,
      section.physical_page_span
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
    assert.deepEqual(Object.keys(section.evidence).sort(), [...states].sort());
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.ok(section.evidence[state].length > 0, spec.id + " " + state);
    assert.deepEqual(section.evidence.visualized, []);
    assert.deepEqual(section.evidence.checked, []);
    assert.match(section.gap, /scene|scene alignment/iu);
    assert.match(section.gap, /learner performance/iu);
    assert.ok(
      section.source_review_notes.some((note) => /rendered/iu.test(note)),
    );
  }

  assert.match(
    ledger.source_sections.find((entry) => entry.id === sourceId + ":01").gap,
    /prompts only/iu,
  );
  assert.match(
    ledger.source_sections.find((entry) => entry.id === sourceId + ":02").gap,
    /no source solutions/iu,
  );
  assert.match(
    ledger.source_sections
      .find((entry) => entry.id === sourceId + ":03")
      .source_review_notes.join(" "),
    /p33 is blank/u,
  );
  assert.match(
    ledger.source_sections
      .find((entry) => entry.id === sourceId + ":03")
      .source_review_notes.join(" "),
    /tilted-disk review repair remains intact/u,
  );
});

test("all distinct source skills retain atomic six-state evidence and page-backed guide links", () => {
  const entries = ledger.atomic_outcomes.filter((entry) =>
    entry.source_section_id?.startsWith(sourceId + ":"),
  );
  assert.equal(entries.length, 16);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((entry) => entry.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const id of oldOutcomeIds)
    assert.ok(entries.some((entry) => entry.id === id));
  assert.deepEqual(
    entries
      .filter((entry) => expectedPages.has(entry.id))
      .map((entry) => entry.id),
    newOutcomeIds,
  );

  for (const [id, pages] of expectedPages) {
    const entry = entries.find((candidate) => candidate.id === id);
    const conceptId = id.split(":")[0];
    const guideAssets = guidesForSource[conceptId];
    assert.equal(entry.concept_id, conceptId, id);
    assert.equal(entry.core_source.id, sourceId, id);
    assert.equal(entry.core_source.sha256, sourceSha, id);
    assert.deepEqual(entry.core_source.page_validation.pages, pages, id);
    assert.equal(entry.core_source.page_validation.status, "page_verified", id);
    assert.match(entry.core_source.page_validation.method, /SHA-256/u, id);
    assert.match(
      entry.core_source.page_validation.method,
      /visually checked/u,
      id,
    );
    assert.ok(pages.includes(entry.core_source.physical_page), id);
    assert.equal(
      entry.verification,
      "source_page_and_cited_guide_inspected",
      id,
    );
    assert.equal(entry.depth, "source_page_and_cited_guide_inspected", id);
    assert.deepEqual(Object.keys(entry.evidence), states, id);
    for (const state of ["named", "stated", "worked", "practiced"])
      assert.equal(entry.evidence[state].length, 1, id + " " + state);
    assert.deepEqual(entry.evidence.visualized, [], id);
    assert.deepEqual(entry.evidence.checked, [], id);
    assert.equal(entry.visual_candidate.verified_for_outcome, false, id);
    assert.match(entry.gap, /not outcome-specific|not verified/iu, id);
    assert.match(entry.gap, /learner performance/iu, id);

    const concept = concepts.find((item) => item.id === conceptId);
    assert.ok(concept, id);
    for (const page of pages)
      assert.ok(
        concept.sources.some(
          (source) =>
            source.sourceId === sourceId &&
            source.pages[0] <= page &&
            source.pages[1] >= page,
        ),
        id + " source page " + page,
      );

    const namedMatch = entry.evidence.named[0].locator.match(
      /^lib\/curriculum\/concepts\.json#([^.]+)\.title$/u,
    );
    assert.equal(namedMatch?.[1], conceptId, id + " named");
    for (const state of ["stated", "worked"]) {
      const match = entry.evidence[state][0].locator.match(
        /^lib\/curriculum\/learning-guides\.json#([^.]+)\.contentBlocks\[([^\]]+)\]$/u,
      );
      assert.ok(match, id + " " + state);
      assert.equal(match[1], conceptId, id + " " + state);
      assert.ok(
        guideAssets.blocks.some(
          (block) =>
            block.id === match[2] &&
            (state === "stated"
              ? ["strategy", "theorem"].includes(block.kind)
              : block.kind === "worked-example"),
        ),
        id + " " + state + " block",
      );
    }
    const practiceMatch = entry.evidence.practiced[0].locator.match(
      /^lib\/curriculum\/learning-guides\.json#([^.]+)\.exercises\[([^\]]+)\]$/u,
    );
    assert.ok(practiceMatch, id + " practice");
    assert.equal(practiceMatch[1], conceptId, id + " practice");
    const exercise = guideAssets.exercises.find(
      (item) => item.id === practiceMatch[2],
    );
    assert.ok(
      exercise?.prompt &&
        exercise.hint &&
        exercise.solution &&
        exercise.solutionTex,
      id,
    );
    assert.ok(exercise.rubric.length >= 2, id);
  }

  for (const id of oldOutcomeIds) {
    const entry = entries.find((candidate) => candidate.id === id);
    assert.equal(entry.core_source.sha256, sourceSha);
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
    assert.deepEqual(Object.keys(entry.evidence), states);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
  }
});

test("source derivations, changed-data answers, and theorem assumptions are exact", () => {
  const close = (actual, expected, label) =>
    assert.ok(Math.abs(actual - expected) < 1e-11, label + ": " + actual);
  close((2 / 3) * Math.PI * 6 ** 3, 144 * Math.PI, "source hemisphere flux");
  const coneVolume = 2 * Math.PI * ((16 * Math.SQRT2 - 8) / 3 - 8 / 3);
  close(coneVolume, (32 * Math.PI * (Math.SQRT2 - 1)) / 3, "cone volume");
  const halfCylinderFlux = 4 * (Math.PI / 2) + 2 * (2 - 2 / 3);
  close(halfCylinderFlux, 2 * Math.PI + 8 / 3, "half-cylinder flux");
  const changedSemicircleArea = (Math.PI * 2 ** 2) / 2;
  const changedXFlux = 1 ** 2 * changedSemicircleArea;
  const changedZFlux = 1 * (4 * 4 - (2 * 2 ** 3) / 3);
  close(
    changedXFlux + changedZFlux,
    2 * Math.PI + 32 / 3,
    "changed half-cylinder flux",
  );
  const changedSemicylinder = guides["flux-through-surfaces"].exercises.find(
    (exercise) => exercise.id === "mh2100-l11-semicylinder-transfer",
  );
  assert.equal(
    changedSemicylinder.solutionTex,
    "\\iiint_E(2x+2y+2z)\\,dV=2\\pi+\\frac{32}{3}",
  );
  const [x, y, z] = [2, 3, 5];
  const sourceCurlAtPoint = [x * z - x, x ** 2 - y * z, z];
  assert.deepEqual(sourceCurlAtPoint, [8, -11, 5]);
  const sourceDivergenceAtPoint = Math.exp(0) - 1 - 2 * 2 * -1;
  close(sourceDivergenceAtPoint, 4, "source divergence at (0, 2, -1)");
  const divCurlTermsAtUnitX = [-2 * 1, 1, 1];
  close(
    divCurlTermsAtUnitX.reduce((sum, term) => sum + term, 0),
    0,
    "divergence of curl at x=1",
  );
  const integralOfEight = 8 * 2;
  const integralOfCapPolynomial = 2 * (1 + 1 + 3 / 5 + 1 / 7);
  const sourceGaussIntegral = (integralOfEight - integralOfCapPolynomial) / 2;
  close(sourceGaussIntegral, 184 / 35, "source Gauss flux");
  assert.equal(3 * (32 / 15), 32 / 5);

  const stokes = guides["stokes-theorem"].contentBlocks.find(
    (block) => block.id === "mh2100-l11-stokes-hypotheses",
  );
  assert.equal(stokes.kind, "theorem");
  assert.match(stokes.hypotheses.join(" "), /piecewise smooth/iu);
  assert.match(stokes.hypotheses.join(" "), /open neighborhood/iu);
  assert.match(stokes.hypotheses.join(" "), /right thumb/iu);
  assert.match(
    JSON.stringify(
      guides["stokes-theorem"].contentBlocks.find(
        (block) => block.id === "tilted-cylinder-plane-stokes",
      ),
    ),
    /required edge|same edge/u,
  );
  const gauss = guides["divergence-theorem"].contentBlocks.find(
    (block) => block.id === "mh2100-l11-gauss-hypotheses",
  );
  assert.equal(gauss.kind, "theorem");
  assert.match(gauss.hypotheses.join(" "), /bounded and closed/iu);
  assert.match(gauss.hypotheses.join(" "), /no exposed edge/iu);
  assert.match(gauss.hypotheses.join(" "), /outward/iu);
  assert.match(gauss.hypotheses.join(" "), /cavity/iu);
});

test("new Lecture 11 prose and formulas compile strictly and render semantic MathML through WebMCP", async () => {
  const formulaKeys = new Set(["equation", "solutionTex", "tex"]);
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
    if (formulaKeys.has(key))
      assert.doesNotThrow(
        () => inspectTexSemantics(value, locator, failures),
        locator,
      );
    else inspectNotation(value, locator, failures);
  };
  for (const conceptId of guideIds) {
    const { blocks, exercises } = guidesForSource[conceptId];
    blocks.forEach((item) => scan(item, conceptId + "." + item.id));
    exercises.forEach((item) => scan(item, conceptId + "." + item.id));
  }
  assert.deepEqual(failures, []);

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
    const result = readConcept.execute({ conceptId });
    assert.equal(result.id, conceptId);
    assert.equal(
      result.scene,
      concepts.find((item) => item.id === conceptId).scene,
    );
    assert.deepEqual(result.lesson, guides[conceptId]);
    assert.ok(
      result.sources.some((item) => item.sourceId === sourceId),
      conceptId,
    );
    const { blocks, exercises } = guidesForSource[conceptId];
    for (const block of blocks) {
      assert.ok(
        result.lesson.contentBlocks.some((item) => item.id === block.id),
        conceptId + " WebMCP block " + block.id,
      );
      const markup = renderToStaticMarkup(
        React.createElement(StructuredLessonBlockView, { block }),
      );
      if (JSON.stringify(block).includes("$"))
        assert.match(markup, /<math\b/u, block.id);
      assert.doesNotMatch(markup, /katex-error/u, block.id);
    }
    for (const exercise of exercises) {
      assert.ok(
        result.lesson.exercises.some((item) => item.id === exercise.id),
        conceptId + " WebMCP exercise " + exercise.id,
      );
      const prose = [exercise.prompt, exercise.hint, exercise.solution].join(
        " ",
      );
      const proseMarkup = renderToStaticMarkup(
        React.createElement(MathText, { text: prose }),
      );
      const formulaMarkup = renderToStaticMarkup(
        React.createElement(Formula, { block: true }, exercise.solutionTex),
      );
      assert.match(proseMarkup, /<math\b/u, exercise.id + " prose MathML");
      assert.match(formulaMarkup, /<math\b/u, exercise.id + " solution MathML");
      assert.doesNotMatch(
        proseMarkup + formulaMarkup,
        /katex-error/u,
        exercise.id,
      );
    }
  }
});
