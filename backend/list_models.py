
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=key)

with open("models_list.txt", "w", encoding="utf-8") as f:
    try:
        f.write("Fetching models...\n")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"Name: {m.name}\n")
    except Exception as e:
        f.write(f"Error listing models: {e}\n")
