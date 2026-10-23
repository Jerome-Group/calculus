"use client";
import { useRef } from "react";
import type { PilotLesson } from "@/lib/curriculum/learning-modes";
import { pilotReview } from "@/lib/study/model";
import {
  useStudyRecord,
  useStudyAttempts,
  StudySaveStatus,
} from "./study-records";
import { MathText } from "./math-text";
import type { StudyController } from "./use-study-controller";

export function PilotRevision({
  lesson,
  study,
}: {
  lesson: PilotLesson;
  study: StudyController;
}) {
  const errorHistory = useRef<HTMLHeadingElement>(null);
  const confidenceRecord = useStudyRecord({
    kind: "confidence",
    lessonId: lesson.id,
  });
  const history = useStudyAttempts(lesson.id);
  const review = pilotReview(history.saved);
  const local = history.tab.filter(
    ({ persistence }) => persistence.kind !== "saved",
  );
  const confidence = confidenceRecord.value;
  function setConfidence(value: "unsure" | "confident") {
    void confidenceRecord.save(value);
  }
  return (
    <section
      className="rigor-panel pilot-content"
      aria-label="Revision and retrieval"
    >
      <h2>Retrieve before looking back</h2>
      <ol>
        {lesson.revise.prompts.map((prompt) => (
          <li key={prompt}>
            <MathText text={prompt} />
          </li>
        ))}
      </ol>
      <h3>Theorem conditions</h3>
      <p>
        <MathText text={lesson.revise.conditions} />
      </p>
      <h3>Common errors</h3>
      <ul>
        {lesson.revise.errors.map((error) => (
          <li key={error}>
            <MathText text={error} />
          </li>
        ))}
      </ul>
      <h3>Mixed check</h3>
      <p>
        <MathText text={lesson.revise.mixedCheck} />
      </p>
      <button onClick={() => study.setReadingMode("practice")}>
        Do the independent tasks
      </button>
      <p>
        <button
          type="button"
          onClick={() => {
            errorHistory.current?.focus({ preventScroll: true });
            errorHistory.current?.scrollIntoView({ block: "start" });
          }}
        >
          Review your recorded choices
        </button>
      </p>
      <h3 id="pilot-errors" ref={errorHistory} tabIndex={-1}>
        Saved account history
      </h3>
      <p>{history.saved.length} saved account records loaded.</p>
      {history.saved.length ? (
        <ul>
          {history.saved.map((attempt) => (
            <li key={attempt.id}>
              {attempt.taskId}:{" "}
              {attempt.correct
                ? "recorded correct"
                : attempt.errorCode || "Review needed"}{" "}
              ·{" "}
              {attempt.source === "legacy"
                ? "historical device correctness, not rechecked · "
                : "checked choice · "}
              {attempt.support === "hint" ? "hint used" : "no hint"}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          No saved account choices loaded yet.{" "}
          <button onClick={() => study.setReadingMode("practice")}>
            Start practice
          </button>
        </p>
      )}
      {local.length > 0 && (
        <>
          <h3>Choices in this tab</h3>
          <ul>
            {local.map(({ input, value, persistence }) => (
              <li key={input.id}>
                {input.taskId}:{" "}
                {value.correct
                  ? "choice correct"
                  : value.errorCode || "Review needed"}{" "}
                · {input.support === "hint" ? "hint used" : "no hint"}.{" "}
                <span role="status">{persistence.message}</span>{" "}
                {persistence.kind === "unsaved" && (
                  <button
                    type="button"
                    onClick={() => void history.retry(input.id)}
                  >
                    Retry choice save
                  </button>
                )}
                {persistence.kind === "conflict" && (
                  <p>
                    The saved record has different evidence for this choice ID.
                    Your tab&apos;s choice has not replaced it.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {history.cursor && (
        <button
          type="button"
          disabled={history.loading}
          onClick={() => void history.loadMore()}
        >
          Load earlier choices
        </button>
      )}
      {history.error && (
        <p role="status">
          {history.error}{" "}
          <button type="button" onClick={() => void history.refresh()}>
            Retry history
          </button>
        </p>
      )}
      <p>
        Next review:{" "}
        {review.nextReview
          ? new Date(review.nextReview).toLocaleDateString()
          : "after a saved account choice"}
        .
        {review.reviewSource === "legacy"
          ? " Historical suggestion from loaded device evidence. Correctness was not rechecked."
          : review.reviewSource === "choice"
            ? " Based on loaded checked account choices."
            : " Tab choices do not set an account review date."}
      </p>
      <p>
        {review.repeatedCorrectTransfer
          ? "Correct checked transfer choices saved without hints at least a day apart in the loaded account history. Written reasoning is not graded."
          : "Save checked transfer choices without hints at least a day apart to track repeated practice. Historical device correctness does not establish checked transfer evidence. Choices do not establish mastery."}
      </p>
      <p>
        Confidence: {confidence || "not recorded"}. This is separate from task
        correctness.
      </p>
      <div
        className="pilot-confidence"
        role="group"
        aria-label="Confidence self-report"
      >
        <button
          disabled={confidenceRecord.persistence.kind === "loading"}
          onClick={() => setConfidence("unsure")}
        >
          I am unsure
        </button>
        <button
          disabled={confidenceRecord.persistence.kind === "loading"}
          onClick={() => setConfidence("confident")}
        >
          I feel confident
        </button>
      </div>
      <StudySaveStatus record={confidenceRecord} />
    </section>
  );
}

export function PilotPreparation({ lesson }: { lesson: PilotLesson }) {
  return (
    <section
      className="rigor-panel pilot-content"
      aria-label="Lesson preparation"
    >
      <h2>Outcome</h2>
      <p>
        <MathText text={lesson.learn.outcome} />
      </p>
      <h2>Why it matters</h2>
      <p>
        <MathText text={lesson.learn.why} />
      </p>
      <h2>Recall first</h2>
      <p>
        <MathText text={lesson.learn.recall} />
      </p>
      <h2>Quick check</h2>
      <p>
        <MathText text={lesson.learn.quickCheck} />
      </p>
    </section>
  );
}
