"use client";
import { MathText } from "./math-text";
import { concepts, type Concept } from "@/lib/curriculum";
import type { PracticeRecord, PilotRecord } from "@/lib/study/model";
import { useStudyAccount } from "./study-records";

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
  const account = useStudyAccount();
  const summary = account.overview;
  const practice = concepts.filter((concept) =>
    summary.practice.includes(concept.id),
  );
  const resume = concepts.find((c) => c.id === summary.resume);
  return (
    <section className="study-progress" aria-label="Your study">
      <h2>Your account study</h2>
      {account.overviewError && (
        <p role="status">
          {account.overviewError}{" "}
          <button type="button" onClick={() => void account.refresh()}>
            Retry summary
          </button>
        </p>
      )}
      {!account.user && (
        <p>
          Sign in to save study across sessions and devices. New guest work
          stays in this tab.
        </p>
      )}
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
