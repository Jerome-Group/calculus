export type ReviewFunction = "differentiable" | "counterexample";

export function reviewValue(kind: ReviewFunction, x: number, y: number) {
  const r2 = x * x + y * y;
  if (r2 === 0) return 0;
  return kind === "differentiable"
    ? (x ** 4 + y ** 4) / Math.sqrt(r2)
    : (x ** 3 - x * y ** 2) / r2;
}

export function reviewPlane(kind: ReviewFunction, x: number) {
  return kind === "differentiable" ? 0 : x;
}

export function reviewResidual(kind: ReviewFunction, x: number, y: number) {
  const r = Math.hypot(x, y);
  if (r === 0) return 0;
  // Algebraically simplified: avoids cancellation when evaluating the plane.
  return kind === "differentiable"
    ? (x ** 4 + y ** 4) / (r * r)
    : (-2 * x * y * y) / (r * r * r);
}
