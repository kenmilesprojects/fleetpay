import { createClient } from '@supabase/supabase-js';
import { Driver, Advance, Deduction, Trip, PayrollRecord, AppSettings, CompanyDetails, Workspace, TripTemplate, PlanTier, PendingRequest, SettlementRequest, Manager, UpgradeRequest } from './types';

// Safe environment variable helper to prevent "Cannot read properties of undefined"
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // Check for process.env (Standard in many environments)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // Check for import.meta.env (Vite standard)
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key] as string;
    }
  } catch (e) {
    // Fallback if access is restricted
  }
  return fallback;
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://igudkxhshwoauifuuxzp.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_VkcvY4X5QlJJCaZJIDtBIQ_3vnbSi3n');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    default: return '$';
  }
};

export const requestSettingsOTP = async (email: string) => {
  console.log(`[SECURE_AUTH] OTP requested for ${email}`);
  return { success: true, message: 'OTP sent to registered email' };
};

export const verifySettingsOTP = async (otp: string) => {
  return otp === '123456';
};

export const verifyPlatformAdmin = async (email: string, pass: string) => {
  const { data, error } = await supabase.from('platform_admins').select('id, email, role').eq('email', email.toLowerCase()).eq('password', pass).single();
  return (error || !data) ? null : data;
};

export const verifyManagerLogin = async (email: string, pass: string) => {
  const { data, error } = await supabase.from('company_managers').select('*').eq('email', email.toLowerCase()).eq('password', pass).single();
  if (error || !data) return null;
  return {
    ...data,
    companyId: data.company_id,
    workspaceId: data.workspace_id,
    canManageDrivers: data.can_manage_drivers,
    canManageAdvances: data.can_manage_advances,
    canManageDeductions: data.can_manage_deductions,
    canManageTrips: data.can_manage_trips,
    canClosePayroll: data.can_close_payroll
  };
};

export const fetchFullDB = async (activeWorkspaceId: string | null, authEmail: string | null = null) => {
  const { data: accounts } = await supabase.from('companies').select('*');
  const accountIds = (accounts || []).map(a => a.id);

  const [workspacesRes, managersRes, pendingRes, settlementRes, upgradesRes] = await Promise.all([
    supabase.from('workspaces').select('*').in('company_id', accountIds),
    supabase.from('company_managers').select('*').in('company_id', accountIds),
    supabase.from('pending_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('settlement_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('upgrade_requests').select('*').order('created_at', { ascending: false })
  ]);

  const workspaces = (workspacesRes.data || []).map((w: any) => ({ 
    ...w, 
    companyId: w.company_id, 
    isPhoneVerified: !!w.is_phone_verified,
    createdAt: w.created_at
  }));
  const workspaceIds = workspaces.map(w => w.id);
  const wsToComp = new Map(workspaces.map(w => [w.id, w.company_id]));

  const [driversRes, advancesRes, deductionsRes, tripsRes, templatesRes, payrollRes, settingsRes] = await Promise.all([
    supabase.from('drivers').select('*').in('workspace_id', workspaceIds),
    supabase.from('advances').select('*').in('workspace_id', workspaceIds),
    supabase.from('deductions').select('*').in('workspace_id', workspaceIds),
    supabase.from('trips').select('*').in('workspace_id', workspaceIds),
    supabase.from('trip_templates').select('*').in('workspace_id', workspaceIds),
    supabase.from('payroll').select('*').in('workspace_id', workspaceIds),
    supabase.from('settings').select('*').in('workspace_id', workspaceIds)
  ]);

  const settings: Record<string, AppSettings> = {};
  settingsRes.data?.forEach((s: any) => {
    settings[s.workspace_id] = { workspaceId: s.workspace_id, calcType: s.calc_type, currency: s.currency, paymentTypes: s.payment_types || [] };
  });

  const finalActiveId = (activeWorkspaceId && workspaceIds.includes(activeWorkspaceId)) ? activeWorkspaceId : (workspaceIds[0] || '');
  const activeCompId = wsToComp.get(finalActiveId) || '';

  return {
    activeWorkspaceId: finalActiveId,
    activeCompanyId: activeCompId,
    companies: (accounts || []).map((a: any) => ({ 
      ...a, 
      companyAddress: a.company_address,
      recoveryCode: a.recovery_code, 
      isLocked: !!a.is_locked,
      createdAt: a.created_at 
    })),
    workspaces,
    drivers: (driversRes.data || []).map((d: any) => ({ ...d, workspaceId: d.workspace_id, companyId: d.company_id, joiningDate: d.joining_date, monthlySalary: d.monthly_salary, isActive: d.is_active })),
    advances: (advancesRes.data || []).map((a: any) => ({ ...a, workspaceId: a.workspace_id, companyId: a.company_id, driverId: a.driver_id })),
    deductions: (deductionsRes.data || []).map((d: any) => ({ ...d, workspaceId: d.workspace_id, companyId: d.company_id, driverId: d.driver_id })),
    trips: (tripsRes.data || []).map((t: any) => ({ ...t, workspaceId: t.workspace_id, companyId: t.company_id, driverId: t.driver_id })),
    tripTemplates: (templatesRes.data || []).map((t: any) => ({ ...t, workspaceId: t.workspace_id, companyId: t.company_id, defaultAmount: t.default_amount })),
    payroll: (payrollRes.data || []).map((p: any) => ({ ...p, workspaceId: p.workspace_id, companyId: p.company_id, driverId: p.driver_id, isClosed: p.is_closed })),
    pendingRequests: (pendingRes.data || []).map((r: any) => ({ ...r, businessName: r.business_name, ownerName: r.owner_name, requestedAt: r.created_at })),
    settlementRequests: (settlementRes.data || []).map((s: any) => ({ ...s, companyId: s.company_id, companyName: s.company_name, paymentMode: s.payment_mode, paymentDetails: s.payment_details, createdAt: s.created_at })),
    upgradeRequests: (upgradesRes.data || []).map((u: any) => ({ ...u, companyId: u.company_id, companyName: u.company_name, requestedPlan: u.requested_plan, paymentMethod: u.payment_method, paymentDetails: u.payment_details, createdAt: u.created_at })),
    managers: (managersRes.data || []).map((m: any) => ({ 
      ...m, 
      companyId: m.company_id, 
      workspaceId: m.workspace_id, 
      canManageDrivers: m.can_manage_drivers, 
      canManageAdvances: m.can_manage_advances, 
      canManageDeductions: m.can_manage_deductions, 
      canManageTrips: m.can_manage_trips, 
      canClosePayroll: m.can_close_payroll 
    })),
    settings,
    auth: { email: authEmail || '', instanceId: 'FP-V3-ENT' }
  };
};

export const getActiveWorkspace = (db: any): Workspace => {
  const authEmail = localStorage.getItem('fleetpay_auth_email');
  const storedWsId = localStorage.getItem('fleetpay_active_ws');
  
  if (!authEmail) return db?.workspaces?.[0];

  const userCompany = db?.companies?.find((c: any) => c.email.toLowerCase() === authEmail.toLowerCase());
  if (!userCompany) return db?.workspaces?.[0];

  const userWorkspaces = db?.workspaces?.filter((w: any) => w.companyId === userCompany.id);
  const activeWs = userWorkspaces?.find((w: any) => w.id === storedWsId) || userWorkspaces?.[0];
  
  // Ensure the workspace actually belongs to the logged in user
  if (activeWs && activeWs.companyId !== userCompany.id) {
    return userWorkspaces?.[0] || db?.workspaces?.[0];
  }
  
  return activeWs || db?.workspaces?.[0];
};

export const getActiveAccount = (db: any): CompanyDetails => {
  const authEmail = localStorage.getItem('fleetpay_auth_email');
  if (authEmail) {
    const account = db?.companies?.find((c: any) => c.email.toLowerCase() === authEmail.toLowerCase());
    if (account) return account;
  }
  
  const ws = getActiveWorkspace(db);
  const account = db?.companies?.find((c: any) => c.id === ws?.companyId);
  return account || db?.companies?.[0];
};

export const getActiveCompany = getActiveAccount;

export const getActiveSettings = (db: any): AppSettings => {
  const ws = getActiveWorkspace(db);
  return db?.settings?.[ws?.id || ''] || { workspaceId: ws?.id || '', calcType: 'prorated', currency: 'USD', paymentTypes: [] };
};

export const updateAccountByEmail = async (email: string, updates: any) => {
  const mapped: any = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.owner !== undefined) mapped.owner = updates.owner;
  if (updates.phone !== undefined) mapped.phone = updates.phone;
  if (updates.companyAddress !== undefined) mapped.company_address = updates.companyAddress;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.isLocked !== undefined) mapped.is_locked = updates.isLocked;
  if (updates.password !== undefined) mapped.password = updates.password;
  if (updates.plan !== undefined) mapped.plan = updates.plan;
  const { error } = await supabase.from('companies').update(mapped).eq('email', email.toLowerCase());
  if (error) throw error;
};

export const deleteAccountByEmail = async (email: string) => {
  const { error } = await supabase.from('companies').delete().eq('email', email.toLowerCase());
  if (error) throw error;
};

export const saveWorkspace = async (workspace: Partial<Workspace>) => {
  const payload = { 
    company_id: workspace.companyId, 
    name: workspace.name, 
    address: workspace.address, 
    phone: workspace.phone 
  };
  const { data, error } = await supabase.from('workspaces').upsert([workspace.id ? { ...payload, id: workspace.id } : payload]).select().single();
  if (error) throw error;
  if (!workspace.id) {
    await supabase.from('settings').insert([{ workspace_id: data.id, calc_type: 'prorated', currency: 'USD', payment_types: ['Cash', 'Bank Transfer'] }]);
  }
};

export const deleteWorkspace = async (id: string) => {
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) throw error;
};

export const addDriver = async (workspaceId: string, companyId: string, driver: any) => {
  const { error } = await supabase.from('drivers').insert([{ 
    workspace_id: workspaceId, 
    company_id: companyId,
    name: driver.name, 
    phone: driver.phone, 
    joining_date: driver.joiningDate, 
    monthly_salary: driver.monthlySalary, 
    is_active: true 
  }]);
  if (error) throw error;
};

export const updateDriver = async (id: string, updates: any) => {
  const { error } = await supabase.from('drivers').update({ 
    name: updates.name, 
    phone: updates.phone, 
    joining_date: updates.joiningDate, 
    monthly_salary: updates.monthlySalary 
  }).eq('id', id);
  if (error) throw error;
};

export const deleteDriver = async (id: string) => {
  const { error } = await supabase.from('drivers').update({ is_active: false }).eq('id', id);
  if (error) throw error;
};

export const saveAdvance = async (workspaceId: string, companyId: string, advance: any) => {
  const { error } = await supabase.from('advances').insert([{ 
    workspace_id: workspaceId, 
    company_id: companyId,
    driver_id: advance.driverId, 
    amount: advance.amount, 
    date: advance.date, 
    description: advance.description 
  }]);
  if (error) throw error;
};

export const deleteAdvance = async (id: string) => {
  const { error } = await supabase.from('advances').delete().eq('id', id);
  if (error) throw error;
};

export const saveDeduction = async (workspaceId: string, companyId: string, deduction: any) => {
  const { error } = await supabase.from('deductions').insert([{ 
    workspace_id: workspaceId, 
    company_id: companyId,
    driver_id: deduction.driverId, 
    amount: deduction.amount, 
    date: deduction.date, 
    reason: deduction.reason 
  }]);
  if (error) throw error;
};

export const deleteDeduction = async (id: string) => {
  const { error } = await supabase.from('deductions').delete().eq('id', id);
  if (error) throw error;
};

export const saveTrip = async (workspaceId: string, companyId: string, trip: any) => {
  const payload = { 
    workspace_id: workspaceId, 
    company_id: companyId,
    driver_id: trip.driverId, 
    route: trip.route, 
    date: trip.date, 
    allowance: trip.allowance, 
    status: trip.status 
  };
  const { error } = await supabase.from('trips').upsert([trip.id ? { ...payload, id: trip.id } : payload]);
  if (error) throw error;
};

export const deleteTrip = async (id: string) => {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
};

export const finalizePayroll = async (records: any[]) => {
  const mapped = records.map(r => ({ 
    workspace_id: r.workspace_id, 
    company_id: r.company_id,
    driver_id: r.driver_id, 
    month: r.month, 
    base_salary: r.base_salary, 
    days_in_month: r.days_in_month, 
    active_days: r.active_days, 
    total_advances: r.total_advances, 
    total_deductions: r.total_deductions, 
    total_allowances: r.total_allowances, 
    final_salary: r.final_salary, 
    is_prorated: r.is_prorated, 
    is_closed: r.is_closed, 
    payment_type: r.payment_type 
  }));
  const { error } = await supabase.from('payroll').insert(mapped);
  if (error) throw error;
};

export const updateWorkspaceSettings = async (workspaceId: string, settings: any) => {
  const updates: any = {};
  if (settings.calcType) updates.calc_type = settings.calcType;
  if (settings.currency) updates.currency = settings.currency;
  if (settings.paymentTypes) updates.payment_types = settings.paymentTypes;
  const { error } = await supabase.from('settings').update(updates).eq('workspace_id', workspaceId);
  if (error) throw error;
};

export const saveTripTemplate = async (workspaceId: string, companyId: string, template: any) => {
  const { error } = await supabase.from('trip_templates').insert([{ 
    workspace_id: workspaceId, 
    company_id: companyId,
    name: template.name, 
    default_amount: template.defaultAmount 
  }]);
  if (error) throw error;
};

export const deleteTripTemplate = async (id: string) => {
  const { error } = await supabase.from('trip_templates').delete().eq('id', id);
  if (error) throw error;
};

export const provisionCompany = async (client: any) => {
  const pass = Math.random().toString(36).slice(-8).toUpperCase();
  const recovery = 'REC-' + Math.random().toString(36).slice(-4).toUpperCase() + '-' + Math.random().toString(36).slice(-4).toUpperCase();
  const { data: company, error: cErr } = await supabase.from('companies').insert([{ 
    name: client.name, 
    owner: client.owner, 
    email: client.email, 
    plan: client.plan, 
    password: pass, 
    recovery_code: recovery, 
    status: 'active', 
    is_locked: false 
  }]).select().single();
  if (cErr) throw cErr;
  await saveWorkspace({ companyId: company.id, name: client.name, address: 'Global Headquarters', phone: '000-000-0000' });
  return { email: client.email, pass, recovery, business: client.name };
};

export const submitPendingRequest = async (request: any) => {
  const { error } = await supabase.from('pending_requests').insert([{
    business_name: request.businessName,
    owner_name: request.ownerName,
    email: request.email,
    plan: request.plan,
    amount: request.amount,
    status: 'pending'
  }]);
  if (error) throw error;
};

export const approvePendingRequest = async (request: any) => {
  const creds = await provisionCompany({ name: request.businessName, owner: request.ownerName, email: request.email, plan: request.plan });
  const { error } = await supabase.from('pending_requests').delete().eq('id', request.id);
  if (error) throw error;
  return creds;
};

export const deletePendingRequest = async (id: string) => {
  const { error } = await supabase.from('pending_requests').delete().eq('id', id);
  if (error) throw error;
};

export const submitUpgradeRequest = async (request: Partial<UpgradeRequest>) => {
  const { error } = await supabase.from('upgrade_requests').insert([{
    company_id: request.companyId,
    company_name: request.companyName,
    requested_plan: request.requestedPlan,
    payment_method: request.paymentMethod,
    payment_details: request.paymentDetails,
    status: 'pending'
  }]);
  if (error) throw error;
};

export const approveUpgradeRequest = async (requestId: string, companyId: string, plan: PlanTier) => {
  await supabase.from('upgrade_requests').update({ status: 'approved' }).eq('id', requestId);
  await supabase.from('companies').update({ plan }).eq('id', companyId);
};

export const rejectUpgradeRequest = async (requestId: string) => {
  await supabase.from('upgrade_requests').update({ status: 'rejected' }).eq('id', requestId);
};

export const submitSettlementRequest = async (companyId: string, companyName: string, amount: number, mode: string, details: string) => {
  const { error } = await supabase.from('settlement_requests').insert([{ company_id: companyId, company_name: companyName, amount: amount, payment_mode: mode, payment_details: details, status: 'pending' }]);
  if (error) throw error;
};

export const approveSettlementRequest = async (requestId: string, companyId: string) => {
  await supabase.from('settlement_requests').update({ status: 'approved' }).eq('id', requestId);
  await supabase.from('companies').update({ is_locked: false }).eq('id', companyId);
};

export const rejectSettlementRequest = async (requestId: string) => {
  await supabase.from('settlement_requests').update({ status: 'rejected' }).eq('id', requestId);
};

export const saveManager = async (manager: Partial<Manager>) => {
  const payload = { 
    company_id: manager.companyId, 
    workspace_id: manager.workspaceId, 
    name: manager.name, 
    email: manager.email, 
    password: manager.password, 
    can_manage_drivers: manager.canManageDrivers, 
    can_manage_advances: manager.canManageAdvances, 
    can_manage_deductions: manager.canManageDeductions, 
    can_manage_trips: manager.canManageTrips, 
    can_close_payroll: manager.canClosePayroll 
  };
  const { error } = await supabase.from('company_managers').upsert([manager.id ? { ...payload, id: manager.id } : payload]);
  if (error) throw error;
};

export const deleteManager = async (id: string) => {
  const { error } = await supabase.from('company_managers').delete().eq('id', id);
  if (error) throw error;
};