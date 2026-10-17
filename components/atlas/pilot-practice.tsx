"use client";
import type { PilotLesson, PilotTask } from "@/lib/curriculum/learning-modes";
import type { StudyValues } from "@/lib/study/model";
import {
  useStudyRecord,
  useStudyAttempts,
  StudySaveStatus,
} from "./study-records";
import { MathText } from "./math-text";

function Task({ lessonId, task }: { lessonId: string; task: PilotTask }) {
  const record = useStudyRecord({
    kind: "pilot-draft",
    lessonId,
    taskId: task.id,
  });
  const attempts = useStudyAttempts(lessonId);
  const draft = record.value ?? {
    choice: "",
    reasoning: "",
    support: "none",
    feedback: "",
  };
  function update(patch: Partial<StudyValues["pilot-draft"]>) {
    if (record.persistence.kind !== "loading")
      void record.save({ ...draft, ...patch });
  }
  function check() {
    const selected = task.choices.find((item) => item.id === draft.choice);
    if (!selected) return;
    const correct = draft.choice === task.answer;
    const message = correct
      ? task.explanation
      : task.feedback[selected.errorCode || ""] ||
        "Recheck the theorem conditions.";
    void attempts.record({
      id: crypto.randomUUID(),
      lessonId,
      taskId: task.id,
      choice: draft.choice,
      support: draft.support,
      at: new Date().toISOString(),
    });
    update({
      feedback: `${correct ? "Choice correct. Your written reasoning is not graded; compare it:" : "Try again."} ${message}`,
    });
  }
  return (
    <fieldset
      className="pilot-task"
      disabled={record.persistence.kind === "loading"}
    >
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
            checked={draft.choice === item.id}
            onChange={() => update({ choice: item.id, feedback: "" })}
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
            value={draft.reasoning}
            maxLength={16384}
            onChange={(event) =>
              update({ reasoning: event.target.value, feedback: "" })
            }
            rows={3}
          />
        </>
      )}
      <div className="pilot-task-actions">
        <button type="button" onClick={() => update({ support: "hint" })}>
          Show hint
        </button>
        <button
          type="button"
          onClick={check}
          disabled={
            !draft.choice ||
            (task.kind !== "recognition" && !draft.reasoning.trim())
          }
        >
          Check answer
        </button>
      </div>
      <button type="button" onClick={() => void record.clear()}>
        Delete this draft
      </button>
      <StudySaveStatus record={record} />
      {attempts.pending
        .filter(({ input }) => input.taskId === task.id)
        .slice(-1)
        .map(({ input, persistence }) => (
          <div key={input.id}>
            <p role="status">Choice record: {persistence.message}</p>
            {persistence.kind === "unsaved" && (
              <button
                type="button"
                onClick={() => void attempts.retry(input.id)}
              >
                Retry choice save
              </button>
            )}
            {persistence.kind === "conflict" && (
              <p>
                The same choice ID has different evidence. Your tab&apos;s
                choice has not replaced it.
              </p>
            )}
          </div>
        ))}
      {draft.support === "hint" && (
        <p>
          <strong>Hint:</strong> <MathText text={task.hint} />
        </p>
      )}
      <p role="status">
        <MathText text={draft.feedback} />
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
