"use client";
import { Minus, Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Viewport } from "./viewport";
import { Formula, MathText } from "./math-text";
import { sceneTex, legendColors } from "@/lib/atlas/scenes";
import { PlanarViewport } from "./planar-viewport";
import { readoutTex, parameterTex } from "@/lib/curriculum/readouts";
import { ExperimentModels } from "./experiment-models";
import type { StudyController } from "./use-study-controller";
export function LessonExperiment({ study }: { study: StudyController }) {
  const {
    planar,
    visualLayout,
    setVisualLayout,
    p,
    setP,
    playing,
    setPlaying,
    resetKey,
    setReset,
    concept,
    activeScene,
    info,
  } = study;
  return (
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
        <h2>Experiment</h2>
        <div>
          <button
            aria-label={
              visualLayout === "wide" ? "Use split view" : "Use wide graph view"
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
          <p className="model-status">
            Sampled illustration · <MathText text={concept.subtitle} /> The
            display window and clipping do not define the mathematical domain.
          </p>
          {activeScene.startsWith("plane-") ? (
            <PlanarViewport model={planar!} />
          ) : (
            <Viewport
              description={`${concept.title}. ${concept.subtitle}`}
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
          <ExperimentModels study={study} />
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
                  playing ? "Pause parameter animation" : "Animate parameter"
                }
                aria-label={playing ? "Pause animation" : "Animate parameter"}
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
            <p className="live-value" aria-live={playing ? "off" : "polite"}>
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
  );
}
