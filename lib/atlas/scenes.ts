export type SceneInfo = {
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  formula: string;
  readout: (p: number) => string;
  legend: string[];
  note: string;
};
const f = (n: number) => Number(n.toFixed(3)).toString();
const angle = {
  label: "Angle θ",
  min: 0,
  max: 2 * Math.PI,
  step: 0.01,
  initial: 0.8,
};
const base: SceneInfo = {
  ...angle,
  formula: "",
  readout: (p) => `θ = ${f(p)} rad`,
  legend: ["Surface", "Selected geometry"],
  note: "Drag to orbit · Scroll or pinch to zoom",
};
function rawSceneInfo(id: string): SceneInfo {
  const configs: Record<string, Partial<SceneInfo>> = {
    reviewBox: {
      label: "Normalized half-length X",
      min: 0.05,
      max: 0.98,
      step: 0.01,
      initial: 1 / Math.sqrt(3),
      formula: "2x²+72y²+18z²=288",
      readout: (p) => `V=${f(384 * p * (1 - p * p))}`,
      legend: ["Exact ellipsoid", "Inscribed box"],
      note: "Exact ellipsoid and a family of inscribed boxes with equal normalized $Y$ and $Z$. The proof compares all boxes; this one-parameter family alone does not prove optimality.",
    },
    reviewCritical: {
      label: "Stationary point index",
      min: 0,
      max: 5,
      step: 1,
      initial: 0,
      formula: "f=x⁴−2x²+y³−3y",
      readout: (p) => `Selected point ${p + 1} of 6`,
      legend: ["Exact review surface", "Stationary points", "Selected point"],
      note: "Exact polynomial, sampled and height-clipped to $\\pm8$. All six stationary points are marked; their exact classification is stated in the lesson.",
    },
    chainNonconstant: {
      label: "Parameter t",
      min: -1,
      max: 1,
      step: 0.01,
      initial: 0.5,
      formula: "r(t)=(t,t²), f=x²+y²",
      readout: (p) => `output derivative=${f(2 * p + 4 * p ** 3)}`,
      legend: ["Bowl", "Nonconstant lifted path", "Velocity"],
      note: "The path has varying height. Its two partial-derivative contributions add to the displayed rate.",
    },
    fluxOblique: {
      ...angle,
      formula: "F=(1,0,0), sphere of radius 1",
      readout: (p) => `F·n=${f(Math.cos(p))}`,
      legend: ["Sphere", "Constant field", "Selected normal"],
      note: "Constant horizontal flow enters one hemisphere and leaves the other. The total outward flux is zero although local flux changes sign.",
    },

    curves: {
      label: "Parameter t",
      min: -Math.PI,
      max: Math.PI,
      initial: 0.6,
      formula: "r(t)=(cos t, sin t, t)",
      readout: (p) =>
        `r(t) = (${f(Math.cos(p))}, ${f(Math.sin(p))}, ${f(p)}) · speed = √2`,
      legend: ["Curve $r(t)$", "Tangent $r\\prime(t)$", "Current point"],
    },
    arc: {
      label: "Upper limit t",
      min: 0,
      max: 2 * Math.PI,
      initial: 3,
      formula: "r(t)=(cos t, sin t, t)",
      readout: (p) => `Length from 0 to t = √2 t = ${f(Math.SQRT2 * p)}`,
      legend: ["Whole curve", "Traversed arc"],
    },
    surface: {
      label: "Level c",
      min: 0,
      max: 4,
      initial: 1.5,
      formula: "z = x² + y²",
      readout: (p) =>
        `Level z = ${f(p)} · circle radius = √c = ${f(Math.sqrt(p))}`,
      legend: ["Graph $z=f(x,y)$", "Level curve", "Projection to domain"],
    },
    limits: {
      ...angle,
      formula: "f(x,y) = xy / (x²+y²)",
      readout: (p) =>
        `Along angle θ: f(r cosθ,r sinθ) = ${f(Math.cos(p) * Math.sin(p))}`,
      legend: [
        "Graph (origin excluded)",
        "Lifted approach ray",
        "Domain direction",
      ],
    },
    hiddenpath: {
      label: "Parabola coefficient k",
      min: -2,
      max: 2,
      initial: 1,
      formula: "f(x,y) = x²y / (x⁴+y²)",
      readout: (p) => `Along y=kx²: f = k/(1+k²) = ${f(p / (1 + p * p))}`,
      legend: ["Graph (origin excluded)", "Curved approach $y=kx^2$"],
    },
    partial: {
      label: "Slice y=b",
      min: -1.5,
      max: 1.5,
      initial: 0.5,
      formula: "z = x² + y²",
      readout: (p) => `Slice: z=x²+${f(p * p)} · ∂f/∂x at (1,b) = 2`,
      legend: ["Surface", "Slice curve", "Partial tangent"],
    },
    tangent: {
      label: "Neighborhood radius r",
      min: 0.05,
      max: 1.2,
      initial: 0.7,
      formula: "f=x²+y²; L=2x+2y−2 at (1,1)",
      readout: (p) => `At distance r: |f−L|/r = r = ${f(p)}`,
      legend: ["Surface", "Tangent plane", "Remainder segment"],
    },
    taylor: {
      label: "Neighborhood radius r",
      min: 0.05,
      max: 1.2,
      initial: 0.7,
      formula: "f(p+h)=f(p)+∇f(p)·h+‖h‖²",
      readout: (p) => `Linear error = r² = ${f(p * p)} · quadratic error = 0`,
      legend: ["Surface", "First-order approximation", "Remainder"],
    },
    differential: {
      ...angle,
      formula: "f=x³/(x²+y²), f(0,0)=0",
      readout: (p) =>
        `Dᵤf(0)=cos³θ=${f(Math.cos(p) ** 3)} · candidate Df·u=cosθ=${f(Math.cos(p))}`,
      legend: [
        "Continuous graph",
        "Directional slice",
        "Candidate plane $z=x$",
      ],
    },
    extrema: {
      label: "Curvature coefficient a",
      min: -1.5,
      max: 1.5,
      initial: -1,
      formula: "f(x,y)=x²+a y²",
      readout: (p) =>
        p > 0
          ? `a=${f(p)}: strict minimum · det H = ${f(4 * p)}`
          : p < 0
            ? `a=${f(p)}: saddle · det H = ${f(4 * p)}`
            : "a=0: degenerate · non-strict minima along x=0",
      legend: ["Quadratic surface", "$x$-section", "$y$-section"],
    },
    gradient: {
      ...angle,
      formula: "f=x²+y² at p=(1,1)",
      readout: (p) =>
        `Dᵤf(p)=2cosθ+2sinθ=${f(2 * Math.cos(p) + 2 * Math.sin(p))}`,
      legend: [
        "Surface",
        "Direction $u$",
        "Gradient $\\nabla f$",
        "Directional tangent",
      ],
    },
    chain: {
      ...angle,
      formula: "r(t)=(cos t,sin t); f=x²+y²",
      readout: () => `f(r(t)) = 1 · ∇f(r(t))·r′(t) = 0`,
      legend: ["Graph", "Lifted circular path", "Velocity"],
    },
    lagrange: {
      ...angle,
      formula: "f=x+y, x²+y²=1",
      readout: (p) =>
        `f = cosθ+sinθ = ${f(Math.cos(p) + Math.sin(p))} · range [−√2,√2]`,
      legend: [
        "Constraint circle",
        "Objective height $x+y$",
        "$\\nabla f$",
        "$\\nabla g$",
      ],
    },
    constraintSphere: {
      ...angle,
      formula: "f=x+y+z, x²+y²+z²=1",
      readout: (p) =>
        `Along meridian: f = √2 sinθ+cosθ = ${f(Math.SQRT2 * Math.sin(p) + Math.cos(p))} · extrema ±√3`,
      legend: ["Unit sphere", "Selected point", "Objective direction"],
    },
    constraintTwo: {
      ...angle,
      formula: "f=x+y, x²+y²+z²=1, z=0",
      readout: (p) =>
        `f = ${f(Math.cos(p) + Math.sin(p))} · ∇g and ∇h are independent on the circle`,
      legend: [
        "Sphere",
        "Plane $z=0$",
        "Feasible circle",
        "Objective direction",
      ],
    },
    riemann: {
      label: "Subdivisions per axis n",
      min: 2,
      max: 18,
      step: 1,
      initial: 6,
      formula: "f=3−(x²+y²)/2 on [−1,1]²",
      readout: (p) =>
        `Midpoint sum = 32/3 + 4/(3n²) = ${f(32 / 3 + 4 / (3 * p * p))} · integral = 32/3`,
      legend: ["Midpoint columns", "Exact surface"],
    },
    double: {
      label: "Outer slice x",
      min: 0,
      max: 2,
      initial: 0.8,
      formula: "0≤x≤2, 0≤y≤2−x; z=1+x+y",
      readout: (p) => `At x=${f(p)}: 0≤y≤${f(2 - p)} · total volume = 14/3`,
      legend: [
        "Height surface",
        "Triangular region",
        "Inner integration slice",
      ],
    },
    polar: {
      label: "Sector angle θ",
      min: 0.05,
      max: 2 * Math.PI,
      initial: 2.1,
      formula: "x=r cosθ, y=r sinθ; dA=r dr dθ",
      readout: (p) => `Sector radius 2 · area = 2θ = ${f(2 * p)}`,
      legend: ["Disk sector", "Radial lines", "Outer arc"],
    },
    triple: {
      label: "Slice height z",
      min: 0,
      max: 2,
      initial: 1,
      formula: "0≤z≤2−x²−y²",
      readout: (p) =>
        `Cross-section area = π(2−z) = ${f(Math.PI * (2 - p))} · volume = 2π`,
      legend: ["Solid boundary", "Horizontal cross-section"],
    },
    cylindrical: {
      label: "Wedge angle θ",
      min: 0.05,
      max: 2 * Math.PI,
      initial: 2.1,
      formula: "x=r cosθ, y=r sinθ, z=z; dV=r dr dθ dz",
      readout: (p) => `Radius 1, height 2 · wedge volume = θ = ${f(p)}`,
      legend: ["Cylindrical wedge", "Vertical direction"],
    },
    spherical: {
      label: "Polar cap angle φ",
      min: 0.05,
      max: Math.PI,
      initial: 1.2,
      formula: "x=ρ sinφ cosθ, y=ρ sinφ sinθ, z=ρ cosφ",
      readout: (p) =>
        `ρ≤2, 0≤φ≤α · sector volume = (16π/3)(1−cosα) = ${f(((16 * Math.PI) / 3) * (1 - Math.cos(p)))}`,
      legend: ["Spherical sector", "Polar rays", "Latitude boundary"],
    },
    jacobian: {
      label: "Deformation s",
      min: 0,
      max: 1,
      initial: 1,
      formula: "T(u,v)=(2u+v,u+2v)",
      readout: (p) =>
        `Tₛ=((1+s)u+sv,su+(1+s)v) · area factor = 1+2s = ${f(1 + 2 * p)}`,
      legend: [
        "Original unit square",
        "Transformed grid",
        "Coordinate directions",
      ],
    },
    lineScalar: {
      label: "Upper angle t",
      min: 0,
      max: 2 * Math.PI,
      initial: 3.14,
      formula: "r(t)=(cos t,sin t,0), f=2+x",
      readout: (p) => `∫₀ᵗ (2+cos s) ds = 2t+sin t = ${f(2 * p + Math.sin(p))}`,
      legend: ["Curve in domain", "Density curtain", "Accumulated arc"],
    },
    lineintegral: {
      label: "Upper angle t",
      min: 0,
      max: 2 * Math.PI,
      initial: 3.14,
      formula: "F=(−y,x,0); r(t)=(cos t,sin t,0)",
      readout: (p) => `F(r(t))·r′(t)=1 · work from 0 to t = ${f(p)}`,
      legend: ["Vector field", "Oriented unit circle", "Traversed path"],
    },
    field: {
      label: "Radial component a",
      min: 0,
      max: 1,
      initial: 0,
      formula: "Fₐ=(−(1−a)y+ax,(1−a)x+ay,az)",
      readout: (p) =>
        `div F = 3a = ${f(3 * p)} · curl F = (0,0,${f(2 * (1 - p))})`,
      legend: ["Vector field", "Reference circle"],
    },
    conservative: {
      label: "Path parameter t",
      min: 0,
      max: 1,
      initial: 0.6,
      formula: "F=∇φ=(2x,2y,2z), φ=x²+y²+z²",
      readout: (p) =>
        `r(t)=(t,t²,0) · φ(r(t))−φ(0) = t²+t⁴ = ${f(p * p + p ** 4)}`,
      legend: ["Gradient field", "Curved path", "Straight comparison path"],
    },
    green: {
      label: "Boundary angle t",
      min: 0,
      max: 2 * Math.PI,
      initial: 4,
      formula: "F=(−y/2,x/2,0); curl F=(0,0,1)",
      readout: (p) =>
        `Partial boundary integral = t/2 = ${f(p / 2)} · full circulation = area = π`,
      legend: ["Unit disk", "Positive boundary", "Traversed arc"],
    },
    parametric: {
      label: "Polar angle u",
      min: 0.1,
      max: 3.04,
      initial: 1.1,
      formula: "r(u,v)=(2sin u cos v,2sin u sin v,2cos u)",
      readout: (p) => `At azimuth v=0.7: ‖rᵤ×rᵥ‖=4sin u=${f(4 * Math.sin(p))}`,
      legend: [
        "Sphere",
        "Coordinate curves",
        "Tangent vectors",
        "Outward normal",
      ],
    },
    flux: {
      label: "Cap polar angle α",
      min: 0.05,
      max: Math.PI,
      initial: 1.57,
      formula: "F=(x,y,z), S: x²+y²+z²=4",
      readout: (p) =>
        `Outward cap flux = 16π(1−cosα) = ${f(16 * Math.PI * (1 - Math.cos(p)))}`,
      legend: ["Oriented cap", "Outward field / normals", "Cap boundary"],
    },
    stokes: {
      label: "Surface deformation h",
      min: 0,
      max: 2,
      initial: 1,
      formula: "Sₕ: z=h(1−x²−y²), x²+y²≤1",
      readout: (p) => `h=${f(p)} · ∮ F·dr = ∬ curl F·n dS = π`,
      legend: [
        "Spanning surface",
        "Counterclockwise boundary",
        "Upward orientation",
      ],
    },
    divergence: {
      label: "Sphere radius R",
      min: 0.3,
      max: 2,
      initial: 2,
      formula: "F=(x,y,z), div F=3",
      readout: (p) =>
        `Outward flux = 4πR³ = ${f(4 * Math.PI * p ** 3)} = 3 × volume`,
      legend: ["Closed sphere", "Outward flux", "Volume cross-section"],
    },
  };
  return { ...base, ...configs[id] };
}
export function sceneInfo(id: string): SceneInfo {
  const more: Record<string, Partial<SceneInfo>> = {
    vectors: {
      ...angle,
      formula: "",
      readout: (p) =>
        `u·v = cos θ = ${f(Math.cos(p))} · ‖u+v‖ = ${f(Math.sqrt(2 + 2 * Math.cos(p)))}`,
      legend: ["Sum $u+v$", "Vector $v$", "Vector $u$", "Angle"],
    },
    elementarycurves: {
      label: "Parameter t",
      min: 0,
      max: 2 * Math.PI,
      initial: 1.8,
      readout: (p) =>
        `Cycloid point = (${f(p - Math.sin(p))}, ${f(1 - Math.cos(p))}) · speed = ${f(2 * Math.abs(Math.sin(p / 2)))}`,
      legend: ["Cycloid", "Moving point / tangent", "Rolling circle"],
    },
    curveCircle: {
      ...angle,
      readout: (p) =>
        `r(t) = (${f(Math.cos(p))},${f(Math.sin(p))},0) · speed = 1`,
      legend: ["Circle", "Position / tangent"],
    },
    curveEllipse: {
      ...angle,
      readout: (p) =>
        `r(t) = (${f(2 * Math.cos(p))},${f(Math.sin(p))},0) · speed = ${f(Math.sqrt(4 * Math.sin(p) ** 2 + Math.cos(p) ** 2))}`,
      legend: ["Ellipse", "Position / tangent"],
    },
    curveCusp: {
      label: "Parameter t",
      min: -1,
      max: 1,
      initial: 0.3,
      readout: (p) =>
        `r′(t)=(3t²,2t) = (${f(3 * p * p)},${f(2 * p)}) · r′(0)=0`,
      legend: ["Cusp", "Position / tangent"],
    },
    curveLine: {
      label: "Parameter t",
      min: -2,
      max: 2,
      initial: 0.5,
      readout: (p) => `r(t)=(${f(p)},0,0) · velocity = (1,0,0)`,
      legend: ["Line", "Position / tangent"],
    },
    topology: {
      label: "Probe coordinate s",
      min: -1.5,
      max: 1.5,
      initial: 0.5,
      readout: (p) =>
        Math.abs(p) < 1
          ? `Interior point · distance to boundary = ${f(1 - Math.abs(p))} · neighborhood radius = 0.25`
          : Math.abs(p) === 1
            ? "Boundary point; excluded from the open disk"
            : "Exterior point; outside the closed unit disk",
      legend: [
        "Open disk (boundary shown)",
        "Open neighborhood boundary",
        "Probe displacement",
      ],
    },
    epsilon: {
      label: "Tolerance ε",
      min: 0.02,
      max: 3,
      initial: 1,
      readout: (p) =>
        `Choose δ=√ε=${f(Math.sqrt(p))}; 0<‖(x,y)‖<δ implies |f(x,y)|<ε`,
      legend: [
        "Paraboloid",
        "Height $\\varepsilon$",
        "Input disk radius $\\delta$",
      ],
    },
    squeeze: {
      label: "Approach radius r",
      min: 0.02,
      max: 1.2,
      initial: 0.6,
      readout: (p) =>
        `On the radius-r circle, |f|≤3r=${f(3 * p)}. This bound tends to zero.`,
      legend: [
        "Rational surface",
        "Values on circle",
        "Bounding planes $\\pm3r$",
      ],
    },
    infinity: {
      label: "Exclusion radius N",
      min: 0.4,
      max: 4.5,
      initial: 1,
      readout: (p) =>
        `Outside r>N, |f|≤1/r<1/N=${f(1 / p)}. Finite window ends at r=5.`,
      legend: ["Exterior graph", "Exclusion circle", "Tail envelope $\\pm1/N$"],
    },
    cross: {
      label: "Normal orientation",
      min: -1,
      max: 1,
      step: 2,
      initial: 1,
      readout: (p) =>
        p < 0
          ? "Reversed order: b×a=(2,2,−1)"
          : "a×b=(−2,−2,1); perpendicular to both tangent directions",
      legend: [
        "Paraboloid",
        "First tangent $a$",
        "Normal / tangent plane",
        "Second tangent $b$",
      ],
    },
    implicit: {
      label: "Polar angle α",
      min: 0,
      max: Math.PI / 2,
      initial: 0.5,
      readout: (p) =>
        `F_z(p)=2cosα=${f(2 * Math.cos(p))}. At α=π/2, solve locally for x instead of z.`,
      legend: ["Sphere", "Tangent plane", "Normal", "Vertical projection"],
    },
    mixed: {
      label: "Slice y=b",
      min: -1.2,
      max: 1.2,
      initial: 0.6,
      readout: (p) => `At x=1: f_x=2b=${f(2 * p)}; its y-derivative is f_xy=2`,
      legend: ["Surface $x^2y$", "$x$-slice", "Slope tangent"],
    },
    global: {
      label: "Boundary traversal t",
      min: 0,
      max: 4,
      initial: 0.5,
      readout: () =>
        `Absolute min = 0 at (0,0),(2,2); max = 9 at (3,0); interior (1,1) is a saddle.`,
      legend: [
        "Graph on rectangle",
        "Boundary probe",
        "Boundary curves",
        "Critical / extremal points",
      ],
    },
    vortex: {
      label: "Boundary angle t",
      min: 0,
      max: 2 * Math.PI,
      initial: 3.14,
      readout: (p) =>
        `Curl is zero off the origin; partial circulation = t = ${f(p)}, full loop = 2π`,
      legend: [
        "Reference circle",
        "Traversed arc",
        "Punctured-domain field",
        "Excluded origin",
      ],
    },
    mobius: {
      label: "Transport angle t",
      min: 0,
      max: 2 * Math.PI,
      initial: 0.4,
      readout: (p) =>
        `After one circuit, the transported normal reverses: n(2π)=−n(0). t=${f(p)}`,
      legend: ["Möbius strip", "Transported local normal", "Center circle"],
    },
  };
  if (id === "directional") return sceneInfo("gradient");
  if (id === "curveCycloid") return sceneInfo("elementarycurves");
  const v = more[id] ? { ...base, ...more[id] } : rawSceneInfo(id);
  return { ...v, readout: (p) => v.readout(v.step === 1 ? Math.round(p) : p) };
}
export function legendColors(id: string) {
  const maps: Record<string, string[]> = {
    reviewBox: ["#9bdfff", "#f28743"],
    reviewCritical: ["#9bdfff", "#8a74cd", "#f28743"],
    fluxOblique: ["#9bdfff", "#8a74cd", "#f28743"],
    curves: ["#9bdfff", "#f28743", "#f28743"],
    tangent: ["#9bdfff", "#8a74cd", "#f28743"],
    taylor: ["#9bdfff", "#8a74cd", "#f28743"],
    partial: ["#9bdfff", "#f28743", "#ffbad4"],
    gradient: ["#9bdfff", "#f28743", "#ffbad4", "#f28743"],
    directional: ["#9bdfff", "#f28743", "#ffbad4", "#f28743"],
    parametric: ["#9bdfff", "#f28743", "#ffbad4", "#8a74cd"],
    divergence: ["#9bdfff", "#8a74cd", "#8a74cd"],
    flux: ["#9bdfff", "#8a74cd", "#f28743"],
    double: ["#9bdfff", "#8a74cd", "#f28743"],
    triple: ["#9bdfff", "#f28743"],
    field: ["#8a74cd", "#9bdfff"],
    lineintegral: ["#8a74cd", "#9bdfff", "#f28743"],
    conservative: ["#8a74cd", "#9bdfff", "#ffbad4"],
    green: ["#9bdfff", "#8a74cd", "#f28743"],
    lagrange: ["#f28743", "#9bdfff", "#ffbad4", "#8a74cd"],
    jacobian: ["#8a74cd", "#9bdfff", "#f28743"],
    lineScalar: ["#8a74cd", "#9bdfff", "#f28743"],
    mixed: ["#9bdfff", "#f28743", "#ffbad4"],
  };
  return maps[id] || ["#9bdfff", "#f28743", "#8a74cd", "#ffbad4"];
}
export function sceneTex(id: string) {
  const m: Record<string, string> = {
    reviewBox: String.raw`x^2/144+y^2/4+z^2/16=1,\quad V=8xyz`,
    reviewCritical: String.raw`f=x^4-2x^2+y^3-3y`,
    chainNonconstant: String.raw`f(r(t))=t^2+t^4,\quad (f\circ r)'=2t+4t^3`,
    fluxOblique: String.raw`\mathbf F=(1,0,0),\quad\mathbf F\cdot\mathbf n=\cos t`,
    vectors: String.raw`u=(1,0,0),\quad v=(\cos\theta,\sin\theta,0)`,
    curves: String.raw`r(t)=(\cos t,\sin t,t)`,
    arc: String.raw`L(t)=\int_0^t\|r'(s)\|\,ds=\sqrt2\,t`,
    elementarycurves: String.raw`r(t)=(t-\sin t,1-\cos t,0)`,
    curveCycloid: String.raw`r(t)=(t-\sin t,1-\cos t,0)`,
    curveCircle: String.raw`r(t)=(\cos t,\sin t,0)`,
    curveEllipse: String.raw`r(t)=(2\cos t,\sin t,0)`,
    curveCusp: String.raw`r(t)=(t^3,t^2,0)`,
    curveLine: String.raw`r(t)=(t,0,0)`,
    surface: String.raw`z=x^2+y^2,\quad z=c\iff x^2+y^2=c`,
    topology: String.raw`D=\{(x,y):x^2+y^2<1\},\quad p=(s,0)`,
    epsilon: String.raw`f=x^2+y^2,\quad \delta=\sqrt\varepsilon`,
    limits: String.raw`f(x,y)=\frac{xy}{x^2+y^2}\quad ((x,y)\ne0)`,
    hiddenpath: String.raw`f=\frac{x^2y}{x^4+y^2},\quad y=kx^2`,
    squeeze: String.raw`f=\frac{3x^2y}{x^2+y^2},\quad |f|\le3\sqrt{x^2+y^2}`,
    infinity: String.raw`f=\frac{x}{x^2+y^2},\quad |f|\le\frac1r`,
    partial: String.raw`f=x^2+y^2,\quad f_x(1,b)=2`,
    tangent: String.raw`f=x^2+y^2,\quad L_{(1,1)}=2x+2y-2`,
    taylor: String.raw`f(p+h)=f(p)+Df(p)h+\|h\|^2`,
    differential: String.raw`f=\frac{x^3}{x^2+y^2},\quad f(0,0)=0`,
    cross: String.raw`a=(1,0,2),\ b=(0,1,2),\ a\times b=(-2,-2,1)`,
    implicit: String.raw`F=x^2+y^2+z^2-1,\quad \nabla F(p)=2p`,
    directional: String.raw`D_uf(1,1)=2\cos\theta+2\sin\theta`,
    gradient: String.raw`f=x^2+y^2,\quad \nabla f(1,1)=(2,2)`,
    chain: String.raw`f(r(t))=1,\quad \nabla f(r(t))\cdot r'(t)=0`,
    extrema: String.raw`f(x,y)=x^2+a y^2,\quad H=\operatorname{diag}(2,2a)`,
    mixed: String.raw`f=x^2y,\quad f_x=2xy,\quad f_{xy}=2x`,
    global: String.raw`f=x^2-2xy+2y,\quad (x,y)\in[0,3]\times[0,2]`,
    lagrange: String.raw`f=x+y,\quad x^2+y^2=1`,
    constraintSphere: String.raw`f=x+y+z,\quad x^2+y^2+z^2=1`,
    constraintTwo: String.raw`f=x+y,\quad x^2+y^2+z^2=1,\ z=0`,
    riemann: String.raw`f=3-\tfrac12(x^2+y^2),\quad D=[-1,1]^2`,
    double: String.raw`z=1+x+y,\quad 0\le x\le2,\ 0\le y\le2-x`,
    polar: String.raw`x=r\cos\theta,\ y=r\sin\theta,\quad dA=r\,dr\,d\theta`,
    triple: String.raw`E=\{(x,y,z):0\le z\le2-x^2-y^2\}`,
    cylindrical: String.raw`0\le r\le1,\ 0\le z\le2,\quad dV=r\,dr\,d\theta\,dz`,
    spherical: String.raw`x=\rho\sin\varphi\cos\theta,\ y=\rho\sin\varphi\sin\theta,\ z=\rho\cos\varphi`,
    jacobian: String.raw`T_s(u,v)=((1+s)u+sv,su+(1+s)v)`,
    lineScalar: String.raw`r(t)=(\cos t,\sin t,0),\quad f=2+x`,
    lineintegral: String.raw`F=(-y,x,0),\quad r(t)=(\cos t,\sin t,0)`,
    conservative: String.raw`F=\nabla\phi=(2x,2y,2z),\quad \phi=x^2+y^2+z^2`,
    field: String.raw`F_a=(-(1-a)y+ax,(1-a)x+ay,az)`,
    green: String.raw`F=(-y/2,x/2,0),\quad D=\{x^2+y^2\le1\}`,
    parametric: String.raw`r(u,v)=(2\sin u\cos v,2\sin u\sin v,2\cos u)`,
    flux: String.raw`F=(x,y,z),\quad S:\ x^2+y^2+z^2=4`,
    stokes: String.raw`F=(-y/2,x/2,0),\quad S_h:\ z=h(1-x^2-y^2)`,
    divergence: String.raw`F=(x,y,z),\quad \iint_{\partial B_R} F\cdot n\,dS=4\pi R^3`,
    vortex: String.raw`F=\frac{(-y,x,0)}{x^2+y^2},\quad \oint_C F\cdot dr=2\pi`,
    mobius: String.raw`r(u,v)=((1+v\cos\tfrac u2)\cos u,(1+v\cos\tfrac u2)\sin u,v\sin\tfrac u2)`,
  };
  return m[id] || "";
}
