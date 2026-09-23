import katex from "katex";

export const mathSpan = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
export const unmarkedNotation =
  /[=≠≤≥∈∉∪∩∘∞√∂∇∫∑ℝ^²³⁴₀-₉ₐ-ₓαβγδεθλμπρσφω±]|\b[A-Za-z]\([A-Za-z0-9, ]+\)|\b[A-Za-z]_[A-Za-z]|\b[A-Za-z]\s*[<>]\s*-?\d|\[[−\-+A-Za-z0-9]+,[−\-+A-Za-z0-9∞]+[\])]|\([−\-+A-Za-z0-9]+,[−\-+A-Za-z0-9, ]+\)/u;

const pseudoTex =
  /(?<!\\)\b(?:lim|sqrt|sum|int|binom|sin|cos|tan|sec|csc|cot|ln|log|exp)\b|[Σ∫√→≤≥≠∞πθΔε]|_\(|\bd\s*[\[(][^$]{0,120}\/\s*d[xyztuv]\b/u;

export function inspectTexSemantics(tex, locator, failures) {
  if (typeof tex !== "string") return;
  katex.renderToString(tex, {
    throwOnError: true,
    strict: "error",
    trust: false,
    output: "htmlAndMathml",
  });
  const mathOnly = tex.replace(
    /\\(?:text|mathrm|operatorname|mathsf|mathbf|mathit)\s*\{[^{}]*\}/g,
    "",
  );
  if (pseudoTex.test(mathOnly))
    failures.push(`${locator}: ${tex.slice(0, 160)}`);
}

export function inspectNotation(value, locator, failures) {
  if (typeof value !== "string") return;
  for (const match of value.matchAll(mathSpan))
    inspectTexSemantics(match[1] ?? match[2], locator, failures);
  const plain = value.replace(mathSpan, "");
  if (unmarkedNotation.test(plain))
    failures.push(`${locator}: ${plain.slice(0, 160)}`);
}
