# Account study

## Sub-features

Drafts, hints and solutions, self-assessment, immutable choice attempts, confidence, review history, resume, revisit, deletion, conflict choices, failed-save retry, bounded service failure and recovery, guest limits and explicit legacy import.

## How to get to it (user POV)

The account banner offers native Sign in with ChatGPT and Sign out. Public reading stays available.
Practice mode has reasoning, hints, solutions, self-assessment, pilot choices and Delete this draft.
Pilot Revise shows error history, next review and confidence. Library's Your study section offers Resume and Revisit practice.
Signed-in accounts can open Import old study from this device, preview validated records and confirm the destination.

## Driving it with Playwright

Run `npm run agent -- browser run --features study --output outputs/browser/study`.
The owned Worker starts with a migrated temporary D1 database. Explicit local gateway-header fixtures supply distinct stable account IDs. They do not exercise hosted sign-in.
The driver saves reasoning and support state, waits for acknowledgement and reloads. Each wrong or correct pilot choice must receive its own successful POST response with a matching immutable attempt receipt before the next choice or reload. Mutable draft status alone cannot prove a choice was saved.
It records self-assessment and confidence separately, and drives resume, revisit, draft deletion and focused error-history navigation.
A new browser context restores the same account without localStorage. Another account starts empty. Concurrent edits produce a real409; the UI preserves local reasoning and explicitly restores the chosen account version.
Offline save failure must retain input and report unsaved; Retry save must acknowledge before reload. A scoped service503 fixture must stop retrying automatically, preserve reasoning and recover through the visible Retry summary control. Guest reasoning remains usable with storage denied and disappears after reload.
A separate scoped503 fails an assessment save while allowing a draft acknowledgement to refresh the account summary. The intended assessment and Retry save must remain actionable; explicit retry must acknowledge and restore that assessment after reload.
Native auth paths and top-level targets are inspected. Actual provider navigation needs hosted verification.
An explicit legacy-device context input supplies historical records. Preview must not write. Confirmation preserves source bytes and identical-event multiplicity. Repeating retains existing records; an appended event adds only that event.
Two failed choice saves expose separate retry controls. Each retry must acknowledge a distinct attempt ID; both events survive reload exactly once, with no unsaved warning.
A denied localStorage getter must explain the failed device preview, preserve source data and disable import confirmation.

## Gotchas

Wait for visible account hydration and save acknowledgements before asserting reload values.
Arm response observation before clicking. Correlate choice acknowledgements with the submitted lesson, task, choice and immutable ID.
Guest identity401 and intentional conflict409 and injected service503 responses are expected only in their declared context/action. Other runtime/request failures fail the run.
The local identity fixture proves the application after the gateway, not provider authentication or gateway-header stripping.
Choice correctness and confidence are separate records. Neither proves mastery; written reasoning is not graded.
