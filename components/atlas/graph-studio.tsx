"use client";
import { ArrowRight, Box } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Viewport } from "./viewport";
import { Formula } from "./math-text";
import { type GraphSpec } from "@/lib/atlas/math";
import { ExpressionPreview } from "./expression-preview";
import { QuickGraphExpression } from "./quick-graph-expression";
import type { StudyController } from "./use-study-controller";
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
export function GraphStudio({ study }: { study: StudyController }) {
  const {
    status,
    graph,
    setGraph,
    draft,
    setDraft,
    graphError,
    plot,
    rendered,
  } = study;
  return (
    <>
      <div className="lesson-heading">
        <div className="eyebrow">AN OPEN MATHEMATICAL WORKSPACE</div>
        <h1>Graph studio</h1>
        <p>
          Give an equation a shape. Explore graphs, parametrizations, curves,
          and implicit surfaces.
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
              <span className="quick-graph-label">
                Function <Formula>{"z=f(x,y)"}</Formula>
              </span>
              <div className="quick-graph-controls">
                <QuickGraphExpression
                  value={draft.expressions[0]}
                  onChange={(value) =>
                    setDraft((g) => ({ ...g, expressions: [value] }))
                  }
                />
                <button className="quick-graph-submit" type="submit">
                  Graph
                </button>
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
              <label id="a-label">
                Expression parameter <Formula>a</Formula>
              </label>
              <output>
                <Formula>{`a=${graph.a.toFixed(2)}`}</Formula>
              </output>
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
              Use <Formula>a</Formula> in any expression to explore a family.
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
                  Function · <Formula>z=f(x,y)</Formula>
                </SelectItem>
                <SelectItem value="parametric">
                  Parametric surface · <Formula>{"r(u,v)"}</Formula>
                </SelectItem>
                <SelectItem value="curve">
                  Space curve · <Formula>r(t)</Formula>
                </SelectItem>
                <SelectItem value="implicit">
                  Implicit surface · <Formula>F(x,y,z)=0</Formula>
                </SelectItem>
              </SelectContent>
            </Select>
            {Array.from(
              {
                length:
                  draft.mode === "curve" || draft.mode === "parametric" ? 3 : 1,
              },
              (_, i) => (
                <div className="expression-field" key={i}>
                  <label htmlFor={"expression-" + i}>
                    <Formula>
                      {draft.mode === "implicit"
                        ? "F(x,y,z)="
                        : draft.mode === "surface"
                          ? "f(x,y)="
                          : ["x=", "y=", "z="][i]}
                    </Formula>
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
            <ExpressionPreview graph={draft} />
            <div className="bounds-grid">
              {(
                [
                  "min",
                  "max",
                  ...(draft.mode === "curve" ? [] : ["vmin", "vmax"]),
                  "clip",
                ] as (keyof GraphSpec)[]
              ).map((key) => (
                <label key={key}>
                  {key === "clip" ? (
                    <>
                      {draft.mode === "curve"
                        ? "Coordinate clip "
                        : "Height clip "}
                      <Formula>
                        {draft.mode === "curve" ? "(x,y,z)" : "\\pm z"}
                      </Formula>
                    </>
                  ) : (
                    <>
                      <Formula>
                        {key === "vmin" || key === "vmax"
                          ? draft.mode === "parametric"
                            ? "v"
                            : "y"
                          : draft.mode === "surface" ||
                              draft.mode === "implicit"
                            ? "x"
                            : draft.mode === "curve"
                              ? "t"
                              : "u"}
                      </Formula>
                      {key === "min" || key === "vmin" ? " min" : " max"}
                    </>
                  )}
                  <input
                    type="number"
                    step="any"
                    value={
                      Number.isNaN(draft[key]) ? "" : (draft[key] as number)
                    }
                    onChange={(e) =>
                      setDraft((g) => ({
                        ...g,
                        [key]:
                          e.target.value === "" ? NaN : Number(e.target.value),
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
              Use <code>^</code> for powers, <code>*</code> for multiplication,
              and parentheses for grouping. Constants: <code>pi</code>,{" "}
              <code>e</code>. Syntax <code>sqrt(x^2+y^2)</code> renders as{" "}
              <Formula>{"z=\\sqrt{x^2+y^2}"}</Formula>;{" "}
              <code>exp(-x^2-y^2)</code> renders as{" "}
              <Formula>{"z=e^{-x^2-y^2}"}</Formula>.
            </p>
            <p>
              Functions include sin, cos, tan, exp, log, abs, sqrt, min, max,
              and inverse trigonometric functions. Piecewise syntax{" "}
              <code>x &gt; 0 ? x^2 : -x</code> renders as{" "}
              <Formula>
                {"f(x)=\\begin{cases}x^2,&x>0\\\\-x,&x\\le0\\end{cases}"}
              </Formula>
              .
            </p>
            <h2>What the graph can tell you</h2>
            <p>
              Real-valued expressions are sampled on a finite mesh over the
              selected domain. Undefined, nonreal, and out-of-range heights are
              omitted. Curves clip all three coordinates and use adaptive
              midpoint and jump checks; these remain heuristic. Features smaller
              than the mesh can be missed. Large jumps are filtered
              heuristically; a connected triangle is not a continuity proof.
            </p>
            <p>
              Implicit surfaces use sign changes and bounded root refinement
              with a residual check. Discontinuous expressions can still produce
              misleading candidates. Zero sets without a sign change, such as{" "}
              <Formula>{"x^2=0"}</Formula>, can be missed. A blank scene means
              no visible sampled geometry, not a proof that the zero set is
              empty.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
