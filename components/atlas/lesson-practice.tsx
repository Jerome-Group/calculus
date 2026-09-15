"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Formula, MathText } from "./math-text";
import {
  savePractice,
  type PracticeStatus,
} from "@/lib/curriculum/progress-store";
import type { LearningGuide } from "@/lib/curriculum/learning";
export function LessonPractice({
  id,
  exercise,
}: {
  id: string;
  exercise: LearningGuide["exercise"];
}) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  function record(value: PracticeStatus) {
    try {
      savePractice(id, value);
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
    <section className="lesson-practice" aria-labelledby={`practice-${id}`}>
      <span className="label">TRANSFER · WITHOUT THE GRAPH</span>
      <h2 id={`practice-${id}`}>Check your understanding</h2>
      <p>
        <MathText text={exercise.prompt} />
      </p>
      <label htmlFor={`answer-${id}`}>
        Your reasoning (kept here until you leave this lesson)
      </label>
      <Textarea
        id={`answer-${id}`}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="State the method, check its assumptions, and justify your answer."
      />
      <details>
        <summary>First hint</summary>
        <p>
          <MathText text={exercise.hint} />
        </p>
      </details>
      <details>
        <summary>Compare with a solution</summary>
        <Formula block>{exercise.solutionTex}</Formula>
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
