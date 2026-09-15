"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { concepts } from "@/lib/curriculum";
import { Formula, MathText } from "./math-text";
import { LessonContent } from "./lesson-content";
import { LessonExperiment } from "./lesson-experiment";
import type { StudyController } from "./use-study-controller";
export function LessonWorkspace({ study }: { study: StudyController }) {
  const {
    readingMode,
    setReadingMode,
    visualLayout,
    lectures,
    concept,
    index,
    open,
  } = study;
  return (
    <>
      <div
        className={
          "study-grid layout-" + visualLayout + " reading-" + readingMode
        }
      >
        <div className="lesson-heading">
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
          <div className="reading-modes" role="group" aria-label="Reading mode">
            <button
              aria-pressed={readingMode === "learn"}
              onClick={() => setReadingMode("learn")}
            >
              Learn
            </button>
            <button
              aria-pressed={readingMode === "revise"}
              onClick={() => setReadingMode("revise")}
            >
              Revise
            </button>
          </div>
          <div className="lesson-question">
            <span className="label">INVESTIGATE</span>
            <p>
              <MathText text={concept.task} />
            </p>
            <Formula block>{concept.formula}</Formula>
          </div>
        </div>
        <LessonExperiment study={study} />
        <LessonContent study={study} />
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
