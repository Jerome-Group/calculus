import assert from "node:assert/strict";
import { lesson, mode, noOverflow, select, visible } from "./controls.mjs";

const comparisons = [
  ["different-paths-different-limits", /Ray height = 0\.5000/],
  ["curved-paths-hide-obstructions", /Parabola height = 0\.5000/],
  ["total-differentiability", /gap\/r 0\.3536/],
  ["hessian-classification", /saddle/i],
  ["tangents-velocity-and-singularities", /speed 1\.4142/],
  ["type-one-two-regions", /Total integral: 14\/3 in both orders/],
  ["polar-rectangles", /physical area/],
];

async function comparisonsJourney(page, e) {
  for (const [id, expected] of comparisons) {
    await e.step(
      `Predict, change keyboard controls, and reset the comparison in ${id}`,
      async () => {
        await lesson(page, e, id);
        const lab = page.locator(".comparison-lab");
        await visible(lab);
        const initial = await lab.locator(".compare-readout").innerText();
        assert.match(initial, expected);
        const choices = lab.locator(".compare-prediction button");
        await choices.nth(0).click();
        assert.match(
          await lab.locator(".compare-feedback").innerText(),
          /^Reconsider:/,
        );
        await choices.nth(1).click();
        assert.match(
          await lab.locator(".compare-feedback").innerText(),
          /^Correct\./,
        );
        for (const slider of await lab.getByRole("slider").all()) {
          await slider.press("Home");
          assert.ok(
            Math.abs(
              Number(await slider.inputValue()) -
                Number(await slider.getAttribute("min")),
            ) < 0.011,
          );
          await slider.press("End");
          assert.ok(
            Math.abs(
              Number(await slider.inputValue()) -
                Number(await slider.getAttribute("max")),
            ) < 0.011,
          );
        }
        assert.doesNotMatch(await lab.innerHTML(), /NaN|Infinity/);
        await lab
          .getByRole("button", {
            name: "Reset comparison and prediction",
            exact: true,
          })
          .click();
        await e.check(
          `${id} reset restores the readout and clears prediction`,
          async () => {
            assert.equal(
              await lab.locator(".compare-readout").innerText(),
              initial,
            );
            assert.equal(await lab.locator(".compare-feedback").count(), 0);
          },
        );
        await mode(page, "Explore");
        await visible(lab);
      },
    );
  }
  await e.step(
    "Check exact witnesses and invariants in the comparison readouts",
    async () => {
      await lesson(page, e, "different-paths-different-limits");
      const lab = page.locator(".comparison-lab");
      await lab
        .getByRole("button", { name: "Axis θ = 0", exact: true })
        .click();
      assert.match(
        await lab.locator(".compare-readout").innerText(),
        /Ray height = 0;/,
      );
      await lab
        .getByRole("button", { name: "Diagonal θ = 3π/4", exact: true })
        .click();
      assert.match(
        await lab.locator(".compare-readout").innerText(),
        /Ray height = -0\.5000/,
      );
      await lesson(page, e, "hessian-classification");
      await page
        .getByRole("button", { name: "Set a = 0", exact: true })
        .click();
      assert.match(
        await page.locator(".compare-readout").innerText(),
        /det H = 0.*non-strict minima/i,
      );
      await lesson(page, e, "tangents-velocity-and-singularities");
      await page
        .getByRole("button", { name: "Inspect u = 0", exact: true })
        .click();
      assert.match(
        await page.locator(".compare-readout").innerText(),
        /speed 1\.4142.*speed 0\./,
      );
      await lesson(page, e, "type-one-two-regions");
      await page
        .getByRole("button", { name: "Swap integration order", exact: true })
        .click();
      await visible(page.getByRole("slider", { name: /Held coordinate y/ }));
      await page
        .getByRole("button", { name: "Swap integration order", exact: true })
        .click();
      await e.check("Both slicing orders retain the exact total", async () =>
        assert.match(
          await page.locator(".compare-readout").innerText(),
          /Total integral: 14\/3 in both orders/,
        ),
      );
    },
  );
}

export async function experiments(page, e) {
  await e.step(
    "Use experiment bounds, reset, animation, and layout controls",
    async () => {
      await lesson(page, e, "multivariable-chain-rule");
      await mode(page, "Explore");
      const experiment = page.getByRole("region", {
        name: "Visualisation",
        exact: true,
      });
      const slider = experiment.getByRole("slider");
      const initial = await slider.getAttribute("aria-valuenow");
      await slider.press("Home");
      assert.equal(
        await slider.getAttribute("aria-valuenow"),
        await slider.getAttribute("aria-valuemin"),
      );
      const before = await experiment.locator(".live-value").innerText();
      await slider.press("End");
      await e.check("The parameter changes its visible readout", async () =>
        assert.notEqual(
          await experiment.locator(".live-value").innerText(),
          before,
        ),
      );
      await experiment
        .getByRole("button", { name: "Reset experiment", exact: true })
        .click();
      assert.equal(await slider.getAttribute("aria-valuenow"), initial);
      await experiment
        .getByRole("button", { name: "Animate parameter", exact: true })
        .click();
      await visible(
        experiment.getByRole("button", {
          name: "Pause animation",
          exact: true,
        }),
      );
      await experiment
        .getByRole("button", { name: "Pause animation", exact: true })
        .click();
      await experiment
        .getByRole("button", { name: "Use wide graph view", exact: true })
        .click();
      await experiment
        .getByRole("button", { name: "Use split view", exact: true })
        .click();
      await experiment
        .getByRole("button", { name: "Minimise", exact: true })
        .click();
      await experiment
        .getByRole("button", { name: "Expand", exact: true })
        .click();
      await experiment.getByText("What to notice", { exact: true }).click();
    },
  );
  await comparisonsJourney(page, e);
  await e.step(
    "Change inline experiments independently and restore their visible values",
    async () => {
      await lesson(page, e, "review-total-differentiability");
      const first = page.locator('[data-review-function="differentiable"]');
      const second = page.locator('[data-review-function="counterexample"]');
      await first
        .getByText("Inspect the exact function and plane", { exact: true })
        .click();
      await second
        .getByText("Inspect the exact function and plane", { exact: true })
        .click();
      const status = first
        .locator(".study-save-status")
        .first()
        .getByRole("status");
      await visible(
        status.filter({
          hasText: /No saved account record yet\.|Saved to your account\./,
        }),
      );
      const slider = first.getByRole("slider").first();
      const initial = await slider.inputValue();
      const untouched = await second.locator("output").innerText();
      await slider.press("End");
      await e.check(
        "Moving one exact review control leaves the other unchanged",
        async () => {
          assert.notEqual(await slider.inputValue(), initial);
          assert.equal(await second.locator("output").innerText(), untouched);
        },
      );
      const changed = await slider.inputValue();
      await visible(status.filter({ hasText: "Saved to your account." }));
      await page.reload();
      await first
        .getByText("Inspect the exact function and plane", { exact: true })
        .click();
      await visible(status.filter({ hasText: "Saved to your account." }));
      await e.check(
        "Reload restores the acknowledged changed inline value",
        async () => {
          assert.equal(await slider.inputValue(), changed);
        },
      );
      await lesson(page, e, "polar-regions");
      const domain = page.locator('[data-experiment-id="domain"]');
      await domain.locator("summary").click();
      await domain.getByRole("slider").press("Home");
      await domain.getByRole("slider").press("End");
      assert.doesNotMatch(
        await domain.locator("output").innerText(),
        /NaN|undefined/,
      );
    },
  );
  await e.step(
    "Switch pilot Diagram and Values only views and check the algebraic tolerance entry",
    async () => {
      await lesson(page, e, "epsilon-delta-one-variable");
      await mode(page, "Explore");
      await page
        .getByRole("group", { name: "Representation", exact: true })
        .getByRole("button", { name: "Values only", exact: true })
        .click();
      const tolerance = page.getByRole("slider", { name: /Output tolerance/ });
      await tolerance.press("End");
      const epsilon = Number(await tolerance.inputValue());
      await page.locator("#candidate-delta").fill(String(epsilon));
      await page
        .getByRole("button", {
          name: "Check all inputs algebraically",
          exact: true,
        })
        .click();
      assert.match(
        await page
          .locator(".pilot-delta-challenge")
          .getByRole("status")
          .innerText(),
        /Too large/,
      );
      await page.locator("#candidate-delta").fill(String(epsilon / 2));
      await page
        .getByRole("button", {
          name: "Check all inputs algebraically",
          exact: true,
        })
        .click();
      await e.check(
        "A valid tolerance is certified algebraically for every input",
        async () =>
          assert.match(
            await page
              .locator(".pilot-delta-challenge")
              .getByRole("status")
              .innerText(),
            /Certified for every input/,
          ),
      );
      await page
        .getByRole("group", { name: "Representation", exact: true })
        .getByRole("button", { name: "Diagram", exact: true })
        .click();
      await visible(
        page.getByRole("region", { name: "Visualisation", exact: true }),
      );
      await lesson(page, e, "type-one-two-regions");
      await mode(page, "Explore");
      await page
        .getByRole("button", { name: "Horizontal slice", exact: true })
        .click();
      await page.locator("#slice-coordinate").press("Home");
      await visible(page.getByRole("img", { name: /^horizontal section/ }));
      await page
        .getByRole("group", { name: "Representation", exact: true })
        .getByRole("button", { name: "Values only", exact: true })
        .click();
      await e.check(
        "Slice values expose the same orientation and bounds",
        async () =>
          assert.match(
            await page
              .getByRole("table", {
                name: "Exact bounds at the current slice",
                exact: true,
              })
              .innerText(),
            /horizontal/,
          ),
      );
    },
  );
  await e.step(
    "Honor reduced motion and keep the experiment usable on a phone",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await lesson(page, e, "multivariable-chain-rule");
      await mode(page, "Explore");
      const disabled = page.getByRole("button", {
        name: "Animation disabled by reduced motion preference",
        exact: true,
      });
      await e.check("Reduced motion disables animation", async () =>
        assert.equal(await disabled.isDisabled(), true),
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await e.check("Phone experiment has no page overflow", async () =>
        noOverflow(page),
      );
    },
  );
  await e.step(
    "Contain a failed deferred drawing chunk and recover through the visible retry control",
    async () => {
      const failurePage = await e.newPage();
      const injection = e.injectDrawingFailure();
      await failurePage.route(injection.url, (route) => route.abort("failed"));
      await lesson(failurePage, e, "multivariable-chain-rule");
      await visible(
        failurePage
          .getByRole("alert")
          .filter({ hasText: "The drawing could not load" }),
      );
      await e.check(
        "Drawing failure preserves the definition and reasoning",
        async () => {
          await visible(failurePage.locator("#lesson-definition"));
          await visible(
            failurePage.getByRole("heading", {
              name: "Reasoning",
              exact: true,
            }),
          );
          assert.equal(
            new URL(failurePage.url()).hash,
            "#multivariable-chain-rule",
          );
        },
      );
      await failurePage.unroute(injection.url);
      await failurePage
        .getByRole("button", { name: "Reload to retry drawing", exact: true })
        .press("Enter");
      await visible(
        failurePage.getByRole("img", {
          name: /^3D graph\. Sampled 3D illustration/,
        }),
      );
      injection.active = false;
      await e.check("Retry restores the drawing on the same lesson", async () =>
        assert.equal(
          new URL(failurePage.url()).hash,
          "#multivariable-chain-rule",
        ),
      );
    },
  );
  await e.step(
    "Select Constant-height circle and require exact model restoration after reload, regression #195",
    async () => {
      await page.setViewportSize({ width: 1365, height: 900 });
      await lesson(page, e, "multivariable-chain-rule");
      await mode(page, "Explore");
      await select(page, "Experiment model", "Constant-height circle");
      const model = page.getByRole("combobox", {
        name: "Experiment model",
        exact: true,
      });
      assert.match(await model.innerText(), /Constant-height circle/);
      await page.reload();
      await e.check(
        "Constant-height circle survives reload with its encoded model",
        async () => {
          await visible(model);
          assert.match(await model.innerText(), /Constant-height circle/);
        },
      );
    },
  );
}
