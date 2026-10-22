import test, { after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import katex from "katex";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false, ws: false },
});
after(() => vite.close());
const { clinicCase, clinicCaseIds } = await vite.ssrLoadModule(
  "/lib/clinic/cases.ts",
);
const { clinicAttempt, clinicTransition } = await vite.ssrLoadModule(
  "/lib/clinic/session.ts",
);
const { clinicUrl, readClinicHistory, readClinicReturn, readClinicPosition } =
  await vite.ssrLoadModule("/components/atlas/clinic-history.ts");
const { lessonUrl, graphUrl, routeUrl } = await vite.ssrLoadModule(
  "/components/atlas/study-history.ts",
);
const { libraryUrl } = await vite.ssrLoadModule(
  "/components/atlas/library-history.ts",
);
const { concepts } = await vite.ssrLoadModule("/lib/curriculum/index.ts");
const { initialGraph } = await vite.ssrLoadModule("/lib/atlas/math.ts");

const expected = [
  ["rolle-corner", "corner-breaks-hypothesis", "smooth-rolle"],
  ["chain-composition", "outer-times-inner", "exp-chain"],
  ["lhopital-nonconverse", "squeeze-original", "sine-rule-valid"],
  ["improper-cancellation", "separate-divergence", "root-converges"],
  ["conditional-rearrangement", "conditional-warning", "absolute-preserves"],
  [
    "power-series-boundary",
    "separate-endpoints",
    "derivative-boundary-diverges",
  ],
  [
    "partials-without-plane",
    "diagonal-obstruction",
    "continuous-partials-nearby",
  ],
  ["curl-domain-hole", "circle-obstruction", "right-angle-potential"],
  ["hemisphere-flux", "halfball-flux", "orientation-reversed"],
];
test("nine original cases have checked answer keys, complete feedback, and existing same-course recovery", () => {
  assert.deepEqual(
    clinicCaseIds,
    expected.map(([id]) => id),
  );
  const counts = new Map();
  const positions = new Set();
  for (const [id, decision, transfer] of expected) {
    const content = clinicCase(id);
    counts.set(content.course, (counts.get(content.course) ?? 0) + 1);
    assert.ok(content.argument.length >= 2);
    for (const [question, correct] of [
      [content.decision, decision],
      [content.transfer, transfer],
    ]) {
      assert.deepEqual(
        question.choices
          .filter((choice) => choice.correct)
          .map((choice) => choice.id),
        [correct],
      );
      assert.equal(
        new Set(question.choices.map((choice) => choice.id)).size,
        question.choices.length,
      );
      positions.add(question.choices.findIndex((choice) => choice.correct));
      for (const choice of question.choices) {
        assert.ok(
          choice.title.trim().length > 0 &&
            choice.explanation.trim().length > 0,
        );
        assert.equal(
          concepts.find((lesson) => lesson.id === choice.recovery)?.course,
          content.course,
        );
      }
    }
    const text = JSON.stringify(content);
    for (const [, expression] of text.matchAll(/\$([^$]+)\$/g))
      katex.renderToString(JSON.parse(`"${expression}"`), {
        throwOnError: true,
        strict: "ignore",
      });
  }
  assert.deepEqual(Object.fromEntries(counts), {
    MH1100: 3,
    MH1101: 3,
    MH2100: 3,
  });
  assert.equal(positions.size, 3);
  assert.equal(concepts.length, 125);
});

test("decisions commit before explanation, transfer is distinct, and stale actions cannot rewrite feedback", () => {
  const caseId = "rolle-corner";
  let session = {};
  const act = (event) => {
    session = clinicTransition(session, { caseId, ...event });
    return clinicAttempt(session, caseId);
  };
  assert.equal(act({ type: "commit" }).phase, "decision");
  assert.equal(act({ type: "choose", choiceId: "unknown" }).draft, null);
  act({ type: "choose", choiceId: "endpoints-suffice" });
  act({ type: "write", note: "I checked endpoints but forgot the corner." });
  assert.deepEqual(act({ type: "commit" }), {
    phase: "explained",
    decision: "endpoints-suffice",
    note: "I checked endpoints but forgot the corner.",
  });
  const explained = session;
  act({ type: "choose", choiceId: "corner-breaks-hypothesis" });
  assert.equal(session, explained);
  act({ type: "continue" });
  assert.equal(act({ type: "commit" }).phase, "transfer");
  assert.equal(
    act({ type: "choose", choiceId: "endpoints-suffice" }).draft,
    null,
  );
  act({ type: "choose", choiceId: "smooth-rolle" });
  assert.deepEqual(act({ type: "commit" }), {
    phase: "checked",
    decision: "endpoints-suffice",
    transfer: "smooth-rolle",
    note: "I checked endpoints but forgot the corner.",
  });
  const checked = session;
  act({ type: "continue" });
  act({ type: "commit" });
  assert.equal(session, checked);
});

test("case changes and recovery navigation leave independent tab attempts intact; fresh session resets", () => {
  let session = clinicTransition(
    {},
    {
      caseId: "rolle-corner",
      type: "choose",
      choiceId: "corner-breaks-hypothesis",
    },
  );
  session = clinicTransition(session, {
    caseId: "rolle-corner",
    type: "commit",
  });
  session = clinicTransition(session, {
    caseId: "chain-composition",
    type: "write",
    note: "a".repeat(2100),
  });
  assert.equal(clinicAttempt(session, "chain-composition").note.length, 2000);
  assert.equal(clinicAttempt(session, "rolle-corner").phase, "explained");
  session = clinicTransition(session, {
    caseId: "chain-composition",
    type: "restart",
  });
  assert.equal(clinicAttempt(session, "rolle-corner").phase, "explained");
  assert.deepEqual(clinicAttempt({}, "rolle-corner"), {
    phase: "decision",
    draft: null,
    note: "",
  });
});

test("Clinic selected-case URL is strict, bounded, versioned, and reciprocal with existing writers", () => {
  const base = new URL(
    "https://example.test/?source=friend&study=x&graph=y&library=z#course",
  );
  const url = new URL(clinicUrl(base, "rolle-corner"), base);
  assert.equal(url.hash, "#clinic");
  assert.equal(url.searchParams.get("source"), "friend");
  assert.deepEqual([...url.searchParams.keys()], ["source", "clinic"]);
  assert.deepEqual(readClinicHistory(url), {
    caseId: "rolle-corner",
    notice: "",
  });
  assert.deepEqual(readClinicHistory(new URL(clinicUrl(url, null), base)), {
    caseId: null,
    notice: "",
  });
  const lesson = concepts[0];
  for (const link of [
    routeUrl(url, "course"),
    graphUrl(url, initialGraph),
    libraryUrl(url, "MH2100", "flux"),
    lessonUrl(url, lesson.id, {
      version: 1,
      scene: lesson.scene,
      parameter: 0,
      mode: "learn",
      notesTab: "intuition",
    }),
  ]) {
    const next = new URL(link, base);
    assert.equal(next.searchParams.get("clinic"), null);
    assert.equal(next.searchParams.get("source"), "friend");
  }
  for (const value of [
    "{",
    "null",
    "[]",
    "x".repeat(301),
    JSON.stringify({ version: 2, caseId: "rolle-corner" }),
    JSON.stringify({ version: 1, caseId: "unknown" }),
    JSON.stringify({ version: 1, caseId: "rolle-corner", answers: [] }),
  ]) {
    url.searchParams.set("clinic", value);
    const invalid = readClinicHistory(url);
    assert.equal(invalid.caseId, null);
    assert.match(invalid.notice, /Choose a case/);
  }
  url.searchParams.set(
    "clinic",
    JSON.stringify({ version: 1, caseId: "rolle-corner" }),
  );
  url.searchParams.append("clinic", url.searchParams.get("clinic"));
  assert.equal(readClinicHistory(url).caseId, null);
});

test("recovery descriptors belong to their entry and permit only catalog cases, fixed focus and bounded finite scroll", () => {
  const point = {
    version: 1,
    caseId: "rolle-corner",
    focus: "diagnosis",
    scrollY: 842,
  };
  assert.deepEqual(
    readClinicReturn({ other: true, clinicReturn: point }, "rolle-mean-value"),
    point,
  );
  assert.equal(
    readClinicReturn({ clinicReturn: point }, "divergence-theorem"),
    null,
  );
  assert.deepEqual(
    readClinicPosition({ clinicPosition: point }, "rolle-corner"),
    point,
  );
  assert.equal(
    readClinicPosition({ clinicPosition: point }, "chain-composition"),
    null,
  );
  for (const patch of [
    { version: 2 },
    { caseId: "missing" },
    { focus: "#arbitrary-selector" },
    { scrollY: Infinity },
    { scrollY: NaN },
    { scrollY: -1 },
    { scrollY: 10_000_001 },
    { answers: [] },
  ])
    assert.equal(
      readClinicReturn(
        { clinicReturn: { ...point, ...patch } },
        "rolle-mean-value",
      ),
      null,
    );
});
