import { fileURLToPath } from 'node:url';

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

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: BASE_PATH,
  resolve: {
    alias: {
      /*
       * The TypeScript engine, by source rather than by built package.
       *
       * `packages/qcraft-engine-ts` is a workspace sibling with zero runtime
       * dependencies, so aliasing its entry point costs nothing and removes a
       * build-ordering step: `dev`, `build` and `test` all see the same files,
       * and an engine edit shows up without a rebuild. tsconfig.json carries the
       * matching `paths` entry so the compiler resolves it the same way.
       */
      '@qcraft/engine': entry('../../packages/qcraft-engine-ts/src/index.ts'),
    },
  },
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
    rollupOptions: {
      /*
       * Four entry points, not one, because the teaching widgets are ROUTES
       * rather than tabs.
       *
       * The alternative was a client-side router inside the Explorer bundle.
       * Rejected for three reasons. A widget has to survive being iframed into
       * a Quarto course page at a fixed height, and an iframe pointed at a
       * hash route loads the whole Explorer first. A widget has to open
       * full-screen on a projector with nothing else on the page, which a
       * route inside a shell cannot promise. And a router is a dependency and
       * a runtime, where this is a build-time list.
       *
       * The cost is that each widget carries its own React and D3. That is the
       * right way round: the Explorer bundle does not grow at all, and each
       * widget loads only what it draws.
       *
       * On a static host `/widgets/growth` resolves to
       * `/widgets/growth/index.html` with no rewrite rule, and `base: './'`
       * makes Vite emit asset URLs relative to each entry's own depth, so the
       * built bundle still opens from a file:// path or any sub-path.
       */
      input: {
        explorer: entry('index.html'),
        debtDynamics: entry('widgets/debt-dynamics/index.html'),
        growth: entry('widgets/growth/index.html'),
        climateChannel: entry('widgets/climate-channel/index.html'),
      },
    },
  },
});
