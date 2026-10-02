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
```

`verify --profile ci` is the same executable loop used by CI: formatting, lint, source
freshness, map freshness, production build, then all Node tests. It stops on a failure,
bounds process time, preserves stdout/stderr and records both the Git revision and a
SHA-256 source fingerprint. `build` writes `dist`; `test` requires that build. Neither
publishes. `map` without `--check` rewrites `data/experience-map.json`; regenerate it
when lessons, features, dependencies, tools or test coverage change. `outputs/` is ignored.
The retained Sites shell wrappers are legacy Linux integrations; the CLI runs directly
on macOS and Linux without shell package-manager wrappers.

Browser journeys require actual observations. `browser-evidence --input <report> --json`
validates their structure and current source identity; it does not manufacture or
independently verify observations. Read [verification contracts](docs/verification.md)
and the machine-readable [experience map](data/experience-map.json) for known gaps.
Self-assessment and choice records remain browser-local; neither is proof of mastery.

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
