"use client";
import { Formula, MathText } from "./math-text";
import { useId } from "react";
import type { PlanarModel, Point } from "@/lib/curriculum/planar";
export function PlanarViewport({
  model: m,
  descriptionId,
}: {
  model: PlanarModel;
  descriptionId?: string;
}) {
  const clip = useId().replace(/:/g, "");
  let [xmin, xmax, ymin, ymax] = m.bounds;
  if (m.equalAspect) {
    const unitsPerPixel = Math.max((xmax - xmin) / 606, (ymax - ymin) / 326);
    const cx = (xmin + xmax) / 2,
      cy = (ymin + ymax) / 2;
    xmin = cx - 303 * unitsPerPixel;
    xmax = cx + 303 * unitsPerPixel;
    ymin = cy - 163 * unitsPerPixel;
    ymax = cy + 163 * unitsPerPixel;
  }
  const xy = ([x, y]: Point): Point => [
    52 + ((x - xmin) / (xmax - xmin)) * 606,
    368 - ((y - ymin) / (ymax - ymin)) * 326,
  ];
  const path = (points: Point[]) =>
    points
      .map((p, i) => {
        const q = xy(p);
        return `${i ? "L" : "M"}${q[0].toFixed(2)},${q[1].toFixed(2)}`;
      })
      .join(" ");
  return (
    <>
      {m.comparison && (
        <div className="comparison-panel">
          <h3>Parameter domain</h3>
          <PlanarViewport model={m.comparison} descriptionId={descriptionId} />
          <h3>Physical image</h3>
        </div>
      )}
      <div className="planar-viewport">
        <svg
          viewBox="0 0 710 420"
          role="img"
          aria-label={`Two-dimensional experiment: ${m.traces.map((t) => t.label).join("; ")}.`}
          aria-describedby={descriptionId}
        >
          <title>Interactive two-dimensional plot</title>
          <desc>Move the labelled parameter control to explore the graph.</desc>
          <defs>
            <clipPath id={clip}>
              <rect x="52" y="42" width="606" height="326" />
            </clipPath>
          </defs>
          {Array.from({ length: 7 }, (_, i) => {
            const x = xmin + ((xmax - xmin) * i) / 6,
              y = ymin + ((ymax - ymin) * i) / 6;
            return (
              <g key={i} className="plot-grid">
                <line x1={52 + i * 101} x2={52 + i * 101} y1="42" y2="368" />
                <line
                  x1="52"
                  x2="658"
                  y1={368 - (i * 326) / 6}
                  y2={368 - (i * 326) / 6}
                />
                <foreignObject x={27 + i * 101} y="378" width="50" height="28">
                  <div className="plot-tick">
                    <Formula>{String(Number(x.toFixed(2)))}</Formula>
                  </div>
                </foreignObject>
                <foreignObject
                  x="0"
                  y={358 - (i * 326) / 6}
                  width="44"
                  height="28"
                >
                  <div className="plot-tick">
                    <Formula>{String(Number(y.toFixed(2)))}</Formula>
                  </div>
                </foreignObject>
              </g>
            );
          })}
          <g clipPath={`url(#${clip})`}>
            {xmin <= 0 && xmax >= 0 && (
              <line
                className="plot-axis"
                x1={xy([0, 0])[0]}
                x2={xy([0, 0])[0]}
                y1="42"
                y2="368"
              />
            )}
            {ymin <= 0 && ymax >= 0 && (
              <line
                className="plot-axis"
                x1="52"
                x2="658"
                y1={xy([0, 0])[1]}
                y2={xy([0, 0])[1]}
              />
            )}
            {m.traces.map((t, i) => (
              <g key={i}>
                <title>{t.label}</title>
                {t.dots ? (
                  t.points.map((p, j) => (
                    <circle
                      key={j}
                      cx={xy(p)[0]}
                      cy={xy(p)[1]}
                      r={t.points.length === 1 ? 5 : 3.5}
                      fill={t.color}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  ))
                ) : (
                  <path
                    d={path(t.points) + (t.fill ? " Z" : "")}
                    fill={t.fill ? t.color : "none"}
                    fillOpacity={t.fill ? 0.13 : 1}
                    stroke={t.color}
                    strokeWidth={t.fill ? 1 : 2.5}
                    strokeDasharray={t.dashed ? "7 5" : undefined}
                  />
                )}
              </g>
            ))}
          </g>
        </svg>
        <div className="plot-legend">
          {[...new Map(m.traces.map((t) => [t.label, t])).values()].map((t) => (
            <span key={t.label}>
              <i style={{ background: t.color }} />
              <MathText text={t.label} />
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
