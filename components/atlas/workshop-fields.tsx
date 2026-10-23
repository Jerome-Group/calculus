import type { Construction, FieldIssue } from "@/lib/workshop";

export function WorkshopFields({
  construction,
  issues,
  change,
}: {
  construction: Construction;
  issues: readonly FieldIssue[];
  change: (construction: Construction) => void;
}) {
  const field = (
    name: string,
    label: string,
    value: string,
    update: (text: string) => void,
  ) => {
    const issue = issues.find((item) => item.field === name);
    return (
      <label className="workshop-field" key={name} htmlFor={`workshop-${name}`}>
        <span>{label}</span>
        <input
          id={`workshop-${name}`}
          value={value}
          maxLength={32}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!issue}
          aria-describedby={issue ? `workshop-error-${name}` : undefined}
          onChange={(event) => update(event.target.value)}
        />
        {issue && (
          <span className="workshop-error" id={`workshop-error-${name}`}>
            {issue.message}
          </span>
        )}
      </label>
    );
  };
  switch (construction.kind) {
    case "linear-bound":
      return (
        <>
          <fieldset>
            <legend>Linear map L(x,y)=px+qy</legend>
            <div className="workshop-fields">
              {field("p", "Coefficient p", construction.p, (p) =>
                change({ ...construction, p }),
              )}
              {field("q", "Coefficient q", construction.q, (q) =>
                change({ ...construction, q }),
              )}
            </div>
          </fieldset>
          <div className="workshop-fields">
            {field(
              "bound",
              "Bound coefficient C > 0",
              construction.bound,
              (bound) => change({ ...construction, bound }),
            )}
            {field(
              "epsilon",
              "Illustrative ε > 0",
              construction.epsilon,
              (epsilon) => change({ ...construction, epsilon }),
            )}
          </div>
          <p className="workshop-hint">
            Use the Euclidean norm. Epsilon illustrates a symbolic rule that
            must hold for every positive tolerance.
          </p>
        </>
      );
    case "cubic-path":
      return (
        <>
          <div className="workshop-fields">
            {field(
              "exponent",
              "Integer exponent n, 1 to 6",
              construction.exponent,
              (exponent) => change({ ...construction, exponent }),
            )}
            {field(
              "coefficient",
              "Rational coefficient k",
              construction.coefficient,
              (coefficient) => change({ ...construction, coefficient }),
            )}
          </div>
          <p className="workshop-hint">
            The path is γ(t)=(t, ktⁿ), t&gt;0. Balance the denominator orders
            before deciding what the path proves.
          </p>
        </>
      );
    case "domain-loop":
      return (
        <fieldset>
          <legend>Vertices in traversal order</legend>
          <p className="workshop-hint">
            Closure to vertex 1 is automatic. Use 3 to 8 vertices; do not repeat
            the first. Self-intersections away from zero are allowed.
          </p>
          <div className="workshop-vertices">
            {construction.vertices.map(([x, y], i) => (
              <div className="workshop-vertex" key={i}>
                <span className="workshop-vertex-number" aria-hidden="true">
                  {i + 1}
                </span>
                {field(`vertex-${i}-x`, `Vertex ${i + 1} x`, x, (text) =>
                  change({
                    ...construction,
                    vertices: construction.vertices.map((pair, j) =>
                      i === j ? [text, pair[1]] : pair,
                    ),
                  }),
                )}
                {field(`vertex-${i}-y`, `Vertex ${i + 1} y`, y, (text) =>
                  change({
                    ...construction,
                    vertices: construction.vertices.map((pair, j) =>
                      i === j ? [pair[0], text] : pair,
                    ),
                  }),
                )}
              </div>
            ))}
          </div>
          <div className="workshop-actions">
            <button
              type="button"
              disabled={construction.vertices.length >= 8}
              onClick={() =>
                change({
                  ...construction,
                  vertices: [...construction.vertices, ["", ""]],
                })
              }
            >
              Add vertex
            </button>
            <button
              type="button"
              disabled={construction.vertices.length <= 3}
              onClick={() =>
                change({
                  ...construction,
                  vertices: construction.vertices.slice(0, -1),
                })
              }
            >
              Remove last vertex
            </button>
          </div>
        </fieldset>
      );
  }
}

export function CapturedConstruction({
  construction,
}: {
  construction: Construction;
}) {
  switch (construction.kind) {
    case "linear-bound":
      return (
        <p className="workshop-captured">
          Captured coefficients. p={construction.p}; q={construction.q}; C=
          {construction.bound}; ε={construction.epsilon}.
        </p>
      );
    case "cubic-path":
      return (
        <p className="workshop-captured">
          Captured path. n={construction.exponent}; k={construction.coefficient}
          ; γ(t)=(t, ktⁿ), t&gt;0.
        </p>
      );
    case "domain-loop":
      return (
        <div className="workshop-captured">
          <p>Captured traversal, closing to vertex 1.</p>
          <ol>
            {construction.vertices.map(([x, y], i) => (
              <li key={i}>
                Vertex {i + 1}. ({x}, {y}) → vertex{" "}
                {((i + 1) % construction.vertices.length) + 1}.
              </li>
            ))}
          </ol>
        </div>
      );
  }
}
