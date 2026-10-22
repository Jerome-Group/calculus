"use client";
import { useLayoutEffect, useRef } from "react";
import { ArrowRight, Check, CornerUpLeft, RotateCcw } from "lucide-react";
import { concepts } from "@/lib/curriculum";
import type { ClinicCase, ClinicQuestion } from "@/lib/clinic/cases";
import type { ClinicAttempt } from "@/lib/clinic/session";
import type { ClinicController } from "./use-clinic-session";
import type { ClinicReturn } from "./clinic-history";
import type { ClinicWorkspaceProps } from "./clinic-workspace";
import { MathText } from "./math-text";
function Question({
  question,
  name,
  selected,
  choose,
  disabled = false,
}: {
  question: ClinicQuestion;
  name: string;
  selected: string | null;
  choose: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="clinic-question" disabled={disabled}>
      <legend>
        <MathText text={question.prompt} />
      </legend>
      <div className="clinic-choices">
        {question.choices.map((choice, i) => (
          <label
            key={choice.id}
            className={selected === choice.id ? "is-selected" : ""}
          >
            <input
              type="radio"
              name={name}
              value={choice.id}
              checked={selected === choice.id}
              onChange={() => choose(choice.id)}
            />
            <span className="clinic-choice-letter" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            <span>
              <MathText text={choice.text} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Recovery({
  lessonId,
  onOpen,
}: {
  lessonId: string;
  onOpen: () => void;
}) {
  const lesson = concepts.find((item) => item.id === lessonId);
  return (
    <button className="clinic-recovery" onClick={onOpen}>
      <CornerUpLeft size={17} />
      <span>
        <small>REVIEW THE IDEA, THEN RETURN</small>
        <MathText text={lesson?.title ?? lessonId} />
      </span>
      <ArrowRight size={17} />
    </button>
  );
}
export function ClinicCaseAttempt({
  content,
  attempt,
  dispatch,
  recover,
  next,
}: {
  content: ClinicCase;
  attempt: ClinicAttempt;
  dispatch: ClinicController["dispatch"];
  recover: ClinicWorkspaceProps["recover"];
  next: () => void;
}) {
  const previousPhase = useRef(attempt.phase);
  useLayoutEffect(() => {
    if (previousPhase.current === attempt.phase) return;
    previousPhase.current = attempt.phase;
    const target = document.getElementById(
      attempt.phase === "explained"
        ? "clinic-diagnosis"
        : attempt.phase === "transfer"
          ? "clinic-transfer-title"
          : attempt.phase === "checked"
            ? "clinic-transfer-feedback"
            : "clinic-case-title",
    );
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start" });
  }, [attempt.phase]);
  const decision =
    attempt.phase === "decision"
      ? null
      : content.decision.choices.find(
          (choice) => choice.id === attempt.decision,
        );
  const transfer =
    attempt.phase === "checked"
      ? content.transfer.choices.find(
          (choice) => choice.id === attempt.transfer,
        )
      : null;
  const act = (type: "commit" | "continue" | "restart") =>
    dispatch({ caseId: content.id, type });
  const openRecovery = (lessonId: string, focus: ClinicReturn["focus"]) =>
    recover(lessonId, {
      version: 1,
      caseId: content.id,
      focus,
      scrollY: Math.min(10_000_000, Math.max(0, window.scrollY)),
    });
  return (
    <>
      <ol className="clinic-steps" aria-label="Case stages">
        {[
          ["01", "Make a decision", attempt.phase === "decision"],
          ["02", "Inspect the argument", attempt.phase === "explained"],
          [
            "03",
            "Transfer the idea",
            attempt.phase === "transfer" || attempt.phase === "checked",
          ],
        ].map(([number, label, active]) => (
          <li key={String(number)} aria-current={active ? "step" : undefined}>
            <span>{number}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="clinic-case-grid">
        <div className="clinic-case-body">
          <section className="clinic-panel">
            <span className="eyebrow">THE SITUATION</span>
            <p className="clinic-situation">
              <MathText text={content.situation} />
            </p>
            <Question
              question={content.decision}
              name="clinic-decision"
              selected={
                attempt.phase === "decision" ? attempt.draft : attempt.decision
              }
              disabled={attempt.phase !== "decision"}
              choose={(choiceId) =>
                dispatch({ caseId: content.id, type: "choose", choiceId })
              }
            />
            {attempt.phase === "decision" && (
              <button
                className="clinic-primary"
                disabled={!attempt.draft}
                onClick={() => act("commit")}
              >
                Explain my decision <ArrowRight size={17} />
              </button>
            )}
          </section>
          {decision && (
            <>
              <section
                className={`clinic-panel clinic-diagnosis ${decision.correct ? "is-sound" : "is-repair"}`}
                aria-labelledby="clinic-diagnosis"
              >
                <span className="eyebrow">
                  {decision.correct
                    ? "SOUND DECISION"
                    : "A DISTINCTION TO REPAIR"}
                </span>
                <h3 id="clinic-diagnosis" tabIndex={-1}>
                  {decision.title}
                </h3>
                <p>
                  <MathText text={decision.explanation} />
                </p>
                <Recovery
                  lessonId={decision.recovery}
                  onOpen={() => openRecovery(decision.recovery, "diagnosis")}
                />
              </section>
              <section
                className="clinic-panel clinic-argument"
                aria-label="Exact worked argument"
              >
                <span className="eyebrow">THE EXACT ARGUMENT</span>
                <h3>Make every assumption count.</h3>
                <ol>
                  {content.argument.map((step, i) => (
                    <li key={step.title}>
                      <span aria-hidden="true">{i + 1}</span>
                      <div>
                        <h4>{step.title}</h4>
                        <p>
                          <MathText text={step.text} />
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                {attempt.phase === "explained" && (
                  <button
                    className="clinic-primary"
                    onClick={() => act("continue")}
                  >
                    Try the transfer check <ArrowRight size={17} />
                  </button>
                )}
              </section>
            </>
          )}
          {(attempt.phase === "transfer" || attempt.phase === "checked") && (
            <section
              className="clinic-panel clinic-transfer"
              aria-labelledby="clinic-transfer-title"
            >
              <span className="eyebrow">A DIFFERENT SITUATION</span>
              <h3 id="clinic-transfer-title" tabIndex={-1}>
                Does the idea transfer?
              </h3>
              <Question
                question={content.transfer}
                name="clinic-transfer"
                selected={
                  attempt.phase === "transfer"
                    ? attempt.draft
                    : attempt.transfer
                }
                disabled={attempt.phase === "checked"}
                choose={(choiceId) =>
                  dispatch({ caseId: content.id, type: "choose", choiceId })
                }
              />
              {attempt.phase === "transfer" && (
                <button
                  className="clinic-primary"
                  disabled={!attempt.draft}
                  onClick={() => act("commit")}
                >
                  Check transfer choice <Check size={17} />
                </button>
              )}
              {transfer && (
                <div
                  className={`clinic-transfer-result ${transfer.correct ? "is-sound" : "is-repair"}`}
                >
                  <span className="eyebrow">
                    {transfer.correct
                      ? "SOUND TRANSFER CHOICE"
                      : "REVISIT THIS DISTINCTION"}
                  </span>
                  <h4 id="clinic-transfer-feedback" tabIndex={-1}>
                    {transfer.title}
                  </h4>
                  <p>
                    <MathText text={transfer.explanation} />
                  </p>
                  <Recovery
                    lessonId={transfer.recovery}
                    onOpen={() => openRecovery(transfer.recovery, "feedback")}
                  />
                  <p className="clinic-limit">
                    This feedback checks your selected choice. It does not grade
                    your reasoning or establish mastery.
                  </p>
                </div>
              )}
            </section>
          )}
          <footer className="clinic-case-actions">
            <button onClick={() => act("restart")}>
              <RotateCcw size={16} /> Restart this case
            </button>
            <button onClick={next}>
              Next case <ArrowRight size={16} />
            </button>
          </footer>
        </div>
        <aside className="clinic-notebook">
          <span className="eyebrow">YOUR REASONING</span>
          <h3>Put the hypothesis into words.</h3>
          <p>
            What makes your decision valid? Write a line before revealing the
            argument, then revise it.
          </p>
          <label htmlFor="clinic-reasoning">
            Private scratch work · ungraded
          </label>
          <textarea
            id="clinic-reasoning"
            value={attempt.note}
            maxLength={2000}
            rows={8}
            placeholder="I can use the theorem if…"
            onChange={(event) =>
              dispatch({
                caseId: content.id,
                type: "write",
                note: event.target.value,
              })
            }
          />
          <small>{attempt.note.length} / 2000 characters</small>
          <p>
            Your words stay in this tab&apos;s memory. They are not submitted or
            graded. Reloading clears them.
          </p>
        </aside>
      </div>
    </>
  );
}
