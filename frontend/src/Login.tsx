import { useEffect, useRef } from "react";
import { Shield, Play } from "lucide-react";
import { motion } from "framer-motion";
import { compatAuth } from "./firebase";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import firebase from "firebase/compat/app";
import { useAuth } from "./AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const uiRef = useRef<HTMLDivElement>(null);
  const { currentUser, userData, loading, apiError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !loading) {
      if (apiError) return; // Do not redirect if there's an API error! Let the user see it.
      if (userData) {
        if (!userData.name) navigate("/setup"); // Check if profile actually completed
        else navigate("/studio");
      }
      else navigate("/setup");
    }
  }, [currentUser, userData, loading, apiError, navigate]);

  useEffect(() => {
    if (currentUser) return; // Dont render UI if logged in
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(compatAuth);
    ui.start(uiRef.current!, {
      signInSuccessUrl: "/studio",
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
      ],
      signInFlow: "popup",
      callbacks: {
        signInSuccessWithAuthResult: () => false // let onAuthStateChanged handle it
      }
    });
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-cinebg flex flex-col items-center justify-center relative px-6 font-sans">
      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#252833_1px,transparent_1px),linear-gradient(to_bottom,#252833_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>

      <Link to="/" className="absolute top-8 left-8 flex items-center space-x-2 z-20">
        <div className="w-8 h-8 rounded bg-cineaccent flex items-center justify-center">
          <Play fill="currentColor" size={16} className="text-white ml-1" />
        </div>
        <span className="text-xl font-display font-bold tracking-tight text-white">YouVoice</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-cinesurface rounded-3xl shadow-2xl p-8 border border-cineborder relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-cinemuted text-sm">Sign in to access your production studio.</p>
        </div>

        <div className="min-h-[100px] flex flex-col items-center justify-center">
          {apiError ? (
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4 text-center max-w-sm w-full mb-4">
              <h3 className="text-red-400 font-bold text-sm mb-2">API Connection Failed</h3>
              <p className="text-cinemuted text-xs mb-3">{apiError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-cineaccent hover:bg-opacity-90 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all w-full"
              >
                Retry Connection
              </button>
            </div>
          ) : loading ? (
             <div className="w-8 h-8 border-4 border-cineaccent border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <div ref={uiRef} className="w-full auth-container"></div>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-cineborder flex flex-col items-center justify-center gap-2 text-xs text-cinemuted">
          <div className="flex items-center gap-1">
            <Shield size={14} /> Secure Authentication
          </div>
        </div>
      </motion.div>

      <style>{`
        /* Cinematic Firebase UI Styling */
        .auth-container .firebaseui-container { max-w: 100%; box-shadow: none !important; font-family: inherit; }
        .auth-container .firebaseui-card-content { padding: 0 !important; }
        .auth-container .firebaseui-idp-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .auth-container .firebaseui-list-item { margin: 0 !important; }
        .auth-container .firebaseui-idp-button { max-width: 100% !important; border-radius: 99px !important; box-shadow: none !important; padding: 12px 24px !important; display: flex !important; justify-content: center !important; font-weight: 600 !important; min-height: 48px !important; }
        .auth-container .firebaseui-idp-google { background-color: #F5F5F7 !important; color: #08090D !important; border: none !important; transition: all 0.2s ease !important; }
        .auth-container .firebaseui-idp-google:hover { background-color: white !important; transform: scale(1.02); }
        .auth-container .firebaseui-idp-text { font-family: inherit !important; font-size: 15px !important; text-align: center; }
      `}</style>
    </div>
  );
}

