"use client";
import { useState } from "react";
import {
  hiddenPath,
  rayHeight,
  pathProjection,
  rayComparisonCaption,
} from "@/lib/curriculum/comparison-labs";
import { Formula } from "./math-text";
import {
  Chart,
  line,
  number,
  Prediction,
  Range,
} from "./comparison-lab-controls";
export function Paths({ curved }: { curved: boolean }) {
  const [parameter, setParameter] = useState(curved ? 1 : Math.PI / 4);
  const [distance, setDistance] = useState(0.6);
  const witness = curved
    ? hiddenPath(distance, parameter, true)!
    : {
        x: distance * Math.cos(parameter),
        y: distance * Math.sin(parameter),
        height: rayHeight(parameter),
      };
  const straight = hiddenPath(distance, parameter, false)!;
  return (
    <>
      <p>
        {curved
          ? "Every straight line tends to zero. Can a parabola disagree?"
          : "Two axis tests agree. What does a diagonal reveal?"}
      </p>
      <Formula block>
        {curved
          ? String.raw`g(x,y)=\frac{x^2y}{x^4+y^2},\quad y=kx^2`
          : String.raw`f(x,y)=\frac{xy}{x^2+y^2},\quad (x,y)=r(\cos\theta,\sin\theta)`}
      </Formula>
      <div className="compare-views">
        <Chart
          label="Domain paths"
          description={`Equal axis scales; angles and distances preserved. Origin excluded. Current probe (${number(witness.x)}, ${number(witness.y)}).`}
        >
          <path
            d="M30 110H300 M160 20V190"
            stroke="currentColor"
            opacity=".25"
          />
          <text x="292" y="104" fill="currentColor" fontSize="11">
            x
          </text>
          <text x="166" y="28" fill="currentColor" fontSize="11">
            y
          </text>
          {!curved && (
            <circle
              cx="160"
              cy="110"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeDasharray="3 4"
              opacity=".35"
            />
          )}
          <polyline
            className="compare-primary"
            points={line(
              (t) =>
                curved
                  ? pathProjection(t, parameter * t * t)
                  : pathProjection(
                      t * Math.cos(parameter),
                      t * Math.sin(parameter),
                    ),
              0,
              1,
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <circle
            cx={pathProjection(witness.x, witness.y)[0]}
            cy={pathProjection(witness.x, witness.y)[1]}
            r="5"
            fill="currentColor"
          />
          <circle
            cx="160"
            cy="110"
            r="4"
            fill="var(--panel, white)"
            stroke="currentColor"
          />
        </Chart>
        <Chart
          label="Restriction heights as input approaches zero"
          description={
            curved
              ? `Parabola height remains ${number(witness.height)}. Fixed-line height at x=${number(distance)} is ${number(straight.height)}.`
              : `Ray height remains ${number(witness.height)}; axis height is zero.`
          }
        >
          <path d="M30 100H300" stroke="currentColor" opacity=".25" />
          <polyline
            className="compare-primary"
            points={line(
              (t) => [30 + 270 * t, 100 - 110 * witness.height],
              0,
              1,
            )}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
          {curved && (
            <polyline
              className="compare-secondary"
              points={line(
                (t) => [
                  30 + 270 * t,
                  100 -
                    110 *
                      (hiddenPath(Math.max(t, 0.00001), parameter, false)
                        ?.height ?? 0),
                ],
                0,
                1,
              )}
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 4"
              fill="none"
            />
          )}
          <text x="32" y="202" fill="currentColor" fontSize="11">
            0 excluded ← input distance → 1
          </text>
          <text x="32" y="94" fill="currentColor" fontSize="11">
            height 0
          </text>
        </Chart>
      </div>
      <Range
        label={curved ? "Parabola coefficient k" : "Direction θ (radians)"}
        value={parameter}
        min={curved ? -2 : 0}
        max={curved ? 2 : Math.PI}
        onChange={setParameter}
      />
      <div
        className="compare-choices"
        role="group"
        aria-label={
          curved ? "Exact parabolic witnesses" : "Exact ray witnesses"
        }
      >
        {(curved
          ? ([
              [-1, "k = −1"],
              [0, "k = 0"],
              [1, "k = 1"],
            ] as const)
          : ([
              [0, "Axis θ = 0"],
              [Math.PI / 4, "Diagonal θ = π/4"],
              [(3 * Math.PI) / 4, "Diagonal θ = 3π/4"],
            ] as const)
        ).map(([value, label]) => (
          <button
            type="button"
            key={label}
            aria-pressed={parameter === value}
            onClick={() => setParameter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <Range
        label={curved ? "Probe x > 0" : "Probe radius r > 0"}
        value={distance}
        min={0.01}
        max={1}
        onChange={setDistance}
      />
      <p className="compare-readout">
        {curved ? (
          <>
            Parabola height = {number(witness.height)}; fixed-line height ={" "}
            {number(straight.height)}. Shrink x to compare.
          </>
        ) : (
          <>
            Ray height = {number(witness.height)}; x-axis height = 0.{" "}
            {rayComparisonCaption(witness.height)}
          </>
        )}
      </p>
      <Formula block>
        {curved
          ? String.raw`g(x,kx^2)=\frac{k}{1+k^2},\quad g(x,mx)=\frac{mx}{x^2+m^2}\to0`
          : String.raw`f(r\cos\theta,r\sin\theta)=\cos\theta\sin\theta,\quad f(x,0)=0`}
      </Formula>
      <p className="compare-caption">
        Solid: selected {curved ? "parabola" : "ray"}.{" "}
        {curved ? "Dashed: line with the same coefficient. " : ""}The function
        is undefined at the origin. These graphs illustrate restrictions; the
        exact witnesses prove nonexistence.
      </p>
      <Prediction
        question={
          curved
            ? "All line limits equal zero. Is existence established?"
            : "Both axes tend to zero. Is existence established?"
        }
        choices={["Yes", "No"]}
        answer={1}
        reason={
          curved
            ? "Set k = 1: the parabola stays at 1/2 while every fixed line tends to zero."
            : "Set θ = π/4: the diagonal stays at 1/2 while the axis stays at zero."
        }
      />
      <button
        type="button"
        onClick={() => {
          setParameter(curved ? 1 : Math.PI / 4);
          setDistance(0.6);
        }}
      >
        Reset paths
      </button>
    </>
  );
}
