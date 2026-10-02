# Independent final evidence audit

Inspected `/private/tmp/calculus-browser-baseline` and `/private/tmp/calculus-browser-local` JSON, file counts, exact scene/lesson identifiers, requested-mode flags, and final CLI validation. No repository edits or browser mutations.

## Superseding correction — resolved

Earlier `baseline/modes.json` contained stale snapshots: 246 Practice/Revise labels still showed Explore. **Fresh `baseline/modes-confirmed.json` supersedes it:** 500 distinct pairs over all 125 curriculum lesson IDs, exactly 125 Learn/Explore/Practice/Revise each. Every requested mode matches its scoped pressed button, URL study.mode, and URL lesson fragment; zero mismatches. Baseline four-mode observation is now supported by these fresh records. Keep the earlier file labeled superseded, not an additional independent pass.

Fresh `baseline/presets-confirmed.json` has six matching preset names, graph routes, expressions, domains and render statuses, without visible alerts: Radial wave, Saddle, Path-dependent limit, Torus, Helix, Implicit sphere. The path-dependent graph correctly records one undefined origin, rather than implying complete finite sampling.

## Confirmed observed inventories

| Evidence                                            |                 Baseline |            Redesigned local |
| --------------------------------------------------- | -----------------------: | --------------------------: |
| Unique Learn lesson IDs matching current curriculum |                      125 |                         125 |
| Lesson-ID-matched JPG files                         |                      125 |                         125 |
| Course counts MH1100/MH1101/MH2100                  |                 24/30/71 |                    24/30/71 |
| Non-Learn confirmed rendered modes                  | 375 fresh matching modes | 375 matching rendered modes |
| Unique scene IDs matching current inventory         |                      100 |                         100 |

All baseline model end parameters equal declared maximum and resets stop animation. Local models each contain three requested parameter snapshots plus reset: 100 minima/maxima match; 96 midpoint values are exact, four discrete scenes snap to valid steps (Simpson, geometric series, cross sign, review critical points). Cross sign has only two distinct values, so do not imply three distinct cases there.

All 125 local Learn checks contain MathML, mathErrors=0, and scrollWidth<=width=1280. This supports that desktop viewport and captured content, not universal formula/viewport accessibility. Seven comparison-family records show incorrect/correct explanatory feedback, changed readouts and resetCleared/resetRestored=true. They are seven representative families, not exhaustive interactions for all 11 mapped lessons or every parameter value.

`remaining-features.json`: 12 local compiled-production-build records = six graph presets + four graph modes + invalid graph + recovery. Render status/state and visible error/recovery recorded; not all image hardware paths certified.

`fault-production-build.json`: isolated localStorage SecurityError plus unavailable-WebMCP fault proxy, editable reasoning value and storage-unavailable status; console=[] in that capture. Separate `missing-tools.json` explicitly exposes WebMCP-unavailable message. `missing-chunk.json` records blocked localhost viewport module, visible loading-error alert/retry, original lesson title/reasoning retained, then recovered=true with original route/parameter restored. Deliberate failures must remain labeled expected injections. `storage-production.jpg` is screenshot evidence, not an additional machine result.

## Fresh final local interaction captures

`final-labs.json`: seven distinct representative families. Twelve ranges each have Home/End/ArrowLeft observations (36 total); captured values reach endpoints then decrease one valid step, without changing the other range. Fourteen prediction captures show Reconsider for wrong answers and Correct for right answers; correct No feedback consistently says Correct rather than contradictory Yes. All seven resets clear feedback, with restored default readouts; all seven records also confirm Explore visibility. Exact buttons cover ray axes/diagonals, parabola coefficients −1/0/1, error axes/diagonal, saddle x/y sections and a=0, clock u=0, fibre order swap. Polar radius Home includes zero. These are selected controls and seven families, not exhaustive mapped lessons, arbitrary values, or SVG pixel proofs; fibre record captures one swap, not the plan’s twice-swap round trip.

`final-features.json` currently contains **23** records: seven inline parameters, three outline focus destinations, three layouts, animation play/pause, malformed-study fallback, draft/hint/solution plus reload, two responsive widths, two reduced-motion attempts, and skip focus. Inline state sequences preserve earlier independent controls as later ones change: polar domain/slice/transformed value=0.6; review differentiable/counterexample radius=0.3 and angle=1.2. Play exposes Pause animation; pause exposes Animate parameter. Wide/split snapshots expose the corresponding opposite-view control; minimised snapshot removes the expanded Minimise control. Layout geometry is not measured in those records. Three outline destinations focus their H2 headings; skip focuses MAIN#main-content with original lesson hash retained. Draft text is identical after reload. Width320 has scroll320, zero math errors and unlabelled ranges; width390 has scroll390 (no extra formula-error metric there).

The later `reduced-motion-confirmed` has enabled=false and disabled reduced-motion button, superseding the earlier enabled attempt. `malformed-study` records safe normalized URL/rendered content, but omits the original malformed input and warning; it supports recovery output, not a standalone reproducible negative-input fixture. Existing parser unit tests cover malformed input. These limitations do not demonstrate application defects.

## Provenance and validator limits

Raw browser records generally lack revision, source fingerprint, dirty flag, browser/viewport metadata, and per-run console/request collections. They are developmental observations collected over changing source, not strict-validated evidence tied to the final reviewed commit. The word “production” in these filenames means local compiled production build at localhost51281, **not the public deployed site**. No public post-release or rollback outcome follows.

Directly evaluated final validator: raw missing-chunk record correctly rejected (23 missing/type/provenance issues); valid structured shape accepted; malformed passed URL/viewport/failed assertion rejected. Validator enforces current revision+file fingerprint+dirty state and assertion/error consistency. It does not authenticate observations, check screenshot pixels/existence, or run journeys. Strict provenance should be captured at execution time; do not retrospectively assign current identity to older observations.

No mastery, learning gain, learner usability, live Drive freshness, or unobserved assistive-technology/GPU coverage is established.

## Repeatable production checklist

1. Record exact deployed release/build identity, source fingerprint, UTC timestamp, URL, browser, viewport, actions/assertions, unexpected console/request failures, screenshots. Keep baseline/local/deployed evidence separate.
2. Open 125 unique Learn routes (24/30/71); confirm matching title/MathML/no visible formula errors and save per-ID observations. Capture screenshots as appropriate.
3. Confirm 375 Explore/Practice/Revise states **after the requested mode is visibly pressed**, with correct content, not labels alone.
4. Exercise 100 scene models at minimum, nearest valid midpoint, maximum, reset; document discrete duplicates. Compare readouts with independent mathematical tests.
5. Repeat seven comparison journeys: wrong/correct predictions, meaningful changes, exact-zero/endpoint shortcuts, full reset and keyboard use. Verify all 11 mappings discoverable.
6. Four graph modes, six presets, invalid/recovery; existing inline controls; layout/sidebar, animation/reduced motion, compatibility, focus, draft/hint/solution/reload, source links and library/lesson/graph history.
7. Responsive1280/390/320, focus/skip/outline navigation, no overflow. Record actually inspected accessibility surfaces; do not claim full screen-reader certification.
8. Keep missing-storage/tools/chunk injections local. Public production: normal health/navigation/draft preservation only. Verify rollback on a safe separate local/preview release, then record deploy/restore identity and post-restore outcome; do not imply production rollback executed unless actually done.
