import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { auth } from "./firebase";
import axios from "axios";
import { Mic, History, LogOut, Download, Sparkles, User, PlayCircle, Loader2, Sun, Moon, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";

const RECORDING_SCRIPTS: Record<string, Record<string, string>> = {
  en: {
    Neutral: "The quick brown fox jumps over the lazy dog. I am recording my voice so the AI can learn my exact tone and pitch.",
    Happy: "I can't believe we finally did it! This is absolutely amazing, and I am so thrilled to share this wonderful news!",
    Serious: "We need to carefully review the reports from yesterday. The implications of these findings are substantial."
  },
  te: {
    Neutral: "నేను నా వాయిస్‌ను క్లోన్ చేయడానికి ఈ వాక్యాన్ని సాధారణ స్వరంతో చదువుతున్నాను.",
    Happy: "ఇది నిజంగా అద్భుతం! ఈ శుభవార్తను మీతో పంచుకోవడం నాకు చాలా ఆనందంగా ఉంది!",
    Serious: "గత రాత్రి జరిగిన సంఘటనను మనం తీవ్రంగా పరిగణించాలి. ఇది చాలా ముఖ్యమైన విషయం."
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
  
  const [searchParams, setSearchParams] = useSearchParams();

  // UX States
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState("studio"); // studio, lab, history

  useEffect(() => {
    if (token) {
      fetchVoices();
      fetchHistory();
    }
    
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
      console.error(err);
    }
  };

  const fetchVoices = async () => {
    try {
      const res = await axios.get("/api/voices", { headers: { Authorization: `Bearer ${token}` } });
      setVoices(res.data || []);
      if (res.data?.length > 0 && !selectedVoice) setSelectedVoice(res.data[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/generations", { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const pollGeneration = async (genId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(interval);
        setGenerating(false);
        alert("Generation timed out");
        return;
      }
      try {
        const res = await axios.get(`/api/generations/${genId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.status === "COMPLETED") {
          clearInterval(interval);
          setAudioUrl(res.data.audio_url);
          setGenerating(false);
          fetchHistory();
          refreshUserData();
        } else if (res.data.status === "FAILED") {
          clearInterval(interval);
          setGenerating(false);
          alert("Generation failed on the server.");
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!text || text.length < 50) return alert("Minimum 50 characters required.");
    if (!selectedVoice) return alert("Please select a voice or create one first.");
    
    setGenerating(true);
    setAudioUrl(null);
    try {
      const res = await axios.post("/api/generations", {
        voice_id: selectedVoice,
        text: text,
        language: language
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      pollGeneration(res.data.id);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to generate speech");
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
    formData.append("file", audioBlob, "voice.webm");
    formData.append("name", `${recordingLang.toUpperCase()} - ${recordingTone}`);

    try {
      await axios.post("/api/voices", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAudioBlob(null);
      fetchVoices();
      setActiveTab("studio"); // Send user back to studio to use the voice
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to clone voice");
    } finally {
      setCloning(false);
    }
  };

  // Theme Constants
  const t = {
    bg: isDark ? "bg-[#0B0C10]" : "bg-[#F3F4F6]",
    surface: isDark ? "bg-[#161821]" : "bg-white",
    border: isDark ? "border-[#252833]" : "border-gray-200",
    text: isDark ? "text-white" : "text-gray-900",
    muted: isDark ? "text-gray-400" : "text-gray-500",
    accent: isDark ? "text-[#6366f1]" : "text-[#4F46E5]",
    accentBg: isDark ? "bg-[#6366f1]" : "bg-[#4F46E5]",
    hover: isDark ? "hover:bg-[#252833]" : "hover:bg-gray-100",
    input: isDark ? "bg-[#0B0C10] border-[#252833] text-white" : "bg-white border-gray-300 text-gray-900",
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-sans flex flex-col transition-colors duration-300`}>
      
      {/* Top Navbar */}
      <nav className={`${t.surface} border-b ${t.border} sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className={`${t.accentBg} p-1.5 rounded-lg`}><Sparkles size={16} className="text-white" /></div>
                <span className="font-display font-black text-xl tracking-tight">YouVoice</span>
              </Link>
              
              <div className="hidden md:flex space-x-1">
                <button onClick={() => setActiveTab("studio")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'studio' ? t.accentBg + ' text-white shadow-md' : t.muted + ' ' + t.hover}`}>
                  Studio
                </button>
                <button onClick={() => setActiveTab("lab")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'lab' ? t.accentBg + ' text-white shadow-md' : t.muted + ' ' + t.hover}`}>
                  Voice Lab
                </button>
                <button onClick={() => setActiveTab("history")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'history' ? t.accentBg + ' text-white shadow-md' : t.muted + ' ' + t.hover}`}>
                  History
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Day/Night Toggle */}
              <button 
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-full ${t.hover} transition-colors`}
                title="Toggle Theme"
              >
                {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
              </button>

              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${t.border}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${t.muted}`}>Credits</span>
                <span className="text-sm font-black">{userData?.credits?.toLocaleString() || 0}</span>
                <Link to="/pricing" className={`ml-2 ${t.accent} hover:underline text-xs font-bold`}>Get More</Link>
              </div>

              <div className="h-6 w-px bg-gray-500/20 mx-1"></div>

              <div className="flex items-center gap-3">
                <Link to="/profile" className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center ${t.hover} transition-colors`}>
                  <User size={16} className={t.muted} />
                </Link>
                <button onClick={() => auth.signOut()} className={`${t.muted} hover:text-red-500 transition-colors`}>
                  <LogOut size={18} />
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </nav>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          
          {/* STUDIO TAB */}
          {activeTab === "studio" && (
            <motion.div key="studio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Create Speech.</h1>
                <p className={`text-lg ${t.muted}`}>Type your script, choose your actor, and direct your audio.</p>
              </div>

              <div className={`${t.surface} rounded-3xl border ${t.border} shadow-xl overflow-hidden transition-colors duration-300`}>
                {/* Settings Bar */}
                <div className={`flex flex-col sm:flex-row border-b ${t.border} p-4 gap-4`}>
                  <div className="flex-1">
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${t.muted} mb-1.5`}>Select Voice Actor</label>
                    <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className={`w-full p-2.5 rounded-xl font-bold outline-none border transition-colors ${t.input} focus:border-[#6366f1]`}>
                      {voices.length === 0 && <option value="">No voices found. Go to Voice Lab!</option>}
                      {voices.map(v => <option key={v.id} value={v.id}>{v.name || "Custom Voice"}</option>)}
                    </select>
                  </div>
                  <div className="sm:w-1/3">
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${t.muted} mb-1.5`}>Output Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className={`w-full p-2.5 rounded-xl font-bold outline-none border transition-colors ${t.input} focus:border-[#6366f1]`}>
                      <option value="en-IN">English (India)</option>
                      <option value="en-US">English (US)</option>
                      <option value="te-IN">Telugu (India)</option>
                    </select>
                  </div>
                </div>

                {/* Editor */}
                <div className="p-6">
                  <textarea 
                    value={text} 
                    onChange={e => setText(e.target.value)}
                    placeholder="Write your cinematic script here..."
                    className="w-full min-h-[300px] bg-transparent resize-none outline-none text-xl leading-relaxed placeholder:opacity-30 font-medium"
                  />
                </div>

                {/* Footer Actions */}
                <div className={`border-t ${t.border} p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/5`}>
                  <div>
                    <div className={`font-bold text-sm ${text.length >= 50 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-amber-400' : 'text-amber-600')}`}>
                      {text.length} characters <span className={`font-normal ${t.muted}`}>/ 50 min</span>
                    </div>
                    <div className={`text-[10px] uppercase tracking-widest font-bold ${t.muted} mt-1`}>
                      Cost: {text.length} credits
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerate} 
                    disabled={generating || text.length < 50 || !selectedVoice}
                    className={`flex items-center gap-2 ${t.accentBg} text-white px-10 py-4 rounded-2xl font-black text-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100`}
                  >
                    {generating ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                    {generating ? "Generating..." : "Render Audio"}
                  </button>
                </div>
              </div>

              {/* Player result */}
              <AnimatePresence>
                {audioUrl && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'} mb-2`}>Render Complete!</p>
                      <audio controls src={audioUrl} className="w-full h-10"></audio>
                    </div>
                    <a href={audioUrl} download="generation.mp3" className={`p-3 rounded-xl ${isDark ? 'bg-[#161821] text-white hover:bg-[#252833]' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'} transition-colors`}>
                      <Download size={20} />
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* VOICE LAB TAB */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Voice Lab.</h1>
                <p className={`text-lg ${t.muted}`}>Train custom voice models instantly with a short recording.</p>
              </div>

              <div className={`${t.surface} rounded-3xl border ${t.border} p-6 md:p-8 shadow-xl`}>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${t.muted} mb-2`}>Spoken Language</label>
                    <select value={recordingLang} onChange={e => setRecordingLang(e.target.value)} className={`w-full p-3 rounded-xl font-bold outline-none border transition-colors ${t.input} focus:border-[#6366f1]`}>
                      <option value="te">Telugu</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${t.muted} mb-2`}>Emotional Tone</label>
                    <select value={recordingTone} onChange={e => setRecordingTone(e.target.value)} className={`w-full p-3 rounded-xl font-bold outline-none border transition-colors ${t.input} focus:border-[#6366f1]`}>
                      <option value="Neutral">Neutral</option>
                      <option value="Happy">Happy</option>
                      <option value="Serious">Serious</option>
                    </select>
                  </div>
                </div>

                <div className={`${isDark ? 'bg-black/40' : 'bg-gray-50'} border ${t.border} rounded-2xl p-6 mb-8 relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${t.accentBg}`}></div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${t.accent} mb-3`}>Read this script aloud:</p>
                  <p className="text-lg italic leading-relaxed font-medium">
                    "{RECORDING_SCRIPTS[recordingLang][recordingTone]}"
                  </p>
                </div>

                {!audioBlob ? (
                  <button 
                    onClick={toggleRecording} 
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : (isDark ? 'bg-[#252833] hover:bg-[#2d313f] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')}`}
                  >
                    {isRecording ? (
                      <><div className="w-3 h-3 rounded-full bg-white"></div> Stop Recording</>
                    ) : (
                      <><Mic /> Start Recording</>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-12"></audio>
                    <div className="flex gap-4">
                      <button onClick={() => setAudioBlob(null)} className={`flex-1 py-4 border ${t.border} rounded-2xl font-bold ${t.hover} transition-colors`}>
                        Discard
                      </button>
                      <button onClick={handleClone} disabled={cloning} className={`flex-1 py-4 ${t.accentBg} text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50`}>
                        {cloning ? "Training Model..." : "Save Voice Model"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-1">Render History</h1>
                  <p className={`text-sm ${t.muted}`}>Your past generations</p>
                </div>
                <div className={`px-4 py-2 rounded-full border ${t.border} text-sm font-bold`}>
                  {history.length} items
                </div>
              </div>

              {history.length === 0 ? (
                <div className={`text-center py-20 ${t.surface} rounded-3xl border ${t.border}`}>
                  <History size={48} className={`mx-auto mb-4 opacity-20 ${t.muted}`} />
                  <p className="font-bold text-lg">No renders yet</p>
                  <button onClick={() => setActiveTab("studio")} className={`mt-4 ${t.accent} hover:underline font-bold`}>Go to Studio</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div key={i} className={`${t.surface} p-5 rounded-2xl border ${t.border} flex flex-col md:flex-row md:items-center gap-4 transition-colors hover:border-gray-400/30`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-mono px-2 py-1 rounded bg-black/5 dark:bg-white/5 ${t.muted}`}>
                            {new Date(h.created_at).toLocaleDateString()}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${t.accent}`}>{h.language}</span>
                        </div>
                        <p className="text-sm line-clamp-2 leading-relaxed opacity-90">"{h.text}"</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <audio controls src={h.audio_url} className="w-full md:w-64 h-10"></audio>
                        <a href={h.audio_url} download className={`p-2.5 rounded-xl border ${t.border} ${t.hover} transition-colors`}>
                          <Download size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
