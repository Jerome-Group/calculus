import {
  createDrawing,
  ink,
  orange,
  blue,
  decimal,
  tex,
  sum,
  factorial,
} from "./drawing";
export function seriesModel(id: string, value?: number) {
  const { m, line, point, config } = createDrawing(value);
  let p = value ?? m.initial;
  switch (id) {
    case "plane-sequence":
    case "plane-alternating-sequence":
    case "plane-monotone":
    case "plane-geometric":
    case "plane-harmonic":
    case "plane-integral-test":
    case "plane-comparison":
    case "plane-alternating":
    case "plane-ratio": {
      p = config("Terms shown", "N", 2, 60, 12, 1);
      p = Math.round(p);
      m.bounds = [0, 61, -1.3, id === "plane-harmonic" ? 5.5 : 2.3];
      let fn: (n: number) => number = (n) => 1 + (-1) ** n / n;
      const specs: Record<
        string,
        [string, (n: number) => number, number | null]
      > = {
        "plane-sequence": [tex`a_n=1+\frac{(-1)^n}n`, fn, 1],
        "plane-alternating-sequence": [tex`a_n=(-1)^n`, (n) => (-1) ** n, null],
        "plane-monotone": [tex`a_n=1-2^{-n}`, (n) => 1 - 2 ** -n, 1],
        "plane-geometric": [
          tex`S_N=\sum_{n=0}^{N-1}2^{-n}`,
          (n) => 2 * (1 - 2 ** -n),
          2,
        ],
        "plane-harmonic": [
          tex`S_N=\sum_{n=1}^N\frac1n`,
          (n) => sum(n, (i) => 1 / i),
          null,
        ],
        "plane-integral-test": [
          tex`S_N=\sum_{n=1}^N\frac1{n^2}`,
          (n) => sum(n, (i) => 1 / (i * i)),
          Math.PI ** 2 / 6,
        ],
        "plane-comparison": [
          tex`a_n=\frac1{n^2+1}\le\frac1{n^2}`,
          (n) => 1 / (n * n + 1),
          0,
        ],
        "plane-alternating": [
          tex`S_N=\sum_{n=1}^N\frac{(-1)^{n-1}}n`,
          (n) => sum(n, (i) => (-1) ** (i - 1) / i),
          Math.log(2),
        ],
        "plane-ratio": [tex`a_n=\frac1{n!}`, (n) => 1 / factorial(n), 0],
      };
      const [formula, f, limit] = specs[id];
      fn = f;
      m.formula = formula;
      m.traces.push({
        points: Array.from({ length: p }, (_, i) => [i + 1, fn(i + 1)]),
        label:
          id.includes("sequence") ||
          id === "plane-monotone" ||
          id === "plane-comparison" ||
          id === "plane-ratio"
            ? "Sequence terms"
            : "Partial sums",
        color: ink,
        dots: true,
      });
      if (limit !== null)
        line(() => limit, 0, 61, "Reference limit", blue, true);
      point(p, fn(p), "Last visible term");
      m.readout = tex`N=${p},\quad ${id.includes("sequence") || id === "plane-monotone" || id === "plane-comparison" || id === "plane-ratio" ? "a_N" : "S_N"}\approx${decimal(fn(p))}`;
      if (id === "plane-integral-test")
        m.readout += tex`,\quad\frac1{N+1}\le R_N\le\frac1N`;
      if (id === "plane-comparison")
        m.traces.push({
          points: Array.from({ length: p }, (_, i) => [
            i + 1,
            1 / (i + 1) ** 2,
          ]),
          label: "Comparison terms",
          color: orange,
          dots: true,
        });
      break;
    }
    case "plane-power":
      p = config("Evaluation point", "x", -0.95, 0.95, 0.6);
      m.bounds = [0, 31, -2, 20];
      m.formula = tex`S_N(x)=\sum_{n=0}^{N-1}x^n`;
      m.traces.push({
        points: Array.from({ length: 30 }, (_, i) => [
          i + 1,
          (1 - p ** (i + 1)) / (1 - p),
        ]),
        label: "Partial sums at chosen input",
        color: ink,
        dots: true,
      });
      line(() => 1 / (1 - p), 0, 31, "Infinite sum", blue, true);
      m.readout = tex`x=${decimal(p)},\quad S_{30}\approx${decimal((1 - p ** 30) / (1 - p))},\quad S=\frac1{1-x}\approx${decimal(1 / (1 - p))}`;
      break;
    case "plane-taylor":
    case "plane-binomial": {
      p = config("Polynomial degree", "n", 0, 12, 3, 1);
      p = Math.round(p);
      const bin = id === "plane-binomial";
      m.bounds = bin ? [-0.95, 0.95, 0, 1.7] : [-2, 2, -1, 8];
      m.formula = bin
        ? tex`\sqrt{1+x}\approx\sum_{k=0}^n\binom{1/2}{k}x^k`
        : tex`e^x\approx\sum_{k=0}^n\frac{x^k}{k!}`;
      const poly = (x: number) => {
        let s = 1,
          coef = 1;
        for (let k = 1; k <= p; k++) {
          coef *= bin ? (1.5 - k) / k : 1 / k;
          s += coef * x ** k;
        }
        return s;
      };
      line(
        bin ? (x) => Math.sqrt(1 + x) : Math.exp,
        m.bounds[0],
        m.bounds[1],
        "Function",
      );
      line(poly, m.bounds[0], m.bounds[1], "Taylor polynomial", orange);
      point(0, 1, "Centre", blue);
      m.readout = tex`n=${p},\quad T_n(0.5)\approx${decimal(poly(0.5))}`;
      break;
    }
    default:
      return undefined;
  }
  return m;
}
