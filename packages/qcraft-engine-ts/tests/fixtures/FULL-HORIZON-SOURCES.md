# Current transition fixtures

UGA-full-horizon.json is the offline full-horizon builder's raw Uganda payload, using the retained UN/WDI/climate slices. UGA-weo-raw.csv contains the Uganda rows of the exact original IMF SDMX file (SHA-256 25aba501e0672b9340e26d0238d77f719da8cdcd4553df7280775ae6bf4be032), without unit conversion. UGA-full-horizon-first-year.csv contains independently calculated expected 2032 rows from scripts/verify_full_horizon_uganda.py, whose oracle uses explicit equations and raw inputs, not production math helpers. It uses engine defaults as parameter inputs, not as expected outputs.

These are new-profile regression inputs and independent arithmetic expectations. They are not additional official IMF golden masters. Existing golden masters remain untouched. First regenerate the offline Uganda input and run that proof before intentionally refreshing these fixtures.
