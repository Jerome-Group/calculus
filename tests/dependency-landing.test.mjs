import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  pinUpdate,
  hasVerdict,
} from "../scripts/merge-verified-dependency.mjs";

const oldSha = "a".repeat(40),
  newSha = "b".repeat(40),
  base = "c".repeat(40),
  patch = "d".repeat(40);
const files = [{ filename: ".github/workflows/ci.yml", status: "modified" }];
const diff = (
  oldAction = "actions/setup-node",
  newAction = oldAction,
  version = "7.1.0",
) =>
  "--- a/.github/workflows/ci.yml\n+++ b/.github/workflows/ci.yml\n" +
  "-      - uses: " +
  oldAction +
  "@" +
  oldSha +
  " # v7.0.0\n" +
  "+      - uses: " +
  newAction +
  "@" +
  newSha +
  " # v" +
  version;

test("only forward same-action patch/minor SHA pins qualify", () => {
  assert.deepEqual(pinUpdate(files, diff()), {
    action: "actions/setup-node",
    sha: newSha,
    tag: "v7.1.0",
  });
  assert.equal(
    pinUpdate(files, diff(undefined, undefined, "7.0.2")).tag,
    "v7.0.2",
  );
  for (const candidate of [
    diff("actions/setup-node", "stranger/replacement"),
    diff(undefined, undefined, "8.0.0"),
    diff(undefined, undefined, "6.9.9"),
    diff(undefined, undefined, "7.0.0"),
    diff() + "\n+        malicious-input: true",
    diff().replace(newSha, "v7.1.0"),
    diff().replace(newSha, oldSha),
    diff().replace(
      "+      - uses:",
      "+--- hidden-workflow-change\n+      - uses:",
    ),
  ])
    assert.equal(pinUpdate(files, candidate), null, candidate);
  for (const changed of [
    [{ ...files[0], status: "added" }],
    [{ ...files[0], filename: "app/page.tsx" }],
    [...files, { ...files[0], filename: ".github/workflows/other.yml" }],
  ])
    assert.equal(pinUpdate(changed, diff()), null);
});

test("named steps retain the same single-pin boundary", () => {
  const named =
    "--- a/.github/workflows/ci.yml\n+++ b/.github/workflows/ci.yml\n" +
    "       - name: Retain verification evidence\n" +
    "         if: always()\n" +
    "-        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1\n" +
    "+        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2\n" +
    "         with:\n" +
    "           name: calculus-verification\n";
  assert.deepEqual(pinUpdate(files, named), {
    action: "actions/upload-artifact",
    sha: "cf430e030ddbb5b0abf93d22962f4752f3646cd9",
    tag: "v7.0.2",
  });
  for (const candidate of [
    named.replace("+        uses:", "+      uses:"),
    named.replace("+        uses:", "+      - uses:"),
    named + "-          retention-days: 14\n+          retention-days: 1\n",
    named + "+permissions: write-all\n",
  ])
    assert.equal(pinUpdate(files, candidate), null, candidate);
});

test("independent approval is bound to exact head, base and patch", () => {
  const approved = {
    user: { id: 1 },
    author_association: "OWNER",
    state: "APPROVED",
    commit_id: newSha,
    body:
      "Independent verification: PASS\nHead: " +
      newSha +
      "\nBase: " +
      base +
      "\nPatch-id: " +
      patch,
  };
  assert.equal(hasVerdict([approved], newSha, base, patch), true);
  for (const changed of [
    { commit_id: oldSha },
    { author_association: "NONE" },
    { state: "COMMENTED" },
    { body: "Looks good" },
    { body: approved.body.replace(base, oldSha) },
    { body: approved.body.replace(patch, oldSha) },
  ])
    assert.equal(
      hasVerdict([{ ...approved, ...changed }], newSha, base, patch),
      false,
    );
  assert.equal(
    hasVerdict(
      [approved, { ...approved, state: "DISMISSED" }],
      newSha,
      base,
      patch,
    ),
    false,
  );
  assert.equal(
    hasVerdict(
      [approved, { ...approved, user: { id: 2 }, state: "CHANGES_REQUESTED" }],
      newSha,
      base,
      patch,
    ),
    false,
  );
});

test("CI events without a PR and invalid arguments cannot contact GitHub", () => {
  const fixture = mkdtempSync(join(tmpdir(), "calculus-landing-"));
  try {
    const event = join(fixture, "event.json");
    writeFileSync(event, "{}");
    const run = (...args) =>
      spawnSync(
        process.execPath,
        ["scripts/merge-verified-dependency.mjs", ...args],
        {
          encoding: "utf8",
          timeout: 5000,
          env: {
            PATH: fixture,
            GITHUB_REPOSITORY: "fixture/repository",
            GITHUB_EVENT_PATH: event,
          },
        },
      );
    const empty = run();
    assert.equal(empty.status, 0, empty.stderr);
    assert.equal(JSON.parse(empty.stdout).status, "skipped");
    const invalid = run("--unknown");
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /Usage:/);
    if (process.platform !== "win32") {
      writeFileSync(
        join(fixture, "gh"),
        '#!/bin/sh\ntest "$*" = "api repos/fixture/repository/pulls/42" || exit 91\nprintf \'%s\\n\' \'{"state":"closed"}\'\n',
        { mode: 0o755 },
      );
      writeFileSync(
        event,
        JSON.stringify({ issue: { number: 42, pull_request: {} } }),
      );
      const comment = run();
      assert.equal(comment.status, 0, comment.stderr);
      assert.equal(JSON.parse(comment.stdout).number, 42);
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("privileged landing loads its workflow from trusted default-branch events", () => {
  const workflow = readFileSync(
    ".github/workflows/dependabot-auto-merge.yml",
    "utf8",
  );
  const triggers = workflow.split("\non:\n")[1]?.split("\npermissions:")[0];
  assert.ok(triggers, "workflow declares an event contract");
  assert.deepEqual(
    [...triggers.matchAll(/^  ([a-z_]+):\s*$/gm)]
      .map((match) => match[1])
      .sort(),
    ["issue_comment", "workflow_run"],
  );
  assert.doesNotMatch(
    workflow,
    /pull_request_review\s*:/,
    "review events can load a PR-supplied privileged workflow",
  );
});
