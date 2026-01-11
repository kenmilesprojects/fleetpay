
import React from 'react';
import { 
  Users, 
  Truck, 
  Calculator, 
  LayoutDashboard,
  Settings,
  UserCog,
  LineChart,
  BookOpen,
  BarChart3,
  MapPin,
  User,
  LogOut,
  Wallet,
  ArrowDownCircle
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    title: 'Home',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LineChart size={18} /> },
    ]
  },
  {
    title: 'Task',
    items: [
      { id: 'advances', label: 'Advances', icon: <Wallet size={18} /> },
      { id: 'deductions', label: 'Deductions', icon: <ArrowDownCircle size={18} /> },
      { id: 'trips', label: 'Trips', icon: <Truck size={18} />, hasSub: true },
      { id: 'payroll', label: 'Payroll', icon: <Calculator size={18} /> },
    ]
  },
  {
    title: 'Masters',
    items: [
      { id: 'drivers', label: 'Fleet & Drivers', icon: <Users size={18} /> },
      { id: 'team', label: 'Staff Nodes', icon: <UserCog size={18} /> },
    ]
  },
  {
    title: 'Account',
    items: [
      { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ]
  }
];
