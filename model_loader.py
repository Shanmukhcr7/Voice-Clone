import os
import torch
import gc
from config import CACHE_DIR

class ModelSingleton:
    _instance = None
    _models = {}
    _current_loaded = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelSingleton, cls).__new__(cls)
        return cls._instance

    def load_model(self, lang: str = "en"):
        if lang == 'te':
            repo = "shankarpandala/chatterbox-telugu"
            model_id = "chatterbox-telugu"
        elif lang == 'en':
            repo = "ResembleAI/chatterbox"
            model_id = "chatterbox"
        else:
            repo = "BosonLab/chatterbox-desi"
            model_id = "chatterbox-desi"
            
        if self._current_loaded == model_id:
            return self._models[model_id]

        print(f"Switching to {model_id}...")
        
        # Free memory of previous model to prevent OOM
        if self._current_loaded:
            del self._models[self._current_loaded]
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
        # Optimize for CPU
        torch.set_num_threads(max(1, os.cpu_count() - 1))  # Leave 1 thread for OS
        
        try:
            device = "cpu"
            model_path = os.path.join(CACHE_DIR, model_id)
            
            if not os.path.exists(model_path):
                print(f"Model {model_id} not found locally. Downloading now...")
                from download_model import download_model
                download_model(repo_id=repo, model_name=model_id)
                
            try:
                from chatterbox import ChatterboxTTS
            except ImportError:
                raise ImportError("Could not import chatterbox. Please run install.py")

            self._models[model_id] = ChatterboxTTS.from_local(model_path, device=device)
            self._current_loaded = model_id
            
            print(f"Model {model_id} loaded successfully.")
            return self._models[model_id]
            
        except Exception as e:
            print(f"Failed to load model: {e}")
            raise e

def get_model(lang: str = "en"):
    return ModelSingleton().load_model(lang)
