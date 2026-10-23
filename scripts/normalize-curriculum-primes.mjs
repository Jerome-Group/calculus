import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import ts from "typescript";

export const primeSources = [
  "lib/curriculum/concepts.json",
  "lib/curriculum/learning-guides.json",
  "lib/curriculum/sources.json",
  "lib/curriculum/outcome-ledger.json",
  "lib/atlas/scenes.ts",
  "lib/curriculum/readouts.ts",
  "lib/curriculum/planar/functions.ts",
];

export function normalizePrimes(tex) {
  let runs = 0;
  const normalized = tex.replace(
    /\\prime\b(?:\s*\\prime\b)*/g,
    (run, offset) => {
      const before = tex.slice(0, offset);
      if (/\^\s*\{\s*$/.test(before)) return run;
      const caret = /\^\s*$/.test(before);
      if (caret && run === "\\prime") return run;
      runs++;
      return `${caret ? "" : "^"}{${run}}`;
    },
  );
  return { tex: normalized, runs };
}

export function normalizePrimeSource(source, file = "content.json") {
  let runs = 0;
  const edits = [];
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".json") ? ts.ScriptKind.JSON : ts.ScriptKind.TS,
  );
  if (parsed.parseDiagnostics.length)
    throw new Error(
      `${file}: ${ts.flattenDiagnosticMessageText(parsed.parseDiagnostics[0].messageText, "\n")}`,
    );
  const options = { allowJs: true, noLib: true, noResolve: true };
  const checker = ts
    .createProgram([file], options, {
      ...ts.createCompilerHost(options),
      getSourceFile: (name) => (name === file ? parsed : undefined),
    })
    .getTypeChecker();
  function isRawTag(tag) {
    if (ts.isIdentifier(tag)) {
      const declaration = checker.getSymbolAtLocation(tag)?.valueDeclaration;
      if (
        !declaration ||
        !ts.isVariableDeclaration(declaration) ||
        !(declaration.parent.flags & ts.NodeFlags.Const) ||
        !declaration.initializer
      )
        return false;
      tag = declaration.initializer;
    }
    return (
      ts.isPropertyAccessExpression(tag) &&
      ts.isIdentifier(tag.expression) &&
      tag.expression.text === "String" &&
      tag.name.text === "raw" &&
      !checker.getSymbolAtLocation(tag.expression)
    );
  }
  function visit(node) {
    if (ts.isStringLiteral(node)) {
      const replacement = normalizePrimes(node.text);
      if (replacement.runs) {
        runs += replacement.runs;
        edits.push({
          start: node.getStart(parsed),
          end: node.end,
          text: JSON.stringify(replacement.tex),
        });
      }
    } else if (ts.isTemplateLiteralToken(node)) {
      const template = ts.isTemplateHead(node)
        ? node.parent
        : ts.isTemplateMiddle(node) || ts.isTemplateTail(node)
          ? node.parent.parent
          : node;
      const tag = ts.isTaggedTemplateExpression(template.parent)
        ? template.parent.tag
        : undefined;
      const start = node.getStart(parsed) + 1;
      const end =
        node.end -
        (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) ? 2 : 1);
      const rawText = source.slice(start, end);
      const raw = tag && isRawTag(tag);
      if (tag && !raw) {
        if (normalizePrimes(rawText).runs || normalizePrimes(node.text).runs)
          throw new Error(
            `${file}: unknown template tag ${tag.getText(parsed)}`,
          );
      } else {
        const replacement = normalizePrimes(raw ? rawText : node.text);
        if (replacement.runs) {
          runs += replacement.runs;
          edits.push({
            start,
            end,
            text: raw
              ? replacement.tex
              : JSON.stringify(replacement.tex)
                  .slice(1, -1)
                  .replace(/`|\$\{/g, "\\$&"),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  let normalized = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    normalized =
      normalized.slice(0, edit.start) + edit.text + normalized.slice(edit.end);
  return { source: normalized, runs };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const write = process.argv.includes("--write");
  const results = [];
  for (const file of primeSources) {
    const path = new URL(`../${file}`, import.meta.url);
    const input = await readFile(path, "utf8");
    const result = normalizePrimeSource(input, file);
    if (write && result.source !== input) await writeFile(path, result.source);
    results.push({ file, runs: result.runs });
  }
  process.stdout.write(
    `${JSON.stringify({ write, results, runs: results.reduce((sum, result) => sum + result.runs, 0) }, null, 2)}\n`,
  );
}
