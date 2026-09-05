# Current uses the full supported WEO window

September 2026 revision. The user selected the full newer WEO horizon and a documented rolling forecast-to-model transition. This supersedes the fixed-2029 Current policy in the August notes. Verified's original inputs and calculation path stay unchanged.

Current's source vintage is April 2026 WEO with UN WPP 2024. The data revision is `weo-2026-04-full-horizon-v1`, and the calculation policy is `current-full-weo-v1`. The retained prior `weo-2026-04` directory represents the older truncated profile. Do not overwrite it or use a shared release label as proof of identical inputs.

For a supported country, H is the coherent usable end of the required WEO series. Source horizon, usable horizon, WDI endpoint, coverage outcome and reason are recorded. Uganda's available source window ends in 2031. Supplied baseline values continue through H. Endogenous assumptions and additional climate comparisons start at H+1. Missing essential inputs produce an explicit shorter or unsupported outcome, not a silent 2029 fallback.

The IMF Guide, printed p.19, separates its long-run climate comparison from the medium-term period. Moving the comparison after the newer WEO window is a disclosed Explorer extension, not an IMF-prescribed 2032 rule. Climate calendar rows are unchanged. With J(y)=100+supplied climate GDP-loss%, the first annual driver is 100*(J(H+1)/J(H)-1). There is no catch-up shock. This omits incremental changes before H+1 and changes the cumulative comparison. The WEO baseline is not a demonstrated climate-free counterfactual.

Current's productivity bridge begins after the usable WDI history endpoint and extends through H, using the residual identity ((1+real GDP growth)/(1+employment growth)-1). The historical temperature reference and WDI/climate inputs remain carried from the original workbook. Refreshing WEO and UN is not a claim that every source has been updated.

The raw WEO cache used for regeneration has SHA256 `25aba501e0672b9340e26d0238d77f719da8cdcd4553df7280775ae6bf4be032`. It contains the missing 2030 and 2031 observations for the selected source series. Blank observation-status fields do not support a common historical/forecast cutoff. Preserve source estimates/projections labels.

New run exports carry input and calculation identities plus boundaries. Older Current imports restore settings with an explicit changed-data/calculation warning. Retain old exported artifacts for their numerical record. Exact replay requires matching input bytes and compatible calculations.

The participant-facing explanation is built from `docs/tool-guide/build.py`. Its source references identify the official workbook version 1.0_11-15-2024 and User Guide version 1.0_11-04-2024. The PDF's older productivity dates differ from the later workbook's actual inputs. Verified follows the workbook.

Validation evidence belongs with the tested source and input revision. Historical same-input parity is retained as scoped evidence; it does not automatically validate this extension. The fresh numerical, UI and export checks are recorded in the final release review. This policy note is not itself evidence of passing those checks.
