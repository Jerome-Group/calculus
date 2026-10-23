import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
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
    const workshopReturn = {
      version: 1,
      id: "linear-bound",
      focus: "result",
      scrollY: 420,
    };
    let url = new URL(
      "https://calculus.jeromegroup.org/?study=old#derivative-definition",
    );
    url.searchParams.set(
      "workshop",
      JSON.stringify({ version: 1, id: "linear-bound" }),
    );
    let historyState = { studyScrollY: 420, workshopReturn };
    let values = {
      route: initialRoute,
      course: "MH1100",
      search: "old query",
      workshopReturn,
    };
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
        setHistoryNotice() {},
        setClinicReturn() {},
        setWorkshopReturn: (value) => {
          pending.workshopReturn = value;
        },
        setNavigationFocus() {},
        setExpanded() {},
        setPlaying() {},
        sidebar: { setOpenMobile() {} },
        window: { location: { href: url.href }, scrollTo() {} },
        document: { getElementById: () => null },
        requestAnimationFrame: globalThis.requestAnimationFrame,
        history: {
          state: historyState,
          pushState: (state, _title, target) => {
            historyState = state;
            url = new URL(target, url);
          },
          replaceState: (state, _title, target) => {
            historyState = state;
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
      assert.equal(current.workshopReturn, workshopReturn);
      const browse = studyTools(concepts, () => current).find(
        (t) => t.name === "browse_course",
      );
      for (const query of ["path", "ε δ + x & y #proof", ""]) {
        const result = await browse.execute({ course: "MH2100", query });
        assert.equal(result.route, "course");
        assert.equal(result.course, "MH2100");
        assert.equal(result.query, query);
        assert.equal(current.workshopReturn, null);
        assert.deepEqual(Object.keys(historyState), ["studyScrollY"]);
        assert.equal(historyState.studyScrollY, 0);
        assert.deepEqual(readLibraryHistory(new URL(url.href)), {
          kind: "valid",
          value: { version: 1, course: "MH2100", query },
        });
        assert.equal(url.hash, "#course");
        assert.equal(url.searchParams.has("study"), false);
        assert.equal(url.searchParams.has("workshop"), false);
      }
    } finally {
      globalThis.requestAnimationFrame = savedFrame;
    }
  });
}
