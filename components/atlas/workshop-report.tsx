import type { Attempt, ProofReport } from "@/lib/workshop";
import { Formula } from "./math-text";
import { CapturedConstruction } from "./workshop-fields";

export function WorkshopReport({
  report,
  current = false,
}: {
  report: ProofReport;
  current?: boolean;
}) {
  const category =
    report.kind === "universal-certificate"
      ? "Universal certificate"
      : report.kind === "restricted-path" || report.kind === "one-loop-only"
        ? "Restricted conclusion"
        : "Exact obstruction";
  return (
    <div className="workshop-report">
      <span className={`workshop-badge ${report.kind}`}>{category}</span>
      <h3
        id={current ? "workshop-result" : undefined}
        tabIndex={current ? -1 : undefined}
      >
        {report.title}
      </h3>
      <p className="workshop-scope">{report.scope}</p>
      <ol className="workshop-proof">
        {report.steps.map((step, i) => (
          <li key={i}>
            <Formula block>{step.tex}</Formula>
            <p>{step.spoken}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WorkshopAttemptHistory({
  attempt,
  number,
}: {
  attempt: Attempt;
  number: number;
}) {
  return (
    <details className="workshop-history-attempt">
      <summary>
        Construction {number}. {attempt.report.title}
      </summary>
      <CapturedConstruction construction={attempt.construction} />
      <p className="eyebrow">Initial explanation, preserved</p>
      <blockquote>{attempt.initialExplanation}</blockquote>
      <WorkshopReport report={attempt.report} />
      {attempt.revisions.map((revision, i) => (
        <div key={i}>
          <h4>Revision {i + 1}, ungraded</h4>
          <blockquote>{revision}</blockquote>
        </div>
      ))}
    </details>
  );
}
