import { createDrawing, ink, orange, blue, decimal, tex } from "./drawing";
export function functionsModel(id: string, value?: number) {
  const { m, line, point, segment, config } = createDrawing(value);
  let p = value ?? m.initial;
  switch (id) {
    case "plane-domain":
      p = config("Domain endpoint", "a", -2, 2, 0);
      m.bounds = [-3, 4, -1, 3];
      m.formula = tex`f_a(x)=\sqrt{x-a},\quad x\ge a`;
      line((x) => Math.sqrt(x - p), p, 4, "Square-root graph");
      point(p, 0, "Included endpoint");
      m.readout = tex`D=[${decimal(p)},\infty)`;
      break;
    case "plane-transform":
      p = config("Horizontal shift", "h", -2, 2, 0.5);
      m.formula = tex`g_h(x)=(x-h)^2`;
      line((x) => x * x, -3, 3, "Original parabola", blue, true);
      line((x) => (x - p) ** 2, -3, 3, "Shifted parabola");
      point(p, 0, "Vertex");
      m.readout = tex`\text{Vertex}=(${decimal(p)},0)`;
      break;
    case "plane-limit":
      p = config("Distance from the hole", "h", 0.02, 1.5, 0.6);
      m.bounds = [-1, 3, -1, 5];
      m.formula = tex`f(x)=\frac{x^2-1}{x-1}=x+1,\quad x\ne1`;
      line((x) => x + 1, -1, 0.985, "Graph before the hole");
      line((x) => x + 1, 1.015, 3, "Graph after the hole");
      point(1 - p, 2 - p, "Left approach");
      point(1 + p, 2 + p, "Right approach", blue);
      m.readout = tex`f(1-h)=${decimal(2 - p)},\quad f(1+h)=${decimal(2 + p)}`;
      m.note = "The point $(1,2)$ is excluded. Both sides approach its height.";
      break;
    case "plane-squeeze":
      p = config("Neighbourhood radius", tex`\delta`, 0.03, 1, 0.6);
      m.bounds = [-1.2, 1.2, -1.2, 1.2];
      m.formula = tex`-|x|\le x\sin(1/x)\le|x|`;
      line((x) => Math.abs(x), -1, 1, "Upper envelope", blue, true);
      line((x) => -Math.abs(x), -1, 1, "Lower envelope", blue, true);
      line((x) => (x === 0 ? 0 : x * Math.sin(1 / x)), -p, p, "Squeezed graph");
      m.readout = tex`|x|<${decimal(p)}\Rightarrow |f(x)|<${decimal(p)}`;
      break;
    case "plane-epsilon":
      p = config("Output tolerance", tex`\varepsilon`, 0.05, 2, 0.8);
      m.bounds = [-0.5, 2.5, -1, 5];
      m.formula = tex`f(x)=2x,\quad a=1,\quad L=2`;
      m.traces.push({
        points: [
          [1 - p / 2, 2 - p],
          [1 + p / 2, 2 - p],
          [1 + p / 2, 2 + p],
          [1 - p / 2, 2 + p],
        ],
        label: "Tolerance rectangle",
        color: blue,
        fill: true,
      });
      line((x) => 2 * x, -0.5, 2.5, "Linear function");
      point(1, 2, "Limit location");
      m.readout = tex`\delta=\frac\varepsilon2=${decimal(p / 2)}`;
      break;
    case "plane-ivt":
      p = config("Target height", "k", 0.1, 5.9, 2);
      m.bounds = [0.8, 2.1, -1, 7];
      m.formula = tex`f(x)=x^3-x,\quad 1\le x\le2`;
      line((x) => x ** 3 - x, 1, 2, "Continuous curve");
      line(() => p, 0.8, 2.1, "Target height", orange, true);
      {
        let a = 1,
          b = 2;
        for (let i = 0; i < 45; i++) {
          const c = (a + b) / 2;
          if (c ** 3 - c < p) a = c;
          else b = c;
        }
        const c = (a + b) / 2;
        point(c, p, "Intermediate value");
        m.readout = tex`f(c)=${decimal(p)},\quad c\approx${decimal(c)}`;
      }
      break;
    case "plane-secant":
      p = config("Nonzero increment", "h", 0.02, 1.6, 1);
      m.formula = tex`f(x)=x^2,\quad a=1`;
      line((x) => x * x, -2, 2.5, "Parabola");
      line((x) => 1 + 2 * (x - 1), -1, 2.7, "Tangent", blue, true);
      line((x) => 1 + (2 + p) * (x - 1), -1, 2.7, "Secant", orange);
      point(1, 1);
      point(1 + p, (1 + p) ** 2, "Second point");
      m.readout = tex`\frac{f(1+h)-f(1)}h=2+h=${decimal(2 + p)}`;
      break;
    case "plane-corner":
      p = config("Nonzero distance", "h", 0.03, 2, 1);
      m.bounds = [-2.5, 2.5, -1, 3];
      m.formula = tex`f(x)=|x|`;
      line(Math.abs, -2.5, 2.5, "Absolute value");
      point(-p, p, "Left point", blue);
      point(p, p, "Right point");
      m.readout = tex`\frac{f(h)-f(0)}h=1,\quad\frac{f(-h)-f(0)}{-h}=-1`;
      break;
    case "plane-product":
    case "plane-chain":
    case "plane-extrema":
    case "plane-exponential": {
      const ex = id === "plane-exponential",
        chain = id === "plane-chain",
        ext = id === "plane-extrema";
      p = config("Tangent point", "a", -2, 2, 0.7);
      const fn = ex
        ? Math.exp
        : chain
          ? (x: number) => Math.sin(x * x)
          : ext
            ? (x: number) => x ** 3 - 3 * x
            : (x: number) => x * Math.sin(x);
      const df = ex
        ? Math.exp
        : chain
          ? (x: number) => 2 * x * Math.cos(x * x)
          : ext
            ? (x: number) => 3 * x * x - 3
            : (x: number) => Math.sin(x) + x * Math.cos(x);
      m.bounds = [-2.5, 2.5, -4, ex ? 8 : 4];
      m.formula = ex
        ? tex`f(x)=e^x`
        : chain
          ? tex`f(x)=\sin(x^2)`
          : ext
            ? tex`f(x)=x^3-3x`
            : tex`f(x)=x\sin x`;
      line(fn, -2.5, 2.5, "Function");
      line((x) => fn(p) + df(p) * (x - p), p - 0.9, p + 0.9, "Tangent", orange);
      point(p, fn(p));
      m.readout = tex`a=${decimal(p)},\quad f(a)\approx${decimal(fn(p))},\quad f\prime(a)\approx${decimal(df(p))}`;
      break;
    }
    case "plane-circle":
    case "plane-trig-sub": {
      p = config("Angle", tex`\theta`, 0.08, Math.PI - 0.08, 0.8);
      m.bounds = [-2.5, 2.5, -2.5, 2.5];
      m.formula = tex`x=2\cos\theta,\quad y=2\sin\theta`;
      m.traces.push({
        points: Array.from({ length: 161 }, (_, i) => [
          2 * Math.cos((i * Math.PI) / 80),
          2 * Math.sin((i * Math.PI) / 80),
        ]),
        label: "Circle",
        color: ink,
      });
      const x = 2 * Math.cos(p),
        y = 2 * Math.sin(p);
      segment([0, 0], [x, y], "Radius", blue);
      segment([x, 0], [x, y], "Vertical leg", orange, true);
      point(x, y);
      if (id === "plane-circle")
        segment(
          [x + 0.7 * Math.sin(p), y - 0.7 * Math.cos(p)],
          [x - 0.7 * Math.sin(p), y + 0.7 * Math.cos(p)],
          "Tangent",
        );
      m.readout = tex`x=${decimal(x)},\quad y=${decimal(y)},\quad \frac{dy}{dx}=${decimal(-x / y)}`;
      break;
    }
    case "plane-linear":
      p = config("Input increment", "h", 0.02, 1.5, 0.8);
      m.bounds = [0, 3, 0, 8];
      m.formula = tex`f(1+h)=1+2h+h^2`;
      line((x) => x * x, 0, 3, "Function");
      line((x) => 2 * x - 1, 0, 3, "Linear approximation", blue, true);
      segment([1 + p, 1 + 2 * p], [1 + p, (1 + p) ** 2], "Error");
      point(1 + p, (1 + p) ** 2);
      m.readout = tex`\Delta y=${decimal(2 * p + p * p)},\quad dy=${decimal(2 * p)},\quad |\Delta y-dy|=${decimal(p * p)}`;
      break;
    case "plane-mvt":
      p = config("Right endpoint", "b", 0.2, 2.5, 2);
      m.bounds = [0, 3, -1, 7];
      m.formula = tex`f(x)=x^2,\quad [a,b]=[0,b]`;
      line((x) => x * x, 0, 3, "Function");
      segment([0, 0], [p, p * p], "Secant", blue);
      line(
        (x) => (p * p) / 4 + p * (x - p / 2),
        0,
        p,
        "Matching tangent",
        orange,
      );
      point(p / 2, (p * p) / 4, "MVT point");
      m.readout = tex`c=b/2=${decimal(p / 2)},\quad f\prime(c)=b=${decimal(p)}`;
      break;
    case "plane-asymptote":
      p = config("Input distance", "x", 0.3, 8, 2);
      m.bounds = [0, 8.5, 0, 5];
      m.formula = tex`f(x)=1+\frac1{x^2}`;
      line((x) => 1 + 1 / (x * x), 0.2, 8.5, "Function");
      line(() => 1, 0, 8.5, "Horizontal asymptote", blue, true);
      point(p, 1 + 1 / (p * p));
      m.readout = tex`f(x)-1=\frac1{x^2}\approx${decimal(1 / (p * p))}`;
      break;
    case "plane-optimize":
      p = config("Rectangle width", "x", 0, 4, 1);
      m.bounds = [-0.3, 4.5, -0.3, 4.5];
      m.formula = tex`A(x)=x(4-x),\quad P=8`;
      line((x) => x * (4 - x), 0, 4, "Area function");
      m.traces.push({
        points: [
          [0, 0],
          [p, 0],
          [p, 4 - p],
          [0, 4 - p],
          [0, 0],
        ],
        label: "Feasible rectangle",
        color: blue,
        dashed: true,
      });
      point(p, p * (4 - p), "Area");
      m.readout = tex`A(${decimal(p)})=${decimal(p * (4 - p))}\le4`;
      break;
    case "plane-newton":
      p = config("Current estimate", "x_n", 0.3, 3, 2);
      m.bounds = [0, 3.5, -2.5, 7];
      m.formula = tex`f(x)=x^2-2`;
      line((x) => x * x - 2, 0, 3.3, "Function");
      line((x) => p * p - 2 + 2 * p * (x - p), 0, 3.3, "Tangent", orange);
      point((p + 2 / p) / 2, 0, "Next estimate", blue);
      point(p, p * p - 2, "Current estimate");
      m.readout = tex`x_{n+1}=\frac12\left(x_n+\frac2{x_n}\right)\approx${decimal((p + 2 / p) / 2)}`;
      break;
    case "plane-antiderivative":
      p = config("Integration constant", "C", -2, 2, 0);
      m.formula = tex`F(x)=x^2+C,\quad F\prime(x)=2x`;
      line((x) => x * x, -2.5, 2.5, "Reference primitive", blue, true);
      line((x) => x * x + p, -2.5, 2.5, "Selected primitive");
      m.readout = tex`F(0)=C=${decimal(p)}`;
      break;
    case "plane-inverse":
      p = config("Original input", "x", 0.1, 2, 1.2);
      m.bounds = [0, 4.5, 0, 4.5];
      m.formula = tex`f(x)=x^2,\quad f^{-1}(x)=\sqrt{x}`;
      line((x) => x * x, 0, 2.1, "Original");
      line(Math.sqrt, 0, 4.5, "Inverse", blue);
      line((x) => x, 0, 4.5, "Reflection axis", orange, true);
      point(p, p * p, "Original point");
      point(p * p, p, "Inverse point", blue);
      m.readout = tex`f\prime(x)=${decimal(2 * p)},\quad(f^{-1})\prime(x^2)\approx${decimal(1 / (2 * p))}`;
      break;
    case "plane-lhopital":
    case "plane-series-limit":
      p = config("Nonzero input", "x", 0.02, 1.5, 0.8);
      m.bounds = [
        0,
        1.6,
        id === "plane-lhopital" ? 0.8 : -0.18,
        id === "plane-lhopital" ? 2.5 : -0.13,
      ];
      m.formula =
        id === "plane-lhopital"
          ? tex`q(x)=\frac{e^x-1}{x}`
          : tex`q(x)=\frac{\sin x-x}{x^3}`;
      {
        const fn =
          id === "plane-lhopital"
            ? (x: number) => Math.expm1(x) / x
            : (x: number) => (Math.sin(x) - x) / x ** 3;
        line(fn, 0.02, 1.6, "Scaled quotient");
        line(
          () => (id === "plane-lhopital" ? 1 : -1 / 6),
          0,
          1.6,
          "Limit",
          blue,
          true,
        );
        point(p, fn(p));
        m.readout = tex`q(${decimal(p)})\approx${decimal(fn(p))}`;
      }
      break;
    default:
      return undefined;
  }
  return m;
}
