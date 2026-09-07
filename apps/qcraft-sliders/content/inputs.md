# Q-CRAFT inputs, one card each

The page renders one card per section below. Keep the heading shapes exactly:
`## [panel-id] Title`, then the five `###` headings in this order. Text under
each heading is plain Markdown paragraphs; blank lines separate paragraphs.
Tokens the page fills in per country: `{{country}}`, `{{lastWeoYear}}`,
`{{firstLongRunYear}}`, `{{turningYear}}` (last WEO year plus the turning point).
Facts that must not drift are listed in FACT-LOCK.md.

## [demography] Demography variant

### What it is

Which UN population projection the model uses for {{country}}: Low, Medium or High. Medium is the central projection. The variants differ in fertility, so the working-age population grows faster under High and slower under Low.

### Why it matters

Population is the first building block of long-run growth. A smaller working-age population means fewer people employed, slower real GDP growth, and a smaller tax base to carry the same debt. Whoever signs off on a long-run fiscal projection is also signing off on a population path.

### How it enters the model

This input feeds employment. The working-age population growth rate becomes the employment growth rate; employment growth plus labour productivity growth gives real GDP growth, g. Real GDP then scales revenue and the denominator of the debt ratio through the debt equation. The channel chart shows working-age population growth, percent per year.

### What the tool does with it

Through {{lastWeoYear}} the WEO data set the path regardless of the variant. From {{firstLongRunYear}} the tool reads the chosen variant's working-age population by year and uses its growth rate as employment growth. Nothing else in the model changes with the variant: productivity, prices and interest are set separately.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "Demographic assumptions and the Demography worksheet", printed page 10, and Section IV.A "Demography and employment", printed page 26: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Demography.

## [productivity-start] Productivity growth, start

### What it is

Labour productivity growth in {{firstLongRunYear}}, the first long-run year, in percent per year. It is the point the growth path starts from once the WEO projections end.

### Why it matters

For most developing countries this is the catch-up growth assumption. Setting it high says the economy keeps growing fast for a while after the WEO horizon; setting it low says the WEO pace fades quickly. Because the fiscal rule holds debt near its target, an optimistic start shows up mostly as room for spending rather than as lower debt.

### How it enters the model

This input feeds productivity. Employment growth plus labour productivity growth gives real GDP growth, g; real GDP with the price level gives nominal GDP, which is the denominator of the debt ratio and the base for revenue. The channel chart shows labour productivity growth, percent per year.

### What the tool does with it

From {{firstLongRunYear}} the tool moves productivity growth along a logistic (S-shaped) path from this start value toward the long-run value. The path is centred on the turning point; the steepness of the curve is fixed by the workbook at 0.5 and cannot be changed. The start value itself is used only in the first long-run year; every later year is a blend of start and long run.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "Productivity assumptions and the Productivity worksheet", printed page 11, and Section IV.A "Productivity", printed page 27: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Productivity.

## [productivity-end] Productivity growth, long run

### What it is

The labour productivity growth rate the projection settles on, in percent per year. It is the rate that holds for most of the years to 2099.

### Why it matters

Over a seventy-year horizon the long-run rate carries far more weight than the start. One percentage point on this number compounds into a very different economy by 2099, so it deserves the most scrutiny. A useful realism check is the country's productivity level relative to advanced economies: sustained growth well above them implies convergence that history rarely delivers.

### How it enters the model

This input feeds productivity. Employment growth plus labour productivity growth gives real GDP growth, g, and with the price level, nominal GDP. The channel chart shows labour productivity growth, percent per year.

### What the tool does with it

The logistic path runs from the start value toward this value. About 71 percent of the move is complete at the turning point year, and the path is close to this value from about ten years after it. Under a constant real interest rate this input also moves the nominal interest rate only through inflation, not directly.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "Productivity assumptions and the Productivity worksheet", printed page 11, and Section IV.A "Productivity", printed page 27: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Productivity.

## [turning-point] Productivity turning point

### What it is

How many years after {{lastWeoYear}} the productivity path is centred. At the reference value of 15 the centre is {{turningYear}}. A larger value keeps growth near the start rate for longer; a smaller value moves it to the long-run rate sooner.

### Why it matters

It sets how long the catch-up period lasts. Two projections with the same start and long-run rates can differ by a lot of cumulative GDP if one keeps fast growth for thirty years and the other for ten. It is the timing assumption behind the growth assumption.

### How it enters the model

This input feeds productivity through the shape of its path, so real GDP growth, g, and nominal GDP. The channel chart shows labour productivity growth, percent per year.

### What the tool does with it

The tool counts years from {{lastWeoYear}} and evaluates the logistic path with this value as its centre. The turning point is not the halfway year: with the workbook's fixed steepness of 0.5, about 71 percent of the move from start to long run is done by the turning point year. The workbook accepts values from 1 to 70 years.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "Productivity assumptions and the Productivity worksheet", printed page 11, and Section IV.A "Productivity", printed page 27: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Productivity (Turning Point cell).

## [inflation-start] Inflation, start

### What it is

GDP deflator growth in {{firstLongRunYear}}, in percent per year. Years through {{lastWeoYear}} use the WEO deflator whatever this is set to.

### Why it matters

Inflation moves nominal GDP, which is the denominator of the debt ratio and the base for revenue and spending. Higher inflation with an unchanged nominal interest rate makes existing debt cheaper in real terms; with a constant real rate it does not. Which interest approach is in force decides what this input does to debt.

### How it enters the model

This input feeds prices. Real GDP growth plus deflator growth gives nominal GDP growth; the deflator also sets the price level that primary spending grows with. Under the constant nominal interest approach it also changes the real interest rate r. The channel chart shows GDP deflator growth, percent per year.

### What the tool does with it

From {{firstLongRunYear}} inflation follows a logistic path from this start value to the long-run value. Unlike productivity, the timing is fixed: the workbook centres the inflation path five years after {{lastWeoYear}} with steepness 0.5, so the first long-run value already sits part of the way toward the long-run rate.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "Inflation assumption", printed page 13, and Section IV.A "Inflation", printed page 28: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Inflation.

## [inflation-end] Inflation, long run

### What it is

The long-run GDP deflator growth rate, in percent per year. The Guide suggests the central bank's inflation target as the anchor.

### Why it matters

It is the nominal anchor for the whole projection. Under a constant nominal interest rate, higher long-run inflation lowers the real cost of debt and pulls the debt ratio down; under a constant real rate it does not. It is one of the two inputs whose effect flips sign with the interest approach.

### How it enters the model

This input feeds prices, so nominal GDP and the nominal growth term in the debt equation; under constant nominal interest it also moves the real rate r. The channel chart shows GDP deflator growth, percent per year.

### What the tool does with it

The inflation path converges to this value along the fixed five-year logistic and stays there to 2099. Nominal GDP, revenue, primary spending and interest cost all scale with it; real GDP does not.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "Inflation assumption", printed page 13, and Section IV.A "Inflation", printed page 28: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Inflation.

## [interest] Interest-rate approach

### What it is

What is held constant after {{lastWeoYear}} when projecting the effective interest rate on government debt: the nominal rate, the real rate, or the gap between the interest rate and nominal growth.

### Why it matters

Long-run debt is very sensitive to the interest assumption. The three approaches answer different questions. Constant nominal says financing conditions stay as the WEO left them. Constant real says lenders keep the same return above inflation. Constant differential says the relation between borrowing cost and growth holds, which is the assumption that keeps debt dynamics stable by construction.

### How it enters the model

This input feeds the interest path r. The effective nominal rate times last year's debt gives interest spending; the real rate against real growth is the r minus g term in the debt equation. The channel chart shows the nominal interest rate on debt, percent per year.

### What the tool does with it

Constant nominal: the nominal rate stays at its {{lastWeoYear}} value and the real rate moves with inflation. Constant real: the real rate is set to the long-run real rate you enter, and the nominal rate is rebuilt each year by compounding that real rate with the previous year's inflation. Constant differential: the interest-growth differential stays at its {{lastWeoYear}} value and the nominal rate is rebuilt each year from the previous year's nominal GDP growth. The long-run real rate control is active only under the constant real approach.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "Interest rate assumptions and the Interest Rate worksheet", printed page 14, and Section IV.A "Interest rates" and "Debt dynamics", printed page 30: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Interest Rate.

## [debt-target] Debt target

### What it is

The debt-to-GDP level the fiscal rule steers toward, in percent of GDP. It is active only when the rule is on.

### Why it matters

With the rule on, the target is what the Baseline debt path converges to, so most other inputs change spending rather than debt. Raising the target lets debt drift up and frees spending; lowering it forces spending down. This is the number a ministry would tie to its own fiscal framework.

### How it enters the model

This input feeds the rule, so primary spending and the primary balance pb, which enters the debt equation directly. The channel chart shows primary expenditure, percent of GDP.

### What the tool does with it

Each year the tool computes a fiscal gap, the primary balance that would hold debt at the target, and compares debt with the target. When debt is above the target and rising, next year's primary spending is adjusted by the gap; when debt is below the target and falling, spending is loosened by the gap. When debt is between those states, or exactly at the target, nothing is adjusted. The target is approached, not hit exactly. A target of zero switches the rule off.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "The fiscal rule assumption and the baseline scenario", printed page 15, and Section IV.A "Revenue, primary expenditure, and primary balance" and "Debt dynamics", printed pages 28 to 30: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheets: Dashboard (target cell) and Baseline.

## [fiscal-rule] Fiscal rule

### What it is

Whether next year's primary spending adjusts toward the debt target (on) or simply grows with the economy (off).

### Why it matters

The rule is the difference between a projection of what policy would need to do and a projection of what happens if nothing is done. With the rule off, the Baseline shows the unadjusted path: for a country whose last WEO primary balance is a surplus, debt runs down; for one in deficit, debt climbs. Both are useful, but they answer different questions.

### How it enters the model

This input feeds the rule, so primary spending and the primary balance pb in the debt equation. The channel chart shows primary expenditure, percent of GDP.

### What the tool does with it

Rule on: the spending adjustment described under Debt target runs every year. Rule off: real primary spending per person grows with productivity and prices, employment scales it up with the population, and the target is ignored. Climate scenarios take the Baseline spending path as given, so under climate paths the rule has no further feedback. The Baseline debt path has a floor at zero; the climate paths do not.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.B "The fiscal rule assumption and the baseline scenario", printed page 15, and Section IV.A "Revenue, primary expenditure, and primary balance" and "Debt dynamics", printed pages 28 to 30: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheets: Dashboard (rule switch) and Baseline.

## [rigidity] Expenditure rigidity

### What it is

A value between 0 and 1 that says how primary spending responds when climate change makes the economy smaller. It acts only in the climate scenarios.

### Why it matters

It decides who absorbs the climate loss. At 1 the government keeps spending as planned while revenue falls, so the deficit and debt absorb it. At 0 the government cuts spending to keep its share of a smaller GDP, so public services absorb it. The debt difference between the two by 2099 is large for a hot scenario.

### How it enters the model

This input feeds primary spending, so the primary balance pb in the climate overlay's debt equation. The channel chart shows primary expenditure, percent of GDP.

### What the tool does with it

For each climate scenario the tool starts from the Baseline primary spending path. Rigidity 1 holds the local-currency level of that spending, so spending rises as a share of the smaller GDP. Rigidity 0 holds the Baseline spending share of GDP, so the level falls with GDP. Values in between blend the two in proportion. The tool does not model any growth effect of the spending cuts.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.C "The Expenditure Rigidity parameter", printed page 20, and Section IV.B "Fiscal effects of climate change in Q-CRAFT", printed page 35: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheet: Dashboard (rigidity cell); results in the scenario sheets Paris to Hot Unadapted.

## [climate] Climate scenario

### What it is

Which of six temperature pathways the climate overlay applies: Paris, Moderate, High, Hot, Hot adapted and Hot unadapted. Each carries a year-by-year GDP loss for {{country}} relative to a world that keeps warming on trend. The Hot family shares one temperature path and differs in how fast the economy adapts.

### Why it matters

This is the input that turns a fiscal projection into a climate fiscal projection. The gap between the Baseline and a hot scenario is the fiscal cost of climate change the tool can show; the gap between the adapted and unadapted variants is the value of adaptation. High and Hot come from different model runs and are not steps on one severity ladder.

### How it enters the model

This input feeds productivity through the climate overlay: the GDP loss is applied as slower labour productivity growth from {{firstLongRunYear}}, so real GDP growth, g, and nominal GDP are lower. Revenue falls with GDP; spending follows the rigidity setting; the debt equation runs on the result. The channel chart shows real GDP as a percent of the reference run.

### What the tool does with it

For the chosen scenario the tool takes the Baseline growth path and subtracts the scenario's GDP loss through productivity from {{firstLongRunYear}}. Inflation and interest rates are unchanged across scenarios. Revenue keeps its Baseline share of GDP, so it falls in level; primary spending follows the rigidity rule; the fiscal rule does not run again. Paris can sit below the Baseline because the losses are measured against continued trend warming, not against a world without warming.

### Read more

IMF Q-CRAFT User Guide v1.0, Section II.C "Climate change scenarios" and "Macro-fiscal effects of climate change", printed page 18, and Section IV.B "Six climate change scenarios in Q-CRAFT", printed page 32, and "Macroeconomic effects of climate change in Q-CRAFT" to "Fiscal effects of climate change in Q-CRAFT", printed pages 33 to 35: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf. Workbook sheets: Climate Data, the scenario sheets Paris to Hot Unadapted, and Output Scenarios.
