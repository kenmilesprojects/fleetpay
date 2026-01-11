
import React, { useState } from 'react';
import { saveTrip, deleteTrip, getActiveCompany, getActiveSettings, getCurrencySymbol } from '../db';
import { Trip } from '../types';
import { Plus, MapPin, CheckCircle, ArrowLeft, Save, Edit3, Trash2, Loader2, Lock } from 'lucide-react';

interface TripsProps {
  db: any;
  onRefresh: () => void;
}

export const Trips = ({ db, onRefresh }: TripsProps) => {
  const activeCompany = getActiveCompany(db);
  const activeSettings = getActiveSettings(db);
  const isLocked = activeCompany?.isLocked;
  const symbol = getCurrencySymbol(activeSettings.currency);
  
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    driverId: '',
    route: '',
    date: new Date().toISOString().split('T')[0],
    allowance: 0
  });

  const handleAddNew = () => {
    if (isLocked) {
      alert("Blocked: Settlement required.");
      return;
    }
    setEditingTrip(null);
    setFormData({ driverId: '', route: '', date: new Date().toISOString().split('T')[0], allowance: 0 });
    setView('FORM');
  };

  const handleEdit = (trip: Trip) => {
    if (isLocked) {
      alert("Blocked: Settlement required.");
      return;
    }
    setEditingTrip(trip);
    setFormData({
      driverId: trip.driverId,
      route: trip.route,
      date: trip.date,
      allowance: trip.allowance
    });
    setView('FORM');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = db.tripTemplates.find((t: any) => t.id === templateId && t.workspaceId === db.activeWorkspaceId);
    if (template) {
      setFormData(prev => ({ ...prev, route: template.name, allowance: template.defaultAmount }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("Blocked: Settlement required.");
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        ...formData,
        companyId: db.activeCompanyId,
        status: editingTrip ? editingTrip.status : 'pending'
      };
      if (editingTrip) payload.id = editingTrip.id;
      
      await saveTrip(db.activeWorkspaceId, db.activeCompanyId, payload);
      setView('LIST');
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
    if (!confirm('Are you sure you want to delete this log?')) return;
    await deleteTrip(id);
    onRefresh();
  };

  const markCompleted = async (trip: Trip) => {
    if (isLocked) {
      alert("Blocked: Settlement required.");
      return;
    }
    await saveTrip(db.activeWorkspaceId, db.activeCompanyId, { ...trip, status: 'completed' });
    onRefresh();
  };

  // Strictly filter by workspaceId
  const activeTrips = db.trips.filter((t: Trip) => t.workspaceId === db.activeWorkspaceId);
  const activeTemplates = db.tripTemplates.filter((t: any) => t.workspaceId === db.activeWorkspaceId);
  const activeDrivers = db.drivers.filter((d: any) => d.isActive && d.workspaceId === db.activeWorkspaceId);

  if (view === 'FORM') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right duration-300">
        <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-black text-sm uppercase tracking-widest transition-colors">
          <ArrowLeft size={16} /> Back to Logs
        </button>

        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-800">{editingTrip ? 'Modify Mission' : 'Assign New Route'}</h2>
            <p className="text-sm text-gray-400 font-medium">Log precise journey details for the fleet.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Driver Assignment</label>
                <select 
                  required
                  disabled={isLocked}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                  value={formData.driverId}
                  onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                >
                  <option value="">Choose Driver...</option>
                  {activeDrivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mission Date</label>
                <input 
                  type="date"
                  required
                  disabled={isLocked}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {activeTemplates.map((t: any) => (
                  <button key={t.id} type="button" disabled={isLocked} onClick={() => handleTemplateSelect(t.id)} className="px-4 py-2 bg-blue-50 text-blue-600 font-black text-[10px] rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50">
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Route / Destination</label>
              <input 
                required
                disabled={isLocked}
                placeholder="e.g. Downtown Logistics Hub"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                value={formData.route}
                onChange={(e) => setFormData({...formData, route: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Journey Allowance ({symbol})</label>
              <input 
                required
                disabled={isLocked}
                type="number"
                placeholder="0.00"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
                value={formData.allowance}
                onChange={(e) => setFormData({...formData, allowance: Number(e.target.value)})}
              />
            </div>

            <button type="submit" disabled={isSaving || isLocked} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" /> : (isLocked ? <Lock size={20}/> : <Save size={20} />)}
              {isLocked ? 'Workspace Locked' : (editingTrip ? 'Commit Changes' : 'Initialize Mission')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Mission Logs</h1>
          <p className="text-gray-400 font-medium text-sm">Real-time route management for this workspace</p>
        </div>
        <button 
          onClick={handleAddNew}
          className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 text-white rounded-3xl shadow-xl transition-all ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 font-black text-sm uppercase tracking-widest'}`}
        >
          {isLocked ? <Lock size={20} /> : <Plus size={20} />} New Journey
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeTrips.length === 0 && (
          <div className="lg:col-span-3 py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <MapPin className="mx-auto text-gray-100 mb-6" size={64} />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No historical logs found.</p>
          </div>
        )}
        {activeTrips.map(trip => {
          const driver = db.drivers.find((d: any) => d.id === trip.driverId);
          return (
            <div key={trip.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 hover:shadow-2xl transition-all relative overflow-hidden group">
              <div className={`absolute top-0 right-0 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${trip.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {trip.status}
              </div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <MapPin size={28} />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">{trip.route}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{trip.date}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase">CREW</span>
                  <span className="text-xs font-black text-gray-700">{driver?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-black text-emerald-600 uppercase">ALLOWANCE</span>
                  <span className="text-sm font-black text-emerald-700">{symbol}{trip.allowance}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                {trip.status === 'pending' && (
                  <button disabled={isLocked} onClick={() => markCompleted(trip)} className={`flex-1 py-3 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isLocked ? 'bg-gray-300' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-50'}`}>
                    {isLocked ? <Lock size={12}/> : 'Settle'}
                  </button>
                )}
                <button disabled={isLocked} onClick={() => handleEdit(trip)} className={`p-3 rounded-2xl transition-all ${isLocked ? 'text-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white'}`}>
                  {isLocked ? <Lock size={16}/> : <Edit3 size={16} />}
                </button>
                <button disabled={isLocked} onClick={() => handleDelete(trip.id)} className={`p-3 rounded-2xl transition-all ${isLocked ? 'text-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-rose-600 hover:text-white'}`}>
                  {isLocked ? <Lock size={16}/> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
