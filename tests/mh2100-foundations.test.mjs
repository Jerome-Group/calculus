import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const guides = read("../lib/curriculum/learning-guides.json");
const ledger = read("../lib/curriculum/outcome-ledger.json");

const outcomes = [
  [
    "surfaces-and-level-sets:two-variable-domain",
    "mh2100-domain-radical-denominator",
    "two-variable-domain-transfer",
  ],
  [
    "surfaces-and-level-sets:hemisphere-contours",
    "mh2100-hemisphere-contours",
    "hemisphere-level-transfer",
  ],
  [
    "distance-and-neighborhoods:open-closed-witnesses",
    "mh2100-open-closed-boundary-witnesses",
    "half-disk-topology-transfer",
  ],
];

test("MH2100 foundation outcomes keep source, worked, and transfer evidence aligned", () => {
  for (const [id, blockId, exerciseId] of outcomes) {
    const entry = ledger.atomic_outcomes.find((item) => item.id === id);
    assert.ok(entry, id);
    assert.equal(entry.evidence.visualized.length, 0);
    assert.equal(entry.evidence.checked.length, 0);
    const guide = guides[entry.concept_id];
    const block = guide.contentBlocks.find((item) => item.id === blockId);
    const exercise = guide.exercises.find((item) => item.id === exerciseId);
    assert.equal(block.kind, "worked-example");
    assert.ok(block.steps.length >= 2 && block.verification);
    assert.ok(
      exercise.hint && exercise.solution && exercise.rubric.length >= 2,
    );
    assert.notEqual(exercise.prompt, block.setup);
  }
});

test("domain, contour, and boundary transfer calculations have distinct witnesses", () => {
  const inDomain = (x, y) => y > x * x && x * x + y * y < 4;
  assert.equal(inDomain(0, 1), true);
  assert.equal(inDomain(1, 1), false); // logarithm boundary
  assert.equal(inDomain(0, 2), false); // denominator boundary
  for (const [height, radius] of [
    [3, 4],
    [4, 3],
    [5, 0],
  ])
    assert.equal(Math.sqrt(25 - radius * radius), height);
  const inHalfDisk = (x, y) => x * x + y * y <= 4 && y > 0;
  assert.equal(inHalfDisk(0, 2), true);
  assert.equal(inHalfDisk(0, 2.01), false);
  for (const n of [1, 2, 10]) assert.equal(inHalfDisk(0, 1 / n), true);
  assert.equal(inHalfDisk(0, 0), false);
});

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(async () => vite.close());

test("WebMCP read_concept exposes each new worked block and transfer task", async () => {
  const { studyTools } = await vite.ssrLoadModule(
    "/components/atlas/study-tools.ts",
  );
  const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
  const read = studyTools(concepts, () => null).find(
    (tool) => tool.name === "read_concept",
  );
  for (const [id, blockId, exerciseId] of outcomes) {
    const outcome = ledger.atomic_outcomes.find((item) => item.id === id);
    const result = read.execute({ conceptId: outcome.concept_id });
    assert.ok(result.lesson.contentBlocks.some((item) => item.id === blockId));
    assert.ok(result.lesson.exercises.some((item) => item.id === exerciseId));
  }
});
