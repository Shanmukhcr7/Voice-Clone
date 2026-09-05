import torch
from safetensors.torch import save_file
import os
import shutil

d = r"cache\chatterbox"

def convert(src, dst):
    print(f"Loading {src}...")
    t = torch.load(os.path.join(d, src), map_location="cpu", weights_only=True)
    if isinstance(t, dict):
        if "model" in t: t = t["model"]
        elif "state_dict" in t: t = t["state_dict"]
    
    # ensure everything is contiguous tensor
    t = {k: v.contiguous() if isinstance(v, torch.Tensor) else torch.tensor(v) for k, v in t.items()}
    save_file(t, os.path.join(d, dst))
    print(f"Saved {dst}")

try:
    convert("ve.pt", "ve.safetensors")
    convert("s3gen.pt", "s3gen.safetensors")
    shutil.copy(os.path.join(d, "t3_mtl_te.safetensors"), os.path.join(d, "t3_cfg.safetensors"))
    print("Done")
except Exception as e:
    print(e)
