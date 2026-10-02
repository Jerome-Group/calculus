"use client";
import { useState } from "react";
import { polarTile } from "@/lib/curriculum/comparison-labs";
import { Formula } from "./math-text";
import { Chart, number, Prediction, Range } from "./comparison-lab-controls";
export function Polar() {
  const [radius, setRadius] = useState(1),
    [width, setWidth] = useState(0.3);
  const angle = Math.PI / 6,
    result = polarTile(radius, width, angle);
  const inner = radius * 65,
    outer = (radius + width) * 65;
  const arc = (r: number) =>
    `${55 + r * Math.cos(angle)},${175 - r * Math.sin(angle)}`;
  return (
    <>
      <p>
        Equal parameter rectangles have unequal physical areas. Inspect one tile
        inside the radius-2 disk.
      </p>
      <Formula
        block
      >{String.raw`x=r\cos\theta,\quad y=r\sin\theta,\quad dA=r\,dr\,d\theta`}</Formula>
      <div className="compare-views">
        <Chart
          label="Parameter rectangle"
          description={`Radial width ${number(width)}, angular width π/6. Parameter area ${number(result.parameterArea)}.`}
        >
          <rect
            x="75"
            y="75"
            width={width * 170}
            height="75"
            fill="currentColor"
            opacity=".18"
          />
          <rect
            x="75"
            y="75"
            width={width * 170}
            height="75"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <text x="75" y="65" fill="currentColor" fontSize="12">
            Δr = {number(width)}
          </text>
          <text x="75" y="170" fill="currentColor" fontSize="12">
            Δθ = π/6
          </text>
        </Chart>
        <Chart
          label="Mapped annular sector"
          description={`Inner radius ${number(radius)}, outer radius ${number(radius + width)}. Exact area ${number(result.exactArea)}; local approximation ${number(result.linearArea)}.`}
        >
          <path
            d={`M${55 + inner} 175 L${55 + outer} 175 A${outer} ${outer} 0 0 0 ${arc(outer)} L${arc(inner)} ${inner === 0 ? "L55 175" : `A${inner} ${inner} 0 0 1 ${55 + inner} 175`} Z`}
            fill="currentColor"
            fillOpacity=".18"
            stroke="currentColor"
            strokeWidth="2"
          />
          <text x="55" y="202" fill="currentColor" fontSize="11">
            r ≤ radius ≤ r + Δr; 0 ≤ θ ≤ π/6
          </text>
        </Chart>
      </div>
      <Range
        label="Inner radius r"
        value={radius}
        min={0}
        max={1.5}
        onChange={setRadius}
      />
      <Range
        label="Radial width Δr"
        value={width}
        min={0.02}
        max={0.5}
        onChange={setWidth}
      />
      <p className="compare-readout">
        Parameter area {number(result.parameterArea)}; physical area{" "}
        {number(result.exactArea)}; local estimate r Δr Δθ ={" "}
        {number(result.linearArea)}.
      </p>
      <Formula
        block
      >{String.raw`\Delta A=\frac{(r+\Delta r)^2-r^2}{2}\Delta\theta=r\Delta r\Delta\theta+\frac{(\Delta r)^2}{2}\Delta\theta`}</Formula>
      <p className="compare-caption">
        The finite tile’s exact area includes a quadratic correction. The
        differential r dr dθ gives local area scaling, not exact finite area at
        the inner radius. At r = 0 the coordinate map is singular; a finite
        sector still has positive area. Full disk area: 4π.
      </p>
      <Prediction
        question="Is r Δr Δθ the exact area of a finite tile when r is its inner radius?"
        choices={["Yes", "No"]}
        answer={1}
        reason="The exact sector difference adds (Δr)² Δθ/2. Shrink Δr to make this correction smaller."
      />
      <button
        type="button"
        onClick={() => {
          setRadius(1);
          setWidth(0.3);
        }}
      >
        Reset tile
      </button>
    </>
  );
}
