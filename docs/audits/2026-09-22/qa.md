# QA · audit pilot

Issue #25. Tested the production build locally from `codex/calculus-audit-pilot` on 22 September 2026. Source commit: `d5977e8745563b8d36778bbf6860ff3c40b7a206`.

## Commands

| Command | Result | Output |
| --- | --- | --- |
| `npm ci` | Pass; 693 packages installed | [npm-ci.log](npm-ci.log) |
| `npx vite --host 127.0.0.1 --port 5174` | Pass; dev server returned HTTP 200 | [vite.log](vite.log) |
| `npx vinext build` | Pass; five build phases | [build.log](build.log) |
| `node --test tests/*.test.mjs` | Pass; 22/22 tests | [tests.log](tests.log) |
| `npm run format:check` | Pass | [format.log](format.log) |
| `npm run lint` | Pass | [lint.log](lint.log) |
| `npm run sources:check` | Pass; 97 classified sources | [sources.log](sources.log) |

The build reports an existing large-chunk advisory and Vite native-config warnings. The test runner reports a nonfatal WebSocket port warning. No check failed.

## Browser checks

The local production server ran at `http://127.0.0.1:4173/`. All 125 concept hashes opened with the expected heading and zero KaTeX errors. The two pilot modes, source references, the six-step integration chain, the legacy `polar-regions` experiment and Graph studio loaded. A wrong epsilon-delta choice returned `QUANTIFIER_REVERSED` feedback and appeared in Revise; a correct choice did not award delayed mastery. Enter, Space, typing and arrow keys completed a mobile setup task and changed the values-only epsilon slider. The table updated while the diagram was hidden.

At 1280px desktop, 390px mobile and 320px narrow viewports, the two pilots had no document-level horizontal overflow or KaTeX errors. On mobile, the prompt precedes controls, diagram and text/table evidence. The Type I/II SVG's vertical and horizontal slice descriptions both matched the displayed `0.80` and `0` to `1.20` bounds. The epsilon lab's incorrect `delta=0.5` at `epsilon=0.8` produced an exact counterexample; `delta=0.2` was algebraically certified. The reduced-motion media fixture matched and computed transitions were `0s`. Page-scale fixtures reached 200% and the browser's 300% cap; 400% browser text zoom was unavailable in this browser, so that exact fixture remains unverified.

Screenshots inspected: [epsilon Learn desktop](epsilon-learn-desktop.png), [epsilon Explore desktop](epsilon-explore-desktop.png), [epsilon practice mobile](epsilon-practice-mobile.png), [epsilon values mobile](epsilon-values-mobile.png), [Type Explore mobile](type-explore-mobile.png), [vertical slice desktop](type-explore-vertical-desktop.png), [horizontal slice desktop](type-explore-horizontal-desktop.png), and [live baseline](live-baseline.png).

## Live domain and deployment identity

Fresh browser and HTTP checks loaded `https://calculus.jeromegroup.org/` with HTTP 200. Its Type I/II lesson still showed only Learn/Revise, without the new theorem chain. Its CSS asset was `/assets/index-DTjK6-n3.css`; the local production build used `/assets/index-DycuoGxT.css`. The live domain therefore does **not** run this branch's build. The supplied audit also mentions `calclus.jeromegroup.org`, which did not resolve in DNS. The Sites connector could not read the old project ID from `.openai/hosting.json`. The user waived ChatGPT Sites publication, so deployment matching is deliberately not claimed.
