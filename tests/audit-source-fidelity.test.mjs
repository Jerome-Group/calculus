import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { derivative, evaluate } from "mathjs";

const guides = JSON.parse(
  await readFile(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
  ),
);
const concepts = JSON.parse(
  await readFile(new URL("../lib/curriculum/concepts.json", import.meta.url)),
);

test("first N geometric terms use indices 0 through N−1", () => {
  const guide = guides["series-geometric-telescoping"].sections[0].text;
  const concept = concepts.find(
    (item) => item.id === "series-geometric-telescoping",
  );
  assert.match(guide, /first N terms, from n=0 through n=N−1/);
  assert.match(guide, /S_N=1\+r\+⋯\+r\^\(N−1\)=\(1−r\^N\)\/\(1−r\)/);
  assert.match(guide, /through index N; that has N\+1 terms/);
  assert.match(concept.proof, /r\^N/);
  const firstTerms = (n, r) =>
    Array.from({ length: n }, (_, index) => r ** index).reduce(
      (sum, term) => sum + term,
      0,
    );
  assert.equal(firstTerms(1, 0.5), 1);
  assert.equal(firstTerms(1, 0.5), (1 - 0.5 ** 1) / (1 - 0.5));
  assert.notEqual(firstTerms(1, 0.5), (1 - 0.5 ** 2) / (1 - 0.5));
});

test("original Green review field retains its derivative cancellation and orientation", () => {
  const guide = guides["review-integral-methods"];
  const text = guide.sections.map((section) => section.text).join(" ");
  assert.match(text, /P=y cos x−xy sin x and Q=xy\+x cos x/);
  assert.match(text, /clockwise orientation gives .*−72/);
  assert.match(text, /separately labelled scaffold, F=\(0,xy\)/);
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
    assert.ok(Math.abs(curl - y) < 1e-12);
  }
  const triangleIntegral = (12 ** 3 - 0) / 24;
  assert.equal(triangleIntegral, 72);
  assert.match(guide.exercise.prompt, /original Green field/);
});

test("original potential problem keeps the complicated reverse parametrization", () => {
  const guide = guides["review-integral-methods"];
  const text = guide.sections.map((section) => section.text).join(" ");
  assert.match(text, /r\(t\)=\(e\^\(t²−t\)−cos\(2πt\), 2 sin\(πt²\/2\)−t⁹\)/);
  assert.match(text, /\(2xy\+e\^\(−x²\)\) dx\+\(x²\+y cos\(πy²\/2\)\) dy/);
  assert.match(text, /opposite to the requested curve orientation/);
  assert.match(text, /straight segment .*separately labelled scaffold/);
  const potentialY = derivative("x^2*y+sin(pi*y^2/2)/pi", "y");
  for (const [x, y] of [
    [0, 0],
    [0.4, 0.7],
    [2, 1],
  ])
    assert.ok(
      Math.abs(
        potentialY.evaluate({ x, y }) -
          evaluate("x^2+y*cos(pi*y^2/2)", { x, y }),
      ) < 1e-12,
    );
  const r = (t) => [
    Math.exp(t ** 2 - t) - Math.cos(2 * Math.PI * t),
    2 * Math.sin((Math.PI * t ** 2) / 2) - t ** 9,
  ];
  assert.deepEqual(r(0), [0, 0]);
  assert.ok(Math.abs(r(1)[0]) < 1e-12);
  assert.equal(r(1)[1], 1);
  assert.equal(evaluate("sin(pi*0^2/2)/pi-sin(pi*1^2/2)/pi"), -1 / Math.PI);
});
