"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  ChevronDown,
  Code2,
  Compass,
  ExternalLink,
  FunctionSquare,
  List,
  Pause,
  Play,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Viewport } from "./viewport";
import { Formula, MathText } from "./math-text";
import { sceneInfo, sceneTex, legendColors } from "@/lib/atlas/scenes";
import { type GraphSpec, initialGraph, validateGraph } from "@/lib/atlas/math";
import { type Concept, lectures } from "@/lib/atlas/types";
import data from "@/lib/atlas/concepts.json";
import { useWebMCP } from "./webmcp";
const concepts = data as Concept[];
const defaultId = "curves-and-parametrizations";
const presets = [
  {
    name: "Radial wave",
    mode: "surface",
    expressions: ["sin(sqrt(x^2+y^2))"],
    min: -5,
    max: 5,
    vmin: -5,
    vmax: 5,
    clip: 3,
  },
  {
    name: "Saddle",
    mode: "surface",
    expressions: ["x^2-y^2"],
    min: -2,
    max: 2,
    vmin: -2,
    vmax: 2,
    clip: 5,
  },
  {
    name: "Path-dependent limit",
    mode: "surface",
    expressions: ["x*y/(x^2+y^2)"],
    min: -2,
    max: 2,
    vmin: -2,
    vmax: 2,
    clip: 2,
  },
  {
    name: "Torus",
    mode: "parametric",
    expressions: ["(2+cos(v))*cos(u)", "(2+cos(v))*sin(u)", "sin(v)"],
    min: 0,
    max: 6.283185307,
    vmin: 0,
    vmax: 6.283185307,
    clip: 4,
  },
  {
    name: "Helix",
    mode: "curve",
    expressions: ["cos(t)", "sin(t)", "t/3"],
    min: -9.42478,
    max: 9.42478,
    vmin: -1,
    vmax: 1,
    clip: 4,
  },
  {
    name: "Implicit sphere",
    mode: "implicit",
    expressions: ["x^2+y^2+z^2-4"],
    min: -2.5,
    max: 2.5,
    vmin: -2.5,
    vmax: 2.5,
    clip: 2.5,
  },
] as const;
function AtlasInner() {
  const [selected, setSelected] = useState(defaultId),
    [route, setRoute] = useState("lesson"),
    [expanded, setExpanded] = useState(1),
    [search, setSearch] = useState("");
  const [p, setP] = useState(sceneInfo("curves").initial),
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
    info = sceneInfo(activeScene);
  const index = concepts.indexOf(concept);
  const state = useRef<any>(null),
    renderPending = useRef<any>(null);
  function open(id: string) {
    const c = concepts.find((c) => c.id === id);
    if (!c) return;
    setSelected(id);
    setVariant("");
    setExpanded(c.lecture);
    setRoute("lesson");
    setP(sceneInfo(c.scene).initial);
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
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "graph" || hash === "course") setRoute(hash);
      else if (concepts.some((c) => c.id === hash)) open(hash);
    };
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
  }, [playing, activeScene]);
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
  function rendered(message: string) {
    setStatus(message);
    if (renderPending.current) {
      const pending = renderPending.current;
      renderPending.current = null;
      message.startsWith("Error:")
        ? pending.reject(new Error(message))
        : pending.resolve({ status: "rendered", detail: message });
    }
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
      const done = (fn: any) => (v: any) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        fn(v);
      };
      const abort = () => {
        renderPending.current = null;
        done(reject)(new Error("Graph request cancelled."));
      };
      signal?.addEventListener("abort", abort, { once: true });
      renderPending.current = { resolve: done(resolve), reject: done(reject) };
      try {
        plot(g);
      } catch (e) {
        renderPending.current = null;
        done(reject)(e);
      }
    });
  }
  state.current = {
    plotAndWait,
    concept,
    route,
    p,
    graph,
    info,
    open,
    plot,
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
    setDraft,
  };
  const webmcp = useWebMCP(concepts, state);
  const filtered = (c: Concept) =>
    !search ||
    (c.title + " " + c.topics.join(" "))
      .toLowerCase()
      .includes(search.toLowerCase());
  return (
    <>
      <Sidebar className="atlas-sidebar">
        <SidebarHeader className="brand">
          <a
            href="#course"
            onClick={(e) => {
              e.preventDefault();
              show("course");
            }}
            className="brand-link"
          >
            <span className="atlas-wordmark">
              atlas<span>.</span>
            </span>
            <span className="brand-course">
              MH2100<small>CALCULUS III</small>
            </span>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-intro">
            <span>THE COURSE</span>
            <button aria-label="Course overview" onClick={() => show("course")}>
              <List size={17} />
            </button>
          </div>
          <label className="concept-search">
            <Search size={15} />
            <input
              aria-label="Find a concept"
              placeholder="Find a concept…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button aria-label="Clear search" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </label>
          <nav aria-label="Lectures">
            {lectures.map((title, i) => {
              const list = concepts.filter(
                (c) => c.lecture === i + 1 && filtered(c),
              );
              if (!list.length) return null;
              return (
                <div className="lecture-group" key={title}>
                  <button
                    className={
                      "lecture-toggle" + (expanded === i + 1 ? " expanded" : "")
                    }
                    onClick={() => setExpanded(expanded === i + 1 ? 0 : i + 1)}
                    aria-expanded={expanded === i + 1 || !!search}
                  >
                    <span className="lecture-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{title}</span>
                    <ChevronDown size={14} />
                  </button>
                  {(expanded === i + 1 || search) && (
                    <div className="concept-nav">
                      {list.map((c) => (
                        <button
                          key={c.id}
                          className={
                            selected === c.id && route === "lesson"
                              ? "active"
                              : ""
                          }
                          onClick={() => open(c.id)}
                          aria-current={
                            selected === c.id && route === "lesson"
                              ? "page"
                              : undefined
                          }
                        >
                          {c.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {search && !concepts.some(filtered) && (
              <p className="empty-search">
                No matching concept. Try “limit”, “flux”, or “Jacobian”.
              </p>
            )}
          </nav>
        </SidebarContent>
        <SidebarFooter className="side-footer">
          <button
            className={"graph-link " + (route === "graph" ? "active" : "")}
            onClick={() => show("graph")}
          >
            <FunctionSquare size={20} />
            <span>
              Graph machine<small>Your functions, in 3D</small>
            </span>
            <ArrowRight size={16} />
          </button>
          <span className="source-note">
            Independent study companion
            <br />
            AY2026–27 · Lecture sequence
          </span>
        </SidebarFooter>
      </Sidebar>
      <main className="atlas-main">
        <header className="topbar">
          <div>
            <SidebarTrigger aria-label="Toggle lecture navigation" />
            <span>MH2100</span>
            <span className="slash">/</span>
            <span>
              {route === "lesson"
                ? `Lecture ${String(concept.lecture).padStart(2, "0")}`
                : route === "graph"
                  ? "Graph machine"
                  : "Course overview"}
            </span>
          </div>
          <div className="top-tabs">
            <button
              className={route !== "graph" ? "selected" : ""}
              onClick={() => open(selected)}
            >
              <BookOpen size={15} /> Explore
            </button>
            <button
              className={route === "graph" ? "selected" : ""}
              onClick={() => show("graph")}
            >
              <FunctionSquare size={15} /> Graph
            </button>
          </div>
        </header>
        {route === "lesson" ? (
          <>
            <div className="lesson-heading">
              <div className="eyebrow">
                LECTURE {String(concept.lecture).padStart(2, "0")}
                <span> / </span>
                {lectures[concept.lecture - 1]}
              </div>
              <h1>{concept.title}</h1>
              <p>{concept.subtitle}</p>
            </div>
            <div className="study-grid">
              <section className="experience">
                <Viewport
                  scene={activeScene}
                  parameter={p}
                  resetKey={resetKey}
                />
                <div className="scene-equation">
                  <Formula>{sceneTex(activeScene)}</Formula>
                </div>
                <div className="legend">
                  {info.legend.map((l, i) => (
                    <span key={l}>
                      <i
                        style={{ background: legendColors(activeScene)[i % 4] }}
                      />
                      {l}
                    </span>
                  ))}
                </div>
                <p className="scale-note">
                  Sampled geometry; formulas establish the claims. Field and
                  normal arrows use scaled lengths.
                </p>
                {[
                  "elementarycurves",
                  "surface-orientation",
                  "conservative-domains",
                ].includes(concept.scene) ||
                ["surface-orientation", "conservative-domains"].includes(
                  concept.id,
                ) ? (
                  <div className="variant-select">
                    <span>Explore a model</span>
                    <Select
                      value={activeScene}
                      onValueChange={(v) => {
                        setVariant(v);
                        setP(sceneInfo(v).initial);
                        setPlaying(false);
                      }}
                    >
                      <SelectTrigger aria-label="Scene model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(concept.scene === "elementarycurves"
                          ? [
                              ["elementarycurves", "Cycloid"],
                              ["curveCircle", "Circle"],
                              ["curveEllipse", "Ellipse"],
                              ["curveCusp", "Cusp"],
                              ["curveLine", "Line"],
                              ["curves", "Helix"],
                            ]
                          : concept.id === "surface-orientation"
                            ? [
                                ["parametric", "Sphere chart"],
                                ["mobius", "Möbius strip"],
                              ]
                            : [
                                ["conservative", "Potential field"],
                                ["vortex", "Punctured-plane field"],
                              ]
                        ).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="control-panel">
                  <div className="control-heading">
                    <label id="parameter-label">{info.label}</label>
                    <output>
                      {info.step >= 1 ? String(p) : `≈ ${p.toFixed(2)}`}
                    </output>
                    <button
                      title={
                        playing
                          ? "Pause parameter animation"
                          : "Animate parameter"
                      }
                      aria-label={
                        playing ? "Pause animation" : "Animate parameter"
                      }
                      onClick={() => setPlaying(!playing)}
                    >
                      {playing ? <Pause size={17} /> : <Play size={17} />}
                    </button>
                    <button
                      title="Reset experiment"
                      aria-label="Reset experiment"
                      onClick={() => {
                        setP(info.initial);
                        setPlaying(false);
                        setReset((v) => v + 1);
                      }}
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                  <Slider
                    aria-labelledby="parameter-label"
                    min={info.min}
                    max={info.max}
                    step={info.step}
                    value={[p]}
                    onValueChange={(v) => {
                      setP(v[0]);
                      setPlaying(false);
                    }}
                  />
                  <div className="slider-ends">
                    <span>{Number(info.min.toFixed(2))}</span>
                    <span>{Number(info.max.toFixed(2))}</span>
                  </div>
                  <div className="landmarks">
                    {(info.label.includes("angle") ||
                    info.label.includes("Angle") ||
                    [
                      "curves",
                      "arc",
                      "lineintegral",
                      "green",
                      "lineScalar",
                      "parametric",
                      "lagrange",
                    ].includes(activeScene)
                      ? [
                          [0, "0"],
                          [Math.PI / 4, "\\pi/4"],
                          [Math.PI / 2, "\\pi/2"],
                          [Math.PI, "\\pi"],
                          [2 * Math.PI, "2\\pi"],
                        ]
                      : [
                          [info.min, String(Number(info.min.toFixed(2)))],
                          [0, "0"],
                          [1, "1"],
                          [info.max, String(Number(info.max.toFixed(2)))],
                        ]
                    )
                      .filter(
                        (a, i, all) =>
                          Number(a[0]) >= info.min - 1e-6 &&
                          Number(a[0]) <= info.max + 1e-6 &&
                          all.findIndex((b) => b[0] === a[0]) === i,
                      )
                      .map(([value, label]) => (
                        <button
                          key={label}
                          onClick={() => {
                            setP(Number(value));
                            setPlaying(false);
                          }}
                          aria-label={"Set parameter to " + label}
                        >
                          <Formula>{String(label)}</Formula>
                        </button>
                      ))}
                  </div>
                  <p className="live-value" aria-live="polite">
                    {info.readout(p)}
                  </p>
                </div>
                <div className="experiment-prompt">
                  <span className="label">TRY THIS</span>
                  <p>
                    <MathText text={concept.task} />
                  </p>
                  <details>
                    <summary>What to notice</summary>
                    <p>
                      <MathText text={concept.insight} />
                    </p>
                  </details>
                </div>
              </section>
              <section
                className="rigor-panel"
                aria-label="Mathematical explanation"
              >
                <span className="label">MATHEMATICAL NOTES</span>
                <Formula block>{concept.formula}</Formula>
                <h2>Definition & meaning</h2>
                <p>
                  <MathText text={concept.definition} />
                </p>
                <div className="hypotheses">
                  <span className="label">PRECISE HYPOTHESES</span>
                  <p>
                    <MathText text={concept.conditions} />
                  </p>
                </div>
                <Tabs
                  defaultValue="intuition"
                  key={concept.id}
                  className="explanation-tabs"
                >
                  <TabsList variant="line">
                    <TabsTrigger value="intuition">Derivation</TabsTrigger>
                    <TabsTrigger value="example">Worked example</TabsTrigger>
                    <TabsTrigger value="pitfall">Subtleties</TabsTrigger>
                  </TabsList>
                  <TabsContent value="intuition">
                    <h2>Why this works</h2>
                    <p>
                      <MathText text={concept.proof} />
                    </p>
                  </TabsContent>
                  <TabsContent value="example">
                    <h2>A complete example</h2>
                    <p>
                      <MathText text={concept.example} />
                    </p>
                  </TabsContent>
                  <TabsContent value="pitfall">
                    <h2>Keep the distinction</h2>
                    <p>
                      <MathText text={concept.pitfall} />
                    </p>
                    <p className="numerical-note">
                      The rendered mesh samples finitely many points. Its
                      appearance is an illustration; the arguments above
                      establish the mathematical claim.
                    </p>
                  </TabsContent>
                </Tabs>
                <details className="covered-topics">
                  <summary>
                    Concepts in this exploration{" "}
                    <span>{concept.topics.length}</span>
                  </summary>
                  <ul>
                    {concept.topics.map((t) => (
                      <li key={t}>
                        <MathText text={t} />
                      </li>
                    ))}
                  </ul>
                </details>
                <div className="lecture-source">
                  Course reference: MH2100 Lecture{" "}
                  {String(concept.lecture).padStart(2, "0")}
                  {concept.lecture === 12 ? " — Final Exam Review" : ""}.<br />
                  Original explanations; lecture files are not redistributed.
                </div>
              </section>
            </div>
            <footer className="lesson-pagination">
              <button
                disabled={index === 0}
                onClick={() => open(concepts[index - 1].id)}
              >
                <ArrowLeft size={18} />
                <span>
                  <small>PREVIOUS CONCEPT</small>
                  {index ? concepts[index - 1].title : "Start of course"}
                </span>
              </button>
              <span className="concept-count">
                {index + 1} / {concepts.length}
              </span>
              <button
                disabled={index === concepts.length - 1}
                onClick={() => open(concepts[index + 1].id)}
              >
                <span>
                  <small>NEXT CONCEPT</small>
                  {concepts[index + 1]?.title || "Course complete"}
                </span>
                <ArrowRight size={18} />
              </button>
            </footer>
          </>
        ) : route === "graph" ? (
          <>
            <div className="lesson-heading">
              <div className="eyebrow">AN OPEN MATHEMATICAL WORKSPACE</div>
              <h1>Graph machine</h1>
              <p>
                Give an equation a shape. Explore graphs, parametrizations,
                curves, and implicit surfaces.
              </p>
            </div>
            <div className="study-grid graph-grid">
              <section className="experience">
                {draft.mode === "surface" && (
                  <form
                    className="quick-graph"
                    onSubmit={(e) => {
                      e.preventDefault();
                      try {
                        plot(draft);
                      } catch {}
                    }}
                  >
                    <label htmlFor="quick-expression">
                      Function z = f(x, y)
                    </label>
                    <div>
                      <input
                        id="quick-expression"
                        aria-label="Quick graph expression"
                        value={draft.expressions[0]}
                        onChange={(e) =>
                          setDraft((g) => ({
                            ...g,
                            expressions: [e.target.value],
                          }))
                        }
                      />
                      <button type="submit">Graph</button>
                    </div>
                    {graphError && <p role="alert">{graphError}</p>}
                  </form>
                )}
                <Viewport
                  scene="graph"
                  parameter={graph.a}
                  graph={graph}
                  onStatus={rendered}
                />
                <div className="graph-status" role="status">
                  {status}
                </div>
                <div className="control-panel">
                  <div className="control-heading">
                    <label id="a-label">Expression parameter a</label>
                    <output>{graph.a.toFixed(2)}</output>
                  </div>
                  <Slider
                    aria-labelledby="a-label"
                    min={-5}
                    max={5}
                    step={0.05}
                    value={[graph.a]}
                    onValueChange={(v) => {
                      setGraph((g) => ({ ...g, a: v[0] }));
                      setDraft((g) => ({ ...g, a: v[0] }));
                    }}
                  />
                  <p className="control-help">
                    Use <Formula>a</Formula> in any expression to explore a
                    family.
                  </p>
                </div>
                <div className="preset-list">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() =>
                        plot({
                          ...preset,
                          a: 1,
                          expressions: [...preset.expressions],
                        } as GraphSpec)
                      }
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </section>
              <section className="rigor-panel graph-editor">
                <span className="label">DEFINE YOUR GEOMETRY</span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      plot(draft);
                    } catch {}
                  }}
                >
                  <label>Representation</label>
                  <Select
                    value={draft.mode}
                    onValueChange={(v: GraphSpec["mode"]) =>
                      setDraft((g) => ({
                        ...g,
                        mode: v,
                        expressions:
                          v === "surface"
                            ? ["sin(x)*cos(y)"]
                            : v === "implicit"
                              ? ["x^2+y^2+z^2-4"]
                              : v === "curve"
                                ? ["cos(t)", "sin(t)", "t/3"]
                                : ["cos(u)*sin(v)", "sin(u)*sin(v)", "cos(v)"],
                      }))
                    }
                  >
                    <SelectTrigger aria-label="Graph representation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surface">
                        Function · z = f(x, y)
                      </SelectItem>
                      <SelectItem value="parametric">
                        Parametric surface · r(u, v)
                      </SelectItem>
                      <SelectItem value="curve">Space curve · r(t)</SelectItem>
                      <SelectItem value="implicit">
                        Implicit surface · F(x, y, z) = 0
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {Array.from(
                    {
                      length:
                        draft.mode === "curve" || draft.mode === "parametric"
                          ? 3
                          : 1,
                    },
                    (_, i) => (
                      <div className="expression-field" key={i}>
                        <label htmlFor={"expression-" + i}>
                          {draft.mode === "implicit"
                            ? "F(x, y, z) ="
                            : draft.mode === "surface"
                              ? "f(x, y) ="
                              : ["x =", "y =", "z ="][i]}
                        </label>
                        <input
                          id={"expression-" + i}
                          autoComplete="off"
                          spellCheck={false}
                          value={draft.expressions[i] || ""}
                          onChange={(e) =>
                            setDraft((g) => {
                              const es = [...g.expressions];
                              es[i] = e.target.value;
                              return { ...g, expressions: es };
                            })
                          }
                        />
                      </div>
                    ),
                  )}
                  <div className="bounds-grid">
                    {(
                      [
                        "min",
                        "max",
                        ...(draft.mode === "curve" ? [] : ["vmin", "vmax"]),
                        "clip",
                      ] as (keyof GraphSpec)[]
                    ).map((key, i) => (
                      <label key={key}>
                        {key === "clip"
                          ? "Height clip ±z"
                          : key === "min"
                            ? `${draft.mode === "surface" || draft.mode === "implicit" ? "x" : draft.mode === "curve" ? "t" : "u"} min`
                            : key === "max"
                              ? `${draft.mode === "surface" || draft.mode === "implicit" ? "x" : draft.mode === "curve" ? "t" : "u"} max`
                              : key === "vmin"
                                ? `${draft.mode === "parametric" ? "v" : "y"} min`
                                : `${draft.mode === "parametric" ? "v" : "y"} max`}
                        <input
                          type="number"
                          step="any"
                          value={
                            Number.isNaN(draft[key])
                              ? ""
                              : (draft[key] as number)
                          }
                          onChange={(e) =>
                            setDraft((g) => ({
                              ...g,
                              [key]:
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  {graphError && (
                    <p className="form-error" role="alert">
                      {graphError}
                    </p>
                  )}
                  <button className="primary-button" type="submit">
                    <Box size={18} /> Render graph <ArrowRight size={18} />
                  </button>
                </form>
                <div className="graph-syntax">
                  <h2>Expression notation</h2>
                  <p>
                    Use <code>^</code> for powers, <code>*</code> for
                    multiplication, and parentheses for grouping. Constants:{" "}
                    <code>pi</code>, <code>e</code>. Examples:{" "}
                    <code>sqrt(x^2+y^2)</code>, <code>exp(-x^2-y^2)</code>.
                  </p>
                  <p>
                    Functions include sin, cos, tan, exp, log, abs, sqrt, min,
                    max, and inverse trigonometric functions. Piecewise
                    expressions use <code>x &gt; 0 ? x^2 : -x</code>.
                  </p>
                  <h2>What the graph can tell you</h2>
                  <p>
                    Real-valued expressions are sampled on a finite mesh over
                    the selected domain. Undefined, nonreal, and out-of-range
                    heights are omitted. Features smaller than the mesh can be
                    missed. Large jumps are filtered heuristically; a connected
                    triangle is not a continuity proof.
                  </p>
                  <p>
                    Implicit surfaces use sign changes and bounded root
                    refinement with a residual check. Discontinuous expressions
                    can still produce misleading candidates. Zero sets without a
                    sign change, such as <code>x^2 = 0</code>, can be missed. A
                    blank scene means no visible sampled geometry, not a proof
                    that the zero set is empty.
                  </p>
                </div>
              </section>
            </div>
          </>
        ) : (
          <>
            <div className="lesson-heading">
              <div className="eyebrow">THE COMPLETE LECTURE ATLAS</div>
              <h1>From curves to calculus on surfaces.</h1>
              <p>
                {concepts.length} explorations across 12 lecture files. Start at
                the beginning, or follow the concept you want to understand.
              </p>
            </div>
            <div className="course-grid">
              {lectures.map((name, i) => {
                const cs = concepts.filter((c) => c.lecture === i + 1);
                return (
                  <article key={name}>
                    <span className="course-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2>{name}</h2>
                    <p>{cs.length} explorations</p>
                    {cs.map((c) => (
                      <button key={c.id} onClick={() => open(c.id)}>
                        {c.title}
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </article>
                );
              })}
            </div>
            <section className="course-method">
              <h2>How to use the atlas</h2>
              <p>
                Read the definition and hypotheses. Make a prediction, then vary
                the parameter and inspect the geometry from several directions.
                Open the derivation to connect the picture to an argument. Use
                the worked example and subtleties to test the limits of the
                statement.
              </p>
              <p>
                Coverage follows the supplied MH2100 Lecture 01–11 files,
                Lecture 12 Final Exam Review, and the supplement on partial
                derivatives and total differentiability. File numbering takes
                precedence over the tentative syllabus schedule. This is an
                independent study companion, not an official NTU publication.
              </p>
              <details>
                <summary>Browser tools and mathematical rendering</summary>
                <p>
                  Equations are typeset with KaTeX, with accessible MathML.
                  WebMCP exposes concept lookup, navigation, plotting, and
                  parameter controls when supported by your browser. All study
                  tools work through the visible interface.
                </p>
                <p>
                  WebMCP: {webmcp}.{" "}
                  <a
                    href="https://developer.chrome.com/docs/ai/webmcp/imperative-api"
                    target="_blank"
                    rel="noreferrer"
                  >
                    API reference <ExternalLink size={13} />
                  </a>
                </p>
              </details>
            </section>
          </>
        )}
        <div className="site-bottom">
          MH2100 · Calculus Atlas{" "}
          <span>Geometry for intuition. Arguments for certainty.</span>
        </div>
      </main>
    </>
  );
}
export default function Atlas() {
  return (
    <SidebarProvider
      defaultOpen
      style={{ "--sidebar-width": "260px" } as React.CSSProperties}
    >
      <AtlasInner />
    </SidebarProvider>
  );
}
