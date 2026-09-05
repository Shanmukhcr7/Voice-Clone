import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { Users, Ticket, ArrowLeft, Plus, Edit2, Trash2, CheckCircle2, Activity, Mic, Play, Download, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, voices: 0, generations: 0 });
  
  const [couponAmount, setCouponAmount] = useState(30000);
  const [generatedCoupon, setGeneratedCoupon] = useState("");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [uRes, vRes, gRes, sRes] = await Promise.all([
        axios.get("/api/admin/users", { headers }),
        axios.get("/api/admin/voices", { headers }),
        axios.get("/api/admin/generations", { headers }),
        axios.get("/api/admin/stats", { headers })
      ]);
      setUsers(uRes.data);
      setVoices(vRes.data);
      setGenerations(gRes.data);
      setStats(sRes.data);
    } catch(e) {}
  };

  useEffect(() => { loadData(); }, [token]);

  const generateCoupon = async () => {
    try {
      const res = await axios.post("/api/admin/coupons", { credits_to_add: couponAmount }, { headers: { Authorization: `Bearer ${token}` } });
      setGeneratedCoupon(res.data.code);
    } catch(e) {}
  };

  const updateCredits = async (userId: string, current: number) => {
    const newCreds = window.prompt("Enter new credits amount:", current.toString());
    if (newCreds === null) return;
    try {
      await axios.put(`/api/admin/users/${userId}/credits`, { credits: parseFloat(newCreds) }, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch(e) {}
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Permanently delete this user profile?")) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      loadData();
    } catch(e) {}
  };

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="bg-slate-800 border-b border-slate-700 p-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SuperAdmin Command Center
            </h1>
          </div>
          
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
            {["overview", "users", "voices", "generations", "billing"].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-bold capitalize transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 flex items-center space-x-6 hover:border-indigo-500 transition-colors">
              <div className="bg-indigo-500/20 p-4 rounded-2xl text-indigo-400"><Users size={32} /></div>
              <div><p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Total Users</p><p className="text-4xl font-black">{stats.users}</p></div>
            </div>
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 flex items-center space-x-6 hover:border-emerald-500 transition-colors">
              <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-400"><Mic size={32} /></div>
              <div><p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Custom Voices</p><p className="text-4xl font-black">{stats.voices}</p></div>
            </div>
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 flex items-center space-x-6 hover:border-purple-500 transition-colors">
              <div className="bg-purple-500/20 p-4 rounded-2xl text-purple-400"><Activity size={32} /></div>
              <div><p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Generations</p><p className="text-4xl font-black">{stats.generations}</p></div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center"><Users className="mr-3 text-indigo-400" /> Platform Users</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-indigo-500 w-64 text-white" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">User ID</th>
                    <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Name / Email</th>
                    <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Plan</th>
                    <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Credits</th>
                    <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20">
                      <td className="py-4 font-mono text-xs text-slate-500">{u.id.substring(0,8)}...</td>
                      <td className="py-4">
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email || u.phone_number}</p>
                      </td>
                      <td className="py-4"><span className="bg-slate-900 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">{u.plan_tier}</span></td>
                      <td className="py-4 font-bold text-emerald-400">{u.credits?.toLocaleString()}</td>
                      <td className="py-4 flex justify-end space-x-2">
                        <button onClick={() => updateCredits(u.id, u.credits)} className="p-2 bg-slate-900 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => deleteUser(u.id)} className="p-2 bg-slate-900 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VOICES TAB */}
        {activeTab === "voices" && (
          <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-8 flex items-center"><Mic className="mr-3 text-emerald-400" /> Voice Directory (Latest 100)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voices.map(v => (
                <div key={v.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4 hover:border-emerald-500 transition-colors">
                  <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400"><Mic size={20} /></div>
                  <div>
                    <h3 className="font-bold text-white">{v.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">User: {v.user_id?.substring(0,8)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GENERATIONS TAB */}
        {activeTab === "generations" && (
          <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-8 flex items-center"><Activity className="mr-3 text-purple-400" /> Generation Activity (Latest 100)</h2>
            <div className="space-y-3">
              {generations.map(g => (
                <div key={g.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:border-purple-500 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-300 italic mb-2">"{g.text}"</p>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span className="bg-slate-800 px-2 py-1 rounded text-white font-bold">{g.language?.toUpperCase() || "EN"}</span>
                      <span className="font-mono">User: {g.user_id?.substring(0,8)}</span>
                      <span>Status: <span className={g.status === "COMPLETED" ? "text-emerald-400 font-bold" : "text-yellow-400 font-bold"}>{g.status}</span></span>
                    </div>
                  </div>
                  {g.audio_url && (
                    <a href={g.audio_url} target="_blank" rel="noreferrer" className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl hover:bg-indigo-500 hover:text-white transition-all">
                      <Download size={18} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BILLING & COUPONS */}
        {activeTab === "billing" && (
          <div className="max-w-md bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-sm self-start">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-2xl"><Ticket size={24} /></div>
              <h2 className="text-2xl font-bold">Generate Coupon</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Credits Amount</label>
                <input type="number" value={couponAmount} onChange={e => setCouponAmount(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 outline-none focus:border-emerald-500 text-white font-bold" />
              </div>
              <button onClick={generateCoupon} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex justify-center items-center space-x-2 hover:bg-emerald-500 transition-colors">
                <Plus size={18} /> <span>Create Distributable Code</span>
              </button>
              
              {generatedCoupon && (
                <div className="mt-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                  <p className="text-sm font-bold text-emerald-400 mb-2 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Code Generated!</p>
                  <p className="text-3xl font-mono font-black tracking-widest text-white">{generatedCoupon}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
