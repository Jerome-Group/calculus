import { useId } from "react";
import type { Construction } from "@/lib/workshop";

function approximate(raw: string): number | null {
  const text = raw.trim();
  if (text.length > 32 || !/^[+-]?\d+(?:\.\d+|\/[+-]?\d+)?$/.test(text))
    return null;
  const [n, d] = text.split("/");
  const value = Number(n) / (d === undefined ? 1 : Number(d));
  return Number.isFinite(value) ? value : null;
}
const plotLine = (points: readonly (readonly [number, number])[]) =>
  points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

export function WorkshopDiagram({
  construction,
}: {
  construction: Construction;
}) {
  const marker = useId().replaceAll(":", "");
  let drawing: React.ReactNode;
  let description: string;
  switch (construction.kind) {
    case "linear-bound": {
      const C = approximate(construction.bound);
      if (C === null || C <= 0) return null;
      const ceiling = Math.max(4, C * 1.15),
        y = (v: number) => 180 - (140 * v) / ceiling;
      const points = Array.from({ length: 81 }, (_, i) => {
        const theta = (Math.PI * 2 * i) / 80;
        return [
          30 + i * 3,
          y(3 * Math.cos(theta) ** 2 + Math.sin(theta) ** 2),
        ] satisfies [number, number];
      });
      description =
        "For the correct derivative L=2x−y, the directional remainder ratio is 3 cos²θ+sin²θ. The solid curve varies from 1 to 3. The dashed line is your proposed C. This picture does not check your proposed p or q.";
      drawing = (
        <>
          <path d={`M30 25V180H275`} className="workshop-axis" />
          <path d={plotLine(points)} className="workshop-curve" />
          <path d={`M30 ${y(C)}H270`} className="workshop-guide" />
          <text x="34" y="18">
            R/r² for L=2x−y
          </text>
          <text x="245" y={Math.max(35, y(C) - 7)}>
            C
          </text>
          <text x="30" y="201">
            0
          </text>
          <text x="245" y="201">
            2π · θ
          </text>
        </>
      );
      break;
    }
    case "cubic-path": {
      const k = approximate(construction.coefficient),
        n = Number(construction.exponent);
      if (k === null || !Number.isInteger(n) || n < 1 || n > 6) return null;
      const values = Array.from({ length: 81 }, (_, i) => {
        const t = (i + 1) / 81;
        return k === 0
          ? 0
          : n < 3
            ? (k * t ** (3 - n)) / (t ** (6 - 2 * n) + k * k)
            : (k * t ** (n - 3)) / (1 + k * k * t ** (2 * n - 6));
      });
      const height = Math.max(0.5, ...values.map(Math.abs));
      const points = values.map(
        (v, i) =>
          [30 + (240 * (i + 1)) / 81, 110 - (75 * v) / height] satisfies [
            number,
            number,
          ],
      );
      description =
        "The solid curve samples g on your path for positive t up to 1. The dashed horizontal axis is value zero. Samples illustrate a restriction; exact algebra below decides its limit. Tiny nonzero values can visually overlap zero.";
      drawing = (
        <>
          <path d="M30 25V180M30 110H275" className="workshop-axis" />
          <path d="M30 110H275" className="workshop-guide" />
          <path d={plotLine(points)} className="workshop-curve" />
          <text x="34" y="18">
            g on your path
          </text>
          <text x="19" y="126">
            0
          </text>
          <text x="257" y="201">
            t=1
          </text>
        </>
      );
      break;
    }
    case "domain-loop": {
      const points: [number, number][] = [];
      for (const [x, y] of construction.vertices) {
        const a = approximate(x),
          b = approximate(y);
        if (a === null || b === null) return null;
        points.push([a, b]);
      }
      const extent = Math.max(...points.flat().map(Math.abs), 1e-100),
        scale = 80 / extent;
      const project = ([x, y]: readonly [number, number]): [number, number] => [
        150 + x * scale,
        110 - y * scale,
      ];
      description =
        "The arrows and vertex numbers show traversal order, with the last edge closing to vertex 1. The open circle is the excluded origin. The coordinate list gives exact positions even when projected vertices overlap. Geometry in this SVG never decides domain membership or winding.";
      drawing = (
        <>
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" fill="currentColor" />
            </marker>
          </defs>
          <path d="M30 110H275M150 15V205" className="workshop-axis" />
          {points.map((a, i) => {
            const b = points[(i + 1) % points.length],
              start = project(a),
              end = project(b);
            return (
              <g key={i}>
                <path d={plotLine([start, end])} className="workshop-curve" />
                <path
                  d={plotLine([
                    start,
                    [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
                  ])}
                  className="workshop-curve"
                  markerEnd={`url(#${marker})`}
                />
                <circle cx={start[0]} cy={start[1]} r="3" fill="currentColor" />
                <text x={start[0] + 6} y={start[1] - 7}>
                  {i + 1}
                </text>
              </g>
            );
          })}
          <circle cx="150" cy="110" r="5" className="workshop-origin" />
          <text x="158" y="126">
            0 excluded
          </text>
        </>
      );
      break;
    }
  }
  return (
    <figure className="workshop-diagram">
      <svg viewBox="0 0 300 220" role="img" aria-label={description}>
        {drawing}
      </svg>
      <figcaption>
        Numerical illustration. Exact text controls the result.
      </figcaption>
      <details>
        <summary>Diagram text equivalent</summary>
        <p>{description}</p>
      </details>
    </figure>
  );
}
