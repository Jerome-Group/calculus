"use client";
import { useState } from "react";
import { capDecision } from "@/lib/curriculum/cap-orientation";
import { Formula } from "./math-text";

export function CapOrientationDecision() {
  const [closed, setClosed] = useState(false);
  const [outward, setOutward] = useState(true);
  const [regular, setRegular] = useState(true);
  const result = capDecision({ closed, outward, regular });
  return (
    <aside
      className="scale-note"
      aria-label="Cap orientation and theorem decision"
    >
      <h3>Can the divergence theorem be used?</h3>
      <p>
        Fixed example: upper hemisphere of radius 2, with its equatorial disk
        when selected. The regular field is{" "}
        <Formula>{String.raw`\mathbf F=(x,y,z)`}</Formula>.
      </p>
      <div
        className="landmarks"
        role="group"
        aria-label="Boundary and field choices"
      >
        <button
          type="button"
          aria-pressed={closed}
          onClick={() => setClosed((value) => !value)}
        >
          {closed ? "Cap + closing disk" : "Open cap only"}
        </button>
        <button
          type="button"
          aria-pressed={!outward}
          onClick={() => setOutward((value) => !value)}
        >
          {outward ? "Outward from half-ball" : "Inward to half-ball"}
        </button>
        <button
          type="button"
          aria-pressed={!regular}
          onClick={() => setRegular((value) => !value)}
        >
          {regular ? "Regular field" : "Field singular at origin"}
        </button>
      </div>
      <p>
        {regular ? (
          <>
            Cap flux {outward ? "+" : "−"}16π;{" "}
            {closed ? "closing disk flux 0; " : ""}
            scalar cap area 8π under either normal.
          </>
        ) : (
          <>
            The singular field is{" "}
            <Formula>{String.raw`\mathbf r/\|\mathbf r\|^3`}</Formula>.
          </>
        )}
      </p>
      <p>
        {result.theoremEligible
          ? "Eligible: divergence 3 times hemisphere volume 16π/3 gives outward flux 16π."
          : "Direct divergence-theorem equality is unavailable for this choice."}{" "}
        {result.reason}
      </p>
    </aside>
  );
}
