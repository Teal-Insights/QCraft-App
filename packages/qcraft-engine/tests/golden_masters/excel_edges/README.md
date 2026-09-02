# Excel golden masters for the parameter edges

Written by `scripts/verify/excel_edges.py` from Microsoft Excel 16.112 running a copy
of the IMF Q-CRAFT workbook v1.0 (Dashboard B10: `Version 1.0_11-15-2024`), on
2026-09-02, for the parameter paths the 2026-09-02 audit (A, findings F1, F3, F5, F7)
found had no Excel comparison. Read by `tests/test_excel_edges.py` (Python engine) and
`packages/qcraft-engine-ts/tests/excel-edges.test.ts` (TypeScript engine).

Shape: one row per scenario and year, `scenario` in {Baseline, Paris, Moderate, Hot,
Hot_Adapted, Hot_Unadapted, High}, years 2030 to 2099, the metrics being the workbook's
own rows (Baseline sheet rows 7, 8, 12, 13, 15, 18, 20, 21, 22, 23, 33, 36; scenario
sheets rows 9, 11, 13, 14, 17, 19, 20, 21, 22, 32, 35). Blank means the sheet has no
such row (the scenario sheets carry no productivity row; `nominal_interest_rate` on a
scenario sheet is the baseline rate).

Every case starts from the workbook's shipped Dashboard values (demography Medium,
productivity 5.0 to 1.2, inflation 3.5 to 3.5, nominal interest rate, real rate 1.0,
rule Yes, target 60, rigidity 1, `Productivity!J21` = 15) and changes only the cells
named.

| File | Country (Dashboard!C12) | Cells set | Why |
|---|---|---|---|
| `real_rate_2p5.csv` | Uganda | C28 = `Real interest rate (a)`, C29 = 2.5 | the long-run real rate was frozen at 1.0 in the Explorer (F1) |
| `turning_point_10.csv` | Uganda | `Productivity!J21` = 10 | the Turning Point was hardcoded at 15 (F5) |
| `target_0_rule_yes.csv` | Uganda | C33 = Yes, C34 = 0 | `Baseline!CL47/CL48` disable the rule when the target is 0 (F3a) |
| `floor_bound_rule_yes.csv` | Mozambique | C33 = Yes, C34 = 5 | baseline debt sits on the zero floor from 2038, so `Baseline!CL46` reads flat and the rule gives 0 (F3b) |
| `floor_bound_rule_no.csv` | United Arab Emirates | C33 = No, C34 = 0 | the guide's starting posture; baseline debt floors at zero from 2035 |
| `igd_mode.csv` | Uganda | C28 = `Interest-growth differential` | audit A untested list, item 1 |
| `rigidity_0.csv` | Uganda | C38 = 0 | audit A untested list, item 6 |

Two things the driver had to know about the workbook:

- The Dashboard's dropdown text for the real-rate option is `Real interest rate (a)`
  (the `(a)` points at the footnote cell B29). `Interest Rate!A14 = Dashboard!C28` is
  compared against `Interest Rate!A17:A19` by exact text, so writing the engine's enum
  string `Real interest rate` matches nothing and blanks the whole rate row.
- The IMF file opens without a link-update dialog only when Excel is given the file
  through LaunchServices (`open -a`); the driver copies the workbook to
  `~/tmp/qcraft-audit/edges/` and attaches to the open book by name.

Regenerate with `uv run --with xlwings python scripts/verify/excel_edges.py --force`.
