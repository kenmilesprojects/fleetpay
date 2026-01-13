import React, { useState } from 'react';
import { saveTrip, deleteTrip, getActiveCompany, getActiveSettings, getCurrencySymbol } from '../../db';
import { Trip, Driver } from '../../types';
import { 
  Plus, MapPin, CheckCircle, ArrowLeft, Save, 
  Edit3, Trash2, Loader2, Lock, History, 
  Compass, Navigation, CheckCircle2, AlertCircle 
} from 'lucide-react';

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
      alert("Action Restricted: Please settle node payment to assign new missions.");
      return;
    }
    setEditingTrip(null);
    setFormData({ driverId: '', route: '', date: new Date().toISOString().split('T')[0], allowance: 0 });
    setView('FORM');
  };

  const handleEdit = (trip: Trip) => {
    if (isLocked) {
      alert("View-Only Mode: Modification restricted during node audit.");
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

  const handleDelete = async (id: string) => {
    if (isLocked) {
      alert("Blocked: Data removal restricted.");
      return;
    }
    if (!confirm('Permanently erase this journey from registry?')) return;
    try {
      await deleteTrip(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (trip: Trip) => {
    if (isLocked) {
      alert("Blocked: Status updates restricted.");
      return;
    }
    try {
      const newStatus = trip.status === 'pending' ? 'completed' : 'pending';
      await saveTrip(db.activeWorkspaceId, db.activeCompanyId, {
        ...trip,
        status: newStatus
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      alert("Blocked: Mission registry failed.");
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

  const activeTrips = db.trips.filter((t: Trip) => t.workspaceId === db.activeWorkspaceId);
  const activeDrivers = db.drivers.filter((d: any) => (d.isActive || d.is_active) && d.workspaceId === db.activeWorkspaceId);
  
  const stats = {
    total: activeTrips.length,
    pending: activeTrips.filter((t: any) => t.status === 'pending').length,
    completed: activeTrips.filter((t: any) => t.status === 'completed').length
  };

  if (view === 'FORM') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
        <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to History
        </button>
        <div className="bg-white p-10 md:p-16 rounded-[3.5rem] border border-gray-100 shadow-3xl">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
               <Navigation size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{editingTrip ? 'Mission Update' : 'Initialize Mission'}</h2>
              <p className="text-slate-400 font-medium italic">Configure route deployment and staff allowance.</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Authorized Personnel</label>
                  <select required disabled={isLocked} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner" value={formData.driverId} onChange={(e) => setFormData({...formData, driverId: e.target.value})}>
                    <option value="">Choose Driver...</option>
                    {activeDrivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Deployment Date</label>
                  <input required disabled={isLocked} type="date" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Route Path / Destination</label>
               <div className="relative group">
                  <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input required disabled={isLocked} placeholder="e.g. Mumbai Port Cluster -> Pune Hub" className="w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner" value={formData.route} onChange={(e) => setFormData({...formData, route: e.target.value})} />
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Trip Allowance ({symbol})</label>
               <input required disabled={isLocked} type="number" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none font-bold text-sm focus:bg-white focus:border-blue-500 transition-all shadow-inner" value={formData.allowance} onChange={(e) => setFormData({...formData, allowance: Number(e.target.value)})} />
            </div>

            <div className="pt-6">
              <button type="submit" disabled={isSaving || isLocked} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-4xl flex items-center justify-center gap-4 transition-all hover:bg-blue-600 active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} {editingTrip ? 'Sync Modifications' : 'Initialize Journey'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Journey History</h1>
          <p className="text-slate-400 font-medium italic">Operational mission logs for active fleet nodes.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex-1 md:flex-none px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3">
              <History size={16} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stats.total} Logs</span>
           </div>
           <button onClick={handleAddNew} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-3xl shadow-2xl shadow-blue-100 font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-900 transition-all">
            <Plus size={18} /> New Assignment
          </button>
        </div>
      </div>

      {isLocked && (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-top duration-500">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl shadow-inner"><Lock size={28}/></div>
          <div className="space-y-1">
            <h4 className="font-black text-rose-900 text-xl leading-tight">Registry Suspended</h4>
            <p className="text-sm font-bold text-rose-600">Please pay the node settlement to resume journey assignments.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
         <StatBox label="Active Missions" value={stats.pending} icon={<Compass size={20}/>} color="text-amber-500" bg="bg-amber-50" />
         <StatBox label="Journeys Completed" value={stats.completed} icon={<CheckCircle2 size={20}/>} color="text-emerald-500" bg="bg-emerald-50" />
         <StatBox label="Cluster Velocity" value={`${Math.round((stats.completed / (stats.total || 1)) * 100)}%`} icon={<Navigation size={20}/>} color="text-blue-500" bg="bg-blue-50" />
      </div>

      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-10 py-8">MISSION DETAILS</th>
                <th className="px-6 py-8 text-center">PERSONNEL</th>
                <th className="px-6 py-8 text-center">ALLOWANCE</th>
                <th className="px-6 py-8 text-center">STATUS</th>
                <th className="px-10 py-8 text-right">AUDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeTrips.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-black uppercase text-xs tracking-[0.2em] italic">NO_MISSION_LOGS_AVAILABLE</td></tr>
              ) : activeTrips.map(trip => {
                const driver = db.drivers.find((d: any) => d.id === trip.driverId);
                const isCompleted = trip.status === 'completed';
                return (
                  <tr key={trip.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-10 py-8">
                      <p className="font-black text-slate-800 leading-none mb-1.5 uppercase tracking-tighter">{trip.route}</p>
                      <div className="flex items-center gap-2">
                        <History size={10} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trip.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-8 text-center">
                       <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-inner">
                          {driver?.name || 'UNKNOWN'}
                       </span>
                    </td>
                    <td className="px-6 py-8 text-center">
                       <p className="text-sm font-black text-slate-900">{symbol}{trip.allowance.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-8 text-center">
                       <button 
                        onClick={() => handleToggleStatus(trip)}
                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isCompleted ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                       >
                         {trip.status}
                       </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(trip)} className={`p-3 rounded-2xl transition-all ${isLocked ? 'text-slate-200' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                          {isLocked ? <Lock size={18} /> : <Edit3 size={18} />}
                        </button>
                        <button onClick={() => handleDelete(trip.id)} className={`p-3 rounded-2xl transition-all ${isLocked ? 'text-slate-200' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}>
                          {isLocked ? <Lock size={18} /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon, color, bg }: any) => (
  <div className={`p-8 ${bg} rounded-[2.5rem] border border-gray-50 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow`}>
     <div className={`w-12 h-12 ${bg} border border-white rounded-2xl flex items-center justify-center ${color} shadow-inner`}>
        {icon}
     </div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
        <p className={`text-3xl font-black ${color} tracking-tighter leading-none`}>{value}</p>
     </div>
  </div>
);