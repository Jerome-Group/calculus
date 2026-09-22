"use client";
import { useState, useSyncExternalStore } from "react";
import { concepts } from "@/lib/curriculum";
import { learningGuide } from "@/lib/curriculum/learning";
import type { LessonMode, PilotLesson } from "@/lib/curriculum/learning-modes";
import {
  subscribeProgress,
  progressSnapshot,
  parseProgress,
} from "@/lib/curriculum/progress-store";
import {
  legacyConfidence,
  parsePilotProgress,
  pilotMastery,
  pilotSnapshot,
  savePilotConfidence,
} from "@/lib/curriculum/pilot-progress";
import { SourceReferences } from "./source-references";
import { MathText } from "./math-text";
import { PilotExplore } from "./pilot-explore";
import { PilotPractice } from "./pilot-practice";
import { IntegrationFramework } from "./integration-framework";
import type { StudyController } from "./use-study-controller";

export function PilotLessonView({
  lesson,
  mode,
  study,
}: {
  lesson: PilotLesson;
  mode: LessonMode;
  study: StudyController;
}) {
  const [saveStatus, setSaveStatus] = useState("");
  const raw = useSyncExternalStore(
    subscribeProgress,
    pilotSnapshot,
    () => "{}",
  );
  const legacyRaw = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    () => "{}",
  );
  const record = parsePilotProgress(raw)[lesson.id];
  const confidence =
    record?.confidence || legacyConfidence(parseProgress(legacyRaw)[lesson.id]);
  const concept = study.concept;
  function setConfidence(value: "unsure" | "confident") {
    try {
      savePilotConfidence(lesson.id, value);
      setSaveStatus("Confidence saved on this device.");
    } catch {
      setSaveStatus("Confidence could not be saved on this device.");
    }
  }
  if (mode === "explore") return <PilotExplore lesson={lesson} study={study} />;
  if (mode === "practice") return <PilotPractice lesson={lesson} />;
  if (mode === "revise")
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
            <li key={error}>{error}</li>
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
          <a href="#pilot-errors">Review your recorded errors</a>
        </p>
        <h3 id="pilot-errors">Your error history</h3>
        {record?.attempts.some((attempt) => !attempt.correct) ? (
          <ul>
            {record.attempts
              .filter((attempt) => !attempt.correct)
              .map((attempt, index) => (
                <li key={`${attempt.at}-${index}`}>
                  {attempt.taskId}: {attempt.errorCode || "Review needed"} ·{" "}
                  {attempt.support === "hint" ? "hint used" : "no hint"}
                </li>
              ))}
          </ul>
        ) : (
          <p>
            No errors recorded on this device yet.{" "}
            <button onClick={() => study.setReadingMode("practice")}>
              Start practice
            </button>
          </p>
        )}
        <p>
          Next review:{" "}
          {record?.nextReview
            ? new Date(record.nextReview).toLocaleDateString()
            : "after your first attempt"}
          .
        </p>
        <p>
          {pilotMastery(record)
            ? "Independent transfer repeated after a delay."
            : "Mastery requires an unsupported transfer answer and another unsupported transfer answer at least a day later."}
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
          <button onClick={() => setConfidence("unsure")}>I am unsure</button>
          <button onClick={() => setConfidence("confident")}>
            I feel confident
          </button>
        </div>
        <p role="status">{saveStatus}</p>
      </section>
    );
  const guide = learningGuide(concept);
  return (
    <section className="rigor-panel pilot-content" aria-label="Guided lesson">
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
      <nav className="prerequisites" aria-label="Lesson prerequisites">
        <span>Builds on</span>
        {guide.prerequisites.map((id) => (
          <button key={id} onClick={() => study.open(id)}>
            {concepts.find((item) => item.id === id)?.title}
          </button>
        ))}
      </nav>
      <h2 id="notes-intuition" tabIndex={-1}>
        Definition and hypotheses
      </h2>
      <p>
        <MathText text={lesson.learn.theorem} />
      </p>
      <h2 id="notes-example" tabIndex={-1}>
        Worked reasoning
      </h2>
      <p>
        <MathText text={lesson.learn.reasoning} />
      </p>
      <h2 id="notes-pitfall" tabIndex={-1}>
        Near miss
      </h2>
      <p>
        <MathText text={lesson.learn.misconception} />
      </p>
      <h2>Quick check</h2>
      <p>
        <MathText text={lesson.learn.quickCheck} />
      </p>
      {lesson.id === "type-one-two-regions" && (
        <IntegrationFramework open={study.open} />
      )}
      <SourceReferences concept={concept} />
    </section>
  );
}
