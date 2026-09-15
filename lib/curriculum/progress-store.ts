export const progressEvent = "calculus-progress";
const progressKey = "calculus-practice";
const resumeKey = "calculus-last-lesson";
export type PracticeStatus = "Needs practice" | "Can explain independently";
export type PracticeRecord = { status: PracticeStatus; date: string };
export function progressSnapshot() {
  try {
    return localStorage.getItem(progressKey) || "{}";
  } catch {
    return "{}";
  }
}
export function parseProgress(raw: string): Record<string, PracticeRecord> {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => {
        const record = value as Partial<PracticeRecord> | null;
        return (
          record &&
          typeof record.date === "string" &&
          ["Needs practice", "Can explain independently"].includes(
            record.status || "",
          )
        );
      }),
    ) as Record<string, PracticeRecord>;
  } catch {
    return {};
  }
}
export function savePractice(id: string, status: PracticeStatus) {
  localStorage.setItem(
    progressKey,
    JSON.stringify({
      ...parseProgress(progressSnapshot()),
      [id]: { status, date: new Date().toISOString() },
    }),
  );
  window.dispatchEvent(new Event(progressEvent));
}
export function resumeSnapshot() {
  try {
    return localStorage.getItem(resumeKey) || "";
  } catch {
    return "";
  }
}
export function saveResume(id: string) {
  try {
    localStorage.setItem(resumeKey, id);
    window.dispatchEvent(new Event(progressEvent));
  } catch {
    /* Reading remains available without storage. */
  }
}
export function subscribeProgress(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(progressEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(progressEvent, callback);
  };
}
