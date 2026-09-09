import { parse } from "mathjs";
import { Formula } from "./math-text";
import { expression, type GraphSpec } from "@/lib/atlas/math";
export function expressionPreview(source: string) {
  expression(source);
  return parse(source).toTex({ parenthesis: "keep", implicit: "show" });
}
export function ExpressionPreview({ graph }: { graph: GraphSpec }) {
  let formula = "";
  let errorMessage = "";
  try {
    const parts = graph.expressions.map(expressionPreview);
    formula =
      graph.mode === "surface"
        ? `z=${parts[0]}`
        : graph.mode === "implicit"
          ? `${parts[0]}=0`
          : `\\mathbf r(${graph.mode === "curve" ? "t" : "u,v"})=\\begin{pmatrix}${parts.join("\\\\")}\\end{pmatrix}`;
  } catch (error) {
    errorMessage = (error as Error).message;
  }
  return errorMessage ? (
    <p className="expression-feedback" role="status">
      Preview: {errorMessage}
    </p>
  ) : (
    <div className="expression-preview" aria-label="Expression preview">
      <span className="label">YOUR EXPRESSION</span>
      <Formula block>{formula}</Formula>
    </div>
  );
}
