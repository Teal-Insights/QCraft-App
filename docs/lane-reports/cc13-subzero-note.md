# CC-13: the sub-zero note, and why it never fired

**TEA-1400, 2026-08-29.** Worktree `~/GitHub/QCraft-App-cc13`, branch
`feat/subzero-note-fix` cut from `freeze-2026-08-29`, tag `freeze-2026-08-29b`.

A freeze exception: one defect, minimal diff, no wording changed.

---

## 1. Bottom line

The approved gate-7 note was in the shipped bundle, verbatim, passing the freeze
copy gate, and wired to a code path a trainee never reaches.

The predicate was never the bug. `goesBelowZero()` returned `true` for the
CC-10 case the whole time. Everything that failed was downstream of it.

The note now attaches where the chart spec is built, which is the one place the
screen and the export packet both read from, and it asks each chart about the
lines that chart actually draws.

---

## 2. The case, reproduced exactly

CC-10 reported Uganda reaching -473 per cent of GDP with the fiscal rule set to
No. That figure is reproducible to the tenth:

| Parameter | Value |
| --- | --- |
| Country | Uganda (UGA) |
| Mode | Verified, `weo-2024-10` |
| Fiscal rule | **No** |
| Everything else | `ENGINE_DEFAULTS`, untouched |

Debt-to-GDP in 2099, per scenario:

| Scenario | 2099 |
| --- | --- |
| Baseline | 0.0 (floored) |
| Paris-Aligned | -523.4 |
| Moderate | -517.9 |
| High | -506.9 |
| Hot + Adapted | -505.0 |
| Hot | -492.5 |
| **Hot + Unadapted** | **-473.6** |

-473.6 is the least negative of the six, which is why it is the one CC-10 saw:
it is the value of the "Worst climate outcome (2099)" tile. On screen that tile
read `-473.6% Hot + Unadapted` and nothing else.

The asymmetry is deliberate and is what the note's second sentence describes:
`fiscal.ts` floors the baseline at zero, `climate.ts` does not floor the
scenarios (recorded as a domain rule; `planning/oracles/climate.md` says in as
many words not to add `max(0, ...)` there).

The payloads this was run against are the frozen ones, from the release asset
`site-inputs-freeze-2026-08-29.tar.gz` at its pinned SHA-256, all 381 files
checked against `SHA256SUMS`, and byte-identical to CC-8's copy.

---

## 3. Three causes

### 3.1 The note had no on-screen code path at all

It was appended inside `packetFigures()`, in `src/export/figures.ts`. That
function is reached only from the export packet and the HTML report.

The screen builds its charts from `charts/specs.ts`, through
`chartsForTab -> ChartStack -> specFor -> SpecChart`, and never calls
`packetFigures`. So the screen received the pristine spec and the export
received the annotated one. Neither register on screen could ever show the note,
independent of what the predicate returned.

`ChartStack.tsx`'s own header already stated the architecture this violated:
"What a chart shows is decided once, in `charts/specs.ts`, which is also what
the export packet reads."

### 3.2 The trigger asked about the run, not about the chart

`goesBelowZero(result)` scans every scenario in the result. The note was then
stamped on an id allowlist, `{baseline-debt, analysis-debt, overview}`.

So it also fired on the Baseline tab's debt chart, which draws the baseline
alone. The baseline is floored at zero. That chart carried a sentence reading
"the climate scenarios are not, which is why only they go below it" under a
picture with no climate scenario in it and no line under the axis.

### 3.3 Two artifacts never carried it

`readme.ts` (READ-ME.txt) and `workbookSpec.ts` (the README sheet of the .xlsx)
both emit `NO_SIGNAL_NOTE` and the anchor note, and neither ever imported the
sub-zero one. A packet whose "Debt by scenario" sheet holds -473.6 per cent
explained it nowhere a reader opens first. `buildReadme` is handed the annotated
figures and uses them only to count files.

---

## 4. The fix

`BELOW_ZERO_NOTE` moves to `src/content/guidance.ts`, because `charts/` cannot
import from `export/` without a cycle. `export/figures.ts` re-exports it under
its own name, so the packet tests, the workbook and the freeze gate all still
find it where they name it.

`charts/specs.ts` gains `belowZeroNote(series)`, which reads the points that are
about to be drawn, in the register they are about to be drawn in. It is applied
to the three debt-stock charts.

That single change covers screen and export at once, because `buildCharts()` is
what both read.

### Why not "any displayed series", literally

Measured on Uganda at the app's own defaults, with the fiscal rule ON and
nothing wrong:

| Chart | Lowest drawn value |
| --- | --- |
| `baseline-balances` | -7.8 |
| `analysis-prim-balance` | -5.5 |
| `analysis-overall-balance` | -10.3 |
| `climate-drag` | -5.9 |

A blanket rule would put "the projection has repaid the whole debt stock and
continues into a net asset position" under a primary balance chart on a run
with no sub-zero debt path anywhere. A primary deficit is not a net asset
position. The note is about the debt stock, so the charts it goes on are the
charts of the debt stock, and on those it asks about the lines they draw.

### What fires now, at the CC-10 case

| Chart | Workbook | Briefing |
| --- | --- | --- |
| `baseline-debt` | silent, correctly | silent, correctly |
| `analysis-debt` | **note** | **note** |
| `overview` | not in this register | **note** |

Confirmed in the running app at `Verified / Uganda / fiscal rule No`: the note
renders verbatim on the Analysis debt chart in both registers, the Baseline and
Climate tabs stay silent, and the worst-outcome card now reads
`-473.6% Hot + Unadapted. Below zero is a net asset position.`

With the rule back on, nothing carries it, on any chart, in either register.

---

## 5. The other surface: the worst-outcome tile

The exported key figures have appended "Below zero is a net asset position." to
that tile since CC-3. The screen's own card showed the same number bare, so the
two surfaces explained the same figure differently. The clause is now a shared
constant that both read, so they cannot drift again. The words are unchanged.

---

## 6. Wording

Nothing changed. `BELOW_ZERO_NOTE` is byte for byte what gate resolution 7
approved on 2026-08-27, and a test asserts the exact string rather than a
substring of it.

The stronger range-of-validity caution stays deferred to the next IMF-facing
copy pass, per `docs/post-training-list.md` section 2. It is not in this diff.

`scripts/freeze-check.sh` now pins **all three sentences** instead of the first.
The gate used to check only the opening sentence, so the two that carry the
asymmetry could have been reworded without it noticing.

---

## 7. Why no test caught it

The existing block in `tests/packet.test.ts` pushed a fixture down by 200 points
by hand and asserted on the result. Three things follow, and each is now
covered:

1. It proved the plumbing given a sub-zero path. It could not prove the app
   produces one, because it never ran the engine.
2. It checked the report, the chart pack and the tile. It never called
   `buildReadme` or `buildWorkbookSpec`, which are exactly the two surfaces that
   had nothing.
3. It exercised the default register only, and only the export path, so the
   whole screen half was outside its reach.

The chart-pack assertion in it also passed on luck: `charts/svg.ts` wraps a
subtitle into one `<text>` element per line, so a phrase is split across tags
at whatever column the wrap lands on, and a raw substring match tests where the
break falls rather than whether the note is there. Both new checks normalise the
markup before matching.

### What is pinned now

`tests/verifiedMode.test.ts` gains six cases at the exact CC-10 parameter set,
against the real engine on the frozen payload:

- the number reproduces, and the baseline is still floored at zero
- the note is on screen, in both registers
- the note is in the report, the chart pack, READ-ME.txt and the workbook
  README sheet, in both registers
- it does not fire on a chart that draws no sub-zero line
- it is silent with the rule on
- the approved string is exact, and carries no em-dash

`qa:export` gains a cross-artifact check on every run: if the run's own results
CSV holds a negative debt value, all four artifacts must explain it. That reads
the real downloaded `.xlsx` with openpyxl, and it is the check whose absence let
this ship. It failed on the chart pack the first time it ran, on the wrapping
problem above, which is the check working.

---

## 8. The battery, at `freeze-2026-08-29b`

| Check | Result |
| --- | --- |
| `uv run pytest` | 215 passed |
| `npm --prefix packages/qcraft-engine-ts test` | 83 passed |
| `npm --prefix apps/qcraft-web test` | 292 passed |
| `uv run ruff check .` | clean |
| typecheck, lint, build | clean |
| `scripts/freeze-check.sh` | PASS, eleven gated strings, zero em-dashes |
| `scripts/sweep/sweep_all.sh` | PASS, 5,114,279 cells, max 4.441e-16, tol 1e-12 |
| `pipeline/sanity_check.py` | rc 0 |
| `derive_peer_data.py --check` | four files, all same |
| `qa:export` | 271 checks, 0 failures |
| `qa:tabs`, `qa:registers`, `qa:context`, `qa:widgets` | clean |
| `qa:sweep` | 96 screenshots, no console errors |

The preview server's own cwd was checked against this worktree before any
browser assertion, per the recorded hazard. Two stale servers from other
worktrees were listening on 8080 and 8123 at the time, which is the hazard
itself.

---

## 9. Two things for Teal

**1. The interest-expenditure chart.** At the CC-10 parameter set,
`analysis-interest-exp` draws -38.6 per cent of GDP, and it is in the workbook
register, which is the default. It is negative for the same underlying reason:
once the stock is repaid, interest is income rather than expense. It does not
carry the note, because gate 7 approved the wording for sub-zero **debt paths**,
and putting that sentence under a chart of interest would be applying approved
copy to a claim it was not written for. Extending it, or writing a companion
line, is a wording call rather than a defect fix.

**2. Not touched, noted in passing.** `renderReportHtml` recomputes its own
figure list and so drops anything passed through `PacketOptions.extraFigures`,
which the chart pack and the PNG loop do include. Nothing ships through that
path today. It predates this lane and is not a sub-zero problem.

---

## 10. Reproducing this

```bash
git -C ~/GitHub/QCraft-App-cc13 switch feat/subzero-note-fix
# the per-country payloads are gitignored build artifacts
gh release download freeze-2026-08-29 --repo Teal-Insights/QCraft-App \
  --pattern 'site-inputs-*.tar.gz' --dir /tmp/qcraft-inputs
tar -xzf /tmp/qcraft-inputs/site-inputs-*.tar.gz -C /tmp/qcraft-inputs
for v in weo-2024-10 weo-2026-04; do
  cp /tmp/qcraft-inputs/payloads/$v/*.json data/vintages/$v/json/
done
npm --prefix apps/qcraft-web test -- tests/verifiedMode.test.ts
```

The bundle hash the Pages workflow pins, computed its way:

```bash
cd apps/qcraft-web && rm -rf dist
VITE_BASE_PATH=/QCraft-App/explorer/ npm run build
cd dist && find . -type f -not -path './data/*' | sed 's|^\./||' | LC_ALL=C sort \
  | xargs -I{} shasum -a 256 {} | shasum -a 256 | cut -d' ' -f1
```

`8a3fd7dbad5cdd4d14c7af50a2d962baa526369ee20560a0047459e734b14500` at
`freeze-2026-08-29b`, byte-stable across two runs. The same command at
`freeze-2026-08-29` returns `49e8de70f2f8417a5271b4bbe930f2bde2c517c85bf073f36f2d2bf5db74cc2a`,
which is the pin on `main` today, so the method is the workflow's method.
