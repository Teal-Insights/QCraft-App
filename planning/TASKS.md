# Q-CRAFT Explorer: Implementation Plan

**Last updated:** March 14, 2026
**Methodology:** Adapted SpecFlow + structured brainstorming (see .ai-context/PROCESS-LOG.md)

---

## Timeline and Strategy

**Hard deadline:** Wednesday March 18 — meeting with Kevin Carey / Plamen
**Stretch goal:** Friday March 20 morning — TNC workshop session

**Philosophy:** The 20% that does 80%. Ship something polished but narrow for Wednesday, then progressively expand through Friday. Each tier is independently valuable. If you only get through Tier 1, you have a demo. Every additional item makes the demo more impressive.

**Constraint:** Teal is on childcare duty Saturday-Monday. Mobile for reviews, laptop in short bursts (nap time, evenings).

---

## TIER 1: Wednesday MVP (March 18)

*What you absolutely must have to show Kevin and Plamen on Wednesday.*

**The demo story:** "I took the Q-CRAFT Excel tool and rebuilt the calculation engine in Python with proper software engineering practices. Here is Uganda — same math, same numbers, better experience. The engine and the front end are separate packages. Here is what it could look like."

### Session A: Scaffolding + Data Extraction (2-3 hrs)

**Goal:** A UV monorepo that builds, lints, type-checks, and has data ready.

- [ ] Initialize UV workspace: root `pyproject.toml` + `packages/qcraft-engine/` + `apps/qcraft-app/`
- [ ] Create `AGENTS.md` at root (cross-model project context). Symlink `CLAUDE.md -> AGENTS.md`
- [ ] Create `.gitignore` (excludes `.ai-context/`, `.specstory/`, `data/raw/`)
- [ ] Write `scripts/extract_excel_data.py`: openpyxl reads Excel sheets → Polars → Parquet
- [ ] Extract: macrofiscal, productivity, demography, climate datasets
- [ ] Write `qcraft_engine/constants.py`: scenario definitions, colors, defaults, year boundaries
- [ ] Write `qcraft_engine/data_loader.py`: load Parquet, derive WEO_MAX_YEAR, country list
- [ ] Configure: Ruff (linting), Pyright (type checking), pytest
- [ ] GitHub Actions CI: ruff check + pyright + pytest on every push
- [ ] Test: `test_data_loading.py` — verify country list, schema, Uganda exists
- [ ] Git init, first commit, push to GitHub

**Exit criteria:** `uv run pytest` passes. `uv run ruff check .` clean. `uv run pyright` clean. Data in Parquet.

**For Teal:** Copy `qcraft-toolv10.xlsx` to `data/raw/`. Quick eyeball — do country names and year ranges look right?

### Session B: Calculation Engine + Golden Master (3-4 hrs)

**Goal:** All engine functions implemented. Uganda parity verified.

- [ ] Extract Uganda golden master from Excel "Output Scenarios" sheet → CSV in `tests/golden_masters/uganda/`
- [ ] Implement `demography.py` with tests
- [ ] Implement `productivity.py` with tests (**test logistic convergence explicitly**)
- [ ] Implement `inflation.py` with tests
- [ ] Implement `baseline.py` (baseline_v1) with tests
- [ ] Implement `interest_rate.py` with tests (**test the t-1 shift for IGD mode**)
- [ ] Implement `fiscal.py` (baseline_country) with tests (**test fiscal rule feedback loop**)
- [ ] Implement `climate.py` (calc_climate_scenario) with tests (**test rigidity endpoints 0.0 and 1.0**)
- [ ] Write `test_parity.py`: Full Uganda pipeline vs golden master
- [ ] **Target: ~100 assertions passing**

**Exit criteria:** `uv run pytest tests/test_parity.py` passes for Uganda. All engine functions have unit tests. No mocked tests.

**For Teal:** Review any parity failures. Some may reveal Excel quirks — document them.

### Session C: Minimal UI (2-3 hrs)

**Goal:** A running Shiny app with one tab that looks professional.

- [ ] Create `apps/qcraft-app/app.py` — Shiny for Python entry point
- [ ] Sidebar with country selector + key parameters (match Excel defaults)
- [ ] **Baseline tab only:** 6 summary cards + 3 key charts (Debt-to-GDP, Revenue/Expenditure, Primary Balance)
- [ ] Apply Plotly theme (navy/teal palette, Inter font, clean grid)
- [ ] Apply SWD principles to debt-to-GDP chart (gray + highlight, direct labels)
- [ ] Professional styling: spacing, card shadows, typography
- [ ] Visual QA: Playwright screenshot → AI review for aesthetics + output sanity
- [ ] Test: select Uganda, verify numbers display correctly

**Exit criteria:** `uv run shiny run apps/qcraft-app/app.py` launches. Uganda baseline looks clean and professional.

### Session D: Deploy + README (1-2 hrs)

**Goal:** Live on shinyapps.io. GitHub repo looks professional.

- [ ] Deploy to shinyapps.io
- [ ] Verify basic responsiveness (phone/tablet)
- [ ] Write README.md: what this is, link to shinyapps.io, screenshot, how to run locally
- [ ] Create Google Form for feedback. Add "Give Feedback" link to app header
- [ ] Final visual pass on deployed version

**Exit criteria:** Working URL on shinyapps.io. README with screenshot on GitHub. Feedback link works.

### WEDNESDAY MVP COMPLETE

You can show Kevin and Plamen: a working app with Uganda, professional appearance, parity verified, modular architecture, deployed. The repo demonstrates real engineering practices (CI, typed code, tested, linted).

---

## TIER 2: Wednesday → Thursday Improvements

*Progressive enhancements. Each is independently deployable. Pick whichever feels highest-impact first.*

| Item | Time | Description |
|------|------|-------------|
| **T2.1** Analysis tab + hero chart | 1.5 hrs | All 7 scenarios overlaid. Hero chart with SWD treatment. Scenario comparison cards. |
| **T2.2** Climate tab | 1 hr | GDP loss, GDP index, variation on growth. Documentation card (Kahn et al.). |
| **T2.3** Tooltips + guide links | 1 hr | Question-mark icons linking to companion guide. Plain-language rigidity slider labels. |
| **T2.4** CSV export + chart pack | 1 hr | Data tab with CSV download. Chart pack as ZIP of PNGs via kaleido. |
| **T2.5** Second golden master | 1 hr | Extract + verify a SIDS or emerging market. Increases confidence. |
| **T2.6** Country context card | 30 min | Income group, region, current debt-to-GDP in sidebar. |

**Redeploy to shinyapps.io after each item.**

---

## TIER 3: Thursday → Friday Morning

*Each adds demo impact for the TNC workshop.*

| Item | Time | Description |
|------|------|-------------|
| **T3.1** Methodology tab | 45 min | Math reference card, source paper links, SovTech approach in plain language. |
| **T3.2** Conceptual model diagram | 1 hr | Persistent sidebar diagram: Temp → Growth → Revenue → Spending → Debt. |
| **T3.3** Multiple countries verified | 30 min | Verify 5-10 countries work. Fix edge cases. |
| **T3.4** Responsive polish | 30 min | Tablet screens, loading states, error handling. |
| **T3.5** "Questions for IMF" section | 45 min | Well-researched co-design questions grounded in C-PIMA analysis. |

---

## TIER 4: Post-Friday Backlog (→ Spring Meetings, April)

### High Value
- [ ] Multi-country comparison tab (up to 4 countries side by side)
- [ ] World choropleth map
- [ ] Excel workbook export (styled, matching IMF format)
- [ ] Auto-generated deterministic text ("Under Hot, debt reaches X% by 2060...")
- [ ] REST API for calculation engine
- [ ] Quarto companion guide (3 sessions — see below)

### Medium Value
- [ ] Discrete risks tab (editable grid for revenue/expenditure shocks)
- [ ] Guided tour (tooltip walkthrough for first-time users)
- [ ] "What If" mode (single-parameter sensitivity toggle)
- [ ] Assumption provenance (per-input comments, session concept)
- [ ] Session logging and comparison
- [ ] Ruritania fictional country example

### Future Vision
- [ ] AI-enhanced version: natural language queries
- [ ] Data pipeline for automatic WEO/API data updates
- [ ] Docker deployment for offline/air-gapped environments
- [ ] LIC-DSF integration prototype
- [ ] Debt Dynamics Toolkit reimplementation
- [ ] Don Norman design review skill
- [ ] Q-CRAFT expert skill with progressive disclosure
- [ ] Review agent personas from participant bios

---

## Parallel Track: Quarto Companion Guide (Post-Friday)

### Guide Session 1 (alongside app Tier 2-3)
- [ ] Initialize Quarto book project in `guide/`
- [ ] Chapter 1: What is Q-CRAFT?
- [ ] Chapter 2: Quick Start
- [ ] Chapter 3: Understanding the Model
- [ ] Set up Quarto theme matching app palette

### Guide Session 2
- [ ] Chapter 4: Using the App (with screenshots)
- [ ] Chapter 5: Interpreting Results
- [ ] Chapter 6: Presenting to Policymakers
- [ ] Chapter 7: Technical Reference

### Guide Session 3
- [ ] Chapter 8: Co-Design Questions for IMF (the "Part 3" discussed in brainstorming)
- [ ] Chapter 9: Data Sources and Limitations
- [ ] Review all chapters against writing standards
- [ ] Generate PDF and HTML. Cross-reference with app.

---

## Dependency Map

```
Session A (scaffold) ──→ Session B (engine) ──→ Session C (UI) ──→ Session D (deploy)
                                                     │
                                                     ├── T2.1 (Analysis tab)
                                                     ├── T2.2 (Climate tab)
                                                     ├── T2.3 (Tooltips)
                                                     ├── T2.4 (Export)
                                                     └── T2.6 (Context card)

Session B (engine) ──→ T2.5 (second golden master)

All Tier 2 items independent of each other.
All Tier 3 items independent of each other (except T3.5 benefits from T3.1).
```

---

## Human vs. Agent Work

**Teal must do:**
- Copy `qcraft-toolv10.xlsx` to `data/raw/`
- Review parity test failures
- Review deployed app ("does this feel right" gut check)
- Create Google Form
- Review README before GitHub goes public

**Agent does autonomously:**
- All coding (engine, UI, tests, CI)
- Data extraction from Excel
- Visual QA via Playwright
- Chart styling and layout
- Deployment scripting

**Teal reviews, agent executes.** Minimize hands-on-keyboard time during childcare weekend.

---

## Documents Needed

**High priority (for parity testing):**
- [ ] `qcraft-toolv10.xlsx` in `data/raw/` (Teal has this)

**Nice to have:**
- [ ] Uganda C-PIMA annex with input parameters used
- [ ] Any Q-CRAFT workshop training slides
- [ ] Ranger, Pasqua & Adam (2025) — behind LSE paywall
- [ ] Batini (2024) "Accounting for Nature" — SSRN

---

*This plan is robust to interruptions. Each tier is independently valuable. Update this file after each session with status markers.*
