---
name: study-save-safety
description: Check bounded study-save queue and account-read safety with TLA+/TLC, replay counterexamples against session.ts, and kill real-source mutations. Use after changes to pending edits, acknowledgements, overview installation, account epochs, or response-owner guards.
---

# Check study-save safety

Run from the repository root with Node.js 24+:

```sh
node .agents/skills/study-save-safety/scripts/run.mjs
```

The command installs the pinned portable JRE and TLC into ignored `outputs/formal-save-safety/cache/`. It runs `npm ci` if Vite is absent. It then checks both finite models, drives the real `createStudySession`, replays emitted queue counterexamples, and runs scratch-source mutations. No global Java installation or product edits are required. Initial bootstrap needs the network, `curl`, and `tar`. Cached reruns need no network. `npm run verify:study-safety` runs the same command. The existing protected CI `checks` job runs this command before its application checks. Any safety failure fails that required job.

Read `outputs/formal-save-safety/latest-run.txt` for the unique run directory. Keep its `summary.json`, TLC logs and JSON traces, real-code receipts, and mutant source files together. Exit codes are `0` for all properties passing, `1` for a reproduced product bug, and `2` for drift, a modeling error, a surviving mutation, or a tool failure. Expected mutant failures print `KILLED`.

Last reviewed source commit: `935db25f263c2195da917db9b48eb2aeed382823`. [source-lock.json](source-lock.json) records exact covered-file hashes and reviewed model behavior. A hash mismatch stops the run before it can report a stale model pass.

## Read the result

At that commit, the maintained outcome is **PASS** for all seven properties. The unchanged-revision branch of `install` preserves both `unsaved` and `conflict`. The full run kills seven model controls and seven real-source mutations, then confirms all seven properties still pass on the untouched source. This is the bounded claim below, subject to its assumptions.

The historical baseline at `23d625fbd85e5ceec8b5d17647bdf3133bc54183` is **BUG**, tracked in [issue #245](https://github.com/Jerome-Group/calculus/issues/245). Failed assessment work stays in memory, but an unchanged overview changes `unsaved` to `saving` without starting a request. Retry disappears because `StudySaveStatus` renders it only for `unsaved`. The same branch changes an existing `conflict` to `saving`, which hides comparison and resolution controls. [PR #249](https://github.com/Jerome-Group/calculus/pull/249), merged as `935db25`, fixes that branch without changing the promises.

The faulty unchanged-revision assignment originated in `b10389218fcee321d1e120efdd66f71b88315cd2`, "Persist personal study by ChatGPT account (#213)". `git blame` attributes the pending branch and its `else value.persistence = saving` to that commit.

[Baseline evidence](references/baseline.json) retains the source identity, counterexamples, real-code observations, mutation failures, and original-source rerun. Do not weaken either recovery property to accept `saving`.

| Property                  | Promise and harm prevented                                                                                                                               | Covered code                                                                                    | Current |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------- |
| `LatestEditRecoverable`   | The latest unacknowledged edit remains visible and queued or in flight. Dropping its queue entry strands it.                                             | `session.ts`: `save`, `queueCurrentEdit`, `pump`, `retry`, `install`                            | PASS    |
| `OnlyCurrentAcknowledged` | An older response cannot report a newer edit saved. A false acknowledgement can replace newer work.                                                      | `session.ts`: `pump` success branch and sequence comparison                                     | PASS    |
| `RecoveryActionable`      | A pending edit with no request or synchronous continuation retains an actionable recovery state. A perpetual saving label hides Retry.                   | `session.ts`: `install`, `loadOverview`, `pump` failure; `study-records.tsx`: `StudySaveStatus` | PASS    |
| `ConflictActionable`      | A recorded conflict stays a conflict until an acknowledgement or explicit resolution. Losing this state hides both versions and resolution controls.     | `session.ts`: `pump` 409 branch and `install`; `StudySaveStatus`                                | PASS    |
| `EpochIsolation`          | An obsolete lesson or overview response is rejected before installation or account invalidation. Otherwise a late A response can clear B's private view. | `session.ts`: `invalidate`, `responseOwner`, `loadLesson`, `loadOverview`                       | PASS    |
| `LatestOverviewWins`      | An older overview request cannot overwrite a later request's result. Otherwise the summary moves backwards.                                              | `session.ts`: `overviewRequest` guard in `loadOverview`                                         | PASS    |
| `ResponseOwnerIsolation`  | A response from another owner cannot populate the current owner's visible entries. Otherwise private data appears under the wrong account.               | `session.ts`: `responseOwner`, `loadLesson`, `loadOverview`                                     | PASS    |

## Check one recovery schedule

```sh
node .agents/skills/study-save-safety/scripts/bridge.mjs --case RecoveryActionable --out outputs/formal-save-safety/replay-recovery.json
node .agents/skills/study-save-safety/scripts/bridge.mjs --case ConflictActionable --out outputs/formal-save-safety/replay-conflict.json
```

Both commands pass on the maintained source. They load the current TypeScript implementation through Vite, with schema-valid controlled HTTP replies. They do not test a translated copy of `session.ts`. When a normal model check fails, `run.mjs` also consumes the actual TLC JSON counterexamples and compares each supported state against the real implementation's visible values, persistence states, and mock server records. It blocks on an unsupported transition or disagreement. No normal counterexample is emitted by a passing model. The historical baseline retains its exact failing traces and successful real-code replay evidence.

Run the complete command to repeat all mutation controls. It copies the current `session.ts` into each run's ignored `mutants/` directory, changes one behavior, and imports that copy through Vite. The original source never changes. Each of the seven properties must detect its model control and source mutation. The recovery controls restore the exact old same-revision assignment. The command then reruns the untouched source and checks that the current outcomes return. Mutation anchors must match once. An anchor failure requires a source review, not a regex that silently skips the mutation.

## Keep the model current

Before changing covered code, read [the correspondence and bounds](references/correspondence.md). After unrelated merges, use the installed [maintain-formal-verification-skill](/Users/jeromequeck/.codex/plugins/cache/pstack-claude/pstack/0.9.101/skills/maintain-formal-verification-skill/SKILL.md) workflow, or follow these local steps if that plugin path is unavailable:

1. Run the command as it stands. Retain drift and failure receipts.
2. Diff every covered file from the sync commit. Check moved code and every new writer of the same queue, epoch, or persistence fields.
3. Reconcile the model actions with the actual synchronous blocks, HTTP snapshots, await boundaries, and notification points. Update from the code before rerunning.
4. Classify a failure as a modeling error only if its steps cannot occur in the implementation. Replay a reachable trace against real code and report it as a bug.
5. Update the hashes and sync commit only after that review. Keep the bounds, or state why they changed. Change a property only when the intended promise changed, with evidence.
6. Run the full command, including mutations and the untouched-source rerun. Advance this skill's sync record only for a completed review.

The maintained source lock selects `PreserveRecovery = TRUE` in `InstallOverview`. `FALSE` now serves only as the historical baseline and recovery mutation control. Leave `references/baseline.json` unchanged. A different recovery implementation needs its own correspondence review. The maintenance report and full receipts live in ignored `outputs/formal-save-safety/maintenance/` and the unique run directories.

## Bound the claim

`SaveQueue` explores two loaded keys, two local edits per key, one competing assessment write, four overview requests, request failure before or after server acceptance, and arbitrary permitted response order. It starts after account hydration. `ReadGuards` explores two request slots, two account owners, one cookie change, one explicit identity revalidation, and the owner-mismatch revalidations those reads cause. [Exact assumptions and exclusions](references/correspondence.md) matter to every pass.

TLC exhausts those finite models. The real-code bridge checks selected schedules and replays these queue counterexamples. This is not a proof of the TypeScript, all browser schedules, SQL isolation, native sign-in, durable offline saving, learning outcomes, or the whole application. Run the project [browser verify skill](../verify/SKILL.md) for learner-interface changes. [Research and pinned tool sources](references/research.md) explain the tool choice and provenance.
