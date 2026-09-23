import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const concepts = JSON.parse(
  readFileSync(new URL("../lib/curriculum/concepts.json", import.meta.url)),
);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("previous and next concept titles render embedded math", async () => {
  const { LessonPagination } = await vite.ssrLoadModule(
    "/components/atlas/lesson-workspace.tsx",
  );
  const formulaIndex = concepts.findIndex(
    (concept) => concept.id === "epsilon-delta-limits",
  );
  assert.equal(concepts[formulaIndex - 1].id, "distance-and-neighborhoods");
  assert.equal(
    concepts[formulaIndex + 1].id,
    "different-paths-different-limits",
  );

  for (const adjacentIndex of [formulaIndex - 1, formulaIndex + 1]) {
    const html = renderToStaticMarkup(
      React.createElement(LessonPagination, {
        index: adjacentIndex,
        open: () => {},
      }),
    );
    assert.match(html, /<math/u);
    assert.doesNotMatch(html, /The \$/u);
    assert.doesNotMatch(html, /katex-error/u);
  }
});
