
import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Loader2, AlertCircle, Fingerprint, LifeBuoy, Key, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { verifyPlatformAdmin, verifyManagerLogin, updateAccountByUsername } from '../../db';

interface LoginProps {
  db: any;
  onLogin: (role: 'superadmin' | 'user' | 'manager', identity?: string, extra?: any) => void;
}

export const Login: React.FC<LoginProps> = ({ db, onLogin }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Recovery State
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  const handleUsernameChange = (val: string) => {
    // Removed restriction to allow full email/identity typing (@ and .)
    setUsernameInput(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const rawInput = usernameInput.trim().toLowerCase();
      // Prepare the identifier for matching: append @ft.in ONLY if no @ is present
      const fullUsername = rawInput.includes('@') ? rawInput : `${rawInput}@ft.in`;
      
      // 1. Check Platform Admin (exact match first)
      let platformAdmin = await verifyPlatformAdmin(rawInput, password);
      if (!platformAdmin && !rawInput.includes('@')) {
          // Try with full email format if they only typed prefix
          platformAdmin = await verifyPlatformAdmin(fullUsername, password);
      }

      if (platformAdmin) {
        onLogin('superadmin', platformAdmin.email);
        return;
      }

      // 2. Check Manager Login
      const manager = await verifyManagerLogin(fullUsername, password);
      if (manager) {
        onLogin('manager', manager.email, manager);
        return;
      }

      // 3. Check Company Account
      // We check if the input matches either the raw username or the auto-suffixed one
      const matchedCompany = db?.companies?.find((c: any) => 
        (c.username?.toLowerCase() === fullUsername || c.username?.toLowerCase() === rawInput) && 
        c.password === password
      );

      if (matchedCompany) {
        if (matchedCompany.status === 'suspended') {
          setError('Access Blocked: Contact Node Admin.');
          setIsLoading(false);
          return;
        }
        localStorage.setItem('fleetpay_active_comp', matchedCompany.id);
        onLogin('user', matchedCompany.username);
      } else {
        setError('Authentication Failed: Verify Credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login failure:", err);
      setError('Connection Interrupted.');
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');
    
    const matched = db?.companies?.find((c: any) => c.recoveryCode === recoveryCode);
    if (!matched) {
      setRecoveryError('Invalid Recovery Token. Check your registration data.');
      return;
    }

    if (newPassword.length < 6) {
      setRecoveryError('New key must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await updateAccountByUsername(matched.username, { password: newPassword });
      
      // Clear all form fields immediately upon success
      setRecoveryCode('');
      setNewPassword('');
      setUsernameInput('');
      setPassword('');
      
      setRecoverySuccess('Access Key Restored! Redirecting to login in 5 seconds...');
      
      // Wait for 5 seconds as requested by the user
      setTimeout(() => {
        setShowRecovery(false);
        setRecoverySuccess('');
        setIsLoading(false);
      }, 5000);
    } catch (err) {
      setRecoveryError('Critical database sync error.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60"></div>

      <div className="w-full max-w-[520px] z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[4rem] shadow-4xl p-12 md:p-16 border border-white/40 relative">
          
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-24 h-24 bg-slate-900 rounded-[2.2rem] flex items-center justify-center shadow-2xl mb-8 overflow-hidden p-4 group hover:scale-110 transition-transform duration-500">
              <img src="./logo.png" alt="FO360" className="w-full h-full object-contain invert" />
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Portal Hub</h1>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-[280px]">Authorized node access for global fleet management operations.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top duration-300 shadow-sm">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-6 flex items-center gap-2">
                <Fingerprint size={12} className="text-blue-600" /> Hub Identity
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  required 
                  autoFocus 
                  autoComplete="username"
                  className="w-full pl-8 pr-28 py-6 bg-slate-100/50 border-2 border-transparent rounded-[2.2rem] outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-300" 
                  placeholder="USERNAME" 
                  value={usernameInput} 
                  onChange={(e) => handleUsernameChange(e.target.value)} 
                />
                {/* Suffix hint only appears if the user hasn't typed an @ */}
                {!usernameInput.includes('@') && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
                    <div className="h-4 w-px bg-slate-200"></div>
                    <span className="font-black text-blue-600 text-[10px] tracking-widest uppercase">@ft.in</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-6 flex items-center gap-2">
                <Lock size={12} className="text-blue-600" /> Access Key
              </label>
              <input 
                type="password" 
                required 
                autoComplete="current-password"
                className="w-full px-8 py-6 bg-slate-100/50 border-2 border-transparent rounded-[2.2rem] outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner placeholder:text-slate-300" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <div className="pt-4 space-y-6">
              <button 
                disabled={isLoading} 
                type="submit" 
                className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-4xl hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>Authorize Hub <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>

              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <LifeBuoy size={14} /> Recover Forgotten Hub Key
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showRecovery && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[480px] rounded-[3.5rem] p-10 md:p-14 shadow-4xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => { setShowRecovery(false); setRecoverySuccess(''); setRecoveryError(''); }} className="text-slate-300 hover:text-rose-500 transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="mb-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Key size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Registry Recovery</h2>
              <p className="text-slate-400 text-xs font-medium">Use your master recovery token to reset access.</p>
            </div>

            <form onSubmit={handleRecovery} className="space-y-6">
              {recoveryError && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3">
                  <AlertCircle size={14}/> {recoveryError}
                </div>
              )}
              {recoverySuccess && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse">
                  <CheckCircle2 size={14}/> {recoverySuccess}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Recovery Token</label>
                <input 
                  required
                  placeholder="REC-XXXX-XXXX"
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-black text-sm focus:border-blue-500 transition-all text-center"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">New Master Key</label>
                <input 
                  required
                  type="password"
                  placeholder="MINIMUM 6 CHARS"
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-black text-sm focus:border-blue-500 transition-all text-center"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <button 
                disabled={isLoading || !!recoverySuccess}
                type="submit" 
                className="w-full py-6 bg-blue-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {isLoading && !recoverySuccess ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>} Restructure Access
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
