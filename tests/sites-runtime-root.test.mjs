import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

for (const configuration of ["default", "absolute", "relative"]) {
  test(`Sites installer shares the ${configuration} runtime root`, () => {
    const fixture = mkdtempSync(
      join(realpathSync(tmpdir()), "calculus-runtime-root-"),
    );
    try {
      const project = join(fixture, "project");
      const scripts = join(project, "scripts");
      const bin = join(fixture, "bin");
      mkdirSync(scripts, { recursive: true });
      mkdirSync(bin);
      for (const name of ["sites-env.sh", "install-ci.sh"])
        copyFileSync(
          new URL(`../scripts/${name}`, import.meta.url),
          join(scripts, name),
        );
      for (const name of ["timeout", "curl", "sha256sum"])
        writeFileSync(
          join(bin, name),
          '#!/bin/sh\necho "Unexpected install command: $0" >&2\nexit 99\n',
          { mode: 0o755 },
        );
      writeFileSync(join(bin, "flock"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
      const runtimeRoot = join(
        configuration === "default" ? project : fixture,
        configuration === "default" ? ".sites-runtime" : "custom runtime",
      );
      const env = { PATH: `${bin}:${process.env.PATH}` };
      if (configuration !== "default")
        env.SITES_RUNTIME_ROOT =
          configuration === "relative" ? "custom runtime" : runtimeRoot;
      const result = spawnSync("bash", [join(scripts, "install-ci.sh")], {
        cwd: fixture,
        env,
        encoding: "utf8",
        timeout: 10_000,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 75, result.stdout + result.stderr);
      assert.ok(
        result.stdout.includes(
          `[sites] environment passed: HOME=${runtimeRoot}/home, cache=${runtimeRoot}/npm-cache`,
        ),
        result.stdout,
      );
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
}
