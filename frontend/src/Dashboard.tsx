import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { auth } from "./firebase";
import axios from "axios";
import { Mic, Play, Trash2, History, Layers, CreditCard, LogOut, CheckCircle2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const RECORDING_SCRIPTS: Record<string, Record<string, string>> = {
  en: {
    Neutral: "I am reading this text in a normal, clear voice to create my digital clone.",
    Storytelling: "Once upon a time, in a land far away, a great adventure was about to begin...",
    Advertisement: "Don't miss out on the biggest sale of the year! Upgrade your life today!",
    News: "Breaking news this hour: Global markets hit record highs as technology stocks surge."
  },
  te: {
    Neutral: "నేను నా వాయిస్‌ను క్లోన్ చేయడానికి ఈ వాక్యాన్ని సాధారణ స్వరంతో చదువుతున్నాను.",
    Storytelling: "అనగనగా ఒక ఊరిలో... ఎవరికీ తెలియని ఒక పెద్ద రహస్యం దాగి ఉంది.",
    Advertisement: "ఈ పండుగకు మా ప్రత్యేక ఆఫర్లని అస్సలు మిస్ అవ్వకండి! ఇప్పుడే కొనండి!",
    News: "ముఖ్య గమనిక: రాబోయే రెండు రోజుల్లో భారీ వర్షాలు కురిసే అవకాశం ఉంది."
  },
  hi: {
    Neutral: "मैं अपनी आवाज़ को क्लोन करने के लिए इस वाक्य को सामान्य आवाज़ में पढ़ रहा हूँ।",
    Storytelling: "बहुत समय पहले की बात है, एक दूर देश में एक बड़ा रहस्य छिपा था...",
    Advertisement: "इस साल की सबसे बड़ी सेल को हाथ से न जाने दें! आज ही खरीदें!",
    News: "आज की ताज़ा ख़बर: शेयर बाज़ार ने आज एक नया रिकॉर्ड बनाया है।"
  },
  bn: { Neutral: "আমি আমার ভয়েস ক্লোন করার জন্য এই লেখাটি পড়ছি।" },
  mr: { Neutral: "मी माझा आवाज क्लोन करण्यासाठी हे वाक्य वाचत आहे." },
  gu: { Neutral: "હું મારો અવાજ ક્લોન કરવા માટે આ વાક્ય વાંચી રહ્યો છું." },
  ta: { Neutral: "என் குரலை குளோன் செய்ய இந்த வாக்கியத்தை படிக்கிறேன்." }
};

export default function Dashboard() {
  const { userData, token, refreshUserData } = useAuth();
  
  // Voices & Generations
  const [voices, setVoices] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const [voiceName, setVoiceName] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  
  const [recordLang, setRecordLang] = useState("te");
  const [recordTone, setRecordTone] = useState("Neutral");

  // Generation State
  const [genText, setGenText] = useState("");
  const [genLang, setGenLang] = useState("te");
  const [genMsg, setGenMsg] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenUrl, setLastGenUrl] = useState("");

  // Coupon
  const [coupon, setCoupon] = useState("");

  // Mobile Menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: "voice" | "gen" | null, id: string | null}>({isOpen: false, type: null, id: null});

  const loadLibrary = async () => {
    try {
      const [voicesRes, gensRes] = await Promise.all([
        axios.get("/api/voices", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/generations", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setVoices(voicesRes.data);
      setGenerations(gensRes.data);
      if (voicesRes.data.length > 0 && !selectedVoice) setSelectedVoice(voicesRes.data[0].id);
    } catch (err) {}
  };

  useEffect(() => {
    if (token) { loadLibrary(); refreshUserData(); }
  }, [token]);

  const handleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setRecordedBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        setAudioUrl("");
        setRecordedBlob(null);
        timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      } catch (err) { alert("Microphone access denied."); }
    } else {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const uploadVoice = async () => {
    if (!recordedBlob || !voiceName) { setUploadMsg("Missing audio or name"); return; }
    const formData = new FormData();
    formData.append("file", recordedBlob, "voice.webm");
    formData.append("name", voiceName);
    
    setUploadMsg("Saving...");
    try {
      await axios.post("/api/voices", formData, { headers: { Authorization: `Bearer ${token}` } });
      setUploadMsg("Voice saved!");
      setVoiceName(""); setAudioUrl(""); setRecordedBlob(null);
      loadLibrary();
    } catch(e) { setUploadMsg("Failed to save."); }
  };

  const handleGenerate = async () => {
    if (!genText.trim() || !selectedVoice) return;
    if (genText.trim().length < 30) {
      setGenMsg("Please enter at least 30 characters.");
      return;
    }
    setIsGenerating(true); setGenMsg("Generating speech... (takes ~20s)"); setLastGenUrl("");
    try {
      const res = await axios.post("/api/generations", { text: genText, voice_id: selectedVoice, language: genLang }, { headers: { Authorization: `Bearer ${token}` } });
      pollGeneration(res.data.id);
    } catch(e: any) {
      setIsGenerating(false); setGenMsg(e.response?.data?.detail || "Error generating");
    }
  };

  const pollGeneration = (genId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/generations/${genId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.status === "COMPLETED") {
          clearInterval(interval); setIsGenerating(false); setGenMsg("Generation successful!"); setLastGenUrl(res.data.audio_url);
          loadLibrary(); refreshUserData();
        } else if (res.data.status === "FAILED") {
          clearInterval(interval); setIsGenerating(false); setGenMsg("Generation failed.");
        }
      } catch(e) { clearInterval(interval); setIsGenerating(false); setGenMsg("Status check failed."); }
    }, 3000);
  };

  const confirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    try {
      if (deleteModal.type === "voice") await axios.delete(`/api/voices/${deleteModal.id}`, { headers: { Authorization: `Bearer ${token}` } });
      else await axios.delete(`/api/generations/${deleteModal.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDeleteModal({isOpen: false, type: null, id: null});
      loadLibrary();
    } catch(e) {}
  };

  const handleCoupon = async () => {
    if (!coupon) return;
    try {
      await axios.post(`/api/billing/apply_coupon?code=${coupon}`, null, { headers: { Authorization: `Bearer ${token}` } });
      alert("Success!"); refreshUserData(); setCoupon("");
    } catch(e: any) { alert(e.response?.data?.detail || "Invalid code"); }
  };

  const formatTime = (secs: number) => `${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}`;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 font-sans flex flex-col md:flex-row">
      
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><Trash2 size={32}/></div>
              <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
              <p className="text-slate-500 mb-6 text-sm">This action cannot be undone. Do you want to permanently delete this {deleteModal.type}?</p>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteModal({isOpen:false, type:null, id:null})} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 font-bold rounded-xl text-white transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Topbar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between z-40 sticky top-0 border-b border-slate-800">
        <div className="flex items-center space-x-2 font-black text-xl">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg"><Mic size={16} className="text-white" /></div>
          <span>VoxAura</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-slate-800 rounded-lg">
          <Layers size={20} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`${mobileMenuOpen ? "block" : "hidden"} md:block w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen md:min-h-0 border-r border-slate-800 shrink-0 z-30 fixed md:sticky top-0 h-screen md:h-auto`}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center space-x-2 text-white font-black text-2xl tracking-tight mb-8">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg">
              <Mic size={20} className="text-white" />
            </div>
            <span>VoxAura</span>
          </div>
        </div>
        
        <div className="p-6 md:p-6 pt-0 md:pt-0">
          <nav className="space-y-2 mt-6 md:mt-0">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 bg-white/10 text-white px-4 py-3 rounded-xl font-bold">
              <Play size={18} /> <span>Speech Synthesis</span>
            </Link>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
              <CreditCard size={18} /> <span>Pricing</span>
            </Link>
            {import.meta.env.VITE_ENABLE_ADMIN === "true" && userData?.plan_tier === "ADMIN" && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-3 hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors text-emerald-400">
                <Shield size={18} /> <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>
        
        <div className="mt-auto p-6">
          <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Quota</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-black text-white">{userData?.credits?.toLocaleString() || 0}</span>
              <span className="text-xs text-slate-400 mb-1">chars left</span>
            </div>
            <Link to="/pricing" className="text-xs text-indigo-400 font-bold hover:text-indigo-300">Upgrade Plan &rarr;</Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm font-bold text-white truncate">{userData?.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{auth.currentUser?.email || auth.currentUser?.phoneNumber}</p>
            </div>
            <button onClick={() => auth.signOut()} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden ${mobileMenuOpen ? "hidden md:flex" : "flex"}`}>
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between z-10 shrink-0 gap-4">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 hidden md:block">Speech Synthesis</h1>
          <div className="flex items-center w-full md:w-auto space-x-2 md:space-x-3">
            <input type="text" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Promo Code" className="flex-1 md:w-40 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 text-sm" />
            <button onClick={handleCoupon} className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0">Redeem</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 pb-32 md:pb-8">
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Generator Panel */}
            <div className="xl:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[350px] md:min-h-[400px]">
              <div className="border-b border-slate-100 p-3 md:p-4 bg-slate-50 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Select Voice</label>
                  <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
                    {voices.length === 0 && <option value="" disabled>No custom voices</option>}
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-48 shrink-0">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Language</label>
                  <select value={genLang} onChange={e => setGenLang(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer shadow-sm">
                    <option value="te">Telugu (India)</option>
                    <option value="hi">Hindi (India)</option>
                    <option value="en">English (US)</option>
                    <option value="bn">Bengali (India)</option>
                    <option value="mr">Marathi (India)</option>
                    <option value="gu">Gujarati (India)</option>
                    <option value="ta">Tamil (India)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col p-4 md:p-6">
                <textarea 
                  value={genText} 
                  onChange={e => setGenText(e.target.value)} 
                  placeholder="Enter the text you want to generate. We recommend using proper punctuation..." 
                  className="w-full flex-1 bg-transparent border-none outline-none resize-none text-base md:text-lg text-slate-700 placeholder:text-slate-300 min-h-[150px] md:min-h-[200px]"
                />
                <div className={`text-xs mt-2 font-medium ${genText.length < 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {genText.length} characters (minimum 30 required)
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-slate-100 gap-4">
                  <div className="text-xs font-bold text-slate-400">
                    Quota Cost: <span className="text-indigo-500">{genText.length} chars</span>
                  </div>
                  <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !selectedVoice || genText.length < 30} 
                    className="w-full sm:w-auto bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Play size={16} fill="currentColor" />}
                    <span>Generate Speech</span>
                  </button>
                </div>
                
                {genMsg && (
                  <div className={`mt-4 p-4 rounded-xl border text-sm font-bold flex flex-col justify-center gap-3 ${genMsg.includes("Error") || genMsg.includes("Not enough") || genMsg.includes("failed") ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                    <div className="flex items-center gap-2">
                      {isGenerating ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <CheckCircle2 size={16}/>}
                      {genMsg}
                    </div>
                    {lastGenUrl && <audio src={lastGenUrl} controls className="w-full h-10 mt-1" />}
                  </div>
                )}
              </div>
            </div>

            {/* Voice Cloning Panel */}
            <div className="xl:col-span-4 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Mic className="text-indigo-500" size={20} />
                    <h3 className="font-bold text-slate-800">Voice Cloning Studio</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Language</label>
                    <select value={recordLang} onChange={e => {setRecordLang(e.target.value); setRecordTone("Neutral");}} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="te">Telugu</option>
                      <option value="hi">Hindi</option>
                      <option value="en">English</option>
                      <option value="bn">Bengali</option>
                      <option value="mr">Marathi</option>
                      <option value="gu">Gujarati</option>
                      <option value="ta">Tamil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tone</label>
                    <select value={recordTone} onChange={e => setRecordTone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                      {Object.keys(RECORDING_SCRIPTS[recordLang] || RECORDING_SCRIPTS["en"]).map(tone => (
                        <option key={tone} value={tone}>{tone}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Read this aloud:</p>
                  <p className="text-sm text-indigo-900 font-medium leading-relaxed italic">
                    "{RECORDING_SCRIPTS[recordLang]?.[recordTone] || RECORDING_SCRIPTS["en"]["Neutral"]}"
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleRecord}
                      className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center space-x-2 transition-colors ${isRecording ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                    >
                      {isRecording ? <div className="w-3 h-3 bg-white rounded-full animate-ping" /> : <Mic size={18} />}
                      <span>{isRecording ? "Stop" : "Record Voice"}</span>
                    </button>
                    {isRecording && <span className="bg-slate-900 text-white font-mono font-bold w-16 flex items-center justify-center rounded-xl text-sm">{formatTime(recordingTime)}</span>}
                  </div>

                  {audioUrl && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}} className="space-y-3 overflow-hidden">
                      <audio src={audioUrl} controls className="w-full h-10" />
                      <input type="text" value={voiceName} onChange={e => setVoiceName(e.target.value)} placeholder="Name this voice..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" />
                      <button onClick={uploadVoice} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-600 transition-colors text-sm">Save Voice</button>
                      <p className="text-xs font-bold text-indigo-600 text-center">{uploadMsg}</p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Saved Voices List */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col h-64">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center"><Layers size={16} className="mr-2 text-slate-400"/> My Voices</h3>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{voices.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 custom-scrollbar">
                  {voices.length === 0 && <p className="text-xs text-slate-400 italic text-center mt-4">No voices cloned yet.</p>}
                  {voices.map(v => (
                    <div key={v.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl group relative hover:border-indigo-200 transition-colors">
                      <button onClick={() => setDeleteModal({isOpen: true, type: "voice", id: v.id})} className="absolute top-2 right-2 text-red-400 hover:text-white opacity-0 md:group-hover:opacity-100 transition-all bg-red-50 hover:bg-red-500 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                      <p className="font-bold text-sm text-slate-700 pr-8 mb-2 truncate">{v.name}</p>
                      <audio src={v.url} controls className="w-full h-7 opacity-70 hover:opacity-100 transition-opacity [&::-webkit-media-controls-panel]:bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* History List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center"><History size={18} className="mr-2 text-slate-400"/> Generation History</h3>
            
            <div className="space-y-3">
              {generations.length === 0 && <p className="text-sm text-slate-400 italic text-center py-8">Your generation history will appear here.</p>}
              {generations.map(g => (
                <div key={g.id} className="flex flex-col md:flex-row md:items-center p-4 bg-slate-50 hover:bg-indigo-50/30 border border-slate-100 rounded-xl group transition-colors gap-4">
                  <button onClick={() => setDeleteModal({isOpen: true, type: "gen", id: g.id})} className="md:order-last p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end md:self-auto"><Trash2 size={18}/></button>
                  <div className="flex-1 md:pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-2 py-0.5 rounded-sm">{g.language || "te"}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">"{g.text}"</p>
                  </div>
                  <div className="w-full md:w-64 shrink-0">
                    <audio src={g.url} controls className="w-full h-10 [&::-webkit-media-controls-panel]:bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />
    </div>
  );
}
