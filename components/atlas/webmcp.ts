"use client";
import { useEffect, useState, type RefObject } from "react";
import type { Concept } from "@/lib/atlas/types";
import { initialGraph, type GraphSpec } from "@/lib/atlas/math";
const afterRender = () =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 300);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        clearTimeout(t);
        resolve();
      }),
    );
  });
export function useWebMCP(concepts: Concept[], state: RefObject<any>) {
  const [status, setStatus] = useState("Checking browser support");
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context || typeof context.registerTool !== "function") {
      setStatus("Native WebMCP is not available in this browser");
      return;
    }
    let active = true;
    const controller = new AbortController();
    const schema = (properties: any, required: string[] = []) => ({
      type: "object",
      properties,
      required,
      additionalProperties: false,
    });
    const defs = [
      {
        name: "list_concepts",
        title: "Find a calculus concept",
        description:
          "List MH2100 mathematical explorations, filtered by lecture number or search text. Returns IDs accepted by open_concept.",
        inputSchema: schema({
          lecture: { type: "integer", minimum: 1, maximum: 12 },
          query: { type: "string", maxLength: 100 },
        }),
        annotations: { readOnlyHint: true, consequentialHint: false },
        execute: async (args: any) =>
          JSON.stringify(
            concepts
              .filter(
                (c) =>
                  (args.lecture === undefined || c.lecture === args.lecture) &&
                  (!args.query ||
                    (c.title + " " + c.topics.join(" "))
                      .toLowerCase()
                      .includes(String(args.query).toLowerCase())),
              )
              .map((c) => ({
                id: c.id,
                title: c.title,
                lecture: c.lecture,
                topics: c.topics,
              })),
          ),
      },
      {
        name: "open_concept",
        title: "Explore a calculus concept",
        description:
          "Open a course concept, its 3D scene and rigorous mathematical explanation in the visible page.",
        inputSchema: schema(
          { conceptId: { type: "string", enum: concepts.map((c) => c.id) } },
          ["conceptId"],
        ),
        execute: async (args: any) => {
          const c = concepts.find((c) => c.id === args.conceptId);
          if (!c)
            throw new Error("Unknown concept ID. Call list_concepts first.");
          state.current.open(c.id);
          await afterRender();
          return JSON.stringify({
            status: "opened",
            conceptId: c.id,
            title: c.title,
          });
        },
      },
      {
        name: "graph_function",
        title: "Plot a function in three dimensions",
        description:
          "Render a real-valued expression z=f(x,y) using the same validated graph controls as the visible graph machine. This is a finite numerical visualization, not symbolic verification.",
        inputSchema: schema(
          {
            expression: { type: "string", maxLength: 400 },
            xMin: { type: "number", minimum: -1000, maximum: 1000 },
            xMax: { type: "number", minimum: -1000, maximum: 1000 },
            yMin: { type: "number", minimum: -1000, maximum: 1000 },
            yMax: { type: "number", minimum: -1000, maximum: 1000 },
            heightClip: { type: "number", exclusiveMinimum: 0, maximum: 1000 },
          },
          ["expression"],
        ),
        execute: async (args: any, signal?: AbortSignal) => {
          const g: GraphSpec = {
            ...initialGraph,
            mode: "surface",
            expressions: [String(args.expression)],
            min: args.xMin ?? -5,
            max: args.xMax ?? 5,
            vmin: args.yMin ?? -5,
            vmax: args.yMax ?? 5,
            clip: args.heightClip ?? 5,
          };
          const result = await state.current.plotAndWait(g, signal);
          return JSON.stringify({
            ...result,
            limitation:
              "Finite sampled mesh; undefined and clipped heights are omitted. Discontinuities and fine features can be missed.",
          });
        },
      },
      {
        name: "set_visual_parameter",
        title: "Adjust the current experiment",
        description:
          "Set the main parameter in the currently visible lesson, or parameter a in the graph machine. Returns the valid range if out of bounds.",
        inputSchema: schema({ value: { type: "number" } }, ["value"]),
        execute: async (args: any) => {
          const s = state.current;
          if (s.route !== "lesson" && s.route !== "graph")
            throw new Error(
              "Open a concept or graph before changing a parameter.",
            );
          const { min, max, label } =
            s.route === "graph" ? { min: -5, max: 5, label: "a" } : s.info;
          if (
            typeof args.value !== "number" ||
            !Number.isFinite(args.value) ||
            args.value < min ||
            args.value > max
          )
            throw new Error(`Choose a finite value between ${min} and ${max}.`);
          if (s.route === "graph")
            await s.plotAndWait({ ...s.graph, a: args.value });
          else s.setP(args.value);
          await afterRender();
          return JSON.stringify({
            parameter: label,
            value:
              state.current.route === "graph"
                ? state.current.graph.a
                : state.current.p,
            range: [min, max],
          });
        },
      },
    ];
    Promise.all(
      defs.map((d) =>
        context.registerTool(
          {
            ...d,
            annotations: {
              readOnlyHint: false,
              consequentialHint: false,
              untrustedContentHint: false,
              ...d.annotations,
            },
            execute: async (a: any, client: any) => {
              client?.signal?.throwIfAborted();
              return (d.execute as any)(a, client?.signal);
            },
          },
          { signal: controller.signal },
        ),
      ),
    )
      .then(() => {
        if (active) setStatus("Four native WebMCP tools registered");
      })
      .catch(() => {
        controller.abort();
        if (active)
          setStatus(
            "WebMCP registration unavailable; use the visible controls",
          );
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  return status;
}
