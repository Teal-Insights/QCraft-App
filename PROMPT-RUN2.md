# Lane 4, Run 2: the skim pass (TEA-948)

Run 1 restructured the course into Modules 0-6. Run 2 is an editorial pass over every module to Teal's clarity standard, which he states as human-centered design for education: a busy expert must be able to read the whole course through the headings and topic sentences alone, then dig in only where useful. Same hard rules as PROMPT.md (this clone only, no push, local commits, style guides binding, quarto render must pass).

## The standard, applied to every .qmd module
1. TOPIC-SENTENCE DISCIPLINE: every paragraph opens with its point in a plain declarative sentence; one point per paragraph. The test, which you run per module and transcribe into MORNING-REPORT.md: extract ONLY the headings and the first sentence of every paragraph; that skeleton alone must teach the module's argument. Rewrite until it does.
2. SIGNPOSTING: each module opens with a two-or-three-line road map ("In this module" pattern); counts are announced before lists ("three exercises: first..."); fast-path markers present ("already know the debt equation? skip to..."); transitions are light one-word connectors.
3. PLAIN LANGUAGE per the Explainer Toolkit: replace-then-name for any term the macro team might not own; jargon budget 3-5 per module; never two undefined terms in a sentence; every big number gets a perspective anchor where one exists.
4. SENTENCES: average around 20 words; break multi-clause sentences; kill filler openers, zombie nouns, hedging stacks. Zero em-dashes, zero banned tics (sweep at the end and report zero hits).
5. DRAFT FOR TEAL BLOCKS: rewrite each of the 25 blocks IN PLACE to best-effort final prose using rules 1-4 and the surrounding context. KEEP the callout marker so Teal can spot them in the rendered book, but each must now read as finished prose he can approve or redline rather than a stub he must compose from.
6. DO NOT change substance: no new claims, no changed parameters or numbers, parity wording and the FADCP/Kahn citation exactly per SHARED/REFERENCE-NOTES.md. This is sentence surgery on a fixed skeleton.

## Definition of done
`quarto render docs/companion-guide` passes; per-module skim-test skeleton transcribed in MORNING-REPORT.md; banned-tics sweep reports zero; DRAFT-FOR-TEAL count unchanged at 25 (rewritten, still marked); commit per module so the diff reads cleanly.
