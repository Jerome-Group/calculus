import type { GraphSpec } from "@/lib/atlas/math";
import { experimentPresets } from "./experiment-presets";

type GraphSupport =
  | { kind: "preset"; preset: GraphSpec & { title: string } }
  | { kind: "none"; reason: string };

export type ExampleIdentity = {
  id: string;
  conceptId: string;
  status: "original" | "scaffold";
  title: string;
  formula: string;
  domain: string;
  orientation: string;
  annotation: string;
  graph: GraphSupport;
};

const noGraph = (reason: string): GraphSupport => ({ kind: "none", reason });
const reviewPreset = (index: number): GraphSupport => ({
  kind: "preset",
  preset: experimentPresets["review-total-differentiability"][index],
});

export const exampleRegistry: readonly ExampleIdentity[] = [
  {
    id: "review-differentiable-f",
    conceptId: "review-total-differentiability",
    status: "original",
    title: "Differentiable review function $f$",
    formula: String.raw`f(x,y)=\begin{cases}(x^4+y^4)/\sqrt{x^2+y^2},&(x,y)\ne(0,0)\\0,&(x,y)=(0,0)\end{cases}`,
    domain: "All of $\\mathbb R^2$; $f(0,0)=0$.",
    orientation: "Not applicable; scalar function.",
    annotation:
      "Candidate derivative $L=0$; normalized remainder is at most $r^2$.",
    graph: reviewPreset(0),
  },
  {
    id: "review-counterexample-g",
    conceptId: "review-total-differentiability",
    status: "original",
    title: "Nondifferentiable review function $g$",
    formula: String.raw`g(x,y)=\begin{cases}(x^3-xy^2)/(x^2+y^2),&(x,y)\ne(0,0)\\0,&(x,y)=(0,0)\end{cases}`,
    domain: "All of $\\mathbb R^2$; $g(0,0)=0$.",
    orientation: "Not applicable; scalar function.",
    annotation:
      "Candidate derivative $L(x,y)=x$; diagonal normalized residual is $-1/\\sqrt2$.",
    graph: reviewPreset(1),
  },
  {
    id: "review-green-original",
    conceptId: "review-integral-methods",
    status: "original",
    title: "Original clockwise Green problem",
    formula: String.raw`P=y\cos x-xy\sin x,\quad Q=xy+x\cos x`,
    domain: "Triangle with vertices $(0,0)$, $(0,12)$, $(3,0)$.",
    orientation:
      "Clockwise boundary; region lies on the right; circulation $-72$.",
    annotation: "$Q_x-P_y=y$; trigonometric derivative terms cancel.",
    graph: noGraph("The shared Stokes scene is not this triangular region."),
  },
  {
    id: "review-green-scaffold",
    conceptId: "review-integral-methods",
    status: "scaffold",
    title: "Simplified Green scaffold",
    formula: String.raw`P=0,\quad Q=xy`,
    domain: "The same triangle with vertices $(0,0)$, $(0,12)$, $(3,0)$.",
    orientation: "Clockwise boundary; circulation $-72$.",
    annotation:
      "Same curl $y$ and answer; omits the original derivative cancellation.",
    graph: noGraph("The shared Stokes scene is not this triangular region."),
  },
  {
    id: "review-potential-original",
    conceptId: "review-integral-methods",
    status: "original",
    title: "Original orientation-reversing potential problem",
    formula: String.raw`P=2xy+e^{-x^2},\ Q=x^2+y\cos(\pi y^2/2);\quad\mathbf r(t)=(e^{t^2-t}-\cos(2\pi t),\ 2\sin(\pi t^2/2)-t^9)`,
    domain: "$0\\le t\\le1$; parametrization runs $(0,0)$ to $(0,1)$.",
    orientation:
      "Requested traversal is $(0,1)$ to $(0,0)$, opposite increasing $t$; integral $-1/\\pi$.",
    annotation: String.raw`Use the potential $\phi(x,y)=x^2y+\int_0^x e^{-s^2}\,ds+\sin(\pi y^2/2)/\pi$.`,
    graph: noGraph(
      "No exact plot is provided for the original parametrized curve.",
    ),
  },
  {
    id: "review-potential-scaffold",
    conceptId: "review-integral-methods",
    status: "scaffold",
    title: "Straight-path potential scaffold",
    formula: String.raw`\mathbf r(t)=(0,1-t),\quad0\le t\le1`,
    domain: "$0\\le t\\le1$; straight segment from $(0,1)$ to $(0,0)$.",
    orientation: "Already follows the requested direction; integral $-1/\\pi$.",
    annotation:
      "Endpoint method keeps the answer but removes the original orientation trap.",
    graph: noGraph("The shared Stokes scene is not this path."),
  },
];

export function examplesForConcept(
  conceptId: string,
): readonly ExampleIdentity[] {
  return exampleRegistry.filter((example) => example.conceptId === conceptId);
}

export function exampleById(id: string): ExampleIdentity {
  const example = exampleRegistry.find((entry) => entry.id === id);
  if (!example) throw new Error(`Unknown example identity: ${id}`);
  return example;
}
