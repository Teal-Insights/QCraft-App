import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `process` is a Node global available at Vite config-eval time but isn't in
// TypeScript's default DOM lib. Declared inline so we don't pull in @types/node
// for one read. (Same approach as debt-projection-tool-v2's vite.config.ts.)
declare const process: { env: Record<string, string | undefined> };

// Base path strategy, matching the debt-projection-tool-v2 convention:
//   - Local dev / preview:  VITE_BASE_PATH unset -> './' so the built bundle
//     works from a file:// open, a sub-path, or the dev server alike.
//   - Hosted deploy:        set VITE_BASE_PATH to '/<repo-name>/' (or '/' for a
//     custom domain) in the deploy step.
const BASE_PATH = process.env.VITE_BASE_PATH ?? './';

export default defineConfig({
  plugins: [react()],
  base: BASE_PATH,
  server: {
    fs: {
      // The mock engine adapter imports the engine's golden-master CSVs with
      // `?raw` from packages/qcraft-engine/tests/golden_masters/. Those live
      // two levels above this app's Vite root, so the dev server's fs guard
      // needs the repo root on its allow-list. Rollup resolves them fine at
      // build time without this.
      allow: ['../..'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
