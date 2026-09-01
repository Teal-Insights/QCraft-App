# change-request: FISCAL — the engine's effective WEO anchor is not the workbook's

Raised by CC-6 (TEA-1403) during the completeness sweep. Nothing here blocks the
Tuesday build, and nothing here was changed on my own authority: the engine
behaves today exactly as it did before this lane, and this records a divergence
from the workbook that predates it.

## What I expected, per the source-of-truth hierarchy

Excel formulas are the highest authority (CLAUDE.md). The workbook anchors the
projection on its last WEO column and applies no guard:

- `Macrofiscal` row 19, debt-to-GDP: `=D10/D4*100`
- `Baseline` row 36, gross debt as a share of GDP, 2030:
  `=IF((X36*(1+Y33/100)/(1+Y15/100)-Y22)<0,0,(...))`, where `X36` is 2029

Neither is wrapped in `IFERROR`. Feed either a missing figure and every
dependent cell reads `#VALUE!`. The posted workbook ships that way: Afghanistan
is the selected country, its debt row is `n/a` from 2021 on, and `Baseline` rows
35, 36, 37 and 40 read `#VALUE!` from 2009 to 2099.

So a country whose WEO series stops reporting before the horizon ends should
produce no projection at all.

## What I found

`_build_macrofiscal_for_fiscal` (and its TypeScript twin `buildMacroForFiscal`)
drops every row with a null `nominal_gdp` or `revenue` *before* the engine sees
it. The engine's last WEO year is therefore the last year that survives that
filter, not the last year in the source.

Ecuador is the clean case. On the April 2026 vintage its rows run to 2029 and
its debt stops at 2025. The workbook would show `#VALUE!` for 2026 onward. The
engine drops the four unreported rows, anchors on 2025, and returns a complete
projection built on a real debt stock of 54.4 per cent of GDP.

Six countries reach a result this way that the workbook would not give:
Ecuador, and on the frozen vintage Afghanistan, Lebanon, Sri Lanka, Syria and
West Bank and Gaza, whose anchors move to 2023, 2023, 2022, 2010 and 2023.

## Why it is arguable rather than simply wrong

The engine is not inventing a number. It is using the last debt figure the WEO
actually published and projecting from there, which is what an analyst would do
by hand, and the alternative is no answer for six countries. It also keeps the
history/projection boundary honest, because the same year drives the chart's
shading: Syria's frozen-vintage boundary is 2010, and drawing 2011-2029 as
observed history would be a chart that lies.

But it is a methodology choice the workbook did not make, it is undocumented,
and it is invisible to the user: nothing on screen says "this projection starts
from 2025 because the WEO stopped publishing your debt after that".

## What I did

Nothing to the rule. I did make the app agree with the engine about what the
anchor is: `readCoverage` was deciding from the raw last row and blocking Syria,
Sri Lanka and Lebanon on the frozen vintage although the engine computes them,
so it now imports `buildMacroForFiscal` and asks the same question the engine
asks. That removes a false block; it does not change the rule.

## What needs a decision

Whether a projection anchored on a year earlier than the country's WEO horizon
should:

- **A.** Keep computing silently, as today.
- **B.** Keep computing and say so, with a per-country note naming the anchor
  year ("the WEO last published Ecuador's debt for 2025; the projection starts
  there"). Reuses the notice surface that already exists.
- **C.** Refuse, matching the workbook exactly, and lose six countries.

CC-6 recommends **B**: it keeps the six countries, and it is the honest-broker
position, since the reader learns the projection rests on an older anchor. It is
Teal's call because it is a methodology-visibility question, not a bug.
