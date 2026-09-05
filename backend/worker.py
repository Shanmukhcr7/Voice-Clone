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
    from huggingface_hub import snapshot_download
    print("Downloading Telugu Model...")
    snapshot_download(repo_id="shankarpandala/chatterbox-telugu", local_dir="/models/telugu")
    print("Downloading English Model...")
    snapshot_download(repo_id="ResembleAI/chatterbox", local_dir="/models/english")
    print("Downloading Desi Model...")
    snapshot_download(repo_id="BosonLab/chatterbox-desi", local_dir="/models/desi")

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
        "numpy"
    )
    .run_function(download_models) # Downloads models into the Docker Image at build time!
)


# ==============================================================================
# GPU WORKER FUNCTION
# ==============================================================================
@app.function(
    image=image, 
    gpu="T4", # Using T4 which costs $0.000164 / sec
    secrets=[modal.Secret.from_name("voxaura-secrets")], # Automatically injects your API keys
    timeout=300,
    min_containers=1 # Keeps 1 GPU warm for instant processing (Optional: remove this to scale to 0)
)
@modal.web_endpoint(method="POST")
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

            # Determine correct pre-downloaded model path based on requested language
            model_path = "/models/desi" # fallback
            if lang == "te": model_path = "/models/telugu"
            elif lang == "en": model_path = "/models/english"

            # Load the AI model explicitly to the GPU (cuda)
            print(f"Loading {lang} model into GPU memory...")
            model = ChatterboxTTS.from_local(model_path, device="cuda")
            
            # Generate speech
            print(f"Generating audio for gen_id: {gen_id}")
            text = ", " + text.lstrip() # Adds breath pause
            generated_wav = model.generate(text, audio_prompt_path=local_voice_path)
            
            # Convert GPU tensor to standard numpy array
            if isinstance(generated_wav, torch.Tensor):
                generated_wav = generated_wav.squeeze().cpu().numpy()
                
            out_sr = getattr(model, "sr", 24000)
            
            # Prepend 300ms of silence
            silence = np.zeros(int(out_sr * 0.3), dtype=generated_wav.dtype)
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
