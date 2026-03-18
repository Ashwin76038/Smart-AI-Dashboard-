
import google.generativeai as genai
import os, json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

with open("debug_log.txt", "w", encoding="utf-8") as f:
    f.write(f"API Key present: {bool(key)}\n")
    if key:
        f.write(f"Key length: {len(key)}\n")
        genai.configure(api_key=key)

    def gemini_prompt(prompt, attempt_models=None):
        if attempt_models is None:
            attempt_models = [
                "gemini-1.5-flash",
                "gemini-2.0-flash-exp",
                "gemini-pro",
                "gemini-1.5-pro",
            ]

        last_err = None
        for model_name in attempt_models:
            try:
                f.write(f"Trying Gemini model: {model_name}\n")
                model = genai.GenerativeModel(model_name)
                resp = model.generate_content(prompt)
                if hasattr(resp, "text"):
                    return resp.text.strip()
                return str(resp).strip()
            except Exception as e:
                f.write(f"Gemini attempt failed for {model_name}: {e}\n")
                last_err = e
                continue

        f.write(f"All Gemini model attempts failed: {last_err}\n")
        return None

    prompt = "Hello, assume you are a data analyst. Reply with 'OK'."
    f.write("Sending test prompt...\n")
    res = gemini_prompt(prompt)
    f.write(f"Result: {res}\n")
