import { Check, ArrowLeft, Mail, Zap, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Link to="/" className="inline-flex items-center text-slate-400 font-bold hover:text-white transition-colors mb-12 max-w-7xl mx-auto w-full">
        <ArrowLeft size={20} className="mr-2" /> Back to Studio
      </Link>

      <div className="max-w-5xl mx-auto text-center">
        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}}>
          <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Professional Voice Generation
          </h1>
          <p className="text-slate-400 text-xl mb-16 max-w-2xl mx-auto">
            Upgrade your creative workflow with studio-quality AI voices. Simple pricing, no hidden fees.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Creator Plan */}
          <motion.div 
            initial={{y: 30, opacity: 0}} 
            animate={{y: 0, opacity: 1}} 
            transition={{delay: 0.1}} 
            className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl relative text-left flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Creator</h3>
              <p className="text-slate-400 text-sm">Perfect for personal projects and small creators.</p>
            </div>
            
            <div className="mb-8 relative">
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-slate-500 line-through text-2xl font-bold">₹300</span>
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                  50% OFF
                </span>
              </div>
              <div className="flex items-end">
                <span className="text-5xl font-black text-white">₹150</span>
                <span className="text-slate-400 mb-1 ml-2">/ one-time</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-start"><Check className="text-indigo-400 mr-3 mt-0.5 shrink-0" size={20}/> <span><strong className="text-white">30,000</strong> Credits (Characters)</span></li>
              <li className="flex items-start"><Check className="text-indigo-400 mr-3 mt-0.5 shrink-0" size={20}/> <span>Create Custom Voice Clones</span></li>
              <li className="flex items-start"><Check className="text-indigo-400 mr-3 mt-0.5 shrink-0" size={20}/> <span>English, Telugu & Hindi support</span></li>
              <li className="flex items-start"><Check className="text-indigo-400 mr-3 mt-0.5 shrink-0" size={20}/> <span>Standard GPU Priority</span></li>
            </ul>
            
            <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3 text-center">How to upgrade</p>
              <a href="mailto:viratkohlishan@gmail.com" className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white w-full py-3 rounded-xl font-bold transition-all">
                <Mail size={18} />
                <span>Contact Sales</span>
              </a>
              <p className="text-xs text-center text-slate-500 mt-3 font-mono">viratkohlishan@gmail.com</p>
            </div>
          </motion.div>

          {/* Studio Plan */}
          <motion.div 
            initial={{y: 30, opacity: 0}} 
            animate={{y: 0, opacity: 1}} 
            transition={{delay: 0.2}} 
            className="bg-gradient-to-b from-indigo-900 to-slate-900 rounded-3xl p-8 border border-indigo-500 shadow-2xl relative text-left flex flex-col md:-mt-4 md:mb-4"
          >
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black px-6 py-1.5 rounded-full text-xs shadow-lg uppercase tracking-widest flex items-center">
                <Sparkles size={14} className="mr-2" /> Most Popular
              </span>
            </div>
            
            <div className="mb-8 mt-2">
              <h3 className="text-2xl font-bold text-white mb-2">Studio</h3>
              <p className="text-indigo-200 text-sm">For professionals and heavy content production.</p>
            </div>
            
            <div className="mb-8 relative">
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-indigo-400/60 line-through text-2xl font-bold">₹1000</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                  50% OFF
                </span>
              </div>
              <div className="flex items-end">
                <span className="text-5xl font-black text-white">₹500</span>
                <span className="text-indigo-300 mb-1 ml-2">/ one-time</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-start"><Check className="text-emerald-400 mr-3 mt-0.5 shrink-0" size={20}/> <span><strong className="text-white">100,000</strong> Credits (Characters)</span></li>
              <li className="flex items-start"><Check className="text-emerald-400 mr-3 mt-0.5 shrink-0" size={20}/> <span>Unlimited Custom Voice Clones</span></li>
              <li className="flex items-start"><Zap className="text-yellow-400 mr-3 mt-0.5 shrink-0" size={20}/> <span className="text-white font-bold">Highest GPU Priority</span></li>
              <li className="flex items-start"><Shield className="text-emerald-400 mr-3 mt-0.5 shrink-0" size={20}/> <span>Commercial Rights Included</span></li>
            </ul>
            
            <div className="bg-slate-900/50 border border-indigo-500/30 p-5 rounded-2xl">
              <p className="text-xs text-indigo-300 uppercase tracking-widest font-bold mb-3 text-center">How to upgrade</p>
              <a href="mailto:viratkohlishan@gmail.com" className="flex items-center justify-center space-x-2 bg-white text-indigo-900 hover:bg-slate-100 w-full py-3 rounded-xl font-black transition-all shadow-lg">
                <Mail size={18} />
                <span>Contact Sales</span>
              </a>
              <p className="text-xs text-center text-indigo-300/60 mt-3 font-mono">viratkohlishan@gmail.com</p>
            </div>
          </motion.div>
        </div>
        
        <div className="mt-16 text-slate-500 text-sm">
          <p>Need custom volume pricing? <a href="mailto:viratkohlishan@gmail.com" className="text-indigo-400 hover:underline">Contact us</a> for Enterprise plans.</p>
        </div>
      </div>
    </div>
  );
}
