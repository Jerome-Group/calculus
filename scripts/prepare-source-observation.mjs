import { readFileSync, writeFileSync } from "node:fs";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    "Usage: node scripts/prepare-source-observation.mjs drive-files.json output.json",
  );
  process.exit(2);
}
const raw = JSON.parse(readFileSync(input, "utf8"));
const files = Array.isArray(raw) ? raw : raw.files;
if (!Array.isArray(files)) throw new Error("Expected a Drive files array");
const observation = {
  observedAt: new Date().toISOString(),
  files: files.map((file) => ({
    driveFileId: file.driveFileId || file.id,
    modifiedAt: file.modifiedAt || file.modifiedTime || file.modified_time,
    ...(file.sha256 || file.sha256Checksum
      ? { sha256: file.sha256 || file.sha256Checksum }
      : {}),
  })),
};
if (observation.files.some((file) => !file.driveFileId || !file.modifiedAt))
  throw new Error("Every Drive file needs id and modified time");
writeFileSync(output, `${JSON.stringify(observation, null, 2)}\n`);
