export function createDraftStore<D>(
  namespace: string,
  empty: () => D,
  valid: (value: unknown) => value is D,
) {
  const memory = new Map<string, D>();
  const pending = new Set<string>();
  const key = (lessonId: string, partId: string) =>
    `${namespace}:${lessonId}:${partId}`;

  function read(lessonId: string, partId: string) {
    const id = key(lessonId, partId);
    if (pending.has(id))
      return { draft: memory.get(id) || empty(), stored: false };
    try {
      const raw = localStorage.getItem(id);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (valid(parsed)) {
          memory.set(id, parsed);
          return { draft: parsed, stored: true };
        }
      }
    } catch {
      return { draft: memory.get(id) || empty(), stored: false };
    }
    return { draft: memory.get(id) || empty(), stored: true };
  }

  function write(lessonId: string, partId: string, draft: D) {
    const id = key(lessonId, partId);
    memory.set(id, draft);
    try {
      localStorage.setItem(id, JSON.stringify(draft));
      pending.delete(id);
      return true;
    } catch {
      pending.add(id);
      return false;
    }
  }

  function remove(lessonId: string, partId: string) {
    const id = key(lessonId, partId);
    memory.delete(id);
    try {
      localStorage.removeItem(id);
      pending.delete(id);
      return true;
    } catch {
      pending.add(id);
      return false;
    }
  }

  return { key, read, write, remove };
}
