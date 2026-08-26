# Lane 2: React + D3 Explorer UI on the debtpath conventions (TEA-1400)

You are one of three parallel agent lanes building toward the Sept 1 Uganda Ministry of Finance QCraft training (Linear TEA-952): the React/D3 rebuild of Q-CRAFT Explorer. Today is Wed 2026-08-26. UI freeze target Sat 2026-08-29 EOD. You run unattended; Teal reviews via your report and git log.

## Hard rules
- Work ONLY inside this clone. Read-only reference paths (NEVER write to them):
  - /Users/teal_mac_mini_25/Library/CloudStorage/Dropbox/DataScience/QCraft-App (protected source checkout)
  - /Users/teal_mac_mini_25/GitHub/debt-projection-tool-v2 (React 18 + TS + Vite + D3 + vitest conventions; study its structure, chart components, and styling before writing code)
  - /Users/teal_mac_mini_25/Dropbox/lte-workbench/brand/tealbrand/tokens.json (brand tokens)
- You MAY read /Users/teal_mac_mini_25/candidates/qcraft-sprint-2026-08-26/SHARED/ (the engine lane publishes engine-api.md and sample-data/ there; check it periodically).
- No git push, no adding remotes, no publishing anywhere. Commit locally to the current feat/ branch, small and frequent.
- Read AGENTS.md and CLAUDE.md at the repo root FIRST.
- Maintain MORNING-REPORT.md at the clone root (done, decisions, open questions, how to run the dev server). If blocked >30 min, write BLOCKED-<topic>.md and move on.
- Finish with build, typecheck, lint, and tests green and a final MORNING-REPORT.md update.

## Mission
Build `apps/qcraft-web`: a Vite + React 18 + TypeScript + D3 static app replicating and extending the Shiny Explorer.

- BEHAVIOR SPEC: read the Shiny app at `apps/qcraft-app` (app.py, src/, www/) and extract tabs, controls, chart specs, and guidance text. Tabs: Baseline (summary cards + debt/revenue/balance charts), Analysis (all-scenario overlay; the spread IS the climate-fiscal risk), Climate (GDP impact trajectories), Data (table + CSV export), Methodology.
- Sidebar params: country, demography variant, debt target, fiscal rule on/off, expenditure rigidity, PLUS newly exposed productivity (start/long-run), inflation (start/end), and interest-rate approach (constant nominal / constant differential / constant real). Defaults must equal the currently hidden defaults; find them in the engine constants and cite the source in a code comment.
- ENGINE SEAM: one adapter module (src/engine/adapter.ts). If SHARED/engine-api.md exists, code against it; until the TS engine lands, back the adapter with a mock that serves real fixture data from `packages/qcraft-engine/tests/golden_masters/final/uganda.csv` so charts render truthful Uganda output.
- BRAND: generate src/theme.ts from the tokens file (copy values in with a provenance comment; font family names with system fallbacks; NEVER commit font files). If the tokens file is unreachable, say so in MORNING-REPORT.md and use neutral grayscale placeholders; do not invent brand colors.
- D3 charts: responsive line charts with scenario overlays; chart titles are takeaways, annotations on the data; every parameter gets a short guidance tooltip sourced from the Shiny app / companion guide text.
- Definition of done: `npm run build` produces a working static bundle; dev-server + build instructions in MORNING-REPORT.md; note explicitly which parts are mock-backed vs engine-backed.
