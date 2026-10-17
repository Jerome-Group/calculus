import assert from "node:assert/strict";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function featureEvidence(browser, instance, output, id) {
  const directory = path.join(output, id);
  await mkdir(directory, { recursive: true });
  const actions = [],
    assertions = [],
    consoleMessages = [],
    runtimeErrors = [],
    requests = [],
    requestFailures = [],
    artifacts = [],
    injections = [];
  const contexts = [];
  const pages = [];
  let captureCount = 0;
  const record = async (kind, value) => {
    await appendFile(
      path.join(directory, "events.jsonl"),
      `${JSON.stringify({ at: new Date().toISOString(), kind, ...value })}\n`,
    );
  };
  const e = {
    url: instance.url,
    viewportChunk: instance.viewportChunk,
    async newPage({ storageUnavailable = false, ...options } = {}) {
      instance.signal?.throwIfAborted();
      const context = await browser.newContext({
        viewport: { width: 1365, height: 900 },
        ...options,
      });
      contexts.push(context);
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });
      instance.signal?.throwIfAborted();
      if (storageUnavailable) {
        injections.push({
          kind: "storage-unavailable",
          context: contexts.length,
        });
        await context.addInitScript(() => {
          for (const method of ["getItem", "setItem", "removeItem"])
            Storage.prototype[method] = () => {
              throw new DOMException(
                "Verification storage fixture",
                "SecurityError",
              );
            };
        });
      }
      const page = await context.newPage();
      if (instance.signal?.aborted) {
        await page.close();
        instance.signal.throwIfAborted();
      }
      page.setDefaultTimeout(8000);
      page.setDefaultNavigationTimeout(15000);
      pages.push(page);
      const expected = (text) =>
        injections.some(
          (injection) =>
            injection.active &&
            injection.kind === "drawing-chunk-failure" &&
            (text.includes(instance.viewportChunk) ||
              text.includes("Failed to fetch dynamically imported module")),
        );
      page.on("console", (message) =>
        consoleMessages.push({
          type: message.type(),
          text: message.text(),
          location: message.location(),
          expected: expected(`${message.text()} ${message.location().url}`),
          url: page.url(),
        }),
      );
      page.on("pageerror", (error) =>
        runtimeErrors.push({
          message: error.message,
          stack: error.stack,
          expected: expected(error.message),
          url: page.url(),
        }),
      );
      page.on("requestfailed", (request) =>
        requestFailures.push({
          url: request.url(),
          error: request.failure()?.errorText,
          expected: expected(request.url()),
        }),
      );
      page.on("response", (response) =>
        requests.push({ url: response.url(), status: response.status() }),
      );
      return page;
    },
    async step(description, action) {
      actions.push(description);
      await record("action", { description });
      try {
        await action();
        await record("action-result", { description, status: "passed" });
      } catch (error) {
        await record("action-result", {
          description,
          status: "failed",
          error: error.message,
        });
        throw error;
      } finally {
        await e.capture(description);
      }
    },
    async check(description, observe) {
      try {
        const actual = await observe();
        assert.notEqual(actual, false, description);
        assertions.push({ description, status: "passed" });
        await record("assertion", assertions.at(-1));
      } catch (error) {
        assertions.push({
          description,
          status: "failed",
          error: error.message,
        });
        await record("assertion", assertions.at(-1));
        throw error;
      }
    },
    async capture(label, { timeoutMs = 5000, lastOnly = false } = {}) {
      const selected = [...pages.entries()];
      for (const [index, page] of lastOnly ? selected.slice(-1) : selected) {
        if (page.isClosed()) continue;
        const stem = `${String(++captureCount).padStart(3, "0")}-page-${index + 1}`;
        const artifact = {
          label,
          url: page.url(),
          viewport: page.viewportSize(),
          screenshot: `${stem}.png`,
          dom: `${stem}.html`,
        };
        try {
          await page.screenshot({
            path: path.join(directory, artifact.screenshot),
            fullPage: true,
            timeout: timeoutMs,
            animations: "disabled",
          });
          await writeFile(
            path.join(directory, artifact.dom),
            await page.content(),
          );
          artifacts.push(artifact);
        } catch (error) {
          artifacts.push({ label, url: page.url(), error: error.message });
        }
      }
    },
    async interrupt() {
      const captured = e.capture("Interrupted state", {
        timeoutMs: 1000,
        lastOnly: true,
      });
      let timer;
      try {
        await Promise.race([
          captured,
          new Promise((resolve) => {
            timer = setTimeout(resolve, 2000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
        await Promise.allSettled(pages.map((page) => page.close()));
        await captured;
      }
    },
    injectDrawingFailure() {
      const injection = {
        kind: "drawing-chunk-failure",
        url: `${instance.url}/assets/${instance.viewportChunk}`,
        active: true,
      };
      injections.push(injection);
      return injection;
    },
    async finish(error) {
      if (
        error &&
        !assertions.some((assertion) => assertion.status === "failed")
      )
        assertions.push({
          description: "Complete the mapped journey",
          status: "failed",
          error: error.message,
        });
      await e.capture("Final state, including failure");
      const traces = [];
      for (const [index, context] of contexts.entries()) {
        const trace = `trace-${index + 1}.zip`;
        try {
          await context.tracing.stop({ path: path.join(directory, trace) });
          traces.push(trace);
        } catch (failure) {
          assertions.push({
            description: "Retain the context trace",
            status: "failed",
            error: failure.message,
          });
        } finally {
          await context.close();
        }
      }
      const unexpected = [
        ...runtimeErrors.filter((item) => !item.expected),
        ...consoleMessages.filter(
          (item) => item.type === "error" && !item.expected,
        ),
        ...requestFailures.filter((item) => !item.expected),
        ...requests.filter((item) => item.status >= 400),
      ];
      if (unexpected.length)
        assertions.push({
          description:
            "No unexpected runtime, console, request, or HTTP errors",
          status: "failed",
          errors: unexpected,
        });
      if (artifacts.some((artifact) => artifact.error))
        assertions.push({
          description: "Retain all screenshot and DOM checkpoints",
          status: "failed",
          errors: artifacts.filter((artifact) => artifact.error),
        });
      const result = {
        id,
        status:
          !error &&
          assertions.length > 0 &&
          assertions.every((item) => item.status === "passed")
            ? "passed"
            : "failed",
        error: error?.message,
        actions,
        assertions,
        artifacts,
        traces,
        injections,
        consoleMessages,
        runtimeErrors,
        requestFailures,
        requests,
      };
      await writeFile(
        path.join(directory, "result.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      );
      return result;
    },
  };
  return e;
}
