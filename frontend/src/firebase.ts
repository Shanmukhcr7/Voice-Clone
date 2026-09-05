import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCMg2s8kktLZ5n0fi0tyESN7_1EXUVdNbc",
    authDomain: "voice-clone-ac3ba.firebaseapp.com",
    projectId: "voice-clone-ac3ba",
    storageBucket: "voice-clone-ac3ba.firebasestorage.app",
    messagingSenderId: "260863705424",
    appId: "1:260863705424:web:67247b662ca19fc6156c55"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

