
import React, { useState } from 'react';
import { Zap, Mail, X, Loader2, ShieldCheck, CreditCard, AtSign, Calendar, Lock } from 'lucide-react';
import { PendingRequest } from '../../types';
import { approvePendingRequest, deletePendingRequest, verifySellingKey } from '../../db';

interface AdminProvisioningProps {
  requests: PendingRequest[];
  onRefresh: () => void;
  onSuccess: (creds: any) => void;
}

export const AdminProvisioning: React.FC<AdminProvisioningProps> = ({ requests, onRefresh, onSuccess }) => {
  const [selected, setSelected] = useState<PendingRequest | null>(null);
  const [sellingKeyInput, setSellingKeyInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (r: PendingRequest) => {
    if (!sellingKeyInput) {
      alert("Verification Required: Enter Selling Passkey to authorize deployment.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const isKeyValid = await verifySellingKey(sellingKeyInput);
      if (!isKeyValid) {
        alert("CRITICAL ERROR: Invalid Selling Passkey. Unauthorized provisioning attempt logged.");
        setIsProcessing(false);
        return;
      }

      const creds = await approvePendingRequest(r);
      onSuccess(creds);
      setSelected(null);
      setSellingKeyInput('');
      onRefresh();
    } catch (err: any) { 
      alert("Deployment Failed: " + err.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Permanently discard this provision request?')) return;
    try {
      await deletePendingRequest(id);
      setSelected(null);
      onRefresh();
    } catch (err: any) { 
      alert(err.message); 
    }
  };

  return (
    <div className="p-10 md:p-16 space-y-12 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Provision Queue</h3>
          <p className="text-slate-400 font-medium italic">Authorized verification required for incoming node registry.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-7">HUB_DETAILS</th>
              <th className="px-6 py-7 text-center">PLAN_DEPLOYMENT</th>
              <th className="px-6 py-7 text-center">SETTLEMENT_EMAIL</th>
              <th className="px-10 py-7 text-right">AUDIT_TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr><td colSpan={4} className="py-32 text-center text-slate-200 font-black uppercase text-sm tracking-widest italic">ZERO_PENDING_PROVISIONS</td></tr>
            ) : requests.map((r: any) => (
              <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-blue-50/40 transition-all group cursor-pointer">
                 <td className="px-10 py-7">
                    <p className="font-black text-slate-900 text-lg leading-none mb-2 uppercase tracking-tight">{r.businessName}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">@{r.username}</p>
                 </td>
                 <td className="px-6 py-7 text-center">
                    <div className="flex flex-col items-center gap-1">
                       <span className="px-4 py-1 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">{r.plan}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10}/> {r.durationMonths} MO</span>
                    </div>
                 </td>
                 <td className="px-6 py-7 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                       <AtSign size={14} />
                       <span className="text-[11px] font-black lowercase tracking-tight">{r.upiEmail || 'NONE'}</span>
                    </div>
                 </td>
                 <td className="px-10 py-7 text-right">
                    <p className="text-2xl font-black text-blue-600 tracking-tighter">₹{(r.finalAmount || 0).toLocaleString()}</p>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
              <div className="p-12 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <h4 className="text-4xl font-black text-slate-900 tracking-tighter">Audit Node Provision</h4>
                 <button onClick={() => {setSelected(null); setSellingKeyInput('');}} className="p-4 bg-white text-slate-400 hover:text-rose-600 rounded-full shadow-md"><X size={24}/></button>
              </div>
              <div className="p-12 space-y-12">
                 <div className="grid grid-cols-2 gap-10">
                    <AuditField label="Owner" value={selected.ownerName} />
                    <AuditField label="Deployment Plan" value={selected.plan} />
                    <AuditField label="Commitment" value={`${selected.durationMonths} Months`} />
                    <AuditField label="Settlement UPI ID" value={selected.upiId || 'MANUAL_DEPOSIT'} />
                    <AuditField label="Verification Email" value={selected.upiEmail || 'UNSPECIFIED'} />
                    <AuditField label="Starting Date" value={new Date().toLocaleDateString()} />
                 </div>
                 
                 <div className="p-10 bg-slate-900 rounded-[3rem] border border-white/10 space-y-8 shadow-3xl relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-6">
                       <p className="text-lg font-black text-white uppercase tracking-widest">Audit Settlement</p>
                       <p className="text-5xl font-black text-blue-400 tracking-tighter">₹{selected.finalAmount.toLocaleString()}</p>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-widest ml-4">
                          <Lock size={12} /> Selling Passkey Required
                       </div>
                       <input 
                         type="password" 
                         placeholder="ENTER MASTER SELLING KEY"
                         className="w-full px-8 py-5 bg-white/5 border-2 border-white/10 rounded-[2rem] outline-none font-black text-sm text-indigo-400 tracking-[0.4em] focus:border-blue-500 transition-all text-center placeholder:tracking-normal placeholder:text-slate-600"
                         value={sellingKeyInput}
                         onChange={(e) => setSellingKeyInput(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="flex gap-6">
                    <button onClick={() => handleReject(selected.id)} className="flex-1 py-7 bg-slate-50 text-slate-400 rounded-[2.2rem] font-black text-xs uppercase tracking-widest border border-slate-100">Reject Request</button>
                    <button onClick={() => handleApprove(selected)} disabled={isProcessing} className="flex-[2] py-7 bg-blue-600 text-white rounded-[2.2rem] font-black text-xs uppercase tracking-[0.25em] shadow-4xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 group active:scale-95">
                       {isProcessing ? <Loader2 className="animate-spin" size={24}/> : <ShieldCheck size={24}/>}
                       Authorize Deployment
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const AuditField = ({ label, value }: any) => (
  <div className="space-y-1.5 group">
     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{label}</p>
     <p className="text-base font-black text-slate-900 tracking-tight leading-tight">{value}</p>
  </div>
);
