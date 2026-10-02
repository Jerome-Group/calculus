import assert from "node:assert/strict";
import test, { after } from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import katex from "katex";
import { sourceFingerprint } from "../scripts/verification/revision.mjs";
import { doctor, runCheck } from "../scripts/verification/runner.mjs";
import {
  browserPlan,
  validateBrowserEvidence,
} from "../scripts/verification/browser-plan.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const temp = await mkdtemp(path.join(os.tmpdir(), "calculus-verification-"));
after(() => rm(temp, { recursive: true, force: true }));
const cli = (...args) =>
  spawnSync(process.execPath, ["scripts/calculus.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
  });

const vite = await createServer({
  appType: "custom",
  configFile: false,
  cacheDir: path.join(temp, "vite-cache"),
  logLevel: "silent",
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => vite.close());
const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
const { learningGuides } = await vite.ssrLoadModule(
  "/lib/curriculum/learning.ts",
);
const { LessonContent } = await vite.ssrLoadModule(
  "/components/atlas/lesson-content.tsx",
);
const { Formula } = await vite.ssrLoadModule("/components/atlas/math-text.tsx");
const { libraryUrl, readLibraryHistory } = await vite.ssrLoadModule(
  "/components/atlas/library-history.ts",
);

test("CLI discovers commands as JSON and rejects misspelled commands/options", () => {
  const result = cli("help", "--json");
  assert.equal(result.status, 0);
  const help = JSON.parse(result.stdout);
  for (const name of [
    "doctor",
    "inventory",
    "map",
    "build",
    "test",
    "verify",
    "browser-plan",
  ])
    assert.ok(help.commands[name]);
  for (const args of [
    ["verfiy", "--json"],
    ["verify", "--profil", "ci", "--json"],
    ["verify", "--profile", "unknown", "--json"],
    ["verify", "--timeout-ms", "NaN", "--json"],
    ["doctor", "--check", "--json"],
  ]) {
    const failed = cli(...args);
    assert.equal(failed.status, 2, args.join(" "));
    assert.equal(JSON.parse(failed.stdout).status, "failed");
  }
});

test("doctor reports absent dependencies without installing or executing them", async () => {
  const result = await doctor(temp);
  assert.equal(result.status, "failed");
  assert.ok(
    result.checks.some(
      (check) => check.id === "dependencies" && check.status === "failed",
    ),
  );
  const failed = cli("doctor", "--root", temp, "--json");
  assert.equal(failed.status, 1);
  assert.equal(JSON.parse(failed.stdout).status, "failed");
});

test("bounded runner records real failure exits and kills a hung subprocess", async () => {
  const failed = await runCheck({
    id: "intentional-failure",
    args: ["-e", "process.stderr.write('fixture failure');process.exit(7)"],
    root: temp,
    output: temp,
    timeoutMs: 1000,
  });
  assert.equal(failed.status, "failed");
  assert.equal(failed.exitCode, 7);
  assert.match(
    await readFile(path.join(temp, failed.evidencePaths[1]), "utf8"),
    /fixture failure/,
  );
  const timeout = await runCheck({
    id: "intentional-timeout",
    args: ["-e", "setInterval(()=>{},1000)"],
    root: temp,
    output: temp,
    timeoutMs: 50,
  });
  assert.equal(timeout.status, "failed");
  assert.equal(timeout.timedOut, true);
  assert.ok(timeout.durationMs < 3000);
  const passed = await runCheck({
    id: "fixture-success",
    args: ["-e", "process.stdout.write('fixture evidence')"],
    root: temp,
    output: temp,
    timeoutMs: 1000,
  });
  assert.equal(passed.status, "passed");
  assert.equal(
    await readFile(path.join(temp, passed.evidencePaths[0]), "utf8"),
    "fixture evidence",
  );
});

test("browser evidence rejects malformed success and stale source fingerprints", async () => {
  assert.equal(
    browserPlan.journeys.filter((journey) =>
      journey.id.startsWith("comparison-"),
    ).length,
    7,
  );
  assert.ok(browserPlan.unverifiedByPlan.includes("learner mastery"));
  const source = {
    revision: "a".repeat(40),
    fingerprint: "b".repeat(64),
    dirty: true,
  };
  assert.ok(validateBrowserEvidence({}, source).length);
  const valid = {
    revision: source.revision,
    sourceFingerprint: source.fingerprint,
    sourceDirty: source.dirty,
    url: "http://localhost/#graph",
    viewport: { width: 1024, height: 768 },
    browser: "test browser",
    actions: ["Plot valid surface"],
    assertions: [{ description: "Visible finite geometry", status: "passed" }],
    consoleErrors: [],
    requestFailures: [],
    screenshots: ["outputs/graph.png"],
    result: "passed",
  };
  assert.deepEqual(validateBrowserEvidence(valid, source), []);
  for (const changed of [
    { url: "" },
    { url: "javascript:alert(1)" },
    { browser: " " },
    { viewport: { width: 0, height: 768 } },
    { viewport: { width: 20000, height: 768 } },
    { actions: [] },
    { actions: [null] },
    { assertions: ["not structured"] },
    { assertions: [{ description: "", status: "passed" }] },
    { assertions: [{ description: "Plot broken", status: "failed" }] },
    { screenshots: [42] },
    { consoleErrors: ["crash"] },
    { requestFailures: ["404"] },
    { sourceDirty: false },
    { sourceFingerprint: "c".repeat(64) },
    { revision: "c".repeat(40) },
  ])
    assert.ok(
      validateBrowserEvidence({ ...valid, ...changed }, source).length,
      JSON.stringify(changed),
    );
  const file = path.join(temp, "fingerprint-fixture.ts");
  await writeFile(file, "export const value=1;\n");
  const first = await sourceFingerprint(temp, ["fingerprint-fixture.ts"]);
  await writeFile(file, "export const value=2;\n");
  const second = await sourceFingerprint(temp, ["fingerprint-fixture.ts"]);
  assert.notEqual(
    first,
    second,
    "uncommitted source changes require a different fingerprint",
  );
  assert.equal(
    second,
    await sourceFingerprint(temp, ["fingerprint-fixture.ts"]),
  );
  assert.ok(
    validateBrowserEvidence(
      { ...valid, sourceFingerprint: first },
      { ...source, fingerprint: second },
    ).some((issue) => issue.includes("fingerprint differs")),
  );
});

function strictMath(value, locator) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g)) {
      assert.doesNotThrow(
        () =>
          katex.renderToString(match[1] ?? match[2], {
            throwOnError: true,
            strict: "error",
            trust: false,
          }),
        locator,
      );
    }
  } else if (Array.isArray(value))
    value.forEach((item, index) => strictMath(item, `${locator}[${index}]`));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) {
      if (
        ["tex", "equation", "solutionTex", "formula"].includes(key) &&
        typeof item === "string" &&
        item
      )
        assert.doesNotThrow(
          () =>
            katex.renderToString(item, {
              throwOnError: true,
              strict: "error",
              trust: false,
            }),
          `${locator}.${key}`,
        );
      strictMath(item, `${locator}.${key}`);
    }
}

test("every actual lesson renders accessible mathematical content and strictly parseable guide notation", () => {
  for (const concept of concepts) {
    strictMath(concept, concept.id);
    strictMath(learningGuides[concept.id], `${concept.id}.guide`);
    const html = renderToStaticMarkup(
      React.createElement(LessonContent, {
        study: { concept, open() {}, openPrerequisite() {}, plot() {} },
      }),
    );
    assert.match(html, /aria-label="Mathematical explanation"/, concept.id);
    assert.match(html, /id="notes-intuition"/, concept.id);
    assert.match(html, /id="notes-example"/, concept.id);
    assert.match(html, /id="notes-pitfall"/, concept.id);
    assert.doesNotMatch(html, /katex-error/, concept.id);
    const formula = renderToStaticMarkup(
      React.createElement(Formula, null, concept.formula),
    );
    assert.match(formula, /<math\b/, `${concept.id} formula MathML`);
    assert.doesNotMatch(formula, /katex-error/, concept.id);
  }
});

test("inventory JSON includes every current lesson route, gaps, tools, and honest test-reference provenance", () => {
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      ["scripts/calculus.mjs", "inventory", "--json"],
      { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    ),
  );
  assert.equal(result.status, "passed", result.issues.join("\n"));
  assert.deepEqual(
    result.lessons.map((lesson) => lesson.id),
    concepts.map((concept) => concept.id),
  );
  assert.equal(result.routes.length, concepts.length + 2);
  const library = result.routes.find((route) => route.id === "course");
  assert.equal(library.query, "library");
  const original = new URL("https://calculus.jeromegroup.org/");
  const target = new URL(
    libraryUrl(
      original,
      library.state.course[0],
      "x".repeat(library.state.query.maxLength),
    ),
    original,
  );
  assert.equal(target.searchParams.has(library.query), true);
  assert.equal(readLibraryHistory(target).value.version, library.stateVersion);
  assert.throws(() =>
    libraryUrl(
      original,
      library.state.course[0],
      "x".repeat(library.state.query.maxLength + 1),
    ),
  );
  target.searchParams.set(
    library.query,
    "x".repeat(library.restoration.maxEncodedLength + 1),
  );
  assert.equal(readLibraryHistory(target).kind, "invalid");
  assert.ok(result.tools.some((tool) => tool.name === "configure_graph"));
  assert.ok(result.outcomeLedger.atomic_outcomes.length);
  assert.ok(
    result.outcomeLedger.source_sections.some((section) => section.gap),
  );
  assert.ok(result.dependencies.every((dependency) => dependency.locked));
  assert.ok(
    result.tests.every((entry) => entry.basis.includes("static-discovery")),
  );
  assert.ok(
    result.limitations.some((line) =>
      line.includes("Learner participants unavailable"),
    ),
  );
});
