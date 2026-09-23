# Lesson hierarchy check · 2026-09-23

Observed in headless Google Chrome 153.0.8010.53, local Vite build at `http://127.0.0.1:5173/#review-total-differentiability`, Asia/Singapore, 17:59 before and 18:01 after. Viewport height was 900 CSS pixels, device scale factor 1. The review lesson was chosen because its question, assumptions and formula are long. Other lessons use the same layout, but were not individually measured here.

| Width | Before | After |
| --- | --- | --- |
| 320px | [Capture](browser-captures/hierarchy-before-320.png) | [Capture](browser-captures/hierarchy-after-320.png) |
| 390px | [Capture](browser-captures/hierarchy-before-390.png) | [Capture](browser-captures/hierarchy-after-390.png) |
| 1440px | [Capture](browser-captures/hierarchy-before-1440.png) | [Capture](browser-captures/hierarchy-after-1440.png) |

## Observed change

Before, optional prerequisites and the four lesson-mode buttons preceded the investigation. At 390px the objects and assumptions began at viewport y=846; at 320px they began at y=989. After, the order is question → objects and conditions → working relation → modes → optional prerequisite disclosure → experiment. Objects now begin at y=455 (390px) and y=499 (320px). No heading, body text or mathematical formula was shrunk. At all three unzoomed widths, document scroll width equalled viewport width; the working relation retains local horizontal scrolling if a longer formula needs it.

The Learn view now displays the question, formula, definition and conditions once in the header. The notes proceed directly to reasoning and worked application. The side experiment keeps its own scene equation, current readout and controls; its repeated task prompt appears in Explore mode, where it is needed for a standalone exploration. Prerequisite buttons remain available inside a labelled disclosure.

DOM checks at 390px confirmed the header order above, four lesson-mode buttons, no repeated formula at the start of the notes, no repeated task inside the Learn experiment, and a current readout. Switching to Explore displayed its task prompt and kept the readout. No document-wide horizontal overflow was observed at 320px, 390px or 1440px.

The screenshots and geometry are browser observations. The effect on lessons other than the sampled review route is inferred from shared components. No assistive-technology or actual browser-zoom acceptance claim follows from this check.
