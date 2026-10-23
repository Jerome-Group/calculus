import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = ts.createSourceFile(
  "controller.ts",
  await readFile(
    new URL("../components/atlas/use-study-controller.ts", import.meta.url),
    "utf8",
  ),
  ts.ScriptTarget.Latest,
  true,
);
const hook = source.statements.find(
  (node) =>
    ts.isFunctionDeclaration(node) && node.name?.text === "useStudyController",
);
const names = ["canAnimate", "setPlaying", "registerAnimationTarget"];
const callbacks = hook.body.statements.filter(
  (node) =>
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.some((declaration) =>
      names.includes(declaration.name.getText(source)),
    ),
);
assert.equal(callbacks.length, names.length);
const executable = ts.transpileModule(
  callbacks.map((node) => node.getText(source)).join("\n") +
    "\nglobalThis.actions = { setPlaying, registerAnimationTarget };",
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
).outputText;

function harness() {
  let playing = false;
  let reduced = false;
  const state = {
    current: {
      concept: { id: "multivariable-chain-rule" },
      activeScene: "chain",
      route: "lesson",
      readingMode: "explore",
      visualLayout: "split",
    },
  };
  const context = vm.createContext({
    state,
    animationTarget: { current: null },
    useCallback: (callback) => callback,
    setPlayback: (value) => {
      playing = value;
    },
    window: { matchMedia: () => ({ matches: reduced }) },
  });
  vm.runInContext(executable, context);
  return {
    ...context.actions,
    state,
    get playing() {
      return playing;
    },
    reduce: () => {
      reduced = true;
    },
    target: () => ({
      lessonId: state.current.concept.id,
      scene: state.current.activeScene,
    }),
  };
}

test("playback requires a current mounted experiment and permits pausing anywhere", () => {
  const h = harness();
  assert.throws(() => h.setPlaying(true), /visible experiment/);
  const dispose = h.registerAnimationTarget(h.target());
  h.setPlaying(true);
  assert.equal(h.playing, true);
  dispose();
  assert.equal(h.playing, false);
  assert.throws(() => h.setPlaying(true), /visible experiment/);
  h.setPlaying(false);
});

test("old experiment cleanup cannot revoke a newer registration", () => {
  const h = harness();
  const old = h.registerAnimationTarget(h.target());
  const current = h.registerAnimationTarget(h.target());
  old();
  h.setPlaying(true);
  assert.equal(h.playing, true);
  current();
  assert.throws(() => h.setPlaying(true), /visible experiment/);
});

for (const [name, change] of [
  [
    "Practice",
    (h) => {
      h.state.current.readingMode = "practice";
    },
  ],
  [
    "Revise",
    (h) => {
      h.state.current.readingMode = "revise";
    },
  ],
  [
    "minimised",
    (h) => {
      h.state.current.visualLayout = "minimised";
    },
  ],
  [
    "another route",
    (h) => {
      h.state.current.route = "graph";
    },
  ],
  [
    "another lesson",
    (h) => {
      h.state.current.concept = { id: "other" };
    },
  ],
  [
    "another scene",
    (h) => {
      h.state.current.activeScene = "other";
    },
  ],
  [
    "reduced motion",
    (h) => {
      h.reduce();
    },
  ],
]) {
  test(`playback rejects ${name} even with a previous registration`, () => {
    const h = harness();
    h.registerAnimationTarget(h.target());
    change(h);
    assert.throws(() => h.setPlaying(true), /visible experiment/);
    h.setPlaying(false);
    assert.equal(h.playing, false);
  });
}
