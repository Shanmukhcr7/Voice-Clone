import os
import json
import tempfile
import modal
import numpy as np
import scipy.io.wavfile

# ==============================================================================
# MODAL CONFIGURATION & ENVIRONMENT SETUP
# ==============================================================================
app = modal.App("voxaura-worker")

# We download the model weights during the Docker image build phase.
# This bakes the heavy weights directly into the image so the container cold-starts in 3 seconds.
def download_models():
    import os
    import shutil
    import torch
    from safetensors.torch import save_file
    from huggingface_hub import snapshot_download
    token = os.environ.get("HF_TOKEN")
    
    def convert_pt_to_safetensors(model_dir):
        def convert(src, dst):
            src_path = os.path.join(model_dir, src)
            dst_path = os.path.join(model_dir, dst)
            if not os.path.exists(src_path): return
            print(f"Converting {src} to {dst} in {model_dir}...")
            t = torch.load(src_path, map_location="cpu", weights_only=True)
            if isinstance(t, dict):
                if "model" in t: t = t["model"]
                elif "state_dict" in t: t = t["state_dict"]
            t = {k: v.contiguous() if isinstance(v, torch.Tensor) else torch.tensor(v) for k, v in t.items()}
            save_file(t, dst_path)

        convert("ve.pt", "ve.safetensors")
        convert("s3gen.pt", "s3gen.safetensors")
        
        # Multilingual TTS specifically expects a file named t3_mtl23ls_v2.safetensors
        if os.path.exists(os.path.join(model_dir, "t3_mtl_te.safetensors")) and not os.path.exists(os.path.join(model_dir, "t3_mtl23ls_v2.safetensors")):
            shutil.copy(os.path.join(model_dir, "t3_mtl_te.safetensors"), os.path.join(model_dir, "t3_mtl23ls_v2.safetensors"))
            
        if os.path.exists(os.path.join(model_dir, "t3_mtl_te.safetensors")) and not os.path.exists(os.path.join(model_dir, "t3_cfg.safetensors")):
            shutil.copy(os.path.join(model_dir, "t3_mtl_te.safetensors"), os.path.join(model_dir, "t3_cfg.safetensors"))
            
        if os.path.exists(os.path.join(model_dir, "grapheme_mtl_merged_expanded_v1.json")) and not os.path.exists(os.path.join(model_dir, "tokenizer.json")):
            shutil.copy(os.path.join(model_dir, "grapheme_mtl_merged_expanded_v1.json"), os.path.join(model_dir, "tokenizer.json"))

    print("Downloading Telugu Model...")
    snapshot_download(repo_id="shankarpandala/chatterbox-telugu", local_dir="/models/telugu", token=token, local_dir_use_symlinks=False)
    convert_pt_to_safetensors("/models/telugu")
    
    print("Downloading English Model...")
    snapshot_download(repo_id="ResembleAI/chatterbox", local_dir="/models/english", token=token, local_dir_use_symlinks=False)
    convert_pt_to_safetensors("/models/english")
    
    print("Downloading Desi Model...")
    snapshot_download(repo_id="BosonLab/chatterbox-desi", local_dir="/models/desi", token=token, local_dir_use_symlinks=False)
    convert_pt_to_safetensors("/models/desi")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg") 
    .pip_install(
        "torch",
        "torchaudio",
        "chatterbox-tts",
        "huggingface-hub",
        "firebase-admin",
        "boto3",
        "scipy",
        "numpy",
        "safetensors"
    )
    .run_function(download_models, secrets=[modal.Secret.from_name("voxaura-secrets")]) # Added secrets to allow HF Token access during build!
)


# ==============================================================================
# GPU WORKER FUNCTION
# ==============================================================================
@app.function(
    image=image, 
    gpu="T4", # Using T4 which costs $0.000164 / sec
    secrets=[modal.Secret.from_name("voxaura-secrets")], # Automatically injects your API keys
    timeout=300,
    scaledown_window=15 # Explicitly shut down container after 15s of inactivity to save money!
)
@modal.fastapi_endpoint(method="POST")
def process_generation(payload: dict):
    import firebase_admin
    from firebase_admin import credentials, firestore
    import boto3
    import torch
    from chatterbox import ChatterboxTTS

    gen_id = payload.get("gen_id")
    if not gen_id:
        return {"error": "No gen_id provided"}

    # 1. Initialize Firebase Admin safely
    if not firebase_admin._apps:
        cred_json = os.environ.get("FIREBASE_CREDENTIALS")
        if not cred_json:
            return {"error": "Missing FIREBASE_CREDENTIALS in Modal Secrets"}
        cred = credentials.Certificate(json.loads(cred_json))
        firebase_admin.initialize_app(cred)
        
    db = firestore.client()

    # 2. Lock the Job in Firestore
    gen_ref = db.collection("generations").document(gen_id)
    gen_doc = gen_ref.get()
    if not gen_doc.exists:
        return {"error": "Generation not found"}
        
    gen_data = gen_doc.to_dict()
    text = gen_data.get("text")
    voice_id = gen_data.get("voice_id")
    user_id = gen_data.get("user_id")
    lang = gen_data.get("language", "te")

    gen_ref.update({"status": "PROCESSING"})

    # 3. Verify Voice Exists
    voice_doc = db.collection("voices").document(voice_id).get()
    if not voice_doc.exists:
        gen_ref.update({"status": "FAILED", "error": "Voice not found"})
        return {"error": "Voice not found"}
        
    voice_storage_path = voice_doc.to_dict().get("storage_path")

    # 4. Initialize Cloudflare R2 Client
    s3_client = boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ.get("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
    )
    bucket_name = os.environ.get("R2_BUCKET_NAME")

    # 5. Process everything in a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            local_voice_path = os.path.join(temp_dir, "voice_sample.wav")
            s3_client.download_file(bucket_name, voice_storage_path, local_voice_path)

            # Convert downloaded voice to standard 24kHz mono WAV to avoid librosa scaling/webm issues
            import subprocess
            local_voice_wav_path = os.path.join(temp_dir, "voice_normalized.wav")
            subprocess.run(["ffmpeg", "-y", "-i", local_voice_path, "-ac", "1", "-ar", "24000", local_voice_wav_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # Determine correct pre-downloaded model path based on requested language
            if lang == "te":
                model_path = "/models/telugu"
            elif lang in ["hi", "bn", "mr", "gu", "ta"]:
                model_path = "/models/desi"
            else:
                model_path = "/models/english"
                
            from chatterbox import ChatterboxTTS
            from chatterbox.models.t3.modules.t3_config import T3Config
            
            # Dynamically patch vocab size based on model type (matches local environment behavior)
            if lang != "en":
                T3Config.english_only = classmethod(lambda cls: cls(text_tokens_dict_size=2521))
            else:
                T3Config.english_only = classmethod(lambda cls: cls(text_tokens_dict_size=704))
                
            model = ChatterboxTTS.from_local(model_path, device="cuda")
            
            # Generate speech
            import time
            start_time = time.time()
            print(f"Generating audio for gen_id: {gen_id}")
            # Use a space instead of comma. Comma at the start sometimes confuses Indian language models.
            text = " " + text.lstrip()
            
            # Use ChatterboxTTS generate (without language_id, exactly like local test)
            generated_wav = model.generate(text, audio_prompt_path=local_voice_wav_path)
            
            generation_time = time.time() - start_time
            # Modal T4 pricing is ~$0.0002 per second (including CPU/RAM overhead)
            estimated_cost = generation_time * 0.0002
            print(f"AI Generation finished in {generation_time:.2f} seconds.")
            print(f"ESTIMATED COST FOR THIS GENERATION: ${estimated_cost:.5f}")
            
            # Convert GPU tensor to standard numpy array
            if isinstance(generated_wav, torch.Tensor):
                generated_wav = generated_wav.squeeze().cpu().numpy()
                
            out_sr = getattr(model, "sr", 24000)
            
            # Prepend 800ms of silence so Bluetooth headphones / web players don't swallow the first word
            silence = np.zeros(int(out_sr * 0.8), dtype=generated_wav.dtype)
            generated_wav = np.concatenate((silence, generated_wav))
            
            # Save audio locally
            output_audio_path = os.path.join(temp_dir, "output.wav")
            scipy.io.wavfile.write(output_audio_path, out_sr, generated_wav)

            # Upload to Cloudflare R2
            output_storage_path = f"users/{user_id}/generations/{gen_id}.wav"
            s3_client.upload_file(
                output_audio_path, 
                bucket_name, 
                output_storage_path,
                ExtraArgs={"ContentType": "audio/wav"}
            )

            # Update Firestore to trigger UI
            gen_ref.update({
                "status": "COMPLETED",
                "storage_path": output_storage_path,
                "completed_at": firestore.SERVER_TIMESTAMP
            })
            
            # Clear VRAM to prevent memory leaks on warm instances
            del model
            torch.cuda.empty_cache()

            return {"status": "success", "gen_id": gen_id}

        except Exception as e:
            print(f"Generation failed: {str(e)}")
            gen_ref.update({"status": "FAILED", "error": str(e)})
            return {"error": str(e)}
