"use client";
import { concepts, type Concept } from "@/lib/curriculum";
import { learningGuide } from "@/lib/curriculum/learning";
import { Formula, MathText } from "./math-text";
import { LessonPractice } from "./lesson-practice";

export function RevisionView({
  concept,
  showReasoning,
}: {
  concept: Concept;
  showReasoning: () => void;
}) {
  const guide = learningGuide(concept);
  const theorems = guide.contentBlocks?.filter(
    (block) => block.kind === "theorem",
  );
  const methodTasks = guide.exercises?.filter(
    (exercise) => exercise.kind === "method-choice",
  );
  const supportingConcept = guide.prerequisites
    .map((id) => concepts.find((item) => item.id === id))
    .find((item): item is Concept => Boolean(item));
  const supportingGuide = supportingConcept
    ? learningGuide(supportingConcept)
    : undefined;
  return (
    <section
      className="rigor-panel revision-view"
      aria-label="Revision summary"
    >
      <span className="label">REVISION · CONDITIONS FIRST</span>
      <h2>What can you use?</h2>
      <Formula block>{concept.formula}</Formula>
      {theorems?.length ? (
        theorems.map((theorem) => (
          <section key={theorem.id}>
            <h3>
              <MathText text={theorem.title} />
            </h3>
            <p>
              <MathText text={theorem.statement} />
            </p>
            <ul>
              {theorem.hypotheses.map((item) => (
                <li key={item}>
                  <MathText text={item} />
                </li>
              ))}
            </ul>
            <p>{theorem.status}</p>
          </section>
        ))
      ) : (
        <p>
          <MathText text={concept.conditions} />
        </p>
      )}
      <h2>Failure case to check</h2>
      <p>
        <MathText text={concept.pitfall} />
      </p>
      <button type="button" onClick={showReasoning}>
        Open the full reasoning
      </button>
      <h2>Choose and justify a method</h2>
      {(methodTasks?.length
        ? methodTasks
        : [{ id: "core", ...guide.exercise }]
      ).map((exercise) => (
        <LessonPractice
          key={exercise.id}
          id={concept.id}
          exerciseId={exercise.id}
          exercise={exercise}
        />
      ))}
      {supportingConcept && supportingGuide && (
        <section aria-label="Mixed prerequisite practice">
          <h3>Mix in a supporting idea</h3>
          <p>
            From <MathText text={supportingConcept.title} />: solve this
            separately, then explain which assumption or technique transfers to
            the current lesson.
          </p>
          <LessonPractice
            id={supportingConcept.id}
            exercise={supportingGuide.exercise}
          />
        </section>
      )}
    </section>
  );
}
