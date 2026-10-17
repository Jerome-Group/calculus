import {
  assessmentSchema,
  attemptSchema,
  lessonIdSchema,
  mutableKeySchema,
  parseMutableValue,
  type ImportItem,
  type MutableStudyKey,
} from "./model";
import { concepts } from "../curriculum";
import { learningGuides } from "../curriculum/learning";
import { pilotLessons } from "../curriculum/learning-modes";
import { inlineExperimentCatalog } from "../curriculum/inline-experiments";

export type LegacyPreview = {
  items: ImportItem[];
  rejected: string[];
  sources: number;
};
const MAX_SOURCE_BYTES = 1048576;
const MAX_BUNDLE_BYTES = 2097152;
const MAX_ITEMS = 10000;
const digest = async (text: string) =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
async function legacyAttemptId(
  canonicalAttempt: string,
  duplicateOrdinal: number,
) {
  const hex = await digest(`${canonicalAttempt}:${duplicateOrdinal}`);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
function object(raw: string): Record<string, unknown> {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected records");
  return Object.fromEntries(Object.entries(value));
}
export async function previewLegacy(
  storage: Pick<Storage, "getItem">,
): Promise<LegacyPreview> {
  const sources: [string, string][] = [];
  const rejected: string[] = [];
  let bytes = 0;
  let unavailable = false;
  function source(key: string) {
    if (unavailable) return;
    try {
      const raw = storage.getItem(key);
      if (raw === null) return;
      const size = new TextEncoder().encode(raw).byteLength;
      if (size > MAX_SOURCE_BYTES || bytes + size > MAX_BUNDLE_BYTES) {
        rejected.push(
          `${key}: exceeds import preview limit. Source preserved.`,
        );
        return;
      }
      bytes += size;
      sources.push([key, raw]);
    } catch {
      unavailable = true;
      rejected.push(
        "Device storage is unavailable. Source data was not changed.",
      );
    }
  }
  source("calculus-pilot-progress-v2");
  source("calculus-practice");
  source("calculus-last-lesson");
  for (const { id: lessonId } of concepts) {
    for (const exerciseId of [
      "core",
      ...(learningGuides[lessonId]?.exercises?.map(({ id }) => id) ?? []),
    ])
      source(`calculus-practice-draft:v1:${lessonId}:${exerciseId}`);
    for (const task of pilotLessons[lessonId]?.practice ?? [])
      source(`calculus-pilot-draft:v1:${lessonId}:${task.id}`);
    for (const experiment of inlineExperimentCatalog(lessonId))
      for (const parameter of experiment.parameters)
        source(
          `calculus:inline-experiment:v1:${lessonId}:${experiment.id}:${parameter}`,
        );
  }
  const items: ImportItem[] = [];
  function mutable(key: MutableStudyKey, value: unknown) {
    const parsedKey = mutableKeySchema.parse(key);
    const parsed = parseMutableValue(parsedKey, value);
    if (parsed === null) throw new Error("Empty value");
    items.push({ kind: "mutable", key: parsedKey, value: parsed });
  }
  function boundedEntries(raw: string, key: string) {
    const entries = Object.entries(object(raw));
    if (entries.length > MAX_ITEMS)
      rejected.push(
        `${key}: preview record limit reached. Extra source entries remain unexamined and preserved.`,
      );
    return entries.slice(0, MAX_ITEMS);
  }
  for (const [key, raw] of sources) {
    try {
      if (key === "calculus-practice") {
        for (const [id, value] of boundedEntries(raw, key)) {
          try {
            if (id.split(":").length > 2)
              throw new Error("Invalid assessment key");
            const [lessonId, exerciseId = "core"] = id.split(":");
            const record = object(JSON.stringify(value));
            const assessment = assessmentSchema.parse({
              ...record,
              date:
                typeof record.date === "string"
                  ? new Date(record.date).toISOString()
                  : record.date,
            });
            mutable({ kind: "assessment", lessonId, exerciseId }, assessment);
            if (pilotLessons[lessonId] && exerciseId === "core")
              mutable(
                { kind: "confidence", lessonId },
                assessment.status === "Can explain independently"
                  ? "confident"
                  : "unsure",
              );
          } catch {
            rejected.push(`${key}:${id}: invalid self-assessment`);
          }
        }
      } else if (key === "calculus-pilot-progress-v2") {
        for (const [lessonId, value] of boundedEntries(raw, key)) {
          try {
            const record = object(JSON.stringify(value));
            if (record.confidence !== undefined) {
              try {
                mutable({ kind: "confidence", lessonId }, record.confidence);
              } catch {
                rejected.push(`${key}:${lessonId}: invalid confidence`);
              }
            }
            if (!Array.isArray(record.attempts))
              throw new Error("Invalid attempts");
            const duplicates = new Map<string, number>();
            for (const [index, attempt] of record.attempts
              .slice(0, MAX_ITEMS)
              .entries()) {
              try {
                const entry = object(JSON.stringify(attempt));
                const normalized = attemptSchema.parse({
                  ...entry,
                  id: "00000000-0000-5000-a000-000000000000",
                  lessonId,
                  source: "legacy",
                  at:
                    typeof entry.at === "string"
                      ? new Date(entry.at).toISOString()
                      : entry.at,
                });
                const canonical = JSON.stringify(normalized);
                const ordinal = duplicates.get(canonical) ?? 0;
                duplicates.set(canonical, ordinal + 1);
                items.push({
                  kind: "attempt",
                  value: {
                    ...normalized,
                    id: await legacyAttemptId(canonical, ordinal),
                  },
                });
              } catch {
                rejected.push(`${key}:${lessonId}:${index}: invalid attempt`);
              }
            }
            if (record.attempts.length > MAX_ITEMS)
              rejected.push(
                `${key}:${lessonId}: excess attempts. Source preserved.`,
              );
          } catch {
            rejected.push(`${key}:${lessonId}: invalid pilot record`);
          }
        }
      } else if (key === "calculus-last-lesson")
        mutable({ kind: "resume" }, { lessonId: lessonIdSchema.parse(raw) });
      else {
        const parts = key.split(":");
        if (key.startsWith("calculus-practice-draft:"))
          mutable(
            {
              kind: "practice-draft",
              lessonId: parts[2],
              exerciseId: parts[3],
            },
            JSON.parse(raw),
          );
        else if (key.startsWith("calculus-pilot-draft:"))
          mutable(
            { kind: "pilot-draft", lessonId: parts[2], taskId: parts[3] },
            JSON.parse(raw),
          );
        else
          mutable(
            {
              kind: "inline-control",
              lessonId: parts[3],
              experimentId: parts[4],
              parameter: parts[5] as "value" | "radius" | "angle",
            },
            Number(raw),
          );
      }
    } catch {
      rejected.push(`${key}: invalid source. Source preserved.`);
    }
  }
  if (items.length > MAX_ITEMS)
    rejected.push(
      "Import preview item limit reached. Excess source data preserved.",
    );
  return {
    items: items.slice(0, MAX_ITEMS),
    rejected,
    sources: sources.length,
  };
}

export function legacyChunks(items: ImportItem[]) {
  const chunks: ImportItem[][] = [];
  let chunk: ImportItem[] = [];
  let bytes = 0;
  for (const item of items) {
    const size = new TextEncoder().encode(JSON.stringify(item)).byteLength + 1;
    if (chunk.length && (chunk.length === 200 || bytes + size > 240000)) {
      chunks.push(chunk);
      chunk = [];
      bytes = 0;
    }
    chunk.push(item);
    bytes += size;
  }
  if (chunk.length) chunks.push(chunk);
  return chunks;
}
