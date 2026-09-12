import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Calendar, Zap, CreditCard, Gift, X, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  const { token, userData, setUserData } = useAuth();
  const [name, setName] = useState(userData?.name || "");
  const [age, setAge] = useState(userData?.age ? userData.age.toString() : "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setAge(userData.age ? userData.age.toString() : "");
    }
  }, [userData]);

  const [couponCode, setCouponCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const handleSave = async () => {
    if (!name) {
      setError("Please fill out your name.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await axios.post("/api/users/update_profile", {
        name,
        age: parseInt(age) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserData(res.data);
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!couponCode) return;
    setRedeemLoading(true);
    setRedeemError("");
    setRedeemMessage("");
    try {
      const res = await axios.post("/api/apply_coupon", { code: couponCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedeemMessage(res.data.message);
      setRedeemSuccess(true);
      const userRes = await axios.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
      setUserData(userRes.data);
      setCouponCode("");
    } catch (err: any) {
      setRedeemError(err.response?.data?.detail || "Invalid coupon code");
      setRedeemSuccess(false);
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Your Profile.</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">Manage your account details and credits.</p>
        </div>
        <button 
          onClick={() => setShowRedeemModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 rounded-xl font-bold transition-colors w-full sm:w-auto"
        >
          <Gift size={18} /> Redeem Code
        </button>
      </div>

      <div className="bg-[#161821] border border-[#252833] rounded-3xl shadow-xl p-8">
        <div className="flex justify-center mb-6 text-[#6366f1]">
          <UserCircle size={64} />
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-[#0B0C10] border-[#252833] text-white rounded-xl p-3 focus:ring-1 focus:ring-[#6366f1] outline-none border transition-colors"
              placeholder="Christopher Nolan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="w-full bg-[#0B0C10] border-[#252833] text-white rounded-xl p-3 focus:ring-1 focus:ring-[#6366f1] outline-none border transition-colors"
              placeholder="35"
            />
          </div>
          
          {error && <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium">{error}</div>}
          {message && <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg text-green-400 text-sm font-medium">{message}</div>}

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-3 mt-4 bg-[#6366f1] hover:bg-opacity-90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Subscription & Credit Usage */}
        <div className="mt-8 border-t border-[#252833] pt-8">
          <h3 className="text-lg font-bold text-white mb-4">Subscription & Usage</h3>
          
          <div className="bg-[#1f212a] border border-[#252833] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6366f1]"></div>
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Available Credits</p>
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-[#6366f1]" />
                  <span className="text-2xl font-black text-white">{userData?.credits?.toLocaleString() || 0}</span>
                </div>
              </div>
              <Link to="/pricing" className="px-3 py-1.5 bg-[#6366f1]/10 text-[#6366f1] text-xs font-bold rounded-lg hover:bg-[#6366f1]/20 transition-colors">
                Upgrade
              </Link>
            </div>

            {userData?.credits_expiry && userData.credits > 0 ? (
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-[#252833]">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Calendar size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Expires on {new Date(userData.credits_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {(() => {
                      const daysLeft = Math.ceil((new Date(userData.credits_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      if (daysLeft > 1) return `${daysLeft} days remaining`;
                      if (daysLeft === 1) return `Expires tomorrow!`;
                      return `Expires today!`;
                    })()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-[#252833]">
                <div className="w-8 h-8 rounded-full bg-gray-500/10 flex items-center justify-center shrink-0">
                  <CreditCard size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400">No active subscription</p>
                  <p className="text-[10px] text-gray-400 opacity-50 mt-0.5">Purchase a plan to get credits</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Redeem Modal */}
      <AnimatePresence>
        {showRedeemModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-sm bg-[#161821] border border-[#252833] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <button onClick={() => { setShowRedeemModal(false); setRedeemSuccess(false); setCouponCode(""); setRedeemError(""); setRedeemMessage(""); }} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>

              {redeemSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ type: "spring", duration: 0.6 }} className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-2">Success!</h3>
                  <p className="text-gray-400 text-sm mb-8">{redeemMessage || "Your credits have been added successfully. Enjoy!"}</p>
                  <button onClick={() => { setShowRedeemModal(false); setRedeemSuccess(false); setCouponCode(""); }} className="w-full py-3 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-xl font-bold transition-all">
                    Awesome!
                  </button>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
                      <Gift size={20} />
                    </div>
                    <h3 className="text-xl font-black text-white">Redeem a Code</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        value={couponCode} 
                        onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                        className="w-full bg-[#0B0C10] border-[#252833] text-white rounded-xl p-4 focus:ring-2 focus:ring-[#6366f1] outline-none border transition-all uppercase text-center font-bold tracking-widest text-lg"
                        placeholder="ENTER CODE"
                      />
                    </div>
                    
                    {redeemError && <p className="text-sm font-bold text-red-400 text-center">{redeemError}</p>}
                    
                    <button 
                      onClick={handleRedeem} 
                      disabled={redeemLoading || !couponCode}
                      className="w-full py-4 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-base"
                    >
                      {redeemLoading ? "Redeeming..." : "Redeem Now"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

