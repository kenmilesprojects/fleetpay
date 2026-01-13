
import React, { useState } from 'react';
import { ArrowUpCircle, CheckCircle2, X, Loader2, Mail, CreditCard, ShieldCheck } from 'lucide-react';
import { UpgradeRequest } from '../../types';
import { approveUpgradeRequest, rejectUpgradeRequest } from '../../db';

interface AdminUpgradesProps {
  requests: UpgradeRequest[];
  onRefresh: () => void;
}

export const AdminUpgrades: React.FC<AdminUpgradesProps> = ({ requests, onRefresh }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleAction = async (requestId: string, companyId: string, plan: any, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this upgrade request?`)) return;
    setIsProcessing(requestId);
    try {
      if (action === 'approve') await approveUpgradeRequest(requestId, companyId, plan);
      else await rejectUpgradeRequest(requestId);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <div className="p-12 space-y-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-12">
         <div className="p-10 bg-blue-50 text-blue-600 rounded-[2.5rem] shadow-inner"><ArrowUpCircle size={48}/></div>
         <div className="space-y-1">
           <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Migration Audit</h3>
           <p className="text-lg font-medium text-gray-400 italic">Review cluster tier upgrades and verify payments.</p>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-6">ENTITY IDENTITY</th>
              <th className="px-6 py-6 text-center">TARGET TIER</th>
              <th className="px-6 py-6 text-center">UPI REF</th>
              <th className="px-6 py-6 text-right">TOTAL (TAX INCL.)</th>
              <th className="px-10 py-6 text-right">OPERATIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pending.length === 0 ? (
              <tr><td colSpan={5} className="py-24 text-center text-gray-300 font-black uppercase text-xs tracking-widest italic">NO_PENDING_UPGRADES</td></tr>
            ) : pending.map(r => (
              <tr key={r.id} className="hover:bg-gray-50/30 transition-all">
                <td className="px-10 py-6">
                  <p className="font-black text-slate-900 leading-none mb-1.5">{r.companyName}</p>
                  <div className="flex items-center gap-2">
                    <Mail size={10} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 truncate max-w-[120px]">{r.upiEmail || 'HIDDEN'}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="px-4 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">{r.requestedPlan}</span>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{r.upiId || 'CARD_NODE'}</span>
                </td>
                <td className="px-6 py-6 text-right">
                  <p className="text-sm font-black text-blue-600">₹{r.totalAmount.toLocaleString()}</p>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => handleAction(r.id, r.companyId, r.requestedPlan, 'reject')} className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><X size={18}/></button>
                    <button 
                      onClick={() => handleAction(r.id, r.companyId, r.requestedPlan, 'approve')} 
                      disabled={!!isProcessing} 
                      className="px-6 py-2.5 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-xl flex items-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing === r.id ? <Loader2 size={12} className="animate-spin"/> : <ShieldCheck size={12}/>} Authorize
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
