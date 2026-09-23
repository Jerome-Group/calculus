import type { Citation, Concept, Source } from "./index";

export type PublicReading = {
  url: string;
  locator: string;
  purpose: string;
};

export function citationUse(
  citation: Citation,
  source: Source,
  concept: Concept,
) {
  const detail = citation.detail.toLowerCase();
  if (source.kind !== "lecture")
    return {
      role: "Optional second explanation",
      purpose: `Compare the treatment of ${concept.title.toLowerCase()} with this lesson after attempting its original practice.`,
    };
  if (detail.includes("definition"))
    return {
      role: "Definition",
      purpose:
        "Check the objects and notation against the definition in this lesson.",
    };
  if (detail.includes("theorem") || detail.includes("corollary"))
    return {
      role: "Theorem statement",
      purpose:
        "Compare its hypotheses with the conditions above before using the result.",
    };
  if (detail.includes("proof"))
    return {
      role: "Proof",
      purpose: "Compare this argument with the step-by-step reasoning above.",
    };
  if (detail.includes("example"))
    return {
      role: "Worked example",
      purpose:
        "Try its setup first, then compare the method and result with this lesson.",
    };
  if (detail.includes("exercise") || detail.includes("review problem"))
    return {
      role: "Transfer task",
      purpose:
        "Attempt this after the original practice to check transfer to another question.",
    };
  return {
    role: "Course context",
    purpose: "Compare its scope and notation with the explanation above.",
  };
}

const volume1 = "https://openstax.org/books/calculus-volume-1/pages/";
const volume3 = "https://openstax.org/books/calculus-volume-3/pages/";

export const goldPathReadings: Record<string, PublicReading[]> = {
  "limit-laws-squeeze": [
    {
      url: `${volume1}2-3-the-limit-laws`,
      locator: "OpenStax Calculus 1 §2.3 · conjugates and squeeze theorem",
      purpose:
        "Compare the conjugate method and squeeze setup, then return to the unit-circle proof and both transfer tasks here.",
    },
  ],
  "differentiability-corners": [
    {
      url: `${volume1}3-2-the-derivative-as-a-function`,
      locator: "OpenStax Calculus 1 §3.2 · Higher-Order Derivatives",
      purpose:
        "Check how position, velocity and acceleration use successive derivatives; then solve the motion task here.",
    },
  ],
  "differentiation-rules": [
    {
      url: `${volume1}3-3-differentiation-rules`,
      locator: "OpenStax Calculus 1 §3.3 · product and quotient rules",
      purpose:
        "Compare the two-factor increment proof and keep the quotient domain restriction visible.",
    },
    {
      url: `${volume1}3-5-derivatives-of-trigonometric-functions`,
      locator: "OpenStax Calculus 1 §3.5 · trigonometric derivatives",
      purpose:
        "Check the six trigonometric rules and derive tangent from sine and cosine in the task here.",
    },
  ],
  "chain-rule-single": [
    {
      url: `${volume1}3-6-the-chain-rule`,
      locator: "OpenStax Calculus 1 §3.6 · Deriving the Chain Rule",
      purpose:
        "Compare the composition rule with the remainder proof here, especially the zero inner-increment case.",
    },
  ],
  "linearization-differentials": [
    {
      url: `${volume1}4-2-linear-approximations-and-differentials`,
      locator:
        "OpenStax Calculus 1 §4.2 · Linear Approximation of a Function at a Point",
      purpose:
        "Compare the affine approximation with the exact residual and the O/o definitions taught here.",
    },
  ],
  "rolle-mean-value": [
    {
      url: `${volume1}4-4-the-mean-value-theorem`,
      locator:
        "OpenStax Calculus 1 §4.4 · Rolle’s Theorem and Mean Value Theorem",
      purpose:
        "Check each interval hypothesis, then compare the Rolle-to-secant proof path here.",
    },
  ],
  "inverse-functions": [
    {
      url: `${volume1}3-7-derivatives-of-inverse-functions`,
      locator:
        "OpenStax Calculus 1 §3.7 · The Derivative of an Inverse Function",
      purpose:
        "Compare inverse branches and corresponding inputs before using the reciprocal-slope formula.",
    },
  ],
  lhopital: [
    {
      url: `${volume1}4-8-lhopitals-rule`,
      locator: "OpenStax Calculus 1 §4.8 · Applying L’Hôpital’s Rule",
      purpose:
        "Classify 0/0, infinity/infinity and convertible forms before attempting the method-choice task here.",
    },
  ],
  "partial-derivatives-as-slices": [
    {
      url: `${volume3}4-3-partial-derivatives`,
      locator: "OpenStax Calculus 3 §4.3 · Partial Derivatives",
      purpose:
        "Compare fixed-coordinate slices with the candidate-map calculation here.",
    },
  ],
  "total-differentiability": [
    {
      url: `${volume3}4-4-tangent-planes-and-linear-approximations`,
      locator:
        "OpenStax Calculus 3 §4.4 · Differentiability of a Function of Two Variables",
      purpose:
        "Compare the full-distance error condition with the polynomial remainder proof here.",
    },
  ],
  "partials-do-not-make-a-plane": [
    {
      url: `${volume3}4-4-tangent-planes-and-linear-approximations`,
      locator:
        "OpenStax Calculus 3 §4.4 · differentiability versus partial derivatives",
      purpose:
        "Compare why coordinate slopes alone do not certify a tangent plane, then test the exact counterexample here.",
    },
  ],
  "certifying-differentiability-and-errors": [
    {
      url: `${volume3}4-4-tangent-planes-and-linear-approximations`,
      locator:
        "OpenStax Calculus 3 §4.4 · Differentiability of a Function of Two Variables",
      purpose:
        "Check the continuous-partials condition and distinguish it from the direct remainder test here.",
    },
  ],
  "multivariable-chain-rule": [
    {
      url: `${volume3}4-5-the-chain-rule`,
      locator:
        "OpenStax Calculus 3 §4.5 · Chain Rules for One or Two Independent Variables",
      purpose:
        "Compare the two coordinate-rate contributions with the derivative-map proof and transfer task here.",
    },
  ],
  "directional-derivatives-and-gradient": [
    {
      url: `${volume3}4-6-directional-derivatives-and-the-gradient`,
      locator: "OpenStax Calculus 3 §4.6 · Directional Derivatives",
      purpose:
        "Compare the unit-direction convention with the direct-limit test of the nondifferentiable example here.",
    },
  ],
  "gradient-normals-and-steepest-ascent": [
    {
      url: `${volume3}4-6-directional-derivatives-and-the-gradient`,
      locator: "OpenStax Calculus 3 §4.6 · The Gradient",
      purpose:
        "Compare the gradient norm bound and its equality case with the zero-gradient task here.",
    },
  ],
  "review-total-differentiability": [
    {
      url: `${volume3}4-4-tangent-planes-and-linear-approximations`,
      locator:
        "OpenStax Calculus 3 §4.4 · Differentiability of a Function of Two Variables",
      purpose:
        "Use the general error definition as context; the two exact review functions and proofs are provided here.",
    },
  ],
};
