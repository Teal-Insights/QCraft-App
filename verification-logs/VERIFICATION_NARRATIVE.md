# Q-CRAFT Verification Narrative (V2)

## How We Verified the Engine

Q-CRAFT Explorer is a Python reimplementation of the IMF's Q-CRAFT Excel tool. To ensure
our engine produces the same outputs as the original, we conducted a comprehensive automated
verification on a dedicated Mac Mini with Microsoft Excel installed. For each of the 175
available countries, we opened the official Excel workbook via xlwings, set the country and
all parameters to explicit values, waited for recalculation to complete, then compared every
annual output (2030-2099) against our Python engine running with identical inputs. We tested
all 175 countries with default parameters, 5 representative countries across 5 different
parameter settings (25 combos), and 5 countries across all 6 climate scenarios (30 combos).

## What We Found

Of 147 countries with complete data in both systems, every single one achieved **perfect
parity** — 0.0 percentage points of difference across all fiscal metrics (debt-to-GDP,
revenue, expenditure, primary balance) for all 70 projection years. The 25 parameter
sensitivity tests (varying debt targets, fiscal rules, interest rate modes, and expenditure
rigidity) also achieved perfect parity. Climate scenario comparisons showed matching ratio
metrics across all 6 scenarios, with the remaining investigation focused on nominal GDP
level comparisons that require relative rather than absolute tolerance thresholds.

The verification establishes three forms of confidence: **input fidelity** (the same WEO/IMF
source data enters both systems), **output parity** (fiscal projections match to machine
precision across 147 countries), and **stress testing** (results hold under diverse parameter
settings spanning LICs, emerging markets, advanced economies, and small island states).
