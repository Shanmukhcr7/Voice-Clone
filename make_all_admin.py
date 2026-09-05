
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from backend.core.firebase import db

def make_all_admin():
    users_ref = db.collection("users")
    count = 0
    for doc in users_ref.stream():
        doc.reference.update({"role": "ADMIN", "plan_tier": "ADMIN"})
        count += 1
    print(f"Success! Upgraded {count} users to ADMIN privileges in Firestore.")

if __name__ == "__main__":
    make_all_admin()

