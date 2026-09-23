"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { concepts } from "@/lib/curriculum";
import { learningGuide } from "@/lib/curriculum/learning";
import { forwardBridges } from "@/lib/curriculum/prerequisite-routes";
import { Formula, MathText } from "./math-text";
import { LessonContent } from "./lesson-content";
import { LessonExperiment } from "./lesson-experiment";
import { PilotLessonView } from "./pilot-lesson";
import { LessonPractice } from "./lesson-practice";
import { RevisionView } from "./revision-view";
import {
  learningModesFor,
  type LessonMode,
} from "@/lib/curriculum/learning-modes";
import type { StudyController } from "./use-study-controller";
export function LessonWorkspace({ study }: { study: StudyController }) {
  const {
    readingMode,
    returnTo,
    openPrerequisite,
    resumeLesson,
    historyNotice,
    setReadingMode,
    visualLayout,
    lectures,
    concept,
    index,
    open,
  } = study;
  const lesson = learningModesFor(concept);
  const prerequisites = learningGuide(concept).prerequisites;
  const bridge = forwardBridges[concept.id];
  const returnConcept = concepts.find((item) => item.id === returnTo?.id);
  return (
    <>
      <div
        className={
          "study-grid layout-" +
          visualLayout +
          " reading-" +
          readingMode +
          (lesson.version === "pilot-v2" ? " pilot-mode" : "")
        }
      >
        <div className="lesson-heading">
          {historyNotice && <p role="status">{historyNotice}</p>}
          <div className="eyebrow">
            {concept.course} ·{" "}
            {concept.course === "MH1101" ? "CHAPTER" : "LECTURE"}{" "}
            {String(concept.lecture).padStart(2, "0")}
            <span> / </span>
            {lectures[concept.lecture - 1]}
          </div>
          <h1 tabIndex={-1} id="lesson-title">
            {concept.title}
          </h1>
          <p>{concept.subtitle}</p>
          {returnConcept && returnConcept.id !== concept.id && (
            <div className="lesson-question">
              <span className="label">RETURN TO YOUR LESSON</span>
              <p>{returnConcept.title}</p>
              <button onClick={resumeLesson}>Return to interrupted step</button>
            </div>
          )}
          <div className="lesson-question">
            <h2 className="label">INVESTIGATE</h2>
            <p>
              <MathText text={concept.task} />
            </p>
          </div>
          {(readingMode === "learn" || readingMode === "explore") && (
            <div
              className="lesson-question lesson-essentials"
              aria-label="Objects and assumptions"
            >
              <h2 className="label">OBJECTS AND ASSUMPTIONS</h2>
              <p>
                <MathText text={concept.definition} />
              </p>
              <h3 className="label">CONDITIONS</h3>
              <p>
                <MathText text={concept.conditions} />
              </p>
            </div>
          )}
          <div className="lesson-question lesson-working-relation">
            <h2 className="label">WORKING RELATION</h2>
            <Formula block>{concept.formula}</Formula>
          </div>
          <div className="reading-modes" role="group" aria-label="Lesson mode">
            {(["learn", "explore", "practice", "revise"] as LessonMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  aria-pressed={readingMode === mode}
                  onClick={() => setReadingMode(mode)}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ),
            )}
          </div>
          {readingMode === "learn" && prerequisites.length > 0 && (
            <details className="lesson-readiness">
              <summary>Need a prerequisite refresher?</summary>
              <p>Open a supporting lesson, then return here.</p>
              {bridge && <p>{bridge.explanation}</p>}
              {prerequisites.map((id) => {
                const prerequisite = concepts.find((item) => item.id === id);
                return prerequisite ? (
                  <button key={id} onClick={() => openPrerequisite(id)}>
                    {prerequisite.title}
                    {bridge?.prerequisite === id ? " (later explanation)" : ""}
                  </button>
                ) : null;
              })}
            </details>
          )}
        </div>
        {lesson.version === "pilot-v2" ? (
          <PilotLessonView
            lesson={lesson.lesson}
            mode={readingMode}
            study={study}
          />
        ) : readingMode === "revise" ? (
          <RevisionView
            concept={concept}
            showReasoning={() => setReadingMode("learn")}
          />
        ) : readingMode === "explore" ? (
          <LessonExperiment study={study} />
        ) : readingMode === "practice" ? (
          <div>
            {[
              { id: "core", ...lesson.guide.exercise },
              ...(lesson.guide.exercises ?? []),
            ].map((exercise) => (
              <LessonPractice
                key={`${concept.id}:${exercise.id}`}
                id={concept.id}
                exerciseId={exercise.id}
                exercise={exercise}
              />
            ))}
          </div>
        ) : (
          <>
            <LessonExperiment study={study} />
            <LessonContent study={study} />
          </>
        )}
      </div>
      <footer className="lesson-pagination">
        <button
          disabled={index === 0}
          onClick={() => open(concepts[index - 1].id)}
        >
          <ArrowLeft size={18} />
          <span>
            <small>PREVIOUS CONCEPT</small>
            {index ? concepts[index - 1].title : "Start of course"}
          </span>
        </button>
        <span className="concept-count">
          {index + 1} / {concepts.length}
        </span>
        <button
          disabled={index === concepts.length - 1}
          onClick={() => open(concepts[index + 1].id)}
        >
          <span>
            <small>
              {concepts[index + 1]?.course !== concept.course
                ? "NEXT COURSE"
                : "NEXT CONCEPT"}
            </small>
            {concepts[index + 1]?.title || "End of library"}
          </span>
          <ArrowRight size={18} />
        </button>
      </footer>
    </>
  );
}
