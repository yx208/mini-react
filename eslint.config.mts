import * as js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import tsEslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.vitest,
            }
        }
    },
    tsEslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        rules: {
            indent: ["error", 4],
            "object-curly-spacing": ["error", "always"],
            "no-global-assign": ["error", { "exceptions": ["MessageChannel", "performance"] }],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_"
                }
            ]
        }
    }
]);
