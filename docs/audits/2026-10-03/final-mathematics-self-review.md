# Final mathematics audit — author self-review

2026-10-03. Reviewed final seven complementary labs and surrounding original explanations. This reviewer authored the labs; this is **self-review**, not an independent signoff. Independent verification_design review and root mathematical/visual inspection are separate evidence. No source edits made.

## Conclusion

No material mathematical defect found in final reviewed states. Eight isolated-cache analytic/render tests pass. Original 125 lesson IDs/order and mathematical records (formulas, definitions, conditions, proofs, examples, pitfalls, references) exactly match origin/main. Comparison mapping adds representations to 11 existing concepts, with no curriculum expansion.

## Lab checks

- **Rays:** `xy/(x²+y²)` has heights cosθ sinθ, axis 0, exact diagonal presets ±1/2. Radius does not affect these restrictions. Origin remains excluded; universal existence is not inferred from samples. Equal-aspect projection preserves angle and radial distances. Axis or rounded-zero captions now describe agreement and suggest a diagonal rather than falsely reporting disagreement.
- **Curved path:** `x²y/(x⁴+y²)` on y=kx² gives k/(1+k²). Fixed nonzero-slope line y=mx gives mx/(x²+m²)→0; horizontal and vertical lines are zero. k=±1 gives exact incompatible ±1/2 witnesses. The existing explanation explicitly acknowledges the coordinate swap relative to its source example. Probe x remains positive; excluded origin is not evaluated.
- **Differentiability:** bowl at (1,1) has exact absolute error r² and normalized error r. Continuous zero extension of x³/(x²+y²) has candidate plane x, with normalized error |cosθ sin²θ|. At π/4 it is 1/(2√2), at the axis zero. Absolute error shrinks without certifying differentiability. Exact direction controls distinguish these cases; radius zero is excluded.
- **Saddle:** x²+ay² has Hessian diag(2,2a), determinant 4a, directional coefficient cos²θ+a sin²θ. Opposing principal sections prove a saddle for a<0. a=0 gives non-strict minima along x=0, although the Hessian theorem is inconclusive. Smoothness/stationarity hypotheses are met, and original theorem conditions remain visible.
- **Clocks:** helix r(t)=(cos t,sin t,t), cubic clock t=u³, velocity 3u²r′(u³), speed 3u²√2. Both clocks cover [−1,1] in the same direction. Exact-zero preset shows stopped cubic velocity while regular velocity (0,1,1) supplies the geometric tangent. No inference that arbitrary onto clocks preserve orientation.
- **Fibres:** nonnegative triangle x+y≤2. Both orders use upper inner bound 2−outer. Inner integral of density 1+x+y is 4−q−q²/2, outer total 14/3, area 2. Endpoints q=0,2 valid. Continuous compact-region slicing is distinguished from unjustified continuous-rectangle Fubini on a discontinuous zero extension.
- **Polar tile:** exact annular-sector area is ((r+Δr)²−r²)Δθ/2; differential approximation rΔrΔθ omits positive correction (Δr)²Δθ/2. Fixed angular width π/6, r≤1.5, Δr≤0.5 keeps the tile inside the existing radius-2 disk. At r=0 the finite sector stays positive while the derivative factor vanishes. Coordinate singularity and finite approximation are explicit.

## Original explanations and scope

LessonWorkspace exposes definitions/conditions in learn and explore. LessonContent's existing structured reasoning, fallback proof, worked application, misconception, supplements and sources remain on their prior paths; its diff only adds the comparison lab. Existing pilot lessons retain their existing learn/explore/practice/revise reasoning routes. This confirms no loss of previously reachable explanations; it does not assert every JSON proof field is separately rendered when an existing structured or pilot explanation supersedes it.

Nearby proofs preserve the neighborhood qualification for sufficient differentiability, total-differentiability requirement for gradient directional formula, continuity assumptions for mixed-partial equality, uniform squeeze bounds, and exact review normalized-remainder estimates. Public research notes cite primary mathematical/educational sources and explicitly limit educational transfer claims. No mastery, retention, learner usability or learning-gain claim is made.

Checks distinguish exact analytic identity, theorem conclusion and sampled drawing. Browser observations remain root evidence; these tests do not substitute for participant evidence or production verification.
