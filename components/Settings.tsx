
import React, { useState, useEffect } from 'react';
import { getActiveWorkspace, getActiveAccount, getActiveSettings, updateWorkspaceSettings, updateAccountByEmail, saveWorkspace, deleteWorkspace, requestSettingsOTP, verifySettingsOTP, submitUpgradeRequest } from '../db';
import { Building2, Lock, Settings as SettingsIcon, CreditCard, UserCog, ShieldCheck, Loader2, Eye, EyeOff, Save, Trash2, Plus, MapPin, Smartphone, Key, ShieldAlert, Fingerprint, Mail, CheckCircle2, User, Phone, Info, Globe, Shield, Smartphone as MobileIcon, CreditCard as CardIcon, ChevronRight, X, AlertCircle } from 'lucide-react';
import { Manager, Workspace, PlanTier } from '../types';

interface SettingsProps {
  db: any;
  onRefresh: () => void;
  userRole?: 'user' | 'manager' | 'superadmin';
  managerData?: Manager | null;
}

export const Settings = ({ db, onRefresh, userRole, managerData }: SettingsProps) => {
  const isManager = userRole === 'manager';
  const activeAccount = getActiveAccount(db);
  const isEnterprise = activeAccount?.plan === 'Enterprise';
  
  const [activeTab, setActiveTab] = useState<'node' | 'company' | 'nodes' | 'logic' | 'billing' | 'security'>(isManager ? 'security' : 'node');
  const [isSaving, setIsSaving] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  
  // Modal states for plan upgrade
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD'>('UPI');
  const [upiApp, setUpiApp] = useState<'GPay' | 'PhonePe' | 'BHIM' | 'Paytm'>('GPay');
  const [cardDetails, setCardDetails] = useState({
    cardName: '',
    cardOnName: '',
    cardNumber: '',
    cvv: '',
    expiry: ''
  });

  // OTP States (Specifically for Recovery Key)
  const [isRecoveryVerified, setIsRecoveryVerified] = useState(false);
  const [isOTPRequested, setIsOTPRequested] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');

  const activeWorkspace = getActiveWorkspace(db);
  const activeSettings = getActiveSettings(db);
  const isLocked = activeAccount?.isLocked;

  const [localProfile, setLocalProfile] = useState({ name: '', address: '', phone: '' });
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  
  const [localCompany, setLocalCompany] = useState({ name: '', owner: '', phone: '', companyAddress: '', email: '', password: '' });
  const [isCompanyDirty, setIsCompanyDirty] = useState(false);
  
  const [newWs, setNewWs] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    if (activeWorkspace) {
      setLocalProfile({ name: activeWorkspace.name || '', address: activeWorkspace.address || '', phone: activeWorkspace.phone || '' });
      setIsProfileDirty(false);
    }
    if (activeAccount) {
      setLocalCompany({ 
        name: activeAccount.name || '', 
        owner: activeAccount.owner || '', 
        phone: activeAccount.phone || '', 
        companyAddress: activeAccount.companyAddress || '',
        email: activeAccount.email || '', 
        password: activeAccount.password || '' 
      });
      setIsCompanyDirty(false);
    }
  }, [activeWorkspace?.id, activeAccount?.id, activeTab]);

  const handleProfileUpdate = async () => {
    if (isLocked) return;
    setIsSaving(true);
    try {
      await saveWorkspace({ ...activeWorkspace, ...localProfile });
      await onRefresh();
      setIsProfileDirty(false);
      alert("Workshop identity updated.");
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleCompanyUpdate = async () => {
    if (isLocked) return;
    setIsSaving(true);
    try {
      await updateAccountByEmail(activeAccount.email, localCompany);
      await onRefresh();
      setIsCompanyDirty(false);
      alert("Company details synchronized.");
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsSaving(true);
    try {
      await submitUpgradeRequest({
        companyId: activeAccount.id,
        companyName: activeAccount.name,
        requestedPlan: selectedPlan,
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'UPI' ? { upiApp } : { ...cardDetails, expiryDate: cardDetails.expiry }
      });
      setIsUpgradeModalOpen(false);
      alert("Upgrade request dispatched to network admin. Awaiting authorization.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestOTP = async () => {
    setIsSaving(true);
    try {
      await requestSettingsOTP(activeAccount.email);
      setIsOTPRequested(true);
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleVerifyOTP = async () => {
    setIsSaving(true);
    setOtpError('');
    const verified = await verifySettingsOTP(otpValue);
    if (verified) {
      setIsRecoveryVerified(true);
    } else {
      setOtpError('Invalid Authorization Token.');
    }
    setIsSaving(false);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!isEnterprise) {
      alert("Multi-node support is available in Enterprise version only.");
      return;
    }
    setIsSaving(true);
    try {
      await saveWorkspace({ companyId: activeAccount.id, ...newWs });
      setNewWs({ name: '', address: '', phone: '' });
      await onRefresh();
      alert("New fleet node activated.");
    } catch (err: any) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (isLocked) return;
    if (db.workspaces.length <= 1) return alert("Account must have at least one active node.");
    if (!confirm("Permanently delete this node?")) return;
    try {
      await deleteWorkspace(id);
      await onRefresh();
    } catch (err: any) { alert(err.message); }
  };

  const handleRestrictedClick = () => {
    alert("This feature is available in Enterprise version only.");
  };

  // Manager Content
  if (isManager) {
    return (
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <div className="w-full md:w-64 space-y-2">
          <TabBtn active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18}/>} label="Staff Access" />
        </div>
        <div className="flex-1 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl relative min-h-[400px]">
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Staff Credentials</h3>
              <p className="text-xs text-gray-400 font-medium">Authentication profile for current manager session.</p>
            </div>
            
            <div className="grid gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Manager ID</label>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-mono text-sm text-gray-600">
                    {managerData?.id}
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Key</label>
                  <div className="relative">
                    <input 
                      disabled 
                      type={showAccessKey ? "text" : "password"} 
                      className="w-full pl-6 pr-16 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm text-gray-600"
                      value={managerData?.password || ''}
                    />
                    <button type="button" onClick={() => setShowAccessKey(!showAccessKey)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300">
                      {showAccessKey ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-start gap-4 mt-10">
               <Info className="text-blue-500 mt-1 flex-shrink-0" size={18} />
               <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-tighter">
                  Contact account owner to modify permissions or reset master credentials.
               </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
      <div className="w-full md:w-64 space-y-2">
        <TabBtn active={activeTab === 'node'} onClick={() => setActiveTab('node')} icon={<Building2 size={18}/>} label="Workshop Profile" />
        <TabBtn active={activeTab === 'company'} onClick={() => setActiveTab('company')} icon={<Globe size={18}/>} label="Company Details" />
        
        {isEnterprise ? (
          <TabBtn active={activeTab === 'nodes'} onClick={() => setActiveTab('nodes')} icon={<MapPin size={18}/>} label="Fleet Cluster" />
        ) : (
          <button onClick={handleRestrictedClick} className="w-full flex items-center justify-between px-6 py-5 rounded-[1.8rem] transition-all group bg-transparent text-slate-300 opacity-60">
             <div className="flex items-center gap-4">
                <MapPin size={18} />
                <span className="text-[11px] font-black uppercase tracking-widest">Fleet Cluster</span>
             </div>
             <Lock size={12} />
          </button>
        )}

        <TabBtn active={activeTab === 'logic'} onClick={() => setActiveTab('logic')} icon={<SettingsIcon size={18}/>} label="Node Logic" />
        <TabBtn active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard size={18}/>} label="Account" />
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl relative min-h-[600px]">
        {isLocked && <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[10px] font-black uppercase flex items-center gap-2 animate-pulse"><ShieldAlert size={14}/> Node Restricted: Settlement Required. Settings Locked.</div>}

        {activeTab === 'node' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Workshop Node Identity</h3>
                  <p className="text-xs text-gray-400 font-medium">Specific operational parameters for this location.</p>
               </div>
               {isProfileDirty && !isLocked && (
                 <button onClick={handleProfileUpdate} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-blue-100">
                   <Save size={14}/> Save Profile
                 </button>
               )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Input disabled={isLocked} label="Node Label" value={localProfile.name} onChange={(v:string) => { setLocalProfile({...localProfile, name:v}); setIsProfileDirty(true); }} placeholder="e.g. Hub North" />
               <Input disabled={isLocked} label="Registry Phone" value={localProfile.phone} onChange={(v:string) => { setLocalProfile({...localProfile, phone:v}); setIsProfileDirty(true); }} placeholder="+00-000-000" />
               <div className="md:col-span-2">
                  <Input disabled={isLocked} label="Physical Node Address" value={localProfile.address} onChange={(v:string) => { setLocalProfile({...localProfile, address:v}); setIsProfileDirty(true); }} placeholder="Full physical address..." />
               </div>
            </div>
            <div className="pt-10 border-t border-gray-50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Fingerprint className="text-blue-400" size={24} />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global ID</p>
                    <p className="text-xs font-mono opacity-80">{activeWorkspace.id}</p>
                  </div>
               </div>
               <span className="text-[9px] font-black px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg">ACTIVE SITE</span>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
               <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Company Repository</h3>
                  <p className="text-xs text-gray-400 font-medium">Global enterprise details and authentication keys.</p>
               </div>
               {isCompanyDirty && !isLocked && (
                 <button onClick={handleCompanyUpdate} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-indigo-100">
                   <Save size={14}/> Save Global Info
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Entity Identity</h4>
                    <div className="grid gap-6">
                       <Input disabled={isLocked} label="Company Legal Name" value={localCompany.name} onChange={(v:string) => { setLocalCompany({...localCompany, name:v}); setIsCompanyDirty(true); }} icon={<Building2 size={16}/>} />
                       <Input disabled={isLocked} label="Account Lead (Owner)" value={localCompany.owner} onChange={(v:string) => { setLocalCompany({...localCompany, owner:v}); setIsCompanyDirty(true); }} icon={<User size={16}/>} />
                       <Input disabled={isLocked} label="Headquarters Address" value={localCompany.companyAddress} onChange={(v:string) => { setLocalCompany({...localCompany, companyAddress:v}); setIsCompanyDirty(true); }} icon={<MapPin size={16}/>} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Contact Registry</h4>
                    <div className="grid gap-6">
                       <Input disabled={isLocked} label="Endpoint Phone" value={localCompany.phone} onChange={(v:string) => { setLocalCompany({...localCompany, phone:v}); setIsCompanyDirty(true); }} icon={<Phone size={16}/>} />
                       <Input label="Identity Email" value={localCompany.email} disabled icon={<Mail size={16}/>} />
                    </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Authentication Keys</h4>
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                       <div className="space-y-8 relative z-10">
                          <div>
                             <Input 
                                disabled={isLocked}
                                label="Master Access Key" 
                                value={localCompany.password} 
                                type={showAccessKey ? "text" : "password"} 
                                onChange={(v:string) => { setLocalCompany({...localCompany, password:v}); setIsCompanyDirty(true); }}
                                theme="dark"
                                icon={<Lock size={16}/>}
                                suffix={
                                  <button type="button" onClick={() => setShowAccessKey(!showAccessKey)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                                    {showAccessKey ? <EyeOff size={18}/> : <Eye size={18}/>}
                                  </button>
                                }
                              />
                          </div>

                          <div className="pt-8 border-t border-white/10">
                             <div className="flex items-center gap-3 mb-4">
                                <Shield className="text-indigo-400" size={14} />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Master Recovery Key</p>
                             </div>

                             {!isRecoveryVerified ? (
                                <div className="space-y-4">
                                   {!isOTPRequested ? (
                                      <button 
                                        onClick={handleRequestOTP}
                                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                      >
                                         <Mail size={14}/> Request OTP to Reveal
                                      </button>
                                   ) : (
                                      <div className="space-y-3">
                                         <input 
                                          type="text" 
                                          placeholder="Enter OTP (123456)" 
                                          maxLength={6}
                                          className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-center font-black tracking-[0.5em] outline-none focus:border-indigo-500"
                                          value={otpValue}
                                          onChange={(e)=>setOtpValue(e.target.value)}
                                         />
                                         {otpError && <p className="text-[10px] text-rose-500 font-bold uppercase text-center">{otpError}</p>}
                                         <button 
                                          onClick={handleVerifyOTP}
                                          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                         >
                                           Verify OTP
                                         </button>
                                      </div>
                                   )}
                                </div>
                             ) : (
                                <div className="p-5 bg-white/5 border border-indigo-500/30 rounded-2xl shadow-inner flex items-center justify-between animate-in zoom-in-95 duration-500">
                                   <span className="text-2xl font-black tracking-widest text-indigo-300 font-mono">
                                      {activeAccount.recoveryCode || "NO_KEY"}
                                   </span>
                                   <CheckCircle2 size={20} className="text-emerald-500" />
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4">
                     <Info className="text-amber-500 mt-1 flex-shrink-0" size={18} />
                     <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tighter">
                        Recovery key is required to bypass account lockdowns. Keep it in a secure physical location.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'nodes' && isEnterprise && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
               <h3 className="text-2xl font-black text-gray-800 tracking-tight">Fleet Cluster Configuration</h3>
               <p className="text-xs text-gray-400 font-medium">Provision and manage individual workshop endpoints.</p>
            </div>
            <div className="grid gap-4">
              {db.workspaces.filter((w: Workspace) => w.companyId === activeAccount.id).map((w: Workspace) => (
                <div key={w.id} className={`p-6 rounded-[2rem] border transition-all flex justify-between items-center group ${w.id === activeWorkspace.id ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-xl'}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${w.id === activeWorkspace.id ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
                       <MapPin size={24}/>
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-lg">{w.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{w.address.slice(0, 50)}...</p>
                    </div>
                  </div>
                  {db.workspaces.length > 1 && !isLocked && (
                    <button onClick={() => handleDeleteWorkspace(w.id)} className="p-4 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                  )}
                  {isLocked && <Lock size={18} className="text-gray-200" />}
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateWorkspace} className={`p-10 bg-indigo-50/20 rounded-[3rem] border-2 border-dashed border-indigo-100 space-y-8 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
               <div className="flex items-center gap-3">
                  <Plus size={20} className="text-indigo-600" />
                  <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">Provision New Deployment Node</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Node Label" value={newWs.name} onChange={(v:any)=>setNewWs({...newWs, name: v})} placeholder="Hub Label" />
                  <Input label="Endpoint Phone" value={newWs.phone} onChange={(v:any)=>setNewWs({...newWs, phone: v})} placeholder="Registry #" />
                  <div className="md:col-span-2">
                     <Input label="Deployment Address" value={newWs.address} onChange={(v:any)=>setNewWs({...newWs, address: v})} placeholder="Full address..." />
                  </div>
                  <button className="md:col-span-2 bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">Authorize & Deploy Site Node</button>
               </div>
            </form>
          </div>
        )}

        {activeTab === 'logic' && (
           <div className="space-y-10 animate-in fade-in duration-500">
             <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Calculation Methodology</h3>
                <p className="text-xs text-gray-400 font-medium">Define payout logic for this hub.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block ml-1">Payroll Strategy</label>
                  <select 
                    disabled={isLocked}
                    className="w-full p-6 bg-gray-50 rounded-[2.5rem] border border-slate-100 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer disabled:opacity-50" 
                    value={activeSettings.calcType} 
                    onChange={(e)=>updateWorkspaceSettings(activeWorkspace.id, { calcType: e.target.value })}
                  >
                     <option value="prorated">Prorated (Service Days)</option>
                     <option value="monthly">Fixed (Flat Monthly)</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block ml-1">Node Currency</label>
                  <input disabled={isLocked} className="w-full px-8 py-6 bg-gray-50 rounded-[2.5rem] border border-slate-100 font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50" value={activeSettings.currency} onChange={(e)=>updateWorkspaceSettings(activeWorkspace.id, { currency: e.target.value.toUpperCase() })} />
                </div>
             </div>
             <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex items-start gap-6">
                <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm"><ShieldCheck size={28}/></div>
                <p className="text-xs text-indigo-700/80 font-medium leading-relaxed uppercase tracking-tighter">Changing strategy will affect all open payroll cycles. Close historical records before migrating logic.</p>
             </div>
           </div>
        )}

        {activeTab === 'billing' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="p-12 bg-slate-950 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-3xl relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-[2000ms]"></div>
                 <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Service Layer</div>
                    <h4 className="text-7xl font-black tracking-tighter leading-none">{activeAccount.plan} Tier</h4>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={18} className="text-emerald-400" />
                       <p className="text-sm font-bold text-slate-400 italic">Connected: {activeAccount.email}</p>
                    </div>
                 </div>
                 <button onClick={() => { setSelectedPlan(null); setIsUpgradeModalOpen(true); }} className="relative z-10 px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-400 hover:text-white transition-all transform active:scale-95">Modify Plan</button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                 <BillingMetric label="Crew Allotment" current={db.drivers.filter((d:any) => d.workspaceId === db.activeWorkspaceId).length} limit={activeAccount.plan === 'Lite' ? 2 : activeAccount.plan === 'Starter' ? 10 : 9999} icon={<UserCog size={20}/>} />
              </div>
           </div>
        )}
      </div>

      {/* Plan Upgrade Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[500] p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-4xl overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-500">
              <button onClick={() => setIsUpgradeModalOpen(false)} className="absolute top-8 right-8 p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all z-10"><X size={24}/></button>
              
              {!selectedPlan ? (
                <div className="p-16 overflow-y-auto">
                   <div className="text-center mb-12">
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Choose Your Service Level</h2>
                      <p className="text-slate-400 font-medium">Select a tier to scale your operational capacity.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <PlanOption current={activeAccount.plan} name="Lite" price="Free" onSelect={() => setSelectedPlan('Lite')} features={['2 Driver Slots', 'Single Hub', 'Basic Ledger']} />
                      <PlanOption current={activeAccount.plan} name="Starter" price="$49" featured onSelect={() => setSelectedPlan('Starter')} features={['10 Driver Slots', 'Multi-Hub support', 'Standard Support']} />
                      <PlanOption current={activeAccount.plan} name="Enterprise" price="$199" onSelect={() => setSelectedPlan('Enterprise')} features={['Unlimited Drivers', 'Infinite Nodes', 'Priority Admin Control']} />
                   </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-full">
                   {/* Left: Summary */}
                   <div className="lg:w-1/3 bg-slate-50 p-12 space-y-10">
                      <div>
                         <button onClick={() => setSelectedPlan(null)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-8"><X size={12}/> Change Plan</button>
                         <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Upgrade Summary</h3>
                         <p className="text-sm font-medium text-slate-400">Review your deployment request.</p>
                      </div>
                      <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected Tier</p>
                         <p className="text-2xl font-black text-indigo-600">{selectedPlan}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-2">Identity Proof Required</p>
                         <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                            <ShieldCheck size={16} className="text-emerald-500" /> Authorized Admin Verification
                         </div>
                      </div>
                      <div className="p-6 bg-indigo-900 rounded-[2.5rem] text-white">
                         <p className="text-xs font-bold leading-relaxed">Upgrade requests are manually verified by network auditors. Plan benefits will be injected into your hub once verified.</p>
                      </div>
                   </div>

                   {/* Right: Payment Flow */}
                   <div className="flex-1 p-12 overflow-y-auto">
                      <div className="mb-10">
                         <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Financial Commitment</h3>
                         <div className="flex gap-4">
                            <button onClick={() => setPaymentMethod('UPI')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${paymentMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 text-slate-400'}`}>
                               <MobileIcon size={16}/> Instant UPI
                            </button>
                            <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${paymentMethod === 'CARD' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 text-slate-400'}`}>
                               <CardIcon size={16}/> Credit/Debit Card
                            </button>
                         </div>
                      </div>

                      <form onSubmit={handleUpgradeRequest} className="space-y-8 animate-in fade-in duration-300">
                         {paymentMethod === 'UPI' ? (
                           <div className="space-y-6">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Choose UPI Endpoint</label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                 {['GPay', 'PhonePe', 'BHIM', 'Paytm'].map(app => (
                                   <button key={app} type="button" onClick={() => setUpiApp(app as any)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${upiApp === app ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}>
                                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-[10px]">{app.charAt(0)}</div>
                                      <span className="text-[9px] font-black uppercase tracking-widest">{app}</span>
                                   </button>
                                 ))}
                              </div>
                              <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex items-center gap-4">
                                 <Smartphone className="text-indigo-600" size={24}/>
                                 <p className="text-xs font-bold text-slate-600">Verification prompt will be sent to your registered mobile number upon request submission.</p>
                              </div>
                           </div>
                         ) : (
                           <div className="space-y-6 animate-in slide-in-from-right duration-300">
                              <Input label="Financial Institution (Card Name)" placeholder="e.g. HDFC Visa Gold" value={cardDetails.cardName} onChange={(v:string)=>setCardDetails({...cardDetails, cardName:v})} icon={<Building2 size={14}/>} />
                              <Input label="Registry Name (Name on Card)" placeholder="HIMANSHU GUPTA" value={cardDetails.cardOnName} onChange={(v:string)=>setCardDetails({...cardDetails, cardOnName:v})} icon={<User size={14}/>} />
                              <Input label="Primary Account Number" placeholder="XXXX XXXX XXXX XXXX" value={cardDetails.cardNumber} onChange={(v:string)=>setCardDetails({...cardDetails, cardNumber:v})} icon={<CardIcon size={14}/>} />
                              <div className="grid grid-cols-2 gap-6">
                                 <Input label="Validation Key (CVV)" placeholder="***" type="password" value={cardDetails.cvv} onChange={(v:string)=>setCardDetails({...cardDetails, cvv:v})} icon={<Lock size={14}/>} />
                                 <Input label="Service Expiry" placeholder="MM/YY" value={cardDetails.expiry} onChange={(v:string)=>setCardDetails({...cardDetails, expiry:v})} icon={<AlertCircle size={14}/>} />
                              </div>
                           </div>
                         )}

                         <button disabled={isSaving} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-3xl hover:bg-emerald-600 transition-all transform active:scale-95 flex items-center justify-center gap-3">
                            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Shield size={20}/>}
                            Dispatch Upgrade Request
                         </button>
                      </form>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

// UI Sub-Components
const PlanOption = ({ name, price, features, featured, onSelect, current }: any) => {
  const isCurrent = current === name;
  return (
    <div className={`p-10 rounded-[3rem] border-2 transition-all flex flex-col h-full ${featured ? 'border-indigo-600 bg-indigo-50 shadow-2xl shadow-indigo-100 relative' : 'border-slate-100 hover:border-slate-200'} ${isCurrent ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}>
       {featured && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full tracking-widest">Recommended</div>}
       <div className="mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{name}</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{price}</p>
       </div>
       <div className="flex-1 space-y-4 mb-10">
          {features.map((f:string) => (
             <div key={f} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs font-bold text-slate-600">{f}</span>
             </div>
          ))}
       </div>
       <button 
        disabled={isCurrent}
        onClick={onSelect} 
        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isCurrent ? 'bg-slate-200 text-slate-400' : (featured ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl' : 'bg-slate-900 text-white hover:bg-black')}`}
       >
          {isCurrent ? 'Current Plan' : 'Choose Plan'}
       </button>
    </div>
  );
};

const BillingMetric = ({ label, current, limit, icon }: any) => (
  <div className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100">
     <div className="flex items-center gap-3 mb-6">
        <div className="text-indigo-600">{icon}</div>
        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{label}</h5>
     </div>
     <div className="flex items-baseline gap-4 mb-4">
        <span className="text-5xl font-black text-gray-900 tracking-tighter">{current}</span>
        <span className="text-lg font-black text-gray-300">/ {limit === 999 || limit === 9999 ? '∞' : limit}</span>
     </div>
     <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (current/limit)*100)}%` }}></div>
     </div>
  </div>
);

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.8rem] transition-all group ${active ? 'bg-slate-900 text-white shadow-3xl scale-105' : 'bg-transparent text-slate-400 hover:bg-gray-50'}`}>
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-white/10 text-indigo-400' : 'text-slate-300'}`}>{icon}</div>
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const Input = ({ label, value, onChange, type="text", suffix, disabled, theme="light", placeholder, icon }: any) => (
  <div className="space-y-2 group">
    <label className={`text-[10px] font-black uppercase tracking-[0.2em] ml-2 transition-all ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>{label}</label>
    <div className="relative">
      {icon && <div className={`absolute left-6 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-300'}`}>{icon}</div>}
      <input 
        disabled={disabled} 
        type={type} 
        placeholder={placeholder}
        className={`w-full py-5 rounded-[2rem] font-bold text-sm outline-none transition-all ${icon ? 'pl-16' : 'pl-8'} pr-8 ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
        value={value || ''} 
        onChange={(e)=>onChange ? onChange(e.target.value) : null} 
      />
      {suffix && <div className="absolute inset-y-0 right-6 flex items-center">{suffix}</div>}
    </div>
  </div>
);
