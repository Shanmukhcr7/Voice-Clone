import sys
import os

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.firebase import db

def make_admin(identifier: str):
    # Search for user by email or phone
    users_ref = db.collection("users")
    
    # Check email
    query_email = users_ref.where("email", "==", identifier).stream()
    user_doc = None
    for doc in query_email:
        user_doc = doc
        break
        
    # Check phone if email not found
    if not user_doc:
        query_phone = users_ref.where("phone_number", "==", identifier).stream()
        for doc in query_phone:
            user_doc = doc
            break
            
    if not user_doc:
        print(f"Error: User with email/phone '{identifier}' not found in Firestore.")
        sys.exit(1)
        
    user_doc.reference.update({"role": "ADMIN"})
    print(f"Success! '{identifier}' has been granted ADMIN privileges in Firestore.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email_or_phone>")
        sys.exit(1)
        
    make_admin(sys.argv[1])
