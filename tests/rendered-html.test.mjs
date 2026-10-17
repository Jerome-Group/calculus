import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createStudyWorker } from "./helpers/study-worker.mjs";
const worker = await createStudyWorker({ database: false });
after(() => worker.dispose());

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders the calculus production page", async () => {
  const response = await worker.dispatchFetch("http://localhost/", {
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(
    html,
    /<title>Calculus · Explore the mathematics of change<\/title>/,
  );
  assert.match(html, /Graph studio/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/calculus\.jeromegroup\.org\/calculus-social\.jpg"/,
  );
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(
    html,
    /<meta name="twitter:image" content="https:\/\/calculus\.jeromegroup\.org\/calculus-social\.jpg"/,
  );
  assert.doesNotMatch(html, developmentPreviewMeta);
});
