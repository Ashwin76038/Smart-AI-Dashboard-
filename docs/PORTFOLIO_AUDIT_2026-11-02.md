# Upload and chart repairs — 2 November 2026

Partially completed. Invalid ZIP files renamed XLSX previously produced HTTP
500. Validate required workbook members before parsing and return HTTP 400.
Regression covers CSV, JSON, XLSX, analytical queries and chart generation.

The frontend omits fabricated radar filler values and unsupported paired
metrics, preserves measured zeros, excludes missing scatter measurements,
and labels preview coverage. Deterministic charts no longer claim Gemini
reasoning. Optional legacy Gemini integration remains experimental.

Executed: seven Python tests and two Node tests passed. Production build
passed from the equivalent short-path checkout after Windows dependency
installation failed at the long path. Browser interactions and optional
external-model calls were not executed. The large bundle warning remains.

Readiness: 6/10. Local data workflows have regression evidence; browser
acceptance and optional SDK modernization remain open.
