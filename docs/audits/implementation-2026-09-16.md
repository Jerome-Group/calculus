# Calculus audit implementation

Issue: #18. Input: the owner's `calculus_audit_bundle.zip`, audited against
`e3cc02a701db924a412248db13ff3bacacd91cf5`, which matched main at the start.

## Release purpose

The audit's central problem was that a selected topic, a short reference card,
and a moving graph were being asked to do the work of a taught lesson. ADR-0005
records the decision to separate guided instruction, practice evidence, and
sampled visual evidence while preserving the source ledger.

## Evidence boundaries

The original audit and its 125-record recommendation backlog are retained here.
Each lesson now has additional instruction and independent practice; this is not
an assertion that every bespoke experiment suggested in the backlog has been
built or that a complete standalone replacement for three university courses
has been certified. Source PDFs remain private; no private course files were
republished. Practice is self-assessed and device-local, not automatic grading.
Finite graph sampling remains heuristic and can miss sufficiently small features.
Public further-reading links cover the limit, partial-fraction and change-of-variable
clusters; other lessons retain precise course/textbook citations and a task-specific
reading prompt. Simple symbolic prose remains Unicode; exercise expressions and
worked-result equations render through KaTeX with MathML.

## Independent checks and visual repairs

- The public landing page and a representative lesson loaded before editing.
  Baseline screenshots captured at 1280×720 and 390×844.
- Baseline mobile layout placed a large graph and controls before mathematical
  notes. The new heading includes the question and essential formula first.
- During editing, a duplicated full stop in graph captions was found and fixed.
- Programmatic lesson focus introduced a visible outline around display headings;
  suppress that heading outline while retaining keyboard-control focus styles.
- New nonlinear and polar scenes initially retained old linear/sector task copy.
  Corrected examples and prompts to match the actual selected default model.
- Hook additions produced a transient development hot-reload error. Fresh-load
  verification is required; a stale development console is not production evidence.
- Initial standalone TypeScript invocation exposed pre-existing missing Cloudflare
  global types. The repository's required build and test workflow is used; no claim
  is made that this optional invocation passes.

- Visual inspection found markers and the chain-rule path hidden behind translucent
  surfaces. Overlay materials now render after the surface; verified the six
  stationary markers and selected point are visible. Corrected stationary-point
  and oblique-flux legend colours.
- The shifted disk appeared elliptical with independent horizontal/vertical scales.
  The new geometric panels now preserve equal unit lengths on both axes.
- Browser-tool focus could run before Revise mode revealed a requested section.
  Focus now follows the DOM update, with a margin below the fixed header.

## Validation

- `npm run format:check`, `npm run lint`, `npx vinext build`: passed.
- `node --test --test-concurrency=1 tests/*.test.mjs`: 16 passed. Sequential local
  execution avoids Vite test servers sharing their dependency-optimizer cache;
  the standard parallel command also passed. CI runs the repository's standard command.
- All 125 lessons at 1280px and 390px: no page errors, KaTeX errors or document
  horizontal overflow, including revealed solutions. All 125 prompts and solution
  equations also passed strict KaTeX parsing and a separate mathematical review.
- Desktop/mobile screenshots inspected: derivative tests, nonlinear Jacobian,
  shifted disk, exact ellipsoid/box, six stationary points, nonconstant chain rule,
  and reversed-integration practice. Mobile practice also reflowed at 200% root text size.
- Practice entry, hint/solution disclosure, self-assessment saving, reload and resume
  passed. Corrupt storage renders zero valid records; blocked storage reports failure
  without preventing practice. Opening lessons never changes assessment counts.
- Model selector, keyboard graph rotation/zoom, next-lesson focus/scroll reset and
  browser-tool navigation from Revise to visible notes passed.
- Requirements and Standards reviews completed; identified defects were repaired.
- The Sites build wrapper requires GNU `timeout`, unavailable on this macOS host.
  Used the same underlying `vinext build` command as repository CI; no runtime
  configuration or deployment identity changed.

Visual evidence: [before mobile](visual/before-mobile.png),
[practice on mobile](visual/practice-mobile.png),
[shifted disk](visual/shifted-disk.png),
[stationary points](visual/stationary-points.png),
[chain rule](visual/chain-rule.png).

The linked issue and pull request retain the subsequent CI, merge and production
version evidence, so the checked-in build does not claim a future deployment.
