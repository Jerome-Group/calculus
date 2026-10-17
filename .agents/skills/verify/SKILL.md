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
The existing CI command runs this browser gate and the mathematical checks within its nine-minute runner budget and ten-minute job limit.

## Doctor

Run `npm run agent -- browser doctor` before a new attempt when anything looks wrong.
This read-only command checks Node, installed tools, Chromium, the built Worker, assets, and output writability.
It installs nothing and starts no server. A missing build needs `npm run build`.

During a run, `report.json` records the owned PID, exact launch command, ready URL, and live HTTP doctor.
After failure, inspect `liveDoctor`, `cleanup`, build logs, and the failed feature's evidence before rerunning that feature.
A local D1 binding without a migration contract fails launch. This app's study records currently use browser storage.

## Drive

Run `npm run agent -- browser list` to discover executable features.
[The feature index](features/README.md) lists the user entry points and proof obligations.
`features.mjs` owns selection, descriptions, and execution. Every mapped feature runs without adaptive skips.

The driver uses the Playwright library with real roles, labels, text, keyboard input, clicks, and navigation.
It never calls WebMCP actions, React setters, application stores, or test endpoints.
Read DOM state only to observe results. Reproduce a bug through the same user path before changing product code.

## Evidence

Each output directory retains `report.json`, build and Worker logs, and one directory per attempted feature.
Each feature retains `events.jsonl`, `result.json`, screenshots, complete DOM snapshots, and Playwright traces.
Actions precede their results in the event log. Assertions record observed outcomes and failures.
Reports include URL, viewport, browser version, console messages, runtime errors, request failures, HTTP errors, Git revision, source fingerprint, and dirty state.

The source fingerprint covers all tracked and nonignored source without exclusions.
In-repository output paths must be ignored and cannot contain tracked source. Use `outputs/` or an external directory.
Changed source fails the run.
The browser run builds its own Worker, so its build log and source identity refer to the same attempt.

Storage denial and a deferred-chunk request failure are explicit local environment injections.
Reports identify their expected errors separately. Other browser errors fail the feature.
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
`npm run agent -- browser ...` delegates to that same implementation.
Open a retained trace with `npx playwright show-trace outputs/browser/full/library/trace-1.zip`.
Use the installed `maintain-verification-skill` workflow when app entry points change, then regenerate the compact map with `npm run agent -- map`.
