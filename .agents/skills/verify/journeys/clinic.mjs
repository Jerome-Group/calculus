import assert from "node:assert/strict";
import { visible, noOverflow, ready, mathematics } from "./controls.mjs";

const cases = [
  ["rolle-corner", "corner-breaks-hypothesis", "smooth-rolle"],
  ["chain-composition", "outer-times-inner", "exp-chain"],
  ["lhopital-nonconverse", "squeeze-original", "sine-rule-valid"],
  ["improper-cancellation", "separate-divergence", "root-converges"],
  ["conditional-rearrangement", "conditional-warning", "absolute-preserves"],
  [
    "power-series-boundary",
    "separate-endpoints",
    "derivative-boundary-diverges",
  ],
  [
    "partials-without-plane",
    "diagonal-obstruction",
    "continuous-partials-nearby",
  ],
  ["curl-domain-hole", "circle-obstruction", "right-angle-potential"],
  ["hemisphere-flux", "halfball-flux", "orientation-reversed"],
];
const choice = (page, name, id) =>
  page.locator(`input[name="clinic-${name}"][value="${id}"]`);
const switchCase = (page, id) =>
  page
    .getByRole("combobox", { name: "Switch Clinic case", exact: true })
    .selectOption(id);
const selectedCase = (page) =>
  JSON.parse(new URL(page.url()).searchParams.get("clinic")).caseId;

export async function clinic(page, e) {
  const writes = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/study") && request.method() !== "GET")
      writes.push({ method: request.method(), url: request.url() });
  });
  await e.step(
    "Enter Clinic from the library and inspect the nine-case picker",
    async () => {
      await page.goto(e.url);
      await ready(page);
      await page
        .getByRole("button", { name: "Open Calculus Clinic", exact: true })
        .click();
      await visible(page.locator("#clinic-title"));
      await e.check(
        "Clinic shows three original cases for every course and explicit transient-memory copy",
        async () => {
          assert.equal(
            await page.locator(".clinic-case-cards > button").count(),
            9,
          );
          assert.equal(await page.locator(".clinic-course").count(), 3);
          assert.match(
            await page.locator(".clinic-memory").innerText(),
            /Reloading keeps the selected case and resets answers/,
          );
        },
      );
      await page.locator(".clinic-case-cards > button").first().click();
    },
  );
  await e.step(
    "Commit a mistaken decision, recover through its exact lesson, and return with the in-tab attempt",
    async () => {
      await page
        .getByRole("textbox", {
          name: "Private scratch work · ungraded",
          exact: true,
        })
        .fill("Equal endpoints are not the whole theorem.");
      await choice(page, "decision", "endpoints-suffice").check();
      await page
        .getByRole("button", { name: "Explain my decision", exact: true })
        .click();
      await visible(page.locator("#clinic-diagnosis"));
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-diagnosis",
      );
      assert.match(
        await page.locator("#clinic-diagnosis").innerText(),
        /endpoint check/,
      );
      await page.locator(".clinic-diagnosis .clinic-recovery").click();
      await visible(page.locator("#lesson-title"));
      await e.check(
        "Wrong endpoint-only choice opens Rolle recovery with a visible return action",
        async () => {
          assert.equal(new URL(page.url()).hash, "#rolle-mean-value");
          assert.equal(new URL(page.url()).searchParams.has("clinic"), false);
          await visible(
            page.getByRole("button", {
              name: "Return to Clinic case",
              exact: true,
            }),
          );
        },
      );
      await page
        .getByRole("button", { name: "Return to Clinic case", exact: true })
        .click();
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-diagnosis",
      );
      await e.check(
        "Recovery returns to the same committed choice, scratch work and feedback focus",
        async () => {
          assert.equal(selectedCase(page), "rolle-corner");
          assert.equal(
            await choice(page, "decision", "endpoints-suffice").isChecked(),
            true,
          );
          assert.equal(
            await page.locator("#clinic-reasoning").inputValue(),
            "Equal endpoints are not the whole theorem.",
          );
        },
      );
      await page
        .getByRole("button", { name: "Try the transfer check", exact: true })
        .click();
      await choice(page, "transfer", "minimum-forbids").check();
      await page
        .getByRole("button", { name: "Check transfer choice", exact: true })
        .click();
      await visible(page.locator("#clinic-transfer-feedback"));
      assert.match(
        await page.locator("#clinic-transfer-feedback").innerText(),
        /smooth minimum/,
      );
      await page
        .getByRole("button", { name: "Restart this case", exact: true })
        .click();
      assert.equal(
        await page.locator('input[name="clinic-decision"]:checked').count(),
        0,
      );
      assert.equal(await page.locator("#clinic-reasoning").inputValue(), "");
      assert.equal(await page.locator("#clinic-diagnosis").count(), 0);
    },
  );
  await e.step(
    "Drive all nine decisions, exact arguments, and distinct transfer checks through real controls",
    async () => {
      for (const [id, decision, transfer] of cases) {
        await switchCase(page, id);
        await choice(page, "decision", decision).check();
        await page
          .getByRole("button", { name: "Explain my decision", exact: true })
          .click();
        await visible(page.locator("#clinic-diagnosis"));
        assert.match(
          await page.locator(".clinic-diagnosis").innerText(),
          /SOUND DECISION/,
        );
        await visible(
          page.getByRole("region", {
            name: "Exact worked argument",
            exact: true,
          }),
        );
        await page
          .getByRole("button", { name: "Try the transfer check", exact: true })
          .click();
        await choice(page, "transfer", transfer).check();
        await page
          .getByRole("button", { name: "Check transfer choice", exact: true })
          .click();
        await visible(page.locator("#clinic-transfer-feedback"));
        await e.check(
          `${id} gives sound decision and transfer feedback with ungraded reasoning limits`,
          async () => {
            assert.equal(selectedCase(page), id);
            assert.match(
              await page.locator(".clinic-transfer-result").innerText(),
              /SOUND TRANSFER CHOICE/,
            );
            assert.match(
              await page.locator(".clinic-limit").innerText(),
              /does not grade your reasoning or establish mastery/,
            );
            await mathematics(page);
          },
        );
      }
    },
  );
  await e.step(
    "Use next-case, Back and Forward while retaining completed in-tab choices",
    async () => {
      await page
        .getByRole("button", { name: "Next case", exact: true })
        .click();
      assert.equal(selectedCase(page), "rolle-corner");
      await visible(page.locator("#clinic-transfer-feedback"));
      await page.goBack();
      await visible(page.locator("#clinic-case-title"));
      assert.equal(selectedCase(page), "hemisphere-flux");
      await page.goForward();
      await visible(page.locator("#clinic-transfer-feedback"));
      assert.equal(selectedCase(page), "rolle-corner");
      await e.check(
        "Back and Forward retain both case identities and their checked transfer choices",
        async () =>
          assert.equal(
            await choice(page, "transfer", "smooth-rolle").isChecked(),
            true,
          ),
      );
    },
  );
  await e.step(
    "Share the selected-case link and reload to verify the declared reset boundary",
    async () => {
      await page
        .getByRole("button", { name: "Copy case link", exact: true })
        .click();
      const link = await page
        .getByRole("textbox", {
          name: "Shareable Clinic case link",
          exact: true,
        })
        .inputValue();
      assert.equal(new URL(link).href, page.url());
      await switchCase(page, "chain-composition");
      assert.equal(
        await page
          .getByRole("textbox", {
            name: "Shareable Clinic case link",
            exact: true,
          })
          .count(),
        0,
      );
      await page.goBack();
      await visible(page.locator("#clinic-case-title"));
      assert.equal(selectedCase(page), "rolle-corner");
      await page.reload();
      await visible(page.locator("#clinic-case-title"));
      await e.check(
        "Reload keeps the selected case and clears choices and scratch work",
        async () => {
          assert.equal(selectedCase(page), "rolle-corner");
          assert.equal(
            await page.locator('input[name="clinic-decision"]:checked').count(),
            0,
          );
          assert.equal(
            await page.locator("#clinic-transfer-feedback").count(),
            0,
          );
          assert.equal(
            await page.locator("#clinic-reasoning").inputValue(),
            "",
          );
        },
      );
    },
  );
  await e.step(
    "Reject malformed, unknown-version, unknown-case and oversized shared state visibly",
    async () => {
      for (const value of [
        "{",
        JSON.stringify({ version: 2, caseId: "rolle-corner" }),
        JSON.stringify({ version: 1, caseId: "absent" }),
        "x".repeat(301),
      ]) {
        const url = new URL(e.url);
        url.hash = "clinic";
        url.searchParams.set("clinic", value);
        await page.goto(url.href);
        await visible(page.locator(".clinic-notice"));
        assert.match(
          await page.locator(".clinic-notice").innerText(),
          /Choose a case/,
        );
        assert.equal(
          await page.locator(".clinic-case-cards > button").count(),
          9,
        );
      }
    },
  );
  await e.step(
    "Use topbar and sidebar entries and complete keyboard controls at 320px",
    async () => {
      await page.goto(e.url);
      await ready(page);
      await page
        .locator(".top-tabs")
        .getByRole("button", { name: "Clinic", exact: true })
        .click();
      await visible(page.locator("#clinic-title"));
      await page.setViewportSize({ width: 320, height: 740 });
      await noOverflow(page);
      await page
        .getByRole("button", { name: "Toggle lecture navigation", exact: true })
        .click();
      const sidebar = page.getByRole("dialog");
      await visible(sidebar);
      await sidebar.getByRole("button", { name: /Calculus Clinic/ }).click();
      await sidebar.waitFor({ state: "hidden" });
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-title",
      );
      await page.locator(".clinic-case-cards > button").first().focus();
      await page.keyboard.press("Enter");
      await visible(page.locator("#clinic-case-title"));
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-case-title",
      );
      const first = choice(page, "decision", "endpoints-suffice");
      await first.focus();
      await page.keyboard.press("ArrowDown");
      assert.equal(
        await choice(page, "decision", "corner-breaks-hypothesis").isChecked(),
        true,
      );
      await page
        .getByRole("button", { name: "Explain my decision", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-diagnosis",
      );
      await page
        .getByRole("button", { name: "Try the transfer check", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await choice(page, "transfer", "smooth-rolle").focus();
      await page.keyboard.press("Space");
      await page
        .getByRole("button", { name: "Check transfer choice", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-transfer-feedback",
      );
      await noOverflow(page);
      await page
        .getByRole("button", { name: "Restart this case", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await page
        .getByRole("button", { name: "Next case", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      assert.equal(selectedCase(page), "chain-composition");
      await noOverflow(page);
    },
  );
  await e.step(
    "Recover a mistaken transfer at 320px, reload its lesson, and return to the fresh case",
    async () => {
      await switchCase(page, "rolle-corner");
      await page
        .locator("#clinic-reasoning")
        .fill("Retain this attempt only until reload.");
      await choice(page, "decision", "endpoints-suffice").check();
      await page
        .getByRole("button", { name: "Explain my decision", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Try the transfer check", exact: true })
        .click();
      await choice(page, "transfer", "minimum-forbids").check();
      await page
        .getByRole("button", { name: "Check transfer choice", exact: true })
        .click();
      await page.locator(".clinic-transfer-result .clinic-recovery").click();
      await visible(page.locator("#lesson-title"));
      const origin = await page.evaluate(() => history.state.clinicReturn);
      await page
        .getByRole("button", { name: "Return to Clinic case", exact: true })
        .click();
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-transfer-feedback",
      );
      await e.check(
        "In-tab transfer recovery restores its exact feedback scroll, choices and scratch work",
        async () => {
          assert.equal(await page.evaluate(() => scrollY), origin.scrollY);
          assert.equal(
            await choice(page, "decision", "endpoints-suffice").isChecked(),
            true,
          );
          assert.equal(
            await choice(page, "transfer", "minimum-forbids").isChecked(),
            true,
          );
          assert.equal(
            await page.locator("#clinic-reasoning").inputValue(),
            "Retain this attempt only until reload.",
          );
        },
      );
      await page.locator(".clinic-transfer-result .clinic-recovery").click();
      await visible(page.locator("#lesson-title"));
      await page.reload();
      await page
        .getByRole("button", { name: "Return to Clinic case", exact: true })
        .click();
      await page.waitForFunction(
        () => document.activeElement?.id === "clinic-case-title",
      );
      await e.check(
        "Recovery reload clears both choices, feedback and scratch work while retaining the case",
        async () => {
          assert.equal(selectedCase(page), "rolle-corner");
          assert.equal(
            await page.locator('input[name="clinic-decision"]:checked').count(),
            0,
          );
          assert.equal(
            await page.locator('input[name="clinic-transfer"]:checked').count(),
            0,
          );
          assert.equal(
            await page.locator("#clinic-transfer-feedback").count(),
            0,
          );
          assert.equal(
            await page.locator("#clinic-reasoning").inputValue(),
            "",
          );
        },
      );
      await e.check(
        "Recovery reload visibly focuses the fresh case heading within the 320px viewport",
        async () => {
          const heading = await page
            .locator("#clinic-case-title")
            .evaluate((el) => {
              const rect = el.getBoundingClientRect();
              return {
                focused: document.activeElement === el,
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                topbarBottom: document
                  .querySelector(".topbar")
                  .getBoundingClientRect().bottom,
                width: innerWidth,
                height: innerHeight,
              };
            });
          assert.equal(heading.width, 320);
          assert.equal(heading.focused, true);
          assert.ok(
            heading.top >= Math.max(0, heading.topbarBottom) &&
              heading.bottom <= heading.height &&
              heading.left >= 0 &&
              heading.right <= heading.width,
            JSON.stringify(heading),
          );
        },
      );
      await e.check(
        "Clinic-only decisions, notes, recovery and transfer produced no account writes",
        async () => assert.deepEqual(writes, []),
      );
    },
  );
}
