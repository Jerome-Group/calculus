# Calculus Atlas: mathematical, instructional and design audit

**Site:** calculus.jeromegroup.org
**Review date:** 11 September 2026
**Audited source snapshot:** `Jerome-Group/calculus` at commit `e3cc02a701db924a412248db13ff3bacacd91cf5`
**Coverage:** 125 individually reviewed exploration records: MH1100 (24), MH1101 (30), MH2100 (71).

## Executive judgment

**The site is a substantial interactive atlas and a promising revision companion. It is not yet a sufficiently self-contained course for end-to-end learning.** Its main weakness is not wholesale mathematical incorrectness. It is the gap between naming a concept, stating a correct compressed fact about it, illustrating one example, and actually teaching a learner to reason with it independently.

The existing architecture makes that gap predictable. A lesson has a formula, one definition paragraph, one conditions paragraph, one derivation paragraph, one worked-example paragraph, one pitfall paragraph, one task and one canonical scene. Some records carry many distinct subtopics. A topic list and a collection of source-page references cannot establish that each subtopic has been explained, practiced or understood. [S1, S2, S3]

The MH2100 material is generally more mathematically nuanced than the first two courses. Preserve its distinctions between partial and total derivatives, local and global conclusions, admissible and singular constraints, scalar and oriented integration, coordinate singularities and geometric singularities, and numerical evidence and proof. The task is to make these distinctions learnable, not to replace them with less rigorous slogans. [S1]

### Evidence boundary

I inspected the live site's web-readable landing content, the complete curriculum record set and its coverage ledger, and the relevant lesson, source-reference, navigation, mathematical-rendering, scene-configuration and graph-engine source. I also checked selected algebraic examples and explicit consequences of the graph algorithms. The full 125-entry audit below is based on those actual records, not on a generic calculus syllabus.

This is **not** an independently completed live browser, mobile, screen-reader, performance or WebGL test. Source-derived layout and interaction findings are labelled accordingly. I have not established that the deployed site is byte-for-byte identical to the pinned repository commit. I have not read all linked official course PDFs, independently certified their prescribed syllabuses, or verified anonymous access to each Drive source. The project's reported 47 linked source documents and 31 units are its own ledger counts. No files or settings on the site were changed. [S0, S2]

“Missing” in this report means missing or insufficiently developed in the inspected lesson experience, unless explicitly stated otherwise. It does not mean that a result is absent from the original lecture notes or from mathematics literature generally.

### How to use this report

Sections 1–8 identify cross-cutting defects and changes. Section 9 gives an individual assessment, mathematical/instructional change, experiment change and completion check for **every exploration**. Section 10 prioritizes implementation and gives release criteria. Source keys resolve to exact repository files or primary external references in the final section. Curriculum findings are located by stable record ID; headings are descriptive lesson labels.

## 1. Keep these existing strengths

The site already separates definitions, hypotheses, reasoning, examples and pitfalls. It already supplies source-page references, not merely a bibliography. Many statements include the caveats that weak calculus websites omit. Particularly good material includes the all-lines counterexample for multivariable limits, the failure of total differentiability despite directional derivatives, independent constraint-gradient conditions, the signed spherical Jacobian convention, and the distinction between smoothness on a boundary and smoothness throughout an enclosed region. [S1]

The final-review inverse Jacobian, curved-region area and six-stationary-point classification check out in independent algebraic checks. The inscribed-box argument also properly addresses centering, positive dimensions, boundary cases and the global maximum. These are good candidates for expanded flagship lessons, not material to discard. [S1: `review-change-of-variables`, `review-critical-points`, `review-lagrange-box`; S12]

The interface already provides split, wide and minimized visualization layouts; graph representation choices; exact parameter landmarks in applicable lessons; keyboard camera rotation and zoom; HTML plus MathML mathematics; and an SVG compatibility fallback. The graph studio already explains finite sampling, clipping, missed small features and sign-change limitations. Recommendations below extend these features rather than falsely treating them as absent. [S3, S6, S8, S9]

## 2. Mathematical corrections and precision

### M1 — The first-derivative test is incomplete as stated

**Classification: theorem-statement defect; correct before relying on the lesson for independent study.**

The `derivative-tests` record says that a positive-to-negative derivative sign change gives a local maximum. Its conditions do not state continuity at the candidate for this first-derivative test. The second-derivative sentence has its own assumptions, but those do not supply the missing assumption for the preceding sign-change rule. [S1: `derivative-tests`, `definition` and `conditions`]

Here is an explicit counterexample to the rule with only the stated neighboring sign information:

\[
f(x)=\begin{cases}-|x|,&x\ne0,\\-1,&x=0.\end{cases}
\]

For negative inputs, \(f'(x)=1\); for positive inputs, \(f'(x)=-1\). Nevertheless, whenever \(0<|x|<1\),

\[
f(x)=-|x|>-1=f(0),
\]

so zero is a strict local **minimum**, not a maximum. The failure is the jump in the chosen point value.

Use a concrete sufficient statement: let \(f\) be continuous on an interval containing \(c\), differentiable on either side of \(c\), with \(f'>0\) immediately to the left and \(f'<0\) immediately to the right. Then \(f(c)\) is a local maximum. Give the reversed version for a minimum. OpenStax's stated first-derivative theorem explicitly includes continuity. Do not turn these sufficient tests into an unsupported assertion that every extremum must have a clean derivative-sign pattern on whole neighboring intervals. [E1]

The same lesson should replace “appropriate second derivative regularity” with an actual usable sufficient assumption, for example \(f\in C^2\) near \(c\), \(f'(c)=0\). Its cubic example should explicitly call its maximum and minimum **local**, since the cubic is unbounded above and below.

### M2 — Fix definition-level shortcuts

`power-series-radius` describes a power series as a polynomial with infinitely many terms. That is a suggestive analogy, not a correct definition: a polynomial has finitely many nonzero coefficients. Define a power series as a series of monomials, distinguish its partial-sum polynomials from its sum function, and specify where that function is defined. This is particularly important before permitting termwise operations. [S1: `power-series-radius`]

Other terminology needs a defined convention rather than a casual phrase: critical versus stationary point; affine approximation versus linear derivative; Jacobian matrix versus determinant versus absolute determinant; geometric curve versus parametrized traversal; and the domain-relative meanings of continuity and extrema. Several MH2100 cards already handle these well. Make the conventions consistent across the earlier cards and the interface. [S1]

### M3 — A proof sketch is not a completed proof, and an imported theorem is not a derivation

There is nothing wrong with using a theorem without proving it in a calculus companion. The problem is not telling the learner what has been assumed, what has been proved, and what background a compact explanation requires.

The single-variable chain-rule explanation uses little-o language before that language has received a developed introduction. The MVT derivation reduces to Rolle without developing Rolle independently in the same learning path. The L'Hôpital explanation invokes Cauchy's mean value theorem. The power-series and multiple-integration arguments use uniform control. The inverse-function derivative calculation needs a theorem ensuring the inverse is differentiable; differentiating an inverse identity alone does not establish that prerequisite. [S1: `chain-rule-single`, `rolle-mean-value`, `lhopital`, `inverse-functions`, `power-series-operations`, `fubini-double`]

Assign each reasoning block one of four explicit statuses: **complete proof**, **proof sketch**, **geometric motivation**, or **theorem used without proof**. Link every substantial prerequisite. The implicit-function lesson already honestly says its existence theorem is not derived there; use that clarity as the norm. [S1: `implicit-functions-and-tangents`]

### M4 — Avoid an unstated change in integration framework

The general-region lessons correctly distinguish Jordan/Riemann area from Lebesgue measure, but introduce this distinction abruptly. A beginner cannot use a measure-zero discontinuity criterion just because it appears in the conditions paragraph. Similarly, a proof by zero extension can create boundary discontinuities, while the previously displayed basic Fubini theorem only covered continuous functions on rectangles. The region formula remains valid under appropriate hypotheses; the exposed chain of justification needs the relevant extension of the theorem, not a silent appeal to a stronger version. [S1: `general-double-integrals`, `fubini-double`, `type-one-two-regions`]

Keep the main computational path under clearly stated sufficient assumptions. Put the framework distinction in a developed extension explaining zero extension, negligible boundaries, boundedness and the theorem being imported. Do not erase a mathematically worthwhile caveat merely because it is advanced.

### M5 — Some review tasks are not fully stated on the site

The four-problem integral review contains meaningful calculations, but two portions refer to a “given” field or “supplied” parametrization without reproducing the full original problem. The summary supplies enough curl or potential information for the reported shortcut computation, but not enough to reconstruct and independently audit the complete original problem and all its conditions. [S1: `review-integral-methods`, `example`]

Each review problem needs its own complete statement: field, domain or parametrization, parameter interval, orientation and requested quantity. Then separate strategy, theorem eligibility, setup, calculation and final check. Linking a PDF is supplementary; it must not be required to discover what the exercise actually asks.

## 3. The central instructional defect: coverage is not completion

### I1 — The data model encourages compressed notes, not developed lessons

The example and derivation tabs each render a single paragraph field. The phrase “A complete example” consequently overpromises on lessons whose example is only an identity or a final calculation. A paragraph can contain a good short proof, but this single-string pattern is a poor default for a course spanning multiple proof techniques and computational methods. [S3]

The remedy is not to pad every field with more text. Split overloaded lessons into meaningful blocks and let them contain several examples, explicit strategy decisions, intermediate calculations and exercises. Keep short reference cards as a separate revision view.

### I2 — The example distribution leaves major advertised techniques unworked

| Lesson area | What the present example demonstrates | Instruction that must be added or developed |
|---|---|---|
| Differentiation rules | A simple product example | Quotient and trigonometric rules; combined expressions; domains; rule selection |
| Integration by parts | A first application to \(xe^x\) | Repeated parts, cyclic integrals, definite boundary terms and a poor-choice comparison |
| Partial fractions | Two distinct simple linear factors | Polynomial division, repeated factors, irreducible quadratics and a full coefficient-solving example |
| Washers | A disk-type rotation | A nonzero inner radius, shifted axes, and the distinction between \(R^2-r^2\) and \((R-r)^2\) |
| Monotone sequences | The explicit sequence \(1-2^{-n}\) | An actual recurrence, induction for bounds, monotonicity, convergence before the fixed-point equation |
| Ratio and root tests | A factorial ratio example | A distinct worked root-test problem and inconclusive cases requiring another method |
| Power-series endpoints | The geometric series with two failing endpoints | An interval with different endpoint behavior, such as \(\sum_{n\ge1}x^n/n\) |

These are differences between the advertised subtopics and what the selected example actually teaches, not allegations that the original lecture material lacks these methods. [S1: corresponding record IDs in Section 9]

### I3 — Movement is not a learning task unless it answers a mathematical question

“Move the point,” “increase the cutoff” and “compare the curves” can initiate exploration. They do not establish whether the learner can predict, explain, prove or transfer the result. In several lessons the decisive formula is already displayed while the learner performs a motion that merely confirms it. [S1, S3]

Use the sequence **predict → manipulate → explain → justify → transfer**. A learner should commit to a prediction, inspect a meaningful variation, give the explanation, connect it to the formal argument, and then answer a new problem without the original visual scaffold. Exact landmarks are useful, but should not replace the reasoning that identifies those landmarks.

### I4 — Independent practice and feedback are missing from the inspected lesson architecture

The lesson schema and controller expose a task prompt, navigation and display state, but not a developed exercise/hint/solution/misconception system or persisted mastery record. There is no basis here for treating arrival at the next card as demonstrated learning. [S1, S3, S4]

Provide conceptual checks, calculations, proof-completion tasks, counterexample identification and mixed-method problems. Feedback should distinguish a wrong sign, a wrong domain, a missing theorem hypothesis and a wrong technique. Not every proof needs automatic grading: a staged hint, annotated solution and self-check rubric are a substantial improvement over an answer with no feedback.

### I5 — Repetition is useful only when the next lesson changes the intellectual demand

Reusing a paraboloid, circle, sphere or linear transformation can reduce irrelevant setup. Reusing it unchanged while changing the title can conceal the new concept. Make every reuse answer a different explicit question and expose different quantities. If the new concept cannot be demonstrated on that example, add a new model rather than relying on a disclaimer. [S1, S5]

## 4. Visual experiments that need substantive changes

### V1 — A linear-map scene cannot carry the whole nonlinear-Jacobian sequence

The shared Jacobian scene interpolates linear maps with determinant \(1+2s\), so its area scale is constant across the source region at each slider position. That is appropriate for introducing determinants. It does not illustrate a Jacobian that varies with position, the difference between local and global invertibility, or the exact curved-boundary review region with factor \(1/(4u)\). [S5: `jacobian`; S1: `plane-jacobian`, `review-change-of-variables`]

Retain the linear anchor. Add a paired parameter/physical-domain nonlinear experiment, a shrinking-cell comparison with the derivative, an orientation-reversing case, and a multiple-coverage counterexample. Section 8 gives a complete elementary nonlinear replacement lesson.

### V2 — Variable polar bounds need an actual variable-bound region

The current polar scene is a centered radius-two sector. The variable-bound card explicitly says that the shifted-disk example is an algebraic extension, not what the scene displays. That honesty is good; the missing instructional experience remains. [S1: `polar-regions`; S5: `polar`]

Show \((x-1)^2+y^2\le1\) together with \(0\le r\le2\cos\theta\), \(-\pi/2\le\theta\le\pi/2\). Let a ray sweep through the disk, highlighting its actual radial interval. The learner should derive the angular range and explain the zero-radius exception, not only watch a sector get larger.

### V3 — Several canonical examples suppress precisely the difficulty that needs teaching

The chain-rule circle on a radial bowl has constant height, hence zero output derivative everywhere. The rotational vector field is exactly tangent to the unit circle. The radial field is exactly normal to a sphere. The quadratic extremum family \(x^2+ay^2\) produces minima, degeneracy and saddles but never a strict maximum. These are excellent first examples, not adequate full example families. [S5]

Add non-cancelling chain-rule paths, transverse and opposed force components, oblique and sign-changing flux, and a rotated quadratic with a mixed term and both curvature signs adjustable. The point is not visual variety for its own sake; it is to make the theorem's actual content impossible to avoid.

### V4 — Render the exact review object

The curved-region review, ellipsoid-box optimization, six-critical-point surface and differentiability review use canonical rather than exact scenes. Some cards acknowledge this and send the learner to work on paper or re-enter a formula in the graph studio. [S1: final five review records]

Add one-click exact problem presets with the right expressions, domains, camera, overlays and selected points. The generic scene can remain as a prerequisite comparison. A diagram next to a problem should say clearly whether it is the actual problem, a simplified analogue or a schematic.

### V5 — Show intermediate mathematical objects, not only final surfaces

The missing visuals are often not more elaborate 3D models. They are a domain and its projection, a parameter rectangle and its image, a differential and its remainder, a sign chart, two candidate paths, separate component contributions, or internal edges cancelling. Make these objects inspectable and linked to the corresponding formula terms.

Use 2D where it communicates the object more directly. A series convergence decision, partial-fraction decomposition or quantifier argument does not improve simply by acquiring a 3D viewport.

## 5. Graph-engine correctness and mathematical honesty

### G1 — Source-derived curve discontinuity bridging

**Classification: concrete numerical-rendering defect exposed by the source algorithm; not independently reproduced in a live browser.**

The curve renderer samples 601 equally spaced parameter values. It joins consecutive samples when their coordinates are finite and their z-coordinate lies within the clipping height; it breaks the curve on an invalid sampled point. This can connect through a singularity that falls between samples. [S7: `buildGraph`, curve branch]

Use the test curve

\[
\mathbf r(t)=\left(t,\frac1{t-0.001},0\right),\qquad -1\le t\le1.
\]

For this sampling grid, the singularity is not sampled. All 601 sampled points are finite, and every z-coordinate is zero. The two samples straddling the singularity are approximately

\[
(0,-1000,0),\qquad(0.003333,428.571,0).
\]

The inspected algorithm joins them, creating a false segment across an undefined parameter value. The accompanying numerical check records this exact source-logic consequence. [S7, S12]

Add adaptive subdivision, explicit excluded-parameter intervals when known, and jump/scale checks appropriate to all coordinates. Keep a visible warning that discontinuity detection remains heuristic for arbitrary input expressions. Neither dense sampling nor any finite generic heuristic proves continuity.

### G2 — Sign-change methods miss non-sign-changing zero sets

**Classification: documented algorithm limitation requiring better contextual presentation, not an undisclosed bug.**

The implicit renderer separates negative and nonnegative sample values. For \(F(x,y,z)=z^2\), there are no negative samples, so its tetrahedra supply no crossing triangles even though the zero set is the whole plane \(z=0\). The graph studio already warns about this class of example. [S7: implicit branch; S6: “What the graph can tell you”; S12]

The blank-result message should therefore say “No sign-changing surface was detected at this resolution,” with the non-sign-changing-zero-set explanation nearby. Never call a blank plot an empty mathematical set. Degeneracy detection or specialized methods can improve selected classes, but should not be marketed as an exact arbitrary implicit-set solver.

### G3 — Attach limitations to the result they qualify

Finite-sample counts, clipping, low-resolution misses, surface-jump filtering and parameter seams are already acknowledged in the project. The concern is that the warnings are separated from the result or hidden in a tab. [S3, S6]

Put concise, contextual status next to the plot: “sampled approximation,” “some values excluded,” “no geometry detected,” or “this displayed model differs from the worked example.” Offer the fuller numerical explanation on demand. Distinguish a function's mathematical domain from the display window and from clipping.

Add mathematical regression examples alongside finite-geometry tests: a removable hole; an unsampled pole; a bounded jump; a non-sign-changing zero set; repeated curve traversal; orientation reversal; a coordinate seam; and an exact known integral. Construction of finite mesh coordinates and KaTeX parsing are useful tests, but they do not establish semantic mathematical correctness. [S2, S7]

## 6. Design and information architecture

### D1 — Build a reading experience, not a control dashboard with notes attached

The strongest proposed default is a readable mathematical narrative with the relevant experiment immediately beside it or inline at the moment it is needed. The main question, objects, notation and theorem should not compete with a large decorative title or several groups of controls. Keep the existing wide and minimized modes, but make their purposes explicit: study with the model, inspect the model, or read without it. [S3, S10]

The underlying visual identity—dark navigation, chartreuse selection, warm reading surface and cobalt experiments—does not need to be discarded. Its success should be judged by mathematical legibility and hierarchy, not novelty. Reduce display-heading dominance on lesson pages; preserve expressive branding on the landing page. Use stable semantic colors for function, approximation, error, direction and normal, supplemented by labels and patterns. A color must not silently mean height in one view and density in another. These are design recommendations, not claims about measured contrast or user-test outcomes.

### D2 — Keep essential theory and its example available together

The present tabs separate derivation, worked example and subtleties. That is economical for revision but makes a first-time learner repeatedly switch between reasoning and application. The single-string paragraph design also encourages long unstructured mathematical prose. [S3, S9]

Use continuous sections for motivation, definitions, theorem, derivation and worked application, with optional proof detail and advanced caveats disclosed inside the narrative. A reader should be able to compare a theorem assumption with the step using it without changing tabs. Put hypothesis failures next to the claim they invalidate, not only in a generic subtleties area.

Long equations should be manually structured into meaningful lines. Do not shrink all mathematics to fit a narrow panel, and do not solve overflow by truncation. On very narrow screens an individual mathematical object may need a local scroll or alternate representation, but the surrounding prose and navigation should reflow. [E2, E3]

### D3 — Change the mobile order from graph-first to question-first

The final CSS places the graph before the explanatory body in the narrow layout, with a 350-pixel mobile canvas before additional controls. This is a source-derived ordering issue; no live mobile viewport height was measured in this review. [S10]

For learning mode, show the question, notation and essential mathematical statement first. Then show the relevant model with one primary control, followed by the derivation and task. Preserve an explicit “expand experiment” action. For exploration mode, graph-first can remain appropriate. These are different jobs and should not be forced into the same default.

“No scrolling to the mathematics” should mean that the essential mathematical object is immediately available—not that an entire proof or course must be squeezed above the fold. Never trade away readable type or complete reasoning to achieve an artificial one-screen constraint.

### D4 — Navigation must express prerequisites and progress

The existing hash links and previous/next controls are useful, but an ordered list of 125 cards is not a prerequisite model. The controller stores display state, not demonstrated understanding. Its search matches titles and topic strings, so it will miss many queries expressed in the vocabulary of a confused learner. [S3, S4]

Offer three clearly distinguished proposed routes: **Learn** (sequenced lessons and checks), **Explore** (open mathematical tools) and **Revise** (compact definitions, theorem conditions and mixed practice). Keep module and lecture organization as a mapping layer. Show prerequisite links, what the learner should now be able to do, an explicit course boundary, and a resumption point. Do not award mastery for opening a card or moving a slider.

Add notation and misconception search: “all directional derivatives,” “can I swap integrals,” “why absolute Jacobian,” “when does Lagrange fail,” and aliases such as “Fréchet”/“total derivative.” Deep links should optionally preserve the exact experiment, parameters, graph bounds and selected example. The current `#graph` route alone does not encode that full graph state. [S4]

### D5 — Literature must be usable, not merely attached

The source panel has real page references and explicitly warns that Drive permissions remain in force. Those references are a strength. They do not make the site self-contained for a public reader, and anonymous access was not tested here. [S8]

For each lesson, distinguish the official source from optional reading, explain what the suggested reading contributes, and link the most relevant public section where available. Replace repeated generic further-reading text with specific guidance: alternative proof, second worked example, prerequisite refresher, counterexample or extension. A common calculus-series landing link across the non-MH2100 lessons is too broad to do this job. [S8]

Do not republish permissioned textbook or lecture PDFs merely to make access easier. Write original explanations and provide lawful public alternatives. A reader should be able to complete the core lesson and its exercises without retrieving the official PDF.

### D6 — Accessibility requires equivalent mathematics, not just controls

The current MathML output, labelled controls, keyboard rotation/zoom and compatibility renderer are useful. The viewport's accessible label is nevertheless generic; it describes how to move the scene rather than the mathematical content of the current scene. This is not a completed screen-reader audit or a formal WCAG conformance finding. [S9]

Provide scene-specific descriptions and tabular or textual equivalents for the instructional result: selected point, function value, derivative, sign, parameter interval, normal direction, sampled versus exact quantity. Test whether keyboard-only users can complete the actual learning task, not merely orbit a camera. Verify focus after navigation, zoom/reflow, contrast of essential graphical objects, motion preferences and the announcement rate during playback. W3C's requirements concern accessible information and operation, not the mere presence of an ARIA attribute. [E2, E3]

## 7. Add the missing bridges before adding more advanced topics

The following are priorities for the site's end-to-end learning goal, not claims about omissions from the official NTU syllabus.

**Readiness bridge.** Algebraic manipulation, domains and intervals, inequalities, trigonometric identities and radians, function composition, and interpreting mathematical symbols. Let a diagnostic direct a prepared learner past material they already know.

**Proof-language bridge.** Quantifiers and their negation, direct proofs, counterexamples, necessary versus sufficient conditions, supremum/completeness, and the difference between a plausible graph and an all-input estimate. Introduce uniform continuity before relying on it in integral arguments, or explicitly import the theorem.

**Approximation bridge.** \(O\) and \(o\), finite versus asymptotic error, linear versus affine maps, and the transition from one-variable differentiability to a multivariable linear approximation. This should feed chain rules, Taylor arguments, numerical integration and total differentiability.

**Linear-algebra bridge for MH2100.** Linear maps, matrix composition, rank, kernel, normals, Cauchy–Schwarz, determinants, quadratic forms and definiteness. The Hessian and multiple-constraint arguments should link here rather than expecting the reader to infer the language from a formula.

**Arc-length and parametrization bridge.** Develop non-unit speed, reparametrization, piecewise regular curves and repeated traversal before scalar and vector line integration. The existing speed-factor explanation can become the endpoint of this bridge instead of its entire content.

**Method-choice bridges.** Add cumulative tasks comparing integration methods, series tests, limit strategies, optimization candidates, coordinate systems and the integral theorems. Knowing six isolated procedures is not the same as knowing when to use one.

Extensions such as curvature, moments, differential equations, richer probability applications and differential forms can be valuable, but are secondary to completing the current foundations. Mark them as enrichment rather than silently enlarging the prerequisite burden of the core course.

## 8. What a complete replacement lesson should look like

### Example: why a nonlinear Jacobian varies with position

**Learning outcome:** transform both a region and an integral, derive the local area factor, and explain why it is not constant.

**Prerequisites:** linear-map area scaling, partial derivatives, a double integral over a rectangle.

Start with the square \(D=[0,1]^2\) and the nonlinear map

\[
T(u,v)=\bigl(u,(1+u)v\bigr).
\]

**Question before the answer:** equal little squares in the left and right portions of the parameter domain need not represent equal physical areas. Which side should expand more, and why?

**Derive the target region.** Since \(x=u\) and \(y=(1+u)v\),

\[
R=T(D)=\{(x,y):0\le x\le1,\ 0\le y\le1+x\}.
\]

The bottom stays at \(y=0\), the top becomes \(y=1+x\), and the two vertical sides have heights one and two. Deriving these four boundary correspondences teaches the substitution rather than simply supplying transformed bounds.

**Show the two representations together.** A movable point in the parameter square highlights its image in the trapezoid. A small parameter cell highlights the corresponding physical cell and its tangent-parallelogram approximation. Vary location separately from cell size.

**Derive, do not announce, the Jacobian.** The derivative columns are the changes produced by the two parameter directions:

\[
DT(u,v)=\begin{pmatrix}1&0\\v&1+u\end{pmatrix},
\qquad \det DT(u,v)=1+u.
\]

The horizontal parameter direction maps to \((1,v)\); the vertical one maps to \((0,1+u)\). Their parallelogram has area \(1+u\). Thus the infinitesimal area factor is one at \(u=0\), three halves at \(u=1/2\), and two at \(u=1\). It is independent of \(v\), although the local shear is not.

For a finite cell \([u,u+h]\times[v,v+k]\), with positive \(h,k\) inside the domain, the exact image area is

\[
\int_u^{u+h}\int_v^{v+k}(1+s)\,dt\,ds
=hk\left(1+u+\frac h2\right).
\]

Its ratio to parameter area approaches \(1+u\) as \(h\to0\). This explicitly connects a finite visual cell to a local differential statement; it does not equate the finite-cell factor with the derivative at its lower-left corner.

**Check the theorem assumptions.** On an open neighborhood with \(u>-1\), the inverse is

\[
u=x,\qquad v=\frac{y}{1+x},
\]

and the determinant is nonzero. This gives an appropriate one-to-one smooth change of variables near the square.

**Work a full example.** Transform area, then verify it independently:

\[
\operatorname{Area}(R)
=\int_0^1\int_0^1(1+u)\,dv\,du
=\frac32
=\int_0^1(1+x)\,dx.
\]

**Test transfer.** Ask the learner to compute \(\iint_R y\,dA\), not just repeat the area calculation. The transformed integrand is \((1+u)^2v\), because one factor comes from replacing \(y\) and the other from the measure:

\[
\iint_R y\,dA
=\int_0^1\int_0^1(1+u)^2v\,dv\,du
=\frac76.
\]

Give a hint before revealing the solution: “Have you transformed both the density and the area element?” Then contrast an orientation-reversing map to explain the absolute determinant, and move to the site's exact curved-boundary review problem.

This is a teachable sequence: a question, a prediction, a region, a map, a local approximation, assumptions, a complete computation, an independent check and a new problem. The slider has a purpose at every stage.

### Proposed lesson-data contract

The existing JSON format can remain; it needs a richer structure rather than a compulsory new content platform.

```text
lesson
  id, course, unit, title
  learningOutcomes[]
  prerequisiteIds[]
  notation[]
  blocks[]                    # paragraphs, equations, diagrams, theorem blocks
  theorems[]
    statement, hypotheses, proofStatus, proofBlocks[], prerequisiteIds[]
  workedExamples[]
    problem, strategy, steps[], verification
  exercises[]
    prompt, hints[], solution, selfCheckRubric, misconceptionTags[]
  experiments[]
    modelId, question, controls, exactLandmarks, expectedReasoning, limitations
  sources[]
    role, locator, accessNote, publicAlternative, reasonToRead
  summary, nextLessonIds[], reviewLinks[]
```

A substantive lesson should not be marked complete solely because every field is nonempty. Its examples must teach its advertised outcomes, its tasks must be answerable from the site, and its experiments must expose the mathematical object under discussion.

## 9. Individual audit of all 125 explorations

Each entry distinguishes the current assessment from proposed changes. “Completion check” is a proposed test of the revised lesson's adequacy; it is not a test already administered to learners. Every entry's primary source is [S1], located by the displayed record ID; scene-level observations also use [S5].


### MH1100: Calculus I — 24 explorations

#### MH1100 01 — Functions begin with a domain

**Source record:** `[S1] sets-functions-domains`

**Assessment.** The domain/codomain/range distinction is good, but sets, set operations, interval notation, functionhood and real-domain restrictions are compressed into one introduction. The square-root demo covers only a small part of that scope.

**Improve or add.** Separate notation and set operations from function definitions. Derive every restriction for sqrt(x−1)/(x−2), intersect the allowed sets, and distinguish an expression's natural domain from a deliberately restricted function.

**Experiment/design change.** Link an input-set diagram, allowed-domain number line and graph. Make codomain and actual range independently visible; include a relation that fails the function test.

**Completion check.** Given a formula and specified domain/codomain, identify all three sets and justify every excluded input.

#### MH1100 02 — Read a function’s shape

**Source record:** `[S1] function-shapes`

**Assessment.** Piecewise rules, symmetry, monotonicity and an entire elementary-function catalogue are named, but a shifted parabola cannot teach that catalogue. Strict increase and a zero derivative deserve an explicit comparison.

**Improve or add.** Add short, separate treatments of absolute value, piecewise junctions, even/odd/neither, increasing/decreasing intervals, and the basic polynomial/rational/trigonometric/exponential/logarithmic families.

**Experiment/design change.** Offer function-family switches and linked reflection tests; show x³ as strictly increasing despite its stationary point. Include a domain that destroys an otherwise symmetric formula's symmetry.

**Completion check.** Classify an unfamiliar piecewise function with proofs or counterexamples, rather than by its apparent silhouette.

#### MH1100 03 — Transform and compose

**Source record:** `[S1] transform-compose`

**Assessment.** The point-mapping derivation is useful and the composition domain is handled correctly. The current task emphasizes horizontal translation, while the advertised formula has four transformation parameters.

**Improve or add.** Work through input and output transformations separately, then combine them. Include negative horizontal/vertical scales, the b=0 exceptional case, and both orders of a composition with different domains.

**Experiment/design change.** Use guided controls for a, b, h and k, paired with an input→intermediate→output diagram. Keep the old and new graph points linked.

**Completion check.** Predict the transformed point and determine the composition domain before seeing either graph.

#### MH1100 04 — Approach a point

**Source record:** `[S1] limits-one-sided`

**Assessment.** The removable-hole example and two-sided criterion are appropriate. They do not provide enough contrast to distinguish a limit, a point value, a jump and oscillation.

**Improve or add.** Add a side-by-side classification of a removable hole, unequal one-sided limits, infinite behavior and oscillatory failure. Work a secant/velocity motivation with units instead of only mentioning it.

**Experiment/design change.** Let the learner change f(a) without changing nearby values, and approach independently from either side. Label the excluded input explicitly.

**Completion check.** Explain why changing one point can repair continuity only when the surrounding limit already exists.

#### MH1100 05 — Vertical asymptotes

**Source record:** `[S1] infinite-limits`

**Assessment.** The 1/x and 1/x² comparison and M–δ argument are sound. The positive-cutoff experiment does not fully expose side-dependent signs or distinguish unboundedness from a limit to infinity.

**Improve or add.** Add sign analysis on both sides, a removable-denominator-zero example, and an unbounded oscillatory example. State the quantifiers for positive and negative infinite limits.

**Experiment/design change.** Give separate left/right approaches and a selectable height threshold M. Distinguish clipped graph values from mathematical infinity.

**Completion check.** Prove one infinite limit and produce a counterexample to 'denominator zero implies vertical asymptote.'

#### MH1100 06 — Limit laws and squeezing

**Source record:** `[S1] limit-laws-squeeze`

**Assessment.** This card carries a large collection of source references and techniques. The selected squeeze example cannot replace instruction in limit algebra, rationalization, restrictions and the foundational trigonometric limit.

**Improve or add.** Split algebraic evaluation from squeeze proofs. Derive sin(x)/x→1 geometrically in radians without relying on the derivative it will later justify; include rationalization and nonzero-denominator hypotheses.

**Experiment/design change.** Allow selection of competing bounds and display why each inequality holds, not just whether two plotted curves appear close.

**Completion check.** Choose a valid method for a new limit and give an all-nearby-input justification.

#### MH1100 07 — Make “close” precise

**Source record:** `[S1] epsilon-delta-one-variable`

**Assessment.** The quantifier order and δ=min(1,ε/3) example are strong starts. An automatically supplied δ illustrates a proof but does not teach the learner to construct one.

**Improve or add.** Separate scratchwork from the final quantified proof. Explain each restriction in the minimum, the negation of the definition, and why δ cannot depend on the tested x.

**Experiment/design change.** Introduce an ε challenge, a learner-selected δ and an adversarial input. Finite tests should be labelled exploratory; the concluding inequality must certify the entire interval.

**Completion check.** Construct a correct δ for a nonlinear example and diagnose an invalid quantifier order.

#### MH1100 08 — Continuity and intermediate values

**Source record:** `[S1] continuity-ivt`

**Assessment.** Continuity, extension and IVT are grouped together, while the bisection explanation relies on a completeness fact that is not developed here. Existence-versus-uniqueness is correctly cautioned.

**Improve or add.** Give the three continuity checks, a piecewise matching example, a full IVT application and a failed-hypothesis example. Explain the nested-interval/completeness step if calling the bisection argument a proof.

**Experiment/design change.** Contrast a continuous crossing with a jump across the same target height; make endpoint values and target assumptions visible together.

**Completion check.** Use IVT to prove existence without claiming uniqueness, and explain exactly why it cannot be used for a discontinuous example.

#### MH1100 09 — From secants to a tangent

**Source record:** `[S1] derivative-definition`

**Assessment.** The quadratic difference-quotient derivation is a good anchor. It needs a clearer transition from a derivative at one input to the derivative function and from parameter change to physical rate.

**Improve or add.** Work the same derivative symbolically, geometrically and with units. Distinguish f, f′, f′(a), the tangent line and an average rate; show signed increments on both sides.

**Experiment/design change.** Display the quotient and its simplified expression together. At h=0 show the limit value as a limit, not as evaluation of the original 0/0 expression.

**Completion check.** Derive a derivative from the definition and explain what each quantity on the screen represents.

#### MH1100 10 — Where differentiability fails

**Source record:** `[S1] differentiability-corners`

**Assessment.** The absolute-value corner and differentiability⇒continuity proof are useful. Higher derivatives, acceleration, vertical tangents and other failure types need more than a shared card.

**Improve or add.** Separate corners, vertical tangents and oscillatory derivative failure. Include a differentiable function with a discontinuous derivative, and develop second derivatives/acceleration as a short bridge.

**Experiment/design change.** Compare one-sided secants for each failure type. Do not let a near-vertical finite mesh impersonate an infinite derivative.

**Completion check.** Distinguish continuity, finite differentiability and derivative continuity with explicit examples.

#### MH1100 11 — Build derivatives from rules

**Source record:** `[S1] differentiation-rules`

**Assessment.** The product-rule derivation is worth retaining. One x sin(x) example and a generic tangent experiment do not teach the full power/product/quotient/trigonometric toolkit.

**Improve or add.** Publish a complete, domain-aware rule table; derive representative rules and work combined expressions in annotated steps. Include the standard trigonometric derivatives and their dependence on radians.

**Experiment/design change.** For the product rule, show the two separate contributions to the change of a product; match colored terms to their geometric roles.

**Completion check.** Differentiate a mixed expression, name each rule used and verify the domain of the result.

#### MH1100 12 — The chain rule

**Source record:** `[S1] chain-rule-single`

**Assessment.** The local-expansion proof uses little-o notation before it has been adequately introduced in the learning sequence. A correct compact proof is not automatically an accessible first proof.

**Improve or add.** Introduce the meaning of a first-order remainder before this proof, or provide an elementary route followed by an advanced proof. Work nested compositions and evaluation points explicitly.

**Experiment/design change.** Link inner and outer graphs, input changes and their corresponding local scale factors. A dependency diagram should expose the multiplication of rates.

**Completion check.** Differentiate a three-layer composition and explain why each derivative is evaluated at its particular input.

#### MH1100 13 — Implicit curves and related rates

**Source record:** `[S1] implicit-related-rates`

**Assessment.** The circle example correctly connects a constraint with time derivatives, but two distinct skills are crowded together. Branch selection, word-problem modeling and units are underdeveloped.

**Improve or add.** Separate implicit differentiation from related rates. Add a full ladder or cone problem: diagram, constraint, differentiation, substitution, signed rate and units. Explain where solving for y locally fails.

**Experiment/design change.** Make a moving constrained configuration and show both its geometric equation and its time derivative. Provide a vertical-tangent branch-switch case.

**Completion check.** Translate a new verbal rate problem into a constraint and compute the requested rate without substituting constants too early.

#### MH1100 14 — Linear approximation and differentials

**Source record:** `[S1] linearization-differentials`

**Assessment.** The exact quadratic remainder and dy versus Δy distinction are valuable. Learners need an actual numerical approximation and a clear separation between an estimate and a certified error bound.

**Improve or add.** Define little-o and big-O at the level needed here. Work one numerical approximation and one measurement-error problem, with both absolute and relative errors.

**Experiment/design change.** Show f, its affine model, signed residual and normalized residual at the same displacement. Separate first-order prediction from a rigorous error envelope.

**Completion check.** State when an approximation is useful, calculate it and justify any claimed error bound.

#### MH1100 15 — Extrema and critical points

**Source record:** `[S1] extrema-fermat`

**Assessment.** The compact-interval example is appropriate, but a final maximum/minimum value is not a substitute for a complete candidate comparison. Endpoint and nondifferentiable candidates need equal prominence.

**Improve or add.** Show the critical-point calculation, endpoint list and value table in full. Include |x|, an open interval and an unbounded domain to distinguish existence from candidate finding.

**Experiment/design change.** Link candidate markers to a comparison table and label local versus absolute extrema separately.

**Completion check.** Find every absolute extremum on a specified domain and justify that no candidate class was omitted.

#### MH1100 16 — Rolle and the mean value theorem

**Source record:** `[S1] rolle-mean-value`

**Assessment.** MVT is derived from Rolle, but Rolle's independent justification is not supplied here. Later L’Hôpital refers to Cauchy's MVT, which is another missing link.

**Improve or add.** Prove Rolle using EVT and Fermat, derive MVT from it, and provide Cauchy's MVT as a linked lemma. Work derivative bounds, monotonicity and uniqueness-of-antiderivative consequences.

**Experiment/design change.** Show the subtraction of the secant line and the resulting equal-endpoint function. Contrast a corner that defeats Rolle's hypotheses.

**Completion check.** Prove a nontrivial inequality using MVT and identify the exact interval hypotheses.

#### MH1100 17 — Shape from derivatives

**Source record:** `[S1] derivative-tests`

**Assessment.** Correction needed: the first-derivative sign-change test omits continuity at the candidate. The second-derivative regularity is also described vaguely, and the example should explicitly say local maximum/minimum.

**Improve or add.** State continuity on an interval containing c and differentiability away from c for the first-derivative test. Give a precise sufficient second-derivative theorem. Include the discontinuous counterexample in Finding M1 and x³/x⁴ contrasts.

**Experiment/design change.** Use coordinated f, f′ and f″ plots plus sign charts. Permit a point-value change to demonstrate why continuity at c matters.

**Completion check.** Apply both tests with their hypotheses and explain why f″(c)=0 proves neither an extremum nor an inflection.

#### MH1100 18 — Infinity and curve sketching

**Source record:** `[S1] infinity-curve-sketching`

**Assessment.** The slant-asymptote difference criterion and crossing caution are good. A single rational example does not teach the complete process of curve sketching or both directions of infinity.

**Improve or add.** Work one rational function from domain and intercepts through asymptotes, derivative sign charts, concavity and a final sketch. Treat sqrt(x²)=|x| explicitly when comparing ±∞.

**Experiment/design change.** Reveal graph features only after the learner predicts them; distinguish an off-screen branch from an asymptote.

**Completion check.** Construct and justify a sketch without using the plotted graph as the proof.

#### MH1100 19 — Turn a constraint into an optimum

**Source record:** `[S1] optimization-single`

**Assessment.** The rectangle problem provides a clean first example but too little transfer. Learners need to formulate objectives and feasible sets themselves, not merely differentiate a provided quadratic.

**Improve or add.** Add a shifted-axis geometry or cost problem with nontrivial domain restrictions, plus a noncompact example where a supremum is not attained. Explain the role of boundary degeneracies.

**Experiment/design change.** Tie the geometric configuration to a feasible-domain interval and objective graph. Reject geometrically impossible parameter values.

**Completion check.** Solve a new optimization problem from words through a global conclusion, including units and feasibility.

#### MH1100 20 — Newton’s tangent iteration

**Source record:** `[S1] newton-method`

**Assessment.** The square-root example and convergence caveats are correct, but moving a starting point is not the same as understanding a sequence of iterates.

**Improve or add.** Add an iteration table, stopping criteria, residual-versus-root-error distinction, and a precise local convergence statement at an appropriate level. Include the 0↔1 cycle for x³−2x+2.

**Experiment/design change.** Provide explicit next-step controls, iteration history and failure states for zero/small derivatives, cycles and escape.

**Completion check.** Explain why a small residual or one plausible tangent step is not a general convergence certificate.

#### MH1100 21 — Recover a function from its rate

**Source record:** `[S1] antiderivatives-single`

**Assessment.** Constants on connected intervals are handled carefully. The same basic family is repeated in MH1101; this instance should prepare a genuine application rather than duplicate a reference card.

**Improve or add.** Develop velocity→position with an initial condition and piecewise time intervals. Distinguish displacement from distance and explain componentwise constants on disconnected domains.

**Experiment/design change.** Link the rate graph, accumulated change and selectable initial value. Changing the constant should translate position without altering velocity.

**Completion check.** Reconstruct motion from a rate and initial condition, with the correct interpretation of signed change.

#### MH1100 22 — Invert a function

**Source record:** `[S1] inverse-functions`

**Assessment.** Domain restriction and reciprocal slopes are introduced, but differentiating f(f⁻¹(y))=y only derives the formula after inverse differentiability is justified. Inverse-trigonometric foundations are thin upstream of integration.

**Improve or add.** State a sufficient inverse-function theorem before the formula derivation. Develop principal branches and domains/ranges for inverse trig functions, and distinguish inverse functions from reciprocals.

**Experiment/design change.** Link a function, its inverse, y=x and corresponding tangent points. Include x² on an unrestricted and then restricted domain.

**Completion check.** Choose a valid inverse branch and use the inverse derivative theorem with its hypotheses.

#### MH1100 23 — Exponential and logarithmic rates

**Source record:** `[S1] exponential-logarithmic`

**Assessment.** The x^x example is useful. The natural exponential's defining property, logarithm laws and their logical foundation deserve a more explicit route rather than mutually supporting assertions.

**Improve or add.** State how exp/log are being introduced and which facts are assumed or proved. Add logarithmic differentiation of a product/quotient, growth comparisons and domain checks.

**Experiment/design change.** Link exponential growth, tangent slope and inverse logarithmic behavior; make forbidden logarithm inputs visible.

**Completion check.** Differentiate a variable-power expression while preserving its real domain and explaining every logarithmic transformation.

#### MH1100 24 — Indeterminate forms and L’Hôpital

**Source record:** `[S1] lhopital`

**Assessment.** The eligibility conditions are considerably better than a rule-only summary. However, one easy 0/0 example does not cover the listed forms, and Cauchy's MVT is invoked without a developed prerequisite.

**Improve or add.** State a precise one-sided theorem, supply the Cauchy-MVT bridge, and work ∞/∞ plus product, difference and variable-power conversions. Recheck conditions after each application.

**Experiment/design change.** Use a method-choice exercise with eligible, convertible and ineligible limits; compare the original quotient with the derivative quotient without implying an algebraic identity.

**Completion check.** Explain why the rule applies, transform an indeterminate form correctly and recognize an inconclusive derivative-ratio limit.

### MH1101: Calculus II — 30 explorations

#### MH1101 01 — Antiderivatives form a family

**Source record:** `[S1] integral-antiderivatives`

**Assessment.** This is a sound recap of the preceding course, including the interval qualification. Repeating the same elementary family does not itself create progression.

**Improve or add.** Make it a diagnostic bridge: recover the rule, identify the role of C, and move to initial-value and piecewise examples. Allow prepared learners to skip the recap.

**Experiment/design change.** Couple derivative and antiderivative views with an initial-value selector, not only a vertical-shift slider.

**Completion check.** Distinguish the family of antiderivatives from a definite integral and select the correct member from data.

#### MH1101 02 — Accumulate with Riemann sums

**Source record:** `[S1] riemann-integral`

**Assessment.** The definition correctly demands sampling independence, and the quadratic sums are useful. Uniform partitions and one sampling choice dominate the actual worked experience.

**Improve or add.** Write the general partition formula with Δx_i and mesh norm. Develop upper/lower sums, signed accumulation, linearity, additivity and comparison as distinct results with examples.

**Experiment/design change.** Switch left/right/midpoint/arbitrary samples and uneven partitions, with negative heights included. Show upper/lower enclosure when available.

**Completion check.** Explain why convergence of one displayed sequence of sums is weaker than Riemann integrability.

#### MH1101 03 — The average value of a function

**Source record:** `[S1] integral-average`

**Assessment.** The equal-area idea and continuity-for-attainment distinction are mathematically good. The learner needs the complete evaluation and a counterexample when continuity is dropped.

**Improve or add.** Work the x² average and its attaining point step by step, attach units, and contrast endpoint averaging with integral averaging. Include an integrable step function whose average is not attained.

**Experiment/design change.** Display the signed equal-area rectangle and allow a noncontinuous example; do not label a missing intersection as a plotting failure.

**Completion check.** Compute an average and say whether a theorem guarantees that some input attains it.

#### MH1101 04 — Differentiation meets accumulation

**Source record:** `[S1] fundamental-theorem`

**Assessment.** Both FTC directions and the short-interval-average proof are present, but variable bounds are relegated to a caution. The central relation deserves a full instructional sequence.

**Improve or add.** Separate FTC1 and FTC2, with assumptions and examples. Add negative integrands, net change, a moving lower bound and two variable endpoints; derive the chain-rule factors.

**Experiment/design change.** Link the integrand, accumulated integral and the accumulation function's tangent. Highlight exactly which strips are added or removed.

**Completion check.** Differentiate an integral with two moving bounds and explain its sign and chain-rule factors geometrically.

#### MH1101 05 — Substitution changes the variable

**Source record:** `[S1] substitution-integral`

**Assessment.** The nonmonotone signed-substitution caveat is a strength. Unfortunately, the example maps 0 and 1 to 0 and 1, hiding the very endpoint change beginners need to learn.

**Improve or add.** Use an example with visibly different transformed bounds, followed by an indefinite integral and a nonmonotone signed example. Account for every old variable and differential.

**Experiment/design change.** Display old and new intervals and linked small increments, with orientation changes separated from unsigned geometric area.

**Completion check.** Transform bounds and integrand correctly without mixing old and new variables.

#### MH1101 06 — Improper integrals are limits

**Source record:** `[S1] improper-integrals`

**Assessment.** Endpoint splitting and the distinction from symmetric cancellation are already explained correctly. The treatment needs worked limits and comparison practice, not merely more warnings.

**Improve or add.** Work an interior singularity, two independent infinite tails and both power thresholds. Contrast the ordinary improper integral of 1/x across zero with its symmetric principal-value calculation.

**Experiment/design change.** Show two independent cutoffs; never force symmetric cancellation as the only experiment. Display each limit separately.

**Completion check.** Decide convergence only after checking every improper part and distinguish a principal value from an ordinary integral.

#### MH1101 07 — Area between curves

**Source record:** `[S1] area-between-curves`

**Assessment.** The x versus x² example is a useful starting point but avoids switching order and splitting at crossings.

**Improve or add.** Work vertical and horizontal slicing of the same region, followed by a crossing that changes upper/lower order and a case needing multiple pieces.

**Experiment/design change.** Let the learner select slice orientation and endpoints. Highlight overlaps or omitted regions caused by proposed bounds.

**Completion check.** Derive an area integral from a diagram and justify every split and subtraction order.

#### MH1101 08 — Volumes from cross-sections

**Source record:** `[S1] disk-washer-volumes`

**Assessment.** The washer formula is present but the worked example is only a disk. General cross-sections and nonzero inner radii are not actually practiced.

**Improve or add.** Add a real washer example, a shifted rotation axis and a noncircular cross-section problem. Derive radii as distances before squaring them.

**Experiment/design change.** Link the planar generating region, the rotated solid and a labeled perpendicular cross-section. A 2D area plot alone is insufficient for the central spatial claim.

**Completion check.** Write the cross-sectional area correctly for a new axis and distinguish π(R²−r²) from π(R−r)².

#### MH1101 09 — Volumes from cylindrical shells

**Source record:** `[S1] cylindrical-shells`

**Assessment.** The thin-annulus derivation is a strength. Comparing the current shell and disk examples does not compare two methods on one solid, because their axes differ.

**Improve or add.** Solve the same solid by shells and washers, including a case where one method is clearly simpler. Explain coverage and overlap when a region crosses the axis.

**Experiment/design change.** Show a shell unwrapping into circumference×height×thickness and label the geometric radius.

**Completion check.** Choose a method, derive its bounds and independently check the result using the other method on the same solid.

#### MH1101 10 — Integration by parts

**Source record:** `[S1] integration-by-parts`

**Assessment.** The product-rule derivation and xe^x example are correct, but repeated and cyclic integration appear largely as promises.

**Improve or add.** Add ∫ln x, a repeated-parts polynomial–exponential example, a cyclic exponential–trigonometric example, and definite boundary terms. Explain why a choice makes progress.

**Experiment/design change.** Track the boundary contribution and remaining integral as linked quantities; use an algebraic stepper for factor selection rather than a generic area slider.

**Completion check.** Choose u and dv deliberately and solve a problem that requires more than one application.

#### MH1101 11 — Trigonometric integrals

**Source record:** `[S1] trigonometric-integrals`

**Assessment.** The odd-sine-power example is useful, but the task's sin² accumulation does not teach that substitution mechanism. Tangent–secant cases are too compressed.

**Improve or add.** Give a parity-based strategy with worked sine/cosine and tangent/secant cases, including both-even powers and complete back-substitution.

**Experiment/design change.** Highlight the reserved differential factor and the identity applied to the remaining power. Match the visual example to the algebraic case being taught.

**Completion check.** Select and justify an identity/substitution for a trigonometric product without relying on a memorized single example.

#### MH1101 12 — Substitute a triangle

**Source record:** `[S1] trigonometric-substitution`

**Assessment.** The absolute-value issue and sign-restricted interval are handled well. Only the easiest arcsine integral is worked, and prerequisite inverse-trigonometric material needs strengthening.

**Improve or add.** Work all three radical patterns, including completing the square and a nontrivial back-substitution. Show how the selected parameter interval fixes signs and injectivity.

**Experiment/design change.** Couple the triangle to the algebra, labeling signed quantities and branch restrictions instead of silently deleting absolute values.

**Completion check.** Perform a substitution, choose a valid branch and return an answer in the original variable with its domain.

#### MH1101 13 — Split a rational function

**Source record:** `[S1] partial-fractions`

**Assessment.** The text names polynomial division, repeated factors and irreducible quadratics, but only a two-linear-factor decomposition is demonstrated. This is a major skill-coverage gap.

**Improve or add.** Provide separate full examples of an improper fraction, repeated linear factors and irreducible quadratic factors. Solve the coefficient equations and integrate every resulting term.

**Experiment/design change.** Use a decomposition builder that detects missing powers and numerators of the wrong degree; connect the sum of pieces with the original rational function.

**Completion check.** Construct the full decomposition form before solving coefficients and retain all denominator exclusions.

#### MH1101 14 — Midpoint and trapezoidal rules

**Source record:** `[S1] quadrature-midpoint-trapezoid`

**Assessment.** Error constants and the quadratic example are correct, but the actual weighted-sum algorithms and how to find K need explicit instruction.

**Improve or add.** State both numerical formulas with indexing, derive the basic error scaling and solve for a sufficient n from a requested tolerance. Include a nonpolynomial example and explain why two close answers do not certify error.

**Experiment/design change.** Link the sample table, shapes, estimates and a proven error enclosure. Distinguish actual error in a known example from an a priori bound.

**Completion check.** Choose a valid derivative bound and a subdivision count that certifies a prescribed accuracy.

#### MH1101 15 — Simpson’s parabolic rule

**Source record:** `[S1] simpson-rule`

**Assessment.** The weights, even-n requirement and quartic error example are good. The theorem's smoothness condition should be explicit instead of 'usual assumptions.'

**Improve or add.** State a clear C⁴ sufficient version, derive one panel's weights and explain cubic exactness. Compare evaluation cost and guaranteed accuracy with midpoint/trapezoid methods.

**Experiment/design change.** Show paired panels and their interpolating parabolas, reject odd n with an explanation, and display a real error budget.

**Completion check.** Apply the correct weights and justify the number of panels needed for a tolerance.

#### MH1101 16 — Sequences and their limits

**Source record:** `[S1] sequence-limits`

**Assessment.** The ε–N definition and tail emphasis are sound. Extending a finite plot is not a learner-generated tail argument.

**Improve or add.** Add explicit N construction, divergent-to-infinity versus nonconvergent oscillation, and exercises requiring control of every late term.

**Experiment/design change.** Let the learner set ε and propose N; separate a finite diagnostic search from the symbolic tail inequality.

**Completion check.** Produce an N(ε) proof and explain why a long apparently stable plot is not sufficient.

#### MH1101 17 — Subsequences expose divergence

**Source record:** `[S1] subsequences-bounded`

**Assessment.** The even/odd example and boundedness proof are appropriate. The lesson needs cases beyond constant subsequences and clearer implication logic.

**Improve or add.** Include an oscillatory sequence with nonconstant convergent subsequences, the failure of bounded⇒convergent, and a sequence with successive differences→0 that still diverges. Label Bolzano–Weierstrass as an additional theorem if introduced.

**Experiment/design change.** Select subsequences and compare their limiting bands; prohibit repeating a fixed index as a false subsequence.

**Completion check.** Disprove convergence by two valid subsequences and distinguish necessary conditions from sufficient ones.

#### MH1101 18 — Calculate sequence limits

**Source record:** `[S1] sequence-limit-laws`

**Assessment.** The real-extension caveat for L’Hôpital is valuable. One rational limit and the shared sequence scene do not cover the full toolbox.

**Improve or add.** Add rationalization, squeezing, dominant powers, root-type limits and all geometric-ratio cases, including r<−1. Explain the one-way restriction from a real function limit to integer inputs.

**Experiment/design change.** Compare a sequence with two different continuous-domain extensions to expose why the converse fails.

**Completion check.** Choose a legal sequence-limit method and justify any passage to a real-variable extension.

#### MH1101 19 — Monotone and bounded

**Source record:** `[S1] monotone-sequences`

**Assessment.** The supremum proof is good but presupposes completeness. Recursive sequences are advertised, yet the worked example is the explicit sequence 1−2⁻ⁿ.

**Improve or add.** Explain least upper bounds, then work a recurrence such as a_(n+1)=sqrt(2+a_n): prove a bound and monotonicity before solving the fixed-point equation.

**Experiment/design change.** Link recursive steps to an invariant interval and a cobweb or term plot; mark the difference between a candidate limit and proved convergence.

**Completion check.** Complete an induction-based recurrence proof in the correct logical order.

#### MH1101 20 — A series is a sequence of sums

**Source record:** `[S1] series-geometric-telescoping`

**Assessment.** The finite geometric identity and telescoping example are valuable. The distinction between term sequence and partial-sum sequence should be made impossible to miss.

**Improve or add.** Add shifted indexing, nonunit first terms and negative geometric ratios. Work telescoping with its finite boundary terms fully written before taking a limit.

**Experiment/design change.** Display a_n and S_n in separate linked panels and animate exact cancellation for telescoping rather than reuse only the geometric scene.

**Completion check.** Derive a finite partial sum and only then determine convergence and its sum.

#### MH1101 21 — The term test only rules out

**Source record:** `[S1] series-divergence-test`

**Assessment.** The harmonic block proof is a strong piece of content. It should become the entry point to a method-selection system, rather than remain one isolated caution.

**Improve or add.** Develop the implication and its contrapositive explicitly. Include finite initial changes and examples where term limits exist, fail or are zero but inconclusive.

**Experiment/design change.** Show harmonic blocks contributing a fixed lower amount while individual terms shrink, alongside a convergent comparison.

**Completion check.** State exactly what the term test concludes and never infer convergence from a_n→0.

#### MH1101 22 — Compare a series with an area

**Source record:** `[S1] integral-test`

**Assessment.** The hypotheses and tail bounds are correct. The learner needs practice verifying eventual decrease and turning a remainder bound into a numerical guarantee.

**Improve or add.** Work a logarithmic benchmark and a target-accuracy calculation, checking positivity, continuity and monotonicity on the appropriate tail.

**Experiment/design change.** Link rectangles with upper/lower tail integrals, and show separately the partial sum and the bounded remaining amount.

**Completion check.** Apply the test with verified hypotheses and choose N to bound the remaining series error.

#### MH1101 23 — Direct and limit comparison

**Source record:** `[S1] comparison-tests`

**Assessment.** The inequality directions and 0/∞ ratio caveat are good. The 1/(n²+1) example is too forgiving to teach benchmark selection.

**Improve or add.** Add a divergence comparison, a mixed polynomial/logarithmic example, and one-way ratio limits. Explain how dominant terms suggest a comparison and how to turn that suggestion into an inequality.

**Experiment/design change.** Ask the learner to choose a benchmark and inequality direction before revealing a proof.

**Completion check.** Classify an unfamiliar positive series and justify the comparison in the correct direction.

#### MH1101 24 — Absolute and conditional convergence

**Source record:** `[S1] absolute-conditional-alternating`

**Assessment.** The alternating test, remainder bound and conditional harmonic example are good. The equality to ln 2 is stated before its derivation is connected to later material.

**Improve or add.** Separate the proof of absolute⇒ordinary convergence from the alternating proof. Add error signs, tolerance selection and a failed-monotonicity example. Link a valid later derivation of the ln 2 value.

**Experiment/design change.** Display even/odd enclosures and the next-term error bound. Distinguish convergence classification from exact sum evaluation.

**Completion check.** Decide absolute/conditional/divergent status and give a justified signed approximation error.

#### MH1101 25 — Ratio and root tests

**Source record:** `[S1] ratio-root-tests`

**Assessment.** The factorial example and L=1 contrast are effective, but there is no comparably developed root-test example.

**Improve or add.** Add an nth-power sequence where the root test is natural, an eventually undefined ratio with zeros, and an explicit inconclusive branch in the test-selection guide.

**Experiment/design change.** Compare geometric envelopes with actual terms; require a q<1 bound rather than treating a finite ratio as the limiting ratio.

**Completion check.** Choose between ratio/root/comparison tests and explain why L=1 is not a verdict.

#### MH1101 26 — Power series and their radius

**Source record:** `[S1] power-series-radius`

**Assessment.** Correct the phrase 'a polynomial with infinitely many terms': a polynomial is finite. The convergence-radius discussion is otherwise careful, but the only endpoint example has both endpoints fail.

**Improve or add.** Define a power series as a series of monomials and its sum where it converges. Work finite positive radius, radius zero/infinity and an interval with different endpoint behavior.

**Experiment/design change.** Mark center, open convergence interval and separately tested endpoints. Keep partial polynomials distinct from the infinite sum.

**Completion check.** Find a radius and then independently classify both endpoints with an appropriate series test.

#### MH1101 27 — Differentiate and integrate a series

**Source record:** `[S1] power-series-operations`

**Assessment.** The smaller-interval uniform-control idea is good. The unchanged geometric-series experiment does not show how differentiation/integration alters coefficients or endpoint behavior.

**Improve or add.** Derive the transformed series explicitly, state the same-radius theorem, and compare endpoint tests before/after an operation. Explain which interchange theorem is being used.

**Experiment/design change.** Show original, differentiated and integrated partial sums with linked coefficients and independently labeled endpoint statuses.

**Completion check.** Generate a new representation and justify its domain without assuming endpoint behavior is preserved.

#### MH1101 28 — Taylor polynomials and remainder

**Source record:** `[S1] taylor-series`

**Assessment.** The distinction between smoothness and equality to a Taylor series is already present; preserve it. One exponential example is insufficient practice in constructing coefficients and certifying accuracy.

**Improve or add.** Derive coefficients, work a nonzero center, solve for the degree required by a tolerance, and develop a flat smooth/nonanalytic counterexample in an optional rigorous panel.

**Experiment/design change.** Link derivatives at the center, partial polynomials, the actual function and a proven remainder envelope; do not imply universal improvement at every x.

**Completion check.** Separate a finite approximation guarantee from proof that an infinite Taylor series represents the function.

#### MH1101 29 — The general binomial series

**Source record:** `[S1] binomial-series`

**Assessment.** The generalized coefficients and terminating-integer distinction are good. The square-root approximation needs normalization and error reasoning to become a reusable method.

**Improve or add.** Work sqrt(4+x) or another rescaled expression, derive coefficients systematically and explain the valid interval and any endpoint analysis. Provide a finite error estimate for the numerical example.

**Experiment/design change.** Display the normalization step, center and interval before allowing higher-degree comparisons.

**Completion check.** Convert an expression into binomial-series form and state where its approximation is justified.

#### MH1101 30 — Extract a limit from a series

**Source record:** `[S1] limits-with-series`

**Assessment.** The leading-term reasoning and sufficient remainder order are sound. Big-O notation needs a prerequisite explanation and more varied order-selection problems.

**Improve or add.** Add a short O/o guide, nested substitutions and cancellations requiring more terms. Explicitly distinguish a convergent power-series identity from a finite asymptotic expansion.

**Experiment/design change.** Let the learner choose truncation order and show whether the remainder is small enough after division.

**Completion check.** Justify a series-based limit by controlling the normalized remainder, not only by canceling formal terms.

### MH2100: Calculus III / multivariable calculus — 71 explorations

#### MH2100 01 — Vectors in space

**Source record:** `[S1] vectors-and-coordinates`

**Assessment.** The point/free-vector distinction, vector identities and geometric dot-product explanation are strong. Coordinates, norm, basis, angle and orthogonality still arrive in a dense cluster.

**Improve or add.** Add worked nonunit-vector calculations, projections and Cauchy–Schwarz before using them downstream. Distinguish zero-vector algebraic orthogonality from an angle between nonzero vectors.

**Experiment/design change.** Pair coordinate calculations with vector addition/projection and a length scale; allow magnitudes as well as angle to change.

**Completion check.** Translate between a geometric displacement and coordinates, compute a projection and justify an angle calculation.

#### MH2100 02 — A curve and its clock

**Source record:** `[S1] curves-and-parametrizations`

**Assessment.** The distinction between image, traversal and singular clock is unusually good. The onto-map and Peano-curve remarks need pacing so they clarify rather than obscure first exposure.

**Improve or add.** Separate arbitrary reparametrizations from regular monotone changes of parameter. Work the same path with different speeds, reversed orientation and repeated traversal; move space-filling curves into supported enrichment.

**Experiment/design change.** Synchronize two traversals of the same curve with independently controlled clocks and a shared point correspondence.

**Completion check.** Explain which changes preserve the image, orientation, regularity and multiplicity, and which do not.

#### MH2100 03 — Build a parametrization

**Source record:** `[S1] constructing-curves`

**Assessment.** The cycloid derivation and two-way parameter elimination are valuable. Several other curve families are listed too quickly for learners to build parametrizations themselves.

**Improve or add.** Provide one construction per family, emphasizing the parameter interval. Add a non-affine line parametrization and a task where elimination introduces extra points unless the range is checked.

**Experiment/design change.** Retain the available family selector and make each family reveal its generating geometry, especially the rolling circle for the cycloid.

**Completion check.** Construct a parametrization from a geometric description and verify its exact image in both directions.

#### MH2100 04 — Tangents, velocity and singularities

**Source record:** `[S1] tangents-velocity-and-singularities`

**Assessment.** The cusp versus zero-velocity distinction is mathematically careful. A helix example does not visually establish all claims about self-intersections, singularities and one-sided tangents.

**Improve or add.** Develop vector difference quotients, tangent lines, speed and acceleration separately. Add a regular line with a singular clock, a cusp, a crossing with two visits and a one-sided endpoint.

**Experiment/design change.** Make the secant vector approach a tangent and distinguish velocity magnitude from geometric tangent direction. Use the actual contrasting curves.

**Completion check.** Decide whether a vanishing velocity reflects a coordinate failure or a geometric singularity, with a justified tangent analysis.

#### MH2100 05 — Surfaces and level sets

**Source record:** `[S1] surfaces-and-level-sets`

**Assessment.** The graph-versus-domain-level-set distinction and domain examples are correct. The present paraboloid is too special to establish intuition about arbitrary contours and nongraph surfaces.

**Improve or add.** Add saddle, disconnected-level-set, empty-level-set and critical-level examples, plus explicit domain inequalities. Explain what topographic contour spacing measures locally.

**Experiment/design change.** Couple the 3D graph to a true 2D contour plot and horizontal slice, with the selected c synchronized across all three.

**Completion check.** Recover a level-set equation and distinguish its position in the input plane from the lifted graph intersection.

#### MH2100 06 — Distance and neighborhoods

**Source record:** `[S1] distance-and-neighborhoods`

**Assessment.** The metric axioms and ambient-space caveat are good. Open/closed/limit/isolated/boundary ideas need concrete contrasts rather than a single moving disk probe.

**Improve or add.** Add a small notation/logic lesson and examples that are open only, closed only, neither and both. Distinguish closure, boundary, interior and accumulation points; state any completeness facts needed later.

**Experiment/design change.** Let the learner choose a point and radius and classify the relevant neighborhood condition on different sets.

**Completion check.** Explain why membership alone does not imply being a limit point and prove an open/closed classification.

#### MH2100 07 — The ε–δ limit

**Source record:** `[S1] epsilon-delta-limits`

**Assessment.** The full quantifier statement and radial proof are strong. The automatically selected radius does not teach construction, and the vector example introduces substantial unrelated single-variable calculations.

**Improve or add.** Build from a scalar radial bound to vector component bounds, proving uniqueness and explaining permitted-domain limit points. Add a full learner-produced δ argument and its negation.

**Experiment/design change.** Use independent ε, proposed δ and input controls, with an algebraic certificate covering all points in the disk rather than only sampled directions.

**Completion check.** Prove a multivariable limit using an explicit uniform neighborhood estimate.

#### MH2100 08 — Why a limit does not exist

**Source record:** `[S1] different-paths-different-limits`

**Assessment.** The axes-versus-diagonal example is correct and well chosen. It should be tied more explicitly to the restriction theorem and to the asymmetry between proving and disproving existence.

**Improve or add.** State and derive the restriction lemma. Add a restriction with oscillation and clarify when paths lie in the permitted domain and really approach the target.

**Experiment/design change.** Display two simultaneous approach paths, their lifted values and the same shrinking radius. Preserve the domain hole.

**Completion check.** Disprove a limit using valid paths while explaining why agreement on chosen paths would not prove it.

#### MH2100 09 — All lines can be misleading

**Source record:** `[S1] curved-paths-hide-obstructions`

**Assessment.** This is one of the strongest conceptual examples: all line limits agree while parabolic paths disagree. Its denominator-balancing strategy should become an explicit problem-solving method.

**Improve or add.** Derive the choice y=kx² from the competing denominator scales. Explain why fixed-angle polar limits are still line tests and what uniformity in angle would require.

**Experiment/design change.** Compare fixed lines with the whole parabolic family and a radius-dependent angle. Display the persistent discrepancy rather than only a decorative surface.

**Completion check.** Discover a curved obstruction for a new rational expression and explain why every-line testing was insufficient.

#### MH2100 10 — Squeeze, extend, compose

**Source record:** `[S1] squeeze-and-continuity`

**Assessment.** The radial bounds and isolated-point caveat are correct. Several algebraic limit laws, continuity operations and extension ideas are compressed into one card.

**Improve or add.** Work one complete ε–δ proof from the bound, then separately develop extension, quotient-domain conditions, componentwise continuity and composition.

**Experiment/design change.** Show the bound as an enclosing error envelope for every angle and let the learner choose the extension value at the missing point.

**Completion check.** Find a useful radial estimate and determine the unique continuous extension when one exists.

#### MH2100 11 — Infinity means every escape route

**Source record:** `[S1] limits-at-infinity`

**Assessment.** The distinction between norm-infinity and iterated positive-coordinate limits is valuable. Learners need an explicit comparison of the different domains and quantifiers.

**Improve or add.** State the all-outside-a-ball definition, contrast it with limits in a quadrant, and add escape paths with changing direction. Work the reciprocal-radius estimate completely.

**Experiment/design change.** Couple an expanding excluded ball to a bound on all remaining values, rather than showing only one escaping point.

**Completion check.** Prove a norm-infinity limit or refute it with a permitted escape path.

#### MH2100 12 — Partial derivatives are slice slopes

**Source record:** `[S1] partial-derivatives-as-slices`

**Assessment.** The use of the actual piecewise definition at the origin is excellent. The fixed-x paraboloid demo underserves two independent partial derivatives and derivative-domain questions.

**Improve or add.** Work both coordinate difference quotients, a piecewise junction and a partial-derivative domain. Distinguish the two lifted tangent vectors from a justified tangent plane.

**Experiment/design change.** Allow both slice coordinates to vary and compare axis restrictions with a nearby non-axis path.

**Completion check.** Compute partials at a junction directly and explain why their existence does not prove continuity or differentiability.

#### MH2100 13 — Cross products build normal vectors

**Source record:** `[S1] cross-products-and-planes`

**Assessment.** The coordinate formula, nonparallel requirement and nonassociativity example are sound. Determinant area, orientation and the equivalence of plane descriptions deserve slower development.

**Improve or add.** Derive the area magnitude and right-hand sign, then convert between normal, point-direction and Cartesian plane equations. Link the scalar triple product needed later.

**Experiment/design change.** Reverse vector order and show the normal sign changing while the plane and unsigned area stay fixed.

**Completion check.** Build a plane from two independent directions and verify its normal by two dot products.

#### MH2100 14 — What total differentiability means

**Source record:** `[S1] total-differentiability`

**Assessment.** The affine-versus-linear distinction, uniqueness argument and normalized quadratic remainder are strong. The derivative as a linear map and little-o notation still need an explicit prerequisite bridge.

**Improve or add.** Introduce the typed map Df(p), the affine approximation and o(‖h‖) in plain mathematical language. Expand the quadratic example into a complete quantified proof.

**Experiment/design change.** Couple graph/plane comparison to raw residual and residual divided by distance across all directions. Do not rely only on surfaces looking close.

**Completion check.** Identify the only possible derivative and prove a uniform normalized-remainder estimate.

#### MH2100 15 — All directional derivatives can exist—and still fail

**Source record:** `[S1] partials-do-not-make-a-plane`

**Assessment.** This lesson correctly refutes a major misconception with x³/(x²+y²), including a nonzero normalized diagonal remainder. It should be a central checkpoint, not an easily skipped subtlety.

**Improve or add.** Organize an implication diagram for continuity, partials, directional derivatives and total differentiability. Explain both failures: nonlinear directional response and lack of a uniform remainder.

**Experiment/design change.** Keep actual directional response and candidate-plane response visible together, with an exact counterexample direction.

**Completion check.** Explain why all directional derivatives existing does not supply a single linear derivative map.

#### MH2100 16 — Certify the approximation

**Source record:** `[S1] certifying-differentiability-and-errors`

**Assessment.** The neighborhood hypothesis is carefully stated, and the cone-volume example explicitly distinguishes an estimate from a rigorous bound. The proof's two increments need to be expanded.

**Improve or add.** Write the horizontal/vertical increment decomposition line by line and justify the intermediate-point limits. Develop a genuine finite remainder bound for the measurement-error example.

**Experiment/design change.** Pair first-order error estimates with actual error and a certified envelope, so 'approximately' cannot be mistaken for 'at most.'

**Completion check.** Prove differentiability by a sufficient criterion and separately certify a requested numerical error bound.

#### MH2100 17 — The chain rule as a composition of motions

**Source record:** `[S1] multivariable-chain-rule`

**Assessment.** The derivative-matrix formulation is correct, but matrices and their dimensions arrive before a dedicated derivative-matrix foundation. A path of constant height makes all contributions cancel and is too special alone.

**Improve or add.** Introduce Jacobian matrices as linear maps before using their product. Work a nonconstant-height path and a multi-input dependency tree, including evaluation at the intermediate point.

**Experiment/design change.** Display each contribution to the total derivative separately before summing; link paths in the dependency tree to matrix entries.

**Completion check.** Multiply correctly shaped derivatives and explain every evaluation point in a multistage composition.

#### MH2100 18 — Implicit surfaces become local graphs

**Source record:** `[S1] implicit-functions-and-tangents`

**Assessment.** The theorem's regularity conditions are clear, and the text honestly says existence is not proved here. Learners still need to see why a coordinate choice can fail without the surface failing.

**Improve or add.** Work the sphere near a pole and equator, switching the solved-for coordinate when necessary. Separate theorem-supplied existence from chain-rule derivation of the partial formulas.

**Experiment/design change.** Show which projection is locally one-to-one and mark F_z=0 independently of ∇F=0.

**Completion check.** Choose a valid local graph coordinate and distinguish projection failure from a singular level set.

#### MH2100 19 — Direction changes the slope

**Source record:** `[S1] directional-derivatives-and-gradient`

**Assessment.** The distinction between a defining directional limit and the gradient formula is correctly made. Normalization should become an active decision rather than a warning.

**Improve or add.** Work a nonunit direction fully, state units per distance versus per parameter and reconnect to the nondifferentiable counterexample.

**Experiment/design change.** Display the direction vector's norm and compare normalized and unnormalized rates. Provide a link to the failure of the gradient shortcut.

**Completion check.** Compute a directional derivative by a justified method and explain when normalization is required.

#### MH2100 20 — The gradient points uphill and across contours

**Source record:** `[S1] gradient-normals-and-steepest-ascent`

**Assessment.** The nonzero-gradient and regular-level-set conditions are good. Cauchy–Schwarz, the equality condition and input-space versus graph-space arrows need explicit support.

**Improve or add.** Prove the maximization over unit directions, handle ∇f=0 separately and derive orthogonality along level curves. Distinguish the gradient in the domain from the graph's normal in three dimensions.

**Experiment/design change.** Link a 2D contour map and gradient arrow to the 3D graph; label the lifted tangent direction separately from the surface normal.

**Completion check.** Identify steepest first-order increase and explain why it is neither a guaranteed global optimization path nor the graph's normal vector.

#### MH2100 21 — Stationary does not mean optimal

**Source record:** `[S1] local-extrema-and-saddles`

**Assessment.** The parameter family and broader course convention for critical points are explained well. Learners need a precise distinction between strict and non-strict extrema and between stationary and nondifferentiable candidates.

**Improve or add.** Give explicit definitions relative to the domain, include a boundary extremum and a nondifferentiable minimum, and tie each classification to inequalities rather than appearance.

**Experiment/design change.** Show directional slices and their signs as the quadratic parameter crosses zero, including the entire line of non-strict minima.

**Completion check.** Classify a candidate using its definition and identify points omitted by solving only ∇f=0.

#### MH2100 22 — Second derivatives and changing slopes

**Source record:** `[S1] mixed-and-higher-partials`

**Assessment.** The derivative-order convention and Clairaut hypothesis are commendably explicit. The rectangular-increment proof is too compressed and no failed-regularity example is developed.

**Improve or add.** Expand the double mean-value argument, work higher mixed notation, and add a standard example with unequal mixed partials at a point.

**Experiment/design change.** Visualize the rectangular increment as four signed function values, with the two differentiation orders tracked separately.

**Completion check.** Compute mixed partials using the stated convention and know when exchanging order is justified.

#### MH2100 23 — Classify the second-order shape

**Source record:** `[S1] hessian-classification`

**Assessment.** This is mathematically rich: degenerate examples, nonisolated critical sets and local/global distinctions are already present. The gap is scaffolding quadratic forms, eigenvalues and domination of the remainder.

**Improve or add.** Explain definiteness and principal directions before the determinant shortcut. Work a rotated quadratic with a nonzero mixed term and develop the degenerate comparison examples.

**Experiment/design change.** Rotate into principal directions and connect the quadratic form's sign to the exact function near the point.

**Completion check.** Classify a stationary point with hypotheses checked and use another argument when the Hessian test is inconclusive.

#### MH2100 24 — Global extrema require the boundary

**Source record:** `[S1] global-extrema-and-boundaries`

**Assessment.** The rectangular example correctly examines all edges and the interior. It is dense enough that a learner can miss the bookkeeping and the role of existence.

**Improve or add.** Turn the computation into a full candidate table, including corners, edge critical points and the interior point. Develop compactness versus noncompact inequalities as separate cases.

**Experiment/design change.** Color each boundary restriction and link its candidates to the table; distinguish guaranteed attainment from a numerical search result.

**Completion check.** Produce an exhaustive candidate comparison and separately justify that a global extremum exists.

#### MH2100 25 — Lagrange multipliers on a curve

**Source record:** `[S1] lagrange-circle`

**Assessment.** The feasible-tangent argument and warning about dividing away candidates are good. The example is too symmetric to teach robust equation solving by itself.

**Improve or add.** Work all multiplier equations explicitly, then add a case with a zero coordinate and a singular constraint point requiring separate examination.

**Experiment/design change.** Show feasible tangent, objective gradient and constraint gradient together; use candidate markers with a value comparison.

**Completion check.** Find and compare every admissible candidate without assuming the multiplier equations alone prove a maximum.

#### MH2100 26 — One constraint in three dimensions

**Source record:** `[S1] lagrange-sphere`

**Assessment.** The global Cauchy–Schwarz certificate is excellent. The open-top-box AM–GM argument is substantive instruction buried in a pitfall paragraph.

**Improve or add.** Promote the box into a full worked application and explain the difference between a compact feasible set and a separate global inequality on a noncompact one.

**Experiment/design change.** Keep the sphere as a spatial constraint rather than implying a 3-variable objective graph fits in 3D; show objective values by labels or a scalar scale.

**Completion check.** Solve a three-variable constraint problem and provide an independent argument that the candidate is globally optimal.

#### MH2100 27 — Two constraints and one tangent direction

**Source record:** `[S1] lagrange-two-constraints`

**Assessment.** The independence condition and counterexample with equal constraint gradients are mathematically strong. The row-space/kernel proof needs a linear-algebra bridge.

**Improve or add.** Explain rank, kernel and normal span geometrically before the compact proof. Work the full system and a dependent-gradient failure separately.

**Experiment/design change.** Display both normals, their cross product and the objective gradient's tangential component; show what happens when rank drops.

**Completion check.** Verify independence and explain why two nonzero normals are not enough.

#### MH2100 28 — A double integral from columns

**Source record:** `[S1] double-riemann-sums`

**Assessment.** Sampling independence and the exact midpoint error are well explained. Uniform continuity is doing important work without a developed prerequisite theorem.

**Improve or add.** State and explain continuous-on-compact⇒uniformly-continuous, then expand the oscillation bound. Use nonuniform cells, independent subdivisions and signed integrands as well as the positive example.

**Experiment/design change.** Let sample locations vary, compare upper/lower columns and display the error certificate separately from the finite visualization.

**Completion check.** Explain why every sufficiently fine sampling has the same limit, not merely why midpoint sums converge.

#### MH2100 29 — Integrating a bounded region

**Source record:** `[S1] general-double-integrals`

**Assessment.** The zero-extension construction and Jordan/Lebesgue distinction are sophisticated and largely careful. They introduce more foundational machinery than the learning path currently supports.

**Improve or add.** Define Jordan area and zero-area boundaries with explicit coverings. Separate the course's elementary sufficient condition from the more general Lebesgue discontinuity criterion, with a supported enrichment route.

**Experiment/design change.** Link the region, its zero extension on a rectangle and a density/units interpretation; use an irregular boundary to explain why geometry matters.

**Completion check.** State the integration framework and justify area/mass/probability calculations without conflating Jordan and Lebesgue notions.

#### MH2100 30 — Fubini: accumulate one direction at a time

**Source record:** `[S1] fubini-double`

**Assessment.** The finite-sum regrouping idea is good, but the symmetric example makes both orders equally easy and conceals why order choice matters.

**Improve or add.** Add an asymmetric integrand where one order simplifies the problem. State separately the continuous-rectangle theorem and any broader version needed for zero extensions.

**Experiment/design change.** Show an actual slice integral as a function of the remaining coordinate, not only columns viewed from different camera angles.

**Completion check.** Derive and evaluate both orders for one example and justify the theorem used.

#### MH2100 31 — Type I and Type II regions

**Source record:** `[S1] type-one-two-regions`

**Assessment.** The region definitions, bound-dependence warning and triangle calculation are good. The example requires no piecewise decomposition and makes reversal unusually easy.

**Improve or add.** Work a curved region requiring a split in one order, including its projection and intersection calculations. Make explicit the Riemann-Fubini version used after zero extension, since that extension is generally discontinuous on the boundary.

**Experiment/design change.** Link vertical/horizontal slices to editable bounds and shade the set those bounds actually describe.

**Completion check.** Reverse integration order by reconstructing the same region, including all required pieces.

#### MH2100 32 — Linearity and cutting a region

**Source record:** `[S1] linearity-additivity`

**Assessment.** The distinction between algebraic linearity and geometric additivity is clear, with a useful overlap warning. It needs practice on a less trivial decomposition.

**Improve or add.** Add inclusion–exclusion for positive-area overlap, a sign-changing integrand and a region that becomes simple only after splitting. Explain indicator notation before using it in the proof.

**Experiment/design change.** Let the learner draw or choose a cut and show counted-once, omitted and double-counted areas.

**Completion check.** Decompose a region without altering its integral and explain why shared edges contribute zero in this setting.

#### MH2100 33 — Polar coordinates and the area factor

**Source record:** `[S1] polar-rectangles`

**Assessment.** The exact annular-cell derivation is a strong foundation. The learner should see the parameter rectangle as well as its physical image and understand angular nonuniqueness.

**Improve or add.** Work coordinate conversion with quadrants and derive the factor from both exact cells and the derivative matrix. Explain seams, r=0 and one-turn coverage.

**Experiment/design change.** Show equal parameter cells at different radii side by side with their image cells and measured area ratios.

**Completion check.** Derive dA=r dr dθ rather than insert it from memory, and choose bounds that avoid repeated positive-area coverage.

#### MH2100 34 — Variable polar bounds

**Source record:** `[S1] polar-regions`

**Assessment.** The text explicitly admits that the scene still displays a centered constant-radius sector. This is a central concept–experiment mismatch: the distinctive variable boundary is left to paper.

**Improve or add.** Develop the shifted disk completely, then a region with inner/outer radial bounds or multiple radial intervals. Explain how the angle interval follows from nonnegative radii.

**Experiment/design change.** Render the actual shifted disk and a moving ray with endpoints r=h₁(θ), h₂(θ). Keep its parameter-domain region visible.

**Completion check.** Derive variable polar bounds from a Cartesian inequality and verify exact coverage.

#### MH2100 35 — A triple integral accumulates through space

**Source record:** `[S1] triple-riemann-sums`

**Assessment.** The distinction between a solid domain and a hypothetical 4D graph is important and correctly made. A horizontal slice alone does not show the three-dimensional sum definition.

**Improve or add.** Add a density example with units and a voxel-sum construction before the slicing shortcut. State the compactness/uniform-continuity ingredients of convergence explicitly.

**Experiment/design change.** Alternate between cells, the solid boundary and cross-sections; distinguish volume from mass when density changes.

**Completion check.** Explain what is being summed and why integrating 1 is different from integrating a nonconstant density.

#### MH2100 36 — Type I, II and III solids

**Source record:** `[S1] simple-solid-bounds`

**Assessment.** All three descriptions are available, with careful projection hypotheses. The text should become a stepwise exercise in deriving nested bounds instead of a finished list to memorize.

**Improve or add.** Work the complete projection/fiber process in two orders, then include a solid with disconnected fibers that must be split. Explain the course-specific naming convention.

**Experiment/design change.** Show the chosen projection plane, one fiber and its two endpoints simultaneously; preview the region implied by proposed bounds.

**Completion check.** Reconstruct valid triple-integral bounds in a new order and verify that all radicals remain real throughout the outer domain.

#### MH2100 37 — Cylindrical coordinates

**Source record:** `[S1] cylindrical-coordinates`

**Assessment.** The radius-to-axis distinction and atan2/quadrant warning are good. The fixed cylinder/wedge does not fully teach coordinate surfaces and conversion.

**Improve or add.** Add conversions in all quadrants, the axis singularity, constant-coordinate surfaces, a cone and an off-axis point.

**Experiment/design change.** Let radius, azimuth and height vary independently with Cartesian and cylindrical coordinates displayed together.

**Completion check.** Translate between coordinate systems and recognize which geometric constraints cylindrical coordinates simplify.

#### MH2100 38 — Cylindrical volume elements

**Source record:** `[S1] cylindrical-integration`

**Assessment.** The derivation from vertical fibers plus polar area is coherent. The radial-density example correctly distinguishes the density factor from the Jacobian factor.

**Improve or add.** Work a paraboloid-bounded solid or other nonconstant height example, deriving all bounds and checking a second method. Keep density, geometry and measure factors separately labeled.

**Experiment/design change.** Show an actual small wedge and its three edge lengths, with a density control that leaves the solid unchanged.

**Completion check.** Transform the domain, density and volume element independently and explain every factor of r.

#### MH2100 39 — Spherical coordinates

**Source record:** `[S1] spherical-coordinates`

**Assessment.** Coordinate conventions and pole/origin nonuniqueness are carefully stated. A moving cap boundary does not give learners full control of a point's three coordinates.

**Improve or add.** Add Cartesian↔spherical conversions and a table of constant-coordinate surfaces, including the equatorial special case. Explain the difference between a spherical surface cap and a solid sector.

**Experiment/design change.** Provide independent ρ, θ and φ controls with a visible right-triangle decomposition and convention labels.

**Completion check.** Convert a point and a surface equation while using the stated inclination/azimuth convention consistently.

#### MH2100 40 — Spherical wedges and radial bounds

**Source record:** `[S1] spherical-integration`

**Assessment.** The volume factor and sector-versus-cap warning are good. The proof invokes change of variables before the general theorem is taught; this dependency should be explicit.

**Improve or add.** Label the geometric derivation as motivation and link the later theorem, or reorder the proof. Work an off-center sphere or plane-cut cap with genuinely variable radial bounds.

**Experiment/design change.** Show the radial interval for each direction and compare a sector reaching the origin with a cap that does not.

**Completion check.** Derive all three spherical bounds and distinguish ρ²sinφ as measure distortion from any density factor.

#### MH2100 41 — A determinant scales area

**Source record:** `[S1] linear-area-change`

**Assessment.** The interpolated determinant 1+2s is correctly distinguished from its final value 3. This is a useful anchor for local area change, but orientation reversal and collapse are only described.

**Improve or add.** Add determinant-zero and negative-determinant maps, derive parallelogram area and make the input/output coordinate order explicit.

**Experiment/design change.** Show the images of the basis vectors, area ratio and orientation throughout the deformation, including a reflection and a rank drop.

**Completion check.** Predict signed determinant and unsigned area scaling before calculating them.

#### MH2100 42 — The Jacobian is a local determinant

**Source record:** `[S1] plane-jacobian`

**Assessment.** The matrix/determinant distinction and local-versus-global injectivity caveat are correct. The actual experiment is linear, so it cannot demonstrate spatially varying local distortion.

**Improve or add.** Work a nonlinear map in full: derivative matrix at a point, determinant field and shrinking-cell limit. Contrast local invertibility with a map that overlaps globally.

**Experiment/design change.** Use T(u,v)=(u,(1+u)v) on 0≤u,v≤1 as a first nonlinear lab; compare equal cells at different u and then shrink one cell.

**Completion check.** Compute a local area factor and explain why a nonzero Jacobian does not imply global one-to-one behavior.

#### MH2100 43 — Space transformations and signed Jacobians

**Source record:** `[S1] space-jacobians`

**Assessment.** The negative spherical determinant for the order (ρ,θ,φ) is correctly handled—a detail many elementary treatments blur. The scalar triple-product and orientation argument needs a more direct visual derivation.

**Improve or add.** Expand the determinant calculation and compare two column orders, a reflection and a rank-deficient map. Keep signed volume and ordinary volume distinct.

**Experiment/design change.** Display the three derivative columns and their parallelepiped, with a coordinate-order switch that flips determinant sign without changing volume.

**Completion check.** Determine the sign from ordered derivative vectors and use the absolute value in ordinary triple integration.

#### MH2100 44 — Change of variables in two and three dimensions

**Source record:** `[S1] change-of-variables`

**Assessment.** The clean diffeomorphism theorem and multiplicity caveat are good. One linear parallelogram example does not prepare learners to choose a nonlinear substitution themselves.

**Improve or add.** Add a full nonlinear boundary-straightening example, verify injectivity and regularity, and explain the permitted seam exceptions in standard coordinates. Label the proof as a sketch unless the approximation estimates are supplied.

**Experiment/design change.** Synchronize parameter region, transformed region, integrand composition and local scale factor. Keep all three transformations visible.

**Completion check.** Derive a substitution from the boundary equations and verify domain, integrand and measure changes separately.

#### MH2100 45 — When the substitution is given backwards

**Source record:** `[S1] inverse-jacobian`

**Assessment.** The corresponding-point identity is careful and correct. A constant inverse determinant makes the evaluation-point issue almost invisible.

**Improve or add.** Add a nonconstant example in which the reciprocal is evaluated at corresponding points, and connect it explicitly to the inverse function theorem and chain rule.

**Experiment/design change.** Highlight a paired source/image point and its two reciprocal area factors; permit switching the direction of the map.

**Completion check.** Use a substitution given as u(x,y),v(x,y) without accidentally multiplying by the wrong determinant.

#### MH2100 46 — A scalar field along a curve

**Source record:** `[S1] scalar-line-integrals`

**Assessment.** The ribbon interpretation and reparametrization invariance are good. Arc length and rectifiability need a more developed prerequisite than the short speed-factor derivation supplies.

**Improve or add.** Add a dedicated arc-length bridge and a non-unit-speed example. Distinguish the image curve from repeated traversal and explain the meaning of linear density and units.

**Experiment/design change.** Compare two clocks on the same curve, showing how speed and dt compensate; use a density that varies independently of the geometry.

**Completion check.** Compute ∫f ds with a non-unit-speed parametrization and explain why reversing orientation does not change it.

#### MH2100 47 — Vector fields assign a direction at every point

**Source record:** `[S1] vector-fields`

**Assessment.** The distinction between field arrows and trajectories is excellent. The shared rotation field is too special to teach general local behavior or magnitude encoding.

**Improve or add.** Add constant, shear, source/sink and singular fields. State whether arrow lengths are normalized, compressed or physically proportional, and separate field value from derivatives of the field.

**Experiment/design change.** Provide a magnitude legend and exact vector readout at a selected point. Do not make a streamline or particle interpretation implicit.

**Completion check.** Evaluate a field and explain what its arrows do and do not say about a particle's motion.

#### MH2100 48 — Work and orientation along a curve

**Source record:** `[S1] vector-line-integrals`

**Assessment.** The signed dot-product derivation is correct. F exactly equal to the unit tangent makes the example unusually easy and hides negative and transverse contributions.

**Improve or add.** Work a path where the dot product changes sign and a non-unit-speed parametrization, then compare a reversed and a repeated traversal.

**Experiment/design change.** Add an actual reverse-orientation control and plot local F·r′ alongside accumulated work.

**Completion check.** Compute the signed integral and explain why force magnitude times path length is generally wrong.

#### MH2100 49 — Three differentials, one path

**Source record:** `[S1] coordinate-line-integrals`

**Assessment.** The course-specific meanings of first/second/third kinds and the ds distinction are explicitly clarified. The circle example should be expanded into a complete translation between notations.

**Improve or add.** Work P dx+Q dy+R dz on a nonplanar path, deriving each differential and its sign. Explain the differential expression's dependence on orientation and parametrization.

**Experiment/design change.** Show signed coordinate displacements and the three scalar contributions separately before summing them.

**Completion check.** Convert a coordinate line integral to a parameter integral without replacing dx,dy,dz by ds.

#### MH2100 50 — Assemble a path from pieces

**Source record:** `[S1] piecewise-paths`

**Assessment.** Additivity and the special role of conservativeness are carefully distinguished. The scene is a parabola while the broken-path comparison is described algebraically.

**Improve or add.** Work each segment of an actual polygonal path, including its own parameter interval and orientation. Add a nonconservative comparison so equal endpoints are not mistaken for general equality.

**Experiment/design change.** Render and select each path piece, show its contribution and then the total; include a reversed piece as an error to diagnose.

**Completion check.** Parametrize and integrate a composite path with correct junctions and inherited orientation.

#### MH2100 51 — Work is tangential accumulation

**Source record:** `[S1] work-and-circulation`

**Assessment.** This substantially repeats the earlier vector-line-integral example. The repetition should create new modeling skill rather than another unit-circle animation.

**Improve or add.** Refocus on physical work, units, variable force and tangential/normal decomposition. Include a nonclosed trajectory and contrast work with arc length and total force magnitude.

**Experiment/design change.** Show positive, zero and negative local work on the same path and a running signed integral.

**Completion check.** Translate a force-and-motion situation into a line integral and interpret the sign and units of its result.

#### MH2100 52 — A potential remembers only endpoints

**Source record:** `[S1] fundamental-line-theorem`

**Assessment.** The theorem's hypotheses and mechanics sign convention are particularly good. The chain-rule proof deserves a complete worked construction of a potential, not only use of one already supplied.

**Improve or add.** Add potential recovery with coordinate-dependent integration constants, path independence and a direct calculation along two different paths. Preserve the point that simple connectedness is not required once a global potential is given.

**Experiment/design change.** Let users deform a path with fixed endpoints and compare direct work with the potential difference.

**Completion check.** Find or verify a potential and justify an endpoint calculation on the entire path domain.

#### MH2100 53 — When does zero curl suffice?

**Source record:** `[S1] conservative-domains`

**Assessment.** The punctured-plane counterexample, loop condition and warning about Green's theorem are strong. Local potentials becoming a global potential is a substantial topological step needing support.

**Improve or add.** Develop the potential/path-independence/zero-loop equivalences and give a guided potential-construction problem. Explain simple connectedness with loops, including why 'no holes' is imprecise in 3D.

**Experiment/design change.** Retain the potential/vortex variants and visualize the excluded set, a contractible loop and a loop that cannot contract within the domain.

**Completion check.** Check the domain before using zero curl and explain the vortex's nonzero circulation without contradicting Green's theorem.

#### MH2100 54 — Green’s Theorem

**Source record:** `[S1] greens-theorem`

**Assessment.** The full-region smoothness and hole-orientation requirements are good. A disk circulation alone does not demonstrate cancellation of internal boundaries.

**Improve or add.** Derive the rectangle case fully and state the extension argument's status. Work a multiply connected region and a failed interior-smoothness case.

**Experiment/design change.** Add a tiled-region cancellation view, then expose only the surviving outer and inner boundaries with their correct arrows.

**Completion check.** Apply Green with the actual region, all boundary components and the correct orientation.

#### MH2100 55 — Measure area from the boundary

**Source record:** `[S1] area-from-boundary`

**Assessment.** The three differential forms and ellipse calculation are useful. Self-intersection, signed multiplicity and the planimeter are mentioned but not taught as separate ideas.

**Improve or add.** Work a polygon to derive the shoelace connection, develop orientation reversal and place self-intersecting curves in a supported signed-area extension.

**Experiment/design change.** Trace a polygon or ellipse while accumulating x dy−y dx; make an orientation reversal change the sign, not the geometric region.

**Completion check.** Derive ordinary area from a valid positively oriented boundary and recognize when the integral instead measures signed multiplicity.

#### MH2100 56 — A surface is a two-parameter image

**Source record:** `[S1] surface-charts`

**Assessment.** Seam versus geometric-edge and coordinate failure versus surface failure are handled well. Homeomorphism, chart interiors and boundary identifications need a preparatory explanation.

**Improve or add.** Build from a graph patch to a sphere chart and then overlapping charts. Explain the course's parametrization convention without suggesting that one regular rectangular chart covers the whole sphere.

**Experiment/design change.** Show the parameter domain and image side by side, with linked coordinate curves, seam identifications and a second chart at a pole.

**Completion check.** Distinguish a chart boundary from a genuine surface boundary and describe where a chosen chart is valid.

#### MH2100 57 — Two tangents determine a normal

**Source record:** `[S1] surface-tangent-vectors`

**Assessment.** The rank-two criterion and sphere-pole caveat are good. Using the sphere for every example hides nonorthogonal parameter tangents and genuine singularities.

**Improve or add.** Add a sheared graph parametrization and compare a sphere's coordinate pole with a cone tip. Explain the derivative matrix's rank and tangent-plane equation.

**Experiment/design change.** Display both parameter tangent vectors and their cross product, then switch charts without changing the geometric point.

**Completion check.** Decide whether a zero cross product indicates a bad chart or a geometric problem, with an appropriate replacement chart where possible.

#### MH2100 58 — A tiny rectangle becomes a parallelogram

**Source record:** `[S1] surface-area-element`

**Assessment.** The cross-product factor and sphere area are sound. Orthogonal spherical coordinates make the sine-of-angle factor too easy to overlook.

**Improve or add.** Work a nonorthogonal parametrization, derive its Gram/cross-product area factor and address one-to-one coverage and patch addition explicitly. Label any convergence argument that remains a sketch.

**Experiment/design change.** Link an actual parameter cell, tangent parallelogram and surface patch as cell size shrinks; display their area ratios.

**Completion check.** Derive dS for a new parametrization and explain why multiplying tangent lengths alone can fail.

#### MH2100 59 — Integrate a density over a surface

**Source record:** `[S1] scalar-surface-integrals`

**Assessment.** The sphere z² integral and graph formula are substantial content. The task asks for a separate paraboloid not represented by the sphere scene.

**Improve or add.** Work the graph-surface derivation completely and add a nonconstant-density example with units. Explain reparametrization invariance and multiple coverage through concrete calculations.

**Experiment/design change.** Provide the actual graph example as a selectable scene and distinguish density coloring from geometric height coloring.

**Completion check.** Compute a scalar surface integral and explain its independence from orientation but dependence on coverage multiplicity.

#### MH2100 60 — Choose a continuous side

**Source record:** `[S1] surface-orientation`

**Assessment.** Local versus global orientation and outward versus upward are well explained. A Möbius variant exists; it should be integrated with the textual argument rather than treated as decorative enrichment.

**Improve or add.** Guide the transport of a normal around the Möbius seam and explain why the returned sign obstructs a global choice. Include cavity normals and connected versus disconnected surfaces.

**Experiment/design change.** Use the existing sphere/Möbius variants for an explicit normal-transport task and an orientation reversal on orientable surfaces.

**Completion check.** Explain why two local normals at every point do not guarantee a continuous global normal field.

#### MH2100 61 — Flux measures normal flow

**Source record:** `[S1] flux-through-surfaces`

**Assessment.** The cancellation of normalization factors is correct, and the open-cap warning is important. A radial field on a sphere is too aligned to teach general flux.

**Improve or add.** Add oblique and tangential fields, a graph patch and a cap-plus-disk calculation. Keep unit normal, scalar area factor and oriented area vector visibly distinct.

**Experiment/design change.** Add normal reversal and cap-closure controls, with separate local dot product and accumulated signed flux.

**Completion check.** Set up flux with the requested orientation and account for every required surface component.

#### MH2100 62 — Curl is oriented circulation density

**Source record:** `[S1] curl-and-local-rotation`

**Assessment.** The curl/field-value distinction and factor-of-two angular-velocity caveat are excellent. A sampled arrow field does not by itself show the circulation-per-area limit.

**Improve or add.** Derive a coordinate rectangle component in full, then explain other components and arbitrary oriented normals. Include shear as a contrast to rigid rotation.

**Experiment/design change.** Shrink an oriented loop and display circulation, area and their ratio separately; retain exact derivative readouts.

**Completion check.** Interpret curl as a local oriented density rather than as arrow magnitude or the appearance of a global streamline.

#### MH2100 63 — Divergence is local net outflow

**Source record:** `[S1] divergence-and-local-flow`

**Assessment.** The dimensional generality and local-versus-finite-volume caveat are good. The radial/rotation slider does not expose the face-by-face cancellation in the definition.

**Improve or add.** Work a small-box derivation and add a shear or balanced stretch/compression field. Explain divergence as the trace of the derivative matrix at an appropriate prerequisite level.

**Experiment/design change.** Show opposing face fluxes and their total divided by volume while shrinking a box, with exact derivative comparison.

**Completion check.** Distinguish local divergence, finite-region flux and mere field magnitude.

#### MH2100 64 — Successive derivatives cancel

**Source record:** `[S1] gradient-curl-divergence`

**Assessment.** The identities are correct under the stated smoothness assumptions. Naming a cochain complex without developing spaces, linear maps, image/kernel and exactness risks turning enrichment into jargon.

**Improve or add.** Expand one identity componentwise, then explain image⊆kernel and why equality is an additional claim. Put topology and cohomological interpretation in a clearly scaffolded optional track.

**Experiment/design change.** Use linked operator diagrams and concrete fields rather than imply the generic arrow scene demonstrates an algebraic complex.

**Completion check.** Prove the cancellation identities and explain why zero consecutive composition does not by itself establish exactness.

#### MH2100 65 — Stokes’ Theorem

**Source record:** `[S1] stokes-theorem`

**Assessment.** The compatible-orientation and entire-surface smoothness conditions are good. The simple paraboloid family is a useful invariance example but needs a genuine boundary-orientation exercise.

**Improve or add.** Work a nonhorizontal boundary, a piecewise surface with an internal seam and two valid spanning surfaces. Separate the theorem statement from its pullback/Green proof sketch.

**Experiment/design change.** Couple surface normal choices to induced boundary arrows and show patch-edge cancellation; track both sides of the equality during deformation.

**Completion check.** Choose an easier spanning surface only after checking smoothness and matching induced boundary orientation.

#### MH2100 66 — Gauss–Ostrogradsky Divergence Theorem

**Source record:** `[S1] divergence-theorem`

**Assessment.** The singular radial-field caveat, cavity normals and cap-closure warning are all important and present. The symmetric sphere example is not enough method practice.

**Improve or add.** Add a composite boundary with a closing disk, a cavity, and an off-center or nonsymmetric solid. Work each omitted-face correction explicitly.

**Experiment/design change.** Show a closed/open indicator, every boundary component and its outward normals, with facewise flux and volume-integral totals.

**Completion check.** Apply the theorem only to a complete admissible boundary and subtract any artificially added surface correctly.

#### MH2100 67 — Review: choose the correct integral theorem

**Source record:** `[S1] review-integral-methods`

**Assessment.** The four exact computations are useful, but some original problem data are only described as 'given' or 'supplied.' The canonical paraboloid does not represent all four geometries, and all answers are revealed together.

**Improve or add.** Reproduce each problem's full original mathematical statement in original explanatory prose, then separate method choice, hypotheses, orientation, setup and solution. Include divergence/direct integration in a broader method chooser.

**Experiment/design change.** Give each problem its own geometry or preloaded graph state; hide solutions until the learner commits to a method and sign.

**Completion check.** Solve each review problem from the site's statement alone, without needing an inaccessible source to discover the field or orientation.

#### MH2100 68 — Review: straighten four curved boundaries

**Source record:** `[S1] review-change-of-variables`

**Assessment.** The inverse map, negative determinant and area log(2)/2 check out. The generic linear scene does not visualize the exact curved boundary-straightening problem.

**Improve or add.** Retain the computation but expand the choice of u=y/x³ and v=xy, inverse uniqueness and all boundary correspondences. Separate the signed determinant from the area factor.

**Experiment/design change.** Render the exact first-quadrant region and parameter rectangle with paired cells and the varying factor 1/(4u).

**Completion check.** Derive the substitution from the boundaries and independently bound the area between 1/4 and 1/2.

#### MH2100 69 — Review: the largest inscribed box

**Source record:** `[S1] review-lagrange-box`

**Assessment.** The centering argument, logarithmic objective, boundary check and global conclusion are mathematically substantial and correct. The generic circle constraint scene cannot teach the ellipsoid/box geometry.

**Improve or add.** Keep this as a model full application, expanding the half-length convention and comparison with normalized AM–GM. Explain the logarithm restriction before using it.

**Experiment/design change.** Render the ellipsoid and its axis-aligned inscribed box, with full side lengths and volume changing together.

**Completion check.** Recover the global maximum 256/√3 while correctly distinguishing semiaxes, half-lengths and full side lengths.

#### MH2100 70 — Review: classify all six stationary points

**Source record:** `[S1] review-critical-points`

**Assessment.** The six points, values and Hessian signatures check out. Sending the learner to manually re-enter the expression in a separate graph studio breaks the review flow.

**Improve or add.** Present a candidate table with gradient equations, Hessian signature, local type and global-status conclusion. Explain why the y³ term rules out absolute extrema on the whole plane.

**Experiment/design change.** Provide a one-click preloaded exact surface and selectable critical points with local quadratic models and coordinate slices.

**Completion check.** Find and classify all six points, and explain why the local extrema are not global extrema.

#### MH2100 71 — Review: the remainder decides differentiability

**Source record:** `[S1] review-total-differentiability`

**Assessment.** Both exact review arguments are useful and correct: one uniform bound proves differentiability, while one diagonal defeats the other candidate. The generic scene is not the exact pair.

**Improve or add.** Turn the two examples into a guided comparison: compute partials, identify the candidate, form the residual, then choose a uniform bound or obstruction. Keep the universal-quantifier distinction explicit.

**Experiment/design change.** Plot the actual two functions with their own candidate planes and normalized remainders; use logarithmic radius steps to make scaling visible.

**Completion check.** Produce a complete differentiability proof for the first function and a valid counterexample path for the second.

## 10. Implementation order and acceptance criteria

### First: correct misleading statements and outputs

Repair the first-derivative test and ambiguous terminology. Make incomplete review statements self-contained. Add the discontinuous-curve regression and appropriate detection/segmentation. Preserve the implicit renderer's honest limitations and expose them beside ambiguous results. Give each diagram an unambiguous relationship to the text: actual object, simplified analogue or schematic.

These changes address correctness and trust. They do not require redesigning all 125 lessons first.

### Second: finish one genuinely continuous learning path

Make the following path complete before adding more cards: domains and functions → limits → continuity → differentiability → derivative rules and approximation. It needs prerequisite links, properly scoped theorems, expanded worked examples, independent exercises and feedback. Use this path to establish the richer lesson schema and the reading/experiment layout.

For an MH2100-focused parallel path, use partial derivatives → total differentiability → chain rule → directional derivatives → gradient. This is a good showcase because the present material already contains valuable counterexamples and careful statements. The redesign should make the logical implications and failed converses explicit and navigable.

### Third: fix the lessons where demonstration and concept diverge

Prioritize nonlinear Jacobians, variable polar bounds, non-unit-speed line integrals, oblique flux, all extremum types, and exact final-review geometries. These have clear mathematical requirements, rather than merely asking for better-looking graphics.

The criterion for a new experiment is not that it renders smoothly. It must let the learner perform a specified mathematical comparison that the old experiment could not support.

### Fourth: complete the computational and proof practice

Expand the integration-technique and series-test clusters with contrasting worked examples and mixed-method problems. Develop the missing proof/notation/linear-algebra bridges. Add cumulative review that requires selecting a theorem before calculating, checking its assumptions and interpreting the answer.

MIT OpenCourseWare's multivariable-calculus materials provide one useful public comparison: problem sets and solutions are explicit learning resources, not something presumed to follow automatically from explanatory media. The proposed exercises here should be original and tied to this site's own lessons. [E4]

### Fifth: validate the whole learning product

The current project has useful structural, formula-rendering and numerical-construction tests. Add mathematical invariant tests and problem/solution checks. Perform live desktop/mobile, keyboard, assistive-technology, zoom/reflow and rendering-path checks before claiming conformance or comprehensive browser QA. [S2, E2, E3]

Conduct a small formative study with learners matching the intended prerequisite level. Give them an unfamiliar task before and after a lesson. Observe whether they can identify the objects, justify the theorem, avoid its common failure mode and transfer the method. These are proposed evaluations; no user study or learning-outcome data were collected for this audit. Page views, time spent and slider movements are not sufficient proxies for understanding.

### Proposed release gate for each substantive lesson

| Dimension | What should be demonstrably true |
|---|---|
| Mathematical statement | The objects, domains, hypotheses and conclusion are explicit and mutually consistent. |
| Reasoning | Proof status is labelled; every imported prerequisite is linked or stated. |
| Examples | A worked example exposes the method's decisions; a contrasting case prevents an obvious overgeneralization. |
| Practice | A learner can attempt a new task, receive a useful hint and compare with a justified solution. |
| Visual relevance | The model genuinely demonstrates this lesson's question; limitations and analogies are identified. |
| Numerical honesty | Sampled, exact, clipped, undefined and inferred quantities are distinguished. |
| Accessibility | The core information and learning task remain available without relying exclusively on pointer-controlled graphics or color. |
| Source independence | The original lesson and problem are complete without a permissioned PDF; references add verification or depth. |
| Navigation | Prerequisites, next steps and review links support a coherent route rather than just a global card counter. |

The exact number of examples should depend on the outcome. A short prerequisite bridge may need less; a card advertising five distinct techniques needs substantially more. Do not turn this table into another empty-field checklist.

## 11. What this audit establishes—and what it does not

**Established from inspection:** the 125-record curriculum structure; the single-paragraph explanatory schema; the cited theorem-statement omission; the identified example coverage gaps; canonical-scene reuse and its specific mismatches; existing access caveats and numerical warnings; the relevant source-derived layout order, navigation behavior and graph-algorithm consequences.

**Independently checked in selected examples:** the inverse Jacobian and area of the curved-region review; all six stationary-point values and Hessian signatures; the simple counterexample to the incomplete first-derivative test; and the algebra used in the proposed nonlinear-Jacobian lesson. The review's box and differentiability calculations were also examined directly. This is not an exhaustive formal verification of every mathematical claim.

**Not established:** deployment/source equivalence; live response times; actual viewport clipping at every screen size; measured color contrast; assistive-technology behavior; anonymous access to all sources; official-syllabus exhaustiveness; learner success rates; or that any missing explanation is absent from material outside the inspected site.

**Final judgment:** the best next version is not the same atlas with longer paragraphs and more attractive surfaces. It is a coherent learning system built around the existing good mathematics: complete explanations, exact relevant experiments, worked reasoning, contrast cases, independent practice and feedback. Preserve the atlas as its exploration and revision layer. Judge the learning layer by whether a student can solve and justify a new problem after using it.

## 12. Source and passage register

Repository links below are pinned to the reviewed commit rather than an unspecified future `main`. For curriculum findings, the JSON record ID plus field named in the finding is the passage locator. File paths and function/component names locate implementation findings. External sources are used narrowly for the stated theorem condition, accessibility principles and course-resource comparison.

### Site and repository sources

- **S0 — Live site landing content.** https://calculus.jeromegroup.org/ . Web-readable content inspected on 11 September 2026; not a full interactive browser test.
- **S1 — Complete curriculum.** `lib/curriculum/concepts.json`; records identified individually in Section 9. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/lib/curriculum/concepts.json
- **S2 — Coverage and validation ledger.** `docs/coverage-and-validation.md`, Scope, Verification and Source-alignment ledger. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/docs/coverage-and-validation.md
- **S3 — Lesson interface.** `components/atlas/lesson-workspace.tsx`, definition/conditions rendering, Derivation/Worked example/Subtleties tabs, experiment controls and previous/next navigation. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/components/atlas/lesson-workspace.tsx
- **S4 — Navigation and state.** `components/atlas/use-study-controller.ts`, `open`, `show`, `readLocation`, `filtered`, and state declarations. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/components/atlas/use-study-controller.ts
- **S5 — Experiment definitions and geometry.** `lib/atlas/scenes.ts`, notably `jacobian`, `polar`, `chain`, `extrema`, `lineintegral`, `parametric` and `flux`; `lib/atlas/geometry.ts`, corresponding `buildScene` branches. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/lib/atlas/scenes.ts and https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/lib/atlas/geometry.ts
- **S6 — Graph-studio UI and explicit limitations.** `components/atlas/graph-studio.tsx`, representation selector, preset list and “What the graph can tell you.” https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/components/atlas/graph-studio.tsx
- **S7 — Graph algorithms and expression handling.** `lib/atlas/geometry.ts`, `buildGraph`, curve branch and marching-tetrahedra branch; `lib/atlas/math.ts`, `expression` and `validateGraph`. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/lib/atlas/geometry.ts and https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/lib/atlas/math.ts
- **S8 — Reading references.** `components/atlas/source-references.tsx`, Drive access caption, page links, optional further-reading selection. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/components/atlas/source-references.tsx
- **S9 — Mathematical/accessibility rendering.** `components/atlas/math-text.tsx`, KaTeX options and text splitting; `components/atlas/viewport.tsx`, generic accessible label, keyboard handler, renderer fallback and camera controls. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/components/atlas/math-text.tsx and https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/components/atlas/viewport.tsx
- **S10 — Layout rules.** `app/globals.css`, final `.study-grid` row overrides, container queries and narrow-screen canvas heights, particularly lines 1870–2015. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/app/globals.css
- **S11 — Project's earlier design QA.** `design-qa.md`. Treated as self-reported project history, not independently repeated QA. https://github.com/Jerome-Group/calculus/blob/e3cc02a701db924a412248db13ff3bacacd91cf5/design-qa.md
- **S12 — Audit computation record.** `source_checks.json` in the delivered audit bundle. Records selected symbolic results and source-algorithm sampling checks; explicitly not live browser execution.

### Primary external references

- **E1 — OpenStax, Calculus Volume 1, §4.5, Theorem 4.9 (First Derivative Test).** Used for the explicit continuity hypothesis, not as an endorsement of every explanatory sentence on the page. https://openstax.org/books/calculus-volume-1/pages/4-5-derivatives-and-the-shape-of-a-graph
- **E2 — W3C, Web Content Accessibility Guidelines 2.2.** Relevant principles include non-text alternatives, keyboard operation and reflow. No conformance determination is made here. https://www.w3.org/TR/WCAG22/
- **E3 — W3C, Understanding Success Criterion 1.4.10: Reflow.** Includes the distinction between ordinary text reflow and content that inherently needs a two-dimensional layout. https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- **E4 — MIT OpenCourseWare, 18.02SC Multivariable Calculus, problem-set solutions resource.** Used only as a concrete example of an explicit practice/solution component in an open course. https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/problem-set-solutions/
