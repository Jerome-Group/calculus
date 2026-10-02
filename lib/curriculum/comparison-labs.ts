export type ComparisonKind =
  "rays" | "curved" | "error" | "saddle" | "clock" | "fibre" | "polar";
const coverage: Record<string, ComparisonKind> = {
  "different-paths-different-limits": "rays",
  "curved-paths-hide-obstructions": "curved",
  "total-differentiability": "error",
  "partials-do-not-make-a-plane": "error",
  "local-extrema-and-saddles": "saddle",
  "hessian-classification": "saddle",
  "curves-and-parametrizations": "clock",
  "tangents-velocity-and-singularities": "clock",
  "type-one-two-regions": "fibre",
  "general-double-integrals": "fibre",
  "polar-rectangles": "polar",
};
export function comparisonKind(conceptId: string): ComparisonKind | null {
  return Object.hasOwn(coverage, conceptId) ? coverage[conceptId] : null;
}
export function comparisonCoverage() {
  return Object.entries(coverage).map(([conceptId, kind]) => ({
    conceptId,
    kind,
  }));
}
function finite(...values: number[]) {
  if (!values.every(Number.isFinite))
    throw new RangeError("Use finite parameters.");
}
export function rayHeight(theta: number) {
  finite(theta);
  return Math.cos(theta) * Math.sin(theta);
}
export function hiddenPath(x: number, coefficient: number, curved: boolean) {
  finite(x, coefficient);
  if (x === 0) return null; // The function's origin is excluded.
  const y = curved ? coefficient * x * x : coefficient * x;
  return {
    x,
    y,
    height: curved
      ? coefficient / (1 + coefficient ** 2)
      : (coefficient * x) / (x * x + coefficient ** 2),
  };
}
export function approximationErrors(radius: number, theta: number) {
  finite(radius, theta);
  if (radius <= 0)
    throw new RangeError(
      "Radius must be positive; the quotient excludes zero.",
    );
  const c = Math.cos(theta),
    s = Math.sin(theta);
  const normalized = Math.abs(c * s * s);
  return {
    bowlAbsolute: radius ** 2,
    bowlRelative: radius,
    counterAbsolute: radius * normalized,
    counterRelative: normalized,
    actualSlope: c ** 3,
    planeSlope: c,
  };
}
export function saddleSlice(a: number, theta: number) {
  finite(a, theta);
  return {
    coefficient: Math.cos(theta) ** 2 + a * Math.sin(theta) ** 2,
    determinant: 4 * a,
    classification:
      a < 0
        ? "saddle"
        : a > 0
          ? "strict minimum"
          : "non-strict minima along x = 0",
  };
}
export function helixClock(u: number, cubic: boolean) {
  finite(u);
  const t = cubic ? u ** 3 : u;
  const rate = cubic ? 3 * u ** 2 : 1;
  return {
    t,
    point: [Math.cos(t), Math.sin(t), t],
    speed: Math.SQRT2 * rate,
    velocity: [-Math.sin(t) * rate, Math.cos(t) * rate, rate],
  };
}
export function triangleFibre(outer: number) {
  finite(outer);
  if (outer < 0 || outer > 2) return null;
  return {
    lower: 0,
    upper: 2 - outer,
    innerIntegral: 4 - outer - outer ** 2 / 2,
    mass: 14 / 3,
    area: 2,
  };
}
export function polarTile(radius: number, width: number, angle: number) {
  finite(radius, width, angle);
  if (radius < 0 || width <= 0 || angle <= 0 || angle > 2 * Math.PI)
    throw new RangeError(
      "Use nonnegative radius, positive width and at most one revolution.",
    );
  return {
    parameterArea: width * angle,
    exactArea: (((radius + width) ** 2 - radius ** 2) * angle) / 2,
    linearArea: radius * width * angle,
    scale: radius,
  };
}

/** Equal-aspect domain projection preserves angles and Euclidean radii. */
export function pathProjection(x: number, y: number): [number, number] {
  finite(x, y);
  return [160 + 40 * x, 110 - 40 * y];
}

/** Describe the displayed comparison, without mistaking rounded zero for a witness. */
export function rayComparisonCaption(height: number) {
  finite(height);
  return Math.abs(height) < 0.00005
    ? "The displayed heights agree here. Choose a diagonal to expose a disagreement."
    : "These heights disagree. Shrinking r preserves this difference.";
}
