"use client";
import { useId, useSyncExternalStore } from "react";
import {
  getInlineExperimentOpen,
  getInlineExperimentValue,
  initialInlineExperimentValue,
  setInlineExperimentOpen,
  setInlineExperimentValue,
  subscribeInlineExperiment,
} from "@/lib/curriculum/inline-experiments";
import {
  reviewPlane,
  reviewResidual,
  reviewValue,
  type ReviewFunction,
} from "@/lib/curriculum/review-differentiability";
import { Formula, MathText } from "./math-text";
import { exampleById } from "@/lib/curriculum/example-registry";

const reviews = [
  {
    kind: "differentiable" as const,
    identityId: "review-differentiable-f",
    plane: "L_f(x,y)=0",
    exact: "0\\le |f-L_f|/r=(x^4+y^4)/r^2\\le r^2\\to0",
    explanation:
      "The coordinate partials are zero, so the candidate plane is $z=0$. The inequality holds in every direction; for error below $\\varepsilon$, radius below $\\sqrt\\varepsilon$ suffices.",
  },
  {
    kind: "counterexample" as const,
    identityId: "review-counterexample-g",
    plane: "L_g(x,y)=x",
    exact: "(g-L_g)/r=-2xy^2/r^3;\\quad (x,y)=(t,t),\\ t>0\\implies -1/\\sqrt2",
    explanation:
      "The partials force the plane $z=x$. Along either coordinate axis the remainder vanishes, but on the positive diagonal its normalized value stays $-1/\\sqrt2$ as radius shrinks.",
  },
] as const;

function ReviewMesh({ kind }: { kind: ReviewFunction }) {
  const title = useId();
  const sample = Array.from({ length: 17 }, (_, i) => -0.6 + (i * 1.2) / 16);
  const project = (x: number, y: number, z: number) => [
    180 + 95 * (x - y),
    140 + 48 * (x + y) - 115 * z,
  ];
  const line = (variable: "x" | "y", fixed: number, plane: boolean) =>
    sample
      .map((point, i) => {
        const x = variable === "x" ? point : fixed;
        const y = variable === "y" ? point : fixed;
        const z = plane ? reviewPlane(kind, x) : reviewValue(kind, x, y);
        const [px, py] = project(x, y, z);
        return `${i ? "L" : "M"}${px.toFixed(2)},${py.toFixed(2)}`;
      })
      .join(" ");
  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox="0 0 360 290"
        role="img"
        aria-labelledby={title}
        style={{ width: "100%", maxWidth: 500 }}
      >
        <title id={title}>
          Sampled surface and candidate tangent plane for{" "}
          {kind === "differentiable" ? "f" : "g"}
        </title>
        {sample
          .filter((_, i) => i % 2 === 0)
          .flatMap((fixed, i) =>
            [true, false].flatMap((plane) =>
              (["x", "y"] as const).map((variable) => (
                <path
                  key={`${plane ? "p" : "s"}${variable}-${i}`}
                  d={line(variable, fixed, plane)}
                  fill="none"
                  stroke={plane ? "#a94333" : "#236ba5"}
                  strokeWidth={plane ? "1.4" : "1.7"}
                  strokeDasharray={plane ? "5 3" : undefined}
                />
              )),
            ),
          )}
        <circle cx="180" cy="140" r="3" fill="currentColor" />
      </svg>
      <figcaption>
        Sampled surface (solid blue) and candidate plane (dashed red). The exact
        remainder below decides differentiability.
      </figcaption>
    </figure>
  );
}

function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
  const identity = exampleById(review.identityId);
  const conceptId = "review-total-differentiability";
  const subscribe = (listener: () => void) =>
    subscribeInlineExperiment(conceptId, review.kind, listener);
  const radius = useSyncExternalStore(
    subscribe,
    () => getInlineExperimentValue(conceptId, review.kind, "radius"),
    () => initialInlineExperimentValue(conceptId, review.kind, "radius"),
  );
  const angle = useSyncExternalStore(
    subscribe,
    () => getInlineExperimentValue(conceptId, review.kind, "angle"),
    () => initialInlineExperimentValue(conceptId, review.kind, "angle"),
  );
  const active = useSyncExternalStore(
    subscribe,
    () => getInlineExperimentOpen(conceptId, review.kind),
    () => false,
  );
  const radiusId = useId();
  const angleId = useId();
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  const value = reviewValue(review.kind, x, y);
  const plane = reviewPlane(review.kind, x);
  const residual = reviewResidual(review.kind, x, y);
  return (
    <section
      className="lesson-extension"
      data-review-function={review.kind}
      data-example-id={identity.id}
    >
      <h3>
        <MathText text={identity.title} />
      </h3>
      <div style={{ overflowX: "auto" }}>
        <Formula block>{identity.formula}</Formula>
      </div>
      <p>
        <MathText text={`${identity.domain} ${identity.annotation}`} />
      </p>
      <p>
        <Formula>{review.plane}</Formula>.{" "}
        <MathText text={review.explanation} />
      </p>
      <p>
        <Formula>{review.exact}</Formula>
      </p>
      <details
        open={active}
        onToggle={(event) =>
          setInlineExperimentOpen(
            conceptId,
            review.kind,
            event.currentTarget.open,
          )
        }
      >
        <summary>Inspect the exact function and plane</summary>
        <div style={{ paddingBlock: "1rem" }}>
          <label htmlFor={radiusId}>
            Distance from origin <Formula>r</Formula>
          </label>
          <input
            id={radiusId}
            type="range"
            data-inline-parameter="radius"
            min="0.01"
            max="0.5"
            step="0.01"
            value={radius}
            onChange={(event) =>
              setInlineExperimentValue(
                conceptId,
                review.kind,
                "radius",
                Number(event.target.value),
              )
            }
            style={{ width: "100%" }}
          />
          <label htmlFor={angleId}>
            Direction <Formula>{String.raw`\theta`}</Formula> in radians
          </label>
          <input
            id={angleId}
            type="range"
            data-inline-parameter="angle"
            min={-Math.PI}
            max={Math.PI}
            step="any"
            value={angle}
            onChange={(event) =>
              setInlineExperimentValue(
                conceptId,
                review.kind,
                "angle",
                Number(event.target.value),
              )
            }
            style={{ width: "100%" }}
          />
          <output aria-live="polite">
            <p>
              <Formula>{`r=${radius.toFixed(2)},\\quad\\theta=${angle.toFixed(2)},\\quad(x,y)=(${x.toFixed(3)},${y.toFixed(3)})`}</Formula>
              .
            </p>
            <p>
              Function value <Formula>{value.toFixed(4)}</Formula>; candidate
              plane <Formula>{plane.toFixed(4)}</Formula>; signed normalized
              remainder <Formula>{residual.toFixed(4)}</Formula>.
            </p>
          </output>
          {active && <ReviewMesh kind={review.kind} />}
        </div>
      </details>
    </section>
  );
}

export function ReviewDifferentiabilityExperiments() {
  return (
    <section aria-label="Exact differentiability review comparison">
      <h2>Compare the two exact review functions</h2>
      <p>
        Both are zero at the origin. Their candidate planes differ, and their
        normalized remainders decide the outcome. Each function has its own
        radius and direction controls.
      </p>
      {reviews.map((review) => (
        <ReviewCard key={review.kind} review={review} />
      ))}
    </section>
  );
}
