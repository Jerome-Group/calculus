"use client";
import { MathText } from "./math-text";
import { useSyncExternalStore } from "react";
import { concepts, type Concept } from "@/lib/curriculum";
import {
  subscribeProgress,
  progressSnapshot,
  resumeSnapshot,
  parseProgress,
  type PracticeRecord,
} from "@/lib/curriculum/progress-store";
import {
  pilotSnapshot,
  parsePilotProgress,
  type PilotRecord,
} from "@/lib/curriculum/pilot-progress";

export function summarizeStudyProgress(
  lessons: Pick<Concept, "id">[],
  records: Record<string, PracticeRecord>,
  pilots: Record<string, PilotRecord>,
  now = Date.now(),
) {
  const ids = new Set(lessons.map((lesson) => lesson.id));
  const practice = new Set<string>();
  let explainable = 0;
  let needsPractice = 0;
  let choices = 0;
  for (const [id, record] of Object.entries(records)) {
    const lessonId = id.split(":")[0];
    if (!ids.has(lessonId)) continue;
    if (record.status === "Needs practice") {
      needsPractice++;
      practice.add(lessonId);
    } else explainable++;
  }
  for (const [id, record] of Object.entries(pilots)) {
    if (!ids.has(id)) continue;
    choices += record.attempts.length;
    const latest = new Map<string, (typeof record.attempts)[number]>();
    for (const attempt of record.attempts) {
      const previous = latest.get(attempt.taskId);
      if (!previous || Date.parse(attempt.at) >= Date.parse(previous.at))
        latest.set(attempt.taskId, attempt);
    }
    if (
      [...latest.values()].some(
        (attempt) => !attempt.correct || attempt.support === "hint",
      ) ||
      (record.attempts.length > 0 && Date.parse(record.nextReview || "") <= now)
    )
      practice.add(id);
  }
  return { explainable, needsPractice, choices, practice };
}

export function StudyProgress({ open }: { open: (id: string) => void }) {
  const raw = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    () => "{}",
  );
  const pilotRaw = useSyncExternalStore(
    subscribeProgress,
    pilotSnapshot,
    () => "{}",
  );
  const last = useSyncExternalStore(
    subscribeProgress,
    resumeSnapshot,
    () => "",
  );
  const summary = summarizeStudyProgress(
    concepts,
    parseProgress(raw),
    parsePilotProgress(pilotRaw),
  );
  const practice = concepts.filter((concept) =>
    summary.practice.has(concept.id),
  );
  const resume = concepts.find((c) => c.id === last);
  return (
    <section className="study-progress" aria-label="Study on this device">
      <h2>Your study on this device</h2>
      <p>
        {summary.explainable} exercise self-assessments marked explainable ·{" "}
        {summary.needsPractice} marked for practice · {summary.choices} choice
        attempts recorded. These records do not establish mastery.
      </p>
      {resume && (
        <button onClick={() => open(resume.id)}>
          Resume: <MathText text={resume.title} />
        </button>
      )}
      {practice.length > 0 && (
        <details>
          <summary>Revisit practice ({practice.length})</summary>
          {practice.map((c) => (
            <button key={c.id} onClick={() => open(c.id)}>
              <MathText text={c.title} />
            </button>
          ))}
        </details>
      )}
    </section>
  );
}
