# Study on this device

## Sub-features

Practice drafts, hints and solutions, self-assessment, pilot choices and feedback, confidence, review history, resume, revisit, deletion, and unavailable-storage feedback.

## How to get to it (user POV)

Use Practice mode or the practice sections within Learn and Revise.
Standard practice has Your reasoning, First hint, Compare with a solution, Needs practice, and I can explain it independently.
Pilot practice has radio choices, reasoning for method tasks, Show hint, Check answer, and Delete this draft.
Pilot Revise shows error history, next review, and Confidence self-report.
The library's Study on this device section offers Resume and Revisit practice.

## Driving it with Playwright

Run `npm run agent -- browser run --features study --output outputs/browser/study`.
The driver writes a partial-fractions draft, opens hint and solution, records Needs practice, and reloads the draft and support state.
It opens Revisit and Resume, deletes that draft, and checks the self-assessment survives.
It records wrong and correct epsilon-delta choices with a hint, reloads visible correctness and support, records confidence separately, and checks the library attempt total.
A separate context makes browser storage throw. The draft must remain usable in that tab with an honest unavailable-storage message.
Another fresh context must show no records from the original context.
The revision error-history link must preserve the workspace and show the recorded error.

## Gotchas

These records live in browser storage. A different context is a different device-local store.
Storage-denial injection changes the environment only. The driver enters all drafts and choices through visible controls.
Choice correctness and confidence are separate records. Neither proves mastery; written reasoning is not graded.
The current error-history link changes the hash to an unknown route and opens the library. The final assertion retains that failure.
