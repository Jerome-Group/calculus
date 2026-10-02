"use client";
import { useState } from "react";
import {
  comparisonKind,
  type ComparisonKind,
} from "@/lib/curriculum/comparison-labs";
import { Paths } from "./comparison-path-lab";
import { Errors } from "./comparison-error-lab";
import { Saddle } from "./comparison-saddle-lab";
import { Clock } from "./comparison-clock-lab";
import { Fibre } from "./comparison-fibre-lab";
import { Polar } from "./comparison-polar-lab";
const titles: Record<ComparisonKind, string> = {
  rays: "Axes agree. Directions disagree.",
  curved: "Lines agree. A curve disagrees.",
  error: "Shrink the error. Then divide.",
  saddle: "One point, opposing curvatures",
  clock: "One curve, two clocks",
  fibre: "One region, two slicing orders",
  polar: "One tile, two area measures",
};
export function ComparisonLab({ conceptId }: { conceptId: string }) {
  const kind = comparisonKind(conceptId);
  const [revision, setRevision] = useState(0);
  if (!kind) return null;
  return (
    <section
      className="comparison-lab"
      aria-label={titles[kind]}
      key={conceptId}
    >
      <header className="compare-heading">
        <span>Compare & explain</span>
        <h3>{titles[kind]}</h3>
      </header>
      <div key={`${conceptId}-${revision}`}>
        {kind === "rays" || kind === "curved" ? (
          <Paths curved={kind === "curved"} />
        ) : kind === "error" ? (
          <Errors />
        ) : kind === "saddle" ? (
          <Saddle />
        ) : kind === "clock" ? (
          <Clock />
        ) : kind === "fibre" ? (
          <Fibre />
        ) : (
          <Polar />
        )}
      </div>
      <button
        className="compare-reset"
        type="button"
        onClick={() => setRevision((value) => value + 1)}
      >
        Reset comparison and prediction
      </button>
    </section>
  );
}
