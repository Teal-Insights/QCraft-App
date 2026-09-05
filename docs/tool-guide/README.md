# Explorer companion

Six participant-facing chapters cover the complete tool workflow, model, data policy, twelve settings, interpretation and the official workbook. This is the operating companion for the refreshed tool. It does not claim completion of the longer workshop course or its human pilot.

Run `python3 docs/tool-guide/build.py` from the repository root. The script uses Python's standard library and local official files in `resources/`, identified by `resources.json`. Those unchanged binary resources must be supplied with the release inputs because the repository globally ignores PDF and XLSX files. The generated `site/` goes at `/QCraft-App/guide/`, beside `/QCraft-App/explorer/`. Relative links work in the assembled local/offline site.

Content sources: the official workbook (sheet/cell references beside claims), the provided IMF User Guide (printed/physical page mapping), the implemented Current policy, and the approved workshop completion standard. Source versions and differences are stated to participants. The official site was checked on September5 for download links; WEO releases since October2025 are accessed through the IMF Data portal. No target-participant pilot or Excel-on-Windows trial has been conducted.

Review the generated pages in a browser at laptop and phone widths, check anchors and exact download hashes, and reconcile displayed dates and run instructions against the final build before sealing. Pages are drafts until those checks are complete.
