import { Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <Link to="/" className="inline-flex items-center text-indigo-600 font-bold hover:text-indigo-800 mb-12">
        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
      </Link>

      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-black mb-4">Simple, Transparent Pricing</h1>
        <p className="text-slate-500 text-lg mb-12">Get coupons directly from our admins. 1 character = 1 credit.</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <div className="text-4xl font-black text-indigo-600 mb-6">?149</div>
            <ul className="space-y-4 mb-8 text-left">
              <li className="flex items-center"><Check className="text-emerald-500 mr-2" size={20}/> 30,000 Credits</li>
              <li className="flex items-center"><Check className="text-emerald-500 mr-2" size={20}/> Unlimited Voice Clones</li>
              <li className="flex items-center"><Check className="text-emerald-500 mr-2" size={20}/> Commercial Rights</li>
            </ul>
            <div className="bg-slate-50 p-4 rounded-xl text-sm font-bold text-slate-600">
              Contact Admin to Buy: +91 9999999999
            </div>
          </motion.div>

          <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.1}} className="bg-indigo-600 rounded-3xl p-8 shadow-xl text-white relative scale-105">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold px-4 py-1 rounded-full text-xs shadow-lg">MOST POPULAR</div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-black mb-6">?449</div>
            <ul className="space-y-4 mb-8 text-left">
              <li className="flex items-center"><Check className="text-pink-300 mr-2" size={20}/> 100,000 Credits</li>
              <li className="flex items-center"><Check className="text-pink-300 mr-2" size={20}/> Unlimited Voice Clones</li>
              <li className="flex items-center"><Check className="text-pink-300 mr-2" size={20}/> Priority GPU Processing</li>
            </ul>
            <div className="bg-white/10 p-4 rounded-xl text-sm font-bold text-white">
              Contact Admin to Buy: +91 9999999999
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

