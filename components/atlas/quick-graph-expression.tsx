"use client";
import { useState } from "react";
import { expressionPreview } from "./expression-preview";
import { Formula } from "./math-text";

export function QuickGraphExpression({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  let preview = "";
  try {
    preview = `z=${expressionPreview(value)}`;
  } catch {
    // Invalid and incomplete DSL remains visible and editable below.
  }

  return (
    <div className="quick-graph-expression-field">
      <input
        id="quick-expression"
        className="quick-graph-expression-input"
        aria-label="Quick graph expression"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!focused && (
        <span className="quick-graph-expression-display" aria-hidden="true">
          <span className="quick-graph-expression-value">
            {preview ? (
              <Formula>{preview}</Formula>
            ) : (
              <code>{value || "Enter an expression"}</code>
            )}
          </span>
          <span className="quick-graph-edit">Edit</span>
        </span>
      )}
    </div>
  );
}
