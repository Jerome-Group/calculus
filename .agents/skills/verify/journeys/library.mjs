import assert from "node:assert/strict";
import { visible, noOverflow, ready } from "./controls.mjs";

export async function library(page, e) {
  await e.step(
    "Open the public root and activate the keyboard skip link",
    async () => {
      await page.goto(e.url);
      await ready(page);
      await visible(page.locator("#library-title"));
      const skip = page.getByRole("link", { name: "Skip to mathematics" });
      await page.keyboard.press("Tab");
      await e.check("First Tab focuses Skip to mathematics", async () =>
        assert.equal(
          await skip.evaluate((element) => element === document.activeElement),
          true,
        ),
      );
      await page.keyboard.press("Enter");
      await e.check(
        "Skip navigation focuses the mathematics landmark",
        async () =>
          assert.equal(
            await page
              .locator("main")
              .evaluate((element) => element === document.activeElement),
            true,
          ),
      );
    },
  );
  await e.step(
    "Choose each course using its library card and sidebar course rail",
    async () => {
      const courses = [
        ["MH1100", "Calculus I", 24],
        ["MH1101", "Calculus II", 30],
        ["MH2100", "Calculus III", 71],
      ];
      for (const [kind, group, state] of [
        ["card", page.locator(".course-paths"), "aria-pressed"],
        [
          "rail",
          page.getByRole("navigation", { name: "Courses", exact: true }),
          "aria-current",
        ],
      ])
        for (const [id, title, count] of courses) {
          const button = group.getByRole("button", { name: new RegExp(id) });
          if (kind === "rail")
            assert.notEqual(await button.getAttribute(state), "true");
          await button.click();
          await e.check(
            `${id} ${kind} selects ${count} explorations`,
            async () => {
              assert.equal(await button.getAttribute(state), "true");
              await visible(
                page
                  .locator(".unit-library")
                  .getByRole("heading", { name: title, exact: true }),
              );
              assert.match(
                await page.locator(".unit-library > header").innerText(),
                new RegExp(`${count} explorations`),
              );
              assert.equal(
                await page.locator(".unit-concepts button").count(),
                count,
              );
              assert.equal(new URL(page.url()).hash, "#course");
            },
          );
        }
    },
  );
  await e.step(
    "Search from the library, reload, open a result, and restore search with Back and Forward",
    async () => {
      const search = page.getByRole("textbox", {
        name: "Search the entire library",
        exact: true,
      });
      await search.fill("integral");
      const result = page.locator(".search-library-results button").first();
      await visible(result);
      await e.check(
        "Search results include both Calculus II and Calculus III",
        async () => {
          const labels = await page
            .locator(".search-library-results small")
            .allTextContents();
          assert.ok(labels.some((label) => label.includes("MH1101")));
          assert.ok(labels.some((label) => label.includes("MH2100")));
        },
      );
      const text = await result.locator("strong").innerText();
      await page.reload();
      await ready(page);
      await e.check("Library query survives a real reload", async () =>
        assert.equal(await search.inputValue(), "integral"),
      );
      await page.locator(".search-library-results button").first().click();
      await visible(page.locator("#lesson-title"));
      assert.equal(await page.locator("#lesson-title").innerText(), text);
      await page.goBack();
      await e.check("Back restores the query and results", async () => {
        await visible(result);
        assert.equal(await search.inputValue(), "integral");
      });
      await page.goForward();
      await visible(page.locator("#lesson-title"));
      await page.getByRole("button", { name: "Library", exact: true }).click();
      await search.fill("zzznomatchingconcept");
      await e.check("No matches has a usable clear action", async () =>
        visible(page.getByText("No matching concepts.", { exact: false })),
      );
      await page
        .locator(".library-search")
        .getByRole("button", { name: "Clear search" })
        .click();
      assert.equal(await search.inputValue(), "");
    },
  );
  await e.step(
    "Use sidebar search, course overview, brand home, and topbar resume",
    async () => {
      await page
        .getByRole("textbox", { name: "Find a concept", exact: true })
        .fill("Jacobian");
      await page
        .getByRole("navigation", { name: "Course concepts", exact: true })
        .getByRole("button")
        .first()
        .click();
      await visible(page.locator("#lesson-title"));
      const selectedLesson = new URL(page.url()).hash;
      await page
        .getByRole("button", { name: "Course overview", exact: true })
        .click();
      await visible(page.locator("#library-title"));
      await page
        .getByRole("button", { name: "Resume lesson", exact: true })
        .click();
      await visible(page.locator("#lesson-title"));
      await e.check("Resume restores the selected lesson", async () =>
        assert.equal(new URL(page.url()).hash, selectedLesson),
      );
      await page.getByRole("link", { name: "Calculus", exact: true }).click();
      await e.check("Brand returns to the library", async () =>
        visible(page.locator("#library-title")),
      );
    },
  );
  await e.step(
    "Restore bare-root defaults, contain route warnings, and exclude the collapsed sidebar from focus",
    async () => {
      await page.goto(e.url);
      await ready(page);
      await page
        .locator(".course-paths")
        .getByRole("button", { name: /MH2100/ })
        .click();
      await visible(
        page
          .locator(".unit-library")
          .getByRole("heading", { name: "Calculus III", exact: true }),
      );
      await page.goBack();
      await visible(page.locator("#library-title"));
      await e.check(
        "Back to the bare root restores Calculus I and an empty query",
        async () => {
          assert.match(
            await page.locator(".unit-library > header").innerText(),
            /MH1100/,
          );
          assert.equal(
            await page
              .getByRole("textbox", {
                name: "Search the entire library",
                exact: true,
              })
              .inputValue(),
            "",
          );
          assert.equal(new URL(page.url()).hash, "");
        },
      );
      await page.goto(`${e.url}/?study=invalid#derivative-definition`);
      await ready(page);
      await visible(
        page
          .getByRole("status")
          .filter({ hasText: /shared lesson state could not be restored/ }),
      );
      await page.getByRole("button", { name: "Library", exact: true }).click();
      await visible(page.locator("#library-title"));
      await e.check(
        "A lesson arrival warning does not follow into Library",
        async () =>
          assert.doesNotMatch(
            await page.locator("main").innerText(),
            /shared lesson state could not be restored/,
          ),
      );
      await page
        .getByRole("button", { name: "Minimise sidebar", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-slot="sidebar-container"]')
            .getBoundingClientRect().right <= 1,
      );
      await e.check(
        "The collapsed sidebar excludes hidden keyboard targets",
        async () => {
          const sidebar = page.locator('[data-slot="sidebar-container"]');
          assert.equal(await sidebar.getAttribute("aria-hidden"), "true");
          assert.equal(
            await sidebar.evaluate((element) => element.inert),
            true,
          );
          for (let index = 0; index < 6; index++) {
            await page.keyboard.press("Tab");
            assert.equal(
              await page.evaluate(
                () => !!document.activeElement?.closest(".atlas-sidebar"),
              ),
              false,
            );
          }
        },
      );
      await page
        .getByRole("button", { name: "Toggle lecture navigation", exact: true })
        .click();
      const overview = page.getByRole("button", {
        name: "Course overview",
        exact: true,
      });
      await visible(overview);
      await overview.focus();
      await page.keyboard.press(
        process.platform === "darwin" ? "Meta+b" : "Control+b",
      );
      await e.check(
        "Closing the sidebar from inside returns focus to its visible trigger",
        async () => {
          await page.waitForFunction(
            () =>
              document.activeElement?.getAttribute("data-sidebar") ===
              "trigger",
          );
          assert.ok(
            await page.evaluate(
              () => document.activeElement.getBoundingClientRect().right > 0,
            ),
          );
        },
      );
      await page
        .getByRole("button", { name: "Toggle lecture navigation", exact: true })
        .click();
      await visible(overview);
    },
  );
  await e.step(
    "Clear an obsolete fallback explanation through search",
    async () => {
      await page.goto(`${e.url}/?library=invalid#course`);
      const notice = page
        .getByRole("status")
        .filter({ hasText: /Showing Calculus I with an empty search/ });
      await visible(notice);
      const search = page.getByRole("textbox", {
        name: "Search the entire library",
        exact: true,
      });
      await search.fill("integral");
      await e.check(
        "A deliberate search clears fallback text and survives reload",
        async () => {
          assert.equal(await notice.count(), 0);
          await visible(page.locator(".search-library-results button").first());
          await page.reload();
          await ready(page);
          assert.equal(await search.inputValue(), "integral");
          assert.equal(await notice.count(), 0);
        },
      );
    },
  );
  await e.step(
    "Explain malformed library state and operate the phone navigation",
    async () => {
      await page.goto(`${e.url}/?library=invalid#course`);
      await e.check("Malformed library state explains its default", async () =>
        visible(
          page
            .getByRole("status")
            .filter({ hasText: /Showing Calculus I with an empty search/ }),
        ),
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await noOverflow(page);
      await page
        .getByRole("button", { name: "Toggle lecture navigation", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await visible(dialog);
      await dialog
        .getByRole("navigation", { name: "Courses", exact: true })
        .getByRole("button", { name: /MH2100/ })
        .click();
      await e.check(
        "Phone course navigation closes and selects Calculus III",
        async () => {
          await dialog.waitFor({ state: "hidden" });
          await visible(
            page
              .locator(".unit-library")
              .getByRole("heading", { name: "Calculus III", exact: true }),
          );
          await noOverflow(page);
        },
      );
      await e.check(
        "Choosing a course clears the obsolete invalid-library notice",
        async () =>
          assert.equal(
            await page
              .getByRole("status")
              .filter({ hasText: /Showing Calculus I with an empty search/ })
              .count(),
            0,
          ),
      );
      await page.getByText("Browser tools", { exact: true }).click();
      await e.check("The interface remains usable without WebMCP", async () =>
        visible(page.locator(".agent-status p")),
      );
    },
  );
}
