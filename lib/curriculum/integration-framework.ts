export type IntegrationStep = {
  id: string;
  title: string;
  hypothesis: string;
  conclusion: string;
  boundary: string;
};

export const integrationSteps: IntegrationStep[] = [
  {
    id: "double-riemann-sums",
    title: "1. Rectangle sums and integral",
    hypothesis:
      "A bounded function on a closed rectangle and tagged partitions whose maximum cell diameter tends to zero.",
    conclusion:
      "If every tagged sum has the same limit, that limit defines the two-dimensional Riemann integral. Continuity on the rectangle guarantees this condition.",
    boundary:
      "Convergence of one midpoint animation alone does not establish integrability.",
  },
  {
    id: "fubini-double",
    title: "2. Continuous-rectangle Fubini",
    hypothesis: "The integrand is continuous on a closed rectangle.",
    conclusion:
      "The rectangle integral equals both iterated integrals, with the corresponding constant bounds.",
    boundary:
      "This stated theorem does not apply directly to a zero extension with a boundary jump.",
  },
  {
    id: "general-double-integrals",
    title: "3. General region by zero extension",
    hypothesis:
      "The bounded function is defined on a bounded region D contained in a rectangle R.",
    conclusion:
      "Set the function to zero on R outside D. Define its integral over D only when that extension is Riemann integrable. Zero padding proves independence of the containing rectangle.",
    boundary: "The definition alone does not guarantee existence.",
  },
  {
    id: "general-double-integrals",
    title: "4. Existence criterion",
    hypothesis:
      "The zero extension is bounded. The Lebesgue criterion for Riemann integrability says its discontinuities must form a set of Lebesgue measure zero.",
    conclusion:
      "A continuous function on a compact Jordan region with boundary of Jordan content zero satisfies this criterion: new jumps can occur only on that boundary.",
    boundary:
      "This criterion uses measure to characterize a Riemann integral; it does not redefine the course integral as a Lebesgue integral.",
  },
  {
    id: "type-one-two-regions",
    title: "5. Type I and Type II slice formulas",
    hypothesis:
      "Continuous ordered boundary functions on closed intervals and a continuous integrand on the resulting compact region.",
    conclusion:
      "The region-specific slicing theorem gives inner bounds from the vertical or horizontal sections. If both descriptions cover the same D, both iterated expressions equal the integral over D.",
    boundary:
      "A vertical or horizontal slice with two disjoint intervals needs a split; the continuous-rectangle theorem alone is insufficient.",
  },
  {
    id: "linearity-additivity",
    title: "6. Split and reverse",
    hypothesis:
      "Each piece is integrable and pairwise intersections have Jordan area zero.",
    conclusion:
      "Add the piece integrals. To reverse order, derive new section inequalities for the same region and check the applicable slice hypotheses.",
    boundary:
      "Swapping dx and dy while leaving the old bounds unchanged generally changes the region.",
  },
];

export const integrationFailure =
  "Failure example: let D be the rational-coordinate points in [0,1]² and f=1 on D. Its zero extension is the Dirichlet indicator, discontinuous at every point of the square. It has no Riemann integral, so the general-region double integral does not exist in this framework. A plotted sample cannot prove otherwise.";
