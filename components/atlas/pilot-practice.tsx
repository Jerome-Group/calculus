"use client";
import { useEffect, useState } from "react";
import type { PilotLesson, PilotTask } from "@/lib/curriculum/learning-modes";
import { savePilotAttempt } from "@/lib/curriculum/pilot-progress";
import {
  deletePilotDraft,
  readPilotDraft,
  writePilotDraft,
  type PilotTaskDraft,
} from "@/lib/curriculum/pilot-drafts";
import { MathText } from "./math-text";

function Task({ lessonId, task }: { lessonId: string; task: PilotTask }) {
  const [draft, setDraft] = useState<PilotTaskDraft>({
    choice: "",
    reasoning: "",
    support: "none",
    feedback: "",
  });
  const [storageStatus, setStorageStatus] = useState("");
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const restored = readPilotDraft(lessonId, task.id);
      setDraft(restored.draft);
      setStorageStatus(
        restored.stored
          ? restored.draft.reasoning || restored.draft.choice
            ? "Draft restored from this device."
            : ""
          : "Storage is unavailable. Your draft remains usable in this tab.",
      );
    });
    return () => {
      active = false;
    };
  }, [lessonId, task.id]);
  function update(patch: Partial<PilotTaskDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setStorageStatus(
      writePilotDraft(lessonId, task.id, next)
        ? "Draft saved on this device."
        : "Storage is unavailable. Your draft remains usable in this tab.",
    );
  }
  function clear() {
    setDraft({ choice: "", reasoning: "", support: "none", feedback: "" });
    setStorageStatus(
      deletePilotDraft(lessonId, task.id)
        ? "This task draft was deleted. Other work remains saved."
        : "Storage is unavailable. This draft was cleared in this tab only.",
    );
  }
  function check() {
    const selected = task.choices.find((item) => item.id === draft.choice);
    if (!selected) return;
    const correct = draft.choice === task.answer;
    const message = correct
      ? task.explanation
      : task.feedback[selected.errorCode || ""] ||
        "Recheck the theorem conditions.";
    try {
      savePilotAttempt(lessonId, {
        taskId: task.id,
        kind: task.kind,
        correct,
        support: draft.support,
        errorCode: selected.errorCode,
        at: new Date().toISOString(),
      });
      update({
        feedback: `${correct ? "Choice correct. Compare your reasoning:" : "Try again."} ${message}`,
      });
    } catch {
      update({
        feedback: `${message} Progress could not be saved on this device.`,
      });
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
      <button type="button" onClick={clear}>
        Delete this draft
      </button>
      <p role="status">{storageStatus}</p>
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
