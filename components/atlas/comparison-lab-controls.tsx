"use client";
import { useId, useState, type ReactNode } from "react";
export const number = (n: number) =>
  Math.abs(n) < 0.00005 ? "0" : n.toFixed(4);
export function Range({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <label className="compare-control" htmlFor={id}>
      <span>
        {label} <output>{number(value)}</output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Chart({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <svg
      className="compare-chart"
      viewBox="0 0 320 210"
      role="img"
      aria-labelledby={`${id}-title ${id}-description`}
    >
      <title id={`${id}-title`}>{label}</title>
      <desc id={`${id}-description`}>{description}</desc>
      {children}
    </svg>
  );
}
export function line(fn: (t: number) => [number, number], lo = -1, hi = 1) {
  return Array.from({ length: 81 }, (_, i) => {
    const [x, y] = fn(lo + ((hi - lo) * i) / 80);
    return `${x},${y}`;
  }).join(" ");
}
export function Prediction({
  question,
  choices,
  answer,
  reason,
}: {
  question: string;
  choices: string[];
  answer: number;
  reason: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="compare-prediction">
      <p>{question}</p>
      <div className="compare-choices" role="group" aria-label={question}>
        {choices.map((choice, i) => (
          <button
            type="button"
            key={choice}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            {choice}
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className="compare-feedback" role="status">
          {selected === answer ? "Correct. " : "Reconsider: "}
          {reason}
        </p>
      )}
    </div>
  );
}
