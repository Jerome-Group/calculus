import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const auditUrl = new URL(
  "../docs/audits/archive-variant-review-2026-09-24.json",
  import.meta.url,
);
const audit = JSON.parse(await readFile(auditUrl, "utf8"));
const records = [...audit.tutorialSources, ...audit.archiveSources];
const byId = new Map(records.map((record) => [record.driveId, record]));

const manifestUrl = new URL(
  "../lib/curriculum/source-manifest.json",
  import.meta.url,
);
const sourceManifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const sourceManifestByDriveId = new Map(
  sourceManifest.map((entry) => [entry.driveFileId, entry]),
);
const sourcesUrl = new URL("../lib/curriculum/sources.json", import.meta.url);
const sources = JSON.parse(await readFile(sourcesUrl, "utf8"));

const expectedSearches = {
  "MH1100 tutorial PDFs": 36,
  "MH1101 tutorial PDFs": 36,
  "MH2100 tutorial PDFs": 53,
  "MH1100 Final PDFs": 28,
  "MH1100 Midterm PDFs": 10,
  "MH1100 Review PDFs": 3,
  "MH1101 Final PDFs": 31,
  "MH1101 Midterm PDFs": 21,
  "MH1101 Review PDFs": 0,
  "MH2100 Final PDFs": 21,
  "MH2100 Midterm PDFs": 26,
  "MH2100 Review PDFs": 1,
};

test("archive audit records every bounded Drive result once with provenance", () => {
  assert.deepEqual(
    Object.fromEntries(
      audit.scope.searches.map(({ label, returnedIds }) => [
        label,
        returnedIds,
      ]),
    ),
    expectedSearches,
  );
  assert.ok(
    audit.scope.searches.every(({ moreResults }) => moreResults === false),
  );
  assert.ok(
    audit.scope.searches.every(({ criteria }) =>
      criteria.startsWith("mimeType = 'application/pdf' AND name contains "),
    ),
  );
  assert.equal(audit.scope.tutorialFileCount, 125);
  assert.equal(audit.scope.tutorialPageCount, 504);
  assert.equal(audit.scope.reviewAndExamFileCount, 137);
  assert.equal(audit.scope.reviewAndExamPageCount, 1000);
  assert.equal(audit.scope.publicUniqueDriveIdCount, 262);
  assert.equal(audit.scope.searchUniqueDriveIdCount, 263);
  assert.equal(audit.scope.privateArchiveRecordsExcluded, 1);
  assert.equal(audit.scope.newFinalMidtermPdfCount, 87);
  assert.equal(audit.scope.newFinalMidtermPageCount, 547);
  assert.equal(audit.scope.totalReviewedPageCount, 1504);
  assert.equal(audit.scope.assessmentSearchHitCount, 141);
  assert.equal(audit.scope.duplicateSearchHitIds, 3);
  assert.deepEqual(audit.scope.byTutorialCourse, {
    MH1100: 36,
    MH1101: 36,
    MH2100: 53,
  });
  assert.deepEqual(audit.scope.byReviewExamCourse, {
    MH1100: 39,
    MH1101: 52,
    MH2100: 47,
  });
  assert.equal(audit.archiveSources.length, 137);
  assert.equal(records.length, 262);
  assert.equal(byId.size, 262);
  assert.equal(
    records.length + audit.scope.privateArchiveRecordsExcluded,
    audit.scope.searchUniqueDriveIdCount,
  );
  assert.equal(
    records.reduce((total, record) => total + record.pageCount, 0),
    1504,
  );
  const publicMh1101Records = audit.archiveSources.filter(
    (record) => record.course === "MH1101",
  );
  const publicMh1101Hashes = new Set(
    publicMh1101Records.map((record) => record.sha256),
  );
  assert.equal(publicMh1101Records.length, 51);
  assert.equal(
    publicMh1101Hashes.size,
    audit.scope.mh1101Evidence.uniqueWholeFileSha256,
  );

  for (const record of records) {
    assert.match(record.driveId, /^[A-Za-z0-9_-]+$/);
    assert.ok(record.title);
    assert.ok(["MH1100", "MH1101", "MH2100"].includes(record.course));
    assert.ok(Number.isInteger(record.bytes) && record.bytes > 0);
    assert.ok(Number.isInteger(record.pageCount) && record.pageCount > 0);
    assert.match(record.sha256, /^[a-f0-9]{64}$/);
    assert.ok(
      ["duplicate", "elaboration", "distinct_task", "unresolved"].includes(
        record.classification,
      ),
    );
    assert.ok(record.pageFindings.length > 0);
    for (const finding of record.pageFindings) {
      assert.ok(finding.pdfPages);
      assert.ok(finding.evidence);
      assert.ok(
        ["duplicate", "elaboration", "distinct_task", "unresolved"].includes(
          finding.classification,
        ),
      );
      for (const relatedId of finding.relatedDriveIds ?? []) {
        assert.ok(
          byId.has(relatedId),
          `${record.driveId} references ${relatedId}`,
        );
      }
    }
    for (const relatedId of record.relatedDriveIds ?? []) {
      assert.ok(
        byId.has(relatedId),
        `${record.driveId} references ${relatedId}`,
      );
    }
    if (record.createdAt)
      assert.ok(Number.isFinite(Date.parse(record.createdAt)));
    if (record.updatedAt)
      assert.ok(Number.isFinite(Date.parse(record.updatedAt)));
  }
});

test("archive duplicate and annotation claims match their recorded evidence", () => {
  const exactQuestionPair = audit.findings.find(
    ({ kind, driveIds }) =>
      kind === "exact_duplicate" &&
      driveIds.includes("1Da7drCwo1dqDmnK-S-zZmW7Z5xlr9On6"),
  );
  assert.deepEqual(exactQuestionPair.driveIds, [
    "1Da7drCwo1dqDmnK-S-zZmW7Z5xlr9On6",
    "1L5CywNwUC7PhPEUE0N4kfkm71dLv34Z3",
  ]);
  const [exactFirst, exactSecond] = exactQuestionPair.driveIds.map((id) =>
    byId.get(id),
  );
  assert.equal(exactFirst.sha256, exactSecond.sha256);
  assert.equal(exactFirst.bytes, exactSecond.bytes);

  const byteIdenticalReviewRows = audit.archiveSources.filter(
    ({ comparisonBasis }) => comparisonBasis === "byte_identical",
  );
  assert.equal(byteIdenticalReviewRows.length, 46);
  const exactReviewPairs = new Set(
    byteIdenticalReviewRows.map((record) =>
      [record.driveId, ...record.relatedDriveIds].sort().join("|"),
    ),
  );
  assert.equal(exactReviewPairs.size, 23);
  for (const record of byteIdenticalReviewRows) {
    const peer = byId.get(record.relatedDriveIds[0]);
    assert.equal(record.sha256, peer.sha256);
    assert.equal(record.bytes, peer.bytes);
    assert.equal(record.pageCount, peer.pageCount);
  }

  const mh1100RenderedAliases = audit.findings.filter(
    ({ kind, driveIds }) =>
      kind === "rendered_content_equivalent" &&
      driveIds.some((id) => byId.get(id)?.course === "MH1100"),
  );
  assert.equal(mh1100RenderedAliases.length, 13);
  const mh1101Attempts = audit.findings.filter(
    ({ kind }) => kind === "annotated_assessment_variant",
  );
  assert.equal(mh1101Attempts.length, 4);
  assert.equal(
    audit.archiveSources.filter(
      ({ category }) => category === "MH1101 midterm annotated attempt",
    ).length,
    4,
  );
  assert.ok(
    mh1101Attempts.every(
      (finding) =>
        /handwritten work/.test(finding.detail) &&
        /not transcribed/.test(finding.detail) &&
        /unreviewed/.test(finding.detail),
    ),
  );

  const slopeFinding = audit.findings.find(({ kind }) => kind === "page_match");
  assert.deepEqual(slopeFinding.driveIds, [
    "1kFOpdES0CdwkhQEdgyCjQm-Gjan6lr51",
    "1HoYWv0Sj4HZoJqQY0cgxpAzR3mxkciDo",
  ]);
  assert.equal(slopeFinding.pages, "p.1, Problem 5");
  assert.match(slopeFinding.detail, /both rendered copies show slope −1/i);

  const unreadable = byId.get("1C2i20jDNszt0OaCEERad7RiW0jAuNaZx");
  assert.equal(unreadable.classification, "unresolved");
  assert.equal(unreadable.pageFindings[0].pdfPages, "1");

  const mh1100ScannedSolutions = [
    ["1INwsSbHe6U4D35KojQXqn64BEk7d0NGF", "1-13"],
    ["1DmnbIdpY8fodolPQgShhCpqViWVDw7RK", "1-8"],
  ];
  for (const [id, pages] of mh1100ScannedSolutions) {
    const record = byId.get(id);
    assert.equal(record.classification, "unresolved");
    assert.ok(
      record.pageFindings.some(
        (finding) =>
          finding.pdfPages === pages && finding.classification === "unresolved",
      ),
    );
  }

  const renderedReviewPair = audit.archiveSources.filter(
    ({ contentFamily }) => contentFamily === "mh1100-final-review",
  );
  assert.equal(renderedReviewPair.length, 2);
  assert.notEqual(renderedReviewPair[0].sha256, renderedReviewPair[1].sha256);
  assert.ok(
    renderedReviewPair.every(
      ({ comparisonBasis }) =>
        comparisonBasis === "rendered_content_equivalent",
    ),
  );
});

test("archive catalog reconciliation preserves the existing source boundary", () => {
  const lectureReview = byId.get("10zC5vlK8Muh2OE8LEkAprYheJvQW-efX");
  assert.equal(lectureReview.sourceManifest.status, "canonical");
  assert.equal(lectureReview.sourceManifest.sha256Matches, true);
  const manifestEntry = sourceManifestByDriveId.get(lectureReview.driveId);
  const catalogEntry = Object.values(sources).find(({ url }) =>
    url?.includes(lectureReview.driveId),
  );
  assert.ok(manifestEntry);
  assert.ok(catalogEntry);
  assert.equal(manifestEntry.sha256, lectureReview.sha256);
  assert.equal(catalogEntry.sha256, lectureReview.sha256);

  for (const id of [
    "1IVDuUQR-MDdjviuptmY71AbFZ6Y4Xgk9",
    "1QnB7YwCbNFJtKflD5ML3bDQa1YV5VMiF",
  ]) {
    const record = byId.get(id);
    assert.equal(record.sourceManifest.status, "personal_reference");
    assert.deepEqual(record.sourceManifest.affectedConcepts, []);
    assert.equal(sourceManifestByDriveId.get(id).status, "personal_reference");
  }

  const keyConceptReview = byId.get("1FhqVQSJ8uftDsvgZZbSJThnBh5k1-U91");
  assert.equal(keyConceptReview.classification, "distinct_task");
  assert.match(
    keyConceptReview.evidence,
    /no public route or outcome mapping/i,
  );
});

test("archive metadata contains no source text, learner details, or local paths", () => {
  assert.equal(audit.scope.privatePdfBytesInRepository, false);
  assert.equal(audit.scope.sourcePageTextInRepository, false);
  assert.equal(audit.scope.personalGradeOrLearnerWorkInRepository, false);
  assert.equal(audit.scope.privateArchiveRecordsExcluded, 1);
  assert.match(
    audit.method.privacy,
    /excluded from row-level public metadata/i,
  );
  const serialized = JSON.stringify(audit);
  assert.doesNotMatch(
    serialized,
    /"(?:excerpt|textExcerpt|ocrText|transcript|textContent|pageText|rawPdf|renderPath|localPath|filePath)"\s*:/i,
  );
  assert.doesNotMatch(
    serialized,
    /\/tmp\/issue157|\/private\/tmp\/issue157|\/private\/tmp\/calculus-review/i,
  );
  assert.doesNotMatch(serialized, /metadata_only_private_feedback_excluded/i);
  assert.match(serialized, /only an aggregate count is retained/i);

  const forbiddenField =
    /^(?:learner|student|personalGrade|gradeFeedback|score|feedback|handwrittenWork|ocrText|excerpt|transcript|rawPdf|renderPath|localPath|filePath)$/i;
  const checkFieldNames = (value) => {
    if (Array.isArray(value)) return value.forEach(checkFieldNames);
    if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        assert.doesNotMatch(key, forbiddenField);
        checkFieldNames(nested);
      }
    }
  };
  checkFieldNames(audit);
});
