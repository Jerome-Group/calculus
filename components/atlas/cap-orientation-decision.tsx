"use client";
import { useState } from "react";
import { capDecision } from "@/lib/curriculum/cap-orientation";
import { Formula, MathText } from "./math-text";

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
        Fixed example: upper hemisphere of radius <Formula>2</Formula>, with its
        equatorial disk when selected. The regular field is{" "}
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
            Cap flux <Formula>{outward ? "+16\\pi" : "-16\\pi"}</Formula>;{" "}
            {closed && (
              <>
                closing disk flux <Formula>0</Formula>;{" "}
              </>
            )}
            scalar cap area <Formula>{"8\\pi"}</Formula> under either normal.
          </>
        ) : (
          <>
            The singular field is{" "}
            <Formula>{String.raw`\mathbf r/\|\mathbf r\|^3`}</Formula>.
          </>
        )}
      </p>
      <p>
        {result.theoremEligible ? (
          <>
            Eligible: divergence <Formula>3</Formula> times hemisphere volume{" "}
            <Formula>{"16\\pi/3"}</Formula> gives outward flux{" "}
            <Formula>{"16\\pi"}</Formula>.{" "}
          </>
        ) : (
          <>
            Direct divergence-theorem equality is unavailable for this
            choice.{" "}
          </>
        )}
        <MathText text={result.reason} />
      </p>
    </aside>
  );
}
