import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readlink } from "node:fs/promises";
import path from "node:path";

export async function sourceSnapshot(root) {
  const git = (args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 16 * 1024 * 1024,
    });
  const revision = git(["rev-parse", "HEAD"]).trim();
  const dirty = git(["status", "--porcelain", "-z"]).length > 0;
  const files = [
    ...new Set(
      git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"])
        .split("\0")
        .filter(Boolean),
    ),
  ].sort();
  const fingerprint = await sourceFingerprint(root, files);
  return {
    revision,
    dirty,
    fingerprint,
    fileCount: files.length,
    basis:
      "SHA-256 of sorted tracked and nonignored files, including path, contents, symlink targets and deleted markers",
  };
}

export async function sourceFingerprint(root, files) {
  const hash = createHash("sha256");
  for (const file of [...new Set(files)].sort()) {
    hash.update(`${file}\0`);
    try {
      const location = path.join(root, file);
      const stat = await lstat(location);
      const kind = stat.isSymbolicLink() ? "symlink" : "file";
      const content = stat.isSymbolicLink()
        ? await readlink(location)
        : await readFile(location);
      hash.update(
        `${kind}:${Boolean(stat.mode & 0o111)}:${createHash("sha256").update(content).digest("hex")}`,
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      hash.update("<deleted>");
    }
    hash.update("\0");
  }
  return hash.digest("hex");
}
