from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from cleaning import clean_data
import os, json, numpy as np, re
from dotenv import load_dotenv
import google.generativeai as genai

# ------------------- Setup -------------------
load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['JSON_SORT_KEYS'] = False

# ✅ Ensure uploads directory exists in backend/uploads
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

gemini_key = os.getenv("GEMINI_API_KEY")
if not gemini_key:
    print("WARNING GEMINI_API_KEY not set. AI features disabled.")
else:
    genai.configure(api_key=gemini_key)
    print("Gemini API configured successfully.")


# ------------------- Helpers -------------------
def _to_native(value):
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if pd.isna(value):
        return None
    return value


def stringify_keys(obj):
    if isinstance(obj, dict):
        return {str(k): stringify_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [stringify_keys(i) for i in obj]
    if isinstance(obj, pd.Series):
        return stringify_keys(obj.to_dict())
    if isinstance(obj, pd.DataFrame):
        return stringify_keys(obj.to_dict(orient="records"))
    if isinstance(obj, np.generic):
        return _to_native(obj)
    try:
        return _to_native(obj)
    except Exception:
        return obj


# ------------------- Data Summary -------------------
def generate_data_summary(df):
    summary = {
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "columns": [str(c) for c in df.columns],
        "dtypes": {str(k): str(v) for k, v in df.dtypes.astype(str).to_dict().items()},
        "missing_values": {str(k): int(v) for k, v in df.isnull().sum().to_dict().items()},
        "numeric_columns": [str(c) for c in df.select_dtypes(include=["number"]).columns if "id" not in str(c).lower()],
        "categorical_columns": [
            str(c) for c in df.select_dtypes(include=["object"]).columns 
            if "name" not in str(c).lower() and "id" not in str(c).lower() and df[c].nunique() < 50
        ],
    }

    num_stats = {}
    for col in summary["numeric_columns"]:
        s = df[col].dropna()
        if s.empty:
            continue
        q = s.quantile([0.25, 0.5, 0.75]).to_dict()
        num_stats[col] = {
            "mean": _to_native(s.mean()),
            "median": _to_native(s.median()),
            "std": _to_native(s.std()),
            "min": _to_native(s.min()),
            "max": _to_native(s.max()),
            "quartiles": {str(k): _to_native(v) for k, v in q.items()},
        }
    summary["numeric_statistics"] = num_stats

    cat_stats = {}
    for col in summary["categorical_columns"]:
        vc = df[col].value_counts().head(5).to_dict()
        cat_stats[col] = {str(k): _to_native(v) for k, v in vc.items()}
    summary["categorical_distribution"] = cat_stats
    return summary


# ------------------- Gemini Helper (robust) -------------------
def gemini_prompt(prompt, attempt_models=None, timeout_seconds=20, fallback_text=None):
    """Try a list of model names safely and return fallback JSON if all fail."""
    if attempt_models is None:
        attempt_models = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-flash-latest",
            "gemini-pro-latest",
        ]

    last_err = None
    for model_name in attempt_models:
        try:
            print(f"Trying Gemini model: {model_name}")
            model = genai.GenerativeModel(model_name)
            resp = model.generate_content(prompt)
            if hasattr(resp, "text"):
                return resp.text.strip()
            return str(resp).strip()
        except Exception as e:
            print(f"Gemini attempt failed for {model_name}: {e}")
            last_err = e
            continue

    print("All Gemini model attempts failed:", last_err)
    return fallback_text or json.dumps({
        "analysis": "Gemini unavailable — returned fallback analysis.",
        "pandas_code": "df.head()",
        "chart_type": "table",
        "x": None,
        "y": None
    })


# ------------------- Robust File Reader -------------------
def load_dataset(path):
    """
    Robustly load a dataset (CSV, Excel, JSON).
    Handles OOM and ParserErrors by falling back to slower engines.
    """
    ext = os.path.splitext(path)[1].lower()
    
    try:
        if ext == ".csv":
            try:
                # Try default (fast, C engine)
                return pd.read_csv(path)
            except (pd.errors.ParserError, MemoryError):
                print(f"Fast read failed for {path}. Trying python engine...")
                try:
                    # Fallback to python engine (slower but more robust)
                    return pd.read_csv(path, engine="python")
                except Exception:
                    print(f"Python engine failed. Trying low_memory=False...")
                    # Last resort
                    return pd.read_csv(path, low_memory=False)

        elif ext in [".xlsx", ".xls"]:
            return pd.read_excel(path)
        elif ext == ".json":
            return pd.read_json(path)
        else:
            # Maybe it's a CSV with wrong extension?
            try:
                 return pd.read_csv(path)
            except:
                raise ValueError(f"Unsupported file format: {ext}")
                
    except Exception as e:
        print(f"Failed to load dataset {path}: {e}")
        raise e


# ------------------- Routes -------------------

@app.route("/")
def home():
    return jsonify({"message": "Smart AI Dashboard (Gemini Edition) 🚀"})


@app.route("/clean_data", methods=["POST"])
def clean_uploaded_data():
    """Handles dataset upload + cleaning"""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, f.filename)
    f.save(file_path)

    try:
        df = load_dataset(file_path)
    except Exception as e:
        return jsonify({"error": f"Failed to read: {e}"}), 400

    cleaned_df, summary = clean_data(df)
    cleaned_filename = "cleaned_" + f.filename
    cleaned_path = os.path.join(UPLOAD_FOLDER, cleaned_filename)
    cleaned_df.to_csv(cleaned_path, index=False)

    data_summary = generate_data_summary(cleaned_df)
    
    # Merge both summaries
    final_summary = {**summary, **data_summary}

    preview = stringify_keys(cleaned_df.head(20).to_dict(orient="records"))

    return jsonify({
        "message": "Data cleaned successfully",
        "summary": stringify_keys(final_summary),
        "preview": preview,
        "tableau_url": "https://public.tableau.com/views/Civic_Ai1/Dashboard1?:showVizHome=no&:embed=true",
        "original_filename": f.filename,
        "cleaned_filename": cleaned_filename,
    })


import pygwalker as pyg

@app.route("/explore", methods=["GET"])
def explore_data():
    """Generates and serves the Graphic Walker interface as standalone HTML"""
    try:
        filename = request.args.get("filename")
        if not filename:
            return "Error: Missing filename", 400

        filename = filename.replace("cleaned_", "").strip()
        cleaned_path = os.path.join(UPLOAD_FOLDER, "cleaned_" + filename)

        if not os.path.exists(cleaned_path):
            return f"Error: File not found at {cleaned_path}", 404

        df = load_dataset(cleaned_path)
        
        # Optimize for large datasets if needed
        if len(df) > 50000:
             df = df.sample(50000)
        
        # Generate the HTML for Graphic Walker
        # use_kernel_calc=True enables faster calculation for large data if supported, 
        # but safely defaults to Javascript computation for portability.
        walker_html = pyg.walk(df, return_html=True, dark="dark")
        
        return walker_html

    except Exception as e:
        return f"Error loading Explorer: {str(e)}", 500


@app.route("/get_full_data", methods=["POST"])
def get_full_data():
    """Retrieves the full dataset for Graphic Walker analysis"""
    try:
        data = request.get_json()
        filename = data.get("filename")

        if not filename:
            return jsonify({"error": "Missing filename"}), 400

        filename = filename.replace("cleaned_", "").strip()
        cleaned_path = os.path.join(UPLOAD_FOLDER, "cleaned_" + filename)

        if not os.path.exists(cleaned_path):
            return jsonify({"error": "File not found"}), 404

        df = load_dataset(cleaned_path)
        
        # Limit rows if necessary for performance (e.g., max 10k rows)
        # For now, we return all or a reasonable limit
        if len(df) > 10000:
             df = df.head(10000)
             print("⚠️ Data truncated to 10k rows for performance")

        full_data = stringify_keys(df.to_dict(orient="records"))

        return jsonify({
            "success": True,
            "data": full_data,
            "columns": list(df.columns),
            "size": len(df)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/nlp_query", methods=["POST"])
def nlp_query():
    """Handles AI NLP query on cleaned dataset"""
    try:
        data = request.get_json()
        query = data.get("query")
        filename = data.get("filename")

        if not query or not filename:
            return jsonify({"error": "Missing 'query' or 'filename'"}), 400

        filename = filename.replace("cleaned_", "").strip()
        cleaned_path = os.path.join(UPLOAD_FOLDER, "cleaned_" + filename)

        print(" Checking cleaned file:", cleaned_path)
        if not os.path.exists(cleaned_path):
            return jsonify({"error": f"Cleaned file not found: {cleaned_path}"}), 404

        df = load_dataset(cleaned_path)

        prompt = f"""
You are a pandas data analyst. Answer in JSON only (no extra text or markdown).
User query: "{query}"
Dataset columns: {list(df.columns)}

If the user asks "about the chart" or "this chart", infer the most likely relevant columns based on standard analytics patterns (e.g. Sales vs Date, Category count).
Always ensure 'pandas_code' returns a DataFrame or Series that answers the specific question.

Return exactly one JSON object with fields:
{{ 
  "analysis": "short explanation",
  "pandas_code": "df[...] or df.groupby(...)",
  "chart_type": "bar/line/pie/scatter/table",
  "x": "x column name or null",
  "y": "y column name or null"
}}
"""
        fallback_ai = json.dumps({
            "analysis": "Gemini unavailable — returned fallback analysis.",
            "pandas_code": "df.head()",
            "chart_type": "table",
            "x": None,
            "y": None
        })

        raw = gemini_prompt(prompt, fallback_text=fallback_ai)
        raw = re.sub(r"^```(?:json)?\n?", "", raw).strip()
        raw = re.sub(r"\n?```$", "", raw).strip()

        try:
            json_match = re.search(r"\{.*\}", raw, re.DOTALL)
            json_str = json_match.group(0) if json_match else raw.strip()
            ai = json.loads(json_str)
        except json.JSONDecodeError as e:
            try:
                print("Gemini returned non-JSON response:\n", raw.encode('utf-8', 'replace').decode('utf-8'))
            except:
                print("Gemini returned non-JSON response (encoding error)")
                
            return jsonify({
                "error": "Could not parse Gemini JSON",
                "exception": str(e),
                "raw_response": raw
            }), 500

        pandas_code = ai.get("pandas_code", "")
        analysis = ai.get("analysis", "")
        chart_type = ai.get("chart_type", "table")
        x, y = ai.get("x"), ai.get("y")

        # Execute pandas code safely
        result, exec_error = None, None
        try:
            local_env = {"df": df, "pd": pd, "np": np}
            result = eval(pandas_code, {"__builtins__": {}}, local_env)
        except Exception as e:
            exec_error = str(e)

        if isinstance(result, pd.DataFrame):
            result_json = result.head(20).to_dict(orient="records")
        elif isinstance(result, pd.Series):
            result_json = result.reset_index().head(20).to_dict(orient="records")
        elif result is not None:
            result_json = [{"value": str(result)}]
        else:
            result_json = None

        return jsonify({
            "success": True,
            "query": query,
            "analysis": analysis,
            "pandas_code": pandas_code,
            "execution_error": exec_error,
            "chart": {"type": chart_type, "x": x, "y": y},
            "result": stringify_keys(result_json)
        })

    except Exception as e:
        try:
            print("Unexpected error in /nlp_query:", str(e).encode('utf-8', 'replace').decode('utf-8'))
        except:
            print("Unexpected error in /nlp_query (encoding error)")
        return jsonify({"error": str(e)}), 500




# ------------------- Premium Design Config -------------------
PREMIUM_CONFIG = {
    "view": {"stroke": "transparent"},
    "font": "Inter, system-ui, sans-serif",
    "axis": {
        "domain": False, "grid": True, "gridColor": "#e5e7eb", "tickColor": "#e5e7eb",
        "labelColor": "#6b7280", "titleColor": "#374151", "labelFontSize": 11, "titleFontSize": 12
    },
    "legend": {"labelColor": "#4b5563", "titleColor": "#374151"},
    "title": {"fontSize": 16, "fontWeight": 600, "color": "#111827", "subtitleColor": "#6b7280", "anchor": "start"},
    "range": {"category": ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"]}
}

# ------------------- Heuristic Chart Generator -------------------
def clean_label(text):
    """Converts 'some_column_name' to 'Some Column Name'"""
    return text.replace("_", " ").replace("-", " ").title()

def generate_heuristic_specs(df, sample_data):
    """Generates 4 distinct Vega-Lite specs based on data types."""
    specs = []
    columns = df.columns.tolist()
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # 1. Distribution Chart (Gradient Bar)
    if categorical_cols:
        cat_col = categorical_cols[0]
        top_cats = df[cat_col].value_counts().head(10).reset_index()
        top_cats.columns = [cat_col, 'count']
        
        specs.append({
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container", "height": 300,
            "title": {
                "text": f"Top Distributions: {clean_label(cat_col)}",
                "subtitle": f"Identifying the most frequent categories in {clean_label(cat_col)}",
            },
            "config": PREMIUM_CONFIG,
            "data": {"values": top_cats.to_dict(orient="records")},
            "mark": {"type": "bar", "cornerRadiusEnd": 6},
            "encoding": {
                "x": {"field": cat_col, "type": "nominal", "sort": "-y", "axis": {"labelAngle": -45}},
                "y": {"field": "count", "type": "quantitative"},
                "color": {"field": cat_col, "legend": None, "scale": {"range": PREMIUM_CONFIG["range"]["category"]}},
                "tooltip": [{"field": cat_col}, {"field": "count"}]
            }
        })
    
    # 2. Trend/Correlation (Scatter with Glow)
    if len(numeric_cols) >= 2:
        x_col, y_col = numeric_cols[0], numeric_cols[1]
        specs.append({
             "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container", "height": 300,
            "title": {
                "text": f"Correlation: {clean_label(x_col)} vs {clean_label(y_col)}",
                "subtitle": "Analyzing the relationship and outliers between key metrics.",
            },
            "config": PREMIUM_CONFIG,
            "data": {"values": sample_data},
            "mark": {"type": "point", "filled": True, "size": 80, "opacity": 0.6, "strokeWidth": 1, "stroke": "white"},
            "encoding": {
                "x": {"field": x_col, "type": "quantitative"},
                "y": {"field": y_col, "type": "quantitative"},
                "color": {"value": PREMIUM_CONFIG["range"]["category"][0]},
                "tooltip": [{"field": x_col}, {"field": y_col}]
            }
        })
    elif len(numeric_cols) == 1 and categorical_cols:
        # Numeric vs Category
        num_col = numeric_cols[0]
        cat_col = categorical_cols[0]
        specs.append({
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container", "height": 300,
             "title": {
                "text": f"Average {clean_label(num_col)} by {clean_label(cat_col)}",
                "subtitle": "Comparing performance across different categories.",
            },
            "config": PREMIUM_CONFIG,
            "data": {"values": sample_data},
            "mark": {"type": "bar", "cornerRadiusEnd": 6},
            "encoding": {
                "x": {"field": cat_col, "type": "nominal"},
                "y": {"field": num_col, "type": "quantitative", "aggregate": "mean"},
                "color": {"value": PREMIUM_CONFIG["range"]["category"][3]}
            }
        })

    # 3. Composition (Donut)
    if len(categorical_cols) >= 2 or (len(categorical_cols) == 1 and len(numeric_cols) > 0):
        target_col = categorical_cols[-1] 
        # Safety check: ensure column has values
        if not df[target_col].dropna().empty:
             counts = df[target_col].value_counts().head(6).reset_index()
             counts.columns = [target_col, 'count']
             
             specs.append({
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "width": "container", "height": 300,
                "title": {
                    "text": f"Composition of {clean_label(target_col)}",
                    "subtitle": "Breakdown of the whole into its component parts."
                },
                "config": PREMIUM_CONFIG,
                "data": {"values": counts.to_dict(orient='records')},
                "mark": {"type": "arc", "innerRadius": 50, "outerRadius": 100, "cornerRadius": 4},
                "encoding": {
                    "theta": {"field": "count", "type": "quantitative", "stack": True},
                    "color": {"field": target_col, "type": "nominal", "scale": {"range": PREMIUM_CONFIG["range"]["category"]}},
                    "tooltip": [{"field": target_col}, {"field": "count"}]
                }
            })
        
    # 4. Density Area (Gradient)
    if numeric_cols:
        target_num = numeric_cols[-1]
        specs.append({
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container", "height": 300,
            "title": {
                "text": f"Distribution density of {clean_label(target_num)}",
                "subtitle": "Visualizing the spread and concentration of values."
            },
            "config": PREMIUM_CONFIG,
            "data": {"values": sample_data},
            "mark": {
                "type": "area", "interpolate": "monotone", "fillOpacity": 0.6, 
                "line": {"color": "#059669"}, 
                "color": {"x1": 1, "y1": 1, "x2": 1, "y2": 0, "gradient": "linear", "stops": [{"offset": 0, "color": "white"}, {"offset": 1, "color": "#10b981"}]}
            },
            "encoding": {
                "x": {"field": target_num, "bin": True, "axis": {"title": clean_label(target_num)}},
                "y": {"aggregate": "count", "axis": {"title": "Frequency"}},
                "tooltip": [{"field": target_num, "bin": True}, {"aggregate": "count"}]
            },
            "selection": {"grid": {"type": "interval", "bind": "scales"}}
        })

    # Fill if less than 4
    while len(specs) < 4:
         specs.append({
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container", "height": 300,
            "title": "Data Activity Overview",
            "config": PREMIUM_CONFIG,
            "data": {"values": sample_data[:50]},
            "mark": "tick",
            "encoding": {
                "x": {"field": columns[0] if columns else "dummy", "type": "nominal"},
                "y": {"field": columns[1] if len(columns) > 1 else columns[0], "type": "nominal"},
                "color": {"value": "#6366f1"}
            }
         })

    # 5. Boxplot (Numeric Distribution by Category)
    if numeric_cols and categorical_cols:
        target_num = numeric_cols[0]
        cat = categorical_cols[0]
        specs.append({
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container", "height": 300,
            "title": f"Distribution Range of {clean_label(target_num)} by {clean_label(cat)}",
            "config": PREMIUM_CONFIG,
            "data": {"values": sample_data},
            "mark": {"type": "boxplot", "extent": "min-max", "size": 30},
            "encoding": {
                "x": {"field": cat, "type": "nominal"},
                "y": {"field": target_num, "type": "quantitative"},
                "color": {"field": cat, "legend": None}
            }
        })

    # 6. Heatmap or another numeric interaction
    if len(numeric_cols) >= 3:
        # 3D Bubble or Heatmap logic
        specs.append({
             "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
             "width": "container", "height": 300,
             "title": f"Heatmap Interaction",
             "config": PREMIUM_CONFIG,
             "data": {"values": sample_data},
             "mark": "rect",
             "encoding": {
                "x": {"field": numeric_cols[0], "bin": True},
                "y": {"field": numeric_cols[1], "bin": True},
                "color": {"aggregate": "count", "type": "quantitative"}
            }
        })
    elif len(categorical_cols) >= 2:
         specs.append({
             "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
             "width": "container", "height": 300,
             "title": f"Categorical Heatmap",
             "config": PREMIUM_CONFIG,
             "data": {"values": sample_data},
             "mark": "rect",
             "encoding": {
                "x": {"field": categorical_cols[0], "type": "nominal"},
                "y": {"field": categorical_cols[1], "type": "nominal"},
                "color": {"aggregate": "count", "type": "quantitative"}
            }
        })
    
    # Fill if less than 6
    while len(specs) < 6:
         specs.append({
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": "container", "height": 300,
            "title": "Data Activity Overview",
            "config": PREMIUM_CONFIG,
            "data": {"values": sample_data[:50]},
            "mark": "tick",
            "encoding": {
                "x": {"field": columns[0] if columns else "dummy", "type": "nominal"},
                "y": {"field": columns[1] if len(columns) > 1 else columns[0], "type": "nominal"},
                "color": {"value": "#6366f1"}
            }
         })

    return specs[:6]


def generate_heuristic_story(df, chart_ids=[]):
    """Generates a fallback story when AI is unavailable."""
    story = []
    
    columns = df.columns.tolist()
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # Safe access to chart_ids (cycling if not enough)
    def get_chart_id(index):
        if not chart_ids: return ""
        return chart_ids[index % len(chart_ids)]

    # Node 1: Context (Overview)
    story.append({
        "story_step": 1,
        "headline": "Dataset Overview",
        "narrative": f"The dataset contains {len(df)} records and {len(columns)} columns. It includes {len(numeric_cols)} numeric metrics and {len(categorical_cols)} categorical dimensions.",
        "why_it_matters": "Understanding the scale and structure of the data is the first step in analysis.",
        "suggested_followup": "Explore specific distributions in the charts below.",
        "chart_id": get_chart_id(0)
    })
    
    # Node 2: Key Metric (Primary numeric or category)
    if numeric_cols:
        main_col = numeric_cols[0]
        avg_val = df[main_col].mean()
        story.append({
            "story_step": 2,
            "headline": f"Analysis of {clean_label(main_col)}",
            "narrative": f"The average value for {clean_label(main_col)} is {avg_val:.2f}. This serves as a key performance indicator for the dataset.",
            "why_it_matters": f"Changes in {clean_label(main_col)} often drive overall trends.",
            "suggested_followup": f"Compare {clean_label(main_col)} across different categories.",
            "chart_id": get_chart_id(1)
        })
    elif categorical_cols:
        main_cat = categorical_cols[0]
        top_val = df[main_cat].mode()[0]
        story.append({
            "story_step": 2,
            "headline": f"Dominant Category: {top_val}",
            "narrative": f"In the {clean_label(main_cat)} category, '{top_val}' is the most frequent occurrence.",
            "why_it_matters": "Identifying dominant categories helps focus resources where they matter most.",
            "suggested_followup": "Investigate underrepresented categories.",
            "chart_id": get_chart_id(1)
        })
        
    # Node 3: Correlation (Relationships)
    if len(numeric_cols) > 1:
        c1, c2 = numeric_cols[0], numeric_cols[1]
        corr = df[c1].corr(df[c2])
        strength = "strong" if abs(corr) > 0.7 else "moderate" if abs(corr) > 0.3 else "weak"
        story.append({
            "story_step": 3,
            "headline": "Correlation Discovery",
            "narrative": f"There is a {strength} correlation ({corr:.2f}) between {clean_label(c1)} and {clean_label(c2)}.",
            "why_it_matters": "Correlations reveal potential causal relationships or redundancies.",
            "suggested_followup": "Check for outliers that might skew this relationship.",
            "chart_id": get_chart_id(2)
        })
    else:
         story.append({
            "story_step": 3,
            "headline": "Distribution Insight",
            "narrative": "The data shows varied distributions across the available categories, indicating potential segments for deeper analysis.",
            "why_it_matters": "Segmentation allows for more targeted strategies.",
            "suggested_followup": "Filter the dashboard to isolate specific segments.",
            "chart_id": get_chart_id(2)
        })

    # Node 4: Categorical Breakdown / Deep Dive
    target_cat = categorical_cols[1] if len(categorical_cols) > 1 else (categorical_cols[0] if categorical_cols else "Data")
    story.append({
        "story_step": 4,
        "headline": f"Composition by {clean_label(target_cat)}",
        "narrative": f"Examining the breakdown of {clean_label(target_cat)} reveals the structural composition of your dataset.",
        "why_it_matters": "Understanding composition helps identify reliance on specific segments.",
        "suggested_followup": f"Drill down into specific {clean_label(target_cat)} groups.",
        "chart_id": get_chart_id(3)
    })

    # Node 5: Distribution / Spread
    target_num = numeric_cols[-1] if numeric_cols else "Metric"
    story.append({
        "story_step": 5,
        "headline": f"Distribution Range of {clean_label(target_num)}",
        "narrative": f"The spread of {clean_label(target_num)} indicates the variability and stability of this metric across the dataset.",
        "why_it_matters": "high variability may indicate risk or opportunity, while potential stability suggests consistency.",
        "suggested_followup": "Look for clusters or gaps in the distribution.",
        "chart_id": get_chart_id(4)
    })

    # Node 6: Summary / Interaction
    story.append({
        "story_step": 6,
        "headline": "Holistic View & Interaction",
        "narrative": "This final view integrates the analysis, allowing for cross-filtering and deeper exploration of the underlying patterns.",
        "why_it_matters": "Synthesising individual insights leads to better strategic decisions.",
        "suggested_followup": "Use the interactive filters to test your own hypotheses.",
        "chart_id": get_chart_id(5)
    })

    return story


@app.route("/generate_insight_chart", methods=["POST"])
def generate_insight_chart():
    """Generates 4 Vega-Lite chart specs using AI or Heuristics"""
    try:
        data = request.get_json()
        filename = data.get("filename")

        if not filename:
            return jsonify({"error": "Missing filename"}), 400

        filename = filename.replace("cleaned_", "").strip()
        cleaned_path = os.path.join(UPLOAD_FOLDER, "cleaned_" + filename)

        if not os.path.exists(cleaned_path):
            return jsonify({"error": "File not found"}), 404

        df = load_dataset(cleaned_path)
        # Ensure sample_data is JSON serializable
        sample_data = stringify_keys(df.head(100).to_dict(orient="records"))
        columns = list(df.columns)
        dtypes = {k: str(v) for k, v in df.dtypes.items()}
        
        # Mock Auth Context (In a real app, get this from request.user)
        auth_context = {
            "user_id": "user_12345",
            "role": "analytics_viewer",
            "session_validity": "active"
        }

        # ---------------- AI Prompt ----------------
        # ---------------- AI Prompt ----------------
        prompt_template = """
You are an autonomous, secure, insight-first AI Analytics & Storytelling System.

You are NOT a chart generator.
You are NOT a UI assistant.
You are a reasoning engine, storytelling analyst, and decision-support system operating in a secure multi-user environment.

You are given:
1) Authenticated user context: __AUTH__
2) Dataset schema (columns: __COLUMNS__, types: __DTYPES__)
3) A representative sample of the dataset: __SAMPLE__
4) A natural language user query (may be vague or exploratory): "Generate a comprehensive analysis."
5) Interaction signals from charts (clicks, filters, selections)

You MUST follow ALL steps below STRICTLY and IN ORDER.

════════════════════════════════════
SECURITY & AUTHENTICATION CONTEXT
════════════════════════════════════
• Assume all requests are authenticated via JWT.
• All insights, datasets, and stories MUST be scoped to the authenticated user only.
• NEVER leak or reference other users’ data.
• Treat user_id as the sole data ownership boundary.
• If authentication context is missing or invalid, STOP and return an authorization error.

════════════════════════════════════
STEP 1: DATA & SEMANTIC UNDERSTANDING
════════════════════════════════════
• Infer semantic meaning of columns (metric, dimension, time, identifier).
• Detect numeric, categorical, temporal fields.
• Identify valid aggregations.
• Detect missing values, sparsity, imbalance, anomalies.
• Flag columns unsuitable for analysis.
• NEVER hallucinate columns or values.

════════════════════════════════════
STEP 2: USER INTENT & CONTEXT REASONING
════════════════════════════════════
• Interpret analytical intent from the user query.
• Classify intent into one or more:
  - Trend
  - Comparison
  - Distribution
  - Correlation
  - Contribution / dominance
  - Anomaly detection
• Infer user expertise (beginner / intermediate / expert).
• If intent is ambiguous, infer the most decision-relevant goal.

════════════════════════════════════
STEP 3: INSIGHT DISCOVERY (INSIGHT-FIRST)
════════════════════════════════════
• Discover EXACTLY 6 UNIQUE, NON-OVERLAPPING insights.
• Insights MUST be statistically or structurally meaningful.
• At least ONE insight must be something the user did NOT explicitly ask for.
• Rank insights by decision-making importance.
• DROP unsupported or repetitive insights.
• NEVER fabricate insights.

════════════════════════════════════
STEP 4: INSIGHT VALIDATION
════════════════════════════════════
• Validate each insight against actual data.
• NEVER generate empty, misleading, or trivial charts.
• If an insight cannot be visualized meaningfully, REPLACE it.

════════════════════════════════════
STEP 5: STORY STRUCTURE & SEQUENCING
════════════════════════════════════
• Convert insights into a coherent analytical story.
• Story order MUST be:
  1) Context-setting insight
  2) Explanatory insight
  3) Impact / risk / opportunity insight
• Each insight becomes one STORY NODE.

════════════════════════════════════
STEP 6: STORY NODE GENERATION
════════════════════════════════════
For EACH story node:
• Generate a narrative headline (clear, non-generic).
• Explain WHY the insight matters in real-world terms.
• Describe cause, impact, or implication.
• Suggest one logical follow-up question or action.

════════════════════════════════════
STEP 7: CHART IDENTIFICATION & NAMING
════════════════════════════════════
For EACH visualization:
• Generate a UNIQUE chart_id using:
  id-<timestamp>-<hash>
• Generate a PROFESSIONAL, HUMAN-READABLE chart_title.
• Chart titles MUST describe the insight (generic titles are INVALID).

════════════════════════════════════
STEP 8: VISUALIZATION SELECTION & REJECTION
════════════════════════════════════
• Select the BEST visualization to explain each insight.
• Explicitly reject at least ONE alternative chart type with reasoning.
• Visualization must EXPLAIN the insight, not decorate it.

════════════════════════════════════
STEP 9: VEGA-LITE SPEC GENERATION
════════════════════════════════════
• Generate VALID Vega-Lite JSON specs.
• Include interactive elements:
  - selections
  - filters
  - legends
• Enable cross-filtering:
  - Click in one chart dynamically filters others.
• Specs MUST be executable via vega-embed.
• **CRITICAL**: Do NOT include the full data in the spec. Set "data": { "values": [] } or omit the values. The system will inject the data automatically.
• NO markdown or comments inside JSON.

════════════════════════════════════
STEP 10: INTERACTIVE STORY ADAPTATION
════════════════════════════════════
• When user interacts with charts:
  - Update narrative context dynamically.
  - Re-evaluate story relevance.
• Highlight affected insights when filters change.
• Storytelling MUST respond to interaction.

════════════════════════════════════
STEP 11: DATA QUALITY & CONFIDENCE
════════════════════════════════════
• Report data quality issues and warnings.
• Assign confidence scores to insights.
• If confidence is low, clearly state uncertainty.

════════════════════════════════════
STEP 12: FALLBACK & SAFETY
════════════════════════════════════
• If AI confidence is insufficient:
  - Fall back to heuristic-based analysis.
  - Mark reduced confidence.
• NEVER hallucinate data, users, or insights.

════════════════════════════════════
STRICT OUTPUT FORMAT (JSON ONLY)
════════════════════════════════════
{
  "auth_context": {
    "user_id": "",
    "access_level": "authorized"
  },
  "data_quality": {
    "issues": [],
    "warnings": []
  },
  "user_intent": {
    "summary": "",
    "confidence": 0.0
  },
  "story": [
    {
      "story_step": 1,
      "headline": "",
      "narrative": "",
      "why_it_matters": "",
      "suggested_followup": "",
      "chart_id": ""
    }
  ],
  "visualizations": [
    {
      "chart_id": "",
      "chart_title": "",
      "insight_rank": 1,
      "chart_type": "",
      "rejected_alternative": "",
      "why_this_chart": "",
      "filters": {
        "global": [],
        "local": []
      },
      "interaction": {
        "cross_filtering": true,
        "click_behavior": "",
        "hover_behavior": ""
      },
      "vega_lite_spec": {}
    }
  ],
  "overall_summary": ""
}


ABSOLUTE RULES:
• NO unauthenticated access
• NO duplicate insights
• NO empty or meaningless charts
• NO generic titles
• NO static-only visuals
• Storytelling must adapt dynamically
• Visualization exists ONLY to explain insights

You are a secure, insight-first, storytelling AI analytics system.
"""
        
        prompt = prompt_template.replace("__AUTH__", json.dumps(auth_context))
        prompt = prompt.replace("__COLUMNS__", str(columns))
        prompt = prompt.replace("__DTYPES__", str(dtypes))
        prompt = prompt.replace("__SAMPLE__", json.dumps(sample_data))

        fallback_chart_specs = json.dumps({"visualizations": []})
        
        # Call Gemini
        raw = gemini_prompt(prompt, fallback_text=fallback_chart_specs)
        print(f"------------- RAW AI RESPONSE -------------\n{raw}\n-------------------------------------------")

        # Clean response
        raw = re.sub(r"^```(?:json)?\n?", "", raw).strip()
        raw = re.sub(r"\n?```$", "", raw).strip()
        
        specs = []
        parsed_response = {}

        try:
            parsed_response = json.loads(raw)
            
            # Extract specs from the new format
            visualizations = parsed_response.get("visualizations", [])
            if isinstance(visualizations, list):
                for viz in visualizations:
                    if "vega_lite_spec" in viz:
                        specs.append(viz["vega_lite_spec"])
            
            # If the new format failed but somehow we got a list directly (fallback/hallucination)
            if not specs and isinstance(parsed_response, list):
                specs = parsed_response
            elif not specs and "specs" in parsed_response:
                specs = parsed_response["specs"]
                
            if not specs:
                raise ValueError("No specs found in AI response")
            
            # --- ROBUST DATA INJECTION ---
            print(f"Injecting sample data into {len(specs)} charts (preserving top-level, cleaning nested)...")
            
            def remove_inner_data(obj):
                """Recursively remove 'data' key from dictionaries."""
                if isinstance(obj, dict):
                    if "data" in obj:
                        del obj["data"]
                    for v in obj.values():
                        remove_inner_data(v)
                elif isinstance(obj, list):
                    for i in obj:
                        remove_inner_data(i)

            for spec in specs:
                # 1. Recursively clean 'data' from all children/properties
                # We iterate over top-level keys and clean their values
                for key in list(spec.keys()):
                    if key != "data": # Don't touch top-level data yet (though we overwrite it anyway)
                         remove_inner_data(spec[key])
                
                # 2. Inject top-level data
                spec["data"] = {"values": sample_data}
                
                # Debug print
                print(f"📊 Spec prepared: {spec.get('title', 'Untitled')}")
            # ------------------------------
                
        except Exception as e:
            print(f"JSON PARSING FAILED: {e}")
            print(f"RAW CONTENT WAS: {raw[:500]}...") # Print first 500 chars
            print(f"AI Generation failed ({e}), switching to Heuristic Engine.")
            specs = generate_heuristic_specs(df, sample_data)
            parsed_response = {}
        
        # Fill if less than 6
        if len(specs) < 6:
             print(f"Only {len(specs)} charts generated by AI. Filling with heuristics...")
             heuristic_specs = generate_heuristic_specs(df, sample_data)
             
             for h_spec in heuristic_specs:
                 if len(specs) >= 6:
                     break
                 if "title" in h_spec and isinstance(h_spec["title"], dict):
                    h_spec["title"]["subtitle"] = h_spec["title"].get("subtitle", "") + " (Heuristic Fallback)"
                 specs.append(h_spec)

        # Always reassign sequential chart_ids to guarantee story <-> viz linkage
        visualizations = parsed_response.get("visualizations", [])
        story = parsed_response.get("story", [])

        import uuid

        # Build final ordered visualizations list (6 items) with fresh IDs + injected data
        generated_chart_ids = []
        final_visualizations = []
        extra_heuristic = generate_heuristic_specs(df, sample_data)

        for i in range(6):
            spec = specs[i] if i < len(specs) else extra_heuristic[i % len(extra_heuristic)]
            c_id = f"chart-{i}-{uuid.uuid4().hex[:8]}"
            generated_chart_ids.append(c_id)

            raw_title = spec.get("title", "Data Insight")
            final_title = raw_title.get("text", "Data Insight") if isinstance(raw_title, dict) else str(raw_title)

            if i < len(visualizations):
                viz = dict(visualizations[i])
                viz["chart_id"] = c_id
                viz["vega_lite_spec"] = spec
                final_visualizations.append(viz)
            else:
                final_visualizations.append({
                    "chart_id": c_id,
                    "chart_title": final_title,
                    "vega_lite_spec": spec,
                    "rejected_alternative": "None",
                    "why_this_chart": "Heuristic best-fit selection based on data types.",
                    "insight_rank": i + 1
                })

        visualizations = final_visualizations

        # Build final story list (6 items) with chart_ids synced to visualizations
        heuristic_story_nodes = generate_heuristic_story(df, generated_chart_ids)
        final_story = []
        for i in range(6):
            if i < len(story):
                st = dict(story[i])
            elif i < len(heuristic_story_nodes):
                st = dict(heuristic_story_nodes[i])
            else:
                st = {"story_step": i + 1, "headline": f"Insight {i+1}", "narrative": "", "why_it_matters": "", "suggested_followup": ""}
            st["chart_id"] = generated_chart_ids[i]
            st["story_step"] = i + 1
            final_story.append(st)
        story = final_story

        return jsonify({
            "success": True,
            "specs": specs,
            "story": story,
            "visualizations": visualizations,
            "user_intent": parsed_response.get("user_intent", {}),
            "data_quality": parsed_response.get("data_quality", {})
        })

    except Exception as e:
        import traceback
        error_msg = str(e)
        with open("err.txt", "w") as f:
            f.write(f"Error: {error_msg}\n")
            traceback.print_exc(file=f)
        
        print(f"Error in /generate_insight_chart: {error_msg}")
        traceback.print_exc()
        
        # Return a safe error chart
        return jsonify({
            "success": True,
            "specs": [{
                "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                "width": "container",
                "height": 300,
                "title": {"text": "Chart Generation Failed", "color": "red", "subtitle": error_msg[:100]},
                "data": {"values": [{"error": "check console"}]},
                "mark": "text",
                "encoding": {"text": {"field": "error"}}
            }]
        })


# ------------------- Main -------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
