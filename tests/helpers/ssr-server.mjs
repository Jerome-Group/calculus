import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";

async function closeAndRemove(vite, cacheDir) {
  let closeFailure;
  try {
    await vite?.close();
  } catch (error) {
    closeFailure = { error };
    throw error;
  } finally {
    try {
      await rm(cacheDir, { recursive: true, force: true });
    } catch (error) {
      if (closeFailure)
        throw new AggregateError(
          [closeFailure.error, error],
          "SSR server close and cache cleanup failed",
        );
      throw error;
    }
  }
}

export async function createSsrServer(options, registerAfter) {
  const cacheDir = await mkdtemp(join(tmpdir(), "calculus-ssr-"));
  let vite;
  let teardownPromise;
  const teardown = () => (teardownPromise ??= closeAndRemove(vite, cacheDir));
  try {
    vite = await createServer({
      ...options,
      cacheDir,
      plugins: [
        {
          name: "retain-ssr-fixture-owner",
          enforce: "pre",
          configureServer(server) {
            vite = server;
          },
        },
        ...(options.plugins ?? []),
      ],
    });
    registerAfter(teardown);
    return vite;
  } catch (error) {
    try {
      await teardown();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "SSR server setup and cleanup failed",
      );
    }
    throw error;
  }
}
