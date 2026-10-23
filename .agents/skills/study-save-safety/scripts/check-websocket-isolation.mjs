#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const execute = promisify(execFile);
const argument = process.argv.indexOf("--out");
const reportPath = resolve(
  root,
  argument < 0
    ? `outputs/formal-save-safety/websocket-${new Date().toISOString().replaceAll(":", "-")}-${process.pid}/summary.json`
    : process.argv[argument + 1],
);
const actualPath = join(dirname(reportPath), "actual.json");
const property = "RecoveryActionable";
const report = { property, port: 24678, owned: false, outcome: "BLOCKED" };
const listener = createServer();
await mkdir(dirname(reportPath), { recursive: true });

try {
  await new Promise((done, reject) => {
    listener.once("error", reject);
    listener.listen(report.port, done);
  });
  report.owned = true;
  report.address = listener.address();
  const result = await execute(
    process.execPath,
    [
      fileURLToPath(new URL("bridge.mjs", import.meta.url)),
      "--case",
      property,
      "--out",
      actualPath,
    ],
    { cwd: root, timeout: 15_000, maxBuffer: 8 * 1024 * 1024 },
  );
  report.bridge = { exitCode: 0, ...result };
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  report.actual = JSON.parse(await readFile(actualPath, "utf8"));
  assert.doesNotMatch(
    result.stdout + result.stderr,
    /WebSocket server error|Port 24678 is already in use/i,
  );
  assert.equal(report.actual.source, "lib/study/session.ts");
  assert.deepEqual(
    report.actual.results.map(({ property, outcome }) => ({
      property,
      outcome,
    })),
    [{ property, outcome: "PASS" }],
  );
  report.outcome = "PASS";
} catch (error) {
  report.outcome = error instanceof assert.AssertionError ? "FAIL" : "BLOCKED";
  report.error = error.stack;
  if (error.stdout !== undefined) {
    report.bridge = {
      exitCode: error.code,
      stdout: error.stdout,
      stderr: error.stderr,
    };
    process.stdout.write(error.stdout);
    process.stderr.write(error.stderr);
  }
  console.error(error.message);
  process.exitCode = 2;
} finally {
  if (report.owned)
    await new Promise((done, reject) =>
      listener.close((error) => (error ? reject(error) : done())),
    );
  report.listenerClosed = !listener.listening;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${report.outcome}: ${relative(root, reportPath)}`);
}
