"use client";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Formula, MathText } from "./math-text";
import {
  savePractice,
  type PracticeStatus,
} from "@/lib/curriculum/progress-store";
import {
  deletePracticeDraft,
  readPracticeDraft,
  writePracticeDraft,
  type PracticeDraft,
} from "@/lib/curriculum/practice-drafts";
import type { PracticeExercise } from "@/lib/curriculum/learning";
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
  const progressId = exerciseId === "core" ? id : `${id}:${exerciseId}`;
  const [draft, setDraft] = useState<PracticeDraft>({
    answer: "",
    hintOpen: false,
    solutionOpen: false,
  });
  const [status, setStatus] = useState("");
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const restored = readPracticeDraft(id, exerciseId);
      setDraft(restored.draft);
      setStatus(
        restored.stored
          ? restored.draft.answer
            ? "Draft restored from this device."
            : ""
          : "Storage is unavailable. Your draft remains usable in this tab.",
      );
    });
    return () => {
      active = false;
    };
  }, [id, exerciseId]);
  function update(patch: Partial<PracticeDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setStatus(
      writePracticeDraft(id, next, exerciseId)
        ? "Draft saved on this device."
        : "Storage is unavailable. Your draft remains usable in this tab.",
    );
  }
  function clear() {
    setDraft({ answer: "", hintOpen: false, solutionOpen: false });
    setStatus(
      deletePracticeDraft(id, exerciseId)
        ? "This draft was deleted. Other progress remains saved."
        : "Storage is unavailable. This draft was cleared in this tab only.",
    );
  }
  function record(value: PracticeStatus) {
    try {
      savePractice(progressId, value);
      setStatus(
        `${value} saved on this device. This is your self-assessment, not an automatic grade.`,
      );
    } catch {
      setStatus(
        "Your browser could not save this self-assessment. You can still complete the exercise.",
      );
    }
  }
  return (
    <section className="lesson-practice" aria-labelledby={headingId}>
      <span className="label">TRANSFER · WITHOUT THE GRAPH</span>
      <h2 id={headingId}>Check your understanding</h2>
      <p>
        <MathText text={exercise.prompt} />
      </p>
      <label htmlFor={fieldId}>Your reasoning (saved on this device)</label>
      <Textarea
        id={fieldId}
        value={draft.answer}
        onChange={(event) => update({ answer: event.target.value })}
        placeholder="State the method, check its assumptions, and justify your answer."
      />
      <Button type="button" variant="outline" onClick={clear}>
        Delete this draft
      </Button>
      <details
        open={draft.hintOpen}
        onToggle={(event) => update({ hintOpen: event.currentTarget.open })}
      >
        <summary>First hint</summary>
        <p>
          <MathText text={exercise.hint} />
        </p>
      </details>
      <details
        open={draft.solutionOpen}
        onToggle={(event) => update({ solutionOpen: event.currentTarget.open })}
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
          <Button onClick={() => record("Needs practice")}>
            Needs practice
          </Button>
          <Button
            variant="outline"
            onClick={() => record("Can explain independently")}
          >
            I can explain it independently
          </Button>
        </div>
      </details>
      <p role="status">{status}</p>
    </section>
  );
}
