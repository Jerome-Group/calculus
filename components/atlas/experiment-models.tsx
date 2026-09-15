"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudyController } from "./use-study-controller";
const jacobianModels: [string, string][] = [
  ["plane-nonlinear-jacobian", "Move the cell"],
  ["plane-nonlinear-cell", "Shrink the cell"],
  ["jacobian", "Linear map comparison"],
];
const variants: Record<string, [string, string][]> = {
  "plane-jacobian": jacobianModels,
  "change-of-variables": jacobianModels,
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
export function ExperimentModels({
  study,
}: {
  study: Pick<StudyController, "concept" | "activeScene" | "chooseModel">;
}) {
  const choices = variants[study.concept.id] || variants[study.concept.scene];
  if (!choices) return null;
  return (
    <div className="variant-select">
      <span>Compare models</span>
      <Select value={study.activeScene} onValueChange={study.chooseModel}>
        <SelectTrigger aria-label="Experiment model">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
