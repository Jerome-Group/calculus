import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePrimes,
  normalizePrimeSource,
} from "../scripts/normalize-curriculum-primes.mjs";

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
    "const formula = tex`f\\prime(x)=${measure({ value: 'x' })}, g\\prime\\prime(x)=${other ? `${nested}` : 'unchanged'}`;";
  const expected = input
    .replace("f\\prime(x)", "f^{\\prime}(x)")
    .replace("g\\prime\\prime(x)", "g^{\\prime\\prime}(x)");
  const result = normalizePrimeSource(input, "readouts.ts");
  assert.deepEqual(result, { source: expected, runs: 2 });
  assert.deepEqual(normalizePrimeSource(result.source, "readouts.ts"), {
    source: expected,
    runs: 0,
  });
});

test("prime codemod refuses malformed source", () => {
  assert.throws(
    () => normalizePrimeSource('{ "formula": "f\\\\prime" '),
    /content\.json:/,
  );
});
