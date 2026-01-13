
import React, { useState } from 'react';
import { ShieldEllipsis, Search, RefreshCw, CheckCircle2, Loader2, Fingerprint, X, ShieldAlert, Lock } from 'lucide-react';
import { CompanyDetails } from '../../types';
import { resetPassword } from '../../db';

interface AdminResetPassProps {
  accounts: CompanyDetails[];
  onRefresh: () => void;
}

export const AdminResetPass: React.FC<AdminResetPassProps> = ({ accounts, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successPass, setSuccessPass] = useState<{ username: string, pass: string } | null>(null);

  const handleReset = async (username: string) => {
    if (!confirm('EXTREME SECURITY ACTION: Rotate Master Access Key for this node?')) return;
    setIsProcessing(username);
    try {
      const newPass = await resetPassword(username);
      setSuccessPass({ username, pass: newPass });
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
            <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-xl"><ShieldEllipsis size={32}/></div>
            <div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Master Key Hub</h3>
               <p className="text-slate-400 font-medium italic">Provision new 9-character access keys for hub identities.</p>
            </div>
         </div>
         <div className="relative group max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              placeholder="Search registry for key rotation..." 
              className="w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filtered.length === 0 ? (
             <div className="col-span-full py-24 text-center text-slate-200 font-black uppercase text-xs tracking-[0.3em] italic">NULL_KEY_REGISTRY_MATCH</div>
           ) : filtered.map(acc => (
             <div key={acc.id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg uppercase ${acc.status === 'suspended' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>{acc.owner.charAt(0)}</div>
                      <div>
                         <p className="font-black text-slate-900 tracking-tight leading-none uppercase">{acc.owner}</p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{acc.username}</p>
                      </div>
                   </div>
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Lock size={16}/></div>
                </div>
                
                <div className="space-y-4 mb-8">
                   <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>SECURED KEY</span>
                      <span className="text-slate-900 font-mono tracking-[0.2em]">•••••••••</span>
                   </div>
                   <div className="h-px bg-slate-50"></div>
                </div>

                <button 
                  onClick={() => handleReset(acc.username)}
                  disabled={isProcessing === acc.username}
                  className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                   {isProcessing === acc.username ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                   Rotate Access Key
                </button>
             </div>
           ))}
        </div>
      </div>

      {successPass && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[4rem] p-16 text-center shadow-4xl animate-in zoom-in-95 duration-500 relative border-[12px] border-indigo-50">
              <button onClick={() => setSuccessPass(null)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500"><X size={32}/></button>
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.2rem] flex items-center justify-center mx-auto mb-10 shadow-inner"><CheckCircle2 size={48}/></div>
              <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-6 uppercase">KEY_PROVISIONED</h4>
              <p className="text-slate-400 font-medium italic mb-10">New 9-letter master access key assigned.</p>
              
              <div className="p-10 bg-slate-900 rounded-[3rem] space-y-4 shadow-3xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] relative z-10">NEW_ACCESS_KEY</p>
                 <p className="text-5xl font-black text-indigo-400 font-mono tracking-[0.3em] relative z-10 uppercase">{successPass.pass}</p>
              </div>
              
              <button onClick={() => setSuccessPass(null)} className="mt-12 w-full py-6 bg-slate-950 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all">Synchronize HUB</button>
           </div>
        </div>
      )}
    </div>
  );
};
