# Q-CRAFT, one input at a time

Live at https://teal-insights.github.io/QCraft-App/try/ (the "try" page beside the
Explorer at `/explorer/`, the companion at `/guide/` and the technical reference at `/docs/`).

One card per user input of the IMF Q-CRAFT model. Change that input, hold everything
else at the reference settings, and see what it alone does to the debt path of any of
the 175 countries in the Explorer's data. Vite + TypeScript + D3 on `@qcraft/engine`,
the TypeScript port of the engine, at app source `a6313ad7` (the same pin the Site
workflow builds the Explorer from). Card text lives in `content/inputs.md`; numbers are
locked in `content/FACT-LOCK.md`.

URL patterns: `?country=KEN`; `?country=UGA&preset=teaching`; add `&try` (every card at
its try value), `&on=Hot`, `&open`; anchors like `#rigidity`.

## Build

Two inputs are not committed and are materialised from the reviewed release pins,
exactly as the Site workflow does it:

1. The engine: copy `packages/qcraft-engine-ts` from app source `a6313ad7` to
   `upstream/source/packages/qcraft-engine-ts`, then `npm ci` and `npm run build` there.
2. The country payloads: copy `payloads/weo-2026-04-full-horizon-v1/*.json` from the
   release asset `qcraft-tool-inputs-2026-09-05.tar.gz` (tag `qcraft-tool-2026-09-05`)
   into `public/data/weo-2026-04-full-horizon-v1/` (175 files, about 37 MB).

Then, with Node 25.9.0 (the runtime the workflow pins):

```bash
npm ci
npm run build     # dist/, about 44 MB, base /QCraft-App/try/
```

To try `dist/` locally the server root must put it at the same sub-path:

```bash
mkdir -p /tmp/try-root/QCraft-App && ln -sfn "$PWD/dist" /tmp/try-root/QCraft-App/try
python3 -m http.server 4178 --directory /tmp/try-root
# open http://localhost:4178/QCraft-App/try/?country=UGA&preset=teaching
```
