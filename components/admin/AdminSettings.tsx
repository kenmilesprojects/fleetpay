
import React, { useState, useEffect } from 'react';
import { supabase } from '../../db';
import { ShieldCheck, Loader2, Eye, EyeOff, Save, Fingerprint, Lock, Key } from 'lucide-react';

export const AdminSettings = ({ db, onRefresh }: { db: any; onRefresh: (newActiveWsId?: string) => Promise<void> }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showSellKey, setShowSellKey] = useState(false);
  const [platformAdmin, setPlatformAdmin] = useState({ email: '', password: '', selling_key: '' });

  useEffect(() => {
    const loadPlatform = async () => {
      const authKey = localStorage.getItem('fleetpay_auth_username') || '';
      if (!authKey) return;
      const { data } = await supabase.from('platform_admins').select('*').eq('email', authKey.toLowerCase()).maybeSingle();
      if (data) setPlatformAdmin({ 
        email: data.email, 
        password: data.password, 
        selling_key: data.selling_key || '' 
      });
    };
    loadPlatform();
  }, []);

  const handlePlatformUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const currentEmail = localStorage.getItem('fleetpay_auth_username') || '';
      const { error } = await supabase.from('platform_admins').update({ 
        email: platformAdmin.email.toLowerCase(), 
        password: platformAdmin.password,
        selling_key: platformAdmin.selling_key
      }).eq('email', currentEmail.toLowerCase());
      
      if (error) throw error;
      localStorage.setItem('fleetpay_auth_username', platformAdmin.email.toLowerCase());
      alert('Platform Credentials Synchronized Successfully.');
      onRefresh();
    } catch (err: any) {
      alert("Sync Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-white rounded-[3.5rem] p-12 md:p-20 border border-gray-100 shadow-3xl">
        <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
          <div className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl">
            <ShieldCheck size={48} />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-5xl font-black tracking-tighter text-slate-900">Platform ID</h2>
            <p className="text-slate-400 font-medium italic">Master administrative credentials for the FO360 Cluster.</p>
          </div>
        </div>

        <form onSubmit={handlePlatformUpdate} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">PLATFORM EMAIL ID</label>
              <input 
                type="email" 
                required
                className="w-full py-5 px-8 bg-slate-50 border-2 border-slate-100 rounded-[2.2rem] outline-none font-bold text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                value={platformAdmin.email} 
                onChange={(e) => setPlatformAdmin({...platformAdmin, email: e.target.value})} 
              />
            </div>
            <div className="space-y-3 relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">MASTER ACCESS KEY</label>
              <div className="relative group">
                <input 
                  type={showPass ? "text" : "password"} 
                  required
                  className="w-full py-5 px-8 bg-slate-50 border-2 border-slate-100 rounded-[2.2rem] outline-none font-bold text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner" 
                  value={platformAdmin.password} 
                  onChange={(e) => setPlatformAdmin({...platformAdmin, password: e.target.value})} 
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                  {showPass ? <EyeOff size={22}/> : <Eye size={22}/>}
                </button>
              </div>
            </div>
          </div>

          <div className="p-10 bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] space-y-6">
             <div className="flex items-center gap-3 mb-2">
                <Key size={20} className="text-indigo-600" />
                <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Authorized Selling Passkey</p>
             </div>
             <p className="text-xs text-indigo-400 font-medium italic">Required for every node provisioning authorization event.</p>
             <div className="relative group">
                <input 
                  type={showSellKey ? "text" : "password"} 
                  required
                  placeholder="MINIMUM 6 CHARS"
                  className="w-full py-5 px-8 bg-white border-2 border-indigo-200 rounded-[2.2rem] outline-none font-black text-lg text-indigo-600 text-center tracking-[0.3em] focus:ring-4 focus:ring-indigo-200 transition-all shadow-sm" 
                  value={platformAdmin.selling_key} 
                  onChange={(e) => setPlatformAdmin({...platformAdmin, selling_key: e.target.value})} 
                />
                <button type="button" onClick={() => setShowSellKey(!showSellKey)} className="absolute right-8 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600 transition-colors">
                  {showSellKey ? <EyeOff size={22}/> : <Eye size={22}/>}
                </button>
             </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={isSaving} className="w-full py-7 bg-slate-950 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-4xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 active:scale-95">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24}/>} Sync Platform Identity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
