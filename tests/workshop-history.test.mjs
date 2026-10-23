import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const {
  workshopUrl,
  readWorkshopHistory,
  readWorkshopReturn,
  readWorkshopPosition,
} = await vite.ssrLoadModule("/components/atlas/workshop-history.ts");
const { lessonUrl, graphUrl, routeUrl } = await vite.ssrLoadModule(
  "/components/atlas/study-history.ts",
);
const { libraryUrl } = await vite.ssrLoadModule(
  "/components/atlas/library-history.ts",
);
const { clinicUrl } = await vite.ssrLoadModule(
  "/components/atlas/clinic-history.ts",
);
const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");

test("workshop links contain only a bounded known investigation and all workspace writers clear it", () => {
  const base = new URL(
    "https://example.test/?source=friend&study=x&graph=x&library=x&clinic=x#course",
  );
  const link = new URL(workshopUrl(base, "cubic-path"), base);
  assert.equal(link.hash, "#workshop");
  assert.deepEqual([...link.searchParams.keys()], ["source", "workshop"]);
  assert.deepEqual(readWorkshopHistory(link), { id: "cubic-path", notice: "" });
  const lesson = concepts[0];
  for (const url of [
    routeUrl(link, "course"),
    graphUrl(link, initialGraph),
    libraryUrl(link, "MH1100", "limit"),
    clinicUrl(link, "rolle-corner"),
    lessonUrl(link, lesson.id, {
      version: 1,
      scene: lesson.scene,
      parameter: 0,
      mode: "learn",
      notesTab: "intuition",
    }),
  ]) {
    assert.equal(new URL(url, base).searchParams.has("workshop"), false);
    assert.equal(new URL(url, base).searchParams.get("source"), "friend");
  }
  for (const encoded of [
    "{",
    "null",
    "[]",
    "x".repeat(201),
    JSON.stringify({ version: 2, id: "cubic-path" }),
    JSON.stringify({ version: 1, id: "unknown" }),
    JSON.stringify({ version: 1, id: "cubic-path", explanation: "private" }),
  ]) {
    link.searchParams.set("workshop", encoded);
    assert.match(
      readWorkshopHistory(link).notice,
      /No construction or explanation was loaded/,
    );
  }
  link.searchParams.set(
    "workshop",
    JSON.stringify({ version: 1, id: "cubic-path" }),
  );
  link.searchParams.append("workshop", link.searchParams.get("workshop"));
  assert.ok(readWorkshopHistory(link).notice);
});

test("workshop return descriptors accept only matching catalog lessons and fixed focus with bounded scroll", () => {
  const position = {
    version: 1,
    id: "domain-loop",
    focus: "result",
    scrollY: 725,
  };
  assert.deepEqual(
    readWorkshopReturn({ workshopReturn: position }, "conservative-domains"),
    position,
  );
  assert.equal(
    readWorkshopReturn({ workshopReturn: position }, "derivative-definition"),
    null,
  );
  assert.deepEqual(
    readWorkshopPosition({ workshopPosition: position }, "domain-loop"),
    position,
  );
  assert.equal(
    readWorkshopPosition({ workshopPosition: position }, "cubic-path"),
    null,
  );
  for (const patch of [
    { id: "missing" },
    { version: 2 },
    { focus: "arbitrary-selector" },
    { scrollY: Infinity },
    { scrollY: -1 },
    { scrollY: 10000001 },
    { explanation: "private" },
  ])
    assert.equal(
      readWorkshopReturn(
        { workshopReturn: { ...position, ...patch } },
        "conservative-domains",
      ),
      null,
    );
});
