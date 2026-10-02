# Browser observations and rollback evidence

These are actual Codex in-app browser observations. They establish rendered behavior
in the inspected environment, not learner outcomes or universal accessibility.

## Before changes: original public deployment

All 125 lesson IDs were opened and captured. A repeat corrected stale mode snapshots:
`modes-confirmed.json` records 500 rendered states, each after the requested button's
`aria-pressed=true` state. All 100 scene models were opened, adjusted and reset.
The four custom graph modes acknowledged rendering; all six native presets and all
seven independent inline parameter controls were exercised. Sidebar/layout and
play/pause behavior were inspected. No production faults or draft edits were injected.

## After changes: local development and compiled build

All 125 lessons and four modes were rendered; all 100 scene models were exercised at
their supported range endpoints, midpoint and reset. Discrete models snap to their
steps. Captures contain zero KaTeX errors and no page overflow at the inspected width.
The reviewer inspected five contact sheets plus individual MH2100/priority-lab images.

The final compiled local build additionally exercised all seven comparison families:
keyboard range extremes, exact witnesses, both prediction choices, full reset and
Learn/Explore visibility. Six graph presets, four custom graph modes, seven independent
inline parameter controls, section focus, graph layouts, play/pause, draft reload and
hint/solution disclosures were observed. At 320 and 390 pixels the page width matched
the viewport; range controls had accessible labels. The original 3D renderer remains
a sampled illustration, accompanied by formulas and textual readouts.

Safe isolated failures: malformed shared state returned defaults with a notice;
an invalid expression showed an error and recovered after correction; denied local
storage retained an editable draft and explained its limitation; unavailable WebMCP
kept ordinary controls usable. Blocking only the local drawing chunk displayed a
contained retry alert while reasoning stayed present; unblocking and retrying restored
the drawing on the same lesson route. Injected errors are expected evidence, not hidden
successful checks. An earlier dev cache failure was fixed with isolated test caches;
the failure fixture was repeated against the compiled build to remove that confounder.

Raw observations and screenshots are retained in the ignored
`outputs/evidence/pre-release/{baseline,local}` folders. Development records do not
carry exact release identity; final CLI/browser reports record source revision and
fingerprint separately. The CLI browser validator checks shape and identity only.
Post-release verification must inspect the actual deployed version again.

## Tested rollback

Known-good native Site version 27 is the preferred operational rollback target:
`appgprj_6a9f4c7cb79c8191b6f1575d9ac01778~appgver_21a2df551bdc8191974fa1605b0699a6`.
Its source is `b340c9b0744ab987201583521164d1acf0ee094c`.

An isolated checkout rebuilt this exact source with all 693 installed package versions
matching its committed lock, including Next 16.3.4. The original production HTML test,
official Sites packaging, and separately unpacked worker test passed HTTP 200 with the
original identity. Its browser-served library was also inspected locally. No production
rollback was performed. The rebuild is not claimed to be byte-identical to the historical
deployment binary.

Retained package: `outputs/releases/rollback-b340c9b-exact.tar.gz`, 4,050,894 bytes;
SHA-256 `2e7cf2bf9b05d0238527f1cc037ecc38d7dafebc1bf9367b66e78e8b4a50490d`.
Detailed build/install/unpacked-worker evidence is in `outputs/releases/rollback-evidence.md`.
Follow `docs/release.md`; redeploy the native version through the existing Site and
verify the domain, audience and application afterwards. Do not force source history.

## Remaining limits

No learner participants, mastery measurement, live private-Drive permission validation,
screen-reader session, broad device/GPU sample or production fault injection. Preserved
historical curriculum/action ledgers remain uncertified where their own flags say so.
Compatibility mode, reset and camera keys were exercised before and after changes;
native fullscreen was attempted, but its transient state under IAB automation does not
certify persistent fullscreen on a user's device.
