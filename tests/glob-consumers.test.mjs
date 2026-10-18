import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { observeGlobConsumers } from "./helpers/glob-consumers.mjs";

test("Next discovery and both dynamic distributions preserve ordered module behavior", async () => {
  const report = await observeGlobConsumers(
    fileURLToPath(new URL("../", import.meta.url)),
  );
  for (const { pattern, reports, warnings } of report.lint) {
    assert.equal(reports.length, 1, pattern);
    assert.equal(reports[0].ruleId, "next/no-html-link-for-pages");
    assert.deepEqual(warnings, []);
  }
  const top = [
    "$cash.js",
    "a.js",
    "dup.js",
    "file-link.js",
    "literal[1].js",
    "quoted,component.js",
    "with space.js",
  ];
  const paths = (names) => names.map((name) => `widgets/${name}`);
  const expected = [
    ["links/app-link"],
    ["app-root"],
    ["."],
    ["<fixture>/links/app-link"],
    ["app-root", "links/app-link"],
    paths([...top, "dir-link/index.js", "dup/index.js", "nested/index.js"]),
    paths([...top, "dir-link/b.js", "dir-link/index.js", "dup/index.js"]),
    paths(top).map((file) => `./${file}`),
    paths(top).map((file) => `../${file}`),
    ["widgets/literal[1].js"],
    ["assets/font.woff2x", "assets/image.jpegg"],
  ];
  for (const [index, row] of report.direct.entries()) {
    assert.deepEqual(row.next, expected[index], JSON.stringify(row.pattern));
    assert.deepEqual(row.dynamic, expected[index], JSON.stringify(row.pattern));
  }
  assert.deepEqual(report.dynamic.esm, report.dynamic.cjs);
  const modules = paths([
    ...top,
    "dir-link/b.js",
    "dir-link/index.js",
    "dup/index.js",
    "nested/b.js",
    "nested/index.js",
  ]).map((file) => `./${file}`);
  const imports = [
    modules,
    modules,
    modules,
    [],
    [],
    modules.filter(
      (file) => file.includes("dir-link/") || file.includes("nested/"),
    ),
    ["./widgets/$cash.js"],
    ["./assets/font.woff2x", "./assets/image.jpegg"],
  ];
  for (const [index, row] of report.dynamic.esm.entries()) {
    assert.deepEqual(row.files, imports[index], row.expression);
  }
  assert.equal(report.commonjs.esm.code, report.commonjs.cjs.code);
  const execution = {
    resolved: "widgets/dup.js",
    order: paths([
      "$cash.js",
      "a.js",
      "dup.js",
      "literal[1].js",
      "quoted,component.js",
      "with space.js",
      "nested/b.js",
      "nested/index.js",
      "dup/index.js",
    ]),
  };
  assert.deepEqual(report.commonjs.esm.execution, execution);
  assert.deepEqual(report.commonjs.cjs.execution, execution);
});
