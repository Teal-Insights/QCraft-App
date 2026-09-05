---
title: "Identify the documentation and its engine"
description: "Full-WEO Current revision and historical evidence boundaries."
---

**This technical-docs revision follows the full-WEO Current tool refresh.** It retains the existing Starlight reviewer route, assumptions register, verification matrix, architecture and generated API reference. Docs and tool source remain separately pinned in `source-manifest.json`; the full input archive has its own checksum.

**Current now uses the full usable country WEO window.** `weo-2026-04-full-horizon-v1` identifies the inputs and `current-full-weo-v1` the calculation policy. For Uganda, source WEO values run through 2031, long-run assumptions and additional climate effects start in 2032, and the climate index anchors to actual 2031. Calendar years are unchanged and there is no catch-up shock. Current numerical results change. Verified's frozen inputs, historical behavior and scoped workbook evidence remain preserved.

**Coverage is reviewed by outcome, not only by the total.** The refreshed cross-engine record retains 175 countries: 160 full horizons, seven shorter horizons and eight unsupported inputs. That is still 167 computed cases, with different membership from the earlier Current sweep. See [data coverage](data.md#coverage-counts-describe-different-populations) and [verification scope](verification.md).

**Saved runs distinguish settings restoration from result replay.** New exports carry the revision, policy, input hash and timing. Older Current files can restore settings with an explicit changed-data/calculation warning. Keep the exact source and inputs for old results; this release does not silently replay the earlier truncated Current profile.

**Earlier release receipts remain historical.** The September 4 `b484f858` release changed explanatory copy while preserving its then-current calculation. Its clean-source, offline, export and numerical evidence describes that earlier artifact. It does not establish unchanged calculation or fresh validation for this full-WEO revision. The earlier Turning Point explanation remains: the parameter is not a halfway year.

**The operating companion has its own current address.** The six-page [companion](https://teal-insights.github.io/QCraft-App/guide/) explains the refreshed Explorer at `/QCraft-App/guide/`. The March guide remains at the root with a historical banner, and the longer training course is being revised separately.

**Use the tagged release with its exact inputs.** The [qcraft-tool-2026-09-05 release](https://github.com/Teal-Insights/QCraft-App/releases/tag/qcraft-tool-2026-09-05) identifies the Explorer source and input archive. Follow the [reproduction instructions](reproduce.md) to retrieve the three payload sets and reference files, verify their checksum, and build the app and companion.
