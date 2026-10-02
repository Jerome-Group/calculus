# Release and rollback

The original Site is `appgprj_6a9f4c7cb79c8191b6f1575d9ac01778`; access is public and
its domain is `calculus.jeromegroup.org`. No database or learner account migration is needed.
Preserve `.openai/hosting.json`, notices, asset identity and access-controlled source links.

1. Open a reviewed PR linked to its issue. Require `checks` and `conformance / check` on
   the exact head, resolve material independent-review concerns, then squash merge through
   GitHub protections. Never push directly to GitHub main or bypass required checks.
2. Use an isolated checkout of the original Site source repository. Fetch reviewed GitHub
   main and reconcile by a normal merge. Resolve conflicts to the reviewed tree; assert
   `git diff <reviewed-sha> HEAD --exit-code` for the entire tracked application tree.
   Record both SHAs. Never force-push or reset either remote history.
3. Verify and build that clean integration commit. Archive the complete `dist` tree plus
   `.openai/hosting.json`, including `dist/client/assets` and `dist/server`. Check the archive
   entries and retained source identity. Normal-push the exact integration commit to Sites.
4. Save a Site version with that full commit SHA and archive, then deploy it through the
   existing project. Read deployment status and inspect the public URL in the in-app browser:
   lessons, modes, lab readouts, navigation, graph hydration, assets and console errors.
5. Retain the previous version ID and a locally verified previous-source build/archive.
   Rollback uses the supported Site deployment operation on that previous version; verify
   the same domain afterwards. Test build/package validation locally. Do not cause a
   production outage merely to exercise rollback.

Credentials are ephemeral inputs to the Site workflow helper's hidden stdin. They never
belong in shell arguments, Git, evidence, documentation or archives. GitHub import alone is
not a Sites deployment. Inspect release evidence for the exact saved version and commit.
