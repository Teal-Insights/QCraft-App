# FACT-LOCK for content/inputs.md

Every item below is verified against the engine source (`@qcraft/engine`, app source a6313ad7) or the IMF Q-CRAFT User Guide v1.0 PDF (printed page n is PDF page n+1). An edit to `inputs.md` may reword anything but must not change these.

## Structure

- Eleven cards, ids in this order: demography, productivity-start, productivity-end, turning-point, inflation-start, inflation-end, interest, debt-target, fiscal-rule, rigidity, climate.
- Heading shapes: `## [id] Title`, then `### What it is`, `### Why it matters`, `### How it enters the model`, `### What the tool does with it`, `### Read more`, verbatim and in that order.
- Tokens: `{{country}}`, `{{lastWeoYear}}`, `{{firstLongRunYear}}`, `{{turningYear}}`. Do not hard-code 2031, 2032 or 2046: they are the values for the 2031-horizon countries and change for shorter-horizon ones.
- Guide link, always: https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf

## Reference settings (engine DEFAULTS and the Explorer's starting values, the same values; `?preset=teaching` only relabels them)

Demography Medium; productivity start 5.0, long run 1.2, turning point 15 years; inflation start 5.0, long run 3.5; constant nominal interest rate; long-run real rate 1.0 (inactive under nominal); debt target 50 percent of GDP; fiscal rule on; expenditure rigidity 1.0.

## Numbers, endpoints, units

- Demography variants: Low, Medium, High (UN WPP 2024). Medium is the central projection.
- Productivity and inflation ranges as the Explorer shows them: productivity -5 to 15 percent per year; turning point 1 to 70 years; inflation 0 to 50 percent per year; long-run real rate -5 to 15; debt target 0 to 200 percent of GDP; rigidity 0 to 1.
- Logistic path (productivity and inflation): value = start + (end - start) * s^0.5 where s = 1 / (1 + exp(-0.5 * (counter - turning point))); counter counts years from the last WEO year. Steepness ("Rate") fixed at 0.5. At counter = turning point, s = 0.5 and s^0.5 = 0.707, so about 71 percent of the move is done at the turning point year. (engine `internal.ts logisticGrowth`; Guide p.11 says Rate is 0.5 and should not be changed.)
- Inflation's turning point is fixed at 5 years, rate 0.5 (engine `inflation.ts LOGISTIC_TURNING_POINT = 5`). Only productivity's turning point is a user input.
- Inflation is GDP deflator growth. Years through the last WEO year use WEO values.
- Interest approaches, engine names: "Nominal interest rate", "Real interest rate", "Interest-growth differential". Long-run real rate is used only under "Real interest rate"; nominal is then (1 + real rate) times (1 + previous year's inflation) minus 1. Under "Interest-growth differential" the differential stays at its last-WEO-year value and nominal is rebuilt from the previous year's nominal GDP growth. Under "Nominal interest rate" the nominal rate stays at its last-WEO-year value (engine `interestRate.ts`).
- Fiscal rule (engine `fiscal.ts fiscalRuleValueFor`): adjustment = fiscal gap when debt is above target and rising, or below target and falling; zero when flat, exactly at target, or when the target is 0. Rule off: no adjustment; target ignored.
- Rigidity (engine `climate.ts`): primary expenditure = baseline level - (1 - rigidity) * recalibration. 1.0 holds the baseline local-currency level; 0.0 holds the baseline share of GDP; values between blend linearly. Guide p.20: no GDP effect of the cuts is modelled.
- Climate scenarios, six, engine order: Paris, Moderate, Hot, Hot_Adapted, Hot_Unadapted, High. Losses are relative to continued trend warming; Paris can sit below Baseline. Hot is the 90th percentile of the same models whose median is High, so High and Hot are not one ladder. GDP loss enters through labour productivity growth from the first long-run year. Inflation and interest rates are unchanged across scenarios. The fiscal rule does not run again in climate scenarios.
- Debt floor: Baseline debt has a floor at zero; climate paths do not (a sustained surplus takes them below zero).
- Charts run 2023 to 2099. The "long-run assumptions begin" marker is the first long-run year (last WEO year + 1). Uganda, Kenya and 158 other countries: 2031 and 2032. Shorter: AFG, ECU, LBN, ZMB (WEO to 2025), BOL (2026), LKA (2024), MAC (2022). Unsupported in Current mode: DJI, LBY, PRI, WSM, SGP, SOM, SYR, PSE.
- Regression fixture, Uganda at the reference settings (`scripts/numbers-check.mjs`; Current, weo-2026-04-full-horizon-v1, input hash 4bc907945f72...): Baseline 2031 53.29, 2050 50.73, 2099 52.72; Hot 2099 127.77; Hot with rigidity 0.0, 2099 62.16.

## Causal chains (the "How it enters the model" claims)

- Demography feeds employment: working-age population growth is employment growth; employment growth + labour productivity growth = real GDP growth g.
- Productivity start, long run and turning point feed labour productivity growth, so g.
- Inflation feeds prices: real growth + deflator growth = nominal growth; under constant nominal interest it also moves the real rate.
- Interest approach sets r; interest spending = rate times previous debt.
- Debt target and fiscal rule set primary expenditure, so the primary balance pb.
- Rigidity sets primary expenditure under climate scenarios only.
- Climate scenario is an overlay: productivity loss, so g, revenue with GDP, spending per rigidity, then the debt equation.

## Guide page pins (verified in the PDF, 2026-09-06)

| Input | Section II (functional) | Section IV (methodology) | Workbook sheet |
|---|---|---|---|
| Country | II.B "Choosing the Country in the Dashboard, loading the data in the Macro-fiscal worksheet", p.9 | | Dashboard, Macrofiscal |
| Demography | II.B "Demographic assumptions and the Demography worksheet", p.10 | IV.A "Demography and employment", p.26 | Demography |
| Productivity (start, long run, turning point) | II.B "Productivity assumptions and the Productivity worksheet", p.11 | IV.A "Productivity", p.27 | Productivity |
| Inflation (start, long run) | II.B "Inflation assumption", p.13 | IV.A "Inflation", p.28 | Inflation |
| Interest approach | II.B "Interest rate assumptions and the Interest Rate worksheet", p.14 | IV.A "Interest rates", p.30; "Debt dynamics", p.30 | Interest Rate |
| Debt target, fiscal rule | II.B "The fiscal rule assumption and the baseline scenario", p.15 | IV.A "Revenue, primary expenditure, and primary balance", p.28; "Debt dynamics", p.30 | Dashboard, Baseline |
| Climate scenario | II.C "Climate change scenarios" and "Macro-fiscal effects of climate change", p.18 | IV.B "Six climate change scenarios in Q-CRAFT", p.32; "Macroeconomic effects of climate change in Q-CRAFT", p.33; "Fiscal effects of climate change in Q-CRAFT", p.35 | Climate Data, Paris to Hot Unadapted, Output Scenarios |
| Rigidity | II.C "The Expenditure Rigidity parameter", p.20 | IV.B "Fiscal effects of climate change in Q-CRAFT", p.35 | Dashboard, scenario sheets |
| Discrete risks (not a card) | II.C "Discrete Risks and Natural Disasters", p.20 | | Discrete Risks |

Section titles: II "Functional Overview" (II.B "Setting up the baseline scenario", II.C "Generating the climate scenarios"); IV.A "The baseline scenario"; IV.B "Climate scenarios".
