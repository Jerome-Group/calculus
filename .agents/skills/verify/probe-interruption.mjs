#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  evidenceDirectory,
  sourceSnapshot,
} from "../../../scripts/verification/revision.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const result = {
  schemaVersion: 1,
  command: "browser interruption probe",
  effects:
    "Builds the Worker, drives local Chromium, interrupts its owned CLI, and writes evidence.",
  status: "failed",
};
const stdout = [],
  stderr = [];
let child,
  closed,
  report,
  output,
  created,
  timer,
  failureCode = 2;
const read = (file) => readFile(path.join(output, "run", file));
const killOwned = () => {
  for (const pid of [child?.pid, report?.instance?.pid].filter(Boolean)) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
};
try {
  const { values } = parseArgs({ options: { output: { type: "string" } } });
  if (process.platform === "win32")
    throw new Error("The interruption probe requires POSIX process groups.");
  output = await evidenceDirectory(
    root,
    values.output ??
      path.join(root, "outputs/browser", `interruption-${Date.now()}`),
  );
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output);
  created = true;
  failureCode = 1;
  result.output = output;
  const source = await sourceSnapshot(root);
  child = spawn(
    process.execPath,
    [
      ".agents/skills/verify/cli.mjs",
      "run",
      "--features",
      "library,lessons",
      "--output",
      path.join(output, "run"),
      "--timeout-ms",
      "120000",
      "--json",
    ],
    { cwd: root, detached: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  closed = once(child, "close");
  child.stdout.on("data", (chunk) => stdout.push(chunk));
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const deadline = Date.now() + 125000;
  let activeLessons = false;
  while (
    child.exitCode === null &&
    child.signalCode === null &&
    Date.now() < deadline
  ) {
    try {
      report = JSON.parse(await read("report.json"));
      const events = (await read("lessons/events.jsonl"))
        .toString()
        .split("\n")
        .slice(0, -1)
        .map(JSON.parse);
      activeLessons =
        !report.completedAt &&
        !report.features.some((feature) => feature.id === "lessons") &&
        events.some((event) => event.kind === "action") &&
        events.some(
          (event) => event.kind === "assertion" && event.status === "passed",
        );
      if (activeLessons) break;
    } catch (error) {
      if (error.code !== "ENOENT" && !(error instanceof SyntaxError))
        throw error;
    }
    await delay(20);
  }
  assert.ok(
    activeLessons,
    "Reach a real Lessons action and observation before SIGINT.",
  );
  process.kill(child.pid, "SIGINT");
  timer = setTimeout(() => {
    result.forced = true;
    killOwned();
  }, 15000);
  const [exitCode, signal] = await closed;
  clearTimeout(timer);
  Object.assign(result, { exitCode, signal });
  report = JSON.parse(await read("report.json"));
  assert.ok(!result.forced, "Finish interrupted cleanup within 15 seconds.");
  assert.deepEqual([exitCode, signal], [1, null]);
  assert.equal(report.status, "failed");
  assert.equal(report.error, "Browser run interrupted by SIGINT.");
  assert.ok(
    Number.isFinite(Date.parse(report.completedAt)),
    "Save the final report.",
  );
  const doctor = report.liveDoctor;
  assert.ok(["passed", "failed"].includes(doctor?.status));
  if (doctor.status === "failed")
    assert.ok(
      doctor.error || doctor.processAlive === false,
      "Explain the live doctor failure.",
    );
  assert.deepEqual(report.cleanup, {
    processExited: true,
    scratchRemoved: true,
    portClosed: true,
  });
  const lesson = report.features.find((feature) => feature.id === "lessons");
  assert.equal(report.features[0].id, "library");
  assert.equal(report.features[0].status, "passed");
  assert.equal(
    lesson?.status,
    "failed",
    "Retain the interrupted feature result.",
  );
  const artifact = lesson.artifacts.find(
    (item) => item.label === "Interrupted state" && item.screenshot && item.dom,
  );
  assert.ok(artifact, "Capture the active page before closing it.");
  const png = await read(`lessons/${artifact.screenshot}`);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.match(
    (await read(`lessons/${artifact.dom}`)).toString(),
    /id="lesson-title"/,
  );
  assert.ok(lesson.traces.length, "Retain the interrupted context trace.");
  for (const trace of lesson.traces) {
    const zip = await read(`lessons/${trace}`);
    assert.equal(zip.subarray(0, 4).toString("hex"), "504b0304");
    assert.ok(
      zip.length >= 22 && zip.readUInt32LE(zip.length - 22) === 0x06054b50,
      "Finish the trace ZIP central directory.",
    );
  }
  assert.equal(report.sourceChanged, false);
  assert.deepEqual(report.source, source);
  assert.deepEqual(report.completedSource, source);
  assert.deepEqual(await sourceSnapshot(root), source);
  for (const pid of [child.pid, report.instance.pid])
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
  Object.assign(result, {
    status: "passed",
    interruption: report.error,
    cleanup: report.cleanup,
    activeFeature: lesson.id,
    traces: lesson.traces,
    sourceChanged: false,
  });
} catch (error) {
  result.error = error.message;
  process.exitCode = failureCode;
} finally {
  clearTimeout(timer);
  if (result.status !== "passed") killOwned();
  if (closed) await closed;
  if (created)
    await Promise.all([
      writeFile(path.join(output, "cli.stdout.log"), Buffer.concat(stdout)),
      writeFile(path.join(output, "cli.stderr.log"), Buffer.concat(stderr)),
      writeFile(
        path.join(output, "report.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      ),
    ]);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
