"use client";
import { useEffect, useState, type RefObject } from "react";
import type { Concept } from "@/lib/curriculum";
import type { StudyState, ModelContext, JsonSchema } from "./study-types";
import { studyTools } from "./study-tools";
export type { StudyState } from "./study-types";
export function useWebMCP(
  concepts: Concept[],
  state: RefObject<StudyState | null>,
) {
  const [status, setStatus] = useState("Checking browser support");
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) {
      setStatus(
        "WebMCP is unavailable in this browser. All controls remain usable here.",
      );
      return;
    }
    const lifecycle = new AbortController();
    let active = true;
    const current = () => {
      if (!state.current) throw new Error("Study state is not ready.");
      return state.current;
    };
    const defs = studyTools(concepts, current);
    Promise.all(
      defs.map((d) =>
        Promise.resolve().then(() =>
          context.registerTool(
            {
              ...d,
              annotations: {
                readOnlyHint: d.annotations?.readOnlyHint ?? false,
                untrustedContentHint: false,
              },
              execute: async (input, client) => {
                client?.signal?.throwIfAborted();
                if (!input || typeof input !== "object" || Array.isArray(input))
                  throw new Error("Input must be an object.");
                const args = input as Record<string, unknown>,
                  props = d.inputSchema.properties as JsonSchema;
                if (Object.keys(args).some((k) => !Object.hasOwn(props, k)))
                  throw new Error("Unknown input field.");
                for (const key of d.inputSchema.required as string[])
                  if (!Object.hasOwn(args, key))
                    throw new Error("Missing required field: " + key);
                return JSON.stringify(await d.execute(args, client?.signal));
              },
            },
            { signal: lifecycle.signal },
          ),
        ),
      ),
    )
      .then(() => {
        if (active) setStatus(`${defs.length} WebMCP tools available.`);
      })
      .catch(() => {
        lifecycle.abort();
        if (active)
          setStatus(
            "WebMCP registration failed; visible controls remain available.",
          );
      });
    return () => {
      active = false;
      lifecycle.abort();
    };
  }, [concepts, state]);
  return status;
}
