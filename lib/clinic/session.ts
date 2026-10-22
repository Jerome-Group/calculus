import { clinicCase, type ClinicCaseId } from "./cases";

type AttemptNote = { note: string };
export type ClinicAttempt = AttemptNote &
  (
    | { phase: "decision"; draft: string | null }
    | { phase: "explained"; decision: string }
    | { phase: "transfer"; decision: string; draft: string | null }
    | { phase: "checked"; decision: string; transfer: string }
  );
export type ClinicSession = Partial<Record<ClinicCaseId, ClinicAttempt>>;
export type ClinicEvent = { caseId: ClinicCaseId } & (
  | { type: "choose"; choiceId: string }
  | { type: "write"; note: string }
  | { type: "commit" }
  | { type: "continue" }
  | { type: "restart" }
);
export function clinicAttempt(
  session: ClinicSession,
  id: ClinicCaseId,
): ClinicAttempt {
  return session[id] ?? { phase: "decision", draft: null, note: "" };
}
export function clinicTransition(
  session: ClinicSession,
  event: ClinicEvent,
): ClinicSession {
  const attempt = clinicAttempt(session, event.caseId);
  const content = clinicCase(event.caseId);
  let next: ClinicAttempt;
  switch (event.type) {
    case "restart":
      next = { phase: "decision", draft: null, note: "" };
      break;
    case "write":
      next = { ...attempt, note: event.note.slice(0, 2000) };
      break;
    case "choose": {
      if (attempt.phase !== "decision" && attempt.phase !== "transfer")
        return session;
      if (
        !content[attempt.phase].choices.some(
          (choice) => choice.id === event.choiceId,
        )
      )
        return session;
      next = { ...attempt, draft: event.choiceId };
      break;
    }
    case "continue":
      if (attempt.phase !== "explained") return session;
      next = {
        phase: "transfer",
        decision: attempt.decision,
        draft: null,
        note: attempt.note,
      };
      break;
    case "commit":
      if (attempt.phase === "decision" && attempt.draft) {
        next = {
          phase: "explained",
          decision: attempt.draft,
          note: attempt.note,
        };
      } else if (attempt.phase === "transfer" && attempt.draft) {
        next = {
          phase: "checked",
          decision: attempt.decision,
          transfer: attempt.draft,
          note: attempt.note,
        };
      } else return session;
      break;
  }
  return { ...session, [event.caseId]: next };
}
