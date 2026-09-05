import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json

# Prevent multiple initializations
if not firebase_admin._apps:
    try:
        # Check if credentials exist in an Environment Variable (for Coolify/Cloud)
        env_cred = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if env_cred:
            cred_dict = json.loads(env_cred)
            cred = credentials.Certificate(cred_dict)
            print("Loaded Firebase Admin credentials from Environment Variable.")
        else:
            # Fallback to local file
            CRED_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "serviceaccounts.json")
            cred = credentials.Certificate(CRED_PATH)
            print("Loaded Firebase Admin credentials from local file.")

        firebase_admin.initialize_app(cred, {
            "storageBucket": "voice-clone-ac3ba.firebasestorage.app"
        })
    except Exception as e:
        print(f"WARNING: Could not initialize Firebase Admin. Error: {e}")
        try:
            firebase_admin.initialize_app()
        except ValueError:
            pass

db = firestore.client()

