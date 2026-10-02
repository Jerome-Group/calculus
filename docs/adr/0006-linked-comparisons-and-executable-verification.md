# ADR-0006: Linked comparisons and executable verification

## Status

Accepted for issue #188.

## Context

The application already has 125 lessons across three courses, substantial explanations,
proofs and exercises. Its dense visual shell obscured that content. Navigation and search
state were hard to recover, and static source references did not establish behavioral coverage.

## Decision

Retain all existing lessons, source identities, graph capabilities and browser-local records.
Use a quiet reading surface with mathematics in the normal page flow, early mode selection,
explicit assumptions and navigation through arguments. Add analytic comparison labs only
within existing MH2100 topics: paths, normalized error, saddle sections, curve clocks, slicing
orders and polar area. Pair representations with exact quantities and prediction feedback.

Make course and search state versioned in the URL. Defer the heavy renderer and contain
renderer-load failures so mathematical reading and navigation remain usable.

Provide one portable, bounded CLI for inventories, deterministic map freshness, local and CI
checks, and structured evidence. Capture source fingerprints in addition to Git revisions.
Static test discovery remains distinct from executed behavioral evidence. No participant
study or mastery claim is made.

## Consequences

The scope stays finite and self-contained, with no runtime AI service or new account system.
Existing historical outcome ledgers remain honest about their unverified assertions.
Release still uses the original Sites identity and public domain. Divergent Site and GitHub
histories are reconciled by a normal merge with equal reviewed application trees, never a
force push. Release provenance and rollback are recorded separately from code review.
