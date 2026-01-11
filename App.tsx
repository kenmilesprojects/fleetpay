
import React, { useState, useEffect } from 'react';
import { ViewType, CompanyDetails, Workspace, Manager, SettlementRequest } from './types';
import { NAV_SECTIONS } from './constants';
import { Dashboard } from './components/Dashboard';
import { Drivers } from './components/Drivers';
import { Advances } from './components/Advances';
import { Deductions } from './components/Deductions';
import { Trips } from './components/Trips';
import { Payroll } from './components/Payroll';
import { Settings } from './components/Settings';
import { Team } from './components/Team';
import { Login } from './components/Login';
import { Landing } from './components/Landing';
import { AdminPanel } from './components/AdminPanel';
import { Menu, X, Building2, Check, ArrowLeft, LogOut, ShieldAlert, Loader2, Lock, ChevronRight, ChevronDown, User } from 'lucide-react';
import { fetchFullDB, getActiveAccount, getActiveWorkspace } from './db';

type Role = 'superadmin' | 'user' | 'manager';
type AppViewState = 'landing' | 'login' | 'dashboard-main';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppViewState>('landing');
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [showPaymentLockPopup, setShowPaymentLockPopup] = useState(false);
  
  const [role, setRole] = useState<Role>('user');
  const [managerData, setManagerData] = useState<Manager | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(localStorage.getItem('fleetpay_auth_email'));
  const [db, setDb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleOpenPayment = () => setShowPaymentLockPopup(true);
    window.addEventListener('openPaymentPopup', handleOpenPayment);
    return () => window.removeEventListener('openPaymentPopup', handleOpenPayment);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const storedEmail = localStorage.getItem('fleetpay_auth_email');
        const activeWsId = localStorage.getItem('fleetpay_active_ws');
        const storedRole = (localStorage.getItem('fleetpay_role') as Role) || 'user';
        setRole(storedRole);

        const data = await fetchFullDB(activeWsId, storedRole === 'superadmin' ? null : storedEmail);
        setDb(data);

        if (storedRole === 'manager') {
          const mgr = data.managers.find((m: any) => m.email === (storedEmail || '').toLowerCase());
          if (mgr) setManagerData(mgr);
        }

        if (data.activeWorkspaceId && data.activeWorkspaceId !== activeWsId) {
          localStorage.setItem('fleetpay_active_ws', data.activeWorkspaceId);
        }
      } catch (err) {
        console.error("Failed to fetch from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (appState === 'dashboard-main' || appState === 'login') loadData();
    else setIsLoading(false);
  }, [appState]);

  const refresh = async (newActiveWsId?: string) => {
    const targetId = newActiveWsId || db?.activeWorkspaceId;
    const data = await fetchFullDB(targetId, role === 'superadmin' ? null : authEmail);
    setDb(data);
    if (data.activeWorkspaceId) localStorage.setItem('fleetpay_active_ws', data.activeWorkspaceId);
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    localStorage.setItem('fleetpay_active_ws', workspaceId);
    refresh(workspaceId);
    setIsWorkspaceModalOpen(false);
  };

  const handleLogin = (userRole: Role, userEmail?: string, extra?: any) => {
    setRole(userRole);
    localStorage.setItem('fleetpay_role', userRole);
    if (userEmail) {
      setAuthEmail(userEmail.toLowerCase());
      localStorage.setItem('fleetpay_auth_email', userEmail.toLowerCase());
    }
    if (userRole === 'manager' && extra) {
      setManagerData(extra);
      localStorage.setItem('fleetpay_active_ws', extra.workspaceId);
    }
    setAppState('dashboard-main');
    setActiveView(userRole === 'superadmin' ? 'admin-panel' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('fleetpay_auth_email');
    localStorage.removeItem('fleetpay_active_ws');
    localStorage.removeItem('fleetpay_role');
    setAuthEmail(null);
    setManagerData(null);
    setAppState('landing');
    setRole('user');
    setActiveView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (appState === 'landing') return <Landing onLoginClick={() => setAppState('login')} />;
  if (appState === 'login') return <Login db={db} onLogin={handleLogin} />;

  const activeAccount = getActiveAccount(db);
  const activeWorkspace = getActiveWorkspace(db);
  const isLocked = activeAccount?.isLocked && role !== 'superadmin';
  const hasPendingSettlement = db?.settlementRequests?.some((s: SettlementRequest) => s.companyId === activeAccount?.id && s.status === 'pending');
  const isEnterprise = activeAccount?.plan === 'Enterprise';

  const availableWorkspaces = role === 'superadmin' ? db?.workspaces : db?.workspaces?.filter((w: Workspace) => {
    const ownerAccount = db.companies.find((c: any) => c.id === w.companyId);
    return ownerAccount?.email.toLowerCase() === authEmail?.toLowerCase();
  });

  const userName = role === 'superadmin' ? 'Platform Master' : role === 'manager' ? managerData?.name : activeAccount?.owner;
  const userRoleDisplay = role === 'superadmin' ? 'Master Admin' : role === 'manager' ? 'Fleet Manager' : 'Admin';

  return (
    <div className={`min-h-screen bg-[#F5F7F9] flex flex-col lg:flex-row font-sans overflow-hidden text-gray-900`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#F5F7F9] transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col px-4 py-8">
          <div className="px-4 mb-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">FP</div>
              <span className="font-bold text-lg tracking-tight">FleetPay</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400"><X size={20}/></button>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar px-2">
            {NAV_SECTIONS.map((section) => {
              // Filter items based on role permissions
              const filteredItems = section.items.filter(item => {
                if (role === 'superadmin') return item.id === 'admin-panel';
                if (role === 'manager') {
                  if (['dashboard', 'settings'].includes(item.id)) return true;
                  if (item.id === 'drivers') return managerData?.canManageDrivers;
                  if (item.id === 'advances') return managerData?.canManageAdvances;
                  if (item.id === 'deductions') return managerData?.canManageDeductions;
                  if (item.id === 'trips') return managerData?.canManageTrips;
                  if (item.id === 'payroll') return managerData?.canClosePayroll;
                  return false;
                }
                return item.id !== 'admin-panel';
              });

              if (filteredItems.length === 0 && role !== 'superadmin') return null;
              if (role === 'superadmin' && section.title !== 'Home') return null;

              return (
                <div key={section.title}>
                  <h3 className="px-4 mb-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{section.title}</h3>
                  <div className="space-y-1">
                    {role === 'superadmin' && section.title === 'Home' && (
                      <NavItem 
                        active={activeView === 'admin-panel'} 
                        onClick={() => { setActiveView('admin-panel'); setIsSidebarOpen(false); }} 
                        icon={<Building2 size={18}/>} 
                        label="Platform Admin" 
                      />
                    )}
                    {filteredItems.map(item => (
                      <NavItem 
                        key={item.id} 
                        active={activeView === item.id} 
                        onClick={() => { setActiveView(item.id as ViewType); setIsSidebarOpen(false); }} 
                        icon={item.icon} 
                        label={item.label}
                        hasSub={item.hasSub}
                        locked={item.id === 'team' && !isEnterprise}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User Card at bottom */}
          <div className="mt-auto px-2">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-gray-100">
                  {activeAccount?.email ? (
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Avatar" />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate leading-none mb-1">{userName || 'Unknown User'}</p>
                  <p className="text-[10px] font-medium text-gray-400 truncate">{userRoleDisplay}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {isLocked && (
          <div className="bg-rose-600 py-2 px-8 flex items-center justify-between text-white z-50">
            <div className="flex items-center gap-3">
              <ShieldAlert size={16} />
              <p className="text-[11px] font-bold uppercase tracking-widest">{hasPendingSettlement ? "Verification pending..." : "Account Restricted: Settle MNC payment"}</p>
            </div>
            {!hasPendingSettlement && role === 'user' && (
              <button onClick={() => setShowPaymentLockPopup(true)} className="px-4 py-1 bg-white text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">Pay Now</button>
            )}
          </div>
        )}
        
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden text-gray-400"><Menu size={20} /></button>
            <h2 className="font-bold text-gray-700 capitalize">{activeView.replace('-', ' ')}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            {isEnterprise && (
              <button onClick={() => setIsWorkspaceModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                <Building2 size={14} />
                <span className="hidden sm:inline">{activeWorkspace?.name || 'Loading...'}</span>
                <ChevronDown size={14} />
              </button>
            )}
            {!isEnterprise && role !== 'superadmin' && (
               <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-amber-100">
                  {activeAccount?.plan} Plan
               </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {db && (role === 'superadmin' ? <AdminPanel db={db} onRefresh={refresh} /> : (
               activeView === 'dashboard' ? <Dashboard db={db} onRefresh={refresh} /> :
               activeView === 'drivers' ? <Drivers db={db} onRefresh={refresh} /> :
               activeView === 'advances' ? <Advances db={db} onRefresh={refresh} /> :
               activeView === 'deductions' ? <Deductions db={db} onRefresh={refresh} /> :
               activeView === 'trips' ? <Trips db={db} onRefresh={refresh} /> :
               activeView === 'payroll' ? <Payroll db={db} onRefresh={refresh} /> :
               activeView === 'team' ? <Team db={db} onRefresh={refresh} /> :
               <Settings db={db} onRefresh={refresh} userRole={role} managerData={managerData} />
            ))}
          </div>
        </div>
      </div>

      {isWorkspaceModalOpen && isEnterprise && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[500] p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-900 tracking-tight">Switch Workshop</h2>
                 <button onClick={() => setIsWorkspaceModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-2">
                 {availableWorkspaces?.map((ws: Workspace) => (
                   <button key={ws.id} onClick={() => handleSwitchWorkspace(ws.id)} className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${ws.id === db?.activeWorkspaceId ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${ws.id === db?.activeWorkspaceId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{ws.name.charAt(0)}</div>
                         <div>
                            <p className={`font-bold text-sm ${ws.id === db?.activeWorkspaceId ? 'text-blue-900' : 'text-gray-800'}`}>{ws.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase truncate max-w-[150px]">{ws.address}</p>
                         </div>
                      </div>
                      {ws.id === db?.activeWorkspaceId && <Check size={18} className="text-blue-600" />}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, locked, hasSub }: any) => (
  <button 
    onClick={onClick} 
    disabled={locked}
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${active ? 'bg-white shadow-sm ring-1 ring-black/5 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'} ${locked ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
  >
    <div className="flex items-center gap-3">
      <span className={`${active ? 'text-blue-600' : 'text-gray-400'}`}>{icon}</span>
      <span className="font-bold text-[13px] tracking-tight">{label}</span>
    </div>
    <div className="flex items-center gap-1">
      {locked && <Lock size={12} className="text-gray-300" />}
      {hasSub && <ChevronDown size={14} className="text-gray-300" />}
    </div>
  </button>
);

export default App;
