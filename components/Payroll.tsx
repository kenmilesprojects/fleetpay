
import React, { useMemo, useState } from 'react';
import { finalizePayroll, getCurrencySymbol, getActiveCompany, getActiveSettings } from '../db';
import { Calculator, Lock, Unlock, Loader2, CheckCircle, Wallet, History } from 'lucide-react';
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
  const isProratedGlobal = activeSettings.calcType === 'prorated';
  const symbol = getCurrencySymbol(activeSettings.currency);

  const payrollData = useMemo(() => {
    const monthDate = parseISO(`${selectedMonth}-01`);
    if (!isValid(monthDate)) return [];
    
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonthCount = getDaysInMonth(monthDate);

    // Strictly filter by activeWorkspaceId
    return db.drivers
      .filter((d: any) => d.workspaceId === db.activeWorkspaceId)
      .map((driver: any) => {
        const joinDate = parseISO(driver.joiningDate);
        const leaveDateRaw = driver.leavingDate;
        const leaveDate = leaveDateRaw ? parseISO(leaveDateRaw) : null;
        
        if (isAfter(joinDate, monthEnd)) return null;
        if (leaveDate && isBefore(leaveDate, monthStart)) return null;

        let effectiveStart = monthStart;
        let effectiveEnd = monthEnd;

        if (isAfter(joinDate, monthStart)) effectiveStart = joinDate;
        if (leaveDate && isBefore(leaveDate, monthEnd)) effectiveEnd = leaveDate;

        const activeDays = Math.max(0, differenceInDays(effectiveEnd, effectiveStart) + 1);

        let baseSalary = 0;
        if (isProratedGlobal) {
          baseSalary = (driver.monthlySalary / daysInMonthCount) * activeDays;
        } else {
          baseSalary = activeDays > 0 ? driver.monthlySalary : 0;
        }

        const currentMonthAdvances = db.advances.filter((a: any) => a.driverId === driver.id && a.date.startsWith(selectedMonth) && a.workspaceId === db.activeWorkspaceId);
        const totalAdvances = currentMonthAdvances.reduce((sum: number, a: any) => sum + Number(a.amount), 0);

        const currentMonthDeductions = db.deductions.filter((d: any) => d.driverId === driver.id && d.date.startsWith(selectedMonth) && d.workspaceId === db.activeWorkspaceId);
        const totalDeductions = currentMonthDeductions.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

        const currentMonthTrips = db.trips.filter((t: any) => t.driverId === driver.id && t.date.startsWith(selectedMonth) && t.status === 'completed' && t.workspaceId === db.activeWorkspaceId);
        const totalAllowances = currentMonthTrips.reduce((sum: number, t: any) => sum + Number(t.allowance), 0);

        const finalSalary = baseSalary - totalAdvances - totalDeductions + totalAllowances;
        const record = db.payroll.find((p: any) => p.driverId === driver.id && p.month === selectedMonth && p.workspaceId === db.activeWorkspaceId);
        const isClosed = !!record?.isClosed;

        return {
          ...driver,
          activeDays,
          baseSalary,
          totalAdvances,
          totalDeductions,
          totalAllowances,
          finalSalary,
          isClosed,
          tripCount: currentMonthTrips.length,
          paymentType: record?.paymentType || activeSettings.paymentTypes[0] || 'Bank Transfer'
        };
      })
      .filter(Boolean);
  }, [db, selectedMonth, isProratedGlobal, activeSettings, db.activeWorkspaceId]);

  const closeMonth = async () => {
    if (isLocked) return;
    setIsSaving(true);
    try {
      const records = payrollData.map((p: any) => ({
        workspace_id: db.activeWorkspaceId,
        company_id: db.activeCompanyId, 
        driver_id: p.id,
        month: selectedMonth,
        base_salary: p.baseSalary,
        days_in_month: getDaysInMonth(parseISO(`${selectedMonth}-01`)),
        active_days: p.activeDays,
        total_advances: p.totalAdvances,
        total_deductions: p.totalDeductions,
        total_allowances: p.totalAllowances,
        final_salary: p.finalSalary,
        is_prorated: isProratedGlobal,
        is_closed: true,
        payment_type: p.paymentType
      }));

      await finalizePayroll(records);
      await onRefresh();
      alert(`Payroll for ${selectedMonth} archived.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isMonthClosed = payrollData.length > 0 && payrollData.every((p: any) => p.isClosed);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
            <Calculator size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Payroll Records</h1>
            <p className="text-xs text-gray-400 font-medium">Automatic trip & advance reconciliation for this node.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <input type="month" className="px-6 py-3 border border-gray-100 rounded-2xl outline-none font-black text-sm bg-gray-50" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          {!isMonthClosed ? (
            <button onClick={closeMonth} disabled={isSaving || payrollData.length === 0 || isLocked} className={`flex items-center justify-center gap-2 px-8 py-3 text-white rounded-2xl font-black text-sm shadow-xl transition-all ${isLocked ? 'bg-gray-400' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : (isLocked ? <Lock size={18}/> : <Lock size={18} />)}
              {isLocked ? 'Account Restricted' : 'Finalize & Close'}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-100 text-emerald-700 rounded-2xl font-black text-sm uppercase tracking-widest"><CheckCircle size={18} /> History Locked</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-6">Driver & Payment</th>
                <th className="px-6 py-6 text-center">Service</th>
                <th className="px-6 py-6 text-right">Trip Credit</th>
                <th className="px-6 py-6 text-right">Debit Balance</th>
                <th className="px-8 py-6 text-right">Final Amount</th>
                <th className="px-6 py-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrollData.length === 0 && (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">No records for this node.</td></tr>
              )}
              {payrollData.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-800 leading-tight">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Wallet size={10} className="text-gray-400" />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{p.paymentType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-600">{p.activeDays}d</span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-emerald-600 font-bold">+{symbol}{p.totalAllowances.toLocaleString()}</span>
                      <span className="text-[8px] font-black text-gray-300 uppercase">{p.tripCount} Trips</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right text-rose-500 font-bold">
                    -{symbol}{(p.totalAdvances + p.totalDeductions).toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="inline-block px-5 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xl">
                      {symbol}{p.finalSalary.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    {p.isClosed ? <Lock size={16} className="text-emerald-500 mx-auto" /> : <Unlock size={16} className="text-gray-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
