import type { Point, PlanarModel } from "./types";
export const ink = "#98f5dc",
  orange = "#ffb16c",
  blue = "#bdd0ff";
export const decimal = (n: number) => Number(n.toFixed(4)).toString();
export const tex = String.raw;
export const sum = (n: number, fn: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => fn(i + 1)).reduce((a, b) => a + b, 0);
export const factorial = (n: number) => {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};
export function createDrawing(value?: number) {
  const m: PlanarModel = {
    label: "Input",
    symbol: "x",
    min: -2,
    max: 2,
    step: 0.02,
    initial: 0.8,
    formula: "",
    bounds: [-3, 3, -2, 5],
    traces: [],
    readout: "",
    note: "The plotted example illustrates the statement; its hypotheses and argument are in the notes.",
  };
  const line = (
    fn: (x: number) => number,
    a: number,
    b: number,
    label: string,
    color = ink,
    dashed = false,
  ) =>
    m.traces.push({
      points: Array.from({ length: 321 }, (_, i) => {
        const x = a + ((b - a) * i) / 320;
        return [x, fn(x)];
      }),
      label,
      color,
      dashed,
    });
  const point = (
    x: number,
    y: number,
    label = "Selected point",
    color = orange,
  ) => m.traces.push({ points: [[x, y]], label, color, dots: true });
  const segment = (
    a: Point,
    b: Point,
    label: string,
    color = orange,
    dashed = false,
  ) => m.traces.push({ points: [a, b], label, color, dashed });
  const area = (
    fn: (x: number) => number,
    a: number,
    b: number,
    label = "Accumulated area",
  ) =>
    m.traces.push({
      points: [
        [a, 0],
        ...Array.from({ length: 101 }, (_, i): Point => {
          const x = a + ((b - a) * i) / 100;
          return [x, fn(x)];
        }),
        [b, 0],
      ],
      label,
      color: ink,
      fill: true,
    });
  const config = (
    label: string,
    symbol: string,
    min: number,
    max: number,
    initial: number,
    step = 0.02,
  ) => {
    Object.assign(m, { label, symbol, min, max, initial, step });
    return value ?? initial;
  };
  return { m, line, point, segment, area, config };
}
