import assert from "node:assert/strict";
import { graphObservation } from "./graph-observation.mjs";

export async function visible(locator) {
  await locator.waitFor({ state: "visible" });
}

export async function ready(page) {
  await page
    .locator(".agent-status p")
    .filter({ hasText: /tools available|unavailable|registration failed/i })
    .waitFor({ state: "attached" });
}

export async function mode(page, name) {
  const button = page
    .getByRole("group", { name: "Lesson mode", exact: true })
    .getByRole("button", { name, exact: true });
  await button.click();
  assert.equal(await button.getAttribute("aria-pressed"), "true");
}

export async function lesson(page, e, id) {
  await page.goto(`${e.url}/#${id}`);
  await visible(page.locator("#lesson-title"));
  await ready(page);
  await page.waitForFunction(
    () => document.activeElement?.id === "lesson-title",
  );
  assert.equal(new URL(page.url()).hash, `#${id}`);
}

export async function select(page, label, option) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option }).click();
}

export async function mathematics(page, content = page.locator("main")) {
  await visible(content);
  assert.ok(
    await content.locator("math").count(),
    "The selected lesson content exposes MathML",
  );
  assert.equal(await page.locator(".katex-error").count(), 0);
}

export async function noOverflow(page) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
    "Page fits the viewport",
  );
}

export async function nestedPrerequisiteReturn(page, e, continuation) {
  await mode(page, "Learn");
  const interrupted = page.url();
  for (let depth = 0; depth < 2; depth++) {
    const readiness = page.locator(".lesson-readiness");
    if ((await readiness.getAttribute("open")) === null)
      await readiness.locator("summary").click();
    const previous = page.url();
    await readiness.getByRole("button").first().click();
    await page.waitForURL((url) => url.href !== previous);
    await visible(page.locator("#lesson-title"));
    assert.notEqual(page.url(), interrupted);
  }
  await page.goBack();
  await visible(page.locator("#lesson-title"));
  await e.check(
    `${continuation}: Back preserves the nested prerequisite return`,
    async () =>
      visible(
        page.getByRole("button", {
          name: "Return to interrupted step",
          exact: true,
        }),
      ),
  );
  await page.goForward();
  await page
    .getByRole("button", { name: "Return to interrupted step", exact: true })
    .click();
  await e.check(
    `${continuation}: nested return restores the original URL and workspace action`,
    async () => {
      assert.equal(page.url(), interrupted);
      await visible(
        page.getByRole("button", { name: continuation, exact: true }),
      );
    },
  );
  await page.goBack();
  await visible(page.locator("#lesson-title"));
  await page.goForward();
  await e.check(
    `${continuation}: Forward retains the workspace action`,
    async () => {
      assert.equal(page.url(), interrupted);
      await visible(
        page.getByRole("button", { name: continuation, exact: true }),
      );
    },
  );
}

export async function graphReady(page, previousDrawing) {
  await visible(
    page.getByRole("img", {
      name: /^Graph studio visualization\. Sampled 3D illustration/,
    }),
  );
  await page
    .locator(".graph-status")
    .filter({
      hasText:
        /sampled points displayed|parameter samples displayed|sampled curve segments|approximate zero-set triangles/,
    })
    .waitFor();
  const compatibility = page.getByRole("button", {
    name: "Use compatibility view",
    exact: true,
  });
  if (await compatibility.isVisible()) await compatibility.click();
  const svg = page.locator(".canvas-host svg");
  await visible(svg);
  await page.waitForFunction(graphObservation, { previousDrawing });
  assert.equal(await page.locator(".scene-error").count(), 0);
}

export async function graphDrawing(page) {
  await graphReady(page);
  await page.locator(".canvas-host svg").evaluate(async (element) => {
    let previous = element.innerHTML;
    for (let stable = 0; stable < 2;) {
      await new Promise(requestAnimationFrame);
      const current = element.innerHTML;
      stable = current === previous ? stable + 1 : 0;
      previous = current;
    }
  });
  const geometry = await page.evaluate(graphObservation);
  assert.ok(geometry, "The current graph has finite plotted surface geometry");
  return geometry;
}
