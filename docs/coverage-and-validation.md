# MH2100 Atlas — coverage and validation

Original teaching text aligned with the supplied MH2100 Lecture 01–11 files, Lecture 12 Final Exam Review, and the supplement on partial derivatives and total differentiability. Lecture files themselves and private Drive metadata are not redistributed.

## Coverage

### Lecture 1

- Vectors in space: Cartesian coordinates; points versus free vectors; position and displacement vectors; triangle law; parallelogram law; vector-space identities; standard basis; Euclidean norm; dot product; angles and orthogonality
- A curve and its clock: vector-valued functions; componentwise continuity; curve as continuous image; parametrization; reparametrization; orientation and speed; space-filling curve caveat
- Build a parametrization: affine line parametrization; non-affine line parametrization; circle; ellipse; cycloid; helix; parameter elimination; Cartesian curve equations; range verification
- Tangents, velocity and singularities: difference quotient for vector maps; tangent vectors; regular and singular parametrizations; velocity; speed; acceleration; affine tangent line; self-intersections; cusp singularity; one-sided tangents
- Surfaces and level sets: real-valued multivariable functions; expression domains; graphs; horizontal traces; level curves; contour plots; contour interval; topographic interpretation

### Lecture 2

- Distance and neighborhoods: Pythagorean distance; metric axioms; triangle inequality; nonnegativity from axioms; open balls; punctured neighborhoods; limit points; isolated points; open sets; closed sets
- The ε–δ limit: epsilon-delta definition; restricted limits; scalar and vector limits; limit uniqueness; punctured domain; componentwise characterization; uniform control over directions
- Why a limit does not exist: nonexistence by restrictions; straight-line paths; polar coordinates; axes versus diagonals; removable versus nonremovable discontinuity
- When every line is misleading: nonlinear approach paths; all-line test failure; balancing denominator orders; path-dependent limits; failure of nonuniform polar arguments
- Squeeze, extend, compose: squeeze theorem; limit algebra; continuity definition; substitution criterion; isolated-point continuity; continuous extensions; polynomial and rational continuity; continuous compositions; vector continuity; dot-product continuity
- Infinity means every escape route: epsilon-N definition; unbounded domains; norm tending to infinity; vector limits at infinity; iterated versus joint limits; radial decay bound
- Partial derivatives are slice slopes: partial derivative definition; holding variables fixed; partial derivative domains; piecewise functions; Leibniz notation; vertical traces; slice tangent vectors; candidate tangent plane

### Lecture 3

- Cross products build normal vectors: cross product coordinate formula; right-hand rule; cross-product magnitude; parallelogram area; anti-commutativity; distributivity; scalar compatibility; failure of associativity; planes from normals; planes from two directions
- What total differentiability means: tangent-line functions; tangent-plane function; affine versus linear terminology; linear approximation; total differentiability; little-o remainder; uniqueness of derivative; differentiability implies partial derivatives; differentiability implies continuity
- All directional derivatives can exist—and still fail: supplement: false differentiability implications; continuous but not differentiable; partials without continuity; all directional derivatives without differentiability; candidate plane failure; directional nonlinearity; normalized remainder test
- Certify the approximation: C1 sufficient condition; neighborhood existence of partials; continuity at a point versus on a neighborhood; epsilon-component remainder definition; mean-value theorem argument; differential error propagation; cone-volume measurement error; approximate versus rigorous error bounds
- The chain rule as a composition of motions: single-variable chain rule; 2-to-1 chain rule; 2-to-2 chain rule; general multivariable chain rule; dependency trees; Jacobian composition; chain rule along a curve; tangential invariance
- Implicit surfaces become local graphs: implicitly defined curves; implicitly defined surfaces; regular level sets; implicit function theorem; local graph uniqueness; coordinate chart selection; implicit differentiation; implicit tangent line; implicit tangent plane
- Direction changes the slope: directional derivative definition; unit-vector normalization; two-sided directional limits; coordinate directions; gradient definition; higher-dimensional gradient; proof from differentiability

### Lecture 4

- The gradient points uphill and across contours: normal lines to implicit curves; normal lines to implicit surfaces; gradient perpendicular to level sets; steepest ascent; steepest descent; gradient magnitude; zero-gradient case; input gradient versus graph normal
- Stationary does not mean optimal: absolute versus local extrema; relative-to-domain neighborhoods; Fermat necessary condition; critical points; stationary points; nondifferentiable candidates; saddle definition; non-strict minima
- Second derivatives and changing slopes: pure second partials; mixed partials; derivative-order notation; partial derivative domains; Clairaut theorem; rectangular increment argument; third and higher partials; permutation of differentiation order
- Classify the second-order shape: one-variable second-derivative test; Hessian; two-variable second-derivative test; determinant discriminant; definite and indefinite quadratic forms; degenerate critical points; inconclusive test; sin(xy) critical hyperbolas
- Global extrema require the boundary: closed sets and complements; boundedness; compactness in Euclidean space; extreme value theorem; attainment; interior critical candidates; boundary restrictions; corners; global comparison; completing squares

### Lecture 5

- Lagrange multipliers on a curve: Lagrange multipliers; regular constraints; level-curve tangency; candidate comparison; compactness and extreme values
- One constraint in three dimensions: three-variable Lagrange theorem; tangent planes; normal directions; global bounds; AM–GM; open-top box
- Two constraints and one tangent direction: two-constraint Lagrange theorem; constraint qualification; rank; intersection curves; normal span; singular feasible points
- A double integral from columns: Riemann sums; sampling; double limits; mesh refinement; integrability; signed integral; volume
- Integrating a bounded region: zero extension; enclosing-rectangle independence; Jordan area; boundary criterion; Lebesgue integrability criterion; mass density; joint probability density; restricted domains
- Fubini: accumulate one direction at a time: iterated double integrals; Fubini theorem; slice areas; order of integration; continuity hypothesis
- Type I and Type II regions: Type I planar regions; Type II planar regions; vertical and horizontal sections; projection; changing integration order; volume below a graph

### Lecture 6

- Linearity and cutting a region: linearity; finite additivity; domain restriction; zero-area overlaps; piecewise regions; inclusion–exclusion
- Polar coordinates and the area factor: polar plane; polar coordinates; polar rectangles; annular sectors; angle nonuniqueness; polar Riemann sums; area factor
- Variable polar bounds: polar regions; variable radial bounds; ray sections; shifted disks; polar area formula; choice of coordinates

### Lecture 7

- A triple integral accumulates through space: triple Riemann sums; standard boxes; sample independence; triple Fubini theorem; six integration orders; zero extension; Jordan volume; zero-volume surfaces
- Type I, II and III solids: Type I solids; Type II solids; Type III solids; projections; fibres; iterated triple bounds; order reversal
- Cylindrical coordinates: cylindrical conversion; radial distance; azimuth; coordinate surfaces; cylinders; cones; coordinate singularities
- Cylindrical volume elements: cylindrical triple integrals; curved wedges; volume factor; radial integrands; polar projections; density versus Jacobian
- Spherical coordinates: spherical conversion; inclination; azimuth; radial distance; spheres; half-planes; cones and equatorial exception; coordinate convention
- Spherical wedges and radial bounds: spherical volume factor; nice spherical wedges; Type II spherical wedges; variable radial bounds; polar singularities; sphere sectors versus caps

### Lecture 8

- A determinant scales area: linear plane transformations; basis images; parallelograms; determinant geometry; area scaling; orientation; singular maps
- The Jacobian is a local determinant: plane transformations; component functions; Jacobian matrix; Jacobian determinant; local linearization; inverse function theorem; polar Jacobian
- Space transformations and signed Jacobians: space transformations; three-dimensional Jacobian; parallelepipeds; scalar triple product; cylindrical Jacobian; signed spherical Jacobian; coordinate-order sign
- Change of variables in two and three dimensions: change-of-variables theorem; two-variable substitution; three-variable substitution; diffeomorphism; injectivity; transformed bounds; multiplicity; absolute determinant
- When the substitution is given backwards: inverse transformations; inverse Jacobian; chain rule for inverse maps; boundary straightening; substitution strategy
- A scalar field along a curve: scalar fields; scalar line integrals; line Riemann sums; arc length; rectifiable curves; nice parametrizations; smooth curves; reparametrization invariance; orientation independence
- Vector fields assign a direction at every point: vector-field definition; plane fields; space fields; component functions; smooth fields; tangent component; field versus trajectory
- Work and orientation along a curve: vector line integrals; work; orientation; vector Riemann sums; parametrization independence; reversal theorem; closed curves; tangential component

### Lecture 9

- Three differentials, one path: coordinate line integrals; first kind dx; second kind dy; third kind dz; scalar versus vector integrals; orientation
- Assemble a path from pieces: affine parametrization; piecewise-smooth curves; additivity; path concatenation
- Work is tangential accumulation: work; tangential component; circulation; force fields; singular fields
- A potential remembers only endpoints: gradient fields; potential functions; FTLI; path independence; closed-loop integral
- When does zero curl suffice?: conservative tests; simply connected domains; curl-free; potential construction; topological obstruction; Clairaut theorem
- Green’s Theorem: Green theorem; Jordan curve theorem; positive orientation; boundary cancellation; regions with holes
- Measure area from the boundary: area formula; ellipse area; signed area; planimeter

### Lecture 10

- A surface is a two-parameter image: parametric surfaces; parameter domain; surface interior; surface edge; sphere; cylinder; boundary identifications
- Two tangents determine a normal: regular parametrization; rank two; tangent plane; surface normal; smooth surfaces; piecewise-smooth surfaces; coordinate singularities
- A tiny rectangle becomes a parallelogram: surface area; surface Jacobian; nice surfaces; Riemann sums; sphere cap area
- Integrate a density over a surface: scalar surface integral; surface density; graph surfaces; surface area; patch additivity; reparametrization invariance
- Choose a continuous side: orientability; continuous normal field; upward and downward; outward and inward; Mobius strip; global versus local
- Flux measures normal flow: vector surface integrals; flux; vector area element; orientation reversal; open versus closed surfaces

### Lecture 11

- Curl is oriented circulation density: curl; local circulation; right-hand rule; paddlewheel; curl-free fields
- Divergence is local net outflow: divergence; source and sink; divergence-free fields; all dimensions; local versus global
- Successive derivatives cancel: gradient curl divergence; differential identities; cochain complex; linearity; image and kernel; topology
- Stokes’ Theorem: Stokes theorem; induced boundary orientation; surface independence; curl flux; patch cancellation
- Gauss–Ostrogradsky Divergence Theorem: divergence theorem; Gauss Ostrogradsky; closed surfaces; outward orientation; singularity caveat; closing a cap

### Lecture 12

- Review: choose the correct integral theorem: final review; Stokes cone and cylinder; Stokes triangle; Green clockwise triangle; orientation-reversing parametrization; potential method
- Review: straighten four curved boundaries: final review; change of variables; curvilinear rectangle; inverse Jacobian; orientation reversal
- Review: the largest inscribed box: final review; Lagrange multipliers; ellipsoid; inscribed box; global maximum; compactness; AM GM
- Review: classify all six stationary points: final review; stationary points; Hessian; second derivative test; local minimum; local maximum; saddle point; local versus global
- Review: the remainder decides differentiability: final review; total differentiability; Frechet derivative; uniform remainder; partial derivatives; directional derivatives; continuity; counterexample

## Validation

- Independent mathematical review of all 71 entries and all nine exact final-review questions.
- KaTeX parse validation of all main displays and embedded mathematical expressions.
- All 71 main displays inspected in the browser at a 288 px notes-column width; no horizontal overflow. Definitions and hypotheses were also checked for overflow in that fixture.
- All 46 scene families/variants constructed at minimum, initial and maximum parameter values; finite geometry coordinates verified.
- Tested clipping of polynomial and exponential surfaces; excluded vertices no longer affect camera bounds.
- Tested implicit sphere construction and rejection of the false pole surface from 1/(x-0.1).
- Native browser WebMCP lookup, navigation, plotting and parameter updates exercised. Graph tool acknowledgement waits for a rendered frame.
- Multiple visual review passes completed, including the full light-palette redesign, equation layout, local tangent geometry, legends and graph controls.
- The review browser has WebGL disabled. The interactive SVG 3D fallback was browser-tested; the WebGL code path was not hardware-render-tested in this environment.
- Numerical pictures are finite approximations. The graph machine does not prove continuity or completeness of a zero set.

## Course-source corrections

- Differentiability: partial derivatives must exist on a neighborhood and be continuous at the point for the stated sufficient criterion.
- Multiple-constraint Lagrange multipliers: constraint gradients must have full row rank, not merely be individually nonzero.
- Distinguish signed Jacobians from the absolute Jacobian used in integration.
- State regularity, domain, boundary orientation and singularity hypotheses explicitly.
- Generic canonical lab models are distinguished from exact final-review examples.
