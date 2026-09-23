import katex from "katex";

export const mathSpan = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
export const unmarkedNotation =
  /[=≠≤≥∈∉∪∩∘∞√∂∇∫∑ℝ^²³⁴₀-₉ₐ-ₓαβγδεθλμπρσφω±]|\b[A-Za-z]\([A-Za-z0-9, ]+\)|\b[A-Za-z]_[A-Za-z]|\[[−\-+A-Za-z0-9]+,[−\-+A-Za-z0-9∞]+[\])]|\([−\-+A-Za-z0-9]+,[−\-+A-Za-z0-9, ]+\)/u;

export function inspectNotation(value, locator, failures) {
  if (typeof value !== "string") return;
  for (const match of value.matchAll(mathSpan))
    katex.renderToString(match[1] ?? match[2], {
      throwOnError: true,
      strict: "error",
      trust: false,
      output: "htmlAndMathml",
    });
  const plain = value.replace(mathSpan, "");
  if (unmarkedNotation.test(plain))
    failures.push(`${locator}: ${plain.slice(0, 160)}`);
}
