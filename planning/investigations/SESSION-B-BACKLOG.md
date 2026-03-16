# Session B Backlog

Items identified during council of experts review of the WEO investigation.
These are documented risks, not blockers for merging the current PR.

## 1. Cross-Country Validation
All investigation evidence comes from Uganda only. Session B should include a
test with at least one other country (e.g., Australia for a developed economy,
Afghanistan for incomplete data) to verify boundary behavior is consistent.
Priority: HIGH for Session B tests.

## 2. Incomplete Macrofiscal Data Handling
Afghanistan causes `#VALUE!` in Excel because it lacks data through 2029. The
Python engine needs a graceful fallback — either forward-fill, error with a
clear message, or skip the country. See Investigation 5 (Interest Rate Anchor)
and Gemini review Finding 5.
Priority: MEDIUM — affects edge-case countries, not the golden master.

## 3. Discrete Risks Sheet Year Range (2030-2102)
The Discrete Risks sheet has 73 columns covering 2030-2102, but all other sheets
stop at 2099. The extra 3 years may be intentional buffer or future extension.
Added as IMF meeting question #8. If confirmed as buffer, the engine should
truncate at YEAR_LAST (2099).
Priority: LOW — Discrete Risks are all zeros for Uganda golden master.

## 4. Interest Rate Long-Run Mode Formulas
The Investigation 6 table describes the interest rate transition imprecisely.
During Session B implementation of `interest_rate_country()`, trace the exact
Excel formulas for all three modes (constant nominal, constant differential,
constant real) at the 2029→2030 boundary.
Priority: HIGH for interest_rate_country() implementation.

## 5. Sigmoid Counter Architecture
Both Inflation and Productivity sheets use a separate "lookup table" architecture
for the sigmoid (columns B-CV, counter 1-99) rather than computing the counter
from years inline. The Python engine does NOT need to replicate this indirection —
it can compute counter = year - WEO_MAX_YEAR directly. But if parity tests fail,
check whether the lookup table has rounding or precision differences.
Priority: LOW — only relevant if parity tests fail.
