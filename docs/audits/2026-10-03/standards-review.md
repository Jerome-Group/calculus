# Independent Standards review

Baseline `origin/main` (`89cf443`); uncommitted branch `codex/learning-experience-redesign`. Shell/navigation/styles, comparison labs, deferred renderer, CLI/inventory, package/CI/docs inspected against issue #188 and repository rules. Own progress/search/library work excluded. No product edits or formatter/lint findings.

## Findings resolved

1. **[P1] Skip link changed route** — `components/atlas/atlas.tsx:16`: unknown `#main-content` triggered library restoration. Source now prevents default and focuses/scrolls main; parent observed keyboard focus. Rule: preserve useful routes and accessible navigation.
2. **[P2] Pilot fibre comparison unreachable** — `components/atlas/lesson-workspace.tsx:184`: pilot dispatch bypassed ComparisonLab. Learn/Explore now includes comparison before pilot content. Rule: interface contract, no dead weight; issue #188 fibre coverage.
3. **[P2] Deferred chunk rejection removed learning surface** — `components/atlas/deferred-viewport.tsx:11`: Suspense lacked rejection handling. DrawingBoundary now preserves readable notes with local error/reload UI. Rule: cohesive concerns and safe local failure. Rejected-load browser verification remains needed.
4. **[P2] Inventory library contract obsolete** — `scripts/verification/inventory.mjs:136`: in-memory declaration contradicted URL persistence. Query/version/bounds/fallback now described. Rule: source-backed inventory.
5. **[P2] Differentiability chart obstructed** — `components/atlas/comparison-error-lab.tsx:36`: L-shaped axis default-filled a grey triangle. Source sets `fill="none"`; refreshed browser capture independently confirms correction. Rule: correct visual representation.

## Integration

Shared CI profile retains format/lint/source/map/fresh build/all tests. Process-group timeouts and uploaded logs are bounded; artifact-action SHA independently matches GitHub v7.0.1. Package-lock root engine metadata remains `>=22.13.0` while package.json requires `>=24`; align before PR. No additional material source-review blocker.

Independent comparison tests: 8/8 pass. Ray captions correctly distinguish zero/rounded-zero agreement from diagonal disagreement; exact presets available. Baseline montages 3–5 and local montages 1–5 inspected; see `/private/tmp/calculus-visual-review.md` for precise visual coverage and limits. Parent reports correct keyboard skip/outline and no desktop overflow/KaTeX errors across 125 lessons plus 375 modes; these remain parent observations. No participant-dependent evidence claimed.

Confirmed follow-up: `source-references.tsx:90` keys errata by page; the differentiability supplement has two page-1 corrections, causing duplicate key `1` in three linked lessons. Use page plus printed text/index; preserve both corrections. Resolved: composite `${note.page}:${note.printed}` independently confirmed unique across all source errata; both notes retained.

Final verdict: all material review findings resolved in inspected source; no remaining Standards blocker. Full CI/browser reruns after final key change remain parent verification.
