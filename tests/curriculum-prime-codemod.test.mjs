import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";
import { hasBaselinePrime } from "./helpers/math-notation.mjs";
import {
  normalizePrimes,
  normalizePrimeSource,
} from "../scripts/normalize-curriculum-primes.mjs";

function assertRaisedPrimes(tex) {
  const mathml = katex.renderToString(tex, {
    output: "mathml",
    throwOnError: true,
    strict: "error",
  });
  assert.match(mathml, /<msup>/);
  assert.match(mathml, /<mo\b[^>]*>′<\/mo>/u);
  assert.equal(hasBaselinePrime(mathml), false);
}

test("prime codemod matches the hand-corrected first derivative and groups repeated primes", () => {
  assert.equal(
    normalizePrimes(String.raw`f\prime(a)=\lim_{h\to0}[f(a+h)-f(a)]/h`).tex,
    String.raw`f^{\prime}(a)=\lim_{h\to0}[f(a+h)-f(a)]/h`,
  );
  assert.equal(
    normalizePrimes(String.raw`f\prime\prime(x)+g\prime \prime(x)`).tex,
    String.raw`f^{\prime\prime}(x)+g^{\prime \prime}(x)`,
  );
  assert.equal(
    normalizePrimes(String.raw`U^{\prime}, f^\prime, f'(x), \primer`).tex,
    String.raw`U^{\prime}, f^\prime, f'(x), \primer`,
  );
});

test("prime codemod groups repeated primes under an existing unbraced caret", () => {
  for (const [input, expected] of [
    [String.raw`f^\prime\prime(x)`, String.raw`f^{\prime\prime}(x)`],
    [
      String.raw`f^ \prime \prime \prime(x)`,
      String.raw`f^ {\prime \prime \prime}(x)`,
    ],
  ]) {
    const result = normalizePrimes(input);
    assert.equal(result.tex, expected);
    assert.equal(result.runs, 1);
    assertRaisedPrimes(result.tex);
    assert.deepEqual(normalizePrimes(result.tex), { tex: expected, runs: 0 });
  }
});

test("prime codemod leaves no repeated prime at baseline", () => {
  assertRaisedPrimes(normalizePrimes(String.raw`f^\prime\prime(x)`).tex);
});

test("prime codemod preserves source formatting and is safe to rerun", () => {
  const input = `{
  "tex": "f\\\\prime\\\\prime(x)",
  "prose": "Fermat's theorem"
}\n`;
  const result = normalizePrimeSource(input);
  assert.equal(result.runs, 1);
  assert.equal(
    result.source,
    input.replace("f\\\\prime\\\\prime", "f^{\\\\prime\\\\prime}"),
  );
  assert.deepEqual(normalizePrimeSource(result.source), {
    source: result.source,
    runs: 0,
  });
});

test("prime codemod edits tagged template text while preserving nested expressions", () => {
  const input =
    "const tex = String.raw; const formula = tex`f\\prime(x)=${measure({ value: 'x' })}, g\\prime\\prime(x)=${other ? `${nested}` : 'unchanged'}`; return formula;";
  const expected = input
    .replace("f\\prime(x)", "f^{\\prime}(x)")
    .replace("g\\prime\\prime(x)", "g^{\\prime\\prime}(x)");
  const result = normalizePrimeSource(input, "readouts.ts");
  assert.deepEqual(result, { source: expected, runs: 2 });
  assert.deepEqual(normalizePrimeSource(result.source, "readouts.ts"), {
    source: expected,
    runs: 0,
  });
  const tex = new Function("measure", "other", "nested", result.source)(
    ({ value }) => value,
    false,
    "unused",
  );
  assert.equal(tex, String.raw`f^{\prime}(x)=x, g^{\prime\prime}(x)=unchanged`);
  assertRaisedPrimes(tex);
});

test("prime codemod preserves cooked template escapes in generated JavaScript", () => {
  const input = "return `f\\\\prime(x)`;";
  const result = normalizePrimeSource(input, "formula.ts");
  const tex = new Function(result.source)();
  assert.equal(tex, String.raw`f^{\prime}(x)`);
  assertRaisedPrimes(tex);
  assert.deepEqual(normalizePrimeSource(result.source, "formula.ts"), {
    source: result.source,
    runs: 0,
  });
});

test("generated cooked templates render derivative symbols instead of letters", () => {
  const result = normalizePrimeSource("return `f\\\\prime(x)`;", "formula.ts");
  assertRaisedPrimes(new Function(result.source)());
});

test("prime codemod preserves cooked head, middle, tail and nested expressions", () => {
  const input =
    'const suffix = "(x)"; return `f\\\\prime${suffix} + ${`g\\\\prime${suffix}`} + h\\\\prime${suffix} + j\\\\prime(x)`;';
  const result = normalizePrimeSource(input, "formula.ts");
  const tex = new Function(result.source)();
  assert.equal(
    tex,
    String.raw`f^{\prime}(x) + g^{\prime}(x) + h^{\prime}(x) + j^{\prime}(x)`,
  );
  assert.equal(result.runs, 4);
  assertRaisedPrimes(tex);
});

test("prime codemod re-encodes cooked template delimiters and escapes", () => {
  const input =
    "return `f\\\\prime(x); \\` \\${literal}; \\\\alpha\\n\\u03b1`;";
  const result = normalizePrimeSource(input, "formula.ts");
  assert.equal(
    new Function(result.source)(),
    "f^{\\prime}(x); ` ${literal}; \\alpha\nα",
  );
});

test("prime codemod preserves decoded string literal values", () => {
  const input = 'return "f\\\\prime(x) + \\u03b1";';
  const result = normalizePrimeSource(input, "formula.ts");
  assert.equal(new Function(result.source)(), "f^{\\prime}(x) + α");
  assertRaisedPrimes(new Function(result.source)());
});

test("prime codemod resolves raw aliases in JavaScript source", () => {
  for (const file of ["formula.js", "formula.mjs"])
    assert.equal(
      new Function(
        normalizePrimeSource(
          "const tex = String.raw; return tex`f\\prime(x)`;",
          file,
        ).source,
      )(),
      String.raw`f^{\prime}(x)`,
    );
});

test("prime codemod recognizes direct String.raw and its immutable local aliases", () => {
  for (const input of [
    "return String.raw`f\\prime(x)`;",
    "return String.raw`${'f'}\\prime(x)`;",
    "const tex = String.raw; return tex`f\\prime(x)`;",
    "const tex = String.raw; function formula() { return tex`f\\prime(x)`; } return formula();",
  ]) {
    const result = normalizePrimeSource(input, "formula.ts");
    const tex = new Function(result.source)();
    assert.equal(tex, String.raw`f^{\prime}(x)`);
    assertRaisedPrimes(tex);
  }
});

test("prime codemod resolves the declared planar source's imported raw tag", () => {
  const file = "lib/curriculum/planar/functions.ts";
  const declaration = 'import { tex as rawTex } from "./drawing";';
  const result = normalizePrimeSource(
    `${declaration} return rawTex\`f\\prime(x)\`;`,
    file,
  );
  assert.equal(result.runs, 1);
  assert.equal(normalizePrimeSource(result.source, file).runs, 0);
  const tex = new Function("rawTex", result.source.slice(declaration.length))(
    String.raw,
  );
  assert.equal(tex, String.raw`f^{\prime}(x)`);
  assertRaisedPrimes(tex);
  assert.throws(
    () =>
      normalizePrimeSource(
        'import { createDrawing as rawTex } from "./drawing"; return rawTex`f\\prime(x)`;',
        file,
      ),
    /unknown template tag rawTex/,
  );
});

test("prime codemod rejects unknown, mutable and shadowed template tags", () => {
  for (const input of [
    "return custom`f\\prime(x)`;",
    "function tex([text]) { return text; } return tex`f\\\\prime(x)`;",
    "let tex = String.raw; return tex`f\\prime(x)`;",
    "const tex = String.raw; function formula(tex) { return tex`f\\prime(x)`; }",
    "function formula(String) { return String.raw`f\\prime(x)`; }",
  ])
    assert.throws(
      () => normalizePrimeSource(input, "formula.ts"),
      /formula\.ts: unknown template tag/,
    );
});

test("prime codemod refuses malformed source", () => {
  assert.throws(
    () => normalizePrimeSource('{ "formula": "f\\\\prime" '),
    /content\.json:/,
  );
});
