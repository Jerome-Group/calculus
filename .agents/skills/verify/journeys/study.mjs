import assert from "node:assert/strict";
import { lesson, mode, ready, visible } from "./controls.mjs";

export async function study(page, e) {
  await e.step(
    "Write a practice draft, open support, self-assess, and restore it after reload",
    async () => {
      await page.goto(e.url);
      await ready(page);
      await page
        .getByRole("textbox", {
          name: "Search the entire library",
          exact: true,
        })
        .fill("partial fractions");
      await page.locator(".search-library-results button").first().click();
      await visible(page.locator("#lesson-title"));
      assert.equal(new URL(page.url()).hash, "#partial-fractions");
      await mode(page, "Practice");
      const exercise = page.locator(".lesson-practice").first();
      const draft = exercise.getByRole("textbox");
      await draft.fill(
        "Factor the denominator and compare numerator coefficients.",
      );
      await exercise.getByText("First hint", { exact: true }).click();
      await exercise
        .getByText("Compare with a solution", { exact: true })
        .click();
      await exercise
        .getByRole("button", { name: "Needs practice", exact: true })
        .click();
      await e.check(
        "Self-assessment is identified as a device-local self-report",
        async () =>
          visible(
            exercise
              .getByRole("status")
              .filter({ hasText: /self-assessment, not an automatic grade/ }),
          ),
      );
      await page.reload();
      await e.check(
        "Reload restores the draft and opened support",
        async () => {
          assert.equal(
            await draft.inputValue(),
            "Factor the denominator and compare numerator coefficients.",
          );
          assert.equal(await exercise.locator("details[open]").count(), 2);
        },
      );
    },
  );
  await e.step(
    "Use study resume and revisit entries, then delete only this draft",
    async () => {
      await page.getByRole("button", { name: "Library", exact: true }).click();
      const progress = page.getByRole("region", {
        name: "Study on this device",
        exact: true,
      });
      await visible(progress.getByRole("button", { name: /^Resume:/ }));
      await progress.getByText("Revisit practice (1)", { exact: true }).click();
      await progress.locator("details").getByRole("button").click();
      assert.equal(new URL(page.url()).hash, "#partial-fractions");
      await page.getByRole("button", { name: "Library", exact: true }).click();
      await progress.getByRole("button", { name: /^Resume:/ }).click();
      await mode(page, "Practice");
      await page
        .locator(".lesson-practice")
        .first()
        .getByRole("button", { name: "Delete this draft", exact: true })
        .click();
      await e.check(
        "Deleting a draft preserves the recorded self-assessment",
        async () => {
          assert.equal(
            await page
              .locator(".lesson-practice")
              .first()
              .getByRole("textbox")
              .inputValue(),
            "",
          );
          await page
            .getByRole("button", { name: "Library", exact: true })
            .click();
          assert.match(await progress.innerText(), /1 marked for practice/);
        },
      );
    },
  );
  await e.step(
    "Record a pilot choice and confidence independently, then restore their visible results",
    async () => {
      await lesson(page, e, "epsilon-delta-one-variable");
      await mode(page, "Practice");
      const task = page.locator(".pilot-task").first();
      await task.getByRole("radio").nth(1).check();
      await task
        .getByRole("button", { name: "Show hint", exact: true })
        .click();
      await task
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await visible(task.getByRole("status").filter({ hasText: /Try again/ }));
      await task.getByRole("radio").first().check();
      await task
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await visible(
        task.getByRole("status").filter({ hasText: /Choice correct/ }),
      );
      await page.reload();
      await e.check("Pilot choice and hint survive reload", async () => {
        assert.equal(await task.getByRole("radio").first().isChecked(), true);
        await visible(task.getByText("Hint:", { exact: true }));
        await visible(
          task.getByRole("status").filter({ hasText: /Choice correct/ }),
        );
      });
      await mode(page, "Revise");
      await visible(
        page
          .locator("#pilot-errors")
          .locator("+ ul")
          .filter({ hasText: "QUANTIFIER_REVERSED" }),
      );
      await page
        .getByRole("button", { name: "I am unsure", exact: true })
        .click();
      await page.reload();
      await e.check(
        "Confidence persists separately from correctness",
        async () =>
          visible(page.getByText("Confidence: unsure.", { exact: false })),
      );
      await page.getByRole("button", { name: "Library", exact: true }).click();
      assert.match(
        await page
          .getByRole("region", { name: "Study on this device", exact: true })
          .innerText(),
        /2 choice attempts recorded/,
      );
    },
  );
  await e.step(
    "Keep practice usable when browser storage throws and keep another browser context fresh",
    async () => {
      const unavailable = await e.newPage({ storageUnavailable: true });
      await lesson(unavailable, e, "partial-fractions");
      await mode(unavailable, "Practice");
      const exercise = unavailable.locator(".lesson-practice").first();
      await exercise
        .getByRole("textbox")
        .fill("This tab retains the attempted reasoning.");
      await e.check(
        "Unavailable storage reports its limit and preserves the in-tab draft",
        async () => {
          await visible(
            exercise
              .getByRole("status")
              .filter({ hasText: /Storage is unavailable/ }),
          );
          assert.equal(
            await exercise.getByRole("textbox").inputValue(),
            "This tab retains the attempted reasoning.",
          );
        },
      );
      const fresh = await e.newPage();
      await fresh.goto(e.url);
      await e.check(
        "A fresh context starts without another context's study records",
        async () => {
          const progress = fresh.getByRole("region", {
            name: "Study on this device",
            exact: true,
          });
          await visible(progress);
          assert.match(
            await progress.innerText(),
            /0 marked for practice.*0 choice attempts recorded/s,
          );
        },
      );
    },
  );
  await e.step(
    "Open recorded error history through its revision link",
    async () => {
      await lesson(page, e, "epsilon-delta-one-variable");
      await mode(page, "Revise");
      await page
        .getByRole("link", { name: "Review your recorded errors", exact: true })
        .click();
      await e.check(
        "The error-history link preserves the revision workspace and recorded error",
        async () => {
          await visible(
            page.getByRole("region", {
              name: "Revision and retrieval",
              exact: true,
            }),
          );
          await visible(
            page
              .locator("#pilot-errors")
              .locator("+ ul")
              .filter({ hasText: "QUANTIFIER_REVERSED" }),
          );
        },
      );
    },
  );
}
