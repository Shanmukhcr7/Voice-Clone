import time
import os
import sys

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.firebase import db
from backend.services.storage import storage_service
from generate import generate_speech
from google.cloud import firestore

print("Starting Local GPU/CPU Inference Worker...")

def process_job(job_doc):
    job = job_doc.to_dict()
    job_id = job["id"]
    print(f"\n[WORKER] Picked up job {job_id}")
    
    # 1. Mark as processing
    job_doc.reference.update({"status": "PROCESSING"})
    
    try:
        voice_id = job["voice_id"]
        text = job["text"]
        user_id = job["user_id"]
        
        # 2. Get voice data from Firestore
        voice_doc = db.collection("voices").document(voice_id).get()
        if not voice_doc.exists:
            raise Exception("Voice not found")
        voice_path = voice_doc.to_dict()["storage_path"]
        
        # 3. Download reference audio from R2 to local temp
        temp_voice_path = f"temp_{voice_id}.wav"
        print(f"[WORKER] Downloading voice reference {voice_path}...")
        storage_service.download_file(voice_path, temp_voice_path)
        
        # 4. Generate Speech (uses local compute!)
        print(f"[WORKER] Synthesizing speech...")
        lang = job.get("language", "te")
        out_sr, out_y, gen_time = generate_speech(text, temp_voice_path, lang)
        
        # 5. Save output temporarily
        from utils import save_generated_audio
        actual_out_path = save_generated_audio(out_y, out_sr, "temp")
        
        # 6. Upload output to R2
        # Fetch user's name from Firestore for the folder structure
        user_doc = db.collection("users").document(user_id).get()
        user_name = user_doc.to_dict().get("name", user_id) if user_doc.exists else user_id
        safe_name = "".join([c if c.isalnum() else "_" for c in user_name])
        
        out_storage_path = f"{safe_name}/generations/{job_id}.wav"
        print(f"[WORKER] Uploading generated audio to {out_storage_path}...")
        with open(actual_out_path, "rb") as f:
            storage_service.upload_file_object(f, out_storage_path, "audio/wav")
            
        # 7. Cleanup temp files
        if os.path.exists(temp_voice_path): os.remove(temp_voice_path)
        if os.path.exists(actual_out_path): os.remove(actual_out_path)
        
        # 8. Mark job completed
        job_doc.reference.update({
            "status": "COMPLETED",
            "completed_at": firestore.SERVER_TIMESTAMP,
            "storage_path": out_storage_path
        })
        print(f"[WORKER] Job {job_id} completed successfully in {gen_time:.2f}s!")
        
    except Exception as e:
        print(f"[WORKER] Job {job_id} failed: {e}")
        job_doc.reference.update({
            "status": "FAILED",
            "error_info": str(e),
            "completed_at": firestore.SERVER_TIMESTAMP
        })

def poll_queue():
    while True:
        # Find queued jobs
        query = db.collection("generations").where("status", "==", "QUEUED").limit(1).stream()
        job_doc = None
        for doc in query:
            job_doc = doc
            break
            
        if job_doc:
            process_job(job_doc)
        else:
            # Sleep if no jobs
            time.sleep(2)

if __name__ == "__main__":
    # Ensure local folders exist for temp processing
    os.makedirs("outputs", exist_ok=True)
    poll_queue()
