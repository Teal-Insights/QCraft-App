# What the bundled data can say about where a country sits

**CC-5, 2026-08-27. Research note, written before the panels were built.**

The parameter context panels shipped in run 4 answer one question: what does the
published source say about my country. This note works out which parameters the
bundle can also place in a cross-country distribution, what statistic does that
honestly, and where the bundle runs out.

Everything below is computed from files already in the repo. Nothing was
fetched, and no country-level number was typed in by hand. The derivation is
`scripts/derive_peer_data.py`, which writes four CSVs into
`apps/qcraft-web/src/context/data/` and can be rerun with `--check` to prove the
committed files still match the data.

---

## 1. Bottom line

| Parameter | Distribution | What grounds it |
| --- | --- | --- |
| Demography variant | yes | UN WPP working-age growth at 2050, all 175 selectable countries, three variants each |
| Productivity growth | yes | WDI realised growth, plus the residual the engine itself reads out of the WEO forecast |
| Inflation | yes | WEO GDP deflator growth, forecast and two history windows |
| Interest-rate approach | yes | WEO interest bill over debt stock, plus the implied rate-growth differential |
| Debt target | yes, indirectly | where debt actually is across countries, and where this country has been |
| Fiscal rule on or off | no | a switch, not a quantity |
| Expenditure rigidity | **held for a gate** | no per-country estimate survives; a peer-group range does. See section 7 |

Peer groups come from the UN WPP location hierarchy already in the pipeline
cache: five regions and twenty subregions, covering all 175 selectable
countries. World Bank income groups are not derivable from anything in the
bundle. Section 8 records what was checked and what is offered instead.

---

## 2. What is actually in the bundle

`data/vintages/{weo-2024-10,weo-2026-04}/` carries four Parquet tables. Both
vintages were checked; the counts below are the April 2026 vintage, with the
frozen October 2024 vintage in brackets where it differs.

| Table | Countries | Years | What the panels can use |
| --- | --- | --- | --- |
| `macrofiscal` | 197 | 2001 to 2029 | 24 series, including revenue, primary expenditure, debt, interest expenditure and a derived `interest_rate_percent` |
| `demography` | 237 [197] | 1950 to 2100 | 15-64, 65+ and Total, under the Low, Medium and High variants |
| `productivity` | 176 | 1991 to 2022 | WDI GDP per person employed, constant PPP dollars |
| `climate` | 197 | 2015 to 2099 | FADCP GDP-loss paths, six scenarios |

Coverage at 2029, the last WEO year, on the 189 countries the April 2026 table
carries: 189 have deflator growth, 184 have a debt ratio, 181 have primary
expenditure, and 177 have a usable effective interest rate. Of the 175 countries
the Explorer offers, 169 carry the WDI productivity record and 162 an effective
interest rate.

### The history boundary, established rather than assumed

Neither table flags which years are outturns and which are forecast, so the two
vintages were differenced year by year. They agree to four decimal places
through 2018, drift gently from 2019 as national accounts are revised, and jump
at 2024: the median absolute difference in real GDP growth is 0.28 points at
2023 and 0.58 at 2024, and in the debt ratio 1.05 points at 2023 and 2.38 at
2024. The October 2024 vintage was therefore forecasting from 2024.

Every historical statistic in this note stops at **2023**, which is an outturn
year in both vintages. That is what lets the same statistic be quoted in either
data mode without the story changing underneath the reader.

---

## 3. Demography variant

**Statistic:** working-age (15-64) population growth in 2050, under each of the
three UN variants.

Working-age rather than total population, because working-age growth is what
becomes employment growth in the projection. Total population growth drives
primary spending, and the existing panel already offers that measure; the
distribution takes the growth channel because that is the one the variant choice
moves the debt path through.

Cross-country distribution, 175 selectable countries, Medium variant:

| p10 | p25 | median | p75 | p90 |
| --- | --- | --- | --- | --- |
| -1.52% | -0.78% | 0.09% | 1.34% | 1.93% |

Uganda sits at 1.92%, inside the top decile. Half the world is at or below zero
by 2050. The Low-to-High spread has a median of 1.01 points and Uganda's is
0.85, which is the number that makes the honest point about this control: the
variant choice is worth about a point of working-age growth, and the world
median country is choosing between shrinking slowly and shrinking a bit faster.

**Caveat carried into the panel:** the variants are identical for the first
fifteen years or so, because everyone in the 2040 working-age population is
already born. The existing panel already computes and states the divergence
year; the distribution view keeps it in the caption.

---

## 4. Productivity growth

This is the parameter where the bundle offers three answers that disagree, and
the disagreement is the finding.

`productivity_start` is not the growth rate in 2024. `baseline_v1` back-calculates
productivity as a residual from `WEO_MAX_YEAR - 6` onward, so from 2023 to 2029
the engine ignores the parameter and reads real GDP growth net of working-age
population growth. The parameter is the value the logistic convergence starts
from in 2030, and `productivity_end` is the asymptote it converges toward, with
a turning point fifteen years out.

Three statistics, all bundled:

| Statistic | Window | p25 | median | p75 | Uganda |
| --- | --- | --- | --- | --- | --- |
| WDI realised, long run | 1992 to 2022 | 0.66% | 1.41% | 2.54% | 2.73% |
| WDI realised, last decade | 2013 to 2022 | -0.16% | 0.95% | 2.14% | 0.33% |
| WEO-implied residual | 2023 to 2029 | 1.09% | 2.06% | 3.33% | 3.23% |

The residual is what the engine itself uses over the WEO window, so it is the
closest thing in the bundle to the quantity `productivity_start` sets. It is
also systematically higher than the realised record: a median of 2.06% against
0.95% over the last realised decade, correlated at 0.50 across countries. That
gap is not a productivity forecast. The residual absorbs everything the model
does not otherwise explain, including changes in the employment rate and in
participation, because employment growth in the projection is working-age
population growth and nothing else.

The panel shows all three and says which is which. The Explorer default of 5.0%
sits above the 90th percentile of every one of them, which is a fact a trainee
should meet inside the tool rather than after the workshop.

**Caveats carried into the panel:** the WDI record ends in 2022, and six of the
175 selectable countries have no realised series in it. The
residual is computed on the Medium variant; the variants do not differ over
2023 to 2029, so the choice does not affect it.

---

## 5. Inflation

**Statistics:** WEO GDP deflator growth at 2029, the median over 2001 to 2023,
and the median over 2014 to 2023.

`inflation_start` is the deflator growth the logistic starts from in 2030, with
a turning point five years out, so 2029 is the year the record hands over to the
assumption. Two history windows because the long one carries the 2000s
commodity cycle and the short one is closer to the current regime, and for the
countries this training serves they differ by several points.

| Statistic | p25 | median | p75 | p90 | Uganda |
| --- | --- | --- | --- | --- | --- |
| WEO 2029 forecast | 2.01% | 2.58% | 4.44% | 7.32% | 4.63% |
| Median, 2001 to 2023 | 2.27% | 4.24% | 6.74% | 11.13% | 5.41% |
| Median, 2014 to 2023 | 1.50% | 2.70% | 5.30% | 10.31% | 3.20% |

**Caveat carried into the panel:** the GDP deflator is not the consumer price
index a central bank targets. A country whose inflation target is 5% will not
generally show 5% here, and the panel says so, because a trainee who types their
CPI target into a deflator control has made a real error.

---

## 6. Interest-rate approach

`interest_rate_percent` exists in both vintages and is derived in the pipeline as
interest expenditure over the **same-year** debt stock, which reproduces the
workbook (`pipeline/src/qcraft_pipeline/weo.py`, and `DATA-NOTES.md` section
5(b) for why the same-year denominator is deliberate). It is usable at 2029 for 177 of the
189 countries the table carries, and for 162 of the 175 the Explorer offers. The
rest are countries WEO carries no debt stock for, where the derived quotient is
an infinity rather than a rate.

Two statistics, both at 2029:

| Statistic | p10 | p25 | median | p75 | p90 | Uganda |
| --- | --- | --- | --- | --- | --- | --- |
| Effective nominal rate | 1.22% | 2.09% | 3.60% | 4.99% | 6.75% | 9.54% |
| Rate minus growth | -7.58 | -4.89 | -2.77 | -1.33 | 0.26 | -1.85 |

Uganda's effective rate is above the 90th percentile. The differential is
negative for roughly nine countries in ten, which is the single most useful
piece of context for this control: the interest-rate approach is a choice about
what happens to a differential that is currently favourable almost everywhere,
and the three approaches differ in how long they let it stay that way.

**Caveat carried into the panel:** this is an average rate on the whole stock,
not a marginal rate on new borrowing, and it inherits WEO's definition of general
government debt, which is not the same perimeter in every country.

---

## 7. Expenditure rigidity: the gate

### 7.1 What the parameter is, exactly

`climate.py` phase 3 holds primary expenditure at

    PE = PE_base - (1 - rigidity) * (PE_base - share * Y)

where `share` is the baseline expenditure ratio. Substituting a proportional GDP
shock `g` gives `PE = PE_base * (1 + (1 - rigidity) * g)`. So rigidity is
**one minus the elasticity of primary expenditure to GDP**. At 1.0 spending
holds its level and the whole shock lands on the balance; at 0.0 spending holds
its share of GDP.

That is an unusually clean target for an empirical proxy: the model states the
elasticity it wants, and the WEO history records how primary expenditure has
actually moved when GDP moved. The question is whether the record pins it down.

### 7.2 Per-country estimates do not survive

Country-by-country regressions of primary expenditure growth on nominal GDP
growth, 2001 to 2023, 186 countries with at least ten usable years:

- median R-squared **0.13**
- median standard error on the slope **0.29**
- 44 countries produce a negative slope and 29 produce a slope above one, so 73
  of 186 land outside the parameter's own range before anything is interpreted
- Uganda's slope is 0.01 with a standard error of 0.31 and an R-squared of 0.00

A standard error of 0.29 on a slope means a 95 percent interval roughly a
point-and-a-half wide, on a parameter defined over a range of one. Restricting to
each country's weaker-growth years, which is the specification the brief
suggested, makes it worse: eleven observations per country, and Nigeria moves
from an implied rigidity of 0.97 to 0.00.

A distribution strip of these estimates would rank 175 countries on a number
none of them is measured to. That is the one thing this feature must not do.

### 7.3 A peer-group range does survive

Pooling within a peer group, with country means removed and standard errors
clustered by country, is well identified. Demeaning within country matters: two
series that both trend upward have an elasticity near one for reasons that have
nothing to do with how a budget answers a shock.

World, April 2026 vintage, implied rigidity with its 95 percent interval:

| Reading of the record | Implied rigidity | 95% interval | Observations |
| --- | --- | --- | --- |
| Every year since 2001 | 0.40 | 0.29 to 0.51 | 4,036 |
| Pandemic years left out | 0.31 | 0.20 to 0.42 | 3,664 |
| Weak growth years only | 0.49 | 0.35 to 0.63 | 2,011 |
| Weak growth years, pandemic left out | 0.32 | 0.15 to 0.48 | 1,769 |
| In real terms, every year | 0.48 | 0.28 to 0.69 | 4,036 |
| In real terms, pandemic left out | 0.25 | 0.04 to 0.45 | 3,664 |

Each row is precise. The rows disagree by more than any one of them admits, and
that is the honest width: **the world record supports something between about
0.25 and 0.50**, and the choice among defensible readings moves the answer by
more than the sampling error inside any one reading.

Regional ranges across the same six readings: Africa 0.07 to 0.41, Asia 0.32 to
0.64, Americas 0.25 to 0.62, Europe 0.29 to 0.97, Oceania 0.04 to 0.33 with
intervals so wide they carry no information. The Oceania rows are reported and
visibly uninformative rather than dropped.

Two further sensitivities, recorded here and not drawn:

- **Outlier trimming.** The estimate uses a 200 percent cap on annual growth,
  which removes redenominations. Tightening the cap to 30 percent moves the
  world figure from 0.40 to 0.66. A tight cap would discard exactly the
  high-inflation years the countries this training serves have lived through,
  so the loose cap is the right one, and the sensitivity is stated.
- **Vintage.** The per-country estimates move by a median of 0.004 between the
  two vintages, so nothing here depends on which data mode is selected.

### 7.4 What the record does not support

Contemporaneous co-movement is not a causal response. The estimate mixes
discretionary policy, automatic stabilisers, and the fact that spending and
output are determined together. In nominal terms an inflation surprise raises
both variables and biases the elasticity up, which is why the real-terms readings
are carried alongside. WEO general-government coverage differs by country. None
of that is fatal to a range; all of it is fatal to a point estimate.

One number is worth stating plainly whichever way the gate goes: the engine
default is **1.0**, and no reading of the historical record comes near it. The
module docstring says so in its own words, calling 1.0 the sticky worst case.

### 7.5 GATE for Teal

**Context.** Rigidity is the valve between a climate shock and the deficit, it
has the largest single lever on the climate results, and no source publishes it.
The bundle supports a peer-group range, not a country estimate. Putting a
computed regression result in front of ministry officials is a claim the tool
makes about the historical record, which is your call rather than mine.

**Options.**

- **A.** Ship a rigidity panel that shows what the record supports: the six
  readings above with their intervals for the world and for the user's region,
  beside the country's own year-by-year scatter drawn as the uninformative cloud
  it is. No country ranking. The caption says the record supports a range and
  the default sits above all of it.
- **B.** Ship a peer distribution of per-country point estimates, country
  highlighted, with caveats in the source line.
- **C.** Ship no rigidity distribution. Keep the existing one-line judgment note
  and the link to the climate-channel teaching widget.

**Recommendation: A.** It is the only option whose visual claim matches the
evidence, and it turns the weakest-grounded parameter into the clearest lesson
about what a model asks a user to supply. B invites a trainee to read Uganda's
0.99 as a measurement of Uganda when it is a standard error of 0.31 around
nothing.

**Cost of deferral.** C is the status quo, so deferring costs no correctness.
It costs the strongest teaching moment in the panel set, and it leaves the one
parameter with no guidance still having no guidance on Tuesday.

Option A is built behind this gate. B is a component swap of about an hour if
you prefer it, and C is deleting one entry from a registry.

---

## 8. Peer groups

### 8.1 Region and subregion: in the bundle

The pipeline's raw WPP download carries the full UN location hierarchy. Walking
each country's parent chain gives a subregion (its immediate parent) and a region
(the ancestor whose own parent is the World), which resolves to five continents.
All 175 selectable countries land in a group.

| Region | Selectable countries |
| --- | --- |
| Africa | 51 |
| Asia | 47 |
| Europe | 39 |
| Americas | 30 |
| Oceania | 8 |

Twenty subregions, from Western Asia at 17 selectable countries down to
Australia/New Zealand and Polynesia at two each. A group of two is not a peer
set, so the derivation blanks any subregion with fewer than eight selectable
countries and the panel offers the region instead. Twelve subregions survive
that test, including Eastern Africa at 15, which is Uganda's.

One wrinkle worth recording because it silently drops two countries otherwise:
Canada and the United States are parented to M49 code 918, and the download
publishes that area only under a different location id. The derivation bridges
918 to 905 explicitly rather than letting the two fall out of every peer group.

### 8.2 Income group: not in the bundle

WPP carries nine income-group rows, and they are aggregate locations only. No
country's parent is an income group, so membership is not derivable. Checked and
confirmed: zero of 237 countries have an income-group parent. The IMF country
codelist in the pipeline cache carries names and translations, with no
classification. Nothing else in the repo has one.

Bundling a World Bank income table would mean adding a hand-entered
classification of 175 countries, which is a claim the tool would be making about
each of them and a file that goes stale every July.

### 8.3 What is offered instead

WDI GDP per person employed at constant PPP dollars is cross-country comparable
and covers 169 of the 175 selectable countries. The panel offers a peer axis of
the 40 countries nearest the user's own on that measure, named for what it is:
similar output per worker. A nearest-neighbour band rather than terciles,
because tercile cut points would be an invented classification and a distance is
just a distance.

WEO nominal GDP cannot substitute. It is reported in national currency, so
Uganda's 2023 figure is 193,902 and Germany's is 4,219, and any cross-country
comparison built on it would be a comparison of currency units.

---

## 9. Debt target

No fiscal-rule ceiling exists anywhere in the bundle. WEO carries outturns and
forecasts, not law. The regional convergence criteria that would fill the gap
(the EAC protocol, the WAEMU and CEMAC ceilings, the EU reference value) are real
and are not in this repository, and asserting another country's statutory ceiling
inside a ministry-facing tool is a claim that needs a primary document behind
each row.

**Decision, mine to make and recorded here: no ceiling table is bundled.** What
the panel shows instead is where debt actually is, which the bundle does have:

| Statistic | p10 | p25 | median | p75 | p90 | Uganda |
| --- | --- | --- | --- | --- | --- | --- |
| Debt-to-GDP, 2023 outturn | 26.3 | 39.1 | 54.4 | 77.8 | 105.6 | 50.4 |
| Debt-to-GDP, 2029 forecast | 27.7 | 36.6 | 51.2 | 73.0 | 108.0 | 53.5 |
| Lowest since 2001 | 6.5 | 16.1 | 24.8 | 38.1 | 59.3 | 14.8 |

The Explorer default of 50 is close to the world median, and 76 of the 172 selectable
countries with a 2023 outturn were at or below it. The country's own lowest ratio since 2001 is the
second line the panel draws, because a target is a policy anchor and the useful
question about one is whether this country has ever been there.

If Teal wants the convergence ceilings, that is a separate small research task
with a citation per row, and it should go through the same claim gate as the
other IMF-facing copy.

---

## 10. Defects found on the way

**Serbia does not run on the frozen verification vintage.** The `weo-2024-10`
demography table files Kosovo's population under iso3c SRB beside Serbia's, so
SRB carries two values for every variant, age group and year.
`demography_country("SRB")` raises `ComputeError` on that vintage. SRB is a
selectable country. The April 2026 pipeline routes Kosovo to XKX and the problem
does not arise there.

This is the same class of failure as the Zambia crash CC-6 owns, and it is not
on the 13-country `PYTHON_ERROR` list in the parity harness. Nothing here repairs
it: the derivation leaves SRB out of the reference set for that vintage and says
so on stderr. Handed to CC-6 for the completeness sweep, and to CC-2 if the
Verified mode is going to offer a country that cannot run in it.

**RESOLVED, CC-6 and CC-8.** CC-6 repaired the frozen Parquet, which CC-2 had
fixed in the JSON alone, and found the same concatenation had been shipping
Serbia's climate scenarios wrong by 7 points of debt-to-GDP by 2082. The
reference table was not regenerated at that point, so `peer-stats.csv` kept the
blanks the raise had produced. Rerunning the derivation at the freeze fills the
frozen SRB row: four demography statistics and the productivity residual, one
row changed and nothing else. A Serbian user in Verified mode now finds their own
country on the demography strip. `derive_peer_data.py --check` reports clean.

---

## 11. Files and how to rebuild them

    uv run --with polars --with pyarrow python scripts/derive_peer_data.py
    uv run --with polars --with pyarrow python scripts/derive_peer_data.py --check

| File | Rows | Bytes | What it holds |
| --- | --- | --- | --- |
| `peers.csv` | 175 | 7.6 KB | name, region, subregion, output per worker |
| `peer-stats.csv` | 350 | 43 KB | thirteen statistics per country, both vintages |
| `rigidity-points.csv` | 7,422 | 252 KB | the country-year growth pairs the scatter draws |
| `rigidity-readings.csv` | 72 | 5.7 KB | the pooled elasticity under six readings, world and by region |

Both vintages are carried in every file, keyed by a `vintage` column, so the
panels can follow the data mode CC-2 is building without this lane having to
guess at its interface.

The largest file is the rigidity scatter, which is why its growth rates are
rounded to two decimals and its downturn test is stored as a flag. The Explorer
has to open from a memory stick in a training room with no network, so bytes in
the bundle are a real cost.
