import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const manifest = read("../lib/curriculum/source-manifest.json");
const review = read("../docs/audits/annotation-review-2026-09-23.json");
const currentReview = read("../docs/audits/annotation-review-2026-10-22.json");

test("dated annotation reviews account for each linked slide and annotated lecture", () => {
  const expected = manifest.filter((file) =>
    ["slide", "annotated_slide", "annotated_lecture"].includes(file.kind),
  );
  assert.deepEqual(
    new Set(
      [...review.files, ...currentReview.files].map((file) => file.source_id),
    ),
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

test("current annotation review identifies the reviewed source revisions", () => {
  assert.equal(currentReview.files.length, 4);
  for (const file of currentReview.files) {
    const entry = manifest.find((source) => source.sourceId === file.source_id);
    assert.equal(file.drive_file_id, entry.driveFileId);
    assert.equal(file.modified_at, entry.modifiedAt);
    assert.equal(file.sha256, entry.sha256);
    assert.equal(file.compared_with, entry.canonicalParent);
    assert.equal(file.reviewed_for_atomic_outcomes, true);
    assert.equal(file.classification, "already_covered");
    assert.ok(file.affected_concepts.length);
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
