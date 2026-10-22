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
It exercises the parameter, keyboard camera controls, reset, SVG compatibility, and fullscreen entry and exit.
Parameter proof opens Wave amplitude, checks its expression and complete bounds, changes real SVG geometry, and restores the encoded parameter after reload.
It checks the malformed graph explanation and renders at 390px with reduced motion.
The focusable parameter slider must expose its visible expression-parameter name.

## Gotchas

Chromium needs its installed browser and system libraries. Failure to start is a prerequisite failure, never a skipped graph proof.
SVG and WebGL prove local sampled drawing only. Other GPU hardware remains unverified.
The named-slider assertion checks the keyboard-focusable thumb, not its wrapper.
The finite mesh can miss features or exclude clipped samples. A blank graph is not proof of an empty mathematical set.
