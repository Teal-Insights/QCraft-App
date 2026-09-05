---
title: "Answer five review questions"
description: "A short route from each review question to the supporting evidence."
---

**Review the numerical method, the chosen inputs and the verification scope separately.** Agreement with selected workbook cells supports the implementation. It does not establish that a scenario is a forecast or that an assumption is suitable for a country.

## What does it compute?

**The engine projects a baseline and six climate scenarios through 2099.** Population and productivity feed real GDP. Inflation gives nominal GDP, an interest-rate approach supplies the effective rate, and fiscal recursion gives debt and fiscal balances. Climate GDP effects alter productivity growth and then fiscal outcomes. Follow the [calculation map](architecture.md#the-browser-runs-the-typescript-engine) or the [public entry point](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/index.ts).

## Which assumptions differ from the workbook?

**The Explorer retains the workbook mechanisms and discloses its application choices.** Defaults differ from the workbook's last-saved dashboard. Current refreshes WEO and population inputs, then starts long-run assumptions and additional climate effects after the selected country's usable WEO window. This rolling transition is an Explorer policy extension; Verified retains its frozen profile. Own-series inputs and Discrete Risks are unavailable in the interface. Review the [assumption register](assumptions.md), including the [fiscal rule and floor](assumptions.md#the-fiscal-rule-uses-prior-year-state).

## Who verified what?

**Teal Insights conducted the comparisons reported here.** The [verification matrix](verification.md#each-comparison-has-a-bounded-scope) separates the 147-country baseline evidence, five-country sensitivity evidence, seven Excel edge fixtures and TS/Python comparisons. Historical output rounded to 0.0 does not establish a 1e-12 error bound. No independent IMF certification is claimed.

## How can I reproduce a run?

**Preserve the source commit and input archive alongside the run file.** Follow [source setup](reproduce.md#build-the-explorer-from-an-exact-source-revision), then compare a representative country in both modes. The [offline arrangement](reproduce.md#serve-a-prepared-distribution-without-a-network) preserves the deployed base path. New run JSON stores settings, input revision, calculation policy, input hash and selected timing. It does not embed the country data or pin an engine commit. Older Current imports restore settings with a changed-data/calculation warning; preserve the original packet when its old results matter.

## Where is the code?

**The browser engine is TypeScript and the reference engine is Python.** Their exact [reference source](reference.md) is separate from this main-based docs package. The [architecture page](architecture.md#documentation-and-engine-source-have-separate-identities) explains the three version identities. The repository's main branch still includes the earlier Shiny app and must not be mistaken for the current Explorer source.

**For a discrepancy, send a reproducible case.** Record the mode, country, parameters, source commit, payload checksum, expected workbook cell and observed output. Use the [report template](contributing.md#report-a-numerical-discrepancy).

