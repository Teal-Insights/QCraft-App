# CC-2 wording gate: every IMF-facing sentence, for Teal

**2026-08-27.** The copy below is what the Explorer says about the IMF original.
It is all in one file, `apps/qcraft-web/src/content/modes.ts`, and a test fails
the build if a second copy of the parity claim appears anywhere else. So clearing
this gate is a review of one file.

The branch is built and green behind the gate. Nothing here changes without a
call, and PR #62 stays a draft until it clears.

Four questions need a decision. Everything else is presented for approval or
edit.

---

## Question 1: does the Verified badge say "only"?

**Shipped today, exactly as the CC-2 brief specified it:**

> Matches the official IMF Excel workbook. Baseline parity verified for 147 of
> 147 tested countries; climate-scenario parity confirmed for ratio metrics.

**The reference notes say something slightly stronger:**

> baseline parity exact for 147/147 tested countries; climate-scenario parity
> confirmed for ratio metrics **only**. Never claim more.

The word "only" is the difference. Without it, "climate-scenario parity confirmed
for ratio metrics" can be read as confirmation that happens to have been done on
ratio metrics. With it, it says confirmation was done on ratio metrics and
nowhere else. The second is the more conservative claim and is what the binding
note carries.

- **(a) Add "only".** Reads: "climate-scenario parity confirmed for ratio metrics
  only." The safe side, consistent with the reference notes, and consistent with
  the 2026-08-27 gate resolution that holds the wording until an independent
  Excel recalculation confirms post-fix climate parity.
- **(b) Keep it as briefed**, without "only".
- **(c) Something else.**

**Recommendation: (a).** The brief and the reference notes were staged at the
same time and agree on substance, so this reads as a transcription slip rather
than a decision. The cost of being wrong in direction (a) is a slightly
understated claim. In direction (b) it is an overstated one.

One mechanical note: the badge also travels verbatim into every exported report
and CSV, so whichever way this goes, it goes everywhere at once.

---

## Question 2: the FADCP attribution, short form or precise form

**Shipped today, the binding short form:**

> FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), building on
> Kahn et al. (2021)

**What the IMF User Guide actually says** (note 17, verbatim from
`2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf`):

> FADCP Climate Dataset (Massetti and Tagklis, 2023), using CRU data (Harris et
> al., 2020), CMIP6 data (Copernicus Climate Change Service, Climate Data Store,
> (2021): CMIP6 climate projections), and Centorrino, S., E. Massetti, and F.
> Tagklis. 2024. "Climate Effects on GDP Growth: Updated Estimates of Kahn et al.
> (2021)" Reference Guide.

So the dataset name belongs to Massetti and Tagklis (2023), and Centorrino,
Massetti and Tagklis (2024) is the temperature-to-GDP layer that produces the
numbers we actually use. The short form attaches the dataset name to the second
citation.

- **(a) Keep the binding short form everywhere.** It names the layer that
  produces the numbers, it is what the reference notes fixed, and it is short
  enough for a badge.
- **(b) Keep the short form in the app, add the precise form to the About panel
  and the course.** One extra sentence where there is room for it.
- **(c) Switch to the precise form everywhere.**

**Recommendation: (b).** The short form is defensible and already agreed, and the
About panel is exactly the surface where the full chain belongs. (c) makes badges
unreadable.

Related and already fixed without a gate, because it is a factual error rather
than a wording choice: the six scenarios are IPCC SSP pathways (Paris on
SSP1-2.6, Moderate on SSP2-4.5, High on SSP3-7.0, Hot the 90th percentile of the
same SSP3-7.0), not NGFS pathways. The User Guide section IV.B is explicit. Say
the word if you would rather that had been gated too.

---

## Question 3: the Current-mode divergence note

**Shipped today:**

> Same engine, newer inputs: results will not match the published workbook cell
> for cell, because the workbook ships the October 2024 data vintage.

It names the cause and the consequence, and deliberately does not say the newer
numbers are better, which is not a claim this tool has tested.

- **(a) Approve as written.**
- **(b) Add a positive half**, for example ", so the projection reflects the
  latest published data." Reads warmer, and is the natural thing a user wants to
  hear.
- **(c) Something else.**

**Recommendation: (a).** (b) is true but it is the tool praising itself in the
one sentence whose job is to disclose a divergence. The "why the Explorer" case
is made elsewhere, in the argument card, where it belongs.

---

## Question 4: the zero-climate notice

This is the notice the 2026-08-27 gate resolution asked for. Eleven selectable
countries have an all-zero climate slice: Bahrain, Barbados, Hong Kong SAR, St.
Lucia, Macao SAR, Maldives, Malta, West Bank and Gaza, Singapore, Timor-Leste,
Tonga.

**Shipped today:**

> **No climate estimates for this economy.** The climate dataset has no coverage
> for this economy, so every scenario lands on the baseline. That is missing
> data, not an absence of risk. Sea-level rise and disaster damage are outside
> this model everywhere, and for small island and city economies those are
> usually the channels that matter most.
>
> The baseline projection on this page is unaffected and can be used. Every
> scenario line for Maldives lies on the baseline because the estimate is absent,
> not because it is zero.

One thing worth knowing before deciding: the IMF's own User Guide, note 12, lists
the same economies as having no climate estimates. So this notice is the tool
agreeing with the workbook out loud, not confessing a defect of ours.

- **(a) Approve as written.**
- **(b) Soften.** Drop "not an absence of risk" and let the plainer statement
  stand alone.
- **(c) Strengthen.** Name the IMF User Guide note explicitly, so a trainee can
  see the exclusion is the method's rather than ours.

**Recommendation: (a) for Tuesday, with (c) as the course's version.** The
on-screen notice has to be readable in one breath by someone who just clicked a
country. The citation belongs in the M5 teaching example, which the reference
notes already earmark for the Maldives case.

---

## Applied without a gate, flagged here in case you want it back

The binding naming rule (2026-08-26): "the debt dynamics equation", not "the debt
equation", wherever the equation is NAMED, in course, deck, widgets and app copy.
The widgets and the Explorer's intro were still saying "the debt equation" in
seven user-facing strings, including the sandbox widget's page title and the
climate widget's on-screen title, which is on a projector on Tuesday.

Applied, because it is an existing binding decision rather than a new claim. The
one place it reads longer is the widget name, now "The debt dynamics equation
sandbox". Say the word and that single string goes back.

Code comments still say "the debt equation" in six places. Left alone
deliberately: they are not user-facing, and they sit in files other lanes are
editing right now.

---

## Everything else, for approval or edit

These are not questions. They are the remaining IMF-facing sentences, quoted so
nothing goes to Uganda unread.

### The mode summaries, always on screen

- Current: "Latest data. WEO April 2026 and UN population projections 2024."
- Verified: "The data the published IMF workbook ships."

### The country-unavailable notice

Heading: "This country cannot be projected in this mode."

Two bodies, one per failure shape:

> The source data for this country is missing values the projection needs, so the
> tool has nothing to draw. This is a gap in the published source data, not a
> setting you can change.

> The source data for this country is missing government debt figures at the
> point the projection starts, so the debt path would begin from an anchor that
> does not exist. The tool stops rather than drawing a line nobody should cite.

Then one of:

> [Country] does run in [other] mode ([vintage]). Switch to [other] mode.

> The other data mode cannot project it either, so this is a gap in the published
> source data rather than something a different release fixes. Every other
> country in the list is unaffected.

Zambia hits the second body and the second follow-up, in both modes. It is a live
partner country, so it is worth reading that pair as a Zambian official would.
CC-6 is working the underlying fix.

### The About the data panel

**Lede.** Every number in this tool comes from four public data sources run
through the Q-CRAFT method. This page says which release of each source you are
looking at, where the climate damage estimates come from, and why climate impacts
start in 2030.

**Two modes, one engine.** The projection method does not change between modes.
Only the input data changes. Verified mode runs the data the published IMF
workbook ships, so you can check this tool against the original. Current mode
runs the latest releases of the same sources, so the analysis you take into a
meeting is not built on data that has aged.

**Where the climate damage estimates come from.** Climate damages come from the
FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), which builds on
the temperature and growth work of Kahn and others (2021). For each country and
scenario it gives one number per year: cumulative GDP loss against a no-warming
path. The tool turns that into a labour productivity growth effect, which is the
channel through which warming reaches the debt line.

The dataset is temperature-driven. Sea-level rise, individual disasters, tipping
points and adaptation costs are outside it, so results read as a lower bound
under those channels. For a small number of economies the dataset carries no
estimate at all, and the tool says so on screen when you select one.

**Why climate impacts start in 2030.** The IMF method holds the projection to
observed and forecast data through 2029, then projects from 2030 to 2099. Climate
effects apply only to the projected years, so 2030 is the first year a scenario
moves away from the baseline. This tool keeps that convention in both modes,
including Current mode, where the newer WEO release forecasts past 2029 and is
truncated at 2029 to hold the boundary. Keeping it is what makes the two tools
comparable.

A handful of countries have no WEO data that far out. For those the projection,
and with it the climate scenarios, starts the year after their data stops. The
shaded band on each chart shows where that boundary falls for the country you are
looking at, so it is never further right than the data supports.

The convention was set when 2030 was six years out. It is worth revisiting as the
window closes: docs/data-vintages.md records when and why.

**This is not an IMF product.** Q-CRAFT Explorer is not an IMF product. It is an
independent open-source reimplementation by Teal Insights and NatureFinance. The
IMF workbook and the IMF training materials remain the authoritative versions of
the method. This tool is complementary to them, and Verified mode exists so you
can hold it to that standard.

### The per-mode source tables

Rendered from the registry, so these are the exact strings a user reads.

| Mode | Series | Release | Date |
| --- | --- | --- | --- |
| Current | Macroeconomic and fiscal series | IMF World Economic Outlook, April 2026 | Published 14 April 2026 |
| Current | Population by age group | UN World Population Prospects, 2024 revision | Published 11 July 2024 |
| Current | Climate GDP losses | FADCP Climate Dataset (2024) | Carried forward from the October 2024 vintage |
| Current | Labour productivity levels | World Bank World Development Indicators, 1991 to 2022 | Carried forward from the October 2024 vintage |
| Verified | Macroeconomic and fiscal series | IMF World Economic Outlook, October 2024 | Published 22 October 2024 |
| Verified | Population by age group | UN World Population Prospects, 2022 revision | Published 11 July 2022 |
| Verified | Climate GDP losses | FADCP Climate Dataset (2024) | Bundled with the workbook |
| Verified | Labour productivity levels | World Bank World Development Indicators, 1991 to 2022 | Bundled with the workbook |

All four dates are checked: `docs/data-vintages.md` section 4 names the source for
each.

---

## Cost of deferral

Low until Friday, then it rises fast.

- **Nothing is blocked today.** The feature is built, tested and running behind
  the gate. Deferring costs nothing right now.
- **UI freeze is Saturday EOD.** A wording change after the freeze means
  rebuilding and re-QAing the bundle, which is small but is exactly the work the
  freeze exists to avoid.
- **The dry run is Monday.** Copy that changes between the dry run and Tuesday is
  copy nobody has rehearsed with.
- **The zero-climate notice is the one item with a hard external commitment.**
  The 2026-08-27 resolution says to ship it before Tuesday. It is shipped and
  needs only sign-off.

The cheapest path is answering question 1 alone, which is one word, and letting
the rest ride as written. That clears the only item where the shipped copy and
the binding note actually differ.
