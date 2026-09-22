"use client";
import { useState } from "react";
import type {
  PilotLesson,
  PilotTask,
  SupportLevel,
} from "@/lib/curriculum/learning-modes";
import { savePilotAttempt } from "@/lib/curriculum/pilot-progress";
import { MathText } from "./math-text";

function Task({ lessonId, task }: { lessonId: string; task: PilotTask }) {
  const [choice, setChoice] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [support, setSupport] = useState<SupportLevel>("none");
  const [feedback, setFeedback] = useState("");
  function check() {
    const selected = task.choices.find((item) => item.id === choice);
    if (!selected) return;
    const correct = choice === task.answer;
    const message = correct
      ? task.explanation
      : task.feedback[selected.errorCode || ""] ||
        "Recheck the theorem conditions.";
    try {
      savePilotAttempt(lessonId, {
        taskId: task.id,
        kind: task.kind,
        correct,
        support,
        errorCode: selected.errorCode,
        at: new Date().toISOString(),
      });
      setFeedback(
        `${correct ? "Choice correct. Compare your reasoning:" : "Try again."} ${message}`,
      );
    } catch {
      setFeedback(`${message} Progress could not be saved on this device.`);
    }
  }
  return (
    <fieldset className="pilot-task">
      <legend>
        {task.kind.toUpperCase()} · {task.id.replaceAll("-", " ")}
      </legend>
      <p>
        <MathText text={task.prompt} />
      </p>
      {task.choices.map((item) => (
        <label key={item.id}>
          <input
            type="radio"
            name={`${lessonId}-${task.id}`}
            value={item.id}
            checked={choice === item.id}
            onChange={() => setChoice(item.id)}
          />
          <MathText text={item.text} />
        </label>
      ))}
      {task.kind !== "recognition" && (
        <>
          <label htmlFor={`${lessonId}-${task.id}-reasoning`}>
            Show your setup or derivation before choosing.
          </label>
          <textarea
            id={`${lessonId}-${task.id}-reasoning`}
            value={reasoning}
            onChange={(event) => setReasoning(event.target.value)}
            rows={3}
          />
        </>
      )}
      <div className="pilot-task-actions">
        <button type="button" onClick={() => setSupport("hint")}>
          Show hint
        </button>
        <button
          type="button"
          onClick={check}
          disabled={
            !choice || (task.kind !== "recognition" && !reasoning.trim())
          }
        >
          Check answer
        </button>
      </div>
      {support === "hint" && (
        <p>
          <strong>Hint:</strong> <MathText text={task.hint} />
        </p>
      )}
      <p role="status">
        <MathText text={feedback} />
      </p>
    </fieldset>
  );
}

export function PilotPractice({ lesson }: { lesson: PilotLesson }) {
  return (
    <section
      className="rigor-panel pilot-practice"
      aria-label="Independent practice"
    >
      <h2>Practice without the visual</h2>
      <p>
        Write the setup for method tasks, choose an answer, then check it. Hints
        and choice correctness are recorded separately. Compare your reasoning
        with the explanation; it is not automatically graded.
      </p>
      {lesson.practice.map((task) => (
        <Task key={task.id} lessonId={lesson.id} task={task} />
      ))}
    </section>
  );
}
