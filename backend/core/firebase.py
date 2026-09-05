import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Assuming the user places 'serviceaccounts.json' in the root folder
CRED_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "serviceaccounts.json")

# Prevent multiple initializations
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(CRED_PATH)
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'voice-clone-ac3ba.firebasestorage.app'
        })
    except Exception as e:
        print(f"WARNING: Could not initialize Firebase Admin. Make sure serviceaccounts.json is in the root directory. Error: {e}")
        # Initialize default for testing if file is missing (will fail on actual DB calls though)
        try:
            firebase_admin.initialize_app()
        except ValueError:
            pass

db = firestore.client()
