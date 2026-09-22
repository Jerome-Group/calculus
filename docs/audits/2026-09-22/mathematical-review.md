# Mathematical review · double integrals

Issue #25. Reviewed the five affected concepts against their exact base-lecture page references and the supplied annotated-source audit. `integration-framework.ts` renders a six-step theorem-scope chain in the affected lessons.

1. **Rectangle definition.** A two-dimensional Riemann integral is a common limit of all tagged sums as maximum cell diameter tends to zero. A single midpoint mesh is numerical evidence only. Continuity on the closed rectangle suffices by uniform continuity and upper/lower-sum oscillation control.
2. **Rectangle Fubini.** The displayed course theorem assumes continuity on a closed rectangle and equates the rectangle integral with both iterated integrals. Its hypotheses do not describe a nonrectangular zero extension with jumps.
3. **General region.** For bounded $D$ inside a rectangle $R$, integrate the zero extension on $R$ only if it is Riemann integrable. Enlarging $R$ adds zero-valued cells; this proves independence from the enclosing rectangle.
4. **Existence.** The precise imported characterization is the *Lebesgue criterion for Riemann integrability*: a bounded function on a rectangle is Riemann integrable iff its discontinuity set has Lebesgue measure zero. A continuous function on a compact Jordan region with Jordan-null boundary satisfies it after zero extension. The criterion uses measure to test a Riemann integral; no Lebesgue integral is silently substituted.
5. **Type I/II.** Continuous ordered boundary functions on closed intervals and a continuous integrand on the compact resulting region justify the region-specific slice formula. It can be proved using rectangular upper/lower sums or a stronger applicable Fubini theorem. The continuity-only rectangle theorem is insufficient for the zero extension. Reversal requires new inequalities for the identical region.
6. **Splitting.** Finite additivity applies when each piece integral exists and pairwise overlaps have Jordan area zero. The square frame has disconnected middle vertical and horizontal sections, so it is neither Type I nor Type II in one piece; four rectangles suffice.

**Failure example:** The indicator of rational-coordinate points in the unit square is discontinuous everywhere, so its zero extension has no Riemann integral. A sampled graph cannot establish existence. This differs from its Lebesgue measure-zero property.

Remaining mathematical work from the 125-row ledger includes an asymmetric Fubini worked example, a general bounds editor, nonuniform partition interaction and additional region-splitting transfer problems. Their rows remain open.
