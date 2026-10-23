# Verification contracts

`node scripts/calculus.mjs help --json` lists commands, prerequisites, effects,
options, evidence and exit codes. Node.js 24+, Git and locked dependencies are required.
The same `verify --profile ci` command runs locally and in CI. Evidence includes stage
commands, duration, exit status, timeout state, logs, unexecuted stages, source identity
and known limitations. CI retains the report even on failure for 14 days.

`inventory --json` discovers every lesson, source, scene, route, browser tool, dependency
and test reference. Discovery is not behavioral coverage. `map --check` rejects drift;
`map` writes the deterministic map. Existing source/outcome ledgers remain intact.
Coverage status in a historical ledger is not silently promoted by a new visualization.

`verify --profile fast` runs source/map checks and a targeted subset; it is not the release
gate. `build` writes the production bundle and logs. `test` requires a production bundle.
`verify --profile ci` runs `format`, `lint`, `typecheck`, `source-freshness`, `experience-map`,
`browser`, `browser-interruption`, and `tests`, in that order. The two browser stages each create
a fresh `vinext` build and own the local Worker they start. Child processes are
bounded, terminated on timeout, and reported as failed. A source change during a run fails
provenance validation. No command deploys, modifies learner records or contacts production.

## Browser reports

Use [the local verify skill](../.agents/skills/verify/SKILL.md) for executable local checks.
`npm run agent -- browser list` lists the maintained features.
`browser doctor` checks installed prerequisites without starting or installing anything.
`browser run --features all --output outputs/browser/local` builds current source, owns a
local Wrangler Worker and fresh Chromium contexts, drives the actual controls, and cleans up.
For the DB binding, the helper applies built Drizzle migrations to temporary local D1.
Post-gateway header fixtures exercise distinct accounts locally; hosted sign-in remains a separate check.
Each attempted feature retains actions, assertions, screenshots, DOM, traces, browser errors,
and request results. The run retains build and Worker logs, source identity, live doctor, and
cleanup outcome. Evidence survives failed assertions and cleanup.
The committed `probe-interruption.mjs` drives an active lesson, sends SIGINT, and requires finalized evidence and absent owned processes.
In-repository output must be ignored and cannot contain tracked source. Use `outputs/` or
an external directory; unignored output is rejected before writing.

Run `browser-plan --json` for required positive, responsive, accessibility and isolated
negative journeys when recording additional manual observations. Identify whether the URL is live or local.
Reports include `schemaVersion: 1`, `revision`, `sourceFingerprint`, `sourceDirty`, `url`,
`browser`, integer `viewport: {width,height}`, `actions` strings, `assertions` with
`description` and `status`, `screenshots` paths, `consoleErrors` strings and `result`.
Use `inventory.source` for identity. A passed report cannot contain failed/blocked
assertions or console errors. A blocked report needs `blockReason`.

`browser-evidence --input <report> --json` checks structure and source identity only.
Retain DOM snapshots, screenshots and action records so observations can be inspected.
Production checks use safe positive interactions; malformed state, storage restrictions,
missing renderer chunks and timeout cases belong in isolated local environments.

## Limits

Strict KaTeX rendering checks every existing lesson's mathematical strings. Analytic tests
check path dependence, normalized differentiability error, saddle sections, parametrization
and integral/Jacobian identities. Renderer, curve parser, history and source tests exercise
existing edge cases. These checks cannot establish learning outcomes. Learner participants
are unavailable; no participant sessions, mastery or learning-gain claim is made.
External Drive access depends on the owner's permissions; reading a public citation does
not verify private-document access. GPU behavior and assistive-technology compatibility
must be reported for the actual inspected environment, never inferred from Node passes.
