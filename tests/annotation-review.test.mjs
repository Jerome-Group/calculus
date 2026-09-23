import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const manifest = read("../lib/curriculum/source-manifest.json");
const review = read("../docs/audits/annotation-review-2026-09-23.json");

test("bounded annotation review accounts for each linked slide and annotated lecture", () => {
  const expected = manifest.filter((file) =>
    ["slide", "annotated_slide", "annotated_lecture"].includes(file.kind),
  );
  assert.equal(review.files.length, expected.length);
  assert.deepEqual(
    new Set(review.files.map((file) => file.source_id)),
    new Set(expected.map((file) => file.sourceId)),
  );
  for (const file of review.files) {
    assert.ok(
      manifest.some((source) => source.sourceId === file.compared_with),
    );
    assert.equal(file.reviewed_for_atomic_outcomes, false);
    assert.ok(file.remaining_review);
  }
});

test("image-only annotated lectures remain unresolved", () => {
  for (const number of ["02", "03", "04", "05"]) {
    const file = review.files.find(
      (entry) => entry.source_id === `MH2100_Lecture_${number}_Annotated_PDF`,
    );
    assert.equal(file?.classification, "unresolved");
    assert.equal(file?.confidence, "none");
  }
});
