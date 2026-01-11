
import React, { useMemo, useState } from 'react';
import { updateAccountByEmail, deleteAccountByEmail, approvePendingRequest, deletePendingRequest, provisionCompany, approveSettlementRequest, rejectSettlementRequest, approveUpgradeRequest, rejectUpgradeRequest } from '../db';
import { 
  ShieldCheck, Building2, Search, Lock, Unlock, Plus, 
  Clock, Check, X, Key, Trash2, Loader2,
  ChevronDown, CreditCard, Zap, CheckCircle2, Layers, Fingerprint, Activity, TrendingUp, Users, Globe, ShieldAlert, Laptop, Mail, ArrowUpCircle
} from 'lucide-react';
import { CompanyDetails, PlanTier, PendingRequest, SettlementRequest, UpgradeRequest } from '../types';

interface AdminPanelProps {
  db: any;
  onRefresh: () => void;
}

export const AdminPanel = ({ db, onRefresh }: AdminPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'approvals' | 'settlements' | 'upgrades'>('accounts');
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [provisionedCreds, setProvisionedCreds] = useState<{email: string, pass: string, recovery: string, business: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '',
    owner: '',
    email: '',
    plan: 'Starter' as PlanTier
  });

  const stats = useMemo(() => {
    const totalCompanies = db?.companies?.length || 0;
    const totalDrivers = db?.drivers?.filter((d: any) => d.isActive).length || 0;
    const totalNodes = db?.workspaces?.length || 0;
    
    const mrr = db?.companies?.reduce((acc: number, c: any) => {
      if (c.status === 'suspended') return acc;
      if (c.plan === 'Starter') return acc + 49;
      if (c.plan === 'Enterprise') return acc + 199;
      return acc;
    }, 0) || 0;

    const pendingCount = db?.pendingRequests?.length || 0;
    const settlementCount = db?.settlementRequests?.filter((s: SettlementRequest) => s.status === 'pending').length || 0;
    const upgradeCount = db?.upgradeRequests?.filter((u: UpgradeRequest) => u.status === 'pending').length || 0;

    return { totalCompanies, totalDrivers, totalNodes, mrr, pendingCount, settlementCount, upgradeCount };
  }, [db]);

  const groupedAccounts = useMemo(() => {
    const accountsMap: Record<string, { email: string, owner: string, nodes: any[], status: string, isLocked: boolean, plan: string, id: string }> = {};
    
    (db?.companies || []).forEach((company: CompanyDetails) => {
      const email = company.email.toLowerCase();
      accountsMap[email] = {
        id: company.id,
        email,
        owner: company.owner,
        nodes: (db?.workspaces || []).filter((w: any) => w.companyId === company.id),
        status: company.status,
        isLocked: company.isLocked,
        plan: company.plan
      };
    });

    return Object.values(accountsMap).filter(acc => 
      acc.email.includes(searchTerm.toLowerCase()) || 
      acc.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.nodes.some(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [db, searchTerm]);

  const handleAccountStatus = async (email: string, status: 'active' | 'suspended') => {
    setIsProcessing(true);
    try {
      await updateAccountByEmail(email, { status });
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleAccountLock = async (email: string, isLocked: boolean) => {
    setIsProcessing(true);
    try {
      await updateAccountByEmail(email, { isLocked });
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleAccountPassword = async (email: string) => {
    const pass = prompt("Synchronize new Master Password for this account:");
    if (!pass) return;
    setIsProcessing(true);
    try {
      await updateAccountByEmail(email, { password: pass });
      onRefresh();
      alert(`Master security token updated for ${email}.`);
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteAccount = async (email: string) => {
    if (!confirm(`DANGER: This permanently removes the Parent Account and ALL its workshop nodes. Proceed?`)) return;
    setIsProcessing(true);
    try {
      await deleteAccountByEmail(email);
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleApproveSettlement = async (request: SettlementRequest) => {
    setIsProcessing(true);
    try {
      await approveSettlementRequest(request.id, request.companyId);
      onRefresh();
      alert(`Settlement verified. Account status: UNLOCKED.`);
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleApproveUpgrade = async (request: UpgradeRequest) => {
    setIsProcessing(true);
    try {
      await approveUpgradeRequest(request.id, request.companyId, request.requestedPlan);
      onRefresh();
      alert(`Upgrade verified. Account migrated to ${request.requestedPlan} Tier.`);
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  const handleApproveRequest = async (request: PendingRequest) => {
    setIsProcessing(true);
    try {
      const creds = await approvePendingRequest(request);
      setProvisionedCreds(creds);
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-10">
      {/* Platform Pulsar Stats */}
      <div className="relative p-12 bg-slate-950 rounded-[4rem] overflow-hidden shadow-3xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/10 rounded-full -mr-48 -mt-48 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full -ml-48 -mb-48 blur-[100px]"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/10">
              <ShieldCheck size={14} className="animate-pulse" /> Platform Admin Master Control
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-tight">
              Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-500">Core</span>
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed">Infrastructure-level observability and cluster provisioning.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
             <PulseStat label="Platform MRR" value={`$${stats.mrr.toLocaleString()}`} icon={<TrendingUp size={16}/>} color="emerald" />
             <PulseStat label="Global Crew" value={stats.totalDrivers} icon={<Users size={16}/>} color="blue" />
             <PulseStat label="Workshop Nodes" value={stats.totalNodes} icon={<Globe size={16}/>} color="indigo" />
             <PulseStat label="Sys Alerts" value={stats.pendingCount + stats.settlementCount + stats.upgradeCount} icon={<Activity size={16}/>} color="rose" />
          </div>
        </div>
      </div>

      {/* Controller Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-wrap p-2 bg-slate-900/5 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 shadow-inner">
          <TabBtn active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} label="Parent Clusters" icon={<Layers size={14}/>} />
          <TabBtn active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} label="Provisioning" count={stats.pendingCount} icon={<Zap size={14}/>} />
          <TabBtn active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} label="Upgrade Queue" count={stats.upgradeCount} icon={<ArrowUpCircle size={14}/>} />
          <TabBtn active={activeTab === 'settlements'} onClick={() => setActiveTab('settlements')} label="Ledger Proofs" count={stats.settlementCount} color="amber" icon={<CreditCard size={14}/>} />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex-1 md:w-72 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                placeholder="Find registry entry..." 
                className="w-full pl-14 pr-8 py-4 bg-white border border-slate-200 rounded-[2rem] font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button 
             onClick={() => setIsAddingClient(true)}
             className="px-10 py-4 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3 transform hover:translate-y-[-2px]"
           >
             <Plus size={20} /> Provision New
           </button>
        </div>
      </div>

      {/* Central Registry Table */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-3xl shadow-slate-200/40 overflow-hidden">
        {activeTab === 'accounts' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  <th className="px-12 py-10">Account Identity</th>
                  <th className="px-6 py-10 text-center">Infrastructure</th>
                  <th className="px-6 py-10 text-center">Service Status</th>
                  <th className="px-6 py-10 text-center">Finance Lock</th>
                  <th className="px-12 py-10 text-right">Registry Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupedAccounts.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest">No matching registry entries found.</td></tr>
                ) : groupedAccounts.map(account => (
                  <React.Fragment key={account.email}>
                    <tr className={`hover:bg-slate-50/50 transition-colors ${account.status === 'suspended' ? 'bg-rose-50/10' : ''}`}>
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black italic text-2xl shadow-inner ${account.status === 'suspended' ? 'bg-rose-100 text-rose-600' : 'bg-slate-950 text-white'}`}>
                            {account.owner.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-xl leading-none mb-2 tracking-tight">{account.owner}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <Mail size={10} className="text-slate-300" /> {account.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-10 text-center">
                        <button 
                          onClick={() => setExpandedAccount(expandedAccount === account.email ? null : account.email)}
                          className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 mx-auto ${expandedAccount === account.email ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white'}`}
                        >
                          <Layers size={14}/> {account.nodes.length} Workshops
                        </button>
                      </td>
                      <td className="px-6 py-10 text-center">
                        <StatusSelect 
                          val={account.status} 
                          options={['active', 'suspended']} 
                          onChange={(v:any) => handleAccountStatus(account.email, v as any)} 
                          color={account.status === 'suspended' ? 'rose' : 'emerald'}
                        />
                      </td>
                      <td className="px-6 py-10 text-center">
                         <StatusSelect 
                          val={account.isLocked ? 'locked' : 'open'} 
                          options={['open', 'locked']} 
                          onChange={(v:any) => handleAccountLock(account.email, v === 'locked')} 
                          color={account.isLocked ? 'amber' : 'blue'}
                        />
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="flex justify-end gap-3">
                           <RegistryBtn icon={<Key size={18}/>} onClick={() => handleAccountPassword(account.email)} color="indigo" />
                           <RegistryBtn icon={<Trash2 size={18}/>} onClick={() => handleDeleteAccount(account.email)} color="rose" />
                        </div>
                      </td>
                    </tr>
                    {expandedAccount === account.email && (
                       <tr className="bg-slate-50/50 animate-in slide-in-from-top duration-300">
                          <td colSpan={5} className="px-24 py-12 border-l-8 border-indigo-600">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm"><Globe size={18}/></div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Node Registry</p>
                                   <h5 className="text-lg font-black text-slate-900 tracking-tight">{account.owner}'s Workshop Fleet</h5>
                                </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {account.nodes.length === 0 ? <p className="text-xs font-bold text-slate-400 italic">No node endpoints mapped to this account.</p> : account.nodes.map((node: any) => (
                                  <div key={node.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:translate-y-[-4px] transition-all">
                                     <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><Building2 size={24}/></div>
                                        <div>
                                           <p className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{node.name}</p>
                                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{node.id.slice(0, 18)}...</p>
                                        </div>
                                     </div>
                                     <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[9px] font-black px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">CONNECTED</span>
                                        <button className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-colors">Manage Node</button>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </td>
                       </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'approvals' ? (
           <div className="p-12 space-y-10 animate-in fade-in duration-500">
              <Header title="Provision Queue" sub="Verification of incoming business node requests." icon={<Clock size={32}/>} />
              {stats.pendingCount === 0 ? <EmptyState msg="Operational queue clear." /> : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {db.pendingRequests.map((r: any) => (
                       <ProvisionCard 
                        key={r.id} 
                        request={r} 
                        onApprove={() => handleApproveRequest(r)} 
                        onReject={() => deletePendingRequest(r.id).then(onRefresh)} 
                       />
                    ))}
                 </div>
              )}
           </div>
        ) : activeTab === 'upgrades' ? (
          <div className="p-12 space-y-10 animate-in fade-in duration-500">
             <Header title="Upgrade Authorization" sub="Verify and finalize tier migrations." icon={<ArrowUpCircle size={32}/>} color="text-indigo-600" />
             {stats.upgradeCount === 0 ? <EmptyState msg="No plan migrations in the pipeline." /> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   {db.upgradeRequests.filter((u: any) => u.status === 'pending').map((u: any) => (
                      <UpgradeCard 
                        key={u.id} 
                        request={u} 
                        onApprove={() => handleApproveUpgrade(u)} 
                        onReject={() => rejectUpgradeRequest(u.id).then(onRefresh)} 
                      />
                   ))}
                </div>
             )}
          </div>
        ) : (
          <div className="p-12 space-y-10 animate-in fade-in duration-500">
             <Header title="Ledger Audit" sub="Verification of manual financial settlement proofs." icon={<CreditCard size={32}/>} color="text-amber-500" />
             {stats.settlementCount === 0 ? <EmptyState msg="No financial settlements pending verification." /> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   {db.settlementRequests.filter((s: any) => s.status === 'pending').map((s: any) => (
                      <AuditCard 
                        key={s.id} 
                        request={s} 
                        onApprove={() => handleApproveSettlement(s)} 
                        onReject={() => rejectSettlementRequest(s.id).then(onRefresh)} 
                      />
                   ))}
                </div>
             )}
          </div>
        )}
      </div>

      {provisionedCreds && (
        <RegistryCredentialPopup creds={provisionedCreds} onClose={() => setProvisionedCreds(null)} />
      )}

      {isAddingClient && (
         <AddProvisionPopup 
          data={newClient} 
          setData={setNewClient} 
          onClose={() => setIsAddingClient(false)} 
          onSubmit={async (e:any) => {
            e.preventDefault();
            setIsProcessing(true);
            try {
              const creds = await provisionCompany(newClient);
              setProvisionedCreds(creds);
              setIsAddingClient(false);
              onRefresh();
            } catch (err: any) { alert(err.message); }
            finally { setIsProcessing(false); }
          }} 
          isProcessing={isProcessing}
         />
      )}
    </div>
  );
};

// UI Components
const PulseStat = ({ label, value, icon, color }: any) => {
  const themes: any = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5'
  };
  return (
    <div className={`p-6 rounded-[2rem] border backdrop-blur-md shadow-2xl transition-all hover:translate-y-[-4px] ${themes[color]}`}>
      <div className="flex items-center gap-3 mb-2 opacity-60">
        {icon} <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    </div>
  );
};

const TabBtn = ({ active, onClick, label, count, color = 'blue', icon }: any) => (
  <button 
    onClick={onClick} 
    className={`px-8 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 ${active ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-700'}`}
  >
    {icon} {label} {count !== undefined && count > 0 && <span className={`px-2.5 py-0.5 rounded-lg text-white text-[9px] ${color === 'amber' ? 'bg-amber-500' : 'bg-emerald-600'}`}>{count}</span>}
  </button>
);

const StatusSelect = ({ val, options, onChange, color }: any) => {
  const themes: any = {
    rose: 'bg-rose-900 text-white border-rose-900 focus:ring-rose-200 shadow-rose-900/10',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 focus:ring-emerald-100 shadow-emerald-100/10',
    amber: 'bg-amber-600 text-white border-amber-600 focus:ring-amber-200 shadow-amber-600/10',
    blue: 'bg-blue-50 text-blue-700 border-blue-100 focus:ring-blue-100 shadow-blue-100/10'
  };
  return (
    <div className="relative w-full max-w-[130px] mx-auto group">
      <select 
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-4 pr-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 outline-none appearance-none cursor-pointer transition-all shadow-md group-hover:scale-105 ${themes[color]}`}
      >
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity" size={14} />
    </div>
  );
};

const RegistryBtn = ({ icon, onClick, color }: any) => (
  <button 
    onClick={onClick} 
    className={`p-4 rounded-2xl transition-all shadow-sm ${color === 'rose' ? 'bg-rose-50 text-rose-300 hover:bg-rose-600 hover:text-white' : 'bg-slate-50 text-slate-300 hover:bg-indigo-600 hover:text-white'}`}
  >
    {icon}
  </button>
);

const Header = ({ title, sub, icon, color = "text-indigo-600" }: any) => (
  <div className="flex items-center gap-6">
     <div className={`p-6 bg-slate-50 ${color} rounded-[2.5rem] shadow-inner`}>{icon}</div>
     <div>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">{title}</h3>
        <p className="text-sm font-medium text-slate-400">{sub}</p>
     </div>
  </div>
);

const EmptyState = ({ msg }: any) => (
  <div className="py-24 text-center space-y-6">
    <div className="w-24 h-24 bg-slate-50 text-slate-100 rounded-full flex items-center justify-center mx-auto border-4 border-dashed border-slate-100"><Check size={48} className="animate-in zoom-in duration-500" /></div>
    <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-xs">{msg}</p>
  </div>
);

const ProvisionCard = ({ request, onApprove, onReject }: any) => (
  <div className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:border-emerald-200 transition-all group relative overflow-hidden">
     <div className="absolute top-0 right-0 px-8 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20">{request.plan} Node</div>
     <div className="flex items-center gap-6 mb-10">
        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center font-black italic text-2xl shadow-sm text-slate-300 border border-slate-100">{request.businessName.charAt(0)}</div>
        <div>
           <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{request.businessName}</h4>
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{request.email}</p>
        </div>
     </div>
     <div className="grid grid-cols-2 gap-4">
        <button onClick={onReject} className="py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:text-rose-600 hover:border-rose-200 transition-all">Decline Registry</button>
        <button onClick={onApprove} className="py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 transform active:scale-95"><CheckCircle2 size={16}/> Inject into Network</button>
     </div>
  </div>
);

const UpgradeCard = ({ request, onApprove, onReject }: any) => (
  <div className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:border-indigo-200 transition-all group relative">
     <div className="absolute top-0 right-0 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20">Upgrade Request</div>
     <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 bg-white text-indigo-600 rounded-3xl flex items-center justify-center shadow-sm border border-slate-100"><ArrowUpCircle size={32}/></div>
        <div>
           <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{request.companyName}</h4>
           <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">To: {request.requestedPlan} Plan</p>
        </div>
     </div>
     <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] mb-10 shadow-inner">
        <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Financial Method: {request.paymentMethod}</p>
        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
           {request.paymentMethod === 'UPI' ? `App: ${request.paymentDetails?.upiApp}` : `Card: ${request.paymentDetails?.cardName} (***${request.paymentDetails?.cardNumber?.slice(-4)})`}
        </p>
     </div>
     <div className="grid grid-cols-2 gap-4">
        <button onClick={onReject} className="py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:text-rose-600 hover:border-rose-200 transition-all">Reject Plan</button>
        <button onClick={onApprove} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 transform active:scale-95"><CheckCircle2 size={16}/> Authorize Migration</button>
     </div>
  </div>
);

const AuditCard = ({ request, onApprove, onReject }: any) => (
  <div className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:border-amber-200 transition-all group relative">
     <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 bg-white text-amber-500 rounded-3xl flex items-center justify-center shadow-sm border border-slate-100"><CreditCard size={32}/></div>
        <div>
           <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{request.companyName}</h4>
           <p className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em]">{request.paymentMode} Settlement</p>
        </div>
     </div>
     <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] mb-10 shadow-inner">
        <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Verification Details</p>
        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{request.paymentDetails || 'Generic verification token submitted.'}"</p>
     </div>
     <div className="grid grid-cols-2 gap-4">
        <button onClick={onReject} className="py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:text-rose-600 hover:border-rose-200 transition-all">Reject Proof</button>
        <button onClick={onApprove} className="py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2 transform active:scale-95"><Fingerprint size={16}/> Unlock Registry</button>
     </div>
  </div>
);

const RegistryCredentialPopup = ({ creds, onClose }: any) => (
  <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[500] p-8 animate-in fade-in duration-500">
    <div className="bg-white w-full max-w-xl rounded-[4rem] p-16 text-center shadow-4xl animate-in zoom-in-95 duration-500">
       <div className="w-28 h-28 bg-emerald-50 text-emerald-600 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner"><Key size={48}/></div>
       <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 leading-none">Provision Successful</h2>
       <p className="text-slate-400 font-medium mb-12 max-w-xs mx-auto">Parent node registry complete for <span className="text-indigo-600 font-bold">{creds.business}</span>. Dispatch credentials now.</p>
       
       <div className="space-y-4 mb-12 text-left">
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint Registry</p>
             <p className="text-base font-black text-slate-900">{creds.email}</p>
          </div>
          <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white shadow-xl">
             <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Master Security Access Key</p>
             <p className="text-4xl font-black tracking-[0.3em] font-mono">{creds.pass}</p>
          </div>
       </div>
       <button onClick={onClose} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl hover:bg-emerald-600 transition-all transform active:scale-95">Complete Deployment</button>
    </div>
  </div>
);

const AddProvisionPopup = ({ data, setData, onClose, onSubmit, isProcessing }: any) => (
  <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[400] p-8 animate-in fade-in duration-500">
    <div className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-4xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh]">
       <div className="text-center mb-12">
          <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-3xl shadow-indigo-500/30 transform transition-transform hover:scale-110"><Building2 size={40}/></div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 leading-none">Manual Registry</h2>
          <p className="text-slate-400 font-medium">Injecting new parent enterprise into the core network.</p>
       </div>
       <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
             <Field label="Enterprise Entity" val={data.name} onChange={(v:any) => setData({...data, name:v})} placeholder="Swift Logi-Group" />
             <Field label="Primary Lead" val={data.owner} onChange={(v:any) => setData({...data, owner:v})} placeholder="Alexander Frost" />
          </div>
          <Field label="Identity Registry Email" val={data.email} onChange={(v:any) => setData({...data, email:v})} placeholder="ops@entity.cloud" />
          
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assigned Service Layer</label>
             <div className="grid grid-cols-3 gap-4">
                {['Lite', 'Starter', 'Enterprise'].map(p => (
                   <button 
                    key={p} 
                    type="button" 
                    onClick={() => setData({...data, plan: p})}
                    className={`py-5 rounded-[2rem] font-black text-[10px] uppercase border-2 transition-all shadow-sm ${data.plan === p ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                   >
                     {p}
                   </button>
                ))}
             </div>
          </div>
          
          <div className="flex gap-4 pt-10">
             <button type="button" onClick={onClose} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all">Abort Registry</button>
             <button disabled={isProcessing} type="submit" className="flex-[2] py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-3xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 transform active:scale-95">
                {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>}
                Authorize Deployment
             </button>
          </div>
       </form>
    </div>
  </div>
);

const Field = ({ label, val, onChange, placeholder }: any) => (
  <div className="space-y-3">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{label}</label>
     <input 
      required 
      placeholder={placeholder}
      value={val}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
     />
  </div>
);
