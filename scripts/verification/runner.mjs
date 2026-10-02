import { spawn } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

export async function doctor(root) {
  const checks = [
    {
      id: "node",
      status:
        Number(process.versions.node.split(".")[0]) >= 24 ? "passed" : "failed",
      detail: process.version,
      remediation: "Use Node.js 24 or later.",
    },
  ];
  for (const [id, file] of [
    ["dependencies", "node_modules/vite/package.json"],
    ["build-tool", "node_modules/vinext/package.json"],
    ["formatter", "node_modules/prettier/bin/prettier.cjs"],
    ["linter", "node_modules/eslint/bin/eslint.js"],
  ]) {
    try {
      await access(path.join(root, file));
      checks.push({ id, status: "passed", detail: file });
    } catch {
      checks.push({
        id,
        status: "failed",
        detail: file,
        remediation: "Run npm ci with Node.js 24 or later.",
      });
    }
  }
  return {
    schemaVersion: 1,
    command: "doctor",
    effects: "read-only filesystem/environment inspection",
    status: checks.some((check) => check.status === "failed")
      ? "failed"
      : "passed",
    checks,
  };
}

export async function runCheck({
  id,
  args,
  root,
  output,
  timeoutMs = 180000,
  executable = process.execPath,
}) {
  await mkdir(output, { recursive: true });
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const stdout = [],
    stderr = [];
  const result = await new Promise((resolve) => {
    let timedOut = false,
      spawnError = null,
      forceKill;
    const child = spawn(executable, args, {
      cwd: root,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    const kill = (signal) => {
      try {
        if (process.platform !== "win32") process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch {
        /* The child may already have exited. */
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      kill("SIGTERM");
      forceKill = setTimeout(() => kill("SIGKILL"), 1000);
    }, timeoutMs);
    child.on("error", (error) => {
      spawnError = error.message;
    });
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      clearTimeout(forceKill);
      resolve({ exitCode, signal, timedOut, spawnError });
    });
  });
  const evidencePaths = [`${id}.stdout.log`, `${id}.stderr.log`];
  await Promise.all([
    writeFile(path.join(output, evidencePaths[0]), Buffer.concat(stdout)),
    writeFile(path.join(output, evidencePaths[1]), Buffer.concat(stderr)),
  ]);
  return {
    id,
    status:
      result.exitCode === 0 && !result.timedOut && !result.spawnError
        ? "passed"
        : "failed",
    startedAt,
    durationMs: Math.round(performance.now() - started),
    command: [executable, ...args],
    ...result,
    evidencePaths,
  };
}

export function profileChecks(profile, testFiles, formatArgs) {
  const stages = [
    { id: "source-freshness", args: ["scripts/check-source-manifest.mjs"] },
    {
      id: "experience-map",
      args: ["scripts/calculus.mjs", "map", "--check", "--json"],
    },
  ];
  if (profile === "ci")
    stages.unshift(
      {
        id: "format",
        args: ["node_modules/prettier/bin/prettier.cjs", ...formatArgs],
      },
      {
        id: "lint",
        args: [
          "node_modules/eslint/bin/eslint.js",
          ".",
          "--ignore-pattern",
          "dist",
          "--ignore-pattern",
          ".next",
          "--ignore-pattern",
          ".sites-runtime",
        ],
      },
    );
  if (profile === "ci")
    stages.push({
      id: "build",
      args: ["node_modules/vinext/dist/cli.js", "build"],
    });
  stages.push({
    id: "tests",
    args: [
      "--test",
      "--test-reporter=tap",
      "--test-concurrency=2",
      ...testFiles,
    ],
  });
  return stages;
}
