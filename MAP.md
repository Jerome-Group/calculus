# Map

Calculus: an interactive mathematics learning site.

Start here: `README.md`, then `AGENTS.md`.

| Area                              | Entry point                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Learning experience               | `app/page.tsx`, subject views in `components/`, shared `hooks/`, assets in `public/` and `vendor/`                                              |
| Build dependency fork             | `vendor/braces/`, upstream integrity in `vendor/braces/UPSTREAM.json`, ownership in `docs/adr/0009-own-a-bounded-braces-fork.md`                |
| Mathematics and examples          | `lib/curriculum/` for lessons and citations; `lib/atlas/` for geometry; `examples/` for retained integrations                                   |
| Audit action and outcome ledgers  | `data/concept_action_ledger.json` tracks concept-level leads; `lib/curriculum/outcome-ledger.json` tracks source outcomes and gaps              |
| Validation                        | `.agents/skills/verify/SKILL.md`, `scripts/calculus.mjs`, `scripts/verification/`, and `tests/`                                                 |
| Runtime and deployment            | `worker/index.ts`, `worker-env.d.ts`, `build/`, `vite.config.ts`, `.openai/hosting.json`; account schema and migrations in `db/` and `drizzle/` |
| Personal study                    | `lib/study/` owns validation, server persistence, session state and legacy parsing; `components/atlas/study-records.tsx` owns public hooks      |
| Working conventions and decisions | `AGENTS.md` (including the learner-participant constraint), `CODING_STANDARDS.md`, `CONTEXT.md`, `docs/adr/`, and `docs/audits/` evidence       |
| Automation                        | `.github/workflows/ci.yml`, the central conformance caller, and `scripts/merge-verified-dependency.mjs`                                         |

Curriculum source ledger and verification: `docs/coverage-and-validation.md`.
Visual comparison: `design-qa.md`. Local source PDFs and extracts: ignored `course-materials/`.
Generated verification evidence in `outputs/` is excluded from Git, lint, and TypeScript
source checking: captured deployment bundles are evidence, not editable application source.

The compact map is `data/experience-map.json` (125 lessons, routes, and verification features).
Regenerate through `npm run agent -- map`. Full source, scene, dependency, tool, and test
discovery remains available through `npm run agent -- inventory --json`.
Readable contracts: `docs/verification.md`. Mathematical design rationale:
`docs/research/mathematical-learning-design.md`. Release procedure: `docs/release.md`.
The shared design is `app/experience.css`; linked analytic comparison labs live in
`components/atlas/comparison-*-lab.tsx` and `lib/curriculum/comparison-labs.ts`.
