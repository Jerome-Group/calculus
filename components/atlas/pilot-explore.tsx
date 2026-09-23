"use client";
import { useState } from "react";
import type { PilotLesson } from "@/lib/curriculum/learning-modes";
import { Formula, MathText } from "./math-text";
import { LessonExperiment } from "./lesson-experiment";
import { checkLinearDelta } from "@/lib/curriculum/linear-delta";
import type { StudyController } from "./use-study-controller";

function BoundsDiagram({
  coordinate,
  orientation,
}: {
  coordinate: number;
  orientation: "vertical" | "horizontal";
}) {
  const position = 30 + coordinate * 100;
  const endpoint = 230 - coordinate * 100;
  return (
    <svg
      viewBox="0 0 260 260"
      role="img"
      aria-label={`${orientation} section at ${coordinate.toFixed(2)} of triangle x plus y at most 2, from 0 to ${(2 - coordinate).toFixed(2)}`}
    >
      <title>Exact triangle section</title>
      <polygon
        points="30,230 230,230 30,30"
        fill="#e4f1ed"
        stroke="#12584f"
        strokeWidth="2"
      />
      <line x1="30" y1="230" x2="230" y2="230" stroke="#26352f" />
      <line x1="30" y1="230" x2="30" y2="30" stroke="#26352f" />
      {orientation === "vertical" ? (
        <line
          x1={position}
          y1="230"
          x2={position}
          y2={position}
          stroke="#ad471d"
          strokeWidth="5"
        />
      ) : (
        <line
          x1="30"
          y1={endpoint}
          x2={endpoint}
          y2={endpoint}
          stroke="#ad471d"
          strokeWidth="5"
        />
      )}
      <foreignObject x="220" y="229" width="28" height="28">
        <div>
          <Formula>x</Formula>
        </div>
      </foreignObject>
      <foreignObject x="12" y="17" width="28" height="28">
        <div>
          <Formula>y</Formula>
        </div>
      </foreignObject>
      <foreignObject x="40" y="200" width="28" height="28">
        <div>
          <Formula>0</Formula>
        </div>
      </foreignObject>
      <foreignObject x="214" y="200" width="28" height="28">
        <div>
          <Formula>2</Formula>
        </div>
      </foreignObject>
      <foreignObject x="38" y="24" width="28" height="28">
        <div>
          <Formula>2</Formula>
        </div>
      </foreignObject>
    </svg>
  );
}

export function PilotExplore({
  lesson,
  study,
}: {
  lesson: PilotLesson;
  study: StudyController;
}) {
  const [representation, setRepresentation] = useState<"visual" | "table">(
    "visual",
  );
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [candidateDelta, setCandidateDelta] = useState("");
  const [candidateFeedback, setCandidateFeedback] = useState("");
  const epsilon = lesson.id === "epsilon-delta-one-variable";
  const coordinate = Math.max(0, Math.min(2, study.p));
  const delta = study.p / 2;
  return (
    <>
      <section
        className="pilot-prediction"
        aria-label="Prediction before experiment"
      >
        <h2>Predict first</h2>
        <p>
          <MathText text={lesson.explore.prediction} />
        </p>
      </section>
      <div
        className="pilot-representations"
        role="group"
        aria-label="Representation"
      >
        <button
          aria-pressed={representation === "visual"}
          onClick={() => setRepresentation("visual")}
        >
          Diagram
        </button>
        <button
          aria-pressed={representation === "table"}
          onClick={() => setRepresentation("table")}
        >
          Values only
        </button>
      </div>
      {!epsilon && (
        <section className="pilot-controls" aria-label="Slice controls">
          <div role="group" aria-label="Slice orientation">
            <button
              aria-pressed={orientation === "vertical"}
              onClick={() => setOrientation("vertical")}
            >
              Vertical slice
            </button>
            <button
              aria-pressed={orientation === "horizontal"}
              onClick={() => setOrientation("horizontal")}
            >
              Horizontal slice
            </button>
          </div>
          <label htmlFor="slice-coordinate">
            Slice coordinate: <Formula>{coordinate.toFixed(2)}</Formula>
          </label>
          <input
            id="slice-coordinate"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={coordinate}
            onChange={(event) => study.setP(Number(event.target.value))}
          />
        </section>
      )}
      {epsilon && representation === "table" && (
        <section className="pilot-controls" aria-label="Tolerance control">
          <label htmlFor="epsilon-tolerance">
            Output tolerance{" "}
            <Formula>{String.raw`\varepsilon=${study.p.toFixed(2)}`}</Formula>
          </label>
          <input
            id="epsilon-tolerance"
            type="range"
            min={study.info.min}
            max={study.info.max}
            step={study.info.step}
            value={study.p}
            onChange={(event) => {
              study.setP(Number(event.target.value));
              setCandidateFeedback("");
            }}
          />
        </section>
      )}
      {representation === "visual" &&
        (epsilon ? (
          <LessonExperiment study={study} />
        ) : (
          <section
            className="experience pilot-bounds"
            aria-label="Triangle section diagram"
          >
            <h2>Exact bounds diagram</h2>
            <BoundsDiagram coordinate={coordinate} orientation={orientation} />
          </section>
        ))}
      <section
        className={`rigor-panel pilot-explanation ${representation === "table" ? "values-only" : ""}`}
        aria-label="Mathematical equivalent"
      >
        <h2>Current mathematical state</h2>
        <p>
          <strong>Control:</strong> <MathText text={lesson.explore.control} />
        </p>
        <p>
          <strong>Evidence:</strong> <MathText text={lesson.explore.evidence} />
        </p>
        <p>
          <strong>Invariant:</strong>{" "}
          <MathText text={lesson.explore.invariant} />
        </p>
        {epsilon ? (
          <>
            <p>
              <MathText
                text={String.raw`The output band is $2-\varepsilon<2x<2+\varepsilon$; the input interval is $1-\delta<x<1+\delta$.`}
              />
            </p>
            <Formula
              block
            >{`\\varepsilon=${study.p.toFixed(2)},\\quad\\delta=\\varepsilon/2=${delta.toFixed(2)}`}</Formula>
            <table>
              <caption>
                Exact linear-example values for the selected tolerance
              </caption>
              <thead>
                <tr>
                  <th scope="col">Quantity</th>
                  <th scope="col">Lower</th>
                  <th scope="col">Upper</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Input interval, endpoints excluded</th>
                  <td>
                    <Formula>{(1 - delta).toFixed(2)}</Formula>
                  </td>
                  <td>
                    <Formula>{(1 + delta).toFixed(2)}</Formula>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Output band, endpoints excluded</th>
                  <td>
                    <Formula>{(2 - study.p).toFixed(2)}</Formula>
                  </td>
                  <td>
                    <Formula>{(2 + study.p).toFixed(2)}</Formula>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="pilot-delta-challenge">
              <label htmlFor="candidate-delta">
                Choose one <Formula>{String.raw`\delta`}</Formula> for the
                selected <Formula>{String.raw`\varepsilon`}</Formula>
              </label>
              <input
                id="candidate-delta"
                type="number"
                min="0"
                step="any"
                value={candidateDelta}
                onChange={(event) => setCandidateDelta(event.target.value)}
              />
              <button
                onClick={() =>
                  setCandidateFeedback(
                    checkLinearDelta(study.p, candidateDelta),
                  )
                }
              >
                Check all inputs algebraically
              </button>
              <p role="status">
                <MathText text={candidateFeedback} />
              </p>
            </div>
          </>
        ) : (
          <>
            <Formula block>
              {orientation === "vertical"
                ? `x=${coordinate.toFixed(2)},\\quad0\\le y\\le${(2 - coordinate).toFixed(2)}`
                : `y=${coordinate.toFixed(2)},\\quad0\\le x\\le${(2 - coordinate).toFixed(2)}`}
            </Formula>
            <p>
              <MathText
                text={String.raw`Both orders describe $D=\{(x,y):x\ge0,y\ge0,x+y\le2\}$.`}
              />
            </p>
            <table>
              <caption>Exact bounds at the current slice</caption>
              <thead>
                <tr>
                  <th scope="col">Direction</th>
                  <th scope="col">Outer coordinate</th>
                  <th scope="col">Inner interval</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{orientation}</th>
                  <td>
                    <Formula>{coordinate.toFixed(2)}</Formula>
                  </td>
                  <td>
                    <Formula>{`0\\le ${orientation === "vertical" ? "y" : "x"}\\le${(2 - coordinate).toFixed(2)}`}</Formula>
                  </td>
                </tr>
              </tbody>
            </table>
            <Formula block>
              {orientation === "vertical"
                ? "\\int_0^2\\int_0^{2-x}f(x,y)\\,dy\\,dx"
                : "\\int_0^2\\int_0^{2-y}f(x,y)\\,dx\\,dy"}
            </Formula>
          </>
        )}
        <h3>Near miss</h3>
        <p>
          <MathText text={lesson.explore.counterexample} />
        </p>
        <h3>Transfer</h3>
        <p>
          <MathText text={lesson.explore.transfer} />
        </p>
      </section>
    </>
  );
}
