import type { Concept } from "@/lib/curriculum";
import type { LessonMode } from "@/lib/curriculum/learning-modes";
import { sceneVariants } from "@/lib/curriculum/scene-variants";
import { validateGraph, type GraphSpec } from "@/lib/atlas/math";

export type LessonHistory = {
  version: 1;
  scene: string;
  parameter: number;
  mode: LessonMode;
  notesTab: "intuition" | "example" | "pitfall";
};

export type HistoryRead =
  | { kind: "legacy" }
  | { kind: "valid"; value: LessonHistory }
  | { kind: "invalid"; explanation: string };

const modes = ["learn", "explore", "practice", "revise"];
const tabs = ["intuition", "example", "pitfall"];

export function readLessonHistory(
  url: URL,
  concept: Concept,
  bounds: (scene: string) => { min: number; max: number },
): HistoryRead {
  const encoded = url.searchParams.get("study");
  if (encoded === null) return { kind: "legacy" };
  try {
    if (encoded.length > 500) throw new Error("oversized state");
    const value: unknown = JSON.parse(encoded);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("invalid state");
    const v = value as Record<string, unknown>;
    if (v.version !== 1) throw new Error("obsolete version");
    if (
      typeof v.scene !== "string" ||
      !sceneVariants(concept).includes(v.scene)
    )
      throw new Error("unknown experiment model");
    const range = bounds(v.scene);
    if (
      typeof v.parameter !== "number" ||
      !Number.isFinite(v.parameter) ||
      v.parameter < range.min ||
      v.parameter > range.max
    )
      throw new Error("parameter outside experiment bounds");
    if (!modes.includes(String(v.mode)) || !tabs.includes(String(v.notesTab)))
      throw new Error("unknown reading section");
    return { kind: "valid", value: v as LessonHistory };
  } catch (error) {
    return {
      kind: "invalid",
      explanation: `The shared lesson state could not be restored (${(error as Error).message}). Showing default settings.`,
    };
  }
}

export function lessonUrl(url: URL, id: string, state: LessonHistory): string {
  const next = new URL(url);
  next.hash = id;
  next.searchParams.delete("graph");
  next.searchParams.set("study", JSON.stringify(state));
  return `${next.pathname}${next.search}${next.hash}`;
}

export function routeUrl(url: URL, route: string): string {
  const next = new URL(url);
  next.hash = route;
  next.searchParams.delete("study");
  next.searchParams.delete("graph");
  return `${next.pathname}${next.search}${next.hash}`;
}

export function graphUrl(url: URL, graph: GraphSpec): string {
  const next = new URL(url);
  next.hash = "graph";
  next.searchParams.delete("study");
  next.searchParams.set("graph", JSON.stringify({ version: 1, graph }));
  return `${next.pathname}${next.search}${next.hash}`;
}

export function readGraphHistory(
  url: URL,
):
  | { kind: "legacy" }
  | { kind: "valid"; graph: GraphSpec }
  | { kind: "invalid"; explanation: string } {
  const encoded = url.searchParams.get("graph");
  if (encoded === null) return { kind: "legacy" };
  try {
    if (encoded.length > 2500) throw new Error("oversized graph state");
    const value: unknown = JSON.parse(encoded);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("invalid graph state");
    const state = value as Record<string, unknown>;
    if (state.version !== 1) throw new Error("obsolete graph state");
    validateGraph(state.graph as GraphSpec);
    return { kind: "valid", graph: state.graph as GraphSpec };
  } catch (error) {
    return {
      kind: "invalid",
      explanation: `The shared graph could not be restored (${(error as Error).message}). Showing the default graph.`,
    };
  }
}
