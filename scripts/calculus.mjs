#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { readFile, writeFile, mkdir, readdir, access } from "node:fs/promises";
import path from "node:path";
import { sourceSnapshot } from "./verification/revision.mjs";
import { doctor, runCheck, profileChecks } from "./verification/runner.mjs";
import {
  browserPlan,
  validateBrowserEvidence,
} from "./verification/browser-plan.mjs";

const defaultRoot = fileURLToPath(new URL("..", import.meta.url));
const help = {
  schemaVersion: 1,
  usage: "node scripts/calculus.mjs <command> [options]",
  commands: {
    help: "Discover commands, effects, exit codes, evidence contracts.",
    doctor:
      "Read-only runtime/dependency prerequisites; --root supports external checkout inspection.",
    inventory:
      "Read live inventory using an isolated temporary Vite cache, removed afterward; --output writes JSON.",
    map: "Write deterministic data/experience-map.json; --check reads and fails on drift.",
    build:
      "Portable production build using installed Vinext directly; writes dist and evidence.",
    test: "Run complete Node test suite with bounded concurrency; requires existing production build.",
    verify:
      "Shared local/CI stages: --profile fast (source/map/targeted tests) or ci (format/lint/source/map/build/all tests).",
    "browser-plan":
      "Read machine-readable browser journeys and required evidence; no browser execution.",
    "browser-evidence":
      "Validate supplied observed browser report shape/revision; --input required. Does not independently verify observations.",
  },
  options: [
    "--json",
    "--output <file-or-directory>",
    "--profile <fast|ci>",
    "--timeout-ms <positive integer>",
    "--check",
    "--root <directory>",
    "--input <file>",
  ],
  exitCodes: {
    0: "passed/read successfully",
    1: "verification failed or prerequisites blocked",
    2: "invalid command/options",
  },
  defaults: {
    profile: "fast",
    perStageTimeoutMs: 180000,
    overallTimeoutMs: 540000,
    testConcurrency: 2,
    evidenceDirectory: "outputs/verification/<timestamp>",
  },
  evidence:
    "JSON report and per-stage stdout/stderr; browser evidence remains explicitly attributed observations.",
  limitations:
    "No participant-dependent claim; inventory references are discovery, not proof of behavioral coverage.",
};

function parse(args) {
  const command = args[0] ?? "help";
  if (!Object.hasOwn(help.commands, command))
    throw new Error(`Unknown command: ${command}`);
  const options = {};
  const switches = new Set(["--json", "--check"]);
  const valued = new Set([
    "--output",
    "--profile",
    "--timeout-ms",
    "--root",
    "--input",
  ]);
  for (let i = 1; i < args.length; i++) {
    const key = args[i];
    if (Object.hasOwn(options, key))
      throw new Error(`Duplicate option: ${key}`);
    if (switches.has(key)) options[key] = true;
    else if (valued.has(key)) {
      if (!args[i + 1] || args[i + 1].startsWith("--"))
        throw new Error(`Missing value: ${key}`);
      options[key] = args[++i];
    } else throw new Error(`Unknown option: ${key}`);
  }
  const allowed = {
    help: ["--json"],
    doctor: ["--json", "--root"],
    inventory: ["--json", "--output"],
    map: ["--json", "--check"],
    build: ["--json", "--output", "--timeout-ms"],
    test: ["--json", "--output", "--timeout-ms"],
    verify: ["--json", "--output", "--profile", "--timeout-ms"],
    "browser-plan": ["--json", "--output"],
    "browser-evidence": ["--json", "--input"],
  };
  for (const key of Object.keys(options))
    if (!allowed[command].includes(key))
      throw new Error(`${key} is not supported by ${command}`);
  if (options["--profile"] && !["fast", "ci"].includes(options["--profile"]))
    throw new Error("Profile must be fast or ci.");
  if (
    options["--timeout-ms"] &&
    (!/^\d+$/.test(options["--timeout-ms"]) ||
      Number(options["--timeout-ms"]) < 1 ||
      Number(options["--timeout-ms"]) > 540000)
  )
    throw new Error(
      "Timeout must be an integer from 1 to 540000 milliseconds.",
    );
  if (command === "browser-evidence" && !options["--input"])
    throw new Error("browser-evidence requires --input.");
  return { command, options };
}

async function saveJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function saveExperienceMap(file, value) {
  const prettier = await import("prettier");
  const config = await prettier.resolveConfig(file);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    await prettier.format(JSON.stringify(value), { ...config, parser: "json" }),
  );
}

async function execute(command, options) {
  const root = options["--root"]
    ? path.resolve(options["--root"])
    : defaultRoot;
  if (command === "help") return help;
  if (command === "doctor") return doctor(root);
  if (command === "browser-plan") {
    if (options["--output"])
      await saveJson(path.resolve(options["--output"]), browserPlan);
    return browserPlan;
  }
  if (command === "browser-evidence") {
    const value = JSON.parse(
      await readFile(path.resolve(options["--input"]), "utf8"),
    );
    const issues = validateBrowserEvidence(value, await sourceSnapshot(root));
    return {
      schemaVersion: 1,
      command,
      status: issues.length ? "failed" : value.result,
      validation:
        "shape-and-revision only; observations are not independently verified",
      issues,
      evidence: value,
    };
  }
  const prerequisites = await doctor(root);
  if (prerequisites.status !== "passed")
    return { schemaVersion: 1, command, status: "blocked", prerequisites };
  if (["inventory", "map"].includes(command)) {
    const { inventory, experienceMap, inventoryIssues } =
      await import("./verification/inventory.mjs");
    const value = await inventory(root);
    const issues = inventoryIssues(value);
    if (command === "inventory") {
      const result = {
        ...value,
        source: await sourceSnapshot(root),
        status: issues.length ? "failed" : "passed",
        issues,
      };
      if (options["--output"])
        await saveJson(path.resolve(options["--output"]), result);
      return result;
    }
    const file = path.join(root, "data/experience-map.json");
    const map = experienceMap(value);
    if (options["--check"]) {
      try {
        const actual = JSON.parse(await readFile(file, "utf8"));
        if (JSON.stringify(actual) !== JSON.stringify(map))
          issues.push(
            "Experience map drift: run node scripts/calculus.mjs map.",
          );
      } catch (error) {
        issues.push(`Experience map unavailable: ${error.message}`);
      }
    } else if (!issues.length) await saveExperienceMap(file, map);
    return {
      schemaVersion: 1,
      command,
      effects: options["--check"]
        ? "reads source using an isolated temporary Vite cache, removed afterward"
        : "writes Prettier-formatted data/experience-map.json using an isolated temporary Vite cache, removed afterward",
      status: issues.length ? "failed" : "passed",
      lessons: value.lessons.length,
      scenes: value.scenes.length,
      issues,
    };
  }
  if (command === "test") {
    try {
      await access(path.join(root, "dist/server/index.js"));
    } catch {
      return {
        schemaVersion: 1,
        command,
        status: "blocked",
        issues: [
          "Production build missing. Run node scripts/calculus.mjs build first.",
        ],
      };
    }
  }
  const source = await sourceSnapshot(root);
  const startedAt = new Date().toISOString();
  const output = path.resolve(
    options["--output"] ??
      path.join(root, "outputs/verification", startedAt.replace(/[:.]/g, "-")),
  );
  await mkdir(output, { recursive: true });
  const pkg = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  const testFiles = (await readdir(path.join(root, "tests")))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => `tests/${name}`);
  const profile = options["--profile"] ?? "fast";
  const formatArgs = [
    ...pkg.scripts["format:check"]
      .replace(/^prettier\s+/, "")
      .matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g),
  ].map((match) => match[1] ?? match[2] ?? match[3]);
  const targeted = [
    "curriculum",
    "audit-regressions",
    "study-history",
    "verification-cli",
  ].map((name) => `tests/${name}.test.mjs`);
  const stages =
    command === "build"
      ? [{ id: "build", args: ["node_modules/vinext/dist/cli.js", "build"] }]
      : command === "test"
        ? [
            {
              id: "tests",
              args: [
                "--test",
                "--test-reporter=tap",
                "--test-concurrency=2",
                ...testFiles,
              ],
            },
          ]
        : profileChecks(
            profile,
            profile === "ci" ? testFiles : targeted,
            formatArgs,
          );
  const checks = [],
    begun = performance.now();
  for (const stage of stages) {
    const remaining = 540000 - (performance.now() - begun);
    if (remaining <= 0) {
      checks.push({
        id: stage.id,
        status: "blocked",
        error: "Overall verification timeout reached.",
      });
      break;
    }
    const check = await runCheck({
      ...stage,
      root,
      output,
      timeoutMs: Math.min(Number(options["--timeout-ms"] ?? 180000), remaining),
    });
    checks.push(check);
    if (check.status !== "passed") break;
  }
  const completedSource = await sourceSnapshot(root);
  const sourceChanged = source.fingerprint !== completedSource.fingerprint;
  const result = {
    schemaVersion: 1,
    runId: startedAt,
    command,
    profile,
    revision: source.revision,
    source,
    completedSource,
    sourceChanged,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    startedAt,
    completedAt: new Date().toISOString(),
    status:
      !sourceChanged &&
      checks.length === stages.length &&
      checks.every((check) => check.status === "passed")
        ? "passed"
        : "failed",
    effects:
      "build writes dist; checks may write tool caches; evidence written to output directory",
    output,
    checks,
    summary: {
      passed: checks.filter((check) => check.status === "passed").length,
      failed: checks.filter((check) => check.status === "failed").length,
      total: stages.length,
    },
    unexecutedChecks: stages.slice(checks.length).map((stage) => stage.id),
    issues: sourceChanged
      ? [
          "Repository files changed during verification; rerun against a stable source fingerprint.",
        ]
      : [],
    coverage: {
      evidence:
        "Executed commands and assertions; static inventory references are not coverage proof.",
      unverified: browserPlan.unverifiedByPlan.concat(
        "Browser journeys require recorded observations from this revision.",
      ),
    },
  };
  await saveJson(path.join(output, "report.json"), result);
  return result;
}

try {
  const { command, options } = parse(process.argv.slice(2));
  const result = await execute(command, options);
  if (options["--json"]) process.stdout.write(`${JSON.stringify(result)}\n`);
  else if (command === "help")
    process.stdout.write(
      `${help.usage}\n\n${Object.entries(help.commands)
        .map(([name, description]) => `${name.padEnd(18)} ${description}`)
        .join("\n")}\n\nOptions: ${help.options.join(", ")}\n`,
    );
  else if (result.status) {
    const details = (result.checks ?? result.prerequisites?.checks ?? []).map(
      (check) =>
        `${check.id}: ${check.status}${check.status !== "passed" && check.remediation ? ` — ${check.remediation}` : ""}`,
    );
    if (result.lessons)
      details.push(
        `Lessons: ${Array.isArray(result.lessons) ? result.lessons.length : result.lessons}; models: ${Array.isArray(result.scenes) ? result.scenes.length : result.scenes}`,
      );
    if (command === "inventory")
      details.push("Full inventory: --json or --output <file>");
    if (result.output) details.push(`Evidence: ${result.output}`);
    details.push(...(result.issues ?? []));
    process.stdout.write(
      `${command}: ${result.status}\n${details.join("\n")}${details.length ? "\n" : ""}`,
    );
  } else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (["failed", "blocked"].includes(result.status)) process.exitCode = 1;
} catch (error) {
  const result = { schemaVersion: 1, status: "failed", error: error.message };
  if (process.argv.includes("--json"))
    process.stdout.write(`${JSON.stringify(result)}\n`);
  else
    process.stderr.write(
      `${error.message}\nRun node scripts/calculus.mjs help.\n`,
    );
  process.exitCode =
    /Unknown command|Unknown option|Missing value|Duplicate option|not supported|Profile must|Timeout must|requires --input/.test(
      error.message,
    )
      ? 2
      : 1;
}
