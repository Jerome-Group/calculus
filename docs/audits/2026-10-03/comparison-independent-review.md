# Independent comparison lab review

Inspected pure model, all seven lab families, shared range/chart/prediction controls, reset integration, and tests. No edits. Mathematical formulas valid throughout visible control ranges. Two material findings sent to lead:

1. **P2 representation — angle diagram silently distorts directions.** `components/atlas/comparison-path-lab.tsx:56-60,69-70` maps x with 100 pixels/unit, y with 40. At theta=pi/4, the selected diagonal is visibly 21.8014 degrees, not 45, with axes labeled x/y but no unequal-scale warning. This lab teaches direction-dependent limits; equal aspect should apply to its direction diagram (or explicitly label unequal scales and avoid suggesting geometric theta). Numeric formula and output remain correct.
2. **P2 interaction — correct “No” gets “Yes” feedback.** `components/atlas/comparison-lab-controls.tsx:96` prefixes every correct answer with `Yes.`. Six lab questions correctly answer No (axes/lines insufficient, absolute error insufficient, clock tangent not lost, order swap requires changed variable/bounds, finite polar approximation inexact). This creates contradictory feedback, particularly announced via role=status. Prefix `Correct.` or echo the selected answer unambiguously.

## Mathematical verification

Existing command `node --test tests/comparison-labs.test.mjs`: 6 passed; log `/private/tmp/calculus-comparison-review-tests.log`. Includes ray/curved witnesses, excluded origin, residual distinction, Hessian degeneracy, regular/singular clocks, fibre/tile integrals, SSR accessibility structures.

Additional independent calculations `/private/tmp/calculus-comparison-analytic.log`:

- Direct substitution in x²y/(x⁴+y²) for negative/positive x, six coefficients, both line/parabola paths; agrees with models.
- Compute bowl f(1+h)-f(1)-grad f(1)·h and counterexample g(h)-x directly; absolute residuals agree across radii/angles.
- Central finite differences of helix parameterizations agree with displayed speeds, including cubic clock at zero.
- Independent 400×400 midpoint double integral of density 1+x+y over triangular fibres gives 4.666668750000015 vs 14/3; area 1.9999999999999145 vs2.
- Independent radial Jacobian integrals agree with exact sector area and width²*angle/2 correction for origin and positive radii.

Exact scope/claims supported:

- g(x,kx²)=k/(1+k²); every fixed line tends to0, vertical line0, origin excluded. A selected k=0 is not a witness, but caption/prediction gives k=1 explicitly.
- xy/(x²+y²) gives cos(theta)sin(theta); axis0 vs diagonal1/2 proves nonexistence.
- Bowl normalized remainder=r uniformly in direction; x³/(x²+y²), extended0, has partials(1,0) but normalized remainder |cos(theta)sin²(theta)|. Absolute shrinkage insufficient.
- x²+a y²: determinant4a; a<0 saddle; a>0 strict minimum at origin; a=0 nonstrict minima x=0, Hessian test inconclusive.
- r(t)=(cos t,sin t,t) regular. Cubic clock covers same segment monotonically, velocity zero at u=0 without removing geometric tangent. Caption correctly calls image a projection.
- Triangle bounds0..2-q and inner density integral4-q-q²/2 correct in both orders by symmetry; mass14/3, area2.
- Polar finite area differs from inner-radius local estimate by positive quadratic correction. Origin singularity explicitly distinguished from finite positive sector. Max controls stay inside radius2 disk.

## Interaction/accessibility limits

Native labeled ranges and buttons provide keyboard interaction; Chart SVG exposes title+description and current numerical description; prediction has aria-pressed selections and role=status; outer reset remounts complete comparison and prediction. Source/static checks do not establish hydrated keyboard/focus/reset behavior. Lead browser plan must observe actual controls, endpoints, exact-zero shortcuts, two order states, successful/wrong predictions and full reset across all seven families. Dynamic readouts are ordinary text, so screen-reader announcement behavior needs browser inspection. No participant usability/mastery outcome inferred.

Opportunity, not defect: predictions sit after visible conclusions and use fixed conceptual answers. This can support reinforcement, but no claim of an independent pre-manipulation prediction assessment should be made.
