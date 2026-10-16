# October source-validation fixtures

These fixtures validate source ingestion and the reviewed release ledger. They do not replace or amend IMF engine golden masters.

- `october_coverage.csv` records the accepted all-country source-coverage ledger, including the release-wide shorter-window qualifier.
- `october_macro_oracle.csv` uses original official API numeric strings with independent standard-library Decimal arithmetic for GDP ratios, primary expenditure and same-year effective interest. It includes small/zero-debt economies and missing fiscal observations.
- `october_metadata.csv` copies raw metadata directly from the independently frozen official workbook, including fiscal-year strings and source-method changes.
- `october_source_counts.csv` records the exhaustive independent API/workbook reconciliation and reviewed dense CSV identity.
- `october_numeric_tokens.csv` states the explicit lexical grammar, including observed zero and rejected malformed values.

API SHA256: `46d614d31b38aaf71fd825d9d24e8e6a449ef998558b94f21e65c7dcdedffd24`. Workbook SHA256: `2aa4f70a05931197b41ed7e0202dc56eee8d816858ac14521e4f8f5dbc38696c`.
