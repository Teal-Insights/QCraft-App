# Country coverage

What the Explorer can and cannot project, for every selectable country, on both
data vintages, across the baseline and all six climate scenarios.

**CC-6, 2026-08-27, TEA-1403.** Produced by the completeness sweep described in
section 6, run on the merged integration branch. Rerun commands are in section 7.

---

## 1. Bottom line

175 countries are selectable in each vintage. After this lane:

| | Verified (WEO Oct 2024) | Current (WEO Apr 2026) |
| --- | --- | --- |
| Project cleanly | 166 | 167 |
| Refuse, with a notice | 9 | 8 |
| Crash, or draw a path from a number that does not exist | **0** | **0** |

Before this lane, 24 countries failed on the frozen vintage and 20 on the
current one, and two of them, Zambia and Libya, were drawn anyway in the browser
from a debt anchor that does not exist. Fifteen countries were rescued on the
frozen vintage and twelve on the current, none of them by relaxing a rule: every
one was failing on data the projection never reads, or on a difference between
the two pipelines rather than a gap in the source.

Both engines now agree on every country in both vintages, including the ones
they refuse. The differential compares 2.55 million and 2.56 million numeric
cells at a worst deviation of 4.441e-16 against a 1e-12 tolerance, and compares
the nine and eight refusals as refusals: same error type, same message.

---

## 2. What the workbook does with the same inputs

Fidelity first, and the workbook settles it: **there is no fallback rule to
mirror.** The IMF Q-CRAFT workbook refuses too, it just refuses in Excel's
vocabulary.

The chain is short and unguarded. `Macrofiscal` row 19, the debt-to-GDP ratio,
is `=D10/D4*100`, a bare division of the WEO debt level by nominal GDP.
`Baseline` row 35 pulls that row through for the WEO years, and `Baseline` row 36
anchors the whole 2030-2099 recursion on its last WEO column:

```
Baseline!Y36 = IF((X36*(1+Y33/100)/(1+Y15/100)-Y22)<0,0,((X36*(1+Y33/100)/(1+Y15/100)-Y22)))
```

where `X36` is 2029. No `IFERROR` guards either formula, and `IF` does not catch
an error in its own condition.

The WEO writes a missing figure as the literal text `n/a`, and Excel arithmetic
on text yields `#VALUE!`. So a country with no debt figure at its last WEO year
produces `#VALUE!` in every dependent cell, and the chart draws nothing.

This is not inference. The posted workbook ships with **Afghanistan** selected,
and Afghanistan has exactly the defect Zambia has, a debt row that reads `n/a`
from 2021 on. Its cached values are in the file as distributed:

| Sheet and row | 2023 | 2029 | 2030 | 2050 | 2099 |
| --- | --- | --- | --- | --- | --- |
| `Macrofiscal` r10, Debt | `n/a` | `n/a` | | | |
| `Macrofiscal` r19, Debt-to-GDP | `#VALUE!` | `#VALUE!` | | | |
| `Baseline` r36, Gross debt (%GDP) | `#VALUE!` | `#VALUE!` | `#VALUE!` | `#VALUE!` | `#VALUE!` |
| `Baseline` r37, DSPB | `#VALUE!` | `#VALUE!` | `#VALUE!` | `#VALUE!` | `#VALUE!` |
| `Baseline` r40, Fiscal gap | | `#VALUE!` | `#VALUE!` | `#VALUE!` | `#VALUE!` |

Source: `source-materials/2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx`, read with
`openpyxl(data_only=True)`, which returns the values Excel last calculated and
saved.

The User Guide confirms the same by omission. It documents a substitute where it
has one and an exclusion list where it does not: footnote 8 on page 14 names the
economies with no productivity data and suggests "Productivity levels of similar
economies might be a useful substitute", explicitly a matter of user judgment;
footnote 12 on page 20 lists the economies with no climate estimates. There is no
footnote for debt, no list of economies whose debt is unavailable, and no rule
for substituting one. The workbook simply stops.

**So the Explorer stops too.** Refusing is the faithful behaviour; inventing an
anchor would not be. No gate was needed, because no rule had to be invented.

---

## 3. Why Zambia and Libya specifically

Two different absences that produced one error message.

**Zambia** has a full debt history and no debt projection. The WEO publishes its
debt through 2023 in the October 2024 vintage and through 2025 in April 2026,
then stops, while running its other series out to 2029 in both. The pattern is
the signature of an unresolved debt restructuring: as years become history they
are published, and the forward path is withheld. The projection anchors on 2029,
which is exactly where the figure is missing.

Zambia's last published debt ratio is 127.3 per cent of GDP in 2023 (frozen) and
86.0 per cent in 2025 (current). Before this lane the browser drew it as **0.000
per cent from 2029 onward**, recovering to 0.583 per cent by 2099. A country in
restructuring shown with no debt at all.

**Libya** has no debt series in any year, in either vintage. The workbook's raw
debt row for Libya is empty text in all 29 columns. There is nothing to anchor
on and nothing to carry forward. Before this lane the browser drew Libya
climbing from zero to **56.3 per cent of GDP by 2099**, a complete debt build-up
constructed out of an absent series. That one is the more dangerous of the two,
because it looks entirely ordinary.

Both now refuse, in both engines, with the same message.

---

## 4. Every country that does not project

Nine on the frozen vintage, eight on the current. Each is refused before
anything is drawn, and each produces a notice naming the country and the reason.

| Country | Verified (Oct 2024) | Current (Apr 2026) | Why |
| --- | --- | --- | --- |
| Afghanistan (AFG) | refuses | projects | No debt figure at its anchor year, 2023, on the frozen vintage. The April 2026 release ends its series at 2025 with real figures, so it anchors there and runs. |
| Libya (LBY) | refuses | refuses | No debt series in any year, either vintage. |
| Zambia (ZMB) | refuses | refuses | Debt published through 2023 and 2025 respectively, nothing at the 2029 anchor. |
| Macao SAR (MAC) | refuses | refuses | No primary expenditure from 2023, so no primary balance to project from. |
| Singapore (SGP) | refuses | refuses | No primary expenditure in any year the projection reads. |
| Samoa (WSM) | refuses | refuses | No primary expenditure in any year the projection reads. |
| West Bank and Gaza (PSE) | refuses | refuses | No primary expenditure in any year the projection reads. |
| Puerto Rico (PRI) | refuses | refuses | No interest rate for 2009, the first projection year. |
| Somalia (SOM) | refuses | refuses | WEO record starts in 2011; no macrofiscal row for 2009. |

The exact messages, identical on both engines:

```
AFG  No debt anchor for AFG: debt_to_gdp is missing for 2023, the last WEO year, ...
LBY  No debt anchor for LBY: debt_to_gdp is missing for 2029, the last WEO year, ...
ZMB  No debt anchor for ZMB: debt_to_gdp is missing for 2029, the last WEO year, ...
MAC  Missing macrofiscal input for MAC: primary_expenditure is null for 2023
PSE  Missing macrofiscal input for PSE: primary_expenditure is null for 2009
SGP  Missing macrofiscal input for SGP: primary_expenditure is null for 2009
WSM  Missing macrofiscal input for WSM: primary_expenditure is null for 2009
PRI  Missing interest_rate_percent for year 2009
SOM  Missing macrofiscal for year 2009
```

Three failure types, all subclasses of `QCraftDataError`, all catchable:
`MissingDebtAnchorError` when the projection has no starting debt stock,
`MissingMacrofiscalInputError` when a series the engine reads has a hole inside
the WEO window, `MissingYearError` when a year has no row at all.

### Countries this lane rescued

Fifteen on the frozen vintage, twelve on the current, none by relaxing a rule.

Armenia, Burkina Faso, Bangladesh, Belarus, Djibouti, Hong Kong SAR, Kazakhstan,
Mongolia, Mauritania, Togo and Timor-Leste were failing on rows dated 2001-2008.
The projection reads 2009 onward and the workbook's own `Baseline` sheet starts
its year axis at 2009, so those rows never reach a result. The engine was
converting them anyway and dying on the nulls.

Lebanon, Sri Lanka and Syria were failing because the two pipelines fed the
inflation module different rows: the TypeScript builder drops rows with no
deflator and the Python one did not. All three always computed in the browser.
Afghanistan on the current vintage joins them.

Serbia was failing because the frozen vintage's Parquet carried Kosovo's
population and climate series beside Serbia's under one country code. Section 5.

---

## 5. Countries with no climate estimates

Eleven of the 175 selectable countries carry an all-zero climate slice, so all
six scenarios land exactly on the baseline. The dataset does not cover them; the
zero is missing data, not an absence of risk. They are the same eleven in both
vintages, because the climate table is carried forward unchanged.

**Bahrain, Barbados, Hong Kong SAR, Macao SAR, Maldives, Malta, Singapore,
St. Lucia, Timor-Leste, Tonga, West Bank and Gaza.**

### Reconciling the count

The sprint notes carried both 26 and 11 for this list. The authoritative source
resolves it. The Q-CRAFT User Guide v10, footnote 12 on page 20, names **25**
economies with no climate estimates. Fourteen of those 25 are not selectable in
the Explorer at all, because the country list is the intersection of all four
data sources and they have no productivity data, which is the same set the User
Guide's footnote 8 names. Kosovo, the fifteenth, is absent from all four sources
in the frozen vintage.

25 in the workbook, minus 14 that never reach the dropdown, leaves exactly the
**11** above. The two numbers were never in conflict; they count different
things. Neither is 26.

| Excluded from the dropdown (no productivity data) |
| --- |
| Andorra, Antigua and Barbuda, Aruba, Dominica, Kiribati, Marshall Islands, Micronesia, Nauru, Palau, Seychelles, St Kitts and Nevis, Taiwan Province of China, Tuvalu, and Kosovo (absent from every source) |

Three of the eleven, Macao SAR, Singapore and West Bank and Gaza, are refused
outright for missing primary expenditure, so the zero-climate notice only ever
reaches a user for the other eight.

---

## 6. What the sweep does

`scripts/sweep/sweep_all.sh` runs every selectable country through both engines
on both vintages and compares the outcomes. One `run_pipeline` call per country
covers the baseline and all six climate scenarios, because the pipeline returns
one frame per scenario.

The comparison treats a refusal as a result. That is the part that was missing:
the harness used to compare the countries that worked and skip the ones that did
not, so Zambia and Libya diverged for the whole sprint while every run reported
PASS. Three ways to disagree now fail the run: one engine answers where the other
refuses, they refuse with different types, or they refuse with different
messages. Messages are compared in full, which is what makes the wording in the
two error modules a contract.

ZMB, LBY and SRB are permanent members of the harness country set
(`scripts/differential/countries.json`), read by both runners so the two halves
cannot drift.

Latest run, on the merged state:

| | Verified | Current |
| --- | --- | --- |
| Countries compared numerically | 166 | 167 |
| Numeric cells | 2,549,457 | 2,564,822 |
| Worst absolute deviation | 4.441e-16 | 4.441e-16 |
| Worst relative deviation | 1.176e-16 | 1.176e-16 |
| Tolerance | 1e-12 | 1e-12 |
| Refusals compared | 9 of 9 match | 8 of 8 match |
| Result | PASS | PASS |

---

## 7. Rerunning any of this

Kill stale preview servers first and check `git branch --show-current`; a server
left listening from another worktree serves another branch's bundle and every
browser assertion is then made against the wrong code. That happened during this
lane.

```bash
# The full cross-engine sweep, both vintages, every selectable country.
bash scripts/sweep/sweep_all.sh verification-logs/sweep

# The differential on the pinned country set, which includes ZMB, LBY and SRB.
uv run --package qcraft-engine python scripts/differential/run_python.py \
  --data-dir data/vintages/weo-2024-10 --out /tmp/diff-py
npx vite-node scripts/differential/run_ts.ts -- \
  --in data/vintages/weo-2024-10/json --out /tmp/diff-ts
uv run python scripts/differential/compare.py \
  --python-dir /tmp/diff-py --ts-dir /tmp/diff-ts --label "frozen vintage"

# The data-condition census, classified from the inputs rather than the errors.
uv run --package qcraft-engine python scripts/sweep/sweep_python.py \
  --out verification-logs/sweep-prefix

# Regression tests pinned for ZMB, LBY and SRB on both vintages.
uv run pytest packages/qcraft-engine/tests/test_failure_semantics.py
cd packages/qcraft-engine-ts && npm test -- failure-semantics
cd apps/qcraft-web && npm test -- verifiedMode

# Repairing a vintage built before the pipeline learned to deduplicate.
uv run qcraft-pipeline repair weo-2026-04
uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2026-04 --force
```

---

## 8. Held for Teal

**8.1 The effective anchor is not the workbook's anchor.**
`.change-requests/FISCAL-ANCHOR-2026-08-27.md` has the detail. The engine drops
rows with no nominal GDP or revenue before deciding which year the projection
starts from, so Ecuador anchors on 2025 and projects where the workbook would
show `#VALUE!`. Six countries reach an answer this way. The engine is not
inventing a number, it is using the last debt figure the WEO published, but it is
a methodology choice the workbook did not make and nothing on screen says so.
The recommendation is to keep computing and add a line naming the anchor year.
This predates the lane and is not a regression.

**8.2 One line of notice copy was corrected as factually wrong.** The refusal
notice ended "Every other country in the list is unaffected", which is false at
eight and nine countries. It now reads "A small number of countries are affected;
most of the list projects normally." This corrects a false claim rather than
restyling approved wording, so it is flagged rather than assumed.

**8.3 Serbia's climate scenarios were wrong in the shipping app until this
lane.** Not a decision, a disclosure. The frozen vintage's payload carried 1,020
climate rows for Serbia, Kosovo's all-zero series concatenated with Serbia's
real one, and the browser engine read the doubled series. Serbia's scenario
output was wrong by 2.3 percentage points of productivity growth and 7 points of
debt-to-GDP by 2082. It was found by pointing the differential at Serbia for the
first time. Anyone who ran a Serbia scenario before this lane saw wrong numbers.
