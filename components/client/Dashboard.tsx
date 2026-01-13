
import React, { useMemo, useState } from 'react';
import { getActiveAccount, getActiveSettings, getCurrencySymbol } from '../../db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, AlertCircle, Lock, ShieldAlert, UserCog, Fingerprint, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  db: any;
  onRefresh: () => void;
}

export const Dashboard = ({ db, onRefresh }: DashboardProps) => {
  const activeCompany = getActiveAccount(db);
  const activeSettings = getActiveSettings(db);
  const symbol = getCurrencySymbol(activeSettings.currency);
  const isLocked = activeCompany?.isLocked;
  const isEnterprise = activeCompany?.plan === 'Enterprise';

  const [insight, setInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const stats = useMemo(() => {
    if (!db || !db.activeWorkspaceId) return { activeDrivers: 0, totalAdvances: 0, totalTrips: 0, pendingTrips: 0, teamCount: 0 };
    
    const wsDrivers = db.drivers.filter((d: any) => d.isActive && d.workspaceId === db.activeWorkspaceId);
    const activeDrivers = wsDrivers.length;
    
    const totalAdvances = db.advances
      .filter((a: any) => a.workspaceId === db.activeWorkspaceId)
      .reduce((acc: number, curr: any) => acc + curr.amount, 0);
    
    const trips = db.trips.filter((t: any) => t.workspaceId === db.activeWorkspaceId);
    const totalTrips = trips.length;
    const pendingTrips = trips.filter((t: any) => t.status === 'pending').length;
    
    const teamCount = db.managers.filter((m: any) => m.companyId === db.activeCompanyId).length;

    return { activeDrivers, totalAdvances, totalTrips, pendingTrips, teamCount };
  }, [db]);

  const teamMembers = useMemo(() => {
    return db.managers.filter((m: any) => m.companyId === db.activeCompanyId);
  }, [db]);

  const generateInsight = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a fleet management AI assistant. Analyze these metrics for "${activeCompany.name}":
      - Active Crew: ${stats.activeDrivers}
      - Total Advances: ${symbol}${stats.totalAdvances.toLocaleString()}
      - Total Journey Logs: ${stats.totalTrips}
      - Pending Missions: ${stats.pendingTrips}
      - Staff Endpoints: ${stats.teamCount}
      
      Provide a brief (2-sentence) professional assessment of fleet efficiency and one actionable recommendation for the manager.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setInsight(response.text || "Insight data stream interrupted.");
    } catch (error) {
      console.error("AI Advisor Error:", error);
      setInsight("Unable to connect to AI Advisor cluster.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData = [
    { name: 'Mon', trips: 4 }, { name: 'Tue', trips: 7 }, 
    { name: 'Wed', trips: 5 }, { name: 'Thu', trips: 10 }, 
    { name: 'Fri', trips: 12 }, { name: 'Sat', trips: 6 },
    { name: 'Sun', trips: 3 }
  ];

  if (!activeCompany || activeCompany.id === '') {
    return <div className="p-10 text-center text-gray-400 font-black uppercase tracking-widest">Waking up node...</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {isLocked && (
        <div className="p-8 bg-rose-600 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-[1.8rem] backdrop-blur-xl">
                 <ShieldAlert size={32} className="animate-pulse" />
              </div>
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">Node Restricted</h2>
                 <p className="text-rose-100 font-medium">Please verify settlement to resume workshop operations.</p>
              </div>
           </div>
           {!db?.managers?.some((m: any) => m.email === (localStorage.getItem('fleetpay_auth_email') || '').toLowerCase()) && (
             <button onClick={() => window.dispatchEvent(new CustomEvent('openPaymentPopup'))} className="px-10 py-4 bg-white text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                Settle Now
             </button>
           )}
        </div>
      )}

      <div className="relative p-10 md:p-16 bg-slate-900 rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400 opacity-5 rounded-full blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-xl rounded-full text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
              <Fingerprint size={12} /> {isEnterprise ? `ENDPOINT: ${db.activeWorkspaceId.slice(0, 8)}...` : 'PRIMARY CLUSTER'}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
              {activeCompany.name}
            </h1>
            <div className="flex items-center gap-3">
               <p className="text-blue-100/50 font-medium">{activeCompany.owner || 'Admin'} • {activeCompany.plan} Plan</p>
               {!isEnterprise && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase rounded border border-amber-500/30">Single Hub</span>}
            </div>
          </div>
          <div className="px-8 py-5 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 text-center">
             <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1 opacity-60">System Health</p>
             <p className={`text-3xl font-black flex items-center justify-center gap-2 ${isLocked ? 'text-rose-400' : 'text-emerald-400'}`}>
               {isLocked ? 'Locked' : 'Stable'} 
               {isLocked ? <Lock size={20}/> : <ShieldCheck size={20}/>}
             </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Active Crew" value={stats.activeDrivers} icon={<Users size={24}/>} color="bg-blue-600" desc="Current staff registry" />
        <StatCard title="Node Staff" value={isEnterprise ? stats.teamCount : "0"} icon={<UserCog size={24}/>} color="bg-indigo-600" desc={isEnterprise ? "Managed endpoints" : "Upgrade to unlock"} />
        <StatCard title="Node Credit" value={`${symbol}${stats.totalAdvances.toLocaleString()}`} icon={<ShieldCheck size={24}/>} color="bg-amber-500" desc="Monthly advances issued" />
        <StatCard title="Pending" value={stats.pendingTrips} icon={<AlertCircle size={24}/>} color="bg-rose-500" desc="Trips awaiting settlement" />
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-inner group">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl group-hover:scale-105 transition-transform">
          <Zap size={32} />
        </div>
        <div className="flex-1 space-y-2">
           <div className="flex items-center gap-3">
             <h3 className="text-xl font-black text-gray-800 tracking-tight">AI Fleet Advisor</h3>
             <span className="px-2 py-0.5 bg-indigo-200 text-indigo-700 text-[8px] font-black uppercase rounded tracking-widest">Active Insight</span>
           </div>
           <div className="min-h-[3rem] flex items-center">
              {insight ? (
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic animate-in fade-in slide-in-from-left duration-500">"{insight}"</p>
              ) : (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Request real-time diagnostic insight from the AI network advisor.</p>
              )}
           </div>
        </div>
        <button 
          onClick={generateInsight}
          disabled={isAnalyzing}
          className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-gap-3 disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
          {insight ? 'Regenerate' : 'Analyze Fleet'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
          <div className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-black text-gray-800 tracking-tight">Fleet Velocity</h2>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">7-Day Analysis</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:11, fontWeight:800}} dy={15} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="trips" stroke="#2563eb" strokeWidth={5} fillOpacity={1} fill="url(#colorArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                 <UserCog size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Staffing Node</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Managers</p>
              </div>
           </div>

           <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {!isEnterprise ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                    <Zap size={32} className="text-blue-500" />
                    <p className="text-xs font-black text-slate-400 uppercase leading-relaxed tracking-widest">Team access is exclusive to Enterprise clusters.</p>
                 </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-10">
                   <p className="text-[10px] font-black text-gray-300 uppercase italic">No team nodes provisioned.</p>
                </div>
              ) : (
                teamMembers.map((member: any) => (
                  <div key={member.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase italic">
                           {member.name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xs font-black text-gray-800 leading-none">{member.name}</p>
                           <p className="text-[9px] font-medium text-gray-400 truncate max-w-[120px]">{member.email}</p>
                        </div>
                     </div>
                     <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md uppercase">Manager</span>
                  </div>
                ))
              )}
           </div>

           <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Tier</span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isEnterprise ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{activeCompany.plan}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, desc }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl group hover:translate-y-[-8px] transition-all duration-500">
    <div className={`w-16 h-16 rounded-[1.8rem] ${color} flex items-center justify-center text-white mb-8 shadow-2xl transition-transform duration-500`}>
      {icon}
    </div>
    <div className="space-y-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-4xl font-black text-gray-800 tracking-tight">{value}</p>
      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter pt-2">{desc}</p>
    </div>
  </div>
);
