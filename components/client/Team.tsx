import React, { useState } from 'react';
import { saveManager, deleteManager, getActiveCompany } from '../../db';
import { Manager } from '../../types';
import { 
  UserPlus, ShieldCheck, X, 
  Settings as SettingsIcon, Trash2, CheckCircle2, AlertCircle, 
  Loader2, UserCog, ToggleLeft, ToggleRight, Fingerprint, Zap
} from 'lucide-react';

interface TeamProps {
  db: any;
  onRefresh: () => void;
}

export const Team = ({ db, onRefresh }: TeamProps) => {
  const activeCompany = getActiveCompany(db);
  const isEnterprise = activeCompany?.plan === 'Enterprise';
  const managers = db.managers.filter((m: Manager) => m.companyId === activeCompany.id);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 relative">
      <div className="p-10 bg-indigo-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <h1 className="text-4xl font-black tracking-tighter">Team Management</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {managers.map((mgr: Manager) => (
          <div key={mgr.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl group">
            <h3 className="font-black text-gray-800 text-lg leading-tight">{mgr.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};