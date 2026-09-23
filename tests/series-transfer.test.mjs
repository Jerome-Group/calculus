import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guides = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    "utf8",
  ),
);

test("logarithmic benchmark and mixed selection are present in the taught route", () => {
  assert.ok(
    guides["integral-test"].sections.some(
      (section) =>
        section.text.includes("$p>1$") &&
        section.text.replaceAll("$", "").includes(String.raw`u=\log x`),
    ),
  );
  const mixed = guides["ratio-root-tests"].exercise;
  assert.ok(mixed.prompt.includes("Choose a test before calculating"));
  assert.ok(
    mixed.solution.includes("$x=1$") && mixed.solution.includes("$x=3$"),
  );
  assert.ok(
    mixed.rubric.some((line) => line.includes("endpoints independently")),
  );
});

test("nonzero-center Taylor degree and error guarantee are mathematically consistent", () => {
  const t = 0.2;
  const quadraticBound = t ** 3 / 3;
  const cubicBound = t ** 4 / 4;
  const cubic = t - t ** 2 / 2 + t ** 3 / 3;
  assert.ok(quadraticBound > 0.001);
  assert.ok(cubicBound < 0.001);
  assert.ok(Math.abs(Math.log1p(t) - cubic) <= cubicBound);
  const exercise = guides["taylor-series"].exercise;
  assert.ok(exercise.prompt.includes("$a=1$"));
  assert.ok(exercise.solution.includes(String.raw`$R_{n}\to 0$`));
});
