try:
    with open("err.txt", "r", encoding="utf-16") as f:
        print(f.read())
except Exception:
    try:
        with open("err.txt", "r", encoding="utf-8") as f:
             print(f.read())
    except Exception as e:
        print(f"Failed to read: {e}")
