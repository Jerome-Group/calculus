import { progressEvent, type PracticeRecord } from "./progress-store";
import type { SupportLevel } from "./learning-modes";

const key = "calculus-pilot-progress-v2";
export type PilotAttempt = {
  taskId: string;
  kind: "recognition" | "setup" | "transfer";
  correct: boolean;
  support: SupportLevel;
  errorCode?: string;
  at: string;
};
export type PilotRecord = {
  attempts: PilotAttempt[];
  confidence?: "unsure" | "confident";
  nextReview?: string;
};

export function parsePilotProgress(raw: string): Record<string, PilotRecord> {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => {
        const record = value as PilotRecord | null;
        return (
          record &&
          Array.isArray(record.attempts) &&
          record.attempts.every(
            (attempt) =>
              attempt &&
              typeof attempt.taskId === "string" &&
              ["recognition", "setup", "transfer"].includes(attempt.kind) &&
              typeof attempt.correct === "boolean" &&
              ["none", "hint"].includes(attempt.support) &&
              Number.isFinite(Date.parse(attempt.at)),
          )
        );
      }),
    ) as Record<string, PilotRecord>;
  } catch {
    return {};
  }
}

export function pilotSnapshot() {
  try {
    return localStorage.getItem(key) || "{}";
  } catch {
    return "{}";
  }
}

function save(id: string, record: PilotRecord) {
  localStorage.setItem(
    key,
    JSON.stringify({
      ...parsePilotProgress(pilotSnapshot()),
      [id]: record,
    }),
  );
  window.dispatchEvent(new Event(progressEvent));
}

export function savePilotAttempt(id: string, attempt: PilotAttempt) {
  const previous = parsePilotProgress(pilotSnapshot())[id];
  const days = attempt.correct && attempt.support === "none" ? 3 : 1;
  const nextReview = new Date(
    Date.parse(attempt.at) + days * 86400000,
  ).toISOString();
  save(id, {
    ...previous,
    attempts: [...(previous?.attempts || []), attempt],
    nextReview,
  });
}

export function savePilotConfidence(
  id: string,
  confidence: PilotRecord["confidence"],
) {
  const previous = parsePilotProgress(pilotSnapshot())[id];
  save(id, { ...previous, attempts: previous?.attempts || [], confidence });
}

export function legacyConfidence(
  record?: PracticeRecord,
): PilotRecord["confidence"] {
  if (!record) return undefined;
  return record.status === "Can explain independently" ? "confident" : "unsure";
}

export function pilotMastery(record?: PilotRecord) {
  const independent =
    record?.attempts.filter(
      (attempt) =>
        attempt.kind === "transfer" &&
        attempt.correct &&
        attempt.support === "none",
    ) || [];
  return independent.some((first, index) =>
    independent
      .slice(index + 1)
      .some((later) => Date.parse(later.at) - Date.parse(first.at) >= 86400000),
  );
}
