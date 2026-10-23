#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseBrowserArgs, runBrowser } from "./cli.mjs";
import { lesson, mode, visible } from "./journeys/controls.mjs";

async function canonicalRoutes(page, e) {
  const concepts = JSON.parse(
    await readFile(
      new URL("../../../lib/curriculum/concepts.json", import.meta.url),
      "utf8",
    ),
  );
  const guides = JSON.parse(
    await readFile(
      new URL("../../../lib/curriculum/learning-guides.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(concepts.length, 125);
  assert.equal(new Set(concepts.map(({ id }) => id)).size, concepts.length);
  for (const course of new Set(concepts.map((concept) => concept.course))) {
    await e.step(`Open every ${course} canonical Learn route`, async () => {
      for (const concept of concepts.filter((item) => item.course === course)) {
        await lesson(page, e, concept.id);
        await mode(page, "Learn");
        await e.check(
          `${concept.id} delivers canonical notes and exercises once`,
          async () => {
            const guide = guides[concept.id];
            assert.ok(guide, `Missing source guide ${concept.id}`);
            const ids = await page
              .locator("[id]")
              .evaluateAll((items) => items.map((item) => item.id));
            assert.equal(
              new Set(ids).size,
              ids.length,
              `${concept.id} duplicate DOM ids`,
            );
            for (const id of [
              "notes-intuition",
              "notes-example",
              "notes-pitfall",
              ...(guide.contentBlocks ?? []).map((block) => block.id),
              ...(guide.supplementalBlocks ?? []).map((block) => block.id),
              `answer-${concept.id}-core`,
              ...(guide.exercises ?? []).map(
                (exercise) => `answer-${concept.id}-${exercise.id}`,
              ),
            ])
              assert.equal(
                ids.filter((value) => value === id).length,
                1,
                `${concept.id}:${id}`,
              );
            assert.equal(
              await page
                .getByRole("region", {
                  name: "Mathematical explanation",
                  exact: true,
                })
                .count(),
              1,
            );
            assert.ok(await page.locator("math").count());
            assert.equal(await page.locator(".katex-error").count(), 0);
          },
        );
      }
    });
  }
  for (const id of ["epsilon-delta-one-variable", "type-one-two-regions"]) {
    await e.step(
      `${id} retains canonical Practice and pilot activities`,
      async () => {
        await lesson(page, e, id);
        await mode(page, "Practice");
        await visible(page.locator(`[id="answer-${id}-core"]`));
        await e.check(
          `${id} exposes each canonical reasoning field once`,
          async () => {
            const ids = await page
              .locator("textarea[id]")
              .evaluateAll((items) => items.map((item) => item.id));
            for (const exercise of [
              "core",
              ...(guides[id].exercises ?? []).map((item) => item.id),
            ])
              assert.equal(
                ids.filter((value) => value === `answer-${id}-${exercise}`)
                  .length,
                1,
              );
            assert.ok(
              await page
                .getByRole("button", { name: "Check answer", exact: true })
                .count(),
            );
          },
        );
        await mode(page, "Explore");
        await e.check(`${id} retains its pilot diagram and values`, async () =>
          visible(
            page.getByRole("button", { name: "Values only", exact: true }),
          ),
        );
        await mode(page, "Revise");
        await e.check(`${id} retains recall and account history`, async () => {
          await visible(
            page.getByText("Retrieve before looking back", { exact: true }),
          );
          await visible(
            page.getByRole("heading", {
              name: "Saved account history",
              exact: true,
            }),
          );
        });
      },
    );
  }
}

try {
  const args = process.argv.slice(2);
  const { options } = parseBrowserArgs(["run", ...args]);
  if (!args.includes("--timeout-ms")) options.timeoutMs = 540000;
  const report = await runBrowser(options, [
    { id: "canonical-routes", run: canonicalRoutes },
  ]);
  process.stdout.write(
    `${JSON.stringify({ status: report.status, output: report.output, assertions: report.features[0]?.assertions.length, error: report.error })}\n`,
  );
  if (report.status !== "passed") process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
}
