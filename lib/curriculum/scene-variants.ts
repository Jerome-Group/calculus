import type { Concept } from "./index";

export function sceneVariants(concept: Concept): string[] {
  if (concept.scene === "elementarycurves")
    return [
      "elementarycurves",
      "curveCircle",
      "curveEllipse",
      "curveCusp",
      "curveLine",
      "curves",
    ];
  if (concept.id === "surface-orientation") return ["parametric", "mobius"];
  if (concept.id === "conservative-domains") return ["conservative", "vortex"];
  return [concept.scene];
}
