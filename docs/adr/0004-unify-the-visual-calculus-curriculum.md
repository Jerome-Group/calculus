# ADR-0004: One visual library with course study paths

Status: Accepted

## Context

MH1100, MH1101 and MH2100 share mathematical ideas but teach them in different sequences. A separate application per course would fragment navigation and duplicate experiments. The imported Atlas interface also devoted excessive space to a fixed graph and mixed typeset formulas with plain-text labels.

## Decision

Keep one Calculus library, with course-specific ordered units and global concept search. A lesson contains original concise explanations, explicit hypotheses, derivation/example/pitfall sections, an interactive canonical model, and citations identifying PDF pages and result labels when available. Optional textbook and external visual reading remain distinct from course alignment.

Use a black course sidebar, paper reading surface and cobalt experiment surface. The sidebar collapses; experiments offer split, wide and minimised layouts. KaTeX supplies visible mathematical notation and MathML, including graph-expression previews, live values, legends and axes. WebMCP uses the same state transitions as the controls.

Course PDFs and extracted text stay in the ignored local `course-materials/` cache. Git contains reference metadata and original explanations, not course documents. A source fingerprint identifies the locally checked file; a Drive link neither changes access nor guarantees that Drive will honour a PDF-page fragment.

Keep the existing Sites identity and public domain. Publish the reviewed source through the existing workflow.

## Consequences

A canonical model can support several related concepts; the notes identify its illustrative purpose. Numerical geometry is not a proof. Source mapping is explicit and testable, but mathematical correctness still requires review. The application does not track students or claim institutional endorsement.
