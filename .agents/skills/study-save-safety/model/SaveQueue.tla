---------------------------- MODULE SaveQueue ----------------------------
EXTENDS Naturals, TLC

CONSTANTS MaxEdits, MaxOverviews, PreserveRecovery, ForgetFailedEdit,
          AcceptOlderAcknowledgement

Keys == {"assessment", "draft"}
None == 0
OtherEdit == MaxEdits + 1
VARIABLES entries, database, overviews, overviewRequest, otherWriter
vars == <<entries, database, overviews, overviewRequest, otherWriter>>

InitialRecord(k) == [revision |-> IF k = "assessment" THEN 1 ELSE 0,
                     edit |-> None]
InitialEntry(k) ==
  [seq |-> 0, acknowledged |-> 0, local |-> None, pending |-> None, flight |-> None,
   stage |-> "idle", base |-> 0, replyRevision |-> 0, replyEdit |-> None,
   replyKind |-> "none", confirmedRevision |-> InitialRecord(k).revision,
   confirmedEdit |-> None, persistence |-> IF k = "assessment" THEN "saved" ELSE "ready",
   drain |-> FALSE, conflictHeld |-> FALSE]

Init ==
  /\ entries = [k \in Keys |-> InitialEntry(k)]
  /\ database = [k \in Keys |-> InitialRecord(k)]
  /\ overviews = [i \in 1..MaxOverviews |->
       [stage |-> "unused", revision |-> 0, edit |-> None]]
  /\ overviewRequest = 0
  /\ otherWriter = FALSE

Pump(e) ==
  IF e.pending # None /\ e.flight = None /\ e.persistence # "conflict"
  THEN [e EXCEPT !.flight = e.pending, !.pending = None,
        !.stage = "request", !.base = e.confirmedRevision,
        !.persistence = "saving", !.drain = FALSE]
  ELSE [e EXCEPT !.drain = FALSE]

Save(k) ==
  /\ entries[k].seq < MaxEdits
  /\ LET e == entries[k]
         edited == [e EXCEPT !.seq = @ + 1, !.local = e.seq + 1,
                              !.pending = e.seq + 1,
                              !.persistence = IF e.persistence = "conflict"
                                              THEN "conflict" ELSE "saving"]
     IN entries' = [entries EXCEPT ![k] = Pump(edited)]
  /\ UNCHANGED <<database, overviews, overviewRequest, otherWriter>>

ServerReply(k) ==
  /\ entries[k].stage = "request"
  /\ LET e == entries[k]
         duplicate == database[k].edit = e.flight
         accepted == duplicate \/ e.base = database[k].revision
         row == IF duplicate \/ ~accepted THEN database[k]
                ELSE [revision |-> database[k].revision + 1, edit |-> e.flight]
     IN /\ database' = [database EXCEPT ![k] = row]
        /\ entries' = [entries EXCEPT ![k].stage = "response",
             ![k].replyRevision = row.revision, ![k].replyEdit = row.edit,
             ![k].replyKind = IF accepted THEN "ok" ELSE "conflict"]
  /\ UNCHANGED <<overviews, overviewRequest, otherWriter>>

WriteSuccess(k) ==
  /\ entries[k].stage = "response"
  /\ entries[k].replyKind = "ok"
  /\ overviewRequest < MaxOverviews
  /\ LET e == entries[k]
         current == AcceptOlderAcknowledgement \/ e.flight = e.seq
     IN entries' = [entries EXCEPT ![k] = [e EXCEPT
          !.confirmedRevision = e.replyRevision, !.confirmedEdit = e.replyEdit,
          !.acknowledged = IF e.flight > e.acknowledged THEN e.flight ELSE e.acknowledged,
          !.local = IF current THEN e.replyEdit ELSE e.local,
          !.persistence = IF current THEN "saved" ELSE e.persistence,
          !.flight = None, !.stage = "idle", !.drain = e.pending # None]]
  /\ overviewRequest' = overviewRequest + 1
  /\ overviews' = [overviews EXCEPT ![overviewRequest + 1].stage = "request"]
  /\ UNCHANGED <<database, otherWriter>>

WriteFailure(k) ==
  /\ entries[k].stage \in {"request", "response"}
  /\ LET e == entries[k]
         current == e.flight = e.seq
     IN entries' = [entries EXCEPT ![k] = [e EXCEPT
          !.pending = IF current
                      THEN IF ForgetFailedEdit THEN None ELSE e.flight
                      ELSE e.pending,
          !.persistence = IF current THEN "unsaved" ELSE e.persistence,
          !.flight = None, !.stage = "idle", !.drain = ~current /\ e.pending # None]]
  /\ UNCHANGED <<database, overviews, overviewRequest, otherWriter>>

WriteConflict(k) ==
  /\ entries[k].stage = "response"
  /\ entries[k].replyKind = "conflict"
  /\ LET e == entries[k]
     IN entries' = [entries EXCEPT ![k] = [e EXCEPT
          !.pending = IF e.flight = e.seq THEN e.flight ELSE e.pending,
          !.confirmedRevision = e.replyRevision, !.confirmedEdit = e.replyEdit,
          !.persistence = "conflict", !.conflictHeld = TRUE,
          !.flight = None, !.stage = "idle"]]
  /\ UNCHANGED <<database, overviews, overviewRequest, otherWriter>>

Drain(k) ==
  /\ entries[k].drain
  /\ entries' = [entries EXCEPT ![k] = Pump(@)]
  /\ UNCHANGED <<database, overviews, overviewRequest, otherWriter>>

Retry(k) ==
  /\ entries[k].persistence = "unsaved"
  /\ entries[k].pending # None
  /\ entries' = [entries EXCEPT ![k] = Pump(@)]
  /\ UNCHANGED <<database, overviews, overviewRequest, otherWriter>>

OtherWriter ==
  /\ ~otherWriter
  /\ database' = [database EXCEPT !["assessment"].revision = @ + 1,
                                    !["assessment"].edit = OtherEdit]
  /\ otherWriter' = TRUE
  /\ UNCHANGED <<entries, overviews, overviewRequest>>

CaptureOverview(i) ==
  /\ overviews[i].stage = "request"
  /\ overviews' = [overviews EXCEPT ![i] =
       [stage |-> "response", revision |-> database["assessment"].revision,
        edit |-> database["assessment"].edit]]
  /\ UNCHANGED <<entries, database, overviewRequest, otherWriter>>

InstallOverview(e, row) ==
  IF row.revision < e.confirmedRevision THEN e
  ELSE LET base == [e EXCEPT !.confirmedRevision = row.revision,
                             !.confirmedEdit = row.edit]
       IN IF e.pending # None
          THEN IF row.edit = e.pending
               THEN [base EXCEPT !.pending = None, !.local = row.edit, !.acknowledged = row.edit,
                      !.persistence = "saved", !.conflictHeld = FALSE]
               ELSE IF row.revision # e.confirmedRevision
                    THEN [base EXCEPT !.persistence = "conflict", !.conflictHeld = TRUE]
                    ELSE [base EXCEPT !.persistence =
                           IF PreserveRecovery /\ e.persistence \in {"unsaved", "conflict"}
                           THEN e.persistence ELSE "saving"]
          ELSE IF e.seq > 0 /\ e.local # e.confirmedEdit
               THEN IF row.revision # e.confirmedRevision
                    THEN [base EXCEPT !.persistence = "conflict", !.conflictHeld = TRUE]
                    ELSE base
               ELSE [base EXCEPT !.local = row.edit, !.persistence = "saved"]

DeliverOverview(i) ==
  /\ overviews[i].stage = "response"
  /\ entries' = IF i = overviewRequest /\ entries["assessment"].flight = None
                 THEN [entries EXCEPT !["assessment"] = InstallOverview(@, overviews[i])]
                 ELSE entries
  /\ overviews' = [overviews EXCEPT ![i].stage = "done"]
  /\ UNCHANGED <<database, overviewRequest, otherWriter>>

Next ==
  IF \E k \in Keys : entries[k].drain
  THEN \E k \in Keys : Drain(k)
  ELSE \/ \E k \in Keys : Save(k) \/ ServerReply(k) \/ WriteSuccess(k)
                           \/ WriteFailure(k) \/ WriteConflict(k) \/ Retry(k)
       \/ OtherWriter
       \/ \E i \in 1..MaxOverviews : CaptureOverview(i) \/ DeliverOverview(i)

LatestEditRecoverable ==
  \A k \in Keys : entries[k].seq > entries[k].acknowledged =>
    /\ entries[k].local = entries[k].seq
    /\ entries[k].seq \in {entries[k].pending, entries[k].flight, entries[k].confirmedEdit}

OnlyCurrentAcknowledged ==
  \A k \in Keys : entries[k].persistence = "saved" =>
    entries[k].acknowledged = entries[k].seq

RecoveryActionable ==
  \A k \in Keys : entries[k].pending # None /\ entries[k].flight = None
                  /\ ~entries[k].drain => entries[k].persistence \in {"unsaved", "conflict"}

ConflictActionable ==
  \A k \in Keys : entries[k].conflictHeld => entries[k].persistence = "conflict"

Spec == Init /\ [][Next]_vars
=============================================================================
