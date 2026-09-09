import {
  courseIds,
  courses,
  sources,
  type Concept,
  type CourseId,
} from "@/lib/curriculum";
import { initialGraph, validateGraph, type GraphSpec } from "@/lib/atlas/math";
import type { StudyState, Tool, JsonSchema } from "./study-types";
const afterRender = () =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 300);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        clearTimeout(timer);
        resolve();
      }),
    );
  });
const schema = (properties: JsonSchema, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const string = (x: unknown, name: string, max = 400) => {
  if (typeof x !== "string" || x.length > max)
    throw new Error(`${name} must be a string of at most ${max} characters.`);
  return x;
};
const finite = (x: unknown, name: string) => {
  if (typeof x !== "number" || !Number.isFinite(x))
    throw new Error(`${name} must be finite.`);
  return x;
};
export function sceneVariants(concept: Concept) {
  return concept.scene === "elementarycurves"
    ? [
        "elementarycurves",
        "curveCircle",
        "curveEllipse",
        "curveCusp",
        "curveLine",
        "curves",
      ]
    : concept.id === "surface-orientation"
      ? ["parametric", "mobius"]
      : concept.id === "conservative-domains"
        ? ["conservative", "vortex"]
        : [concept.scene];
}
export function studyTools(
  concepts: Concept[],
  current: () => StudyState,
): Tool[] {
  const snapshot = () => {
    const s = current();
    return {
      visualLayout: s.visualLayout,
      sidebarOpen: s.sidebarOpen,
      route: s.route,
      course: s.course,
      query: s.search,
      conceptId: s.concept.id,
      scene: s.activeScene,
      parameter: s.p,
      range: [s.info.min, s.info.max],
      step: s.info.step,
      notesTab: s.noteTab,
      playing: s.playing,
      graph: s.graph,
    };
  };
  return [
    {
      name: "set_workspace_layout",
      title: "Adjust reading and graph space",
      description:
        "Set the visualisation to split, wide or minimised and show or hide the course sidebar. Shared with visible controls.",
      inputSchema: schema({
        visualisation: {
          type: "string",
          enum: ["split", "wide", "minimised"],
        },
        sidebarOpen: { type: "boolean" },
      }),
      execute: (a) => {
        if (
          a.visualisation !== undefined &&
          !["split", "wide", "minimised"].includes(String(a.visualisation))
        )
          throw new Error("Unknown visualisation layout.");
        if (a.sidebarOpen !== undefined && typeof a.sidebarOpen !== "boolean")
          throw new Error("sidebarOpen must be boolean.");
        if (a.visualisation !== undefined)
          current().setVisualLayout(
            a.visualisation as StudyState["visualLayout"],
          );
        if (a.sidebarOpen !== undefined)
          current().setSidebarOpen(a.sidebarOpen as boolean);
        return { status: "updated" };
      },
    },
    {
      name: "list_concepts",
      title: "Find calculus concepts",
      description:
        "Search the three-course library by text, course or lecture/chapter. Read-only; returns IDs for open_concept.",
      inputSchema: schema({
        course: { type: "string", enum: courseIds },
        lecture: { type: "integer", minimum: 1, maximum: 13 },
        query: { type: "string", maxLength: 100 },
      }),
      annotations: { readOnlyHint: true },
      execute: (a) => {
        if (a.course !== undefined && !courseIds.includes(a.course as CourseId))
          throw new Error("Unknown course.");
        if (
          a.lecture !== undefined &&
          (!Number.isInteger(a.lecture) ||
            Number(a.lecture) < 1 ||
            Number(a.lecture) > 13)
        )
          throw new Error("Lecture must be an integer from 1 to 13.");
        const q =
          a.query === undefined
            ? ""
            : string(a.query, "query", 100).toLowerCase();
        return concepts
          .filter(
            (c) =>
              (a.course === undefined || c.course === a.course) &&
              (a.lecture === undefined || c.lecture === a.lecture) &&
              `${c.title} ${c.topics.join(" ")}`.toLowerCase().includes(q),
          )
          .map((c) => ({
            id: c.id,
            title: c.title,
            course: c.course,
            unit: c.lecture,
          }));
      },
    },
    {
      name: "read_concept",
      title: "Read a concept and its sources",
      description:
        "Return original notes, exact source pages and links for one concept without navigating.",
      inputSchema: schema({ conceptId: { type: "string" } }, ["conceptId"]),
      annotations: { readOnlyHint: true },
      execute: (a) => {
        const c = concepts.find((c) => c.id === a.conceptId);
        if (!c) throw new Error("Unknown concept ID.");
        return {
          ...c,
          sources: c.sources.map((r) => ({
            ...r,
            source: sources[r.sourceId],
          })),
        };
      },
    },
    {
      name: "get_study_state",
      title: "Read current study state",
      description:
        "Read the visible course, lesson, notes tab, experiment and graph configuration.",
      inputSchema: schema({}),
      annotations: { readOnlyHint: true },
      execute: snapshot,
    },
    {
      name: "open_concept",
      title: "Open an exploration",
      description:
        "Navigate to a concept, show its experiment and reset its parameter and notes to their defaults.",
      inputSchema: schema({ conceptId: { type: "string" } }, ["conceptId"]),
      execute: async (a) => {
        const c = concepts.find((c) => c.id === a.conceptId);
        if (!c) throw new Error("Unknown concept ID. Call list_concepts.");
        current().open(c.id);
        await afterRender();
        return snapshot();
      },
    },
    {
      name: "browse_course",
      title: "Browse a course",
      description:
        "Show the visible course library and optionally filter it by a search query.",
      inputSchema: schema(
        {
          course: { type: "string", enum: courseIds },
          query: { type: "string", maxLength: 100 },
        },
        ["course"],
      ),
      execute: async (a) => {
        if (!courseIds.includes(a.course as CourseId))
          throw new Error("Unknown course.");
        const q = a.query === undefined ? "" : string(a.query, "query", 100);
        current().setSearch(q);
        current().chooseCourse(a.course as CourseId);
        await afterRender();
        return { ...snapshot(), title: courses[a.course as CourseId].title };
      },
    },
    {
      name: "set_notes_tab",
      title: "Read a notes section",
      description:
        "Show the derivation, worked example or subtleties tab of the current visible lesson.",
      inputSchema: schema(
        {
          tab: { type: "string", enum: ["intuition", "example", "pitfall"] },
        },
        ["tab"],
      ),
      execute: async (a) => {
        if (current().route !== "lesson")
          throw new Error("Open a concept first.");
        if (!["intuition", "example", "pitfall"].includes(String(a.tab)))
          throw new Error("Unknown notes tab.");
        current().setNoteTab(String(a.tab));
        await afterRender();
        return snapshot();
      },
    },
    {
      name: "set_visual_parameter",
      title: "Adjust the experiment",
      description:
        "Set the active lesson parameter or graph parameter a. Discrete parameters snap to their displayed step. Stops lesson animation.",
      inputSchema: schema({ value: { type: "number" } }, ["value"]),
      execute: async (a) => {
        const s = current();
        if (!["lesson", "graph"].includes(s.route))
          throw new Error("Open a lesson or graph first.");
        const v = finite(a.value, "value");
        const [min, max] =
          s.route === "graph" ? [-5, 5] : [s.info.min, s.info.max];
        if (v < min || v > max)
          throw new Error(`Choose a value between ${min} and ${max}.`);
        if (s.route === "graph") await s.plotAndWait({ ...s.graph, a: v });
        else s.setP(v);
        await afterRender();
        return snapshot();
      },
    },
    {
      name: "set_experiment_animation",
      title: "Play or pause an experiment",
      description: "Start or stop the current lesson’s parameter animation.",
      inputSchema: schema({ playing: { type: "boolean" } }, ["playing"]),
      execute: async (a) => {
        if (current().route !== "lesson")
          throw new Error("Open a concept first.");
        if (typeof a.playing !== "boolean")
          throw new Error("playing must be boolean.");
        current().setPlaying(a.playing);
        await afterRender();
        return snapshot();
      },
    },
    {
      name: "reset_experiment",
      title: "Reset an experiment",
      description:
        "Reset the current lesson’s parameter and camera; stop animation.",
      inputSchema: schema({}),
      execute: async () => {
        if (current().route !== "lesson")
          throw new Error("Open a concept first.");
        current().reset();
        await afterRender();
        return snapshot();
      },
    },
    {
      name: "set_scene_model",
      title: "Choose an experiment variant",
      description:
        "Select an available model of the current concept. Read available IDs from list_scene_models.",
      inputSchema: schema({ scene: { type: "string" } }, ["scene"]),
      execute: async (a) => {
        const s = current();
        if (s.route !== "lesson") throw new Error("Open a concept first.");
        if (!sceneVariants(s.concept).includes(String(a.scene)))
          throw new Error("Scene is not a variant of the current concept.");
        s.setVariant(String(a.scene));
        await afterRender();
        return snapshot();
      },
    },
    {
      name: "list_scene_models",
      title: "List experiment variants",
      description: "Read the scene IDs available for the selected concept.",
      inputSchema: schema({}),
      annotations: { readOnlyHint: true },
      execute: () => ({
        conceptId: current().concept.id,
        scenes: sceneVariants(current().concept),
      }),
    },
    {
      name: "configure_graph",
      title: "Plot any supported graph",
      description:
        "Validate and render a surface, parametric surface, space curve or implicit surface with the same controls as Graph studio. Acknowledges only after rendering.",
      inputSchema: schema(
        {
          mode: {
            type: "string",
            enum: ["surface", "parametric", "curve", "implicit"],
          },
          expressions: {
            type: "array",
            items: { type: "string", maxLength: 400 },
            minItems: 1,
            maxItems: 3,
          },
          min: { type: "number" },
          max: { type: "number" },
          vmin: { type: "number" },
          vmax: { type: "number" },
          clip: { type: "number" },
          a: { type: "number" },
        },
        ["mode", "expressions"],
      ),
      execute: async (a, signal) => {
        if (
          !Array.isArray(a.expressions) ||
          !a.expressions.every((e) => typeof e === "string")
        )
          throw new Error("expressions must be a string array.");
        const g: GraphSpec = {
          ...initialGraph,
          mode: a.mode as GraphSpec["mode"],
          expressions: a.expressions,
        };
        for (const key of ["min", "max", "vmin", "vmax", "clip", "a"] as const)
          if (a[key] !== undefined) g[key] = finite(a[key], key);
        if (Math.abs(g.a) > 5)
          throw new Error("Parameter a must be between -5 and 5.");
        validateGraph(g);
        await current().plotAndWait(g, signal);
        await afterRender();
        return snapshot();
      },
    },
    {
      name: "graph_function",
      title: "Plot a function",
      description:
        "Convenience surface plot of z=f(x,y). Values are finite numerical samples, not symbolic verification.",
      inputSchema: schema(
        {
          expression: { type: "string", maxLength: 400 },
          xMin: { type: "number" },
          xMax: { type: "number" },
          yMin: { type: "number" },
          yMax: { type: "number" },
          heightClip: { type: "number" },
        },
        ["expression"],
      ),
      execute: async (a, signal) => {
        const g: GraphSpec = {
          ...initialGraph,
          expressions: [string(a.expression, "expression")],
        };
        for (const [from, to] of [
          ["xMin", "min"],
          ["xMax", "max"],
          ["yMin", "vmin"],
          ["yMax", "vmax"],
          ["heightClip", "clip"],
        ] as const)
          if (a[from] !== undefined) g[to] = finite(a[from], from);
        validateGraph(g);
        await current().plotAndWait(g, signal);
        await afterRender();
        return snapshot();
      },
    },
  ];
}
