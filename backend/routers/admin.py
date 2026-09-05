from fastapi import APIRouter, Depends, HTTPException
from backend.core.auth import get_current_user
from backend.core.firebase import db
from pydantic import BaseModel
import secrets
import uuid

router = APIRouter()

def get_admin_user(current_user: dict = Depends(get_current_user)):
    user_doc = db.collection("users").document(current_user["id"]).get()
    if not user_doc.exists or user_doc.to_dict().get("plan_tier") != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user

class CreateCouponRequest(BaseModel):
    credits_to_add: float = 100.0

@router.post("/coupons")
def create_coupon(request: CreateCouponRequest, admin=Depends(get_admin_user)):
    code = secrets.token_urlsafe(8).upper()
    c_id = str(uuid.uuid4())
    coupon_data = {
        "id": c_id,
        "code": code,
        "discount_percent": 100.0,
        "credits_to_add": request.credits_to_add,
        "is_active": True
    }
    db.collection("coupons").document(c_id).set(coupon_data)
    return {"code": code, "credits": request.credits_to_add}

@router.get("/users")
def get_all_users(admin=Depends(get_admin_user)):
    users = []
    for doc in db.collection("users").stream():
        users.append(doc.to_dict())
    return users

class UpdateCreditsRequest(BaseModel):
    credits: float

@router.put("/users/{user_id}/credits")
def update_user_credits(user_id: str, request: UpdateCreditsRequest, admin=Depends(get_admin_user)):
    db.collection("users").document(user_id).update({"credits": request.credits})
    return {"status": "success"}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, admin=Depends(get_admin_user)):
    db.collection("users").document(user_id).delete()
    # Note: Does not delete firebase auth user directly since Admin SDK would be needed
    return {"status": "success"}

