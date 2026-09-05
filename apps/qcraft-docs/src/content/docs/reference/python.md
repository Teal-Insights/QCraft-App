---
title: "Python API"
description: "Signatures and source descriptions extracted without importing the engine."
---

**These signatures and docstrings are extracted from the pinned Python source using the standard-library AST.** Import functions from their named modules. The package root does not re-export them. Source descriptions report implementation intent and must be read alongside the assumptions and verification pages.

Engine commit: `251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4`.

Observed inventory: 12 functions and 4 exception classes.
## qcraft_engine.baseline_v1.baseline_v1

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/baseline_v1.py#L16)

```python
qcraft_engine.baseline_v1.baseline_v1(data_demography: pl.DataFrame, data_inflation: pl.DataFrame, data_productivity: pl.DataFrame, macrofiscal: pl.DataFrame, iso3c: str, wdi_last_year: int | None=None) -> pl.DataFrame
```

```text
Compute baseline GDP projections for a single country.

Args:
    data_demography: Output of demography_country(). Must have columns:
        years, working_age_population, total_population, iso3c, country.
    data_inflation: Output of inflation_country(). Must have columns:
        years, inflation.
    data_productivity: Output of productivity_country(). Must have columns:
        years, productivity_growth_rate_percent.
    macrofiscal: WEO-period macrofiscal data. Must have columns:
        iso3c, years, real_gdp, nominal_gdp, real_gdp_growth_percent,
        nominal_gdp_growth_percent, gdp_deflator_growth_percent.
    iso3c: 3-letter ISO country code (e.g. "UGA").

Returns:
    DataFrame with columns: iso3c, country, years, working_age_population,
    employment_growth, labour_productivity_growth, gdp_deflator_growth_percent,
    real_gdp, real_gdp_growth_percent, nominal_gdp, nominal_gdp_growth_percent,
    population_growth. Years 2009-2099 (91 rows).
```

## qcraft_engine.climate.calc_climate_scenario

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/climate.py#L21)

```python
qcraft_engine.climate.calc_climate_scenario(data_baseline: pl.DataFrame, data_baseline_v1: pl.DataFrame, data_interest: pl.DataFrame, climate_variation: pl.DataFrame, expenditure_rigidity: float=1.0, data_risk: pl.DataFrame | None=None, climate_start_year: int | None=None) -> pl.DataFrame
```

```text
Compute climate-adjusted fiscal projections for one scenario.

Args:
    data_baseline: Output of baseline_country() (fiscal module). Columns:
        years, revenue, revenue_percent_gdp, primary_expenditure,
        primary_expenditure_percent_gdp, debt_to_gdp, debt, etc.
    data_baseline_v1: Output of baseline_v1(). Columns:
        years, employment_growth, labour_productivity_growth,
        gdp_deflator_growth_percent, nominal_gdp, real_gdp,
        nominal_gdp_growth_percent.
    data_interest: Output of interest_rate_country(). Columns:
        years, nominal_interest_rate.
    climate_variation: DataFrame with columns: years, climate_variation.
        The year-over-year productivity growth shock. Zero for years
        <= WEO_MAX_YEAR, nonzero from climate impact start year.
    expenditure_rigidity: 0.0 (flexible) to 1.0 (sticky, default).
    data_risk: Optional discrete risks DataFrame. If provided, must have
        columns: years, revenue_risk, expenditure_risk (% GDP).

Returns:
    DataFrame with 21 columns, years 2009-2099 (91 rows).
```

## qcraft_engine.data_loader.load_parquet_data

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/data_loader.py#L38)

```python
qcraft_engine.data_loader.load_parquet_data(data_dir: Path | None=None) -> dict[str, pl.DataFrame]
```

```text
Load all Parquet files.
```

## qcraft_engine.data_loader.get_country_list

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/data_loader.py#L56)

```python
qcraft_engine.data_loader.get_country_list(data: dict[str, pl.DataFrame]) -> list[dict[str, str]]
```

```text
Get sorted list of {iso3c, country} dicts.

Only includes countries present in ALL four data sources
(macrofiscal, demography, productivity, climate) so the
pipeline will not crash on any selectable country.
```

## qcraft_engine.data_loader.run_pipeline

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/data_loader.py#L236)

```python
qcraft_engine.data_loader.run_pipeline(data: dict[str, pl.DataFrame], iso3c: str, params: dict | None=None, *, calculation_policy: str='verified-workbook-v1') -> dict[str, pl.DataFrame]
```

```text
Run full Q-CRAFT pipeline for one country.

Args:
    data: Output of load_parquet_data().
    iso3c: 3-letter ISO country code.
    params: Optional parameter overrides. Keys:
        demography_variant, productivity_start, productivity_end,
        inflation_start, inflation_end, interest_rate_mode,
        long_run_interest_rate, productivity_turning_point,
        debt_target, fiscal_rule, expenditure_rigidity.

Returns:
    Dict with keys: demography, productivity, inflation,
    baseline_v1, interest_rate, fiscal, and one per climate
    scenario (e.g. "Paris", "Moderate", etc.).
```

## qcraft_engine.demography.demography_country

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/demography.py#L13)

```python
qcraft_engine.demography.demography_country(demography_data: pl.DataFrame, iso3c: str, level: str) -> pl.DataFrame
```

```text
Compute demography outputs for a single country and variant.

Args:
    demography_data: Long-format DataFrame with columns:
        iso3c, country, years, age_group, status, values.
        age_group includes "15-64" (working age) and "Total".
        values are population in thousands.
    iso3c: 3-letter ISO country code (e.g. "UGA").
    level: Demographic variant — "Medium", "High", or "Low".

Returns:
    DataFrame with columns: years, working_age_population,
    total_population, demography_growth_working_age,
    demography_growth_total, iso3c, country.
    Years 2009-2099 (91 rows). Growth rates are null for year 2009.
```

## qcraft_engine.errors.QCraftDataError

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/errors.py#L20)

```python
qcraft_engine.errors.QCraftDataError(message: str, *, iso3c: str='', year: int=0, field: str='')
```

```text
A country's source data cannot support the projection that was asked for.

Subclasses `ValueError` so callers that already catch it keep working, and
carries the country, year and field as attributes so a caller can build a
sentence rather than parse one.
```

## qcraft_engine.errors.MissingDebtAnchorError

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/errors.py#L37)

```python
qcraft_engine.errors.MissingDebtAnchorError(iso3c: str, year: int, field: str='debt_to_gdp')
```

```text
No debt figure in the year the projection starts from.

The recursion carries debt forward from the last WEO year, so without that
year's debt there is no starting point and nothing downstream is defined.
Zambia and Libya are the live cases: the WEO suppresses Zambia's debt
projection while its restructuring is unresolved, and carries no debt series
for Libya in any year.
```

## qcraft_engine.errors.MissingMacrofiscalInputError

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/errors.py#L57)

```python
qcraft_engine.errors.MissingMacrofiscalInputError(iso3c: str, year: int, field: str)
```

```text
A macrofiscal series the engine reads has a hole inside the WEO window.

Distinct from a missing anchor: the projection could start, but one of the
aggregates it copies through is absent for a year it does read. Singapore,
Samoa and Macao SAR are the live cases, all missing primary expenditure and
the interest split that depends on it.
```

## qcraft_engine.errors.MissingYearError

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/errors.py#L75)

```python
qcraft_engine.errors.MissingYearError(year: int, field: str)
```

```text
A year the projection reads has no row at all.

Distinct from a null cell: the series simply does not reach back that far.
Somalia's WEO record starts in 2011 and Puerto Rico's interest rate has no
2009, while the projection starts at 2009 for every country. The workbook
has a column per year for every country and writes `n/a` in the ones it
cannot fill, so it reaches the same `#VALUE!` by a slightly different route.

The message carries no country code because the TypeScript `mustGet` that
raises the same condition does not know one, and the two must match.
```

## qcraft_engine.fiscal.baseline_country

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/fiscal.py#L74)

```python
qcraft_engine.fiscal.baseline_country(data_baseline: pl.DataFrame, data_interest: pl.DataFrame, data_macrofiscal: pl.DataFrame, debt_target: float, fiscal_rule: str, iso3c: str) -> pl.DataFrame
```

```text
Compute baseline fiscal projections for a single country.

Args:
    data_baseline: Output of baseline_v1(). Must have columns:
        years, nominal_gdp, nominal_gdp_growth_percent,
        labour_productivity_growth, gdp_deflator_growth_percent,
        population_growth.
    data_interest: Output of interest_rate_country(). Must have columns:
        years, nominal_interest_rate.
    data_macrofiscal: Historical macrofiscal data (WEO period). Must have
        columns: iso3c, years, revenue, primary_expenditure, primary_balance,
        overall_balance, debt_to_gdp, debt, interest_expenditure, nominal_gdp,
        and corresponding _percent_gdp columns.
    debt_target: Debt-to-GDP target for fiscal rule (default 60).
    fiscal_rule: "Yes" or "No".
    iso3c: 3-letter ISO country code.

Returns:
    DataFrame with 16 columns: years, revenue, revenue_percent_gdp,
    primary_expenditure, primary_expenditure_percent_gdp, primary_balance,
    primary_balance_percent_gdp, interest_expenditure,
    interest_expenditure_percent_gdp, total_expenditure, overall_balance,
    overall_balance_percent_gdp, debt_to_gdp, debt,
    debt_stabilizing_primary_balance, fiscal_gap.
    Years 2009-2099 (91 rows).
```

## qcraft_engine.horizon.finite

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/horizon.py#L36)

```python
qcraft_engine.horizon.finite(value: object) -> TypeGuard[int | float]
```

```text

```

## qcraft_engine.horizon.resolve_horizon

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/horizon.py#L44)

```python
qcraft_engine.horizon.resolve_horizon(payload)
```

```text
Return timing and a precise reason for shorter or unsupported coverage.
```

## qcraft_engine.inflation.inflation_country

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/inflation.py#L18)

```python
qcraft_engine.inflation.inflation_country(macrofiscal_deflator: pl.DataFrame, iso3c: str, inflation_start: float=3.5, inflation_end: float=3.5) -> pl.DataFrame
```

```text
Compute inflation (GDP deflator growth) for a single country.

Args:
    macrofiscal_deflator: DataFrame with columns iso3c, country, years,
        gdp_deflator. The deflator is an index (e.g. base 2015=100).
    iso3c: 3-letter ISO country code (e.g. "UGA").
    inflation_start: Starting inflation rate (%) for logistic convergence.
    inflation_end: Long-run inflation target (%).

Returns:
    DataFrame with columns: iso3c, country, years, inflation.
    Years 2009-2099 (91 rows).
```

## qcraft_engine.interest_rate.interest_rate_country

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/interest_rate.py#L17)

```python
qcraft_engine.interest_rate.interest_rate_country(df_baseline_v1: pl.DataFrame, macrofiscal: pl.DataFrame, iso3c: str, select_rate: str='Nominal interest rate', long_run_interest_rate: float=1.0) -> pl.DataFrame
```

```text
Compute interest rate projections for a single country.

Args:
    df_baseline_v1: Output of baseline_v1(). Must have columns:
        years, nominal_gdp_growth_percent, gdp_deflator_growth_percent.
    macrofiscal: Historical macrofiscal data. Must have columns:
        iso3c, years, interest_rate_percent.
    iso3c: 3-letter ISO country code (e.g. "UGA").
    select_rate: One of "Nominal interest rate", "Interest-growth differential",
        or "Real interest rate".
    long_run_interest_rate: Long-run real rate assumption (default 1.0%).
        Only used when select_rate = "Real interest rate".

Returns:
    DataFrame with columns: iso3c, country, years, nominal_interest_rate,
    inflation, nominal_gdp_growth_percent, real_interest_rate,
    interest_growth_differential. Years 2009-2099 (91 rows).
```

## qcraft_engine.productivity.productivity_country

[Source](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine/src/qcraft_engine/productivity.py#L37)

```python
qcraft_engine.productivity.productivity_country(productivity_data: pl.DataFrame, iso3c: str, productivity_start: float=5.0, productivity_end: float=1.2, weo_max_year: int=2029, oecd_growth_rate: float=1.1, turning_point: int=LOGISTIC_TURNING_POINT) -> pl.DataFrame
```

```text
Compute productivity outputs for a single country.

Args:
    productivity_data: DataFrame with columns iso3c, years, productivity_level.
        Must include historical WDI data for the target country (through 2021)
        and optionally OECD data (iso3c="OED") for relative-level computation.
    iso3c: 3-letter ISO country code (e.g. "UGA").
    productivity_start: Starting growth rate (%) for logistic convergence.
    productivity_end: Long-run convergence target growth rate (%).
    weo_max_year: Last year of WEO/macrofiscal data (typically 2029).
    oecd_growth_rate: Annual OECD productivity growth rate (%) for projection.
    turning_point: Logistic Turning Point timing parameter (Productivity!J21),
        in years after weo_max_year. Higher values shift the transition later.
        Default 15.

Returns:
    DataFrame with columns: years, productivity_growth_rate_percent,
    productivity_level, productivity_level_oecd_percent.
    Years 2009-2099 (91 rows).
```

