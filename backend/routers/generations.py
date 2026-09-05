from fastapi import APIRouter, Depends, HTTPException
from backend.core.auth import get_current_user
from backend.core.firebase import db
from backend.services.storage import storage_service
from google.cloud import firestore
import uuid

router = APIRouter()

@router.post("/")
def create_generation(
    voice_id: str,
    text: str,
    language: str = "te",
    current_user: dict = Depends(get_current_user)
):
    # Check if voice exists and belongs to user
    voice_doc = db.collection("voices").document(voice_id).get()
    if not voice_doc.exists or voice_doc.to_dict().get("user_id") != current_user['id']:
        raise HTTPException(status_code=404, detail="Voice not found")
        
    user_ref = db.collection("users").document(current_user['id'])
    user_data = user_ref.get().to_dict()
    
    cost = len(text)
    if user_data.get("credits", 0) < cost:
        raise HTTPException(status_code=402, detail=f"Insufficient credits. This generation costs {cost} credits, but you only have {user_data.get('credits', 0)}.")
        
    gen_id = str(uuid.uuid4())
    
    gen_data = {
        "id": gen_id,
        "user_id": current_user['id'],
        "voice_id": voice_id,
        "text": text,
        "language": language,
        "status": "QUEUED",
        "credits_consumed": cost,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    # Deduct credits and save job in a transaction
    transaction = db.transaction()
    @firestore.transactional
    def queue_job(transaction, user_ref, gen_data):
        snapshot = user_ref.get(transaction=transaction)
        user_data = snapshot.to_dict()
        new_credits = user_data.get("credits", 0) - gen_data["credits_consumed"]
        if new_credits < 0:
            raise Exception("Insufficient credits during transaction")
        transaction.update(user_ref, {"credits": new_credits})
        transaction.set(db.collection("generations").document(gen_data["id"]), gen_data)
        
    queue_job(transaction, user_ref, gen_data)
    
    return {"job_id": gen_id, "status": "QUEUED"}

@router.get("/")
def list_generations(current_user: dict = Depends(get_current_user)):
    gens = db.collection("generations").where("user_id", "==", current_user['id']).stream()
    results = []
    for doc in gens:
        g = doc.to_dict()
        g.pop("created_at", None)
        g.pop("completed_at", None)
        if g.get('storage_path'):
            g['url'] = storage_service.generate_signed_url(g['storage_path'])
        results.append(g)
    return results

@router.delete("/{gen_id}")
def delete_generation(gen_id: str, current_user: dict = Depends(get_current_user)):
    doc_ref = db.collection("generations").document(gen_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    gen_data = doc.to_dict()
    if gen_data.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this generation")
        
    # Delete from R2
    if gen_data.get("storage_path"):
        storage_service.delete_file(gen_data["storage_path"])
        
    # Delete from Firestore
    doc_ref.delete()
    
    return {"status": "success", "message": "Generation deleted"}
