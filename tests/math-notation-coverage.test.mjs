import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import katex from "katex";
import {
  inspectNotation as inspect,
  inspectTexSemantics,
  mathSpan,
  unmarkedNotation,
} from "./helpers/math-notation.mjs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const concepts = read("../lib/curriculum/concepts.json");
const guides = read("../lib/curriculum/learning-guides.json");
const sources = read("../lib/curriculum/sources.json");
function inspectExercise(exercise, locator, failures) {
  for (const field of ["prompt", "hint", "solution"])
    inspect(exercise[field], `${locator}.${field}`, failures);
  exercise.rubric.forEach((item, index) =>
    inspect(item, `${locator}.rubric[${index}]`, failures),
  );
  inspectTexSemantics(exercise.solutionTex, `${locator}.solutionTex`, failures);
}

test("catalog and every guide keep learner-facing math inside valid MathML spans", () => {
  const failures = [];
  for (const concept of concepts) {
    inspectTexSemantics(concept.formula, `${concept.id}.formula`, failures);
    inspect(concept.title, `${concept.id}.title`, failures);
    for (const field of [
      "definition",
      "conditions",
      "proof",
      "example",
      "pitfall",
      "task",
      "insight",
      "enrichment",
      "subtitle",
    ])
      if (concept[field])
        inspect(concept[field], `${concept.id}.${field}`, failures);
    concept.topics.forEach((topic, index) =>
      inspect(topic, `${concept.id}.topics[${index}]`, failures),
    );
    concept.sources?.forEach((source, index) => {
      if (source.detail)
        inspect(
          source.detail,
          `${concept.id}.sources[${index}].detail`,
          failures,
        );
      if (/\p{Cc}/u.test(source.detail ?? ""))
        failures.push(
          `${concept.id}.sources[${index}].detail: control character`,
        );
    });
  }
  for (const [id, source] of Object.entries(sources))
    source.errata?.forEach((erratum, index) => {
      for (const field of ["printed", "correction", "justification"])
        inspect(erratum[field], `${id}.errata[${index}].${field}`, failures);
    });
  for (const [id, guide] of Object.entries(guides)) {
    guide.sections.forEach((section, index) => {
      inspect(section.title, `${id}.sections[${index}].title`, failures);
      inspect(section.text, `${id}.sections[${index}].text`, failures);
    });
    inspectExercise(guide.exercise, `${id}.exercise`, failures);
    guide.exercises?.forEach((exercise, index) =>
      inspectExercise(exercise, `${id}.exercises[${index}]`, failures),
    );
    for (const [kind, blocks] of [
      ["contentBlocks", guide.contentBlocks],
      ["supplementalBlocks", guide.supplementalBlocks],
    ])
      blocks?.forEach((block, index) => {
        inspectTexSemantics(block.tex, `${id}.${kind}[${index}].tex`, failures);
        inspect(block.title, `${id}.${kind}[${index}].title`, failures);
        for (const field of [
          "statement",
          "note",
          "text",
          "strategy",
          "setup",
          "result",
          "verification",
        ])
          if (block[field])
            inspect(block[field], `${id}.${kind}[${index}].${field}`, failures);
        for (const field of ["hypotheses", "prerequisites", "items"])
          block[field]?.forEach((item, itemIndex) =>
            inspect(
              item,
              `${id}.${kind}[${index}].${field}[${itemIndex}]`,
              failures,
            ),
          );
        block.steps?.forEach((step, stepIndex) => {
          inspectTexSemantics(
            step.equation,
            `${id}.${kind}[${index}].steps[${stepIndex}].equation`,
            failures,
          );
          inspect(
            step.text,
            `${id}.${kind}[${index}].steps[${stepIndex}]`,
            failures,
          );
          if (step.usesHypothesis)
            inspect(
              step.usesHypothesis,
              `${id}.${kind}[${index}].steps[${stepIndex}].usesHypothesis`,
              failures,
            );
        });
      });
  }
  assert.equal(
    failures.length,
    0,
    `${failures.length} unmarked strings:\n${failures.slice(0, 30).join("\n")}`,
  );
});

test("semantic notation guard rejects math that KaTeX would parse as ordinary letters", () => {
  for (const bad of [
    "sqrt(x)",
    "lim_{h→0} f(h)",
    "Σ_{k=0}^n x^k",
    "D_(1,1)q(0)=1/2",
    "d(\\ln|x|)/dx=1/x",
  ]) {
    const failures = [];
    inspectTexSemantics(bad, "example", failures);
    assert.equal(failures.length, 1, bad);
  }
  for (const good of [
    "\\sqrt{x}",
    "\\lim_{h\\to0}f(h)",
    "\\sum_{k=0}^n x^k",
    "D_{(1,1)}q(0)=\\tfrac12",
    "\\frac{d}{dx}\\ln|x|=1/x",
  ]) {
    const failures = [];
    inspectTexSemantics(good, "example", failures);
    assert.deepEqual(failures, [], good);
  }
});

test("reported implicit-functions prose is explicitly marked for math rendering", () => {
  const guide = guides["implicit-functions-and-tangents"];
  for (const section of guide.sections)
    assert.doesNotMatch(section.text.replace(mathSpan, ""), unmarkedNotation);
  assert.doesNotMatch(
    guide.exercise.solution.replace(mathSpan, ""),
    unmarkedNotation,
  );
});

test("directional transfer subscript is grouped in MathML", () => {
  const transfer = guides["directional-derivatives-and-gradient"].exercises[0];
  const match = transfer.solution.match(/\$([^$]+)\$/);
  assert.ok(match);
  const mathml = katex.renderToString(match[1], { output: "mathml" });
  assert.match(
    mathml,
    /<msub><mi>D<\/mi><mrow><mo stretchy="false">\(<\/mo><mn>1<\/mn>/,
  );
});
