import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import katex from "katex";
import { mathSpan, hasBaselinePrime } from "./helpers/math-notation.mjs";

const files = ["concepts", "learning-guides", "sources", "outcome-ledger"];
function* strings(value, locator) {
  if (typeof value === "string") yield [locator, value];
  else if (Array.isArray(value)) {
    for (const [index, item] of value.entries())
      yield* strings(item, `${locator}[${index}]`);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value))
      yield* strings(item, `${locator}.${key}`);
  }
}
const content = files.flatMap((file) => [
  ...strings(
    JSON.parse(
      readFileSync(
        new URL(`../lib/curriculum/${file}.json`, import.meta.url),
        "utf8",
      ),
    ),
    file,
  ),
]);
const rawTex = /\.(?:formula|tex|equation|solutionTex)$/;
function* mathematics() {
  for (const [locator, text] of content) {
    if (rawTex.test(locator)) yield [locator, text];
    else
      for (const match of text.matchAll(mathSpan))
        yield [locator, match[1] ?? match[2]];
  }
}

test("all canonical prose has balanced dollar math delimiters", () => {
  assert.deepEqual(
    content
      .filter(([, text]) => text.replace(mathSpan, "").includes("$"))
      .map(([locator]) => locator),
    [],
  );
});

test("every canonical math span parses strictly and renders prime notation in a superscript", (context) => {
  const failures = [];
  let spans = 0;
  for (const [locator, tex] of mathematics()) {
    const mathml = katex.renderToString(tex, {
      throwOnError: true,
      strict: "error",
      trust: false,
      output: "mathml",
    });
    spans++;
    if (hasBaselinePrime(mathml)) failures.push(`${locator}: ${tex}`);
  }
  context.diagnostic(`${spans} canonical math spans parsed`);
  assert.deepEqual(failures, []);
});

test("prime rendering check distinguishes baseline, first and repeated superscripts", () => {
  const render = (tex) => katex.renderToString(tex, { output: "mathml" });
  assert.equal(hasBaselinePrime(render(String.raw`f\prime(x)`)), true);
  assert.equal(hasBaselinePrime(render(String.raw`f^{\prime}(x)`)), false);
  assert.equal(
    hasBaselinePrime(render(String.raw`f^{\prime\prime}(x)`)),
    false,
  );
  assert.equal(hasBaselinePrime(render(String.raw`(f\prime)^2`)), true);
  assert.equal(hasBaselinePrime(render(String.raw`f'(x)`)), false);
});
