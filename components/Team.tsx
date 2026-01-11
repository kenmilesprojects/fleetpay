
import React, { useState } from 'react';
import { saveManager, deleteManager, getActiveCompany } from '../db';
import { Manager } from '../types';
import { 
  UserPlus, ShieldCheck, Mail, Lock, X, 
  Settings as SettingsIcon, Trash2, CheckCircle2, AlertCircle, 
  Loader2, UserCog, ToggleLeft, ToggleRight, Fingerprint, Zap
} from 'lucide-react';

interface TeamProps {
  db: any;
  onRefresh: () => void;
}

export const Team = ({ db, onRefresh }: TeamProps) => {
  const activeCompany = getActiveCompany(db);
  const isEnterprise = activeCompany?.plan === 'Enterprise';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);

  const [formData, setFormData] = useState<Partial<Manager>>({
    name: '',
    email: '',
    password: '',
    canManageDrivers: false,
    canManageAdvances: false,
    canManageDeductions: false,
    canManageTrips: false,
    canClosePayroll: false
  });

  const handleToggle = (key: keyof Manager) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnterprise) {
      alert("Upgrade to Enterprise to manage team members.");
      return;
    }
    setIsSaving(true);
    try {
      await saveManager({
        ...formData,
        companyId: activeCompany.id,
        id: editingManager?.id
      });
      setIsModalOpen(false);
      setEditingManager(null);
      setFormData({
        name: '', email: '', password: '',
        canManageDrivers: false, canManageAdvances: false,
        canManageDeductions: false, canManageTrips: false, canClosePayroll: false
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (mgr: Manager) => {
    setEditingManager(mgr);
    setFormData({
      name: mgr.name,
      email: mgr.email,
      password: mgr.password,
      canManageDrivers: mgr.canManageDrivers,
      canManageAdvances: mgr.canManageAdvances,
      canManageDeductions: mgr.canManageDeductions,
      canManageTrips: mgr.canManageTrips,
      canClosePayroll: mgr.canClosePayroll
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this manager's access permanently?")) return;
    try {
      await deleteManager(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const managers = db.managers.filter((m: Manager) => m.companyId === activeCompany.id);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 relative">
      {!isEnterprise && (
        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] rounded-[3rem] flex items-center justify-center p-8">
           <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-3xl text-center max-w-lg space-y-8 border border-white/10 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
                 <Zap size={48} className="text-white animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-3xl font-black text-white tracking-tighter">Enterprise Access Only</h2>
                 <p className="text-slate-400 font-medium leading-relaxed">Multi-user management, granular permissions, and staff node assignments are exclusive to Enterprise clusters.</p>
              </div>
              <button onClick={() => alert("Redirecting to billing...")} className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-400 hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-3">
                 <Zap size={18} /> Upgrade Your Hub
              </button>
           </div>
        </div>
      )}

      <div className="p-10 bg-indigo-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-indigo-200 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              <ShieldCheck size={12} /> Enterprise Staff Controller
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Team Management</h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-950/50 rounded-2xl border border-white/5 w-fit">
               <Fingerprint size={14} className="text-indigo-400" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Company Node ID:</span>
               <span className="text-[10px] font-mono font-black">{activeCompany.id}</span>
            </div>
          </div>
          <button 
            onClick={() => { setEditingManager(null); setIsModalOpen(true); }}
            disabled={!isEnterprise}
            className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <UserPlus size={18} /> Provision Manager
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {managers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <UserCog className="mx-auto text-gray-100 mb-6" size={64} />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No managers assigned to this node.</p>
          </div>
        )}
        
        {managers.map((mgr: Manager) => (
          <div key={mgr.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 hover:shadow-2xl transition-all group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black italic text-xl shadow-inner">
                  {mgr.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-lg leading-tight">{mgr.name}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{mgr.email}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(mgr)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <SettingsIcon size={16} />
                </button>
                <button onClick={() => handleDelete(mgr.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <PermissionBadge active={mgr.canManageDrivers} label="Drivers" />
              <PermissionBadge active={mgr.canManageAdvances} label="Advances" />
              <PermissionBadge active={mgr.canManageDeductions} label="Deductions" />
              <PermissionBadge active={mgr.canManageTrips} label="Trips" />
              <PermissionBadge active={mgr.canClosePayroll} label="Payroll" />
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[400] p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{editingManager ? 'Update Credentials' : 'Provision Access'}</h2>
                <p className="text-sm text-gray-400 font-medium">Configure account details and set operational limits.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-rose-600 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Display Name" placeholder="e.g. Operations Lead" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
                <Input label="Login Email" placeholder="manager@fleet.io" type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                <div className="md:col-span-2">
                  <Input label="Temporary Access Key" placeholder="••••••••" type="text" value={formData.password} onChange={(v: string) => setFormData({...formData, password: v})} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-4">Granular Control Rights</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ToggleItem active={!!formData.canManageDrivers} label="Manage Driver Registry" onClick={() => handleToggle('canManageDrivers')} />
                  <ToggleItem active={!!formData.canManageAdvances} label="Issue Cash Advances" onClick={() => handleToggle('canManageAdvances')} />
                  <ToggleItem active={!!formData.canManageDeductions} label="Record Fine/Deductions" onClick={() => handleToggle('canManageDeductions')} />
                  <ToggleItem active={!!formData.canManageTrips} label="Approve Journey Logs" onClick={() => handleToggle('canManageTrips')} />
                  <ToggleItem active={!!formData.canClosePayroll} label="Finalize Monthly Payroll" onClick={() => handleToggle('canClosePayroll')} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-3xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button disabled={isSaving} type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {editingManager ? 'Update Settings' : 'Authorize Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PermissionBadge = ({ active, label }: any) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-tighter transition-all ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-300 grayscale opacity-50'}`}>
    {active ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
    {label}
  </div>
);

const ToggleItem = ({ active, label, onClick }: any) => (
  <button 
    type="button"
    onClick={onClick}
    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${active ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
  >
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-indigo-900' : ''}`}>{label}</span>
    {active ? <ToggleRight className="text-indigo-600" size={24} /> : <ToggleLeft size={24} />}
  </button>
);

const Input = ({ label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input required type={type} placeholder={placeholder} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all" value={value || ''} onChange={(e) => onChange(e.target.value)} />
  </div>
);
