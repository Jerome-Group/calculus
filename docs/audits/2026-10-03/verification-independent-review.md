# Independent verification-tool review

Reviewed current working-tree files for issue #188, 2026-10-03: scripts/calculus.mjs, scripts/verification/{inventory,runner,browser-plan}.mjs, tests/verification-cli.test.mjs, data/experience-map.json. Requested `git diff origin/main -- scripts tests/verification-cli.test.mjs data/experience-map.json` returned no patch because these files are still untracked; reviewed their actual contents. No edits made. Own comparison labs excluded from code review.

## Material findings

### P2: browser report validator accepts malformed field shapes as passing evidence

Location: scripts/verification/browser-plan.mjs:141–154 and scripts/calculus.mjs:142–150.

The CLI advertises shape-and-revision validation, but only verifies required property presence, result enum, revision equality, and two nonempty arrays. It accepts invalid types for URL, browser, viewport, errors, request failures and screenshots; array members of actions/assertions can be null/false rather than observations.

Reproduced directly:

```js
validateBrowserEvidence(
  {
    revision: "r",
    url: null,
    viewport: false,
    browser: [],
    actions: [null],
    assertions: [false],
    consoleErrors: "not an array",
    requestFailures: 7,
    screenshots: {},
    result: "passed",
  },
  "r",
); // []
```

Through the CLI, no issues means status follows supplied `passed` and exits zero. This makes even the promised schema gate unreliable. Define and validate actual types: nonempty URL/browser/revision strings, positive finite viewport dimensions, nonempty performed-action/assertion strings or documented observation objects, and arrays for error/failure/screenshot fields. Guard null/non-object input. Keep the explicit observation-only limitation; validating schema cannot independently prove a screenshot or human observation is true. Add negative tests for all malformed cases. Do not require all browser journeys to pass from one partial report unless the contract explicitly introduces a complete-suite report.

### P2: revision-only provenance cannot identify the implementation actually checked

Location: scripts/calculus.mjs:114–123, browser validation at 146, final report revision field.

All reports identify state only by `git rev-parse HEAD`. The current review tree has extensive modified and untracked implementation files, while generated check evidence identifies only the unchanged base HEAD. Editing an app file after browser observation leaves that revision string unchanged, so an earlier observation report still validates against a different implementation. If source changes during a verification run, the report records no before/after distinction either.

Issue #188 explicitly requires checks on the reviewed commit and recorded observations from that revision. Either enforce a clean tree for reviewed/release evidence, or include a deterministic working-tree input fingerprint plus dirty state and validate the fingerprint for browser evidence. A practical development report can remain usable by honestly recording dirty state; commit-bound acceptance evidence should require a clean stable snapshot and be regenerated after committing. Include a test proving a changed source invalidates older implementation evidence. Do not infer a fresh build or checked patch from HEAD alone.

## Scope gap in browser plan

The generic experiment-controls journey covers parameter/variant/play/reset and independent inline controls but omits the redesign's new complementary comparison workflows: prediction choice and feedback, normalized-vs-absolute error, pinning/path disagreements, curve clocks, order switching and full reset. Add a dedicated comparison-labs journey naming representative existing concepts and observable invariants: both panels/readouts update, prediction feedback addresses the actual claim, zero/endpoint presets work, selected order changes bounds, reset clears prediction and restores controls. This is planned coverage, not proof it happened. Record genuine observations separately. No learner participants are requested and no learning claims follow.

## Confirmed strengths and checks run

- `node --test tests/verification-cli.test.mjs`: all 6 tests passed, including 125 lesson SSR content and strict guide notation checks.
- `node scripts/calculus.mjs map --check --json`: passed, 125 lessons and 100 scene models; 11 comparison mappings, 13 feature entries. All feature entry files exist.
- `verify --profile fast --timeout-ms 1 --output /private/tmp/calculus-review-timeout --json`: exits 1; first stage timedOut=true, SIGTERM; later stages listed as unexecuted; JSON report and stdout/stderr logs written. No false pass or silent continuation.
- The runner uses process-group termination then SIGKILL escalation on macOS/Linux. Failure exit codes, termination signals, timeout state, durations and evidence paths are retained. Current tests check real failing process, timeout and success, rather than matching implementation source.
- JSON help describes commands, side effects, defaults and exits; options reject misspellings and unsupported combinations. Doctor reads prerequisites without installation.
- Inventory loads live curriculum/model modules; exposes source references, dependencies/import discovery, tools, outcome gaps and inferred test references. It explicitly labels static discovery as not behavioral coverage. These labels are correct and must remain.
- Generated map drift compares regenerated content against committed artifact, not source string matches. It currently passes; it will need regeneration after any map-affecting edits.
- CI/package invocation still use older entrypoints at review time; lead explicitly said integration follows. This is pending work, not a reported implementation defect.

## Limits

No browser operated and no production mutation performed. This review does not certify hydrated controls, visual layout, hardware rendering, deployed release or rollback. Global code review and own-lab review belong to independent reviewers. Report validation cannot authenticate human observations; its accurate claim remains a schema/provenance gate. Learner outcomes remain unverified.

## Follow-up review: fixes verified

Rereviewed current scripts against base origin/main `89cf4431a4ec222793a7667a665dcb551b1d3f32`. Implementation remains uncommitted at review time. No source edits made; own labs not independently reviewed here.

- **Malformed-shape P2 resolved.** Validator now guards non-object input, enforces HTTP(S) URL and nonempty browser/action/screenshot strings, viewport integer bounds, array error/failure collections, structured assertion outcomes, result consistency, and blocked reason. Previously accepted malformed payload now returns eight issues. Passed reports cannot contain failed/blocked assertions or reported errors. Its claim remains observations-only, not authentication of human findings.
- **Dirty-source provenance P2 resolved.** New revision.mjs snapshots SHA-256 over sorted tracked/nonignored file paths, contents, executable mode, symlink targets and deletion markers. Browser reports must match fingerprint and dirty state as well as HEAD. Verification reports retain starting/completed snapshots and fail when input contents change during stages. Dirty development evidence is clearly identified; clean reviewed-commit evidence still needs a fresh run after committing.
- **Comparison browser-plan gap resolved.** Seven dedicated journeys name existing lesson IDs, controls/edge cases, exact expected invariants, incorrect/correct feedback, full reset, keyboard changes, and chart descriptions. These are required observation targets, not claims that browser execution occurred.
- All six verification-cli tests passed on follow-up, including strict malformed-evidence and stale-fingerprint regression tests.
- Forced 1ms fast verification correctly exited 1, recorded timeout/SIGTERM/log paths and unexecuted later stages. Starting/completed source fingerprints matched; no false success.
- **Pending artifact refresh:** current map --check fails with explicit Experience map drift. Updated tests/catalog require regenerating data/experience-map.json before final required checks. This is an accurately detected integration task, not a silent correctness defect.
- Public mathematical-learning-design.md remains within existing course examples. Mathematical claims preserve excluded origins, candidate-vs-certified plane, normalized errors, saddle degeneracy, clock geometry and finite-vs-differential area. Primary OpenStax, author-maintained Math Insight, primary learning papers, and CalcPlot3D manual links are reliable for the limited claims made. Learning-effect transfer is explicitly unverified; no learner/mastery claims or private extracts added.

No remaining material CLI code findings identified in this follow-up. This conclusion does not certify browser observations, production deployment, own labs, or an as-yet-uncommitted final revision.
