# Dependency audit, 18 October 2026

The initial locked graph reported three underlying high advisories through 13 package paths.
The compatible patch updates remove two advisories.

| Package       | Locked patch | Reason                                                                                                       |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| sharp         | 0.35.5       | Patched librsvg dependency, [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).        |
| source-map-js | 1.2.2        | Validates indexed-section offsets, [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). |

Miniflare pins sharp 0.35.4 exactly. The root override selects its compatible patch until the
upstream pin moves. Remove the override when every retained caller permits a patched sharp.

`npm audit` still reports one underlying high advisory through eight development-tool paths.
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects every released
braces version through 3.0.3 and lists no patched version. ESLint and Vinext build tooling reach
it through micromatch. The application does not accept brace patterns from learners.
This limits the observed exposure; it does not resolve the advisory.

No audit suppression, forced framework downgrade, or substitute package hides that result.
Issue #199 retains the unresolved criteria. Re-run `npm audit --json` before closing them.
