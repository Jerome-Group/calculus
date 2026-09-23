/** Exact bounds for the disk (x-1)^2+y^2 <= 1. */
export function shiftedDiskVerticalSlice(x: number) {
  if (!Number.isFinite(x) || x < 0 || x > 2) return null;
  const height = Math.sqrt(Math.max(0, 1 - (x - 1) ** 2));
  return { lower: -height, upper: height };
}

export function shiftedDiskRadialBound(theta: number) {
  if (!Number.isFinite(theta) || theta < -Math.PI / 2 || theta > Math.PI / 2)
    return null;
  return Math.max(0, 2 * Math.cos(theta));
}
