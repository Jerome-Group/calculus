export type Point = [number, number];
export type Trace = {
  points: Point[];
  label: string;
  color: string;
  dashed?: boolean;
  fill?: boolean;
  dots?: boolean;
};
export type PlanarModel = {
  label: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  formula: string;
  bounds: [number, number, number, number];
  traces: Trace[];
  readout: string;
  note: string;
};
