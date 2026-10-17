import type { Concept } from "./index";

type SceneChoice = readonly [scene: string, label: string];

const jacobianChoices: readonly SceneChoice[] = [
  ["plane-nonlinear-jacobian", "Move the cell"],
  ["plane-nonlinear-cell", "Shrink the cell"],
  ["jacobian", "Linear map comparison"],
];

const sceneChoiceRegistry: Partial<Record<string, readonly SceneChoice[]>> = {
  "plane-jacobian": jacobianChoices,
  "change-of-variables": jacobianChoices,
  "flux-through-surfaces": [
    ["flux", "Radial field"],
    ["fluxOblique", "Constant field, signed contributions"],
  ],
  "multivariable-chain-rule": [
    ["chainNonconstant", "Nonconstant path"],
    ["chain", "Constant-height circle"],
  ],
  "surface-orientation": [
    ["parametric", "Sphere chart"],
    ["mobius", "Möbius strip"],
  ],
  "conservative-domains": [
    ["conservative", "Potential field"],
    ["vortex", "Punctured-plane field"],
  ],
  elementarycurves: [
    ["elementarycurves", "Cycloid"],
    ["curveCircle", "Circle"],
    ["curveEllipse", "Ellipse"],
    ["curveCusp", "Cusp"],
    ["curveLine", "Line"],
    ["curves", "Helix"],
  ],
};

export function sceneChoices(
  concept: Concept,
): readonly SceneChoice[] | undefined {
  return sceneChoiceRegistry[concept.id] ?? sceneChoiceRegistry[concept.scene];
}

export function sceneVariants(concept: Concept): string[] {
  return sceneChoices(concept)?.map(([scene]) => scene) ?? [concept.scene];
}
