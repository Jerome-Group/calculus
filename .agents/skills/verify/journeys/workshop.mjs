import assert from "node:assert/strict";
import {
  ready,
  visible,
  noOverflow,
  mathematics,
  nestedPrerequisiteReturn,
} from "./controls.mjs";

const submit = (page) =>
  page.getByRole("button", { name: "Check construction", exact: true }).click();
const result = (page) => page.locator(".workshop-grid .workshop-report");
const explain = (page, text) =>
  page
    .getByRole("textbox", {
      name: "Your explanation before this check",
      exact: true,
    })
    .fill(text);
const reconstruct = (page) =>
  page
    .getByRole("button", { name: "Edit a new construction", exact: true })
    .click();
const select = (page, name) =>
  page
    .getByRole("navigation", { name: "Workshop investigations", exact: true })
    .getByRole("button", { name })
    .click();
const focused = (page, id) =>
  page.waitForFunction((target) => document.activeElement?.id === target, id);
const drawing = async (page, selector = ".workshop-curve") => {
  const paths = await page
    .locator(`.workshop-diagram ${selector}`)
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  assert.ok(paths.length > 0);
  for (const path of paths) {
    assert.equal(typeof path, "string");
    assert.doesNotMatch(path, /NaN|Infinity/);
  }
  return paths;
};
const firstExplanation =
  "My first construction claims that C=2 controls all directions.";

export async function workshop(page, e) {
  const writes = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/study") && request.method() !== "GET")
      writes.push({ method: request.method(), url: request.url() });
  });
  await e.step(
    "Enter the workshop and recover invalid rational input through the keyboard",
    async () => {
      await page.goto(e.url);
      await ready(page);
      await page
        .getByRole("button", { name: "Open Proof workshop", exact: true })
        .click();
      await visible(page.locator("#workshop-title"));
      await focused(page, "workshop-title");
      await page
        .getByRole("textbox", { name: "Coefficient p", exact: true })
        .fill("1/0");
      await explain(page, firstExplanation);
      await page
        .getByRole("button", { name: "Check construction", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await focused(page, "workshop-p");
      await e.check(
        "Invalid denominator focuses its labeled field, records no result and retains explanation",
        async () => {
          assert.equal(
            await page.locator("#workshop-p").getAttribute("aria-invalid"),
            "true",
          );
          assert.match(
            await page.locator("#workshop-error-p").innerText(),
            /denominator cannot be zero/,
          );
          assert.equal(
            await page.locator("#workshop-explanation").inputValue(),
            firstExplanation,
          );
          assert.equal(await result(page).count(), 0);
        },
      );
      await page.locator("#workshop-p").fill("2");
      await submit(page);
      await focused(page, "workshop-result");
      await e.check(
        "The learner's C=2 returns an arbitrarily local bound obstruction while retaining the derivative",
        async () => {
          assert.match(
            await result(page).innerText(),
            /bound fails arbitrarily close to zero/,
          );
          assert.match(
            await result(page).innerText(),
            /derivative L\(x,y\)=2x−y remains valid/,
          );
          assert.equal(
            await page.locator(".workshop-original").innerText(),
            firstExplanation,
          );
          await mathematics(page);
        },
      );
    },
  );
  await e.step(
    "Keep a revision, build a second construction and inspect each preserved input-result pair",
    async () => {
      await page
        .locator("#workshop-revision")
        .fill(
          "The x-axis ratio is 3 however near zero. My coefficient was too small.",
        );
      await page
        .getByRole("button", { name: "Keep this revision", exact: true })
        .click();
      await focused(page, "workshop-revision-status");
      await reconstruct(page);
      await focused(page, "workshop-construction");
      assert.equal(await result(page).count(), 0);
      assert.equal(
        await page.locator("#workshop-explanation").inputValue(),
        "",
      );
      const before = await drawing(page, ".workshop-guide");
      await page.locator("#workshop-bound").fill("3");
      await e.check(
        "Changing C moves the diagram's proposed bound line",
        async () => {
          assert.notDeepEqual(await drawing(page, ".workshop-guide"), before);
        },
      );
      await explain(page, "My second construction uses 3x²+y² ≤ 3r².");
      await submit(page);
      await focused(page, "workshop-result");
      await e.check(
        "C=3 certifies every positive epsilon, current explanation belongs to it, and history retains the first obstruction",
        async () => {
          assert.match(
            await result(page).innerText(),
            /every positive epsilon/,
          );
          assert.match(await result(page).innerText(), /1\/30/);
          assert.equal(
            await page.locator(".workshop-original").innerText(),
            "My second construction uses 3x²+y² ≤ 3r².",
          );
          await page.locator(".workshop-history > summary").click();
          const first = page.locator(".workshop-history-attempt").first();
          await first.locator("summary").click();
          assert.match(await first.innerText(), /C=2/);
          assert.ok((await first.innerText()).includes(firstExplanation));
          assert.match(await first.innerText(), /coefficient was too small/);
          assert.match(
            await first.innerText(),
            /bound fails arbitrarily close to zero/,
          );
          await first.locator("summary").click();
        },
      );
    },
  );
  await e.step(
    "Recover through the differentiability lesson and use return, Back and Forward",
    async () => {
      await page
        .locator(".workshop-continuation")
        .getByRole("button")
        .first()
        .click();
      await visible(page.locator("#lesson-title"));
      assert.equal(new URL(page.url()).hash, "#total-differentiability");
      assert.equal(new URL(page.url()).searchParams.has("workshop"), false);
      await page
        .getByRole("button", { name: "Return to Proof workshop", exact: true })
        .click();
      await focused(page, "workshop-result");
      assert.match(
        await result(page).innerText(),
        /One bound covers every direction/,
      );
      await page.goBack();
      await visible(page.locator("#lesson-title"));
      await page.goBack();
      await focused(page, "workshop-result");
      await page.goForward();
      await visible(page.locator("#lesson-title"));
      await page
        .getByRole("button", { name: "Return to Proof workshop", exact: true })
        .click();
      await focused(page, "workshop-result");
      await e.check(
        "Lesson detours and browser history retain the same second construction and both attempts",
        async () => {
          assert.equal(
            await page.locator(".workshop-original").innerText(),
            "My second construction uses 3x²+y² ≤ 3r².",
          );
          assert.match(
            await page.locator(".workshop-history > summary").innerText(),
            /\(2\)/,
          );
        },
      );
      const report = await result(page).innerText();
      await page
        .locator(".workshop-continuation")
        .getByRole("button")
        .first()
        .click();
      await visible(page.locator("#lesson-title"));
      await nestedPrerequisiteReturn(page, e, "Return to Proof workshop");
      await page
        .getByRole("button", { name: "Return to Proof workshop", exact: true })
        .click();
      await focused(page, "workshop-result");
      await e.check(
        "Nested prerequisites preserve the exact workshop report and explanation",
        async () => {
          assert.equal(await result(page).innerText(), report);
          assert.equal(
            await page.locator(".workshop-original").innerText(),
            "My second construction uses 3x²+y² ≤ 3r².",
          );
        },
      );
    },
  );
  await e.step(
    "Construct a nondecisive parabola, then a cubic obstruction with a tiny nonzero coefficient",
    async () => {
      await select(page, /Find a hidden path/);
      await explain(page, "A parabola is my proposed obstruction.");
      await submit(page);
      await focused(page, "workshop-result");
      assert.match(
        await result(page).innerText(),
        /unrestricted limit unresolved/,
      );
      const parabola = await drawing(page);
      await reconstruct(page);
      await page.locator("#workshop-exponent").fill("3");
      await e.check(
        "Changing the exponent redraws the path restriction",
        async () => {
          assert.notDeepEqual(await drawing(page), parabola);
        },
      );
      const balanced = await drawing(page);
      await page.locator("#workshop-coefficient").fill("1/1000000");
      await explain(
        page,
        "Balance x⁶ with y²; keep the coefficient exactly nonzero.",
      );
      await submit(page);
      await focused(page, "workshop-result");
      await e.check(
        "The cubic returns exact nonzero constant, epsilon obstruction and a witness for every delta",
        async () => {
          const text = await result(page).innerText();
          assert.match(text, /1000000\/1000000000001/);
          assert.match(text, /500000\/1000000000001/);
          assert.match(text, /any positive delta/);
          assert.match(
            await result(page).locator(".workshop-scope").innerText(),
            /^The unrestricted limit does not exist\./,
          );
          assert.notDeepEqual(await drawing(page), balanced);
          assert.equal(await page.locator(".workshop-grid svg").count(), 1);
          await mathematics(page);
        },
      );
    },
  );
  await e.step(
    "Construct a loop, reverse its traversal, reject a singular edge, and check a zero-winding loop",
    async () => {
      await select(page, /Construct a closed loop/);
      await explain(
        page,
        "My ordered rectangle surrounds the excluded origin.",
      );
      await submit(page);
      await focused(page, "workshop-result");
      assert.match(
        await result(page).innerText(),
        /exact circulation of this polygon is 4π/,
      );
      assert.equal(await page.locator(".workshop-diagram marker").count(), 1);
      const counterclockwise = await drawing(
        page,
        ".workshop-curve[marker-end]",
      );
      assert.match(
        await page.locator(".workshop-captured").first().innerText(),
        /Vertex 4/,
      );
      await reconstruct(page);
      const setVertices = async (vertices) => {
        for (const [i, [x, y]] of vertices.entries()) {
          await page.locator(`#workshop-vertex-${i}-x`).fill(String(x));
          await page.locator(`#workshop-vertex-${i}-y`).fill(String(y));
        }
      };
      await setVertices([
        [-2, 1],
        [2, 1],
        [2, -1],
        [-2, -1],
      ]);
      await explain(page, "I reversed the same ordered rectangle.");
      await submit(page);
      await focused(page, "workshop-result");
      await e.check(
        "Reversing traversal reverses circulation and redraws the ordered arrows",
        async () => {
          assert.match(
            await result(page).innerText(),
            /exact circulation of this polygon is -4π/,
          );
          assert.notDeepEqual(
            await drawing(page, ".workshop-curve[marker-end]"),
            counterclockwise,
          );
        },
      );
      await reconstruct(page);
      await setVertices([
        [1, 0],
        [-1, 0],
        [-1, 1],
        [1, 1],
      ]);
      await explain(
        page,
        "This edge passes through zero; its integral is inadmissible.",
      );
      await submit(page);
      await focused(page, "workshop-vertex-0-x");
      assert.match(
        await page.locator("#workshop-error-vertex-0-x").innerText(),
        /passes through the excluded origin/,
      );
      assert.equal(await result(page).count(), 0);
      await setVertices([
        [1, 1],
        [3, 1],
        [3, 2],
        [1, 2],
      ]);
      await submit(page);
      await focused(page, "workshop-result");
      await e.check(
        "Zero winding certifies only this loop and all prior loop constructions remain paired",
        async () => {
          assert.match(
            await result(page).innerText(),
            /no global potential claim/,
          );
          assert.match(
            await result(page).innerText(),
            /exact circulation of this polygon is 0/,
          );
          assert.match(
            await page.locator(".workshop-history > summary").innerText(),
            /\(3\)/,
          );
          await mathematics(page);
        },
      );
    },
  );
  await e.step(
    "Use the 320px keyboard form, zoom, reduced motion, sidebar, and direct lesson entry",
    async () => {
      await page.setViewportSize({ width: 320, height: 740 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await noOverflow(page);
      await select(page, /Build a remainder bound/);
      await visible(page.locator("#workshop-result"));
      await reconstruct(page);
      await page.locator("#workshop-p").fill("3");
      await explain(
        page,
        "A signed x-axis sequence should refute this proposed derivative.",
      );
      await page
        .getByRole("button", { name: "Check construction", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await focused(page, "workshop-result");
      assert.match(await result(page).innerText(), /proposed derivative fails/);
      await noOverflow(page);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      await noOverflow(page);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "";
      });
      await page
        .getByRole("button", { name: "Toggle lecture navigation", exact: true })
        .click();
      const sidebar = page.getByRole("dialog");
      await visible(sidebar);
      await sidebar.getByRole("button", { name: /Proof workshop/ }).click();
      await sidebar.waitFor({ state: "hidden" });
      await focused(page, "workshop-title");
      await page
        .locator(".workshop-continuation")
        .getByRole("button")
        .first()
        .click();
      await visible(page.locator("#lesson-title"));
      await page
        .getByRole("button", {
          name: "Build a remainder bound · Proof workshop",
          exact: true,
        })
        .click();
      await focused(page, "workshop-title");
      await e.check(
        "Keyboard check and direct lesson entry retain the same map obstruction without horizontal page overflow",
        async () => {
          assert.match(
            await result(page).innerText(),
            /proposed derivative fails/,
          );
          assert.equal(
            await page.locator(".workshop-original").innerText(),
            "A signed x-axis sequence should refute this proposed derivative.",
          );
          await noOverflow(page);
        },
      );
    },
  );
  await e.step(
    "Reload the selected investigation, inspect its reset boundary and reject invalid links",
    async () => {
      const url = new URL(page.url());
      assert.deepEqual(JSON.parse(url.searchParams.get("workshop")), {
        version: 1,
        id: "linear-bound",
      });
      assert.equal(url.href.includes("signed"), false);
      await page.reload();
      await visible(page.locator("#workshop-explanation"));
      await e.check(
        "Reload retains only the selected investigation and clears explanations, results and history",
        async () => {
          assert.equal(
            await page.locator("#workshop-explanation").inputValue(),
            "",
          );
          assert.equal(await result(page).count(), 0);
          assert.match(
            await page.locator(".workshop-history > summary").innerText(),
            /\(0\)/,
          );
          assert.match(
            await page.locator(".workshop-memory").innerText(),
            /new tab resets/,
          );
        },
      );
      for (const value of [
        "{",
        JSON.stringify({ version: 2, id: "linear-bound" }),
        JSON.stringify({ version: 1, id: "missing" }),
        JSON.stringify({
          version: 1,
          id: "linear-bound",
          explanation: "private",
        }),
        "x".repeat(201),
      ]) {
        const invalid = new URL(e.url);
        invalid.hash = "workshop";
        invalid.searchParams.set("workshop", value);
        await page.goto(invalid.href);
        await visible(page.locator(".workshop-notice"));
        assert.match(
          await page.locator(".workshop-notice").innerText(),
          /No construction or explanation was loaded/,
        );
      }
      await e.check(
        "All workshop-only actions and continuation navigation produced no account writes",
        async () => assert.deepEqual(writes, []),
      );
    },
  );
}
