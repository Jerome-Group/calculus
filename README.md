# Calculus

An interactive learning site for students exploring multivariable calculus through visual explanations and 3D geometry.

Live site: https://calculus.jeromegroup.org

## Local development

Use Node.js 24 or newer, then:

```sh
npm ci
npx vite
```

Build and run the existing checks on macOS or Linux:

```sh
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

Owned source and documentation are MIT licensed. Dependencies and vendored assets retain their
own licences and notices. Course PDFs and other course files are excluded and ignored. References
to access-controlled notes remain; access is governed by the Owner's Drive sharing permissions.
Credentials, private notes, and student data must never be committed.
