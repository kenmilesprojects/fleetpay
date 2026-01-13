
import React, { useMemo, useState } from 'react';
import { 
  ShieldCheck, Zap, Activity, TrendingUp, Users, Key, X, Building2, User, Mail, Calendar, Smartphone, Fingerprint, Lock, Unlock, ShieldAlert, Copy, Check
} from 'lucide-react';
import { CompanyDetails } from '../../types';
import { AdminRegistry } from './AdminRegistry';
import { AdminProvisioning } from './AdminProvisioning';
import { AdminUpgrades } from './AdminUpgrades';
import { AdminAudits } from './AdminAudits';
import { AdminResetKey } from './AdminResetKey';
import { AdminResetPass } from './AdminResetPass';

interface AdminPanelProps {
  db: any;
  onRefresh: () => void;
  activeTab: 'registry' | 'provisioning' | 'upgrades' | 'audits' | 'reset-key' | 'reset-pass';
}

export const AdminPanel = ({ db, onRefresh, activeTab }: AdminPanelProps) => {
  const [provisionedCreds, setProvisionedCreds] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<CompanyDetails | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = useMemo(() => {
    const companies = db?.companies || [];
    const drivers = db?.drivers || [];
    const totalDrivers = drivers.filter((d: any) => d.isActive).length;
    const mrr = companies.reduce((acc: number, c: any) => {
      if (c.status === 'suspended') return acc;
      if (c.plan === 'Pro Cluster') return acc + 149;
      if (c.plan === 'Elite Network') return acc + 299;
      if (c.plan === 'Enterprise') return acc + 499;
      return acc;
    }, 0);

    return { 
      totalCompanies: companies.length, 
      totalDrivers, 
      mrr, 
      pendingCount: (db?.pendingRequests || []).length, 
      settlementCount: (db?.settlementRequests || []).filter((s: any) => s.status === 'pending').length, 
      upgradeCount: (db?.upgradeRequests || []).filter((u: any) => u.status === 'pending').length 
    };
  }, [db]);

  const workspacesCount = useMemo(() => {
    if (!selectedAccount) return 0;
    return db.workspaces.filter((w: any) => w.companyId === selectedAccount.id).length;
  }, [selectedAccount, db.workspaces]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="relative p-12 bg-slate-900 rounded-[3.5rem] overflow-hidden shadow-3xl border border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none">Network <span className="text-indigo-400">Hub</span></h1>
            <p className="text-slate-400 font-medium max-w-sm">Global hub-node provisioning control for FleetOps360.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
             <PulseStat label="Est. MRR" value={`₹${(stats.mrr || 0).toLocaleString()}`} icon={<TrendingUp size={16}/>} />
             <PulseStat label="Personnel" value={stats.totalDrivers || 0} icon={<Users size={16}/>} />
             <PulseStat label="Queue" value={(stats.pendingCount || 0) + (stats.settlementCount || 0) + (stats.upgradeCount || 0)} icon={<Activity size={16}/>} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-3xl overflow-hidden min-h-[500px]">
        {activeTab === 'registry' && (
          <AdminRegistry accounts={db.companies || []} onRefresh={onRefresh} onSelect={setSelectedAccount} />
        )}
        {activeTab === 'provisioning' && (
          <AdminProvisioning requests={db.pendingRequests || []} onRefresh={onRefresh} onSuccess={setProvisionedCreds} />
        )}
        {activeTab === 'upgrades' && <AdminUpgrades requests={db.upgradeRequests || []} onRefresh={onRefresh} />}
        {activeTab === 'audits' && <AdminAudits requests={db.settlementRequests || []} onRefresh={onRefresh} />}
        {activeTab === 'reset-key' && <AdminResetKey accounts={db.companies || []} onRefresh={onRefresh} />}
        {activeTab === 'reset-pass' && <AdminResetPass accounts={db.companies || []} onRefresh={onRefresh} />}
      </div>

      {provisionedCreds && (
        <div className="fixed inset-0 bg-[#F8FAFC]/98 backdrop-blur-2xl flex items-center justify-center z-[5000] p-4 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-[500px] rounded-[4rem] p-8 md:p-12 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-100 relative overflow-hidden flex flex-col items-center">
             
             {/* Icon Header */}
             <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-10 shadow-sm">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md">
                   <ShieldCheck size={28} className="text-[#10B981]" />
                </div>
             </div>

             {/* Provisioned Title (Stacked & Italic) */}
             <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-10 tracking-tight leading-[0.9] uppercase italic flex flex-col items-center italic-heavy">
                <span>NODE</span>
                <span>PROVISIONED</span>
             </h2>
             
             {/* Sub Cards */}
             <div className="w-full grid grid-cols-2 gap-4 mb-10">
                <div className="p-6 bg-white rounded-[2rem] border border-slate-50 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col items-start text-left overflow-hidden min-h-[120px]">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">IDENTITY ENDPOINT</p>
                   <p className="text-lg md:text-xl font-black text-[#2563EB] tracking-tighter uppercase break-all leading-tight w-full">
                      {provisionedCreds.username}
                   </p>
                </div>
                <div className="p-6 bg-white rounded-[2rem] border border-slate-50 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col items-start text-left overflow-hidden min-h-[120px]">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">CLIENT CUS_ID</p>
                   <p className="text-lg md:text-xl font-black text-[#0F172A] tracking-tighter uppercase leading-tight w-full">
                      {provisionedCreds.cusId}
                   </p>
                </div>
             </div>

             {/* Vault Passkey Card */}
             <div className="w-full p-8 bg-[#0F172A] rounded-[2.5rem] text-white shadow-3xl relative overflow-hidden flex flex-col items-center group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 to-transparent pointer-events-none"></div>
                
                <p className="relative z-10 text-[9px] font-black text-[#6366F1] uppercase tracking-[0.3em] mb-8">AUTHORIZED MASTER ACCESS KEY</p>
                
                <div className="relative z-10 w-full flex items-center justify-center gap-3 bg-white/5 py-6 px-4 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md group-hover:bg-white/10 transition-all">
                  <p className="text-3xl md:text-5xl font-black font-mono tracking-[0.3em] text-white uppercase select-all text-center leading-none flex-1 truncate">
                     {provisionedCreds.pass}
                  </p>
                  <button 
                    onClick={() => handleCopyKey(provisionedCreds.pass)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-indigo-300 flex-shrink-0"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 opacity-60">
                   <Lock size={12} />
                   <p className="text-[7px] font-black uppercase tracking-[0.25em]">ONE-TIME GENERATION • SECURED VIA RSA-4096</p>
                </div>
             </div>
             
             {/* Final Action Button */}
             <button 
                onClick={() => setProvisionedCreds(null)} 
                className="w-full mt-10 py-6 bg-[#2563EB] text-white rounded-full font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:bg-[#1D4ED8] hover:translate-y-[-1px] active:scale-95 transition-all"
             >
                SYNCHRONIZE HUB NODE
             </button>
          </div>
        </div>
      )}

      {selectedAccount && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-4xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl transition-transform hover:rotate-6"><Building2 size={32}/></div>
                    <div>
                       <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedAccount.owner}</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REGISTRY_NODE: {selectedAccount.username}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedAccount(null)} className="p-4 bg-white text-slate-400 hover:text-rose-600 rounded-full transition-all shadow-md"><X size={24}/></button>
              </div>
              <div className="p-12 space-y-12">
                 <div className="grid grid-cols-2 gap-10">
                    <DetailField icon={<User size={14}/>} label="Fleet Master" value={selectedAccount.owner} />
                    <DetailField icon={<Fingerprint size={14}/>} label="CUS ID Node" value={selectedAccount.cusId || 'MOCK-ID'} />
                    <DetailField icon={<Mail size={14}/>} label="Registry Email" value={selectedAccount.email} />
                    <DetailField icon={<Zap size={14}/>} label="Active Tier" value={selectedAccount.plan} />
                    <DetailField icon={<Calendar size={14}/>} label="Plan Term" value={`${selectedAccount.planDuration || 1} Months`} />
                    <DetailField icon={<Activity size={14}/>} label="Deployment Date" value={selectedAccount.startDate || 'LEGACY_NODE'} />
                    <DetailField icon={<Smartphone size={14}/>} label="Total Workshops" value={`${workspacesCount} Endpoints`} />
                 </div>
                 
                 <div className="p-10 bg-slate-900 rounded-[3rem] border border-white/10 space-y-6 shadow-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-center pt-6 border-t border-white/5 relative z-10">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status Indicators</p>
                          <div className="flex gap-4">
                             <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${selectedAccount.isLocked ? 'bg-rose-600 text-white' : 'bg-emerald-50 text-white'}`}>
                                {selectedAccount.isLocked ? 'LOCKED' : 'UNLOCKED'}
                             </span>
                             <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${selectedAccount.status === 'suspended' ? 'bg-slate-700 text-white' : 'bg-blue-600 text-white'}`}>
                                {selectedAccount.status === 'suspended' ? 'BLOCKED' : 'ACTIVE'}
                             </span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Recovery Token</p>
                          <p className="text-xl font-mono font-black text-indigo-400 tracking-widest">{selectedAccount.recoveryCode || 'NONE'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-6">
                    <button onClick={() => setSelectedAccount(null)} className="w-full py-7 bg-slate-50 text-slate-400 rounded-[2.2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">Dismiss Details</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const DetailField = ({ icon, label, value }: any) => (
  <div className="space-y-1.5 group">
     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none flex items-center gap-2">
        {icon} {label}
     </p>
     <p className="text-base font-black text-slate-900 tracking-tight leading-tight">{value}</p>
  </div>
);

const PulseStat = ({ label, value, icon }: any) => (
  <div className={`p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl`}>
    <div className="flex items-center gap-3 mb-4 opacity-50 text-white font-black text-[10px] uppercase tracking-widest">{icon} {label}</div>
    <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
  </div>
);
