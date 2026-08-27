# Data vintages: what the Explorer ships, and two decisions behind it

**CC-2, 2026-08-27.** Written for TEA-1401. Two questions the two-mode switch
forced into the open: whether the climate dataset we ship is still the current
one, and whether the 2030 impact-start convention should stay.

Both answers are "keep what we have", for reasons that are worth writing down,
because both will need revisiting and neither should be revisited by accident.

---

## 1. Bottom line

**The climate dataset.** The IMF has published newer estimates of the same thing
since the 2024 reference guide: How-To Note 2025/009, 14 November 2025, with a
171-country online data appendix. But the Q-CRAFT workbook the IMF posts is still
version 10, and it still ships the 2024 estimates. We ship what the workbook
ships. Adopting the 2025 estimates would break parity with the published tool,
which is the one thing Verified mode exists to hold.

**The 2030 convention.** It stays, because it is the IMF method rather than an
implementation choice, and because both modes have to be comparable to the
workbook. The pre-2030 runway is now about three years and four months. The
convention has a mechanical expiry, and section 3.4 says when.

**One finding neither question asked for.** The 2030 boundary is not uniform
across countries. It is the year after each country's WEO series ends, capped at
2029. Six countries in the April 2026 release have shorter series, so their
projections and their climate scenarios start earlier. Section 3.5.

---

## 2. Is there a newer FADCP Climate Dataset than 2024?

### 2.1 What the workbook we replicate actually carries

`data/vintages/weo-2024-10/climate.parquet` is extracted from
`2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx`, the workbook's own Climate Database sheet.
It holds one number per country, scenario and year: cumulative GDP loss against a
no-warming path, 2015 to 2099, for 197 country codes, of which 171 carry
estimates and the rest are empty.

The User Guide states the coverage directly (section III, note 12): "These
estimates are provided for 171 economies in the Climate Data-worksheet."

### 2.2 The citation chain, precisely

The User Guide gives a two-part provenance that the short form we use collapses
into one. Note 17, verbatim from `2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf`:

> FADCP Climate Dataset (Massetti and Tagklis, 2023), using CRU data (Harris et
> al., 2020), CMIP6 data (Copernicus Climate Change Service, Climate Data Store,
> (2021): CMIP6 climate projections), and Centorrino, S., E. Massetti, and F.
> Tagklis. 2024. "Climate Effects on GDP Growth: Updated Estimates of Kahn et al.
> (2021)" Reference Guide.

So there are two layers:

| Layer | What it is | Citation |
| --- | --- | --- |
| Climate | Temperature and precipitation, from CRU observations and CMIP6 projections | FADCP Climate Dataset (Massetti and Tagklis, 2023; reference guide updated 2024) |
| Economics | Temperature to GDP growth, updating Kahn et al. (2021) | Centorrino, Massetti and Tagklis (2024) |

The numbers in the Climate Database sheet are the output of the second layer
applied to the first. The sprint's binding short form, "FADCP Climate Dataset
(Centorrino, Massetti and Tagklis, 2024), building on Kahn et al. (2021)", names
the layer that produces the GDP losses and is what the app says today. The
precise form is raised in the CC-2 wording gate rather than changed here, because
attribution is a claim about the IMF original.

The same note also settles what the six scenarios are, which the repo had wrong
in several places: they are IPCC SSP scenarios, not NGFS pathways. Paris is
SSP1-2.6, Moderate is SSP2-4.5, High is SSP3-7.0, and Hot is the 90th percentile
of the climate models on that same SSP3-7.0, with Hot Adapted and Hot Unadapted
holding that temperature and varying adaptation speed. That is also the reason
High lands below Hot: same emissions, different percentile. Corrected in commit
`e8c20f6`.

### 2.3 What the IMF has published since

| Publication | Date | What it is |
| --- | --- | --- |
| Centorrino, Massetti and Tagklis, "Climate Effects on GDP Growth: Updated Estimates of Kahn et al. (2021)", Reference Guide | 2024 | The estimates the workbook ships |
| IMF Working Paper 2025/170, "Integrating Climate Change into Macroeconomic Analysis" | 29 August 2025 | Review of impact channels, data, models and scenarios. Describes a "GDP Impact Assessment Toolkit (Centorrino, Massetti, Raissi and Tagklis, 2025)" and says Q-CRAFT uses it |
| IMF How-To Note 2025/009, "How to Include the Effects of Rising Temperatures in Long-Term GDP Projections" | 14 November 2025 | Centorrino, Massetti, Raissi and Tagklis. The method in three steps, with "impact assessments for 171 countries available in an online Data Appendix" |

The How-To Note is the successor publication of the estimate layer: same authors
plus Raissi, same 171 countries, same temperature-to-GDP question. DOI
10.5089/9798229030021.061, stock number HTNEA2025009.

### 2.4 What the IMF currently posts

Checked 2026-08-27 on
`imf.org/en/Topics/fiscal-policies/Fiscal-Risks/Fiscal-Risks-Toolkit/Fiscal-Risks-Toolkit-Q-Craft`.
The two download links are:

- `qcraft-toolv10.xlsx`
- `qcraft-user-guidev10.pdf`

Version 10, both. There is no version 11 on the page, and no note of an update.
So the published tool has not adopted the 2025 estimates, whatever the working
paper says about the toolkit behind it.

(`www.imf.org` returns HTTP 403 to this host for programmatic fetches, which
`BLOCKED-imf-bulk-download.md` documents. The page was read in a browser, which
is not blocked. Anyone re-checking this should expect the same split.)

### 2.5 What we ship, and why

**Both modes ship the 2024 estimates.** In Verified mode that is required: the
mode's whole claim is that it reproduces the published workbook. In Current mode
it is a deliberate carry-forward, recorded in the vintage manifest as
`"climate": {"provider": "carried forward", "vintage": "weo-2024-10"}` and stated
on the About the data panel as "Carried forward from the October 2024 vintage".

Current mode refreshes what has a public upstream we can re-fetch and reproduce:
WEO macro-fiscal series and UN population. The climate slice has no such
upstream. It is a property of the workbook, not of a public API, and the 2025
data appendix is a PDF annex rather than a machine-readable release we can pin a
checksum to.

Refreshing climate on our own, ahead of the IMF, would mean the Explorer's
Current mode differed from the workbook in a way no user could check, on the one
input where the tool's credibility is thinnest. That is the opposite of what
Current mode is for. Current mode says "newer inputs, same method". It should not
quietly mean "newer inputs and a different damage function".

### 2.6 When to revisit

Any one of these is a trigger:

1. **The IMF posts Q-CRAFT v11.** Then the Verified vintage should be rebuilt
   from the new workbook, and the parity harness re-run against it. This is the
   only trigger that changes Verified mode.
2. **The How-To Note's data appendix becomes a downloadable dataset** with a
   stable URL. Then Current mode could carry it, if and only if the divergence
   note says so explicitly and the About panel names both vintages.
3. **A user asks why the 2024 estimates are still there.** Point at this section.

The check is cheap: open the Q-CRAFT toolkit page and read the two filenames.
Worth doing before each training delivery.

---

## 3. The 2030 impact-start convention

### 3.1 What the convention is, mechanically

Three things in this codebase implement it, and all three have to agree:

| Where | What it says |
| --- | --- |
| `packages/qcraft-engine-ts/src/constants.ts` | `PROJ_START = 2030` |
| `pipeline/src/qcraft_pipeline/config.py` | `MACROFISCAL_YEAR_MAX = 2029` |
| `packages/qcraft-engine-ts/src/pipeline.ts`, `buildClimateVariation` | `climate_variation` is exactly `0.0` for every year through the country's WEO maximum |

So a climate scenario is identical to the baseline through 2029, and 2030 is the
first year any scenario moves. The pipeline's truncation is what holds the
boundary in Current mode: WEO April 2026 forecasts through 2031, and the pipeline
drops 2030 and 2031 on purpose. Without that, Current mode would put its boundary
two years later than Verified mode, and the two would stop being comparable for
reasons a user could not see.

### 3.2 Why the IMF does it

The User Guide states the reason on page 18, verbatim:

> Q-CRAFT assumes that fiscal projections will be affected by climate change
> scenarios starting in 2030. This assumption is used to distinguish the
> long-term impacts of climate change, on which Q-CRAFT analysis focuses, from
> other macroeconomic shocks that buffet an economy in the near and medium term.

It is a separation of concerns, not a claim that warming has no effect before
2030. The WEO window is where a country's near-term macro-fiscal outlook already
lives, negotiated and published, and layering a climate scenario on top of it
would mix two different kinds of statement in one line.

The scenario descriptions repeat the year several times ("with the first impact
year assumed to be 2030", "again, 2030 being the first year of impact"), so it is
load-bearing in the method rather than a default nobody revisited.

### 3.3 Why it stays here

Fidelity. A tool whose selling point is that Verified mode reproduces the
workbook cannot move the workbook's boundary. And moving it in Current mode only
would mean the switch changed two things at once, which makes the difference
between the modes uninterpretable.

There is a second reason worth stating. Moving the impact start earlier is not a
neutral technical change: it would raise every scenario's divergence from the
baseline, and the tool would show larger climate effects than the IMF tool shows,
with no published basis. The honest-broker position is that our numbers are a
lower bound because of documented exclusions. Making them larger by an
unpublished convention change would undercut exactly that.

### 3.4 The shrinking runway, and when it expires

Today is 27 August 2026. The pre-2030 window is three years and four months.

What is already happening: WEO April 2026 forecasts through 2031, and the
pipeline discards 2030 and 2031 to hold the boundary. So the tool is already
throwing away two years of published IMF forecast. That cost grows by roughly one
year per WEO release.

| Vintage | WEO forecast horizon | Years discarded to hold 2029 |
| --- | --- | --- |
| October 2024 | 2029 | 0 |
| April 2026 | 2031 | 2 |
| Around April 2028 | about 2033 | about 4 |
| Around April 2030 | about 2035 | about 6 |

The mechanical expiry is different from the cost, and sharper. WEO carries actual
outturns up to roughly the current year. Once the outturns pass 2029, the
convention asks the tool to apply climate scenarios to years that have already
happened, and `MACROFISCAL_YEAR_MAX = 2029` starts discarding history rather than
forecast. That is around the **April 2031 release**, and it is not a judgment
call: at that point the convention is arithmetically broken and the tool must
change.

Between now and then the convention degrades gracefully but visibly. By the 2028
releases, a user comparing the Explorer's chart to the WEO will see the tool's
"data" band end four years before the WEO's forecast does, with no explanation on
screen unless one is written.

### 3.5 The convention is not uniform across countries

This came out of wiring the real engine and is worth recording, because nothing
in the User Guide or the repo said it.

`runPipeline` computes the boundary as `min(the country's last WEO year, 2029)`,
and `buildClimateVariation` zeroes the shock through that year. For the great
majority of countries the WEO series runs to 2029 and the boundary is 2029. For
the rest it is earlier, and both the projection and the climate scenarios start
earlier with it.

In the April 2026 release, six countries:

| Country | Last WEO year | First projected year |
| --- | ---: | ---: |
| Syria | 2010 | 2011 |
| Sri Lanka | 2024 | 2025 |
| Afghanistan | 2025 | 2026 |
| Lebanon | 2025 | 2026 |
| West Bank and Gaza | 2025 | 2026 |
| Bolivia | 2026 | 2027 |

In the frozen October 2024 vintage, none: every country carries rows through
2029, though for several of them those rows are empty, which is a different
problem and is what blocks Afghanistan, Lebanon, Sri Lanka and Syria from
projecting at all in Verified mode.

Syria is the case that matters for a chart. Its projection runs from 2011, so
seventeen years of projected path would sit inside a band the chart labels as
observed data. Fixed in commit `31ab104`: the boundary is now read per country,
2029 is the cap, and the About panel says so.

### 3.6 When the owners should revisit

- **Before the April 2028 WEO.** Decide whether to keep discarding a growing tail
  of published forecast, or to let Current mode use the full WEO horizon and
  accept that its boundary differs from Verified mode's. If the second, the
  divergence note has to say it, because it changes what the mode switch means.
- **Not later than the April 2031 WEO.** By then the convention is broken and the
  choice is forced. Whatever the IMF has done with the workbook by that point is
  the answer for Verified mode; Current mode needs its own.
- **Immediately, if the IMF moves it.** A v11 workbook with a later impact start
  is the cleanest possible trigger, and the check is the same one as section 2.6.

Both dates are far enough out that nobody will remember this file. The trigger to
put in a calendar is the annual one: **before each training delivery, open the
Q-CRAFT toolkit page and check the posted version.** Everything in this document
hangs off that one fact.

---

## 4. The vintage record

What each mode ships, with dates, as stated on the About the data panel.

### Verified: `weo-2024-10`

| Series | Release | Date |
| --- | --- | --- |
| Macro-fiscal | IMF World Economic Outlook, October 2024 | Published 22 October 2024 |
| Population | UN World Population Prospects, 2022 revision | Published 11 July 2022 |
| Climate GDP losses | FADCP Climate Dataset (2024) | Bundled with the workbook |
| Labour productivity | World Bank WDI, 1991 to 2022 | Bundled with the workbook |

All four are extracted from `2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx`. The vintage is
frozen and parity is measured against it.

### Current: `weo-2026-04`

| Series | Release | Date |
| --- | --- | --- |
| Macro-fiscal | IMF World Economic Outlook, April 2026 | Published 14 April 2026 |
| Population | UN World Population Prospects, 2024 revision | Published 11 July 2024 |
| Climate GDP losses | FADCP Climate Dataset (2024) | Carried forward |
| Labour productivity | World Bank WDI, 1991 to 2022 | Carried forward |

The macro-fiscal series is fetched over SDMX from `api.imf.org`, dataflow
`IMF.RES:WEO(9.0.0)`, whose `PUBLICATION_DATE` is 2026-04-14. Every raw download
carries a sha256 in `data/vintages/weo-2026-04/manifest.json`.

Carrying productivity forward is correct rather than merely convenient: the
engine reads historical productivity levels only for years before
`weo_max_year - 6`, and back-calculates from WEO real GDP growth after that, so a
series ending in 2022 is exactly the window the engine consumes. DATA-NOTES.md
section 6 has the argument in full.

### Dates, checked

| Claim | Source |
| --- | --- |
| WEO October 2024 published 22 October 2024 | imf.org publication URL path `/2024/10/22/` and the press briefing transcript of the same date |
| WEO April 2026 published 14 April 2026 | `PUBLICATION_DATE` on the SDMX dataflow, recorded in DATA-NOTES.md section 7 |
| WPP 2024 released 11 July 2024 | UN DESA Population Division, released on World Population Day |
| WPP 2022 released 11 July 2022 | Same, two years earlier |

---

## 5. Reproducing any of this

```bash
# The frozen vintage's per-country payloads (Verified mode)
uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10

# The refreshed vintage, end to end (Current mode)
uv run --package qcraft-pipeline qcraft-pipeline run

# Stage both for the Explorer to fetch
npm --prefix apps/qcraft-web run stage:data

# Every country, both vintages, through the TypeScript engine
npx vite-node scripts/differential/run_ts.ts -- \
  --in data/vintages/weo-2024-10/json --out /tmp/sweep/verified
npx vite-node scripts/differential/run_ts.ts -- \
  --in data/vintages/weo-2026-04/json --out /tmp/sweep/current
```

The Verified-mode parity claim is asserted, not just described:
`apps/qcraft-web/tests/verifiedMode.test.ts` runs the engine over the frozen
payloads and checks Uganda against `final/uganda.csv`, every scenario and every
snapshot year, at the same 0.01 absolute tolerance the pytest suites use. It
skips with a message naming the build command when the payloads are absent, since
they are gitignored.

## 6. Sources

- IMF Fiscal Affairs Department, *Q-CRAFT User Guide*, version 10, 2024. On disk
  at `source-materials/2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf`; posted at
  `imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf`.
- Centorrino, S., E. Massetti and F. Tagklis, 2024. "Climate Effects on GDP
  Growth: Updated Estimates of Kahn et al. (2021)." Reference Guide, Fiscal
  Affairs Department, IMF.
- Massetti, E. and F. Tagklis, 2023. *FADCP Climate Dataset*, and 2024, "FADCP
  Climate Dataset: Temperature and Precipitation." Reference Guide, IMF.
- Centorrino, S., E. Massetti, M. Raissi and F. Tagklis, 2025. "How to Include
  the Effects of Rising Temperatures in Long-Term GDP Projections." IMF How-To
  Note 2025/009, 14 November 2025.
- Mitra, P. and others, 2025. "Integrating Climate Change into Macroeconomic
  Analysis: A Review of Impact Channels, Data, Models, and Scenarios." IMF
  Working Paper 2025/170, 29 August 2025.
- Kahn, M. E., K. Mohaddes, R. N. C. Ng, M. H. Pesaran, M. Raissi and J. C. Yang,
  2021. "Long-Term Macroeconomic Effects of Climate Change: A Cross-Country
  Analysis." *Energy Economics* 104.
- IMF Q-CRAFT toolkit page, read 2026-08-27.
- Repo: `DATA-NOTES.md`, `VINTAGE-TOGGLE.md`, `INTEGRATION-REPORT.md`,
  `.change-requests/PIPELINE-2026-08-26.md`.
