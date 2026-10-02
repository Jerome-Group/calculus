# Progress, discovery and dependency review — 2026-10-03

Baseline inspected: `ebb820dee159b218ebc7706ea0929a11c3ebb691`. Implementation belongs to issue #188. Repository inspection counted 125 lessons, 125 core exercises and 555 supplemental exercises. Counts describe available material, not certified learner outcomes.

## Progress and discovery

The overview previously counted only self-assessments keyed by a core lesson ID; supplemental exercise records and pilot attempts were omitted. It now counts core and supplemental self-assessments independently, counts pilot choice attempts separately, and opens lessons with recorded practice needs. Latest pilot-task evidence determines wrong/hinted practice needs; a stored review date also offers a revisit when due. Existing saved records and storage namespaces are preserved. An explainable exercise does not mark its entire lesson mastered.

The pilot function and visible wording now describe delayed correct-choice evidence, not mastery. Written reasoning remains ungraded; repeated choices, even on separate days, do not establish transfer or learner mastery. No learner participants were requested or simulated.

Search now indexes structured guide blocks, supplemental exercises and source titles, retaining accent normalization and all-word matching. The exercise kind union covers all existing source-data values, including 42 exercises previously outside its declared union.

Versioned library links retain the selected known course and exact search of at most 100 characters. They preserve unrelated URL parameters, clear incompatible lesson/graph state, and leave the original URL object untouched. Legacy links retain their existing interpretation. Invalid, obsolete, oversized and unknown state produces an explained Calculus I/empty-search fallback for the controller. The library parser itself does not mutate application state.

Checks: targeted progress/search/schema and pilot tests passed (10); library URL tests passed (3); edited files passed formatting and ESLint. Browser integration and a fresh full production build remain the lead's verification obligations. Pure library tests prove URL serialization/validation, not rendered history behavior.

## Independent dependency review

Read-only inspection of [Dependabot PR #187](https://github.com/Jerome-Group/calculus/pull/187), head `281558da97ca775d5b9273bdd21231f0115931cc`. Diff is limited to `package.json` and lockfile: Next 16.3.4 → 16.3.8, matching Next environment and optional platform SWC packages; no application source change. At inspection, CI `checks`, `conformance / check`, and `auto-merge-conformance-pin` completed successfully; GitHub reported mergeable and CLEAN. No merge was performed by this reviewer.

Authoritative release notes:

- [16.3.5](https://github.com/vercel/next.js/releases/tag/v16.3.5): image-cache handling, standalone adapter output, CSP nonce and cache signal fixes.
- [16.3.6](https://github.com/vercel/next.js/releases/tag/v16.3.6): next/og ImageResponse remote-code-execution security fix.
- [16.3.7](https://github.com/vercel/next.js/releases/tag/v16.3.7): cancellation-related backend read hang fix.
- [16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8): security fixes affecting image optimization, metadata routes, caches and the development MCP endpoint.

Assessment: small dependency-only patch; no documented application API migration and green repository checks. Low apparent application regression risk. This application uses Vinext on Cloudflare, so upstream Next server fixes do not by themselves certify the separate Vinext request handler. Runtime compatibility still needs the merged application's production build and hydration checks. The review makes no claim that every upstream advisory was exploitable in this site or that all dependency security issues are resolved. The lead decides whether to merge under user authorization.
