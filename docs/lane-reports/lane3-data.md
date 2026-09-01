# MORNING REPORT — Lane 3 (data refresh pipeline, TEA-1401)

**Run:** Wed 2026-08-26, unattended · **Branch:** `feat/lane3-data` · **Status: complete.**

Nothing was pushed. Nothing frozen was touched.

---

## What you can do now

```bash
uv sync --all-packages
uv run --package qcraft-pipeline qcraft-pipeline init-base   # one-time
uv run --package qcraft-pipeline qcraft-pipeline run          # the pipeline
uv run --package qcraft-pipeline qcraft-pipeline select weo-2026-04   # point the app at it
```

Read in this order: **SANITY-REPORT.md** (the findings), **DATA-NOTES.md** (what the
data is), **VINTAGE-TOGGLE.md** (how to switch), `.change-requests/PIPELINE-2026-08-26.md`
(three things the engine needs).

## Definition of done

| | |
|---|---|
| Pipeline runs end to end | ✅ one command, ~40s warm, all four tables |
| Outputs for all available countries | ✅ 197 in macrofiscal, 175 selectable, 175 JSON files |
| Uganda smoke test passes | ✅ 91 rows 2009–2099, baseline + all six climate scenarios |
| SANITY-REPORT.md written | ✅ 10 countries, copied to `SHARED/` |
| Nothing frozen touched | ✅ golden masters unmodified, 198/198 engine tests pass |

`ruff` clean, `pyright` clean, two consecutive runs byte-identical.

## The three things worth your attention

**1. Uganda's 2050 debt path moves 34.6% → 50.3% of GDP.** This is the IMF's
revision, not ours. WEO Oct 2024 had Uganda's revenue reaching 18.6% of GDP by
2029 with the primary balance positive from 2026; WEO Apr 2026 has revenue at
16.9% and the primary balance still negative in 2029. Debt at the 2029 hand-off
goes from 36.3% to 53.5%, and the projection engine carries that forward. The
engine's 2029 output equals the WEO 2029 input to rounding, so the divergence is
100% upstream. Worth deciding before Sept 1 whether the training runs on the
current-but-less-flattering April 2026 numbers or the verified October 2024 ones.

**2. Serbia crashes the live Explorer today.** `ComputeError: aggregation 'item'
expected no or a single value, got 2 values`. The workbook extract fuzzy-matched
"Kosovo" onto `SRB`, so Serbia carries two population series under one code and
`demography_country()` cannot pivot. Serbia is in the shipped dropdown. Fixed in
the new vintage (Kosovo separates as `XKX`); the frozen vintage stays broken until
someone decides to re-extract it, which would regenerate golden-master inputs.

**3. Japan's debt ratio drops 36.7pp at 2024 (251.2% → 214.5%).** Gross debt is
revised down a median 11.3% across *all* history, which is a definitional change
to `GGXWDG`, not a forecast update. It is the largest single move in the sample
and someone should name the reason before it goes in front of an audience.

## Also found

- **20 of 175 selectable countries fail `run_pipeline`** on the new vintage — but
  **24 of 175 fail on the frozen one**, so the refresh fixes four (`LBN`, `LKA`,
  `SRB`, `SYR`) and breaks none. Causes are upstream data gaps (Hong Kong, Macao
  and Singapore have no general government debt in WEO at all) surfacing as raw
  Python tracebacks. Item 3 in the change-request.
- **`www.imf.org` is 403 host-wide from this machine** — every path, including the
  site root and the classic bulk `.ashx` files, over both HTTP/1.1 and HTTP/2 with
  browser headers. Worked around via `api.imf.org` SDMX 2.1, which serves the same
  April 2026 release (`PUBLICATION_DATE 2026-04-14`). Details and every URL tried
  in `BLOCKED-imf-bulk-download.md`. Not blocking, but you may want to know the
  IP is flagged.
- **The WEO horizon is truncated to 2029** even though April 2026 publishes through
  2031. The engine pins 2029 in two places that do *not* derive it from the data
  (`productivity_country(weo_max_year=2029)` and the climate-variation builder),
  so a longer horizon desynchronises them silently. Two years of extra IMF
  projections are available once that is fixed — item 1 in the change-request.

## Cross-lane

Lane 1 published a `CountryInput` JSON contract in `SHARED/engine-api.md` partway
through this run. The per-country JSON was rebuilt to match it key-for-key rather
than keep the shape invented here, and it round-trips: `json/UGA.json` alone, no
Parquet, through `run_pipeline()` gives the same 2050 debt-to-GDP of 50.3433. It
also now carries the OECD frontier productivity series (`OED`), which the first
cut omitted and which `productivity_country()` needs.

## Timeline

| | |
|---|---|
| 12:27 | Read AGENTS.md / CLAUDE.md, mapped the repo |
| 12:28–12:31 | Discovery: found `data/processed`, traced provenance to the IMF workbook |
| 12:30 | `www.imf.org` 403 on every probe; found `api.imf.org` SDMX as the way in |
| 12:34–12:36 | Downloaded WEO Apr 2026 + WPP 2024 (~290 MB cached) |
| 12:37 | DATA-NOTES.md committed before any pipeline code, per the brief |
| 12:38–12:45 | Built and validated the pipeline; two defects caught by its own gate |
| 12:46–12:52 | Ran the engine on both vintages, 10 countries + a 175-country sweep |
| 12:52–12:55 | SANITY-REPORT.md; realigned JSON to Lane 1's contract |

## Left undone, deliberately

- **The engine is not modified.** All three change-request items are engine-side
  and out of this lane; each has a proposed fix written up.
- **Productivity and climate are not refreshed.** Neither has a public April-2026
  upstream — both are embedded in the IMF workbook. Carrying them forward is also
  correct rather than merely expedient: the engine only reads historical
  productivity before `weo_max_year − 6`. Reasoning in DATA-NOTES.md §6.
- **`data/processed/` still holds the Oct 2024 vintage.** Switching the live app is
  a one-command decision and yours to make, not something to do unattended before
  a training.
