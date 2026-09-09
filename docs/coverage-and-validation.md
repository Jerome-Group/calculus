# Calculus — coverage and validation

Original study explanations aligned with locally retained MH1100, MH1101 and MH2100 course material. The private PDF/text cache is ignored; only source references and original notes are published.

## Scope

125 explorations across 31 lecture/chapter units. 47 source documents are linked. Individual official-source references identify physical PDF pages and slide headings or named results. Optional textbook references identify sections within chapter extracts. A concept may share a canonical experiment with related concepts; its model does not claim to reproduce every course example.

## Verification

- Curriculum tests check every declared unit, unique concept identifiers, source resolution and page bounds.
- KaTeX validates lesson formulas, embedded mathematical prose, parameter symbols, legend fragments and live readouts at minimum, initial, midpoint and maximum parameter values.
- All spatial scene families and variants construct finite geometry at minimum, initial and maximum parameter values. Planar models are checked across the same interval plus midpoint.
- Known values include the directional derivative, sphere flux and secant slope; layout requests reject invalid fields before mutation.
- Native WebMCP study and graph journeys are exercised in the in-app browser, including invalid inputs and all four graph modes. Browser observations and layout comparison are recorded in `design-qa.md`.
- Build, Node tests, formatting and lint are required before publishing. Independent standards and requirements reviews run before the pull request.
- Images are numerical approximations; graph output does not prove continuity or exhaust a zero set. Compatibility SVG rendering is inspected in the browser; the WebGL hardware path is not separately hardware-tested.
- Standalone `tsc --noEmit` still reports the imported scaffold’s missing Cloudflare Workers ambient types; the supported Vinext production build and tests are the release checks.

## Source-alignment ledger

### MH1100 — 24 explorations

- **Functions begin with a domain** (`sets-functions-domains`): lecture 1; PDF pages 15, 22, 23, 24, 25, 29. Topics: sets, union, intersection, complement, domain, codomain, range, vertical line test, functions.
- **Read a function’s shape** (`function-shapes`): lecture 1; PDF pages 32, 38, 42, 45. Topics: piecewise functions, absolute value, even and odd, monotonicity, elementary functions.
- **Transform and compose** (`transform-compose`): lecture 1; PDF pages 52, 57. Topics: translations, scaling, reflection, function algebra, composition.
- **Approach a point** (`limits-one-sided`): lecture 2; PDF pages 3, 4, 5, 13, 15, 18, 20, 21, 22, 23, 24, 29, 33, 35, 36, 37, 39, 40. Topics: intuitive limit, punctured neighbourhood, one-sided limits, secants, velocity.
- **Vertical asymptotes** (`infinite-limits`): lecture 2; PDF pages 42, 44, 45, 46, 48, 49. Topics: infinite limits, vertical asymptotes, one-sided infinity.
- **Limit laws and squeezing** (`limit-laws-squeeze`): lecture 3; PDF pages 3, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 34, 35, 37, 38, 40. Topics: sum law, product law, quotient law, root law, direct substitution, squeeze theorem, trigonometric limits.
- **Make “close” precise** (`epsilon-delta-one-variable`): lecture 4; PDF pages 3, 7, 12, 14, 17, 18, 20, 22, 23, 24, 25, 27, 29, 30, 31, 32, 33. Topics: epsilon delta, quantifier order, triangle inequality, limit proofs, nonexistence.
- **Continuity and intermediate values** (`continuity-ivt`): lecture 5; PDF pages 3, 10, 11, 14, 16, 18, 19, 24, 25, 27, 28, 31, 35, 36. Topics: continuity, discontinuities, one-sided continuity, continuous composition, intermediate value theorem.
- **From secants to a tangent** (`derivative-definition`): lecture 6; PDF pages 3, 6, 9, 10, 11, 13. Topics: difference quotient, derivative function, Leibniz notation, tangent, velocity.
- **Where differentiability fails** (`differentiability-corners`): lecture 6; PDF pages 14, 16, 17, 20, 24, 25, 26, 27. Topics: differentiability implies continuity, corners, vertical tangents, higher derivatives, acceleration.
- **Build derivatives from rules** (`differentiation-rules`): lecture 7; PDF pages 3, 5, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 19, 21, 22, 23, 25, 26. Topics: constant rule, power rule, sum rule, product rule, quotient rule, trigonometric derivatives.
- **The chain rule** (`chain-rule-single`): lecture 8; PDF pages 4, 6, 7, 13. Topics: chain rule, composition, general power rule.
- **Implicit curves and related rates** (`implicit-related-rates`): lecture 8; PDF pages 16, 27, 35. Topics: implicit differentiation, related rates, circle tangent, chain rule.
- **Linear approximation and differentials** (`linearization-differentials`): lecture 8; PDF pages 44, 51. Topics: linearization, differentials, error, local approximation.
- **Extrema and critical points** (`extrema-fermat`): lecture 9; PDF pages 4, 15. Topics: local extrema, absolute extrema, Fermat theorem, critical numbers, extreme value theorem.
- **Rolle and the mean value theorem** (`rolle-mean-value`): lecture 9; PDF pages 19, 20, 25, 26. Topics: Rolle theorem, mean value theorem, zero derivative, equal derivatives.
- **Shape from derivatives** (`derivative-tests`): lecture 10; PDF pages 4, 9, 12, 15. Topics: first derivative test, second derivative test, concavity, inflection, monotonicity.
- **Infinity and curve sketching** (`infinity-curve-sketching`): lecture 10; PDF pages 22, 25, 26, 27, 31, 35, 36, 39, 40, 42. Topics: limits at infinity, horizontal asymptote, slant asymptote, curve sketching, precise limits at infinity.
- **Turn a constraint into an optimum** (`optimization-single`): lecture 11; PDF pages 4. Topics: optimization, constraints, feasible domain, global comparison.
- **Newton’s tangent iteration** (`newton-method`): lecture 11; PDF pages 18. Topics: Newton method, iteration, root approximation, convergence caveats.
- **Recover a function from its rate** (`antiderivatives-single`): lecture 11; PDF pages 29. Topics: antiderivatives, constant of integration, initial conditions, motion.
- **Invert a function** (`inverse-functions`): lecture 12; PDF pages 4, 10, 11. Topics: one-to-one, horizontal line test, inverse, inverse derivative, domain restriction.
- **Exponential and logarithmic rates** (`exponential-logarithmic`): lecture 12; PDF pages 17, 26, 30, 31, 32, 35, 36. Topics: exponential, natural logarithm, log laws, logarithmic differentiation, variable powers.
- **Indeterminate forms and L’Hôpital** (`lhopital`): lecture 13; PDF pages 3. Topics: LHopital, indeterminate forms, zero over zero, infinity over infinity, logarithmic conversion.

### MH1101 — 30 explorations

- **Antiderivatives form a family** (`integral-antiderivatives`): chapter 1; PDF pages 2, 3. Topics: antiderivatives, indefinite integrals, initial conditions.
- **Accumulate with Riemann sums** (`riemann-integral`): chapter 1; PDF pages 6, 9. Topics: area problem, Riemann sums, definite integral, linearity, additivity, comparison, signed area.
- **The average value of a function** (`integral-average`): chapter 1; PDF pages 18. Topics: average value, mean value theorem for integrals.
- **Differentiation meets accumulation** (`fundamental-theorem`): chapter 1; PDF pages 19, 21. Topics: FTC1, FTC2, net change, accumulation, variable bounds.
- **Substitution changes the variable** (`substitution-integral`): chapter 1; PDF pages 25. Topics: substitution, change of variable, transformed bounds, reverse chain rule.
- **Improper integrals are limits** (`improper-integrals`): chapter 1; PDF pages 28, 29, 31. Topics: type 1 improper integral, type 2 improper integral, p integral, singularities.
- **Area between curves** (`area-between-curves`): chapter 2; PDF pages 2, 3. Topics: area between curves, intersections, horizontal slices, vertical slices.
- **Volumes from cross-sections** (`disk-washer-volumes`): chapter 2; PDF pages 5, 6. Topics: cross sections, volume, disks, washers, solids of revolution.
- **Volumes from cylindrical shells** (`cylindrical-shells`): chapter 2; PDF pages 13, 16. Topics: cylindrical shells, radius, shell height, axis of revolution.
- **Integration by parts** (`integration-by-parts`): chapter 3; PDF pages 2. Topics: integration by parts, repeated parts, boundary terms, cyclic integrals.
- **Trigonometric integrals** (`trigonometric-integrals`): chapter 3; PDF pages 8. Topics: trigonometric powers, half-angle, sine cosine, tangent secant.
- **Substitute a triangle** (`trigonometric-substitution`): chapter 3; PDF pages 17. Topics: trigonometric substitution, Pythagorean identity, sign restrictions.
- **Split a rational function** (`partial-fractions`): chapter 3; PDF pages 21. Topics: rational functions, polynomial division, partial fractions, repeated factors, irreducible quadratic.
- **Midpoint and trapezoidal rules** (`quadrature-midpoint-trapezoid`): chapter 3; PDF pages 26, 29, 31. Topics: midpoint rule, trapezoidal rule, error bounds, numerical integration.
- **Simpson’s parabolic rule** (`simpson-rule`): chapter 3; PDF pages 32, 33. Topics: Simpson rule, parabolic interpolation, fourth derivative error.
- **Sequences and their limits** (`sequence-limits`): chapter 4; PDF pages 2, 4. Topics: sequences, epsilon N, limit, convergence, divergence.
- **Subsequences expose divergence** (`subsequences-bounded`): chapter 4; PDF pages 7. Topics: subsequence, subsequence test, boundedness, oscillation.
- **Calculate sequence limits** (`sequence-limit-laws`): chapter 4; PDF pages 11, 13. Topics: sequence algebra, squeeze, continuous composition, geometric sequences, function extension.
- **Monotone and bounded** (`monotone-sequences`): chapter 4; PDF pages 19, 20. Topics: monotonic sequence, bounded sequence, supremum, recursive sequences.
- **A series is a sequence of sums** (`series-geometric-telescoping`): chapter 4; PDF pages 22, 23, 25. Topics: series, partial sums, geometric series, telescoping.
- **The term test only rules out** (`series-divergence-test`): chapter 4; PDF pages 30, 31. Topics: nth term test, harmonic series, series linearity.
- **Compare a series with an area** (`integral-test`): chapter 5; PDF pages 2, 3, 4. Topics: integral test, p series, remainder bounds.
- **Direct and limit comparison** (`comparison-tests`): chapter 5; PDF pages 7, 9. Topics: comparison test, limit comparison, positive series, dominant terms.
- **Absolute and conditional convergence** (`absolute-conditional-alternating`): chapter 5; PDF pages 13, 14, 16. Topics: absolute convergence, conditional convergence, alternating series test, remainder.
- **Ratio and root tests** (`ratio-root-tests`): chapter 5; PDF pages 19, 23. Topics: ratio test, root test, factorials, absolute convergence, inconclusive tests.
- **Power series and their radius** (`power-series-radius`): chapter 6; PDF pages 2, 4. Topics: power series, centre, radius of convergence, interval, endpoint tests.
- **Differentiate and integrate a series** (`power-series-operations`): chapter 6; PDF pages 8, 11. Topics: termwise differentiation, termwise integration, geometric representation, endpoint changes.
- **Taylor polynomials and remainder** (`taylor-series`): chapter 6; PDF pages 13, 14, 16, 18. Topics: Taylor polynomial, Maclaurin series, uniqueness, Taylor theorem, error bound, analyticity.
- **The general binomial series** (`binomial-series`): chapter 6; PDF pages 23, 25. Topics: binomial series, generalized coefficients, fractional powers.
- **Extract a limit from a series** (`limits-with-series`): chapter 6; PDF pages 27. Topics: series limits, leading term, cancellation, remainder order.

### MH2100 — 71 explorations

- **Vectors in space** (`vectors-and-coordinates`): lecture 1; PDF pages 6, 7, 8, 9, 10, 11, 12, 13, 14. Topics: Cartesian coordinates, points versus free vectors, position and displacement vectors, triangle law, parallelogram law, vector-space identities, standard basis, Euclidean norm, dot product, angles and orthogonality.
- **A curve and its clock** (`curves-and-parametrizations`): lecture 1; PDF pages 15, 16, 17. Topics: vector-valued functions, componentwise continuity, curve as continuous image, parametrization, reparametrization, orientation and speed, space-filling curve caveat.
- **Build a parametrization** (`constructing-curves`): lecture 1; PDF pages 18, 20, 21, 22, 23, 24. Topics: affine line parametrization, non-affine line parametrization, circle, ellipse, cycloid, helix, parameter elimination, Cartesian curve equations, range verification.
- **Tangents, velocity and singularities** (`tangents-velocity-and-singularities`): lecture 1; PDF pages 26, 27, 28, 29, 31. Topics: difference quotient for vector maps, tangent vectors, regular and singular parametrizations, velocity, speed, acceleration, affine tangent line, self-intersections, cusp singularity, one-sided tangents.
- **Surfaces and level sets** (`surfaces-and-level-sets`): lecture 1; PDF pages 34, 35, 36, 37, 40, 41. Topics: real-valued multivariable functions, expression domains, graphs, horizontal traces, level curves, contour plots, contour interval, topographic interpretation.
- **Distance and neighborhoods** (`distance-and-neighborhoods`): lecture 2; PDF pages 2, 3, 42, 43. Topics: Pythagorean distance, metric axioms, triangle inequality, nonnegativity from axioms, open balls, punctured neighborhoods, limit points, isolated points, open sets, closed sets.
- **The ε–δ limit** (`epsilon-delta-limits`): lecture 2; PDF pages 4, 5, 6, 7, 8, 9. Topics: epsilon-delta definition, restricted limits, scalar and vector limits, limit uniqueness, punctured domain, componentwise characterization, uniform control over directions.
- **Why a limit does not exist** (`different-paths-different-limits`): lecture 2; PDF pages 10, 12, 13, 14, 15. Topics: nonexistence by restrictions, straight-line paths, polar coordinates, axes versus diagonals, removable versus nonremovable discontinuity.
- **When every line is misleading** (`curved-paths-hide-obstructions`): lecture 2; PDF pages 10, 12, 13, 14, 15. Topics: nonlinear approach paths, all-line test failure, balancing denominator orders, path-dependent limits, failure of nonuniform polar arguments.
- **Squeeze, extend, compose** (`squeeze-and-continuity`): lecture 2; PDF pages 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36. Topics: squeeze theorem, limit algebra, continuity definition, substitution criterion, isolated-point continuity, continuous extensions, polynomial and rational continuity, continuous compositions, vector continuity, dot-product continuity.
- **Infinity means every escape route** (`limits-at-infinity`): lecture 2; PDF pages 37, 38, 39, 40, 41. Topics: epsilon-N definition, unbounded domains, norm tending to infinity, vector limits at infinity, iterated versus joint limits, radial decay bound.
- **Partial derivatives are slice slopes** (`partial-derivatives-as-slices`): lecture 2; PDF pages 44, 45, 46, 47, 48, 49. Topics: partial derivative definition, holding variables fixed, partial derivative domains, piecewise functions, Leibniz notation, vertical traces, slice tangent vectors, candidate tangent plane.
- **Cross products build normal vectors** (`cross-products-and-planes`): lecture 3; PDF pages 8, 9, 10, 11, 12. Topics: cross product coordinate formula, right-hand rule, cross-product magnitude, parallelogram area, anti-commutativity, distributivity, scalar compatibility, failure of associativity, planes from normals, planes from two directions.
- **What total differentiability means** (`total-differentiability`): lecture 3; PDF pages 14, 15, 16, 17, 18, 19, 20, 21. Topics: tangent-line functions, tangent-plane function, affine versus linear terminology, linear approximation, total differentiability, little-o remainder, uniqueness of derivative, differentiability implies partial derivatives, differentiability implies continuity.
- **All directional derivatives can exist—and still fail** (`partials-do-not-make-a-plane`): lecture 3; PDF pages 16, 17, 18, 19, 20, 21, 22, 1. Topics: supplement: false differentiability implications, continuous but not differentiable, partials without continuity, all directional derivatives without differentiability, candidate plane failure, directional nonlinearity, normalized remainder test.
- **Certify the approximation** (`certifying-differentiability-and-errors`): lecture 3; PDF pages 22, 23, 24, 25, 26. Topics: C1 sufficient condition, neighborhood existence of partials, continuity at a point versus on a neighborhood, epsilon-component remainder definition, mean-value theorem argument, differential error propagation, cone-volume measurement error, approximate versus rigorous error bounds.
- **The chain rule as a composition of motions** (`multivariable-chain-rule`): lecture 3; PDF pages 27, 28, 29, 30, 31, 33, 34, 35, 36. Topics: single-variable chain rule, 2-to-1 chain rule, 2-to-2 chain rule, general multivariable chain rule, dependency trees, Jacobian composition, chain rule along a curve, tangential invariance.
- **Implicit surfaces become local graphs** (`implicit-functions-and-tangents`): lecture 3; PDF pages 37, 39, 40, 41, 42, 43, 44. Topics: implicitly defined curves, implicitly defined surfaces, regular level sets, implicit function theorem, local graph uniqueness, coordinate chart selection, implicit differentiation, implicit tangent line, implicit tangent plane.
- **Direction changes the slope** (`directional-derivatives-and-gradient`): lecture 3; PDF pages 45, 46, 47, 48, 49, 51, 52, 53, 54. Topics: directional derivative definition, unit-vector normalization, two-sided directional limits, coordinate directions, gradient definition, higher-dimensional gradient, proof from differentiability.
- **The gradient points uphill and across contours** (`gradient-normals-and-steepest-ascent`): lecture 4; PDF pages 2, 3, 4, 5, 6, 7, 8, 9, 11, 13. Topics: normal lines to implicit curves, normal lines to implicit surfaces, gradient perpendicular to level sets, steepest ascent, steepest descent, gradient magnitude, zero-gradient case, input gradient versus graph normal.
- **Stationary does not mean optimal** (`local-extrema-and-saddles`): lecture 4; PDF pages 14, 15, 16, 17, 18, 19, 20, 21, 22, 24. Topics: absolute versus local extrema, relative-to-domain neighborhoods, Fermat necessary condition, critical points, stationary points, nondifferentiable candidates, saddle definition, non-strict minima.
- **Second derivatives and changing slopes** (`mixed-and-higher-partials`): lecture 4; PDF pages 25, 26, 27, 28. Topics: pure second partials, mixed partials, derivative-order notation, partial derivative domains, Clairaut theorem, rectangular increment argument, third and higher partials, permutation of differentiation order.
- **Classify the second-order shape** (`hessian-classification`): lecture 4; PDF pages 29, 30, 31. Topics: one-variable second-derivative test, Hessian, two-variable second-derivative test, determinant discriminant, definite and indefinite quadratic forms, degenerate critical points, inconclusive test, sin(xy) critical hyperbolas.
- **Global extrema require the boundary** (`global-extrema-and-boundaries`): lecture 4; PDF pages 33, 34, 35, 36, 37, 38. Topics: closed sets and complements, boundedness, compactness in Euclidean space, extreme value theorem, attainment, interior critical candidates, boundary restrictions, corners, global comparison, completing squares.
- **Lagrange multipliers on a curve** (`lagrange-circle`): lecture 5; PDF pages 2, 7, 9, 10. Topics: Lagrange multipliers, regular constraints, level-curve tangency, candidate comparison, compactness and extreme values.
- **One constraint in three dimensions** (`lagrange-sphere`): lecture 5; PDF pages 12, 14, 15. Topics: three-variable Lagrange theorem, tangent planes, normal directions, global bounds, AM–GM, open-top box.
- **Two constraints and one tangent direction** (`lagrange-two-constraints`): lecture 5; PDF pages 18, 19, 20. Topics: two-constraint Lagrange theorem, constraint qualification, rank, intersection curves, normal span, singular feasible points.
- **A double integral from columns** (`double-riemann-sums`): lecture 5; PDF pages 24, 26, 31. Topics: Riemann sums, sampling, double limits, mesh refinement, integrability, signed integral, volume.
- **Integrating a bounded region** (`general-double-integrals`): lecture 5; PDF pages 32, 34, 35, 36, 37, 38. Topics: zero extension, enclosing-rectangle independence, Jordan area, boundary criterion, Lebesgue integrability criterion, mass density, joint probability density, restricted domains.
- **Fubini: accumulate one direction at a time** (`fubini-double`): lecture 5; PDF pages 41, 43, 44, 45, 46, 47. Topics: iterated double integrals, Fubini theorem, slice areas, order of integration, continuity hypothesis.
- **Type I and Type II regions** (`type-one-two-regions`): lecture 5; PDF pages 49, 50, 52, 53, 54, 55, 56, 57, 58, 59, 60. Topics: Type I planar regions, Type II planar regions, vertical and horizontal sections, projection, changing integration order, volume below a graph.
- **Linearity and cutting a region** (`linearity-additivity`): lecture 6; PDF pages 2, 3, 4, 5, 6, 7, 8. Topics: linearity, finite additivity, domain restriction, zero-area overlaps, piecewise regions, inclusion–exclusion.
- **Polar coordinates and the area factor** (`polar-rectangles`): lecture 6; PDF pages 13, 14, 16, 17, 18. Topics: polar plane, polar coordinates, polar rectangles, annular sectors, angle nonuniqueness, polar Riemann sums, area factor.
- **Variable polar bounds** (`polar-regions`): lecture 6; PDF pages 19, 20, 21, 22. Topics: polar regions, variable radial bounds, ray sections, shifted disks, polar area formula, choice of coordinates.
- **A triple integral accumulates through space** (`triple-riemann-sums`): lecture 7; PDF pages 2, 4, 5, 6, 7, 8, 9. Topics: triple Riemann sums, standard boxes, sample independence, triple Fubini theorem, six integration orders, zero extension, Jordan volume, zero-volume surfaces.
- **Type I, II and III solids** (`simple-solid-bounds`): lecture 7; PDF pages 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 22, 23. Topics: Type I solids, Type II solids, Type III solids, projections, fibres, iterated triple bounds, order reversal.
- **Cylindrical coordinates** (`cylindrical-coordinates`): lecture 7; PDF pages 25, 27, 28, 29. Topics: cylindrical conversion, radial distance, azimuth, coordinate surfaces, cylinders, cones, coordinate singularities.
- **Cylindrical volume elements** (`cylindrical-integration`): lecture 7; PDF pages 30, 31, 32, 33, 35, 36. Topics: cylindrical triple integrals, curved wedges, volume factor, radial integrands, polar projections, density versus Jacobian.
- **Spherical coordinates** (`spherical-coordinates`): lecture 7; PDF pages 38, 41, 42, 43, 44. Topics: spherical conversion, inclination, azimuth, radial distance, spheres, half-planes, cones and equatorial exception, coordinate convention.
- **Spherical wedges and radial bounds** (`spherical-integration`): lecture 7; PDF pages 45, 46, 47, 48, 49, 50, 51. Topics: spherical volume factor, nice spherical wedges, Type II spherical wedges, variable radial bounds, polar singularities, sphere sectors versus caps.
- **A determinant scales area** (`linear-area-change`): lecture 8; PDF pages 2, 6, 7, 8. Topics: linear plane transformations, basis images, parallelograms, determinant geometry, area scaling, orientation, singular maps.
- **The Jacobian is a local determinant** (`plane-jacobian`): lecture 8; PDF pages 9, 10, 11, 12. Topics: plane transformations, component functions, Jacobian matrix, Jacobian determinant, local linearization, inverse function theorem, polar Jacobian.
- **Space transformations and signed Jacobians** (`space-jacobians`): lecture 8; PDF pages 13, 14, 15, 16. Topics: space transformations, three-dimensional Jacobian, parallelepipeds, scalar triple product, cylindrical Jacobian, signed spherical Jacobian, coordinate-order sign.
- **Change of variables in two and three dimensions** (`change-of-variables`): lecture 8; PDF pages 17, 18, 19, 20, 21, 22, 23. Topics: change-of-variables theorem, two-variable substitution, three-variable substitution, diffeomorphism, injectivity, transformed bounds, multiplicity, absolute determinant.
- **When the substitution is given backwards** (`inverse-jacobian`): lecture 8; PDF pages 25, 26, 28, 29, 31, 32, 34, 35. Topics: inverse transformations, inverse Jacobian, chain rule for inverse maps, boundary straightening, substitution strategy.
- **A scalar field along a curve** (`scalar-line-integrals`): lecture 8; PDF pages 37, 39, 42, 43, 44, 45. Topics: scalar fields, scalar line integrals, line Riemann sums, arc length, rectifiable curves, nice parametrizations, smooth curves, reparametrization invariance, orientation independence.
- **Vector fields assign a direction at every point** (`vector-fields`): lecture 8; PDF pages 46, 48, 49. Topics: vector-field definition, plane fields, space fields, component functions, smooth fields, tangent component, field versus trajectory.
- **Work and orientation along a curve** (`vector-line-integrals`): lecture 8; PDF pages 46, 48, 49, 50, 51. Topics: vector line integrals, work, orientation, vector Riemann sums, parametrization independence, reversal theorem, closed curves, tangential component.
- **Three differentials, one path** (`coordinate-line-integrals`): lecture 9; PDF pages 2, 4, 5, 6, 8, 9, 10. Topics: coordinate line integrals, first kind dx, second kind dy, third kind dz, scalar versus vector integrals, orientation.
- **Assemble a path from pieces** (`piecewise-paths`): lecture 9; PDF pages 11, 12, 13, 14, 15, 16, 17. Topics: affine parametrization, piecewise-smooth curves, additivity, path concatenation.
- **Work is tangential accumulation** (`work-and-circulation`): lecture 9; PDF pages 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30. Topics: work, tangential component, circulation, force fields, singular fields.
- **A potential remembers only endpoints** (`fundamental-line-theorem`): lecture 9; PDF pages 31, 33, 34, 35. Topics: gradient fields, potential functions, FTLI, path independence, closed-loop integral.
- **When does zero curl suffice?** (`conservative-domains`): lecture 9; PDF pages 36, 37, 39, 40. Topics: conservative tests, simply connected domains, curl-free, potential construction, topological obstruction, Clairaut theorem.
- **Green’s Theorem** (`greens-theorem`): lecture 9; PDF pages 41, 42, 43, 44, 45, 46, 47, 48. Topics: Green theorem, Jordan curve theorem, positive orientation, boundary cancellation, regions with holes.
- **Measure area from the boundary** (`area-from-boundary`): lecture 9; PDF pages 49, 50, 52. Topics: area formula, ellipse area, signed area, planimeter.
- **A surface is a two-parameter image** (`surface-charts`): lecture 10; PDF pages 2, 3, 4, 5, 6, 7, 8. Topics: parametric surfaces, parameter domain, surface interior, surface edge, sphere, cylinder, boundary identifications.
- **Two tangents determine a normal** (`surface-tangent-vectors`): lecture 10; PDF pages 7, 8, 9. Topics: regular parametrization, rank two, tangent plane, surface normal, smooth surfaces, piecewise-smooth surfaces, coordinate singularities.
- **A tiny rectangle becomes a parallelogram** (`surface-area-element`): lecture 10; PDF pages 10, 11, 12, 13, 14, 16, 18, 19, 20. Topics: surface area, surface Jacobian, nice surfaces, Riemann sums, sphere cap area.
- **Integrate a density over a surface** (`scalar-surface-integrals`): lecture 10; PDF pages 11, 12, 13, 14, 16, 18, 19, 20. Topics: scalar surface integral, surface density, graph surfaces, surface area, patch additivity, reparametrization invariance.
- **Choose a continuous side** (`surface-orientation`): lecture 10; PDF pages 22, 26, 28, 29. Topics: orientability, continuous normal field, upward and downward, outward and inward, Mobius strip, global versus local.
- **Flux measures normal flow** (`flux-through-surfaces`): lecture 10; PDF pages 30, 32, 33, 35, 36, 38, 39. Topics: vector surface integrals, flux, vector area element, orientation reversal, open versus closed surfaces.
- **Curl is oriented circulation density** (`curl-and-local-rotation`): lecture 11; PDF pages 11, 13, 14. Topics: curl, local circulation, right-hand rule, paddlewheel, curl-free fields.
- **Divergence is local net outflow** (`divergence-and-local-flow`): lecture 11; PDF pages 15, 20. Topics: divergence, source and sink, divergence-free fields, all dimensions, local versus global.
- **Successive derivatives cancel** (`gradient-curl-divergence`): lecture 11; PDF pages 21. Topics: gradient curl divergence, differential identities, cochain complex, linearity, image and kernel, topology.
- **Stokes’ Theorem** (`stokes-theorem`): lecture 11; PDF pages 22, 23, 24, 25, 27, 28. Topics: Stokes theorem, induced boundary orientation, surface independence, curl flux, patch cancellation.
- **Gauss–Ostrogradsky Divergence Theorem** (`divergence-theorem`): lecture 11; PDF pages 30, 31, 32. Topics: divergence theorem, Gauss Ostrogradsky, closed surfaces, outward orientation, singularity caveat, closing a cap.
- **Review: choose the correct integral theorem** (`review-integral-methods`): lecture 12; PDF pages 1. Topics: final review, Stokes cone and cylinder, Stokes triangle, Green clockwise triangle, orientation-reversing parametrization, potential method.
- **Review: straighten four curved boundaries** (`review-change-of-variables`): lecture 12; PDF pages 13–15. Topics: final review, change of variables, curvilinear rectangle, inverse Jacobian, orientation reversal.
- **Review: the largest inscribed box** (`review-lagrange-box`): lecture 12; PDF pages 16–18. Topics: final review, Lagrange multipliers, ellipsoid, inscribed box, global maximum, compactness, AM GM.
- **Review: classify all six stationary points** (`review-critical-points`): lecture 12; PDF pages 19–21. Topics: final review, stationary points, Hessian, second derivative test, local minimum, local maximum, saddle point, local versus global.
- **Review: the remainder decides differentiability** (`review-total-differentiability`): lecture 12; PDF pages 22–27. Topics: final review, total differentiability, Frechet derivative, uniform remainder, partial derivatives, directional derivatives, continuity, counterexample.
