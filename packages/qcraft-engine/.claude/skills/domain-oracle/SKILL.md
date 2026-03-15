# Skill: Domain Oracle

**Context:** Engine package only
**Allowed tools:** Read, Grep

## When to Use

Before implementing any engine function, query this oracle to understand the domain rules.

## Key Domain Rules

1. Fiscal recursion → explicit for-loop, never vectorized
2. Expenditure growth → multiplicative (1+a)*(1+b)*(1+c)
3. Debt floor → max(0, debt) in Baseline ONLY, not climate
4. Rigidity scale → 1.0 = sticky, 0.0 = flexible
5. Golden masters → always from CSV, never hard-coded
6. Intermediate tests → catch compensating errors
7. Context7 → use before Polars/Shiny/Plotly code
8. Source of truth → Excel > Parquet > User guide > Spec > Agent reasoning
