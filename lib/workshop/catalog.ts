import type { Construction, InvestigationId } from "./types";

const definitions = {
  "linear-bound": {
    id: "linear-bound",
    title: "Build a remainder bound",
    technique: "A universal inequality",
    question: "Can one bound control every direction?",
    task: "Construct a linear map $L(x,y)=px+qy$ and a positive coefficient $C$ for $|f-L|\\leq C(x^2+y^2)$. Inspect the exact argument, then revise your explanation.",
    formula: String.raw`f(x,y)=2x-y+3x^2+y^2,\qquad (x,y)\in\mathbb R^2`,
    spoken:
      "f of x, y equals 2x minus y plus 3x squared plus y squared, on the whole real plane. The base point is the origin; r is the Euclidean norm.",
    lessons: [
      "total-differentiability",
      "certifying-differentiability-and-errors",
      "epsilon-delta-limits",
    ],
    clinic: "partials-without-plane",
  },
  "cubic-path": {
    id: "cubic-path",
    title: "Find a hidden path",
    technique: "A nonlinear approach",
    question: "Which approach defeats the line tests?",
    task: "Every straight line through the origin gives limit zero. Construct $y=kx^n$ for $x>0$. Decide exactly what your chosen path establishes about the full limit.",
    formula: String.raw`g(x,y)=\frac{x^3y}{x^6+y^2}\ ((x,y)\ne0),\qquad g(0,0)=0`,
    spoken:
      "Away from the origin, g of x, y equals x cubed times y divided by x to the sixth plus y squared. At the origin its value is zero.",
    lessons: ["curved-paths-hide-obstructions", "epsilon-delta-limits"],
    clinic: "partials-without-plane",
  },
  "domain-loop": {
    id: "domain-loop",
    title: "Construct a closed loop",
    technique: "A global obstruction",
    question: "Can your loop obstruct a potential?",
    task: "The scalar curl is zero on the punctured plane. Construct an oriented polygon with 3 to 8 vertices. A nonzero circulation obstructs a global potential.",
    formula: String.raw`F(x,y)=\left(\frac{-2y}{x^2+y^2},\frac{2x}{x^2+y^2}\right),\qquad D=\mathbb R^2\setminus\{0\}`,
    spoken:
      "F has components negative 2y over x squared plus y squared, and 2x over x squared plus y squared. Its domain is the real plane with the origin removed.",
    lessons: [
      "conservative-domains",
      "fundamental-line-theorem",
      "vector-line-integrals",
      "greens-theorem",
    ],
    clinic: "curl-domain-hole",
  },
} satisfies Record<
  InvestigationId,
  {
    id: InvestigationId;
    title: string;
    technique: string;
    question: string;
    task: string;
    formula: string;
    spoken: string;
    lessons: readonly string[];
    clinic: "partials-without-plane" | "curl-domain-hole";
  }
>;

export const investigations = Object.values(definitions);

export function isInvestigationId(value: string): value is InvestigationId {
  return (
    value === "linear-bound" ||
    value === "cubic-path" ||
    value === "domain-loop"
  );
}
export function investigation(id: InvestigationId) {
  return definitions[id];
}
export function investigationsForLesson(id: string) {
  return investigations.filter((item) => item.lessons.includes(id));
}
export function startingConstruction(id: InvestigationId): Construction {
  switch (id) {
    case "linear-bound":
      return { kind: id, p: "2", q: "-1", bound: "2", epsilon: "1/10" };
    case "cubic-path":
      return { kind: id, exponent: "2", coefficient: "1" };
    case "domain-loop":
      return {
        kind: id,
        vertices: [
          ["-2", "-1"],
          ["2", "-1"],
          ["2", "1"],
          ["-2", "1"],
        ],
      };
  }
}
