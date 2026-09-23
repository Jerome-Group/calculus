import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ledger = read("../lib/curriculum/outcome-ledger.json");
const sources = read("../lib/curriculum/sources.json");
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");

test("outcome ledger carries all concept review entries as unverified checklist items", () => {
  assert.equal(ledger.concept_checklist.length, 125);
  assert.equal(
    new Set(ledger.concept_checklist.map((entry) => entry.id)).size,
    125,
  );
  for (const entry of ledger.concept_checklist) {
    assert.ok(
      concepts.some((concept) => concept.id === entry.id),
      entry.id,
    );
    assert.equal(entry.verification, "pending");
    assert.ok(entry.source_locators.length > 0, entry.id);
    for (const locator of entry.source_locators)
      assert.ok(sources[locator.source_id], locator.source_id);
  }
});

test("every core source has an explicit section inventory and unverified gap", () => {
  const core = Object.values(sources).filter(
    (source) => source.kind !== "textbook",
  );
  for (const source of core) {
    const sections = ledger.source_sections.filter(
      (section) => section.source_id === source.id,
    );
    assert.ok(sections.length > 0, source.id);
    for (const section of sections) {
      assert.equal(section.verification, "pending");
      assert.ok(section.gap);
      assert.ok(section.physical_pages_from_audit);
      assert.ok(
        ["partial_atomic_mapping", "explicit_gap"].includes(
          section.coverage_decision,
        ),
      );
      assert.deepEqual(
        section.atomic_outcome_ids,
        ledger.atomic_outcomes
          .filter((outcome) => outcome.source_section_id === section.id)
          .map((outcome) => outcome.id),
      );
      if (section.coverage_decision === "explicit_gap")
        assert.equal(section.atomic_outcome_ids.length, 0);
      else assert.ok(section.atomic_outcome_ids.length > 0);
      for (const state of ledger.states)
        assert.deepEqual(section.evidence[state], []);
    }
  }
});

test("optional textbook inventory cannot count as core outcomes", () => {
  for (const section of ledger.textbook_sections) {
    assert.equal(section.core_requirement, false);
    assert.equal(section.route, "optional_enrichment");
    assert.equal(sources[section.source_id]?.kind, "textbook");
  }
  for (const section of ledger.source_sections)
    assert.notEqual(sources[section.source_id]?.kind, "textbook");
});

test("inspected atomic outcomes retain core locators and separate evidence states", () => {
  assert.ok(ledger.atomic_outcomes.length >= 58);
  assert.equal(
    new Set(ledger.atomic_outcomes.map((entry) => entry.id)).size,
    ledger.atomic_outcomes.length,
  );
  for (const skill of [
    "set-notation",
    "set-membership",
    "subset-disjointness",
    "union-intersection",
    "relative-complement",
    "distributive-law",
    "commutative-laws",
    "associative-laws",
  ])
    assert.ok(
      ledger.atomic_outcomes.some(
        (entry) => entry.id === `sets-functions-domains:${skill}`,
      ),
    );
  assert.ok(
    ledger.atomic_outcomes.some(
      (entry) => entry.id === "spherical-integration:variable-radial-bounds",
    ),
  );
  assert.ok(
    ledger.atomic_outcomes.some(
      (entry) => entry.id === "partial-fractions:divide-before-decompose",
    ),
  );
  for (const skill of ["alternating-hypotheses", "conditional-classification"])
    assert.ok(
      ledger.atomic_outcomes.some(
        (entry) => entry.id === `absolute-conditional-alternating:${skill}`,
      ),
    );
  for (const skill of [
    "series-geometric-telescoping:finite-geometric-decision",
    "series-geometric-telescoping:telescoping-boundaries",
    "series-divergence-test:harmonic-blocks",
  ])
    assert.ok(ledger.atomic_outcomes.some((entry) => entry.id === skill));
  for (const id of [
    "total-differentiability:candidate-plane-function",
    "partials-do-not-make-a-plane:failed-implications",
    "certifying-differentiability-and-errors:neighborhood-partials-criterion",
    "total-differentiability:normalized-remainder-decision",
  ])
    assert.ok(ledger.atomic_outcomes.some((entry) => entry.id === id));
  for (const id of [
    "limits-one-sided:secant-slope-limit",
    "limits-one-sided:instantaneous-velocity-limit",
    "infinite-limits:two-sided-threshold-definition",
  ])
    assert.ok(ledger.atomic_outcomes.some((entry) => entry.id === id));
  for (const entry of ledger.atomic_outcomes) {
    const source = sources[entry.core_source.id];
    assert.ok(source, entry.id);
    assert.notEqual(source.kind, "textbook");
    assert.ok(entry.core_source.physical_page >= 1);
    assert.ok(entry.core_source.physical_page <= source.pages);
    assert.ok(concepts.some((concept) => concept.id === entry.concept_id));
    assert.equal(entry.verification, "source_page_and_cited_guide_inspected");
    assert.equal(entry.core_source.page_validation.status, "page_verified");
    assert.ok(entry.core_source.page_validation.claim_observed);
    assert.ok(
      entry.core_source.page_validation.pages.includes(
        entry.core_source.physical_page,
      ),
    );
    for (const page of entry.core_source.page_validation.pages) {
      assert.ok(
        Number.isInteger(page) && page >= 1 && page <= source.pages,
        entry.id,
      );
    }
    assert.ok(entry.gap);
    const section = ledger.source_sections.find(
      (section) => section.id === entry.source_section_id,
    );
    assert.ok(section);
    assert.equal(section.source_id, entry.core_source.id);
    assert.ok(section.atomic_outcome_ids.includes(entry.id));
    assert.deepEqual(
      Object.keys(entry.evidence).sort(),
      [...ledger.states].sort(),
    );
    assert.equal(entry.visual_candidate.verified_for_outcome, false);
    assert.ok(entry.inspection_check.method);
    assert.deepEqual(entry.evidence.visualized, []);
    assert.deepEqual(entry.evidence.checked, []);
  }
});

test("promoted evidence locators resolve to current catalog or guide blocks", () => {
  for (const outcome of ledger.atomic_outcomes) {
    for (const state of ledger.states) {
      for (const evidence of outcome.evidence[state]) {
        assert.ok(evidence.claim && evidence.method, outcome.id);
        const { locator } = evidence;
        const catalog = locator.match(
          /^lib\/curriculum\/concepts\.json#(.+)\.title$/,
        );
        if (catalog) {
          assert.equal(state, "named", locator);
          assert.ok(
            concepts.find((concept) => concept.id === catalog[1])?.title,
          );
          continue;
        }
        const guide = locator.match(
          /^lib\/curriculum\/learning-guides\.json#([^.]+)\.(sections|contentBlocks|supplementalBlocks|exercises|exercise)(?:\[([^\]]+)\])?$/,
        );
        assert.ok(guide, locator);
        const lesson = guides[guide[1]];
        assert.ok(lesson, locator);
        if (guide[2] === "sections") {
          assert.ok(
            lesson.sections.some((section) => section.title === guide[3]),
            locator,
          );
        } else if (guide[2] === "contentBlocks") {
          const block = lesson.contentBlocks?.find(
            (item) => item.id === guide[3],
          );
          assert.ok(block, locator);
          assert.equal(
            state,
            block.kind === "worked-example" ? "worked" : "stated",
            locator,
          );
        } else if (guide[2] === "supplementalBlocks") {
          const block = lesson.supplementalBlocks?.find(
            (item) => item.id === guide[3],
          );
          assert.ok(block, locator);
          assert.equal(
            state,
            ["derivation", "worked-example"].includes(block.kind)
              ? "worked"
              : "stated",
            locator,
          );
          assert.ok(
            ["derivation", "worked-example", "theorem", "strategy"].includes(
              block.kind,
            ),
          );
        } else if (guide[2] === "exercises") {
          assert.ok(
            lesson.exercises?.some(
              (exercise) =>
                exercise.id === guide[3] &&
                exercise.prompt &&
                exercise.solution,
            ),
            locator,
          );
          assert.equal(state, "practiced", locator);
        } else {
          assert.ok(
            lesson.exercise?.prompt && lesson.exercise?.solution,
            locator,
          );
          assert.equal(state, "practiced", locator);
        }
      }
    }
  }
});
