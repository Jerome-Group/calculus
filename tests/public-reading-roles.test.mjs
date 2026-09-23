import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const concepts = JSON.parse(
  await readFile(new URL("../lib/curriculum/concepts.json", import.meta.url)),
);
const guides = JSON.parse(
  await readFile(
    new URL("../lib/curriculum/learning-guides.json", import.meta.url),
  ),
);
const sources = JSON.parse(
  await readFile(new URL("../lib/curriculum/sources.json", import.meta.url)),
);
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

const goldPaths = [
  [
    "limit-laws-squeeze",
    "differentiability-corners",
    "differentiation-rules",
    "chain-rule-single",
    "linearization-differentials",
    "rolle-mean-value",
    "inverse-functions",
    "lhopital",
  ],
  [
    "partial-derivatives-as-slices",
    "total-differentiability",
    "partials-do-not-make-a-plane",
    "certifying-differentiability-and-errors",
    "multivariable-chain-rule",
    "directional-derivatives-and-gradient",
    "gradient-normals-and-steepest-ascent",
    "review-total-differentiability",
  ],
];

test("gold paths provide complete public lesson tasks and located optional readings", async () => {
  const { goldPathReadings, citationUse } = await vite.ssrLoadModule(
    "/lib/curriculum/reading-references.ts",
  );
  for (const path of goldPaths) {
    for (const id of path) {
      const concept = concepts.find((item) => item.id === id);
      const guide = guides[id];
      assert.ok(concept && guide, id);
      for (const field of [
        "definition",
        "conditions",
        "proof",
        "example",
        "pitfall",
        "task",
        "insight",
      ])
        assert.ok(concept[field]?.trim(), `${id}: ${field}`);
      for (const field of ["prompt", "hint", "solution", "solutionTex"])
        assert.ok(guide.exercise[field]?.trim(), `${id}: exercise.${field}`);
      assert.ok(guide.exercise.rubric.length >= 2);
      assert.ok(goldPathReadings[id]?.length, `${id}: public reading`);
      for (const reading of goldPathReadings[id]) {
        assert.match(
          reading.url,
          /^https:\/\/openstax\.org\/books\/calculus-volume-[13]\/pages\//,
        );
        assert.match(reading.locator, /§\d+\.\d+/);
        assert.ok(reading.purpose.length > 50);
        assert.doesNotMatch(reading.url, /drive\.google|\.pdf(?:$|[?#])/i);
      }
      for (const citation of concept.sources) {
        const source = sources[citation.sourceId];
        assert.ok(source, `${id}: source ${citation.sourceId}`);
        assert.ok(
          citation.pages[0] >= 1 && citation.pages[1] >= citation.pages[0],
        );
        const use = citationUse(citation, source, concept);
        assert.ok(use.role && use.purpose);
      }
    }
  }
});

test("reference UI gives each course citation a role and exposes public reading", async () => {
  const { SourceReferences } = await vite.ssrLoadModule(
    "/components/atlas/source-references.tsx",
  );
  const concept = concepts.find(
    (item) => item.id === "total-differentiability",
  );
  const html = renderToStaticMarkup(
    React.createElement(SourceReferences, { concept }),
  );
  assert.match(html, /Public optional reading/);
  assert.match(html, /OpenStax Calculus 3 §4\.4/);
  assert.match(html, /PDF p\./);
  assert.match(html, /Theorem statement\./);
  assert.match(html, /Compare its hypotheses/);
  assert.match(html, /without opening a course PDF/);
});
