# CA-018 broader source archive review · 24 September 2026

## Search boundary

This bounded inventory uses Drive PDF queries with `mimeType = 'application/pdf'` and both the course code and one title term (`Tutorial`, `Final`, `Midterm`, or `Review`). Each returned result set was exhausted (`moreResults: false`). It does not certify differently named files or unlisted folders absent. Query hit counts and overlaps are in the [machine-readable audit](archive-variant-review-2026-09-24.json), alongside row-level evidence for public records.

| Course | Tutorial IDs | Final hits | Midterm hits | Review hits | Unique Final/Midterm/Review IDs |
| --- | ---: | ---: | ---: | ---: | ---: |
| MH1100 | 36 | 28 | 10 | 3 | 39 |
| MH1101 | 36 | 31 | 21 | 0 | 52 |
| MH2100 | 53 | 21 | 26 | 1 | 47 |
| **Total** | **125** | **80** | **57** | **4** | **138** |

The two MH1100 Final Review IDs are also Review hits; the one MH2100 Review ID is also a Final hit. Search IDs are deduplicated within each course. The 138 unique Final/Midterm/Review search results include one private learning record, which is excluded from all public row-level identity and file metadata. The JSON contains 137 public archive rows, 125 tutorial rows, and only an aggregate count for that exclusion: 262 public IDs and 1,504 public source pages from 263 observed unique search IDs. The previous annotation report's 39/52/47 row counts are per-course Final/Midterm/Review searches, separate from the tutorial counts.

The selected annotated MH2100 L01–06 lecture sources remain covered by [the annotation archive report](annotation-archive-review-2026-09-24.md) and [the earlier source review](2026-09-22/source-review.md). They were not re-fetched or re-reviewed here.

## Evidence and classifications

Raw PDFs and page renders stayed outside Git. The 125 tutorial PDFs (504 pages), 87 public MH1100/MH1101 Final/Midterm PDFs (547 pages), and the prior 50 MH1100/MH2100 exam/review PDFs (453 pages) were hashed and page-counted. One private learning record is excluded from public row-level review; its ID, title, hash, size, page count, and contents are not included. Page text hashes and readable text were used only as comparison aids; no prompt, answer, OCR transcript, excerpt, page image, or handwritten work is included. Pages with sparse or image-only text were rendered where needed. No mathematical correctness claim follows from a text or visual match.

- The MH1100 alternate question copies match page-by-page: ten Final pairs (2015–2024) and three Midterm pairs (2022–2024). They are content-equivalent at the printed question/page level, not byte-identical. Visible watermarks, page geometry, or labeling vary; the 2024 loose Final adds a confidentiality mark on p.4. No correction or erratum was found.
- Four MH1101 same-year Midterm pairs have matching printed questions. The alternate files include handwritten work: 2025 pp. 1, 2, 4, 8–9; 2023 pp. 1, 3, 6–8; 2024 pp. 1, 3, 6; 2022 pp. 1, 3, 6. These are annotated attempt copies, not duplicates or verified solutions. The writing is not reproduced or correctness-checked.
- The 51 public MH1101 archive rows have unique whole-file SHA-256 hashes. Four groups with matching full-page text signatures were rendered and found to be different year/course or document-role content; the signatures arose from blank pages or copyright-only text layers. They are not duplicate evidence. Low-text/image-only pages were rendered for 28 public files; the exact page status and limits are in the JSON.
- Across the 47 MH2100 exam/review IDs, 23 same-content pairs are byte-identical. The single MH2100 Review hit overlaps Final and is deduplicated. The MH1100 Final Review pair (`1roZDgbnqcD2ww7uXkp5JoMq9xf51z8jW`, `1CcfIZCNaLO-C8no1isa6A1rxArqmqhI1`) has 18 visually matching pages but differs in bytes and page geometry; call it content-equivalent, not byte-identical.
- The MH2100 Tutorial 02 Questions pair (`1Da7drCwo1dqDmnK-S-zZmW7Z5xlr9On6`, `1L5CywNwUC7PhPEUE0N4kfkm71dLv34Z3`) is byte-identical (115,543 bytes, two pages). Other tutorial question variants were rendered by page. MH1101 older tutorial copies may contain answer-key or handwritten pages; these are located in the JSON and are not treated as checked solutions.
- Both MH1100 Tutorial 08 question copies show slope −1 on p.1, Problem 5. The previously relayed +1 variant was not reproduced; no erratum lead is recorded. The MH2100 Tutorial 11 PDF-icon page (`1C2i20jDNszt0OaCEERad7RiW0jAuNaZx`, p.1) remains unreadable against its readable same-title peer.
- Distinct archive materials include the 44-page MH1100 Key Concepts Review (`1FhqVQSJ8uftDsvgZZbSJThnBh5k1-U91`) and the 27-page MH2100 Lecture 12 Final Exam Review (`10zC5vlK8Muh2OE8LEkAprYheJvQW-efX`). The former is a future source-mapping lead only. The latter is already canonical in both source catalogs with a matching SHA-256 and its existing affected concepts retained. Its embedded prompt cards on pp. 1, 4, 7, 10, 13, 16, 19, 22, and 25 were not transcribed or remapped.
- The MH1101 final and midterm formula-sheet PDFs are already `personal_reference` entries in `source-manifest.json`, with no affected concepts; no public source or route was added. The related TeX source lies outside these PDF searches. One private learning record remains unclassified and is represented only by the aggregate exclusion count; no identifying metadata or content is retained.

Solution PDFs are classified as answer companions, not correctness-certified solutions. Exact scanned or handwritten answer pages remain unresolved for mathematical comparison; the JSON names their Drive IDs and page ranges. No verified erratum or new public outcome was established. No curriculum source, route, or outcome changed.

## Reconciliation and limits

The audit reconciles to parent issue #46 and issue #157. The selected annotated lecture set is linked above and stays outside this expanded tutorial/exam title-search sample. Catalog matches and the three non-catalog source leads are recorded in JSON. No separate route/source issue was opened because no page-level correction or new public outcome was verified. No claim is made about material outside the returned queries, image-only mathematics not transcribed, or solution correctness.

## Reproduction

Repeat each stated Drive PDF query, retain the returned ID list and overlap notes, fetch raw bytes to private temporary storage, compute SHA-256 and page count, and compare page-text hashes without treating them as proof of mathematical equivalence. Render same-year or image-only pages listed in the JSON. Do not retain course PDFs, rendered pages, page text, OCR, or handwritten work in the repository.
