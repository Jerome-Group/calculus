# Source review · 22 September 2026

Issue #25. Base source commit `d5977e8745563b8d36778bbf6860ff3c40b7a206`.

## Inventory and evidence

`lib/curriculum/source-manifest.json` classifies 97 source files observed in the three course source folders: 47 existing canonical references, 28 MH1100 personal-note PDF/TeX files, 12 MH1101 slide variants, four MH1101 revision files, and six MH2100 annotated lectures. `source-observation.json` records the Drive modification times seen on 22 September. The 47 canonical hashes came from the existing `sources.json` ledger; the Drive metadata response supplied no fresh hash. No PDF or extracted lecture text was added to the public repository.

The source-sync command compares a fresh Drive files export with the manifest: `node scripts/prepare-source-observation.mjs drive-files.json /tmp/drive-observation.json` then `node scripts/check-source-manifest.mjs /tmp/drive-observation.json`. A new ID fails. A changed instructional source fails unless a completed review outcome postdates the modification; `needs_review` keeps it blocked. A changed personal reference stays visible without blocking. CI checks the committed observation and refuses one older than 30 days; the authenticated Drive export must be refreshed before release. Sixteen older instructional variants remain `unreviewed` and are not described as synchronized.

## MH2100 annotated Lecture 5

Drive file `1kg31OPCTEkkKd0Mas86kSS511N-LmHhb`, modified `2026-09-18T22:06:58.536Z`, is recorded as an annotated variant of `MH2100_Lecture_05`. The supplied audit visually inspected all 61 annotated pages; a fresh Drive metadata read confirmed the file and timestamp. Its text extraction returned no readable content, so the decisions below use that render-based audit and the checked-in lesson/source-page references. They are content-scope decisions, not a claim that the annotation bytes were independently diffed in this session.

| Topic | Source pages in existing citations | Decision and site evidence |
| --- | --- | --- |
| Lagrange multipliers | 2–20 | **Already covered.** `lagrange-circle`, `lagrange-sphere`, and `lagrange-two-constraints` already distinguish regular constraint levels, candidate equations, compactness/existence and independent constraint normals. No formula or citation changed. |
| Rectangle double integrals | 24–30 | **Adopted.** The first framework card now names arbitrary tagged partitions and a common limit; continuity is a sufficient integrability condition. |
| General bounded regions | 31–40 | **Adopted.** Zero extension is explicitly conditional on Riemann integrability, and zero padding explains independence from the containing rectangle. |
| Fubini | 41–47 | **Adopted.** The continuity-on-a-closed-rectangle theorem is separated from region slicing; a boundary-jumping zero extension is outside that basic statement. |
| Type I/II | 49–60 | **Adopted.** Continuous ordered boundary functions, connected sections, the region-specific slicing theorem, splitting and reconstructed reversal are stated. The pilot exposes exact section inequalities and values. |

## MH2100 annotated Lecture 6

Drive file `1HvfWCfiAaYfa0rr_jGelMQVpPhO1mKzo`, modified `2026-09-18T22:06:58.582Z`, is recorded as an annotated variant of `MH2100_Lecture_06`. Its extracted text was read and compared with the site concepts; the checked-in base lecture citations were retained. The audit did not identify a contradictory theorem statement.

| Topic | Source pages in existing citations | Decision and site evidence |
| --- | --- | --- |
| Linearity and restricted domains | 3–4 | **Already covered, wording tightened.** Existence of the original integrals and use of the restriction are explicit in `linearity-additivity`. |
| Region additivity and splitting | 5–12 | **Adopted.** Pairwise overlaps need zero Jordan area; the square-frame near miss and four-piece split now show why a non-simple region needs decomposition. |
| Polar rectangles and area factor | 13–17 | **Already covered.** `polar-rectangles` derives the factor $r$ from annular-cell area and restricts the angular span. No formula changed. |
| Variable radial bounds | 18–23 | **Already covered.** `polar-regions` already uses the shifted disk with $0\le r\le2\cos\theta$, handles the origin separately, and records the angular interval. No scene changed. |

The overall manifest outcome for each Week 5/6 annotated file is `adopted` because at least one identified difference caused a site change. The rows above preserve the explicit no-change decisions. Other annotated lectures and slides remain queued; no generic lesson shell has closed them.
