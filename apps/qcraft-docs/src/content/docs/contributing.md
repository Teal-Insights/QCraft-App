---
title: "Make a change another analyst can verify"
description: "Scoped contributions, numerical reports and source notices."
---

**A useful contribution explains the behavior it changes and gives the next reviewer a reproducible case.** Keep documentation, data refreshes and numerical changes distinct. Describe the source vintage and commit whenever a claim depends on them.

## Report a numerical discrepancy

```text
Country and data mode:
Explorer source commit and input archive checksum:
Run JSON and parameter changes:
Metric, scenario and year:
Observed output:
Expected workbook value, sheet and cell:
Workbook version and whether Excel recalculated it:
Steps to reproduce:
```

**A fixture comparison does not launch Excel.** Existing golden masters preserve recorded workbook outputs. A proposed change to equations or expected values needs scientific review against the authoritative workbook and a new, documented extraction when appropriate. Do not regenerate fixtures merely to make a test pass.

## Build the docs independently

Use Node 25.9.0 and npm 11.12.1. From `apps/qcraft-docs`, run `npm ci` and `npm run build`. The exact direct versions and full lockfile belong to this package. The browser app does not need to exist in the docs checkout. Generated references read the separate, pinned source root.

**Check what a reader can do.** A reviewer should reach the calculation, workbook differences, verifier and scope, reproduction steps and code in two clicks from the landing page. Check phone layouts and search after a production build, and run the linked examples.

## Respect the existing notices

**The repository's software license is MIT.** Read the [root license](https://github.com/Teal-Insights/QCraft-App/blob/fdcdbfe2164ced3baab8e2a5910857dd85750477/LICENSE) for its actual terms. This documentation does not grant a new license over IMF workbooks, User Guide text, third-party datasets or other source materials. Inter and IBM Plex font files are distributed with their SIL Open Font License texts in the docs assets. Licensed Klim fonts are not bundled.

**Further analytical capabilities need an explicit design and evidence.** Own-series inputs, Discrete Risks and an OECD-relative productivity display remain unavailable in the Explorer. Their inclusion here describes current limits and does not promise a delivery date.

