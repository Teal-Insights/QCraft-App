# Inflation/Productivity Logistic Counter Investigation

**Date:** 2026-03-16
**Investigator:** Claude Opus 4.6

---

## Question

What counter value does the logistic convergence function use at year 2030 (the first post-WEO projected year)? Is it counter=1 or counter=2?

The inflation oracle packet previously said counter=2 at 2030 (written when WEO_MAX_YEAR was assumed to be 2028). The WEO boundary investigation established WEO_MAX_YEAR=2029, which would change the counter to 1. But we needed to verify against the actual Excel formulas.

---

## Findings

### Architecture: Separate Lookup Table

Both the Inflation and Productivity sheets use the same architecture:

1. A **sigmoid lookup table** starting at column B with counter=1, 2, 3... (hardcoded integers, not computed from years)
2. A **year-indexed output row** that maps year columns to sigmoid columns via cell references

The sigmoid table is NOT aligned with year columns. It's a standalone 1-indexed table that the output row points into.

### Inflation Sheet

| Component | Location | Content |
|-----------|----------|---------|
| Counter | Row 8, cols B-CV | 1, 2, 3, ..., 99 (hardcoded integers) |
| Sigmoid values | Row 9, cols B-CV | `=$C$6+($E$6-$C$6)*((1/(1+EXP(-$G$6*(B8-$J$6)))^$G$6))` |
| Output | Row 3 | Years 2002-2029: `=Macrofiscal!<col>15`. Years 2030+: `=B9`, `=C9`, ... |

**Critical mapping at the boundary:**

| Year | Row 3 formula | Points to | Counter used |
|------|-------------|-----------|-------------|
| 2029 | `=Macrofiscal!AE15` | WEO data | N/A |
| **2030** | **`=B9`** | Sigmoid col B | **counter=1** |
| 2031 | `=C9` | Sigmoid col C | counter=2 |
| 2032 | `=D9` | Sigmoid col D | counter=3 |

### Productivity Sheet

| Component | Location | Content |
|-----------|----------|---------|
| Counter | Row 23, cols B-CV | 1, 2, 3, ..., 99 (hardcoded integers) |
| Sigmoid values | Row 24, cols B-CV | `=$C$21+($E$21-$C$21)*((1/(1+EXP(-$G$21*(B23-$J$21)))^$G$21))` |
| Levels | Row 3 | Years 2028-2029: `=prev*(1+$C$21/100)` (uses productivity_start). Years 2030+: `=prev*(1+B24/100)` |
| Growth rates | Row 6 | Years 2028-2029: `=Baseline!<col>12`. Years 2030+: `=level(t)/level(t-1)*100-100` |

**Critical mapping at the boundary:**

| Year | Row 3 (level) formula | Sigmoid reference | Counter used |
|------|-----------------------|-------------------|-------------|
| 2029 | `=AC3*(1+$C$21/100)` | Uses `productivity_start` directly | N/A |
| **2030** | **`=AD3*(1+B24/100)`** | Sigmoid col B | **counter=1** |
| 2031 | `=AE3*(1+C24/100)` | Sigmoid col C | counter=2 |
| 2032 | `=AF3*(1+D24/100)` | Sigmoid col D | counter=3 |

### Golden Master Cross-Check

```
Productivity sigmoid(counter=1, start=5.0, end=1.2, rate=0.5, tp=15) = 4.885302226494385
Golden master productivity growth at 2030                             = 4.885302226494389
```

Match within floating-point precision. **counter=1 at year 2030 is confirmed.**

(Inflation cannot be cross-checked because Uganda uses start=end=3.5%, making all counter values produce 3.5%.)

---

## Key Detail: Counter is Hardcoded, Not Year-Derived

The counter values (1, 2, 3...) are hardcoded integers in the spreadsheet cells, not computed as `year - WEO_MAX_YEAR` or any formula. They are a simple 1-indexed sequence starting in column B. The year-to-counter mapping is achieved by the output row's cell references (`=B9`, `=C9`, ...) which always start at column B for the first post-WEO year.

This means:
- The counter is **intrinsically 1-indexed** — counter=1 is always the first projected year
- It does NOT depend on WEO_MAX_YEAR in any formula
- If the WEO vintage changes, the column references in row 3 would shift (e.g., `=B9` would start at year 2031 instead of 2030), but counter=1 would still be at B

---

## Conclusion

**Both modules use counter=1 at year 2030 (the first post-WEO year).**

The correct Python implementation is:

```python
for year in range(WEO_MAX_YEAR + 1, YEAR_END):
    counter = year - WEO_MAX_YEAR  # counter=1 at first projected year
    growth = start + (end - start) * (1 / (1 + math.exp(-rate * (counter - turning_point)))) ** rate
```

### Previous Oracle Errors

The inflation oracle previously stated counter=2 at year 2030. This was wrong because:
1. It assumed WEO_MAX_YEAR=2028, making 2030 the second post-WEO year (counter=2)
2. The WEO boundary investigation established WEO_MAX_YEAR=2029
3. The Excel formulas confirm: year 2030 maps to sigmoid column B, which uses counter=1

### Update Required

The inflation oracle packet should be updated to state: counter=1 at year 2030 (= WEO_MAX_YEAR + 1). The general formula is `counter = year - WEO_MAX_YEAR`, which gives counter=1 for the first projected year.

The productivity oracle already reflects this correctly after the review synthesis round.
