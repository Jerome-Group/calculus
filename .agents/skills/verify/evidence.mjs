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
  const owners = [];
  const traces = [];
  let captureCount = 0;
  const record = async (kind, value) => {
    await appendFile(
      path.join(directory, "events.jsonl"),
      `${JSON.stringify({ at: new Date().toISOString(), kind, ...value })}\n`,
    );
  };
  const ownerFor = (page) => {
    const owner = owners.find((item) => item.page === page);
    if (!owner) throw new Error("An owned page is required.");
    return owner;
  };
  const closeOwner = (owner) =>
    (owner.closing ??= (async () => {
      const trace = `trace-${owner.id}.zip`;
      try {
        await owner.context.tracing.stop({ path: path.join(directory, trace) });
        traces.push(trace);
      } catch (failure) {
        assertions.push({
          description: "Retain the context trace",
          status: "failed",
          error: failure.message,
        });
      } finally {
        try {
          await owner.context.close();
          owner.released = true;
          await record("context-released", {
            context: owner.id,
            trace: traces.includes(trace) ? trace : null,
          });
        } catch (failure) {
          assertions.push({
            description: "Close the owned context",
            status: "failed",
            error: failure.message,
          });
        }
      }
    })());
  const e = {
    url: instance.url,
    viewportChunk: instance.viewportChunk,
    async newPage({
      storageUnavailable = false,
      account = instance.storage ? "verification-a" : null,
      ...options
    } = {}) {
      instance.signal?.throwIfAborted();
      const context = await browser.newContext({
        viewport: { width: 1365, height: 900 },
        ...options,
        extraHTTPHeaders: {
          ...(account
            ? {
                "oai-authenticated-user-id": account,
                "oai-authenticated-user-email": `${account}@example.invalid`,
              }
            : {}),
          ...options.extraHTTPHeaders,
        },
      });
      const owner = { id: owners.length + 1, context, released: false };
      owners.push(owner);
      const contextId = owner.id;
      if (instance.storage)
        injections.push({
          kind: "local-gateway-identity",
          context: contextId,
          account,
          hostedSignIn: false,
        });
      if (options.storageState?.origins)
        injections.push({
          kind: "legacy-device-input",
          keys: options.storageState.origins.flatMap((origin) =>
            origin.localStorage.map(({ name }) => name),
          ),
        });
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });
      instance.signal?.throwIfAborted();
      if (storageUnavailable) {
        injections.push({
          kind: "storage-unavailable",
          context: contextId,
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
      owner.page = page;
      if (instance.signal?.aborted) {
        await page.close();
        instance.signal.throwIfAborted();
      }
      page.setDefaultTimeout(8000);
      page.setDefaultNavigationTimeout(15000);
      const expected = (text, status, kind = "request") =>
        (account === null &&
          text.includes(`${instance.url}/api/study?scope=identity`) &&
          (!status || status === 401)) ||
        injections.some(
          (injection) =>
            injection.active &&
            injection.context === contextId &&
            ((injection.kind === "drawing-chunk-failure" &&
              text.split(/[\s"'<>()[\]]+/).includes(injection.url) &&
              (kind === "request" ||
                /Failed to fetch dynamically imported module/.test(text) ||
                (kind === "console" &&
                  /Failed to load resource/.test(text)))) ||
              (injection.kind.startsWith("account-") &&
                text.includes(`${instance.url}/api/study`) &&
                (!status || status === injection.status))),
        );
      page.on("console", (message) =>
        consoleMessages.push({
          type: message.type(),
          text: message.text(),
          location: message.location(),
          expected: expected(
            `${message.text()} ${message.location().url}`,
            undefined,
            "console",
          ),
          url: page.url(),
        }),
      );
      page.on("pageerror", (error) =>
        runtimeErrors.push({
          message: error.message,
          stack: error.stack,
          expected: expected(
            `${error.message} ${error.stack ?? ""}`,
            undefined,
            "runtime",
          ),
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
        requests.push({
          url: response.url(),
          status: response.status(),
          expected: expected(response.url(), response.status()),
        }),
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
    async capture(
      label,
      { timeoutMs = 5000, lastOnly = false, page: onlyPage } = {},
    ) {
      const selected = owners.filter(
        (owner) =>
          !owner.released &&
          owner.page &&
          (!onlyPage || owner.page === onlyPage),
      );
      for (const owner of lastOnly ? selected.slice(-1) : selected) {
        const { page } = owner;
        if (page.isClosed()) continue;
        const stem = `${String(++captureCount).padStart(3, "0")}-page-${owner.id}`;
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
    async releasePage(page, label = "Completed auxiliary scenario") {
      const owner = ownerFor(page);
      if (owner.released) return;
      try {
        await e.capture(label, { page });
      } finally {
        await closeOwner(owner);
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
        await Promise.allSettled(
          owners
            .filter((owner) => !owner.released && owner.page)
            .map(({ page }) => page.close()),
        );
        await captured;
      }
    },
    injectDrawingFailure(page) {
      const owner = ownerFor(page);
      const injection = {
        kind: "drawing-chunk-failure",
        context: owner.id,
        url: `${instance.url}/assets/${instance.viewportChunk}`,
        active: true,
      };
      injections.push(injection);
      return injection;
    },
    expectStudyFailure(kind, status, page) {
      if (!["offline", "conflict", "service"].includes(kind))
        throw new Error("Unknown study failure fixture.");
      const context = ownerFor(page).id;
      const injection = {
        kind: `account-${kind}`,
        context,
        status,
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
      for (const owner of owners) await closeOwner(owner);
      const unexpected = [
        ...runtimeErrors.filter((item) => !item.expected),
        ...consoleMessages.filter(
          (item) => item.type === "error" && !item.expected,
        ),
        ...requestFailures.filter((item) => !item.expected),
        ...requests.filter((item) => item.status >= 400 && !item.expected),
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
