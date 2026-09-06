import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Image as ImageIcon, Video, User, Sparkles, Mic } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-cinebg text-cinetext font-sans selection:bg-cineaccent selection:text-white">
      {/* Navbar */}
      <nav className="absolute top-0 w-full z-50 border-b border-cineborder bg-cinebg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-cineaccent flex items-center justify-center">
              <Play fill="currentColor" size={16} className="text-white ml-1" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-white">YouVoice</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-cinemuted">
            <a href="#create" className="hover:text-white transition-colors">Create</a>
            <a href="#tools" className="hover:text-white transition-colors">Tools</a>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-white hover:text-cineaccent transition-colors">Login</Link>
            <Link to="/login" className="hidden sm:flex items-center text-sm font-semibold bg-white text-cinebg px-5 py-2.5 rounded-full hover:bg-cinetext transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#252833_1px,transparent_1px),linear-gradient(to_bottom,#252833_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 pt-16 md:pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter text-white leading-[1.1] mb-6">
              CREATE CINEMA <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cineaccent to-purple-500">WITH AI.</span>
            </h1>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <p className="text-lg md:text-xl text-cinemuted mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Turn your ideas into cinematic videos, characters, VFX and stories. 
              The ultimate professional AI production studio.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="bg-cineaccent text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]">
              Start Creating <Play fill="currentColor" size={16} />
            </Link>
            <Link to="/pricing" className="px-8 py-4 rounded-full font-semibold text-lg border border-cineborder hover:bg-cinesurface transition-colors text-white">
              View Pricing
            </Link>
          </motion.div>
        </div>

        {/* Cinematic Showcase Mockup */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }} className="max-w-6xl mx-auto px-6 mt-20 relative z-10">
          <div className="aspect-[21/9] bg-cinesurface rounded-2xl border border-cineborder overflow-hidden relative shadow-2xl flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-cinebg to-transparent z-10"></div>
            <div className="absolute top-4 left-4 bg-cinebg/80 backdrop-blur border border-cineborder px-3 py-1 rounded-full text-xs font-mono text-cinemuted z-20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> REC
            </div>
            
            {/* Fake video timeline UI */}
            <div className="absolute bottom-0 w-full p-6 z-20">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"><Play fill="currentColor" size={14} className="ml-0.5"/></div>
                <div className="h-1 bg-cineborder flex-1 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-cineaccent"></div>
                </div>
                <span className="text-xs font-mono">01:24:00</span>
              </div>
            </div>
            
            <p className="text-cinemuted font-display tracking-widest uppercase opacity-20 text-4xl">Visual Showcase</p>
          </div>
        </motion.div>
      </main>

      {/* Tools Section */}
      <section id="tools" className="py-24 border-t border-cineborder bg-cinesurface/30">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-sm font-bold tracking-[0.2em] text-cineaccent uppercase mb-4">The Pipeline</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-16">AI Filmmaking Tools</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {[
              { icon: <ImageIcon size={24}/>, name: "Image" },
              { icon: <Video size={24}/>, name: "Video" },
              { icon: <User size={24}/>, name: "Character" },
              { icon: <Sparkles size={24}/>, name: "VFX" },
              { icon: <Mic size={24}/>, name: "Voice", active: true },
            ].map((tool, i) => (
              <div key={i} className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 transition-all duration-300 ${tool.active ? 'bg-cineaccent/10 border-cineaccent text-cineaccent shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]' : 'bg-cinesurface border-cineborder text-cinemuted hover:border-cinemuted/50 hover:text-white'}`}>
                {tool.icon}
                <span className="font-semibold">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 border-t border-cineborder">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 font-display font-bold text-2xl md:text-3xl text-cinemuted tracking-tight">
            <span className="text-white">CREATE</span>
            <span className="hidden md:block">→</span>
            <span className="text-white/80">DIRECT</span>
            <span className="hidden md:block">→</span>
            <span className="text-white/60">EDIT</span>
            <span className="hidden md:block">→</span>
            <span className="text-white/40">EXPORT</span>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-cineborder text-center text-sm text-cinemuted">
        <p>© 2026 YouVoice AI Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}
