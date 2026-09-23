import data from "./concepts.json";
import sourceData from "./sources.json";
import type { Concept as LegacyConcept } from "../atlas/types";
export type CourseId = "MH1100" | "MH1101" | "MH2100";
export type Citation = { sourceId: string; pages: number[]; detail: string };
export type Concept = LegacyConcept & {
  course: CourseId;
  sources: Citation[];
  enrichment: string;
};
export type Source = {
  id: string;
  file: string;
  title: string;
  url: string;
  pages: number;
  course: string;
  kind: string;
  sha256: string;
  errata?: {
    page: number;
    printed: string;
    correction: string;
    justification: string;
    provenance: string;
  }[];
};
export const concepts = data as Concept[];
export const sources: Record<string, Source> = sourceData;
export const courses: Record<
  CourseId,
  { title: string; description: string; units: string[] }
> = {
  MH1100: {
    title: "Calculus I",
    description: "Functions, limits and the mathematics of change.",
    units: [
      "Functions",
      "Approaching a limit",
      "Limit laws",
      "Precise limits",
      "Continuity",
      "The derivative",
      "Differentiation rules",
      "Composition & approximation",
      "Extrema & mean values",
      "Reading a graph",
      "Optimization & antiderivatives",
      "Inverses, exponentials & logarithms",
      "Indeterminate forms",
    ],
  },
  MH1101: {
    title: "Calculus II",
    description: "Accumulation, integration and infinite processes.",
    units: [
      "Integrals & the fundamental theorem",
      "Areas & volumes",
      "Integration techniques",
      "Sequences & series",
      "Convergence tests",
      "Power series & approximation",
    ],
  },
  MH2100: {
    title: "Calculus III",
    description: "Change and accumulation in several dimensions.",
    units: [
      "Curves & parametrization",
      "Limits & partial derivatives",
      "Differentiability & chain rule",
      "Gradients & extrema",
      "Constraints & double integrals",
      "Integration over regions",
      "Triple integrals & coordinates",
      "Substitution & line integrals",
      "Vector fields & Green’s theorem",
      "Surfaces & flux",
      "Stokes & divergence",
      "Course synthesis",
    ],
  },
};
export const courseIds = Object.keys(courses) as CourseId[];
export function sourceLabel(c: Concept) {
  return `${c.course} · ${c.course === "MH1101" ? "Chapter" : "Lecture"} ${c.lecture}`;
}
