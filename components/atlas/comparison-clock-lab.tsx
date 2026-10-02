"use client";
import { useState } from "react";
import { helixClock } from "@/lib/curriculum/comparison-labs";
import { Formula } from "./math-text";
import {
  Chart,
  line,
  number,
  Prediction,
  Range,
} from "./comparison-lab-controls";
export function Clock() {
  const [u, setU] = useState(0.5);
  const regular = helixClock(u, false),
    cubic = helixClock(u, true);
  const project = (t: number): [number, number] => [
    160 + 55 * Math.cos(t),
    110 - 35 * Math.sin(t) - 35 * t,
  ];
  return (
    <>
      <p>
        The same helix can be visited with different clocks. A stopped clock
        need not mean a broken curve.
      </p>
      <Formula
        block
      >{String.raw`r(t)=(\cos t,\sin t,t),\quad s(u)=r(u^3),\quad s'(u)=3u^2r'(u^3)`}</Formula>
      <Chart
        label="Helix with two parameter clocks"
        description={`Both clocks cover t from −1 to 1. At u=${number(u)}, regular-clock height ${number(regular.t)}, cubic-clock height ${number(cubic.t)}.`}
      >
        <polyline
          points={line(project)}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".5"
        />
        <circle
          cx={project(regular.t)[0]}
          cy={project(regular.t)[1]}
          r="7"
          fill="currentColor"
          className="compare-primary"
        />
        <rect
          x={project(cubic.t)[0] - 5}
          y={project(cubic.t)[1] - 5}
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="compare-secondary"
        />
        <text x="32" y="202" fill="currentColor" fontSize="11">
          Circle: t = u · square: t = u³
        </text>
      </Chart>
      <Range
        label="Clock parameter u"
        value={u}
        min={-1}
        max={1}
        onChange={setU}
      />
      <button type="button" onClick={() => setU(0)}>
        Inspect u = 0
      </button>
      <p className="compare-readout">
        t = u: t {number(regular.t)}, speed {number(regular.speed)}. t = u³: t{" "}
        {number(cubic.t)}, speed {number(cubic.speed)}.
      </p>
      <Formula
        block
      >{String.raw`\|r'(u)\|=\sqrt2,\quad\|s'(u)\|=3u^2\sqrt2`}</Formula>
      <p className="compare-caption">
        Both clocks map [−1,1] continuously onto [−1,1], increasing in the same
        direction. This is a projection of the helix segment, not a planar
        curve. At u = 0 the cubic parametrization is singular; the ordinary
        helix parametrization is regular.
      </p>
      <Prediction
        question="The cubic clock has zero velocity at u = 0. Does the helix lose its geometric tangent?"
        choices={["Yes", "No"]}
        answer={1}
        reason="The regular clock gives r′(0) = (0,1,1). Zero cubic velocity stops this parametrization; it does not remove the helix's tangent."
      />
      <button type="button" onClick={() => setU(0.5)}>
        Reset clocks
      </button>
    </>
  );
}
