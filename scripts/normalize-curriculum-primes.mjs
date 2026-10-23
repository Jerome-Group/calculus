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
      if (/\^\s*(?:\{\s*)?$/.test(tex.slice(0, offset))) return run;
      runs++;
      return `^{${run}}`;
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
  function visit(node) {
    const string = ts.isStringLiteral(node);
    const template =
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node);
    if (string || template) {
      const replacement = normalizePrimes(
        string ? node.text : node.getText(parsed),
      );
      if (replacement.runs) {
        runs += replacement.runs;
        edits.push({
          start: node.getStart(parsed),
          end: node.end,
          text: string ? JSON.stringify(replacement.tex) : replacement.tex,
        });
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
