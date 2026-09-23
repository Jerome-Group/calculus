import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { auditModel } = await vite.ssrLoadModule(
  "/lib/curriculum/planar/audit.ts",
);

test("shrinking cells have two vanishing sides and the exact finite area ratio", () => {
  for (const h of [0.2, 0.05, 0.001]) {
    const model = auditModel("plane-nonlinear-cell", h);
    const cell = model.comparison.traces[1].points;
    assert.ok(Math.abs(cell[1][0] - cell[0][0] - h) < 1e-12);
    assert.ok(Math.abs(cell[3][1] - cell[0][1] - h) < 1e-12);
    const ratio = 1 + 2 * (0.4 + h / 2) * (0.3 + h / 2);
    const decimal = (number) => Number(number.toFixed(4)).toString();
    assert.match(model.readout, new RegExp(`d=${decimal(Math.SQRT2 * h)}`));
    assert.ok(
      model.readout.includes(String.raw`A_{\rm cell}}{hk}=${decimal(ratio)}`),
    );
    assert.match(model.readout, /det DT=1\.24/);
  }
});

test("fixed-height strip retains bias; guide identifies the distinction", () => {
  const u = 0.4;
  const v = 0.3;
  const k = 0.2;
  const finite = (h) => 1 + 2 * (u + h / 2) * (v + k / 2);
  assert.ok(Math.abs(finite(1e-10) - (1 + 2 * u * v) - u * k) < 1e-9);
  const guides = JSON.parse(
    readFileSync(
      new URL("../lib/curriculum/learning-guides.json", import.meta.url),
    ),
  );
  assert.match(
    guides["plane-jacobian"].sections[1].text,
    /bias \$uk\$ remains/,
  );
});
