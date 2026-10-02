# Experience audit and redesign — issue #188

## Scope inspected

All 125 existing lessons: MH1100 24, MH1101 30, MH2100 71; 31 course units,
47 source records, 100 scene models, 680 written exercises and 11 pilot choice tasks.
The complete map identifies routes, references, prerequisites, model variants, inline
experiments, browser tools, dependencies, tests and gaps. Course files remain outside Git.
Existing MH2100 source material was read locally without redistribution; public rationale
and primary sources are in `docs/research/mathematical-learning-design.md`.

## Findings and resulting behavior

The old split shell made mathematical reasoning narrow beside a large drawing. The new
page keeps definitions, assumptions, equations, reasoning and worked applications in the
normal reading flow. Course-wide search now includes explanations and supports shareable,
bounded URL state. Early mode controls, argument links and focus transfer make progression
recoverable. All existing lessons, graph modes, variants, drafts, references and notices remain.

Seven analytic lab families compare restrictions, absolute/normalized errors, saddle sections,
curve clocks, integration fibres and polar areas. Exact witness controls and explanatory
prediction feedback connect the diagrams to proofs within existing topics.

Independent reviews found and resolved route loss from the skip link, an unreachable pilot
comparison, unhandled lazy-renderer rejection, inaccurate map state, contradictory feedback,
distorted direction angles, and an unintended filled SVG axes triangle. Actual browser edge
inspection also corrected a false disagreement caption at a zero ray height. Vite test and
inventory caches are isolated after a real dev hydration failure exposed cache interference.

## Evidence and limits

The baseline and redesigned local application were opened in the user's in-app browser:
125 lessons and all four modes each. DOM records and 125 screenshots per surface are retained
locally, with independent montage/individual visual review. Browser evidence records actual
controls, responsive states and safe isolated failures separately from automated checks.
The CLI verifies mathematics, strict formula rendering, parsing, navigation, source/map
freshness and error contracts; CI retains per-stage evidence. Release checks must refer to
an exact source fingerprint and version. See review reports in this directory and the final
release record for executed results.

Learner participants are unavailable. Agent inspection and choice records cannot establish
mastery, learning gains or learner usability. Private Drive access and unobserved GPU or
assistive-technology environments remain explicit gaps. Historical concept/action and
outcome ledgers are preserved; their flags are not automatically certified by this redesign.
