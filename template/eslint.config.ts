import path from "node:path";

import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/.next/", "**/coverage/", "**/next-env.d.ts"]),
  js.configs.recommended,
  {
    basePath: "b7-stack-web",
    extends: [nextVitals, nextTs],
    settings: {
      next: { rootDir: path.join(import.meta.dirname, "b7-stack-web") },
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["b7-stack-shared/**", "b7-stack-server/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Decorator",
          message:
            "Node.js runs this code without a build step and cannot strip decorators.",
        },
        {
          selector: "AccessorProperty",
          message:
            "Node.js runs this code without a build step and cannot strip accessor fields.",
        },
      ],
    },
  },
]);
