import type { Concept, CourseId } from "@/lib/curriculum";
import type { GraphSpec } from "@/lib/atlas/math";
export type StudyState = {
  visualLayout: "split" | "wide" | "minimised";
  sidebarOpen: boolean;
  setVisualLayout: (layout: "split" | "wide" | "minimised") => void;
  setSidebarOpen: (value: boolean) => void;
  concept: Concept;
  route: string;
  course: CourseId;
  search: string;
  noteTab: string;
  playing: boolean;
  activeScene: string;
  p: number;
  graph: GraphSpec;
  info: {
    min: number;
    max: number;
    step: number;
    initial: number;
    label: string;
  };
  open: (id: string) => void;
  show: (route: string) => void;
  chooseCourse: (id: CourseId) => void;
  setSearch: (q: string) => void;
  setNoteTab: (tab: string) => void;
  setP: (value: number) => void;
  setPlaying: (value: boolean) => void;
  reset: () => void;
  setVariant: (id: string) => void;
  plotAndWait: (graph: GraphSpec, signal?: AbortSignal) => Promise<unknown>;
};
export type JsonSchema = Record<string, unknown>;
export type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: { readOnlyHint: boolean };
  execute: (input: Record<string, unknown>, signal?: AbortSignal) => unknown;
};
export type ModelContext = {
  registerTool: (
    tool: Omit<Tool, "execute" | "annotations"> & {
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (
        input: unknown,
        client?: { signal?: AbortSignal },
      ) => Promise<unknown>;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
