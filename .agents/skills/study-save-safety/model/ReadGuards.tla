---------------------------- MODULE ReadGuards ----------------------------
EXTENDS Naturals, TLC
CONSTANTS MaxReads, IgnoreEpoch, IgnoreOwner, IgnoreOverviewId
Owners == {"A", "B"}
NoOwner == "none"
VARIABLES epoch, user, cookieOwner, visible, viewOwner, overviewValue,
          overviewRequest, reads, cookieChanged, validated, validating, identityOwner,
          obsoleteEpochEffect, obsoleteOverviewEffect
vars == <<epoch, user, cookieOwner, visible, viewOwner, overviewValue,
          overviewRequest, reads, cookieChanged, validated, validating, identityOwner,
          obsoleteEpochEffect, obsoleteOverviewEffect>>

Init ==
  /\ epoch = 0 /\ user = "A" /\ cookieOwner = "A"
  /\ visible = TRUE /\ viewOwner = "A" /\ overviewValue = 0
  /\ overviewRequest = 0 /\ cookieChanged = FALSE
  /\ validated = FALSE /\ validating = FALSE
  /\ identityOwner = "A"
  /\ obsoleteEpochEffect = FALSE /\ obsoleteOverviewEffect = FALSE
  /\ reads = [r \in 1..MaxReads |->
       [stage |-> "unused", generation |-> 0, owner |-> NoOwner,
        scope |-> "lesson", requestId |-> 0]]

IssueRead(r, scope) ==
  /\ reads[r].stage = "unused" /\ visible /\ user \in Owners
  /\ reads' = [reads EXCEPT ![r] =
       [stage |-> "request", generation |-> epoch, owner |-> cookieOwner,
        scope |-> scope, requestId |-> IF scope = "overview" THEN overviewRequest + 1 ELSE 0]]
  /\ overviewRequest' = IF scope = "overview" THEN overviewRequest + 1 ELSE overviewRequest
  /\ UNCHANGED <<epoch, user, cookieOwner, visible, viewOwner, overviewValue,
       cookieChanged, validated, validating, identityOwner, obsoleteEpochEffect, obsoleteOverviewEffect>>

CaptureRead(r) ==
  /\ reads[r].stage = "request"
  /\ reads' = [reads EXCEPT ![r].stage = "response"]
  /\ UNCHANGED <<epoch, user, cookieOwner, visible, viewOwner, overviewValue,
       overviewRequest, cookieChanged, validated, validating, identityOwner,
       obsoleteEpochEffect, obsoleteOverviewEffect>>

ChangeCookie ==
  /\ ~cookieChanged /\ cookieOwner' = "B" /\ cookieChanged' = TRUE
  /\ UNCHANGED <<epoch, user, visible, viewOwner, overviewValue,
       overviewRequest, reads, validated, validating, identityOwner,
       obsoleteEpochEffect, obsoleteOverviewEffect>>

BeginValidate ==
  /\ ~validated /\ ~validating
  /\ epoch' = epoch + 1 /\ visible' = FALSE
  /\ validated' = TRUE /\ validating' = TRUE
  /\ identityOwner' = cookieOwner
  /\ UNCHANGED <<user, cookieOwner, viewOwner, overviewValue,
       overviewRequest, reads, cookieChanged, obsoleteEpochEffect, obsoleteOverviewEffect>>

IdentityResponse ==
  /\ validating
  /\ epoch' = IF user # identityOwner THEN epoch + 1 ELSE epoch
  /\ user' = identityOwner /\ visible' = TRUE /\ validating' = FALSE
  /\ viewOwner' = IF user # identityOwner THEN NoOwner ELSE viewOwner
  /\ overviewValue' = IF user # identityOwner THEN 0 ELSE overviewValue
  /\ UNCHANGED <<cookieOwner, overviewRequest, reads, cookieChanged, validated,
       identityOwner, obsoleteEpochEffect, obsoleteOverviewEffect>>

DeliverRead(r) ==
  /\ reads[r].stage = "response"
  /\ LET reply == reads[r]
         obsoleteEpoch == reply.generation # epoch
         obsoleteOverview == reply.scope = "overview" /\ reply.requestId # overviewRequest
         blocked == (~IgnoreEpoch /\ obsoleteEpoch)
                    \/ (~IgnoreOverviewId /\ obsoleteOverview)
         mismatch == ~blocked /\ ~IgnoreOwner /\ reply.owner # user
         installed == ~blocked /\ ~mismatch
     IN /\ reads' = [reads EXCEPT ![r].stage = "done"]
        /\ epoch' = IF mismatch THEN epoch + 2 ELSE epoch
        /\ user' = IF mismatch THEN NoOwner ELSE user
        /\ visible' = IF mismatch THEN FALSE ELSE visible
        /\ viewOwner' = IF mismatch THEN NoOwner
                         ELSE IF installed THEN reply.owner ELSE viewOwner
        /\ overviewValue' = IF mismatch THEN 0
                            ELSE IF installed /\ reply.scope = "overview" THEN r ELSE overviewValue
        /\ validating' = IF mismatch THEN TRUE ELSE validating
        /\ identityOwner' = IF mismatch THEN cookieOwner ELSE identityOwner
        /\ obsoleteEpochEffect' = (obsoleteEpochEffect
             \/ (obsoleteEpoch /\ ~blocked /\ (mismatch \/ installed)))
        /\ obsoleteOverviewEffect' = (obsoleteOverviewEffect
             \/ (obsoleteOverview /\ installed))
  /\ UNCHANGED <<cookieOwner, overviewRequest, cookieChanged, validated>>

Next ==
  \/ \E r \in 1..MaxReads, scope \in {"lesson", "overview"} : IssueRead(r, scope)
  \/ \E r \in 1..MaxReads : CaptureRead(r) \/ DeliverRead(r)
  \/ ChangeCookie \/ BeginValidate \/ IdentityResponse

EpochIsolation == ~obsoleteEpochEffect
LatestOverviewWins == ~obsoleteOverviewEffect
ResponseOwnerIsolation == visible => viewOwner \in {NoOwner, user}
Spec == Init /\ [][Next]_vars
=============================================================================
