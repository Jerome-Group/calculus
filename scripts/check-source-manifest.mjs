import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/**
 * @typedef {object} SourceManifestEntry
 * @property {string} sourceId
 * @property {'MH1100' | 'MH1101' | 'MH2100'} course
 * @property {string} driveFileId
 * @property {string} title
 * @property {'lecture' | 'annotated_lecture' | 'chapter_note' | 'slide' | 'annotated_slide' | 'textbook' | 'personal_reference' | 'supplement'} kind
 * @property {'canonical' | 'annotated_variant' | 'personal_reference' | 'duplicate' | 'superseded' | 'unreviewed'} status
 * @property {string} modifiedAt
 * @property {string} [sha256]
 * @property {string} [canonicalParent]
 * @property {string} [reviewedAt]
 * @property {string} [reviewer]
 * @property {string[]} affectedConcepts
 * @property {'adopted' | 'already_covered' | 'presentation_only' | 'needs_review' | 'not_canonical'} [coverageDiff]
 * @property {string} [note]
 */

/** @param {SourceManifestEntry[]} entries */
export function validateSourceManifest(
  entries,
  canonicalSources,
  current,
  baseline,
) {
  const errors = [];
  const kinds = new Set([
    "lecture",
    "annotated_lecture",
    "chapter_note",
    "slide",
    "annotated_slide",
    "textbook",
    "personal_reference",
    "supplement",
  ]);
  const statuses = new Set([
    "canonical",
    "annotated_variant",
    "personal_reference",
    "duplicate",
    "superseded",
    "unreviewed",
  ]);
  const outcomes = new Set([
    "adopted",
    "already_covered",
    "presentation_only",
    "needs_review",
    "not_canonical",
  ]);
  const entryIds = new Set();
  const driveIds = new Set();
  const canonicalIds = new Set(Object.keys(canonicalSources));
  for (const entry of entries) {
    const name = entry.sourceId || "unnamed source";
    if (entryIds.has(name)) errors.push(`Duplicate source ID: ${name}`);
    if (driveIds.has(entry.driveFileId))
      errors.push(`Duplicate Drive ID: ${name}`);
    entryIds.add(name);
    driveIds.add(entry.driveFileId);
    if (!/^(MH1100|MH1101|MH2100)$/.test(entry.course))
      errors.push(`Invalid course: ${name}`);
    if (
      !entry.driveFileId ||
      !entry.title ||
      !Number.isFinite(Date.parse(entry.modifiedAt))
    )
      errors.push(`Missing identity or date: ${name}`);
    if (entry.sha256 && !/^[a-f0-9]{64}$/.test(entry.sha256))
      errors.push(`Invalid hash: ${name}`);
    if (!kinds.has(entry.kind) || !statuses.has(entry.status))
      errors.push(`Invalid kind or status: ${name}`);
    if (
      !Array.isArray(entry.affectedConcepts) ||
      entry.affectedConcepts.some((id) => typeof id !== "string")
    )
      errors.push(`Missing concept list: ${name}`);
    if (entry.coverageDiff && !outcomes.has(entry.coverageDiff))
      errors.push(`Invalid review outcome: ${name}`);
    if (
      entry.coverageDiff &&
      (!Number.isFinite(Date.parse(entry.reviewedAt)) || !entry.reviewer)
    )
      errors.push(`Incomplete review: ${name}`);
    if (entry.status === "unreviewed" && entry.coverageDiff)
      errors.push(`Unreviewed source has review outcome: ${name}`);
    if (canonicalIds.has(name)) {
      const source = canonicalSources[name];
      if (
        entry.status !== "canonical" ||
        entry.sha256 !== source.sha256 ||
        entry.driveFileId !== source.url.match(/\/d\/([^/]+)/)?.[1]
      ) {
        errors.push(`Canonical ledger mismatch: ${name}`);
      }
      canonicalIds.delete(name);
    }
  }
  for (const id of canonicalIds) errors.push(`Canonical source absent: ${id}`);
  for (const entry of entries) {
    if (entry.canonicalParent && !entryIds.has(entry.canonicalParent))
      errors.push(`Missing canonical parent: ${entry.sourceId}`);
  }
  const observed = new Map();
  for (const file of current.files || []) {
    if (observed.has(file.driveFileId))
      errors.push(`Duplicate observation: ${file.driveFileId}`);
    observed.set(file.driveFileId, file);
    if (!driveIds.has(file.driveFileId))
      errors.push(`New Drive source: ${file.driveFileId}`);
  }
  const baselineById = new Map();
  for (const file of baseline.files || []) {
    if (baselineById.has(file.driveFileId))
      errors.push(`Duplicate baseline source: ${file.driveFileId}`);
    baselineById.set(file.driveFileId, file);
    if (!driveIds.has(file.driveFileId))
      errors.push(`Baseline source removed from manifest: ${file.driveFileId}`);
  }
  for (const entry of entries) {
    const file = observed.get(entry.driveFileId);
    if (!file) {
      errors.push(`Source missing from observation: ${entry.sourceId}`);
      continue;
    }
    const metadataOutOfSync =
      file.modifiedAt !== entry.modifiedAt ||
      (file.sha256 && file.sha256 !== entry.sha256);
    const previous = baselineById.get(entry.driveFileId);
    const changedSinceBaseline =
      !previous ||
      previous.modifiedAt !== entry.modifiedAt ||
      (previous.sha256 && previous.sha256 !== entry.sha256);
    if (metadataOutOfSync && entry.kind !== "personal_reference")
      errors.push(`Manifest metadata out of sync: ${entry.sourceId}`);
    if (
      (changedSinceBaseline || metadataOutOfSync) &&
      entry.kind !== "personal_reference" &&
      (!entry.coverageDiff ||
        entry.coverageDiff === "needs_review" ||
        !entry.reviewedAt ||
        Date.parse(entry.reviewedAt) <
          Math.max(Date.parse(file.modifiedAt), Date.parse(entry.modifiedAt)))
    ) {
      errors.push(`Changed source lacks current review: ${entry.sourceId}`);
    }
  }
  const observedAt = Date.parse(current.observedAt);
  if (!Number.isFinite(observedAt)) errors.push("Observation date is invalid");
  else if (Date.now() - observedAt > 30 * 86400000)
    errors.push(
      "Source observation is over 30 days old; refresh the Drive inventory",
    );
  return errors;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const manifest = readJson(`${root}lib/curriculum/source-manifest.json`);
  const sources = readJson(`${root}lib/curriculum/sources.json`);
  const observation = readJson(
    process.argv[2] || `${root}lib/curriculum/source-observation.json`,
  );
  const baseline = readJson(`${root}lib/curriculum/source-baseline.json`);
  const errors = validateSourceManifest(
    manifest,
    sources,
    observation,
    baseline,
  );
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(
      `Source sync passed: ${manifest.length} classified sources, observation ${observation.observedAt}`,
    );
  }
}
