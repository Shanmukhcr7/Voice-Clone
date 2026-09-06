import json
data = {"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}
with open("frontend/vercel.json", "w", encoding="utf-8") as f:
    json.dump(data, f)

