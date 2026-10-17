"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sceneChoices } from "@/lib/curriculum/scene-variants";
import type { StudyController } from "./use-study-controller";

export function ExperimentModels({
  study,
}: {
  study: Pick<StudyController, "concept" | "activeScene" | "chooseModel">;
}) {
  const choices = sceneChoices(study.concept);
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
