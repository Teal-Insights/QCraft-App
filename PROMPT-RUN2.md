# Lane 2, Run 2: Assumption provenance + the export packet (TEA-1400)

Run 1 built tabs, charts, and the parameter sidebar in apps/qcraft-web. Run 2 adds the layer that makes the app policymaker-ready, modeled on the LIC-DSF scenario tool: documented assumptions and a one-click export packet. Same hard rules as PROMPT.md (this clone only, no push, local commits, MORNING-REPORT.md, no em-dashes in UI copy). Read SHARED/REFERENCE-NOTES.md first.

Read-only references (NEVER write to them):
- /Users/teal_mac_mini_25/Library/CloudStorage/Dropbox/DataScience/licdsf-scenario-tool: the export-packet pattern. Study how runs, assumptions, rationale, and outputs are packaged (cli/, demo/, docs/, engine/).
- /Users/teal_mac_mini_25/candidates/licdsf-2026-08-18-product-proof: the packaged variant of the same tool.
- /Users/teal_mac_mini_25/Library/CloudStorage/Dropbox/Mac/Documents/QCraft-App/source-materials/2024_IMF-FAD_Uganda-C-PIMA-Summary.pdf: how the IMF presents Q-CRAFT results to policymakers. Your exported report should look at home next to it.

Build, client-side only (static app, no server):
1. Parameter provenance: every parameter displays default vs changed state; a changed value carries an optional one-line rationale note entered inline beside the guidance text.
2. Run manifest: country, data vintage, all parameter values, app version, timestamp.
3. Export packet, one click: (a) a polished print-ready HTML report using the brand theme: title block, baseline and scenario charts, key-numbers table, and an "Assumptions and rationale" annex rendering the manifest plus the user's notes; include print CSS so browser print-to-PDF looks right; (b) CSV of results; (c) a run JSON that reproduces the exact run.
4. Import: load a run JSON, restore all parameters and notes.

Definition of done: the full loop works for Uganda (set params, add rationale notes, export all three artifacts, re-import the JSON and get the identical run); `npm run build` green; MORNING-REPORT.md documents the loop step by step.
