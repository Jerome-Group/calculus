import assert from "node:assert/strict";
import { graphObservation } from "./graph-observation.mjs";
import {
  graphDrawing,
  graphReady,
  lesson,
  noOverflow,
  ready,
  select,
  visible,
} from "./controls.mjs";

export async function graph(page, e) {
  await e.step(
    "Open Graph studio through the topbar and render its quick expression",
    async () => {
      await page.goto(e.url);
      await ready(page);
      await page
        .locator(".top-tabs")
        .getByRole("button", { name: "Graph studio", exact: true })
        .click();
      await graphReady(page);
      const before = await graphDrawing(page);
      await page
        .getByRole("textbox", { name: "Quick graph expression", exact: true })
        .fill("sin(x)+cos(y)");
      await page
        .locator(".quick-graph")
        .getByRole("button", { name: "Graph", exact: true })
        .click();
      await e.check(
        "Quick graph draws the new expression and updates its description",
        async () => {
          await graphReady(page, before);
          assert.match(
            await page
              .locator(".sr-only")
              .filter({ hasText: "Rendered graph:" })
              .innerText(),
            /sin/,
          );
        },
      );
    },
  );
  const representations = [
    ["Function", ["sin(x)*cos(y)"], /sampled points displayed/, /sin.*cos/s],
    [
      "Parametric surface",
      ["cos(u)", "sin(u)", "v"],
      /parameter samples displayed/,
      /r.*u.*v.*cos.*sin/s,
    ],
    [
      "Space curve",
      ["cos(t)", "sin(t)", "t/3"],
      /sampled curve segments/,
      /r.*t.*cos.*sin/s,
    ],
    [
      "Implicit surface",
      ["x^2+y^2+z^2-1"],
      /approximate zero-set triangles/,
      /x.*y.*z.*=0/s,
    ],
  ];
  for (const [name, expressions, status, formula] of representations) {
    await e.step(
      `Render ${name} through the representation editor and restore it after reload`,
      async () => {
        const before = await graphDrawing(page);
        await select(page, "Graph representation", new RegExp(`^${name}`));
        for (const [index, expression] of expressions.entries())
          await page.locator(`#expression-${index}`).fill(expression);
        await page
          .getByRole("button", { name: "Render graph", exact: true })
          .click();
        await graphReady(page, before);
        await page
          .locator(".graph-status")
          .filter({ hasText: status })
          .waitFor();
        const rendered = page
          .locator(".sr-only")
          .filter({ hasText: "Rendered graph:" })
          .locator("annotation");
        assert.match(await rendered.textContent(), formula);
        const renderedFormula = await rendered.textContent();
        const url = page.url();
        await page.reload();
        await graphDrawing(page);
        await e.check(
          `${name} restores the plotted expressions and encoded URL`,
          async () => {
            assert.equal(page.url(), url);
            assert.equal(await rendered.textContent(), renderedFormula);
            for (const [index, expression] of expressions.entries())
              assert.equal(
                await page.locator(`#expression-${index}`).inputValue(),
                expression,
              );
          },
        );
      },
    );
  }
  await e.step(
    "Replot the same expression with custom bounds and clipping, then restore it",
    async () => {
      const before = await graphDrawing(page);
      await page.getByRole("button", { name: "Saddle", exact: true }).click();
      await graphReady(page, before);
      const bounds = page.locator(".bounds-grid input");
      const custom = [-1, 2, -2, 1, 5];
      for (const [index, value] of custom.entries())
        await bounds.nth(index).fill(String(value));
      const initial = await graphDrawing(page);
      await page
        .getByRole("button", { name: "Render graph", exact: true })
        .click();
      await graphReady(page, initial);
      const bounded = await graphDrawing(page);
      await bounds.nth(4).fill("0.5");
      await page
        .getByRole("button", { name: "Render graph", exact: true })
        .click();
      await e.check(
        "Clipping the same bounded plot redraws and excludes out-of-range samples",
        async () => {
          await graphReady(page, bounded);
          assert.match(
            await page.locator(".graph-status").innerText(),
            /[1-9]\d* samples outside the height clip excluded/,
          );
        },
      );
      const url = page.url();
      await page.reload();
      await graphDrawing(page);
      await e.check(
        "Reload restores the same plotted expression, custom bounds and height clip",
        async () => {
          assert.equal(page.url(), url);
          assert.equal(
            await page.locator("#expression-0").inputValue(),
            "x^2-y^2",
          );
          for (const [index, value] of [-1, 2, -2, 1, 0.5].entries())
            assert.equal(Number(await bounds.nth(index).inputValue()), value);
          assert.match(
            await page.locator(".graph-status").innerText(),
            /[1-9]\d* samples outside the height clip excluded/,
          );
        },
      );
    },
  );
  await e.step(
    "Reject invalid input and inverted bounds, then recover through a graph preset",
    async () => {
      await page.locator("#expression-0").fill("sin(");
      await page
        .getByRole("button", { name: "Render graph", exact: true })
        .click();
      await visible(page.locator(".graph-editor").getByRole("alert"));
      const before = await graphDrawing(page);
      await page.getByRole("button", { name: "Saddle", exact: true }).click();
      await graphReady(page, before);
      const bounds = page.locator(".bounds-grid input");
      await bounds.nth(0).fill("4");
      await bounds.nth(1).fill("-4");
      await page
        .getByRole("button", { name: "Render graph", exact: true })
        .click();
      await visible(page.locator(".graph-editor").getByRole("alert"));
      const saddle = await graphDrawing(page);
      await page.getByRole("button", { name: "Helix", exact: true }).click();
      await e.check(
        "A valid preset clears errors and renders after invalid input",
        async () => {
          await graphReady(page, saddle);
          assert.equal(
            await page.locator(".graph-editor").getByRole("alert").count(),
            0,
          );
        },
      );
      await page.locator(".control-panel").getByRole("slider").press("End");
      assert.equal(
        await page
          .locator(".control-panel")
          .getByRole("slider")
          .getAttribute("aria-valuenow"),
        "5",
      );
    },
  );
  await e.step(
    "Render a space curve after leaving invalid unused surface bounds",
    async () => {
      await page.getByRole("button", { name: "Saddle", exact: true }).click();
      await graphReady(page);
      await page.locator(".bounds-grid input").nth(2).fill("4");
      await page.locator(".bounds-grid input").nth(3).fill("-4");
      await select(page, "Graph representation", /^Space curve/);
      for (const [index, expression] of ["cos(t)", "sin(t)", "t/3"].entries())
        await page.locator(`#expression-${index}`).fill(expression);
      const before = await graphDrawing(page);
      await page
        .getByRole("button", { name: "Render graph", exact: true })
        .click();
      await graphReady(page, before);
      const url = page.url();
      await page.reload();
      await graphReady(page);
      await e.check(
        "Unused surface bounds cannot block a valid curve or its reload",
        async () => {
          assert.equal(page.url(), url);
          assert.equal(
            await page.locator(".graph-editor").getByRole("alert").count(),
            0,
          );
          assert.equal(await page.locator("#expression-2").inputValue(), "t/3");
          assert.match(
            await page.locator(".graph-status").innerText(),
            /sampled curve segments/,
          );
        },
      );
    },
  );
  await e.step(
    "Change a parameter used by the plotted expression and restore its URL",
    async () => {
      const previous = await graphDrawing(page);
      await page
        .getByRole("button", { name: "Wave amplitude", exact: true })
        .click();
      await graphReady(page, previous);
      await e.check(
        "The wave preset supplies its complete configuration",
        async () => {
          assert.equal(
            await page.locator("#expression-0").inputValue(),
            "a*sin(x)*cos(y)",
          );
          const bounds = page.locator(".bounds-grid input");
          for (const [index, value] of [
            -Math.PI,
            Math.PI,
            -Math.PI,
            Math.PI,
            6,
          ].entries())
            assert.equal(Number(await bounds.nth(index).inputValue()), value);
        },
      );
      const slider = page.getByRole("slider", { name: /Expression parameter/ });
      const initial = await graphDrawing(page);
      await slider.press("Home");
      await graphReady(page, initial);
      const before = await graphDrawing(page);
      await e.capture("Parameter a at its lower bound");
      await slider.press("End");
      await e.check(
        "The expression parameter changes finite sampled drawing geometry",
        async () => {
          await graphReady(page, before);
          await graphDrawing(page);
          assert.equal(await slider.getAttribute("aria-valuenow"), "5");
        },
      );
      const url = page.url();
      await page.reload();
      await graphDrawing(page);
      await e.check(
        "Reload restores the expression and its changed parameter",
        async () => {
          assert.equal(page.url(), url);
          assert.equal(
            await page.locator("#expression-0").inputValue(),
            "a*sin(x)*cos(y)",
          );
          assert.equal(await slider.getAttribute("aria-valuenow"), "5");
        },
      );
    },
  );
  await e.step(
    "Use keyboard orbit, zoom, camera reset, compatibility rendering, and fullscreen",
    async () => {
      const drawing = page.getByRole("img", {
        name: /^Graph studio visualization\. Sampled 3D illustration/,
      });
      await e.step(
        "Open Graph studio from a lesson's exact-example button",
        async () => {
          await lesson(page, e, "review-critical-points");
          await page
            .getByRole("button", {
              name: "Plot the exact six-point surface",
              exact: true,
            })
            .click();
          await e.check(
            "The exact example opens its plotted expressions",
            async () => {
              await graphReady(page);
              assert.equal(
                await page.locator("#expression-0").inputValue(),
                "x^4-2*x^2+y^3-3*y",
              );
            },
          );
        },
      );
      await page
        .getByRole("button", { name: "Reset camera", exact: true })
        .click();
      const before = await graphDrawing(page);
      await drawing.press("ArrowRight");
      await e.check(
        "Keyboard orbit independently changes the drawn geometry",
        async () => graphReady(page, before),
      );
      const orbited = await graphDrawing(page);
      await drawing.press("+");
      await e.check(
        "Keyboard zoom independently changes the drawn geometry",
        async () => graphReady(page, orbited),
      );
      await page
        .getByRole("button", { name: "Reset camera", exact: true })
        .click();
      await e.check(
        "Camera reset restores the original finite compatibility drawing",
        async () => {
          assert.equal(
            roundedDrawing(await graphDrawing(page)),
            roundedDrawing(before),
          );
        },
      );
      await page
        .getByRole("button", { name: "Try WebGL", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Fullscreen visualization", exact: true })
        .click();
      await visible(
        page.getByRole("button", { name: "Exit fullscreen", exact: true }),
      );
      await page
        .getByRole("button", { name: "Exit fullscreen", exact: true })
        .click();
    },
  );
  await e.step(
    "Reset camera and fit a preset immediately after released pointer motion",
    async () => {
      const drawing = page.locator(".canvas-host svg");
      for (const [action, referencePreset] of [
        ["Reset camera", "Saddle"],
        ["Helix", "Helix"],
      ]) {
        await page
          .getByRole("button", { name: referencePreset, exact: true })
          .click();
        const canonical = roundedDrawing(await graphDrawing(page));
        for (const [motion, button] of [
          ["rotation", "left"],
          ["pan", "right"],
        ]) {
          await page
            .getByRole("button", { name: "Saddle", exact: true })
            .click();
          const before = await graphDrawing(page);
          await drawing.scrollIntoViewIfNeeded();
          const box = await drawing.boundingBox();
          assert.ok(box, "The plotted SVG has a visible pointer target");
          await page.mouse.move(
            box.x + box.width * 0.35,
            box.y + box.height * 0.4,
          );
          await page.mouse.down({ button });
          await page.mouse.move(
            box.x + box.width * 0.62,
            box.y + box.height * 0.58,
            { steps: 3 },
          );
          await page.waitForFunction(graphObservation, {
            previousDrawing: before,
          });
          await page.mouse.up({ button });
          await page.getByRole("button", { name: action, exact: true }).click();
          await e.check(
            `${action} restores stable canonical framing after released pointer ${motion}`,
            async () => {
              assert.equal(roundedDrawing(await graphDrawing(page)), canonical);
              assert.ok(
                await drawing.evaluate(async (svg) => {
                  const reset = svg.innerHTML;
                  for (let frame = 0; frame < 12; frame++) {
                    await new Promise(requestAnimationFrame);
                    if (svg.innerHTML !== reset) return false;
                  }
                  return true;
                }),
                "Canonical framing remains unchanged across further render frames",
              );
              assert.equal(roundedDrawing(await graphDrawing(page)), canonical);
            },
          );
        }
      }
    },
  );
  await e.step(
    "Reject out-of-range shared graph parameters and retain both valid endpoints",
    async () => {
      for (const parameter of [6, -5, 5]) {
        const shared = new URL(e.url);
        shared.hash = "graph";
        shared.searchParams.set(
          "graph",
          JSON.stringify({
            version: 1,
            graph: {
              mode: "surface",
              expressions: ["a*sin(x)*cos(y)"],
              min: -3,
              max: 3,
              vmin: -3,
              vmax: 3,
              clip: 6,
              a: parameter,
            },
          }),
        );
        await page.goto(shared.href);
        await ready(page);
        await graphReady(page);
        const slider = page.getByRole("slider", {
          name: /Expression parameter/,
        });
        await e.check(
          `Shared parameter ${parameter} respects the slider range and recovery`,
          async () => {
            assert.equal(
              Number(await slider.getAttribute("aria-valuenow")),
              parameter === 6 ? 1 : parameter,
            );
            assert.equal(await slider.getAttribute("aria-valuemin"), "-5");
            assert.equal(await slider.getAttribute("aria-valuemax"), "5");
            if (parameter === 6)
              await visible(
                page
                  .locator(".graph-editor")
                  .getByRole("alert")
                  .filter({ hasText: /shared graph could not be restored/ }),
              );
          },
        );
      }
    },
  );
  await e.step(
    "Use the sidebar graph entry and recover malformed graph history on a phone",
    async () => {
      await page.getByRole("button", { name: "Library", exact: true }).click();
      await page
        .locator(".side-footer")
        .getByRole("button", { name: /Graph studio/ })
        .click();
      await graphReady(page);
      await page.goto(`${e.url}/?graph=invalid#graph`);
      await visible(
        page
          .locator(".graph-editor")
          .getByRole("alert")
          .filter({ hasText: /Showing the default graph/ }),
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await e.check("The phone graph and editor fit the page", async () => {
        await graphReady(page);
        await noOverflow(page);
      });
    },
  );
  await e.check(
    "The focusable parameter slider has its visible expression-parameter name",
    async () =>
      visible(page.getByRole("slider", { name: /Expression parameter/ })),
  );
}

function roundedDrawing(svg) {
  return svg.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (value) =>
    String(Number(Number(value).toFixed(6))),
  );
}
