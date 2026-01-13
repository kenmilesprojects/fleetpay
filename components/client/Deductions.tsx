import React, { useState } from 'react';
import { saveDeduction, deleteDeduction, getActiveSettings, getCurrencySymbol, getActiveCompany } from '../../db';
import { Plus, Trash2, ArrowDownCircle, AlertTriangle, X, Loader2, Lock } from 'lucide-react';

interface DeductionsProps {
  db: any;
  onRefresh: () => void;
}

export const Deductions = ({ db, onRefresh }: DeductionsProps) => {
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
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("Action Blocked: Settlement required.");
      return;
    }
    setIsSaving(true);
    try {
      await saveDeduction(db.activeWorkspaceId, db.activeCompanyId, formData);
      setShowForm(false);
      setFormData({ driverId: '', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' });
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
    if (!confirm('Permanently remove this record?')) return;
    try {
      await deleteDeduction(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDeductions = db.deductions.filter((d: any) => d.workspaceId === db.activeWorkspaceId);
  const activeDrivers = db.drivers.filter((d: any) => (d.isActive || d.is_active) && d.workspaceId === db.activeWorkspaceId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Deductions & Fines</h1>
          <p className="text-gray-400 font-medium text-sm">Mandatory subtractions for {activeSettings.currency} payroll</p>
        </div>
        <button 
          onClick={() => {
            if (isLocked) {
              alert("Payment Overdue: Please settle MNC to unlock data entry.");
              return;
            }
            setShowForm(true);
          }}
          className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 text-white rounded-3xl transition-all shadow-xl ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 font-black text-sm uppercase tracking-widest'}`}
        >
          {isLocked ? <Lock size={20} /> : <Plus size={20} />} Add Deduction
        </button>
      </div>

      {isLocked && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center gap-4 animate-in slide-in-from-top duration-500">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-inner"><Lock size={24}/></div>
          <div>
            <h4 className="font-black text-rose-900 text-lg leading-tight">Workspace Locked</h4>
            <p className="text-xs font-bold text-rose-600">Please pay the MNC settlement to resume full operational control.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {filteredDeductions.length === 0 ? (
            <div className="bg-white p-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
              <ArrowDownCircle className="mx-auto text-gray-100 mb-6" size={64} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No historical deductions recorded.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">Driver</th>
                    <th className="px-6 py-6 text-right">Amount</th>
                    <th className="px-8 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDeductions.map((deduction: any) => {
                    const driver = db.drivers.find((d: any) => d.id === deduction.driverId);
                    return (
                      <tr key={deduction.id} className="hover:bg-gray-50/50">
                        <td className="px-8 py-6"><p className="font-black text-gray-800">{driver?.name || 'Unknown'}</p></td>
                        <td className="px-6 py-6 text-rose-600 font-black text-right">-{symbol}{deduction.amount.toLocaleString()}</td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => handleDelete(deduction.id)} className={`p-3 rounded-2xl transition-all ${isLocked ? 'text-gray-200' : 'text-gray-400 hover:text-rose-600'}`}>
                            {isLocked ? <Lock size={18} /> : <Trash2 size={18} />}
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
      </div>
    </div>
  );
};