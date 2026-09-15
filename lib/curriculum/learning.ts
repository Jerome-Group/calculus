import type { Concept } from "./index";
import guides from "./learning-guides.json";
export type LearningGuide = {
  prerequisites: string[];
  reasoning:
    | "Complete proof"
    | "Proof sketch"
    | "Geometric motivation"
    | "Theorem used without proof";
  sections: { title: string; text: string }[];
  exercise: {
    prompt: string;
    hint: string;
    solution: string;
    solutionTex: string;
    rubric: string[];
  };
};
export const learningGuides = guides as Record<string, LearningGuide>;
export function learningGuide(concept: Concept) {
  return learningGuides[concept.id];
}
