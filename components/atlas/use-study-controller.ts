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
import { useStudyRecord, useInlineStudy } from "./study-records";
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
import { libraryUrl, readLibraryHistory } from "./library-history";
import { clinicCase, type ClinicCaseId } from "@/lib/clinic/cases";
import {
  clinicUrl,
  readClinicHistory,
  readClinicReturn,
  readClinicPosition,
  clinicFocusIds,
  type ClinicLocation,
  type ClinicReturn,
} from "./clinic-history";
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
  const resumeRecord = useStudyRecord({ kind: "resume" });
  const inlineStudy = useInlineStudy();
  const [selected, setSelected] = useState(defaultId),
    [route, setRoute] = useState("course"),
    [expanded, setExpanded] = useState(6),
    [search, setSearch] = useState("");
  const [course, setCourse] = useState<CourseId>("MH1100");
  const [noteTab, setNoteTab] = useState("intuition");
  const [readingMode, setReadingMode] = useState<LessonMode>("learn");
  const [notesRequest, setNotesRequest] = useState(0);
  const [historyNotice, setHistoryNotice] = useState("");
  const [clinicLocation, setClinicLocation] = useState<ClinicLocation>({
    caseId: null,
    notice: "",
  });
  const [clinicReturn, setClinicReturn] = useState<ClinicReturn | null>(null);
  const [navigationFocus, setNavigationFocus] = useState<{
    id: string;
    scrollY: number;
  } | null>(null);
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
    setClinicReturn(null);
    setNavigationFocus({ id: "lesson-title", scrollY: 0 });
    setHistoryNotice("");
    void resumeRecord.save({ lessonId: id });
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
  useLayoutEffect(() => {
    if (!navigationFocus) return;
    const frame = requestAnimationFrame(() => {
      const target =
        document.getElementById(navigationFocus.id) ??
        document.getElementById(
          route === "clinic" ? "clinic-case-title" : "lesson-title",
        );
      target?.focus({ preventScroll: true });
      window.scrollTo({ top: navigationFocus.scrollY, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [navigationFocus, route]);
  function openClinic(id: ClinicCaseId | null = null, position?: ClinicReturn) {
    saveScroll();
    history.pushState(
      {
        studyScrollY: position?.scrollY ?? 0,
        ...(position ? { clinicPosition: position } : {}),
      },
      "",
      clinicUrl(new URL(window.location.href), id),
    );
    restoreLocation();
    sidebar.setOpenMobile(false);
  }
  function openClinicRecovery(lessonId: string, origin: ClinicReturn) {
    const target = concepts.find((item) => item.id === lessonId);
    if (!target) return;
    saveScroll();
    history.replaceState({ ...history.state, clinicPosition: origin }, "");
    history.pushState(
      { studyScrollY: 0, clinicReturn: origin },
      "",
      lessonUrl(
        new URL(window.location.href),
        target.id,
        defaultLessonState(target),
      ),
    );
    setReturnTo(null);
    restoreLocation();
    sidebar.setOpenMobile(false);
  }
  function returnToClinic() {
    if (clinicReturn) openClinic(clinicReturn.caseId, clinicReturn);
  }
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
  function show(r: string, selectedGraph = graph, libraryCourse = course) {
    if (r === "clinic") {
      openClinic();
      return;
    }
    saveScroll();
    setClinicReturn(null);
    setRoute(r);
    setPlaying(false);
    sidebar.setOpenMobile(false);
    history.pushState(
      { studyScrollY: 0 },
      "",
      r === "graph"
        ? graphUrl(new URL(window.location.href), selectedGraph)
        : r === "course"
          ? libraryUrl(new URL(window.location.href), libraryCourse, search)
          : routeUrl(new URL(window.location.href), r),
    );
    setNavigationFocus({
      id: r === "graph" ? "graph-title" : "library-title",
      scrollY: 0,
    });
  }
  function chooseCourse(id: CourseId) {
    setHistoryNotice("");
    setCourse(id);
    setExpanded(1);
    show("course", graph, id);
  }
  function updateSearch(value: string) {
    setHistoryNotice("");
    const query = value.slice(0, 100);
    setSearch(query);
    if (route === "course")
      history.replaceState(
        history.state,
        "",
        libraryUrl(new URL(window.location.href), course, query),
      );
  }
  function restoreLocation(focusFallback = true) {
    const hash = window.location.hash.slice(1);
    setClinicReturn(null);
    let focusId = "library-title";
    let restoredY: number | null = null;
    if (hash === "clinic") {
      const parsed = readClinicHistory(new URL(window.location.href));
      setClinicLocation(parsed);
      setRoute("clinic");
      setPlaying(false);
      if (parsed.caseId) setCourse(clinicCase(parsed.caseId).course);
      const position = readClinicPosition(history.state, parsed.caseId);
      focusId = position
        ? clinicFocusIds[position.focus]
        : parsed.caseId
          ? "clinic-case-title"
          : "clinic-title";
      if (position) restoredY = position.scrollY;
    } else if (hash === "graph" || hash === "course") {
      setRoute(hash);
      setPlaying(false);
      if (hash === "course") {
        const parsed = readLibraryHistory(new URL(window.location.href));
        setCourse(parsed.kind === "valid" ? parsed.value.course : "MH1100");
        setSearch(parsed.kind === "valid" ? parsed.value.query : "");
        setHistoryNotice(parsed.kind === "invalid" ? parsed.explanation : "");
      }
      if (hash === "graph") {
        focusId = "graph-title";
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
        if (focusFallback)
          setNavigationFocus({ id: "library-title", scrollY: 0 });
        return;
      }
      const parsed = readLessonHistory(
        new URL(window.location.href),
        c,
        experimentInfo,
      );
      const restored =
        parsed.kind === "valid" ? parsed.value : defaultLessonState(c);
      setClinicReturn(readClinicReturn(history.state, c.id));
      focusId = "lesson-title";
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
    const y = history.state?.studyScrollY ?? restoredY;
    setNavigationFocus({
      id: focusId,
      scrollY: typeof y === "number" && Number.isFinite(y) && y >= 0 ? y : 0,
    });
  }
  const readLocation = useEffectEvent(restoreLocation);
  useEffect(() => {
    const read = () => readLocation();
    readLocation(false);
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
    inlineSnapshot: inlineStudy.snapshot,
    setInline: inlineStudy.set,
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
    setSearch: updateSearch,
    chooseCourse,
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
    clinicLocation,
    clinicReturn,
    openClinic,
    openClinicRecovery,
    returnToClinic,
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
    setSearch: updateSearch,
    chooseCourse,
    setNoteTab: showNotes,
  };
}
export type StudyController = ReturnType<typeof useStudyController>;
