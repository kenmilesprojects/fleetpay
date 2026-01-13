
import React, { useState } from 'react';
import { Key, Search, RefreshCw, CheckCircle2, Loader2, User, Fingerprint, X } from 'lucide-react';
import { CompanyDetails } from '../../types';
import { resetRecoveryCode } from '../../db';

interface AdminResetKeyProps {
  accounts: CompanyDetails[];
  onRefresh: () => void;
}

export const AdminResetKey: React.FC<AdminResetKeyProps> = ({ accounts, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<{ username: string, key: string } | null>(null);

  const handleReset = async (username: string) => {
    if (!confirm('Are you sure you want to reset the recovery token for this node?')) return;
    setIsProcessing(username);
    try {
      const newKey = await resetRecoveryCode(username);
      setSuccessKey({ username, key: newKey });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const filtered = accounts.filter(acc => 
    acc.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.cusId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="p-10 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-20 space-y-6">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl"><Key size={32}/></div>
            <div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Registry Recovery Hub</h3>
               <p className="text-slate-400 font-medium italic">Manually rotate master recovery tokens for fleet identities.</p>
            </div>
         </div>
         <div className="relative group max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              placeholder="Locate node to rotate recovery key..." 
              className="w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filtered.length === 0 ? (
             <div className="col-span-full py-24 text-center text-slate-200 font-black uppercase text-xs tracking-[0.3em] italic">NULL_RECOVERY_NODE_MATCH</div>
           ) : filtered.map(acc => (
             <div key={acc.id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xs font-black shadow-lg uppercase">{acc.owner.charAt(0)}</div>
                      <div>
                         <p className="font-black text-slate-900 tracking-tight leading-none uppercase">{acc.owner}</p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {acc.username}</p>
                      </div>
                   </div>
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Fingerprint size={16}/></div>
                </div>
                
                <div className="space-y-4 mb-8">
                   <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>CURRENT TOKEN</span>
                      <span className="text-slate-900 font-mono tracking-widest">{acc.recoveryCode || 'NONE'}</span>
                   </div>
                   <div className="h-px bg-slate-50"></div>
                </div>

                <button 
                  onClick={() => handleReset(acc.username)}
                  disabled={isProcessing === acc.username}
                  className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                   {isProcessing === acc.username ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                   Rotate Token
                </button>
             </div>
           ))}
        </div>
      </div>

      {successKey && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[4rem] p-16 text-center shadow-4xl animate-in zoom-in-95 duration-500 relative border-[12px] border-emerald-50">
              <button onClick={() => setSuccessKey(null)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500"><X size={32}/></button>
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.2rem] flex items-center justify-center mx-auto mb-10 shadow-inner"><CheckCircle2 size={48}/></div>
              <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-6 uppercase">TOKEN_ROTATED</h4>
              <p className="text-slate-400 font-medium italic mb-10">Registry node updated successfully.</p>
              
              <div className="p-10 bg-slate-900 rounded-[3rem] space-y-4 shadow-3xl">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">NEW_RECOVERY_KEY</p>
                 <p className="text-4xl font-black text-emerald-400 font-mono tracking-[0.2em]">{successKey.key}</p>
              </div>
              
              <button onClick={() => setSuccessKey(null)} className="mt-12 w-full py-6 bg-slate-950 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">Dismiss HUB</button>
           </div>
        </div>
      )}
    </div>
  );
};
