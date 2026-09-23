import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  forwardBridges,
  prerequisiteIssues,
} from "../lib/curriculum/prerequisite-routes.ts";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");

test("current prerequisite graph has no missing IDs, cycles or unexplained forward links", () => {
  assert.deepEqual(
    prerequisiteIssues(
      concepts.map((concept) => concept.id),
      guides,
    ),
    [],
  );
  assert.deepEqual(Object.keys(forwardBridges).sort(), [
    "chain-rule-single",
    "riemann-integral",
  ]);
});

test("graph check rejects missing, cyclic and unexplained forward prerequisites", () => {
  assert.match(
    prerequisiteIssues(["a"], { a: { prerequisites: ["missing"] } }).join(),
    /Missing prerequisite/,
  );
  assert.match(
    prerequisiteIssues(["a", "b"], {
      a: { prerequisites: ["b"] },
      b: { prerequisites: ["a"] },
    }).join(),
    /Cycle/,
  );
  assert.match(
    prerequisiteIssues(["a", "b"], {
      a: { prerequisites: ["b"] },
      b: { prerequisites: [] },
    }).join(),
    /Unexplained forward/,
  );
});
