from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from backend.core.auth import get_current_user
from backend.core.firebase import db
from backend.services.storage import storage_service
from google.cloud import firestore
import uuid
import os

router = APIRouter()

@router.post("")
async def create_voice(
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    safe_name = "".join([c if c.isalnum() else "_" for c in current_user.get("name", current_user["id"])])
    object_name = f"{safe_name}/voices/{file_id}.webm"
    
    storage_service.upload_file_object(file.file, object_name, file.content_type)
    
    voice_data = {
        "id": file_id,
        "user_id": current_user['id'],
        "name": name,
        "storage_path": object_name,
        "status": "ready",
        "duration": 0.0,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    db.collection("voices").document(file_id).set(voice_data)
    
    # Return a safe dictionary (FastAPI cannot serialize firestore.SERVER_TIMESTAMP)
    return {
        "id": file_id,
        "name": name,
        "status": "ready"
    }

@router.get("")
def list_voices(current_user: dict = Depends(get_current_user)):
    voices_ref = db.collection("voices").where("user_id", "==", current_user['id']).stream()
    voices = []
    for doc in voices_ref:
        v = doc.to_dict()
        v.pop("created_at", None)
        if v.get('storage_path'):
            v['url'] = storage_service.generate_signed_url(v['storage_path'])
        voices.append(v)
    return voices

@router.delete("/{voice_id}")
def delete_voice(voice_id: str, current_user: dict = Depends(get_current_user)):
    doc_ref = db.collection("voices").document(voice_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Voice not found")
        
    voice_data = doc.to_dict()
    if voice_data.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this voice")
        
    # Delete from R2
    if voice_data.get("storage_path"):
        storage_service.delete_file(voice_data["storage_path"])
        
    # Delete from Firestore
    doc_ref.delete()
    
    return {"status": "success", "message": "Voice deleted"}
