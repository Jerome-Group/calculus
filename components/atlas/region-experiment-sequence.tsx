"use client";
import { useId, useSyncExternalStore } from "react";
import {
  getInlineExperimentOpen,
  getInlineExperimentValue,
  initialInlineExperimentValue,
  regionExperimentSpecs,
  setInlineExperimentOpen,
  setInlineExperimentValue,
  subscribeInlineExperiment,
} from "@/lib/curriculum/inline-experiments";
import {
  shiftedDiskRadialBound,
  shiftedDiskVerticalSlice,
} from "@/lib/curriculum/polar-region";
import { Formula } from "./math-text";

type RegionExperiment = {
  id: "domain" | "slice" | "transformed-domain";
  title: string;
  explanation: string;
  initial: number;
  min: number;
  max: number;
  step: number | "any";
  label: string;
};

export const shiftedDiskExperiments: readonly RegionExperiment[] = [
  {
    id: "domain",
    title: "1. The physical domain",
    explanation:
      "The disk has centre (1,0) and radius 1. A vertical slice at x runs from negative to positive square root of 1−(x−1)².",
    ...regionExperimentSpecs.domain,
    label: "Vertical slice x",
  },
  {
    id: "slice",
    title: "2. A radial slice",
    explanation:
      "A ray at angle θ starts at the origin and ends at radius 2 cos θ. At either endpoint angle only the origin remains.",
    ...regionExperimentSpecs.slice,
    label: "Ray angle θ in radians",
  },
  {
    id: "transformed-domain",
    title: "3. The parameter domain",
    explanation:
      "The curved parameter region has −π/2≤θ≤π/2 and 0≤r≤2 cos θ. The paired ray shows where the selected vertical parameter slice lands in the physical disk.",
    ...regionExperimentSpecs["transformed-domain"],
    label: "Parameter angle θ in radians",
  },
] as const;

function PhysicalDisk({
  mode,
  value,
}: {
  mode: "domain" | "ray";
  value: number;
}) {
  const title = useId();
  const slice = shiftedDiskVerticalSlice(value);
  const radialBound = shiftedDiskRadialBound(value) ?? 0;
  const originX = 55;
  const centreX = 160;
  const centreY = 140;
  const scale = 105;
  return (
    <svg
      viewBox="0 0 320 280"
      role="img"
      aria-labelledby={title}
      style={{ width: "100%", maxWidth: 440 }}
    >
      <title id={title}>
        Shifted disk with{" "}
        {mode === "domain" ? "a vertical slice" : "a radial slice"}
      </title>
      <line
        x1="30"
        y1={centreY}
        x2="290"
        y2={centreY}
        stroke="currentColor"
        opacity="0.5"
      />
      <line
        x1={originX}
        y1="20"
        x2={originX}
        y2="260"
        stroke="currentColor"
        opacity="0.5"
      />
      <circle
        cx={centreX}
        cy={centreY}
        r={scale}
        fill="#2e79bd"
        fillOpacity="0.17"
        stroke="#2e79bd"
        strokeWidth="2"
      />
      {mode === "domain" && slice && (
        <line
          x1={originX + value * scale}
          x2={originX + value * scale}
          y1={centreY - slice.upper * scale}
          y2={centreY - slice.lower * scale}
          stroke="#a94333"
          strokeWidth="5"
        />
      )}
      {mode === "ray" && (
        <line
          x1={originX}
          y1={centreY}
          x2={originX + radialBound * Math.cos(value) * scale}
          y2={centreY - radialBound * Math.sin(value) * scale}
          stroke="#a94333"
          strokeWidth="5"
        />
      )}
      <circle cx={originX} cy={centreY} r="3" fill="currentColor" />
      <text x="42" y="158" fill="currentColor" fontSize="15">
        O
      </text>
      <text x="267" y="159" fill="currentColor" fontSize="15">
        x
      </text>
      <text x="64" y="31" fill="currentColor" fontSize="15">
        y
      </text>
    </svg>
  );
}

function ParameterDomain({ theta }: { theta: number }) {
  const title = useId();
  const bound = shiftedDiskRadialBound(theta) ?? 0;
  const x = (angle: number) => 30 + ((angle + Math.PI / 2) / Math.PI) * 280;
  const y = (radius: number) => 235 - radius * 95;
  const curve = Array.from({ length: 65 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 64;
    return `${i ? "L" : "M"}${x(angle).toFixed(2)},${y(shiftedDiskRadialBound(angle) ?? 0).toFixed(2)}`;
  }).join(" ");
  return (
    <svg
      viewBox="0 0 340 280"
      role="img"
      aria-labelledby={title}
      style={{ width: "100%", maxWidth: 440 }}
    >
      <title id={title}>Parameter domain in angle and radius coordinates</title>
      <path
        d={`${curve} L310,235 L30,235 Z`}
        fill="#2e79bd"
        fillOpacity="0.17"
        stroke="#2e79bd"
        strokeWidth="2"
      />
      <line
        x1={x(theta)}
        x2={x(theta)}
        y1={y(0)}
        y2={y(bound)}
        stroke="#a94333"
        strokeWidth="5"
      />
      <line
        x1="25"
        x2="315"
        y1="235"
        y2="235"
        stroke="currentColor"
        opacity="0.5"
      />
      <text x="4" y="245" fill="currentColor" fontSize="15">
        −π/2
      </text>
      <text x="283" y="255" fill="currentColor" fontSize="15">
        π/2
      </text>
      <text x="164" y="272" fill="currentColor" fontSize="15">
        θ
      </text>
      <text x="12" y="41" fill="currentColor" fontSize="15">
        r
      </text>
    </svg>
  );
}

function RegionExperimentCard({
  experiment,
}: {
  experiment: RegionExperiment;
}) {
  const conceptId = "polar-regions";
  const subscribe = (listener: () => void) =>
    subscribeInlineExperiment(conceptId, experiment.id, listener);
  const value = useSyncExternalStore(
    subscribe,
    () => getInlineExperimentValue(conceptId, experiment.id, "value"),
    () => initialInlineExperimentValue(conceptId, experiment.id, "value"),
  );
  const active = useSyncExternalStore(
    subscribe,
    () => getInlineExperimentOpen(conceptId, experiment.id),
    () => false,
  );
  const controlId = useId();
  const vertical = shiftedDiskVerticalSlice(value);
  const radial = shiftedDiskRadialBound(value);
  return (
    <section className="lesson-extension" data-experiment-id={experiment.id}>
      <h3>{experiment.title}</h3>
      <p>{experiment.explanation}</p>
      <details
        open={active}
        onToggle={(event) =>
          setInlineExperimentOpen(
            conceptId,
            experiment.id,
            event.currentTarget.open,
          )
        }
      >
        <summary>Explore {experiment.title.slice(3).toLowerCase()}</summary>
        <div style={{ paddingBlock: "1rem" }}>
          <label id={controlId} htmlFor={`${controlId}-range`}>
            {experiment.label}
          </label>
          <input
            id={`${controlId}-range`}
            type="range"
            data-inline-parameter="value"
            min={experiment.min}
            max={experiment.max}
            step={experiment.step}
            value={value}
            onChange={(event) =>
              setInlineExperimentValue(
                conceptId,
                experiment.id,
                "value",
                Number(event.target.value),
              )
            }
            style={{ width: "100%" }}
          />
          <output htmlFor={`${controlId}-range`} aria-live="polite">
            {experiment.id === "domain" ? (
              <>
                x = {value.toFixed(2)}; y from {vertical?.lower.toFixed(2)} to{" "}
                {vertical?.upper.toFixed(2)}.
              </>
            ) : (
              <>
                θ = {value.toFixed(2)} radians; r from 0 to {radial?.toFixed(2)}
                .
              </>
            )}
          </output>
          {active && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
                alignItems: "center",
              }}
            >
              <PhysicalDisk
                mode={experiment.id === "domain" ? "domain" : "ray"}
                value={value}
              />
              {experiment.id === "transformed-domain" && (
                <ParameterDomain theta={value} />
              )}
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

export function RegionExperimentSequence() {
  return (
    <section aria-label="Explore the shifted disk in three steps">
      <h2>Follow the region through its coordinates</h2>
      <p>
        The physical disk is <Formula>{"(x-1)^2+y^2\\le1"}</Formula>. Its polar
        bounds are{" "}
        <Formula>
          {"-\\pi/2\\le\\theta\\le\\pi/2,\\quad0\\le r\\le2\\cos\\theta"}
        </Formula>
        . Each step keeps its own control value.
      </p>
      {shiftedDiskExperiments.map((experiment) => (
        <RegionExperimentCard key={experiment.id} experiment={experiment} />
      ))}
      <p>
        The diagram samples boundary curves. The inequalities and integral give
        the exact region and area.
      </p>
    </section>
  );
}
