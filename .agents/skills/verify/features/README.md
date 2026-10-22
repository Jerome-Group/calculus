# Calculus feature map

Run from the repository root with `npm run agent -- browser run --features <id>`.
The driver starts a built Worker and fresh browser storage. Each feature has explicit assertions and retained failure evidence.

| ID                            | User capability                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| [clinic](clinic.md)           | Nine original diagnostic cases, transfer, recovery, share links and transient memory |
| [library](library.md)         | Courses, cross-course search, history, and mobile navigation                         |
| [lessons](lessons.md)         | Reading modes, mathematical reasoning, references, and lesson navigation             |
| [experiments](experiments.md) | Parameters, model comparisons, inline diagrams, and renderer recovery                |
| [graph](graph.md)             | Graph editor, four representations, presets, and camera controls                     |
| [study](study.md)             | Account drafts, history, conflicts, guest limits, and explicit legacy import         |

`features.mjs` is the executable registry. A structural check rejects missing or extra feature files.
All 125 lesson IDs and the complete control, source, dependency, and test discovery inventory remain available through `npm run agent -- inventory --json`.
Representative browser journeys are bounded proof of their recorded actions, not exhaustive coverage of every lesson or model.
