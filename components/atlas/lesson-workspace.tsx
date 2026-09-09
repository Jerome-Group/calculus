"use client";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
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
import { sceneTex, legendColors } from "@/lib/atlas/scenes";
import { concepts } from "@/lib/curriculum";
import { PlanarViewport } from "./planar-viewport";
import { SourceReferences } from "./source-references";
import { readoutTex, parameterTex } from "@/lib/curriculum/readouts";
import type { StudyController } from "./use-study-controller";
export function LessonWorkspace({ study }: { study: StudyController }) {
  const {
    planar,
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
    chooseModel,
    concept,
    activeScene,
    info,
    index,
    open,
    setNoteTab,
  } = study;
  return (
    <>
      <div className={"study-grid layout-" + visualLayout}>
        <div className="lesson-heading">
          <div className="eyebrow">
            {concept.course} ·{" "}
            {concept.course === "MH1101" ? "CHAPTER" : "LECTURE"}{" "}
            {String(concept.lecture).padStart(2, "0")}
            <span> / </span>
            {lectures[concept.lecture - 1]}
          </div>
          <h1>{concept.title}</h1>
          <p>{concept.subtitle}</p>
        </div>
        <section
          className={
            "experience" +
            (activeScene.startsWith("plane-")
              ? " planar-experience"
              : " spatial-experience")
          }
          aria-label="Visualisation"
        >
          <div className="experience-heading">
            <h2>Visualisation</h2>
            <div>
              <button
                aria-label={
                  visualLayout === "wide"
                    ? "Use split view"
                    : "Use wide graph view"
                }
                onClick={() =>
                  setVisualLayout(visualLayout === "wide" ? "split" : "wide")
                }
              >
                <Maximize2 size={15} />
                {visualLayout === "wide" ? "Split" : "Wide"}
              </button>
              <button
                aria-expanded={visualLayout !== "minimised"}
                onClick={() => {
                  setVisualLayout(
                    visualLayout === "minimised" ? "split" : "minimised",
                  );
                  setPlaying(false);
                }}
              >
                <Minus size={15} />
                {visualLayout === "minimised" ? "Expand" : "Minimise"}
              </button>
            </div>
          </div>
          {visualLayout !== "minimised" && (
            <div className="experience-content">
              {activeScene.startsWith("plane-") ? (
                <PlanarViewport model={planar!} />
              ) : (
                <Viewport
                  scene={activeScene}
                  parameter={p}
                  resetKey={resetKey}
                />
              )}
              <div className="scene-equation">
                <Formula>
                  {activeScene.startsWith("plane-")
                    ? planar!.formula
                    : sceneTex(activeScene)}
                </Formula>
              </div>
              <div className="legend">
                {info.legend.map((l, i) => (
                  <span key={l}>
                    <i
                      style={{
                        background: legendColors(activeScene)[i % 4],
                      }}
                    />
                    <MathText text={l} />
                  </span>
                ))}
              </div>
              <p className="scale-note">
                <MathText text={info.note} />
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
                  <Select value={activeScene} onValueChange={chooseModel}>
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
                  <label id="parameter-label">
                    <MathText text={parameterTex(info.label)} />
                  </label>
                  <output>
                    <Formula>
                      {info.step >= 1 ? String(p) : `\\approx ${p.toFixed(2)}`}
                    </Formula>
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
                  <span>
                    <Formula>{String(Number(info.min.toFixed(2)))}</Formula>
                  </span>
                  <span>
                    <Formula>{String(Number(info.max.toFixed(2)))}</Formula>
                  </span>
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
                  <Formula>
                    {activeScene.startsWith("plane-")
                      ? planar!.readout
                      : readoutTex(activeScene, p)}
                  </Formula>
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
            </div>
          )}
        </section>
        <section className="rigor-panel" aria-label="Mathematical explanation">
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
            value={noteTab}
            onValueChange={setNoteTab}
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
                The rendered mesh samples finitely many points. Its appearance
                is an illustration; the arguments above establish the
                mathematical claim.
              </p>
            </TabsContent>
          </Tabs>
          <details className="covered-topics">
            <summary>
              Concepts in this exploration <span>{concept.topics.length}</span>
            </summary>
            <ul>
              {concept.topics.map((t) => (
                <li key={t}>
                  <MathText text={t} />
                </li>
              ))}
            </ul>
          </details>
          <SourceReferences concept={concept} />
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
  );
}
