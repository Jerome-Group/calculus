"use client";
import { useSyncExternalStore } from "react";
import { concepts } from "@/lib/curriculum";
import {
  subscribeProgress,
  progressSnapshot,
  resumeSnapshot,
  parseProgress,
} from "@/lib/curriculum/progress-store";
export function StudyProgress({ open }: { open: (id: string) => void }) {
  const raw = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    () => "{}",
  );
  const last = useSyncExternalStore(
    subscribeProgress,
    resumeSnapshot,
    () => "",
  );
  const records = parseProgress(raw);
  const reviewed = concepts.filter(
    (c) => records[c.id]?.status === "Can explain independently",
  );
  const practice = concepts.filter(
    (c) => records[c.id]?.status === "Needs practice",
  );
  const resume = concepts.find((c) => c.id === last);
  return (
    <section className="study-progress" aria-label="Study on this device">
      <h2>Your study on this device</h2>
      <p>
        {reviewed.length} self-assessed as explainable · {practice.length}{" "}
        marked for practice. Opening a lesson does not award mastery.
      </p>
      {resume && (
        <button onClick={() => open(resume.id)}>Resume: {resume.title}</button>
      )}
      {practice.length > 0 && (
        <details>
          <summary>Revisit practice ({practice.length})</summary>
          {practice.map((c) => (
            <button key={c.id} onClick={() => open(c.id)}>
              {c.title}
            </button>
          ))}
        </details>
      )}
    </section>
  );
}
