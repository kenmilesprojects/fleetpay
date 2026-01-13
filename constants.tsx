
import React from 'react';
import { 
  Users, 
  Truck as TruckIcon, 
  Calculator, 
  Settings,
  UserCog,
  LineChart,
  Wallet,
  ArrowDownCircle,
  Layers,
  Zap,
  ArrowUpCircle,
  CreditCard,
  Key,
  ShieldEllipsis,
  FileText,
  ShieldAlert,
  Contact2,
  PlusCircle
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    title: 'Home',
    isDropdown: false,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LineChart size={18} /> },
    ]
  },
  {
    title: 'Task',
    isDropdown: true,
    items: [
      { id: 'advances', label: 'Advances', icon: <Wallet size={18} /> },
      { id: 'deductions', label: 'Deductions', icon: <ArrowDownCircle size={18} /> },
      { id: 'trips', label: 'Trips', icon: <TruckIcon size={18} /> },
      { id: 'payroll', label: 'Payroll', icon: <Calculator size={18} /> },
      { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
    ]
  },
  {
    title: 'Masters',
    isDropdown: true,
    items: [
      { id: 'drivers', label: 'Drivers', icon: <Users size={18} /> },
      { id: 'trucks', label: 'Trucks', icon: <TruckIcon size={18} /> },
      { id: 'licenses', label: 'Driving Licenses', icon: <Contact2 size={18} /> },
      { id: 'insurance', label: 'Insurance', icon: <ShieldAlert size={18} /> },
      { id: 'team', label: 'Staff Nodes', icon: <UserCog size={18} /> },
    ]
  },
  {
    title: 'Account',
    isDropdown: false,
    items: [
      { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ]
  }
];

export const ADMIN_NAV_SECTIONS = [
  {
    title: 'Home',
    items: [
      { id: 'admin-registry', label: 'REGISTRY', icon: <Layers size={18} /> },
    ]
  },
  {
    title: 'Control',
    items: [
      { id: 'admin-provisioning', label: 'PROVISIONING', icon: <Zap size={18} />, badge: 'pendingCount' },
      { id: 'admin-upgrades', label: 'UPGRADES', icon: <ArrowUpCircle size={18} />, badge: 'upgradeCount' },
      { id: 'admin-audits', label: 'AUDITS', icon: <CreditCard size={18} />, badge: 'settlementCount' },
      { id: 'admin-reset-key', label: 'RESET KEY', icon: <Key size={18} /> },
      { id: 'admin-reset-pass', label: 'RESET PASS', icon: <ShieldEllipsis size={18} /> },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ]
  }
];
