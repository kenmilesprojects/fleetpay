import React, { useMemo, useState } from 'react';
import { finalizePayroll, getCurrencySymbol, getActiveCompany, getActiveSettings } from '../../db';
import { Calculator, Lock, Unlock, Loader2, CheckCircle, Wallet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, differenceInDays, getDaysInMonth, parseISO, isAfter, isBefore, isValid } from 'date-fns';

interface PayrollProps {
  db: any;
  onRefresh: () => void;
}

export const Payroll = ({ db, onRefresh }: PayrollProps) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isSaving, setIsSaving] = useState(false);

  const activeSettings = getActiveSettings(db);
  const activeCompany = getActiveCompany(db);
  const isLocked = activeCompany?.isLocked;
  const symbol = getCurrencySymbol(activeSettings.currency);

  const payrollData = useMemo(() => {
    const monthDate = parseISO(`${selectedMonth}-01`);
    if (!isValid(monthDate)) return [];
    
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonthCount = getDaysInMonth(monthDate);

    return db.drivers
      .filter((d: any) => d.workspaceId === db.activeWorkspaceId)
      .map((driver: any) => {
        const joinDate = parseISO(driver.joiningDate);
        if (isAfter(joinDate, monthEnd)) return null;

        const currentMonthAdvances = db.advances.filter((a: any) => a.driverId === driver.id && a.date.startsWith(selectedMonth) && a.workspaceId === db.activeWorkspaceId);
        const totalAdvances = currentMonthAdvances.reduce((sum: number, a: any) => sum + Number(a.amount), 0);

        const currentMonthDeductions = db.deductions.filter((d: any) => d.driverId === driver.id && d.date.startsWith(selectedMonth) && d.workspaceId === db.activeWorkspaceId);
        const totalDeductions = currentMonthDeductions.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

        const currentMonthTrips = db.trips.filter((t: any) => t.driverId === driver.id && t.date.startsWith(selectedMonth) && t.status === 'completed' && t.workspaceId === db.activeWorkspaceId);
        const totalAllowances = currentMonthTrips.reduce((sum: number, t: any) => sum + Number(t.allowance), 0);

        const baseSalary = driver.monthlySalary;
        const finalSalary = baseSalary - totalAdvances - totalDeductions + totalAllowances;
        const record = db.payroll.find((p: any) => p.driverId === driver.id && p.month === selectedMonth && p.workspaceId === db.activeWorkspaceId);
        const isClosed = !!record?.isClosed;

        return { ...driver, baseSalary, totalAdvances, totalDeductions, totalAllowances, finalSalary, isClosed };
      })
      .filter(Boolean);
  }, [db, selectedMonth, db.activeWorkspaceId]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl">
            <Calculator size={32} />
          </div>
          <div><h1 className="text-2xl font-black text-gray-800">Payroll Records</h1></div>
        </div>
        <input type="month" className="px-6 py-3 border border-gray-100 rounded-2xl outline-none font-black text-sm bg-gray-50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
      </div>
    </div>
  );
};