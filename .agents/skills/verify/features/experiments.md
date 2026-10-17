# Experiments

## Sub-features

Parameter bounds, readouts, animation and reset, split and wide views, minimise and expand, model selection, seven comparison families, inline exact examples, reduced motion, and deferred-drawing recovery.

## How to get to it (user POV)

Open a lesson's Learn or Explore mode. Standard lessons embed Experiment; pilot Explore offers Diagram and Values only.
Use the labelled parameter slider, landmark buttons, animation button, Reset experiment, and What to notice.
Use Wide, Split, Minimise, and Expand for the drawing layout.
Lessons with alternatives expose Experiment model under Compare models.
Compare & explain panels have predictions, exact witnesses, range controls, and Reset comparison and prediction.
Learn's exact review diagrams open through Inspect the exact function and plane. Polar regions has separate Explore disclosures.
Drawing controls offer compatibility view, orbit, zoom, camera reset, and fullscreen, exercised in [graph](graph.md).

## Driving it with Playwright

Run `npm run agent -- browser run --features experiments --output outputs/browser/experiments`.
The driver changes the chain-rule parameter through keyboard bounds, checks its readout, resets, plays and pauses, and uses each layout control.
It opens all seven comparison families, checks representative exact values, submits wrong and correct predictions, changes every range through keyboard bounds, and verifies reset clears predictions.
It checks ray witnesses, the inconclusive Hessian case, singular clock speed, and integration-order invariance.
It waits for account hydration, proves an exact review control changed independently, waits for its visible save acknowledgement, reloads and waits for hydration before comparing the saved value. It also drives a polar-region control.
It switches pilot Diagram and Values only views, checks valid and invalid algebraic tolerance choices, and compares horizontal slice bounds.
It checks disabled animation under reduced motion and page width at 390px.
A new context blocks the actual deferred viewport chunk. Definition and reasoning must remain readable, and Reload to retry drawing must restore the scene.
Finally it selects Constant-height circle, reloads, and requires the same model.

## Gotchas

Inline reload requires the migrated local D1 and explicit local account fixture; hosted sign-in remains a separate check.
Regression #195 requires Constant-height circle to remain selected after reload.
The request failure is an explicit local injection. The driver records its errors separately and rejects unrelated runtime errors.
Comparisons illustrate sampled geometry; exact mathematical claims remain covered by focused model tests.
