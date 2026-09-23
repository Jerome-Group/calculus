# MH2100 Lecture 05 source review · 24 September 2026

Issue #146. Scope: Lecture 05 sections :02–:05, physical pages 24–61. This is an atomic
source-to-guide review, not certification of other course archives or learner mastery.

## Canonical file and inspection

Drive file `1vlUmaphnoY1lu1prslvBdsZ7h2Fm3a0c`, `MH2100_Lecture_05.pdf`, SHA-256
`7250bc655e8850d1d212c66061b7504e172e7378578d5134a0de2a23bb4693bd`, 61 physical pages.
The downloaded PDF remained in `/tmp`. All physical pages were rendered and visually swept;
cited pages were checked at higher resolution, with extracted text used only to locate material.
No PDF, render, or extracted lecture text was added to Git.

| Section                     | Source pages and exact review                                                                                                                                                                                                                                                                                                | Mapped outcomes                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| :02 · closed-rectangle sums | 24–25 are single-variable prerequisite recall/illustration and excluded. Pages 26–31 cover the nonnegative-height prompt, uniform cell partition, cell-area approximation, tagged sum, and sampling-independent limit.                                                                                                       | `double-riemann-sums:lecture05-rectangular-mesh-cell-area`; `...:lecture05-tagged-double-riemann-sum`; `...:lecture05-double-integral-tagged-limit`; `...:lecture05-nonnegative-graph-volume`                                                                                                                                                                                 |
| :03 · general regions       | 32–35 define zero extension and independence from the enclosing rectangle; 36 gives area and the zero-area-boundary criterion; 37 states boundedness plus almost-everywhere continuity as an iff integrability criterion; 38–40 apply integrals to volume, mass, and joint probability. The criterion is stated, not proved. | `general-double-integrals:lecture05-zero-extension-definition`; `...:lecture05-enclosing-rectangle-independence`; `...:lecture05-area-as-integral-of-one`; `...:lecture05-boundary-zero-area-criterion`; `...:lecture05-riemann-integrability-criterion`; `...:lecture05-volume-over-general-region`; `...:lecture05-mass-density`; `...:lecture05-joint-density-probability` |
| :04 · iterated integrals    | 41–42 define rectangular orders and show vertical/horizontal slices; 43–44 evaluate the monomial in either order; 45 states Fubini for a continuous function on a closed standard rectangle; 46–48 evaluate the oscillatory example in both orders. The theorem is used without proof.                                       | `fubini-double:lecture05-iterated-orders-slices`; `...:lecture05-source-monomial-either-order`; `...:lecture05-continuous-rectangle-hypotheses`; `...:lecture05-source-oscillatory-integral-two-orders`                                                                                                                                                                       |
| :05 · Type I/II             | 49–51 define and diagram vertical/horizontal fibers (the existing `type-one-two-regions:source-skill-1` ID is retained); 52–53 state the two integration formulas; 54–55 work the Type I parabola integral; 56 compares slice choices; 57–58 work the Type II region; 59–61 project and integrate the source tetrahedron.    | `type-one-two-regions:source-skill-1`; `...:lecture05-type-i-integral-bounds`; `...:lecture05-type-ii-integral-bounds`; `...:lecture05-slice-orientation-choice`; `...:lecture05-source-type-i-parabola-integral`; `...:lecture05-source-type-ii-parabola-integral`; `...:lecture05-source-tetrahedron-projection-volume`                                                     |

The ellipses in table IDs inherit the category prefix shown in the first ID. The ledger carries
each outcome's full ID, physical-page locator, claim, and separate `named`, `stated`, `worked`,
`practiced`, `visualized`, and `checked` evidence entries. The first four have page/guide evidence;
`visualized` and `checked` stay empty. Scene alignment and learner performance remain unverified.
Each of the 23 outcomes has a source-specific statement, worked block, and changed-data exercise;
strict KaTeX MathML and WebMCP `read_concept` tests check their rendering and availability.
Nineteen numeric exercise answers are independently recomputed by outcome ID. The regression
fixture records the 509 outcome IDs and 125 concept-route IDs present on the rebased mainline; all
remain present, and the existing Type I/II outcome ID is reused.

## Erratum and numerical checks

Page 27 prints the upper endpoint of the jth y-subinterval as `d + j(d-c)/n`. It must be
`c + j(d-c)/n`, paired with lower endpoint `c + (j-1)(d-c)/n`; the printed value exceeds `d` for
positive `j`. The correction is recorded in `lib/curriculum/sources.json`; the PDF is unchanged.

Independent checks reproduce `27/2` on pages 43–44, `0` on pages 46–48, `32/15` on pages 54–55,
`36` on pages 57–58, and `1/3` on pages 59–61. The exact-value and changed-data regressions are in
`tests/mh2100-lecture05-source-map.test.mjs`.

Pages 20–23 are visibly blank continuation slides and are outside this review scope; no solution
is inferred from them. The review makes no claim that the tutorial, review, annotated-note, or
past-exam archive is complete.
