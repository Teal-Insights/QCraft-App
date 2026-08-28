# BLOCKED (worked around): IMF bulk WEO download

**Date:** 2026-08-26 · **Lane:** 3 (TEA-1401) · **Status:** worked around, not blocking.

## What is blocked

Every path on `www.imf.org` returns HTTP 403 from this host. The response is an
Akamai edge page (`<TITLE>Access Denied</TITLE> ... You don't have permission to
access ... on this server`), not a 404, and it is returned for the site root as
well as for data files — so it is a host-wide edge block, not a missing resource.

Exact URLs tried, all `403`, with browser User-Agent, `Accept`, `Accept-Language`
and `Referer` headers, over HTTP/1.1 and HTTP/2:

```
https://www.imf.org/-/media/Files/Publications/WEO/WEO-Database/2026/April/WEOApr2026all.ashx
https://www.imf.org/-/media/Files/Publications/WEO/WEO-Database/2026/april/WEOApr2026all.ashx
https://www.imf.org/-/media/Files/Publications/WEO/WEO-Database/2025/October/WEOOct2025all.ashx
https://www.imf.org/-/media/Files/Publications/WEO/WEO-Database/2025/April/WEOApr2025all.ashx
https://www.imf.org/-/media/Files/Publications/WEO/WEO-Database/2024/October/WEOOct2024all.ashx
https://www.imf.org/en/Publications/WEO/weo-database/2026/April/download-entire-database
https://www.imf.org/en/Publications/WEO/weo-database/2026/April
https://www.imf.org/external/datamapper/api/v1/NGDPD?periods=2025
https://www.imf.org/external/datamapper/api/v1/indicators
https://www.imf.org/
https://data.imf.org/
```

`dataservices.imf.org` (the old SDMX host) no longer resolves in DNS.

Note the Oct-2024 URL is also 403. That file is known to have worked historically,
which confirms the block is on the client/edge rather than on the vintage.

## Workaround in use

`https://api.imf.org/external/sdmx/2.1/` is reachable and unauthenticated. It
serves the same WEO data as SDMX:

```
https://api.imf.org/external/sdmx/2.1/dataflow
https://api.imf.org/external/sdmx/2.1/datastructure/IMF.RES/DSD_WEO/9.0.0?references=children
https://api.imf.org/external/sdmx/2.1/data/IMF.RES,WEO,9.0.0/.<INDICATORS>.A?detail=dataonly
```

Verified this is the April 2026 vintage, not a stale one:

- `PUBLICATION_DATE = 2026-04-14T13:00:00Z`, `UPDATE_DATE = 2026-04-15T13:00:00Z`
- projections run through **2031** (Oct 2024 ran through 2029)
- `LATEST_ACTUAL_ANNUAL_DATA = 2024`
- the dataflow list also offers `WEO_2025_OCT_VINTAGE`; the unsuffixed
  `IMF.RES:WEO(9.0.0)` is the current release and is newer than it.

Values reconcile with the frozen vintage where they should: Uganda 2009
`NGDP_R` = 74,760,000,000,000 shillings ÷ 1e9 = 74,760.0, identical to
`macrofiscal.parquet`.

## Impact

None on deliverables. The pipeline fetches WEO from `api.imf.org`. If the Akamai
block later lifts, `pipeline/src/qcraft_pipeline/weo.py` is the only file that
would need to change to read the bulk `.ashx` instead.

## If someone wants the bulk file anyway

Try from a different network/IP, or open the download page in a real browser and
save the file to `pipeline/.cache/raw/`. The pipeline does not need it.
