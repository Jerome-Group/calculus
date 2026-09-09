"use client";
import {
  useEffect,
  useLayoutEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  settleGraphRender,
  type PendingGraphRender,
} from "@/lib/atlas/render-completion";
import { useSidebar } from "@/components/ui/sidebar";
import { sceneInfo } from "@/lib/atlas/scenes";
import { type GraphSpec, initialGraph, validateGraph } from "@/lib/atlas/math";
import {
  type Concept,
  type CourseId,
  concepts,
  courses,
} from "@/lib/curriculum";
import { planarModel } from "@/lib/curriculum/planar";
import { useWebMCP, type StudyState } from "./webmcp";
const experimentInfo = (id: string) =>
  id.startsWith("plane-")
    ? {
        ...planarModel(id),
        readout: (p: number) => planarModel(id, p).readout,
        legend: [] as string[],
      }
    : sceneInfo(id);
const defaultId = "derivative-definition";
export function useStudyController() {
  const [selected, setSelected] = useState(defaultId),
    [route, setRoute] = useState("course"),
    [expanded, setExpanded] = useState(6),
    [search, setSearch] = useState("");
  const [course, setCourse] = useState<CourseId>("MH1100");
  const [noteTab, setNoteTab] = useState("intuition");
  const [visualLayout, setVisualLayout] = useState<
    "split" | "wide" | "minimised"
  >("split");
  const lectures = courses[course].units;
  const [p, setP] = useState(experimentInfo("plane-secant").initial),
    [playing, setPlaying] = useState(false),
    [resetKey, setReset] = useState(0),
    [variant, setVariant] = useState(""),
    [status, setStatus] = useState(""),
    [graph, setGraph] = useState<GraphSpec>(initialGraph),
    [draft, setDraft] = useState<GraphSpec>(initialGraph),
    [graphError, setGraphError] = useState("");
  const sidebar = useSidebar();
  const concept = concepts.find((c) => c.id === selected) || concepts[0],
    activeScene = variant || concept.scene,
    info = experimentInfo(activeScene);
  const planar = activeScene.startsWith("plane-")
    ? planarModel(activeScene, p)
    : null;
  const index = concepts.indexOf(concept);
  const state = useRef<StudyState | null>(null),
    renderPending = useRef<PendingGraphRender | null>(null);
  function open(id: string) {
    const c = concepts.find((c) => c.id === id);
    if (!c) return;
    setSelected(id);
    setSearch("");
    setCourse(c.course);
    setNoteTab("intuition");
    setVariant("");
    setExpanded(c.lecture);
    setRoute("lesson");
    setP(experimentInfo(c.scene).initial);
    setPlaying(false);
    if (sidebar.isMobile) sidebar.setOpenMobile(false);
    if (typeof window !== "undefined")
      (window.location.hash.slice(1) === id
        ? history.replaceState
        : history.pushState
      ).call(history, null, "", "#" + id);
  }
  function show(r: string) {
    setRoute(r);
    setPlaying(false);
    sidebar.setOpenMobile(false);
    history.pushState(null, "", "#" + r);
  }
  const readLocation = useEffectEvent(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "graph" || hash === "course") {
      setRoute(hash);
      setPlaying(false);
    } else if (concepts.some((c) => c.id === hash)) open(hash);
  });
  useEffect(() => {
    const read = () => readLocation();
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const tick = window.setInterval(
      () =>
        setP((v) => {
          const next =
            v + (info.step >= 1 ? info.step : (info.max - info.min) / 180);
          return next > info.max ? info.min : Math.min(info.max, next);
        }),
      65,
    );
    return () => clearInterval(tick);
  }, [playing, activeScene, info.min, info.max, info.step]);
  function plot(g: GraphSpec) {
    try {
      validateGraph(g);
      setGraph({ ...g, expressions: [...g.expressions] });
      setDraft(g);
      setGraphError("");
      show("graph");
      return {
        status: "plotted",
        expression: g.expressions,
        domain: [g.min, g.max, g.vmin, g.vmax],
      };
    } catch (e) {
      const message = (e as Error).message;
      setGraphError(message);
      throw new Error(message);
    }
  }
  function rendered(message: string, fingerprint?: string) {
    if (fingerprint !== JSON.stringify(graph)) return;
    setStatus(message);
    if (settleGraphRender(renderPending.current, fingerprint, message))
      renderPending.current = null;
  }

  function plotAndWait(g: GraphSpec, signal?: AbortSignal) {
    return new Promise((resolve, reject) => {
      validateGraph(g);
      if (renderPending.current)
        renderPending.current.reject(
          new Error("A newer graph request superseded this one."),
        );
      const timer = setTimeout(() => {
        if (renderPending.current) {
          renderPending.current = null;
          reject(new Error("Rendering did not finish within 20 seconds."));
        }
      }, 20000);
      const done = (fn: (value: unknown) => void) => (v: unknown) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        fn(v);
      };
      const abort = () => {
        renderPending.current = null;
        done(reject)(new Error("Graph request cancelled."));
      };
      signal?.addEventListener("abort", abort, { once: true });
      renderPending.current = {
        fingerprint: JSON.stringify(g),
        resolve: done(resolve),
        reject: done(reject),
      };
      try {
        plot(g);
      } catch (e) {
        renderPending.current = null;
        done(reject)(e);
      }
    });
  }
  const studyState: StudyState = {
    plotAndWait,
    visualLayout,
    sidebarOpen: sidebar.isMobile ? sidebar.openMobile : sidebar.open,
    setVisualLayout: (layout) => {
      setVisualLayout(layout);
      if (layout === "minimised") setPlaying(false);
    },
    setSidebarOpen: (value) =>
      sidebar.isMobile ? sidebar.setOpenMobile(value) : sidebar.setOpen(value),
    concept,
    route,
    p,
    graph,
    info,
    open,
    setP: (v: number) => {
      if (route !== "lesson")
        throw new Error("Open a concept before changing its parameter.");
      setPlaying(false);
      setP(
        info.step >= 1
          ? Math.max(
              info.min,
              Math.min(
                info.max,
                info.min + Math.round((v - info.min) / info.step) * info.step,
              ),
            )
          : v,
      );
    },
    show,
    course,
    search,
    noteTab,
    playing,
    activeScene,
    setNoteTab,
    setSearch,
    chooseCourse: (id: CourseId) => {
      setCourse(id);
      setExpanded(1);
      show("course");
    },
    reset: () => {
      setP(info.initial);
      setPlaying(false);
      setReset((v) => v + 1);
    },
    setPlaying,
    setVariant: (id: string) => {
      setVariant(id);
      setP(experimentInfo(id).initial);
      setPlaying(false);
    },
  };
  useLayoutEffect(() => {
    state.current = studyState;
  });
  function chooseModel(id: string) {
    setVariant(id);
    setP(experimentInfo(id).initial);
    setPlaying(false);
  }
  const webmcp = useWebMCP(concepts, state);
  const filtered = (c: Concept) =>
    !search ||
    (c.title + " " + c.topics.join(" "))
      .toLowerCase()
      .includes(search.toLowerCase());

  return {
    planar,
    chooseModel,
    selected,
    route,
    expanded,
    search,
    course,
    noteTab,
    visualLayout,
    setVisualLayout,
    lectures,
    p,
    setP,
    playing,
    setPlaying,
    resetKey,
    setReset,
    variant,
    setVariant,
    status,
    graph,
    setGraph,
    draft,
    setDraft,
    graphError,
    sidebar,
    concept,
    activeScene,
    info,
    index,
    open,
    show,
    plot,
    rendered,
    webmcp,
    filtered,
    setCourse,
    setExpanded,
    setSearch,
    setNoteTab,
  };
}
export type StudyController = ReturnType<typeof useStudyController>;
