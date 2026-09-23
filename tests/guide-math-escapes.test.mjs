import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guides = JSON.parse(
  readFileSync(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
  ),
);

function* strings(value, path = "guides") {
  if (typeof value === "string") {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (const [index, item] of value.entries())
      yield* strings(item, `${path}[${index}]`);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value))
      yield* strings(item, `${path}.${key}`);
  }
}

test("guide math spans contain no decoded control characters", () => {
  for (const [path, value] of strings(guides)) {
    for (const match of value.matchAll(/\$([^$]+)\$/gs)) {
      assert.doesNotMatch(match[1], /[\x00-\x1f\x7f]/, path);
    }
  }
});
