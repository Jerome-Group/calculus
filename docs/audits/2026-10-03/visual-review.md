# Independent visual and learning review

Reviewed uncommitted `codex/learning-experience-redesign` against baseline `origin/main` `89cf443`; no product edits. Own progress/search/library implementation excluded from independence claim.

## Evidence inspected

All five local montages: 125 lesson viewport captures. Full-size representatives: 25 lessons, five per montage, including 15 MH2100 lessons from curves through course synthesis. Seven individual comparison-lab captures inspected. Earlier baseline montages 3–5 cover 75 lessons; parent inspected baseline 1–2. Evidence paths: `/private/tmp/calculus-browser-local/` and `/private/tmp/calculus-browser-baseline/`.

## Observations

- Cream/teal presentation, large lesson titles, serif reasoning, visible assumptions and ordered Learn/Explore/Practice/Revise controls remain readable. Long MH2100 titles wrap without visible clipping. No error overlay, illegible formula or misplaced comparison model observed in inspected frames.
- Compared with baseline, the single reading column gives definitions and argument more space; graph comparison follows its conceptual setup. Dense narrow prose beside the large blue graph is removed.
- **Corrected visual defect:** `components/atlas/comparison-error-lab.tsx:36` originally omitted `fill="none"` on an L-shaped axis. Both differentiability plots displayed an unintended grey triangle obscuring the chart. Source fixes the fill; refreshed `lab-total-differentiability-fixed.jpg` independently inspected and confirms clean unshaded axes, readable curves, radius and direction controls. Other open axis paths inspected are collinear or explicitly unfilled.
- Ray feedback now distinguishes axis agreement and rounded displayed zero from diagonal disagreement. Exact axis/positive-diagonal/negative-diagonal presets provide reproducible witnesses. Independent model inspection and comparison tests: **8/8 pass**. No additional material model defect found.

## Limits

Captures show desktop 1280×720 viewports. Montage review establishes broad visual presence, not full-page content correctness. Seven lab captures stop before some controls/readouts; request lower/full captures before claiming their complete visual verification. Mobile, rejected renderer recovery and lower-page formula layout are not independently certified here. Parent reports 125 lessons plus 375 modes with no KaTeX errors or desktop overflow, and observed correct keyboard skip/outline focus; those observations remain parent evidence. No learner-participant sessions or mastery inference.

## Final follow-up

Corrected differentiability chart verified in actual browser capture. Parent additionally reports mobile widths 390/320 with zero overflow, and deferred-renderer load rejection preserving notes followed by successful reload recovery; these remain attributed observations. Fault-injection tests involving dev CSS/ResizeObserver were confounded and are not counted as successful storage/WebMCP negative checks.

Confirmed duplicate-key defect: `components/atlas/source-references.tsx:90` uses `note.page`, but source `MH2100_Supplement_Partial_Derivatives_And_Total_Differentiability` contains two distinct errata on page 1. Both render when opening total-differentiability and related lessons, producing key `1`. Use page plus printed text or index. MathText's per-array index keys, model variant keys and deduplicated parameter presets show no corresponding static collision. No product edits made.

Final verdict: erratum composite key independently verified unique across all source records; both page-1 corrections preserved. All material independent source/visual findings resolved. Parent owns final fresh CI and production-browser verification.
