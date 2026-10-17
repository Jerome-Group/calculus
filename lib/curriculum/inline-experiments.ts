import {
  shiftedDiskRadialBound,
  shiftedDiskVerticalSlice,
} from "./polar-region";
import {
  reviewPlane,
  reviewResidual,
  reviewValue,
  type ReviewFunction,
} from "./review-differentiability";

export type Parameter = "value" | "radius" | "angle";
type ParameterSpec = {
  initial: number;
  min: number;
  max: number;
  step: number | "any";
};
type ExperimentSpec = {
  id: string;
  parameters: Partial<Record<Parameter, ParameterSpec>>;
};

export const regionExperimentSpecs = {
  domain: { initial: 1, min: 0, max: 2, step: 0.01 },
  slice: { initial: 0, min: -Math.PI / 2, max: Math.PI / 2, step: "any" },
  "transformed-domain": {
    initial: Math.PI / 4,
    min: -Math.PI / 2,
    max: Math.PI / 2,
    step: "any",
  },
} as const;

const catalog: Record<string, ExperimentSpec[]> = {
  "polar-regions": Object.entries(regionExperimentSpecs).map(([id, spec]) => ({
    id,
    parameters: { value: spec },
  })),
  "review-total-differentiability": [
    {
      id: "differentiable",
      parameters: {
        radius: { initial: 0.25, min: 0.01, max: 0.5, step: 0.01 },
        angle: { initial: 0, min: -Math.PI, max: Math.PI, step: "any" },
      },
    },
    {
      id: "counterexample",
      parameters: {
        radius: { initial: 0.25, min: 0.01, max: 0.5, step: 0.01 },
        angle: {
          initial: Math.PI / 4,
          min: -Math.PI,
          max: Math.PI,
          step: "any",
        },
      },
    },
  ],
};

const openExperiments = new Set<string>();
const listeners = new Map<string, Set<() => void>>();
const stateKey = (conceptId: string, id: string) => `${conceptId}:${id}`;

function specFor(
  conceptId: string,
  id: string,
  parameter: Parameter,
): ParameterSpec {
  const spec = catalog[conceptId]?.find((entry) => entry.id === id)?.parameters[
    parameter
  ];
  if (!spec)
    throw new Error("Unknown inline experiment or parameter for this lesson.");
  return spec;
}

function notify(conceptId: string, id: string) {
  listeners.get(stateKey(conceptId, id))?.forEach((listener) => listener());
}

export function inlineExperimentCatalog(conceptId: string) {
  return (catalog[conceptId] ?? []).map(({ id, parameters }) => ({
    id,
    parameters: Object.keys(parameters),
  }));
}

export function subscribeInlineExperiment(
  conceptId: string,
  id: string,
  listener: () => void,
) {
  const key = stateKey(conceptId, id);
  const subscribers = listeners.get(key) ?? new Set<() => void>();
  subscribers.add(listener);
  listeners.set(key, subscribers);
  return () => {
    subscribers.delete(listener);
    if (!subscribers.size) listeners.delete(key);
  };
}

export function initialInlineExperimentValue(
  conceptId: string,
  id: string,
  parameter: Parameter,
) {
  return specFor(conceptId, id, parameter).initial;
}

export function normalizeInlineExperimentValue(
  conceptId: string,
  id: string,
  parameter: Parameter,
  value: number,
) {
  const spec = specFor(conceptId, id, parameter);
  if (!Number.isFinite(value)) throw new Error("value must be finite.");
  if (value < spec.min || value > spec.max)
    throw new Error(`Choose a value between ${spec.min} and ${spec.max}.`);
  return spec.step === "any"
    ? value
    : Math.min(
        spec.max,
        spec.min + Math.round((value - spec.min) / spec.step) * spec.step,
      );
}

export function getInlineExperimentOpen(conceptId: string, id: string) {
  return openExperiments.has(stateKey(conceptId, id));
}

export function setInlineExperimentOpen(
  conceptId: string,
  id: string,
  open: boolean,
) {
  if (!catalog[conceptId]?.some((entry) => entry.id === id))
    throw new Error("Unknown inline experiment for this lesson.");
  const key = stateKey(conceptId, id);
  if (open === openExperiments.has(key)) return;
  if (open) openExperiments.add(key);
  else openExperiments.delete(key);
  notify(conceptId, id);
}

export function inlineExperimentSnapshot(
  conceptId: string,
  read: (id: string, parameter: Parameter) => number = (id, parameter) =>
    initialInlineExperimentValue(conceptId, id, parameter),
) {
  return inlineExperimentCatalog(conceptId).map(({ id, parameters }) => {
    const current = Object.fromEntries(
      parameters.map((parameter) => [
        parameter,
        read(id, parameter as Parameter),
      ]),
    );
    let readout: string;
    if (conceptId === "polar-regions") {
      const value = current.value;
      if (id === "domain") {
        const vertical = shiftedDiskVerticalSlice(value);
        readout = `x = ${value.toFixed(2)}; y from ${vertical?.lower.toFixed(2)} to ${vertical?.upper.toFixed(2)}.`;
      } else {
        const radial = shiftedDiskRadialBound(value);
        readout = `θ = ${value.toFixed(2)} radians; r from 0 to ${radial?.toFixed(2)}.`;
      }
    } else {
      const radius = current.radius;
      const angle = current.angle;
      const kind = id as ReviewFunction;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      readout = `r = ${radius.toFixed(2)}; θ = ${angle.toFixed(2)}; point (x,y) = (${x.toFixed(3)}, ${y.toFixed(3)}). Function value = ${reviewValue(kind, x, y).toFixed(4)}; candidate plane = ${reviewPlane(kind, x).toFixed(4)}; signed normalized remainder = ${reviewResidual(kind, x, y).toFixed(4)}.`;
    }
    return {
      id,
      parameters: current,
      readout,
      open: getInlineExperimentOpen(conceptId, id),
    };
  });
}
