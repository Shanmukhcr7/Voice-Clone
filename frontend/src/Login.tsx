import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const uiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only initialize if not already done
    if (!window.firebaseui || !window.firebase) return;
    
    if (window.firebase.apps.length === 0) {
      window.firebase.initializeApp({
        apiKey: "AIzaSyCMg2s8kktLZ5n0fi0tyESN7_1EXUVdNbc",
        authDomain: "voice-clone-ac3ba.firebaseapp.com",
        projectId: "voice-clone-ac3ba",
        storageBucket: "voice-clone-ac3ba.firebasestorage.app",
        messagingSenderId: "260863705424",
        appId: "1:260863705424:web:67247b662ca19fc6156c55"
      });
    }

    // @ts-ignore
    const ui = window.firebaseui.auth.AuthUI.getInstance() || new window.firebaseui.auth.AuthUI(window.firebase.auth());
    
    // @ts-ignore
    ui.start(uiRef.current, {
      signInSuccessUrl: "/",
      signInOptions: [
        {
          // @ts-ignore
          provider: window.firebase.auth.PhoneAuthProvider.PROVIDER_ID,
          defaultCountry: "IN"
        }
      ],
      callbacks: {
        signInSuccessWithAuthResult: () => false // let onAuthStateChanged handle it
      }
    });

    return () => {
      // Cleanup? Not really needed for singleton
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
            <Mic size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to VoiceSaaS</h1>
          <p className="text-gray-500">Sign in to clone your voice and generate speech in seconds.</p>
        </div>

        <div ref={uiRef} className="w-full"></div>
      </motion.div>
    </div>
  );
}

