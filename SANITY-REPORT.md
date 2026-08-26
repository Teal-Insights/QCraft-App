# SANITY-REPORT — WEO Oct 2024 vs WEO Apr 2026 + WPP 2024

**Lane 3 / TEA-1401 · 2026-08-26 · Uganda MoF training prep (TEA-952)**

Ten countries run through the existing Python engine on both vintages, unchanged
engine code, default parameters (`debt_target=50`, `fiscal_rule="Yes"`,
`expenditure_rigidity=1.0`, `Medium` demography). Uganda first, then a spread
across regions, income levels and debt profiles.

Reproduce with:

```bash
uv run --package qcraft-pipeline python pipeline/sanity_check.py
```

**Headline: every divergence below is a data revision. None of it is a pipeline
bug, and the evidence for that is in §4.**

---

## 1. Debt-to-GDP: the numbers

`old` = WEO Oct 2024 + WPP 2022 (frozen). `new` = WEO Apr 2026 + WPP 2024.

| | 2009 (start) | | 2024 (last actual) | | 2029 (last WEO) | | **2050** | |
|---|---|---|---|---|---|---|---|---|
| | old | new | old | new | old | new | **old** | **new** |
| **Uganda** | 14.79 | 14.79 | 51.4 | 51.8 | 36.3 | **53.5** | **34.6** | **50.3** |
| Kenya | 35.96 | 35.96 | 69.9 | 67.3 | 66.1 | **73.6** | 50.4 | **71.7** |
| Ghana | 26.79 | 25.39 | 82.5 | 70.3 | 66.9 | **45.7** | 51.9 | 52.1 |
| Nigeria | 8.62 | 6.12 | 51.3 | 39.3 | 49.3 | **31.7** | 51.2 | **41.8** |
| South Africa | 26.99 | 26.99 | 75.0 | 76.0 | 83.6 | 81.7 | 51.1 | 51.1 |
| India | 72.77 | 72.73 | 83.1 | 84.8 | 78.4 | 80.6 | 77.3 | 79.2 |
| Brazil | 64.70 | 64.70 | 87.6 | 87.0 | 97.6 | 104.1 | 85.7 | 93.3 |
| Germany | 71.72 | 72.36 | 62.7 | 62.2 | 57.8 | **70.2** | 52.8 | **63.4** |
| Japan | 198.81 | 172.86 | 251.2 | 214.5 | 245.0 | **195.7** | 176.5 | **130.7** |
| United States | 86.60 | 87.07 | 121.0 | 122.3 | 131.7 | 135.5 | 88.8 | 85.4 |

Real GDP growth barely moves anywhere — the divergences are fiscal, not
macroeconomic:

| | avg real growth 2010–29 | | avg real growth 2030–50 | |
|---|---|---|---|---|
| | old | new | old | new |
| Uganda | 5.72 | 5.65 | 6.23 | 6.06 |
| Kenya | 4.91 | 4.85 | 5.22 | 5.13 |
| Ghana | 5.32 | 5.53 | 5.11 | 4.99 |
| Nigeria | 3.25 | 3.27 | 5.80 | 5.50 |
| South Africa | 1.37 | 1.31 | 4.04 | 4.13 |
| India | 6.24 | 6.29 | 3.72 | 3.75 |
| Brazil | 1.83 | 1.83 | 3.08 | 2.96 |
| Germany | 1.27 | 1.22 | 2.81 | 2.73 |
| Japan | 0.88 | 0.90 | 2.05 | 2.02 |
| United States | 2.33 | 2.34 | 3.48 | 3.49 |

Largest post-2030 growth change in the sample is Nigeria at −0.30pp. Population
is the other projection input and WPP 2022 → 2024 moves it by well under a
percent for these countries. The 2050 gaps are not coming from the growth engine.

## 2. Uganda in detail — the training country

Uganda's 2050 baseline moves from **34.6% to 50.3% of GDP**, the largest
proportional change in the sample. It is entirely inherited from WEO.

Comparing the **raw WEO input** (before the engine touches it):

| year | debt/GDP old → new | revenue %GDP old → new | primary balance %GDP old → new |
|---|---|---|---|
| 2019 | 37.5 → 38.0 | 13.45 → 13.45 | −2.71 → −2.71 |
| 2023 | 51.0 → 50.4 | 14.32 → 14.39 | −1.63 → −1.71 |
| 2024 | 51.4 → 51.8 | 14.80 → 14.49 | −1.27 → −0.68 |
| 2026 | 44.8 → **55.0** | 16.90 → **15.33** | +1.90 → **−1.38** |
| 2029 | 36.3 → **53.5** | 18.59 → **16.93** | +1.57 → **−0.05** |

History (2019, 2023) is unchanged. The revision is entirely in the projection.
WEO Oct 2024 had Uganda's revenue climbing to 18.6% of GDP by 2029 and the
primary balance turning positive from 2026, which drove debt down 15pp over five
years. WEO Apr 2026 has revenue reaching only 16.9% and the primary balance still
slightly negative in 2029, so debt stays flat around 53%.

The engine's 2029 output (53.45) equals the WEO input (53.5) to rounding, because
inside the WEO window the engine passes WEO through. So **100% of the 2029
divergence is the IMF's own forecast revision.** The 2050 difference then follows
mechanically: with the default fiscal rule the engine converges debt toward the
50% target, and the new path starts 17pp higher at the 2030 hand-off, so it
arrives near 50 instead of dropping to 35.

Interpretation for the training: this is the story Q-CRAFT is designed to tell.
Uganda's projected consolidation was pulled forward on paper in 2024 and has been
pushed back in the 2026 vintage — most plausibly the delayed oil-revenue timeline
and slower revenue mobilisation. Both numbers are "right" for their vintage; the
tool shows how much of a long-run debt path is inherited from a five-year forecast.

## 3. The other notable divergences, and what each one is

| Country | What moved | Attribution |
|---|---|---|
| **Japan** | 2009 debt/GDP 198.8 → 172.9; 2024 −36.7pp; 2050 176.5 → 130.7 | **Series revision.** Gross debt levels are down a median 11.3% across all history while nominal GDP is up 1.5%. A revision this uniform across 20+ years of history is a definitional/coverage change to `GGXWDG`, not a forecast update. Largest single move in the sample and worth an IMF footnote check before it is shown to an audience. |
| **Nigeria** | 2009 debt/GDP 8.6 → 6.1; nominal GDP history **+40.8%** | **GDP rebasing.** Debt levels are unchanged (median 0.0% across history); the whole move is the denominator. Nigeria rebased its national accounts, so every ratio falls by roughly the same proportion. Not a data error. |
| **Ghana** | 2029 debt/GDP 66.9 → 45.7; projected nominal GDP **+19.3%** | **Post-restructuring revision + rebasing.** History nominal GDP moves only +0.14%, so this is projection, not base. |
| **Germany** | 2029 debt/GDP 57.8 → 70.2; 2050 52.8 → 63.4 | **Forecast revision.** History is unchanged (nominal GDP median Δ 0.00%). The primary balance flips from +0.79% of GDP in 2029 to −2.56% — the 2025 defence and infrastructure package. Debt rises instead of falling. |
| **Kenya** | 2029 debt/GDP 66.1 → 73.6; 2050 50.4 → 71.7 | **Forecast revision**, same shape as Uganda: revenue to 2029 marked down 19.8% → 16.6% of GDP, primary balance +1.59 → −0.03. |
| South Africa, India, Brazil, USA | ≤7pp at 2050 | Ordinary vintage-to-vintage drift. |

Note how often 2050 lands near 50 in the old vintage (Ghana 51.9, Nigeria 51.2,
South Africa 51.1, Kenya 50.4). That is the default fiscal rule pulling debt to
the 50% target, not a coincidence in the data. Where the new vintage sits well
above 50 at 2050 — Uganda, Kenya, Brazil, Germany — the starting point in 2030 is
now too far from target for the rule to close the gap in twenty years.

Climate scenarios move in parallel with the baseline and preserve their ordering
(`Paris` < baseline < `Hot_Unadapted`) in both vintages. Uganda 2050:
`Paris` 34.1 → 49.8, `Hot_Unadapted` 38.7 → 54.7. The climate GDP-loss data is
carried forward unchanged, so the shift is the baseline shifting under it.

## 4. Why this is revision and not a pipeline bug

The frozen vintage was extracted from an Excel workbook with `openpyxl`; the new
one is fetched from the IMF SDMX API. Different source, different code path. On
history that WEO did *not* revise, the two must agree — and they do:

- **28,675 overlapping history cells** (2001–2019, eight WEO series, all
  countries). Median absolute relative difference: **6.1 × 10⁻⁷ %**.
- **52.4%** of cells agree to better than 1 part in 10⁸; **71.9%** to better than
  0.001%. Those residuals are Excel display rounding in the workbook, not
  disagreement.
- **47 of 195 countries** have *zero* nominal-GDP history revision — for those the
  two independently-sourced pipelines produce numerically identical series.
- The 15.7% of cells that differ by more than 1% concentrate in 26 countries, and
  the list reads exactly like a list of national-accounts rebasings and
  restructurings: `NGA GHA ZWE SSD BOL COD CAF TCD MLI IRN JAM JOR LVA MLT MMR
  PAN SAU SLB TKM TON UZB VUT YEM BDI BGR BRB`.

Three more consistency checks, all passing:

- **2009 debt ratios are unchanged to nine decimal places** for Uganda, Kenya,
  South Africa and Brazil (e.g. Uganda 14.792812215973 vs 14.792812215004). The
  engine reproduces the frozen result exactly when the input is the same, so the
  differences elsewhere are input differences.
- The engine's 2029 output equals the WEO 2029 input for every country checked —
  confirming divergence enters as data, not as engine behaviour.
- Two consecutive pipeline runs produce **byte-identical** Parquet and JSON.
- The emitted per-country JSON round-trips: loading `json/UGA.json` alone, with no
  Parquet involved, and feeding its four arrays to `run_pipeline()` reproduces the
  same 2050 debt-to-GDP (50.3433) as the Parquet path. The JSON matches Lane 1's
  `CountryInput` contract key-for-key, including the OECD frontier productivity
  series the TypeScript engine needs.

The pipeline's own validation gate also passed: schema and dtypes identical to the
frozen vintage, no duplicate keys, unit scaling verified against overlapping
history, year bounds, and full 151-year coverage for every
(country, variant, age group).

## 5. Coverage and known failures

| | old | new |
|---|---|---|
| Countries in `macrofiscal` | 197 | 197 |
| Countries in `demography` | 197 | 237 |
| **Selectable (all four sources)** | **175** | **175** |
| Of those, `run_pipeline` succeeds | **151** | **155** |

**Fixed by the refresh (4):** `LBN`, `LKA`, `SRB`, `SYR`.

Serbia is the interesting one. On the shipped Oct 2024 data, selecting Serbia in
the Explorer raises `ComputeError: aggregation 'item' expected no or a single
value, got 2 values` — Kosovo was fuzzy-matched onto `SRB` during the workbook
extract, so Serbia carries two population series under one code. Serbia is in the
live dropdown, so this is a user-visible crash in production today. The new
vintage separates Kosovo as `XKX` and Serbia runs.

**Newly broken: none.**

**Still failing on both vintages (20 of 175):**

```
AFG ARM BFA BGD BLR DJI HKG KAZ LBY MAC MNG MRT PRI PSE SGP SOM TGO TLS WSM ZMB
```

Two causes, both upstream data gaps rather than pipeline damage: `float()` on a
null WEO level in `baseline_v1` (Hong Kong, Macao and Singapore have no general
government debt series in WEO at all), and `KeyError: 2009` where a country has no
WEO row at the engine's start year. `get_country_list()` checks that a country
appears in all four sources but not that the rows the engine needs are non-null.
Written up as item 3 in `.change-requests/PIPELINE-2026-08-26.md`; it surfaces to
a Ministry of Finance user as a raw Python traceback.

## 6. Caveats

- **Horizon truncated to 2029.** WEO Apr 2026 projects through 2031, but the
  engine pins its WEO boundary to 2029 in two places
  (`productivity_country(weo_max_year=2029)` and the climate-variation builder),
  so a longer horizon would silently desynchronise them. Truncating also makes
  this comparison clean: both vintages hand off to the projection engine in the
  same year. Two years of IMF projections are on the table once the engine change
  in `.change-requests/PIPELINE-2026-08-26.md` lands.
- **Productivity and climate are carried forward,** so this comparison isolates
  WEO and WPP. Neither has a public April-2026 upstream.
- **Japan warrants a look before it is shown to anyone.** A −36.7pp move in a
  headline debt ratio is large enough that the definitional change behind it
  should be named, not just noted.
- **The golden masters are unaffected.** They test the engine against CSV
  fixtures, not against `data/processed/`; all 198 engine tests pass with either
  vintage active. Oct 2024 remains the verification vintage — see
  `VINTAGE-TOGGLE.md`.
