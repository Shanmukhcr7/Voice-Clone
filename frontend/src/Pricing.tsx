import { useState } from "react";
import { Check, ArrowLeft, Zap, Shield, Sparkles, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "./AuthContext";
// @ts-ignore
import { load } from "@cashfreepayments/cashfree-js";

export default function Pricing() {
  const { token, currentUser } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }
    
    setLoadingPlan(planId);
    try {
      // 1. Initialize Cashfree
      const cashfree = await load({ mode: "sandbox" }); // or "production"
      
      // 2. Create order on backend
      const res = await axios.post("/api/billing/create-order", { plan_id: planId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { payment_session_id } = res.data;
      
      // 3. Open Cashfree Checkout Popup
      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        redirectTarget: "_self"
      };
      cashfree.checkout(checkoutOptions);
      
    } catch (err: any) {
      console.error(err);
      alert("Failed to initiate payment. " + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-cinebg text-cinetext font-sans selection:bg-cineaccent selection:text-white pb-24">
      {/* Navbar */}
      <nav className="w-full border-b border-cineborder bg-cinebg/80 backdrop-blur-md mb-12">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
          <Link to="/" className="flex items-center space-x-2 mr-auto hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-cineaccent flex items-center justify-center">
              <Play fill="currentColor" size={16} className="text-white ml-1" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-white">YouVoice</span>
          </Link>
          <Link to={currentUser ? "/studio" : "/"} className="inline-flex items-center text-cinemuted font-semibold hover:text-white transition-colors">
            <ArrowLeft size={18} className="mr-2" /> Back to Studio
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}}>
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-white tracking-tight">
            Cinematic AI Production
          </h1>
          <p className="text-cinemuted text-lg md:text-xl mb-16 max-w-2xl mx-auto font-light">
            Upgrade your creative workflow with studio-quality AI tools. Simple pricing, no hidden fees.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <motion.div 
            initial={{y: 30, opacity: 0}} 
            animate={{y: 0, opacity: 1}} 
            transition={{delay: 0.1}} 
            className="bg-cinesurface rounded-3xl p-8 border border-cineborder relative text-left flex flex-col hover:border-cinemuted transition-colors"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-display font-bold text-white mb-2">Creator</h3>
              <p className="text-cinemuted text-sm">Perfect for personal projects.</p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-end">
                <span className="text-4xl font-display font-bold text-white">₹99</span>
                <span className="text-cinemuted mb-1 ml-2 text-sm">/ one-time</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex items-start"><Check className="text-cineaccent mr-3 shrink-0" size={18}/> <span><strong className="text-white">30,000</strong> Credits (Characters)</span></li>
              <li className="flex items-start"><Check className="text-cineaccent mr-3 shrink-0" size={18}/> <span>Create Custom Voice Clones</span></li>
              <li className="flex items-start"><Check className="text-cineaccent mr-3 shrink-0" size={18}/> <span>Normal Priority</span></li>
            </ul>
            
            <button 
              onClick={() => handleCheckout("creator")}
              disabled={loadingPlan === "creator"}
              className="w-full py-4 rounded-xl font-bold border border-cineborder hover:bg-white hover:text-cinebg transition-colors disabled:opacity-50"
            >
              {loadingPlan === "creator" ? "Processing..." : "Buy Creator"}
            </button>
          </motion.div>

          {/* Studio Plan */}
          <motion.div 
            initial={{y: 30, opacity: 0}} 
            animate={{y: 0, opacity: 1}} 
            transition={{delay: 0.2}} 
            className="bg-cinesurface rounded-3xl p-8 border-2 border-cineaccent relative text-left flex flex-col md:-mt-4 md:mb-4 shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]"
          >
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <span className="bg-cineaccent text-white font-bold px-4 py-1 rounded-full text-xs uppercase tracking-widest flex items-center">
                <Sparkles size={14} className="mr-1.5" /> Most Popular
              </span>
            </div>
            
            <div className="mb-6 mt-2">
              <h3 className="text-2xl font-display font-bold text-white mb-2">Studio</h3>
              <p className="text-cinemuted text-sm">For professional content creators.</p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-end">
                <span className="text-4xl font-display font-bold text-white">₹499</span>
                <span className="text-cinemuted mb-1 ml-2 text-sm">/ one-time</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex items-start"><Check className="text-cineaccent mr-3 shrink-0" size={18}/> <span><strong className="text-white">100,000</strong> Credits (Characters)</span></li>
              <li className="flex items-start"><Check className="text-cineaccent mr-3 shrink-0" size={18}/> <span>Unlimited Voice Clones</span></li>
              <li className="flex items-start"><Zap className="text-cineaccent mr-3 shrink-0" size={18}/> <span className="text-white font-bold">High Priority</span></li>
              <li className="flex items-start"><Shield className="text-cineaccent mr-3 shrink-0" size={18}/> <span>Commercial Rights</span></li>
            </ul>
            
            <button 
              onClick={() => handleCheckout("studio")}
              disabled={loadingPlan === "studio"}
              className="w-full py-4 rounded-xl font-bold bg-cineaccent hover:bg-opacity-90 text-white transition-colors disabled:opacity-50"
            >
              {loadingPlan === "studio" ? "Processing..." : "Buy Studio"}
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            initial={{y: 30, opacity: 0}} 
            animate={{y: 0, opacity: 1}} 
            transition={{delay: 0.3}} 
            className="bg-cinesurface rounded-3xl p-8 border border-cineborder relative text-left flex flex-col hover:border-cinemuted transition-colors"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-display font-bold text-white mb-2">Pro</h3>
              <p className="text-cinemuted text-sm">For high-volume studios and agencies.</p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-end">
                <span className="text-4xl font-display font-bold text-white">₹999</span>
                <span className="text-cinemuted mb-1 ml-2 text-sm">/ one-time</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex items-start"><Check className="text-cineaccent mr-3 shrink-0" size={18}/> <span><strong className="text-white">250,000</strong> Credits (Characters)</span></li>
              <li className="flex items-start"><Check className="text-cineaccent mr-3 shrink-0" size={18}/> <span>Unlimited Voice Clones</span></li>
              <li className="flex items-start"><Zap className="text-cineaccent mr-3 shrink-0" size={18}/> <span className="text-white font-bold">Ultra Priority GPU</span></li>
              <li className="flex items-start"><Shield className="text-cineaccent mr-3 shrink-0" size={18}/> <span>Commercial Rights</span></li>
            </ul>
            
            <button 
              onClick={() => handleCheckout("pro")}
              disabled={loadingPlan === "pro"}
              className="w-full py-4 rounded-xl font-bold border border-cineborder hover:bg-white hover:text-cinebg transition-colors disabled:opacity-50"
            >
              {loadingPlan === "pro" ? "Processing..." : "Buy Pro"}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
