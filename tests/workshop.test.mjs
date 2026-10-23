import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createSsrServer } from "./helpers/ssr-server.mjs";
import katex from "katex";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createSsrServer(
  {
    appType: "custom",
    configFile: false,
    root,
    resolve: { alias: { "@": root } },
    server: { middlewareMode: true, hmr: false, ws: false },
  },
  after,
);
const { createWorkshop, workshopTransition, investigations } =
  await vite.ssrLoadModule("/lib/workshop/index.ts");
const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");

function inspect(
  construction,
  explanation = "My initial claim, preserved exactly.",
) {
  let book = createWorkshop();
  book = workshopTransition(book, {
    type: "write",
    draft: { construction, explanation },
  });
  book = workshopTransition(book, { type: "check", id: construction.kind });
  return { book, state: book[construction.kind] };
}
const bound = (patch = {}) => ({
  kind: "linear-bound",
  p: "2",
  q: "-1",
  bound: "3",
  epsilon: "1/10",
  ...patch,
});
const path = (exponent, coefficient) => ({
  kind: "cubic-path",
  exponent: String(exponent),
  coefficient,
});
const polygon = (vertices) => ({
  kind: "domain-loop",
  vertices: vertices.map(([x, y]) => [String(x), String(y)]),
});
const square = [
  [-2, -1],
  [2, -1],
  [2, 1],
  [-2, 1],
];
function report(construction) {
  const { state } = inspect(construction);
  assert.equal(state.phase, "inspected", JSON.stringify(state));
  for (const step of state.current.report.steps) {
    katex.renderToString(step.tex, { throwOnError: true, strict: "ignore" });
    assert.ok(step.spoken.length > 10);
  }
  return state.current.report;
}

test("sharp remainder bound has exact strict and equality boundaries and a rule for every epsilon", () => {
  for (const C of ["2", "2.99999999999999999999999999999"])
    assert.equal(report(bound({ bound: C })).kind, "bound-obstruction");
  for (const [C, epsilon, delta] of [
    ["3", "1/10", "1/30"],
    ["6/2", "0.1", "1/30"],
    [
      "3.00000000000000000000000000001",
      "1/10",
      "10000000000000000000000000000/300000000000000000000000000001",
    ],
    [
      "1000000",
      "1/999999999999999999999999999999",
      "1/999999999999999999999999999999000000",
    ],
  ]) {
    const result = report(bound({ bound: C, epsilon }));
    assert.equal(result.kind, "universal-certificate");
    assert.equal(result.delta, delta);
    assert.match(result.scope, /every positive epsilon/);
  }
  const result = report(bound({ bound: "2" }));
  assert.match(result.scope, /derivative .* remains valid/);
  assert.match(result.steps[1].spoken, /every point/);
});

test("signed-axis derivative witnesses refute only the proposed map and recompute correctly", () => {
  for (const [p, q, axis, sign, a, d] of [
    ["1", "-1", "x", 1, 1, 3],
    ["3", "-1", "x", -1, 1, 3],
    ["2", "-2", "y", 1, 1, 1],
    ["2", "1", "y", -1, 2, 1],
  ]) {
    const result = report(bound({ p, q }));
    assert.deepEqual(
      [
        result.kind,
        result.axis,
        result.sign,
        result.residual,
        result.quadratic,
      ],
      ["derivative-obstruction", axis, sign, String(a), d],
    );
    for (const j of [1, 5, 100]) {
      const x = axis === "x" ? sign / j : 0,
        y = axis === "y" ? sign / j : 0;
      const remainder =
        2 * x - y + 3 * x * x + y * y - (Number(p) * x + Number(q) * y);
      assert.ok(Math.abs(Math.abs(remainder) * j - (a + d / j)) < 1e-12);
    }
    assert.match(result.scope, /function remains differentiable/);
    assert.match(
      result.scope,
      /does not claim that every finite epsilon test fails/,
    );
  }
});

test("all six path exponents and zero coefficients preserve the restricted versus full-limit distinction", () => {
  for (let n = 1; n <= 6; n++) {
    for (const k of ["0", "1", "-2"]) {
      const result = report(path(n, k));
      assert.equal(
        result.kind,
        n === 3 && k !== "0" ? "path-obstruction" : "restricted-path",
      );
      if (result.kind === "restricted-path")
        assert.match(result.scope, /unrestricted limit unresolved/);
      else {
        assert.equal(result.constant, k === "1" ? "1/2" : "-2/5");
        assert.equal(result.epsilon0, k === "1" ? "1/4" : "1/5");
        for (const delta of [0.000001, 1, 6, 100]) {
          const t = Math.min(1, delta / (2 * (1 + Math.abs(Number(k)))));
          assert.ok(t > 0 && Math.hypot(t, Number(k) * t ** 3) < delta);
          assert.ok(
            Math.abs(Number(k) / (1 + Number(k) ** 2)) >
              Number(k === "1" ? 0.25 : 0.2),
          );
        }
      }
    }
  }
  const d = 999999999999999999999999999999n;
  const tiny = report(path(3, `1/${d}`));
  assert.equal(tiny.kind, "path-obstruction");
  assert.equal(tiny.constant, `${d}/${d * d + 1n}`);
  assert.equal(tiny.epsilon0, `${d}/${2n * (d * d + 1n)}`);
});

test("ordered polygon winding handles reversal, multiple turns, retracing, self-intersections and ray degeneracies", () => {
  const fixtures = [
    [square, 1],
    [
      [
        [1, 1],
        [3, 1],
        [3, 2],
        [1, 2],
      ],
      0,
    ],
    [[...square, ...square], 2],
    [[...square, square[0], square[3], square[2], square[1]], 0],
    [
      [
        [-2, -1],
        [2, 2],
        [-2, 2],
        [2, -1],
      ],
      -1,
    ],
    [
      [
        [2, 0],
        [0, 2],
        [-2, 0],
        [0, -2],
      ],
      1,
    ],
    [
      [
        [1, 0],
        [3, 0],
        [3, 2],
        [1, 2],
      ],
      0,
    ],
    [
      [
        [1, 0],
        [3, 1],
        [2, 2],
      ],
      0,
    ],
    [
      [
        [1, 0],
        [2, -1],
        [3, 0],
        [2, 1],
      ],
      0,
    ],
    [
      [
        [2, 0],
        [2, 2],
        [-2, 2],
        [-2, -2],
        [2, -2],
        [2, -1],
      ],
      1,
    ],
  ];
  for (const [vertices, w] of fixtures) {
    const result = report(polygon(vertices));
    assert.equal(result.winding, w, JSON.stringify(vertices));
    assert.equal(result.kind, w === 0 ? "one-loop-only" : "loop-obstruction");
    assert.equal(result.circulation, w === 0 ? "0" : `${4 * w}π`);
    const reversed = report(polygon([...vertices].reverse()));
    assert.equal(reversed.winding, -w || 0);
    if (w === 0) assert.match(result.scope, /no global potential claim/);
  }
  const tiny = "1/99999999999999999999999999999";
  assert.equal(
    report(
      polygon([
        [tiny, tiny],
        [`-${tiny}`, tiny],
        [`-${tiny}`, `-${tiny}`],
        [tiny, `-${tiny}`],
      ]),
    ).winding,
    1,
  );
});

test("invalid syntax and inadmissible segments produce field issues without assigning circulation", () => {
  for (const construction of [
    bound({ p: "1/0" }),
    bound({ p: "Infinity" }),
    bound({ p: "1e2" }),
    bound({ p: "2+1" }),
    bound({ p: "1".repeat(33) }),
    bound({ bound: "0" }),
    bound({ epsilon: "-1" }),
    bound({ q: "1000001" }),
    path(7, "1"),
    path("1.0", "1"),
    polygon([
      [0, 0],
      [1, 1],
      [-1, 1],
    ]),
    polygon([
      [1, 0],
      [-1, 0],
      [1, 1],
    ]),
    polygon([
      [1, 0],
      [2, 1],
      [1, 0],
    ]),
    polygon([
      [1, 1],
      [1, 1],
      [2, 2],
    ]),
    polygon([
      [1, 1],
      [2, 1],
    ]),
    polygon(Array.from({ length: 9 }, (_, i) => [i + 1, 1])),
  ]) {
    const { state } = inspect(construction);
    assert.equal(state.phase, "drafting", JSON.stringify(construction));
    assert.ok(state.issues.length > 0);
    assert.equal("current" in state, false);
  }
  assert.equal(
    report(bound({ p: "+2.0", q: "2/-2" })).kind,
    "universal-certificate",
  );
});

test("attempt identity keeps each construction, initial explanation, result and revisions paired", () => {
  let { book, state } = inspect(bound({ bound: "2" }), "first explanation");
  const first = state.current;
  assert.equal(
    workshopTransition(book, { type: "check", id: "linear-bound" }),
    book,
  );
  book = workshopTransition(book, {
    type: "write-revision",
    id: "linear-bound",
    text: "first revision",
  });
  book = workshopTransition(book, {
    type: "keep-revision",
    id: "linear-bound",
    attempt: first.id,
  });
  assert.equal(first.revisions.length, 0);
  assert.deepEqual(book["linear-bound"].current.revisions, ["first revision"]);
  book = workshopTransition(book, { type: "reconstruct", id: "linear-bound" });
  assert.equal(book["linear-bound"].phase, "drafting");
  assert.equal("current" in book["linear-bound"], false);
  assert.equal(book["linear-bound"].draft.explanation, "");
  const second = bound();
  book = workshopTransition(book, {
    type: "write",
    draft: { construction: second, explanation: "second explanation" },
  });
  book = workshopTransition(book, { type: "check", id: "linear-bound" });
  const checked = book;
  assert.equal(
    book["linear-bound"].current.initialExplanation,
    "second explanation",
  );
  assert.equal(
    book["linear-bound"].current.report.kind,
    "universal-certificate",
  );
  assert.equal(
    book["linear-bound"].history[0].initialExplanation,
    "first explanation",
  );
  assert.equal(
    book["linear-bound"].history[0].report.kind,
    "bound-obstruction",
  );
  assert.equal(
    workshopTransition(book, {
      type: "keep-revision",
      id: "linear-bound",
      attempt: first.id,
    }),
    checked,
  );
  book = workshopTransition(book, {
    type: "write",
    draft: { construction: path(2, "-2"), explanation: "other investigation" },
  });
  assert.equal(book["linear-bound"], checked["linear-bound"]);
  assert.equal(createWorkshop()["linear-bound"].phase, "drafting");
});

test("the single workshop catalog links preserved public lessons without changing their inventory", () => {
  assert.equal(concepts.length, 125);
  assert.equal(investigations.length, 3);
  for (const item of investigations)
    for (const id of item.lessons)
      assert.equal(concepts.find((c) => c.id === id)?.course, "MH2100");
});
