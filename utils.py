import os
import librosa
import soundfile as sf
import numpy as np
from config import MIN_AUDIO_DURATION, MAX_AUDIO_DURATION, TARGET_SAMPLE_RATE, UPLOADS_DIR, OUTPUTS_DIR

def load_and_validate_audio(file_path):
    """
    Loads an audio file, converts it to mono, normalizes it, and removes silence.
    Validates audio length.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")
        
    try:
        # Load with librosa, auto-converting to desired sample rate and mono
        y, sr = librosa.load(file_path, sr=TARGET_SAMPLE_RATE, mono=True)
    except Exception as e:
        raise ValueError(f"Unsupported audio format or corrupted file: {e}")
        
    # Trim leading and trailing silence
    y_trimmed, index = librosa.effects.trim(y, top_db=30)
    
    # Calculate duration
    duration = librosa.get_duration(y=y_trimmed, sr=sr)
    
    if duration < MIN_AUDIO_DURATION:
        raise ValueError(f"Audio is too short ({duration:.1f}s). Must be between {MIN_AUDIO_DURATION} and {MAX_AUDIO_DURATION} seconds.")
    if duration > MAX_AUDIO_DURATION:
        raise ValueError(f"Audio is too long ({duration:.1f}s). Must be between {MIN_AUDIO_DURATION} and {MAX_AUDIO_DURATION} seconds.")
        
    # Normalize audio
    y_normalized = librosa.util.normalize(y_trimmed)
    
    return y_normalized, sr

def save_temp_wav(y, sr, original_filename):
    """
    Saves the processed numpy array as a temporary WAV file for the model.
    """
    base = os.path.basename(original_filename)
    name, _ = os.path.splitext(base)
    output_path = os.path.join(UPLOADS_DIR, f"{name}_processed.wav")
    sf.write(output_path, y, sr)
    return output_path

def save_generated_audio(y, sr, text_prompt):
    """
    Saves the generated speech to the outputs directory.
    """
    import time
    # Create safe filename from prompt
    safe_text = "".join([c if c.isalnum() else "_" for c in text_prompt[:15]])
    filename = f"gen_{safe_text}_{int(time.time())}.wav"
    output_path = os.path.join(OUTPUTS_DIR, filename)
    sf.write(output_path, y, sr)
    return output_path

def generate_history_list():
    """
    Returns a list of previously generated audio files for the history tab.
    """
    if not os.path.exists(OUTPUTS_DIR):
        return []
    
    files = []
    for f in os.listdir(OUTPUTS_DIR):
        if f.endswith('.wav'):
            path = os.path.join(OUTPUTS_DIR, f)
            size = os.path.getsize(path) / 1024 # KB
            files.append((f, path, f"{size:.1f} KB"))
            
    # Sort by modification time, newest first
    files.sort(key=lambda x: os.path.getmtime(x[1]), reverse=True)
    return files
