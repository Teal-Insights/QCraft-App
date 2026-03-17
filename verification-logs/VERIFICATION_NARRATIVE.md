# Q-CRAFT Verification Narrative

## How Verification Was Performed

The Q-CRAFT Explorer Python engine was verified against the original IMF Excel workbook
(v10) across 30 countries spanning low-income fragile states, stable developing
economies, emerging markets, advanced economies, and small island developing states.
An additional 25 parameter sensitivity tests varied debt targets, fiscal rules,
interest rate modes, and expenditure rigidity across 5 representative countries.

For each test, the Excel workbook was driven programmatically using xlwings (Microsoft
Excel on macOS), setting country and parameter inputs identically to the Python engine.
Full annual output series (2030-2099) were compared for debt-to-GDP, revenue, primary
expenditure, primary balance, and interest expenditure — all as percent of GDP.

## What the Results Mean

All 52 parity tests passed with zero divergence (0.0 percentage points).
This confirms that:
- **Input fidelity**: The Python engine uses the same WEO macrofiscal, demographic,
  productivity, and climate data as the Excel workbook.
- **Output parity**: Fiscal projections (debt, revenue, expenditure, balances) match
  Excel to machine precision across all tested countries and years.
- **Stress testing**: Results hold across diverse country types (from Somalia to Japan)
  and across all parameter variations (fiscal rule on/off, different debt targets,
  interest rate modes, and expenditure rigidity settings).

Note: 2 countries were excluded because they are not present in all four
required data sources (macrofiscal, demography, productivity, climate).