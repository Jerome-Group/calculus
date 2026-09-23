# CA-018 annotated-source archive review · 24 September 2026

## Scope and method

Reviewed the six Drive identities listed in the audit queue against their canonical MH2100 lecture entries. This resolves the L01–04 visual-review follow-up left in `annotation-review-2026-09-23.json`. L01–04 were fetched as private PDFs to `/tmp`, rendered, and swept page-by-page in contact sheets, with selected pages checked at higher resolution; L02–04 returned no readable text from Drive, so OCR served only as a locator aid. L01 handwriting is partly drawn as image paths. OCR was not treated as authoritative. No PDF, page image, OCR transcript, or course exercise text is stored here.

The printed slide sequence in each annotated file matches its canonical lecture. Classification: **duplicate** for the slide content; **elaboration** for explanatory marks on the cited pages; no visible **erratum** and no distinct **new outcome** found. The cited page numbers are PDF page numbers. These are representative page-specific anchors, not a transcription of every mark. Other pages were also inspected; faint or ambiguous image-only handwriting is not certified as legible or error-free.

| Source / Drive ID | Pages and classification | Outcome / existing mapping |
| --- | --- | --- |
| `MH2100_Lecture_01_Annotated_PDF` · `1XmY_hoDlUt7VvPdi9bzRwbxp63Abfpmy` · 41 pp. | pp. 8–15: **elaboration** on vector definitions and operations; p. 12 labels the additive identity and inverse. pp. 18–33: **elaboration** on curve parametrizations, tangent vectors, and singularities. p. 37: **elaboration**, a later-use Lagrange-multiplier reminder beside level curves. | Already represented by `vectors-and-coordinates`, `curves-and-parametrizations`, `constructing-curves`, `tangents-velocity-and-singularities`, and `surfaces-and-level-sets`. The p. 37 reminder points to existing Lagrange coverage in L05. |
| `MH2100_Lecture_02_Annotated_PDF` · `1RsFB5jv-t4Z0Ja7m895oIArz3zxK_asa` · 49 pp. | p. 3: **elaboration** of limit-point language with distance/density examples. p. 10: **elaboration** of the non-existence theorem and a caution about using it to prove existence. p. 15: **elaboration** of the different-path test with a curved path. | Already represented by `distance-and-neighborhoods`, `epsilon-delta-limits`, `different-paths-different-limits`, `curved-paths-hide-obstructions`, and the other L02 concepts in the manifest. |
| `MH2100_Lecture_03_Annotated_PDF` · `1hWI46iZE42nw3mLh2JiB_C3uhShUcTpO` · 54 pp. | p. 3: **elaboration** of tangent-line parametrization and linear approximation. p. 13: **elaboration** of equivalent tangent-plane descriptions. p. 19: **elaboration** of the error-function characterization, with a study reminder. p. 45: **elaboration** clarifying unit directions for directional derivatives. | Already represented by `cross-products-and-planes`, `total-differentiability`, `partials-do-not-make-a-plane`, `certifying-differentiability-and-errors`, `multivariable-chain-rule`, `implicit-functions-and-tangents`, and `directional-derivatives-and-gradient`. |
| `MH2100_Lecture_04_Annotated_PDF` · `1KO44VEnB6_MsZOyQ4Bp8Bn6MNl7tv7_I` · 40 pp. | p. 1: **elaboration** defining critical candidates and saddle points. p. 15: duplicate extrema visualization; no correction. p. 29: **elaboration** of Hessian-test hypotheses and the inconclusive zero-determinant case. p. 34: **elaboration** with the rational-subset example for closedness. | Already represented by `gradient-normals-and-steepest-ascent`, `local-extrema-and-saddles`, `mixed-and-higher-partials`, `hessian-classification`, and `global-extrema-and-boundaries`. |
| `MH2100_Lecture_05_Annotated_PDF` · `1kg31OPCTEkkKd0Mas86kSS511N-LmHhb` · 61 pp. | Prior rendered audit in [`2026-09-22/source-review.md`](2026-09-22/source-review.md): pp. 2–20 Lagrange already covered; pp. 24–30 rectangle integrals adopted; pp. 31–40 bounded regions adopted; pp. 41–47 Fubini adopted; pp. 49–60 Type I/II adopted. | Reused prior record; not re-fetched or re-audited here. Manifest remains `adopted`. |
| `MH2100_Lecture_06_Annotated_PDF` · `1HvfWCfiAaYfa0rr_jGelMQVpPhO1mKzo` · 23 pp. | Prior text comparison in [`2026-09-22/source-review.md`](2026-09-22/source-review.md): pp. 3–4 linearity; 5–12 additivity/splitting; 13–17 polar rectangles; 18–23 variable radial bounds. No contradictory theorem statement recorded. | Reused prior record; not re-fetched or re-audited here. Manifest remains `adopted`. |

L01–04 are now recorded in `source-manifest.json` as `annotated_variant` with `coverageDiff: already_covered` and the canonical parent’s mapped concepts. No source-mapping issue was opened: this pass found no distinct outcome to map. These findings describe comparison with the checked-in site map; they do not establish permission to reproduce course material.

## Broader archive inventory and limits

Drive metadata searches used PDF MIME type plus the following title filters; each returned no next-page token. Counts are exact for those filters, not a census of every related Drive file.

| Search scope | MH1100 | MH1101 | MH2100 | Evidence |
| --- | ---: | ---: | ---: | --- |
| `name contains '<course>_Tutorial'` | 36 | 36 | 53 | MH1100/1101 each include 12 question PDFs, 12 solution PDFs, and 12 older loose tutorial PDFs. MH2100 includes 30 question PDFs, 10 solution PDFs, and 13 Concepts/Graded/Attempt PDFs. |
| Course name plus `Final`, `Midterm`, or `Review` | 39 | 52 | 47 | Filename inventory only; question/solution variants and review/formula files coexist. |

Readable text was fetched from one tutorial solution for each course (MH1100 Tutorial 03, MH1101 Tutorial 09, MH2100 Tutorial 06). This verifies text access for those samples only. The tutorial, solution, exam, review, older loose-copy, and annotated-note sets were **not** compared page-by-page; duplicates and answer variants remain unresolved. Searches were limited to the stated filename filters and accessible Drive results. No claim is made that other filenames or unlisted folders are absent.

## Reproduction

1. Search the six listed Drive IDs; compare L01–04 raw PDF renders with their canonical lecture page sequences. Keep source files and OCR output outside Git.
2. Consult the existing L05/L06 page decisions in `2026-09-22/source-review.md`; do not count them as new work in this review.
3. Re-run the two stated Drive filename/MIME filters per course to reproduce the bounded archive counts. Reconcile the remaining archive only in a separately scoped review.
