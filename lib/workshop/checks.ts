import { parseRational, Rational } from "./rational";
import type { Construction, FieldIssue, MathLine, ProofReport } from "./types";

type Point = readonly [Rational, Rational];
type Parsed =
  | {
      kind: "linear-bound";
      p: Rational;
      q: Rational;
      bound: Rational;
      epsilon: Rational;
    }
  | { kind: "cubic-path"; exponent: number; coefficient: Rational }
  | { kind: "domain-loop"; vertices: readonly Point[] };
const zero = Rational.integer(0),
  one = Rational.integer(1),
  two = Rational.integer(2),
  three = Rational.integer(3);
const line = (tex: string, spoken: string): MathLine => ({ tex, spoken });
const cross = (a: Point, b: Point) =>
  a[0].multiply(b[1]).subtract(a[1].multiply(b[0]));
const dot = (a: Point, b: Point) =>
  a[0].multiply(b[0]).add(a[1].multiply(b[1]));

function parseConstruction(
  input: Construction,
):
  | { kind: "valid"; value: Parsed }
  | { kind: "invalid"; issues: readonly FieldIssue[] } {
  const issues: FieldIssue[] = [];
  const read = (
    raw: string,
    field: string,
    positive = false,
  ): Rational | null => {
    const parsed = parseRational(raw);
    if (parsed.kind === "invalid") {
      issues.push({ field, message: parsed.message });
      return null;
    }
    if (positive && parsed.value.compare(zero) <= 0) {
      issues.push({ field, message: "Use a positive rational number." });
      return null;
    }
    return parsed.value;
  };
  switch (input.kind) {
    case "linear-bound": {
      const p = read(input.p, "p"),
        q = read(input.q, "q"),
        bound = read(input.bound, "bound", true),
        epsilon = read(input.epsilon, "epsilon", true);
      return p && q && bound && epsilon
        ? { kind: "valid", value: { kind: input.kind, p, q, bound, epsilon } }
        : { kind: "invalid", issues };
    }
    case "cubic-path": {
      const coefficient = read(input.coefficient, "coefficient");
      if (!/^[1-6]$/.test(input.exponent.trim()))
        issues.unshift({
          field: "exponent",
          message: "Use an integer exponent from 1 through 6.",
        });
      return coefficient && !issues.length
        ? {
            kind: "valid",
            value: {
              kind: input.kind,
              exponent: Number(input.exponent),
              coefficient,
            },
          }
        : { kind: "invalid", issues };
    }
    case "domain-loop": {
      if (input.vertices.length < 3 || input.vertices.length > 8)
        return {
          kind: "invalid",
          issues: [
            {
              field: "vertex-0-x",
              message: "A polygon needs 3 through 8 ordered vertices.",
            },
          ],
        };
      const vertices: Point[] = [];
      for (const [i, pair] of input.vertices.entries()) {
        const x = read(pair[0], `vertex-${i}-x`),
          y = read(pair[1], `vertex-${i}-y`);
        if (x && y) vertices.push([x, y]);
      }
      if (issues.length) return { kind: "invalid", issues };
      for (const [i, a] of vertices.entries()) {
        const b = vertices[(i + 1) % vertices.length];
        if (a[0].compare(zero) === 0 && a[1].compare(zero) === 0)
          issues.push({
            field: `vertex-${i}-x`,
            message: `Vertex ${i + 1} is the excluded origin. The field is undefined there.`,
          });
        else if (a[0].compare(b[0]) === 0 && a[1].compare(b[1]) === 0)
          issues.push({
            field: `vertex-${i}-x`,
            message: `Edge ${i + 1} repeats adjacent vertices. Use distinct endpoints.`,
          });
        else if (
          cross(a, b).compare(zero) === 0 &&
          dot(a, b).compare(zero) <= 0
        )
          issues.push({
            field: `vertex-${i}-x`,
            message: `Edge ${i + 1} passes through the excluded origin. No ordinary circulation is assigned.`,
          });
      }
      return issues.length
        ? { kind: "invalid", issues }
        : { kind: "valid", value: { kind: input.kind, vertices } };
    }
  }
}

function checkBound(
  input: Extract<Parsed, { kind: "linear-bound" }>,
): ProofReport {
  const { p, q, bound, epsilon } = input;
  const xAxis = p.compare(two) !== 0;
  const residual = xAxis ? two.subtract(p) : Rational.integer(-1).subtract(q);
  if (residual.compare(zero) !== 0) {
    const axis = xAxis ? "x" : "y",
      sign = residual.compare(zero) > 0 ? 1 : -1,
      quadratic = xAxis ? 3 : 1;
    const a = residual.absolute().text();
    return {
      kind: "derivative-obstruction",
      title: "The proposed derivative fails",
      axis,
      sign,
      residual: a,
      quadratic,
      scope:
        "This sequence refutes your proposed linear derivative. The function remains differentiable with L(x,y)=2x−y. It does not claim that every finite epsilon test fails.",
      steps: [
        line(
          String.raw`h_j=${xAxis ? `(${sign}/j,0)` : `(0,${sign}/j)`},\quad r_j=1/j\to0`,
          `Choose the ${axis} coordinate ${sign} divided by j and the other coordinate zero. Its norm is 1/j, tending to zero.`,
        ),
        line(
          String.raw`\frac{|f(h_j)-L(h_j)|}{r_j}=(${a})+\frac{${quadratic}}j\longrightarrow ${a}>0`,
          `The normalized remainder is exactly ${a} plus ${quadratic}/j. Its nonzero limit refutes this derivative.`,
        ),
        line(
          String.raw`j>\frac{${bound.text()}}{(${a})}\ \Longrightarrow\ \frac{|f(h_j)-L(h_j)|}{r_j^2}>${bound.text()}`,
          `For j greater than C divided by ${a}, this sequence also violates the proposed quadratic bound.`,
        ),
      ],
      revisionPrompt:
        "Explain why a signed coordinate sequence refutes this linear map. Distinguish that claim from differentiability of the function.",
    };
  }
  const C = bound.text();
  if (bound.compare(three) < 0)
    return {
      kind: "bound-obstruction",
      title: "This coefficient does not bound the remainder",
      coefficient: C,
      scope:
        "The proposed remainder bound fails arbitrarily close to zero. The derivative L(x,y)=2x−y remains valid.",
      steps: [
        line(
          String.raw`R=3x^2+y^2,\qquad h_j=(1/j,0),\quad r_j=1/j\to0`,
          "With the correct linear map, the remainder is 3x squared plus y squared. Choose h_j=(1/j,0), approaching the origin.",
        ),
        line(
          String.raw`R(h_j)=3/j^2>(${C})/j^2=C r_j^2\quad(j\ge1)`,
          `At every point of this sequence the remainder is 3/j squared, greater than C/j squared because C=${C}<3.`,
        ),
        line(
          String.raw`\frac{R(h_j)}{r_j^2}=3`,
          "The ratio is exactly 3 at every nonzero point of the x-axis. The sharp coefficient is at least 3.",
        ),
      ],
      revisionPrompt:
        "Replace the directional guess with an inequality covering every direction. Which coefficient is sharp?",
    };
  const delta = epsilon.divide(bound).text();
  return {
    kind: "universal-certificate",
    title: "One bound covers every direction",
    coefficient: C,
    epsilon: epsilon.text(),
    delta,
    scope:
      "Universal certificate for this function on the whole plane. The proof covers every positive epsilon; your entered epsilon is one illustration.",
    steps: [
      line(
        String.raw`L(x,y)=2x-y,\qquad R=f-L=3x^2+y^2,\quad r=\sqrt{x^2+y^2}`,
        "The remainder after subtracting L=2x−y is 3x squared plus y squared. Use the Euclidean norm r.",
      ),
      line(
        String.raw`0\le R\le 3(x^2+y^2)\le (${C})r^2`,
        `For every real x and y, zero is at most R, R is at most 3 times r squared, and 3 is at most C=${C}.`,
      ),
      line(
        String.raw`\forall\varepsilon>0:\quad\delta(\varepsilon)=\frac{\varepsilon}{(${C})}>0,\quad 0<r<\delta\ \Longrightarrow\ \frac{|R|}{r}\le (${C})r<\varepsilon`,
        "For every positive epsilon choose delta=epsilon/C. Every nonzero displacement of norm less than delta has normalized remainder at most C times its norm, strictly less than epsilon.",
      ),
      line(
        String.raw`\varepsilon=${epsilon.text()}\quad\Longrightarrow\quad\delta=${delta}`,
        `For the entered epsilon ${epsilon.text()}, delta is exactly ${delta}.`,
      ),
    ],
    revisionPrompt:
      "Identify the step covering all directions. Explain why the open input ball gives a strict error inequality, including C=3.",
  };
}

function checkPath(
  input: Extract<Parsed, { kind: "cubic-path" }>,
): ProofReport {
  const { exponent: n, coefficient: k } = input;
  const K = k.text();
  if (n !== 3 || k.compare(zero) === 0) {
    const tex =
      k.compare(zero) === 0
        ? String.raw`g(t,0)=0`
        : n < 3
          ? String.raw`g(t,(${K})t^{${n}})=\frac{(${K})t^{${3 - n}}}{t^{${6 - 2 * n}}+(${K})^2}\longrightarrow0`
          : String.raw`g(t,(${K})t^{${n}})=\frac{(${K})t^{${n - 3}}}{1+(${K})^2t^{${2 * n - 6}}}\longrightarrow0`;
    return {
      kind: "restricted-path",
      title: "Your path has limit zero",
      exponent: n,
      coefficient: K,
      scope:
        "Exact result for this submitted path only. This construction leaves the unrestricted limit unresolved.",
      steps: [
        line(
          String.raw`\gamma(t)=(t,(${K})t^{${n}})\to(0,0)\quad(t\to0^+)`,
          `The path is (t, ${K} times t to the power ${n}). It approaches the origin as positive t tends to zero.`,
        ),
        line(
          tex,
          k.compare(zero) === 0
            ? "The restriction is identically zero because k=0."
            : `After canceling powers of t, the numerator has a positive power of t and the denominator tends to a positive constant. Therefore the restriction tends to zero for n=${n}, k=${K}.`,
        ),
        line(
          String.raw`\text{One path limit is not an all-point limit.}`,
          "A zero limit on one chosen path cannot establish the limit over all nearby points.",
        ),
      ],
      revisionPrompt:
        "What did this path prove? Balance the two denominator orders and construct another path.",
    };
  }
  const constant = k.divide(one.add(k.multiply(k))),
    epsilon0 = constant.absolute().divide(two);
  return {
    kind: "path-obstruction",
    title: "Your path defeats the full limit",
    constant: constant.text(),
    epsilon0: epsilon0.text(),
    coefficient: K,
    scope:
      "The unrestricted limit does not exist. The x-axis has limit zero; your submitted cubic path has a different, nonzero limit.",
    steps: [
      line(
        String.raw`g(t,(${K})t^3)=\frac{(${K})t^6}{(1+(${K})^2)t^6}=\frac{(${K})}{1+(${K})^2}=${constant.text()}\ne0`,
        `On this path, cancellation gives the exact nonzero constant ${constant.text()}. No rounding determines whether it is zero.`,
      ),
      line(
        String.raw`g(t,0)=0,\qquad\varepsilon_0=\frac{|${constant.text()}|}{2}=${epsilon0.text()}>0`,
        `The x-axis gives zero. Choose epsilon zero equal to half the absolute constant, exactly ${epsilon0.text()}.`,
      ),
      line(
        String.raw`\forall\delta>0:\quad t=\min\left(1,\frac{\delta}{2(1+|${K}|)}\right)>0`,
        `For any positive delta choose t as the smaller of 1 and delta divided by 2 times (1+|${K}|).`,
      ),
      line(
        String.raw`0<\|\gamma(t)\|\le t+|${K}|t^3\le(1+|${K}|)t\le\delta/2<\delta`,
        "Since 0<t≤1, the norm is at most t+|k|t cubed, at most (1+|k|)t, at most delta/2, strictly less than delta. This includes the branch t=1.",
      ),
      line(
        String.raw`|g(\gamma(t))|=|${constant.text()}|>\varepsilon_0`,
        "The error stays greater than epsilon zero inside every positive delta ball. Alongside the axis limit zero, this rules out every possible full limit.",
      ),
    ],
    revisionPrompt:
      "Explain both the arbitrary-delta witness and why the zero axis limit rules out a different full-limit value.",
  };
}

function checkLoop(
  input: Extract<Parsed, { kind: "domain-loop" }>,
): ProofReport {
  const crossings = input.vertices.map((a, i) => {
    const b = input.vertices[(i + 1) % input.vertices.length],
      sign = cross(a, b).compare(zero);
    if (a[1].compare(zero) <= 0 && b[1].compare(zero) > 0 && sign > 0) return 1;
    if (b[1].compare(zero) <= 0 && a[1].compare(zero) > 0 && sign < 0)
      return -1;
    return 0;
  });
  const winding: number = crossings.reduce<number>(
    (sum, value) => sum + value,
    0,
  );
  const circulation = winding === 0 ? "0" : `${4 * winding}π`;
  return {
    kind: winding === 0 ? "one-loop-only" : "loop-obstruction",
    winding,
    circulation,
    crossings,
    title:
      winding === 0
        ? "Zero circulation for this loop"
        : "Your loop obstructs a global potential",
    scope:
      winding === 0
        ? "This valid loop has zero integral. It establishes no global potential claim on the punctured plane."
        : "This valid closed loop has nonzero circulation, so the field has no global potential on the punctured plane.",
    steps: [
      line(
        String.raw`a\times b\ne0\ \text{or}\ a\cdot b>0\quad\text{on every edge}`,
        "Every edge avoids the origin. Exactly: a segment contains zero if and only if its endpoint cross product is zero and its endpoint dot product is nonpositive. All submitted edges passed this test.",
      ),
      line(
        String.raw`w=${crossings.map((value) => `(${value})`).join("+")}=${winding}`,
        "The half-open positive-ray crossing contributions, in edge order, are " +
          crossings.join(", ") +
          `. Their sum is the winding number ${winding}.`,
      ),
      line(
        String.raw`d\theta=\frac{-y\,dx+x\,dy}{x^2+y^2},\qquad F\cdot dr=2\,d\theta`,
        "On a neighborhood avoiding zero, choose a smooth angle branch. Differentiating it gives d theta=(-y dx+x dy)/(x squared+y squared). The field form is twice this angle differential.",
      ),
      line(
        String.raw`\Delta\theta=2\pi w,\qquad\oint F\cdot dr=4\pi w`,
        "Continue the angle along the ordered edges, matching branches on overlaps. Closure changes the continued angle by 2 pi times its signed positive-ray crossings. Half-open endpoints count each passage once; ray tangencies cancel. Self-intersections are allowed. Thus the integral is 4 pi times w.",
      ),
      line(
        String.raw`\oint F\cdot dr=${winding === 0 ? "0" : `${4 * winding}\pi`}`,
        `The exact circulation of this polygon is ${circulation}. ${winding === 0 ? "Zero for this loop alone cannot prove that a global potential exists." : "A gradient integrates to zero around every closed path, so this nonzero integral rules out a global potential."}`,
      ),
    ],
    revisionPrompt:
      winding === 0
        ? "State what this zero integral proves and what it leaves open. Construct another loop if you want an obstruction."
        : "Explain why zero curl on this domain does not override your nonzero closed-loop integral.",
  };
}

export function inspectConstruction(
  input: Construction,
):
  | { kind: "valid"; report: ProofReport }
  | { kind: "invalid"; issues: readonly FieldIssue[] } {
  const parsed = parseConstruction(input);
  if (parsed.kind === "invalid") return parsed;
  const construction = parsed.value;
  switch (construction.kind) {
    case "linear-bound":
      return { kind: "valid", report: checkBound(construction) };
    case "cubic-path":
      return { kind: "valid", report: checkPath(construction) };
    case "domain-loop":
      return { kind: "valid", report: checkLoop(construction) };
  }
}
