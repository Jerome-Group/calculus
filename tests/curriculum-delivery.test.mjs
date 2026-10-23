import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { createSsrServer } from "./helpers/ssr-server.mjs";
import { createStudyRenderer } from "./helpers/study-render.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createSsrServer(
  {
    appType: "custom",
    configFile: false,
    root,
    resolve: { alias: { "@": root } },
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  },
  after,
);
const render = await createStudyRenderer(vite);
const { concepts, courses, sources } = await vite.ssrLoadModule(
  "/lib/curriculum/index.ts",
);
const { learningGuide } = await vite.ssrLoadModule(
  "/lib/curriculum/learning.ts",
);
const { pilotLessons } = await vite.ssrLoadModule(
  "/lib/curriculum/learning-modes.ts",
);
const { LessonWorkspace } = await vite.ssrLoadModule(
  "/components/atlas/lesson-workspace.tsx",
);
const { planarModel } = await vite.ssrLoadModule("/lib/curriculum/planar.ts");
const { sceneInfo } = await vite.ssrLoadModule("/lib/atlas/scenes.ts");
const { MathText } = await vite.ssrLoadModule(
  "/components/atlas/math-text.tsx",
);
const noop = () => {};

function workspace(concept, readingMode) {
  const planar = concept.scene.startsWith("plane-")
    ? planarModel(concept.scene)
    : null;
  const info = planar ? { ...planar, legend: [] } : sceneInfo(concept.scene);
  return render(
    React.createElement(LessonWorkspace, {
      study: {
        concept,
        readingMode,
        info,
        planar,
        p: info.initial,
        index: concepts.indexOf(concept),
        lectures: courses[concept.course].units,
        activeScene: concept.scene,
        visualLayout: "minimised",
        playing: false,
        resetKey: 0,
        setReadingMode: noop,
        setNoteTab: noop,
        open: noop,
        openPrerequisite: noop,
        resumeLesson: noop,
        openWorkshop: noop,
        plot: noop,
        setPlaying: noop,
        setP: noop,
        setReset: noop,
        setVisualLayout: noop,
      },
    }),
  );
}
const ids = (html) =>
  [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
function assertOnce(html, id) {
  assert.equal(ids(html).filter((value) => value === id).length, 1, id);
}

for (const id of Object.keys(pilotLessons)) {
  const concept = concepts.find((item) => item.id === id);
  const guide = learningGuide(concept);
  test(`${id} actual Learn dispatch delivers every canonical block and exercise once`, () => {
    const html = workspace(concept, "learn");
    for (const block of [
      ...(guide.contentBlocks ?? []),
      ...(guide.supplementalBlocks ?? []),
    ])
      assertOnce(html, block.id);
    for (const exerciseId of [
      "core",
      ...guide.exercises.map((item) => item.id),
    ])
      assertOnce(html, `answer-${id}-${exerciseId}`);
    for (const heading of ["notes-intuition", "notes-example", "notes-pitfall"])
      assertOnce(html, heading);
    assert.equal(
      (html.match(/aria-label="Mathematical explanation"/g) ?? []).length,
      1,
    );
    assert.match(html, /Recall first/);
    assert.match(html, /Quick check/);
    assert.equal((html.match(/aria-label="Sources"/g) ?? []).length, 1);
    for (const citation of concept.sources)
      assert.ok(
        html.includes(
          `${sources[citation.sourceId].url}#page=${citation.pages[0]}`,
        ),
        `${citation.sourceId} page ${citation.pages[0]}`,
      );
    assert.equal(
      (html.match(/class="comparison-lab"/g) ?? []).length,
      id === "type-one-two-regions" ? 1 : 0,
    );
    assert.doesNotMatch(html, /katex-error/);
  });
  test(`${id} actual Practice dispatch keeps pilot decisions and every canonical reasoning input`, () => {
    const html = workspace(concept, "practice");
    for (const exerciseId of [
      "core",
      ...guide.exercises.map((item) => item.id),
    ])
      assertOnce(html, `answer-${id}-${exerciseId}`);
    for (const task of pilotLessons[id].practice.filter(
      (item) => item.kind !== "recognition",
    ))
      assertOnce(html, `${id}-${task.id}-reasoning`);
    assert.match(html, /Check answer/);
    assert.doesNotMatch(html, /aria-label="Mathematical explanation"/);
  });
  test(`${id} keeps exact Explore and Revise activities through Workspace`, () => {
    const explore = workspace(concept, "explore");
    assert.match(explore, /Values only/);
    assert.match(
      explore,
      id === "epsilon-delta-one-variable"
        ? /candidate-delta/
        : /Slice orientation/,
    );
    assert.match(
      explore,
      id === "epsilon-delta-one-variable"
        ? /Check all inputs algebraically/
        : /Exact bounds diagram/,
    );
    const revise = workspace(concept, "revise");
    assert.match(revise, /Retrieve before looking back/);
    assert.match(revise, /Confidence self-report/);
    assert.match(revise, /Saved account history/);
  });
}

test("every actual Learn workspace delivers canonical notes with unique rendered IDs", () => {
  const duplicates = [];
  for (const concept of concepts) {
    const html = workspace(concept, "learn");
    const rendered = ids(html);
    const guide = learningGuide(concept);
    const required = [
      "notes-intuition",
      "notes-example",
      "notes-pitfall",
      ...(guide.contentBlocks ?? []).map((block) => block.id),
      ...(guide.supplementalBlocks ?? []).map((block) => block.id),
      `answer-${concept.id}-core`,
      ...(guide.exercises ?? []).map(
        (exercise) => `answer-${concept.id}-${exercise.id}`,
      ),
    ];
    assert.equal(
      (html.match(/aria-label="Mathematical explanation"/g) ?? []).length,
      1,
      concept.id,
    );
    for (const id of required)
      assert.ok(rendered.includes(id), `${concept.id}:${id}`);
    for (const id of new Set(rendered))
      if (rendered.filter((item) => item === id).length > 1)
        duplicates.push(`${concept.id}:${id}`);
  }
  assert.deepEqual(duplicates, []);
});

test("extrema, composition and binomial tails render their final mathematical object", () => {
  const extrema = concepts.find((concept) => concept.id === "extrema-fermat");
  const composition = learningGuide(
    concepts.find((concept) => concept.id === "transform-compose"),
  );
  const differentiation = learningGuide(
    concepts.find((concept) => concept.id === "differentiation-rules"),
  );
  for (const [text, expectedTail] of [
    [extrema.example, /<mn>4<\/mn>/],
    [composition.exercises[4].solution, /<mi>x<\/mi>/],
    [differentiation.exercises[4].rubric[2], /<mi>h<\/mi>/],
  ]) {
    const html = render(React.createElement(MathText, { text }));
    const finalMath = [...html.matchAll(/<math\b[\s\S]*?<\/math>/g)].at(
      -1,
    )?.[0];
    assert.ok(finalMath);
    assert.match(finalMath, expectedTail);
    assert.doesNotMatch(
      html.replace(/<annotation\b[\s\S]*?<\/annotation>/g, ""),
      /\$|katex-error/,
    );
  }
});
