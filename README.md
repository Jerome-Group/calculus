# Calculus

An interactive undergraduate library for calculus in one and several variables: definitions, arguments, worked examples, practice and linked mathematical drawings.

Live site: https://calculus.jeromegroup.org

## Status

Existing teaching application imported from ChatGPT Sites; build and tests are checked in CI.
Course documents are excluded; access-controlled notes links are retained.

## Local development and verification

Use Node.js 24+ and Git. Install locked dependencies with `npm ci`; start locally with
`npm run dev -- --host 127.0.0.1`. Set an explicit unused port when running several projects.

```sh
node scripts/calculus.mjs help --json
node scripts/calculus.mjs doctor --json
node scripts/calculus.mjs inventory --json --output outputs/inventory.json
node scripts/calculus.mjs map --check --json
node scripts/calculus.mjs verify --profile ci --json --output outputs/verification/local
node scripts/calculus.mjs browser-plan --json
npm run agent -- browser list
npm run agent -- browser doctor
npm run agent -- browser run --features all --output outputs/browser/local
```

`verify --profile ci` is the same executable loop used by CI: formatting, lint, source
freshness, map freshness, the built-Worker browser journeys, then all Node tests. It stops on a failure,
bounds process time, preserves stdout/stderr and records both the Git revision and a
SHA-256 source fingerprint. `build` writes `dist`; `test` requires that build. Neither
publishes. `map` without `--check` rewrites `data/experience-map.json`; regenerate it
when lessons, routes, or mapped features change. Full dependency, tool, and test discovery
is generated on demand by `inventory`. `outputs/` is ignored.
The retained Sites shell wrappers are legacy Linux integrations; the CLI runs directly
on macOS and Linux without shell package-manager wrappers.

Install Chromium once with `npx playwright install chromium`. The [local verify skill](.agents/skills/verify/SKILL.md)
owns browser launch, live readiness, action evidence, failure recovery, and cleanup.
`browser run` builds current source and uses fresh local state; it never attaches to an existing server.
`browser-evidence --input <report> --json`
validates their structure and current source identity; it does not manufacture or
independently verify observations. Read [verification contracts](docs/verification.md)
and the machine-readable [experience map](data/experience-map.json) for known gaps.
Personal drafts, self-assessments, choices, confidence, resume state, and inline controls
save to the signed-in ChatGPT account through Sites D1. Public teaching remains available.
Guest work and failed account writes stay in the current tab and can be lost on reload.
Only an account acknowledgement produces a saved state. Neither saved work nor choice
correctness establishes mastery. Old browser records require explicit preview and import;
their source keys remain untouched. See [the ownership decision](docs/adr/0008-account-owned-study-records.md).

The declared D1 binding is `DB`. Generate schema migrations with `npx drizzle-kit generate`.
After a build, apply each pending migration once to the local preview database:

```sh
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_serious_cargill.sql
```

The built Worker tests create disposable D1 databases and apply the committed migration
journal themselves. Local header fixtures verify application ownership after the gateway;
they do not simulate or establish hosted ChatGPT sign-in. Sites publishing applies hosted
migrations separately.

## Source and rights

Imported from the existing ChatGPT Sites source at `dfae58de017630ce490d40bbdb29e020266b7c19`. This GitHub repository was generated
from `Jerome-Group/public-template`; it contains a source snapshot, not the Sites development history.
Existing `.openai/hosting.json` identifies the original Site. GitHub pushes do not automatically
publish a new Sites version.

For a Sites release, build the merged commit and archive the complete `dist` tree plus
`.openai/hosting.json`:

```sh
npx vinext build
tar -czf /tmp/calculus-site-build.tar.gz dist .openai/hosting.json
tar -tzf /tmp/calculus-site-build.tar.gz | rg '^dist/client/assets/.*\.js$' | head
```

Push that commit to the existing Site source repository, then save and deploy a version with the
same full commit SHA and archive. After deployment, open the public URL and confirm a lesson or
Graph Studio hydrates without missing asset or console errors. Including only `dist/server` leaves
the HTML visible but prevents the client from loading.

Owned source and documentation are MIT licensed. Dependencies and vendored assets retain their
own licences and notices. Course PDFs and other course files are excluded and ignored. References
to access-controlled notes remain; access is governed by the Owner's Drive sharing permissions.
Credentials, private notes, and student data must never be committed.

The import applies Prettier formatting and records pre-existing ESLint findings in
`eslint-suppressions.json`; see ADR-0003. New lint errors remain gated.
