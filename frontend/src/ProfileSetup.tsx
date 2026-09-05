import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { motion } from "framer-motion";
import { UserCircle } from "lucide-react";

export default function ProfileSetup() {
  const { token, refreshUserData, currentUser } = useAuth();
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
      await axios.post("/api/users/", {
        name,
        age: parseInt(age),
        phone_number: currentUser?.phoneNumber || ""
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUserData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8"
      >
        <div className="flex justify-center mb-6 text-indigo-600">
          <UserCircle size={64} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Complete Your Profile</h2>
        <p className="text-gray-500 text-center mb-6">Let us know who you are</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none border"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none border"
              placeholder="25"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

