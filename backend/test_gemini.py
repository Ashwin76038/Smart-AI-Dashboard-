import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=key)

models_to_try = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"]

for m in models_to_try:
    print(f"Testing {m}...")
    try:
        model = genai.GenerativeModel(m)
        response = model.generate_content("Hi")
        print(f"✅ Success with {m}")
        break  # infer success = working key
    except Exception as e:
        print(f"❌ Failed {m}: {e}")
