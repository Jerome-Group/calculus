export type CapDecision = {
  capFlux: number | null;
  diskFlux: number | null;
  totalFlux: number | null;
  scalarArea: number;
  theoremEligible: boolean;
  reason: string;
};

// Upper hemisphere of radius 2 with F=(x,y,z). The closing disk is z=0.
export function capDecision({
  closed,
  outward,
  regular,
}: {
  closed: boolean;
  outward: boolean;
  regular: boolean;
}): CapDecision {
  if (!regular)
    return {
      capFlux: null,
      diskFlux: null,
      totalFlux: null,
      scalarArea: 8 * Math.PI,
      theoremEligible: false,
      reason:
        "The selected singular field is undefined at the origin on the closing disk. Check the field on an open neighborhood of the entire solid before using the divergence theorem.",
    };
  const sign = outward ? 1 : -1;
  return {
    capFlux: sign * 16 * Math.PI,
    diskFlux: closed ? 0 : null,
    totalFlux: closed ? sign * 16 * Math.PI : null,
    scalarArea: 8 * Math.PI,
    theoremEligible: closed && outward,
    reason: !closed
      ? "The cap has an exposed circular edge. Add the disk before applying the divergence theorem."
      : !outward
        ? "The closed boundary points inward. Reverse the flux sign to compare with the divergence integral."
        : "The field is C¹ throughout the solid; the boundary is closed, piecewise smooth, and outward oriented.",
  };
}
