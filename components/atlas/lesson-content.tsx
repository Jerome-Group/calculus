"use client";
import { concepts } from "@/lib/curriculum";
import { learningGuide } from "@/lib/curriculum/learning";
import { experimentPresets } from "@/lib/curriculum/experiment-presets";
import { LessonPractice } from "./lesson-practice";
import { SourceReferences } from "./source-references";
import { MathText } from "./math-text";
import { IntegrationFramework } from "./integration-framework";
import { RegionExperimentSequence } from "./region-experiment-sequence";
import { StructuredLessonBlockView } from "./structured-lesson-block";
import { ReviewDifferentiabilityExperiments } from "./review-differentiability-experiments";
import type { StudyController } from "./use-study-controller";
export function LessonContent({
  study,
}: {
  study: Pick<
    StudyController,
    "concept" | "open" | "openPrerequisite" | "plot"
  >;
}) {
  const { concept, open, openPrerequisite } = study;
  const guide = learningGuide(concept);
  return (
    <section className="rigor-panel" aria-label="Mathematical explanation">
      <span className="label">MATHEMATICAL NOTES</span>
      {guide && (
        <nav className="prerequisites" aria-label="Lesson prerequisites">
          <span>Builds on</span>
          {guide.prerequisites.map((id) => (
            <button key={id} onClick={() => openPrerequisite(id)}>
              <MathText text={concepts.find((c) => c.id === id)?.title ?? ""} />
            </button>
          ))}
        </nav>
      )}
      <section className="lesson-narrative">
        <h2 id="notes-intuition" tabIndex={-1}>
          Reasoning
        </h2>
        {guide?.contentBlocks?.some(
          (block) => block.kind !== "worked-example",
        ) ? (
          guide.contentBlocks
            .filter((block) => block.kind !== "worked-example")
            .map((block) => (
              <StructuredLessonBlockView key={block.id} block={block} />
            ))
        ) : (
          <>
            <p className="reasoning-status">
              {guide?.reasoning || "Proof sketch"} · consult the hypotheses
              before applying the result.
            </p>
            <p>
              <MathText text={concept.proof} />
            </p>
          </>
        )}
        <h2 id="notes-example" tabIndex={-1}>
          Worked application
        </h2>
        {guide?.contentBlocks?.some(
          (block) => block.kind === "worked-example",
        ) ? (
          guide.contentBlocks
            .filter((block) => block.kind === "worked-example")
            .map((block) => (
              <StructuredLessonBlockView key={block.id} block={block} />
            ))
        ) : (
          <p>
            <MathText text={concept.example} />
          </p>
        )}
        {concept.id === "polar-regions" && <RegionExperimentSequence />}
        {concept.id === "review-total-differentiability" && (
          <ReviewDifferentiabilityExperiments />
        )}
        <h2 id="notes-pitfall" tabIndex={-1}>
          Check the distinction
        </h2>
        <p>
          <MathText text={concept.pitfall} />
        </p>
      </section>
      {guide?.supplementalBlocks?.map((block) => (
        <StructuredLessonBlockView key={block.id} block={block} />
      ))}
      {guide?.sections.map((section) => (
        <section className="lesson-extension" key={section.title}>
          <h2>
            <MathText text={section.title} />
          </h2>
          <p>
            <MathText text={section.text} />
          </p>
        </section>
      ))}
      {[
        "double-riemann-sums",
        "general-double-integrals",
        "fubini-double",
        "type-one-two-regions",
        "linearity-additivity",
      ].includes(concept.id) && <IntegrationFramework open={open} />}
      {guide &&
        [{ id: "core", ...guide.exercise }, ...(guide.exercises ?? [])].map(
          (exercise) => (
            <LessonPractice
              key={`${concept.id}:${exercise.id}`}
              id={concept.id}
              exerciseId={exercise.id}
              exercise={exercise}
            />
          ),
        )}
      {(guide?.nextStep || guide?.relatedStep) && (
        <nav className="prerequisites" aria-label="Continue this proof path">
          {guide.nextStep && (
            <button onClick={() => open(guide.nextStep!.id)}>
              Next: {guide.nextStep.label}
            </button>
          )}
          {guide.relatedStep && (
            <button onClick={() => open(guide.relatedStep!.id)}>
              Compare: {guide.relatedStep.label}
            </button>
          )}
        </nav>
      )}
      <details className="covered-topics">
        <summary>
          Concepts in this exploration <span>{concept.topics.length}</span>
        </summary>
        <ul>
          {concept.topics.map((t) => (
            <li key={t}>
              <MathText text={t} />
            </li>
          ))}
        </ul>
      </details>
      {experimentPresets[concept.id] && (
        <section className="exact-presets">
          <h2>Inspect the actual example</h2>
          <p>
            Open the stated formula with its display bounds. The mesh is
            sampled; the calculations above give the exact claims.
          </p>
          {experimentPresets[concept.id].map(({ title, ...graph }) => (
            <button key={title} onClick={() => study.plot(graph)}>
              {title}
            </button>
          ))}
        </section>
      )}
      <SourceReferences concept={concept} />
    </section>
  );
}
