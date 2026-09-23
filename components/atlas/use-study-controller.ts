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
import { saveResume } from "@/lib/curriculum/progress-store";
import { matchesConcept } from "@/lib/curriculum/search";
import { planarModel } from "@/lib/curriculum/planar";
import type { LessonMode } from "@/lib/curriculum/learning-modes";
import { useWebMCP, type StudyState } from "./webmcp";
import {
  graphUrl,
  lessonUrl,
  readGraphHistory,
  readLessonHistory,
  routeUrl,
  type LessonHistory,
} from "./study-history";
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
  const [readingMode, setReadingMode] = useState<LessonMode>("learn");
  const [notesRequest, setNotesRequest] = useState(0);
  const [historyNotice, setHistoryNotice] = useState("");
  const [returnTo, setReturnTo] = useState<{
    id: string;
    url: string;
    scrollY: number;
  } | null>(null);
  const pendingNotes = useRef(false);
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
  const scrollFrame = useRef(0);
  const saveScroll = () => {
    if (scrollFrame.current) {
      cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = 0;
    }
    history.replaceState(
      { ...(history.state ?? {}), studyScrollY: window.scrollY },
      "",
    );
  };
  const lessonState = (
    scene: string,
    parameter: number,
    mode: LessonMode,
    tab: LessonHistory["notesTab"],
  ): LessonHistory => ({ version: 1, scene, parameter, mode, notesTab: tab });
  const defaultLessonState = (c: Concept) =>
    lessonState(c.scene, experimentInfo(c.scene).initial, "learn", "intuition");
  function open(id: string) {
    const c = concepts.find((c) => c.id === id);
    if (!c) return;
    setSelected(id);
    setHistoryNotice("");
    saveResume(id);
    setSearch("");
    setCourse(c.course);
    setNoteTab("intuition");
    setReadingMode("learn");
    setVariant("");
    setExpanded(c.lecture);
    setRoute("lesson");
    setP(experimentInfo(c.scene).initial);
    setPlaying(false);
    if (sidebar.isMobile) sidebar.setOpenMobile(false);
    if (typeof window !== "undefined") {
      saveScroll();
      (window.location.hash.slice(1) === id
        ? history.replaceState
        : history.pushState
      ).call(
        history,
        { studyScrollY: 0 },
        "",
        lessonUrl(new URL(window.location.href), id, defaultLessonState(c)),
      );
    }
  }
  function openPrerequisite(id: string) {
    if (!concepts.some((item) => item.id === id)) return;
    setReturnTo(
      (current) =>
        current ?? {
          id: concept.id,
          url: lessonUrl(
            new URL(window.location.href),
            concept.id,
            lessonState(
              activeScene,
              p,
              readingMode,
              noteTab as LessonHistory["notesTab"],
            ),
          ),
          scrollY: window.scrollY,
        },
    );
    open(id);
  }
  function resumeLesson() {
    if (!returnTo) return;
    const target = returnTo;
    setReturnTo(null);
    saveScroll();
    history.pushState({ studyScrollY: target.scrollY }, "", target.url);
    restoreLocation();
  }
  useEffect(() => {
    if (route !== "lesson") return;
    document.getElementById("lesson-title")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [selected, route]);
  function showNotes(section: string) {
    pendingNotes.current = true;
    setNoteTab(section);
    setReadingMode("learn");
    setNotesRequest((value) => value + 1);
  }
  useLayoutEffect(() => {
    if (!pendingNotes.current) return;
    pendingNotes.current = false;
    const heading = document.getElementById(`notes-${noteTab}`);
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "start" });
  }, [noteTab, readingMode, notesRequest]);
  function show(r: string, selectedGraph = graph) {
    saveScroll();
    setRoute(r);
    setPlaying(false);
    sidebar.setOpenMobile(false);
    history.pushState(
      { studyScrollY: 0 },
      "",
      r === "graph"
        ? graphUrl(new URL(window.location.href), selectedGraph)
        : routeUrl(new URL(window.location.href), r),
    );
  }
  function restoreLocation() {
    const hash = window.location.hash.slice(1);
    if (hash === "graph" || hash === "course") {
      setRoute(hash);
      setPlaying(false);
      if (hash === "graph") {
        const parsed = readGraphHistory(new URL(window.location.href));
        const restored = parsed.kind === "valid" ? parsed.graph : initialGraph;
        setGraph(restored);
        setDraft(restored);
        setGraphError(parsed.kind === "invalid" ? parsed.explanation : "");
      }
    } else {
      const c = concepts.find((item) => item.id === hash);
      if (!c) {
        setRoute("course");
        return;
      }
      const parsed = readLessonHistory(
        new URL(window.location.href),
        c,
        experimentInfo,
      );
      const restored =
        parsed.kind === "valid" ? parsed.value : defaultLessonState(c);
      setSelected(c.id);
      setCourse(c.course);
      setExpanded(c.lecture);
      setRoute("lesson");
      setVariant(restored.scene === c.scene ? "" : restored.scene);
      setP(restored.parameter);
      setReadingMode(restored.mode);
      setNoteTab(restored.notesTab);
      setPlaying(false);
      setHistoryNotice(parsed.kind === "invalid" ? parsed.explanation : "");
    }
    const y = history.state?.studyScrollY;
    if (typeof y === "number" && Number.isFinite(y) && y >= 0)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => window.scrollTo(0, y)),
      );
  }
  const readLocation = useEffectEvent(restoreLocation);
  useEffect(() => {
    const read = () => readLocation();
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    const scroll = () => {
      if (scrollFrame.current) return;
      scrollFrame.current = requestAnimationFrame(() => {
        scrollFrame.current = 0;
        saveScroll();
      });
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
      window.removeEventListener("scroll", scroll);
      if (scrollFrame.current) cancelAnimationFrame(scrollFrame.current);
    };
  }, []);
  useEffect(() => {
    if (
      route !== "lesson" ||
      playing ||
      window.location.hash !== `#${selected}`
    )
      return;
    history.replaceState(
      history.state,
      "",
      lessonUrl(
        new URL(window.location.href),
        selected,
        lessonState(
          activeScene,
          p,
          readingMode,
          noteTab as LessonHistory["notesTab"],
        ),
      ),
    );
  }, [route, selected, activeScene, p, readingMode, noteTab, playing]);
  useEffect(() => {
    if (route !== "graph" || window.location.hash !== "#graph") return;
    history.replaceState(
      history.state,
      "",
      graphUrl(new URL(window.location.href), graph),
    );
  }, [route, graph]);
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
      show("graph", g);
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
    readingMode,
    setReadingMode,
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
    setNoteTab: showNotes,
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
  const filtered = (c: Concept) => matchesConcept(c, search);

  return {
    readingMode,
    returnTo,
    openPrerequisite,
    resumeLesson,
    historyNotice,
    setReadingMode,
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
    setNoteTab: showNotes,
  };
}
export type StudyController = ReturnType<typeof useStudyController>;
