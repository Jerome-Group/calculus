import { inspectConstruction } from "./checks";
import { startingConstruction } from "./catalog";
import type {
  Attempt,
  Construction,
  InvestigationId,
  WorkshopAction,
  WorkshopBook,
  WorkshopState,
} from "./types";
export {
  investigations,
  investigation,
  investigationsForLesson,
  isInvestigationId,
} from "./catalog";
export type {
  Attempt,
  Construction,
  Draft,
  FieldIssue,
  InvestigationId,
  MathLine,
  ProofReport,
  WorkshopAction,
  WorkshopBook,
  WorkshopState,
} from "./types";

function copyConstruction(input: Construction): Construction {
  return input.kind === "domain-loop"
    ? Object.freeze({
        ...input,
        vertices: Object.freeze(
          input.vertices.map(([x, y]) =>
            Object.freeze([x, y] satisfies [string, string]),
          ),
        ),
      })
    : Object.freeze({ ...input });
}
function initialState(id: InvestigationId): WorkshopState {
  return {
    phase: "drafting",
    draft: { construction: startingConstruction(id), explanation: "" },
    history: [],
    issues: [],
  };
}
export function createWorkshop(): WorkshopBook {
  return {
    "linear-bound": initialState("linear-bound"),
    "cubic-path": initialState("cubic-path"),
    "domain-loop": initialState("domain-loop"),
  };
}
export function workshopTransition(
  book: WorkshopBook,
  action: WorkshopAction,
): WorkshopBook {
  const id =
    action.type === "write" ? action.draft.construction.kind : action.id;
  const state = book[id];
  let next: WorkshopState;
  switch (action.type) {
    case "write":
      if (state.phase !== "drafting") return book;
      next = {
        ...state,
        draft: {
          construction: copyConstruction(action.draft.construction),
          explanation: action.draft.explanation,
        },
        issues: [],
      };
      break;
    case "check": {
      if (state.phase !== "drafting") return book;
      const result = inspectConstruction(state.draft.construction);
      const text = state.draft.explanation;
      const issues = [
        ...(result.kind === "invalid" ? result.issues : []),
        ...(!text.trim() || text.length > 4000
          ? [
              {
                field: "explanation",
                message:
                  "Write your initial explanation in 1 through 4,000 characters. This text is ungraded.",
              },
            ]
          : []),
      ];
      if (result.kind === "invalid" || issues.length) {
        next = { ...state, issues };
        break;
      }
      const current: Attempt = Object.freeze({
        id: Symbol(id),
        construction: copyConstruction(state.draft.construction),
        initialExplanation: text,
        report: result.report,
        revisions: Object.freeze([]),
      });
      next = {
        phase: "inspected",
        current,
        history: state.history,
        revisionDraft: "",
        revisionProblem: "",
      };
      break;
    }
    case "reconstruct":
      if (state.phase !== "inspected") return book;
      next = {
        phase: "drafting",
        draft: {
          construction: copyConstruction(state.current.construction),
          explanation: "",
        },
        history: [...state.history, state.current],
        issues: [],
      };
      break;
    case "write-revision":
      if (state.phase !== "inspected") return book;
      next = { ...state, revisionDraft: action.text, revisionProblem: "" };
      break;
    case "keep-revision":
      if (state.phase !== "inspected" || action.attempt !== state.current.id)
        return book;
      if (!state.revisionDraft.trim() || state.revisionDraft.length > 4000) {
        next = {
          ...state,
          revisionProblem:
            "Write a revision in 1 through 4,000 characters. This text is ungraded.",
        };
        break;
      }
      next = {
        ...state,
        current: Object.freeze({
          ...state.current,
          revisions: Object.freeze([
            ...state.current.revisions,
            state.revisionDraft,
          ]),
        }),
        revisionDraft: "",
        revisionProblem: "",
      };
      break;
  }
  return { ...book, [id]: next };
}
