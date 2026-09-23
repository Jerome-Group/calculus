import { createDraftStore } from "./draft-store";

export type PracticeDraft = {
  answer: string;
  hintOpen: boolean;
  solutionOpen: boolean;
};

const empty = (): PracticeDraft => ({
  answer: "",
  hintOpen: false,
  solutionOpen: false,
});

function valid(value: unknown): value is PracticeDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<PracticeDraft>;
  return (
    typeof draft.answer === "string" &&
    typeof draft.hintOpen === "boolean" &&
    typeof draft.solutionOpen === "boolean"
  );
}

const store = createDraftStore("calculus-practice-draft:v1", empty, valid);

export function practiceDraftKey(lessonId: string, exerciseId = "core") {
  return store.key(lessonId, exerciseId);
}

export function readPracticeDraft(lessonId: string, exerciseId = "core") {
  return store.read(lessonId, exerciseId);
}

export function writePracticeDraft(
  lessonId: string,
  draft: PracticeDraft,
  exerciseId = "core",
) {
  return store.write(lessonId, exerciseId, draft);
}

export function deletePracticeDraft(lessonId: string, exerciseId = "core") {
  return store.remove(lessonId, exerciseId);
}
