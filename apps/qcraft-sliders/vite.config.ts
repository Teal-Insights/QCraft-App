import { defineConfig } from 'vite';

// Served at https://teal-insights.github.io/QCraft-App/try/ by the Site workflow
// (.github/workflows/companion-guide.yml). The absolute base makes the data
// fetches in src/main.ts resolve to /QCraft-App/try/data/... wherever the page
// is opened from.
export default defineConfig({
  base: '/QCraft-App/try/',
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2020' },
  server: { port: 5178, strictPort: false },
  preview: { port: 4178, strictPort: false },
});
