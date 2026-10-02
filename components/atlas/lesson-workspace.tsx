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
import { ComparisonLab } from "./comparison-labs";
import {
  learningModesFor,
  type LessonMode,
} from "@/lib/curriculum/learning-modes";
import type { StudyController } from "./use-study-controller";

export function LessonWorkspace({ study }: { study: StudyController }) {
  const focusSection = (id: string) => {
    const target = document.getElementById(id);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start" });
  };
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
  const courseLessons = concepts.filter(
    (item) => item.course === concept.course,
  );
  const modeDescriptions: Record<LessonMode, string> = {
    learn:
      "Connect the definition, experiment, argument and worked applications.",
    explore:
      "Predict a change, adjust the model, then explain what stayed invariant.",
    practice:
      "Work without the graph. Hints and solutions are available after your attempt.",
    revise:
      "Recall the statement, assumptions and distinctions before checking the notes.",
  };
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
            <span className="lesson-location">
              {courseLessons.indexOf(concept) + 1} / {courseLessons.length} in
              this course
            </span>
          </div>
          <h1 tabIndex={-1} id="lesson-title">
            <MathText text={concept.title} />
          </h1>
          <p>
            <MathText text={concept.subtitle} />
          </p>
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
          <p className="mode-description">{modeDescriptions[readingMode]}</p>
          {readingMode === "learn" && lesson.version !== "pilot-v2" && (
            <nav className="lesson-outline" aria-label="Follow the argument">
              <button onClick={() => focusSection("lesson-definition")}>
                Definition & assumptions
              </button>
              <button onClick={() => focusSection("lesson-experiment")}>
                Experiment
              </button>
              <button onClick={() => study.setNoteTab("intuition")}>
                Reasoning
              </button>
              <button onClick={() => study.setNoteTab("example")}>
                Worked application
              </button>
              <button onClick={() => study.setNoteTab("pitfall")}>
                Key distinction
              </button>
              <button onClick={() => setReadingMode("practice")}>
                Try it yourself
              </button>
            </nav>
          )}
          {returnConcept && returnConcept.id !== concept.id && (
            <div className="lesson-question">
              <span className="label">RETURN TO YOUR LESSON</span>
              <p>
                <MathText text={returnConcept.title} />
              </p>
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
              id="lesson-definition"
              tabIndex={-1}
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
          {readingMode === "learn" && prerequisites.length > 0 && (
            <details className="lesson-readiness">
              <summary>Need a prerequisite refresher?</summary>
              <p>Open a supporting lesson, then return here.</p>
              {bridge && (
                <p>
                  <MathText text={bridge.explanation} />
                </p>
              )}
              {prerequisites.map((id) => {
                const prerequisite = concepts.find((item) => item.id === id);
                return prerequisite ? (
                  <button key={id} onClick={() => openPrerequisite(id)}>
                    <MathText text={prerequisite.title} />
                    {bridge?.prerequisite === id ? " (later explanation)" : ""}
                  </button>
                ) : null;
              })}
            </details>
          )}
        </div>
        {lesson.version === "pilot-v2" ? (
          <>
            {(readingMode === "learn" || readingMode === "explore") && (
              <ComparisonLab key={concept.id} conceptId={concept.id} />
            )}
            <PilotLessonView
              lesson={lesson.lesson}
              mode={readingMode}
              study={study}
            />
          </>
        ) : readingMode === "revise" ? (
          <RevisionView
            concept={concept}
            showReasoning={() => setReadingMode("learn")}
          />
        ) : readingMode === "explore" ? (
          <>
            <ComparisonLab key={concept.id} conceptId={concept.id} />
            <LessonExperiment study={study} />
          </>
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
      <LessonPagination index={index} open={open} />
    </>
  );
}

export function LessonPagination({
  index,
  open,
}: {
  index: number;
  open: StudyController["open"];
}) {
  const concept = concepts[index];
  return (
    <footer className="lesson-pagination">
      <button
        disabled={index === 0}
        onClick={() => open(concepts[index - 1].id)}
      >
        <ArrowLeft size={18} />
        <span>
          <small>PREVIOUS CONCEPT</small>
          <MathText
            text={index ? concepts[index - 1].title : "Start of course"}
          />
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
          <MathText text={concepts[index + 1]?.title || "End of library"} />
        </span>
        <ArrowRight size={18} />
      </button>
    </footer>
  );
}
