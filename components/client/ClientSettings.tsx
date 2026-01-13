
import React, { useState, useEffect } from 'react';
import { getActiveAccount, getActiveWorkspace, updateAccountByUsername, saveWorkspace, getCurrencySymbol, getActiveSettings } from '../../db';
import { 
  Building2, Globe, Loader2, Save, User, ChevronRight, Fingerprint, 
  ShieldCheck, Lock, Key, Smartphone, Layers, AlertCircle, RefreshCw,
  BellRing, BadgePercent, Database, HardDrive, History
} from 'lucide-react';
import { Manager, AppSettings } from '../../types';

interface ClientSettingsProps {
  db: any;
  onRefresh: (newActiveWsId?: string) => Promise<void>;
  userRole?: 'superadmin' | 'user' | 'manager';
  managerData?: Manager | null;
}

export const ClientSettings: React.FC<ClientSettingsProps> = ({ db, onRefresh }) => {
  const activeAccount = getActiveAccount(db);
  const activeWorkspace = getActiveWorkspace(db);
  const activeSettings = getActiveSettings(db);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'hub' | 'backups'>('profile');

  const [localProfile, setLocalProfile] = useState({ name: '', address: '', phone: '' });
  const [localCompany, setLocalCompany] = useState({ name: '', owner: '', phone: '', email: '', password: '' });
  const [localSettings, setLocalSettings] = useState<AppSettings>({
    workspaceId: '',
    calcType: 'prorated',
    currency: 'INR',
    paymentTypes: [],
    alertLicenseExpiry: true,
    alertInsuranceExpiry: true
  });

  useEffect(() => {
    if (activeWorkspace) {
      setLocalProfile({ 
        name: activeWorkspace.name || '', 
        address: activeWorkspace.address || '', 
        phone: activeWorkspace.phone || '' 
      });
    }
    if (activeAccount) {
      setLocalCompany({ 
        name: activeAccount.name || '', 
        owner: activeAccount.owner || '', 
        phone: activeAccount.phone || '', 
        email: activeAccount.email || '', 
        password: activeAccount.password || '' 
      });
    }
    if (activeSettings) {
      setLocalSettings(activeSettings);
    }
  }, [activeWorkspace?.id, activeAccount?.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveWorkspace({ ...activeWorkspace, ...localProfile });
      await updateAccountByUsername(activeAccount.username, localCompany);
      // Logic for saving settings here...
      await onRefresh();
      alert('Hub Configuration Synchronized.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const backupPolicies: Record<string, string> = {
    'Basic Hub': 'No Cloud Backups',
    'Pro Cluster': 'Monthly Cloud Snapshots',
    'Elite Network': '7-Day Rolling Backups',
    'Enterprise': 'Daily Real-time Replication'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Hub Configuration</h1>
          <p className="text-slate-400 font-medium italic">Manage node identity, economics, and data integrity.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
           {(['profile', 'security', 'hub', 'backups'] as const).map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <form onSubmit={handleUpdate} className="p-8 md:p-12 space-y-12">
          
          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <SectionHeader icon={Building2} title="Company Hub" color="text-blue-600" />
                  <Input label="Company Name" value={localCompany.name} onChange={(v:string)=>setLocalCompany({...localCompany, name:v})} />
                  <Input label="Owner / Fleet Master" value={localCompany.owner} onChange={(v:string)=>setLocalCompany({...localCompany, owner:v})} />
                  <Input label="Registered Mobile" value={localCompany.phone} onChange={(v:string)=>setLocalCompany({...localCompany, phone:v})} />
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Permanent Identity Node</p>
                     <p className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                       {activeAccount.cusId || 'MOCK-ID-492'} <Fingerprint size={16} className="text-blue-500" />
                     </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <SectionHeader icon={Globe} title="Regional Workshop" color="text-emerald-600" />
                  <Input label="Workshop Alias" value={localProfile.name} onChange={(v:string)=>setLocalProfile({...localProfile, name:v})} />
                  <Input label="Geo-Location / Address" value={localProfile.address} onChange={(v:string)=>setLocalProfile({...localProfile, address:v})} />
                  <Input label="Hub Contact" value={localProfile.phone} onChange={(v:string)=>setLocalProfile({...localProfile, phone:v})} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hub' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <SectionHeader icon={BadgePercent} title="Hub Economics" color="text-amber-600" />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Hub Currency</label>
                    <select className="w-full py-5 px-8 rounded-[2rem] font-bold text-sm bg-gray-50 border-2 border-gray-100 outline-none focus:border-blue-500 transition-all shadow-inner" value={localSettings.currency} onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})}>
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">Pound (£)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-3">Calculation Logic</label>
                    <select className="w-full py-5 px-8 rounded-[2rem] font-bold text-sm bg-gray-50 border-2 border-gray-100 outline-none focus:border-blue-500 transition-all shadow-inner" value={localSettings.calcType} onChange={(e) => setLocalSettings({...localSettings, calcType: e.target.value as any})}>
                      <option value="prorated">Prorated (Days Worked)</option>
                      <option value="monthly">Fixed Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-6">
                  <SectionHeader icon={BellRing} title="Advance Alerts" color="text-rose-600" />
                  <ToggleOption 
                    label="License Expiry Warning" 
                    desc="Notify 15 days before driver license expiration."
                    active={localSettings.alertLicenseExpiry}
                    onClick={() => setLocalSettings({...localSettings, alertLicenseExpiry: !localSettings.alertLicenseExpiry})}
                  />
                  <ToggleOption 
                    label="Insurance Policy Alerts" 
                    desc="Warn when truck insurance is nearing audit date."
                    active={localSettings.alertInsuranceExpiry}
                    onClick={() => setLocalSettings({...localSettings, alertInsuranceExpiry: !localSettings.alertInsuranceExpiry})}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-2 duration-300">
               <SectionHeader icon={Lock} title="Security Vault" color="text-slate-900" />
               <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Master Recovery Token</p>
                     <p className="text-3xl font-mono font-black tracking-[0.2em]">{activeAccount.recoveryCode || 'NONE-SET'}</p>
                     <p className="text-[9px] font-medium text-slate-500 italic">This token is permanent and cannot be modified.</p>
                  </div>
                  <div className="h-px bg-white/5"></div>
                  <Input label="Modify Hub Access Key (Password)" type="password" value={localCompany.password} onChange={(v:string)=>setLocalCompany({...localCompany, password:v})} dark />
               </div>
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 bg-indigo-50 border-2 border-indigo-100 rounded-[3rem] space-y-6">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                        <Database size={32} />
                     </div>
                     <div>
                        <h4 className="text-2xl font-black text-indigo-900 tracking-tight">Cloud Backup Status</h4>
                        <p className="text-sm font-medium text-indigo-400 italic mt-2">{backupPolicies[activeAccount.plan] || 'Unknown'}</p>
                     </div>
                  </div>
                  <div className="p-10 bg-blue-50 border-2 border-blue-100 rounded-[3rem] space-y-6">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <History size={32} />
                     </div>
                     <div>
                        <h4 className="text-2xl font-black text-blue-900 tracking-tight">Active Workspaces</h4>
                        <p className="text-sm font-medium text-blue-400 italic mt-2">Currently managing {db.workspaces.filter((w:any)=>w.companyId === activeAccount.id).length} operating nodes.</p>
                     </div>
                  </div>
               </div>
               
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Workspace Registry</h3>
                  <div className="space-y-4">
                     {db.workspaces.filter((w:any)=>w.companyId === activeAccount.id).map((ws: any) => (
                       <div key={ws.id} className="p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center font-black text-xs uppercase">WS</div>
                             <div>
                                <p className="font-black text-slate-800 text-sm">{ws.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{ws.id.slice(0, 12)}...</p>
                             </div>
                          </div>
                          <button onClick={() => onRefresh(ws.id)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${db.activeWorkspaceId === ws.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-slate-400 hover:text-slate-600'}`}>
                             {db.activeWorkspaceId === ws.id ? 'Current Node' : 'Switch Node'}
                          </button>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          <div className="pt-10 flex flex-col md:flex-row items-center gap-8 border-t border-gray-50">
            <button type="submit" disabled={isSaving} className="w-full md:w-auto px-16 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-4xl flex items-center justify-center gap-4 transition-all hover:bg-blue-600 active:scale-95">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20}/>} Commit Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, color }: any) => (
  <div className="flex items-center gap-4 mb-2">
    <div className={`p-3 bg-white rounded-2xl shadow-inner ${color}`}>
      <Icon size={24} />
    </div>
    <h3 className={`text-xl font-black tracking-tight ${color}`}>{title}</h3>
  </div>
);

const ToggleOption = ({ label, desc, active, onClick }: any) => (
  <button type="button" onClick={onClick} className="w-full flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group transition-all hover:bg-white">
     <div className="text-left">
        <p className="text-sm font-black text-slate-800 leading-none mb-2">{label}</p>
        <p className="text-[10px] font-medium text-slate-400 italic">{desc}</p>
     </div>
     <div className={`w-14 h-8 rounded-full transition-all relative ${active ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${active ? 'left-7' : 'left-1'}`}></div>
     </div>
  </button>
);

const Input = ({ label, value, onChange, type = "text", dark = false }: any) => (
  <div className="space-y-3">
    <label className={`text-[10px] font-black uppercase tracking-widest ml-3 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
    <input 
      type={type} 
      className={`w-full py-5 px-8 rounded-[2rem] font-bold text-sm outline-none transition-all shadow-inner ${dark ? 'bg-white/5 border-white/10 text-white focus:border-blue-500' : 'bg-gray-50 border-2 border-gray-100 focus:ring-4 focus:ring-blue-100 focus:border-blue-500'}`} 
      value={value || ''} 
      onChange={(e)=>onChange(e.target.value)} 
    />
  </div>
);
