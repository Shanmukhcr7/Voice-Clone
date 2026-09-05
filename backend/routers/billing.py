from fastapi import APIRouter, Depends, HTTPException
from backend.core.auth import get_current_user
from backend.core.firebase import db
from pydantic import BaseModel
from google.cloud import firestore

router = APIRouter()

class ApplyCouponRequest(BaseModel):
    code: str

@router.post("/apply_coupon")
def apply_coupon(
    request: ApplyCouponRequest,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("phone_number"):
        raise HTTPException(
            status_code=403, 
            detail="Phone verification required before applying a coupon. Please link your mobile number via OTP."
        )

    # Search for coupon
    coupons_ref = db.collection("coupons").where("code", "==", request.code).where("is_active", "==", True).limit(1).stream()
    coupon_doc = None
    for doc in coupons_ref:
        coupon_doc = doc
        break
        
    if not coupon_doc:
        raise HTTPException(status_code=404, detail="Invalid or inactive coupon code")
        
    c_data = coupon_doc.to_dict()
    
    transaction = db.transaction()
    @firestore.transactional
    def apply_coupon_txn(transaction, user_ref, coupon_ref, credits_to_add):
        snapshot = user_ref.get(transaction=transaction)
        user_data = snapshot.to_dict()
        new_credits = user_data.get("credits", 0) + credits_to_add
        
        transaction.update(user_ref, {
            "credits": new_credits,
            "subscription_status": "active",
            "subscription_plan": "PRO"
        })
        transaction.update(coupon_ref, {"is_active": False})
        return new_credits
        
    user_ref = db.collection("users").document(current_user["id"])
    new_balance = apply_coupon_txn(transaction, user_ref, coupon_doc.reference, c_data["credits_to_add"])
    
    return {"message": "Coupon applied successfully. Subscription active!", "new_balance": new_balance}
