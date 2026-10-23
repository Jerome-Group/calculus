import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));

test("SSR rendering fixtures pass while Vite's default WebSocket port is occupied", async () => {
  const listener = createServer();
  const owned = await new Promise((resolve, reject) => {
    listener.once("error", (error) =>
      error.code === "EADDRINUSE" ? resolve(false) : reject(error),
    );
    listener.listen(24678, () => resolve(true));
  });
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  try {
    const { stdout, stderr } = await execute(
      process.execPath,
      [
        "--test",
        "--test-reporter=tap",
        "tests/cap-orientation.test.mjs",
        "tests/study-account-session.test.mjs",
      ],
      {
        cwd: root,
        env: environment,
        timeout: 60_000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    assert.doesNotMatch(
      stdout + stderr,
      /WebSocket server error|Port 24678 is already in use/,
    );
    assert.match(stdout, /pass [1-9]\d*/);
  } finally {
    if (owned)
      await new Promise((resolve, reject) =>
        listener.close((error) => (error ? reject(error) : resolve())),
      );
  }
});
