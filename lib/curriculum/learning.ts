import type { Concept } from "./index";
import guides from "./learning-guides.json";
export type ProofStatus =
  | "Complete proof"
  | "Proof sketch"
  | "Geometric motivation"
  | "Theorem used without proof";
type StructuredStep = {
  label: string;
  text: string;
  equation?: string;
  usesHypothesis?: string;
};
export type StructuredLessonBlock =
  | {
      kind: "theorem";
      id: string;
      title: string;
      statement: string;
      hypotheses: string[];
      prerequisites: string[];
      status: ProofStatus;
    }
  | {
      kind: "assumption";
      id: string;
      title: string;
      items: string[];
    }
  | {
      kind: "equation";
      id: string;
      title: string;
      tex: string;
      note?: string;
    }
  | {
      kind: "strategy";
      id: string;
      title: string;
      text: string;
    }
  | {
      kind: "derivation" | "worked-example";
      id: string;
      title: string;
      strategy: string;
      setup: string;
      steps: StructuredStep[];
      result: string;
      verification: string;
    };
export type PracticeExercise = {
  prompt: string;
  hint: string;
  solution: string;
  solutionTex: string;
  rubric: string[];
};
export type LearningGuide = {
  prerequisites: string[];
  reasoning: ProofStatus;
  contentBlocks?: StructuredLessonBlock[];
  supplementalBlocks?: StructuredLessonBlock[];
  nextStep?: { id: string; label: string };
  relatedStep?: { id: string; label: string };
  sections: { title: string; text: string }[];
  exercise: PracticeExercise;
  exercises?: (PracticeExercise & {
    id: string;
    outcome: string;
    kind:
      | "conceptual"
      | "computational"
      | "proof"
      | "counterexample"
      | "method-choice";
  })[];
};
export const learningGuides = guides as Record<string, LearningGuide>;
export function learningGuide(concept: Concept) {
  return learningGuides[concept.id];
}
