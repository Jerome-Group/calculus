# Proof workshop

## Sub-features

Three MH2100 investigations accept coefficients, exponents, and ordered polygon vertices. Exact checks distinguish a derivative obstruction from a bound obstruction, a path restriction from an unrestricted limit, and one loop's circulation from a global potential claim. Initial explanations, construction reports, revisions, and older attempts remain paired within the tab. Diagrams respond to the current construction. Lesson recovery, history, selection-only links, keyboard focus, narrow layouts, and reload reset have maintained checks.

## How to get to it (user POV)

Use Open Proof workshop in Library, Proof workshop in the topbar or sidebar, or an attached MH2100 lesson's workshop button. Select an investigation, enter a construction and explanation, then choose Check construction. Read the result, keep a revision, or choose Edit a new construction. Open a linked lesson and use Return to Proof workshop to recover the current attempt. Browser Back and Forward retain the tab's work.

## Driving it with Playwright

Run `npm run agent -- browser run --features workshop --output outputs/browser/workshop`.
The journey submits constructions through labeled native controls and checks invalid-field and result focus. It checks the C=3 certificate, wrong-map and too-small-bound distinctions, a nondecisive parabola, a tiny nonzero cubic coefficient, loop reversal, singular-edge refusal, and zero winding. Changing C, the path exponent and coefficient, and traversal order must change finite SVG geometry. KaTeX, MathML, and text equivalents accompany the proofs and numerical illustrations.

The journey preserves each initial explanation with its construction, report, and revisions. It hides stale current results during reconstruction, inspects older attempts, switches investigations, and follows lessons with return, Back, and Forward. At 320px, it uses the keyboard, checks page overflow at 200 percent CSS zoom and reduced motion, and opens the sidebar. It also checks direct lesson entry, selection-only links, invalid-link recovery, reload reset, and the absence of workshop account writes.
Two nested prerequisite detours must retain the first interrupted lesson, its exact URL, and the workshop continuation through Back and Forward. Returning must restore the same report, explanation, and result focus.

## Gotchas

The versioned URL stores only the selected investigation. Constructions, explanations, reports, and revisions live in the mounted Atlas session. Reload clears all attempts while retaining selection. Invalid links restore the first investigation with a notice and load no work. Written explanations remain ungraded, and numerical illustrations do not replace exact arguments.

This local Chromium journey does not establish participant usability, screen-reader operation, mastery, hosted native sign-in, public deployment, or private source access.
