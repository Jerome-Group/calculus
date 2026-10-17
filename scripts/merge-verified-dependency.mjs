#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function pinUpdate(files, diff) {
  if (
    files.length !== 1 ||
    files[0].status !== "modified" ||
    !/^\.github\/workflows\/[\w.-]+\.ya?ml$/.test(files[0].filename)
  )
    return null;
  const lines = diff
    .split("\n")
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+ |--- )/.test(line));
  if (lines.length !== 2) return null;
  const pattern =
    /^([+-])([ \t]*)- uses: ([\w.-]+\/[\w.-]+)@([a-f0-9]{40}) # v(\d+)\.(\d+)\.(\d+)$/;
  const before = lines.find((line) => line.startsWith("-"))?.match(pattern);
  const after = lines.find((line) => line.startsWith("+"))?.match(pattern);
  if (!before || !after || before[2] !== after[2] || before[3] !== after[3])
    return null;
  const oldVersion = before.slice(5).map(Number);
  const newVersion = after.slice(5).map(Number);
  if (
    [...oldVersion, ...newVersion].some(
      (part) => !Number.isSafeInteger(part),
    ) ||
    newVersion[0] !== oldVersion[0] ||
    !(
      newVersion[1] > oldVersion[1] ||
      (newVersion[1] === oldVersion[1] && newVersion[2] > oldVersion[2])
    ) ||
    before[4] === after[4]
  )
    return null;
  return { action: after[3], sha: after[4], tag: "v" + newVersion.join(".") };
}

export function hasVerdict(reviews, head, base, patchId) {
  const latest = new Map();
  for (const review of reviews) {
    if (
      !["OWNER", "MEMBER", "COLLABORATOR"].includes(review.author_association)
    )
      continue;
    if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state))
      latest.set(review.user.id, review);
  }
  if (
    [...latest.values()].some((review) => review.state === "CHANGES_REQUESTED")
  )
    return false;
  return [...latest.values()].some(
    (review) =>
      review.state === "APPROVED" &&
      review.commit_id === head &&
      /^Independent verification: PASS(?:\+NOTES)?$/m.test(review.body ?? "") &&
      (review.body ?? "").split("\n").includes("Head: " + head) &&
      (review.body ?? "").split("\n").includes("Base: " + base) &&
      (review.body ?? "").split("\n").includes("Patch-id: " + patchId),
  );
}

const gh = (args, input) =>
  execFileSync("gh", args, {
    encoding: "utf8",
    input,
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
const api = (route) => JSON.parse(gh(["api", route]));
const pages = (route) =>
  JSON.parse(gh(["api", "--paginate", "--slurp", route])).flat();

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== "--help")) {
    process.exitCode = 2;
    throw new Error(
      "Usage: node scripts/merge-verified-dependency.mjs [--help]",
    );
  }
  if (args[0] === "--help") {
    console.log(
      JSON.stringify({
        usage: "node scripts/merge-verified-dependency.mjs",
        environment: ["GITHUB_REPOSITORY", "GITHUB_EVENT_PATH", "GH_TOKEN"],
        effects:
          "Read GitHub metadata; immediately squash only an independently verified current dependency pin. Never queue or bypass rules.",
      }),
    );
    return;
  }
  const repository = process.env.GITHUB_REPOSITORY;
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(repository ?? "") ||
    !process.env.GITHUB_EVENT_PATH
  )
    throw new Error("GITHUB_REPOSITORY and GITHUB_EVENT_PATH are required.");
  const event = JSON.parse(
    await readFile(process.env.GITHUB_EVENT_PATH, "utf8"),
  );
  const numbers = event.pull_request
    ? [event.pull_request.number]
    : (event.workflow_run?.pull_requests ?? []).map((pr) => pr.number);
  if (!numbers.length)
    console.log(
      JSON.stringify({
        status: "skipped",
        reason: "Event has no pull requests.",
      }),
    );
  for (const number of [...new Set(numbers)]) {
    if (!Number.isSafeInteger(number) || number <= 0)
      throw new Error("Invalid pull request number.");
    const route = "repos/" + repository + "/pulls/" + number;
    const pr = api(route);
    const skip = (reason) =>
      console.log(JSON.stringify({ number, status: "skipped", reason }));
    if (
      pr.state !== "open" ||
      pr.draft ||
      pr.user.login !== "dependabot[bot]" ||
      pr.head.repo?.full_name !== repository ||
      pr.base.repo?.full_name !== repository ||
      pr.base.ref !== "main" ||
      !pr.head.ref.startsWith("dependabot/github_actions/")
    ) {
      skip("Not a same-repository Dependabot action update to main.");
      continue;
    }
    if (
      pr.auto_merge ||
      pr.mergeable !== true ||
      pr.mergeable_state !== "clean"
    ) {
      skip("Merge state is pending, stale, blocked, or already queued.");
      continue;
    }
    const diff = gh(["pr", "diff", String(number), "--repo", repository]);
    const update = pinUpdate(pages(route + "/files?per_page=100"), diff);
    if (!update) {
      skip("Diff is not one forward patch/minor action pin.");
      continue;
    }
    if (
      api("repos/" + update.action + "/commits/" + update.tag).sha !==
      update.sha
    ) {
      skip("Pin does not match the upstream release tag.");
      continue;
    }
    const base = api("repos/" + repository + "/git/ref/heads/main").object.sha;
    const patchId = execFileSync("git", ["patch-id", "--stable"], {
      input: diff,
      encoding: "utf8",
      timeout: 10000,
    })
      .trim()
      .split(/\s+/)[0];
    if (
      !hasVerdict(
        pages(route + "/reviews?per_page=100"),
        pr.head.sha,
        base,
        patchId,
      )
    ) {
      skip("No trusted independent verdict for this head, base, and patch.");
      continue;
    }
    let checks;
    try {
      checks = JSON.parse(
        gh([
          "pr",
          "checks",
          String(number),
          "--repo",
          repository,
          "--required",
          "--json",
          "name,state",
        ]),
      );
    } catch {
      skip("Required checks are pending, failing, or unavailable.");
      continue;
    }
    if (!checks.length || checks.some((check) => check.state !== "SUCCESS")) {
      skip("Every required check must explicitly succeed.");
      continue;
    }
    const current = api(route);
    const currentBase = api("repos/" + repository + "/git/ref/heads/main")
      .object.sha;
    if (
      current.head.sha !== pr.head.sha ||
      currentBase !== base ||
      current.base.ref !== "main" ||
      current.base.repo?.full_name !== repository ||
      current.state !== "open" ||
      current.mergeable_state !== "clean"
    ) {
      skip("Landing revision changed during verification.");
      continue;
    }
    const result = JSON.parse(
      gh(
        ["api", "--method", "PUT", route + "/merge", "--input", "-"],
        JSON.stringify({ sha: pr.head.sha, merge_method: "squash" }),
      ),
    );
    if (!result.merged)
      throw new Error("GitHub refused the immediate guarded merge.");
    const landed = api(route);
    if (
      !landed.merged ||
      landed.base.ref !== "main" ||
      landed.head.sha !== pr.head.sha
    )
      throw new Error(
        "Merge did not confirm the verified destination and head.",
      );
    console.log(
      JSON.stringify({
        number,
        status: "merged",
        head: pr.head.sha,
        base,
        patchId,
        mergeCommit: landed.merge_commit_sha,
      }),
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Dependency landing failed.",
    );
    process.exitCode ||= 1;
  });
}
