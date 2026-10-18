import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function observeGlobConsumers(root) {
  const require = createRequire(path.join(root, "package.json"));
  const { Linter } = require("eslint");
  const nextPlugin = require("@next/eslint-plugin-next");
  const nextGlob = createRequire(require.resolve("@next/eslint-plugin-next"))(
    "fast-glob",
  );
  const dynamicRequire = createRequire(
    require.resolve("vite-plugin-dynamic-import"),
  );
  const dynamicGlob = dynamicRequire("fast-glob");
  const acorn = dynamicRequire("acorn");
  const dynamicMetadata = require("vite-plugin-dynamic-import/package.json");
  const dynamicEsm = await import(
    pathToFileURL(
      path.resolve(
        path.dirname(
          require.resolve("vite-plugin-dynamic-import/package.json"),
        ),
        dynamicMetadata.exports["."].import,
      ),
    )
  );
  const commonjsMetadata = require("vite-plugin-commonjs/package.json");
  const commonjsEsm = await import(
    pathToFileURL(
      path.resolve(
        path.dirname(require.resolve("vite-plugin-commonjs/package.json")),
        commonjsMetadata.exports["."].import,
      ),
    )
  );
  const fixture = fs.mkdtempSync(path.join(tmpdir(), "calculus-glob-"));
  const files = [
    "app-root/pages/target.js",
    "app,quoted/pages/target.js",
    "widgets/a.js",
    "widgets/dup.js",
    "widgets/dup/index.js",
    "widgets/nested/b.js",
    "widgets/nested/index.js",
    "widgets/.hidden.js",
    "widgets/image.jpg",
    "widgets/image.jpeg",
    "assets/image.jpegg",
    "widgets/font.woff",
    "widgets/font.woff2",
    "assets/font.woff2x",
    "widgets/with space.js",
    "widgets/literal[1].js",
    "widgets/$cash.js",
    "widgets/quoted,component.js",
  ];
  const normalize = (value) =>
    JSON.parse(JSON.stringify(value).replaceAll(fixture, "<fixture>"));

  try {
    for (const relative of files) {
      const file = path.join(fixture, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(
        file,
        `globalThis.__globOrder.push(${JSON.stringify(relative)}); module.exports = ${JSON.stringify(relative)};\n`,
      );
    }
    fs.writeFileSync(
      path.join(fixture, "package.json"),
      '{"type":"commonjs"}\n',
    );
    fs.mkdirSync(path.join(fixture, "links"));
    fs.symlinkSync("../app-root", path.join(fixture, "links/app-link"));
    fs.symlinkSync("a.js", path.join(fixture, "widgets/file-link.js"));
    fs.symlinkSync("nested", path.join(fixture, "widgets/dir-link"));

    const roots = [
      "app-root",
      "links/*",
      '{"app,quoted",missing}',
      "@(app-root|missing)",
      "!(missing|widgets|links)",
    ];
    const lint = roots.map((pattern) => {
      const warnings = [];
      const warn = console.warn;
      console.warn = (...args) => warnings.push(args.join(" "));
      try {
        const messages = new Linter({ cwd: fixture }).verify(
          '<a href="/target">Target</a>',
          {
            languageOptions: {
              ecmaVersion: 2022,
              sourceType: "module",
              parserOptions: { ecmaFeatures: { jsx: true } },
            },
            plugins: { next: nextPlugin },
            settings: { next: { rootDir: path.join(fixture, pattern) } },
            rules: { "next/no-html-link-for-pages": "error" },
          },
          { filename: path.join(fixture, "entry.js") },
        );
        return {
          pattern,
          reports: messages.map(({ ruleId, message }) => ({ ruleId, message })),
          warnings,
        };
      } finally {
        console.warn = warn;
      }
    });

    const directCases = [
      ["links/*", { onlyDirectories: true }],
      ["app-root", { onlyDirectories: true }],
      [".", { onlyDirectories: true }],
      [path.join(fixture, "links/*"), { onlyDirectories: true }],
      ["{app-root,links/app-link}", { onlyDirectories: true }],
      [["widgets/*.{js,ts}", "widgets/*/index.{js,ts}"], {}],
      [["widgets/**/*.js", "!widgets/nested/**"], {}],
      ["./widgets/*.js", {}],
      ["../widgets/*.{js,ts}", { cwd: path.join(fixture, "links") }],
      ["widgets/literal\\[1\\].js", {}],
      ["assets/*.{jpe?g,woff2?}", {}],
    ];
    const direct = directCases.map(([pattern, options]) => ({
      pattern,
      next: nextGlob.sync(pattern, { cwd: fixture, ...options }),
      dynamic: dynamicGlob.sync(pattern, { cwd: fixture, ...options }),
    }));

    const expressions = [
      'import("./widgets/" + name)',
      'import("./widgets/" + name + ".js")',
      'require("./widgets/" + name)',
      'import("./widgets/" + name + ".jpe?g")',
      'import("./widgets/" + name + ".woff2?")',
      'import("./widgets/!(dup)/" + name + ".js")',
      'import("./widgets/$" + name + ".js")',
      'import("./assets/" + name)',
    ];
    const dynamic = {};
    for (const [format, api] of Object.entries({
      esm: dynamicEsm,
      cjs: require("vite-plugin-dynamic-import"),
    })) {
      dynamic[format] = [];
      for (const expression of expressions) {
        const node = acorn.parseExpressionAt(expression, 0, {
          ecmaVersion: "latest",
        });
        const result = await api.globFiles({
          importeeNode:
            node.type === "ImportExpression" ? node.source : node.arguments[0],
          importExpression: expression,
          importer: path.join(fixture, "entry.js"),
          resolve: { async tryResolve() {} },
          extensions: [".js", ".ts", ".json", ".jpe?g", ".woff2?"],
        });
        dynamic[format].push({ expression, files: result?.files ?? [] });
      }
    }

    const commonjs = {};
    for (const [format, api] of Object.entries({
      esm: commonjsEsm.default,
      cjs: require("vite-plugin-commonjs").default,
    })) {
      const plugin = api();
      plugin.configResolved({
        resolve: { alias: [], extensions: [".js", ".ts", ".json"] },
        optimizeDeps: {},
        createResolver: () => async () => undefined,
      });
      const result = await plugin.transform(
        'const name = "dup"; const part = require("./widgets/" + name); module.exports = part;',
        path.join(fixture, "entry.js"),
      );
      const entry = path.join(fixture, `transformed-${format}.mjs`);
      fs.writeFileSync(entry, result.code);
      const script = `globalThis.__globOrder = []; const result = await import(${JSON.stringify(pathToFileURL(entry).href)}); process.stdout.write(JSON.stringify({ resolved: result.default, order: globalThis.__globOrder }));`;
      const child = spawnSync(
        process.execPath,
        ["--input-type=module", "-e", script],
        { encoding: "utf8", timeout: 5000, maxBuffer: 8192 },
      );
      assert.equal(child.status, 0, child.stderr);
      assert.equal(child.error, undefined);
      commonjs[format] = {
        code: result.code,
        execution: JSON.parse(child.stdout),
      };
    }
    return normalize({ lint, direct, dynamic, commonjs });
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}
