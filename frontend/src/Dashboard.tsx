import { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { auth } from "./firebase";
import axios from "axios";
import { Mic, Play, Trash2, History, Layers, CreditCard, LogOut, CheckCircle2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const scripts = {
  te: "ప్రతి ప్రయాణం… ఒక గమ్యంతో మొదలవుతుంది. ఆ గమ్యం చేరుకునే దారిలో ఎన్నో కష్టాలు, సవాళ్లు ఎదురవుతాయి. కానీ, పట్టుదల ఉంటే ఎంత పెద్ద లక్ష్యాన్నైనా సాధించవచ్చు.",
  hi: "हर सफर... एक मंजिल से शुरू होता है। उस मंजिल तक पहुंचने के रास्ते में कई मुश्किलें और चुनौतियां सामने आती हैं। लेकिन, अगर लगन हो तो बड़े से बड़ा लक्ष्य भी हासिल किया जा सकता है।",
  en: "Every journey... begins with a destination. On the way to that destination, many difficulties and challenges arise. But, with perseverance, even the biggest goal can be achieved."
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
  const [scriptLang, setScriptLang] = useState<"te"|"hi"|"en">("te");
  const [uploadMsg, setUploadMsg] = useState("");

  // Generation State
  const [genText, setGenText] = useState("");
  const [genLang, setGenLang] = useState("te");
  const [genMsg, setGenMsg] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenUrl, setLastGenUrl] = useState("");

  // Coupon
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  // Modals
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, type: "voice" | "gen" | null, id: string | null}>({isOpen: false, type: null, id: null});

  const loadLibrary = async () => {
    try {
      const resV = await axios.get("/api/voices/", { headers: { Authorization: `Bearer ${token}` }});
      setVoices(resV.data);
      if(resV.data.length > 0 && !selectedVoice) setSelectedVoice(resV.data[0].id);

      const resG = await axios.get("/api/generations/", { headers: { Authorization: `Bearer ${token}` }});
      setGenerations(resG.data.filter((g: any) => g.status === "COMPLETED"));
    } catch (e) {}
  };

  useEffect(() => {
    if (token) loadLibrary();
  }, [token]);

  const handleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setRecordedBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
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
    if (!recordedBlob) return;
    setUploadMsg("Processing...");
    const formData = new FormData();
    formData.append("file", recordedBlob, "voice.webm");
    const name = voiceName || "My Voice";
    formData.append("name", name);

    try {
      await axios.post(`/api/voices/?name=${encodeURIComponent(name)}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setUploadMsg("Success! Voice Saved.");
      setRecordedBlob(null); setAudioUrl(""); setVoiceName("");
      loadLibrary();
    } catch (e) { setUploadMsg("Error saving voice."); }
  };

  const confirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    const { type, id } = deleteModal;
    setDeleteModal({ isOpen: false, type: null, id: null });
    
    try {
      if (type === "voice") await axios.delete(`/api/voices/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      else if (type === "gen") await axios.delete(`/api/generations/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      loadLibrary();
    } catch (e) {}
  };

  const handleGenerate = async () => {
    if (!selectedVoice || !genText) {
      setGenMsg("Please select a voice and enter text."); return;
    }
    
    const cost = genText.length;
    if ((userData?.credits || 0) < cost) {
      setGenMsg(`Not enough credits! This costs ${cost} credits, but you have ${userData?.credits}. Buy more from admin.`); return;
    }

    setIsGenerating(true);
    setGenMsg("Queuing AI...");
    setLastGenUrl("");
    try {
      const res = await axios.post(`/api/generations/?voice_id=${selectedVoice}&text=${encodeURIComponent(genText)}&language=${genLang}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      refreshUserData(); // Instantly reflect deducted credits visually
      setGenMsg("AI generating... Please wait...");
      
      const checkInterval = setInterval(async () => {
        const check = await axios.get("/api/generations/", { headers: { Authorization: `Bearer ${token}` }});
        const myJob = check.data.find((j: any) => j.id === res.data.job_id);
        if (myJob && myJob.status === "COMPLETED") {
          clearInterval(checkInterval);
          setGenMsg("Done!"); setLastGenUrl(myJob.url); setIsGenerating(false); loadLibrary();
        } else if (myJob && myJob.status === "FAILED") {
          clearInterval(checkInterval);
          setGenMsg("Generation failed. Credits refunded."); setIsGenerating(false); refreshUserData();
        }
      }, 3000);
    } catch (e: any) {
      setGenMsg(e.response?.data?.detail || "Error queuing generation."); setIsGenerating(false);
    }
  };

  const handleCoupon = async () => {
    if (!coupon) return;
    try {
      await axios.post(`/api/billing/apply_coupon?code=${coupon}`, null, { headers: { Authorization: `Bearer ${token}` } });
      setCouponMsg("Success!"); refreshUserData(); setCoupon("");
    } catch(e: any) { setCouponMsg(e.response?.data?.detail || "Invalid code"); }
  };

  const formatTime = (secs: number) => `${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      
      {/* Modals */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32}/></div>
              <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
              <p className="text-slate-500 mb-6">This action cannot be undone. Are you sure you want to delete this {deleteModal.type}?</p>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteModal({isOpen:false, type:null, id:null})} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-xl text-white">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topnav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xl tracking-tight">
            <Mic /> <span>VoiceSaaS</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/pricing" className="text-sm font-bold text-slate-500 hover:text-indigo-600">Pricing</Link>
            {import.meta.env.VITE_ENABLE_ADMIN === 'true' && userData?.plan_tier === "ADMIN" && (
              <Link to="/admin" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Shield size={16}/> Admin</Link>
            )}
            <div className="text-right border-l border-slate-200 pl-6">
              <p className="text-sm font-semibold">{userData?.name}</p>
              <p className="text-xs text-indigo-600 font-bold">{userData?.credits} Credits</p>
            </div>
            <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-slate-800"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Recorder */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Mic size={120} /></div>
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><Mic size={24} /></div>
              <h2 className="text-2xl font-bold">1. Clone Voice</h2>
            </div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <p className="text-slate-500 text-sm">Read the script clearly</p>
              <select value={scriptLang} onChange={e => setScriptLang(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 font-medium cursor-pointer">
                <option value="te">Telugu</option><option value="hi">Hindi</option><option value="en">English</option>
              </select>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center italic text-slate-700 text-lg mb-6 shadow-inner flex-grow flex items-center relative z-10 font-serif">
              "{scripts[scriptLang]}"
            </div>

            <div className="flex items-center space-x-4 mb-4 relative z-10">
              <button 
                onClick={handleRecord}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all ${isRecording ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"}`}
              >
                {isRecording ? <div className="w-3 h-3 bg-white rounded-full animate-ping" /> : <Mic size={20} />}
                <span>{isRecording ? "Stop Recording" : "Start Recording"}</span>
              </button>
              {isRecording && <span className="font-mono font-bold text-xl w-16 text-center text-red-500">{formatTime(recordingTime)}</span>}
            </div>

            {audioUrl && (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4 relative z-10">
                <audio src={audioUrl} controls className="w-full h-10" />
                <div className="flex space-x-2">
                  <input type="text" value={voiceName} onChange={e => setVoiceName(e.target.value)} placeholder="Voice Name (e.g. My Studio Voice)" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500" />
                  <button onClick={uploadVoice} className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800">Save</button>
                </div>
                <p className="text-sm font-semibold text-indigo-600">{uploadMsg}</p>
              </motion.div>
            )}
          </div>

          {/* Generator */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Play size={120} /></div>
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><Play size={24} /></div>
              <h2 className="text-2xl font-bold">2. Generate Speech</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Voice</label>
                <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium cursor-pointer">
                  {voices.length === 0 && <option value="" disabled>No voices</option>}
                  {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Language</label>
                <select value={genLang} onChange={e => setGenLang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 font-medium cursor-pointer">
                  <option value="te">Telugu</option><option value="en">English</option><option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Script</label>
            <textarea value={genText} onChange={e => setGenText(e.target.value)} rows={5} placeholder="Type what you want to say..." className="w-full flex-grow bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 outline-none focus:border-emerald-500 resize-none relative z-10" />

            <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex justify-center items-center space-x-2 shadow-lg shadow-emerald-200 transition-all disabled:opacity-70 relative z-10">
              <Play size={20} fill="currentColor" />
              <span>Generate ({genText.length} Credits)</span>
            </button>

            {genMsg && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center relative z-10">
                <p className={`text-sm font-bold flex items-center justify-center gap-2 ${genMsg.includes("Error") || genMsg.includes("Not enough") || genMsg.includes("failed") ? "text-red-600" : "text-emerald-700"}`}>
                  {isGenerating ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"/> : <CheckCircle2 size={16}/>}
                  {genMsg}
                </p>
                {lastGenUrl && <audio src={lastGenUrl} controls className="w-full h-10 mt-3" />}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><CreditCard size={100} /></div>
            <h3 className="text-lg font-bold text-slate-300 mb-1 relative z-10">Credits Balance</h3>
            <p className="text-5xl font-black mb-6 relative z-10">{userData?.credits}</p>
            <div className="flex space-x-2 relative z-10">
              <input type="text" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Code" className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 outline-none focus:border-indigo-400 font-mono text-sm" />
              <button onClick={handleCoupon} className="bg-indigo-500 text-white font-bold px-4 rounded-xl hover:bg-indigo-600 transition-colors">Redeem</button>
            </div>
            <p className="text-xs mt-2 text-indigo-300 font-bold relative z-10">{couponMsg}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:col-span-1 flex flex-col">
            <div className="flex items-center space-x-2 mb-4 text-slate-700"><Layers size={20}/> <h3 className="font-bold">My Voices</h3></div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-64">
              {voices.length === 0 && <p className="text-sm text-slate-400 italic">No voices yet.</p>}
              {voices.map(v => (
                <div key={v.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl group relative">
                  <button onClick={() => setDeleteModal({isOpen: true, type: "voice", id: v.id})} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                  <p className="font-bold text-sm text-slate-800 pr-6 mb-2 truncate">{v.name}</p>
                  <audio src={v.url} controls className="w-full h-8" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:col-span-1 flex flex-col">
            <div className="flex items-center space-x-2 mb-4 text-slate-700"><History size={20}/> <h3 className="font-bold">History</h3></div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-64">
              {generations.length === 0 && <p className="text-sm text-slate-400 italic">No history yet.</p>}
              {generations.map(g => (
                <div key={g.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl group relative">
                  <button onClick={() => setDeleteModal({isOpen: true, type: "gen", id: g.id})} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                  <p className="text-xs text-slate-500 italic pr-6 mb-2 line-clamp-2">"{g.text}"</p>
                  <audio src={g.url} controls className="w-full h-8" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

