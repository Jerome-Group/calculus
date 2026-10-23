"use client";
import { useLayoutEffect, useRef, type Dispatch } from "react";
import { concepts } from "@/lib/curriculum";
import {
  investigation,
  investigations,
  type Construction,
  type WorkshopAction,
  type WorkshopState,
} from "@/lib/workshop";
import type { StudyController } from "./use-study-controller";
import { Formula, MathText } from "./math-text";
import { CapturedConstruction, WorkshopFields } from "./workshop-fields";
import { WorkshopDiagram } from "./workshop-diagram";
import { WorkshopReport, WorkshopAttemptHistory } from "./workshop-report";

export function WorkshopWorkspace({
  state,
  dispatch,
  study,
}: {
  state: WorkshopState;
  dispatch: Dispatch<WorkshopAction>;
  study: StudyController;
}) {
  const id = study.workshopLocation.id,
    definition = investigation(id);
  const pendingFocus = useRef<"check" | "construction" | "revision" | null>(
    null,
  );
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    const target =
      pending === "check"
        ? state.phase === "inspected"
          ? "workshop-result"
          : `workshop-${state.issues[0]?.field ?? "explanation"}`
        : pending === "construction"
          ? "workshop-construction"
          : state.phase === "inspected" && state.revisionProblem
            ? "workshop-revision"
            : "workshop-revision-status";
    const element = document.getElementById(target);
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [state]);
  const construction =
    state.phase === "drafting"
      ? state.draft.construction
      : state.current.construction;
  const change = (next: Construction) => {
    if (state.phase === "drafting")
      dispatch({
        type: "write",
        draft: { ...state.draft, construction: next },
      });
  };
  const openLesson = (lessonId: string) =>
    study.openWorkshopLesson(lessonId, {
      version: 1,
      id,
      focus: state.phase === "inspected" ? "result" : "construction",
      scrollY: window.scrollY,
    });
  const issue =
    state.phase === "drafting"
      ? state.issues.find((item) => item.field === "explanation")
      : null;
  return (
    <div className="workshop">
      <header className="workshop-heading">
        <p className="eyebrow">CONSTRUCT · INSPECT · REVISE</p>
        <h1 id="workshop-title" tabIndex={-1}>
          Make the argument yours.
        </h1>
        <p>
          Build a mathematical object. Check what it proves, which claim it
          defeats, and where the conclusion stops.
        </p>
        <p className="workshop-memory">
          Work stays in this tab across lesson detours. Reload or a new tab
          resets constructions and explanations. Explanations and revisions are
          ungraded.
        </p>
      </header>
      {study.workshopLocation.notice && (
        <p className="workshop-notice" role="status">
          {study.workshopLocation.notice}
        </p>
      )}
      <nav
        className="workshop-investigations"
        aria-label="Workshop investigations"
      >
        {investigations.map((item, i) => (
          <button
            key={item.id}
            aria-current={id === item.id ? "page" : undefined}
            onClick={() => study.openWorkshop(item.id)}
          >
            <small>
              0{i + 1} · {item.technique}
            </small>
            {item.title}
          </button>
        ))}
      </nav>
      <section
        className="workshop-question"
        aria-labelledby="workshop-question"
      >
        <p className="eyebrow">MH2100 · {definition.technique}</p>
        <h2 id="workshop-question">{definition.question}</h2>
        <p>
          <MathText text={definition.task} />
        </p>
        <Formula block>{definition.formula}</Formula>
        <p className="workshop-hint">{definition.spoken}</p>
      </section>
      <div className="workshop-grid">
        <section
          className="workshop-panel"
          aria-labelledby="workshop-construction"
        >
          <h2 id="workshop-construction" tabIndex={-1}>
            <span className="workshop-step">1</span>Your construction
          </h2>
          {state.phase === "drafting" ? (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                pendingFocus.current = "check";
                dispatch({ type: "check", id });
              }}
            >
              <p className="workshop-hint">
                {state.history.length
                  ? "These fields copy your last checked construction. The new explanation starts blank."
                  : "Editable starting values are supplied examples. Your explanation starts blank."}{" "}
                Numbers accept integers, finite decimals, and fractions, at most
                32 characters and magnitude 1,000,000.
              </p>
              <WorkshopFields
                construction={state.draft.construction}
                issues={state.issues}
                change={change}
              />
              <label
                className="workshop-field workshop-explanation"
                htmlFor="workshop-explanation"
              >
                <span>Your explanation before this check</span>
                <textarea
                  id="workshop-explanation"
                  value={state.draft.explanation}
                  maxLength={4000}
                  aria-invalid={!!issue}
                  aria-describedby={
                    issue
                      ? "workshop-explanation-error"
                      : "workshop-explanation-hint"
                  }
                  onChange={(event) =>
                    dispatch({
                      type: "write",
                      draft: {
                        ...state.draft,
                        explanation: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <p className="workshop-hint" id="workshop-explanation-hint">
                What should this construction establish? This explanation stays
                paired with its checked input and exact result.
              </p>
              {issue && (
                <p className="workshop-error" id="workshop-explanation-error">
                  {issue.message}
                </p>
              )}
              {state.issues.length > 0 && (
                <p className="workshop-error" role="alert">
                  Check the marked fields. No new result was recorded.
                </p>
              )}
              <div className="workshop-actions">
                <button className="workshop-primary" type="submit">
                  Check construction
                </button>
              </div>
            </form>
          ) : (
            <>
              <CapturedConstruction construction={state.current.construction} />
              <p className="eyebrow">Initial explanation, preserved</p>
              <blockquote className="workshop-original">
                {state.current.initialExplanation}
              </blockquote>
              <div className="workshop-actions">
                <button
                  onClick={() => {
                    pendingFocus.current = "construction";
                    dispatch({ type: "reconstruct", id });
                  }}
                >
                  Edit a new construction
                </button>
              </div>
              <p className="workshop-hint">
                This checked attempt stays in history. A new construction copies
                its fields and starts a blank explanation.
              </p>
            </>
          )}
          <WorkshopDiagram construction={construction} />
        </section>
        <section
          className="workshop-panel"
          aria-label="Inspect the exact result"
        >
          <h2>
            <span className="workshop-step">2</span>Inspect the result
          </h2>
          {state.phase === "inspected" ? (
            <WorkshopReport report={state.current.report} current />
          ) : (
            <div className="workshop-empty">
              <p>
                {state.history.length
                  ? "You are drafting a new construction. Its previous result is preserved in checked history below."
                  : "Your result will name its exact scope."}
              </p>
              <p>
                A picture or a few samples cannot certify a universal claim. The
                local checker uses exact rational arithmetic and the displayed
                analytic argument.
              </p>
              <p>Check your construction to inspect its result.</p>
            </div>
          )}
        </section>
      </div>
      {state.phase === "inspected" && (
        <section
          className="workshop-panel workshop-revision"
          aria-labelledby="workshop-revision-title"
        >
          <h2 id="workshop-revision-title">
            <span className="workshop-step">3</span>Revise the explanation
          </h2>
          <p>{state.current.report.revisionPrompt}</p>
          <div className="workshop-reason-grid">
            <div>
              <p className="eyebrow">Initial explanation, preserved</p>
              <blockquote>{state.current.initialExplanation}</blockquote>
              {state.current.revisions.map((text, i) => (
                <div key={i}>
                  <h3>Revision {i + 1}, ungraded</h3>
                  <blockquote>{text}</blockquote>
                </div>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                pendingFocus.current = "revision";
                dispatch({
                  type: "keep-revision",
                  id,
                  attempt: state.current.id,
                });
              }}
            >
              <label className="workshop-field" htmlFor="workshop-revision">
                <span>Your revised explanation</span>
                <textarea
                  id="workshop-revision"
                  maxLength={4000}
                  value={state.revisionDraft}
                  aria-invalid={!!state.revisionProblem}
                  aria-describedby={
                    state.revisionProblem
                      ? "workshop-revision-error"
                      : undefined
                  }
                  onChange={(event) =>
                    dispatch({
                      type: "write-revision",
                      id,
                      text: event.target.value,
                    })
                  }
                />
              </label>
              {state.revisionProblem && (
                <p
                  className="workshop-error"
                  id="workshop-revision-error"
                  role="alert"
                >
                  {state.revisionProblem}
                </p>
              )}
              <div className="workshop-actions">
                <button type="submit">Keep this revision</button>
              </div>
              <p
                id="workshop-revision-status"
                tabIndex={-1}
                role="status"
                className="workshop-hint"
              >
                {state.current.revisions.length
                  ? `${state.current.revisions.length} revision${state.current.revisions.length === 1 ? "" : "s"} retained with this construction. Text remains ungraded.`
                  : "Keeping a revision preserves the initial explanation."}
              </p>
            </form>
          </div>
        </section>
      )}
      <details className="workshop-history">
        <summary>
          Checked constructions (
          {state.history.length + (state.phase === "inspected" ? 1 : 0)})
        </summary>
        {state.history.map((attempt, i) => (
          <WorkshopAttemptHistory key={i} attempt={attempt} number={i + 1} />
        ))}
        {state.phase === "inspected" && (
          <WorkshopAttemptHistory
            attempt={state.current}
            number={state.history.length + 1}
          />
        )}
        {state.phase === "drafting" && !state.history.length && (
          <p>No checked construction yet.</p>
        )}
      </details>
      <section className="workshop-continuation">
        <h2>Continue in the existing lessons</h2>
        <p>
          Open a definition or theorem, then return to this investigation with
          your in-tab work retained.
        </p>
        <div className="workshop-actions">
          {definition.lessons.map((lessonId) => {
            const lesson = concepts.find((item) => item.id === lessonId);
            return lesson ? (
              <button key={lessonId} onClick={() => openLesson(lessonId)}>
                <MathText text={lesson.title} />
              </button>
            ) : null;
          })}
          <button onClick={() => study.openClinic(definition.clinic)}>
            Related Clinic case
          </button>
        </div>
      </section>
      <p className="sr-only" aria-live="polite">
        {state.phase === "inspected"
          ? state.current.report.title + ". " + state.current.report.scope
          : "Drafting a construction. No current checked result."}
      </p>
    </div>
  );
}
