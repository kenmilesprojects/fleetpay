import { createClient } from '@supabase/supabase-js';
import { Driver, Advance, Deduction, Trip, PayrollRecord, AppSettings, CompanyDetails, Workspace, TripTemplate, PlanTier, PendingRequest, SettlementRequest, Manager, UpgradeRequest } from './types';

const getEnvVar = (key: string, fallback: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key] as string;
    }
  } catch (e) {}
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
    default: return '₹'; 
  }
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username || username.length < 3) return false;
  const formatted = username.toLowerCase().includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@ft.in`;
  const { data: company } = await supabase.from('companies').select('id').eq('username', formatted).maybeSingle();
  if (company) return false;
  const { data: pending } = await supabase.from('pending_requests').select('id').eq('username', formatted).maybeSingle();
  if (pending) return false;
  return true;
};

export const verifySellingKey = async (key: string) => {
  // Verifies the key against the first platform admin's selling_key record
  const { data, error } = await supabase.from('platform_admins').select('selling_key').eq('selling_key', key).limit(1).maybeSingle();
  return !error && !!data;
};

export const verifyPlatformAdmin = async (email: string, pass: string) => {
  const { data, error } = await supabase.from('platform_admins').select('*').eq('email', email.toLowerCase()).eq('password', pass).single();
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

export const fetchFullDB = async (activeWorkspaceId: string | null, authUsername: string | null = null) => {
  const { data: accounts } = await supabase.from('companies').select('*');
  const accountIds = (accounts || []).map(a => a.id);

  const [workspacesRes, managersRes, pendingRes, settlementRes, upgradesRes] = await Promise.all([
    supabase.from('workspaces').select('*').in('company_id', accountIds),
    supabase.from('company_managers').select('*').in('company_id', accountIds),
    supabase.from('pending_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('settlement_requests').select('*').order('created_at', { ascending: false }),
    supabase.from('upgrade_requests').select('*').order('created_at', { ascending: false })
  ]);

  const workspaces = (workspacesRes.data || []).map((w: any) => ({ ...w, companyId: w.company_id, isPhoneVerified: !!w.is_phone_verified, createdAt: w.created_at }));
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
      cusId: a.cus_id,
      username: a.username,
      companyAddress: a.company_address,
      recoveryCode: a.recovery_code, 
      isLocked: !!a.is_locked,
      planDuration: a.plan_duration || 1, 
      startDate: a.start_date,
      createdAt: a.created_at 
    })),
    workspaces,
    drivers: (driversRes.data || []).map((d: any) => ({ ...d, workspaceId: d.workspace_id, companyId: d.company_id, joiningDate: d.joining_date, monthlySalary: d.monthly_salary, isActive: d.is_active })),
    advances: (advancesRes.data || []).map((a: any) => ({ ...a, workspaceId: a.workspace_id, companyId: a.company_id, driverId: a.driver_id })),
    deductions: (deductionsRes.data || []).map((d: any) => ({ ...d, workspaceId: d.workspace_id, companyId: d.company_id, driverId: d.driver_id })),
    trips: (tripsRes.data || []).map((t: any) => ({ ...t, workspaceId: t.workspace_id, companyId: t.company_id, driverId: t.driver_id })),
    tripTemplates: (templatesRes.data || []).map((t: any) => ({ ...t, workspaceId: t.workspace_id, companyId: t.company_id, defaultAmount: t.default_amount })),
    payroll: (payrollRes.data || []).map((p: any) => ({ ...p, workspaceId: p.workspace_id, companyId: p.company_id, driverId: p.driver_id, isClosed: p.is_closed })),
    pendingRequests: (pendingRes.data || []).map((r: any) => ({ 
      ...r, 
      businessName: r.business_name, ownerName: r.owner_name, username: r.username,
      durationMonths: r.duration_months, totalAmount: r.total_amount, finalAmount: r.final_amount,
      couponCode: r.coupon_code, discountPercentage: r.discount_percentage, requestedAt: r.created_at,
      upiId: r.upi_id, upiEmail: r.upi_email, paymentDetails: r.payment_details
    })),
    settlementRequests: (settlementRes.data || []).map((s: any) => ({ ...s, companyId: s.company_id, companyName: s.company_name, paymentMode: s.payment_mode, upiId: s.upi_id, upiEmail: s.upi_email, paymentDetails: s.payment_details, createdAt: s.created_at })),
    upgradeRequests: (upgradesRes.data || []).map((u: any) => ({ ...u, companyId: u.company_id, companyName: u.company_name, requestedPlan: u.requested_plan, durationMonths: u.duration_months, totalAmount: u.total_amount, paymentMethod: u.payment_method, upiId: u.upi_id, upiEmail: u.upi_email, paymentDetails: u.payment_details, createdAt: u.created_at })),
    managers: (managersRes.data || []).map((m: any) => ({ ...m, companyId: m.company_id, workspaceId: m.workspace_id, canManageDrivers: m.can_manage_drivers, canManageAdvances: m.can_manage_advances, canManageDeductions: m.can_manage_deductions, canManageTrips: m.can_manage_trips, canClosePayroll: m.can_close_payroll })),
    settings,
    auth: { username: authUsername || '', instanceId: 'FO360-V1' }
  };
};

export const getActiveAccount = (db: any): CompanyDetails => {
  const authUsername = localStorage.getItem('fleetpay_auth_username');
  if (authUsername) {
    const account = db?.companies?.find((c: any) => c.username?.toLowerCase() === authUsername.toLowerCase());
    if (account) return account;
  }
  const ws = db?.workspaces?.[0];
  const account = db?.companies?.find((c: any) => c.id === ws?.companyId);
  return account || db?.companies?.[0];
};

export const getActiveSettings = (db: any): AppSettings => {
  return db?.settings?.[db?.activeWorkspaceId] || {
    workspaceId: db?.activeWorkspaceId || '',
    calcType: 'prorated',
    currency: 'INR',
    paymentTypes: ['Cash', 'Bank Transfer', 'UPI']
  };
};

export const getActiveCompany = (db: any): CompanyDetails => {
  return db?.companies?.find((c: any) => c.id === db?.activeCompanyId) || db?.companies?.[0];
};

export const getActiveWorkspace = (db: any): Workspace => {
  return db?.workspaces?.find((w: any) => w.id === db?.activeWorkspaceId) || db?.workspaces?.[0];
};

export const updateAccountByUsername = async (username: string, updates: any) => {
  const mapped: any = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.owner !== undefined) mapped.owner = updates.owner;
  if (updates.email !== undefined) mapped.email = updates.email;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.isLocked !== undefined) mapped.is_locked = updates.isLocked;
  if (updates.password !== undefined) mapped.password = updates.password;
  if (updates.recoveryCode !== undefined) mapped.recovery_code = updates.recoveryCode;
  if (updates.plan !== undefined) mapped.plan = updates.plan;
  if (updates.planDuration !== undefined) mapped.plan_duration = updates.planDuration;
  if (updates.startDate !== undefined) mapped.start_date = updates.startDate;
  
  const { error } = await supabase.from('companies').update(mapped).eq('username', username.toLowerCase());
  if (error) throw error;
};

export const resetRecoveryCode = async (username: string) => {
  const newRecovery = 'REC-' + Math.random().toString(36).slice(-4).toUpperCase() + '-' + Math.random().toString(36).slice(-4).toUpperCase();
  await updateAccountByUsername(username, { recoveryCode: newRecovery });
  return newRecovery;
};

export const resetPassword = async (username: string) => {
  // Generate 9-character alphanumeric password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let newPass = '';
  for (let i = 0; i < 9; i++) newPass += chars.charAt(Math.floor(Math.random() * chars.length));
  await updateAccountByUsername(username, { password: newPass });
  return newPass;
};

export const toggleAccountLock = async (username: string, currentLock: boolean) => {
  await updateAccountByUsername(username, { isLocked: !currentLock });
};

export const toggleAccountStatus = async (username: string, currentStatus: string) => {
  await updateAccountByUsername(username, { status: currentStatus === 'active' ? 'suspended' : 'active' });
};

export const deleteAccountByUsername = async (username: string) => {
  const { data: company } = await supabase.from('companies').select('id').eq('username', username.toLowerCase()).single();
  if (!company) return;
  await Promise.all([
    supabase.from('workspaces').delete().eq('company_id', company.id),
    supabase.from('drivers').delete().eq('company_id', company.id),
    supabase.from('advances').delete().eq('company_id', company.id),
    supabase.from('deductions').delete().eq('company_id', company.id),
    supabase.from('trips').delete().eq('company_id', company.id),
    supabase.from('payroll').delete().eq('company_id', company.id),
    supabase.from('company_managers').delete().eq('company_id', company.id),
    supabase.from('settlement_requests').delete().eq('company_id', company.id),
    supabase.from('upgrade_requests').delete().eq('company_id', company.id)
  ]);
  await supabase.from('companies').delete().eq('id', company.id);
};

export const provisionCompany = async (client: any) => {
  const pass = Math.random().toString(36).slice(-8).toUpperCase();
  const recovery = 'REC-' + Math.random().toString(36).slice(-4).toUpperCase() + '-' + Math.random().toString(36).slice(-4).toUpperCase();
  const cusId = 'cus' + Math.floor(100000 + Math.random() * 900000);
  
  const { data: company, error: cErr } = await supabase.from('companies').insert([{ 
    name: client.name, 
    owner: client.owner, 
    email: client.email, 
    username: client.username,
    plan: client.plan, 
    plan_duration: client.plan_duration || client.planDuration || 1,
    start_date: new Date().toISOString().split('T')[0],
    password: pass, 
    recovery_code: recovery, 
    cus_id: cusId,
    status: 'active', 
    is_locked: false 
  }]).select().single();
  
  if (cErr) throw cErr;
  
  const { data: ws } = await supabase.from('workspaces').insert([{ company_id: company.id, name: client.name, address: 'Global Headquarters', phone: '000-000-0000' }]).select().single();
  await supabase.from('settings').insert([{ workspace_id: ws.id, calc_type: 'prorated', currency: 'INR', payment_types: ['Cash', 'Bank Transfer', 'UPI'] }]);
  
  return { email: client.email, username: client.username, pass, recovery, business: client.name, cusId };
};

export const approvePendingRequest = async (request: any) => {
  const creds = await provisionCompany({ 
    name: request.businessName, owner: request.ownerName, email: request.email, 
    username: request.username, plan: request.plan, planDuration: request.durationMonths 
  });
  await supabase.from('pending_requests').delete().eq('id', request.id);
  return creds;
};

export const addDriver = async (workspaceId: string, companyId: string, driver: any) => {
  const { error } = await supabase.from('drivers').insert([{ workspace_id: workspaceId, company_id: companyId, name: driver.name, phone: driver.phone, joining_date: driver.joining_date || driver.joiningDate, monthly_salary: driver.monthly_salary || driver.monthlySalary, is_active: true }]);
  if (error) throw error;
};

export const updateDriver = async (id: string, driver: any) => {
  const { error } = await supabase.from('drivers').update({ name: driver.name, phone: driver.phone, joining_date: driver.joining_date || driver.joiningDate, monthly_salary: driver.monthly_salary || driver.monthlySalary }).eq('id', id);
  if (error) throw error;
};

export const deleteDriver = async (id: string) => {
  const { error } = await supabase.from('drivers').update({ is_active: false }).eq('id', id);
  if (error) throw error;
};

export const saveAdvance = async (workspaceId: string, companyId: string, advance: any) => {
  const { error } = await supabase.from('advances').upsert([{ workspace_id: workspaceId, company_id: companyId, driver_id: advance.driverId, amount: advance.amount, date: advance.date, description: advance.description, id: advance.id }]);
  if (error) throw error;
};

export const deleteAdvance = async (id: string) => {
  const { error } = await supabase.from('advances').delete().eq('id', id);
  if (error) throw error;
};

export const saveDeduction = async (workspaceId: string, companyId: string, deduction: any) => {
  const { error } = await supabase.from('deductions').upsert([{ workspace_id: workspaceId, company_id: companyId, driver_id: deduction.driverId, amount: deduction.amount, date: deduction.date, reason: deduction.reason, id: deduction.id }]);
  if (error) throw error;
};

export const deleteDeduction = async (id: string) => {
  const { error } = await supabase.from('deductions').delete().eq('id', id);
  if (error) throw error;
};

export const saveTrip = async (workspaceId: string, companyId: string, trip: any) => {
  const { error } = await supabase.from('trips').upsert([{ workspace_id: workspaceId, company_id: companyId, driver_id: trip.driverId, route: trip.route, date: trip.date, allowance: trip.allowance, status: trip.status, id: trip.id }]);
  if (error) throw error;
};

export const deleteTrip = async (id: string) => {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
};

export const finalizePayroll = async (workspaceId: string, companyId: string, record: any) => {
  const { error } = await supabase.from('payroll').upsert([{ workspace_id: workspaceId, company_id: companyId, driver_id: record.driverId, month: record.month, base_salary: record.baseSalary, total_advances: record.totalAdvances, total_deductions: record.totalDeductions, total_allowances: record.totalAllowances, final_salary: record.finalSalary, is_closed: true }]);
  if (error) throw error;
};

export const saveWorkspace = async (workspace: any) => {
  const { error } = await supabase.from('workspaces').update({ name: workspace.name, address: workspace.address, phone: workspace.phone }).eq('id', workspace.id);
  if (error) throw error;
};

// --- FIX: Added missing exported members ---

/**
 * Deletes a pending provisioning request from the database.
 */
export const deletePendingRequest = async (id: string) => {
  const { error } = await supabase.from('pending_requests').delete().eq('id', id);
  if (error) throw error;
};

/**
 * Submits a new pending provisioning request.
 */
export const submitPendingRequest = async (request: any) => {
  const { error } = await supabase.from('pending_requests').insert([{
    business_name: request.businessName,
    owner_name: request.ownerName,
    email: request.email,
    username: request.username,
    plan: request.plan,
    duration_months: request.durationMonths,
    total_amount: request.totalAmount,
    final_amount: request.finalAmount,
    coupon_code: request.couponCode,
    discount_percentage: request.discountPercentage,
    upi_id: request.upiId,
    upi_email: request.upiEmail
  }]);
  if (error) throw error;
};

/**
 * Approves a settlement request and unlocks the associated company node.
 */
export const approveSettlementRequest = async (id: string, companyId: string) => {
  const { error: sErr } = await supabase.from('settlement_requests').update({ status: 'approved' }).eq('id', id);
  if (sErr) throw sErr;
  const { error: cErr } = await supabase.from('companies').update({ is_locked: false }).eq('id', companyId);
  if (cErr) throw cErr;
};

/**
 * Rejects a settlement request.
 */
export const rejectSettlementRequest = async (id: string) => {
  const { error } = await supabase.from('settlement_requests').update({ status: 'rejected' }).eq('id', id);
  if (error) throw error;
};

/**
 * Approves a plan upgrade request and updates the company's active tier.
 */
export const approveUpgradeRequest = async (id: string, companyId: string, plan: string) => {
  const { error: uErr } = await supabase.from('upgrade_requests').update({ status: 'approved' }).eq('id', id);
  if (uErr) throw uErr;
  const { error: cErr } = await supabase.from('companies').update({ plan }).eq('id', companyId);
  if (cErr) throw cErr;
};

/**
 * Rejects a plan upgrade request.
 */
export const rejectUpgradeRequest = async (id: string) => {
  const { error } = await supabase.from('upgrade_requests').update({ status: 'rejected' }).eq('id', id);
  if (error) throw error;
};

/**
 * Saves or updates a company manager's profile and permissions.
 */
export const saveManager = async (manager: any) => {
  const mapped = {
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
  const { error } = await supabase.from('company_managers').upsert([manager.id ? { ...mapped, id: manager.id } : mapped]);
  if (error) throw error;
};

/**
 * Deletes a manager from the company registry.
 */
export const deleteManager = async (id: string) => {
  const { error } = await supabase.from('company_managers').delete().eq('id', id);
  if (error) throw error;
};