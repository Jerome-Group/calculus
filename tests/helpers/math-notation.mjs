import katex from "katex";

export const mathSpan = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
export const unmarkedNotation =
  /[=≠≤≥∈∉∪∩∘∞√∂∇∫∑ℝ^²³⁴₀-₉ₐ-ₓαβγδεθλμπρσφω±]|\b[A-Za-z]\([A-Za-z0-9, ]+\)|\b[A-Za-z]_[A-Za-z]|\b[A-Za-z]\s*[<>]\s*-?\d|\[[−\-+A-Za-z0-9]+,[−\-+A-Za-z0-9∞]+[\])]|\([−\-+A-Za-z0-9]+,[−\-+A-Za-z0-9, ]+\)/u;

const pseudoTex =
  /(?<!\\)\b(?:lim|sqrt|sum|int|binom|sin|cos|tan|sec|csc|cot|ln|log|exp)\b|[Σ∫√→≤≥≠∞πθΔε]|_\(|\bd\s*[\[(][^$]{0,120}\/\s*d[xyztuv]\b|\bd(?:\^(?:\{?[0-9n]+\}?))?[A-Za-z]+\/d[A-Za-z]+(?:\^(?:\{?[0-9n]+\}?))?/u;

export function inspectTexSemantics(tex, locator, failures) {
  if (typeof tex !== "string") return;
  if (/\p{Cc}/u.test(tex))
    failures.push(`${locator}: control character in TeX`);
  const math = katex.renderToString(tex, {
    throwOnError: true,
    strict: "error",
    trust: false,
    output: "htmlAndMathml",
  });
  if (hasBaselinePrime(math))
    failures.push(`${locator}: baseline prime in ${tex}`);
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

export function hasBaselinePrime(mathml) {
  const stack = [];
  for (const token of mathml.matchAll(/<\/?[\w:-]+\b[^>]*>|[^<]+/g)) {
    const text = token[0];
    if (text.startsWith("</")) stack.pop();
    else if (text.startsWith("<")) {
      const parent = stack.at(-1);
      const child = parent ? parent.children++ : 0;
      if (!text.endsWith("/>"))
        stack.push({ tag: text.match(/^<([\w:-]+)/)[1], child, children: 0 });
    } else if (/[′″‴⁗]/u.test(text) && stack.at(-1)?.tag === "mo") {
      const raised = stack.some(
        (frame, index) =>
          (frame.tag === "msup" && stack[index + 1]?.child === 1) ||
          (frame.tag === "msubsup" && stack[index + 1]?.child === 2),
      );
      if (!raised) return true;
    }
  }
  return false;
}
