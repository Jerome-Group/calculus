# Calculus

An interactive learning site for students exploring multivariable calculus through visual explanations and 3D geometry.

Live site: https://calculus.jeromegroup.org

## Status

Existing teaching application imported from ChatGPT Sites; build and tests are checked in CI.
Course documents are excluded; access-controlled notes links are retained.

## Local development

Use Node.js 24 or newer, then:

```sh
npm ci
npx vite
```

Build and run the existing checks on macOS or Linux:

```sh
npm run format:check
npm run lint
npx vinext build
node --test tests/*.test.mjs
```

The retained `install:ci` and `build` wrappers target the Linux Sites environment.
The commands above work directly on the MacBook Pro. See `MAP.md` for the source layout.

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
