import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guides = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    "utf8",
  ),
);
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("fixed region and axis give the same shell and washer volume", () => {
  const washers = Math.PI * (1 / 3 - 1 / 5);
  const shells = 2 * Math.PI * (2 / 5 - 1 / 3);
  near(washers, shells);
  near(shells, (2 * Math.PI) / 15);
  assert.ok(
    guides["cylindrical-shells"].sections.some((section) =>
      section.text.includes("SAME region"),
    ),
  );
  assert.ok(
    guides["cylindrical-shells"].exercise.prompt.includes(
      "both shells and perpendicular disks",
    ),
  );
});

test("noncircular cross-section transfer uses triangle area", () => {
  const squaredWidthIntegral = 1 / 3 - 1 / 2 + 1 / 5;
  near((Math.sqrt(3) / 4) * squaredWidthIntegral, Math.sqrt(3) / 120);
  assert.ok(
    guides["disk-washer-volumes"].exercise.prompt.includes(
      "equilateral triangles",
    ),
  );
});

test("trigonometric branches and staged algebra give consistent answers", () => {
  near(Math.acosh(2), Math.log(2 + Math.sqrt(3)));
  near(1 / (9 * Math.sqrt(2)), Math.sqrt(2) / 18);
  near(Math.atan(1) - 1 / 2, Math.PI / 4 - 1 / 2);
  for (const x of [0.2, 2]) {
    const decomposed = 3 / x - 3 / (x + 1) - 1 / (x + 1) ** 2;
    near(decomposed, (2 * x + 3) / (x * (x + 1) ** 2));
  }
  assert.ok(
    guides["trigonometric-substitution"].exercise.prompt.includes("branches"),
  );
  assert.ok(
    guides["integration-by-parts"].exercise.prompt.includes(
      "Choose and justify",
    ),
  );
  assert.ok(
    guides["partial-fractions"].exercise.prompt.includes(
      "first algebraic step",
    ),
  );
});
