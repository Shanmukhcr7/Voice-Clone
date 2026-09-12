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
            name = decoded_token.get("name", "User") # Grab name from Google token
            user_data = {
                "id": uid,
                "name": name,
                "email": email,
                "phone_number": phone_number,
                "age": 0, # Default age since Google doesn't provide it
                "role": "USER",
                "credits": 0.0,
                "credits_expiry": None, # New field
                "profile_completed": True
            }
            user_ref.set(user_data)
            return user_data
            
        user_data = user_doc.to_dict()
        
        # --- LAZY EXPIRY LOGIC ---
        import datetime
        expiry_str = user_data.get("credits_expiry")
        if expiry_str and user_data.get("credits", 0) > 0:
            try:
                # Parse ISO string
                expiry_date = datetime.datetime.fromisoformat(expiry_str.replace("Z", "+00:00"))
                now = datetime.datetime.now(datetime.timezone.utc)
                if now > expiry_date:
                    print(f"Credits for user {uid} expired on {expiry_date}. Resetting to 0.")
                    user_data["credits"] = 0.0
                    user_data["credits_expiry"] = None
                    user_ref.update({"credits": 0.0, "credits_expiry": None})
            except Exception as e:
                print(f"Failed to parse credits_expiry: {e}")
                
        return user_data
        
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
