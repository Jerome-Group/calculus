import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const skill = fileURLToPath(new URL("../", import.meta.url));
const root = fileURLToPath(new URL("../../../../", import.meta.url));
const output = join(root, "outputs/formal-save-safety");
const cache = join(output, "cache");
const run = join(
  output,
  `run-${new Date().toISOString().replaceAll(":", "-")}-${process.pid}`,
);
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
const report = {
  source: {},
  formal: [],
  actual: [],
  mutations: [],
  outcome: "BLOCKED",
};
report.runtime = {
  node: process.versions.node,
  platform: process.platform,
  arch: process.arch,
};
await mkdir(run, { recursive: true });
await mkdir(cache, { recursive: true });

async function command(executable, args, name, timeout = 60000) {
  const child = spawn(executable, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (data) => {
    log += data;
  });
  child.stderr.on("data", (data) => {
    log += data;
  });
  const timer = setTimeout(() => child.kill("SIGTERM"), timeout);
  const code = await new Promise((done, reject) => {
    child.on("error", reject);
    child.on("close", (status, signal) => done({ status, signal }));
  }).finally(() => clearTimeout(timer));
  await writeFile(join(run, `${name}.log`), log);
  return { ...code, log };
}
async function checked(executable, args, name, timeout) {
  const result = await command(executable, args, name, timeout);
  if (result.status !== 0)
    throw new Error(
      `${name} exited ${result.status}: ${result.log.slice(-1500)}`,
    );
  return result;
}
async function download(url, destination, expected) {
  if (await exists(destination)) {
    if (sha256(await readFile(destination)) === expected) return;
    throw new Error(`Cached checksum mismatch: ${destination}`);
  }
  const temporary = `${destination}.${process.pid}.part`;
  await checked(
    "curl",
    [
      "--fail",
      "--location",
      "--silent",
      "--show-error",
      "--retry",
      "2",
      url,
      "--output",
      temporary,
    ],
    `download-${relative(cache, destination).replaceAll("/", "-")}`,
    300000,
  );
  const actual = sha256(await readFile(temporary));
  if (actual !== expected)
    throw new Error(`Downloaded checksum mismatch: ${actual} != ${expected}`);
  await rename(temporary, destination);
}
async function toolchain() {
  const pins = await json(join(skill, "scripts/toolchain.json"));
  const archive = pins.java.archives[`${process.platform}-${process.arch}`];
  if (!archive)
    throw new Error(
      `No pinned portable Java for ${process.platform}-${process.arch}`,
    );
  const jar = join(cache, "tla2tools.jar");
  await download(pins.tlc.url, jar, pins.tlc.sha256);
  const packedJava = join(cache, archive[0]);
  await download(`${pins.java.release}${archive[0]}`, packedJava, archive[1]);
  const javaRoot = join(
    cache,
    `temurin-${process.platform}-${process.arch}-${pins.java.version}`,
  );
  const home = process.platform === "darwin" ? "Contents/Home" : "";
  const java = join(javaRoot, home, "bin/java");
  if (!(await exists(java))) {
    await mkdir(javaRoot, { recursive: true });
    await checked(
      "tar",
      ["-xzf", packedJava, "-C", javaRoot, "--strip-components=1"],
      "extract-java",
    );
  }
  const version = await checked(java, ["-version"], "java-version");
  if (!version.log.includes(pins.java.version))
    throw new Error("Extracted JRE version differs from pin");
  report.toolchain = {
    tlc: pins.tlc,
    java: {
      version: pins.java.version,
      archive,
      executable: relative(root, java),
    },
  };
  return { java, jar };
}
function config(model, properties, overrides = {}) {
  const constants =
    model === "SaveQueue"
      ? {
          MaxEdits: 2,
          MaxOverviews: 4,
          PreserveRecovery: report.source.preserveRecovery,
          ForgetFailedEdit: false,
          AcceptOlderAcknowledgement: false,
        }
      : {
          MaxReads: 2,
          IgnoreEpoch: false,
          IgnoreOwner: false,
          IgnoreOverviewId: false,
        };
  Object.assign(constants, overrides);
  return [
    "SPECIFICATION Spec",
    "CONSTANTS",
    ...Object.entries(constants).map(
      ([key, value]) =>
        `${key} = ${typeof value === "boolean" ? String(value).toUpperCase() : value}`,
    ),
    ...properties.map((property) => `INVARIANT ${property}`),
    "CHECK_DEADLOCK FALSE",
    "",
  ].join("\n");
}
async function formal(
  tools,
  name,
  model,
  properties,
  overrides = {},
  expectedFailure,
) {
  const cfg = join(run, `${name}.cfg`);
  await writeFile(cfg, config(model, properties, overrides));
  const result = await command(
    tools.java,
    [
      "-XX:+UseParallelGC",
      "-Xmx512m",
      "-cp",
      tools.jar,
      "tlc2.TLC",
      "-config",
      cfg,
      "-workers",
      "1",
      "-fp",
      "0",
      "-seed",
      "1",
      "-metadir",
      join(run, `${name}-states`),
      "-noGenerateSpecTE",
      "-dumpTrace",
      "json",
      join(run, `${name}.trace.json`),
      join(skill, `model/${model}.tla`),
    ],
    name,
  );
  const failed = properties.find((property) =>
    result.log.includes(`Invariant ${property} is violated.`),
  );
  const passed =
    result.status === 0 &&
    result.log.includes("Model checking completed. No error has been found.");
  if (!passed && (!failed || result.status !== 12))
    throw new Error(
      `${name} is an infrastructure/model error, not an invariant failure: ${result.log.slice(-1800)}`,
    );
  if (expectedFailure && failed !== expectedFailure)
    throw new Error(
      `${name} failed to kill ${expectedFailure}; observed ${failed ?? "PASS"}`,
    );
  const states = result.log.match(
    /([\d,]+) states generated, ([\d,]+) distinct states found/,
  );
  const receipt = {
    name,
    model,
    properties,
    outcome: expectedFailure ? "KILLED" : passed ? "PASS" : "BUG",
    violated: failed,
    generated: states?.[1],
    distinct: states?.[2],
    exitCode: result.status,
    log: relative(root, join(run, `${name}.log`)),
  };
  (expectedFailure ? report.mutations : report.formal).push(receipt);
  console.log(
    `${receipt.outcome} TLC ${name}${failed ? ` (${failed})` : ` (${states?.[2]} distinct states)`}`,
  );
}
async function bridge(source, name, property) {
  const out = join(run, `${name}.json`);
  const args = [
    join(skill, "scripts/bridge.mjs"),
    "--source",
    source,
    "--out",
    out,
  ];
  if (property) args.push("--case", property);
  else
    for (const result of report.formal.filter((item) => item.outcome === "BUG"))
      args.push("--tlc-trace", join(run, `${result.name}.trace.json`));
  const result = await command(process.execPath, args, name);
  if (![0, 1].includes(result.status) || !(await exists(out)))
    throw new Error(`${name} bridge error: ${result.log.slice(-1600)}`);
  const receipt = await json(out);
  if (
    !receipt.results.length ||
    receipt.results.some((item) => !["PASS", "BUG"].includes(item.outcome))
  )
    throw new Error(`${name} produced no usable property result`);
  return {
    ...receipt,
    log: relative(root, join(run, `${name}.log`)),
    receipt: relative(root, out),
  };
}
function replaceOnce(source, before, after, name) {
  if (source.split(before).length !== 2)
    throw new Error(
      `${name} mutation anchor changed; review code and update mutation`,
    );
  return source.replace(before, after);
}
async function mutations(original) {
  const recoveryGuard = `} else if (
        value.persistence.kind !== "unsaved" &&
        value.persistence.kind !== "conflict"
      )
        value.persistence = saving;`;
  const variants = [
    {
      name: "forget-failed-edit",
      property: "LatestEditRecoverable",
      before: "value.pending = edit;",
      after: "value.pending = undefined;",
    },
    {
      name: "accept-older-ack",
      property: "OnlyCurrentAcknowledged",
      before: "if (edit.seq === value.seq) {",
      after: "if (true) {",
    },
    {
      name: "ignore-epoch",
      property: "EpochIsolation",
      before: "if (generation !== epoch) return false;",
      after: "",
    },
    {
      name: "ignore-overview-id",
      property: "LatestOverviewWins",
      before: "requestId !== overviewRequest || generation !== epoch",
      after: "generation !== epoch",
    },
    {
      name: "ignore-response-owner",
      property: "ResponseOwnerIsolation",
      before: "if (parsed.success && parsed.data.user?.id !== user?.id) {",
      after: "if (false) {",
    },
    {
      name: "erase-unsaved-recovery",
      property: "RecoveryActionable",
      before: recoveryGuard,
      after: "} else value.persistence = saving;",
    },
    {
      name: "erase-conflict-recovery",
      property: "ConflictActionable",
      before: recoveryGuard,
      after: "} else value.persistence = saving;",
    },
  ];
  for (const variant of variants) {
    const directory = join(run, "mutants", variant.name);
    await mkdir(directory, { recursive: true });
    const path = join(directory, "session.ts");
    await writeFile(
      path,
      replaceOnce(original, variant.before, variant.after, variant.name),
    );
    const result = await bridge(
      relative(root, path),
      `actual-${variant.name}`,
      variant.property,
    );
    const killed =
      result.results.length === 1 && result.results[0].outcome === "BUG";
    const evidence = {
      name: variant.name,
      property: variant.property,
      outcome: killed ? "KILLED" : "SURVIVED",
      before: variant.before,
      after: variant.after,
      sha256: sha256(await readFile(path)),
      ...result,
    };
    report.mutations.push(evidence);
    if (!killed)
      throw new Error(
        `${variant.name} survived its actual-code property check`,
      );
    console.log(
      `KILLED actual-code ${variant.name}: ${JSON.stringify(result.results[0].actual)}`,
    );
  }
}

try {
  if (Number(process.versions.node.split(".")[0]) < 24)
    throw new Error("Use Node.js 24+");
  const lock = await json(join(skill, "source-lock.json"));
  report.verification = {};
  for (const path of [
    "model/SaveQueue.tla",
    "model/ReadGuards.tla",
    "scripts/run.mjs",
    "scripts/bridge.mjs",
    "scripts/toolchain.json",
    "source-lock.json",
  ])
    report.verification[path] = sha256(await readFile(join(skill, path)));
  report.source = {
    syncCommit: lock.syncCommit,
    preserveRecovery: lock.preserveRecovery,
    files: {},
    drift: [],
  };
  for (const [path, expected] of Object.entries(lock.files)) {
    const actual = sha256(await readFile(join(root, path)));
    report.source.files[path] = actual;
    if (actual !== expected) report.source.drift.push(path);
  }
  if (report.source.drift.length)
    throw new Error(
      `DRIFT in ${report.source.drift.join(", ")}. Review covered code before updating source-lock.json and model correspondence.`,
    );
  const original = await readFile(join(root, "lib/study/session.ts"), "utf8");
  const tools = await toolchain();
  if (!(await exists(join(root, "node_modules/vite/package.json"))))
    await checked("npm", ["ci"], "npm-ci", 300000);
  await formal(tools, "queue-pass", "SaveQueue", [
    "LatestEditRecoverable",
    "OnlyCurrentAcknowledged",
  ]);
  await formal(tools, "recovery-actionable", "SaveQueue", [
    "RecoveryActionable",
  ]);
  await formal(tools, "conflict-actionable", "SaveQueue", [
    "ConflictActionable",
  ]);
  await formal(tools, "read-guards", "ReadGuards", [
    "EpochIsolation",
    "LatestOverviewWins",
    "ResponseOwnerIsolation",
  ]);
  const actual = await bridge("lib/study/session.ts", "actual-baseline");
  report.actual = actual;
  for (const result of actual.results)
    console.log(`${result.outcome} actual-code ${result.property}`);
  for (const replay of actual.counterexamples)
    console.log(
      `PASS actual-code TLC counterexample replay (${replay.comparedStates} states)`,
    );
  for (const result of actual.results) {
    const modeled = report.formal.find((item) =>
      item.properties.includes(result.property),
    );
    if ((modeled.outcome === "BUG") !== (result.outcome === "BUG"))
      throw new Error(
        `CONFORMANCE mismatch for ${result.property}: TLC=${modeled.outcome}, actual=${result.outcome}`,
      );
  }
  await formal(
    tools,
    "model-forget-failed-edit",
    "SaveQueue",
    ["LatestEditRecoverable"],
    { ForgetFailedEdit: true },
    "LatestEditRecoverable",
  );
  await formal(
    tools,
    "model-accept-older-ack",
    "SaveQueue",
    ["OnlyCurrentAcknowledged"],
    { AcceptOlderAcknowledgement: true },
    "OnlyCurrentAcknowledged",
  );
  await formal(
    tools,
    "model-erase-unsaved-recovery",
    "SaveQueue",
    ["RecoveryActionable"],
    { PreserveRecovery: false },
    "RecoveryActionable",
  );
  await formal(
    tools,
    "model-erase-conflict-recovery",
    "SaveQueue",
    ["ConflictActionable"],
    { PreserveRecovery: false },
    "ConflictActionable",
  );
  await formal(
    tools,
    "model-ignore-epoch",
    "ReadGuards",
    ["EpochIsolation"],
    { IgnoreEpoch: true },
    "EpochIsolation",
  );
  await formal(
    tools,
    "model-ignore-overview-id",
    "ReadGuards",
    ["LatestOverviewWins"],
    { IgnoreOverviewId: true },
    "LatestOverviewWins",
  );
  await formal(
    tools,
    "model-ignore-response-owner",
    "ReadGuards",
    ["ResponseOwnerIsolation"],
    { IgnoreOwner: true },
    "ResponseOwnerIsolation",
  );
  await mutations(original);
  const current = await readFile(join(root, "lib/study/session.ts"), "utf8");
  if (current !== original)
    throw new Error("Product source changed during verification");
  const restored = await bridge("lib/study/session.ts", "actual-restored");
  if (!sameOutcomes(actual, restored))
    throw new Error("Restored source outcomes differ from baseline");
  report.restored = {
    sourceUnchanged: true,
    receipt: restored.receipt,
    outcomes: restored.results.map(({ property, outcome }) => ({
      property,
      outcome,
    })),
  };
  report.outcome = report.formal.some((result) => result.outcome === "BUG")
    ? "BUG"
    : "PASS";
  process.exitCode = report.outcome === "BUG" ? 1 : 0;
} catch (error) {
  report.error = error.stack;
  console.error(error.message);
  process.exitCode = 2;
} finally {
  await writeFile(
    join(run, "summary.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeFile(join(output, "latest-run.txt"), `${relative(root, run)}\n`);
  console.log(
    `${report.outcome}: ${relative(root, join(run, "summary.json"))}`,
  );
}

function sameOutcomes(a, b) {
  return (
    JSON.stringify(
      a.results.map(({ property, outcome }) => ({ property, outcome })),
    ) ===
    JSON.stringify(
      b.results.map(({ property, outcome }) => ({ property, outcome })),
    )
  );
}
