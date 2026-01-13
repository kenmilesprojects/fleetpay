
export type PlanTier = 'Basic Hub' | 'Pro Cluster' | 'Elite Network' | 'Enterprise';

export interface PendingRequest {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  username: string;
  plan: PlanTier;
  amount: string;
  durationMonths: number;
  totalAmount: number;
  finalAmount: number; 
  couponCode?: string;
  discountPercentage?: number;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  upiId?: string;
  upiEmail?: string;
  paymentDetails?: string; 
}

export interface SettlementRequest {
  id: string;
  companyId: string;
  companyName: string;
  amount: number;
  paymentMode: string;
  upiId?: string;
  upiEmail?: string;
  paymentDetails?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface UpgradeRequest {
  id: string;
  companyId: string;
  companyName: string;
  requestedPlan: PlanTier;
  durationMonths: number;
  totalAmount: number;
  paymentMethod: 'UPI' | 'CARD';
  upiId?: string;
  upiEmail?: string;
  paymentDetails: {
    upiApp?: string;
    upiId?: string;
    transactionEmail?: string;
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
  cusId?: string;
  name: string;
  owner: string;
  email: string;
  username: string;
  phone?: string;
  companyAddress?: string;
  password?: string;
  recoveryCode?: string;
  plan: PlanTier;
  planDuration?: number; 
  startDate?: string;
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

export interface Truck {
  id: string;
  companyId: string;
  workspaceId: string;
  regNumber: string;
  model: string;
  truckType: string;
}

export interface License {
  id: string;
  driverId: string;
  licenseNumber: string;
  expiryDate: string;
}

export interface Insurance {
  id: string;
  truckId: string;
  policyNumber: string;
  provider: string;
  expiryDate: string;
}

export interface AppSettings {
  workspaceId: string;
  calcType: 'prorated' | 'monthly';
  currency: string;
  paymentTypes: string[];
  alertLicenseExpiry: boolean;
  alertInsuranceExpiry: boolean;
}

export type ViewType = 
  | 'dashboard' | 'drivers' | 'advances' | 'deductions' | 'trips' | 'payroll' | 'settings' | 'team'
  | 'trucks' | 'licenses' | 'insurance' | 'reports'
  | 'admin-registry' | 'admin-provisioning' | 'admin-upgrades' | 'admin-audits' | 'admin-reset-key' | 'admin-reset-pass';
