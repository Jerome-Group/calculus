"use client";
import { MathText } from "./math-text";
import { concepts } from "@/lib/curriculum";
import { useStudyAccount } from "./study-records";

export function StudyProgress({ open }: { open: (id: string) => void }) {
  const account = useStudyAccount();
  const summary = account.overview;
  const practice = concepts.filter((concept) =>
    summary.practice.includes(concept.id),
  );
  const resume = concepts.find((c) => c.id === summary.resume);
  return (
    <section className="study-progress" aria-label="Your study">
      <h2>Your account study</h2>
      {account.overviewError && (
        <p role="status">
          {account.overviewError}{" "}
          <button type="button" onClick={() => void account.refresh()}>
            Retry summary
          </button>
        </p>
      )}
      {!account.user && (
        <p>
          Sign in to save study across sessions and devices. New guest work
          stays in this tab.
        </p>
      )}
      <p>
        {summary.explainable} exercise self-assessments marked explainable ·{" "}
        {summary.needsPractice} marked for practice · {summary.choices} choice
        attempts recorded. These records do not establish mastery.
      </p>
      {resume && (
        <button onClick={() => open(resume.id)}>
          Resume: <MathText text={resume.title} />
        </button>
      )}
      {practice.length > 0 && (
        <details>
          <summary>Revisit practice ({practice.length})</summary>
          {practice.map((c) => (
            <button key={c.id} onClick={() => open(c.id)}>
              <MathText text={c.title} />
            </button>
          ))}
        </details>
      )}
    </section>
  );
}
