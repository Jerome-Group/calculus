# Map

Calculus: an interactive mathematics learning site.

Start here: `README.md`, then `AGENTS.md`.

| Area                              | Entry point                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Learning experience               | `app/page.tsx`, subject views in `components/`, shared `hooks/`, assets in `public/` and `vendor/`                           |
| Mathematics and examples          | `lib/curriculum/` for lessons and citations; `lib/atlas/` for geometry; `examples/` for retained integrations                |
| Audit action ledger               | `data/concept_action_ledger.json` tracks concept-level evidence and remaining work                                           |
| Validation                        | `package.json` commands, `tests/`, `scripts/`, and `eslint-suppressions.json`                                                |
| Runtime and deployment            | `worker/index.ts`, `build/`, `vite.config.ts`, `.openai/hosting.json`; retained database scaffolding in `db/` and `drizzle/` |
| Working conventions and decisions | `AGENTS.md`, `CODING_STANDARDS.md`, `CONTEXT.md`, `docs/adr/`, and `docs/audits/` evidence                                   |
| Automation                        | `.github/workflows/ci.yml` and the central conformance caller                                                                |

Curriculum source ledger and verification: `docs/coverage-and-validation.md`.
Visual comparison: `design-qa.md`. Local source PDFs and extracts: ignored `course-materials/`.
