from fastapi import APIRouter, Depends, HTTPException, Request
from backend.core.auth import get_current_user
from backend.core.firebase import db
from pydantic import BaseModel
from google.cloud import firestore
import uuid
import os
import json
from cashfree_pg.models.create_order_request import CreateOrderRequest
from cashfree_pg.api_client import Cashfree
from cashfree_pg.models.customer_details import CustomerDetails
from cashfree_pg.models.order_meta import OrderMeta

router = APIRouter()

# Configure Cashfree
Cashfree.XClientId = os.getenv("CASHFREE_APP_ID", "TEST_APP_ID")
Cashfree.XClientSecret = os.getenv("CASHFREE_SECRET_KEY", "TEST_SECRET_KEY")
Cashfree.XEnvironment = Cashfree.SANDBOX # Use Cashfree.PRODUCTION in prod

class CreateOrderReq(BaseModel):
    plan_id: str

PLANS = {
    "creator": {"price": 99, "credits": 30000},
    "studio": {"price": 499, "credits": 100000},
    "pro": {"price": 999, "credits": 250000}
}

@router.post("/create-order")
def create_order(req: CreateOrderReq, current_user: dict = Depends(get_current_user)):
    if req.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
        
    plan = PLANS[req.plan_id]
    order_id = f"ORDER_{uuid.uuid4().hex[:12].upper()}"
    
    # Store order intent in Firestore before calling Cashfree
    db.collection("orders").document(order_id).set({
        "user_id": current_user["id"],
        "plan_id": req.plan_id,
        "amount": plan["price"],
        "credits": plan["credits"],
        "status": "PENDING"
    })
    
    customerDetails = CustomerDetails(
        customer_id=current_user["id"],
        customer_phone=current_user.get("phone_number", "9999999999"),
        customer_email=current_user.get("email", "test@test.com")
    )
    
    createOrderRequest = CreateOrderRequest(
        order_amount=float(plan["price"]),
        order_currency="INR",
        customer_details=customerDetails,
        order_meta=OrderMeta(
            return_url="https://voice-clone-lilac.vercel.app/studio?order_id={order_id}"
        )
    )
    
    createOrderRequest.order_id = order_id
    
    try:
        api_response = Cashfree().PGCreateOrder(
            "2023-08-01", 
            createOrderRequest
        )
        return {
            "payment_session_id": api_response.data.payment_session_id,
            "order_id": order_id
        }
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

class VerifyPaymentReq(BaseModel):
    order_id: str

@router.post("/verify-payment")
def verify_payment(req: VerifyPaymentReq, current_user: dict = Depends(get_current_user)):
    try:
        api_response = Cashfree().PGFetchOrder(
            "2023-08-01",
            req.order_id
        )
        
        if api_response.data.order_status == "PAID":
            # Process in firestore txn
            order_ref = db.collection("orders").document(req.order_id)
            user_ref = db.collection("users").document(current_user["id"])
            
            transaction = db.transaction()
            @firestore.transactional
            def complete_order_txn(transaction, order_ref, user_ref):
                order_doc = order_ref.get(transaction=transaction)
                if not order_doc.exists:
                    raise Exception("Order not found")
                
                order_data = order_doc.to_dict()
                if order_data.get("status") == "PAID":
                    return True # already processed
                    
                user_doc = user_ref.get(transaction=transaction)
                user_data = user_doc.to_dict()
                
                new_credits = user_data.get("credits", 0) + order_data["credits"]
                
                transaction.update(user_ref, {"credits": new_credits})
                transaction.update(order_ref, {"status": "PAID"})
                
                return True
                
            complete_order_txn(transaction, order_ref, user_ref)
            return {"status": "PAID", "message": "Credits successfully added to your account!"}
            
        return {"status": api_response.data.order_status}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
