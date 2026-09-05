import firebase_admin
from firebase_admin import auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.core.firebase import db

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Verify the Firebase JWT
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        
        # Check if user exists in Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Create user on first login
            email = decoded_token.get("email")
            phone_number = decoded_token.get("phone_number")
            user_data = {
                "id": uid,
                "email": email,
                "phone_number": phone_number,
                "role": "USER",
                "credits": 0.0,
                "profile_completed": False
            }
            user_ref.set(user_data)
            return user_data
            
        return user_doc.to_dict()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user
