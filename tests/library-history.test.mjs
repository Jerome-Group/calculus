import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { libraryUrl, readLibraryHistory } = await vite.ssrLoadModule(
  "/components/atlas/library-history.ts",
);

const shared = (value) => {
  const url = new URL("https://calculus.jeromegroup.org/#course");
  url.searchParams.set(
    "library",
    typeof value === "string" ? value : JSON.stringify(value),
  );
  return url;
};

test("library links restore all courses and exact search on share or reload", () => {
  for (const course of ["MH1100", "MH1101", "MH2100"]) {
    for (const query of [
      "",
      "ε δ + x & y #proof",
      "x".repeat(100),
      "\u0000".repeat(100),
    ]) {
      const original = new URL(
        "https://calculus.jeromegroup.org/learn?utm_source=notes&study=old&graph=old#derivative-definition",
      );
      const target = new URL(libraryUrl(original, course, query), original);
      assert.deepEqual(readLibraryHistory(target), {
        kind: "valid",
        value: { version: 1, course, query },
      });
      assert.deepEqual(
        readLibraryHistory(new URL(target.href)),
        readLibraryHistory(target),
      );
      assert.equal(target.hash, "#course");
      assert.equal(target.pathname, "/learn");
      assert.equal(target.searchParams.get("utm_source"), "notes");
      assert.equal(target.searchParams.has("study"), false);
      assert.equal(target.searchParams.has("graph"), false);
      assert.equal(original.hash, "#derivative-definition");
      assert.equal(original.searchParams.get("study"), "old");
    }
  }
});

test("legacy library URLs stay valid and malformed states explain safe fallback", () => {
  assert.deepEqual(
    readLibraryHistory(new URL("https://calculus.jeromegroup.org/#course")),
    { kind: "legacy" },
  );
  const invalid = [
    "{",
    "x".repeat(801),
    null,
    [],
    1,
    { version: 2, course: "MH1100", query: "" },
    { version: 1, course: "unknown", query: "" },
    { version: 1, course: ["MH1100"], query: "" },
    { version: 1, course: "MH1100", query: 1 },
    { version: 1, course: "MH1100", query: "x".repeat(101) },
    { version: 1, course: "MH1100", query: "", extra: true },
  ];
  for (const value of invalid) {
    const result = readLibraryHistory(shared(value));
    assert.equal(result.kind, "invalid");
    assert.match(result.explanation, /Showing Calculus I with an empty search/);
    assert.equal("value" in result, false);
  }
});

test("library writer rejects invalid input before creating a shared URL", () => {
  const url = new URL("https://calculus.jeromegroup.org/?graph=old#graph");
  assert.throws(() => libraryUrl(url, "unknown", ""), /unknown course/);
  assert.throws(
    () => libraryUrl(url, "MH1100", "x".repeat(101)),
    /100 characters/,
  );
  assert.throws(() => libraryUrl(url, "MH1100", null), /100 characters/);
  assert.equal(url.hash, "#graph");
  assert.equal(url.searchParams.get("graph"), "old");
});
