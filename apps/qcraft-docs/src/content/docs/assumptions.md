---
title: "Know which assumptions drive the result"
description: "Workbook rules, Explorer choices, data limits and unavailable features."
---

**A projection combines workbook rules, shipped data and analyst choices.** This register explains their consequences and where the current code implements them. The [verification matrix](verification.md) states which cases have numerical comparison evidence. Source links on this page refer to the engine revision printed in the footer. Guide references name [Tim and Rahman (2024), version 1.0](https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf). Page citations use the printed page numbers: [baseline setup, section II.B](https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf#page=9), [climate scenarios, section II.C](https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf#page=19), and [detailed methodology, section IV](https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf#page=24).

## The controls have machine bounds, not calibration recommendations

**Explorer defaults are a starting state, not an IMF calibration recommendation.** The app opens on Uganda in Current mode. The workbook's last-saved dashboard uses a debt target of 60 and inflation start of 3.5. The Explorer uses 50 and 5.0. Those saved workbook values should not be presented as recommended settings for every country.

| Setting | Explorer default | Sidebar bounds or choices | Meaning and consequence |
| --- | --- | --- | --- |
| Country | Uganda | 175 indexed choices per vintage | Chooses the data, including its gaps. |
| Demography | Medium | Medium, High, Low | Changes working-age and total population trajectories. |
| Productivity start | 5.0% per year | -5 to 15, step 0.1 | Starting long-run productivity growth, after the WEO overlap. |
| Productivity long run | 1.2% per year | -5 to 15, step 0.1 | Convergence endpoint. |
| Productivity Turning Point | 15 years | 1 to 70, step 1 | Workbook timing parameter. Larger values move the transition later. |
| Inflation start | 5.0% per year | 0 to 50, step 0.1 | Starting projected GDP-deflator growth. |
| Inflation long run | 3.5% per year | 0 to 50, step 0.1 | Long-run GDP-deflator growth. |
| Interest-rate approach | Nominal interest rate | Nominal, interest-growth differential, real | Selects the rate construction. |
| Long-run real interest rate | 1.0% per year | -5 to 15, step 0.1 | Used and shown only with Real interest rate. |
| Debt target | 50% of GDP | 0 to 200, step 1 | Fiscal-rule ceiling. Zero switches the rule off. |
| Fiscal rule | Yes | Yes, No | Enables the prior-year expenditure adjustment. |
| Expenditure rigidity | 1.0 | 0 to 1, step 0.1 | Climate scenarios only. One keeps spending sticky to the baseline path. Zero permits full adjustment with the climate growth effect. |

**The sidebar bounds are interface constraints.** They do not prove model validity throughout each interval. The run-file parser checks finite numbers and enumerations but does not apply these numeric sidebar bounds. Analysts should justify values against national evidence and the IMF User Guide, sections II.A-C. Sources: [registry](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/content/params.ts), [defaults](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/engine/qcraftAdapter.ts), [sidebar](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/components/Sidebar.tsx), [parser](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/run/runFile.ts).

**Evidence is concentrated at named settings.** The five-country sensitivity matrix uses Medium demography and five parameter sets. Seven later Excel fixtures add real rate 2.5, Turning Point 10, target zero, floor-bound rule cases, interest-growth differential and rigidity zero. High/Low demography and arbitrary combinations have no broad Excel validation claim. Use the [case inventory](verification.md#each-comparison-has-a-bounded-scope) to locate the relevant evidence.

## The Turning Point shifts the transition later or earlier

**The Turning Point is not the halfway year.** The workbook convergence formula is `start + (end - start) × sigmoid^rate`, where `sigmoid = 1 / (1 + exp(-rate × (counter - Turning Point)))`. At a rate of 0.5, setting the counter equal to the Turning Point gives a convergence fraction of about 70.71%. With endpoints 5.0 and 1.2, the rate is about 2.313%, rather than their 3.1% midpoint.

| Assumption | Category and consequence | Remedy and evidence |
| --- | --- | --- |
| Logistic rate fixed at 0.5 | Workbook rule. The interface changes endpoints and productivity timing, not the curve exponent. | Compare the actual curve when calibrating. [Formula](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/internal.ts), User Guide p. 12, footnote 7. Turning Point 10 fixture checks the implementation. |
| Inflation timing fixed at 5 | Workbook rule exposed as a fixed software choice. Inflation has its own convergence timing. | No interface control changes it. [Inflation source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/inflation.ts). Default-path evidence applies, not arbitrary timing. |
| Productivity uses a 2029 boundary in the composed pipeline | Explorer implementation. Fiscal and inflation modules can use earlier country-specific boundaries, so the module boundaries need not coincide. | Inspect each module for early-anchor countries. [Productivity call](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/pipeline.ts), [productivity module](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts). No comprehensive early-anchor Excel parity claim. |
| Historical averages are not a one-click selection | Unsupported interface feature. The workbook's Table A/B calibration route is unavailable. | Review historical evidence and enter a justified numeric start. User Guide section II.B, p. 12. [Parameter registry](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/content/params.ts). No numerical test establishes calibration suitability. |
| OECD-relative productivity levels are not displayed | Unsupported interface feature and data limitation. Module levels after the historical window can compound placeholder growth, while baseline GDP replaces WEO-overlap growth. | Do not cite the post-2021 level/OECD series as a verified realism check. Use the workbook check in section II.B. [Productivity](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts), [baseline GDP](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/baselineV1.ts). No post-2021 OECD-level validation claim. |

## The fiscal rule uses prior-year state

**The rule changes primary expenditure when debt is above the target and rising, or below it and falling.** It uses the previous year's direction and fiscal gap. At target zero, flat debt, and other non-triggering boundaries, adjustment is zero. The target is a ceiling, with no promise of exact convergence. User Guide pp. 29-30, section IV.A. [Fiscal implementation](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/fiscal.ts).

| Assumption | Category and user consequence | Remedy and tested scope |
| --- | --- | --- |
| Same-year debt in the effective-rate anchor | Workbook rule. Historical interest expenditure divided by same-year debt is retained for parity. | Do not replace it with lagged debt when reproducing the workbook. [Input derivation](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/pipeline/src/qcraft_pipeline/weo.py). Baseline comparison covers selected derived rates. |
| Prior-year lags in rates and fiscal feedback | Workbook rule. A changed input may affect a later year's fiscal outcome. | Trace t and t-1 explicitly. [Rate source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/interestRate.ts), [fiscal source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/fiscal.ts). Default and named edge cases are tested. |
| Multiplicative expenditure growth | Workbook rule. Growth factors multiply. Fiscal adjustment is applied in levels. | Preserve units and operation order. [Fiscal source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/fiscal.ts). Intermediate golden masters guard against compensating errors. |
| Baseline debt floors at zero, scenario debt does not | Workbook rule. Some climate lines can fall below a floored baseline. | Inspect floor-bound cases before interpreting their ordering. Baseline!CL36 and Paris!CL35, [climate source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/climate.ts). Mozambique and UAE edge fixtures cover named cases. |
| Scenarios inherit baseline fiscal adjustment | Workbook rule. The fiscal rule is not solved independently for each climate path. | Compare scenarios as conditional results under that adjustment. [Climate source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/climate.ts). The named scenario fixtures test this structure, not every policy response. |

## Climate effects use a trend-warming counterfactual

**The climate dataset measures effects relative to temperatures continuing their 1960-2014 trend.** Paris can therefore produce a gain relative to the baseline. The comparison is not with a world without warming. User Guide sections I and IV.B. [Source explanation](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/content/modes.ts).

| Assumption | Category and consequence | Remedy and tested scope |
| --- | --- | --- |
| Cumulative loss becomes annual productivity growth | Workbook rule. The engine computes the percentage change in `100 + cumulative GDP effect`, rather than subtracting cumulative-loss levels. | Preserve the compounding formula. [Variation builder](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/pipeline.ts). Historical ratio evidence and named edge fixtures apply. |
| Climate effects normally begin in 2030 | Workbook rule with country-data exceptions. Current WEO ends at 2029 by truncation, but a shorter fiscal window may bring the scenario start forward. | Read the country's boundary notice. [Variation builder](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/pipeline.ts), User Guide section II.C. Early-anchor cases do not inherit the broad Excel claim. |
| First nonzero variation determines the climate boundary | Implementation detail. A zero initial shock can defer the boundary inferred by the climate module. | Inspect the actual series, especially for early anchors or zero-climate countries. [Climate source](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/climate.ts). This edge remains outside a comprehensive Excel comparison. |
| Adaptation windows are 20, 30 or 50 years | Dataset assumption. Hot variants change adaptation speed, without estimating adaptation expenditure. | Use separate project costing. [Scenario registry](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/content/scenarios.ts), User Guide section IV.B. Tests compare scenario output, not adaptation costs. |
| Missing climate estimates appear as zeros | Data limitation. Coincident scenarios may mean unavailable estimates. | Read the no-climate notice and avoid interpreting coincidence as absence of risk. [Coverage](data.md#coverage-counts-describe-different-populations), User Guide p. 20, footnote 12. No positive climate-risk claim follows from a zero slice. |
| Discrete Risks are not exposed | Unsupported feature. The workbook accepts per-scenario revenue and spending risks, but this interface does not. | Use the official workbook for that workflow. User Guide pp. 20-21, section II.C. The low-level climate function accepts risk rows, but the public pipeline does not wire them. [Pipeline](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/pipeline.ts). No arbitrary risk-profile parity claim. |

## Data gaps can change the projection boundary or prevent a result

**The engine does not have a single missing-data substitution rule.** Input builders drop some incomplete rows, forward-fill some rate values and reject required gaps. Preserve nulls when preparing custom data. A missing cell is not an observed zero. [Input shaping](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/pipeline.ts), [error classes](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/errors.ts).

| Assumption | Category and consequence | Remedy and tested scope |
| --- | --- | --- |
| April 2026 WEO truncated at 2029 | Explorer choice preserving the method's 2030 boundary. Published WEO forecasts for 2030-31 are unused. | Record the truncation, not just the release date. [Vintage decision](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/docs/data-vintages.md). Current results are not Excel-vintage matches. |
| Earlier usable fiscal anchor | Explorer choice. Some countries project from their last usable year although the release extends further. The workbook may return an error there. | Carry the anchor notice into interpretation and exports. [Adapter](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/engine/qcraftAdapter.ts). Cross-engine agreement is separate from Excel agreement. |
| Required debt or fiscal inputs missing | Data limitation. The app refuses a projection. | Inspect the context data or try the other mode. [Refusal evidence](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/docs/country-coverage.md). Both engines' refusal types/messages were compared. |
| Missing OECD series in columnar input | Adapter policy. Explicitly allowing its absence substitutes an OECD level of 1.0 for the relative-level column. | Supply the series or do not use that column. [Adapter options](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/adapters.ts). This does not validate OECD-relative levels. |
| Own data cannot be pasted into the Explorer | Unsupported interface feature. Analysts cannot replace WEO, population or productivity series in the browser. | Use the workbook's blue cells and adjustment instructions, User Guide pp. 9-10 and section II.B. Developer input types are not a supported analyst upload workflow. |

## Exports need their engine and inputs

**A saved run JSON restores settings and the named data mode, rather than carrying the whole model.** It records app version, country, vintage, parameters, defaults, notes and chart choices. It does not embed the input payload or an immutable engine commit. Unknown vintages and older files can produce warnings and fallback behavior. Save the source and input archive with any result that must be reproduced. [Manifest](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/run/manifest.ts), [parser](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/run/runFile.ts).

**The exported Excel file is a results workbook.** It is not the official IMF calculation workbook and does not offer its editable formula workflow. Run JSON is the restore route. Export and restore tests check the supported schema, not identical results under a changed engine or changed data.

