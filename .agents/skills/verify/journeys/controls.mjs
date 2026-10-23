import assert from "node:assert/strict";

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

export async function graphReady(page, previousDrawing) {
  await visible(
    page.getByRole("img", {
      name: /^Graph studio visualization\. Sampled 3D illustration/,
    }),
  );
  await page
    .locator(".graph-status")
    .filter({ hasText: /sampled|segments|triangles|surface|points/i })
    .waitFor();
  if (previousDrawing !== undefined)
    await page.waitForFunction((previous) => {
      const svg = document.querySelector(".canvas-host svg");
      return svg?.querySelector("path") && svg.innerHTML !== previous;
    }, previousDrawing);
  assert.equal(await page.locator(".scene-error").count(), 0);
}

export async function graphDrawing(page) {
  await graphReady(page);
  const compatibility = page.getByRole("button", {
    name: "Use compatibility view",
    exact: true,
  });
  if (await compatibility.isVisible()) await compatibility.click();
  const svg = page.locator(".canvas-host svg");
  await visible(svg);
  await svg.locator("path").first().waitFor({ state: "attached" });
  const geometry = await svg.evaluate(async (element) => {
    let previous = element.innerHTML;
    for (let stable = 0; stable < 2;) {
      await new Promise(requestAnimationFrame);
      const current = element.innerHTML;
      stable = current === previous ? stable + 1 : 0;
      previous = current;
    }
    return previous;
  });
  assert.doesNotMatch(geometry, /NaN|Infinity/);
  return geometry;
}
