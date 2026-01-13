
import React, { useState } from 'react';
import { 
  Trash2, Lock, Unlock, ShieldAlert, ShieldCheck, 
  Search, Info, MoreHorizontal, UserX, UserCheck, 
  ChevronRight, Calendar, Smartphone, Fingerprint,
  MoreVertical, X, AlertCircle
} from 'lucide-react';
import { CompanyDetails, PlanTier } from '../../types';
import { deleteAccountByUsername, toggleAccountLock, toggleAccountStatus } from '../../db';

interface AdminRegistryProps {
  accounts: CompanyDetails[];
  onRefresh: () => void;
  onSelect: (acc: CompanyDetails) => void;
}

export const AdminRegistry: React.FC<AdminRegistryProps> = ({ accounts, onRefresh, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const getPlanColor = (plan: PlanTier) => {
    switch (plan) {
      case 'Enterprise': return 'bg-slate-900 text-white';
      case 'Elite Network': return 'bg-blue-700 text-white';
      case 'Pro Cluster': return 'bg-indigo-600 text-white';
      case 'Basic Hub': return 'bg-emerald-600 text-white';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleToggleLock = async (e: React.MouseEvent, acc: CompanyDetails) => {
    e.stopPropagation();
    setIsProcessing(acc.username);
    try {
      await toggleAccountLock(acc.username, acc.isLocked);
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(null); }
  };

  const handleToggleStatus = async (e: React.MouseEvent, acc: CompanyDetails) => {
    e.stopPropagation();
    setIsProcessing(acc.username);
    try {
      await toggleAccountStatus(acc.username, acc.status);
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(null); }
  };

  const handleDelete = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    if (!confirm('EXTREME ACTION: Permanently purge this node and all associated workspace data from the global registry?')) return;
    setIsProcessing(username);
    try {
      await deleteAccountByUsername(username);
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(null); }
  };

  const filtered = accounts.filter(acc => 
    acc.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.cusId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 bg-white rounded-[3rem] overflow-hidden">
      {/* Search Header */}
      <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
         <div className="relative w-full md:max-w-xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={22} />
            <input 
              placeholder="Search registry (Name, CUS ID, Plan, Identity)..." 
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
               {filtered.length} Hub Nodes Identified
            </div>
         </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-10 py-8">CUSTOMER_IDENTITY</th>
              <th className="px-6 py-8 text-center">CUS_ID_NODE</th>
              <th className="px-6 py-8 text-center">PLAN_TERM</th>
              <th className="px-6 py-8 text-center">SECURITY_LOCK</th>
              <th className="px-6 py-8 text-center">ACCOUNT_STATUS</th>
              <th className="px-10 py-8 text-right">REGISTRY_ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-32 text-center text-slate-200 font-black uppercase text-sm tracking-[0.3em] italic">NULL_REGISTRY_SEARCH_MATCH</td></tr>
            ) : filtered.map(account => (
              <tr key={account.id} onClick={() => onSelect(account)} className="hover:bg-slate-50/50 transition-all group cursor-pointer">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner transition-transform group-hover:scale-110 ${account.status === 'suspended' ? 'bg-rose-50 text-rose-300' : 'bg-blue-50 text-blue-600'}`}>
                        {account.owner.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <p className="font-black text-slate-900 text-lg leading-none mb-1.5 uppercase tracking-tighter">{account.owner}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Smartphone size={10}/> {account.username}
                        </p>
                     </div>
                  </div>
                </td>
                <td className="px-6 py-8 text-center">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl text-[10px] font-mono font-bold uppercase shadow-sm">
                      <Fingerprint size={12} className="text-blue-500" /> {account.cusId || 'MOCK-NODE'}
                   </div>
                </td>
                <td className="px-6 py-8 text-center">
                   <div className="flex flex-col items-center gap-1.5">
                      <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${getPlanColor(account.plan)}`}>
                        {account.plan}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10}/> {account.planDuration || 1} Months
                      </span>
                   </div>
                </td>
                <td className="px-6 py-8 text-center">
                   <div className="flex flex-col items-center gap-2">
                     <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${account.isLocked ? 'bg-rose-600 text-white border-rose-500 shadow-lg' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {account.isLocked ? 'NODE_LOCKED' : 'NODE_UNLOCKED'}
                     </span>
                   </div>
                </td>
                <td className="px-6 py-8 text-center">
                   <div className="flex flex-col items-center">
                      <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${account.status === 'suspended' ? 'bg-slate-900 text-white border-slate-800' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {account.status === 'suspended' ? 'BLOCKED' : 'UNBLOCKED'}
                      </span>
                   </div>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <button 
                      title={account.isLocked ? "Unlock Node" : "Lock Node"}
                      onClick={(e) => handleToggleLock(e, account)}
                      className={`p-3 rounded-2xl transition-all shadow-sm border ${account.isLocked ? 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100'}`}
                    >
                      {account.isLocked ? <Unlock size={18}/> : <Lock size={18}/>}
                    </button>
                    
                    <button 
                      title={account.status === 'suspended' ? "Unblock Account" : "Block Account"}
                      onClick={(e) => handleToggleStatus(e, account)}
                      className={`p-3 rounded-2xl transition-all shadow-sm border ${account.status === 'suspended' ? 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100' : 'text-slate-400 bg-slate-100 border-slate-200 hover:text-slate-900'}`}
                    >
                      {account.status === 'suspended' ? <UserCheck size={18}/> : <UserX size={18}/>}
                    </button>
                    
                    <button 
                      title="Delete Registry Entry"
                      onClick={(e) => handleDelete(e, account.username)}
                      className="p-3 bg-white text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-100 rounded-2xl transition-all shadow-sm"
                    >
                      <Trash2 size={18}/>
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSelect(account); }}
                      className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-blue-600 rounded-2xl transition-all shadow-sm"
                    >
                      <Info size={18}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
