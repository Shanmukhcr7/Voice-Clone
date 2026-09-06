import os
import site
for p in site.getsitepackages():
    cb = os.path.join(p, "chatterbox")
    if os.path.exists(cb):
        for root, dirs, files in os.walk(cb):
            for file in files:
                if file.endswith(".py"):
                    try:
                        with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                            content = f.read()
                            if "704" in content or "vocab_size" in content:
                                print(f"Found in {os.path.join(root, file)}")
                                for line in content.split("\n"):
                                    if "704" in line or "vocab_size" in line:
                                        print("  ", line)
                    except: pass

