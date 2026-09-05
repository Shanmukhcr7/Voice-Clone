import os
import sys
import shutil
import torch
from safetensors.torch import save_file
from huggingface_hub import snapshot_download
from config import CACHE_DIR, MODEL_REPO

def convert_pt_to_safetensors(model_dir):
    def convert(src, dst):
        src_path = os.path.join(model_dir, src)
        dst_path = os.path.join(model_dir, dst)
        if not os.path.exists(src_path): return
        print(f"Converting {src} to {dst}...")
        t = torch.load(src_path, map_location="cpu", weights_only=True)
        if isinstance(t, dict):
            if "model" in t: t = t["model"]
            elif "state_dict" in t: t = t["state_dict"]
        t = {k: v.contiguous() if isinstance(v, torch.Tensor) else torch.tensor(v) for k, v in t.items()}
        save_file(t, dst_path)

    convert("ve.pt", "ve.safetensors")
    convert("s3gen.pt", "s3gen.safetensors")
    
    if os.path.exists(os.path.join(model_dir, "t3_mtl_te.safetensors")) and not os.path.exists(os.path.join(model_dir, "t3_cfg.safetensors")):
        shutil.copy(os.path.join(model_dir, "t3_mtl_te.safetensors"), os.path.join(model_dir, "t3_cfg.safetensors"))
        
    if os.path.exists(os.path.join(model_dir, "grapheme_mtl_merged_expanded_v1.json")) and not os.path.exists(os.path.join(model_dir, "tokenizer.json")):
        shutil.copy(os.path.join(model_dir, "grapheme_mtl_merged_expanded_v1.json"), os.path.join(model_dir, "tokenizer.json"))


def download_model(repo_id=MODEL_REPO, model_name="chatterbox"):
    print(f"Downloading {repo_id} to {CACHE_DIR}\\{model_name}...")
    try:
        local_dir = os.path.join(CACHE_DIR, model_name)
        snapshot_download(
            repo_id=repo_id,
            cache_dir=CACHE_DIR,
            local_dir=local_dir,
            local_dir_use_symlinks=False,
            resume_download=True
        )
        convert_pt_to_safetensors(local_dir)
        print(f"Model {model_name} downloaded successfully!")
    except Exception as e:
        print(f"Error downloading model: {e}")
        print("Please check your internet connection and try again.")
        sys.exit(1)

if __name__ == "__main__":
    download_model()
