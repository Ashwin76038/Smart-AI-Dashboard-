import requests
import json
import os

# Create a dummy clean file in uploads if not exists for testing
# This mimics the "cleaned_filename" param
UPLOAD_DIR = "backend/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

dummy_data = "col1,col2,col3\nA,1,10\nB,2,20\nC,3,30"
dummy_file = os.path.join(UPLOAD_DIR, "cleaned_test.csv")
with open(dummy_file, "w") as f:
    f.write(dummy_data)

url = "http://127.0.0.1:5000/generate_insight_chart"
payload = {"filename": "cleaned_test.csv"}

try:
    print(f"Sending request to {url} with payload {payload}")
    response = requests.post(url, json=payload, timeout=60)
    
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print("Keys returned:", data.keys())
        
        story = data.get("story", [])
        visualizations = data.get("visualizations", [])
        specs = data.get("specs", [])
        
        print(f"Story count: {len(story)}")
        print(f"Visualizations count: {len(visualizations)}")
        print(f"Specs count: {len(specs)}")
        
        if story and visualizations:
            story_ids = [s.get("chart_id") for s in story]
            viz_ids = [v.get("chart_id") for v in visualizations]
            print("Story Chart IDs:", story_ids)
            print("Viz Chart IDs:", viz_ids)
            
            missing = [sid for sid in story_ids if sid not in viz_ids]
            if missing:
                print("Mismatch! Story IDs not in Visualizations:", missing)
            else:
                print("All Story IDs match Visualization IDs.")
                
            # Check data injection
            first_viz = visualizations[0]
            if "vega_lite_spec" in first_viz:
                spec = first_viz["vega_lite_spec"]
                if "data" in spec and "values" in spec["data"] and spec["data"]["values"]:
                     print("Data injected correctly in first spec.")
                else:
                     print("DATA INJECTION FAILED: 'values' missing or empty in first spec.")
            else:
                print("No 'vega_lite_spec' in first visualization.")
        else:
             print("Story or Visualizations empty. Checking for error spec...")
             if specs and len(specs) > 0:
                 title = specs[0].get("title", {})
                 if isinstance(title, dict):
                     t_text = title.get("text", "")
                     t_sub = title.get("subtitle", "")
                     print(f"Spec Title: {t_text}")
                     print(f"Spec Subtitle (Error): {t_sub}")
                 elif isinstance(title, str):
                     print(f"Spec Title: {title}")

             
    else:
        print(f"Failed with status {response.status_code}: {response.text}")

except Exception as e:
    print(f"Error: {e}")
