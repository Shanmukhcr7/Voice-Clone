import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { auth } from "./firebase";
import axios from "axios";
import { Mic, History, CreditCard, LogOut, Download, Sparkles, Settings2, Globe, Disc3, Volume2, User, PlayCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";

const RECORDING_SCRIPTS: Record<string, Record<string, string>> = {
  en: {
    Neutral: "The quick brown fox jumps over the lazy dog. I am recording my voice so the AI can learn my exact tone and pitch. This should be a normal, everyday speaking voice.",
    Happy: "I can't believe we finally did it! This is absolutely amazing, and I am so thrilled to share this wonderful news with everyone today!",
    Serious: "We need to carefully review the reports from yesterday. The implications of these findings are substantial and require our immediate attention."
  },
  te: {
    Neutral: "???? ?? ????????? ?????? ????????? ? ?????????? ?????? ??????? ?????????????.",
    Happy: "??? ?????? ???????! ? ?????????? ???? ????????? ???? ???? ??????? ????!",
    Serious: "?? ?????? ?????? ??????? ??? ???????? ???????????. ??? ???? ???????? ?????."
  }
};

export default function Dashboard() {
  const { token, userData, refreshUserData } = useAuth();
  const [voices, setVoices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [recordingTone, setRecordingTone] = useState("Neutral");
  const [recordingLang, setRecordingLang] = useState("te");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [cloning, setCloning] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (token) {
      fetchVoices();
      fetchHistory();
    }
    
    // Verify cashfree payment if returning from redirect
    const orderId = searchParams.get("order_id");
    if (orderId && token) {
      verifyPayment(orderId);
      searchParams.delete("order_id");
      setSearchParams(searchParams);
    }
  }, [token]);

  const verifyPayment = async (orderId: string) => {
    try {
      await axios.post("/api/billing/verify-payment", { order_id: orderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshUserData();
      alert("Payment successful! Your credits have been updated.");
    } catch (err) {
      console.error("Payment verification failed", err);
      alert("Payment verification failed. Please contact support if you were charged.");
    }
  };

  const fetchVoices = async () => {
    try {
      const res = await axios.get("/api/generation/voices", { headers: { Authorization: `Bearer ${token}` } });
      setVoices(res.data.voices);
      if (res.data.voices.length > 0 && !selectedVoice) setSelectedVoice(res.data.voices[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/generation/history", { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data.history);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!text || text.length < 50) return alert("Minimum 50 characters required.");
    if (!selectedVoice) return alert("Please select a voice or create one first.");
    
    setGenerating(true);
    setAudioUrl(null);
    try {
      const res = await axios.post("/api/generation/generate", {
        voice_id: selectedVoice,
        text,
        language
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setAudioUrl(res.data.audio_url);
      fetchHistory();
      refreshUserData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to generate speech");
    } finally {
      setGenerating(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setAudioBlob(null);
      } catch (e) {
        alert("Microphone access denied.");
      }
    }
  };

  const handleClone = async () => {
    if (!audioBlob) return;
    setCloning(true);
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "voice.webm");
    formData.append("tone", recordingTone);
    formData.append("language", recordingLang);

    try {
      await axios.post("/api/generation/clone", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAudioBlob(null);
      fetchVoices();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to clone voice");
    } finally {
      setCloning(false);
    }
  };

  const handleCoupon = async () => {
    if (!coupon) return;
    try {
      await axios.post("/api/billing/redeem", { code: coupon }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Coupon redeemed successfully!");
      setCoupon("");
      refreshUserData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to redeem coupon");
    }
  };
  
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-cinebg text-cinetext font-sans flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Cinematic Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cineaccent/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none"></div>

      {/* Mobile Topbar */}
      <div className="md:hidden bg-cinesurface/80 backdrop-blur-md text-cinetext p-4 flex items-center justify-between z-40 sticky top-0 border-b border-cineborder">
        <div className="flex items-center space-x-2 font-black text-xl">
          <div className="bg-cineaccent p-1.5 rounded-lg"><Sparkles size={16} className="text-white" /></div>
          <span>YouVoice</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-cinebg rounded-lg border border-cineborder">
          <Settings2 size={20} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`\${mobileMenuOpen ? "block" : "hidden"} md:block w-full md:w-72 bg-cinesurface/40 backdrop-blur-2xl text-cinemuted flex flex-col min-h-screen md:min-h-0 border-r border-cineborder shrink-0 z-30 fixed md:sticky top-0 h-screen md:h-auto shadow-2xl`}>
        <div className="p-6 hidden md:block border-b border-cineborder/50">
          <div className="flex items-center space-x-3 text-white font-black text-2xl tracking-tight">
            <div className="bg-gradient-to-br from-cineaccent to-purple-600 p-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Sparkles size={20} className="text-white" />
            </div>
            <span>YouVoice<span className="text-cineaccent">.</span></span>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-[10px] font-bold text-cinemuted uppercase tracking-widest mb-4 ml-2">Studio Tools</p>
          <nav className="space-y-1.5">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 bg-cineaccent/10 border border-cineaccent/20 text-white px-4 py-3 rounded-xl font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Volume2 size={18} className="text-cineaccent" /> <span>Speech Synthesis</span>
            </Link>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 hover:bg-white/5 hover:text-white px-4 py-3 rounded-xl font-medium transition-colors">
              <CreditCard size={18} /> <span>Billing & Plans</span>
            </Link>
            {import.meta.env.VITE_ENABLE_ADMIN === "true" && userData?.plan_tier === "ADMIN" && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 hover:bg-white/5 hover:text-emerald-400 px-4 py-3 rounded-xl font-medium transition-colors">
                <Settings2 size={18} /> <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>
        
        <div className="mt-auto">
          <div className="p-6">
            <div className="bg-gradient-to-b from-cinebg to-cinesurface rounded-2xl p-5 border border-cineborder shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cineaccent/10 rounded-full blur-2xl"></div>
              <p className="text-[10px] text-cinemuted uppercase tracking-widest font-bold mb-2 relative z-10">Monthly Quota</p>
              <div className="flex items-baseline space-x-1 mb-3 relative z-10">
                <span className="text-3xl font-black text-white tracking-tight">{userData?.credits?.toLocaleString() || 0}</span>
                <span className="text-xs text-cinemuted font-medium">chars</span>
              </div>
              <Link to="/pricing" className="inline-block w-full text-center bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors relative z-10">
                Upgrade Tier
              </Link>
            </div>
          </div>
          <div className="p-4 border-t border-cineborder/50 bg-cinebg/30">
            <div className="flex items-center justify-between">
              <Link to="/profile" className="flex items-center flex-1 min-w-0 hover:bg-white/5 rounded-xl p-2 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-cinesurface flex items-center justify-center mr-3 border border-cineborder group-hover:border-cineaccent/50 transition-colors">
                  <User size={14} className="text-cinemuted group-hover:text-cineaccent transition-colors" />
                </div>
                <div className="truncate pr-2">
                  <p className="text-sm font-bold text-white truncate">{userData?.name || "Creator"}</p>
                  <p className="text-[10px] text-cinemuted truncate uppercase tracking-wider">{userData?.plan_tier || "Free Plan"}</p>
                </div>
              </Link>
              <button onClick={() => auth.signOut()} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-cinemuted transition-colors" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden relative z-10 \${mobileMenuOpen ? "hidden md:flex" : "flex"}`}>
        
        {/* Header */}
        <header className="px-6 lg:px-10 py-6 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">Studio Engine</h1>
            <p className="text-sm text-cinemuted mt-1">Create cinematic voiceovers from text.</p>
          </div>
          <div className="flex items-center w-full sm:w-auto space-x-2 bg-cinesurface/50 p-1.5 rounded-xl border border-cineborder backdrop-blur-md">
            <input type="text" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Promo Code" className="w-full sm:w-32 bg-transparent border-none px-3 py-1.5 outline-none text-sm text-white placeholder-cinemuted" />
            <button onClick={handleCoupon} className="bg-cineaccent/20 hover:bg-cineaccent/30 text-cineaccent text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0">Redeem</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-32 custom-scrollbar">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 max-w-7xl mx-auto">
            
            {/* Generator Panel */}
            <div className="xl:col-span-7 2xl:col-span-8 flex flex-col gap-6">
              <div className="bg-cinesurface/40 backdrop-blur-xl rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cineaccent to-purple-500 opacity-50"></div>
                
                <div className="p-5 lg:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 bg-white/[0.02]">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-cinemuted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <User size={12} /> Select Actor
                    </label>
                    <div className="relative">
                      <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full bg-cinebg border border-cineborder rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-cineaccent/50 focus:ring-1 focus:ring-cineaccent/50 appearance-none cursor-pointer transition-all">
                        {voices.length === 0 && <option value="">No custom voices available</option>}
                        {voices.map(v => <option key={v.id} value={v.id}>{v.language.toUpperCase()} - {v.tone}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cinemuted">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <label className="block text-[10px] font-bold text-cinemuted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Globe size={12} /> Language
                    </label>
                    <div className="relative">
                      <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-cinebg border border-cineborder rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-cineaccent/50 focus:ring-1 focus:ring-cineaccent/50 appearance-none cursor-pointer transition-all">
                        <option value="en-IN">English (India)</option>
                        <option value="en-US">English (US)</option>
                        <option value="te-IN">Telugu (India)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cinemuted">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-5 lg:p-6 flex flex-col relative">
                  <textarea 
                    value={text} 
                    onChange={e => setText(e.target.value)}
                    placeholder="Enter your script here. We recommend using proper punctuation for the most cinematic delivery..."
                    className="w-full flex-1 min-h-[250px] bg-transparent resize-none outline-none text-white text-base lg:text-lg leading-relaxed placeholder-cinemuted/50"
                  />
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-4 border-t border-white/5 gap-4">
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold \${text.length >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {text.length} characters <span className="text-cinemuted font-normal">(min 50 required)</span>
                      </span>
                      <span className="text-[10px] text-cinemuted uppercase tracking-widest mt-1">
                        Est. Cost: <span className="text-cineaccent font-bold">{text.length} credits</span>
                      </span>
                    </div>
                    
                    <button 
                      onClick={handleGenerate} 
                      disabled={generating}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black hover:bg-gray-200 px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
                    >
                      {generating ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                      <span>{generating ? "Rendering..." : "Generate Speech"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {audioUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Disc3 size={20} className="text-emerald-400 animate-spin-slow" />
                  </div>
                  <audio controls src={audioUrl} className="w-full h-10 custom-audio-player"></audio>
                  <a href={audioUrl} download="generated_speech.mp3" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 p-2.5 rounded-xl transition-colors shrink-0">
                    <Download size={18} />
                  </a>
                </motion.div>
              )}
            </div>

            {/* Right Column: Voice Cloning & History */}
            <div className="xl:col-span-5 2xl:col-span-4 flex flex-col gap-6">
              
              {/* Voice Cloning Studio */}
              <div className="bg-cinesurface/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mic size={16} className="text-cineaccent" /> Voice Actor Training
                  </h3>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-cinemuted uppercase tracking-widest mb-1.5">Language</label>
                      <select value={recordingLang} onChange={e => setRecordingLang(e.target.value)} className="w-full bg-cinebg border border-cineborder rounded-lg p-2.5 text-xs font-bold text-white outline-none focus:border-cineaccent">
                        <option value="te">Telugu</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-cinemuted uppercase tracking-widest mb-1.5">Tone</label>
                      <select value={recordingTone} onChange={e => setRecordingTone(e.target.value)} className="w-full bg-cinebg border border-cineborder rounded-lg p-2.5 text-xs font-bold text-white outline-none focus:border-cineaccent">
                        <option value="Neutral">Neutral</option>
                        <option value="Happy">Happy</option>
                        <option value="Serious">Serious</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-cinebg border border-cineborder rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cineaccent"></div>
                    <p className="text-[9px] font-bold text-cineaccent uppercase tracking-widest mb-2">Read this script aloud:</p>
                    <p className="text-sm text-cinemuted italic leading-relaxed">
                      "{RECORDING_SCRIPTS[recordingLang][recordingTone]}"
                    </p>
                  </div>

                  {!audioBlob ? (
                    <button 
                      onClick={toggleRecording} 
                      className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold transition-all \${isRecording ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-cinebg hover:bg-cinesurface border border-cineborder text-white'}`}
                    >
                      {isRecording ? (
                        <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div><span>Stop Recording</span></>
                      ) : (
                        <><Mic size={16} /><span>Start Recording</span></>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-10"></audio>
                      <div className="flex gap-2">
                        <button onClick={() => setAudioBlob(null)} className="flex-1 py-2.5 bg-cinebg border border-cineborder hover:bg-cinesurface text-white rounded-xl text-xs font-bold transition-colors">
                          Discard
                        </button>
                        <button onClick={handleClone} disabled={cloning} className="flex-1 py-2.5 bg-cineaccent hover:bg-opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50">
                          {cloning ? "Training Model..." : "Save Voice Model"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* History Panel */}
              <div className="bg-cinesurface/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl flex-1 flex flex-col min-h-[300px]">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History size={16} className="text-cinemuted" /> Render History
                  </h3>
                  <span className="text-xs bg-cinebg px-2 py-1 rounded-md text-cinemuted font-mono">{history.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-cinemuted opacity-50 p-6 text-center">
                      <Disc3 size={32} className="mb-3 opacity-50" />
                      <p className="text-sm">No audio renders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {history.map((h, i) => (
                        <div key={i} className="p-3 hover:bg-white/5 rounded-xl transition-colors group cursor-default">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-cinebg border border-cineborder px-2 py-0.5 rounded text-cinemuted font-mono">
                                {new Date(h.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs font-bold text-cineaccent">{h.language}</span>
                            </div>
                            <a href={h.audio_url} download target="_blank" rel="noreferrer" className="text-cinemuted hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                              <Download size={14} />
                            </a>
                          </div>
                          <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">"{h.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </motion.div>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        .custom-audio-player::-webkit-media-controls-panel {
          background-color: transparent;
        }
        .custom-audio-player::-webkit-media-controls-current-time-display,
        .custom-audio-player::-webkit-media-controls-time-remaining-display {
          color: #fff;
          font-family: monospace;
          font-size: 12px;
        }
      `}} />
    </div>
  );
}
