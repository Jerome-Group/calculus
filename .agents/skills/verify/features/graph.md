# Graph studio

## Sub-features

Quick graph, representation editor, bounds and clipping, expression parameter, presets, share and reload, validation recovery, camera controls, compatibility rendering, and fullscreen.

## How to get to it (user POV)

Use Graph studio in the topbar or sidebar footer, or open `/#graph` directly.
Enter a function in Quick graph expression and press Graph.
Use Graph representation for Function, Parametric surface, Space curve, or Implicit surface, edit expressions and bounds, then press Render graph.
Choose a named preset to plot its complete configuration. Lesson exact-example graph buttons also open this workspace.
Use the parameter slider to explore `a`. Drag or use arrow keys to orbit, plus and minus to zoom, and Reset camera to restore framing.
Use Use compatibility view and Fullscreen visualization from the drawing toolbar.

## Driving it with Playwright

Run `npm run agent -- browser run --features graph --output outputs/browser/graph`.
The driver uses topbar, sidebar, and lesson exact-example entry points and the quick expression form.
It renders `sin(x)*cos(y)`, `[cos(u),sin(u),v]`, `[cos(t),sin(t),t/3]`, and `x^2+y^2+z^2-1` through the editor, reloading each encoded state.
It rejects an incomplete expression and inverted bounds, then restores rendering through Saddle and Helix presets.
After invalidating surface-only bounds, it switches to a space curve and requires the valid curve to render and survive reload.
Each changed plot must change finite plotted compatibility SVG geometry, including same-representation expression changes. Positive status counts must match the current representation. Mesh fills and the surface-colored curve count; axes and arrows do not.
It replots the same saddle with custom bounds, lowers its height clip, checks excluded samples, and restores the expression and full configuration after reload.
It independently checks keyboard orbit and zoom against drawn geometry, then requires Reset camera to restore its reference framing. SVG coordinates round to six decimal places for the reset comparison. It also drives fullscreen entry and exit.
Real pointer rotation and right-button pan must change plotted geometry before release. The next action immediately clicks Reset camera or selects Helix from Saddle. Both must match their no-input reference drawing and stay unchanged across twelve further render frames, with finite plotted geometry afterward.
Parameter proof opens Wave amplitude, checks its expression and complete bounds, changes real SVG geometry, and restores the encoded parameter after reload.
It checks the malformed graph explanation and renders at 390px with reduced motion.
Shared parameter 6 must recover to the default 1 with an explanation; shared endpoints -5 and 5 must remain within the slider's accessible range.
The focusable parameter slider must expose its visible expression-parameter name.

## Gotchas

Chromium needs its installed browser and system libraries. Failure to start is a prerequisite failure, never a skipped graph proof.
SVG and WebGL prove local sampled drawing only. Other GPU hardware remains unverified.
The driver selects compatibility rendering through the visible toolbar for deterministic geometry comparisons. A prior status message cannot acknowledge a new drawing.
The named-slider assertion checks the keyboard-focusable thumb, not its wrapper.
The finite mesh can miss features or exclude clipped samples. A blank graph is not proof of an empty mathematical set.
