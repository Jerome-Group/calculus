export type PrerequisiteGuide = { prerequisites: string[] };

export const forwardBridges: Record<
  string,
  { prerequisite: string; explanation: string }
> = {
  "chain-rule-single": {
    prerequisite: "linearization-differentials",
    explanation:
      "The chain-rule remainder uses the idea that a differentiable function is locally linear: $f(a+h)=f(a)+f'(a)h+o(h)$, where $o(h)$ is an error small relative to $h$. Use this approximation here; the later linearization lesson develops it in detail.",
  },
  "riemann-integral": {
    prerequisite: "sequence-limits",
    explanation:
      "As partitions get finer, the Riemann sums form a sequence. Convergence means all sufficiently fine sums approach one value. This is the needed bridge; the later sequence lesson gives the formal $\\varepsilon$–$N$ language.",
  },
};

export function prerequisiteIssues(
  orderedIds: string[],
  guides: Record<string, PrerequisiteGuide>,
) {
  const positions = new Map(orderedIds.map((id, index) => [id, index]));
  const issues: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) {
      issues.push(`Cycle at ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of guides[id]?.prerequisites ?? []) {
      if (!positions.has(prerequisite) || !guides[prerequisite]) {
        issues.push(`Missing prerequisite ${id} → ${prerequisite}`);
        continue;
      }
      if (positions.get(prerequisite)! > positions.get(id)!) {
        const bridge = forwardBridges[id];
        if (bridge?.prerequisite !== prerequisite || !bridge.explanation)
          issues.push(
            `Unexplained forward prerequisite ${id} → ${prerequisite}`,
          );
      }
      visit(prerequisite);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of orderedIds) {
    if (!guides[id]) issues.push(`Missing guide ${id}`);
    visit(id);
  }
  return issues;
}
