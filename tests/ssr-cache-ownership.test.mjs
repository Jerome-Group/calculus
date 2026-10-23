import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSsrServer } from "./helpers/ssr-server.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const options = {
  root,
  appType: "custom",
  configFile: false,
  cacheDir: join(root, "node_modules/.vite"),
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
};
const missing = (path) => assert.rejects(access(path), { code: "ENOENT" });

test("concurrent SSR owners retain independent caches and remove only their own", async (t) => {
  const owners = [{}, {}];
  await Promise.all(
    owners.map(async (owner) => {
      owner.vite = await createSsrServer(options, (teardown) => {
        owner.teardown = teardown;
        t.after(teardown);
      });
    }),
  );
  const [first, survivor] = owners;
  const firstCache = first.vite.config.cacheDir;
  const survivorCache = survivor.vite.config.cacheDir;
  assert.notEqual(firstCache, survivorCache, "Each SSR server owns a cache");
  assert.notEqual(
    firstCache,
    options.cacheDir,
    "Caller cache sharing is overridden",
  );
  for (const [index, owner] of owners.entries()) {
    await writeFile(join(owner.vite.config.cacheDir, "owner"), String(index));
    const { Formula } = await owner.vite.ssrLoadModule(
      "/components/atlas/math-text.tsx",
    );
    assert.match(
      renderToStaticMarkup(React.createElement(Formula, null, "x^2")),
      /<math/,
    );
  }

  await Promise.all([first.teardown(), first.teardown()]);
  await missing(firstCache);
  assert.equal(await readFile(join(survivorCache, "owner"), "utf8"), "1");
  const { capDecision } = await survivor.vite.ssrLoadModule(
    "/lib/curriculum/cap-orientation.ts",
  );
  assert.equal(
    capDecision({ closed: true, outward: true, regular: true }).totalFlux,
    16 * Math.PI,
  );
  await survivor.teardown();
  await missing(survivorCache);
  await survivor.teardown();
  await missing(survivorCache);
});

test("failed real Vite configuration removes its allocated cache and preserves the error", async () => {
  const failure = new Error("Configuration rejected");
  let cacheDir;
  await assert.rejects(
    createSsrServer(
      {
        ...options,
        plugins: [
          {
            name: "reject-ssr-configuration",
            configResolved(config) {
              cacheDir = config.cacheDir;
              throw failure;
            },
          },
        ],
      },
      () => assert.fail("A failed server cannot register teardown"),
    ),
    (error) => error === failure,
  );
  assert.ok(cacheDir, "Vite resolved the owned cache before setup failed");
  await missing(cacheDir);
});

test("a rejected teardown registrar closes the real server and removes its cache", async () => {
  const failure = new Error("Teardown registrar rejected");
  let cacheDir;
  let closed = false;
  await assert.rejects(
    createSsrServer(
      {
        ...options,
        plugins: [
          {
            name: "observe-ssr-rollback",
            configResolved(config) {
              cacheDir = config.cacheDir;
            },
            closeBundle() {
              closed = true;
            },
          },
        ],
      },
      () => {
        throw failure;
      },
    ),
    (error) => error === failure,
  );
  assert.ok(closed, "Vite plugin teardown ran before rollback returned");
  await missing(cacheDir);
});
