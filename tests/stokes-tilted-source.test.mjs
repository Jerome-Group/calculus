import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import katex from "katex";

const guides = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
  ),
);
const ledger = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/outcome-ledger.json", import.meta.url),
  ),
);
const lesson = guides["stokes-theorem"];
const worked = lesson.contentBlocks.find(
  (block) => block.id === "tilted-cylinder-plane-stokes",
);
const transfer = lesson.exercises.find(
  (exercise) => exercise.id === "tilted-stokes-eligibility-transfer",
);

test("source Stokes example preserves the tilted curve and nonlinear field", () => {
  assert.match(worked.setup, /x\^2\+y\^2=1/);
  assert.match(worked.setup, /y\+z=2/);
  assert.match(worked.setup, /F=\(-y\^2,x,z\^2\)/);
  assert.match(worked.steps[0].text, /entire disk/);
  assert.match(worked.steps[1].text, /counterclockwise/);
  assert.match(worked.steps[2].equation, /1\+2y/);
  assert.match(worked.steps[2].equation, /=\\pi$/);

  const n = 2000;
  const h = (2 * Math.PI) / n;
  let direct = 0;
  for (let j = 0; j < n; j++) {
    const t = (j + 0.5) * h;
    const sin = Math.sin(t);
    const cos = Math.cos(t);
    direct += (sin ** 3 + cos ** 2 - (2 - sin) ** 2 * cos) * h;
  }
  assert.ok(Math.abs(direct - Math.PI) < 1e-9);
});

test("transfer tests a different tilted edge and reverses its induced direction", () => {
  assert.match(transfer.prompt, /z=1\+x/);
  assert.match(transfer.prompt, /clockwise/);
  assert.match(transfer.solution, /horizontal disk has a different boundary/);
  assert.match(transfer.solutionTex, /=-8\\pi$/);
  const outcome = ledger.atomic_outcomes.find(
    (entry) => entry.id === "stokes-theorem:tilted-spanning-disk",
  );
  assert.deepEqual(outcome.core_source.page_validation.pages, [22, 23, 24]);
  assert.equal(outcome.evidence.worked.length, 1);
  assert.equal(outcome.evidence.practiced.length, 1);
  assert.deepEqual(outcome.evidence.visualized, []);
  assert.deepEqual(outcome.evidence.checked, []);
});

test("new Stokes math parses as LaTeX", () => {
  const strings = [
    worked.setup,
    worked.result,
    worked.verification,
    ...worked.steps.flatMap(({ text, equation }) => [text, equation]),
    transfer.prompt,
    transfer.hint,
    transfer.solution,
    transfer.solutionTex,
  ];
  for (const value of strings) {
    for (const match of value.matchAll(/\$([^$]+)\$/g))
      assert.doesNotThrow(
        () => katex.renderToString(match[1], { throwOnError: true }),
        match[1],
      );
  }
});
