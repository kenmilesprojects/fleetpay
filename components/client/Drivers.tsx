import React, { useState } from 'react';
import { addDriver, deleteDriver, updateDriver, getActiveSettings, getCurrencySymbol, getActiveCompany } from '../../db';
import { Plus, Search, Edit2, XCircle, Phone, Info, Loader2, Sparkles, Lock } from 'lucide-react';
import { Driver } from '../../types';

interface DriversProps {
  db: any;
  onRefresh: () => void;
}

export const Drivers = ({ db, onRefresh }: DriversProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const activeSettings = getActiveSettings(db);
  const activeCompany = getActiveCompany(db);
  const isLocked = activeCompany?.isLocked;
  const symbol = getCurrencySymbol(activeSettings.currency);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("Action Blocked: Please settle MNC payment to resume modifications.");
      return;
    }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, formData);
      } else {
        await addDriver(db.activeWorkspaceId, db.activeCompanyId, formData);
      }
      setIsModalOpen(false);
      setEditingDriver(null);
      setFormData({ name: '', phone: '', joiningDate: new Date().toISOString().split('T')[0], monthlySalary: 0 });
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    if (isLocked) {
      alert("View-Only Mode: Settlement required for modifications.");
      return;
    }
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      joiningDate: driver.joiningDate,
      monthlySalary: driver.monthlySalary
    });
    setIsModalOpen(true);
  };

  const handleCloseDriver = async (id: string) => {
    if (isLocked) {
      alert("Blocked: Settlement required.");
      return;
    }
    if (confirm('Close this driver account? Data will still be available for calculations.')) {
      await deleteDriver(id);
      onRefresh();
    }
  };

  const filteredDrivers = db.drivers.filter((d: Driver) => 
    (d.workspaceId === db.activeWorkspaceId) && (
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.phone.includes(searchTerm)
    )
  );

  const activeDriverCount = db.drivers.filter((d: any) => (d.workspaceId === db.activeWorkspaceId) && d.isActive).length;
  const limit = activeCompany?.plan === 'Basic Hub' ? 2 : activeCompany?.plan === 'Pro Cluster' ? 10 : activeCompany?.plan === 'Elite Network' ? 50 : Infinity;
  const isAtLimit = activeDriverCount >= limit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Driver Directory</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-gray-500 text-sm">Personnel for {db.workspaces.find((w:any) => w.id === db.activeWorkspaceId)?.name || 'Workspace'}</span>
             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${isAtLimit ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                {activeDriverCount} / {limit === Infinity ? 'Unlimited' : limit} Slots
             </span>
          </div>
        </div>
        <button 
          onClick={() => { 
            if (isLocked) {
              alert("Payment Overdue: Please settle MNC to unlock data entry.");
              return;
            }
            setErrorMsg(null); setEditingDriver(null); setIsModalOpen(true); 
          }}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl transition-colors shadow-lg shadow-blue-100 ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLocked ? <Lock size={18} /> : <Plus size={18} />}
          Add New Driver
        </button>
      </div>

      {isLocked && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top duration-500">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-inner"><Lock size={24}/></div>
          <div>
            <h4 className="font-black text-rose-900 text-lg leading-tight">Workspace Locked</h4>
            <p className="text-xs font-bold text-rose-600">Please pay the MNC settlement to resume full operational control.</p>
          </div>
        </div>
      )}

      {isAtLimit && activeCompany?.plan !== 'Enterprise' && !isLocked && (
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row justify-between items-center gap-6 animate-in zoom-in-95 duration-500">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl"><Sparkles size={24}/></div>
              <div>
                 <h4 className="font-black text-lg">Staff Capacity Reached</h4>
                 <p className="text-xs font-medium opacity-80">You've hit the {limit} driver limit of the {activeCompany.plan} plan.</p>
              </div>
           </div>
           <p className="text-xs font-bold leading-relaxed max-w-xs text-center md:text-left">Upgrade to unlock more driver slots and automate your backup workflow.</p>
           <button 
              className="px-8 py-3 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all whitespace-nowrap"
              onClick={() => alert('Please navigate to Settings > Billing to upgrade your plan.')}
            >
             View Plans
           </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="bg-transparent border-none outline-none flex-1 text-sm md:text-base font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Driver Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Join Date</th>
                <th className="px-6 py-4">Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDrivers.map(driver => (
                <tr key={driver.id} className={`hover:bg-gray-50 transition-colors ${!driver.isActive ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-6 py-4 font-bold text-gray-800">{driver.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{driver.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{driver.joiningDate}</td>
                  <td className="px-6 py-4 text-sm font-black text-gray-700">{symbol}{(driver.monthlySalary).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${driver.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {driver.isActive ? 'Active' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(driver)} className={`p-2 rounded-lg transition-colors ${isLocked ? 'text-gray-300' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                        {isLocked ? <Lock size={16} /> : <Edit2 size={16} />}
                      </button>
                      {driver.isActive && (
                        <button onClick={() => handleCloseDriver(driver.id)} className={`p-2 rounded-lg transition-colors ${isLocked ? 'text-gray-300' : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'}`}>
                          {isLocked ? <Lock size={16} /> : <XCircle size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingDriver ? 'Edit Profile' : 'New Driver Onboarding'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="md:hidden p-2 text-gray-400"><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                <input required disabled={isLocked} type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Salary ({symbol})</label>
                  <input required disabled={isLocked} type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" value={formData.monthlySalary} onChange={(e) => setFormData({...formData, monthlySalary: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Join Date</label>
                  <input required disabled={isLocked} type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" value={formData.joiningDate} onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={isSaving || isLocked} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="animate-spin" />} {editingDriver ? 'Save Changes' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};