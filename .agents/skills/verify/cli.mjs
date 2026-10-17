#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { features, selectFeatures } from "./features.mjs";
import { browserDoctor, inspectWorker, startWorker } from "./runtime.mjs";
import { featureEvidence } from "./evidence.mjs";
import {
  evidenceDirectory,
  sourceSnapshot,
} from "../../../scripts/verification/revision.mjs";
import { runCheck } from "../../../scripts/verification/runner.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));

export function parseBrowserArgs(args) {
  const command = args.shift() ?? "list";
  if (!["list", "doctor", "run"].includes(command))
    throw new Error("Browser command must be list, doctor, or run.");
  const options = { features: "all", timeoutMs: 240000 };
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (seen.has(flag)) throw new Error(`Duplicate browser option ${flag}.`);
    seen.add(flag);
    if (flag === "--json") options.json = true;
    else if (
      ["--features", "--output", "--timeout-ms"].includes(flag) &&
      args[i + 1] &&
      !args[i + 1].startsWith("--")
    ) {
      const value = args[++i];
      if (flag === "--features") options.features = value;
      if (flag === "--output") options.output = path.resolve(value);
      if (flag === "--timeout-ms") {
        if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 540000)
          throw new Error("Browser timeout must be 1 to 540000 milliseconds.");
        options.timeoutMs = Number(value);
      }
    } else throw new Error(`Unknown or missing browser option ${flag}.`);
  }
  if (command !== "run" && (seen.has("--features") || seen.has("--timeout-ms")))
    throw new Error("Browser selection and timeout require run.");
  if (command === "list" && seen.has("--output"))
    throw new Error("Browser list does not write output.");
  selectFeatures(options.features);
  return { command, options };
}

async function runBrowser(options) {
  const startedAt = new Date().toISOString();
  const output = await evidenceDirectory(
    root,
    options.output ??
      path.join(root, "outputs/browser", startedAt.replace(/[:.]/g, "-")),
  );
  const source = await sourceSnapshot(root);
  await mkdir(output, { recursive: true });
  const report = {
    schemaVersion: 1,
    command: "browser run",
    startedAt,
    source,
    output,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    features: [],
    status: "failed",
    limitations: [
      "Local built Worker and Chromium only.",
      "Device-local study storage; no account or hosted sign-in proof.",
      "No learner usability or mastery claim.",
    ],
  };
  const save = () =>
    writeFile(
      path.join(output, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
  await save();
  const controller = new AbortController();
  const abort = (signal) =>
    controller.abort(new Error(`Browser run interrupted by ${signal}.`));
  const onInt = () => abort("SIGINT"),
    onTerm = () => abort("SIGTERM");
  process.once("SIGINT", onInt);
  process.once("SIGTERM", onTerm);
  const timer = setTimeout(
    () => controller.abort(new Error("Browser run timed out.")),
    options.timeoutMs,
  );
  let instance, browser, activeEvidence;
  const closeOnAbort = async () => {
    await Promise.allSettled([
      activeEvidence?.capture("Interrupted state"),
      instance?.stop(),
    ]);
    await browser?.close();
  };
  controller.signal.addEventListener("abort", closeOnAbort, { once: true });
  try {
    report.build = await runCheck({
      id: "build",
      args: ["node_modules/vinext/dist/cli.js", "build"],
      root,
      output,
      timeoutMs: Math.min(90000, options.timeoutMs),
      signal: controller.signal,
    });
    controller.signal.throwIfAborted();
    report.prerequisites = await browserDoctor(root, output);
    if (
      report.build.status !== "passed" ||
      report.prerequisites.status !== "passed"
    )
      throw new Error(
        "Browser prerequisites failed. Inspect build logs and doctor checks.",
      );
    instance = await startWorker(root, output, controller.signal);
    report.instance = {
      url: instance.url,
      pid: instance.child.pid,
      command: instance.command,
      ready: instance.ready,
      freshState: true,
    };
    browser = await chromium.launch({ headless: true });
    report.environment.browser = browser.version();
    for (const feature of selectFeatures(options.features)) {
      controller.signal.throwIfAborted();
      activeEvidence = await featureEvidence(
        browser,
        instance,
        output,
        feature.id,
      );
      let error;
      try {
        const page = await activeEvidence.newPage();
        await feature.run(page, activeEvidence);
      } catch (failure) {
        error = failure;
      } finally {
        report.features.push(await activeEvidence.finish(error));
        activeEvidence = undefined;
        await save();
      }
    }
    controller.signal.throwIfAborted();
  } catch (error) {
    report.error = error.message;
    report.cleanup = error.cleanup;
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener("abort", closeOnAbort);
    process.removeListener("SIGINT", onInt);
    process.removeListener("SIGTERM", onTerm);
    if (instance) report.liveDoctor = await inspectWorker(instance);
    await browser?.close();
    if (instance) report.cleanup = await instance.stop();
    report.completedSource = await sourceSnapshot(root);
    report.sourceChanged =
      source.fingerprint !== report.completedSource.fingerprint ||
      source.revision !== report.completedSource.revision;
    report.completedAt = new Date().toISOString();
    report.status =
      !report.error &&
      !report.sourceChanged &&
      report.features.length === selectFeatures(options.features).length &&
      report.features.every((feature) => feature.status === "passed") &&
      report.liveDoctor?.status === "passed" &&
      report.cleanup?.processExited &&
      report.cleanup?.portClosed
        ? "passed"
        : "failed";
    report.recovery =
      "Inspect each feature result.json, events.jsonl, final screenshot/DOM and trace. Run npm run agent -- browser doctor, fix the observed cause, then rerun the same feature. Evidence survives cleanup.";
    await save();
  }
  return report;
}

export async function browserCommand(args) {
  const { command, options } = parseBrowserArgs([...args]);
  if (command === "list")
    return {
      schemaVersion: 1,
      command: "browser list",
      features: features.map(({ id, description }) => ({ id, description })),
      usage:
        "npm run agent -- browser run --features all --output outputs/browser/run",
      effects: "read-only registry discovery",
    };
  if (command === "doctor")
    return browserDoctor(
      root,
      options.output ?? path.join(root, "outputs/browser"),
    );
  return runBrowser(options);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const report = await browserCommand(process.argv.slice(2));
    process.stdout.write(
      `${JSON.stringify(report, null, process.argv.includes("--json") ? 0 : 2)}\n`,
    );
    if (["failed", "blocked"].includes(report.status)) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
