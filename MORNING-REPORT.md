# Lane 4 morning report (TEA-948)

Branch: `feat/lane4-course`. Nothing pushed, no remotes added. Run dates 2026-08-26.

Most recent run first.

## Run 4: the titles, the course map, the preface, the honest broker, and M3's source figures

### Status

Done. Both renders pass: `quarto render docs/companion-guide` exits 0 and `quarto render docs/companion-guide --profile brand` exits 0, both with no warnings and no unresolved cross-references. The brand render is the only one that references `_brand-fonts.css`. The committed PDF is rebuilt from the default render, 84 pages. The banned-tics sweep across the eleven `.qmd` files reports zero em-dashes, zero semicolons and zero hits on the tic list. DRAFT FOR TEAL is back to 25, the two run 3 title callouts having been retired by the new title set.

Seven commits, one per unit of work.

---

### 1. The title set, DRAFT FOR TEAL

All seven built as you specified. The sidebar now reads as a map of what you learn rather than as a list of claims.

| | Title as built | Was |
|---|---|---|
| **M0** | How to use this course | Start here: the analysis you will defend |
| **M1** | What Q-CRAFT does and why it exists | One equation decides the debt path; the rest of the tool builds its three inputs |
| **M2** | The debt equation | You already know the debt equation |
| **M3** | Choosing the parameters | Every parameter is a judgment call you can defend |
| **M4** | A worked example, end to end | Uganda end to end: from assumptions to the Fiscal Risk Statement paragraph |
| **M5** | What the tool can and cannot tell you | Know what the tool cannot tell you |
| **M6** | The capstone | The capstone: your analysis, defended |

**Three consequences worth your eye.**

**M2's old title was the presumption formulation you banned**, in the sidebar, on every page of the book. That one fixes itself.

**M5's title now promises both halves**, which is why the module needed the strengths section in item 4 below. A title that says "can and cannot" and then delivers only "cannot" is a worse position than the old title was.

**M4's file is renamed** from `m4-uganda-end-to-end.qmd` to `m4-worked-example.qmd`. I flagged in run 3 that the table of contents was the last place a reader in Addis met Uganda before the framing that explains why it is the worked case. The URL was the other place. Every reference in `_quarto.yml` and the preface moved with it. The other six filenames are unchanged, because they were already neutral and renaming them would break links for no gain.

**Cross-references did not need touching.** Every internal reference in the course goes through `@sec-m0` to `@sec-m6`, which Quarto renders as "Chapter N". No title text was hard-coded anywhere in prose. The preface's organisation table is the one place titles appear as text, and it carries the new set.

---

### 2. The course map, redesigned, with the screenshots

The Mermaid version is gone. `scripts/build_course_map.py` hand-authors the SVG, on the course palette and the bundled open faces, and emits a variant per module plus the Quarto include that places it.

**The chain, left to right:** country data and your assumptions **build** the three numbers the equation needs (growth *g*, the interest rate *r*, the primary balance *pb*, each with its suppliers named underneath) which **feed** the debt equation, shown with the identity itself, which **makes** the debt paths, drawn as a small fan so the last node reads as a chart at a glance. Warming scenarios sit below the chain on a dashed teal bus that enters growth and the primary balance and never touches the equation, with the sentence "Warming lowers growth, and weakens the primary balance when spending is rigid. It never enters the equation directly." printed beside it.

**What each module lights**

| Module | Lit | Caption |
|---|---|---|
| M0 | debt paths | the destination, so the course has a visible end |
| M1 | *g*, *r*, *pb*, the equation | the middle of the chain |
| M2 | the equation | one node, and the module never leaves it |
| M3 | inputs, *g*, *pb* | the start of the chain and the two numbers the controls move |
| M4 | debt paths | the output end |
| M5 | warming scenarios, debt paths | the two ends of the climate channel |
| M6 | everything | the capstone runs the chain end to end |

**Screenshots, in `review-screenshots/`.** Rendered with `headless_shell` (the Chromium shell Playwright ships, not a Chrome install) over the built book, at 1500 by 1000 at 2x. Each figure appears twice: cropped to the figure, and again in its page so you can judge it at reading size.

| Figure | In page |
|---|---|
| `course-map-m0.png` | `course-map-m0-in-page.png` |
| `course-map-m1.png` | `course-map-m1-in-page.png` |
| `course-map-m2.png` | `course-map-m2-in-page.png` |
| `course-map-m3.png` | `course-map-m3-in-page.png` |
| `course-map-m4.png` | `course-map-m4-in-page.png` |
| `course-map-m5.png` | `course-map-m5-in-page.png` |
| `course-map-m6.png` | `course-map-m6-in-page.png` |

**What the iteration changed.** Three passes, each one driven by looking at a render rather than at the source.

1. The first version was drawn at 1240 units wide and placed in Quarto's `.column-page`. In a book with a sidebar and a table of contents, that class overlaps both: the figure ran under the navigation on the left and the contents on the right. Dropped the class and resized the drawing to 952 units, which sets at about three quarters size in the body column.
2. At 952 units the first attempt put the pill supplier lines on one line each and the labels came out too small to read. Pills grew to two lines, type went up a step, and the panel gutter widened to 20 units so the warming bus stopped looking as though it ran through the interest-rate pill.
3. The verb on the last arrow was "makes" at a gap of 44 units, which touched the Debt paths box. Gaps went to 52 and the equation box gave up 14 units to pay for it.

**One thing the brief did not anticipate: the PDF.** A three-to-one horizontal figure placed across a 6.5 inch text column is two inches tall, and five tiers of text in two inches sets at about five point. The generator therefore emits a second layout from the same node content: the same chain folded onto four rows, 680 units wide, which sets its labels at ten point in print. The HTML gets the horizontal chain you asked for; the PDF gets the folded one. Page 16 of the committed PDF is the M1 instance if you want to check it.

---

### 3. The preface, rebuilt

Five sections replace the four-paragraph opener. The skim skeleton, headings plus first sentences, is at the end of this section.

| Section | What it now does | What was there before |
|---|---|---|
| **What Q-CRAFT is** | The IMF Fiscal Affairs Department's tool, what it takes in and puts out, built for FAD's climate technical assistance, the September 2023 Uganda mission as the example, and Uganda's FY 2024/25 Fiscal Risk Statement as where the results end up. Then the Explorer, and the line that the economics is the IMF's while the interface, the data loading and the record are ours. | One sentence: "an open-source Python reimplementation of the IMF's Quantitative Climate Risk Assessment Fiscal Tool." A reader who did not already know what Q-CRAFT was learned nothing. |
| **The questions it answers** | Four questions in the register they arrive in, from "where is our debt ratio in 2050" to "which assumption moves the answer most", followed by the line that none of them is a forecast and each is a difference between two projections. | Absent. |
| **Who this is for** | The same three audiences, tightened to one paragraph with a reason attached to each. | Two sentences, four groups, no reasons. |
| **Where this course stands** | The honest-broker stance: what the tool does, why it exists, what it leaves out; that practitioners disagree and some judge the damages conservative; the User Guide's own exclusion list with a page citation; that outputs read as a lower bound under those channels; and that this is the first in a series. | Absent. |
| **What you will be able to do** | Three numbered objectives: run it, understand what you are doing, interpret the output with its strengths and limits. | Two objectives in a sentence. |

**What survived unchanged:** the colophon on typography and reproducibility, the User Guide deference note, the initial-version callout, the Try the App callout, the glossary and references pointers, the appendix pointer, and the multi-country exemplification paragraph from run 3. The organisation table carries the new titles and a new row description for M4 and M5.

**One addition to the colophon**, three sentences long: the figures are built from the repository by two named scripts. It belongs there because the reproducibility claim now covers the figures as well as the type.

**The preface skim skeleton**

```
# Preface
## What Q-CRAFT is
    Q-CRAFT is the IMF Fiscal Affairs Department's tool for projecting public finances under climate warming.
    The Fiscal Affairs Department built it for its own climate technical assistance, and that is where it is used.
    This course teaches the tool through Q-CRAFT Explorer, an open-source Python reimplementation of the IMF's Excel workbook.
## The questions it answers
    Q-CRAFT answers a narrow set of questions, and it answers each one by comparing two runs of the same model.
    None of those is a forecast.
## Who this is for
    This course is for anyone who has to run, interact with, or otherwise understand this class of fiscal projection tool.
## Where this course stands
    This guide teaches what the tool does, why it exists, and what it leaves out.
    Practitioners disagree about Q-CRAFT, and some judge its damage estimates conservative.
    Knowing a model's limits is part of knowing the model.
## What you will be able to do
    Three objectives, weighted equally.
    The first objective takes an afternoon.
## How the course is organised
    Seven modules, each built around something you can do at the end of it.
    The tool covers most of the world, so the examples move country by country and the mechanism picks the country.
    Start at Module 0.
## What this course defers to
    This is an educational companion to the IMF's User Guide (Tim and Rahman, 2024).
## Colophon
    This course is open source under the MIT license, and it builds completely from what is in its repository.
    Teal Insights also publishes a house edition of the same content.
    The figures are built from the repository too.
```

---

### 4. M5, carrying the honest-broker load

**Strengths first, in a new section.** Four of them, each traced to the brief the tool was built against: it isolates one channel and models it from data; it runs on data every country already has; it is comparable across countries; and it produces the shape a fiscal risk chapter needs. The closing paragraph says the limitations in the rest of the module follow from the same brief, which is what stops them reading as oversights.

**I read the User Guide rather than citing from memory.** `2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf` in the Dropbox source-materials folder, pages 5 and 6. Three quotations are now in the module, verbatim and cited:

- the set-up is "essentially a partial-equilibrium" one (p. 5)
- the results "do not account for the potential impacts of climate change induced natural disasters, sea-level rise risks and other environmental risks, rendering the outcomes conservative" (p. 5)
- Q-CRAFT "is not a forecasting model nor a general equilibrium model of the economy" (p. 6)

The second one is the useful find. The conservatism claim is not an inference the course is making about the IMF's tool. It is the tool's own documentation, in its own voice, and that is a much stronger position to write from.

**The exclusion table gains a citation column**, one page number per row, all six of them from pages 5 and 6.

**Two new paragraphs after the table.** That some practitioners judge the damages conservative beyond the exclusion list, with the reason stated as an empirical one: the estimates are fitted to historical variation in temperature and carry no information about ranges the world has not seen. And that partial equilibrium is a limit of a different kind, because its sign is not obvious. It flatters a consolidation scenario and it also leaves out whatever growth an adaptation programme would buy. Keeping it out of the exclusion table preserves the table's one useful property, which is that every row runs the same direction.

---

### 5. M3's source-data figures

Five figures, built by `scripts/build_parameter_context.py` from `data/processed/*.parquet`, the same inputs the Explorer runs on. The script is committed; the Parquet is not, because the repository already ignores it, and the script says so and fails with a clear message if the directory is absent.

| Figure | Parameter | What it shows |
|---|---|---|
| `param-country-context` | Country selection | Debt-to-GDP for Ethiopia, Thailand and Uganda, 2001 to 2029, forecast years shaded |
| `param-demography-variants` | Demography variant | Working-age population under Low, Medium and High, indexed to 2024, log scale, one panel per country |
| `param-rigidity-record` | Expenditure rigidity | Revenue and primary expenditure as shares of GDP, so the reader can see whether spending tracked the economy |
| `param-productivity` | (not exposed in V1) | Growth in output per worker, five-year trailing average, against the 1.2 percent long-run default |
| `param-inflation` | (not exposed in V1) | GDP deflator growth, history and WEO forecast, against the 3.5 percent long-run default |

**Screenshots** in `review-screenshots/`: `param-country-context.png`, `param-demography-variants.png`, `param-rigidity-record.png`, `param-productivity.png`, `param-inflation.png`, each with an `-in-page` sibling.

**One consistent trio of countries**, Ethiopia, Thailand and Uganda, so the reader learns one cast rather than five. Ethiopia's working-age population is still climbing, Thailand's has turned down, and Uganda is the worked case.

**The debt target gets no figure, and the text says so.** It is a policy choice rather than a published series. Inventing a figure for it would have been the wrong kind of completeness, so the section points at the country figure and at whatever anchor the reader's own fiscal framework already sets. The fiscal rule is the same case and gets the same treatment.

**Colour.** Country series use the first three slots of the validated categorical palette, which clear every all-pairs gate on a white surface (worst CVD deltaE 9.2, worst normal-vision deltaE 24.0). The three UN variants are ordered rather than categorical, so they use a single-hue blue ordinal ramp, monotone in lightness with the light end at 2.11:1 against the surface. Aqua sits below 3:1 on white, which obliges visible labels rather than a legend, so every series carries a direct label at its line end with collision handling.

**The note you asked for** sits in a callout in the module: every figure comes from the same Parquet the Explorer runs on, and the Explorer is gaining interactive context panels that do the same job at the point of decision.

**Two figures needed a second pass after looking at them.** The demography panels were on a linear axis, which clipped Ethiopia's High variant at 374 and Thailand's Low at 24; a log scale with ticks at 25, 50, 100, 200 and 400 fits both and makes "doubling" and "halving" read symmetrically. The inflation panel had Ethiopia's series escaping the plot area entirely, so every panel now clips to its own area and the reference-line labels sit on a white relief.

---

### 6. The tone sweep

Five presumption formulations, all fixed. The whole-course sweep found no "obviously", no "simply", no "of course", and no "just".

| Where | Was | Now |
|---|---|---|
| M0, In this module | "You will calibrate what you already know" | "You will calibrate your own starting point" |
| M0, question 1 answer | "you are carrying the most expensive misconception in this material" | "that is the most expensive misconception in this material" |
| M1, Excel section | "Every Ministry of Finance has it and every economist knows how to use it" | "Every finance ministry has it, and putting it in front of someone costs no training budget" |
| M1, fast-path marker | "If the last two sentences were already obvious, skip it" | "Skip it if that arithmetic is part of your working week" |
| M2, opener | "one line of arithmetic that has been in every debt sustainability analysis you have ever read" | "one line of arithmetic that sits under every debt sustainability analysis" |

**The rule I applied to the fast-path markers**, because they were where most of the risk sat: a fast-path marker states a condition the reader answers about themselves ("skip it if that is part of your working week"), never a fact the author asserts about the reader ("you already know this"). M2's and M3's markers already worked that way and did not need touching.

**Condescension in the other direction** turned up nothing to fix. There is no flattery, no "as a busy expert", and no assumed seniority.

---

### 7. Things to check before Sept 1

**The country-coverage number, and I did not change it.** Three figures are in circulation and at most one of them can be right.

- M1 says the Excel workbook "covers 197 economies". The User Guide, page 5, says Q-CRAFT projects "for 171 economies".
- M3 says "Q-CRAFT Explorer currently covers 197 countries". The bundled Parquet has 197 countries in macrofiscal, demography and climate, but only 176 in productivity, so 175 countries appear in all four and only those 175 can be selected.

Both look like errors and both are one-line fixes. I left them alone because your brief froze substance and verified claims, and because the source-of-truth hierarchy in AGENTS.md puts the User Guide above my own reasoning without telling me which of the two numbers you intend the sentence to describe. The fixes, if you want them: M1's "covers 197 economies" becomes "covers 171 economies"; M3's "currently covers 197 countries" becomes "currently offers 175 countries, those with complete coverage across all four input datasets".

**The M1 opening section still argues against Excel at some length.** It survived every pass because nothing in any brief has touched it, but under the new title ("What Q-CRAFT does and why it exists") it reads as the second thing the module says, and the preface now covers what Q-CRAFT is and why it exists rather better. Worth deciding whether that section shrinks.

**Zambia is still `TIMEOUT` in `verification-logs/parity_results.csv`** and it is still the country the M4 independent problem sends people to. Flagged in run 3, unchanged since, and it needs one person to load it in the Explorer once before a room tries it.

---

### Marker inventory after run 4

| Module | DRAFT FOR TEAL | SCREENSHOT-TODO | WIDGET-TODO | Other TODO |
|---|---|---|---|---|
| M0 | 3 | 0 | 0 | 0 |
| M1 | 1 | 1 | 1 | 0 |
| M2 | 4 | 1 | 1 | 0 |
| M3 | 5 | 1 | 1 | 0 |
| M4 | 6 | 2 | 0 | 1 |
| M5 | 4 | 0 | 0 | 1 |
| M6 | 2 | 0 | 0 | 2 |
| **Total** | **25** | **5** | **3** | **4** |

DRAFT FOR TEAL was 27 at the end of run 3. The two title-amendment callouts in M0 and M1 are gone, retired by the new title set, and the set is staged here instead. No new ones were added.

---


## Run 3: generalize the address, and the dual-skin typography

### Status

Done. Both renders pass: `quarto render docs/companion-guide` exits 0, and `quarto render docs/companion-guide --profile brand` exits 0. HTML and PDF both build, no warnings, no unresolved cross-references, and the committed PDF is rebuilt from the default render. The banned-tics sweep is at one deliberate hit, the M1 title's semicolon, which is your wording. DRAFT FOR TEAL moves from 25 to 27, the two new ones being the title-amendment callouts you asked for.

Fourteen commits, one per unit of work.

---

### 1. The M0 title amendment, and the M1 title amendment

Both are amendments to titles you approved. Both are built with the line your amendment specified, both carry a DRAFT FOR TEAL callout under the title in the rendered book, and both callouts point here.

**M0. Built with: "Start here: the analysis you will defend"**

Was "Start here: what you will walk into your minister's office with", and before run 2 it was the Permanent Secretary's office. The office had to go, because the course now addresses ministries that do not share an org chart, and because your amendment says the deliverable is defended to the senior officials who sign it off rather than delivered to a named desk.

| | Candidate | What it buys |
|---|---|---|
| **A (built)** | Start here: the analysis you will defend | Names the performance. "Defend" is the verb the whole course is built on and it recurs in M3, M4 and M6. |
| **B** | Start here: what you will have to defend, and to whom | Keeps the audience in the title without naming an office. Longer, and the "to whom" is answered in the first paragraph anyway. |
| **C** | Start here: the document you will be asked to stand behind | Concrete about the artefact rather than the act. Reads slightly more anxious, which may be right for a risk document. |

**M1. Built with: "One equation decides the debt path; the rest of the tool builds its three inputs"**

Was "One equation decides the debt path, and seven modules feed it".

| | Candidate | What it buys |
|---|---|---|
| **A (built)** | One equation decides the debt path; the rest of the tool builds its three inputs | Your wording, verbatim. One caveat: the semicolon is the only hit in the banned-tics sweep, because `style-guide-writing-AI.md` rule 9 treats a semicolon as the em-dash tic wearing a different hat. It arguably earns its place here as a true antithesis. |
| **B** | One equation decides the debt path. The rest of the tool builds its three inputs. | Same words, two sentences, no semicolon. Clears the sweep and loses nothing. This is the one I would pick. |
| **C** | Three numbers decide the debt path, and one equation combines them | Leads with the three, which is the thing the module is now organised around. Slightly weakens "one equation decides", which is the line M2 and M6 call back to. |

**M4's title is not amended, and it may need to be.** It still reads "Uganda end to end: from assumptions to the Fiscal Risk Statement paragraph", which is the approved line, and your amendments named only M0 and M1 for title work. I did not extend the amendment on my own. The module now opens by saying Uganda is the worked case because its numbers are checkable, the faded problems run on Ethiopia and Zambia, and a "Now do your own country" callout sits between them. The one place a reader in Addis still meets Uganda before any of that framing is the table of contents. If that fails your test, the candidate is "A worked case end to end: from assumptions to a fiscal risk paragraph", and it is a one-line change.

---

### 2. The terminology sweep

Counts are over the eleven `.qmd` files, measured against `5da84ef`, the run 2 tip.

| Term | Before | After | Where the survivors are |
|---|---|---|---|
| "minister", "minister's office" | 7 | 1 | The M0 title callout, quoting the old title back to you |
| "Permanent Secretary", "PS" | 0 | 1 | Same callout, same reason |
| "shilling", "shillings" | 8 | 1 | The M4 model write-up, which is the Uganda worked case and should say shillings |
| "MoFPED" | 4 | 1 | M4, with a one-line gloss, per your rule for the worked case |
| "Climate Finance Unit", "macro team" | 3 | 0 | Gone. M0's path table now routes by what the reader knows, not by which unit they sit in. |
| "seven modules" | 21 | 3 | The M1 title callout, the widget TODO, and the one-line architecture aside |
| The word "Uganda" | 80 | 56 | 35 of the 56 are in M4, which is the worked case |

**What replaced the named office.** The capstone is now defended to "the senior officials who sign the document off" (M0, M6). The question in M2 arrives "from senior officials". The thirty-second answer in M5 is given to "the senior official who will have to defend it". The M3 challenges dropped the office entirely, because the challenge works without one.

**What replaced the reader's assumed document.** The capstone deliverable is "a two-paragraph draft in the register of your ministry's fiscal-risk documentation. In the worked example that document is Uganda's Fiscal Risks Statement."

**Where Uganda deliberately stays.** Data, verification claims, the worked case, and every published figure. The FY 2024/25 Fiscal Risk Statement is still the model document in M0 and M4, the C-PIMA workshop is still the provenance of the 47.5 and 66 percent figures, and Uganda is still named as the golden-master verification country. Nothing was scrubbed.

---

### 3. Multi-country exemplification

The mechanism picks the country, not the other way round. Current spread:

| Country | Where | What it is there to teach |
|---|---|---|
| **Ethiopia** (11) | M1 demography, M3 demography exercise, M4 completion problem | A working-age population still climbing through the century. Paired against Thailand so the variant control has a visible effect in both directions. |
| **Thailand** (4) | M1 demography, M3 demography exercise | A working-age population that has already turned down. The contrast case. |
| **Vietnam** (1) | M1 productivity | Convergence. The logistic curve is abstract until you put a catch-up economy on it. |
| **Zambia** (4) | M1 interest rates, M2 second run, M4 independent problem | An interest-growth differential that runs the wrong way, and the concessional-to-commercial transition that produced it. |
| **Bangladesh** (2) | M1 climate, M5 exclusions | High exposure on the modelled temperature channel, and the clearest case of what the channel leaves out, since sea-level rise is not in the model. |
| **Uganda** (56) | M4 worked case, plus published figures elsewhere | The verification country. Every number quoted from it is in a published document. |

The early win in M1 now runs on the reader's own country, with Uganda offered as the run they can check against a published result. The M2 predict-observe-explain runs on their country, then on a commercial borrower so the sign of $r$ minus $g$ flips in front of them. The M6 capstone defaults to their country and steers away from Ethiopia and Zambia, which the faded problems already used.

One thing to check before Sept 1: in `verification-logs/parity_results.csv`, Ethiopia, Thailand and Vietnam are `PARITY_PASS`, and **Zambia is `TIMEOUT`** and Bangladesh is `PYTHON_ERROR`. Those are verification-harness results rather than proof the app fails, and neither country is used for an exercise that depends on a checked number. Zambia is the independent problem, though, so someone should load it in the Explorer once and confirm it runs before a room full of people tries it. Bangladesh is prose only.

---

### 4. The intuition map

The "Seven modules" node is gone. It named a count where every other node named a function, so the map taught the repository's architecture rather than the economics.

The chain in all seven modules is now: country data plus your assumptions, manufactured into growth $g$, the interest rate $r$, and the primary balance $pb$; climate scenarios move $g$, and $pb$ through rigidity; the equation turns the three into debt paths; the paths become your write-up. Each module lights its own nodes and carries its own caption.

**M1 was rebuilt on that chain**, which was the larger job. The seven-module diagram and the seven-row module table are gone. Growth, the interest rate and the primary balance are now the three sections, and every mini-diagram and paragraph of substance survives underneath the number it feeds. The self-check answers name numbers instead of modules. "Seven modules" survives as a one-line architecture aside linking to the engine package.

**Cross-lane consequence.** The lane 2 widget was specified as `seven-modules-to-one-equation`. The WIDGET-TODO anchor in M1 is now `three-numbers-to-one-equation` and says the widget has to be rebuilt on the three-inputs chain before it is embedded. Same binding correction, and lane 2 should see it.

---

### 5. Typography: two skins, and the reproducibility claim verified

**Bundled, with licences.** `docs/companion-guide/fonts/open/` carries Inter (Regular, Italic, SemiBold, Bold), IBM Plex Serif (Regular, SemiBold, Bold) and IBM Plex Mono (Regular, Italic, Bold) as woff2, 852 KB in total, each family with its SIL Open Font License text beside it. `fonts/open/README.md` records the release each file came from and its SHA-256, so the bundle can be re-verified rather than trusted.

**Self-hosted.** The Google Fonts `@import` is out of `_custom.css`, replaced by ten `@font-face` declarations pointing at the bundled files. `fonts/` is registered as a Quarto project resource so it is copied into `_book/`.

**One thing the brief did not anticipate.** Removing that `@import` was not enough. Flatly is a Bootswatch theme, and Bootswatch compiles its own `@import` of Lato from `fonts.googleapis.com` into the top of the bundled Bootstrap stylesheet. Every page was still calling a font CDN. `_theme.scss` sets `$web-font-path: false`, which suppresses it, and points Bootstrap's own component stacks at the same two-tier stacks the prose uses.

**The stacks**, as CSS variables in `_custom.css`:

```css
--qc-font-sans:    "Söhne", "Inter", system-ui, sans-serif;
--qc-font-display: "Tiempos Headline", "IBM Plex Serif", Georgia, serif;
--qc-font-mono:    "Söhne Mono", "IBM Plex Mono", monospace;
```

Display serif on `h1`, `h2` and the book title; sans on body and `h3` down; mono on code. The hierarchy reads the same in both skins.

**The brand profile.** `_quarto-brand.yml` does one thing: it adds `_brand-fonts.css`, which declares Söhne, Söhne Mono and Tiempos Headline at `/fonts/klim/`. No Klim file is in the repository. The default render never references the brand stylesheet, and where the Klim files are absent every declaration fails to load and each stack falls through to the bundled open face.

One deployment detail: Quarto rewrites the leading slash. The source says `/fonts/klim/soehne-web-buch.woff2`, and the copy in `_book/` says `fonts/klim/soehne-web-buch.woff2`, resolved against the book root. That is Quarto normalising site-root paths so a book works under a subdirectory, and it means a licensed deploy must place the Klim files at the book root rather than at the domain root. The file names follow the Klim web kit convention and a deploy should check them against the kit it was issued.

**The claim, and what verifies it.**

| Claim, as written in the README and the colophon | How it was checked | Result |
|---|---|---|
| Default render passes | `quarto render docs/companion-guide` | exit 0, HTML and PDF |
| Brand render passes | `quarto render docs/companion-guide --profile brand` | exit 0, and the page links both `_custom.css` and `_brand-fonts.css` |
| The default render never references the Klim skin | `grep -c brand-fonts _book/index.html` | 0 |
| No Klim font file is in the repository | `git grep -il "soehne\|söhne\|tiempos" -- '*.woff2' '*.otf' '*.ttf'` | no matches |
| No Google Fonts reference in the course | `git grep -in "fonts.googleapis\|fonts.gstatic" -- docs/` | no matches |
| No font CDN call in the built site | grep over every built `.html` and `.css` for `fonts.googleapis`, `fonts.gstatic`, `use.typekit`, `fonts.bunny.net` | zero hits |
| Every open `@font-face` resolves to a file that exists | parsed every `url()` in the built CSS and stat'd the target | 10 of 10 present |
| Klim declarations degrade rather than break | same parse under the brand profile | 9 of 9 absent, each stack falls through |

**Prose.** A "Typography and reproducibility" section is in the repo README, and a "Colophon" section closes the preface. Both say the same three things: the course is MIT and builds completely with the bundled open fonts, the Teal Insights house edition uses licensed Klim faces where the licence permits, and anyone can reproduce everything with the open stack.

---

### Cross-lane findings

1. **`apps/qcraft-app/www/styles.css` line 3 still imports Inter from Google Fonts.** Same defect as the course had, in the artefact ministries will actually open, and it will fail in a network that blocks the CDN. I did not touch it, on the same reasoning run 1 gave for `app.py`: it is another lane's file and editing it risks a conflict. The fix is to delete the `@import` and point the app at self-hosted copies of the same files now sitting in `docs/companion-guide/fonts/open/inter/`.
2. **`apps/qcraft-app/app.py` still says NGFS in six places.** Unchanged from run 1's report and still worth fixing before Sept 1.
3. **The lane 2 widget spec changed under it.** See section 4.

### Things for you to decide

Run 1's open items 1, 2, 4 and 5 and run 2's item 1 all still stand. New or changed:

1. **The two title amendments and the M4 title question**, all in section 1.
2. **MathJax is still a CDN call.** The built pages load MathJax and a polyfill from `cdn.jsdelivr.net` and `cdnjs.cloudflare.com`, which is Quarto's default math engine. Fonts are now fully local; equations are not. I narrowed the colophon wording to claim exactly what is true (the same three faces offline, and no font fetched when a reader opens a page) rather than claim a fully offline page. Self-hosting MathJax is a separate decision with a real repository-size cost, and it was outside this brief.
3. **The M2 perspective anchor changed.** It was "for Uganda, 1.4 percent of GDP is on the order of the annual budget for a mid-sized ministry", which run 2 flagged as unverified. It is now the same 1.4 percent set against a stated revenue ratio, so it is arithmetic rather than a claim, and it works for any country. That is a substance-adjacent edit in a run whose brief froze substance, and it is the only one. Say the word and it reverts.
4. **Ethiopia's debt target in the M4 completion problem is left open on purpose.** The task says to use Ethiopia's own fiscal anchor if the learner can establish one and 50 percent of GDP if not. I could not verify a legislated Ethiopian debt anchor and would not assert one. Leaving it open is defensible pedagogy, since finding out whether your country has an anchor is part of the job, but it is a choice you should see.

### Not done, and why

- **The M4 title.** Argued above. Your amendments named M0 and M1, and titles are approved artefacts, so I staged the option rather than taking it.
- **The app and the widgets.** Cross-lane, reported rather than edited.
- **Screenshots.** The five SCREENSHOT-TODO markers are unchanged and no screenshot was fabricated. The M1, M2, M3 and M4 markers still name Uganda, which is correct: they illustrate the worked case.
- **The 197 versus 175 country-count disagreement.** Still untouched, still needs a number changed, still yours.

### Commits

```
b6263c1 docs(guide): bundle the open faces and self-host them, no CDN
349b045 docs(README): typography and reproducibility, the two skins and what each needs
681baad docs(guide): rebuild the intuition map on the three numbers the equation needs
55c0d36 docs(guide): name the reader in the preface, spread the examples, add the colophon
5501e9f docs(guide): M0 addresses any ministry, and its title names the performance
87fd33b docs(guide): M1 teaches the three numbers, not the seven modules
c43fe87 docs(guide): M2 loses the named office, the shillings and the unverified anchor
ca090f0 docs(guide): M3 sets parameters for the reader's country, not for Uganda
9b01f6c docs(guide): M4 is a worked case, and the faded problems leave Uganda
992ea65 docs(guide): M5 and M6 drop the named office and default country
4cb60c8 docs(guide): break the preface list into sentences, no semicolons
2d3f8ba docs(guide): rebuild the committed PDF after run 3
1064d81 docs(guide): stop the Bootswatch theme fetching Lato from Google Fonts
70806aa docs(guide): rebuild the committed PDF from the default render
```

---

## Run 2: the skim pass

### Status

Done. `quarto render docs/companion-guide` passes clean (exit 0, no warnings, no unresolved cross-references), HTML and PDF both build, and the committed PDF artifact is rebuilt. The banned-tics sweep reports zero hits across all eleven `.qmd` files, down from 60. The DRAFT FOR TEAL count is unchanged at 25, and every one of them has been rewritten in place as finished prose with its marker kept.

One commit per module, so each diff reads as one editorial decision.

### The skim test, per module

The test: extract only the headings and the first sentence of every paragraph, and check that the skeleton alone teaches the module's argument. Tables, lists, code blocks and block quotes are excluded, which is the strict version. Transcribed below, generated mechanically from the committed files.

### m0-start-here.qmd

```
# Start here: what you will walk into your minister's office with
    **In this module**
    You will see the deliverable the whole course builds toward, so you can judge every later module against it.
## Fast path
    Short on time?
## The deliverable already exists, and Uganda published it
    Uganda has already published the document this course teaches you to write.
    That section came out of a five-day workshop.
    You will produce two things by the end of the course:
    That packet is the capstone.
## This course defers to the User Guide
    The IMF's User Guide (Tim and Rahman, 2024) remains the authoritative methodology reference.
## By the end of this module you can
## Where you are in the course
    Only the destination is lit, because that is the only part you need to hold right now.
## Self-assessment: which of these describes your Monday?
    Three rows, one answer each: long-term fiscal projection, climate-fiscal analysis, and the tool itself.
    **On long-term fiscal projection:**
    **On climate-fiscal analysis:**
    **On the tool itself:**
    Write your three answers down.
## Three questions before you start
    Three questions follow, and they check which intuitions you are carrying in rather than what you have memorised.
## DRAFT FOR TEAL: concept-inventory question 1 (interest-growth differential)
    **Question.** A country's government runs a primary balance of exactly zero: revenue equals non-interest spending, to the shilling.
## Answer
    **(c) Rise.** Debt grows at the interest rate.
    If you picked (b), you are carrying the most expensive misconception in this material: that a zero primary balance stabilizes debt.
    If you picked (a), you may be thinking of the deficit rather than the ratio.
## DRAFT FOR TEAL: concept-inventory question 2 (expenditure rigidity)
    **Question.** In Q-CRAFT Explorer you set expenditure rigidity to 1.0 and run a climate scenario.
## Answer
    **(b).** Rigidity 1.0 means spending is sticky.
    If you picked (a), you have the scale inverted.
    If you picked (c), you have merged two separate controls.
## DRAFT FOR TEAL: concept-inventory question 3 (what the output is)
    **Question.** Your Q-CRAFT run shows debt-to-GDP at 66 percent in 2099 under the Hot scenario against 47.5 percent in the baseline.
## Answer
    **(b).** The number that survives scrutiny is the *difference between two runs of the same model*, stated with its assumptions attached.
    Answer (a) treats a 2099 projection as a prediction.
    Answer (c) converts a debt-ratio gap into a cost figure, which it is not.
    The 47.5 and 66 percent figures come from the September 2023 IMF workshop with MoFPED staff, reported in the C-PIMA high-level summary (IMF, 2024).
## Pick your path
    The three paths cover the same tool.
    @sec-m2 exists for Path A.
    Every module carries a fast-path marker near the top, telling you the shortest useful route through it.
## A note on time
    Budget three to four times whatever you think this will take.
## Wrapper: what you should have now
    **On your desk this week:** open Uganda's Fiscal Risk Statement FY 2024/25 to page 13 and read Section III.
```

### m1-how-qcraft-thinks.qmd

```
# One equation decides the debt path, and seven modules feed it
    **In this module**
    You will run a full Uganda projection in ten minutes, before anything is explained.
## Fast path
    Short on time?
## By the end of this module you can
## Where you are in the course
    Two nodes are lit: the seven modules and the equation they feed.
## The Excel workbook calculates well and forgets everything
    Building Q-CRAFT in Excel was the right call.
    The trouble starts after the file is saved.
    A year later, the next analyst cannot tell a decision from a default.
    None of this is a failure of Excel.
    The cost lands in capacity development budgets.
    Q-CRAFT Explorer puts the same economics on a platform that keeps the record.
## Run Uganda in ten minutes
    Run the tool before you read how it works.
## Zero to a Uganda projection
    **[Open Q-CRAFT Explorer](https://tealinsights.shinyapps.io/q-craft_explorer1/)** and follow these steps:
    You have now done, with five clicks, the analysis that MoFPED staff produced in a five-day workshop with a visiting IMF team in September 2023.
    Your numbers will not match theirs exactly.
## SCREENSHOT-TODO
    Annotated screenshot of the Analysis tab for Uganda, with the baseline-to-Hot-Unadapted gap called out on the chart.
## Q-CRAFT connects seven modules to one debt equation
    Q-CRAFT projects long-term fiscal outcomes under different climate scenarios, and it does so by feeding seven analytical modules into a single debt equation.
### The equation, in one sentence and then in symbols
    Next year's debt ratio is this year's, grown by the interest rate, shrunk by economic growth, less whatever the government paid down.
    That sentence is the whole model.
    The sign of $r$ minus $g$ decides whether the ratio climbs on its own.
    Climate change reaches the equation through two indirect channels.
    Every module in Q-CRAFT exists to produce an input to this equation.
## How each module feeds the equation
    Seven modules feed the equation, and each one moves exactly one part of it.
    Read the last column carefully.
## WIDGET-TODO: seven-modules-to-one-equation
    Embed the seven-modules-to-one-equation intuition widget here (lane 2, run 3: `apps/qcraft-web/widgets/*`).
### Demography
    Demography sets how fast the workforce grows, and the workforce sets how fast the economy can grow.
### Productivity
    Productivity sets output per worker, and Q-CRAFT moves it gradually rather than in a step.
### Inflation
    Inflation turns real growth into the nominal growth the debt ratio actually responds to.
### Baseline GDP
    Baseline GDP combines the three modules above into the $g$ of the equation.
### Interest rates
    The interest rate module sets what carrying the debt stock costs, which is the $r$ of the equation.
### Fiscal projections
    Fiscal projections produce the $pb$ of the equation, by growing revenue and spending on different rules.
### Climate scenarios
    Climate scenarios lower growth, and that is the only way climate enters the equation.
## The six climate scenarios
    Warming values are IPCC best estimates for 2081-2100 relative to present (User Guide Table 1).
    One naming difference is worth knowing before a meeting.
    These scenarios are conservative in ways that matter for how you write up the results.
## Self-check: where does it live?
    A colleague sends you five questions in one email.
## DRAFT FOR TEAL: self-check answers
    Four of the five sit in two modules, which is the point of the exercise: most questions that arrive as five separate problems are two.
    If you missed 3, reread the climate module above.
## The Python engine is checked against the Excel workbook, cell by cell
    A reimplementation is worth nothing if it quietly disagrees with the original.
    Identical inputs go through both the original Excel workbook and the Python engine, and every output cell for every projection year is compared.
    **Where that stands.** Baseline parity is exact for 147 of 147 tested countries: zero percentage-point deviation on debt-to-GDP, revenue, primary balance and primary expenditure as shares of GDP.
    The second claim is narrower than the first, and the difference matters.
    The test suite is public and runs on every change.
## Wrapper: what you can now do
    **Common error at this stage:** treating the seven modules as seven things to learn.
    **On your desk this week:** when someone hands you a fiscal projection, ask which of $r$, $g$ and $pb$ their headline number moves.
```

### m2-debt-equation.qmd

```
# You already know the debt equation
    **In this module**
    You will rebuild the debt identity from ordinary words, then check that the notation says the same thing.
## Fast path
    This is the Path A module.
## Warm-up
    Two questions from @sec-m1, from memory:
    (Answers: $g$, through employment growth.
## The question your minister actually asks
    The question that arrives from above is rarely "what is the debt ratio in 2099." It is some version of: *if growth disappoints, how much trouble are we in, and how fast?*
    That question has an exact answer, and it comes from one line of arithmetic that has been in every debt sustainability analysis you have ever read.
## By the end of this module you can
## Where you are in the course
    One node is lit, and this module never leaves it.
## Predict first
    Three predictions before any arithmetic.
## DRAFT FOR TEAL: building the identity from words
    **Start with the stock, not the ratio.** Government debt is a stock of shillings.
    That last bracket is the primary deficit.
    **Now divide by GDP, because that is how debt is judged.** The numerator grows at the interest rate.
    Read the middle term as a scoreboard.
    **That is the equation.** In shorthand:
    The shape has a name, and you will recognise it elsewhere: a stock carried forward, amplified by a ratio of two competing forces, minus a flow.
    **The one sentence to keep.** Next year's debt ratio is this year's, grown by interest, shrunk by growth, less what you paid down.
## The interest-growth gap moves the ratio with nobody borrowing
## DRAFT FOR TEAL: what the interest-growth differential does
    The amplifier $\frac{1+r}{1+g}$ is usually reported as a single number, the interest-growth differential $(r - g)/(1 + g)$.
    **Sign trace.** Take a debt ratio of 50 percent of GDP and a primary balance of exactly zero, so the second term drops out and only the scoreboard is left.
    Three percentage points of differential, held for a decade, is the difference between 66.1 and 37.8 percent of GDP.
## WIDGET-TODO: interest-growth differential
    Embed the interest-growth differential intuition widget here (lane 2, run 3: `apps/qcraft-web/widgets/*`).
    **Why this is the climate channel.** Q-CRAFT does not add a climate term to the equation.
    **Sensitivity, ranked.** If you have time to interrogate one assumption in a Q-CRAFT run, interrogate the interest rate rule, because it sets $r$ and V1 does not expose it.
## The primary balance is the part the government controls
## DRAFT FOR TEAL: the debt-stabilizing primary balance
    The second term is revenue minus non-interest spending, as a share of GDP.
    **The question the term answers.** Given where the scoreboard sits, what primary balance holds the ratio still?
    That is the debt-stabilizing primary balance, a standard DSA quantity.
    **Run it for the country in the table.** Debt at 50 percent of GDP, $r$ at 9 percent, $g$ at 6 percent:
    The arithmetic asks for a primary surplus of about 1.4 percent of GDP, every year, to keep the ratio at 50.
    **Perspective.** For Uganda, 1.4 percent of GDP is on the order of the annual budget for a mid-sized ministry.
    **Now connect it to rigidity.** Climate damage lowers $g$, which raises $pb^*$, so you need a bigger surplus.
## Complete the map
    The debt equation appears below as a diagram with three nodes left blank.
## The completed map
    Three inputs, one output.
## Predict, then run it
    Now use the app, and predict before each click.
## Predict, observe, explain
    **Setup.** Open [Q-CRAFT Explorer](https://tealinsights.shinyapps.io/q-craft_explorer1/), select Uganda, fiscal rule **off**.
    **Predict.** Write down: over 2030 to 2099, is Uganda's baseline debt ratio rising, flat, or falling?
    **Observe.** Open the Baseline tab.
    **Explain.** Reconcile the two.
## SCREENSHOT-TODO
    Baseline tab for Uganda with the debt trajectory and the Fiscal Balances panel side by side, so the "deficit but stable ratio" reconciliation is visible in one image.
## Self-check: three judgment calls
## A colleague makes three claims
    Your counterpart in another department sends these.
## DRAFT FOR TEAL: self-check answers
    All three are the same mistake in different clothes: reading one number without the arithmetic that gives it meaning.
## Check your predictions
    Back to the three predictions from the start of the module.
    If you got all three, you did not need this module and @sec-m0 routed you wrong.
## Wrapper: what you can now do
    **Common errors on this material:** reading a falling ratio as fiscal improvement, assuming a balanced primary account stabilizes debt, and drawing climate as a separate term.
    **One thing this module deliberately skipped:** the baseline applies a floor of zero to the debt ratio and the climate scenarios do not.
    **On your desk this week:** compute the debt-stabilizing primary balance for Uganda from the current WEO numbers, and compare it to the actual.
```

### m3-parameters.qmd

```
# Every parameter is a judgment call you can defend
    **In this module**
    You will set all five of the Explorer's controls for a country and write down why you set each one where you did.
## Fast path
    Already run the tool?
## Warm-up
    From @sec-m1, without looking:
    (Answers: fiscal projections.
## The assumption nobody wrote down
    Reopen the vignette from @sec-m1.
    Q-CRAFT Explorer cannot stop you leaving a default in place.
## By the end of this module you can
## Where you are in the course
    Two nodes are lit: the data that comes in, and the parameters you set on top of it.
## Four tabs, and what each one is for
    Four tabs hold everything the tool shows you, and you will be moving between them and the sidebar constantly.
## Five controls, and four of them shape the projection
    Q-CRAFT Explorer has five user-facing parameters.
    Productivity, inflation and interest rate assumptions are not exposed in V1, because they sit at defaults matched to the original Excel tool.
### Country selection
    **What it is.** The country dropdown lists every country for which Q-CRAFT Explorer has complete data coverage across all required input datasets.
    **Why it matters.** The country you select determines all historical data and every WEO forecast-period projection.
    **How to set it.** Choose the country you are analyzing.
## Country coverage
    Q-CRAFT Explorer currently covers 197 countries, and coverage is expanding as verification progresses.
## Predict, observe, explain
    **Predict.** Before you select Uganda, write down the debt-to-GDP ratio you expect the sidebar to report, from your own knowledge of the FY2023/24 position.
    **Observe.** Select Uganda and read the sidebar figure.
    **Explain.** If your number and the tool's differ by more than a point or two, work out which one is on a different basis before you go any further.
## Defend your choice: country and vintage
    A reviewer asks: "Is this the current debt number?" You are using WEO October 2024.
## DRAFT FOR TEAL: a defensible answer on vintage
    Name the vintage, name the basis, and state which direction the difference runs.
## Document it
    In your export packet, record: **data vintage** (WEO October 2024, UN WPP 2022), **starting debt ratio as loaded**, and **any known difference from your ministry's own figure, with the reason**.
### Demography variant
    **What it is.** The UN publishes population projections in three variants, Medium, High and Low, reflecting different fertility assumptions.
    **Why it matters.** Working-age population growth, ages 15 to 64, drives employment growth in Q-CRAFT's production function after the WEO forecast horizon.
    **How to set it.** Three variants, and one of them is the default choice:
    For detailed methodology, see the IMF User Guide, pp. 10-12 and Section IV.A on demography and employment.
## Predict, observe, explain
    **Predict.** Uganda has one of the youngest populations in the world.
    **Observe.** Switch between Medium and High and watch the Baseline tab's debt trajectory.
    **Explain.** In countries with young, growing populations the variants barely separate over the projection, because the working-age share is already rising in every one of them.
## Defend your choice: demography
    A colleague from the Climate Finance Unit argues you should use the Low variant, because Uganda's fertility rate has been falling faster than the UN projected.
## DRAFT FOR TEAL: a defensible answer on the demography variant
    Probably not for the headline run, and certainly worth a sensitivity run.
## Document it
    Record: **variant chosen**, **why** (one line), and **the 2099 debt ratio under at least one alternative variant** as a sensitivity.
### Debt target (% of GDP)
    **What it is.** The debt target is the debt-to-GDP ratio the fiscal rule steers toward over time.
    **Why it matters.** The target does nothing until the fiscal rule is enabled, and then it determines how hard spending has to adjust.
    **How to set it.** Start from the country's actual fiscal framework.
    Three rough starting points, none of them authoritative IMF guidance:
    For detailed methodology, see the IMF User Guide, pp. 15-18 on fiscal rule assumptions and the baseline scenario.
## Predict, observe, explain
    **Predict.** With the fiscal rule enabled, you are about to move the debt target from 40 percent to 80 percent.
    **Observe.** Set the target to 40, read the primary expenditure path and the debt path in the Baseline tab.
    **Explain.** A lower target forces faster consolidation, so expenditure is cut harder to bring debt down.
## Defend your choice: the target
    Your minister's office asks you to run the projection against a 40 percent target rather than the 50 percent ceiling the Fiscal Risk Statement uses, "to be prudent." What do you do, and what do you say?
## DRAFT FOR TEAL: a defensible answer on the debt target
    Run both, and be explicit about what the target is doing in the model.
## Document it
    Record: **target used**, **its source** (legislated rule, Charter for Fiscal Responsibility, DSF threshold, analyst judgment), and **the alternative target you tested**.
### Fiscal rule (Yes / No)
    **What it is.** The fiscal rule, when enabled, adjusts primary expenditure to steer debt toward the target ratio.
    **Why it matters.** Without a fiscal rule, debt dynamics are purely mechanical: they follow the interest-growth differential and whatever primary balance falls out of revenue and expenditure trends.
    **How to set it.** Run it both ways, in this order:
    The adjustment lands on the level of primary expenditure rather than on its growth rate.
## Predict, observe, explain
    **Predict.** Run Uganda with the rule off first.
    **Observe.** Run the same country with the fiscal rule on and off.
    **Explain.** With the rule off and unfavourable debt dynamics, meaning the interest rate exceeds growth, debt-to-GDP can rise without bound.
## Defend your choice: rule on or off
    Which run belongs in a Fiscal Risk Statement: rule on or rule off?
## DRAFT FOR TEAL: a defensible answer on rule on or off
    Both belong, because they answer different questions.
## Document it
    Record: **rule on or off for the headline run**, **the paired run**, and **one sentence on which question each answers**.
### Expenditure rigidity (0.0 - 1.0)
    **What it is.** Expenditure rigidity measures how far government spending resists downward adjustment when climate shocks reduce GDP.
    **Why it matters.** This is the parameter that decides how much of the climate cost becomes debt.
    **How to set it.** Start from the composition of the budget:
    For detailed methodology, see the IMF User Guide, pp. 20 and 35-36 on the expenditure rigidity parameter and fiscal effects of climate change.
## WIDGET-TODO: expenditure rigidity
    Embed the expenditure rigidity intuition widget here (lane 2, run 3: `apps/qcraft-web/widgets/*`).
## Predict, observe, explain
    **Predict.** On the Analysis tab you are about to compare the climate fan at rigidity 1.0 against rigidity 0.0.
    **Observe.** Set rigidity to 1.0 and read the 2099 gap between the baseline and Hot Unadapted.
    **Explain.** At 1.0 the fan spreads wide, because the whole climate revenue loss accumulates as debt, so the distance between Paris-aligned and Hot Unadapted is large.
## SCREENSHOT-TODO
    Side-by-side Analysis tab for Uganda at rigidity 1.0 and rigidity 0.0, with the same axis limits on both, so the compression is visible rather than described.
## Defend your choice: rigidity
    This is the judgment call you will actually be challenged on.
## DRAFT FOR TEAL: defending a rigidity choice
    Both colleagues are making empirical claims, and the parameter is where you settle them with evidence rather than adjectives.
    **The evidence to reach for** is the composition of the budget, not a view about political will.
    **The defensible position** is to run 1.0 as the headline and a lower value as the sensitivity, and to say why in one line: the default is conservative by design, and a fiscal risk statement is the document where conservatism belongs.
    **What not to do** is pick a middle value because it feels balanced.
    **The sentence for the packet:** "Rigidity set at 1.0, the tool default, because roughly N percent of Uganda's primary expenditure is wages, pensions and statutory commitments.
## Document it
    Record: **rigidity used**, **the budget-composition evidence behind it**, and **the sensitivity run and its effect on the headline gap**.
## Wrapper: what you can now do
    **Common errors on this material:** inverting the rigidity scale (see @sec-m0, question 2), moving the debt target while the fiscal rule is off and wondering why nothing happened, and choosing a middle value to avoid an argument.
    **On your desk this week:** find one number in a projection your department published and ask who chose it and why.
```

### m4-uganda-end-to-end.qmd

```
# Uganda end to end: from assumptions to the Fiscal Risk Statement paragraph
    **In this module**
    You will run one country the whole way through, from parameter choices to publishable prose.
## Fast path
    There is no fast path through this module, because it is the module the capstone is built from.
## Warm-up
    From @sec-m3 and @sec-m1:
    (Answers: expenditure rigidity, and the climate scenario itself.
## Two documents already show what the output looks like
    You are not inventing a format.
    **The IMF's C-PIMA write-up.** *Uganda: PFM Climate Assessment: Public Investment and Fiscal Risks Management* (IMF, 2024) reports the September 2023 workshop with MoFPED staff in a single paragraph.
    **Uganda's Fiscal Risk Statement FY 2024/25.** Section III, pages 13 to 17, is a fuller treatment: scenario definitions, a baseline fiscal path table, GDP deviation charts, fiscal balance and debt charts, and a closing policy sentence.
    Your capstone is the shorter of the two.
## By the end of this module you can
## Where you are in the course
    The last two nodes are lit: the output, and the paragraph you write from it.
## The target format
    Section III of Uganda's Fiscal Risk Statement FY 2024/25 is organised in three moves.
    The published baseline table is worth copying too.
    Source: Uganda Fiscal Risk Statement FY 2024/25, Table 5, sourced to QCRAFT (2023).
    Four columns is a deliberate editorial choice, because a seventy-row table is not a policy document.
## The worked case: Uganda, start to finish
    Seven steps follow, and you should follow along in the app.
### Step 1: set the parameters, and write down why
    Open [Q-CRAFT Explorer](https://tealinsights.shinyapps.io/q-craft_explorer1/) and select Uganda.
    That table is the first page of your export packet.
### Step 2: read the Baseline tab
    The Baseline tab shows the no-climate-change scenario: the country's fiscal trajectory under current trends and the assumptions you have set.
    **Debt-to-GDP trajectory** (top) is the headline chart.
    **Revenue and Expenditure (% of GDP)** (bottom left) shows two ratios that can drift apart.
    **Fiscal Balances** (bottom right) carries two lines: the primary balance, meaning revenue minus non-interest expenditure, and the overall balance, which includes interest payments.
## SCREENSHOT-TODO
    Baseline tab for Uganda, all three charts, with callouts on: (a) the end of the shaded WEO period at 2029, (b) the 2099 debt ratio, (c) the primary-to-overall balance gap.
### Step 3: run the sanity check before you interpret anything
## Baseline Sanity Check
    Before interpreting climate results, verify the baseline makes sense:
## DRAFT FOR TEAL: the sanity check applied to Uganda
    Run the five boxes against what is on your screen and against the published figures.
    **Initial debt level.** The published baseline puts 2023 at 47.1 percent of GDP, and Uganda's Fiscal Risk Statement reports 46.9 percent at June 2023 on the ministry's own basis.
    **Revenue-to-GDP.** Revenue is held at a constant share of GDP by construction, so the check is not whether it moves.
    **Expenditure path.** The published table shows primary expenditure drifting from 19.9 to 19.4 percent of GDP over seventy-six years, dipping to 18.8 around 2075.
    **Fiscal rule convergence.** With the rule off, skip this box, and say in your packet that you skipped it and why.
    **Balance paths.** The published baseline has the primary deficit narrowing from 6.3 percent of GDP in 2023 to 1.4 percent by 2099, with the overall deficit at 3.8.
    **The rule this step encodes:** a climate result computed on a baseline you have not checked is a number with no owner.
### Step 4: read the Climate tab
    The Climate tab shows how climate change affects real GDP under six warming scenarios, using empirical estimates from the FADCP Climate Dataset (Centorrino, Massetti, and Tagklis, 2024), building on Kahn et al. (2021).
    **What to look for.** Two charts show absolute GDP levels and a GDP index set to 100 in 2029.
    Countries closer to the equator generally show larger GDP losses.
    A country showing a large gap between Paris and Hot Unadapted faces high climate-fiscal vulnerability.
## DRAFT FOR TEAL: what the Uganda GDP chart licenses you to say
    The published result is a level GDP loss of around 4 percent by end of century under the Hot scenario, and the C-PIMA summary describes Uganda's impact as milder than other sub-Saharan African countries.
    Four percent needs a perspective sentence, because on its own it reads as small.
    The deflating one: 4 percent of GDP spread over seventy-five years is a few hundredths of a percentage point off annual growth, well inside the noise of any single year's outturn.
    The alarming one: it is a permanent level loss that compounds into the debt ratio every year thereafter, and 4 percent of GDP is a recurring annual amount comparable to a large sector budget.
## TODO: verify the perspective figure
    The second framing needs a checked comparator before it ships: 4 percent of Uganda's GDP expressed against a named line of the approved budget (health, or the road sector), sourced to the Approved Estimates for the relevant year.
    Both framings are true.
    **What the chart does not license:** any statement about what Uganda's GDP will be.
## SCREENSHOT-TODO
    Climate tab for Uganda, GDP index chart, with the six scenario lines labelled on the data rather than in a legend, and the 2030 divergence point marked.
### Step 5: read the Analysis tab
    The Analysis tab is the comparison view, overlaying baseline and all climate scenario debt trajectories on a single chart.
    **The climate-fiscal risk premium.** The spread between the baseline debt trajectory and the climate scenario trajectories is the country's climate-fiscal risk premium: the additional debt burden attributable to climate change.
    **Reading the chart.** A baseline showing stable or declining debt alongside a Hot Unadapted scenario that rises rapidly means climate change could destabilize an otherwise sustainable fiscal position.
## DRAFT FOR TEAL: reading the Uganda fan chart
    Three readings, in the order a reviewer will want them.
    **The gap.** Baseline at 47.5 percent of GDP in 2099, Hot at 66.
    **The threshold.** The gap only becomes a policy fact when it crosses something.
    **The shape.** Look at when the lines separate, as well as where they end.
    **What to do when the baseline itself is rising.** If your run has debt rising in the baseline, the climate gap is no longer the interesting number, because both paths are unsustainable.
### Step 6: export the packet
    The Data tab holds an interactive data grid and two CSV downloads.
    All values are in billions of local currency units, except ratios, which are percentages of GDP.
    Download both.
### Step 7: write the two paragraphs
## DRAFT FOR TEAL: model two-paragraph write-up
    Built from the published Uganda figures so every number in it is checkable.
    **Six things make this a Fiscal Risk Statement paragraph rather than a report of a model run:**
    **One editorial query for Teal:** the closing sentence of the second paragraph does policy advocacy inside a risk document.
## Completion problem: the High scenario variant
    Same country, same parameters, one change: report against the **High** scenario rather than Hot.
    **Done for you:**
    **Your turn, five tasks:**
## DRAFT FOR TEAL: checking yourself on step 4
    The distinction is the temperature distribution rather than the emissions.
## Independent problem: the adaptation-speed variant
    No scaffolding this time, and a checklist only.
    **The task.** Compare **Hot + Adapted** against **Hot + Unadapted** for Uganda.
    **Deliver five things:**
## DRAFT FOR TEAL: the trap, if you want to check before you write
    Faster adaptation in Q-CRAFT is a faster economic adjustment to a given temperature path.
## Wrapper: what you can now do
    **Common errors on this material:** interpreting climate results before checking the baseline, quoting a 2099 level as a forecast, and reporting the adaptation gap as the value of adaptation.
    **On your desk this week:** take the two paragraphs you drafted to whoever owns your ministry's fiscal risk chapter and ask what they would cut.
```

### m5-boundaries.qmd

```
# Know what the tool cannot tell you
    **In this module**
    You will learn what Q-CRAFT leaves out and which direction that bias runs, so you can state the caveat before a reviewer does.
## Fast path
    No fast path.
## Warm-up
    From @sec-m4:
    (Answers: the benefit of faster adjustment, with the cost of achieving it not modelled.
## The question that comes after the presentation
    You have presented the fan chart.
    Your whole credibility rests on the next thirty seconds.
## By the end of this module you can
## Where you are in the course
    Two nodes are lit, and they are the two ends of the chain: what the scenarios assume, and what you are allowed to write.
## What the numbers mean, and what they do not
    Q-CRAFT Explorer produces stylized long-term projections.
    The results are not forecasts.
    Q-CRAFT is designed to complement existing fiscal analysis rather than replace it.
## Every exclusion is a cost left out, so the estimate is a floor
    The scenarios capture one channel: the slow effect of temperature change on productivity, and through it on growth.
    The direction is what makes this list usable.
    Say it yourself, in the write-up, before a reviewer says it for you.
## DRAFT FOR TEAL: what conservatism does not buy you
    Conservatism protects the credibility of a number.
    A conservative estimate that gets picked up as *the* estimate becomes a ceiling in someone else's argument.
## The baseline floors debt at zero and the climate scenarios do not
## The rule
    The baseline scenario applies a floor of zero to the debt-to-GDP ratio: if the equation produces a negative value, debt is set to zero.
## DRAFT FOR TEAL: how the asymmetry changes what you are looking at
    The asymmetry matters for a narrow set of countries, and for those countries it matters a lot.
    **When it bites.** Only when a projection drives debt to zero.
    **What it does to the picture.** In such a country the baseline flattens along zero while the climate scenarios continue downward into negative territory.
    **The reading rule.** If any line in your fan chart touches zero, stop using the vertical gap as your headline number.
    **Why the asymmetry is a design choice rather than a bug.** Flooring the climate scenarios too would compress exactly the range the tool exists to show.
## Two countries, same chart, different problem
    Transfer is the thing this course is actually for: recognising which situation you are in when the labels come off.
## Comparison exercise: same path, different drivers
    **Find the pair.** In the Explorer, work through countries in the dropdown until you find two whose baseline 2099 debt ratios are within about 5 percentage points of each other, but whose baseline-to-Hot-Unadapted gaps differ by 10 percentage points or more.
    **Then diagnose.** For each country, decide which of the three drivers from @sec-m4 explains the difference:
    **Write one sentence** per country saying which driver dominates, and one sentence saying what policy conclusion follows for each.
    **Then reverse it.** Find two countries with similar climate exposure on the Climate tab whose debt outcomes diverge.
## TODO: seed the comparison with verified pairs
    This exercise currently sends learners hunting.
## DRAFT FOR TEAL: why this exercise and not a worked comparison
    The instinct is to hand over the pair and the answer.
    The general principle is the one to carry out of this module: a debt path is an outcome, not a diagnosis.
## Q-CRAFT and the LIC-DSF answer different questions
    Q-CRAFT and the IMF-World Bank Low-Income Country Debt Sustainability Framework both produce debt projections for low-income countries.
## Self-check: five questions, which tool?
    For each, name Q-CRAFT, LIC-DSF, both, or neither, and say why in one line.
## DRAFT FOR TEAL: self-check answers
    The test in every case is which question the tool was built to answer, never which tool you happen to have open.
    **The reverse direction is the part usually skipped.** A question that arrives framed for the DSF may be a Q-CRAFT question.
## Wrapper: what you can now do
    **Common errors on this material:** quoting a conservative estimate as a total, reading a floored baseline as a favourable climate result, and answering a sustainability-rating question from a Q-CRAFT chart.
    **The thirty-second answer to your minister,** for reference: "No. It is what climate change does to the debt ratio through one channel, growth, under stated assumptions about how spending responds.
    **On your desk this week:** find a projection in circulation in your ministry and write down one question it cannot answer.
```

### m6-capstone.qmd

```
# The capstone: your analysis, defended
    **In this module**
    You will produce the capstone: an export packet plus a two-paragraph Fiscal Risk Statement draft, for a country you choose.
## Fast path
    Short on time?
## Warm-up
    From across the course, without looking:
    (Answers: $g$ and $pb$.
## By the end of this module you can
## Where you are in the course
    One node is lit, and it is the one you hand over.
## The capstone brief
    **The scenario.** Your minister has asked for a climate-fiscal risk section for the next Fiscal Risk Statement.
    **What to hand in, in three parts.**
    **Country choice.** Pick Uganda if you want to compare against the published Section III.
    **What is not required.** Matching the published Uganda figures.
## The rubric
## DRAFT FOR TEAL: capstone rubric
    Four criteria, and the weights are a proposal rather than a decision.
    **One error disqualifies on its own**, and it is worth naming separately because it recurs: reporting the Adapted-to-Unadapted gap as the value of adaptation.
    **Note for the live workshop.** The rubric doubles as the peer-review instrument, run in three passes.
## Common errors to watch for
## TODO: replace with pilot-observed errors
    The list below is built from the misconceptions this course was designed against, not from watching people make them.
## Where you started, where you are
    Go back to your three answers from @sec-m0.
    **On long-term fiscal projection:** A1 (not worked with a DSA) / A2 (can follow one) / A3 (could build one this week)
    **On climate-fiscal analysis:** B1 (climate side only) / B2 (can describe the use) / B3 (have run or interpreted one)
    **On the tool itself:** C1 (never opened it) / C2 (clicked around) / C3 (ran it and explained the output)
    The A and B rows are the ones worth looking at.
## Retake the three questions from Module 0
    Same three items, unchanged.
## DRAFT FOR TEAL: the answers, and what a wrong one means now
    A wrong answer here costs more than it did in @sec-m0, because now it is attached to a document you are about to circulate.
## What to use on your desk this week
## Spaced follow-up
    Two things arrive after the workshop, and they are part of the course rather than an afterthought.
    Spacing beats massing, and the IMF's own evaluation of capacity development found that training with hands-on follow-up sticks while the standalone workshop decays.
## TODO: workshop materials
    The live sessions need artefacts this guide does not yet contain: breakout task cards, the anonymous poll items, and the peer-review sheet derived from the rubric above.
## Wrapper: the whole course in six lines
```

### Banned-tics sweep: zero

Swept against every rule in `style-guide-writing-AI.md`, over all eleven `.qmd` files including the preface, glossary, references and the appendix.

| Rule | Hits before | Hits after |
|---|---|---|
| Filler intensifiers ("genuinely", "really", "just", "of course") | 6 | 0 |
| Em-dashes and en-dashes | 0 | 0 |
| Negative parallelism ("not only") | 0 | 0 |
| False ranges ("range from X to Y") | 1 | 0 |
| Rhetorical question-answer ("The X? A Y.") | 2 | 0 |
| Echo amplifiers ("the figures are real") | 1 | 0 |
| Semicolon splices | 50 | 0 |
| Appended-judgment tails, participle taglines, self-certifying tails | 0 | 0 |
| "It is worth noting", "let's dive in", "delve", "leverage", "robust" | 0 | 0 |
| **Total** | **60** | **0** |

Scope note: the sweep covers the course files. Running the same sweeper over this report flags the rows above, because the table quotes the banned tics by name, and flags the Run 1 section below, which is left as it was written.

The semicolons were the bulk of it. The style guide allows a semicolon that earns its place, including in a compact table cell, so a handful of the 50 were arguably defensible. I removed all of them anyway, so the sweep result is unambiguous rather than a judgment call you would have to re-audit.

### DRAFT FOR TEAL: 25, unchanged, all rewritten

| Module | Blocks | What is in them now |
|---|---|---|
| M0 | 3 | The three concept-inventory questions and their answers, with the distractor diagnoses tightened |
| M1 | 1 | The where-does-it-live self-check answers, now opening with the point the exercise makes |
| M2 | 4 | The identity built from words, the interest-growth differential, the debt-stabilizing primary balance, the self-check answers |
| M3 | 5 | Four defensible answers plus the rigidity argument. The three that were all titled "a defensible answer" now name their subject, so you can find them in the rendered book |
| M4 | 6 | The sanity check applied to Uganda, what the GDP chart licenses, the fan chart reading, the model two-paragraph write-up, the completion-problem check, the adaptation trap |
| M5 | 4 | What conservatism does not buy you, the floor asymmetry reading rule, why the comparison is a search, the which-tool answers |
| M6 | 2 | The capstone rubric, the retake answers |
| **Total** | **25** | |

Marker counts elsewhere are also unchanged: 5 SCREENSHOT-TODO, 3 WIDGET-TODO, 4 other TODO. No screenshots were fabricated.

### Substance check

Rule 6 said sentence surgery on a fixed skeleton, so I verified it mechanically rather than by eye. Every numeric token in all eleven `.qmd` files was extracted at the pre-run-2 commit and at HEAD, then the two multisets were compared. They match, with three accounted-for exceptions:

- Two fewer "10" tokens in M0, because "the 10-minute Uganda run is genuinely 10 minutes" became "the ten-minute Uganda run does take ten minutes". Same duration, spelled out, and the filler intensifier gone.
- Two extra "0" tokens from the new M0 anchors `sec-m0-inventory` and `sec-m0-paths`, which the fast-path marker links to.
- One extra "0" token from a new `@sec-m0` cross-reference in M6's retake block.

The check caught one real defect, now fixed. M1's new road map replaced a bullet that carried "baseline parity is exact for 147 of 147 tested countries" with the looser phrase "the Python tool agrees with the IMF's Excel workbook". Unqualified, that is broader than the binding wording allows. The road map now carries the exact claim and the 2099 horizon that the old bullet also carried.

Parity wording is otherwise untouched and appears in the binding form in M1 and the appendix. The FADCP and Kahn citation is unchanged in all three places it appears. No occurrence of NGFS anywhere in the guide.

### What the skim test caught, by module

The test earned its place. It found the same defect three times in different clothing: a paragraph that opens with a noun phrase instead of a claim.

**M0.** Section headings labelled the topic ("The deliverable, stated up front") rather than stating it. The opening paragraph led with a fact about page numbers rather than with the point, which is that Uganda has already published the document the course teaches you to write. M0 also promised that "every module carries a fast-path marker near the top" while M0 and M6 did not have one. Both now do.

**M1.** The seven per-module subsections each opened with a fragment: "GDP per employed person, from World Bank data." Read as a skeleton, they taught nothing. Each now opens with a sentence naming what that module does to the equation ("Productivity sets output per worker, and Q-CRAFT moves it gradually rather than in a step"). Two section headings became claims. "Partial-equilibrium tool" was named before it was explained, which the Explainer Toolkit's replace-then-name rule forbids, so the mechanism now comes first and the label arrives after.

**M2.** Most of the argument lives inside the DRAFT callouts, so the two headings above them were carrying the skim load and both were labels. "The scoreboard term: r minus g" is now "The interest-growth gap moves the ratio with nobody borrowing".

**M3.** Every parameter block opened "**What it is.** A dropdown menu listing countries...", a reference-card stub rather than a sentence. All fifteen What/Why/How leads are now declarative.

**M4.** The three Baseline-tab chart paragraphs opened with a bare bold label and a full stop, so the skeleton listed chart names and no claims. The label now leads the sentence.

**M5.** Three headings were labels. The conservatism section is now titled with its argument: "Every exclusion is a cost left out, so the estimate is a floor".

**M6.** No fast-path marker, and the "where you started" paragraph buried its point (the A and B rows are the ones that matter) in the third clause of a long sentence.

Across all seven, the "The hook:" prefix on four headings was design scaffolding aimed at the author rather than the reader, so it is gone. The headings still hook.

### One scope call you should know about

`SHARED/REFERENCE-NOTES.md` gained a new binding line partway through this run: your 8/26 late-pm structural calls, including "COURSE GENERALIZES" and "Uganda-specific institutional terms (PS etc.) leave the general path". `PROMPT-RUN3.md` appeared shortly after and makes that a full run of its own.

What I did: the wording-level part, because it is sentence surgery and it was cheap. "Permanent Secretary" is now "your minister" in M0, M5 and M6, matching the register M2 already used, and M0's capstone item now hands the draft to "whoever owns your ministry's fiscal risk chapter" rather than to the Macroeconomic Policy Department. Uganda stays everywhere it is data, verification, or the worked case.

What I did not do: the structural half. Naming the generalized reader in the preface and M0, the explicit transfer framing, and the prominent "now do your own country" handoff in M4 are skeleton changes, and run 2's brief freezes the skeleton.

**One thing for run 3 to reconcile.** Run 3 specifies M0's title as "Start here: what you will walk into your director's office with", marked DRAFT FOR TEAL. This run set it to "your minister's office" before that prompt existed. Run 3 should overwrite it, and if it does, the DRAFT FOR TEAL count moves from 25 to 26 unless the title marker is counted separately.

### Things for you to decide

Run 1's open items 1, 2, 4 and 5 still stand, and this run did not touch them. Three are new or changed.

1. **The M4 advocacy flag survived, in shorter form.** The model write-up's closing sentence still does policy advocacy inside a risk document. Run 1 flagged it as "what Teal should rewrite". I kept the flag, because dropping it would lose the question, but scoped it to one line so the block reads as finished prose rather than as a stub. It is the last line of the Step 7 DRAFT block.

2. **"Your minister" may be the wrong generic.** In a ministry the Permanent Secretary is the senior civil servant and the Minister is political, and walking into one office is not the same errand as walking into the other. I picked "minister" because M2 already used it and it reads naturally to any finance-ministry audience. Run 3's prompt proposes "your director", which is a different call. Pick one and it should be consistent across M0, M2, M5 and M6.

3. **Section-heading register.** I converted eleven label headings into claim headings, per the Explainer Toolkit's rule that headings are full-sentence claims. Two of them have a dry edge: "The Excel workbook calculates well and forgets everything" (M1) and "The interest-growth gap moves the ratio with nobody borrowing" (M2). If that reads as too much personality for a ministry-facing course, they are one-line reverts.

### Not done, and why

- **The appendix and the preface got the tics sweep only.** Both are clean, but neither got the topic-sentence treatment. The appendix sits outside the learning path on purpose and carries the SovTech pitch, which is a different register. The preface is already short and leads with its point.
- **The 197 versus 175 country-count disagreement is untouched.** Run 1 flagged it and I left it, since resolving it means changing a number.
- **The M2 perspective anchor is untouched.** "For Uganda, 1.4 percent of GDP is on the order of the annual budget for a mid-sized ministry" is hedged but unverified, and it is the same class of claim as the M4 comparator that already carries a TODO. Verifying it means a new source, which is out of scope for a sentence-surgery run.

### Commits

```
ec6e637 docs(guide): M0 skim pass, topic sentences, road map, fast path
a683f4c docs(guide): M1 skim pass, claim headings and topic sentences
76a085c docs(guide): M2 skim pass, claim headings over label headings
f6dc673 docs(guide): M3 skim pass, declarative What/Why/How openers
4c50a13 docs(guide): M4 skim pass, chart labels become claims
bfcdd0d docs(guide): M5 skim pass, claim headings and generic institutional register
f71889a docs(guide): M6 skim pass, fast path added and register generalised
0f92bd9 docs(guide): generic institutional register in M0, tics out of the glossary
0b7b56e docs(guide): rebuild the committed PDF artifact after the skim pass
```

---

## Run 1: course restructure, Modules 0-6

Kept for the record. Run 2 did not touch the structure this run put in place.

### Status

Done. `quarto render docs/companion-guide` passes clean (exit 0, no warnings, no unresolved cross-references), HTML and PDF both build, and the committed PDF artifact is regenerated.

### What changed

The companion guide is now a seven-module course instead of three parts.

| File | Provenance |
|---|---|
| `index.qmd` | Rewritten preface: module table, "start at M0", corrected description of the co-design material |
| `m0-start-here.qmd` | New |
| `m1-how-qcraft-thinks.qmd` | `git mv` from `part1-policy.qmd`, then rebuilt |
| `m2-debt-equation.qmd` | New (Path A) |
| `m3-parameters.qmd` | `git mv` from `part2-using.qmd`, then rebuilt |
| `m4-uganda-end-to-end.qmd` | New, absorbing the results-interpretation prose from old Part 2 |
| `m5-boundaries.qmd` | New, absorbing the caveat material scattered across old Parts 1 and 2 |
| `m6-capstone.qmd` | New |
| `appendix-codesign.qmd` | `git mv` from `part3-codesign.qmd`, reframed as out-of-path, parity wording corrected |

Renames were committed as pure renames first, so the reflow shows up as edits rather than as delete-plus-add.

**Where the old prose went.** Roughly 70 percent of the existing text is relocated rather than rewritten, as the redesign plan intended.

- Old 1.1 (MoF-economist vignette) → M1, verbatim
- Old 1.2 (what Q-CRAFT computes, equation, symbol table) → M1
- Old 1.2.2 (the seven-paragraph prose wall) → M1, rebuilt as a table plus seven mini-diagrams plus a self-check
- Old 1.2 debt-floor asymmetry callout → M5
- Old 1.2 scenario table → M1 (collapsed); its conservatism paragraph → M5
- Old 1.3 (how the Explorer works) → split: early win to M1, tab orientation to M3
- Old 1.4 (verification) → M1, once, with corrected wording
- Old 2.1 (Quick Start) → M1 as the 10-minute Uganda early win
- Old 2.2 (five parameters, What/Why/How-to-set) → M3, kept intact, with new layers on top
- Old 2.3 (four tabs, Baseline Sanity Check) → M4, inside the worked case
- Old 2.4 (what the numbers mean) → M5
- Old Part 3 → appendix, out of the learning path

### Definition-of-done check

- [x] All module files exist and render
- [x] Existing prose relocated per the blueprint
- [x] Behavioral objectives (Bloom verbs, 3-5, workplace performances) on all seven modules
- [x] Concept-map scaffolds: the master map appears in all seven modules with the current node lit; M1 adds seven per-module mini-diagrams; M2 adds a partial map to complete
- [x] Self-check scaffolds: M1 where-does-it-live, M2 three-claims, M3 one defend-your-choice per parameter (5), M4 completion and independent problems, M5 which-tool five-item, M6 retake of the M0 inventory
- [x] Marker inventory below

### Marker inventory

| Module | Lines | Objectives | Mermaid | DRAFT FOR TEAL | SCREENSHOT-TODO | WIDGET-TODO | Other TODO |
|---|---|---|---|---|---|---|---|
| M0 start here | 180 | 4 | 1 | 3 | 0 | 0 | 0 |
| M1 equation + modules | 314 | 4 | 10 | 1 | 1 | 1 | 0 |
| M2 debt equation | 245 | 4 | 3 | 4 | 1 | 1 | 0 |
| M3 parameters | 298 | 4 | 1 | 5 | 1 | 1 | 0 |
| M4 Uganda end to end | 301 | 5 | 1 | 6 | 2 | 0 | 1 |
| M5 boundaries | 197 | 4 | 1 | 4 | 0 | 0 | 1 |
| M6 capstone | 162 | 4 | 1 | 2 | 0 | 0 | 2 |
| **Total** | **1,697** | **29** | **18** | **25** | **5** | **3** | **4** |

`appendix-codesign.qmd` (91), `index.qmd` (41), `glossary.qmd` (43) and `references.qmd` (17) carry no markers.

**DRAFT FOR TEAL blocks, by kind.** M0's three concept-inventory questions with their answers; M1's self-check answers; M2's four new explanations (identity from words, the r-minus-g sign trace, the debt-stabilizing primary balance, self-check answers); M3's five defend-your-choice answers including the rigidity argument; M4's six interpretation blocks including the model two-paragraph write-up; M5's four (conservatism hazard, floor asymmetry reading rule, why the comparison is a search, which-tool answers); M6's rubric and the retake answers. Every one is best-effort text in your voice's general direction, not an attempt at your finished voice on a new argument.

**SCREENSHOT-TODO (5).** M1 Analysis tab with the baseline-to-Hot gap called out; M2 Baseline tab showing deficit alongside a stable ratio; M3 rigidity 1.0 versus 0.0 on matched axes; M4 Baseline tab three-chart annotated, and M4 Climate tab GDP index with labels on the data. No screenshots were fabricated.

**Other TODO (4).** M4: verify the "4 percent of GDP" perspective comparator against a named budget line before shipping. M5: seed the country-comparison exercise with two or three verified pairs. M6: replace the common-errors list with pilot-observed errors; produce the workshop artefacts (task cards, poll items, peer-review sheet).

**WIDGET-TODO (3).** Anchors in M1, M2 and M3 for the lane 2 intuition widgets, per the 8/26 pm note in SHARED/REFERENCE-NOTES.md. Not embedded, since the integration pass runs after this lane and run 3 both land. The surrounding prose carries the full idea on its own, so the modules work without the widgets.

### Uganda Fiscal Risks Statement: found

Downloaded to `source-materials/2024_MoFPED_Uganda-Fiscal-Risk-Statement-FY2024-25.pdf` (31 pages, 1.1 MB, verified `%PDF`).

- Source: `https://www.finance.go.ug/sites/default/files/2024-05/Fiscal%20Risk%20Statement%20FY%2024-25.pdf`, reached via `https://www.finance.go.ug/search/node?keys=fiscal+risk`. Read-only GET.
- The FY 24/25 edition is the latest published on the site. The other two hits are FY 2020/21 and November 2018.
- Note: `.gitignore` excludes `source-materials/` and `*.pdf`, so the file is on disk in this clone but not committed. That matches how the repo already treats source materials.

**It is better than expected.** Section III (pp. 13-17) is a Q-CRAFT write-up, sourced to "QCRAFT (2023)". M4 now uses its real structure as the target format and reproduces its Table 5 baseline fiscal path. Every Uganda number quoted in the course comes from either that statement or the C-PIMA high-level summary:

- Baseline fiscal path 2023/2050/2075/2099, including debt at 47.1 → 36.2 → 35.8 → 47.5 percent of GDP (FRS Table 5)
- Hot scenario: about 4 percent GDP loss by end of century; primary deficit 0.7 points worse than baseline; debt over 18 points higher (FRS Section III)
- Debt passes the 50 percent of GDP fiscal rule ceiling in the High, Hot and Vulnerable scenarios (FRS Section III)
- Debt at 66 percent versus 47.5 percent baseline; impact milder than other SSA countries (C-PIMA high-level summary, IMF 2024)
- Public debt 46.9 percent at June 2023 from 48.4 percent at June 2022, the fall partly a nominal-GDP effect (FRS Section IV)

One naming difference worth knowing before the session: the Statement reports five scenarios and calls the last one "Vulnerable" where the Explorer says "Hot Unadapted". M1 flags this.

### Binding content rules

- **Parity.** Stated once, in M1, as "baseline parity is exact for 147 of 147 tested countries" plus "climate-scenario parity is confirmed for ratio metrics". M1 adds an explicit sentence on what the second claim does not cover. The appendix's old "well over 140 countries, 0.0 across the board" line is replaced with the same wording. No broader claim anywhere.
- **Climate source.** README's two "NGFS Phase IV" errors fixed (commit `5632250`). The guide prose was already correct on FADCP; swept and confirmed.
- **Show-don't-tell.** Auto data loading is demonstrated in the M1 ten-minute run rather than asserted; guidance at point of need appears as the What/Why/How-to-set blocks in M3; documented rationale is the Document it blocks feeding the export packet; fast polished output is the Data tab export in M4 Step 6. No marketing language in the modules; the SovTech pitch is confined to the appendix.
- **No em-dashes.** Swept, zero in the guide.

### Things for you to decide

1. **`apps/qcraft-app/app.py` still says NGFS in six places** (lines 354, 389, 461, 515, 544, 546), including a citation block that credits "NGFS (2023), NGFS Climate Scenarios". I did not touch it: it is another lane's file and editing it risks a conflict. It is the same factual error as the README, and it is visible in the shipped app's Methodology tab, so it should be fixed before Sept 1.
2. **Country count disagreement.** README says 175 countries, the guide says 197 (in M1 about the IMF workbook, and in M3 about the Explorer's own coverage). Both cannot be right about the Explorer. I left the guide's numbers as they were rather than guess.
3. **The M4 model write-up's closing sentence** does policy advocacy ("meeting Uganda's Paris commitments and building expenditure flexibility both reduce this exposure"). In a risk document that may be a step too far. Flagged inside the DRAFT block.
4. **Rubric weights** in M6 (40/20/25/15) are a proposal, not a decision.
5. **M2's fate.** It is written as skippable Path A material. If the Sept 1 session has more Climate Finance Unit staff than macro staff, it may deserve to be non-optional.

### Not done, and why

- **Videos.** The Pedagogy Toolkit's 6-minute video slots are not scaffolded. Out of scope for a mechanical restructure and there is no video pipeline in this repo.
- **Workshop artefacts.** Task cards, polls and the peer-review sheet are tracked as a TODO in M6 rather than built. The redesign plan puts them in a later week.
- **Pilot.** The common-errors list in M6 is derived from the misconceptions the course was designed against, not from watching anyone. Marked as a hypothesis in the file.

### Commits

```
5632250 fix(README): climate damage source is the FADCP Climate Dataset, not NGFS Phase IV
b31b7c2 docs(guide): rename part files to their module destinations
2e40eeb docs(guide): add M0 (start here) and rebuild M1 (equation + seven modules)
10a20ea docs(guide): add M2 (debt equation, Path A) and rebuild M3 (parameters as judgment calls)
02209db docs(guide): add M4, the Uganda worked case end to end
ee2c171 docs(guide): add M5 (boundaries) and M6 (capstone and wrapper)
8fdad75 docs(guide): wire the module skeleton into the book and rebuild the PDF
836baae docs(guide): mark every judgment answer as DRAFT FOR TEAL and collapse it
```
