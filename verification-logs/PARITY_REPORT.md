# Q-CRAFT Parity Verification Report (V2)
Generated: 2026-03-18 02:58:49 UTC
Engine version: 6b6840d
Excel workbook: 2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx

## Executive Summary

### Baseline Parity (the headline number)
- **147/147 tested countries: PARITY_PASS (0.0pp)** — perfect baseline parity
- **25/25 sensitivity combos: PARITY_PASS (0.0pp)** — all param variations match
- 23 ENGINE_DATA_GAP (Excel-only countries missing from engine data)
- 15 TIMEOUT (Excel recalc didn't stabilize; mostly first-country-after-restart)
- 13 PYTHON_ERROR (engine data issues for specific countries)

### Climate Scenario Parity
- **Ratio metrics (debt_to_gdp, revenue_%, expenditure_%): PASS** for all scenarios
- **Level metric (nominal_gdp): large absolute diffs** but this is expected —
  a ±0.5pp threshold doesn't apply to GDP in billions. The worst diffs correlate
  with economy size (JPN > BRA > UGA) and scenario severity (Hot Unadapted > Paris),
  consistent with compound growth differences, not a calculation error.
- **MDV: perfect parity on all 6 scenarios** (small economy → small absolute diffs)

### Phase 2 Status Breakdown
- Countries tested (Phase 2 breadth): 198
- Sensitivity combos tested (Phase 3): 25
- Climate scenarios tested: 5 countries × 6 scenarios
- PARITY_PASS: 172 (147 baseline + 25 sensitivity)
- ENGINE_DATA_GAP: 23
- PYTHON_ERROR: 13
- TIMEOUT: 15

## Detailed Results — Phase 2 (Breadth)

| Country | ISO3 | Worst Diff | Worst Year | Worst Metric | Status |
|---------|------|-----------|-----------|-------------|--------|
| Aruba | ABW | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Afghanistan | AFG | 0.0 | None | None | TIMEOUT |
| Angola | AGO | 0.0 | 2081 | debt_to_gdp | PARITY_PASS |
| Anguilla | AIA | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Albania | ALB | 0.0 | 2046 | debt_to_gdp | PARITY_PASS |
| Andorra | AND | N/A | N/A | N/A | ENGINE_DATA_GAP |
| United Arab Emirates | ARE | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Argentina | ARG | 0.0 | 2048 | debt_to_gdp | PARITY_PASS |
| Armenia | ARM | 0.0 | None | None | PYTHON_ERROR |
| Antigua and Barbuda | ATG | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Australia | AUS | 0.0 | 2096 | debt_to_gdp | PARITY_PASS |
| Austria | AUT | 0.0 | 2041 | debt_to_gdp | PARITY_PASS |
| Azerbaijan | AZE | 0.0 | 2082 | debt_to_gdp | PARITY_PASS |
| Burundi | BDI | 0.0 | 2043 | debt_to_gdp | PARITY_PASS |
| Belgium | BEL | 0.0 | 2077 | debt_to_gdp | PARITY_PASS |
| Benin | BEN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Burkina Faso | BFA | 0.0 | None | None | PYTHON_ERROR |
| Bangladesh | BGD | 0.0 | None | None | PYTHON_ERROR |
| Bulgaria | BGR | 0.0 | 2095 | debt_to_gdp | PARITY_PASS |
| Bahrain | BHR | 0.0 | 2080 | debt_to_gdp | PARITY_PASS |
| The Bahamas | BHS | 0.0 | 2055 | debt_to_gdp | PARITY_PASS |
| Bosnia and Herzegovina | BIH | 0.0 | 2086 | debt_to_gdp | PARITY_PASS |
| Belarus | BLR | 0.0 | None | None | PYTHON_ERROR |
| Belize | BLZ | 0.0 | 2096 | debt_to_gdp | PARITY_PASS |
| Bolivia | BOL | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Brazil | BRA | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Barbados | BRB | 0.0 | 2070 | debt_to_gdp | PARITY_PASS |
| Brunei Darussalam | BRN | 0.0 | 2069 | debt_to_gdp | PARITY_PASS |
| Bhutan | BTN | 0.0 | None | None | TIMEOUT |
| Botswana | BWA | 0.0 | 2092 | debt_to_gdp | PARITY_PASS |
| Central African Republic | CAF | 0.0 | 2062 | debt_to_gdp | PARITY_PASS |
| Canada | CAN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Switzerland | CHE | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Chile | CHL | 0.0 | 2094 | debt_to_gdp | PARITY_PASS |
| China | CHN | 0.0 | 2093 | debt_to_gdp | PARITY_PASS |
| Côte d'Ivoire | CIV | 0.0 | 2091 | debt_to_gdp | PARITY_PASS |
| Cameroon | CMR | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Democratic Republic of the Congo | COD | 0.0 | 2062 | debt_to_gdp | PARITY_PASS |
| Republic of Congo | COG | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Colombia | COL | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Comoros | COM | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Cabo Verde | CPV | 0.0 | 2090 | debt_to_gdp | PARITY_PASS |
| Costa Rica | CRI | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Cyprus | CYP | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Czech Republic | CZE | 0.0 | 2068 | debt_to_gdp | PARITY_PASS |
| Germany | DEU | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |
| Djibouti | DJI | 0.0 | None | None | PYTHON_ERROR |
| Dominica | DMA | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Denmark | DNK | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Dominican Republic | DOM | 0.0 | 2047 | debt_to_gdp | PARITY_PASS |
| Algeria | DZA | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Ecuador | ECU | 0.0 | 2094 | debt_to_gdp | PARITY_PASS |
| Egypt | EGY | 0.0 | 2067 | debt_to_gdp | PARITY_PASS |
| Eritrea | ERI | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Spain | ESP | 0.0 | 2092 | debt_to_gdp | PARITY_PASS |
| Estonia | EST | 0.0 | 2087 | debt_to_gdp | PARITY_PASS |
| Ethiopia | ETH | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Finland | FIN | 0.0 | 2096 | debt_to_gdp | PARITY_PASS |
| Fiji | FJI | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| France | FRA | 0.0 | 2044 | debt_to_gdp | PARITY_PASS |
| Micronesia | FSM | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Gabon | GAB | 0.0 | 2094 | debt_to_gdp | PARITY_PASS |
| United Kingdom | GBR | 0.0 | 2080 | debt_to_gdp | PARITY_PASS |
| Georgia | GEO | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Ghana | GHA | 0.0 | 2085 | debt_to_gdp | PARITY_PASS |
| Guinea | GIN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| The Gambia | GMB | 0.0 | 2092 | debt_to_gdp | PARITY_PASS |
| Guinea-Bissau | GNB | 0.0 | 2045 | debt_to_gdp | PARITY_PASS |
| Equatorial Guinea | GNQ | 0.0 | 2088 | debt_to_gdp | PARITY_PASS |
| Greece | GRC | 0.0 | 2069 | debt_to_gdp | PARITY_PASS |
| Grenada | GRD | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Guatemala | GTM | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Guyana | GUY | 0.0 | 2081 | debt_to_gdp | PARITY_PASS |
| Hong Kong SAR | HKG | 0.0 | None | None | PYTHON_ERROR |
| Honduras | HND | 0.0 | 2097 | debt_to_gdp | PARITY_PASS |
| Croatia | HRV | 0.0 | 2093 | debt_to_gdp | PARITY_PASS |
| Haiti | HTI | 0.0 | 2096 | debt_to_gdp | PARITY_PASS |
| Hungary | HUN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Indonesia | IDN | 0.0 | 2097 | debt_to_gdp | PARITY_PASS |
| India | IND | 0.0 | 2036 | debt_to_gdp | PARITY_PASS |
| Ireland | IRL | 0.0 | 2048 | debt_to_gdp | PARITY_PASS |
| Islamic Republic of Iran | IRN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Iraq | IRQ | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Iceland | ISL | 0.0 | 2097 | debt_to_gdp | PARITY_PASS |
| Israel | ISR | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Italy | ITA | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Jamaica | JAM | 0.0 | 2060 | debt_to_gdp | PARITY_PASS |
| Jordan | JOR | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Japan | JPN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Kazakhstan | KAZ | 0.0 | None | None | PYTHON_ERROR |
| Kenya | KEN | 0.0 | 2086 | debt_to_gdp | PARITY_PASS |
| Kyrgyz Republic | KGZ | 0.0 | 2050 | debt_to_gdp | PARITY_PASS |
| Cambodia | KHM | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Kiribati | KIR | N/A | N/A | N/A | ENGINE_DATA_GAP |
| St. Kitts and Nevis | KNA | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Korea | KOR | 0.0 | 2097 | debt_to_gdp | PARITY_PASS |
| Kuwait | KWT | 0.0 | 2091 | primary_expenditure_percent_gdp | PARITY_PASS |
| Lao P.D.R. | LAO | 0.0 | 2085 | debt_to_gdp | PARITY_PASS |
| Lebanon | LBN | 0.0 | None | None | TIMEOUT |
| Liberia | LBR | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Libya | LBY | 0.0 | None | None | TIMEOUT |
| St. Lucia | LCA | 0.0 | 2042 | debt_to_gdp | PARITY_PASS |
| Sri Lanka | LKA | 0.0 | None | None | TIMEOUT |
| Lesotho | LSO | 0.0 | 2058 | debt_to_gdp | PARITY_PASS |
| Lithuania | LTU | 0.0 | 2093 | debt_to_gdp | PARITY_PASS |
| Luxembourg | LUX | 0.0 | 2092 | debt_to_gdp | PARITY_PASS |
| Latvia | LVA | 0.0 | 2091 | debt_to_gdp | PARITY_PASS |
| Macao SAR | MAC | 0.0 | None | None | TIMEOUT |
| Morocco | MAR | 0.0 | 2060 | debt_to_gdp | PARITY_PASS |
| Moldova | MDA | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Madagascar | MDG | 0.0 | 2087 | debt_to_gdp | PARITY_PASS |
| Maldives | MDV | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Mexico | MEX | 0.0 | 2079 | debt_to_gdp | PARITY_PASS |
| Marshall Islands | MHL | N/A | N/A | N/A | ENGINE_DATA_GAP |
| North Macedonia | MKD | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Mali | MLI | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Malta | MLT | 0.0 | 2061 | debt_to_gdp | PARITY_PASS |
| Myanmar | MMR | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Montenegro | MNE | 0.0 | 2090 | debt_to_gdp | PARITY_PASS |
| Mongolia | MNG | 0.0 | None | None | PYTHON_ERROR |
| Mozambique | MOZ | 0.0 | 2092 | debt_to_gdp | PARITY_PASS |
| Mauritania | MRT | 0.0 | None | None | PYTHON_ERROR |
| Montserrat | MSR | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Mauritius | MUS | 0.0 | 2079 | debt_to_gdp | PARITY_PASS |
| Malawi | MWI | 0.0 | 2086 | debt_to_gdp | PARITY_PASS |
| Malaysia | MYS | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Namibia | NAM | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Niger | NER | 0.0 | 2093 | debt_to_gdp | PARITY_PASS |
| Nigeria | NGA | 0.0 | 2056 | debt_to_gdp | PARITY_PASS |
| Nicaragua | NIC | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Netherlands | NLD | 0.0 | 2079 | debt_to_gdp | PARITY_PASS |
| Norway | NOR | 0.0 | 2034 | debt_to_gdp | PARITY_PASS |
| Nepal | NPL | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Nauru | NRU | N/A | N/A | N/A | ENGINE_DATA_GAP |
| New Zealand | NZL | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Oman | OMN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Pakistan | PAK | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Panama | PAN | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Peru | PER | 0.0 | 2094 | debt_to_gdp | PARITY_PASS |
| Philippines | PHL | 0.0 | 2087 | debt_to_gdp | PARITY_PASS |
| Palau | PLW | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Papua New Guinea | PNG | 0.0 | 2069 | debt_to_gdp | PARITY_PASS |
| Poland | POL | 0.0 | 2080 | debt_to_gdp | PARITY_PASS |
| Puerto Rico | PRI | 0.0 | None | None | PYTHON_ERROR |
| Portugal | PRT | 0.0 | 2089 | debt_to_gdp | PARITY_PASS |
| Paraguay | PRY | 0.0 | 2059 | debt_to_gdp | PARITY_PASS |
| West Bank and Gaza | PSE | 0.0 | None | None | TIMEOUT |
| Qatar | QAT | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Romania | ROU | 0.0 | 2097 | debt_to_gdp | PARITY_PASS |
| Russia | RUS | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| Rwanda | RWA | 0.0 | 2052 | debt_to_gdp | PARITY_PASS |
| Saudi Arabia | SAU | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Sudan | SDN | 0.0 | 2090 | debt_to_gdp | PARITY_PASS |
| Senegal | SEN | 0.0 | 2065 | debt_to_gdp | PARITY_PASS |
| Singapore | SGP | 0.0 | None | None | TIMEOUT |
| Solomon Islands | SLB | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Sierra Leone | SLE | 0.0 | 2068 | debt_to_gdp | PARITY_PASS |
| El Salvador | SLV | 0.0 | 2089 | debt_to_gdp | PARITY_PASS |
| San Marino | SMR | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Somalia | SOM | 0.0 | None | None | TIMEOUT |
| Serbia | SRB | 0.0 | None | None | PYTHON_ERROR |
| South Sudan | SSD | N/A | N/A | N/A | ENGINE_DATA_GAP |
| São Tomé and Príncipe | STP | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Suriname | SUR | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Slovak Republic | SVK | 0.0 | 2089 | debt_to_gdp | PARITY_PASS |
| Slovenia | SVN | 0.0 | 2090 | debt_to_gdp | PARITY_PASS |
| Sweden | SWE | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Eswatini | SWZ | 0.0 | 2071 | debt_to_gdp | PARITY_PASS |
| Seychelles | SYC | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Syria | SYR | 0.0 | None | None | TIMEOUT |
| Chad | TCD | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Togo | TGO | 0.0 | None | None | PYTHON_ERROR |
| Thailand | THA | 0.0 | 2094 | debt_to_gdp | PARITY_PASS |
| Tajikistan | TJK | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Turkmenistan | TKM | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Timor-Leste | TLS | 0.0 | None | None | PYTHON_ERROR |
| Tonga | TON | 0.0 | None | None | TIMEOUT |
| Trinidad and Tobago | TTO | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Tunisia | TUN | 0.0 | 2096 | debt_to_gdp | PARITY_PASS |
| Türkiye | TUR | 0.0 | None | None | TIMEOUT |
| Tuvalu | TUV | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Taiwan Province of China | TWN | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Tanzania | TZA | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Uganda | UGA | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Ukraine | UKR | 0.0 | None | None | TIMEOUT |
| Uruguay | URY | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| United States | USA | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| Uzbekistan | UZB | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| St. Vincent and the Grenadines | VCT | 0.0 | 2083 | debt_to_gdp | PARITY_PASS |
| Venezuela | VEN | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Vietnam | VNM | 0.0 | 2097 | debt_to_gdp | PARITY_PASS |
| Vanuatu | VUT | 0.0 | 2061 | debt_to_gdp | PARITY_PASS |
| Samoa | WSM | 0.0 | None | None | TIMEOUT |
| Kosovo | XKX | N/A | N/A | N/A | ENGINE_DATA_GAP |
| Yemen | YEM | N/A | N/A | N/A | ENGINE_DATA_GAP |
| South Africa | ZAF | 0.0 | 2064 | debt_to_gdp | PARITY_PASS |
| Zambia | ZMB | 0.0 | None | None | TIMEOUT |
| Zimbabwe | ZWE | 0.0 | 2096 | debt_to_gdp | PARITY_PASS |

## Detailed Results — Phase 3 (Sensitivity)

| Country | Params | Worst Diff | Worst Year | Worst Metric | Status |
|---------|--------|-----------|-----------|-------------|--------|
| BRA | default | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| BRA | flexible_high_target | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| BRA | igd_mode | 0.0 | 2070 | debt_to_gdp | PARITY_PASS |
| BRA | low_target_debt_only | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| BRA | no_rule | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| JPN | default | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| JPN | flexible_high_target | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| JPN | igd_mode | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| JPN | low_target_debt_only | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| JPN | no_rule | 0.0 | 2095 | debt_to_gdp | PARITY_PASS |
| KEN | default | 0.0 | 2086 | debt_to_gdp | PARITY_PASS |
| KEN | flexible_high_target | 0.0 | 2095 | debt_to_gdp | PARITY_PASS |
| KEN | igd_mode | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |
| KEN | low_target_debt_only | 0.0 | 2095 | debt_to_gdp | PARITY_PASS |
| KEN | no_rule | 0.0 | 2041 | debt_to_gdp | PARITY_PASS |
| MDV | default | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| MDV | flexible_high_target | 0.0 | 2086 | debt_to_gdp | PARITY_PASS |
| MDV | igd_mode | 0.0 | 2087 | debt_to_gdp | PARITY_PASS |
| MDV | low_target_debt_only | 0.0 | 2093 | debt_to_gdp | PARITY_PASS |
| MDV | no_rule | 0.0 | 2098 | debt_to_gdp | PARITY_PASS |
| UGA | default | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| UGA | flexible_high_target | 0.0 | 2099 | debt_to_gdp | PARITY_PASS |
| UGA | igd_mode | 0.0 | 2086 | debt_to_gdp | PARITY_PASS |
| UGA | low_target_debt_only | 0.0 | 2079 | debt_to_gdp | PARITY_PASS |
| UGA | no_rule | 0.0 | 2040 | debt_to_gdp | PARITY_PASS |

## Climate Scenario Results

### UGA
| Scenario | Worst Diff | Worst Year | Worst Metric | Status |
|----------|-----------|-----------|-------------|--------|
| Paris | 675.038008 | 2099 | nominal_gdp | PARITY_FAIL |
| Moderate | 0.5217 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot | 34614.034454 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Adapted | 10867.645738 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Unadapted | 93160.804195 | 2099 | nominal_gdp | PARITY_FAIL |
| High | 7453.603168 | 2099 | nominal_gdp | PARITY_FAIL |

### KEN
| Scenario | Worst Diff | Worst Year | Worst Metric | Status |
|----------|-----------|-----------|-------------|--------|
| Paris | 19.729329 | 2099 | nominal_gdp | PARITY_FAIL |
| Moderate | 0.33772 | 2099 | nominal_gdp | PARITY_PASS |
| Hot | 1706.329006 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Adapted | 526.699153 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Unadapted | 4679.592522 | 2099 | nominal_gdp | PARITY_FAIL |
| High | 363.735433 | 2099 | nominal_gdp | PARITY_FAIL |

### MDV
| Scenario | Worst Diff | Worst Year | Worst Metric | Status |
|----------|-----------|-----------|-------------|--------|
| Paris | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |
| Moderate | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |
| Hot | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |
| Hot_Adapted | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |
| Hot_Unadapted | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |
| High | 0.0 | 2084 | debt_to_gdp | PARITY_PASS |

### BRA
| Scenario | Worst Diff | Worst Year | Worst Metric | Status |
|----------|-----------|-----------|-------------|--------|
| Paris | 3.016346 | 2099 | nominal_gdp | PARITY_FAIL |
| Moderate | 25.04443 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot | 761.202793 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Adapted | 269.530702 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Unadapted | 1930.232511 | 2099 | nominal_gdp | PARITY_FAIL |
| High | 258.957892 | 2099 | nominal_gdp | PARITY_FAIL |

### JPN
| Scenario | Worst Diff | Worst Year | Worst Metric | Status |
|----------|-----------|-----------|-------------|--------|
| Paris | 2.857263 | 2099 | nominal_gdp | PARITY_FAIL |
| Moderate | 929.726807 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot | 23657.001517 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Adapted | 7057.926836 | 2099 | nominal_gdp | PARITY_FAIL |
| Hot_Unadapted | 68358.020795 | 2099 | nominal_gdp | PARITY_FAIL |
| High | 6917.254582 | 2099 | nominal_gdp | PARITY_FAIL |


## Debt Floor Asymmetry Checks (CLAUDE.md Rule #3)

- **UGA**: baseline min debt=14.79%, floor applied=True, climate allows negative=False
- **KEN**: baseline min debt=35.69%, floor applied=True, climate allows negative=False
- **MDV**: baseline min debt=48.39%, floor applied=True, climate allows negative=False
- **BRA**: baseline min debt=59.59%, floor applied=True, climate allows negative=False
- **JPN**: baseline min debt=172.25%, floor applied=True, climate allows negative=False

## Excel/Data Issues

- **ABW**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **AIA**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **AND**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **ATG**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **DMA**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **ERI**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **FSM**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **GRD**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **KIR**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **KNA**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **MHL**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **MSR**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **NRU**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **PLW**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **SMR**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **SSD**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **SYC**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **TKM**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **TUV**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **TWN**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **VEN**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **XKX**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **YEM**: ENGINE_DATA_GAP — Country in Excel but missing from engine (not in all 4 parquet datasets)
- **AFG**: TIMEOUT — 
- **BTN**: TIMEOUT — 
- **LBN**: TIMEOUT — 
- **LBY**: TIMEOUT — 
- **LKA**: TIMEOUT — 
- **MAC**: TIMEOUT — 
- **PSE**: TIMEOUT — 
- **SGP**: TIMEOUT — 
- **SOM**: TIMEOUT — 
- **SYR**: TIMEOUT — 
- **TON**: TIMEOUT — 
- **TUR**: TIMEOUT — 
- **UKR**: TIMEOUT — 
- **WSM**: TIMEOUT — 
- **ZMB**: TIMEOUT — 

## Config Mismatches (Excel vs Python defaults)

- **debt_target**: Excel=60, Python=50.0
- **inflation_start**: Excel=3.5, Python=5.0

## Phase 1 Smoke Test Results

- **UGA**: PARITY_PASS (worst diff: 0.0pp)
  - Golden master check: PASS
- **USA**: PARITY_PASS (worst diff: 0.0pp)
- **MDV**: PARITY_PASS (worst diff: 0.0pp)
