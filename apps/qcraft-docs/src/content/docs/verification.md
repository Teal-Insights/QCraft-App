---
title: "Read verification as a set of bounded comparisons"
description: "Recorded evidence, tolerances, exclusions and what verification does not establish."
---

**The recorded comparisons support selected workbook paths and TypeScript/Python agreement.** They do not certify every country, parameter combination or output cell. Teal Insights performed this verification. The IMF has not endorsed or independently certified the Explorer.

The accepted Verified-mode badge is reproduced verbatim:

> Teal Insights verified baseline parity for 147 of 147 tested countries; climate-scenario parity confirmed for ratio metrics only. Reproduces the IMF Excel workbook.

**The badge applies to the documented vintage and evidence scope below.** It does not extend to Current data, missing climate estimates, all possible settings or every level metric. A reported `0.0` rounded to six decimal places does not prove a `1e-12` bound. [Badge source](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/apps/qcraft-web/src/content/modes.ts).

## Each comparison has a bounded scope

| Evidence | Input and cases | Metrics, years and tolerance | Result and limit |
| --- | --- | --- | --- |
| Broad baseline, March 2026 | Workbook v1.0 / October 2024. 198 country records in the stored checkpoint, including 147 parity passes. | 2030-2099. Debt, revenue, primary expenditure and primary balance ratios, nominal rate, real growth and nominal GDP. Driver reviews ratio errors above 0.1 pp, fails above 0.5 pp, and flags level errors above 0.1% relative. | Stored worst differences round to 0.0. Missing or invalid Excel/Python values and missing tables/years are skipped. Skipped-cell count was not logged. [Driver](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/scripts/verify/phase2_breadth.py), [checkpoint](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/verification-logs/phase2_checkpoint.json). |
| Baseline sensitivity, 18 March 2026 | Uganda, Kenya, Maldives, Brazil and Japan × five named settings. Medium demography, productivity 5.0 to 1.2 and inflation 3.5 to 3.5. | 2030-2099. Same seven output metrics. Ratio pass boundary 0.1 pp. Stored levels use the driver's relative checks. | 25 baseline runs recorded as passing. No evidence for all combinations. Missing-value skips are not counted. [Case list](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/verification-logs/SENSITIVITY_COMBINATIONS.md), [checkpoint](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/verification-logs/phase3_checkpoint.json). |
| Six climate scenarios, March 2026 | Same five countries at workbook dashboard settings, 30 runs. | 2030-2099. Scenario ratios and nominal GDP. The historical checkpoint and current driver's level handling do not describe identical test behavior. | Ratio evidence underlies the badge. The stored table has 23 failures and 7 passes overall, with nominal GDP as the worst metric in most cases. Do not copy the narrative's inaccurate claim that every case failed. Maldives has no climate estimates. [Checkpoint](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/verification-logs/phase3_checkpoint.json), [current driver](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/scripts/verify/phase3_sensitivity.py). |
| Seven Excel edge fixtures, 2 September 2026 | Uganda real rate 2.5, Turning Point 10, target zero, IGD and rigidity zero. Mozambique floor/rule Yes. UAE floor/rule No. | Baseline and all six scenarios, 2030-2099. Ratios/rates at 1e-6 pp absolute. GDP levels at 1e-9 relative. Absent metric columns and blank cells are skipped. | Fixtures extracted with Microsoft Excel 16.112, then compared in both engines. The reported suites pass their named fixtures. [Fixture recipe](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine/tests/golden_masters/excel_edges/README.md), [Python comparison](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine/tests/test_excel_edges.py), [TS comparison](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/tests/excel-edges.test.ts). |
| All-country TS/Python sweep, August 2026 record | Both shipped vintages, defaults. 166/167 numeric countries, plus 9/8 matching refusals. | 2009-2099, intermediate and output tables. 2,549,457 / 2,564,822 numeric cells. Tolerance 1e-12 in the comparison. | Recorded worst absolute difference 4.441e-16, relative 1.176e-16. This tests the two implementations against one another, not a new Excel recalculation. [Receipts](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/verification-logs/sweep), [comparator](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/scripts/differential/compare.py). |

**The historical checkpoint lists 198 country records: 147 parity passes, 23 engine-data gaps, 15 timeouts and 13 Python errors.** The 147 passing comparisons are a subset of that inventory and differ from today's 175 selectable countries. These terminal outcomes do not supply the unlogged skipped-cell count.

**Source links identify where the evidence was inspected, not necessarily the commit that generated a historical log.** The older checkpoints do not consistently record the engine commit or skipped-cell inventory. Their generation identity remains a reproducibility limitation. The September fixture recipe names workbook version, date, Excel version and altered cells. Release tests must record their own final commit separately.

## A fixture test and an Excel rerun answer different questions

**Fixture tests compare today's code with saved expected values.** They are suitable for ordinary development and do not launch Microsoft Excel. The Excel-edge fixtures carry intermediate results as well as final debt, which can expose compensating mistakes.

**Fresh Excel extraction runs the workbook itself.** It requires Microsoft Excel, the exact workbook, the automation prerequisites and a controlled workbook copy. Its script may change cells and save files. The historical extraction is documented separately from the ordinary test command. This docs build did not perform an Excel recomputation.

## The remaining gaps stay visible

- High and Low demography have no broad, fresh Excel comparison in this packet.
- Arbitrary combinations throughout the accepted input bounds remain untested against Excel.
- Discrete Risks are not exposed by the Explorer pipeline, and arbitrary risk profiles are not validated here.
- Post-2021 OECD-relative productivity levels should not be cited as a verified output.
- Earlier fiscal anchors and the first-zero climate boundary need case-specific review before claiming workbook equivalence.
- Cross-engine agreement can preserve a shared conceptual mistake. It supplements workbook evidence.
- These tests do not establish causal effects, forecast accuracy, adaptation costs or suitable national calibration.

**Report a discrepancy with its input and workbook identity.** Use the [contribution template](contributing.md#report-a-numerical-discrepancy) and preserve the [reproduction inputs](reproduce.md).

