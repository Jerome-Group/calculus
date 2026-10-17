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
      for (
        let count = 0;
        count < 40 &&
        !(await skip.evaluate((element) => element === document.activeElement));
        count++
      )
        await page.keyboard.press("Tab");
      assert.equal(
        await skip.evaluate((element) => element === document.activeElement),
        true,
        "Skip navigation is keyboard reachable within 40 Tab presses",
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
      for (const [id, title, count] of [
        ["MH1100", "Calculus I", 24],
        ["MH1101", "Calculus II", 30],
        ["MH2100", "Calculus III", 71],
      ]) {
        const card = page
          .locator(".course-paths")
          .getByRole("button", { name: new RegExp(id) });
        await card.click();
        await e.check(`${id} card selects ${count} explorations`, async () => {
          assert.equal(await card.getAttribute("aria-pressed"), "true");
          await visible(
            page
              .locator(".unit-library")
              .getByRole("heading", { name: title, exact: true }),
          );
          assert.match(
            await page.locator(".unit-library > header").innerText(),
            new RegExp(`${count} explorations`),
          );
        });
        await page
          .getByRole("navigation", { name: "Courses", exact: true })
          .getByRole("button", { name: new RegExp(id) })
          .click();
        assert.equal(new URL(page.url()).hash, "#course");
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
      await search.fill("path");
      const result = page.locator(".search-library-results button").first();
      await visible(result);
      const text = await result.locator("strong").innerText();
      await page.reload();
      await e.check("Library query survives a real reload", async () =>
        assert.equal(await search.inputValue(), "path"),
      );
      await page.locator(".search-library-results button").first().click();
      await visible(page.locator("#lesson-title"));
      assert.equal(await page.locator("#lesson-title").innerText(), text);
      await page.goBack();
      await e.check("Back restores the query and results", async () => {
        await visible(result);
        assert.equal(await search.inputValue(), "path");
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
      await page
        .getByRole("button", { name: "Course overview", exact: true })
        .click();
      await visible(page.locator("#library-title"));
      await page
        .getByRole("button", { name: "Resume lesson", exact: true })
        .click();
      await visible(page.locator("#lesson-title"));
      await page.getByRole("link", { name: "Calculus", exact: true }).click();
      await e.check("Brand returns to the library", async () =>
        visible(page.locator("#library-title")),
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
