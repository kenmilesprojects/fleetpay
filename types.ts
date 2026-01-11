
export type PlanTier = 'Lite' | 'Starter' | 'Enterprise';

export interface PendingRequest {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  plan: PlanTier;
  amount: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SettlementRequest {
  id: string;
  companyId: string;
  companyName: string;
  amount: number;
  paymentMode: string;
  paymentDetails?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface UpgradeRequest {
  id: string;
  companyId: string;
  companyName: string;
  requestedPlan: PlanTier;
  paymentMethod: 'UPI' | 'CARD';
  paymentDetails: {
    upiApp?: 'GPay' | 'PhonePe' | 'BHIM' | 'Paytm';
    cardName?: string;
    cardOnName?: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CompanyDetails {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone?: string;
  companyAddress?: string;
  password?: string;
  recoveryCode?: string;
  plan: PlanTier;
  status: 'active' | 'suspended';
  isLocked: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  companyId: string;
  name: string;
  address: string;
  phone: string;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface Manager {
  id: string;
  companyId: string;
  workspaceId?: string;
  name: string;
  email: string;
  password?: string;
  canManageDrivers: boolean;
  canManageAdvances: boolean;
  canManageDeductions: boolean;
  canManageTrips: boolean;
  canClosePayroll: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  workspaceId: string;
  companyId: string;
  name: string;
  phone: string;
  joiningDate: string;
  monthlySalary: number;
  isActive: boolean;
}

export interface Advance {
  id: string;
  workspaceId: string;
  companyId: string;
  driverId: string;
  amount: number;
  date: string;
  description: string;
}

export interface Deduction {
  id: string;
  workspaceId: string;
  companyId: string;
  driverId: string;
  amount: number;
  date: string;
  reason: string;
}

export interface TripTemplate {
  id: string;
  workspaceId: string;
  companyId: string;
  name: string;
  defaultAmount: number;
}

export interface Trip {
  id: string;
  workspaceId: string;
  companyId: string;
  driverId: string;
  route: string;
  date: string;
  allowance: number;
  status: 'pending' | 'completed';
}

export interface AppSettings {
  workspaceId: string;
  calcType: 'prorated' | 'monthly';
  currency: string;
  paymentTypes: string[];
}

export interface PayrollRecord {
  id: string;
  workspaceId: string;
  companyId: string;
  driverId: string;
  month: string;
  baseSalary: number;
  daysInMonth: number;
  activeDays: number;
  totalAdvances: number;
  totalDeductions: number;
  totalAllowances: number;
  finalSalary: number;
  isProrated: boolean;
  isClosed: boolean;
  paymentType?: string;
}

export type ViewType = 'dashboard' | 'drivers' | 'advances' | 'deductions' | 'trips' | 'payroll' | 'settings' | 'admin-panel' | 'team';
