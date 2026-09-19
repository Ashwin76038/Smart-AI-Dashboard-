# Smart Data Analysis Dashboard

A local analytics prototype for uploading tabular data, profiling fields and exploring charts.

## Business problem

Initial dataset exploration is repetitive: analysts need to inspect missing values, understand field types and choose suitable visualizations before drawing conclusions. This project combines those steps in a React interface and Flask API.

## Implemented workflow

Upload CSV/XLSX/JSON -> validate file and shape -> normalize column names -> profile missingness and distributions -> recommend charts -> render Vega-Lite and Graphic Walker views.

Chart selection and captions are deterministic. Gemini is optional for translating analytical questions into a validated operation plan. Active chart rules cover category counts, numeric distributions, scatter plots and category means. These rules select charts; they do not prove business insights.

Uploads are limited to 10 MB, 50,000 rows and 200 columns. Uploaded names are replaced with random server identifiers; prepared data is always stored as CSV. Duplicate observations and missing values are preserved and reported because automatic removal/imputation can bias business results.

## Analytical queries

The API executes only validated `count`, `preview`, `sum`, `mean`, `min` and `max` operations, optionally grouped by an existing column. Generated Python is never executed. Offline chat supports `count rows` and `preview`; other questions require a structured plan or optional model translation. Results are limited to 20 rows with the full result-row count disclosed.

## Local setup

```bash
npm ci
npm run dev
python -m pip install -r backend/requirements.txt
cd backend
python app.py
```

The API binds to 127.0.0.1:5000. Start the frontend at its Vite-configured port. Copy `backend/.env.example` to `backend/.env` only if configuring optional model access.

## Data privacy and limitations

External AI is off by default. Enabling `ENABLE_EXTERNAL_AI=true` with a Gemini key permits dataset schema and analytical questions to be sent to that provider; use only approved demonstration data. Uploads persist locally in `backend/uploads` until removed. There is no production authentication or tenant isolation: the login UI is a demo and prompts do not enforce security. Do not expose the local prototype as a shared service.

The optional Gemini integration uses a deprecated SDK and has not been externally validated. Keep it disabled until migrated and tested against a supported provider configuration. The deterministic charts and structured analytical operations work without it.

Category counts and means use the full dataset; histograms and scatter plots use the first 100 rows. Chart metadata and captions disclose this scope. The full-data endpoint caps its output at 10,000 rows, and Explorer caps at 50,000. Sampled charts are exploratory and may differ from full-dataset summaries. Chart cross-filter behavior and all failure modes need browser validation; do not claim production readiness.

## Architecture and skills

`backend/app.py`: routes, upload handling, deterministic charts and optional query translation. `backend/cleaning.py`: conservative data preparation. `backend/safe_query.py`: closed analytical operation set. `backend/services/`: field profiling/recommendation components. `src/`: React/TypeScript views, filters and Vega rendering.

Skills: Python, pandas, data profiling, API design, TypeScript and visualization specification. Tests run with `python -m unittest discover -s tests -v`; frontend compilation uses `npm run build`.
