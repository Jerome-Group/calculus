import { createDrawing, ink, orange, blue, decimal, tex } from "./drawing";
import type { Point } from "./types";
export function integrationModel(id: string, value?: number) {
  const { m, line, point, segment, area, config } = createDrawing(value);
  let p = value ?? m.initial;
  switch (id) {
    case "plane-riemann":
    case "plane-quadrature":
    case "plane-simpson": {
      const sim = id === "plane-simpson";
      p = config("Subinterval count", "n", 2, 40, 8, sim ? 2 : 1);
      p = Math.round(p);
      m.bounds = [-0.05, 1.1, -0.05, 1.25];
      m.formula = sim
        ? tex`f(x)=x^4,\quad\int_0^1 f(x)\,dx=\frac15`
        : tex`f(x)=x^2,\quad\int_0^1 f(x)\,dx=\frac13`;
      const fn = sim ? (x: number) => x ** 4 : (x: number) => x * x;
      line(fn, 0, 1, "Function");
      if (sim) {
        for (let i = 0; i < p; i += 2) {
          const a = i / p,
            b = (i + 2) / p,
            c = (a + b) / 2;
          const q = (x: number) =>
            (fn(a) * (x - c) * (x - b)) / ((a - c) * (a - b)) +
            (fn(c) * (x - a) * (x - b)) / ((c - a) * (c - b)) +
            (fn(b) * (x - a) * (x - c)) / ((b - a) * (b - c));
          line(q, a, b, "Quadratic panels", orange);
        }
      } else
        for (let i = 0; i < p; i++) {
          const a = i / p,
            b = (i + 1) / p,
            h = fn(id === "plane-riemann" ? b : (a + b) / 2);
          m.traces.push({
            points: [
              [a, 0],
              [a, h],
              [b, h],
              [b, 0],
            ],
            label: "Sample rectangles",
            color: orange,
            fill: true,
          });
        }
      m.readout = sim
        ? tex`S_n=\frac15+\frac2{15n^4}\approx${decimal(0.2 + 2 / (15 * p ** 4))}`
        : id === "plane-riemann"
          ? tex`R_n=\frac{(n+1)(2n+1)}{6n^2}\approx${decimal(((p + 1) * (2 * p + 1)) / (6 * p * p))}`
          : tex`M_n\approx${decimal(1 / 3 - 1 / (12 * p * p))},\quad T_n\approx${decimal(1 / 3 + 1 / (6 * p * p))}`;
      break;
    }
    case "plane-average":
    case "plane-ftc":
    case "plane-between":
    case "plane-substitution":
    case "plane-parts":
    case "plane-trig": {
      p = config(
        "Upper endpoint",
        "b",
        0.1,
        id === "plane-trig" ? Math.PI : 2,
        1,
      );
      const between = id === "plane-between",
        parts = id === "plane-parts",
        sub = id === "plane-substitution",
        trig = id === "plane-trig";
      if (between) {
        m.max = 1;
        p = Math.min(p, 1);
      }
      m.bounds = [0, m.max + 0.1, -0.3, parts ? 16 : trig ? 1.6 : 5];
      const fn = parts
        ? (x: number) => x * Math.exp(x)
        : sub
          ? (x: number) => 2 * x * Math.cos(x * x)
          : trig
            ? (x: number) => Math.sin(x) ** 2
            : between
              ? (x: number) => x - x * x
              : (x: number) => x * x;
      m.formula = parts
        ? tex`I(b)=\int_0^b xe^x\,dx`
        : sub
          ? tex`I(b)=\int_0^b2x\cos(x^2)\,dx`
          : trig
            ? tex`I(b)=\int_0^b\sin^2x\,dx`
            : between
              ? tex`A(b)=\int_0^b(x-x^2)\,dx`
              : tex`A(b)=\int_0^bx^2\,dx`;
      if (between) {
        line((x) => x, 0, 1, "Upper boundary");
        line((x) => x * x, 0, 1, "Lower boundary", blue);
        m.traces.push({
          points: [
            ...Array.from({ length: 101 }, (_, i): Point => [
              (p * i) / 100,
              (p * i) / 100,
            ]),
            ...Array.from({ length: 101 }, (_, i): Point => {
              const x = p * (1 - i / 100);
              return [x, x * x];
            }),
          ],
          label: "Area between curves",
          color: orange,
          fill: true,
        });
      } else {
        area(fn, 0, p);
        line(fn, 0, m.max, "Integrand");
      }
      const total = parts
        ? (p - 1) * Math.exp(p) + 1
        : sub
          ? Math.sin(p * p)
          : trig
            ? p / 2 - Math.sin(2 * p) / 4
            : between
              ? (p * p) / 2 - p ** 3 / 3
              : p ** 3 / 3;
      if (id === "plane-average") {
        segment(
          [0, (p * p) / 3],
          [p, (p * p) / 3],
          "Average height",
          orange,
          true,
        );
        m.readout = tex`f_{\mathrm{avg}}=\frac{b^2}3\approx${decimal((p * p) / 3)}`;
      } else {
        point(p, fn(p), "Boundary height");
        m.readout = tex`I(${decimal(p)})\approx${decimal(total)}`;
      }
      break;
    }
    case "plane-improper":
    case "plane-improper-area":
      if (id === "plane-improper") {
        p = config("Positive cutoff", "a", 0.1, 2, 0.5);
        m.bounds = [0, 3, 0, 10];
        m.formula = tex`f(x)=\frac1x`;
        line((x) => 1 / x, 0.1, 3, "Reciprocal");
        point(p, 1 / p);
        m.readout = tex`f(a)=\frac1a=${decimal(1 / p)}`;
      } else {
        p = config("Tail cutoff", "R", 1, 12, 4);
        m.bounds = [0.5, 12.5, 0, 1.2];
        m.formula = tex`I(R)=\int_1^R\frac1{x^2}\,dx`;
        area((x) => 1 / (x * x), 1, p);
        line((x) => 1 / (x * x), 1, 12.5, "Reciprocal square");
        m.readout = tex`I(R)=1-\frac1R\approx${decimal(1 - 1 / p)},\quad\text{tail}=\frac1R\approx${decimal(1 / p)}`;
      }
      break;
    case "plane-washer":
    case "plane-shell":
      p = config("Slice location", "x", 0, 1, 0.6);
      m.bounds = [-1.3, 1.3, -1.3, 1.3];
      m.formula =
        id === "plane-washer"
          ? tex`R(x)=x,\quad A(x)=\pi x^2`
          : tex`r=x,\quad h=x,\quad\frac{dV}{dx}=2\pi x^2`;
      m.traces.push({
        points: Array.from({ length: 121 }, (_, i) => [
          p * Math.cos((i * Math.PI) / 60),
          p * Math.sin((i * Math.PI) / 60),
        ]),
        label:
          id === "plane-washer" ? "Disk cross-section" : "Shell circumference",
        color: ink,
        fill: id === "plane-washer",
      });
      segment([0, 0], [p, 0], "Radius", orange);
      m.readout =
        id === "plane-washer"
          ? tex`A(${decimal(p)})=\pi(${decimal(p)})^2\approx${decimal(Math.PI * p * p)}`
          : tex`2\pi rh=2\pi(${decimal(p)})^2\approx${decimal(2 * Math.PI * p * p)}`;
      m.note =
        id === "plane-washer"
          ? "Cross-section view of the solid formed by rotating the region under $y=x$ about the horizontal axis."
          : "Top view of one shell. Its height equals its radius in this example; the readout gives volume per unit thickness.";
      break;
    case "plane-fractions":
      p = config("Positive input", "x", 0.15, 4, 1);
      m.bounds = [0, 4.2, -1, 6];
      m.formula = tex`\frac1{x(x+1)}=\frac1x-\frac1{x+1}`;
      line((x) => 1 / x, 0.15, 4, "First fraction", blue);
      line((x) => 1 / (x + 1), 0.15, 4, "Subtracted fraction", orange);
      line((x) => 1 / (x * (x + 1)), 0.15, 4, "Difference");
      point(p, 1 / (p * (p + 1)));
      m.readout = tex`\frac1{x(x+1)}\approx${decimal(1 / (p * (p + 1)))}`;
      break;
    default:
      return undefined;
  }
  return m;
}
