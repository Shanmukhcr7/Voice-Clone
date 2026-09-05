import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCMg2s8kktLZ5n0fi0tyESN7_1EXUVdNbc",
    authDomain: "voice-clone-ac3ba.firebaseapp.com",
    projectId: "voice-clone-ac3ba",
    storageBucket: "voice-clone-ac3ba.firebasestorage.app",
    messagingSenderId: "260863705424",
    appId: "1:260863705424:web:67247b662ca19fc6156c55"
};

// Initialize Modular SDK (for our React context)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Compat SDK (for FirebaseUI)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
export const compatAuth = firebase.auth();

