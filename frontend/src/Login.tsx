import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";
import { compatAuth } from "./firebase";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import firebase from "firebase/compat/app";

export default function Login() {
  const uiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(compatAuth);
    
    ui.start(uiRef.current!, {
      signInSuccessUrl: "/",
      signInOptions: [
        {
          provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
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

