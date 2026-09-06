import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { motion } from "framer-motion";
import { UserCircle } from "lucide-react";

export default function ProfileSetup() {
  const { token, setUserData } = useAuth();
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
      const res = await axios.post("/api/users/update_profile", {
        name,
        age: parseInt(age)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserData(res.data);
      window.location.href = "/studio";
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cinebg flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#252833_1px,transparent_1px),linear-gradient(to_bottom,#252833_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-cinesurface border border-cineborder rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="flex justify-center mb-6 text-cineaccent">
          <UserCircle size={64} />
        </div>
        <h2 className="text-2xl font-display font-bold text-center text-white mb-2">Complete Your Profile</h2>
        <p className="text-cinemuted text-center mb-8">Let us know who you are</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-cinemuted mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-cinebg border-cineborder text-white rounded-xl p-3 focus:ring-1 focus:ring-cineaccent outline-none border transition-colors"
              placeholder="Christopher Nolan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cinemuted mb-1.5">Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="w-full bg-cinebg border-cineborder text-white rounded-xl p-3 focus:ring-1 focus:ring-cineaccent outline-none border transition-colors"
              placeholder="35"
            />
          </div>
          
          {error && <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium">{error}</div>}

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-3 mt-4 bg-cineaccent hover:bg-opacity-90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

