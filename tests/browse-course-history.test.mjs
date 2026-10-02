import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const temp = await mkdtemp(path.join(os.tmpdir(), "calculus-browse-course-"));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  cacheDir: path.join(temp, "vite-cache"),
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(async () => {
  await vite.close();
  await rm(temp, { recursive: true, force: true });
});
const { studyTools } = await vite.ssrLoadModule(
  "/components/atlas/study-tools.ts",
);
const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
const { libraryUrl, readLibraryHistory } = await vite.ssrLoadModule(
  "/components/atlas/library-history.ts",
);

// Execute the real controller actions with render-local captures and batched setters.
const source = ts.createSourceFile(
  "controller.ts",
  await readFile(
    path.join(root, "components/atlas/use-study-controller.ts"),
    "utf8",
  ),
  ts.ScriptTarget.Latest,
  true,
);
const hook = source.statements.find(
  (node) =>
    ts.isFunctionDeclaration(node) && node.name?.text === "useStudyController",
);
const names = ["show", "chooseCourse", "updateSearch"];
const actions = hook.body.statements.filter(
  (node) => ts.isFunctionDeclaration(node) && names.includes(node.name?.text),
);
assert.equal(actions.length, names.length);
const executable = ts.transpileModule(
  actions.map((node) => node.getText(source)).join("\n"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
).outputText;

for (const initialRoute of ["lesson", "course"]) {
  test(`browse_course preserves another course's query and reload URL from ${initialRoute}`, async () => {
    let url = new URL(
      "https://calculus.jeromegroup.org/?study=old#derivative-definition",
    );
    let values = { route: initialRoute, course: "MH1100", search: "old query" };
    let pending = {};
    let current;
    const render = () => {
      values = { ...values, ...pending };
      pending = {};
      const context = vm.createContext({
        ...values,
        graph: {},
        libraryUrl,
        graphUrl: () => {
          throw new Error("Unexpected graph navigation");
        },
        routeUrl: () => {
          throw new Error("Unexpected lesson navigation");
        },
        URL,
        saveScroll() {},
        setRoute: (route) => {
          pending.route = route;
        },
        setCourse: (course) => {
          pending.course = course;
        },
        setSearch: (search) => {
          pending.search = search;
        },
        setExpanded() {},
        setPlaying() {},
        sidebar: { setOpenMobile() {} },
        window: { location: { href: url.href }, scrollTo() {} },
        document: { getElementById: () => null },
        requestAnimationFrame: globalThis.requestAnimationFrame,
        history: {
          state: {},
          pushState: (_state, _title, target) => {
            url = new URL(target, url);
          },
          replaceState: (_state, _title, target) => {
            url = new URL(target, url);
          },
        },
      });
      vm.runInContext(executable, context);
      current = {
        ...values,
        concept: concepts.find((c) => c.id === "derivative-definition"),
        info: { min: 0, max: 1, step: 0.01 },
        chooseCourse: context.chooseCourse,
        setSearch: context.updateSearch,
      };
    };
    const savedFrame = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (callback) =>
      setTimeout(() => {
        render();
        callback();
      }, 0);
    try {
      render();
      const browse = studyTools(concepts, () => current).find(
        (t) => t.name === "browse_course",
      );
      for (const query of ["path", "ε δ + x & y #proof", ""]) {
        const result = await browse.execute({ course: "MH2100", query });
        assert.equal(result.route, "course");
        assert.equal(result.course, "MH2100");
        assert.equal(result.query, query);
        assert.deepEqual(readLibraryHistory(new URL(url.href)), {
          kind: "valid",
          value: { version: 1, course: "MH2100", query },
        });
        assert.equal(url.hash, "#course");
        assert.equal(url.searchParams.has("study"), false);
      }
    } finally {
      globalThis.requestAnimationFrame = savedFrame;
    }
  });
}
