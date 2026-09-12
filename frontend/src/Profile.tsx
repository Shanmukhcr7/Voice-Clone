import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { motion } from "framer-motion";
import { UserCircle, ArrowLeft, Calendar, Zap, CreditCard } from "lucide-react";
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
      const userRes = await axios.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
      setUserData(userRes.data);
      setCouponCode("");
    } catch (err: any) {
      setRedeemError(err.response?.data?.detail || "Invalid coupon code");
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#252833_1px,transparent_1px),linear-gradient(to_bottom,#252833_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#161821] border border-[#252833] rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <Link to="/studio" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Studio
        </Link>
        <div className="flex justify-center mb-6 text-[#6366f1]">
          <UserCircle size={64} />
        </div>
        <h2 className="text-2xl font-display font-bold text-center text-white mb-2">Your Profile</h2>
        <p className="text-gray-400 text-center mb-8">Manage your account details</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-[#0B0C10] border-[#252833] text-white rounded-xl p-3 focus:ring-1 focus:ring-cineaccent outline-none border transition-colors"
              placeholder="Christopher Nolan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="w-full bg-[#0B0C10] border-[#252833] text-white rounded-xl p-3 focus:ring-1 focus:ring-cineaccent outline-none border transition-colors"
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

        {/* Redeem Coupon */}
        <div className="mt-6 border-t border-[#252833] pt-6">
          <h3 className="text-sm font-bold text-white mb-3">Redeem a Code</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponCode} 
              onChange={e => setCouponCode(e.target.value.toUpperCase())} 
              className="flex-1 bg-[#0B0C10] border-[#252833] text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#6366f1] outline-none border transition-colors uppercase"
              placeholder="ENTER CODE"
            />
            <button 
              onClick={handleRedeem} 
              disabled={redeemLoading || !couponCode}
              className="px-5 py-3 bg-[#6366f1] hover:bg-opacity-90 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
            >
              {redeemLoading ? "..." : "Redeem"}
            </button>
          </div>
          {redeemError && <p className="mt-2 text-xs font-bold text-red-400">{redeemError}</p>}
          {redeemMessage && <p className="mt-2 text-xs font-bold text-green-400">{redeemMessage}</p>}
        </div>

      </motion.div>
    </div>
  );
}

