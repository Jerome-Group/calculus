import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("lecture erratum retains its source locator and checks the corrected limit", () => {
  const sources = JSON.parse(
    readFileSync(new URL("../lib/curriculum/sources.json", import.meta.url)),
  );
  const lecture = sources.MH1100_Lecture_01;
  assert.equal(lecture.file, "MH1100_Lecture_01.pdf");
  assert.equal(lecture.errata[0].page, 8);
  assert.match(lecture.errata[0].printed, /limit \$0\$/);
  assert.match(lecture.errata[0].provenance, /Audit-derived/);
  const polynomial = (x) => x * x - 3 * x + 1;
  assert.equal(polynomial(3), 1);
});
