# Verify dependency heads before automatic landing

Status: accepted

## Context

The owner authorized automatic PR landing. Application CI now builds and checks the real site, so this repository can opt into dependency automation. A green check does not replace independent verification, and an auto-merge queue can outlive the reviewed head.

## Decision

Opt into `dependabot-auto-merge.yml` for one modified workflow containing one forward patch or minor action pin and its version comment. Require the same action name, a full SHA, and an upstream release tag resolving to that SHA.

A trusted approval must record an independent PASS verdict and the exact head, current base and stable patch ID. Existing required checks must succeed. The helper then uses GitHub's immediate merge API with the verified head as its server-enforced condition and reads the result back. It never queues a future head or bypasses repository rules. A required merge queue therefore needs a separate decision.

CI completion and PR comment events retry this qualification against current metadata. Both events load the workflow from the default branch. A review event could load a PR's workflow, so it is deliberately excluded. After approving, the verifier posts its verdict comment to request evaluation. The privileged job checks out only the default branch, consumes no PR artifacts, and never executes PR code. Other dependency updates remain manual review work.

## Consequences

Ready, independently verified action bumps can land without another owner confirmation. Missing reviews, stale bases, changed patches, failures and unknown states leave the PR open. This is stricter than the Organisation's general opt-in policy. The helper and its rejection cases are executable through `node --test tests/dependency-landing.test.mjs`.

## Verification record

Submit a trusted approval for the exact current revision, then post the same verdict as a PR
comment so the default-branch workflow evaluates it. The approval body contains these literal
lines, replacing the placeholders with verified hexadecimal values.

```text
Independent verification: PASS
Head: <head SHA>
Base: <current main SHA>
Patch-id: <stable patch ID>
```

`PASS+NOTES` is also accepted. Dismissed approvals and requested changes prevent qualification.
GitHub atomically guards the head; base and review observations are separate reads.
Run `node scripts/merge-verified-dependency.mjs --help` for the bounded CLI contract.
