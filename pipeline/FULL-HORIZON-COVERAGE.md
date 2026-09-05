# Current full-horizon country coverage

Calculation source: `6731bc6dbff6069ffff9505e902a35b48757953a`. Input revision: `weo-2026-04-full-horizon-v1`. Source vintage: IMF WEO April 2026. This is a census of the new Current profile; historical coverage documents describe earlier inputs and calculations.

All 175 previously selectable countries remain in the index. Of these, 167 support a calculation: 160 use the full WEO horizon through 2031, and seven use an explicitly shorter complete window. Eight return an explanation instead of a modeled result. The baseline and additional climate comparisons begin at H+1, retaining the original calendar climate index and anchoring it at H. No catch-up shock is inserted.

Coverage rules require a contiguous complete macro/fiscal window from 2009, usable consecutive WDI history, and valid calendar climate indices from H onward. Later source rows remain in the payload when the usable window is shorter. Blank cached source status fields do not establish a common observed/forecast cutoff.

## Full WEO window

All following 160 countries calculate through H=2031 and begin long-run assumptions and additional climate comparisons in 2032:

AGO, ALB, ARE, ARG, ARM, AUS, AUT, AZE, BDI, BEL, BEN, BFA, BGD, BGR, BHR, BHS, BIH, BLR, BLZ, BRA, BRB, BRN, BTN, BWA, CAF, CAN, CHE, CHL, CHN, CIV, CMR, COD, COG, COL, COM, CPV, CRI, CYP, CZE, DEU, DNK, DOM, DZA, EGY, ESP, EST, ETH, FIN, FJI, FRA, GAB, GBR, GEO, GHA, GIN, GMB, GNB, GNQ, GRC, GTM, GUY, HKG, HND, HRV, HTI, HUN, IDN, IND, IRL, IRN, IRQ, ISL, ISR, ITA, JAM, JOR, JPN, KAZ, KEN, KGZ, KHM, KOR, KWT, LAO, LBR, LCA, LSO, LTU, LUX, LVA, MAR, MDA, MDG, MDV, MEX, MKD, MLI, MLT, MMR, MNE, MNG, MOZ, MRT, MUS, MWI, MYS, NAM, NER, NGA, NIC, NLD, NOR, NPL, NZL, OMN, PAK, PAN, PER, PHL, PNG, POL, PRT, PRY, QAT, ROU, RUS, RWA, SAU, SDN, SEN, SLB, SLE, SLV, SRB, STP, SUR, SVK, SVN, SWE, SWZ, TCD, TGO, THA, TJK, TLS, TON, TTO, TUN, TUR, TZA, UGA, UKR, URY, USA, UZB, VCT, VNM, VUT, ZAF, ZWE.

## Shorter usable windows

| Country | H | First projection | Source last available year | Reason |
| --- | ---: | ---: | ---: | --- |
| Afghanistan (AFG) | 2025 | 2026 | 2025 | Country WEO inputs end at 2025; this release extends to 2031 for other countries. |
| Bolivia (BOL) | 2026 | 2027 | 2026 | Country WEO inputs end at 2026; this release extends to 2031 for other countries. |
| Ecuador (ECU) | 2025 | 2026 | 2031 | Incomplete WEO inputs at 2026: revenue, expenditure, overall_balance, primary_balance, debt, primary_expenditure, interest_expenditure, total_expenditure, revenue_percent_gdp, primary_expenditure_percent_gdp, primary_balance_percent_gdp, overall_balance_percent_gdp, interest_expenditure_percent_gdp, debt_to_gdp. |
| Lebanon (LBN) | 2025 | 2026 | 2025 | Country WEO inputs end at 2025; this release extends to 2031 for other countries. |
| Macao SAR (MAC) | 2022 | 2023 | 2031 | Incomplete WEO inputs at 2023: primary_balance, primary_expenditure, interest_expenditure, primary_expenditure_percent_gdp, primary_balance_percent_gdp, interest_expenditure_percent_gdp. |
| Sri Lanka (LKA) | 2024 | 2025 | 2024 | Country WEO inputs end at 2024; this release extends to 2031 for other countries. |
| Zambia (ZMB) | 2025 | 2026 | 2031 | Incomplete WEO inputs at 2026: debt, debt_to_gdp. |

## Unsupported calculations

| Country | Reason |
| --- | --- |
| Djibouti (DJI) | The WDI history needed for consecutive productivity growth is incomplete. |
| Libya (LBY) | Incomplete WEO inputs at 2009: debt, debt_to_gdp. |
| Puerto Rico (PRI) | Incomplete WEO inputs at 2009: revenue, expenditure, overall_balance, primary_balance, primary_expenditure, interest_expenditure, total_expenditure, revenue_percent_gdp, primary_expenditure_percent_gdp, primary_balance_percent_gdp, overall_balance_percent_gdp, interest_expenditure_percent_gdp. |
| Samoa (WSM) | Incomplete WEO inputs at 2009: primary_balance, primary_expenditure, interest_expenditure, primary_expenditure_percent_gdp, primary_balance_percent_gdp, interest_expenditure_percent_gdp. |
| Singapore (SGP) | Incomplete WEO inputs at 2009: primary_balance, primary_expenditure, interest_expenditure, primary_expenditure_percent_gdp, primary_balance_percent_gdp, interest_expenditure_percent_gdp. |
| Somalia (SOM) | Incomplete WEO inputs at 2009: real_gdp, nominal_gdp, gdp_deflator, revenue, expenditure, overall_balance, primary_balance, debt, real_gdp_growth_percent, nominal_gdp_growth_percent, gdp_deflator_growth_percent, primary_expenditure, interest_expenditure, total_expenditure, revenue_percent_gdp, primary_expenditure_percent_gdp, primary_balance_percent_gdp, overall_balance_percent_gdp, interest_expenditure_percent_gdp, debt_to_gdp. |
| Syria (SYR) | No usable climate index for Paris at calendar year 2010. |
| West Bank and Gaza (PSE) | Incomplete WEO inputs at 2009: primary_balance, primary_expenditure, interest_expenditure, primary_expenditure_percent_gdp, primary_balance_percent_gdp, interest_expenditure_percent_gdp. |

## Validation scope

- The final all-country run enumerated all 175 and compared all returned numeric fields across Python and TypeScript for all 167 supported countries at the default parameter set. All eight unsupported outcomes were checked in both engines. There were 2,564,497 numeric comparisons; maximum absolute difference normalized by max(1, abs(Python), abs(TypeScript)) was 1.1768707860360872e-16. This is implementation agreement, not independent economic validation.
- Uganda has independent raw-CSV and first-2032 arithmetic proofs: 504 checks at default debt target 50 and 504 at target 60, with explicit parameter records. Target 60 produces a prior-year fiscal adjustment of 5648.61767208626, 2032 primary expenditure of 93292.14395512528 LCU billion, debt of 277079.2073179046 LCU billion, and debt/GDP of about 52.16813717605595 percent. The parent's independent reviewer reproduced this case without production imports.
- All existing Verified input file bytes and old Current file bytes match the accepted CC29 lane. All retained UN/WDI/climate arrays match old Current. The 270 Python and 154 TypeScript engine tests include the existing official golden-master/edge regression fixtures plus the new rolling-profile checks. This does not claim a fresh 147-country official-workbook rerun or new IMF endorsement.
- Parameter timing, leading-zero/all-zero climate, shorter windows, first-year arithmetic, unknown policy IDs and stale boundary metadata have focused regression checks. The all-country numerical sweep covers defaults, not every setting combination.

The committed `data/vintages/weo-2026-04-full-horizon-v1/manifest.json` contains the full machine-readable country metadata and input identities. Detailed local receipts are `.work/engine/all-country-agreement.json`, `uganda-raw-proof.json`, `uganda-target60-raw-proof.json`, `uganda-2028-2033.csv`, `python-tests.log`, `typescript-tests.log`, and `ENGINE-VERDICT.json`. Reproduce the census with `scripts/verify_full_horizon_matrix.py` after the offline input builder and TypeScript engine compile. No publication authorization is included.
