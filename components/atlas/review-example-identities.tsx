import { examplesForConcept } from "@/lib/curriculum/example-registry";
import { Formula } from "./math-text";

export function ReviewExampleIdentities() {
  const examples = examplesForConcept("review-integral-methods");
  return (
    <section
      className="lesson-extension"
      aria-label="Review example identities"
    >
      <h3>Original problems and labelled scaffolds</h3>
      <p>
        The main Stokes picture is a transfer model. These problems have
        distinct fields, domains, and directions.
      </p>
      {examples.map((example) => (
        <article key={example.id} data-example-id={example.id}>
          <h4>
            {example.title} · {example.status}
          </h4>
          <div style={{ overflowX: "auto" }}>
            <Formula block>{example.formula}</Formula>
          </div>
          <p>
            {example.domain} {example.orientation}
          </p>
          <p>{example.annotation}</p>
          <p>
            {example.graph.kind === "none"
              ? example.graph.reason
              : "Exact graph preset available."}
          </p>
        </article>
      ))}
    </section>
  );
}
