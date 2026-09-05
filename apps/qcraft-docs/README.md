# Build the Q-CRAFT documentation

This standalone Starlight package builds at `/QCraft-App/docs/`. It consumes committed references, so an ordinary docs build does not need the application, its data, Python dependencies or an engine source checkout.

## Build the committed site

Use Node **25.9.0**, npm **11.12.1** and Python **3.14.6** (only the standard library is needed for the checks). Install from the committed lockfile:

```sh
cd apps/qcraft-docs
mkdir -p .cache/npm .cache/tmp
export npm_config_cache="$PWD/.cache/npm"
export TMPDIR="$PWD/.cache/tmp"
export ASTRO_TELEMETRY_DISABLED=1
npm ci
npm run build
npm run check:links
npm run preview -- --host 127.0.0.1 --port 4321
```

Open `http://127.0.0.1:4321/QCraft-App/docs/`. Search is available in this production preview. Astro development mode intentionally displays a search placeholder.

## Regenerate exact source references

Keep the engine in a separate, complete checkout. `source-manifest.json` pins its commit independently of the docs branch. The ordinary main checkout is not the engine reference for this release. The pinned tool revision includes the full-WEO Current policy; historical comparison receipts retain their original scope. All source links point to the pinned engine revision. The release tag and input archive are recorded in the source manifest.

```sh
export QCRAFT_ENGINE_ROOT=/absolute/path/to/pinned-engine-checkout
npm run refs:python -- --source-root "$QCRAFT_ENGINE_ROOT"
npm run refs:typescript
npm run build
npm run refs:check
python3 scripts/check-links.py --engine-root "$QCRAFT_ENGINE_ROOT"
git diff -- src/content/docs/reference reference-snapshots
```

The Python generator parses AST nodes without importing the package, retains defaults, positional/keyword markers, annotations, full function/class docstrings and exception constructors. The TypeScript generator uses the public entry point and actual `tsconfig.build.json`, with `types: []` because the calculation package requires no ambient Node types. TypeDoc compiles and validates the source; unresolved warnings fail the strict reference command. Starlight uses the same source configuration to render the site pages. `refs:check` regenerates ordinary TypeScript Markdown into a local temporary directory, compares every byte and checks the Python snapshot without modifying it.

Generated Markdown is committed in `src/content/docs/reference/`; plain TypeScript Markdown with repository-relative links also lives in `reference-snapshots/typescript/`. Treat generated descriptions as source text. Correct a false source description upstream, then update the pinned source and regenerate.

## Build provenance and review

Exact versions are in `package.json` and `package-lock.json`. The public skin uses Inter and IBM Plex Sans with their OFL files in `public/fonts/`. No proprietary typeface is required. The diagram is a local SVG and search uses local Pagefind assets.

The build includes a docs version and permanent engine source link in the footer. Run two unchanged production builds and compare sorted file SHA-256 inventories including Pagefind output. Record the docs source commit, engine commit, package lock SHA-256, runtime versions and final site digest in the release packet. Keep the whole-site publication manifest separate: this package occupies `/QCraft-App/docs/`, alongside the current six-page operating companion at `/QCraft-App/guide/` and Explorer at `/QCraft-App/explorer/`. Assembly preserves the March guide at the root with a historical banner and retains earlier URLs. The full input archive must identify frozen Verified, preserved earlier Current and full-horizon Current payload sets, plus the manual guide resource files needed to rebuild the companion. This docs build needs neither those payloads nor guide resources. Building this package does not publish the complete site.
