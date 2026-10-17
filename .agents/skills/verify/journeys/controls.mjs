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
  assert.equal(new URL(page.url()).hash, `#${id}`);
}

export async function select(page, label, option) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option }).click();
}

export async function mathematics(page) {
  assert.ok(
    await page.locator("main math").count(),
    "Visible lesson exposes MathML",
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

export async function graphReady(page) {
  await visible(
    page.getByRole("img", {
      name: /^Graph studio visualization\. Sampled 3D illustration/,
    }),
  );
  await page
    .locator(".graph-status")
    .filter({ hasText: /sampled|segments|triangles|surface|points/i })
    .waitFor();
  assert.equal(await page.locator(".scene-error").count(), 0);
}
