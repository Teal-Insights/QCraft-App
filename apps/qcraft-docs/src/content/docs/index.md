---
title: "Review the model behind your fiscal projection"
description: "Start with the Explorer, then inspect its assumptions, evidence and code."
---

**Q-CRAFT Explorer lets you change long-run assumptions and compare their fiscal consequences in your browser.** It reimplements the IMF Quantitative Climate Risk Assessment Fiscal Tool, with a baseline and six climate scenarios through 2099. Teal Insights and NatureFinance built this independent tool. The IMF workbook and User Guide remain the authoritative methodology.

[Open the Explorer](https://teal-insights.github.io/QCraft-App/explorer/) · [Read the companion guide](https://teal-insights.github.io/QCraft-App/) · [Review the evidence](reviewers.md)

## Choose the data mode before comparing numbers

| Mode | Inputs | Appropriate comparison |
| --- | --- | --- |
| **Current** (opens by default) | WEO April 2026 and UN WPP 2024. Climate estimates and historical productivity carried forward from the workbook. | Apply the method to the shipped newer inputs. Results differ from the published workbook. |
| **Verified** | WEO October 2024 and UN WPP 2022, as embedded in the workbook. | Inspect the documented Excel comparison with its tested settings and exclusions. |

**The mode changes the inputs while retaining the engine.** Both vintage indexes list 175 countries. Data gaps prevent a projection for some countries, and missing climate estimates can make all scenarios coincide. Read the [coverage denominators](data.md#coverage-counts-describe-different-populations) before citing a country count.

## Change assumptions and keep their rationale

**Twelve settings are registered, including country selection.** Eleven are visible at the default interest-rate approach. Choosing Real interest rate exposes the long-run real rate. Controls cover country, demography, productivity start and end, the productivity Turning Point, inflation start and end, interest-rate approach and real rate, debt target, fiscal rule and expenditure rigidity. The [control register](assumptions.md#the-controls-display-ranges-not-calibration-recommendations) records defaults, units and displayed ranges.

**Outputs include the baseline, scenario comparisons and their inputs.** The Explorer offers charts and tables, CSV results, a results workbook, an HTML report, chart assets and a saved run JSON. Save the assumptions and rationale beside any exported figure. The [run-file limits](assumptions.md#exports-need-their-engine-and-inputs) explain what a saved run can restore.

## Compare six scenarios with explicit definitions

| Scenario | What changes |
| --- | --- |
| Paris | SSP1-2.6, with the User Guide's Paris commitments framing. |
| Moderate | SSP2-4.5, with present trends continuing. |
| High | SSP3-7.0, median temperature path across the climate models. |
| Hot | SSP3-7.0, 90th-percentile temperature path across the same models. |
| Hot adapted | Hot temperatures, adaptation over 20 years instead of 30. |
| Hot unadapted | Hot temperatures, adaptation over 50 years instead of 30. |

**Adaptation changes the speed of adjustment, with no spending estimate attached.** These scenarios do not measure the cost of a resilience project. The reference temperature path continues the 1960-2014 warming trend. See [climate assumptions](assumptions.md#climate-effects-use-a-trend-warming-counterfactual), [scenario definitions in source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/content/scenarios.ts) and the IMF User Guide, sections II.C and IV.B.

## Find the answer you need

- [For reviewers](reviewers.md): five questions about calculation, assumptions, verification, reproduction and code.
- [Assumptions](assumptions.md): workbook rules, software choices, missing data and unavailable features.
- [Run and reproduce](reproduce.md): exact source, locked dependencies and required country payloads.
- [Architecture](architecture.md): how a published series becomes a browser result.

**This documentation describes a release candidate.** Its engine revision appears below each page. Final publication and the complete release artifact remain subject to release review. No IMF endorsement is implied.

