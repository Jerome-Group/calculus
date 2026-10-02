import { sources, type Concept } from "./index";
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
const searchableText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(searchableText).join(" ");
  if (value && typeof value === "object")
    return Object.values(value).map(searchableText).join(" ");
  return "";
};
const indexes = new WeakMap<Concept, string>();
export function matchesConcept(concept: Concept, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  let haystack = indexes.get(concept);
  if (haystack === undefined) {
    const guide = learningGuides[concept.id];
    haystack = normalize(
      [
        searchableText(concept),
        searchableText(guide),
        aliases[concept.id] || "",
        ...concept.sources.map(
          (citation) => sources[citation.sourceId]?.title || "",
        ),
      ].join(" "),
    );
    indexes.set(concept, haystack);
  }
  return words.every((word) => haystack.includes(word));
}
