"use client";
import { useState } from "react";
import { triangleFibre } from "@/lib/curriculum/comparison-labs";
import { Formula } from "./math-text";
import { Chart, number, Prediction, Range } from "./comparison-lab-controls";
export function Fibre() {
  const [outer, setOuter] = useState(0.8),
    [horizontal, setHorizontal] = useState(false);
  const result = triangleFibre(outer)!;
  return (
    <>
      <p>Keep the region fixed. Change which coordinate you hold still.</p>
      <Formula block>
        {horizontal
          ? String.raw`\int_0^2\int_0^{2-y}(1+x+y)\,dx\,dy`
          : String.raw`\int_0^2\int_0^{2-x}(1+x+y)\,dy\,dx`}
      </Formula>
      <Chart
        label="Triangular region and integration fibre"
        description={`Triangle x,y nonnegative, x+y≤2. ${horizontal ? "Horizontal" : "Vertical"} fibre at ${number(outer)} from 0 to ${number(result.upper)}.`}
      >
        <path d="M50 175H270L50 35Z" fill="currentColor" opacity=".1" />
        <path d="M50 175H270L50 35Z" fill="none" stroke="currentColor" />
        {horizontal ? (
          <path
            d={`M50 ${175 - 70 * outer}H${50 + 110 * result.upper}`}
            stroke="currentColor"
            strokeWidth="5"
          />
        ) : (
          <path
            d={`M${50 + 110 * outer} 175V${175 - 70 * result.upper}`}
            stroke="currentColor"
            strokeWidth="5"
          />
        )}
        <text x="280" y="180" fill="currentColor" fontSize="12">
          x
        </text>
        <text x="45" y="26" fill="currentColor" fontSize="12">
          y
        </text>
        <text x="50" y="202" fill="currentColor" fontSize="11">
          0 ≤ x, y; x + y ≤ 2
        </text>
      </Chart>
      <Range
        label={`Held coordinate ${horizontal ? "y" : "x"}`}
        value={outer}
        min={0}
        max={2}
        onChange={setOuter}
      />
      <button
        type="button"
        aria-pressed={horizontal}
        onClick={() => setHorizontal((value) => !value)}
      >
        Swap integration order
      </button>
      <p className="compare-readout">
        Inner bounds: 0 to {number(result.upper)}. Integrated fibre:{" "}
        {number(result.innerIntegral)}. Total integral: 14/3 in both orders;
        region area: 2.
      </p>
      <Formula
        block
      >{String.raw`A(q)=\int_0^{2-q}(1+q+t)\,dt=4-q-\frac{q^2}{2},\quad\int_0^2 A(q)\,dq=\frac{14}{3}`}</Formula>
      <p className="compare-caption">
        The highlighted fibre fills precisely the triangle. Density 1+x+y is
        continuous on the compact region; the region-slicing formula justifies
        these bounds. The inner integral depends on the held coordinate.
      </p>
      <Prediction
        question="Does swapping the order let you keep the same inner variable and bounds unchanged?"
        choices={["Yes", "No"]}
        answer={1}
        reason="Vertical fibres use 0≤y≤2−x; horizontal fibres use 0≤x≤2−y. Derive the bounds from x+y≤2."
      />
      <button
        type="button"
        onClick={() => {
          setOuter(0.8);
          setHorizontal(false);
        }}
      >
        Reset fibres
      </button>
    </>
  );
}
