> Historical August 2026 record. The September Current data and calculation policy is documented in [docs/current-data-policy.md](docs/current-data-policy.md). Fixed-2029 and older Current claims below describe the previous revision; Verified remains frozen.

# DATA-NOTES — where the Explorer's input data lives, and what shape it is

**Lane 3 / TEA-1401 · written 2026-08-26 before any pipeline code was committed.**

This is the DISCOVER deliverable: location, format, schema, provenance and country
coverage of the data the Q-CRAFT Explorer currently runs on.

---

## 1. Location

The engine loads four Parquet files from a single directory:

`packages/qcraft-engine/src/qcraft_engine/data_loader.py:37`

```python
_DATA_DIR = _find_project_root() / "data" / "processed"
return {
    "macrofiscal": pl.read_parquet(d / "macrofiscal.parquet"),
    "demography":  pl.read_parquet(d / "demography.parquet"),
    "productivity":pl.read_parquet(d / "productivity.parquet"),
    "climate":     pl.read_parquet(d / "climate.parquet"),
}
```

`load_parquet_data()` takes an optional `data_dir` argument; when omitted it resolves
`<repo root>/data/processed`. The Shiny app calls it with no argument at import time
(`apps/qcraft-app/app.py:31`), so **the app always reads `data/processed/`**.

Two things about `data/processed/` matter:

- `*.parquet` is in `.gitignore`, so **the data is not in the repository**. A fresh
  clone has no `data/` directory at all and the app cannot start.
- The authoritative copy on this machine is
  `~/Library/CloudStorage/Dropbox/Mac/Documents/QCraft-App/data/processed/`
  (also mirrored in that repo's `deploy-bundle/data_processed/`, which is what
  `scripts/deploy.sh` ships to shinyapps.io).

For this lane the four files were copied into `data/processed/` in this clone as a
read-only working baseline. They were not modified.

## 2. Provenance — one workbook, not four downloads

All four files come from a **single** source: the IMF FAD Q-CRAFT Excel workbook
`2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx`, extracted by `scripts/extract_excel_data.py`
(`openpyxl`, `data_only=True`, reading hidden raw-data blocks at fixed row offsets).

The workbook itself embeds third-party vintages:

| Parquet | Workbook sheet | Underlying source | Vintage |
|---|---|---|---|
| `macrofiscal.parquet` | `Macrofiscal` rows 66–1672 | IMF World Economic Outlook | **WEO October 2024** |
| `demography.parquet` | `Demography` rows 118–1926 | UN World Population Prospects | **WPP 2022** |
| `productivity.parquet` | `Productivity` rows 62+ | World Bank WDI, GDP per person employed | 1991–2022 |
| `climate.parquet` | `Climate Database` rows 25–1224 | Q-CRAFT climate GDP-loss database | bundled with tool v10 |

**Consequence for the refresh:** only *macrofiscal* and *demography* have a public
upstream that can be re-downloaded. Productivity and climate have no public
April-2026 equivalent — they are properties of the IMF workbook, not of WEO or WPP.
See §6.

## 3. Schema

Long/tidy format throughout. `years` is `Int64`, all values `Float64`.

### macrofiscal.parquet — 5,713 rows · 24 cols · 197 countries · 2001–2029

Key: `(iso3c, years)`.

| Column | Meaning | Origin |
|---|---|---|
| `iso3c`, `country`, `years` | keys | |
| `real_gdp` | constant-price GDP, national currency **billions** | WEO `NGDP_R` |
| `nominal_gdp` | current-price GDP, national currency billions | WEO `NGDP` |
| `gdp_deflator` | deflator **index** (not growth) | WEO `NGDP_D` |
| `revenue` | general government revenue, billions | WEO `GGR` |
| `expenditure` | general government total expenditure, billions | WEO `GGX` |
| `overall_balance` | net lending/borrowing, billions | WEO `GGXCNL` |
| `primary_balance` | primary net lending/borrowing, billions | WEO `GGXONLB` |
| `debt` | general government gross debt, billions | WEO `GGXWDG` |
| `real_gdp_growth_percent` | `real_gdp / lag(real_gdp) * 100 - 100` | derived |
| `nominal_gdp_growth_percent` | ditto on `nominal_gdp` | derived |
| `gdp_deflator_growth_percent` | ditto on `gdp_deflator` | derived |
| `primary_expenditure` | `revenue - primary_balance` | derived |
| `interest_expenditure` | `expenditure - primary_expenditure` | derived |
| `total_expenditure` | alias of `expenditure` | derived |
| `revenue_percent_gdp` | `revenue / nominal_gdp * 100` | derived |
| `primary_expenditure_percent_gdp` | | derived |
| `primary_balance_percent_gdp` | | derived |
| `overall_balance_percent_gdp` | | derived |
| `interest_expenditure_percent_gdp` | | derived |
| `debt_to_gdp` | `debt / nominal_gdp * 100` | derived |
| `interest_rate_percent` | `interest_expenditure / debt * 100`, **same year** | derived |

Growth columns are null in 2001 (no prior year). Nulls are common in the fiscal
block for small states; `run_pipeline` filters or forward-fills them
(`data_loader.py:_build_macrofiscal_for_fiscal`).

### demography.parquet — 269,080 rows · 6 cols · 197 countries · 1950–2100

Key: `(iso3c, years, age_group, status)`. Columns: `iso3c`, `country`, `years`,
`age_group` ∈ {`15-64`, `65+`, `Total`}, `status` ∈ {`Medium`, `High`, `Low`},
`values` = population in **thousands**.

`status` is the WPP projection variant. `age_group` `Total` is all ages.

**Verified against WPP:** the levels are **1 July** population, not 1 January.
Tested by joining all 29,596 shared country-years against both WPP2024 releases:
median signed difference vs 1 July is **+0.03%** (−0.02% on 1950–2020 history) but
vs 1 January is **+0.77%** — exactly the half-year growth bias. The pipeline
therefore uses `WPP2024_PopulationByAge5GroupSex_*`, not the `Population1January*`
files.

### productivity.parquet — 5,470 rows · 3 cols · 176 countries · 1991–2022

Columns: `iso3c`, `years`, `productivity_level` (GDP per person employed, constant
PPP $). No `country` column. 170 countries end in 2022, 6 end in 2021.

### climate.parquet — 100,980 rows · 4 cols · 197 countries · 2015–2099

Columns: `iso3c`, `climate_scenario`, `years`, `gdp_loss_percent` (cumulative GDP
loss vs no-climate-change, percent; nulls written as `0.0` by the extractor).
Scenarios: `Paris`, `Moderate`, `High`, `Hot`, `Hot_Adapted`, `Hot_Unadapted`.

## 4. Country coverage

| Source | Countries |
|---|---|
| macrofiscal | 197 |
| demography | 197 |
| climate | 197 |
| productivity | **176** |
| **Selectable in the app** | **175** |

`get_country_list()` intersects all four, so productivity is the binding constraint.
The 22 codes present in macrofiscal but dropped for want of productivity data:

`ABW AIA AND ATG DMA ERI FSM GRD KIR KNA MHL MSR NRU PLW SMR SSD SYC TKM TUV TWN VEN YEM`

(175 = 197 − 22, and `SRB`/Kosovo collapse to one row — see §5.)

## 5. Two defects found in the current bundled data

**(a) Kosovo is silently merged into Serbia.** `demography.parquet` has 1,359
duplicate `(iso3c, years, age_group, status)` keys, all `SRB`. The extractor's
`pycountry.search_fuzzy("Kosovo")` resolves to `SRB`, so Kosovo's series
(e.g. 2020 Total = 1,671k) sits alongside Serbia's (7,358k) under the same code.
`demography_country()` filters on `iso3c` alone, so whichever row wins is
arbitrary. Only Serbia is affected; no other code duplicates.

**(b) `interest_rate_percent` uses same-year debt.** `interest_expenditure(t) /
debt(t)`, where the economically standard measure divides by `debt(t-1)`. This is
inherited from the workbook and is *deliberately* preserved — golden-master parity
depends on it. Flagged here so nobody "fixes" it during a refresh.

Neither is repaired in the frozen Oct-2024 vintage. (a) is fixed in the new vintage
(Kosovo → `XKX`, which both WEO and WPP now carry separately); (b) is preserved
exactly.

## 6. What can and cannot be refreshed

| Dataset | Upstream reachable? | Action |
|---|---|---|
| macrofiscal | **Yes** — IMF SDMX, April 2026 vintage | rebuilt |
| demography | **Yes** — UN WPP 2024 revision | rebuilt |
| productivity | No public April-2026 equivalent | **carried forward** |
| climate | Ships inside the IMF workbook | **carried forward** |

Carrying productivity forward is not merely a fallback, it is correct: the engine
only reads historical productivity *levels* for years before `weo_max_year − 6`
(2023). From 2023 on, `baseline_v1` back-calculates productivity as the residual of
WEO real GDP growth and employment growth. A 1991–2022 productivity series is
exactly the window the engine consumes.

## 7. Access notes (2026-08-26)

- `www.imf.org` returns **HTTP 403 (Akamai "Access Denied")** for every path from
  this host, including the classic bulk file
  `.../WEO-Database/2024/October/WEOOct2024all.ashx` and the datamapper API. The
  block is host-wide, not vintage-specific.
- `https://api.imf.org/external/sdmx/2.1/` is **not** blocked and serves the WEO
  dataflow. `IMF.RES:WEO(9.0.0)` carries `PUBLICATION_DATE = 2026-04-14` and
  projections through 2031 — i.e. it *is* the April 2026 vintage. The pipeline uses
  this endpoint. See `BLOCKED-imf-bulk-download.md`.
- `population.un.org` is unrestricted.

## 8. WEO April 2026 vs the frozen vintage — coverage deltas

New codes: `KOS` (Kosovo), `LIE` (Liechtenstein), `WBG` (West Bank and Gaza, the
same territory the old extract called `PSE`). Gone: `AIA` (Anguilla), `MSR`
(Montserrat) — neither is a WEO reporter; they came from the workbook's own list.

Pipeline mapping: `WBG → PSE`, `KOS → XKX`; aggregates `G110 G119 G163 GX123`
dropped.
