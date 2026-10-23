"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Formula, MathText } from "./math-text";
import { useStudyRecord, StudySaveStatus } from "./study-records";
import type { StudyValues } from "@/lib/study/model";
import {
  learningGuide,
  type PracticeExercise,
} from "@/lib/curriculum/learning";
import type { Concept } from "@/lib/curriculum";

export function LessonExercises({ concept }: { concept: Concept }) {
  const guide = learningGuide(concept);
  return (
    <>
      {[{ id: "core", ...guide.exercise }, ...(guide.exercises ?? [])].map(
        (exercise) => (
          <LessonPractice
            key={`${concept.id}:${exercise.id}`}
            id={concept.id}
            exerciseId={exercise.id}
            exercise={exercise}
          />
        ),
      )}
    </>
  );
}

export function LessonPractice({
  id,
  exerciseId = "core",
  exercise,
}: {
  id: string;
  exerciseId?: string;
  exercise: PracticeExercise;
}) {
  const fieldId = `answer-${id}-${exerciseId}`;
  const headingId = `practice-${id}-${exerciseId}`;
  const record = useStudyRecord({
    kind: "practice-draft",
    lessonId: id,
    exerciseId,
  });
  const assessment = useStudyRecord({
    kind: "assessment",
    lessonId: id,
    exerciseId,
  });
  const draft = record.value ?? {
    answer: "",
    hintOpen: false,
    solutionOpen: false,
  };
  function update(patch: Partial<StudyValues["practice-draft"]>) {
    if (record.persistence.kind !== "loading")
      void record.save({ ...draft, ...patch });
  }
  return (
    <section className="lesson-practice" aria-labelledby={headingId}>
      <span className="label">TRANSFER · WITHOUT THE GRAPH</span>
      <h2 id={headingId}>Check your understanding</h2>
      <p>
        <MathText text={exercise.prompt} />
      </p>
      <label htmlFor={fieldId}>Your reasoning</label>
      <Textarea
        id={fieldId}
        value={draft.answer}
        disabled={record.persistence.kind === "loading"}
        maxLength={16384}
        onChange={(event) => update({ answer: event.target.value })}
        placeholder="State the method, check its assumptions, and justify your answer."
      />
      <Button
        type="button"
        variant="outline"
        disabled={record.persistence.kind === "loading"}
        onClick={() => void record.clear()}
      >
        Delete this draft
      </Button>
      <StudySaveStatus record={record} />
      <details
        open={draft.hintOpen}
        onToggle={(event) => {
          if (event.currentTarget.open !== draft.hintOpen)
            update({ hintOpen: event.currentTarget.open });
        }}
      >
        <summary>First hint</summary>
        <p>
          <MathText text={exercise.hint} />
        </p>
      </details>
      <details
        open={draft.solutionOpen}
        onToggle={(event) => {
          if (event.currentTarget.open !== draft.solutionOpen)
            update({ solutionOpen: event.currentTarget.open });
        }}
      >
        <summary>Compare with a solution</summary>
        {exercise.solutionTex && (
          <Formula block>{exercise.solutionTex}</Formula>
        )}
        <p>
          <MathText text={exercise.solution} />
        </p>
        <h3>Self-check</h3>
        <ul>
          {exercise.rubric.map((item) => (
            <li key={item}>
              <MathText text={item} />
            </li>
          ))}
        </ul>
        <div className="practice-actions">
          <Button
            disabled={assessment.persistence.kind === "loading"}
            onClick={() =>
              void assessment.save({
                status: "Needs practice",
                date: new Date().toISOString(),
              })
            }
          >
            Needs practice
          </Button>
          <Button
            variant="outline"
            disabled={assessment.persistence.kind === "loading"}
            onClick={() =>
              void assessment.save({
                status: "Can explain independently",
                date: new Date().toISOString(),
              })
            }
          >
            I can explain it independently
          </Button>
        </div>
        {assessment.value && (
          <p>
            {assessment.value.status}. This is your self-assessment, not an
            automatic grade.
          </p>
        )}
        <StudySaveStatus record={assessment} />
      </details>
    </section>
  );
}
