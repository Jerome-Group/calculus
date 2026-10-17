# Account-owned study records

Status: accepted. Issue: [#197](https://github.com/Jerome-Group/calculus/issues/197).

## Why ownership moves to the account

Device records cannot follow a learner across sessions or devices and cannot distinguish people sharing a browser. Native Sites sign-in supplies a stable Site user ID. Email and name can change, so they serve only as display fields. Public teaching stays available without an account.

Both native authentication anchors stay mounted. Clearing account state before navigation must not change the clicked link's destination. Reusing one anchor can send a sign-out click to the sign-in path after React updates its `href`.

This decision supersedes the device-only persistence and no-account statements in [ADR-0005](0005-audit-learning-and-experiment-evidence.md) and [ADR-0006](0006-linked-comparisons-and-executable-verification.md). Their curriculum, mathematical evidence, and mastery limits remain in force.

## Why records have separate revisions

One account-sized document makes draft typing contend with confidence, navigation, and unrelated lessons. One D1 table instead stores independently versioned records under an owner and canonical domain key. The server authorizes every query using the native stable ID and compares the tab's expected owner before writing. That extra equality check prevents an old tab's A data from becoming B data after the shared authentication cookie changes.

Atomic revision checks detect competing edits. A cleared record remains a versioned tombstone, so a stale writer cannot recreate it. A conflict retains the local and account versions for an explicit choice. Retrying a mutable mutation requires the same ID and normalized payload. Choice attempts are immutable inserts with stable IDs. Their captured time records when the check happened, while the separate acceptance time records when D1 accepted it.

Overview reads aggregate the full attempt count and latest task evidence. Lesson records and cursor-based attempt history are bounded reads. Paging history therefore does not shrink the study summary's total.

## Why unsaved work stays in the tab

One provider owns personal edits, coalescing, acknowledgements, retry, conflicts, and account generations. An older acknowledgement cannot mark newer text saved. Account changes discard previous private views and pending writes. Focus, restored pages, and cross-tab invalidation recheck native identity before exposing private records. Failed identity checks hide prior private data.

Guest work and failed account writes stay in memory. They survive navigation within the application but can be lost on reload or sign-out. A persistent offline queue would require another durable owner boundary and retention policy. It is outside this change. The interface states this limit before offering sign-in or sign-out.

## Why legacy import is explicit

Old browser keys have no owner. Signing in must not upload them or turn a guest draft into account data. The importer previews validated records and the destination account, requires confirmation, and fills missing mutable records only. Existing records, including tombstones, remain authoritative.

Historical attempts retain their recorded correctness with legacy provenance. Their IDs derive from normalized event content and a duplicate ordinal among identical events. Re-import therefore preserves multiplicity without duplicating old events when an unrelated record changes or a later attempt is appended. Bounded chunks report imported, retained, rejected, and failed items. Retry sends only failed items. The importer never edits or deletes a source key.

## Verification boundary

Built Worker tests use disposable local D1 and documented native identity header fixtures. They establish application authorization after the gateway. They do not establish hosted provider sign-in, device continuity through the actual provider, or learning gains. A Sites deployment must preserve the original project ID and configure the declared `DB` binding through the native publishing workflow.
