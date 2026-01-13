
import React from 'react';
import { Download, FileText, Globe, Mail, ShieldCheck, X } from 'lucide-react';

interface InvoiceProps {
  data: {
    invoiceNo: string;
    date: string;
    customerName: string;
    businessName: string;
    plan: string;
    duration: string;
    amount: number;
    upiId: string;
    email: string;
  };
  onClose: () => void;
}

export const InvoiceView: React.FC<InvoiceProps> = ({ data, onClose }) => {
  const baseAmount = Math.round(data.amount / 1.18);
  const totalTax = data.amount - baseAmount;
  const sgst = Math.round(totalTax / 2);
  const cgst = totalTax - sgst;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 overflow-y-auto">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          #invoice-printable, #invoice-printable * { visibility: visible !important; }
          #invoice-printable { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 2cm !important;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-4xl flex flex-col relative overflow-hidden my-auto">
        <div className="no-print p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
              <FileText size={20} />
            </div>
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-500">FleetOps360 Document Hub</span>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">
              <Download size={14} /> Download PDF
            </button>
            <button onClick={onClose} className="p-2.5 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-rose-600 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div id="invoice-printable" className="flex-1 p-12 md:p-20 bg-white text-slate-900 overflow-visible">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center p-3 shadow-lg">
                  <img src="../../logo.png" alt="Logo" className="w-full h-full object-contain invert" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900">FleetOps360</h1>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Logistics Intelligence</p>
                </div>
              </div>
              <div className="space-y-1 text-sm font-medium text-slate-400">
                <p>Digital Technology Park, Sector 44</p>
                <p>Node Cluster: FO-ADMIN-V3</p>
                <p className="text-slate-900 font-bold">GSTIN: 27AABCF1234F1Z1</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <h2 className="text-7xl font-black text-slate-50 tracking-tighter uppercase leading-none select-none">Invoice</h2>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Audit ID</p>
                <p className="text-lg font-mono font-bold text-slate-900 uppercase tracking-tighter">#{data.invoiceNo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 py-12 border-t border-b border-gray-100">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billed To (Authorized Hub)</p>
              <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">{data.businessName}</p>
                <p className="text-sm font-bold text-slate-500">Fleet Master: {data.customerName}</p>
              </div>
            </div>
            <div className="space-y-4 md:text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Tier</p>
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-900">{data.plan}</p>
                <p className="text-sm font-bold text-indigo-600">{data.duration} Months Service</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4">UPI TXN: {data.upiId}</p>
              </div>
            </div>
          </div>

          <table className="w-full mb-16">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-900">
                <th className="py-6 text-left">Service Provisions</th>
                <th className="py-6 text-center">SAC</th>
                <th className="py-6 text-right">Taxable Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-8">
                  <p className="font-black text-slate-800 text-lg">{data.plan} Subscription</p>
                  <p className="text-xs text-slate-400 mt-1 italic">Enterprise fleet management cluster provisioning and cloud data sync.</p>
                </td>
                <td className="py-8 text-center font-bold text-slate-600">997331</td>
                <td className="py-8 text-right font-black text-slate-900 text-lg">₹{baseAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="max-w-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                <ShieldCheck size={16} /> <span>Audited & Signed</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 font-medium">
                Digitally generated based on UPI transaction reference #{data.upiId}. No physical signature required.
              </p>
            </div>
            
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                <span>Base Total</span>
                <span className="text-slate-900">₹{baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                <span>CGST (9%)</span>
                <span className="text-slate-900">₹{cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                <span>SGST (9%)</span>
                <span className="text-slate-900">₹{sgst.toLocaleString()}</span>
              </div>
              <div className="pt-6 border-t-4 border-slate-900 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Grand Total</span>
                <span className="text-5xl font-black text-blue-600 tracking-tighter">₹{data.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
