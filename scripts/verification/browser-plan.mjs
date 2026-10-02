export const browserPlan = {
  schemaVersion: 1,
  execution:
    "Browser interaction required; this plan does not assert completed coverage.",
  evidenceRequired: [
    "revision",
    "sourceFingerprint",
    "sourceDirty",
    "url",
    "viewport",
    "browser",
    "actions",
    "assertions",
    "consoleErrors",
    "requestFailures",
    "screenshots",
    "result",
  ],
  journeys: [
    {
      id: "library-navigation",
      actions: [
        "browse each course",
        "search known concept",
        "search no matches",
        "clear search",
        "open lesson",
        "keyboard prerequisite navigation",
      ],
      assertions: [
        "expected lesson and course visible",
        "no-matches state",
        "focus remains usable",
      ],
    },
    {
      id: "reading-modes",
      actions: [
        "open representative lesson in each course",
        "choose learn/explore/practice/revise",
        "show hint and solution",
        "edit practice draft",
        "reload",
      ],
      assertions: [
        "selected mode visible",
        "draft restored",
        "MathML present",
        "no KaTeX error",
      ],
    },
    {
      id: "experiment-controls",
      actions: [
        "change min/mid/max",
        "switch variant",
        "play/pause",
        "reset",
        "move independent inline controls",
      ],
      assertions: [
        "readout changes with parameter",
        "reset restores defaults",
        "controls independent",
        "finite visible drawing",
      ],
    },
    {
      id: "graph-representations",
      actions: [
        "plot surface sin(x)*cos(y)",
        "plot parametric [cos(u),sin(u),v]",
        "plot curve [cos(t),sin(t),t/3]",
        "plot implicit x^2+y^2+z^2-1",
        "submit invalid expression",
        "restore valid plot",
      ],
      assertions: [
        "render completion",
        "visible geometry",
        "invalid input exposes error",
        "recovery renders",
      ],
    },
    {
      id: "history",
      actions: [
        "share lesson URL",
        "change scene/parameter/mode",
        "reload",
        "back/forward",
        "share graph URL",
        "open malformed study and graph URLs",
      ],
      assertions: [
        "exact bounded state restored",
        "history returns correct state",
        "invalid state explains defaults",
      ],
    },
    {
      id: "accessibility-responsive",
      actions: [
        "keyboard controls",
        "inspect accessible names",
        "mobile viewport",
        "reduced-motion preference",
        "long formula horizontal scroll",
      ],
      assertions: [
        "landmarks and headings usable",
        "controls named",
        "no page horizontal overflow",
        "focused controls visible",
        "animation remains paused under reduced motion",
      ],
    },
    {
      id: "failure-fallbacks",
      actions: [
        "storage unavailable",
        "WebMCP unavailable",
        "switch SVG compatibility",
        "simulate renderer failure if available",
        "recover",
      ],
      assertions: [
        "visible controls usable",
        "storage failure does not crash",
        "render failure alert",
        "compatibility geometry visible",
      ],
    },
    {
      id: "lazy-viewport-chunk-failure",
      environment: "local preview only; no production request interception",
      actions: [
        "open a lesson with spatial drawing",
        "block its deferred viewport module request locally",
        "inspect the alert and original lesson route",
        "read definition and reasoning with drawing unavailable",
        "unblock module request",
        "activate Reload to retry drawing",
        "verify recovery",
      ],
      assertions: [
        "drawing chunk failure is contained in drawing panel",
        "definition and reasoning remain readable",
        "lesson route and existing state remain preserved",
        "failure alert and keyboard-accessible Reload to retry drawing are available",
        "retry restores the drawing after the request is unblocked",
        "record injected failure separately from unexpected request/console errors",
      ],
    },
    ...[
      {
        kind: "rays",
        lesson: "different-paths-different-limits",
        controls: ["angle 0, pi/4, 3pi/4", "radius min/max"],
        assertion:
          "axis 0 versus diagonal +0.5 and -0.5; radius does not change restriction height",
      },
      {
        kind: "curved",
        lesson: "curved-paths-hide-obstructions",
        controls: ["coefficient -1,0,1", "probe min/max"],
        assertion:
          "parabola -0.5,0,+0.5; fixed-line height tends to zero as probe shrinks",
      },
      {
        kind: "error",
        lesson: "total-differentiability",
        controls: ["radius min/max", "angle 0,pi/4"],
        assertion:
          "bowl normalized error shrinks; counterexample remains 1/(2sqrt2) at pi/4 and vanishes on axis",
      },
      {
        kind: "saddle",
        lesson: "hessian-classification",
        controls: [
          "coefficient negative,positive,exact zero",
          "slice directions 0,pi/2",
        ],
        assertion:
          "opposing sections for negative coefficient; exact zero non-strict minimum with inconclusive Hessian",
      },
      {
        kind: "clock",
        lesson: "tangents-velocity-and-singularities",
        controls: ["clock min/max", "inspect exact zero"],
        assertion:
          "same endpoints; cubic speed zero and regular speed sqrt2 at zero",
      },
      {
        kind: "fibre",
        lesson: "type-one-two-regions",
        controls: ["outer coordinate min/max", "swap twice"],
        assertion:
          "inner bound 2-q; held coordinate and integral order switch; total remains14/3",
      },
      {
        kind: "polar",
        lesson: "polar-rectangles",
        controls: ["radius min/max including zero", "width min/max"],
        assertion:
          "exact area exceeds local estimate by width squared angle/2; positive finite sector at origin",
      },
    ].map(({ kind, lesson, controls, assertion }) => ({
      id: `comparison-${kind}`,
      lesson,
      url: `/#${lesson}`,
      actions: [
        "open learn and explore modes",
        "choose incorrect prediction",
        "choose correct prediction",
        ...controls,
        "reset comparison and prediction",
        "repeat range changes using keyboard",
      ],
      assertions: [
        assertion,
        "incorrect feedback identifies mismatch",
        "correct feedback does not contradict selected answer",
        "readouts and drawing change together",
        "full reset restores initial controls and clears prediction",
        "range labels and chart descriptions remain accessible",
      ],
    })),
  ],
  unverifiedByPlan: [
    "learner mastery",
    "learner usability",
    "unobserved GPU hardware paths",
    "live source-document freshness",
  ],
};

export function validateBrowserEvidence(value, source) {
  const issues = [];
  if (!value || typeof value !== "object" || Array.isArray(value))
    return ["Evidence must be an object."];
  for (const field of browserPlan.evidenceRequired)
    if (!Object.hasOwn(value, field))
      issues.push(`Missing evidence field ${field}`);
  const text = (item) => typeof item === "string" && item.trim().length > 0;
  const strings = (items, nonempty = false) =>
    Array.isArray(items) &&
    (!nonempty || items.length > 0) &&
    items.every(text);
  if (!text(value.revision) || value.revision !== source.revision)
    issues.push("Browser evidence revision differs from current revision.");
  if (
    typeof value.sourceFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.sourceFingerprint) ||
    value.sourceFingerprint !== source.fingerprint
  )
    issues.push(
      "Browser evidence source fingerprint differs from current files.",
    );
  if (
    typeof value.sourceDirty !== "boolean" ||
    value.sourceDirty !== source.dirty
  )
    issues.push(
      "Browser evidence dirty-source state differs from current files.",
    );
  try {
    const url = new URL(value.url);
    if (!text(value.url) || !["http:", "https:"].includes(url.protocol))
      throw new Error("Invalid protocol");
  } catch {
    issues.push("Browser evidence URL must be a nonempty HTTP(S) URL.");
  }
  if (!text(value.browser))
    issues.push("Browser evidence browser must be a nonempty string.");
  const viewport = value.viewport;
  if (
    !viewport ||
    typeof viewport !== "object" ||
    Array.isArray(viewport) ||
    ![viewport.width, viewport.height].every(
      (size) => Number.isInteger(size) && size > 0 && size <= 16384,
    )
  )
    issues.push(
      "Browser evidence viewport requires positive integer width/height at most 16384.",
    );
  if (!strings(value.actions, true))
    issues.push("Browser evidence actions require nonempty strings.");
  if (!strings(value.screenshots))
    issues.push("Browser evidence screenshots require nonempty path strings.");
  if (!strings(value.consoleErrors) || !strings(value.requestFailures))
    issues.push(
      "Browser evidence errors/failures require arrays of nonempty strings.",
    );
  const statuses = ["passed", "failed", "blocked"];
  const assertions = value.assertions;
  const validAssertions =
    Array.isArray(assertions) &&
    assertions.length > 0 &&
    assertions.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        text(item.description) &&
        statuses.includes(item.status),
    );
  if (!validAssertions)
    issues.push(
      "Browser evidence assertions require nonempty descriptions and passed/failed/blocked statuses.",
    );
  if (!statuses.includes(value.result))
    issues.push("Browser evidence result must be passed, failed, or blocked.");
  if (
    value.result === "passed" &&
    ((validAssertions && assertions.some((item) => item.status !== "passed")) ||
      value.consoleErrors?.length > 0 ||
      value.requestFailures?.length > 0)
  )
    issues.push(
      "Passed browser evidence cannot contain failed/blocked assertions or errors.",
    );
  if (
    value.result === "failed" &&
    validAssertions &&
    !assertions.some((item) => item.status === "failed") &&
    !(value.consoleErrors?.length > 0) &&
    !(value.requestFailures?.length > 0)
  )
    issues.push(
      "Failed browser evidence requires a failed assertion or recorded error.",
    );
  if (value.result === "blocked" && !text(value.blockReason))
    issues.push("Blocked browser evidence requires a nonempty blockReason.");
  return issues;
}
