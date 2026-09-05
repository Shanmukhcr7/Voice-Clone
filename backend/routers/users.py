from fastapi import APIRouter, Depends
from backend.core.auth import get_current_user
from backend.core.firebase import db
from pydantic import BaseModel

router = APIRouter()

class UserProfileUpdate(BaseModel):
    name: str
    age: int

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/update_profile")
def update_profile(
    profile: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_ref = db.collection("users").document(current_user['id'])
    user_ref.update({
        "name": profile.name,
        "age": profile.age,
        "profile_completed": True
    })
    
    # Return updated user
    return user_ref.get().to_dict()

@router.delete("/me")
def delete_my_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    from backend.services.storage import storage_service
    
    # 1. Delete all user voices
    voices = db.collection("voices").where("user_id", "==", user_id).stream()
    for v in voices:
        v_data = v.to_dict()
        if v_data.get("storage_path"):
            storage_service.delete_file(v_data["storage_path"])
        v.reference.delete()
        
    # 2. Delete all user generations
    gens = db.collection("generations").where("user_id", "==", user_id).stream()
    for g in gens:
        g_data = g.to_dict()
        if g_data.get("storage_path"):
            storage_service.delete_file(g_data["storage_path"])
        g.reference.delete()
        
    # 3. Delete user document
    db.collection("users").document(user_id).delete()
    
    # Note: Firebase Auth user deletion should ideally be done from the frontend 
    # using `user.delete()` in the Firebase JS SDK so it revokes the token properly.
    
    return {"status": "success", "message": "Account and all data deleted"}
