import { createDrawing, ink, orange, blue, decimal, tex } from "./drawing";
import type { Point } from "./types";
export function auditModel(id: string, value?: number) {
  if (
    ![
      "plane-nonlinear-jacobian",
      "plane-nonlinear-cell",
      "plane-review-region",
      "plane-shifted-disk",
    ].includes(id)
  )
    return null;
  const { m, point, segment, config } = createDrawing(value);
  m.equalAspect = true;
  if (id === "plane-shifted-disk") {
    const angle = config(
      "Ray angle",
      tex`\theta`,
      -Math.PI / 2,
      Math.PI / 2,
      0.5,
    );
    m.bounds = [-0.2, 2.3, -1.2, 1.2];
    m.formula = tex`(x-1)^2+y^2\le1,\quad 0\le r\le2\cos\theta`;
    m.traces.push({
      points: Array.from({ length: 161 }, (_, i): Point => [
        1 + Math.cos((i * Math.PI) / 80),
        Math.sin((i * Math.PI) / 80),
      ]),
      label: "Shifted disk boundary",
      color: ink,
      fill: true,
    });
    const radius = 2 * Math.cos(angle);
    const end: Point = [radius * Math.cos(angle), radius * Math.sin(angle)];
    segment([0, 0], end, "Allowed radial interval", orange);
    point(...end, "Ray meets the circle");
    m.readout = tex`\theta=${decimal(angle)},\quad r_{\max}=${decimal(radius)},\quad A=\pi`;
    m.note =
      "Exact shifted disk. The highlighted ray ends at its variable radial bound; at the endpoint angles only the origin remains.";
    return m;
  }
  const review = id === "plane-review-region";
  const cellMode = id === "plane-nonlinear-cell";
  const p = config(
    cellMode ? "Cell width" : "Cell location",
    cellMode ? "h" : "u",
    cellMode ? 0.001 : review ? 1 : 0,
    cellMode ? 0.45 : review ? 1.8 : 0.8,
    cellMode ? 0.2 : review ? 1.4 : 0.4,
    cellMode ? 0.001 : 0.02,
  );
  const u = cellMode ? 0.4 : p,
    h = cellMode ? p : 0.2,
    v = review ? 1.4 : 0.3,
    k = cellMode ? p : 0.2;
  const map = ([a, b]: Point): Point =>
    review
      ? [(b / a) ** 0.25, a ** 0.25 * b ** 0.75]
      : cellMode
        ? [a, b + a * b * b]
        : [a, (1 + a) * b];
  const umin = review ? 1 : 0,
    umax = review ? 2 : 1,
    vmin = review ? 1 : 0,
    vmax = review ? 3 : 1;
  const source = createDrawing().m;
  source.equalAspect = true;
  source.bounds = [umin - 0.15, umax + 0.15, vmin - 0.15, vmax + 0.15];
  source.formula = review ? tex`1\le u\le2,\quad1\le v\le3` : tex`0\le u,v\le1`;
  source.note =
    "Parameter domain. The orange cell corresponds to the orange physical cell below.";
  source.readout = "";
  const border: Point[] = [
    [umin, vmin],
    [umax, vmin],
    [umax, vmax],
    [umin, vmax],
    [umin, vmin],
  ];
  const cell: Point[] = [
    [u, v],
    [u + h, v],
    [u + h, v + k],
    [u, v + k],
    [u, v],
  ];
  source.traces = [
    { points: border, label: "Parameter rectangle", color: ink },
    {
      points: cell,
      label: "Selected parameter cell",
      color: orange,
      fill: true,
    },
  ];
  const mappedBorder = border.slice(0, -1).flatMap((a, i) =>
    Array.from({ length: 41 }, (_, j): Point => {
      const b = border[i + 1];
      return map([
        a[0] + ((b[0] - a[0]) * j) / 40,
        a[1] + ((b[1] - a[1]) * j) / 40,
      ]);
    }),
  );
  m.traces.push({
    points: mappedBorder,
    label: "Exact physical boundary",
    color: ink,
    fill: true,
  });
  m.traces.push({
    points: cell.slice(0, -1).flatMap((a, i) =>
      Array.from({ length: 21 }, (_, j): Point => {
        const b = cell[i + 1];
        return map([
          a[0] + ((b[0] - a[0]) * j) / 20,
          a[1] + ((b[1] - a[1]) * j) / 20,
        ]);
      }),
    ),
    label: "Exact image of selected cell",
    color: orange,
    fill: true,
  });
  point(...map([u, v]), "Corresponding lower-left point");
  m.bounds = review ? [0.65, 1.4, 0.85, 2.9] : [-0.15, 1.15, -0.15, 2.2];
  m.comparison = source;
  if (review) {
    m.formula = tex`x=(v/u)^{1/4},\quad y=u^{1/4}v^{3/4}`;
    m.readout = tex`\det DT=-\frac1{4u}\approx${decimal(-1 / (4 * u))},\quad A=\frac{\ln2}{2}`;
    m.note =
      "Exact review region, with independent coordinate axes for each panel. The map reverses orientation; area uses the absolute determinant.";
  } else {
    const origin = map([u, v]);
    const tangent: Point[] = [
      origin,
      [origin[0] + h, origin[1] + (cellMode ? v * v : v) * h],
      [
        origin[0] + h,
        origin[1] +
          (cellMode ? v * v : v) * h +
          (cellMode ? 1 + 2 * u * v : 1 + u) * k,
      ],
      [origin[0], origin[1] + (cellMode ? 1 + 2 * u * v : 1 + u) * k],
      origin,
    ];
    m.traces.push({
      points: tangent,
      label: "Derivative parallelogram",
      color: blue,
      dashed: true,
    });
    if (cellMode) {
      const finiteRatio = 1 + 2 * (u + h / 2) * (v + k / 2);
      m.formula = tex`T(u,v)=(u,v+uv^2),\quad\det DT=1+2uv`;
      m.readout = tex`h=k=${decimal(h)},\quad d=${decimal(Math.hypot(h, k))},\quad\frac{A_{\rm cell}}{hk}=${decimal(finiteRatio)},\quad\det DT=${decimal(1 + 2 * u * v)}`;
      m.note =
        "Both cell sides shrink, so diameter $d=\\sqrt{h^2+k^2}$ tends to zero. Exact finite ratio is $1+2(u+h/2)(v+k/2)$. Keeping $k$ fixed instead leaves bias $uk$ as $h\\to0$; shrinking both removes it. Orange is the exact image; dashed blue is the derivative parallelogram.";
    } else {
      m.formula = tex`T(u,v)=(u,(1+u)v),\quad\det DT=1+u`;
      m.readout = tex`u=${decimal(u)},\ h=${decimal(h)},\quad\frac{A_{\rm cell}}{hk}=${decimal(1 + u + h / 2)},\quad\det DT=${decimal(1 + u)}`;
      m.note =
        "Parameter square and its exact trapezoid image use separate axes. Orange is the finite cell; dashed blue is its derivative approximation. Change cell size to see their area factors approach one another.";
    }
  }
  return m;
}
