import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const ledger = read("../lib/curriculum/outcome-ledger.json");

test("every MH1100 route has source evidence, checked reasoning, and transfer feedback", () => {
  const routes = concepts.filter((concept) => concept.course === "MH1100");
  assert.equal(routes.length, 24);
  for (const route of routes) {
    const guide = guides[route.id];
    const blocks = [
      ...(guide.contentBlocks ?? []),
      ...(guide.supplementalBlocks ?? []),
    ];
    const outcomes = ledger.atomic_outcomes.filter(
      (outcome) => outcome.concept_id === route.id,
    );
    assert.ok(route.sources.length > 0, `${route.id}: source citation`);
    assert.ok(outcomes.length > 0, `${route.id}: atomic source mapping`);
    assert.ok(guide.exercises.length > 0, `${route.id}: changed-data practice`);
    for (const block of blocks) {
      if (block.kind === "theorem") {
        assert.ok(block.hypotheses?.length > 0, `${route.id}:${block.id}`);
        assert.ok(block.status, `${route.id}:${block.id}: proof status`);
      }
      if (block.kind === "worked-example") {
        assert.ok(block.steps?.length > 0, `${route.id}:${block.id}`);
        assert.ok(block.verification, `${route.id}:${block.id}: check`);
      }
    }
    for (const exercise of guide.exercises) {
      assert.ok(exercise.prompt && exercise.hint && exercise.solution);
      assert.ok(exercise.rubric?.length >= 2, `${route.id}:${exercise.id}`);
    }
  }
});

test("proof labels agree with the two MH1100 arguments supplied to learners", () => {
  const corners = guides["differentiability-corners"].contentBlocks;
  const derivative = corners.find(
    (block) => block.id === "derivative-implies-continuity",
  );
  const forwardProof = corners.find(
    (block) => block.id === "source-implication-and-converse",
  );
  assert.match(derivative.status, /proof sketch/i);
  assert.match(forwardProof.steps[0].text, /multiply by.*h/u);

  const extrema = guides["extrema-fermat"].supplementalBlocks;
  const fermat = extrema.find((block) => block.id === "fermat-statement");
  const oneSidedProof = extrema.find(
    (block) => block.id === "fermat-one-sided-proof",
  );
  assert.match(fermat.status, /proof follows/i);
  assert.equal(oneSidedProof.steps.length, 3);
  assert.match(oneSidedProof.result, /reverse the inequalities/u);
});
