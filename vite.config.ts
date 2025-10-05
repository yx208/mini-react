import { defineConfig } from 'vitest/config';
import { resolve } from "node:path";

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom'
    },
    resolve: {
        alias: {
            "^mini-react$": resolve(__dirname, "./packages/react"),
        }
    }
});
