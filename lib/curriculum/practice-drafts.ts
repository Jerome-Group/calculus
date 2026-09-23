export type PracticeDraft = {
  answer: string;
  hintOpen: boolean;
  solutionOpen: boolean;
};

const version = 1;
const memory = new Map<string, PracticeDraft>();
const pending = new Set<string>();
const empty = (): PracticeDraft => ({
  answer: "",
  hintOpen: false,
  solutionOpen: false,
});

export function practiceDraftKey(lessonId: string, exerciseId = "core") {
  return `calculus-practice-draft:v${version}:${lessonId}:${exerciseId}`;
}

function valid(value: unknown): value is PracticeDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<PracticeDraft>;
  return (
    typeof draft.answer === "string" &&
    typeof draft.hintOpen === "boolean" &&
    typeof draft.solutionOpen === "boolean"
  );
}

export function readPracticeDraft(lessonId: string, exerciseId = "core") {
  const key = practiceDraftKey(lessonId, exerciseId);
  if (pending.has(key))
    return { draft: memory.get(key) || empty(), stored: false };
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (valid(parsed)) {
        memory.set(key, parsed);
        return { draft: parsed, stored: true };
      }
    }
  } catch {
    return { draft: memory.get(key) || empty(), stored: false };
  }
  return { draft: memory.get(key) || empty(), stored: true };
}

export function writePracticeDraft(
  lessonId: string,
  draft: PracticeDraft,
  exerciseId = "core",
) {
  const key = practiceDraftKey(lessonId, exerciseId);
  memory.set(key, draft);
  try {
    localStorage.setItem(key, JSON.stringify(draft));
    pending.delete(key);
    return true;
  } catch {
    pending.add(key);
    return false;
  }
}

export function deletePracticeDraft(lessonId: string, exerciseId = "core") {
  const key = practiceDraftKey(lessonId, exerciseId);
  memory.delete(key);
  try {
    localStorage.removeItem(key);
    pending.delete(key);
    return true;
  } catch {
    pending.add(key);
    return false;
  }
}
