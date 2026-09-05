import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { Users, Ticket, ArrowLeft, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [couponAmount, setCouponAmount] = useState(30000);
  const [generatedCoupon, setGeneratedCoupon] = useState("");

  const loadUsers = async () => {
    try {
      const res = await axios.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch(e) {}
  };

  useEffect(() => { loadUsers(); }, [token]);

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
      loadUsers();
    } catch(e) {}
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Permanently delete this user profile?")) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      loadUsers();
    } catch(e) {}
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <Link to="/" className="inline-flex items-center text-indigo-600 font-bold hover:text-indigo-800 mb-8">
        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
      </Link>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><Users size={24} /></div>
            <h2 className="text-2xl font-bold">User Management</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Name</th>
                  <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Phone</th>
                  <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Credits</th>
                  <th className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-4 font-bold">{u.name}</td>
                    <td className="py-4 font-mono text-sm text-slate-600">{u.phone_number}</td>
                    <td className="py-4 font-bold text-emerald-600">{u.credits}</td>
                    <td className="py-4 flex space-x-2">
                      <button onClick={() => updateCredits(u.id, u.credits)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => deleteUser(u.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coupons */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm self-start">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><Ticket size={24} /></div>
            <h2 className="text-2xl font-bold">Generate Coupon</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Credits Amount</label>
              <input type="number" value={couponAmount} onChange={e => setCouponAmount(parseInt(e.target.value))} className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500" />
            </div>
            <button onClick={generateCoupon} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex justify-center items-center space-x-2 hover:bg-slate-800">
              <Plus size={18} /> <span>Create Code</span>
            </button>
            
            {generatedCoupon && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <p className="text-sm font-bold text-emerald-700 mb-2 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Code Generated!</p>
                <p className="text-2xl font-mono font-black tracking-widest text-emerald-900">{generatedCoupon}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

