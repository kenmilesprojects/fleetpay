
import React, { useState, useEffect } from 'react';
import { ViewType, Manager } from './types';
import { NAV_SECTIONS, ADMIN_NAV_SECTIONS } from './constants';
import { Dashboard } from './components/client/Dashboard';
import { Drivers } from './components/client/Drivers';
import { Advances } from './components/client/Advances';
import { Deductions } from './components/client/Deductions';
import { Trips } from './components/client/Trips';
import { Payroll } from './components/client/Payroll';
import { ClientSettings } from './components/client/ClientSettings';
import { Team } from './components/client/Team';
import { AdminSettings } from './components/admin/AdminSettings';
import { Login } from './components/shared/Login';
import { Landing } from './components/shared/Landing';
import { AdminPanel } from './components/admin/AdminPanel';
import { SecureLoading } from './components/shared/SecureLoading';
import { Menu, X, LogOut, ShieldAlert, Loader2, ChevronDown, PlusCircle } from 'lucide-react';
import { fetchFullDB, getActiveAccount } from './db';

// Simple placeholder components for new pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-12 text-center space-y-4">
    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
      <Loader2 className="animate-spin" size={32} />
    </div>
    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{title} Module Initializing</h2>
    <p className="text-slate-400 font-medium">This module is currently syncing with the cloud cluster.</p>
  </div>
);

type Role = 'superadmin' | 'user' | 'manager';
type AppViewState = 'landing' | 'login' | 'dashboard-main';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppViewState>('landing');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Task', 'Masters']);
  
  const [role, setRole] = useState<Role>('user');
  const [managerData, setManagerData] = useState<Manager | null>(null);
  const [authUsername, setAuthUsername] = useState<string | null>(localStorage.getItem('fleetpay_auth_username'));
  const [db, setDb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const storedUsername = localStorage.getItem('fleetpay_auth_username');
        const activeWsId = localStorage.getItem('fleetpay_active_ws');
        const storedRole = (localStorage.getItem('fleetpay_role') as Role) || 'user';
        setRole(storedRole);

        const data = await fetchFullDB(activeWsId, storedRole === 'superadmin' ? null : storedUsername);
        setDb(data);

        if (storedRole === 'manager') {
          const mgr = data.managers.find((m: any) => m.email === (storedUsername || '').toLowerCase());
          if (mgr) setManagerData(mgr);
        }
      } catch (err) {
        console.error("Critical sync error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (appState === 'dashboard-main' || appState === 'login') loadData();
    else setIsLoading(false);
  }, [appState]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const handleLaunchApp = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setAppState('login');
    }, 2800);
  };

  const refresh = async (newActiveWsId?: string) => {
    const targetId = newActiveWsId || db?.activeWorkspaceId;
    const data = await fetchFullDB(targetId, role === 'superadmin' ? null : authUsername);
    setDb(data);
  };

  const handleLogin = (userRole: Role, identity?: string, extra?: any) => {
    setRole(userRole);
    localStorage.setItem('fleetpay_role', userRole);
    if (identity) {
      setAuthUsername(identity.toLowerCase());
      localStorage.setItem('fleetpay_auth_username', identity.toLowerCase());
    }
    if (userRole === 'manager' && extra) {
      setManagerData(extra);
      localStorage.setItem('fleetpay_active_ws', extra.workspaceId);
    }
    setAppState('dashboard-main');
    setActiveView(userRole === 'superadmin' ? 'admin-registry' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuthUsername(null);
    setManagerData(null);
    setAppState('landing');
    setRole('user');
    setActiveView('dashboard');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  }

  if (isConnecting) return <SecureLoading />;

  if (appState === 'landing') return <Landing onLoginClick={handleLaunchApp} />;
  if (appState === 'login') return <Login db={db} onLogin={handleLogin} />;

  const activeAccount = getActiveAccount(db);
  const isLocked = activeAccount?.isLocked && role !== 'superadmin';
  const isEnterprise = activeAccount?.plan === 'Enterprise';
  const currentNavSections = role === 'superadmin' ? ADMIN_NAV_SECTIONS : NAV_SECTIONS;

  return (
    <div className={`min-h-screen bg-[#F5F7F9] flex flex-col lg:flex-row font-sans overflow-hidden text-gray-900`}>
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#F5F7F9] transform transition-transform duration-300 lg:relative lg:translate-x-0 border-r border-gray-100 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col px-4 py-8">
          <div className="px-4 mb-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 overflow-hidden rounded-lg shadow-inner bg-white p-0.5">
                <img src="./logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-black text-xl tracking-tighter text-slate-800">FleetOps360</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400"><X size={20}/></button>
          </div>
          
          <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar px-2">
            {currentNavSections.map((section: any) => {
              const isOpen = !section.isDropdown || expandedSections.includes(section.title);
              return (
                <div key={section.title} className="space-y-1">
                  <button 
                    onClick={() => section.isDropdown && toggleSection(section.title)}
                    className="w-full px-4 mb-2 flex items-center justify-between group"
                  >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors">{section.title}</h3>
                    {section.isDropdown && (
                      <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                      {section.items.map((item: any) => (
                        <NavItem 
                          key={item.id} active={activeView === item.id} 
                          onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }} 
                          icon={item.icon} label={item.label} 
                          locked={item.id === 'team' && !isEnterprise}
                          badge={role === 'superadmin' ? (db?.[ (item as any).badge ] || 0) : 0}
                        />
                      ))}
                      {section.title === 'Task' && (
                        <button 
                          onClick={() => { setActiveView('trips'); /* Logic for showing add modal */ }}
                          className="w-full flex items-center gap-4 px-4 py-3 text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest mt-2 border border-dashed border-emerald-100"
                        >
                          <PlusCircle size={16} /> <span>Quick Add Trip</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          
          <div className="mt-auto px-2">
            <button onClick={handleLogout} className="w-full flex items-center justify-between text-rose-500 hover:bg-rose-50 p-4 rounded-2xl border border-gray-100 transition-all font-black text-[10px] uppercase tracking-widest bg-white">
               <span>Sign Out</span>
               <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {isLocked && (
          <div className="bg-rose-600 py-2 px-8 flex items-center justify-between text-white z-50 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3"><ShieldAlert size={16} /><p className="text-[11px] font-bold uppercase tracking-widest">Node Restricted</p></div>
          </div>
        )}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between flex-shrink-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden text-gray-400"><Menu size={20} /></button>
          <h2 className="font-black text-slate-800 uppercase text-xs tracking-widest">{activeView.replace('admin-', '').replace('-', ' ')}</h2>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#F5F7F9]">
          <div className="max-w-7xl mx-auto">
            {db && (activeView.startsWith('admin-') ? <AdminPanel db={db} onRefresh={refresh} activeTab={activeView.replace('admin-', '') as any} /> : (
               activeView === 'dashboard' ? <Dashboard db={db} onRefresh={refresh} /> :
               activeView === 'drivers' ? <Drivers db={db} onRefresh={refresh} /> :
               activeView === 'advances' ? <Advances db={db} onRefresh={refresh} /> :
               activeView === 'deductions' ? <Deductions db={db} onRefresh={refresh} /> :
               activeView === 'trips' ? <Trips db={db} onRefresh={refresh} /> :
               activeView === 'payroll' ? <Payroll db={db} onRefresh={refresh} /> :
               activeView === 'team' ? <Team db={db} onRefresh={refresh} /> :
               activeView === 'reports' ? <Placeholder title="Reports" /> :
               activeView === 'trucks' ? <Placeholder title="Trucks" /> :
               activeView === 'licenses' ? <Placeholder title="Licenses" /> :
               activeView === 'insurance' ? <Placeholder title="Insurance" /> :
               (role === 'superadmin' ? <AdminSettings db={db} onRefresh={refresh} /> : <ClientSettings db={db} onRefresh={refresh} userRole={role} managerData={managerData} />)
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, locked, badge }: any) => (
  <button onClick={onClick} disabled={locked} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-white shadow-lg text-slate-900 border border-gray-100' : 'text-slate-400 hover:text-slate-900 hover:bg-gray-100/50'} ${locked ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}>
    <div className="flex items-center gap-4">
      <span className={`${active ? 'text-blue-600' : 'text-slate-300'}`}>{icon}</span>
      <span className="font-black text-[10px] tracking-[0.15em] uppercase text-left">{label}</span>
    </div>
    {badge > 0 && <span className="w-5 h-5 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">{badge}</span>}
  </button>
);

export default App;
