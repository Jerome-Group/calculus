---
name: verify
description: Drive Calculus in a real Chromium browser against its built local Worker. Use after learner-interface changes, for regression reproduction, and for inspectable browser evidence.
---

# Verify Calculus

## Launch

From the repository root, install locked dependencies with `npm ci` and Chromium with `npx playwright install chromium`.
On Linux, use `npx playwright install --with-deps chromium` to install its system libraries too.

Run `npm run agent -- browser run --features library --output outputs/browser/library`.
The helper builds current source, starts Wrangler on a unique loopback port with fresh temporary state, and launches a fresh browser context.
Readiness requires its owned process, Wrangler's exact ready URL, and an HTTP 200 Calculus page containing Graph studio.
Every run cleans up its instance automatically.

Use `npm run agent -- browser run --features all --output outputs/browser/full` for the complete maintained map.
Select distinct IDs with `--features library,lessons`.
Runs default to 240 seconds. `--timeout-ms` accepts 1 through 540000 milliseconds.
The CI profile explicitly gives its complete seven-feature browser gate 360 seconds. The enclosing CI stage allows 390 seconds, the application profile retains its nine-minute overall limit, and the job retains its ten-minute limit for installation, formal checks and application verification. Individual action waits, assertions and cleanup remain unchanged. These are configured bounds, not a promise that future expanded coverage will fit.

## Doctor

Run `npm run agent -- browser doctor` before a new attempt when anything looks wrong.
This read-only command checks Node, installed tools, Chromium, the built Worker, assets, and output writability.
It installs nothing and starts no server. A missing build needs `npm run build`.

During a run, `report.json` records the owned PID, exact launch command, ready URL, and live HTTP doctor.
After failure, inspect `liveDoctor`, `cleanup`, build logs, and the failed feature's evidence before rerunning that feature.
The DB binding uses fresh temporary local D1 state. The helper applies every built Drizzle migration with Wrangler before starting the Worker and retains migration logs. Other bindings or a missing migration journal fail launch.

## Drive

Run `npm run agent -- browser list` to discover executable features.
[The feature index](features/README.md) lists the user entry points and proof obligations.
`features.mjs` owns selection, descriptions, and execution. Every mapped feature runs without adaptive skips.

The driver uses the Playwright library with real roles, labels, text, keyboard input, clicks, and navigation.
It never calls WebMCP actions, React setters, application writer modules, or test endpoints.
The legacy case supplies explicit preexisting storage through the browser context input and observes its bytes after visible import actions.
Read DOM state only to observe results. Reproduce a bug through the same user path before changing product code.

## Evidence

Each output directory retains `report.json`, build and Worker logs, and one directory per attempted feature.
Each feature retains `events.jsonl`, `result.json`, screenshots, complete DOM snapshots, and Playwright traces.
Journeys release completed auxiliary pages with `e.releasePage(page, label)`. It captures that page's final checkpoint, retains its context trace, and closes only that owned context. Later checkpoints capture active pages; `finish` retains and closes the remaining contexts.
Actions precede their results in the event log. Assertions record observed outcomes and failures.
Reports include URL, viewport, browser version, console messages, runtime errors, request failures, HTTP errors, Git revision, source fingerprint, and dirty state.

The source fingerprint covers all tracked and nonignored source without exclusions.
In-repository output paths must be ignored and cannot contain tracked source. Use `outputs/` or an external directory.
Changed source fails the run.
The browser run builds its own Worker, so its build log and source identity refer to the same attempt.

Storage denial, post-gateway identity headers on the owned loopback Worker, legacy-device context input, an offline network, a scoped study-service503 outage and a deferred-chunk request failure are explicit local fixtures.
Account conflicts use real concurrent D1 writes. Expected anonymous identity401, conflict409 and injected service503 responses remain recorded and scoped to their context or action.
Reports identify their expected errors separately. Other browser errors fail the feature.
Drawing failures require the declared page's owned context and exact chunk URL. Generic dynamic-import text alone is unexpected.
Source-link destinations are inspected without requesting private Drive files.
Local Chromium proof establishes neither hosted sign-in nor learner usability or mastery.
`browser-evidence --input` remains a shape-and-revision validator for supplied observations. It does not execute this driver.

## Cleanup

Success, assertion failure, timeout, SIGINT, and SIGTERM close owned browser contexts and the owned Worker process group.
The helper removes its temporary state. It never stops an existing server or kills by process name.
Evidence stays at `--output`; inspect `cleanup.processExited`, `cleanup.portClosed`, and `cleanup.scratchRemoved` in the report.
If a run fails, retain its directory and use a new output directory for the next attempt.

## Helpers

The executable entry point is `node .agents/skills/verify/cli.mjs list`, `doctor`, or `run`.
Run `node .agents/skills/verify/probe-interruption.mjs --output outputs/browser/interruption` to check real CLI SIGINT evidence and cleanup in a new directory.
Run `node .agents/skills/verify/probe-harness.mjs` for Node controls covering error ownership, page release, interruption, axes-only graph rejection, and exact prerequisite resume receipts. Extra mutations, unacknowledged saves and mismatched receipt records must fail. These controls use fixtures; live browser reproof is required for harness changes.
Run `node .agents/skills/verify/canonical-routes.mjs --output outputs/browser/canonical-routes` for all 125 actual Learn routes and both pilots' Practice, Explore, and Revise entry points. This optional sweep uses the same build, source identity, doctor, error checks, evidence, and cleanup as `browser run`. It defaults to 540 seconds and remains outside the maintained CI browser gate. Retain failures and use a new output directory for each attempt.
`npm run agent -- browser ...` delegates to that same implementation.
Open a retained trace with `npx playwright show-trace outputs/browser/full/library/trace-1.zip`.
Use the installed `maintain-verification-skill` workflow when app entry points change, then regenerate the compact map with `npm run agent -- map`.
