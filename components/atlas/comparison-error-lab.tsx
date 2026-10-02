"use client";
import { useState } from "react";
import { approximationErrors } from "@/lib/curriculum/comparison-labs";
import { Formula } from "./math-text";
import {
  Chart,
  line,
  number,
  Prediction,
  Range,
} from "./comparison-lab-controls";
export function Errors() {
  const [radius, setRadius] = useState(0.6),
    [theta, setTheta] = useState(Math.PI / 4);
  const result = approximationErrors(radius, theta);
  return (
    <>
      <p>
        A small gap can hide a failed linear approximation. Compare the gap with
        input distance.
      </p>
      <Formula
        block
      >{String.raw`\frac{|f(p+h)-f(p)-Ah|}{\|h\|}\longrightarrow0`}</Formula>
      <div className="compare-views">
        {([false, true] as const).map((relative) => (
          <Chart
            key={String(relative)}
            label={
              relative
                ? "Normalized approximation error"
                : "Absolute approximation error"
            }
            description={`At radius ${number(radius)}, bowl error ${number(relative ? result.bowlRelative : result.bowlAbsolute)}, counterexample error ${number(relative ? result.counterRelative : result.counterAbsolute)}.`}
          >
            <path
              d="M30 20V180H300"
              fill="none"
              stroke="currentColor"
              opacity=".25"
            />
            <text x="35" y="30" fill="currentColor" fontSize="11">
              {relative ? "gap / r" : "gap"}
            </text>
            <polyline
              className="compare-primary"
              points={line(
                (r) => [30 + 270 * r, 180 - 150 * (relative ? r : r * r)],
                0,
                1,
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <polyline
              className="compare-secondary"
              points={line(
                (r) => [
                  30 + 270 * r,
                  180 - 150 * result.counterRelative * (relative ? 1 : r),
                ],
                0,
                1,
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="5 4"
            />
            <path
              d={`M${30 + 270 * radius} 25V180`}
              stroke="currentColor"
              opacity=".35"
            />
            <text x="32" y="202" fill="currentColor" fontSize="11">
              radius r: 0 ← shrink → 1
            </text>
          </Chart>
        ))}
      </div>
      <Range
        label="Radius r > 0"
        value={radius}
        min={0.01}
        max={1}
        onChange={setRadius}
      />
      <Range
        label="Direction θ (radians)"
        value={theta}
        min={0}
        max={Math.PI}
        onChange={setTheta}
      />
      <div
        className="compare-choices"
        role="group"
        aria-label="Exact error directions"
      >
        <button
          type="button"
          aria-pressed={theta === 0}
          onClick={() => setTheta(0)}
        >
          Axis θ = 0
        </button>
        <button
          type="button"
          aria-pressed={theta === Math.PI / 4}
          onClick={() => setTheta(Math.PI / 4)}
        >
          Diagonal θ = π/4
        </button>
      </div>
      <p className="compare-readout">
        Bowl: gap {number(result.bowlAbsolute)}, gap/r{" "}
        {number(result.bowlRelative)}. Counterexample: gap{" "}
        {number(result.counterAbsolute)}, gap/r {number(result.counterRelative)}
        .
      </p>
      <Formula
        block
      >{String.raw`\begin{aligned}f=x^2+y^2, p=(1,1):&\quad |R|/r=r\\g=x^3/(x^2+y^2), g(0)=0:&\quad |g-x|/r=|\cos\theta\sin^2\theta|\end{aligned}`}</Formula>
      <p className="compare-caption">
        Solid: bowl with certified tangent plane. Dashed: continuous
        counterexample with candidate plane z = x. Its partials (1,0) exist, but
        the candidate fails. For the bowl, the exact bound r covers every
        direction; samples alone prove no limit.
      </p>
      <Prediction
        question="Both absolute gaps shrink. Does that establish differentiability?"
        choices={["Yes", "No"]}
        answer={1}
        reason="At θ = π/4 the counterexample's gap/r remains 1/(2√2). The bowl's gap/r tends to zero."
      />
      <button
        type="button"
        onClick={() => {
          setRadius(0.6);
          setTheta(Math.PI / 4);
        }}
      >
        Reset errors
      </button>
    </>
  );
}
