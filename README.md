# Q-CRAFT Explorer

**Explore long-term fiscal projections and inspect the assumptions behind them.** Q-CRAFT Explorer is an independent implementation of the IMF Q-CRAFT methodology by [Teal Insights](https://tealinsights.com) and [NatureFinance](https://naturefinance.net). It is not an official IMF product.

[Explorer](https://teal-insights.github.io/QCraft-App/explorer/) · [Companion Guide](https://teal-insights.github.io/QCraft-App/) · [Developer and reviewer docs](apps/qcraft-docs/src/content/docs/index.md) · [Exact engine candidate source](https://github.com/Teal-Insights/QCraft-App/tree/83cab39790a9186c6f468b85bf8221ad52b72731)

**The current application runs in the browser.** The React interface uses the TypeScript engine, with country payloads prepared by the data pipeline. Current mode combines April 2026 WEO with WPP2024 population; Verified mode retains October 2024 WEO and workbook population. Coverage varies by country and series. A list of 175 countries does not mean 175 complete, workbook-verified runs.

> Teal Insights verified baseline parity for 147 of 147 tested countries; climate-scenario parity confirmed for ratio metrics only. Reproduces the IMF Excel workbook.

**Read that badge with its scope.** It describes the retained workbook verification record. It does not certify every parameter combination, updated data vintage or climate level trajectory. The [verification matrix](apps/qcraft-docs/src/content/docs/verification.md) records dates, tolerances, omissions and known failures; the [assumptions register](apps/qcraft-docs/src/content/docs/assumptions.md) explains modeling choices and coverage limits.

## Run the browser application

**Use the data-inclusive setup, not npm alone.** The [reproduction guide](apps/qcraft-docs/src/content/docs/reproduce.md) pins the engine commit, Node/npm versions and the input archive SHA-256. It stages all 350 country payloads before building under `/QCraft-App/explorer/`, then explains how to serve a prepared copy offline. The copy-corrected engine revision and standalone docs are local release candidates until publication is approved.

## Repository map

| Path | Responsibility |
| --- | --- |
| `apps/qcraft-web/` | Current browser application, controls, charts and export/restore |
| `packages/qcraft-engine-ts/` | Browser calculation engine and columnar data adapter |
| `packages/qcraft-engine/` | Python calculation engine and verification counterpart |
| `pipeline/` | Source ingestion, validation, provenance and country payload generation |
| `apps/qcraft-docs/` | Standalone Starlight documentation and pinned API snapshots |
| `apps/qcraft-app/` | Earlier Shiny for Python application, retained as history |
| `verification-logs/` | Historical workbook and sensitivity evidence |

The docs branch starts from the recorded main baseline. Its generated API references intentionally use the newer, separately pinned engine checkout. The [architecture](apps/qcraft-docs/src/content/docs/architecture.md) page explains this separation; newer engine files become present when the approved source release is integrated.

## Documentation and contributions

**Start with the reviewer route for model due diligence.** It links to [assumptions, source data and verification](apps/qcraft-docs/src/content/docs/reviewers.md). Developers can use the [API reference](apps/qcraft-docs/src/content/docs/reference.md) and [docs build recipe](apps/qcraft-docs/README.md). Keep claims tied to source revisions and bounded test evidence.

The repository software uses its existing [MIT license](LICENSE). IMF methodology, source datasets and third-party materials keep their own terms. See [contributing](apps/qcraft-docs/src/content/docs/contributing.md) for the public font and asset policy.
