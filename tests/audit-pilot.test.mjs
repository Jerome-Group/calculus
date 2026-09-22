import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import katex from "katex";
import { validateSourceManifest } from "../scripts/check-source-manifest.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const manifest = read("../lib/curriculum/source-manifest.json");
const sources = read("../lib/curriculum/sources.json");
const observed = read("../lib/curriculum/source-observation.json");
const baseline = read("../lib/curriculum/source-baseline.json");
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

test("classified sources match the canonical ledger and observed Drive files", () => {
  assert.equal(manifest.length, 97);
  assert.deepEqual(
    validateSourceManifest(manifest, sources, observed, baseline),
    [],
  );
  assert.equal(
    manifest.filter((entry) => entry.status === "canonical").length,
    47,
  );
  for (const week of ["05", "06"]) {
    const entry = manifest.find(
      (item) => item.sourceId === `MH2100_Lecture_${week}_Annotated_PDF`,
    );
    assert.equal(entry.coverageDiff, "adopted");
    assert.ok(entry.reviewedAt);
    assert.ok(entry.affectedConcepts.length >= 3);
  }
});

test("changed or new instructional sources fail; changed personal references do not block", () => {
  const changed = structuredClone(observed);
  const annotated = manifest.find(
    (entry) => entry.sourceId === "MH2100_Lecture_04_Annotated_PDF",
  );
  changed.files.find(
    (file) => file.driveFileId === annotated.driveFileId,
  ).modifiedAt = "2026-09-23T00:00:00Z";
  assert.match(
    validateSourceManifest(manifest, sources, changed, baseline).join("\n"),
    /Changed source lacks current review/,
  );
  const pending = structuredClone(manifest);
  const item = pending.find(
    (entry) => entry.sourceId === "MH2100_Lecture_04_Annotated_PDF",
  );
  item.coverageDiff = "needs_review";
  item.reviewedAt = "2026-09-24";
  item.reviewer = "reviewer";
  assert.match(
    validateSourceManifest(pending, sources, changed, baseline).join("\n"),
    /Changed source lacks current review/,
  );
  changed.files.push({
    driveFileId: "new-drive-file",
    modifiedAt: "2026-09-22T00:00:00Z",
  });
  assert.match(
    validateSourceManifest(manifest, sources, changed, baseline).join("\n"),
    /New Drive source/,
  );
  const added = structuredClone(manifest);
  added.push({
    sourceId: "MH2100_Extra_Annotated_PDF",
    course: "MH2100",
    driveFileId: "new-drive-file",
    title: "New annotated lecture",
    kind: "annotated_lecture",
    status: "unreviewed",
    modifiedAt: "2026-09-22T00:00:00Z",
    affectedConcepts: [],
  });
  assert.match(
    validateSourceManifest(added, sources, changed, baseline).join("\n"),
    /Changed source lacks current review: MH2100_Extra_Annotated_PDF/,
  );
  const personal = structuredClone(observed);
  const note = manifest.find((entry) => entry.kind === "personal_reference");
  personal.files.find(
    (file) => file.driveFileId === note.driveFileId,
  ).modifiedAt = "2026-09-23T00:00:00Z";
  assert.deepEqual(
    validateSourceManifest(manifest, sources, personal, baseline),
    [],
  );
});

test("synchronizing metadata cannot bypass a pending source review", () => {
  const synchronized = structuredClone(manifest);
  const observation = structuredClone(observed);
  const entry = synchronized.find(
    (item) => item.sourceId === "MH2100_Lecture_04_Annotated_PDF",
  );
  const newer = "2026-09-23T00:00:00Z";
  entry.modifiedAt = newer;
  observation.files.find(
    (file) => file.driveFileId === entry.driveFileId,
  ).modifiedAt = newer;
  assert.match(
    validateSourceManifest(synchronized, sources, observation, baseline).join(
      "\n",
    ),
    /Changed source lacks current review/,
  );
  entry.status = "annotated_variant";
  entry.coverageDiff = "needs_review";
  entry.reviewedAt = "2026-09-24T00:00:00Z";
  entry.reviewer = "reviewer";
  assert.match(
    validateSourceManifest(synchronized, sources, observation, baseline).join(
      "\n",
    ),
    /Changed source lacks current review/,
  );
  entry.coverageDiff = "adopted";
  assert.deepEqual(
    validateSourceManifest(synchronized, sources, observation, baseline),
    [],
  );
});

test("all 125 lessons retain a mode path, and pilot math parses strictly", async () => {
  const concepts = read("../lib/curriculum/concepts.json");
  const { learningModesFor, pilotLessons } = await vite.ssrLoadModule(
    "/lib/curriculum/learning-modes.ts",
  );
  assert.equal(concepts.length, 125);
  for (const concept of concepts)
    assert.ok(learningModesFor(concept), concept.id);
  for (const pilot of Object.values(pilotLessons)) {
    assert.ok(pilot.practice.length >= 3);
    assert.ok(pilot.practice.some((task) => task.kind === "transfer"));
    for (const task of pilot.practice) {
      assert.ok(task.choices.some((choice) => choice.id === task.answer));
      for (const choice of task.choices)
        if (choice.errorCode) assert.ok(task.feedback[choice.errorCode]);
    }
    const text = [
      ...Object.values(pilot.learn),
      ...Object.values(pilot.explore),
      ...pilot.revise.prompts,
      pilot.revise.conditions,
      pilot.revise.mixedCheck,
      ...pilot.practice.flatMap((task) => [
        task.prompt,
        task.hint,
        task.explanation,
        ...task.choices.map((choice) => choice.text),
        ...Object.values(task.feedback),
      ]),
    ];
    for (const line of text)
      for (const match of line.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g))
        katex.renderToString(match[1] ?? match[2], {
          throwOnError: true,
          strict: "error",
        });
  }
});

test("legacy confidence is migrated without correctness or mastery", async () => {
  const { legacyConfidence, parsePilotProgress, pilotMastery } =
    await vite.ssrLoadModule("/lib/curriculum/pilot-progress.ts");
  assert.equal(
    legacyConfidence({
      status: "Can explain independently",
      date: "2026-09-16",
    }),
    "confident",
  );
  assert.deepEqual(parsePilotProgress("corrupt"), {});
  assert.deepEqual(
    parsePilotProgress(
      JSON.stringify({ broken: { attempts: [null] }, valid: { attempts: [] } }),
    ),
    { valid: { attempts: [] } },
  );
  assert.equal(pilotMastery({ attempts: [] }), false);
  const first = {
    taskId: "reverse",
    kind: "transfer",
    correct: true,
    support: "none",
    at: "2026-09-22T00:00:00Z",
  };
  assert.equal(pilotMastery({ attempts: [first] }), false);
  assert.equal(
    pilotMastery({
      attempts: [first, { ...first, at: "2026-09-23T00:00:00Z" }],
    }),
    true,
  );
  assert.equal(
    pilotMastery({
      attempts: [
        first,
        { ...first, support: "hint", at: "2026-09-23T00:00:00Z" },
      ],
    }),
    false,
  );
});

test("linear delta certification rejects even a slightly oversized proposal", async () => {
  const { checkLinearDelta } = await vite.ssrLoadModule(
    "/lib/curriculum/linear-delta.ts",
  );
  assert.match(checkLinearDelta(0.8, "0.4"), /Certified/);
  assert.match(checkLinearDelta(0.8, "0.4000000000005"), /Too large/);
  assert.match(checkLinearDelta(0.8, "0"), /positive finite/);
});

test("public client output contains no private course file or local path", () => {
  const client = new URL("../dist/client/", import.meta.url);
  const paths = readdirSync(client, { recursive: true });
  assert.equal(paths.filter((path) => path.endsWith(".pdf")).length, 0);
  const code = paths
    .filter((path) => /\.(js|html|css)$/.test(path))
    .map((path) => readFileSync(new URL(path, client), "utf8"))
    .join("\n");
  assert.doesNotMatch(
    code,
    /\/Users\/jeromequeck\/|course-materials\/|MH2100_Lecture_05_Annotated\.pdf/,
  );
});
