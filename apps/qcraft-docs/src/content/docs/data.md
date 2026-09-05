---
title: "Distinguish the shipped vintages and their coverage"
description: "Input revisions, selected-country horizons and coverage outcomes."
---

**Current uses the complete usable WEO window for the selected country.** The source vintage is April 2026, while `weo-2026-04-full-horizon-v1` identifies this input revision and `current-full-weo-v1` identifies its calculation policy. This is a named release, not an automatic live-data feed. Verified retains its frozen inputs and calculation profile.

| Input or policy | Verified: `weo-2024-10` | Current: `weo-2026-04-full-horizon-v1` |
| --- | --- | --- |
| Macroeconomic and fiscal series | October 2024 WEO extracted from the workbook | April 2026 WEO estimates/projections, retaining available source rows through 2031 |
| Population | UN WPP 2022 embedded in the workbook | UN WPP 2024, mid-year population in thousands |
| Productivity history | Workbook's historical WDI series | Carried forward; the bridge uses its actual usable endpoint |
| Climate GDP effects | Workbook's 2024 damage estimates | Same calendar-year source series, carried forward |
| Projection timing | Frozen workbook profile | Long-run assumptions and additional climate effects begin after the usable country WEO window |

**April 2026 alone no longer identifies a calculation.** The earlier `weo-2026-04` payload set remains preserved with its 2029 truncation. The refreshed revision is separate. Saved settings from the older Current run may be restored on new inputs with a warning, but that does not reproduce its old results. Keep the [exact source and input archive](reproduce.md) with a published result.

**The climate source has its own version history.** The workbook uses the 2024 layer by Centorrino, Massetti and Tagklis, building on Kahn and others (2021); the underlying dataset is Massetti and Tagklis (2023). This refresh does not substitute newer climate research. [Current data policy](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/docs/current-data-policy.md), [mode definitions](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/apps/qcraft-web/src/content/modes.ts).

## The usable horizon belongs to the selected country

**The source's last year and the engine's usable last year are different fields.** The engine checks contiguous required macrofiscal inputs, usable WDI history and the calendar-year climate indexes. A complete window has `coverageStatus: full`; a shorter usable window carries its reason; unsupported inputs produce a refusal. Available source rows remain in the payload even if they cannot support a calculation. [Horizon resolver](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/horizon.ts).

For Uganda, WEO inputs run through **2031**. Long-run assumptions and additional climate comparisons start in **2032**, anchored to the actual **2031** climate index. The source climate calendar is unchanged and no delayed catch-up shock is inserted. The WDI history ends in 2022, followed by the WEO residual bridge through 2031. See the [timing and assumptions](assumptions.md#current-starts-after-the-usable-weo-window).

The raw WEO cache does not establish a common observations/forecast boundary: its relevant per-series status fields are blank. Label these values as source estimates/projections rather than inventing a single final observation year.

## Coverage counts describe different populations

| Population being counted | Verified historical record | Refreshed Current record |
| --- | --- | --- |
| Indexed countries | 175 | 175 retained |
| Countries computed in the named cross-engine sweep | 166 | 167: 160 full horizons and 7 shorter horizons |
| Required-input refusals | 9 | 8 |
| Historical baseline Excel comparison passes | 147 | Not applicable to this new calculation policy |

**The Current total is unchanged but its membership is different.** Shorter horizons are Afghanistan (2025), Bolivia (2026), Ecuador (2025), Lebanon (2025), Macao SAR (2022), Sri Lanka (2024) and Zambia (2025). Djibouti, Libya, Puerto Rico, Samoa, Singapore, Somalia, Syria and West Bank and Gaza are unsupported in this refreshed record. In particular, earlier statements that Zambia and Macao refuse do not describe the new policy. Read each country's coverage reason rather than inferring universal 2031 coverage. [Current coverage evidence](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/pipeline/FULL-HORIZON-COVERAGE.md), [historical sweep](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/verification-logs/sweep).

**Zero climate slices remain missing-coverage evidence.** The eleven indexed cases are Bahrain, Barbados, Hong Kong SAR, Macao SAR, Maldives, Malta, Singapore, St. Lucia, Timor-Leste, Tonga and West Bank and Gaza. Coincident scenarios do not establish absence of climate risk. The User Guide's 25 economies without estimates use a different denominator. Its list is on printed p. 20, footnote 12. Refusal overlap changes under the refreshed policy, so do not reuse the old overlap count.

## The pipeline preserves each revision and its provenance

**The input archive supplies three complete country payload sets.** A source clone tracks manifests and indexes, while the 525 country files travel separately: frozen Verified, preserved earlier Current, and full-horizon Current. npm does not supply them. Follow the [data-inclusive setup](reproduce.md).

**Input shape and units remain part of the contract.** Row payloads use `CountryInput`; columnar payloads pass through `fromColumnarCountryInput` with an explicit OECD-series choice. Current also carries `HorizonPolicy`, which the pipeline recomputes and checks before running. GDP/fiscal levels are local-currency billions, ratios are percent of GDP, rates are percent per year and population is in thousands. Missing numeric cells retain their missing meaning. [Loader](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/apps/qcraft-web/src/engine/countryData.ts), [adapters](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/adapters.ts), [types](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts).

## Introduce a revision without overwriting a frozen one

1. Name the data revision and calculation policy separately from the upstream release date.
2. Retain exact source caches, source hashes and carried-forward series. Review units and complete coverage before emitting payloads.
3. Derive and validate country timing, including the source and usable WEO endpoints, WDI endpoint, assumption start, climate start and index anchor.
4. Emit a new manifest, index and separately checksummed payload archive. Preserve earlier revisions.
5. Compare the Python/TypeScript implementations, refusal behavior and affected exports. Review changed economic assumptions separately from port agreement or historical Excel parity.

The full-WEO policy is a disclosed application-policy extension. It follows the Guide's separation of the WEO window and long-run assumptions, but a new 2032 Current start does not inherit the workbook's historical 2030 parity claim. [Pipeline](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/pipeline/README.md), [horizon implementation](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/horizon.ts).
