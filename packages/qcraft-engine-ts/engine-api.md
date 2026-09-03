# `@qcraft/engine` — TypeScript engine API

TypeScript port of `packages/qcraft-engine` (Python/Polars), for the React/D3 rebuild of
Q-CRAFT Explorer. Same seven pure functions, same column names, same numbers.

- **Source:** `packages/qcraft-engine-ts/`
- **Contract:** `packages/qcraft-engine/tests/golden_masters/` — 67/67 vitest checks green
- **Breadth:** 147/147 PARITY_PASS against `verification-logs/golden-masters/` (72,030 comparisons)
- **Status:** stable. Ping Lane 1 before assuming any signature change.
- **Last updated:** 2026-08-26

---

## 1. Install and import

Zero runtime dependencies — plain arrays and objects, no DataFrame library.

```ts
import {
  runPipeline,
  demographyCountry,
  productivityCountry,
  inflationCountry,
  baselineV1,
  interestRateCountry,
  baselineCountry,
  calcClimateScenario,
  CLIMATE_SCENARIOS,
  SCENARIO_LABELS,
  COLORS,
  DEFAULTS,
  fromColumnarCountryInput,
  hasOecdSeries,
  type CountryInput,
  type PipelineResult,
} from '@qcraft/engine';
```

Everything is **pure**: no mutation of inputs, no module state, no I/O. Safe to call from
a render path, a worker, or a `useMemo`.

### Naming

Function names are camelCase; **row field names are snake_case**, identical to the Python
engine's Polars columns and to the golden-master CSV headers. That is deliberate — a
golden-master row and an engine row are the same shape, so parity is checkable by eye.

| Python | TypeScript |
| --- | --- |
| `demography_country` | `demographyCountry` |
| `productivity_country` | `productivityCountry` |
| `inflation_country` | `inflationCountry` |
| `baseline_v1` | `baselineV1` |
| `interest_rate_country` | `interestRateCountry` |
| `baseline_country` | `baselineCountry` |
| `calc_climate_scenario` | `calcClimateScenario` |
| `run_pipeline` | `runPipeline` |

---

## 2. The 60-second version

```ts
import ugandaInput from '../sample-data/UGA.json';
import { runPipeline } from '@qcraft/engine';

const result = runPipeline(ugandaInput as CountryInput, {
  demography_variant: 'Medium',
  productivity_start: 5.0,
  productivity_end: 1.2,
  inflation_start: 5.0,
  inflation_end: 3.5,
  interest_rate_mode: 'Nominal interest rate',
  debt_target: 50.0,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1.0,
});

result.fiscal;              // FiscalRow[]        — 91 rows, 2009-2099
result.baseline_v1;         // BaselineV1Row[]
result.climate['Hot'];      // ClimateRow[]
Object.keys(result.climate); // the six scenario keys
```

`runPipeline` runs all seven modules plus the six climate scenarios. Uganda takes ~3 ms.
Call it directly on every parameter change; no debouncing or worker needed.

---

## 3. Input data

### 3.1 Where the Shiny app's processed data lives

The Python app calls `load_parquet_data()` (`packages/qcraft-engine/src/qcraft_engine/data_loader.py`),
which resolves `<project-root>/data/processed/` — the directory holding four Parquet files.
**That directory is not in this repo**: the root `.gitignore` excludes `*.parquet`, so the
processed data is carried out-of-band. Known copies on the build machine:

| Path | Notes |
| --- | --- |
| `~/Library/CloudStorage/Dropbox/Mac/Documents/QCraft-App/data/processed/` | Primary working copy; what the exporter reads by default |
| `~/Library/CloudStorage/Dropbox/Mac/Documents/QCraft-App/deploy-bundle/data_processed/` | Flattened copy shipped to shinyapps.io |
| `~/Library/CloudStorage/Dropbox/Mac/Documents/QCraft-Verification/data/processed/` | Copy used by the Excel parity harness |
| `<sprint>/lane3-data/data/processed/` | Lane 3's clone |

The four files, as extracted from the IMF Q-CRAFT Excel workbook v10 by
`scripts/extract_excel_data.py`:

| File | Rows | Columns |
| --- | ---: | --- |
| `macrofiscal.parquet` | 5,713 | `iso3c`, `country`, `years`, `real_gdp`, `nominal_gdp`, `gdp_deflator`, `revenue`, `expenditure`, `overall_balance`, `primary_balance`, `debt`, `real_gdp_growth_percent`, `nominal_gdp_growth_percent`, `gdp_deflator_growth_percent`, `primary_expenditure`, `interest_expenditure`, `total_expenditure`, `revenue_percent_gdp`, `primary_expenditure_percent_gdp`, `primary_balance_percent_gdp`, `overall_balance_percent_gdp`, `interest_expenditure_percent_gdp`, `debt_to_gdp`, `interest_rate_percent` |
| `demography.parquet` | 269,080 | `iso3c`, `country`, `years`, `age_group`, `status`, `values` (UN WPP long format; population in **thousands**) |
| `productivity.parquet` | 5,470 | `iso3c`, `years`, `productivity_level` (WDI GDP per employed person; `iso3c = "OED"` is the OECD aggregate) |
| `climate.parquet` | 100,980 | `iso3c`, `climate_scenario`, `years`, `gdp_loss_percent` (FADCP cumulative GDP loss, % of baseline) |

Numeric cells are nullable throughout — the WEO source is sparse.

### 3.2 The JSON the TS engine eats

`scripts/export_country_json.py` slices those Parquet files per country and writes one
JSON file each. The JSON is **raw**: it carries the four slices unshaped, and the engine
applies the filtering/forward-fill rules itself (`buildMacroForFiscal` and friends), so
the shaping logic has exactly one home.

```jsonc
{
  "iso3c": "UGA",
  "country": "Uganda",
  "demography":   [{ "iso3c": "UGA", "country": "Uganda", "years": 2009,
                     "age_group": "15-64", "status": "Medium", "values": 15169.0 }],
  "productivity": [{ "iso3c": "UGA", "years": 2009, "productivity_level": 6502.49 }],
  "macrofiscal":  [{ "iso3c": "UGA", "country": "Uganda", "years": 2009,
                     "real_gdp": 74760.0, "nominal_gdp": 48948.0, "gdp_deflator": 65.5,
                     "revenue": 4966.56, "interest_rate_percent": 5.22, "…": null }],
  "climate":      [{ "iso3c": "UGA", "climate_scenario": "Paris",
                     "years": 2030, "gdp_loss_percent": -0.42 }]
}
```

Regenerate:

```bash
# all countries -> out/
uv run --with polars --with pyarrow python scripts/export_country_json.py --all --out-dir out/

# three samples
uv run --with polars --with pyarrow python scripts/export_country_json.py UGA KEN BGD \
  --out-dir ../SHARED/sample-data
```

Samples for **Uganda (UGA)**, **Kenya (KEN)** and **Bangladesh (BGD)** are in
`SHARED/sample-data/`. Each is ~0.5–1 MB of JSON; gzip to ~10% for the wire.

> **Bangladesh caveat.** BGD is one of the 13 countries the Excel parity harness lists as
> `PYTHON_ERROR` — its macrofiscal slice has gaps that make the pipeline throw. The sample
> file is exported and valid; `runPipeline` on it raises `Missing … for year …`. Use it as
> the error-path fixture, not the happy path. Uganda and Kenya both run clean.

---

### 3.3 Two producers — read this before wiring anything up

There are **two** per-country JSON producers, with the same top-level keys and
incompatible inner shapes. Mixing them up is easy and the engine will throw.

| Producer | Shape | Path |
| --- | --- | --- |
| `scripts/export_country_json.py` (Lane 1) | **row-oriented** — arrays of objects, already `CountryInput` | `SHARED/sample-data/<ISO3>.json` |
| Lane 3 vintage pipeline | **columnar** — `{years: [...], real_gdp: [...]}`, demography under `variants`, climate under `scenarios`, plus a `vintage` field | `data/vintages/<vintage>/json/<ISO3>.json` |

Either works. For the columnar form, adapt it first:

```ts
import { fromColumnarCountryInput, runPipeline } from '@qcraft/engine';

const input = fromColumnarCountryInput(lane3Json, { oecdProductivity: oecdRows });
const result = runPipeline(input, params);
```

**The columnar format carries no OECD productivity series.** `productivityCountry` needs
`iso3c = "OED"` rows for `productivity_level_oecd_percent`. Without them the engine would
silently fall back to an OECD level of 1.0 and emit a meaningless number in that one
column, so the adapter refuses to run unless you either pass `oecdProductivity` or set
`allowMissingOecd: true`. Nothing else is affected — no other module reads that column.
`hasOecdSeries(input)` tells you which you have.

Verified: Lane 3's `SHARED/sample-outputs/{UGA,KEN}.json` (vintage `weo-2026-04`) run
clean through the adapter and produce 91 rows with the expected scenario ordering.

---

## 4. Types

Full definitions in `src/types.ts`. `Num = number | null`.

### Inputs

```ts
interface CountryInput {
  iso3c: string;
  country: string;
  demography: DemographyInputRow[];     // UN WPP long format, all variants
  productivity: ProductivityInputRow[]; // this country + "OED"
  macrofiscal: MacroRawRow[];           // raw WEO rows, nullable cells
  climate: ClimateInputRow[];           // all six scenarios
}

interface PipelineParams {
  demography_variant: string;              // "Medium" | "High" | "Low"
  productivity_start: number;              // %, e.g. 5.0
  productivity_end: number;                // %, e.g. 1.2
  inflation_start: number;                 // %, e.g. 5.0
  inflation_end: number;                   // %, e.g. 3.5
  interest_rate_mode: InterestRateMode;
  debt_target: number;                     // % of GDP, e.g. 50
  fiscal_rule: 'Yes' | 'No';
  expenditure_rigidity: number;            // 1.0 = sticky, 0.0 = flexible
}

type InterestRateMode =
  | 'Nominal interest rate'
  | 'Interest-growth differential'
  | 'Real interest rate';
```

### Outputs

Every module returns **91 rows, one per year 2009–2099**, ascending, no gaps.

```ts
interface PipelineResult {
  demography:    DemographyRow[];
  productivity:  ProductivityRow[];
  inflation:     InflationRow[];
  baseline_v1:   BaselineV1Row[];
  interest_rate: InterestRateRow[];
  fiscal:        FiscalRow[];
  climate:       Record<string, ClimateRow[]>; // keys = CLIMATE_SCENARIOS
}
```

| Row type | Fields |
| --- | --- |
| `DemographyRow` | `years`, `working_age_population`, `total_population`, `demography_growth_working_age`⁰, `demography_growth_total`⁰, `iso3c`, `country` |
| `ProductivityRow` | `years`, `productivity_growth_rate_percent`, `productivity_level`, `productivity_level_oecd_percent` |
| `InflationRow` | `iso3c`, `country`, `years`, `inflation` |
| `BaselineV1Row` | `iso3c`, `country`, `years`, `working_age_population`, `employment_growth`, `labour_productivity_growth`, `gdp_deflator_growth_percent`, `real_gdp`, `real_gdp_growth_percent`, `nominal_gdp`, `nominal_gdp_growth_percent`, `population_growth` |
| `InterestRateRow` | `iso3c`, `country`, `years`, `nominal_interest_rate`, `inflation`, `nominal_gdp_growth_percent`, `real_interest_rate`, `interest_growth_differential` |
| `FiscalRow` | `years`, `revenue`, `revenue_percent_gdp`, `primary_expenditure`, `primary_expenditure_percent_gdp`, `primary_balance`, `primary_balance_percent_gdp`, `interest_expenditure`, `interest_expenditure_percent_gdp`, `total_expenditure`, `overall_balance`, `overall_balance_percent_gdp`, `debt_to_gdp`, `debt`, `debt_stabilizing_primary_balance`⁰, `fiscal_gap`⁰ |
| `ClimateRow` | all 14 non-null `FiscalRow` fields, plus `debt_stabilizing_primary_balance`⁰, `labour_productivity_growth`, `real_gdp_growth_percent`, `nominal_gdp_growth_percent`, `nominal_gdp`, `real_gdp`, `employment_growth` |

⁰ **Nullable.** Chart code must handle these:

| Field | Null where | Why |
| --- | --- | --- |
| `demography_growth_working_age`, `demography_growth_total` | 2009 | No 2008 row in range to grow from |
| `debt_stabilizing_primary_balance` | 2009 | Needs t-1 debt |
| `fiscal_gap` | 2009 through `WEO_MAX_YEAR - 4` (2009–2025 for Uganda) | Not reported before the fiscal-rule window opens |

Everything else is a plain `number`.

### Units

- Money (`revenue`, `debt`, `nominal_gdp`, …) — **local currency, billions**, per the WEO source. Not comparable across countries; label axes with the country's own currency.
- `*_percent_gdp`, `debt_to_gdp` — **percent of GDP** (`51.03` = 51.03%).
- `*_growth*`, `inflation`, `*_interest_rate`, `interest_growth_differential` — **percent per year** (`4.885` = 4.885%).
- `working_age_population`, `total_population` — **thousands**.
- `productivity_level` — GDP per employed person, constant USD.
- `productivity_level_oecd_percent` — percent of the OECD level.

---

## 5. Function signatures

```ts
function demographyCountry(
  demographyData: readonly DemographyInputRow[],
  iso3c: string,
  level: string,                       // "Medium" | "High" | "Low"
): DemographyRow[];

function productivityCountry(
  productivityData: readonly ProductivityInputRow[],
  iso3c: string,
  options?: {
    productivityStart?: number;        // default 5.0
    productivityEnd?: number;          // default 1.2
    weoMaxYear?: number;               // default 2029
    oecdGrowthRate?: number;           // default 1.1
  },
): ProductivityRow[];

function inflationCountry(
  macrofiscalDeflator: readonly DeflatorInputRow[],
  iso3c: string,
  options?: { inflationStart?: number; inflationEnd?: number },  // both default 3.5
): InflationRow[];

function baselineV1(
  dataDemography: readonly DemographyRow[],
  dataInflation: readonly InflationRow[],
  dataProductivity: readonly ProductivityRow[],
  macrofiscal: readonly MacroBaselineRow[],
  iso3c: string,
): BaselineV1Row[];

function interestRateCountry(
  dfBaselineV1: readonly BaselineV1Row[],
  macrofiscal: readonly MacroFiscalRow[],
  iso3c: string,
  options?: { selectRate?: InterestRateMode; longRunInterestRate?: number },
): InterestRateRow[];

function baselineCountry(
  dataBaseline: readonly BaselineV1Row[],
  dataInterest: readonly InterestRateRow[],
  dataMacrofiscal: readonly MacroFiscalRow[],
  iso3c: string,
  options: { debtTarget: number; fiscalRule: 'Yes' | 'No' },
): FiscalRow[];

function calcClimateScenario(
  dataBaseline: readonly FiscalRow[],        // baselineCountry output
  dataBaselineV1: readonly BaselineV1Row[],
  dataInterest: readonly InterestRateRow[],
  climateVariation: readonly ClimateVariationRow[],
  options?: { expenditureRigidity?: number; dataRisk?: readonly RiskRow[] | null },
): ClimateRow[];

function runPipeline(
  input: CountryInput,
  params?: Partial<PipelineParams>,        // merged over DEFAULTS
): PipelineResult;
```

Call order, if you drive the modules yourself:
`demography → productivity → inflation → baselineV1 → interestRate → fiscal → climate ×6`.

Helpers exported for that path: `buildMacroDeflator`, `buildMacroForBaseline`,
`buildMacroForFiscal`, `buildClimateVariation`.

---

## 6. Constants

```ts
YEAR_START = 2009;  YEAR_END = 2099;  PROJ_START = 2030;

CLIMATE_SCENARIOS = ['Paris', 'Moderate', 'Hot', 'Hot_Adapted', 'Hot_Unadapted', 'High'];

SCENARIO_LABELS = {
  Paris: 'Paris', Moderate: 'Moderate', Hot: 'Hot',
  Hot_Adapted: 'Hot adapted', Hot_Unadapted: 'Hot unadapted', High: 'High',
};  // the User Guide's names (Tim and Rahman, 2024, II.C); no temperature suffixes

COLORS = {
  baseline: '#2C3E50', Paris: '#27AE60', Moderate: '#3498DB', Hot: '#E67E22',
  Hot_Adapted: '#9B59B6', Hot_Unadapted: '#E74C3C', High: '#C0392B',
  accent: '#1ABC9C', muted: '#BDC3C7', background: '#FAFBFC',
};
```

⚠️ Scenario **keys** use underscores (`Hot_Adapted`); the **final golden-master CSV** and
the Shiny UI use spaces (`Hot Adapted`). Use `SCENARIO_LABELS` for display and don't
round-trip a label back into a key.

`COLORS` is the Shiny palette, carried over for continuity. It has not been checked for
WCAG contrast or colour-blind separation — if the D3 rebuild wants an accessible
categorical ramp, that's a UI-lane call, not an engine constraint.

---

## 7. Worked example — Uganda

`runPipeline` on `SHARED/sample-data/UGA.json` with `DEFAULTS`. Values below are read
straight from the golden masters this suite asserts against.

**Baseline fiscal (`result.fiscal`)**

| Year | `revenue_percent_gdp` | `primary_expenditure_percent_gdp` | `overall_balance_percent_gdp` | `debt_to_gdp` |
| ---: | ---: | ---: | ---: | ---: |
| 2009 | 10.147 | 10.985 | −1.610 | 14.793 |
| 2023 | 14.317 | 15.949 | −4.870 | 51.030 |
| 2050 | 18.585 | 18.228 | −2.247 | 34.637 |
| 2099 | 18.585 | 18.360 | −3.288 | 46.989 |

**Debt-to-GDP in 2099, by scenario** — the ordering the training walks through:

| Scenario | Key | `debt_to_gdp` 2099 |
| --- | --- | ---: |
| Paris | `Paris` | 39.16 |
| _Baseline (no climate shock)_ | — | _46.99_ |
| Moderate | `Moderate` | 47.16 |
| High | `High` | 67.82 |
| Hot adapted | `Hot_Adapted` | 72.02 |
| Hot | `Hot` | 93.96 |
| Hot unadapted | `Hot_Unadapted` | 126.86 |

Read that ordering carefully before designing a legend around it:

- **Hot unadapted (126.9) > Hot (94.0) > Hot adapted (72.0)**: faster adaptation (the
  guide's m parameter, 20 years instead of 30) buys down a large chunk of the damage. This is the headline comparison for the training,
  and the one the Python suite pins as an invariant.
- **Paris (39.2) sits *below* baseline (47.0).** Not a bug: the Paris pathway's projected
  GDP losses are small, and the resulting growth path compounds marginally favourably
  against the baseline's own assumptions by 2099.
- **`High` (67.8) lands below `Hot` (94.0)**, which reads backwards if you assume the
  labels are a temperature ladder. They are not — `High` and the `Hot*` family come from
  different IPCC SSP scenarios, so they aren't rank-ordered by warming alone. Do **not**
  present the six as a single ordered severity scale, and don't apply a sequential colour
  ramp implying one. Group `Hot` / `Hot_Adapted` / `Hot_Unadapted` as a family and treat
  `Paris` / `Moderate` / `High` as separate pathways.

```ts
const result = runPipeline(uga, DEFAULTS);
const y2099 = (rows: { years: number }[]) => rows.find((r) => r.years === 2099)!;

y2099(result.fiscal).debt_to_gdp;                  // 46.989…
y2099(result.climate['Hot_Unadapted']!).debt_to_gdp; // 126.86…

// Series for a chart, baseline + one scenario:
const series = result.climate['Hot']!.map((r, i) => ({
  year: r.years,
  hot: r.debt_to_gdp,
  baseline: result.fiscal[i]!.debt_to_gdp,
}));
```

---

## 8. Errors

Throws `Error` with a message matching the Python engine's failure points:

| Message | Cause |
| --- | --- |
| `No data found for iso3c='ZZZ' in …` | Country absent from that input slice |
| `Missing <thing> for year <y>` | Gap in the year sequence — a country the Python engine would `KeyError` on |
| `Unknown select_rate: '…'` | Bad `interest_rate_mode` |

Missing lookups **throw rather than return `undefined`** on purpose: silent `NaN`
propagation would make the TS engine disagree with Python without failing. Wrap
`runPipeline` in a try/catch and show the country as unavailable — roughly 13 of 198
countries fail this way in the Python engine too.

---

## 9. Domain rules the UI must not "fix"

From `AGENTS.md`. If a chart looks wrong in one of these ways, it is not a bug:

1. **Baseline debt has a floor at 0; climate scenarios do not.** A climate line can go
   negative. Don't clamp the y-axis at zero.
2. **`expenditure_rigidity = 1.0` is sticky (worst case); `0.0` is fully flexible.** The
   scale reads backwards from most indexes. Label the slider carefully.
3. **Expenditure growth is multiplicative** — `(1+a)(1+b)(1+c)`, never additive.
4. **The fiscal-rule adjustment is additive in levels, applied after growth.** It is not a
   rate and is not dimensionally consistent with the terms around it. Intentional.
5. **Fiscal recursion is year-by-year with t-1 lookups.** Don't reimplement any of this in
   the UI with a cumulative reduce.

---

## 10. Verify

```bash
cd packages/qcraft-engine-ts
npm install --include=dev     # NODE_ENV=production is set in some shells; --include=dev is required
npm test                      # 67 golden-master, end-to-end and adapter checks
npm run typecheck             # tsc --noEmit, strict
npm run lint
```

`npm test` also writes `artifacts/parity-summary{,-e2e}.{json,md}` — max absolute deviation
per module and metric.

Multi-country parity against the Excel golden masters (needs data not in the repo):

```bash
cd ../..
uv run --with polars --with pyarrow python scripts/export_country_json.py \
    --all --out-dir /tmp/qcraft-country-json
cd packages/qcraft-engine-ts && npm run parity:excel -- /tmp/qcraft-country-json
```
