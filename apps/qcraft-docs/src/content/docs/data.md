---
title: "Distinguish the shipped vintages and their coverage"
description: "Input lineage, missing-data behavior and adding a vintage."
---

**Current mode refreshes macrofiscal and population inputs while retaining the workbook's climate and productivity sources.** It is a named release, not an automatic live-data feed. The vintage manifests provide source URLs, raw-download hashes and emitted counts.

| Input | Verified: `weo-2024-10` | Current: `weo-2026-04` |
| --- | --- | --- |
| Macroeconomic and fiscal series | IMF WEO October 2024, extracted from the workbook | IMF WEO April 2026, via SDMX. Truncated at 2029. |
| Population | UN WPP 2022 embedded in the workbook | UN WPP 2024, mid-year population in thousands |
| Productivity levels | World Bank WDI historical series embedded in the workbook | Carried forward |
| Climate GDP effects | Workbook's 2024 damage estimates | Carried forward |

**The climate source has its own version history.** The shipped workbook uses the 2024 layer by Centorrino, Massetti and Tagklis, building on Kahn and others (2021). The underlying dataset is Massetti and Tagklis (2023). Newer published research is not automatically substituted into the frozen workbook vintage. [Vintage decision](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/docs/data-vintages.md), [source chain](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/content/modes.ts).

## Coverage counts describe different populations

| Population being counted | Verified | Current | Interpretation |
| --- | --- | --- | --- |
| Selectable countries | 175 | 175 | Present in each vintage index. |
| Countries with numerical results in recorded all-country sweep | 166 | 167 | The other 9 or 8 refuse required missing inputs. |
| Selectable countries with zero climate slices | 11 | 11 | Missing climate coverage. Three of these also refuse fiscal projection. |
| Historical baseline Excel comparison passes | 147 | Not applicable | A historical verification subset on the workbook vintage, not the selectable denominator. |

**Read refusals as evidence about input availability.** Libya and Zambia lack usable debt anchors. Macao SAR, Singapore, Samoa and West Bank and Gaza lack required primary expenditure inputs. Puerto Rico and Somalia miss required early inputs. Afghanistan refuses in Verified and projects in Current. The [sweep receipts](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/verification-logs/sweep) compare both numeric results and matching refusal types/messages. These are recorded sweep results, not a claim that a new census ran during every docs build.

**The eleven zero-climate countries are Bahrain, Barbados, Hong Kong SAR, Macao SAR, Maldives, Malta, Singapore, St. Lucia, Timor-Leste, Tonga and West Bank and Gaza.** The User Guide lists 25 economies without climate estimates, on p. 20, footnote 12. Many are absent from the Explorer dropdown, which is why its denominator gives a different count. [Coverage record](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/docs/country-coverage.md).

## The pipeline preserves a vintage and its provenance

**The repository tracks manifests and country indexes, while payloads travel in the input archive.** A fresh clone therefore cannot obtain the required 350 country files through npm. Follow the [data-inclusive setup](reproduce.md).

**Source shapes must be checked before calling the engine.** Row-oriented payloads already implement `CountryInput`. Columnar payloads need `fromColumnarCountryInput`, including an explicit choice about OECD productivity. The browser loader accepts and adapts the shipped shape. [Loader](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/apps/qcraft-web/src/engine/countryData.ts), [adapter](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/adapters.ts).

**Units stay attached to the input series.** Fiscal and GDP levels are local-currency billions. Ratios are percent of GDP. Rates are percent per year. Population is in thousands. Do not compare money levels across countries without handling currencies. Missing numeric cells remain null where the schema permits them. [Input notes](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/DATA-NOTES.md), [types](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/types.ts).

## Introduce a new vintage without overwriting a frozen one

1. Update the pipeline's vintage identifier, upstream release configuration and bounds in [config.py](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/pipeline/src/qcraft_pipeline/config.py).
2. Obtain the four source tables, retaining the carried-forward series where the design requires them. Record source hashes and licenses separately.
3. Run the pipeline's schema, key, unit, range and coverage validation before emitting files. Review differences against settled history.
4. Produce a new manifest and country index, then supply country payloads through a separately checksummed archive.
5. Add the named mode or update its supported vintage deliberately. Run cross-engine and refusal comparisons, then review any claim affected by the new inputs.

**Moving the WEO boundary beyond 2029 needs a model review.** It is not just a configuration bump. The fixed productivity boundary and climate-start convention must be reconciled first. [Pipeline README](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/pipeline/README.md), [boundary decision](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/docs/data-vintages.md).

