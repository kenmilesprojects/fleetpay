
import React, { useState } from 'react';
import { saveAdvance, deleteAdvance, getActiveSettings, getCurrencySymbol, getActiveCompany } from '../db';
import { Plus, Trash2, Wallet, Loader2, Lock } from 'lucide-react';

interface AdvancesProps {
  db: any;
  onRefresh: () => void;
}

export const Advances = ({ db, onRefresh }: AdvancesProps) => {
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const activeSettings = getActiveSettings(db);
  const activeCompany = getActiveCompany(db);
  const isLocked = activeCompany?.isLocked;
  const symbol = getCurrencySymbol(activeSettings.currency);

  const [formData, setFormData] = useState({
    driverId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("Action Blocked: Settlement required.");
      return;
    }
    setIsSaving(true);
    try {
      await saveAdvance(db.activeWorkspaceId, db.activeCompanyId, formData);
      setShowForm(false);
      setFormData({ driverId: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isLocked) {
      alert("Blocked: Settlement required.");
      return;
    }
    if (!confirm('Delete this record?')) return;
    await deleteAdvance(id);
    onRefresh();
  };

  const filteredAdvances = db.advances.filter((a: any) => a.workspaceId === db.activeWorkspaceId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Driver Advances</h1>
          <p className="text-gray-500">Track and manage cash advances for {db.workspaces.find((w:any) => w.id === db.activeWorkspaceId)?.name || 'Workspace'}</p>
        </div>
        <button 
          onClick={() => {
            if (isLocked) {
              alert("Payment Overdue: Please settle MNC to unlock data entry.");
              return;
            }
            setShowForm(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLocked ? <Lock size={18} /> : <Plus size={18} />} Add Advance
        </button>
      </div>

      {isLocked && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top duration-500 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-inner"><Lock size={24}/></div>
          <div>
            <h4 className="font-black text-rose-900 text-lg leading-tight">Workspace Locked</h4>
            <p className="text-xs font-bold text-rose-600">Please pay the MNC settlement to resume full operational control.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredAdvances.length === 0 ? (
            <div className="bg-white p-12 text-center border-2 border-dashed rounded-2xl">
              <Wallet className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No advance records found for this node.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase">
                  <tr>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdvances.map((advance: any) => {
                    const driver = db.drivers.find((d: any) => d.id === advance.driverId);
                    return (
                      <tr key={advance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{driver?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-rose-600 font-bold">-{symbol}{advance.amount}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{advance.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 italic">"{advance.description}"</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDelete(advance.id)} className={`p-2 transition-all ${isLocked ? 'text-gray-200' : 'text-gray-400 hover:text-rose-600'}`}>
                            {isLocked ? <Lock size={16} /> : <Trash2 size={16} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-6 h-fit animate-in slide-in-from-right duration-300">
            <h2 className="text-lg font-bold mb-4">Record New Advance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Driver</label>
                <select 
                  required
                  disabled={isLocked}
                  className="w-full px-4 py-2 border rounded-lg outline-none disabled:opacity-50"
                  value={formData.driverId}
                  onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                >
                  <option value="">Choose a driver...</option>
                  {db.drivers.filter((d: any) => d.isActive && d.workspaceId === db.activeWorkspaceId).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ({symbol})</label>
                <input 
                  required
                  disabled={isLocked}
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg outline-none disabled:opacity-50"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  required
                  disabled={isLocked}
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg outline-none disabled:opacity-50"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  disabled={isLocked}
                  className="w-full px-4 py-2 border rounded-lg outline-none h-24 disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={isSaving || isLocked} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
