import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { motion } from "framer-motion";
import { UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileSetup() {
  const { token, refreshUserData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !age) {
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/users/update_profile", {
        name,
        age: parseInt(age)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUserData();
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error connecting to server. Have you bypassed the SSL warning?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl shadow-xl p-8"
      >
        <div className="flex justify-center mb-6 text-indigo-400">
          <UserCircle size={64} />
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Complete Your Profile</h2>
        <p className="text-slate-400 text-center mb-8">Let us know who you are</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-slate-900 border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none border"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="w-full bg-slate-900 border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none border"
              placeholder="25"
            />
          </div>
          
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium">{error}</div>}

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

