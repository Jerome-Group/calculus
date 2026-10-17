import { library } from "./journeys/library.mjs";
import { lessons } from "./journeys/lessons.mjs";
import { experiments } from "./journeys/experiments.mjs";
import { graph } from "./journeys/graph.mjs";
import { study } from "./journeys/study.mjs";

export const features = [
  {
    id: "library",
    description: "Course entry points, search, history, and mobile navigation.",
    run: library,
  },
  {
    id: "lessons",
    description:
      "Reading modes, reasoning, sources, prerequisites, and pagination.",
    run: lessons,
  },
  {
    id: "experiments",
    description:
      "Controls, comparisons, model restoration, and drawing recovery.",
    run: experiments,
  },
  {
    id: "graph",
    description:
      "Four graph representations, validation, presets, and camera controls.",
    run: graph,
  },
  {
    id: "study",
    description:
      "Device-local drafts, self-assessment, resume, and unavailable storage.",
    run: study,
  },
];

export function selectFeatures(ids) {
  const selected =
    ids === "all"
      ? features
      : ids
          .split(",")
          .map((id) => features.find((feature) => feature.id === id));
  if (
    !selected.length ||
    selected.some((feature) => !feature) ||
    new Set(selected).size !== selected.length
  )
    throw new Error(
      `Features must be all or distinct IDs from ${features.map((feature) => feature.id).join(", ")}.`,
    );
  return selected;
}
