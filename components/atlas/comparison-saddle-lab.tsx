"use client";
import { useState } from "react";
import { saddleSlice } from "@/lib/curriculum/comparison-labs";
import { Formula } from "./math-text";
import {
  Chart,
  line,
  number,
  Prediction,
  Range,
} from "./comparison-lab-controls";
export function Saddle() {
  const [a, setA] = useState(-1),
    [theta, setTheta] = useState(Math.PI / 2);
  const result = saddleSlice(a, theta);
  return (
    <>
      <p>
        Stationary means zero first-order slope. Which way does the surface
        bend?
      </p>
      <Formula
        block
      >{String.raw`f=x^2+ay^2,\quad f(t\cos\theta,t\sin\theta)=t^2(\cos^2\theta+a\sin^2\theta)`}</Formula>
      <Chart
        label="Directional section through stationary point"
        description={`Selected section coefficient ${number(result.coefficient)}; x section coefficient 1. Full surface classification: ${result.classification}.`}
      >
        <polyline
          className="compare-primary"
          points={line((t) => [
            160 + 120 * t,
            110 - 50 * result.coefficient * t * t,
          ])}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <polyline
          className="compare-secondary"
          points={line((t) => [160 + 120 * t, 110 - 50 * t * t])}
          fill="none"
          stroke="currentColor"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
        <path d="M30 110H300" stroke="currentColor" opacity=".3" />
        <circle cx="160" cy="110" r="4" fill="currentColor" />
        <text x="32" y="202" fill="currentColor" fontSize="11">
          −1 ← section parameter t → 1
        </text>
      </Chart>
      <Range
        label="Curvature coefficient a"
        value={a}
        min={-1.5}
        max={1.5}
        step={0.05}
        onChange={setA}
      />
      <Range
        label="Slice direction θ (radians)"
        value={theta}
        min={0}
        max={Math.PI}
        onChange={setTheta}
      />
      <div
        className="compare-choices"
        role="group"
        aria-label="Exact principal directions"
      >
        <button
          type="button"
          aria-pressed={theta === 0}
          onClick={() => setTheta(0)}
        >
          x-section θ = 0
        </button>
        <button
          type="button"
          aria-pressed={theta === Math.PI / 2}
          onClick={() => setTheta(Math.PI / 2)}
        >
          y-section θ = π/2
        </button>
      </div>
      <button type="button" onClick={() => setA(0)}>
        Set a = 0
      </button>
      <p className="compare-readout">
        Selected coefficient {number(result.coefficient)}; det H ={" "}
        {number(result.determinant)}. Full surface: {result.classification}.
      </p>
      <p className="compare-caption">
        Solid: selected directional slice. Dashed: x-axis slice, always
        increasing away from zero. The gradient at zero is (0,0) for every a.
        The smooth quadratic meets the second-derivative test’s hypotheses.
      </p>
      <Prediction
        question="At a = 0, the Hessian test is inconclusive. Is there a minimum?"
        choices={[
          "No conclusion possible by any method",
          "Yes, direct comparison decides",
        ]}
        answer={1}
        reason="f = x² ≥ 0, so every point on x = 0 is a non-strict minimum. Inconclusive describes the test, not the function."
      />
      <button
        type="button"
        onClick={() => {
          setA(-1);
          setTheta(Math.PI / 2);
        }}
      >
        Reset slices
      </button>
    </>
  );
}
