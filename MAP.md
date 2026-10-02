# Map

Calculus: an interactive mathematics learning site.

Start here: `README.md`, then `AGENTS.md`.

| Area                              | Entry point                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Learning experience               | `app/page.tsx`, subject views in `components/`, shared `hooks/`, assets in `public/` and `vendor/`                                        |
| Mathematics and examples          | `lib/curriculum/` for lessons and citations; `lib/atlas/` for geometry; `examples/` for retained integrations                             |
| Audit action and outcome ledgers  | `data/concept_action_ledger.json` tracks concept-level leads; `lib/curriculum/outcome-ledger.json` tracks source outcomes and gaps        |
| Validation                        | `scripts/calculus.mjs`, `scripts/verification/`, `tests/`, and `eslint-suppressions.json`                                                 |
| Runtime and deployment            | `worker/index.ts`, `build/`, `vite.config.ts`, `.openai/hosting.json`; retained database scaffolding in `db/` and `drizzle/`              |
| Working conventions and decisions | `AGENTS.md` (including the learner-participant constraint), `CODING_STANDARDS.md`, `CONTEXT.md`, `docs/adr/`, and `docs/audits/` evidence |
| Automation                        | `.github/workflows/ci.yml` and the central conformance caller                                                                             |

Curriculum source ledger and verification: `docs/coverage-and-validation.md`.
Visual comparison: `design-qa.md`. Local source PDFs and extracts: ignored `course-materials/`.
Generated verification evidence in `outputs/` is excluded from Git and lint: captured
deployment bundles are evidence, not editable application source.

The complete machine-readable surface map is `data/experience-map.json` (125 lessons,
all routes, scene models, source links, dependencies, browser journeys, test discovery
and explicit verification gaps). Regenerate through `node scripts/calculus.mjs map`.
Readable contracts: `docs/verification.md`. Mathematical design rationale:
`docs/research/mathematical-learning-design.md`. Release procedure: `docs/release.md`.
The shared design is `app/experience.css`; linked analytic comparison labs live in
`components/atlas/comparison-*-lab.tsx` and `lib/curriculum/comparison-labs.ts`.
