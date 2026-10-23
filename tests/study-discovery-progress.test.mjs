import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { createSsrServer } from "./helpers/ssr-server.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createSsrServer(
  {
    appType: "custom",
    configFile: false,
    root,
    resolve: { alias: { "@": root } },
    server: { middlewareMode: true, hmr: false, ws: false },
  },
  after,
);

test("search discovers worked blocks, supplemental exercises and linked source names", async () => {
  const { matchesConcept } = await vite.ssrLoadModule(
    "/lib/curriculum/search.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const sets = concepts.find(
    (concept) => concept.id === "sets-functions-domains",
  );
  assert.equal(matchesConcept(sets, "finite universe"), true);
  assert.equal(matchesConcept(sets, "roster"), true);
  assert.equal(matchesConcept(sets, "MH1100 Lecture 01"), true);
  assert.equal(matchesConcept(sets, "roster impossibleword"), false);
  assert.equal(matchesConcept(sets, ""), true);
});

test("declared exercise kinds cover every existing supplemental exercise", () => {
  const guide = JSON.parse(
    readFileSync(
      new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    ),
  );
  const types = readFileSync(
    new URL("../lib/curriculum/learning.ts", import.meta.url),
    "utf8",
  );
  const kinds = [
    ...new Set(
      Object.values(guide).flatMap((item) =>
        (item.exercises || []).map((exercise) => exercise.kind),
      ),
    ),
  ];
  const declaration = types.slice(types.indexOf("    kind:"));
  for (const kind of kinds) assert.match(declaration, new RegExp(`"${kind}"`));
});
