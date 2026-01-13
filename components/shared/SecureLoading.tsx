
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Lock, Shield, Loader2, CheckCircle2, Search } from 'lucide-react';

export const SecureLoading: React.FC = () => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const statuses = [
    "ACQUIRING HANDSHAKE...",
    "VERIFYING RSA KEYS...",
    "NODE INTEGRITY SCAN...",
    "DECRYPTING HUB ACCESS...",
    "HANDSHAKE COMPLETE"
  ];

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 550);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 2 : 100));
    }, 45);

    return () => {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[5000] bg-[#F8FAFC] flex items-center justify-center p-6 overflow-hidden font-sans">
      {/* Dynamic Light Background Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px]"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]"></div>

      <div className="relative w-full max-w-md z-10">
        <div className="bg-white/70 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-12 flex flex-col items-center">
          
          {/* Central Security Icon with Scanning Effect */}
          <div className="relative mb-14">
            {/* Outer rings */}
            <div className="absolute inset-[-15px] border border-slate-100 rounded-[2.5rem] animate-ping opacity-20"></div>
            <div className="absolute inset-[-30px] border border-slate-100 rounded-[3rem] opacity-10"></div>
            
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02),0_10px_20px_rgba(37,99,235,0.1)] flex items-center justify-center relative overflow-hidden group">
              <ShieldCheck size={44} className="text-blue-600 relative z-10" />
              
              {/* Vertical Scanning Line */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent w-full h-[20%] top-0 animate-[scan_2s_ease-in-out_infinite] z-20"></div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="w-full space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">
                Secure Handshake
              </h2>
              <div className="flex items-center justify-center gap-3">
                 <span className="text-2xl font-black text-slate-900 tracking-tighter">
                   {progress}%
                 </span>
                 <div className={`transition-colors duration-500 ${progress === 100 ? 'text-emerald-500' : 'text-blue-600'}`}>
                    {progress === 100 ? <CheckCircle2 size={20} /> : <Loader2 size={18} className="animate-spin" />}
                 </div>
              </div>
            </div>

            {/* High-End Progress Track */}
            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[2px] shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                 style={{ width: `${progress}%` }}
               ></div>
            </div>

            {/* Status Steps */}
            <div className="grid grid-cols-5 gap-2 px-2">
               {[20, 40, 60, 80, 100].map((step, i) => (
                 <div 
                    key={step} 
                    className={`h-1.5 rounded-full transition-all duration-700 ${progress >= step ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-100'}`}
                 ></div>
               ))}
            </div>

            <div className="text-center pt-2">
              <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-[0.25em] min-h-[14px] animate-pulse">
                {statuses[statusIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-6 text-slate-300">
           <div className="flex items-center gap-2">
              <Lock size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">AES-256</span>
           </div>
           <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
           <div className="flex items-center gap-2">
              <Shield size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">NODE-V3-SYNC</span>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(400%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
};
