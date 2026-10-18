import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const braces = require("braces");
const packagePath = require.resolve("braces");

const expansionCases = [
  ["src/*.{js,ts}", ["src/*.js", "src/*.ts"], ["src/*.js", "src/*.ts"]],
  [
    "a/{b,}/{c,}/*",
    ["a/b/c/*", "a/b//*", "a//c/*", "a///*"],
    ["a/b/c/*", "a/b//*", "a//c/*", "a///*"],
  ],
  [
    "src/literal\\{a,b\\}.js",
    ["src/literal{a,b}.js"],
    ["src/literal\\{a,b\\}.js"],
  ],
  ["src/\\{a,b}/*.js", ["src/{a,b}/*.js"], ["src/\\{a,b}/*.js"]],
  [
    "src/{a\\,b,c}/*.js",
    ["src/a,b/*.js", "src/c/*.js"],
    ["src/a\\,b/*.js", "src/c/*.js"],
  ],
  [
    "src/{1..3}/*.js",
    ["src/1/*.js", "src/2/*.js", "src/3/*.js"],
    ["src/1/*.js", "src/2/*.js", "src/3/*.js"],
  ],
  [
    "src/{1..3..2}/*.js",
    ["src/1/*.js", "src/3/*.js"],
    ["src/1/*.js", "src/3/*.js"],
  ],
  [
    "src/{a,{b,c}}/*.js",
    ["src/a/*.js", "src/b/*.js", "src/c/*.js"],
    ["src/a/*.js", "src/b/*.js", "src/c/*.js"],
  ],
  [
    "src/{a,a,b}/*.js",
    ["src/a/*.js", "src/b/*.js"],
    ["src/a/*.js", "src/b/*.js"],
  ],
  ["src/{a,}/*.js", ["src/a/*.js", "src//*.js"], ["src/a/*.js", "src//*.js"]],
  [
    "src/escaped\\[1\\].{js,ts}",
    ["src/escaped[1].js", "src/escaped[1].ts"],
    ["src/escaped\\[1\\].js", "src/escaped\\[1\\].ts"],
  ],
];

const literals = [
  ['{"a,b",c}', "(a,b|c)", ["a,b", "c"], "{a,b,c}"],
  ['{"a,b}', "{a,b}", ["{a,b}"], "{a,b}"],
  ["{'a,b',c}", "(a,b|c)", ["a,b", "c"], "{a,b,c}"],
  ["{a\\,b,c}", "(a,b|c)", ["a,b", "c"], "{a,b,c}"],
  ["\\{a,b\\}", "{a,b}", ["{a,b}"], "{a,b}"],
  ["${a,b}", "${a,b}", ["${a,b}"], "${a,b}"],
  ["@(a|b)", "@(a|b)", ["@(a|b)"], "@(a|b)"],
  ["{a", "{a", ["{a"], "{a"],
  ["a}", "a}", ["a}"], "a}"],
  ["{,a}", "(|a)", ["", "a"], "{,a}"],
  ["{03..01}", "(0[1-3])", ["03", "02", "01"], "{03..01}"],
];

test("brace grammar preserves quotes, unmatched blocks, ranges and both escaping modes", () => {
  for (const [input, unescaped, escaped] of expansionCases) {
    for (const keepEscaping of [false, true]) {
      assert.deepEqual(
        braces(input, { expand: true, nodupes: true, keepEscaping }),
        keepEscaping ? escaped : unescaped,
        `${input}, keepEscaping=${keepEscaping}`,
      );
    }
  }
  for (const [input, compiled, expanded, stringified] of literals) {
    assert.equal(braces.compile(input), compiled, input);
    assert.deepEqual(braces.expand(input), expanded, input);
    assert.equal(braces.stringify(input), stringified, input);
  }
  const literal = "{".repeat(4500) + "a" + "}".repeat(4500);
  assert.deepEqual(braces.expand('"' + literal + '"'), [literal]);
  const escaped = "\\{".repeat(2250) + "a" + "\\}".repeat(2250);
  assert.deepEqual(braces.expand(escaped, { keepEscaping: true }), [escaped]);
  assert.deepEqual(braces.expand(escaped), [escaped.replaceAll("\\", "")]);
});

test("callable, array, create and public AST methods retain their contracts", () => {
  const input = "{a,{b,c}}";
  assert.deepEqual(braces(input), ["(a|(b|c))"]);
  assert.equal(braces.create(input), "(a|(b|c))");
  assert.deepEqual(braces.create(input, { expand: true }), ["a", "b", "c"]);
  assert.deepEqual(
    braces(["{a,b}", "{b,c}"], { expand: true, nodupes: true }),
    ["a", "b", "c"],
  );
  assert.deepEqual(braces.create(""), [""]);
  assert.deepEqual(braces.create("ab"), ["ab"]);
  assert.equal(braces.compile(braces.parse(input)), "(a|(b|c))");
  assert.deepEqual(braces.expand(braces.parse(input)), ["a", "b", "c"]);
  assert.equal(braces.stringify(braces.parse(input)), input);
  assert.equal(braces.stringify(braces.parse(input).nodes[1]), input);
  assert.deepEqual(braces.expand("{,a,a}", { noempty: true, nodupes: true }), [
    "a",
  ]);
  assert.throws(() => require("braces/lib/compile"), {
    code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
  });
});

function boundedChild(body) {
  const script = `const assert = require("node:assert/strict");
const braces = require(${JSON.stringify(packagePath)});
${body}`;
  const child = spawnSync(
    process.execPath,
    ["--max-old-space-size=128", "-e", script],
    {
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 8192,
    },
  );
  assert.equal(child.error, undefined, child.error?.message);
  assert.equal(child.signal, null, child.stderr);
  assert.equal(child.status, 0, child.stderr);
}

test("fixed depth accepts 127 and 128 containers, rejects 129 through every string entry", () => {
  boundedChild(`
for (const [open, close] of [["{", "}"], ["(", ")"]]) {
  for (const depth of [127, 128, 129, 4500]) {
    const input = open.repeat(depth) + "a,b" + close.repeat(depth);
    for (const api of [braces, braces.create, braces.parse, braces.compile, braces.expand, braces.stringify]) {
      if (depth <= 128) assert.doesNotThrow(() => api(input));
      else assert.throws(() => api(input, { maxDepth: Infinity, rangeLimit: false }), { name: "RangeError", code: "ERR_BRACES_DEPTH_LIMIT" });
    }
  }
}
const parserStringify = "{" + "(".repeat(128) + "1..2,";
assert.throws(() => braces.parse(parserStringify), { code: "ERR_BRACES_DEPTH_LIMIT" });
`);
});

test("supplied AST depth and parent chains have the same fixed boundary", () => {
  boundedChild(`
function nested(depth) {
  const ast = { type: "root", nodes: [] };
  let node = ast;
  for (let index = 0; index < depth; index++) {
    const child = { type: "paren", nodes: [], parent: node };
    node.nodes.push(child);
    node = child;
  }
  node.nodes.push({ type: "text", value: "a", parent: node });
  return ast;
}
for (const depth of [127, 128, 129, 4500]) {
  for (const api of [braces.compile, braces.expand, braces.stringify]) {
    const ast = nested(depth);
    if (depth <= 128) assert.doesNotThrow(() => api(ast));
    else assert.throws(() => api(ast), { name: "RangeError", code: "ERR_BRACES_DEPTH_LIMIT" });
  }
}
for (const depth of [128, 129, 130]) {
  for (const api of [braces.compile, braces.expand, braces.stringify]) {
    const ast = { type: "root", nodes: [] };
    let ancestor = ast;
    for (let index = 0; index < depth; index++) ancestor = ancestor.parent = {};
    if (depth <= 129) assert.doesNotThrow(() => api(ast));
    else assert.throws(() => api(ast), { code: "ERR_BRACES_DEPTH_LIMIT" });
  }
}
const detached = nested(128).nodes[0];
detached.parent = undefined;
assert.doesNotThrow(() => braces.compile(detached));
detached.nodes[0].nodes.push(nested(128));
assert.throws(() => braces.stringify(detached), { code: "ERR_BRACES_DEPTH_LIMIT" });
`);
});

test("cycles and wide ASTs fail deliberately in a bounded child process", () => {
  boundedChild(`
for (const api of [braces.compile, braces.expand, braces.stringify]) {
  const childCycle = { type: "root", nodes: [] };
  childCycle.nodes.push(childCycle);
  assert.throws(() => api(childCycle), { name: "TypeError", code: "ERR_BRACES_CYCLE" });
  const parentCycle = { type: "root", nodes: [] };
  parentCycle.parent = parentCycle;
  assert.throws(() => api(parentCycle), { name: "TypeError", code: "ERR_BRACES_CYCLE" });
  const leaf = { type: "text", value: "" };
  assert.doesNotThrow(() => api({ type: "root", nodes: Array(262143).fill(leaf) }));
  assert.throws(() => api({ type: "root", nodes: Array(262144).fill(leaf) }), { name: "RangeError", code: "ERR_BRACES_NODE_LIMIT" });
  assert.throws(() => api({ type: "root", nodes: Array(1000000).fill(leaf) }), { code: "ERR_BRACES_NODE_LIMIT" });
}
const ast = { type: "root", nodes: [] };
for (let index = 0; index < 2200; index++) {
  const leaf = { type: "text", value: "" };
  let parent = leaf;
  for (let depth = 0; depth < 128; depth++) parent = parent.parent = {};
  ast.nodes.push(leaf);
}
assert.throws(() => braces.stringify(ast), { code: "ERR_BRACES_NODE_LIMIT" });
`);
});

test("detached parent queues share depth, cycle and visit limits", () => {
  boundedChild(`
function supplied(queue) {
  const ast = braces.parse("(a)");
  const detached = { type: "brace", nodes: [], parent: ast, queue };
  ast.nodes.find(node => node.type === "paren").parent = detached;
  return ast;
}
for (const depth of [127, 128, 129, 20000]) {
  let queue = "x";
  for (let index = 0; index < depth; index++) queue = [queue];
  for (const api of [braces.compile, braces.expand, braces.stringify]) {
    if (depth <= 128) assert.doesNotThrow(() => api(supplied(queue)));
    else assert.throws(() => api(supplied(queue)), { name: "RangeError", code: "ERR_BRACES_DEPTH_LIMIT" });
  }
}
const cycle = [];
cycle.push(cycle);
assert.throws(() => braces.expand(supplied(cycle)), { name: "TypeError", code: "ERR_BRACES_CYCLE" });
assert.throws(() => braces.expand(supplied(Array(1000000).fill("x"))), { name: "RangeError", code: "ERR_BRACES_NODE_LIMIT" });
for (const input of ["{".repeat(128) + "a", "(".repeat(128) + "a"]) {
  for (const api of [braces.compile, braces.expand, braces.stringify]) assert.doesNotThrow(() => api(braces.parse(input)));
}
`);
});
