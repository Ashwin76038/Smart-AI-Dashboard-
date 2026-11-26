# Smart Data Analysis Dashboard

A local React and Flask analytics prototype that turns an uploaded table into field profiles, chart suggestions and constrained analytical queries. It demonstrates data preparation, API design and visualization logic; chart recommendations are deterministic, with optional model-assisted query translation.

## What is implemented

1. Upload CSV, XLSX or JSON within a 10 MB request limit.
2. Normalize column names and reject empty tables or tables above 50,000 rows / 200 columns.
3. Report field types, missing values and duplicate observations without silently dropping or imputing them.
4. Suggest category counts, numeric distributions, scatter plots and category means.
5. Explore Vega-Lite charts and Graphic Walker views, or request a supported analytical operation.

The UI login is a demonstration, not production authentication. No accepted current screenshot is included, so the setup below is the entry point for reviewing the application.

## Analytical behavior

`backend/safe_query.py` executes a closed set of `count`, `preview`, `sum`, `mean`, `min` and `max` operations. Numeric operations validate the selected field and optional grouping column; generated Python is never executed. All-missing sums remain missing instead of becoming zero.

For example, values 2, 3 and 5 in groups A, A and B produce grouped sums of A=5 and B=5. This is a representative test case, not a business-impact claim. Offline chat supports `count rows` and `preview`; other questions require a structured plan or optional model translation. Query responses show at most 20 result rows and disclose the full result-row count.

Category counts and means use the full dataset. Histograms and scatter plots use the first 100 rows, so they may not represent the full distribution. The full-data endpoint returns at most 10,000 rows; Explorer caps at 50,000. Chart captions and metadata disclose sampling scope.

## Architecture and source map

```text
React / TypeScript interface
    -> Flask upload and query API
    -> pandas preparation and profiling
    -> deterministic chart specifications / validated query operations
    -> Vega-Lite and Graphic Walker views
```

| Location | Responsibility |
|---|---|
| `src/` | React views, filters and visualization rendering |
| `backend/app.py` | Upload routes, charts and optional query translation |
| `backend/cleaning.py` | Column normalization and missingness reporting |
| `backend/safe_query.py` | Validated analytical operations |
| `backend/services/` | Field profiling and recommendation components |
| `tests/test_analytics.py` | Preparation, query, chart-population and API checks |

## Run locally

Run the frontend from the repository root:

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

In a second terminal, create/activate a Python virtual environment, then run:

```bash
python -m pip install -r backend/requirements.txt
cd backend
python app.py
```

Open `http://localhost:8080` (or the port Vite reports). The API listens on `127.0.0.1:5000`. Use approved demonstration data. Optional configuration is documented in `backend/.env.example`; external AI is disabled by default.

## Checks

From the repository root:

```bash
python -m unittest discover -s tests -v
npm run build
npm run lint
```

On 26 November 2026, all six Python tests passed against the reviewed source, covering conservative cleaning, empty input, column collisions, chart populations, closed query operations and basic upload/path handling. The frontend build, linter and browser journey were not rerun for this documentation update. Frontend upload validation, chart corrections and dependency remediation in an unmerged PR are not part of the default-branch behavior described here.

## Privacy, security and limitations

Uploads receive random server identifiers and persist as local CSVs under `backend/uploads` until removed. Missing values and duplicates are preserved for domain-specific decisions. There is no tenant isolation or production authentication; do not expose the prototype as a shared service.

Setting `ENABLE_EXTERNAL_AI=true` with a Gemini key allows dataset schema and analytical questions to leave the local machine for that provider. The optional integration uses a deprecated SDK and has not been externally validated. Keep it disabled until migrated and tested. Dependency findings and unmerged fixes require review before wider deployment. Chart cross-filtering, browser failure cases and clean-environment setup are not established by the Python unit tests.

## Author

[Aswin S](https://github.com/Ashwin76038)
