import type { SupportLevel } from "./learning-modes";
import { createDraftStore } from "./draft-store";

export type PilotTaskDraft = {
  choice: string;
  reasoning: string;
  support: SupportLevel;
  feedback: string;
};

const empty = (): PilotTaskDraft => ({
  choice: "",
  reasoning: "",
  support: "none",
  feedback: "",
});

function valid(value: unknown): value is PilotTaskDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<PilotTaskDraft>;
  return (
    typeof draft.choice === "string" &&
    typeof draft.reasoning === "string" &&
    (draft.support === "none" || draft.support === "hint") &&
    typeof draft.feedback === "string"
  );
}

const store = createDraftStore("calculus-pilot-draft:v1", empty, valid);

export function pilotDraftKey(lessonId: string, taskId: string) {
  return store.key(lessonId, taskId);
}

export function readPilotDraft(lessonId: string, taskId: string) {
  return store.read(lessonId, taskId);
}

export function writePilotDraft(
  lessonId: string,
  taskId: string,
  draft: PilotTaskDraft,
) {
  return store.write(lessonId, taskId, draft);
}

export function deletePilotDraft(lessonId: string, taskId: string) {
  return store.remove(lessonId, taskId);
}
