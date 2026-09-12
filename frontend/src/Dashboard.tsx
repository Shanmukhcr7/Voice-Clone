import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { auth } from "./firebase";
import axios from "axios";
import { Mic, History, LogOut, Download, Sparkles, User, PlayCircle, Loader2, Sun, Moon, CheckCircle2, Trash2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Profile from "./Profile";

// 10 tones per language
const TONES = ["Neutral", "Happy", "Serious", "Angry", "Sad", "Excited", "Calm", "Fearful", "Surprised", "Romantic"];

const TONE_EMOJI: Record<string, string> = {
  Neutral: "😐", Happy: "😊", Serious: "😤", Angry: "😠",
  Sad: "😢", Excited: "🤩", Calm: "😌", Fearful: "😨", Surprised: "😲", Romantic: "🥰"
};

const RECORDING_SCRIPTS: Record<string, Record<string, string>> = {
  en: {
    Neutral: "The quick brown fox jumps over the lazy dog. I am recording my voice so the AI can learn my exact tone and pitch accurately.",
    Happy: "I can't believe we finally did it! This is absolutely amazing, and I am so thrilled to share this wonderful news with everyone!",
    Serious: "We need to carefully review the reports from yesterday. The implications of these findings are substantial and must not be ignored.",
    Angry: "I am completely fed up with this! How many times do I have to say it? This situation needs to be fixed immediately, right now!",
    Sad: "I miss the way things used to be. Every day feels a little heavier than the last, and I just wish things were different.",
    Excited: "Oh my goodness, this is incredible! I have been waiting for this moment for so long and I honestly cannot contain my excitement!",
    Calm: "Take a deep breath and let it go slowly. Everything is going to be fine. There is no need to rush. We have plenty of time.",
    Fearful: "I heard something outside and I am not sure what it was. Please stay close. I have a really bad feeling about this situation.",
    Surprised: "Wait — what? I had absolutely no idea this was going to happen! Are you serious? I genuinely cannot believe my eyes right now!",
    Romantic: "Every moment I spend with you feels like a dream. You are the most wonderful person in my world and I cherish every second.",
  },
  te: {
    Neutral: "నేను నా వాయిస్‌ను క్లోన్ చేయడానికి ఈ వాక్యాన్ని సాధారణ స్వరంతో చదువుతున్నాను. ఇది AI కి నా అసలు స్వరాన్ని నేర్చుకోవడానికి సహాయం చేస్తుంది.",
    Happy: "ఇది నిజంగా అద్భుతం! ఈ శుభవార్తను మీతో పంచుకోవడం నాకు చాలా ఆనందంగా ఉంది! ఈ క్షణం నేను చాలా సంతోషంగా అనుభవిస్తున్నాను!",
    Serious: "గత రాత్రి జరిగిన సంఘటనను మనం తీవ్రంగా పరిగణించాలి. ఇది చాలా ముఖ్యమైన విషయం మరియు దీన్ని అనాలోచితంగా వదిలేయకూడదు.",
    Angry: "ఇది చాలా వేసారు! నేను ఎన్నిసార్లు చెప్పాలి? ఈ పరిస్థితిని వెంటనే సరిచేయాలి, లేకపోతే పరిణామాలు తీవ్రంగా ఉంటాయి!",
    Sad: "గతం ఎంత మంచిగా ఉండేదో! ప్రతి రోజూ కొంచెం బరువుగా అనిపిస్తోంది. అన్నీ ఒకప్పటిలా ఉంటే ఎంత బాగుండేదో అని అనిపిస్తోంది.",
    Excited: "అరెరే, ఇది అద్భుతమైన వార్త! చాలా కాలంగా వేచి ఉన్న ఈ క్షణం ఇప్పుడు వచ్చింది. నా ఆనందాన్ని నిలబెట్టుకోలేకపోతున్నాను!",
    Calm: "నిదానంగా శ్వాస తీసుకో, నెమ్మదిగా వదలు. అన్నీ సరిగ్గా జరుగుతాయి. తొందర అక్కరలేదు. మనకు పుష్కలమైన సమయం ఉంది.",
    Fearful: "బయట ఏదో అలికిడి వినిపించింది, అది ఏమిటో తెలియడం లేదు. దయచేసి దగ్గరగా ఉండు. ఈ పరిస్థితి గురించి నాకు చాలా భయంగా అనిపిస్తోంది.",
    Surprised: "ఆగు - ఏంటీ? ఇది జరుగుతుందని నాకు అస్సలు తెలియదు! నిజంగా అంటున్నావా? ఇప్పుడు నమ్మలేకపోతున్నాను, నా కళ్ళను నమ్మలేకపోతున్నాను!",
    Romantic: "నీతో గడిపే ప్రతి క్షణం ఒక కలలా అనిపిస్తోంది. నువ్వు నా జీవితంలో అత్యంత అద్భుతమైన వ్యక్తివి, నీతో ఉన్న ప్రతి సెకనూ నాకు విలువైనది.",
  }
};

export default function Dashboard() {
  const { token, userData, refreshUserData } = useAuth();
  const [voices, setVoices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [genElapsed, setGenElapsed] = useState(0);

  const [recordingTone, setRecordingTone] = useState("Neutral");
  const [recordingLang, setRecordingLang] = useState("te");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [cloning, setCloning] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState("studio");

  useEffect(() => {
    if (token) { fetchVoices(); fetchHistory(); }
    const orderId = searchParams.get("order_id");
    if (orderId && token) {
      verifyPayment(orderId);
      searchParams.delete("order_id");
      setSearchParams(searchParams);
    }
  }, [token]);

  const verifyPayment = async (orderId: string) => {
    try {
      await axios.post("/api/billing/verify-payment", { order_id: orderId }, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUserData();
      alert("Payment successful! Credits updated.");
    } catch (err) { console.error(err); }
  };

  const fetchVoices = async () => {
    try {
      const res = await axios.get("/api/voices", { headers: { Authorization: `Bearer ${token}` } });
      setVoices(res.data || []);
      if (res.data?.length > 0 && !selectedVoice) setSelectedVoice(res.data[0].id);
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/generations", { headers: { Authorization: `Bearer ${token}` } });
      setHistory(res.data || []);
    } catch (e) { console.error(e); }
  };

  const pollGeneration = async (genId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 90) {
        clearInterval(interval);
        if (elapsedRef.current) clearInterval(elapsedRef.current);
        setGenerating(false);
        alert("Generation timed out after 3 minutes. Please try again.");
        return;
      }
      try {
        const res = await axios.get(`/api/generations/${genId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.status === "COMPLETED") {
          clearInterval(interval);
          if (elapsedRef.current) clearInterval(elapsedRef.current);
          setAudioUrl(res.data.audio_url);
          setGenerating(false);
          fetchHistory();
          refreshUserData();
        } else if (res.data.status === "FAILED") {
          clearInterval(interval);
          if (elapsedRef.current) clearInterval(elapsedRef.current);
          setGenerating(false);
          alert("Generation failed. Check your Modal worker logs.");
        }
      } catch (e) { console.error(e); }
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!text || text.length < 50) return alert("Minimum 50 characters required.");
    if (!selectedVoice) return alert("Please select a voice or create one in Voice Lab first.");
    setGenerating(true);
    setAudioUrl(null);
    setGenElapsed(0);
    elapsedRef.current = setInterval(() => setGenElapsed(s => s + 1), 1000);
    try {
      const res = await axios.post("/api/generations", { voice_id: selectedVoice, text }, { headers: { Authorization: `Bearer ${token}` } });
      pollGeneration(res.data.id);
    } catch (e: any) {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      alert(e.response?.data?.detail || "Failed to start generation");
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
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorder.onstop = () => setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" }));
        mediaRecorder.start();
        setIsRecording(true);
        setAudioBlob(null);
      } catch (e) { alert("Microphone access denied."); }
    }
  };

  const handleClone = async () => {
    if (!audioBlob) return;
    setCloning(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "voice.webm");
    formData.append("name", `${recordingLang.toUpperCase()} - ${recordingTone}`);
    formData.append("language", recordingLang);
    try {
      await axios.post("/api/voices", formData, { headers: { Authorization: `Bearer ${token}` } });
      setAudioBlob(null);
      fetchVoices();
      setActiveTab("studio");
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to clone voice");
    } finally { setCloning(false); }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm("Delete this voice? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/voices/${voiceId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchVoices();
    } catch (e: any) { alert(e.response?.data?.detail || "Failed to delete"); }
  };

  const handleDeleteGeneration = async (genId: string) => {
    if (!confirm("Delete this generation?")) return;
    try {
      await axios.delete(`/api/generations/${genId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchHistory();
    } catch (e: any) { alert(e.response?.data?.detail || "Failed to delete"); }
  };

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

  const completedHistory = history.filter(h => h.status === "COMPLETED" && (h.audio_url || h.url));
  const recentFive = completedHistory.slice(0, 5);

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-sans flex flex-col transition-colors duration-300`}>

      {/* Navbar */}
      <nav className={`${t.surface} border-b ${t.border} sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className={`${t.accentBg} p-1.5 rounded-lg`}><Sparkles size={16} className="text-white" /></div>
                <span className="font-display font-black text-xl tracking-tight">YouVoice</span>
              </Link>
                <div className="hidden md:flex space-x-1">
                  {["studio", "lab", "history"].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${activeTab === tab ? t.accentBg + ' text-white shadow-md' : t.muted + ' ' + t.hover}`}>
                      {tab === "lab" ? "Voice Lab" : tab === "studio" ? "Studio" : "History"}
                    </button>
                  ))}
                  <button onClick={() => setActiveTab("profile")} className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${activeTab === "profile" ? t.accentBg + ' text-white shadow-md' : t.muted + ' ' + t.hover}`}>
                    Profile
                  </button>
                </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full ${t.hover} transition-colors`}>
                {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
              </button>
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${t.border}`}>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${t.muted}`}>Credits</span>
                    <span className="text-sm font-black leading-none">{userData?.credits?.toLocaleString() || 0}</span>
                  </div>
                  {userData?.credits_expiry && userData.credits > 0 && (
                    <span className={`text-[9px] font-bold ${t.muted} mt-0.5`}>
                      Expires {new Date(userData.credits_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                <Link to="/pricing" className={`ml-2 ${t.accent} hover:underline text-xs font-bold`}>Get More</Link>
              </div>
              <div className="h-6 w-px bg-gray-500/20"></div>
              <button onClick={() => setActiveTab("profile")} className={`w-8 h-8 rounded-full border ${t.border} flex items-center justify-center ${activeTab === "profile" ? t.accentBg + ' text-white' : t.muted + ' ' + t.hover} transition-colors`}>
                <User size={16} />
              </button>
              <button onClick={() => auth.signOut()} className={`${t.muted} hover:text-red-500 transition-colors`}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24 md:pb-12">
        <AnimatePresence mode="wait">

          {/* ===== STUDIO ===== */}
          {activeTab === "studio" && (
            <motion.div key="studio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Create Speech.</h1>
                <p className={`text-lg ${t.muted}`}>Type your script, pick a voice, and render your audio.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Editor */}
                <div className={`${t.surface} rounded-3xl border ${t.border} shadow-xl overflow-hidden flex flex-col`}>
                  <div className={`border-b ${t.border} p-4`}>
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${t.muted} mb-1.5`}>Select Voice Actor</label>
                    <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                      className={`w-full p-2.5 rounded-xl font-bold outline-none border transition-colors ${t.input} focus:border-[#6366f1]`}>
                      {voices.length === 0 && <option value="">No voices — go to Voice Lab first!</option>}
                      {voices.map(v => <option key={v.id} value={v.id}>{v.name || "Custom Voice"}</option>)}
                    </select>
                  </div>
                  <div className="p-4 flex-1">
                    <textarea value={text} onChange={e => setText(e.target.value)}
                      placeholder="Write your script here... (min 50 characters)"
                      className="w-full min-h-[220px] bg-transparent resize-none outline-none text-base leading-relaxed placeholder:opacity-30 font-medium" />
                  </div>
                  <div className={`border-t ${t.border} p-4 flex items-center justify-between gap-3 bg-black/5`}>
                    <div>
                      <div className={`font-bold text-sm ${text.length >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {text.length} chars <span className={`font-normal ${t.muted}`}>/ 50 min</span>
                      </div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold ${t.muted} mt-0.5`}>Cost: {text.length} credits</div>
                    </div>
                    <button onClick={handleGenerate} disabled={generating || text.length < 50 || !selectedVoice}
                      className={`flex items-center gap-2 ${t.accentBg} text-white px-8 py-3.5 rounded-2xl font-black text-base transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100`}>
                      {generating ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                      {generating ? `Rendering... ${genElapsed}s` : "Render Audio"}
                    </button>
                  </div>
                </div>

                {/* Right: Output + Animation */}
                <div className="flex flex-col gap-4">
                  {/* Generation Animation / Result */}
                  <AnimatePresence mode="wait">
                    {generating && (
                      <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className={`${t.surface} rounded-3xl border ${t.border} p-8 flex flex-col items-center justify-center gap-4 min-h-[180px]`}>
                        <div className="flex items-end gap-1.5 h-12">
                          {[...Array(8)].map((_, i) => (
                            <motion.div key={i} className={`w-2 rounded-full ${t.accentBg}`}
                              animate={{ height: ["16px", "40px", "10px", "32px", "16px"] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }} />
                          ))}
                        </div>
                        <p className={`text-sm font-bold ${t.muted}`}>Generating your voice... {genElapsed}s</p>
                        <p className={`text-[11px] ${t.muted} opacity-60`}>GPU warm-up can take 30–60 seconds on first run</p>
                      </motion.div>
                    )}
                    {!generating && audioUrl && (
                      <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <p className="font-black text-emerald-500 text-sm">Render Complete!</p>
                            <p className={`text-[11px] ${t.muted}`}>Click play or download below</p>
                          </div>
                        </div>
                        <audio controls src={audioUrl} className="w-full h-10 mb-3" preload="auto"></audio>
                        <a href={audioUrl} download="generation.wav"
                          className={`flex items-center justify-center gap-2 w-full py-2.5 border ${t.border} rounded-xl font-bold text-sm ${t.hover} transition-colors`}>
                          <Download size={16} /> Download WAV
                        </a>
                      </motion.div>
                    )}
                    {!generating && !audioUrl && (
                      <motion.div key="empty" className={`${t.surface} rounded-3xl border ${t.border} p-8 flex flex-col items-center justify-center gap-3 min-h-[180px] opacity-50`}>
                        <Volume2 size={32} className={t.muted} />
                        <p className={`text-sm font-bold ${t.muted}`}>Output will appear here</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Recent 5 Generations (Moved to right column) */}
                  {recentFive.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black">Recent Renders</h2>
                        <button onClick={() => setActiveTab("history")} className={`text-sm font-bold ${t.accent} hover:underline`}>
                          View All ({completedHistory.length}) →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {recentFive.map((h, i) => {
                          const url = h.audio_url || h.url;
                          return (
                            <div key={i} className={`${t.surface} px-4 py-3 rounded-2xl border ${t.border} flex flex-col xl:flex-row xl:items-center gap-3`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs line-clamp-1 opacity-70">"{h.text}"</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <audio controls src={url} className="w-full xl:w-44 h-8 shrink-0" preload="none"></audio>
                                <button onClick={() => handleDeleteGeneration(h.id)} className={`p-1.5 rounded-lg ${t.hover} text-red-400 hover:text-red-500 transition-colors shrink-0`}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== VOICE LAB ===== */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-6xl mx-auto">
              <div className="text-center mb-6">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Voice Lab.</h1>
                <p className={`text-lg ${t.muted}`}>Train custom voice models instantly with a short recording.</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Left Col: Saved Voices */}
                <div className={`${t.surface} rounded-3xl border ${t.border} p-6 h-full flex flex-col`}>
                  <h3 className="font-black text-base mb-4">Your Voice Models</h3>
                  {voices.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-10">
                      <Mic size={32} className="mb-2" />
                      <p className="text-sm font-bold">No custom voices yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {voices.map(v => (
                        <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl border ${t.border} ${t.hover} transition-colors`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${t.accentBg} flex items-center justify-center shrink-0`}>
                              <Mic size={14} className="text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{v.name || "Custom Voice"}</p>
                              <p className={`text-[11px] ${t.muted} uppercase tracking-widest`}>{(v.language || "").toUpperCase()}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteVoice(v.id)} className={`p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors shrink-0`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Col: Record New Voice */}
                <div className={`${t.surface} rounded-3xl border ${t.border} p-6 md:p-8 shadow-xl`}>
                  <h3 className="font-black text-base mb-6">Record New Voice</h3>

                  {/* Language */}
                  <div className="mb-6">
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${t.muted} mb-2`}>Spoken Language</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ code: "te", label: "🇮🇳 Telugu" }, { code: "en", label: "🇬🇧 English" }].map(l => (
                        <button key={l.code} onClick={() => setRecordingLang(l.code)}
                          className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${recordingLang === l.code ? 'border-[#6366f1] bg-[#6366f1] text-white' : `${t.border} ${t.muted} ${t.hover}`}`}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone - 10 visual cards */}
                  <div className="mb-6">
                    <label className={`block text-[11px] font-bold uppercase tracking-widest ${t.muted} mb-3`}>Emotional Tone</label>
                    <div className="grid grid-cols-5 gap-2">
                      {TONES.map(tone => (
                        <button key={tone} onClick={() => setRecordingTone(tone)}
                          className={`py-2.5 px-1 rounded-xl font-bold text-xs border-2 transition-all flex flex-col items-center gap-1 ${
                            recordingTone === tone ? 'border-[#6366f1] bg-[#6366f1] text-white' : `${t.border} ${t.muted} ${t.hover}`}`}>
                          <span className="text-lg">{TONE_EMOJI[tone]}</span>
                          <span className="text-[10px] md:text-xs">{tone}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Script box */}
                  <div className={`${isDark ? 'bg-black/40' : 'bg-gray-50'} border ${t.border} rounded-2xl p-5 mb-6 relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${t.accentBg}`}></div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${t.accent} mb-2`}>Read this aloud in {TONE_EMOJI[recordingTone]} {recordingTone} tone:</p>
                    <p className="text-base italic leading-relaxed font-medium pl-2">
                      "{RECORDING_SCRIPTS[recordingLang]?.[recordingTone]}"
                    </p>
                  </div>

                  {/* Record / Save */}
                  {!audioBlob ? (
                    <button onClick={toggleRecording}
                      className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                        isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                        : isDark ? 'bg-[#252833] hover:bg-[#2d313f] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                      {isRecording ? <><div className="w-3 h-3 rounded-full bg-white"></div> Stop Recording</> : <><Mic /> Start Recording</>}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-12"></audio>
                      <div className="flex gap-4">
                        <button onClick={() => setAudioBlob(null)} className={`flex-1 py-4 border ${t.border} rounded-2xl font-bold ${t.hover} transition-colors`}>Discard</button>
                        <button onClick={handleClone} disabled={cloning}
                          className={`flex-1 py-4 ${t.accentBg} text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50`}>
                          {cloning ? "Saving Model..." : "Save Voice Model"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== HISTORY ===== */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-1">Render History</h1>
                  <p className={`text-sm ${t.muted}`}>{history.length} total generations</p>
                </div>
                <div className={`px-4 py-2 rounded-full border ${t.border} text-sm font-bold`}>
                  {completedHistory.length} completed
                </div>
              </div>

              {history.length === 0 ? (
                <div className={`text-center py-20 ${t.surface} rounded-3xl border ${t.border}`}>
                  <History size={48} className={`mx-auto mb-4 opacity-20 ${t.muted}`} />
                  <p className="font-bold text-lg">No renders yet</p>
                  <button onClick={() => setActiveTab("studio")} className={`mt-4 ${t.accent} hover:underline font-bold`}>Go to Studio</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((h, i) => {
                    const url = h.audio_url || h.url;
                    const isCompleted = h.status === "COMPLETED" && url;
                    const langLabel = (h.language || "").replace("-IN", "").toUpperCase();
                    const dateLabel = h.created_at
                      ? new Date(h.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—";
                    return (
                      <div key={i} className={`${t.surface} p-5 rounded-2xl border ${t.border} flex flex-col md:flex-row md:items-center gap-4`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDark ? 'bg-white/5' : 'bg-black/5'} ${t.muted}`}>{dateLabel}</span>
                            {langLabel && <span className={`text-[10px] font-bold uppercase tracking-widest ${t.accent}`}>{langLabel}</span>}
                            {!isCompleted && (
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                h.status === "FAILED" ? "bg-red-500/10 text-red-400" :
                                h.status === "PROCESSING" ? "bg-amber-500/10 text-amber-400" : "bg-gray-500/10 text-gray-400"
                              }`}>{h.status || "UNKNOWN"}</span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-2 leading-relaxed opacity-90">"{h.text}"</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isCompleted ? (
                            <>
                              <audio controls src={url} className="w-full md:w-52 h-9" preload="none"></audio>
                              <a href={url} download className={`p-2 rounded-xl border ${t.border} ${t.hover} transition-colors`}><Download size={15} /></a>
                            </>
                          ) : (
                            <span className={`text-xs ${t.muted} italic`}>{h.status === "FAILED" ? "Failed" : "No audio"}</span>
                          )}
                          <button onClick={() => handleDeleteGeneration(h.id)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== PROFILE ===== */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Profile />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${t.surface} border-t ${t.border} pb-[env(safe-area-inset-bottom)]`}>
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setActiveTab("studio")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === "studio" ? t.accent : t.muted}`}>
            <Sparkles size={20} className={activeTab === "studio" ? "fill-current" : ""} />
            <span className="text-[10px] font-bold">Studio</span>
          </button>
          <button onClick={() => setActiveTab("lab")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === "lab" ? t.accent : t.muted}`}>
            <Mic size={20} className={activeTab === "lab" ? "fill-current" : ""} />
            <span className="text-[10px] font-bold">Voice Lab</span>
          </button>
          <button onClick={() => setActiveTab("history")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === "history" ? t.accent : t.muted}`}>
            <History size={20} className={activeTab === "history" ? "stroke-[2.5]" : ""} />
            <span className="text-[10px] font-bold">History</span>
          </button>
          <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === "profile" ? t.accent : t.muted}`}>
            <User size={20} className={activeTab === "profile" ? "fill-current" : ""} />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
