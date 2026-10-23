#!/usr/bin/env node
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { featureEvidence } from "./evidence.mjs";
import { graphObservation } from "./journeys/graph-observation.mjs";

class Page extends EventEmitter {
  closed = false;
  captures = 0;
  setDefaultTimeout() {}
  setDefaultNavigationTimeout() {}
  url() {
    return "http://127.0.0.1:1234/#graph";
  }
  isClosed() {
    return this.closed;
  }
  viewportSize() {
    return { width: 1365, height: 900 };
  }
  async screenshot({ path: file }) {
    this.captures++;
    await writeFile(file, "fixture screenshot");
  }
  async content() {
    return "<main>Fixture</main>";
  }
  async close() {
    this.closed = true;
  }
}

async function fixture(t) {
  const output = await mkdtemp(path.join(os.tmpdir(), "calculus-harness-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const contexts = [];
  const browser = {
    async newContext() {
      const page = new Page();
      const context = {
        page,
        closed: false,
        stops: 0,
        tracing: {
          async start() {},
          async stop({ path: file }) {
            context.stops++;
            await writeFile(file, "fixture trace");
          },
        },
        async newPage() {
          return page;
        },
        async close() {
          context.closed = true;
          await page.close();
        },
      };
      contexts.push(context);
      return context;
    },
  };
  const e = await featureEvidence(
    browser,
    {
      url: "http://127.0.0.1:1234",
      viewportChunk: "viewport-owned.js",
    },
    output,
    "control",
  );
  return { e, contexts, output };
}

test("Only the declared context and exact drawing chunk are expected", async (t) => {
  const { e } = await fixture(t);
  const owned = await e.newPage();
  const unrelated = await e.newPage();
  const injection = e.injectDrawingFailure(owned);
  const error = (page, message) => page.emit("pageerror", new Error(message));
  error(owned, `Failed to fetch dynamically imported module: ${injection.url}`);
  error(
    unrelated,
    `Failed to fetch dynamically imported module: ${injection.url}`,
  );
  error(owned, "Failed to fetch dynamically imported module");
  error(
    owned,
    `Failed to fetch dynamically imported module: ${injection.url}.other`,
  );
  error(owned, `Unrelated failure in ${injection.url}`);
  const result = await e.finish();
  assert.deepEqual(
    result.runtimeErrors.map(({ expected }) => expected),
    [true, false, false, false, false],
  );
  assert.equal(result.status, "failed");
});

test("Releasing an auxiliary retains its final checkpoint and trace once", async (t) => {
  const { e, contexts, output } = await fixture(t);
  const main = await e.newPage();
  const auxiliary = await e.newPage();
  await assert.rejects(e.releasePage(new Page()), /owned page/);
  await e.releasePage(auxiliary, "Completed control");
  assert.equal(auxiliary.captures, 1);
  assert.equal(contexts[1].closed, true);
  assert.equal(contexts[0].closed, false);
  await e.releasePage(auxiliary);
  await e.step("Continue only the active scenario", async () =>
    e.check("Control result", () => true),
  );
  const result = await e.finish();
  assert.equal(result.status, "passed");
  assert.equal(auxiliary.captures, 1);
  assert.equal(main.captures, 2);
  assert.deepEqual(
    contexts.map(({ stops }) => stops),
    [1, 1],
  );
  assert.deepEqual([...result.traces].sort(), ["trace-1.zip", "trace-2.zip"]);
  for (const trace of result.traces)
    assert.ok(await readFile(path.join(output, "control", trace)));
  assert.ok(
    result.artifacts.some(({ label }) => label === "Completed control"),
  );
});

test("Failure and interruption retain trace and cleanup evidence", async (t) => {
  const { e, contexts } = await fixture(t);
  await e.newPage();
  await e.interrupt();
  const result = await e.finish(new Error("Control interruption"));
  assert.equal(result.status, "failed");
  assert.equal(contexts[0].closed, true);
  assert.equal(contexts[0].stops, 1);
  assert.equal(result.traces.length, 1);
  assert.ok(
    result.artifacts.some(({ label }) => label === "Interrupted state"),
  );
});

test("Axes and stale or empty status cannot prove a plotted graph", () => {
  const priorDocument = globalThis.document,
    priorWindow = globalThis.window;
  let mode = "surface",
    status =
      "100/100 sampled points displayed · 162 approximate mesh triangles";
  const axis = {
    style: { fill: "none", stroke: "rgb(53,98,190)" },
    getAttribute: () => "M0,0L10,10",
  };
  const arrow = {
    style: { fill: "rgb(224,237,255)", stroke: "" },
    getAttribute: () => "M0,0L10,10L5,15z",
  };
  const mesh = {
    style: { fill: "rgb(80,180,200)", stroke: "" },
    getAttribute: () => "M0,0L10,10L5,15z",
  };
  const curve = {
    style: { fill: "none", stroke: "rgb(155,223,255)" },
    getAttribute: () => "M0,0L10,10",
  };
  let paths = [axis, arrow];
  globalThis.document = {
    querySelector: (selector) =>
      selector === ".graph-status"
        ? { textContent: status }
        : { querySelectorAll: () => paths },
  };
  globalThis.window = {
    location: {
      get href() {
        return `http://127.0.0.1/?graph=${encodeURIComponent(JSON.stringify({ graph: { mode } }))}#graph`;
      },
    },
  };
  try {
    assert.equal(graphObservation(), false);
    paths.push(mesh);
    const drawing = graphObservation();
    assert.ok(drawing);
    axis.getAttribute = () => "M1,1L20,20";
    assert.equal(graphObservation({ previousDrawing: drawing }), false);
    status = "0/100 sampled points displayed · 0 approximate mesh triangles";
    assert.equal(graphObservation(), false);
    mode = "curve";
    status = "1 sampled curve segments · 100 evaluations";
    assert.equal(graphObservation(), false);
    paths = [axis, arrow, curve];
    assert.ok(graphObservation());
    curve.getAttribute = () => "M0,0LNaN,Infinity";
    assert.equal(graphObservation(), false);
  } finally {
    globalThis.document = priorDocument;
    globalThis.window = priorWindow;
  }
});
