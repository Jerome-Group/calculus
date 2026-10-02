import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
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

test("overview includes supplemental self-assessments and latest pilot practice evidence without upgrading a lesson", async () => {
  const { summarizeStudyProgress } = await vite.ssrLoadModule(
    "/components/atlas/study-progress.tsx",
  );
  const lessons = [{ id: "limits" }, { id: "regions" }];
  const records = {
    limits: { status: "Can explain independently", date: "2026-10-01" },
    "limits:counterexample": { status: "Needs practice", date: "2026-10-02" },
    "regions:bounds": {
      status: "Can explain independently",
      date: "2026-10-02",
    },
    unknown: { status: "Needs practice", date: "2026-10-02" },
  };
  const attempt = {
    taskId: "slice",
    kind: "setup",
    correct: false,
    support: "none",
    at: "2026-10-01T00:00:00Z",
  };
  const pilots = { regions: { attempts: [attempt], nextReview: "2026-10-04" } };
  const untouched = JSON.stringify({ records, pilots });
  let result = summarizeStudyProgress(
    lessons,
    records,
    pilots,
    Date.parse("2026-10-03"),
  );
  assert.equal(result.explainable, 2);
  assert.equal(result.needsPractice, 1);
  assert.equal(result.choices, 1);
  assert.deepEqual([...result.practice], ["limits", "regions"]);
  assert.equal(JSON.stringify({ records, pilots }), untouched);
  const corrected = { ...attempt, correct: true, at: "2026-10-02T00:00:00Z" };
  pilots.regions.attempts = [corrected, attempt];
  result = summarizeStudyProgress(
    lessons,
    records,
    pilots,
    Date.parse("2026-10-03"),
  );
  assert.deepEqual([...result.practice], ["limits"]);
  pilots.regions.nextReview = "2026-10-03";
  assert.equal(
    summarizeStudyProgress(
      lessons,
      records,
      pilots,
      Date.parse("2026-10-03"),
    ).practice.has("regions"),
    true,
  );
  pilots.regions.nextReview = "2026-10-04";
  corrected.support = "hint";
  assert.equal(
    summarizeStudyProgress(
      lessons,
      records,
      pilots,
      Date.parse("2026-10-03"),
    ).practice.has("regions"),
    true,
  );
});

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
