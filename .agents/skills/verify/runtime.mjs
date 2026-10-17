import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  access,
  mkdtemp,
  readFile,
  writeFile,
  rm,
  readdir,
} from "node:fs/promises";
import { constants } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { doctor } from "../../../scripts/verification/runner.mjs";

export async function browserDoctor(root, output) {
  const result = await doctor(root);
  for (const [id, file, mode, remediation] of [
    [
      "chromium",
      chromium.executablePath(),
      constants.X_OK,
      "Run npx playwright install chromium.",
    ],
    [
      "built-worker",
      path.join(root, "dist/server/index.js"),
      constants.R_OK,
      "Run npm run build.",
    ],
    [
      "built-assets",
      path.join(root, "dist/client"),
      constants.R_OK,
      "Run npm run build.",
    ],
    [
      "wrangler",
      path.join(root, "node_modules/wrangler/bin/wrangler.js"),
      constants.R_OK,
      "Run npm ci.",
    ],
  ]) {
    try {
      await access(file, mode);
      result.checks.push({ id, status: "passed", detail: file });
    } catch {
      result.checks.push({ id, status: "failed", detail: file, remediation });
    }
  }
  let directory = output;
  while (true) {
    try {
      await access(directory, constants.W_OK);
      result.checks.push({
        id: "evidence-writable",
        status: "passed",
        detail: directory,
      });
      break;
    } catch (error) {
      if (error.code === "ENOENT") directory = path.dirname(directory);
      else {
        result.checks.push({
          id: "evidence-writable",
          status: "failed",
          detail: error.message,
        });
        break;
      }
    }
  }
  result.command = "browser doctor";
  result.status = result.checks.every((check) => check.status === "passed")
    ? "passed"
    : "failed";
  return result;
}

async function availablePort(preferred = 0) {
  const socket = createServer();
  await new Promise((resolve, reject) =>
    socket.listen(preferred, "127.0.0.1", resolve).once("error", reject),
  );
  const port = socket.address().port;
  await new Promise((resolve, reject) =>
    socket.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

export async function startWorker(root, output, signal) {
  const scratch = await mkdtemp(path.join(os.tmpdir(), "calculus-browser-"));
  let child;
  let cleanup;
  let port;
  const stdout = [],
    stderr = [];
  let spawnError;
  const stop = () =>
    (cleanup ??= (async () => {
      if (child) {
        const kill = (kind) => {
          try {
            if (process.platform === "win32") child.kill(kind);
            else process.kill(-child.pid, kind);
          } catch (error) {
            if (error.code !== "ESRCH") throw error;
          }
        };
        if (child.exitCode === null && child.signalCode === null) {
          const closed = once(child, "close");
          kill("SIGTERM");
          const timer = setTimeout(() => kill("SIGKILL"), 1500);
          await closed;
          clearTimeout(timer);
        }
      }
      await Promise.all([
        writeFile(
          path.join(output, "worker.stdout.log"),
          Buffer.concat(stdout),
        ),
        writeFile(
          path.join(output, "worker.stderr.log"),
          Buffer.concat(stderr),
        ),
        rm(scratch, { recursive: true, force: true }),
      ]);
      let portClosed = true;
      if (port) {
        try {
          await availablePort(port);
        } catch (error) {
          if (error.code !== "EADDRINUSE") throw error;
          portClosed = false;
        }
      }
      return {
        processExited:
          !child || child.exitCode !== null || child.signalCode !== null,
        scratchRemoved: true,
        portClosed,
      };
    })());
  try {
    const config = JSON.parse(
      await readFile(path.join(root, "dist/server/wrangler.json"), "utf8"),
    );
    if (config.d1_databases?.length)
      throw new Error(
        "This device-local driver has no D1 migration contract. Add the account driver before verifying a database build.",
      );
    config.main = path.join(root, "dist/server/index.js");
    config.assets = {
      ...config.assets,
      directory: path.join(root, "dist/client"),
    };
    config.dev = { ...config.dev, enable_containers: false };
    config.build = undefined;
    const configPath = path.join(scratch, "wrangler.json");
    await writeFile(configPath, JSON.stringify(config));
    port = await availablePort();
    const args = [
      path.join(root, "node_modules/wrangler/bin/wrangler.js"),
      "dev",
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
      "--inspector-port",
      "0",
      "--persist-to",
      path.join(scratch, "state"),
      "--config",
      configPath,
    ];
    child = spawn(process.execPath, args, {
      cwd: scratch,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_WRITE_LOGS: "false",
        MINIFLARE_REGISTRY_PATH: path.join(scratch, "registry"),
      },
    });
    child.on("error", (error) => {
      spawnError = error;
    });
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    const instance = {
      child,
      url: `http://127.0.0.1:${port}`,
      scratch,
      stop,
      command: [process.execPath, ...args],
      ownsPort: () =>
        Buffer.concat(stdout)
          .toString()
          .includes(`Ready on http://127.0.0.1:${port}`),
    };
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      signal.throwIfAborted();
      if (spawnError) throw spawnError;
      const live = await inspectWorker(instance);
      if (live.status === "passed") {
        instance.ready = live;
        instance.viewportChunk = (
          await readdir(path.join(root, "dist/client/assets"))
        ).find((file) => /^viewport-.+\.js$/.test(file));
        if (!instance.viewportChunk)
          throw new Error("Built deferred viewport chunk is missing.");
        return instance;
      }
      if (child.exitCode !== null || child.signalCode !== null)
        throw new Error(
          `Worker exited before readiness. ${Buffer.concat(stderr).toString()}`,
        );
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(
      "Worker did not serve a usable Calculus page within 30 seconds.",
    );
  } catch (error) {
    error.cleanup = await stop();
    throw error;
  }
}

export async function inspectWorker(instance) {
  const processAlive =
    instance.child.exitCode === null && instance.child.signalCode === null;
  const ownedReadyLog = instance.ownsPort();
  let response;
  try {
    response = await fetch(instance.url, { signal: AbortSignal.timeout(1500) });
    const html = await response.text();
    return {
      status:
        processAlive &&
        ownedReadyLog &&
        response.ok &&
        html.includes("Calculus") &&
        html.includes("Graph studio")
          ? "passed"
          : "failed",
      processAlive,
      ownedReadyLog,
      url: instance.url,
      httpStatus: response.status,
      usablePage: html.includes("Graph studio"),
    };
  } catch (error) {
    return {
      status: "failed",
      processAlive,
      url: instance.url,
      error: error.message,
    };
  }
}
