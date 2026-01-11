
import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, AlertCircle, Building2, Fingerprint, KeySquare, History, UserCog } from 'lucide-react';
import { verifyPlatformAdmin, verifyManagerLogin } from '../db';

interface LoginProps {
  db: any;
  onLogin: (role: 'superadmin' | 'user' | 'manager', email?: string, extra?: any) => void;
}

export const Login: React.FC<LoginProps> = ({ db, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveredPass, setRecoveredPass] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const instanceKey = db?.auth?.instanceId || 'FP-SYSTEM';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Check for Platform Admin First
      const platformAdmin = await verifyPlatformAdmin(email, password);
      if (platformAdmin) {
        onLogin('superadmin', email);
        return;
      }

      // 2. Check for Manager Login
      const manager = await verifyManagerLogin(email, password);
      if (manager) {
        onLogin('manager', email, manager);
        return;
      }

      // 3. Check for Company (Tenant) Login
      const loginEmail = email.toLowerCase();
      const matchedCompany = db.companies.find((c: any) => 
        c.email.toLowerCase() === loginEmail && 
        c.password === password
      );

      if (matchedCompany) {
        if (matchedCompany.status === 'suspended') {
          setError('Access Denied: This company account is currently suspended.');
          setIsLoading(false);
          return;
        }
        localStorage.setItem('fleetpay_active_comp', matchedCompany.id);
        onLogin('user', loginEmail);
      } else {
        setError('Authentication failed. Verify credentials and account type.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('A connection error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setRecoveredPass(null);

    setTimeout(() => {
      const matched = db.companies.find((c: any) => 
        c.email.toLowerCase() === email.toLowerCase() && 
        c.recoveryCode === recoveryCode.toUpperCase()
      );

      if (matched) {
        setRecoveredPass(matched.password || 'Contact Admin');
        setIsLoading(false);
      } else {
        setError('Invalid Identity Code or Email combination.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden text-gray-900">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full -mr-96 -mt-96 blur-[120px] pointer-events-none animate-pulse"></div>
      
      <div className="w-full max-w-[500px] z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-blue-900/10 p-10 md:p-16 border border-white relative overflow-hidden">
          <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100/50">
            <Fingerprint size={12} className="text-gray-400" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{instanceKey}</span>
          </div>

          {!recoveryMode ? (
            <>
              <div className="flex flex-col items-center text-center mb-14">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 mb-10 transform transition-all duration-500">
                  <span className="text-5xl font-black italic tracking-tighter">FP</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Portal Access</h1>
                <p className="text-gray-400 font-medium text-sm leading-relaxed max-w-[280px]">
                  Owner, Manager or Admin authentication required.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-3xl flex items-center gap-3">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-5 flex items-center gap-2">
                    <Mail size={12} /> Login Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-600 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      required
                      autoFocus
                      className="w-full pl-16 pr-8 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-300"
                      placeholder="name@fleet.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-5 flex items-center gap-2">
                    <Lock size={12} /> Access Key (Password)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-600 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      required
                      className="w-full pl-16 pr-8 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-300"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pr-6">
                  <button 
                    type="button" 
                    onClick={() => { setRecoveryMode(true); setError(''); }}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800"
                  >
                    Recovery Code?
                  </button>
                </div>

                <div className="pt-2">
                  <button 
                    disabled={isLoading}
                    type="submit" 
                    className="w-full py-6 bg-blue-600 text-white rounded-[2.2rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Authorize Session <ArrowRight size={20} /></>}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="animate-in zoom-in-95 duration-300">
               <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8">
                  <KeySquare size={32} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">Recovery</h1>
                <p className="text-gray-400 font-medium text-sm leading-relaxed max-w-[280px]">
                  Provide your Unique Identity Code to recover Company access.
                </p>
              </div>

              {recoveredPass ? (
                <div className="space-y-8">
                  <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Access Key</p>
                    <p className="text-3xl font-black text-emerald-900 tracking-widest">{recoveredPass}</p>
                  </div>
                  <button 
                    onClick={() => { setRecoveryMode(false); setRecoveredPass(null); setPassword(recoveredPass); }}
                    className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    Continue to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecovery} className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-5">Identity Email</label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-8 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] outline-none font-bold text-sm focus:border-emerald-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-5">Recovery Code</label>
                    <input 
                      required
                      className="w-full px-8 py-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] outline-none font-bold text-sm uppercase tracking-widest"
                      placeholder="REC-XXXX-XXXX"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                    />
                  </div>
                  <button disabled={isLoading} type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-[2.2rem] font-black text-xs uppercase tracking-widest shadow-xl">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Verify Identity'}
                  </button>
                  <button type="button" onClick={() => setRecoveryMode(false)} className="w-full py-4 text-gray-400 font-black text-[10px] uppercase">Cancel</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
