export function checkLinearDelta(epsilon: number, input: string) {
  const delta = Number(input);
  if (!input || !Number.isFinite(delta) || delta <= 0)
    return "Choose a positive finite $\\delta$.";
  if (delta <= epsilon / 2)
    return `Certified for every input: $|2x-2|=2|x-1|<2\\delta\\le\\varepsilon$, with $\\delta=${delta}$.`;
  return "Too large. Let $x=1+(\\delta+\\varepsilon/2)/2$. This input lies within your $\\delta$ interval but has $|2x-2|>\\varepsilon$. A finite plot alone would not certify a valid $\\delta$.";
}
