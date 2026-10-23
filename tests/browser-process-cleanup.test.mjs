import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { startWorker } from "../.agents/skills/verify/runtime.mjs";
import { runCheck } from "../scripts/verification/runner.mjs";

test(
  "cleanup stops an owned Worker after its launcher exits",
  { timeout: 10000, skip: process.platform === "win32" },
  async () => {
    const fixture = await mkdtemp(
      path.join(os.tmpdir(), "calculus-process-proof-"),
    );
    let instance;
    try {
      for (const directory of [
        "dist/server",
        "dist/client/assets",
        "node_modules/wrangler/bin",
        "evidence",
      ])
        await mkdir(path.join(fixture, directory), { recursive: true });
      await writeFile(path.join(fixture, "dist/server/wrangler.json"), "{}");
      await writeFile(
        path.join(fixture, "dist/client/assets/viewport-fixture.js"),
        "",
      );
      await writeFile(
        path.join(fixture, "node_modules/wrangler/bin/wrangler.js"),
        `
      const { spawn } = require('node:child_process');
      const port = Number(process.argv[process.argv.indexOf('--port') + 1]);
      const source = \
        "process.on('SIGTERM', () => {});" +
        "const http = require('node:http');" +
        "http.createServer((q, r) => r.end('Calculus Graph studio')).listen(" + port +
        ", '127.0.0.1', () => console.log('Ready on http://127.0.0.1:" + port + "'));";
      spawn(process.execPath, ['-e', source], { stdio: ['ignore', 'inherit', 'inherit'] });
      setInterval(() => {}, 1000);
    `,
      );
      instance = await startWorker(
        fixture,
        path.join(fixture, "evidence"),
        new AbortController().signal,
      );
      const exited = once(instance.child, "exit");
      process.kill(instance.child.pid, "SIGKILL");
      await exited;
      const cleanup = await instance.stop();
      assert.deepEqual(cleanup, {
        processExited: true,
        scratchRemoved: true,
        portClosed: true,
      });
      await assert.rejects(
        fetch(instance.url, { signal: AbortSignal.timeout(1000) }),
      );
    } finally {
      if (instance) {
        try {
          process.kill(-instance.child.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      }
      await rm(fixture, { recursive: true, force: true });
    }
  },
);

test(
  "a timed-out stage allows its owned Worker to finish cleanup",
  { timeout: 12000, skip: process.platform === "win32" },
  async () => {
    const fixture = await mkdtemp(
      path.join(os.tmpdir(), "calculus-stage-proof-"),
    );
    let owned;
    try {
      for (const directory of [
        "dist/server",
        "dist/client/assets",
        "node_modules/wrangler/bin",
        "evidence",
      ])
        await mkdir(path.join(fixture, directory), { recursive: true });
      await writeFile(path.join(fixture, "dist/server/wrangler.json"), "{}");
      await writeFile(
        path.join(fixture, "dist/client/assets/viewport-fixture.js"),
        "",
      );
      await writeFile(
        path.join(fixture, "node_modules/wrangler/bin/wrangler.js"),
        `
      process.on('SIGTERM', () => {});
      const port = Number(process.argv[process.argv.indexOf('--port') + 1]);
      require('node:http').createServer((q, r) => r.end('Calculus Graph studio'))
        .listen(port, '127.0.0.1', () => console.log('Ready on http://127.0.0.1:' + port));
    `,
      );
      const ready = path.join(fixture, "owned.json");
      const resultFile = path.join(fixture, "cleanup.json");
      const helper = path.join(fixture, "helper.mjs");
      await writeFile(
        helper,
        `
      import { writeFile } from 'node:fs/promises';
      import { startWorker } from ${JSON.stringify(new URL("../.agents/skills/verify/runtime.mjs", import.meta.url).href)};
      const instance = await startWorker(${JSON.stringify(fixture)}, ${JSON.stringify(path.join(fixture, "evidence"))}, new AbortController().signal);
      process.once('SIGTERM', async () => {
        await writeFile(${JSON.stringify(resultFile)}, JSON.stringify(await instance.stop()));
        process.exit(0);
      });
      await writeFile(${JSON.stringify(ready)}, JSON.stringify({ pid: instance.child.pid, url: instance.url, scratch: instance.scratch }));
      await new Promise(() => {});
    `,
      );
      const result = await runCheck({
        id: "timeout",
        args: [helper],
        root: fileURLToPath(new URL("..", import.meta.url)),
        output: path.join(fixture, "evidence"),
        timeoutMs: 1000,
      });
      owned = JSON.parse(await readFile(ready, "utf8"));
      assert.equal(result.timedOut, true);
      assert.equal(
        result.signal,
        null,
        "helper exits after cleanup rather than being force-killed",
      );
      assert.deepEqual(JSON.parse(await readFile(resultFile, "utf8")), {
        processExited: true,
        scratchRemoved: true,
        portClosed: true,
      });
      await assert.rejects(
        fetch(owned.url, { signal: AbortSignal.timeout(1000) }),
      );
    } finally {
      if (owned) {
        try {
          process.kill(-owned.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
        await rm(owned.scratch, { recursive: true, force: true });
      }
      await rm(fixture, { recursive: true, force: true });
    }
  },
);

test(
  "a signal error retains cleanup evidence and the original startup failure",
  { timeout: 12000, skip: process.platform === "win32" },
  async (t) => {
    const fixture = await mkdtemp(
      path.join(os.tmpdir(), "calculus-signal-proof-"),
    );
    const kill = process.kill.bind(process);
    const failedKills = new Set();
    let group;
    let stopping;
    let delayKill = true;
    let deliverKill;
    let acceptedKill;
    const killAccepted = new Promise((resolve) => {
      acceptedKill = resolve;
    });
    try {
      for (const directory of [
        "dist/server",
        "dist/client/assets",
        "node_modules/wrangler/bin",
        "evidence",
      ])
        await mkdir(path.join(fixture, directory), { recursive: true });
      await writeFile(path.join(fixture, "dist/server/wrangler.json"), "{}");
      const viewport = path.join(
        fixture,
        "dist/client/assets/viewport-fixture.js",
      );
      await writeFile(viewport, "");
      await writeFile(
        path.join(fixture, "node_modules/wrangler/bin/wrangler.js"),
        `
      const port = Number(process.argv[process.argv.indexOf('--port') + 1]);
      const server = require('node:http').createServer((q, r) => {
        r.end('Calculus Graph studio');
        r.on('finish', () => server.close());
      });
      server.listen(port, '127.0.0.1', () => console.log('Ready on http://127.0.0.1:' + port));
      setInterval(() => {}, 1000);
    `,
      );
      t.mock.method(process, "kill", (pid, signal) => {
        if (
          pid < 0 &&
          (signal === "SIGTERM" ||
            (signal === "SIGKILL" && !failedKills.has(pid)))
        ) {
          group = pid;
          if (signal === "SIGKILL") failedKills.add(pid);
          throw Object.assign(new Error("Controlled kill EPERM"), {
            code: "EPERM",
          });
        }
        if (pid < 0 && signal === "SIGKILL" && delayKill) {
          deliverKill = () => kill(pid, signal);
          acceptedKill();
          return true;
        }
        return kill(pid, signal);
      });
      const instance = await startWorker(
        fixture,
        path.join(fixture, "evidence"),
        new AbortController().signal,
      );
      const realSetTimeout = setTimeout;
      const exited = new Promise((resolve) =>
        instance.child.once("exit", resolve),
      );
      t.mock.timers.enable({ apis: ["setTimeout"] });
      stopping = instance.stop();
      t.mock.timers.tick(2500);
      await killAccepted;
      instance.child.emit(
        "error",
        Object.assign(new Error("Controlled close error"), { code: "EIO" }),
      );
      assert.equal(
        await Promise.race([
          stopping.then(() => "stopped"),
          new Promise((resolve) => realSetTimeout(resolve, 1000, "waiting")),
        ]),
        "waiting",
        "cleanup observes the final signal before returning its receipt",
      );
      delayKill = false;
      deliverKill();
      await exited;
      t.mock.timers.reset();
      const cleanup = await stopping;
      assert.equal(cleanup.processExited, true);
      assert.equal(cleanup.portClosed, true);
      assert.equal(cleanup.scratchRemoved, true);
      assert.deepEqual(cleanup.errors, [
        {
          operation: "SIGTERM",
          message: "Controlled kill EPERM",
          code: "EPERM",
        },
        {
          operation: "SIGKILL",
          message: "Controlled kill EPERM",
          code: "EPERM",
        },
        {
          operation: "process-close",
          message: "Controlled close error",
          code: "EIO",
        },
      ]);
      assert.match(
        await readFile(
          path.join(fixture, "evidence/worker.stdout.log"),
          "utf8",
        ),
        /Ready on http:\/\/127\.0\.0\.1:/,
      );
      await assert.rejects(
        fetch(instance.url, { signal: AbortSignal.timeout(1000) }),
      );
      await assert.rejects(
        readFile(path.join(instance.scratch, "wrangler.json")),
      );
      await rm(viewport);
      await assert.rejects(
        startWorker(
          fixture,
          path.join(fixture, "evidence"),
          new AbortController().signal,
        ),
        (error) => {
          assert.equal(
            error.message,
            "Built deferred viewport chunk is missing.",
          );
          assert.equal(error.cleanup.errors[0].code, "EPERM");
          assert.equal(error.cleanup.processExited, true);
          return true;
        },
      );
    } finally {
      t.mock.timers.reset();
      t.mock.restoreAll();
      if (group) {
        try {
          kill(group, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      }
      await stopping;
      await rm(fixture, { recursive: true, force: true });
    }
  },
);

test(
  "persistent signal errors return a bounded, truthful cleanup failure",
  { timeout: 5000, skip: process.platform === "win32" },
  async (t) => {
    const fixture = await mkdtemp(
      path.join(os.tmpdir(), "calculus-denied-signal-proof-"),
    );
    const kill = process.kill.bind(process);
    let instance;
    let stopping;
    try {
      for (const directory of [
        "dist/server",
        "dist/client/assets",
        "node_modules/wrangler/bin",
        "evidence",
      ])
        await mkdir(path.join(fixture, directory), { recursive: true });
      await writeFile(path.join(fixture, "dist/server/wrangler.json"), "{}");
      await writeFile(
        path.join(fixture, "dist/client/assets/viewport-fixture.js"),
        "",
      );
      await writeFile(
        path.join(fixture, "node_modules/wrangler/bin/wrangler.js"),
        `
      const port = Number(process.argv[process.argv.indexOf('--port') + 1]);
      const server = require('node:http').createServer((q, r) => {
        r.end('Calculus Graph studio');
        r.on('finish', () => server.close());
      });
      server.listen(port, '127.0.0.1', () => console.log('Ready on http://127.0.0.1:' + port));
      setInterval(() => {}, 1000);
    `,
      );
      instance = await startWorker(
        fixture,
        path.join(fixture, "evidence"),
        new AbortController().signal,
      );
      const closeListeners = instance.child.listenerCount("close");
      const errorListeners = instance.child.listenerCount("error");
      t.mock.method(process, "kill", (pid, signal) => {
        assert.equal(pid, -instance.child.pid);
        assert.ok(signal === "SIGTERM" || signal === "SIGKILL");
        throw Object.assign(new Error("Controlled permanent EPERM"), {
          code: "EPERM",
        });
      });
      t.mock.timers.enable({ apis: ["setTimeout"] });
      stopping = instance.stop();
      t.mock.timers.tick(2000);
      await new Promise(setImmediate);
      t.mock.timers.tick(500);
      const cleanup = await stopping;
      t.mock.timers.tick(10000);
      assert.deepEqual(cleanup, {
        processExited: false,
        scratchRemoved: true,
        portClosed: true,
        errors: ["SIGTERM", "SIGKILL", "SIGKILL"].map((operation) => ({
          operation,
          message: "Controlled permanent EPERM",
          code: "EPERM",
        })),
      });
      assert.equal(kill(instance.child.pid, 0), true);
      assert.equal(instance.child.listenerCount("close"), closeListeners);
      assert.equal(instance.child.listenerCount("error"), errorListeners);
    } finally {
      t.mock.timers.reset();
      t.mock.restoreAll();
      if (instance) {
        const closed = once(instance.child, "close");
        try {
          kill(-instance.child.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
        await closed;
      }
      await stopping;
      await rm(fixture, { recursive: true, force: true });
    }
  },
);
