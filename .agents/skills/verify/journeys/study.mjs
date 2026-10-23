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
        "Self-assessment is identified as a learner self-report",
        async () =>
          visible(
            exercise.getByText(/self-assessment, not an automatic grade/),
          ),
      );
      await saved(exercise);
      await saved(exercise, 1);
      await page.reload();
      await saved(exercise);
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
        name: "Your study",
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
      await e.check(
        "The wrong pilot choice receives its own immutable acknowledgement",
        async () => {
          const attempt = await acknowledgeChoice(page, task, () =>
            task
              .getByRole("button", { name: "Check answer", exact: true })
              .click(),
          );
          assert.equal(attempt.correct, false);
        },
      );
      await visible(task.getByRole("status").filter({ hasText: /Try again/ }));
      await saved(task);
      await task.getByRole("radio").first().check();
      await e.check(
        "The correct pilot choice receives its separate immutable acknowledgement",
        async () => {
          const attempt = await acknowledgeChoice(page, task, () =>
            task
              .getByRole("button", { name: "Check answer", exact: true })
              .click(),
          );
          assert.equal(attempt.correct, true);
        },
      );
      await visible(
        task.getByRole("status").filter({ hasText: /Choice correct/ }),
      );
      await visible(
        task
          .getByRole("status")
          .filter({ hasText: "Choice record: Saved to your account." }),
      );
      await saved(task);
      await page.reload();
      await saved(task);
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
          .locator("+ p + ul")
          .filter({ hasText: "QUANTIFIER_REVERSED" }),
      );
      await page
        .getByRole("button", { name: "I am unsure", exact: true })
        .click();
      await saved(
        page.getByRole("region", {
          name: "Revision and retrieval",
          exact: true,
        }),
      );
      await page.reload();
      await e.check(
        "Confidence persists separately from correctness",
        async () =>
          visible(page.getByText("Confidence: unsure.", { exact: false })),
      );
      await page.getByRole("button", { name: "Library", exact: true }).click();
      assert.match(
        await page
          .getByRole("region", { name: "Your study", exact: true })
          .innerText(),
        /2 choice attempts recorded/,
      );
    },
  );
  await e.step(
    "Restore the same account in a new context and isolate another account",
    async () => {
      const replica = await e.newPage({ account: "verification-a" });
      await replica.goto(e.url);
      const summary = replica.getByRole("region", {
        name: "Your study",
        exact: true,
      });
      await visible(summary.getByText(/2 choice attempts recorded/));
      await e.check(
        "A new context restores account history without browser storage",
        async () => {
          assert.match(await summary.innerText(), /1 marked for practice/);
          assert.equal(await replica.evaluate(() => localStorage.length), 0);
        },
      );
      const other = await e.newPage({ account: "verification-b" });
      const otherExercise = await practice(other, e);
      await visible(
        otherExercise
          .getByRole("status")
          .filter({ hasText: "No saved account record yet." })
          .first(),
      );
      await e.check(
        "Another account has no draft or attempts from the first account",
        async () => {
          assert.equal(
            await otherExercise.getByRole("textbox").inputValue(),
            "",
          );
          await other
            .getByRole("button", { name: "Library", exact: true })
            .click();
          assert.match(
            await other
              .getByRole("region", { name: "Your study", exact: true })
              .innerText(),
            /0 marked for practice.*0 choice attempts recorded/s,
          );
        },
      );
    },
  );
  await e.step(
    "Resolve an actual concurrent account edit explicitly",
    async () => {
      const first = await e.newPage({ account: "verification-a" });
      const second = await e.newPage({ account: "verification-a" });
      const firstExercise = await practice(first, e);
      const secondExercise = await practice(second, e);
      await saved(firstExercise);
      await saved(secondExercise);
      await firstExercise.getByRole("textbox").fill("First account version.");
      await saved(firstExercise);
      const expected = e.expectStudyFailure("conflict", 409, second);
      try {
        await secondExercise
          .getByRole("textbox")
          .fill("Conflicting tab version.");
        await visible(
          secondExercise.getByRole("button", {
            name: "Use account version",
            exact: true,
          }),
        );
        await e.check(
          "A stale edit keeps local reasoning and offers an explicit conflict choice",
          async () => {
            assert.equal(
              await secondExercise.getByRole("textbox").inputValue(),
              "Conflicting tab version.",
            );
            await secondExercise
              .getByText("Compare versions", { exact: true })
              .click();
            assert.match(
              await secondExercise.locator("pre").last().innerText(),
              /First account version/,
            );
          },
        );
        await secondExercise
          .getByRole("button", { name: "Use account version", exact: true })
          .click();
        await e.check(
          "Choosing the account version restores its reasoning",
          async () => {
            assert.equal(
              await secondExercise.getByRole("textbox").inputValue(),
              "First account version.",
            );
          },
        );
      } finally {
        expected.active = false;
      }
      const offline = e.expectStudyFailure("offline", undefined, first);
      await first.context().setOffline(true);
      await firstExercise
        .getByRole("textbox")
        .fill("Reasoning preserved while offline.");
      await visible(
        firstExercise
          .getByRole("status")
          .filter({ hasText: "Not saved to your account." }),
      );
      await e.check(
        "A failed save preserves the input and never claims acknowledgement",
        async () => {
          assert.equal(
            await firstExercise.getByRole("textbox").inputValue(),
            "Reasoning preserved while offline.",
          );
        },
      );
      await first.context().setOffline(false);
      offline.active = false;
      await firstExercise
        .getByRole("button", { name: "Retry save", exact: true })
        .click();
      await saved(firstExercise);
      await first.reload();
      await saved(firstExercise);
      await e.check(
        "Retry receives an account acknowledgement and survives reload",
        async () => {
          assert.equal(
            await firstExercise.getByRole("textbox").inputValue(),
            "Reasoning preserved while offline.",
          );
        },
      );
    },
  );
  await e.step(
    "Keep a failed assessment actionable after another record refreshes the summary",
    async () => {
      const recovery = await e.newPage({
        account: "verification-assessment-recovery",
      });
      const exercise = await practice(recovery, e);
      await exercise
        .getByText("Compare with a solution", { exact: true })
        .click();
      await exercise
        .getByRole("button", { name: "Needs practice", exact: true })
        .click();
      await saved(exercise, 1);
      const assessment = exercise.locator(".study-save-status").nth(1);
      const expected = e.expectStudyFailure("service", 503, recovery);
      let unavailable = true;
      let failedWrites = 0;
      await recovery.route(`${e.url}/api/study`, async (route) => {
        const request = route.request();
        const body =
          request.method() === "POST" ? request.postDataJSON() : null;
        if (
          unavailable &&
          body?.operation === "write" &&
          body.key.kind === "assessment"
        ) {
          failedWrites++;
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              error: "service",
              user: {
                id: "verification-assessment-recovery",
                email: "verification-assessment-recovery@example.invalid",
                displayName: "verification-assessment-recovery@example.invalid",
                fullName: null,
              },
            }),
          });
        } else await route.continue();
      });
      try {
        await exercise
          .getByRole("button", {
            name: "I can explain it independently",
            exact: true,
          })
          .click();
        await visible(
          assessment.getByRole("button", { name: "Retry save", exact: true }),
        );
        const overview = recovery.waitForResponse(
          (response) =>
            new URL(response.url()).searchParams.get("scope") === "overview",
        );
        await exercise
          .getByRole("textbox")
          .fill("Keep the failed assessment retryable.");
        assert.equal((await overview).status(), 200);
        await saved(exercise);
        await e.check(
          "An unrelated acknowledgement preserves the failed assessment and its retry",
          async () => {
            assert.equal(failedWrites, 1);
            await visible(
              assessment.getByRole("button", {
                name: "Retry save",
                exact: true,
              }),
            );
            await visible(
              exercise.getByText(
                "Can explain independently. This is your self-assessment, not an automatic grade.",
                { exact: true },
              ),
            );
          },
        );
        unavailable = false;
        await assessment
          .getByRole("button", { name: "Retry save", exact: true })
          .click();
        await saved(exercise, 1);
        await recovery.reload();
        await saved(exercise, 1);
        await e.check(
          "Explicit retry acknowledges the intended assessment and survives reload",
          async () => {
            await visible(
              exercise.getByText(
                "Can explain independently. This is your self-assessment, not an automatic grade.",
                { exact: true },
              ),
            );
            assert.equal(
              await exercise.getByRole("textbox").inputValue(),
              "Keep the failed assessment retryable.",
            );
          },
        );
      } finally {
        expected.active = false;
        await recovery.unroute(`${e.url}/api/study`);
      }
    },
  );
  await e.step(
    "Bound failed account reads and recover only after an explicit retry",
    async () => {
      const outage = await e.newPage({ account: "verification-outage" });
      const expected = e.expectStudyFailure("service", 503, outage);
      let unavailable = true;
      let failedRequests = 0;
      await outage.route(`${e.url}/api/study*`, async (route) => {
        if (
          !unavailable ||
          new URL(route.request().url()).searchParams.get("scope") ===
            "identity"
        )
          return route.continue();
        failedRequests++;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: "service",
            user: {
              id: "verification-outage",
              email: "verification-outage@example.invalid",
              displayName: "verification-outage@example.invalid",
              fullName: null,
            },
          }),
        });
      });
      const exercise = await practice(outage, e);
      await exercise.getByRole("textbox").fill("Keep this outage reasoning.");
      await visible(
        exercise
          .getByRole("status")
          .filter({ hasText: "Not saved to your account." })
          .first(),
      );
      const before = failedRequests;
      await outage.waitForTimeout(1000);
      await e.check(
        `Failed reads stop without retry (${failedRequests} requests)`,
        async () => {
          assert.equal(failedRequests, before);
          assert.ok(failedRequests > 0 && failedRequests <= 8);
          assert.equal(
            await exercise.getByRole("textbox").inputValue(),
            "Keep this outage reasoning.",
          );
        },
      );
      await outage
        .getByRole("button", { name: "Library", exact: true })
        .click();
      const summary = outage.getByRole("region", {
        name: "Your study",
        exact: true,
      });
      await visible(
        summary.getByRole("button", { name: "Retry summary", exact: true }),
      );
      unavailable = false;
      expected.active = false;
      await summary
        .getByRole("button", { name: "Retry summary", exact: true })
        .click();
      await outage
        .getByRole("textbox", {
          name: "Search the entire library",
          exact: true,
        })
        .fill("partial fractions");
      await outage.locator(".search-library-results button").first().click();
      await mode(outage, "Practice");
      await saved(exercise);
      await outage.reload();
      await saved(exercise);
      await e.check(
        "Explicit retry saves retained reasoning after service recovery",
        async () => {
          assert.equal(
            await exercise.getByRole("textbox").inputValue(),
            "Keep this outage reasoning.",
          );
        },
      );
    },
  );
  await e.step(
    "Keep guest work in the tab and expose native authentication and import controls",
    async () => {
      const guest = await e.newPage({
        account: null,
        storageUnavailable: true,
      });
      const exercise = await practice(guest, e);
      await exercise
        .getByRole("textbox")
        .fill("Guest reasoning stays in this tab.");
      await e.check(
        "Guest input works without browser storage and explains its limit",
        async () => {
          await visible(
            exercise
              .getByRole("status")
              .filter({ hasText: "Sign in to save." })
              .first(),
          );
          assert.equal(
            await exercise.getByRole("textbox").inputValue(),
            "Guest reasoning stays in this tab.",
          );
        },
      );
      const signIn = guest.getByRole("link", {
        name: "Sign in with ChatGPT",
        exact: true,
      });
      assert.equal(await signIn.getAttribute("target"), "_top");
      assert.equal(
        new URL(await signIn.getAttribute("href"), e.url).pathname,
        "/signin-with-chatgpt",
      );
      await guest.reload();
      await e.check(
        "A guest reload does not restore another account or persist guest reasoning",
        async () => {
          await visible(
            exercise
              .getByRole("status")
              .filter({ hasText: "Sign in to save." })
              .first(),
          );
          assert.equal(await exercise.getByRole("textbox").inputValue(), "");
        },
      );
      const account = page.getByRole("region", {
        name: "Your account",
        exact: true,
      });
      const signOut = account.getByRole("link", {
        name: "Sign out",
        exact: true,
      });
      assert.equal(await signOut.getAttribute("target"), "_top");
      assert.equal(
        new URL(await signOut.getAttribute("href"), e.url).pathname,
        "/signout-with-chatgpt",
      );
      await account
        .getByText("Import old study from this device", { exact: true })
        .click();
      await account
        .getByRole("button", { name: "Preview device records", exact: true })
        .click();
      await e.check(
        "Legacy import requires an explicit preview and identifies the destination",
        async () => {
          await visible(account.getByText(/0 valid records from/));
          assert.match(
            await account.innerText(),
            /verification-a@example.invalid/,
          );
        },
      );
    },
  );
  await e.step(
    "Import explicit legacy-device input without replacing account records",
    async () => {
      const attempt = {
        taskId: "quantifiers",
        kind: "recognition",
        correct: true,
        support: "none",
        at: "2026-01-01T00:00:00Z",
      };
      const source = (attempts) => [
        {
          name: "calculus-practice",
          value: JSON.stringify({
            "derivative-definition": {
              status: "Needs practice",
              date: "2026-01-01",
            },
          }),
        },
        {
          name: "calculus-pilot-progress-v2",
          value: JSON.stringify({ "epsilon-delta-one-variable": { attempts } }),
        },
      ];
      const device = source([attempt, attempt]);
      const importer = await e.newPage({
        account: "verification-import",
        storageState: {
          cookies: [],
          origins: [{ origin: e.url, localStorage: device }],
        },
      });
      await importer.goto(e.url);
      const account = importer.getByRole("region", {
        name: "Your account",
        exact: true,
      });
      await visible(
        account.getByRole("link", { name: "Sign out", exact: true }),
      );
      await account
        .getByText("Import old study from this device", { exact: true })
        .click();
      await account
        .getByRole("button", { name: "Preview device records", exact: true })
        .click();
      await visible(account.getByText(/3 valid records from/));
      await e.check("Legacy preview does not write account study", async () => {
        assert.match(
          await importer
            .getByRole("region", { name: "Your study", exact: true })
            .innerText(),
          /0 choice attempts recorded/,
        );
      });
      await account
        .getByRole("button", {
          name: "Confirm import into this account",
          exact: true,
        })
        .click();
      await visible(
        account.getByRole("status").filter({ hasText: /3 imported/ }),
      );
      await e.check(
        "Import preserves identical historical attempt multiplicity and source bytes",
        async () => {
          await visible(
            importer
              .getByRole("region", { name: "Your study", exact: true })
              .getByText(/2 choice attempts recorded/),
          );
          assert.deepEqual(
            await importer.evaluate(
              (keys) =>
                keys.map((key) => ({
                  name: key,
                  value: localStorage.getItem(key),
                })),
              device.map(({ name }) => name),
            ),
            device,
          );
        },
      );
      await account
        .getByRole("button", {
          name: "Confirm import into this account",
          exact: true,
        })
        .click();
      await e.check(
        "Repeating an import retains all existing records",
        async () => {
          await visible(
            account
              .getByRole("status")
              .filter({ hasText: /0 imported.*3 existing records retained/s }),
          );
          assert.match(
            await importer
              .getByRole("region", { name: "Your study", exact: true })
              .innerText(),
            /2 choice attempts recorded/,
          );
        },
      );
      const later = await e.newPage({
        account: "verification-import",
        storageState: {
          cookies: [],
          origins: [
            {
              origin: e.url,
              localStorage: source([
                attempt,
                attempt,
                { ...attempt, at: "2026-01-02T00:00:00Z" },
              ]),
            },
          ],
        },
      });
      await later.goto(e.url);
      const laterAccount = later.getByRole("region", {
        name: "Your account",
        exact: true,
      });
      await visible(
        laterAccount.getByRole("link", { name: "Sign out", exact: true }),
      );
      await laterAccount
        .getByText("Import old study from this device", { exact: true })
        .click();
      await laterAccount
        .getByRole("button", { name: "Preview device records", exact: true })
        .click();
      await visible(laterAccount.getByText(/4 valid records from/));
      await laterAccount
        .getByRole("button", {
          name: "Confirm import into this account",
          exact: true,
        })
        .click();
      await e.check(
        "An appended legacy attempt adds only that attempt",
        async () => {
          await visible(
            laterAccount
              .getByRole("status")
              .filter({ hasText: /1 imported.*3 existing records retained/s }),
          );
          await visible(
            later
              .getByRole("region", { name: "Your study", exact: true })
              .getByText(/3 choice attempts recorded/),
          );
        },
      );
    },
  );
  await e.step(
    "Open recorded error history through its revision control",
    async () => {
      await lesson(page, e, "epsilon-delta-one-variable");
      await mode(page, "Revise");
      const route = page.url();
      await page
        .getByText("Review your recorded choices", { exact: true })
        .click();
      await e.check(
        "The error-history control preserves the exact revision route and workspace",
        async () => {
          assert.equal(page.url(), route);
          await visible(
            page.getByRole("region", {
              name: "Revision and retrieval",
              exact: true,
            }),
          );
        },
      );
      await e.check(
        "Error-history navigation focuses its visible heading",
        async () => {
          const heading = page.locator("#pilot-errors");
          await visible(heading);
          assert.equal(
            await heading.evaluate(
              (element) => element === document.activeElement,
            ),
            true,
          );
        },
      );
      await e.check(
        "The focused error history exposes the recorded error",
        async () =>
          visible(
            page
              .locator("#pilot-errors")
              .locator("+ p + ul")
              .filter({ hasText: "QUANTIFIER_REVERSED" }),
          ),
      );
    },
  );
  await e.step(
    "Retry every failed choice for one task and retain both acknowledged events",
    async () => {
      const recovery = await e.newPage({
        account: "verification-choice-recovery",
      });
      await lesson(recovery, e, "epsilon-delta-one-variable");
      await mode(recovery, "Practice");
      const task = recovery.locator(".pilot-task").first();
      await task.getByRole("radio").first().check();
      const failure = e.expectStudyFailure("service", 503, recovery);
      await recovery.route("**/api/study", async (route) => {
        if (
          route.request().method() === "POST" &&
          route.request().postDataJSON()?.operation === "attempt"
        )
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "Choice service unavailable" }),
          });
        else await route.continue();
      });
      const retry = task.getByRole("button", {
        name: "Retry choice save",
        exact: true,
      });
      for (let index = 0; index < 2; index++) {
        const response = recovery.waitForResponse(
          (item) =>
            item.url().endsWith("/api/study") &&
            item.request().method() === "POST" &&
            item.request().postDataJSON()?.operation === "attempt",
        );
        await task
          .getByRole("button", { name: "Check answer", exact: true })
          .click();
        assert.equal((await response).status(), 503);
        await visible(retry.nth(index));
      }
      await e.check(
        "Both failed choice saves expose independent retry controls",
        async () => assert.equal(await retry.count(), 2),
      );
      await recovery.unroute("**/api/study");
      failure.active = false;
      const retried = [];
      for (let remaining = 2; remaining > 0; remaining--) {
        const attempt = await acknowledgeChoice(recovery, task, () =>
          retry.first().click(),
        );
        retried.push(attempt.id);
        await recovery.waitForFunction(
          (expected) =>
            Array.from(document.querySelectorAll(".pilot-task button")).filter(
              (button) => button.textContent === "Retry choice save",
            ).length === expected,
          remaining - 1,
        );
      }
      await saved(task);
      await recovery
        .locator(".study-account")
        .getByRole("status")
        .filter({ hasText: "Some work is not saved." })
        .waitFor({ state: "hidden" });
      await e.check(
        "Acknowledged choices leave one receipt and no unsaved work",
        async () => {
          assert.equal(new Set(retried).size, 2);
          assert.equal(
            await task
              .getByRole("status")
              .filter({ hasText: /^Choice record:/ })
              .count(),
            1,
          );
          assert.doesNotMatch(
            await recovery.locator(".study-account").innerText(),
            /Some work is not saved/,
          );
        },
      );
      await mode(recovery, "Revise");
      await e.check(
        "Both retried choices appear once in account history",
        async () =>
          visible(recovery.getByText(/2 saved account records loaded/)),
      );
      await recovery.reload();
      await mode(recovery, "Revise");
      await e.check(
        "Reload retains both acknowledged choices once",
        async () => {
          await visible(recovery.getByText(/2 saved account records loaded/));
        },
      );
    },
  );
  await e.step(
    "Explain denied device-storage access during import preview",
    async () => {
      const denied = await e.newPage({
        account: "verification-denied-storage",
      });
      await denied.context().addInitScript(() =>
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new DOMException(
              "Verification denied storage getter",
              "SecurityError",
            );
          },
        }),
      );
      await lesson(denied, e, "epsilon-delta-one-variable");
      await denied
        .getByText("Import old study from this device", { exact: true })
        .click();
      await denied
        .getByRole("button", { name: "Preview device records", exact: true })
        .click();
      await e.check(
        "Denied storage shows its rejection without enabling import",
        async () => {
          await visible(
            denied.getByText(
              "Device storage is unavailable. Source data was not changed.",
              { exact: true },
            ),
          );
          assert.equal(
            await denied
              .getByRole("button", {
                name: "Confirm import into this account",
                exact: true,
              })
              .isEnabled(),
            false,
          );
        },
      );
    },
  );
}

async function acknowledgeChoice(page, task, action) {
  await visible(task);
  const submitted = page.waitForRequest((request) => {
    if (
      new URL(request.url()).pathname !== "/api/study" ||
      request.method() !== "POST"
    )
      return false;
    const command = request.postDataJSON();
    return (
      command?.operation === "attempt" &&
      command.attempt?.lessonId === "epsilon-delta-one-variable" &&
      command.attempt?.taskId === "quantifiers"
    );
  });
  await action();
  const request = await submitted;
  const acknowledgement = await request.response();
  assert.ok(acknowledgement, "The submitted choice receives a response");
  assert.equal(acknowledgement.status(), 200);
  const input = request.postDataJSON().attempt;
  const { record } = await acknowledgement.json();
  assert.equal(record.key, `attempt:${input.id}`);
  assert.equal(record.mutationId, input.id);
  for (const [key, value] of Object.entries(input))
    assert.equal(record.value[key], value);
  return record.value;
}

async function saved(region, index = 0) {
  await visible(
    region
      .locator(".study-save-status")
      .nth(index)
      .getByRole("status")
      .filter({ hasText: "Saved to your account." }),
  );
}
async function practice(page, evidence) {
  await lesson(page, evidence, "partial-fractions");
  await mode(page, "Practice");
  const exercise = page.locator(".lesson-practice").first();
  await visible(exercise.getByRole("textbox"));
  return exercise;
}
