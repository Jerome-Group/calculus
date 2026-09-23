import type { StructuredLessonBlock } from "@/lib/curriculum/learning";
import { Formula, MathText } from "./math-text";

export function StructuredLessonBlockView({
  block,
}: {
  block: StructuredLessonBlock;
}) {
  return (
    <section className="lesson-extension" aria-labelledby={block.id}>
      <h3 id={block.id}>{block.title}</h3>
      {block.kind === "theorem" && (
        <>
          <p className="reasoning-status">{block.status}</p>
          <p>
            <MathText text={block.statement} />
          </p>
          <h4>Hypotheses</h4>
          <ul>
            {block.hypotheses.map((hypothesis) => (
              <li key={hypothesis}>
                <MathText text={hypothesis} />
              </li>
            ))}
          </ul>
          {block.prerequisites.length > 0 && (
            <p>
              Proof uses: <MathText text={block.prerequisites.join(", ")} />.
            </p>
          )}
        </>
      )}
      {block.kind === "assumption" && (
        <ul>
          {block.items.map((item) => (
            <li key={item}>
              <MathText text={item} />
            </li>
          ))}
        </ul>
      )}
      {block.kind === "equation" && (
        <>
          <div style={{ overflowX: "auto" }}>
            <Formula block>{block.tex}</Formula>
          </div>
          {block.note && (
            <p>
              <MathText text={block.note} />
            </p>
          )}
        </>
      )}
      {block.kind === "strategy" && (
        <p>
          <MathText text={block.text} />
        </p>
      )}
      {(block.kind === "derivation" || block.kind === "worked-example") && (
        <>
          <p>
            <strong>Strategy.</strong> <MathText text={block.strategy} />
          </p>
          <p>
            <strong>Setup.</strong> <MathText text={block.setup} />
          </p>
          <ol>
            {block.steps.map((step) => (
              <li key={step.label}>
                <strong>{step.label}.</strong> <MathText text={step.text} />
                {step.usesHypothesis && (
                  <p>
                    <strong>Uses hypothesis:</strong>{" "}
                    <MathText text={step.usesHypothesis} />
                  </p>
                )}
                {step.equation && (
                  <div style={{ overflowX: "auto" }}>
                    <Formula block>{step.equation}</Formula>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <p>
            <strong>Result.</strong> <MathText text={block.result} />
          </p>
          <p>
            <strong>Verification.</strong>{" "}
            <MathText text={block.verification} />
          </p>
        </>
      )}
    </section>
  );
}
