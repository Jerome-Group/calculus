import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "outputs/**",
    "next-env.d.ts",
  ]),
  {
    files: ["vendor/braces/**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["components/atlas/**/*.{ts,tsx}"],
    ignores: ["components/atlas/study-records.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "**/study/server",
            "**/study/legacy",
            "**/study/session",
            "**/db",
            "**/db/*",
            "**/workshop/checks",
            "**/workshop/rational",
            "**/workshop/catalog",
            "**/workshop/types",
          ],
        },
      ],
    },
  },
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
