import { concepts } from "@/lib/curriculum";
import {
  integrationFailure,
  integrationSteps,
} from "@/lib/curriculum/integration-framework";

export function IntegrationFramework({ open }: { open: (id: string) => void }) {
  return (
    <section
      className="integration-chain"
      aria-labelledby="integration-chain-title"
    >
      <h2 id="integration-chain-title">Which theorem permits this step?</h2>
      <ol>
        {integrationSteps.map((step, index) => (
          <li key={`${step.id}-${index}`}>
            <h3>{step.title}</h3>
            <p>
              <strong>Assume:</strong> {step.hypothesis}
            </p>
            <p>
              <strong>Then:</strong> {step.conclusion}
            </p>
            <p>
              <strong>Limit:</strong> {step.boundary}
            </p>
            <button onClick={() => open(step.id)}>
              Open {concepts.find((concept) => concept.id === step.id)?.title}
            </button>
          </li>
        ))}
      </ol>
      <p>{integrationFailure}</p>
    </section>
  );
}
