# Q-CRAFT Code Style Guide

## Architecture
- UV workspace monorepo: engine + app
- Engine: 7 pure functions returning Polars DataFrames
- App: Shiny for Python + Plotly

## Testing
- Golden master parity tests from CSV fixtures
- NEVER hard-code expected values
- Test intermediate outputs, not just final results

## Domain Rules (flag violations as HIGH)
- Fiscal recursion: explicit for-loops only
- Expenditure growth: multiplicative (1+a)*(1+b)*(1+c)
- Debt floor: max(0, debt) in Baseline only, NOT climate
- Rigidity: 1.0 = sticky, 0.0 = flexible

## Style
- Python 3.12+, Ruff formatting, Pyright type checking
- Polars (not pandas), Shiny for Python (not Streamlit)
- Prefer simplicity over abstraction
- No factory patterns, no ABC, no config objects
