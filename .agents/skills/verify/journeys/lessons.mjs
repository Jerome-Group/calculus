import assert from "node:assert/strict";
import { lesson, mathematics, mode, noOverflow, visible } from "./controls.mjs";

export async function lessons(page, e) {
  await e.step(
    "Open representative lessons in all three courses and select all four reading modes",
    async () => {
      for (const id of [
        "limits-one-sided",
        "partial-fractions",
        "multivariable-chain-rule",
      ]) {
        await lesson(page, e, id);
        for (const name of ["Learn", "Explore", "Practice", "Revise"]) {
          await mode(page, name);
          await e.check(
            `${id} ${name} has its mathematical content`,
            async () => {
              const content =
                name === "Practice"
                  ? page.locator(".lesson-practice").first()
                  : page.getByRole("region", {
                      name: {
                        Learn: "Mathematical explanation",
                        Explore: "Visualisation",
                        Revise: "Revision summary",
                      }[name],
                      exact: true,
                    });
              await mathematics(page, content);
              if (name === "Practice") {
                assert.ok(
                  (await content.locator("p").first().innerText()).trim(),
                );
                await visible(
                  content.getByRole("textbox", {
                    name: "Your reasoning",
                    exact: true,
                  }),
                );
              }
            },
          );
        }
      }
    },
  );
  await e.step(
    "Follow the argument, open references, and navigate prerequisites with a return path",
    async () => {
      await lesson(page, e, "multivariable-chain-rule");
      await mode(page, "Learn");
      const outline = page.getByRole("navigation", {
        name: "Follow the argument",
        exact: true,
      });
      for (const [name, destination] of [
        ["Definition & assumptions", "lesson-definition"],
        ["Experiment", "lesson-experiment"],
        ["Reasoning", "notes-intuition"],
        ["Worked application", "notes-example"],
        ["Key distinction", "notes-pitfall"],
      ]) {
        await outline.getByRole("button", { name, exact: true }).click();
        await e.check(`${name} focuses its visible destination`, async () =>
          focusedDestination(page, destination),
        );
      }
      const sources = page.getByRole("region", {
        name: "Sources",
        exact: true,
      });
      await sources.scrollIntoViewIfNeeded();
      await sources
        .getByText("How to use these references", { exact: true })
        .click();
      await outline
        .getByRole("button", { name: "Try it yourself", exact: true })
        .click();
      await visible(page.locator(".lesson-practice").first());
      await mode(page, "Revise");
      await page
        .getByRole("button", { name: "Open the full reasoning", exact: true })
        .click();
      await visible(
        page.getByRole("region", {
          name: "Mathematical explanation",
          exact: true,
        }),
      );
      await page.locator(".covered-topics summary").click();
      await e.check(
        "Source links preserve page locators and external-link protection",
        async () => {
          const links = await sources.getByRole("link").evaluateAll((items) =>
            items.map((item) => ({
              href: item.href,
              target: item.target,
              rel: item.rel,
            })),
          );
          assert.ok(links.some((link) => /#page=\d+/.test(link.href)));
          assert.ok(
            links.every(
              (link) =>
                link.target === "_blank" && link.rel.includes("noreferrer"),
            ),
          );
        },
      );
      await page.locator(".control-panel").getByRole("slider").press("End");
      const parameter = await page
        .locator(".control-panel")
        .getByRole("slider")
        .getAttribute("aria-valuenow");
      await outline
        .getByRole("button", { name: "Worked application", exact: true })
        .click();
      await focusedDestination(page, "notes-example");
      const interrupted = page.url();
      const before = new URL(interrupted).hash;
      await page
        .getByRole("navigation", { name: "Lesson prerequisites", exact: true })
        .getByRole("button")
        .first()
        .click();
      assert.notEqual(new URL(page.url()).hash, before);
      await page
        .getByRole("button", {
          name: "Return to interrupted step",
          exact: true,
        })
        .click();
      await e.check(
        "Prerequisite return restores the parameter and worked-application state",
        async () => {
          assert.equal(page.url(), interrupted);
          assert.equal(
            await page
              .locator(".control-panel")
              .getByRole("slider")
              .getAttribute("aria-valuenow"),
            parameter,
          );
          assert.equal(
            await page
              .getByRole("group", { name: "Lesson mode", exact: true })
              .getByRole("button", { name: "Learn", exact: true })
              .getAttribute("aria-pressed"),
            "true",
          );
          await visible(page.locator("#notes-example"));
        },
      );
      await page
        .getByRole("navigation", {
          name: "Continue this proof path",
          exact: true,
        })
        .getByRole("button", { name: /^Next:/ })
        .click();
      await e.check("Proof continuation opens its linked lesson", async () =>
        assert.equal(
          new URL(page.url()).hash,
          "#directional-derivatives-and-gradient",
        ),
      );
      await page.goBack();
      await e.check(
        "Prerequisite return restores the interrupted lesson",
        async () => assert.equal(new URL(page.url()).hash, before),
      );
      await page
        .getByText("Need a prerequisite refresher?", { exact: true })
        .click();
      await page
        .locator(".lesson-readiness")
        .getByRole("button")
        .first()
        .click();
      await page
        .getByRole("button", {
          name: "Return to interrupted step",
          exact: true,
        })
        .click();
    },
  );
  await e.step(
    "Read source errata with honest optional provenance",
    async () => {
      for (const [id, title, credited] of [
        ["partial-fractions", "MH1101 Chapter 03 Notes", true],
        ["power-series-radius", "MH1101 Chapter 06 Notes", false],
      ]) {
        await lesson(page, e, id);
        await mode(page, "Learn");
        const source = page
          .getByRole("region", { name: "Sources", exact: true })
          .locator(".source-group")
          .filter({
            has: page.getByRole("heading", { name: title, exact: true }),
          });
        const note = source.locator(".source-erratum").first();
        await note.scrollIntoViewIfNeeded();
        await e.check(
          `${id} renders erratum provenance only when supplied`,
          async () => {
            await visible(note.getByText(/^Source erratum · PDF p\./));
            assert.equal(await note.locator("small").count(), credited ? 1 : 0);
            if (credited)
              assert.ok(
                (await note.locator("small").innerText()).trim().length > 0,
              );
          },
        );
      }
    },
  );
  await e.step(
    "Use lesson pagination and select a lesson in the expanded sidebar",
    async () => {
      const before = new URL(page.url()).hash;
      await page
        .locator(".lesson-pagination")
        .getByRole("button", { name: /NEXT CONCEPT/ })
        .click();
      assert.notEqual(new URL(page.url()).hash, before);
      await page
        .locator(".lesson-pagination")
        .getByRole("button", { name: /PREVIOUS CONCEPT/ })
        .click();
      assert.equal(new URL(page.url()).hash, before);
      await page
        .getByRole("textbox", { name: "Find a concept", exact: true })
        .fill("partial fractions");
      await page
        .getByRole("navigation", { name: "Course concepts", exact: true })
        .getByRole("button")
        .first()
        .click();
      await e.check("Sidebar opens the selected concept", async () =>
        assert.equal(new URL(page.url()).hash, "#partial-fractions"),
      );
      await page.locator(".lecture-toggle").first().click();
      const concept = page
        .getByRole("navigation", { name: "Course concepts", exact: true })
        .locator(".concept-nav button")
        .first();
      const title = await concept.innerText();
      await concept.click();
      await e.check("Expanded lecture navigation opens its lesson", async () =>
        assert.equal(await page.locator("#lesson-title").innerText(), title),
      );
    },
  );
  await e.step(
    "Cross a course boundary through the lesson footer",
    async () => {
      await lesson(page, e, "lhopital");
      await page
        .locator(".lesson-pagination")
        .getByRole("button", { name: /NEXT COURSE/ })
        .click();
      await e.check(
        "Calculus I continues into the first Calculus II lesson",
        async () => {
          assert.equal(new URL(page.url()).hash, "#integral-antiderivatives");
          await mathematics(page);
        },
      );
    },
  );
  await e.step("Exercise pilot reading and revision entry points", async () => {
    await lesson(page, e, "epsilon-delta-one-variable");
    await page
      .getByRole("navigation", { name: "Lesson prerequisites", exact: true })
      .getByRole("button")
      .first()
      .click();
    await page
      .getByRole("button", { name: "Return to interrupted step", exact: true })
      .click();
    await e.check(
      "Pilot prerequisite returns to the interrupted guided lesson",
      async () => {
        assert.equal(new URL(page.url()).hash, "#epsilon-delta-one-variable");
        await visible(
          page.getByRole("region", { name: "Guided lesson", exact: true }),
        );
      },
    );
    await visible(
      page.getByRole("region", { name: "Guided lesson", exact: true }),
    );
    await mode(page, "Explore");
    await visible(
      page.getByRole("region", {
        name: "Prediction before experiment",
        exact: true,
      }),
    );
    await mode(page, "Revise");
    await visible(
      page.getByRole("region", { name: "Revision and retrieval", exact: true }),
    );
    await page
      .getByRole("button", { name: "Do the independent tasks", exact: true })
      .click();
    await e.check("Revision opens independent practice", async () =>
      visible(
        page.getByRole("region", { name: "Independent practice", exact: true }),
      ),
    );
  });
  await e.step(
    "Read on a 320px viewport and explain malformed lesson state",
    async () => {
      await page.goto(`${e.url}/?study=invalid#partial-fractions`);
      await visible(
        page
          .getByRole("status")
          .filter({ hasText: /Showing default settings/ }),
      );
      await page.setViewportSize({ width: 320, height: 740 });
      await e.check(
        "Long mathematical content stays within the phone page",
        async () => {
          await noOverflow(page);
          await mathematics(page);
        },
      );
    },
  );
}

async function focusedDestination(page, id) {
  try {
    await page.waitForFunction((targetId) => {
      const target = document.getElementById(targetId);
      if (!target || document.activeElement !== target) return false;
      const bounds = target.getBoundingClientRect();
      return bounds.top >= -1 && bounds.top < innerHeight && bounds.bottom > 0;
    }, id);
  } catch (error) {
    const observed = await page.evaluate((targetId) => {
      const bounds = document.getElementById(targetId)?.getBoundingClientRect();
      return {
        focus: document.activeElement?.id,
        top: bounds?.top,
        bottom: bounds?.bottom,
        height: innerHeight,
      };
    }, id);
    throw new Error(`${error.message} Observed ${JSON.stringify(observed)}`);
  }
}
