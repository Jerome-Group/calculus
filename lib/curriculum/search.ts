import type { Concept } from "./index";
import { learningGuides } from "./learning";
const aliases: Record<string, string> = {
  "partials-do-not-make-a-plane":
    "all directional derivatives total frechet fr echet differentiability",
  "fubini-double": "can i swap integrals change order integration",
  "plane-jacobian": "why absolute jacobian determinant local nonlinear area",
  "lagrange-circle":
    "when does lagrange fail singular constraint gradient zero",
  "conservative-domains": "curl zero holes simply connected path independent",
};
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
export function matchesConcept(concept: Concept, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const guide = learningGuides[concept.id];
  const haystack = normalize(
    [
      concept.title,
      concept.subtitle,
      concept.definition,
      concept.conditions,
      concept.pitfall,
      ...concept.topics,
      aliases[concept.id] || "",
      guide?.sections.map((s) => s.text).join(" ") || "",
    ].join(" "),
  );
  return words.every((word) => haystack.includes(word));
}
