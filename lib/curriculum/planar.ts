export type { Point, Trace, PlanarModel } from "./planar/types";
export { decimal } from "./planar/drawing";
import { functionsModel } from "./planar/functions";
import { integrationModel } from "./planar/integration";
import { seriesModel } from "./planar/series";
export function planarModel(id: string, value?: number) {
  const model =
    functionsModel(id, value) ??
    integrationModel(id, value) ??
    seriesModel(id, value);
  if (!model) throw new Error("Unknown planar model: " + id);
  return model;
}
