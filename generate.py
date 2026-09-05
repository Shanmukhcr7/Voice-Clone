import gc
import time
import torch
from model_loader import get_model
from config import TARGET_SAMPLE_RATE
from langdetect import detect, DetectorFactory

# Set seed for deterministic language detection
DetectorFactory.seed = 0

def generate_speech(text, reference_audio_path, lang="te"):
    """
    Generates speech using the provided text and reference audio.
    Returns (sample_rate, generated_audio_numpy_array) and generation_time.
    """
    start_time = time.time()
    
    # 1. Load the model (uses singleton, routes based on language)
    model = get_model(lang)
    
    # 2. Perform inference
    try:
        # Prepend a comma to force the model to take a natural breath before speaking
        text = ", " + text.lstrip()
        generated_wav = model.generate(text, audio_prompt_path=reference_audio_path)
        
        # Ensure it's on CPU and converted to numpy
        if isinstance(generated_wav, torch.Tensor):
            generated_wav = generated_wav.squeeze().cpu().numpy()
            
        out_sr = getattr(model, 'sr', TARGET_SAMPLE_RATE)
        
        # FIX: Prepend 300ms of silence so the first word doesn't get cut off by audio players
        import numpy as np
        silence = np.zeros(int(out_sr * 0.3), dtype=generated_wav.dtype)
        generated_wav = np.concatenate((silence, generated_wav))
            
    except Exception as e:
        raise RuntimeError(f"Error during generation: {e}")
        
    finally:
        # 3. Memory optimization (CPU constraints)
        gc.collect()
        
    generation_time = time.time() - start_time
    return out_sr, generated_wav, generation_time
