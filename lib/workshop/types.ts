export type InvestigationId = "linear-bound" | "cubic-path" | "domain-loop";

export type Construction =
  | {
      readonly kind: "linear-bound";
      readonly p: string;
      readonly q: string;
      readonly bound: string;
      readonly epsilon: string;
    }
  | {
      readonly kind: "cubic-path";
      readonly exponent: string;
      readonly coefficient: string;
    }
  | {
      readonly kind: "domain-loop";
      readonly vertices: readonly (readonly [string, string])[];
    };

export type MathLine = { readonly tex: string; readonly spoken: string };
export type FieldIssue = { readonly field: string; readonly message: string };
type ReportContent = {
  readonly title: string;
  readonly scope: string;
  readonly steps: readonly MathLine[];
  readonly revisionPrompt: string;
};
export type ProofReport = ReportContent &
  (
    | {
        readonly kind: "universal-certificate";
        readonly coefficient: string;
        readonly epsilon: string;
        readonly delta: string;
      }
    | {
        readonly kind: "derivative-obstruction";
        readonly axis: "x" | "y";
        readonly sign: 1 | -1;
        readonly residual: string;
        readonly quadratic: 1 | 3;
      }
    | { readonly kind: "bound-obstruction"; readonly coefficient: string }
    | {
        readonly kind: "path-obstruction";
        readonly constant: string;
        readonly epsilon0: string;
        readonly coefficient: string;
      }
    | {
        readonly kind: "restricted-path";
        readonly exponent: number;
        readonly coefficient: string;
      }
    | {
        readonly kind: "loop-obstruction" | "one-loop-only";
        readonly winding: number;
        readonly circulation: string;
        readonly crossings: readonly number[];
      }
  );

export type Draft = {
  readonly construction: Construction;
  readonly explanation: string;
};
export type Attempt = {
  readonly id: symbol;
  readonly construction: Construction;
  readonly initialExplanation: string;
  readonly report: ProofReport;
  readonly revisions: readonly string[];
};
export type WorkshopState =
  | {
      readonly phase: "drafting";
      readonly draft: Draft;
      readonly history: readonly Attempt[];
      readonly issues: readonly FieldIssue[];
    }
  | {
      readonly phase: "inspected";
      readonly current: Attempt;
      readonly history: readonly Attempt[];
      readonly revisionDraft: string;
      readonly revisionProblem: string;
    };
export type WorkshopBook = Readonly<Record<InvestigationId, WorkshopState>>;
export type WorkshopAction =
  | { readonly type: "write"; readonly draft: Draft }
  | { readonly type: "check"; readonly id: InvestigationId }
  | { readonly type: "reconstruct"; readonly id: InvestigationId }
  | {
      readonly type: "write-revision";
      readonly id: InvestigationId;
      readonly text: string;
    }
  | {
      readonly type: "keep-revision";
      readonly id: InvestigationId;
      readonly attempt: symbol;
    };
