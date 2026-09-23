import type { Concept } from "./index";
import { learningGuide, type LearningGuide } from "./learning";

export type LessonMode = "learn" | "explore" | "practice" | "revise";
export type SupportLevel = "none" | "hint";
export type PilotTask = {
  id: string;
  kind: "recognition" | "setup" | "transfer";
  prompt: string;
  choices: { id: string; text: string; errorCode?: string }[];
  answer: string;
  hint: string;
  explanation: string;
  feedback: Record<string, string>;
};
export type PilotLesson = {
  id: string;
  learn: {
    outcome: string;
    why: string;
    recall: string;
    theorem: string;
    reasoning: string;
    misconception: string;
    quickCheck: string;
  };
  explore: {
    prediction: string;
    control: string;
    invariant: string;
    counterexample: string;
    transfer: string;
    evidence: string;
  };
  practice: PilotTask[];
  revise: {
    prompts: string[];
    conditions: string;
    errors: string[];
    mixedCheck: string;
  };
};

export const pilotLessons: Record<string, PilotLesson> = {
  "epsilon-delta-one-variable": {
    id: "epsilon-delta-one-variable",
    learn: {
      outcome:
        "State the quantifiers and construct a $\\delta$ that works for every allowed input.",
      why: "A limit claim needs one input neighbourhood that controls all sufficiently nearby outputs.",
      recall:
        "Recall the implication: if an input lies in a deleted interval around $a$, its output should lie in the target band around $L$.",
      theorem:
        "For every $\\varepsilon>0$ there exists $\\delta>0$ such that every domain point with $0<|x-a|<\\delta$ satisfies $|f(x)-L|<\\varepsilon$. $\\delta$ may depend on $\\varepsilon$ and $a$, never on the later input $x$.",
      reasoning:
        "For $f(x)=2x$ at $a=1$, $|f(x)-2|=2|x-1|$, so $\\delta=\\varepsilon/2$ works. For $f(x)=x^2$ at $a=1$, first require $|x-1|<1$. Then $|x+1|<3$, so $|x^2-1|<3|x-1|$. Choose $\\delta=\\min(1,\\varepsilon/3)$.",
      misconception:
        "Choosing $\\delta=\\varepsilon/|x+1|$ after seeing $x$ reverses the quantifiers. One fixed $\\delta$ must work for every admissible $x$.",
      quickCheck:
        "If $\\varepsilon=0.4$ for $f(x)=2x$ at $a=1$, what $\\delta$ works? Check it in Explore, then prove the implication for every input.",
    },
    explore: {
      prediction:
        "Before moving the tolerance control, predict what happens to $\\delta$ when $\\varepsilon$ is halved.",
      control:
        "Output tolerance $\\varepsilon$; the linear example derives $\\delta=\\varepsilon/2$.",
      invariant:
        "For every $x$ in the deleted $\\delta$ interval, $|2x-2|<\\varepsilon$; the same $\\delta$ controls the whole interval.",
      counterexample:
        "A pointwise choice depending on $x$ cannot establish the uniform implication in the definition.",
      transfer:
        "With the graph hidden, derive a $\\delta$ for $x^2\\to1$ as $x\\to1$.",
      evidence:
        "The line and shaded band are exact for $f(x)=2x$; the screen renders a finite SVG illustration of that exact relation.",
    },
    practice: [
      {
        id: "quantifiers",
        kind: "recognition",
        prompt: "Which order proves $\\lim_{x\\to a}f(x)=L$?",
        choices: [
          {
            id: "correct",
            text: "For every $\\varepsilon$, choose one $\\delta$; then every nearby $x$ obeys the bound.",
          },
          {
            id: "reversed",
            text: "For every nearby $x$, choose a $\\delta$ after seeing $x$.",
            errorCode: "QUANTIFIER_REVERSED",
          },
          {
            id: "sample",
            text: "Check a few $x$ values for each $\\varepsilon$.",
            errorCode: "SAMPLE_AS_PROOF",
          },
        ],
        answer: "correct",
        hint: "Who chooses first: the output tolerance or the input?",
        explanation:
          "$\\varepsilon$ is chosen first; one $\\delta$ must work for all later admissible inputs.",
        feedback: {
          QUANTIFIER_REVERSED:
            "$\\delta$ cannot depend on the later input $x$.",
          SAMPLE_AS_PROOF:
            "Finite samples do not establish a universal implication.",
        },
      },
      {
        id: "linear",
        kind: "setup",
        prompt:
          "For $f(x)=2x$, $a=1$, $L=2$, and $\\varepsilon=0.4$, choose a valid $\\delta$.",
        choices: [
          { id: "correct", text: "$\\delta=0.2$" },
          { id: "large", text: "$\\delta=0.4$", errorCode: "BOUND_TOO_LARGE" },
          {
            id: "depends",
            text: "$\\delta=|x-1|$",
            errorCode: "INPUT_DEPENDENT",
          },
        ],
        answer: "correct",
        hint: "Solve $2|x-1|<0.4$.",
        explanation:
          "$|2x-2|=2|x-1|$, so $\\delta=0.2$ works for every input in that interval.",
        feedback: {
          BOUND_TOO_LARGE:
            "At points near the edge, doubling the input distance exceeds $0.4$.",
          INPUT_DEPENDENT: "A $\\delta$ chosen from $x$ is illegal here.",
        },
      },
      {
        id: "quadratic",
        kind: "transfer",
        prompt:
          "Without a graph, choose a $\\delta$ proving $x^2\\to1$ as $x\\to1$ for arbitrary $\\varepsilon>0$.",
        choices: [
          { id: "correct", text: "$\\delta=\\min(1,\\varepsilon/3)$" },
          {
            id: "global",
            text: "$\\delta=\\varepsilon/2$ without a local bound",
            errorCode: "LOCAL_BOUND_MISSING",
          },
          {
            id: "depends",
            text: "$\\delta=\\varepsilon/|x+1|$",
            errorCode: "INPUT_DEPENDENT",
          },
        ],
        answer: "correct",
        hint: "Factor $|x^2-1|=|x-1||x+1|$; first keep $x$ within $1$ of $1$.",
        explanation:
          "The local restriction $|x-1|<1$ gives $|x+1|<3$. Then $|x^2-1|<3\\delta\\le\\varepsilon$.",
        feedback: {
          LOCAL_BOUND_MISSING:
            "The second factor varies; bound it locally before choosing $\\delta$.",
          INPUT_DEPENDENT: "This formula still depends on the later input $x$.",
        },
      },
      {
        id: "illegal-delta",
        kind: "recognition",
        prompt:
          "Which proposed $\\delta$ is invalid because it depends on the input chosen after $\\varepsilon$?",
        choices: [
          { id: "correct", text: "$\\delta=\\varepsilon/|x+1|$" },
          {
            id: "local",
            text: "$\\delta=\\min(1,\\varepsilon/3)$",
            errorCode: "QUANTIFIER_REVERSED",
          },
          {
            id: "linear",
            text: "$\\delta=\\varepsilon/2$",
            errorCode: "QUANTIFIER_REVERSED",
          },
        ],
        answer: "correct",
        hint: "Look for an $x$ on the right side of the quantifier order.",
        explanation:
          "The value of $x$ is selected only after one fixed $\\delta$ has been chosen.",
        feedback: {
          QUANTIFIER_REVERSED:
            "This expression depends only on $\\varepsilon$, not on the later input $x$.",
        },
      },
    ],
    revise: {
      prompts: [
        "State the for-every/there-exists/for-every order.",
        "Why impose $|x-1|<1$ for the quadratic?",
      ],
      conditions:
        "$\\delta$ is positive and independent of the chosen $x$; all domain points in the deleted interval must satisfy the output bound.",
      errors: [
        "Quantifiers reversed",
        "A sample treated as proof",
        "A local bound skipped",
      ],
      mixedCheck:
        "Explain why $\\delta=\\varepsilon/|x+1|$ is invalid even when its algebra appears to fit.",
    },
  },
  "type-one-two-regions": {
    id: "type-one-two-regions",
    learn: {
      outcome:
        "Classify regions from their sections, derive bounds, split when necessary, and reverse integration order.",
      why: "The inner integral describes one slice; a wrong slice gives a different region even if the notation looks plausible.",
      recall:
        "A Type I section is one vertical interval; a Type II section is one horizontal interval.",
      theorem:
        "With continuous ordered boundary functions and a continuous integrand on the compact region, the Type I or Type II slicing formula applies. A continuous-rectangle Fubini statement alone does not cover the discontinuous zero extension.",
      reasoning:
        "For $D=\\{0\\le x\\le2,0\\le y\\le2-x\\}$, vertical bounds are $0\\le y\\le2-x$. Horizontal bounds are $0\\le x\\le2-y$ for $0\\le y\\le2$. Both describe the same triangle. For $0\\le x\\le1$ and $x^2\\le y\\le x$, reversal gives $0\\le y\\le1$ and $y\\le x\\le\\sqrt y$.",
      misconception:
        "The square frame $[0,2]^2\\setminus(1/2,3/2)^2$ has two intervals in a middle vertical and horizontal section. It is neither type as one piece; split it into rectangles.",
      quickCheck:
        "At $x=0.5$ in the triangle, where does the vertical section start and end? Check it in Explore.",
    },
    explore: {
      prediction:
        "Predict the two endpoints of the slice at coordinate $0.5$ before moving the control.",
      control: "Slice coordinate and vertical/horizontal orientation.",
      invariant:
        "The triangle $x\\ge0$, $y\\ge0$, $x+y\\le2$ stays fixed; only the section and order change.",
      counterexample:
        "For a square frame with an open central square removed, a middle slice has two intervals. One inner integral cannot cover it.",
      transfer:
        "With the picture hidden, reverse $\\int_0^1\\int_{x^2}^{x}f(x,y)\\,dy\\,dx$.",
      evidence:
        "The polygon, section endpoints, inequalities and displayed bounds are exact. SVG pixels only illustrate them.",
    },
    practice: [
      {
        id: "triangle-type",
        kind: "recognition",
        prompt: "Classify the closed triangle $x\\ge0$, $y\\ge0$, $x+y\\le2$.",
        choices: [
          { id: "correct", text: "Both Type I and Type II" },
          {
            id: "vertical",
            text: "Type I only",
            errorCode: "SECOND_ORIENTATION_MISSED",
          },
          { id: "neither", text: "Neither", errorCode: "SLICE_MISREAD" },
        ],
        answer: "correct",
        hint: "Every horizontal line also meets one interval.",
        explanation:
          "Both vertical and horizontal sections are single intervals.",
        feedback: {
          SECOND_ORIENTATION_MISSED:
            "Try a horizontal slice; its endpoints are $0$ and $2-y$.",
          SLICE_MISREAD: "Every section inside the triangle is connected.",
        },
      },
      {
        id: "frame-type",
        kind: "recognition",
        prompt: "Classify $[0,2]^2\\setminus(1/2,3/2)^2$ as one region.",
        choices: [
          { id: "correct", text: "Neither Type I nor Type II" },
          { id: "both", text: "Both types", errorCode: "REGION_NOT_SPLIT" },
          {
            id: "vertical",
            text: "Type I only",
            errorCode: "REGION_NOT_SPLIT",
          },
        ],
        answer: "correct",
        hint: "Inspect a line through the open central square.",
        explanation:
          "A middle vertical or horizontal line meets two separated intervals. Four rectangles cover the frame with boundary-only overlap.",
        feedback: {
          REGION_NOT_SPLIT:
            "A middle slice crosses the hole and breaks into two intervals.",
        },
      },
      {
        id: "type-one-only",
        kind: "recognition",
        prompt: "Classify $D=\\{(x,y):-1\\le x\\le1,\\ 0\\le y\\le x^2\\}$.",
        choices: [
          { id: "correct", text: "Type I only" },
          {
            id: "both",
            text: "Both types",
            errorCode: "DISCONNECTED_HORIZONTAL",
          },
          { id: "second", text: "Type II only", errorCode: "SLICE_MISREAD" },
        ],
        answer: "correct",
        hint: "At a height between $0$ and $1$, the horizontal section has a gap around $x=0$.",
        explanation:
          "Vertical sections are intervals; middle horizontal sections are two intervals.",
        feedback: {
          DISCONNECTED_HORIZONTAL:
            "The horizontal line misses the central gap below the parabola.",
          SLICE_MISREAD:
            "The given inequalities already make each vertical section an interval.",
        },
      },
      {
        id: "type-two-only",
        kind: "recognition",
        prompt: "Classify $D=\\{(x,y):-1\\le y\\le1,\\ 0\\le x\\le y^2\\}$.",
        choices: [
          { id: "correct", text: "Type II only" },
          {
            id: "both",
            text: "Both types",
            errorCode: "DISCONNECTED_VERTICAL",
          },
          { id: "first", text: "Type I only", errorCode: "SLICE_MISREAD" },
        ],
        answer: "correct",
        hint: "This is the previous region with $x$ and $y$ exchanged.",
        explanation:
          "Horizontal sections are intervals; middle vertical sections are two intervals.",
        feedback: {
          DISCONNECTED_VERTICAL:
            "For a fixed positive $x$, $y$ lies in two separated intervals.",
          SLICE_MISREAD:
            "The given inequalities already make each horizontal section an interval.",
        },
      },
      {
        id: "frame-split",
        kind: "setup",
        prompt:
          "Where should the square frame be split into four rectangles with only boundary overlap?",
        choices: [
          {
            id: "correct",
            text: "Top and bottom strips at $y=1/2,3/2$; left and right middle strips at $x=1/2,3/2$.",
          },
          {
            id: "one-cut",
            text: "One cut at $x=1$ is enough.",
            errorCode: "REGION_NOT_SPLIT",
          },
          {
            id: "none",
            text: "No cut is needed.",
            errorCode: "REGION_NOT_SPLIT",
          },
        ],
        answer: "correct",
        hint: "Keep the top and bottom strips whole, then split the middle left and right.",
        explanation:
          "This creates four closed rectangles covering the frame; any overlap lies on boundary segments of zero area.",
        feedback: {
          REGION_NOT_SPLIT:
            "A middle line still meets two disconnected pieces unless the hole is separated from the strips.",
        },
      },
      {
        id: "triangle-bounds",
        kind: "setup",
        prompt:
          "At vertical coordinate $x=0.5$, which exact inner bounds describe the triangle?",
        choices: [
          { id: "correct", text: "$0\\le y\\le1.5$" },
          { id: "reverse", text: "$0.5\\le y\\le2$", errorCode: "BOUND_ORDER" },
          {
            id: "square",
            text: "$0\\le y\\le2$",
            errorCode: "REGION_OVERCOUNT",
          },
        ],
        answer: "correct",
        hint: "Use $y\\le2-x$.",
        explanation: "Substituting $x=0.5$ gives $0\\le y\\le2-0.5=1.5$.",
        feedback: {
          BOUND_ORDER: "The lower endpoint is the $x$-axis, not $x$ itself.",
          REGION_OVERCOUNT:
            "The sloping boundary removes the top of the square.",
        },
      },
      {
        id: "reverse",
        kind: "transfer",
        prompt:
          "Without a picture, reverse $\\int_0^1\\int_{x^2}^{x} f(x,y)\\,dy\\,dx$.",
        choices: [
          {
            id: "correct",
            text: "$\\int_0^1\\int_y^{\\sqrt y}f(x,y)\\,dx\\,dy$",
          },
          {
            id: "swap",
            text: "$\\int_0^1\\int_{x^2}^{x}f(x,y)\\,dx\\,dy$",
            errorCode: "BOUND_ORDER",
          },
          {
            id: "inverted",
            text: "$\\int_0^1\\int_{\\sqrt y}^{y}f(x,y)\\,dx\\,dy$",
            errorCode: "BOUND_ORDER",
          },
        ],
        answer: "correct",
        hint: "Solve $x^2\\le y\\le x$ for $x$ with $0\\le x\\le1$.",
        explanation:
          "The same set has $0\\le y\\le1$ and $y\\le x\\le\\sqrt y$.",
        feedback: {
          BOUND_ORDER: "Changing order requires new bounds for the same set.",
        },
      },
    ],
    revise: {
      prompts: [
        "What does one vertical or horizontal section tell you?",
        "Which inequalities describe the triangle in the other order?",
      ],
      conditions:
        "Continuous ordered boundary functions on closed intervals and a continuous integrand on the compact region justify the slice formulas.",
      errors: [
        "Bounds copied across orders",
        "A disconnected section treated as one interval",
        "A boundary endpoint reversed",
      ],
      mixedCheck:
        "Explain why the square frame needs pieces, then reverse the triangle’s order without using the picture.",
    },
  },
};

export function learningModesFor(
  concept: Concept,
):
  | { version: "pilot-v2"; lesson: PilotLesson }
  | { version: "legacy-v1"; guide: LearningGuide } {
  const pilot = pilotLessons[concept.id];
  return pilot
    ? { version: "pilot-v2", lesson: pilot }
    : { version: "legacy-v1", guide: learningGuide(concept) };
}
