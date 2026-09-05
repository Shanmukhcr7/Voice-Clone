import { useEffect, useRef } from "react";
import { Mic, Sparkles, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { compatAuth } from "./firebase";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import firebase from "firebase/compat/app";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const uiRef = useRef<HTMLDivElement>(null);
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !loading) {
      if (userData) navigate("/");
      else navigate("/setup");
    }
  }, [currentUser, userData, loading, navigate]);

  useEffect(() => {
    if (currentUser) return; // Dont render UI if logged in
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(compatAuth);
    
    ui.start(uiRef.current!, {
      signInSuccessUrl: "/",
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        {
          provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
          defaultCountry: "IN"
        }
      ],
      callbacks: {
        signInSuccessWithAuthResult: () => false // let onAuthStateChanged handle it
      }
    });
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
      {/* Left Side - Marketing */}
      <div className="md:w-1/2 p-12 lg:p-20 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml,base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat"></div>
        
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="z-10 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-indigo-200 text-sm font-medium mb-8">
            <Sparkles size={16} /> Pro Voice Engine v2.0
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            VoxAura<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Studio
            </span>
          </h1>
          <p className="text-lg text-slate-300 mb-12 max-w-lg leading-relaxed">
            The world's most advanced AI voice cloning platform. Generate studio-quality, ultra-realistic speech in seconds using industry-leading deep learning models.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Mic className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Instant Cloning</h3>
                <p className="text-sm">Clone any voice with just a 15-second audio sample.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Zap className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Lightning Fast</h3>
                <p className="text-sm">Dedicated H100 GPUs render your audio in real-time.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in with your Google account or Phone number to access your dashboard.</p>
          </div>

          <div className="min-h-[250px] flex items-center justify-center">
            {loading ? (
               <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <div ref={uiRef} className="w-full auth-container"></div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield size={14} /> Secure Authentication
          </div>
        </motion.div>
      </div>
      <style>{`
        /* Make firebase ui look modern */
        .auth-container .firebaseui-container { max-w: 100%; box-shadow: none !important; font-family: inherit; }
        .auth-container .firebaseui-card-content { padding: 0 !important; }
        .auth-container .firebaseui-idp-google { background-color: white !important; color: #1e293b !important; border: 1px solid #e2e8f0 !important; border-radius: 99px !important; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; padding: 12px 24px !important; display: flex !important; justify-content: center !important; font-weight: 600 !important; }
        .auth-container .firebaseui-idp-text { font-family: inherit !important; font-size: 15px !important; }
      `}</style>
    </div>
  );
}

