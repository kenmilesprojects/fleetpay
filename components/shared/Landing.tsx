
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldCheck, Truck, BarChart3, Clock, 
  CheckCircle2, Mail, MapPin, Phone, MessageSquare, 
  ChevronRight, Facebook, Twitter, Linkedin, Globe,
  X, CreditCard, Lock, Loader2, PartyPopper, Building2, User,
  Smartphone, Monitor, Apple, Laptop, Cpu, HardDrive, UserCog, Zap,
  History as HistoryIcon, Layers, Globe2, Infinity, QrCode, AlertCircle, Database, Server, SmartphoneIcon, MonitorSmartphone, Gift, Sparkles,
  ChevronDown, HelpCircle, Shield, Check as CheckIcon,
  Search, Tag, Info, Navigation, Compass, Activity, ServerCog
} from 'lucide-react';
import { submitPendingRequest, getCurrencySymbol, checkUsernameAvailability } from '../../db';
import { PlanTier } from '../../types';

const LOGO_URL = "./logo.png";

const UPI_APPS = [
  { id: 'GPay', label: 'GPay' },
  { id: 'PhonePe', label: 'PhonePe' },
  { id: 'Paytm', label: 'Paytm' },
  { id: 'MobiKwik', label: 'MobiKwik' },
  { id: 'BHIM', label: 'BHIM' },
  { id: 'SuperMoney', label: 'SuperMoney' },
  { id: 'Other', label: 'Other' }
];

const PERIODS = [
  { label: '1 month', months: 1, discount: 0 },
  { label: '12 months', months: 12, discount: 15, tag: 'BEST VALUE' },
  { label: '24 months', months: 24, discount: 25, tag: 'POPULAR' },
  { label: '48 months', months: 48, discount: 40, tag: 'MAXIMUM SAVINGS' }
];

const VALID_COUPONS: Record<string, number> = {
  'fleetops36010%': 10,
  'fleetops36020%': 20,
  'fleetops36040%': 40,
  'launch2025': 25,
  'enterprise50': 50
};

const SummaryRow = ({ label, original, discounted, symbol, isNegative = false }: any) => (
  <div className="flex justify-between items-center text-sm">
     <span className="text-slate-500 font-medium">{label}</span>
     <div className="flex items-center gap-3">
        {original > discounted && !isNegative && <span className="text-slate-300 font-bold line-through">{symbol}{original.toLocaleString()}</span>}
        <span className={`font-black ${isNegative ? 'text-emerald-600' : 'text-slate-800'}`}>
          {isNegative ? '-' : ''}{symbol}{discounted.toLocaleString()}
        </span>
     </div>
  </div>
);

const FeatureBox = ({ icon: Icon, label, color }: { icon: any, label: string, color: string }) => (
  <div className={`p-8 ${color} text-white rounded-[2.5rem] flex flex-col items-center justify-center gap-4 shadow-4xl hover:scale-105 transition-transform duration-500`}>
    <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center shadow-inner">
      <Icon size={36} />
    </div>
    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-center">{label}</span>
  </div>
);

const PricingCard = ({ tier, price, period, features, featured, desc, onAction, symbol }: any) => {
  const periodData = PERIODS.find(p => p.months === period);
  const discount = periodData?.discount || 0;
  const monthlyDiscounted = Math.round(price * (1 - discount / 100));
  const total = monthlyDiscounted * period;
  const isFree = price === 0;

  return (
    <div className={`p-10 rounded-[3.5rem] border-2 flex flex-col h-full transition-all duration-500 hover:scale-[1.03] relative ${featured ? 'bg-blue-600 border-transparent text-white shadow-4xl shadow-blue-500/30' : 'bg-slate-900 border-slate-800 text-slate-100'}`}>
      {featured && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-2xl flex items-center gap-2">
           <p className="whitespace-nowrap font-black uppercase tracking-widest"><Sparkles size={12} className="inline mr-1"/> RECOMMENDED</p>
        </div>
      )}

      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3">{tier}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl md:text-5xl font-black tracking-tighter">{isFree ? '0' : symbol + monthlyDiscounted.toLocaleString()}</span>
          {!isFree && <span className="text-[10px] md:text-[11px] font-bold opacity-60 uppercase">/ Month</span>}
        </div>
        {!isFree && (
          <div className="mt-4 inline-block px-4 py-1.5 bg-white/10 rounded-xl text-[9px] font-black text-blue-300 uppercase tracking-widest shadow-inner">
            Saves {discount}% vs Monthly
          </div>
        )}
        <p className="text-xs font-medium opacity-70 mt-8 leading-relaxed min-h-[3rem]">{desc}</p>
      </div>

      <div className="flex-1 space-y-4 mb-10">
        {features.map((f: string) => (
          <div key={f} className="flex items-start gap-4">
            <div className={`mt-1 p-1 rounded-full ${featured ? 'bg-blue-300/30 text-blue-100' : 'bg-slate-700 text-blue-400'}`}>
               <CheckCircle2 size={14} />
            </div>
            <span className="text-xs font-bold opacity-85 leading-tight">{f}</span>
          </div>
        ))}
      </div>

      <div className={`mb-8 p-8 rounded-[2.2rem] ${featured ? 'bg-white/10 border border-white/10' : 'bg-slate-950/50 border border-slate-800'}`}>
         <div className="flex justify-between items-center mb-1">
            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Commitment</p>
         </div>
         <p className="text-2xl md:text-3xl font-black tracking-tight">{isFree ? '0' : symbol + total.toLocaleString()}</p>
         <p className="text-[9px] font-bold opacity-50 uppercase mt-1">{isFree ? 'Free Forever' : `Locked for ${period} Months`}</p>
      </div>

      <button onClick={onAction} className={`w-full py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${featured ? 'bg-white text-blue-600 hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700 hover:translate-y-[-2px]'}`}>Choose {tier}</button>
    </div>
  );
};

const InputField = ({ label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-3">
    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-3 leading-none">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.2rem] outline-none font-bold text-sm focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all shadow-inner focus:border-blue-500"
      value={value}
      onChange={(e) => onChange ? onChange(e.target.value) : null}
    />
  </div>
);

interface LandingProps {
  onLoginClick: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLoginClick }) => {
  const [activePaymentTier, setActivePaymentTier] = useState<{name: string, price: number} | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(48); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  
  const [paymentStep, setPaymentStep] = useState<'cart' | 'info' | 'method' | 'upi-app' | 'upi-qr' | 'upi-form' | 'card'>('cart');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [qrTimer, setQrTimer] = useState(60); 
  const [upiDetails, setUpiDetails] = useState({ upiId: '', email: '' });

  const [checkoutData, setCheckoutData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    username: ''
  });

  // Username checking states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  const symbol = getCurrencySymbol('INR');
  const isFreePlan = activePaymentTier?.name === 'Basic Hub';

  // Debounced username check
  useEffect(() => {
    if (!checkoutData.username || checkoutData.username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const isAvail = await checkUsernameAvailability(checkoutData.username);
      setIsUsernameAvailable(isAvail);
      setIsCheckingUsername(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [checkoutData.username]);

  useEffect(() => {
    let interval: any;
    if (paymentStep === 'upi-qr' && qrTimer > 0) {
      interval = setInterval(() => setQrTimer(p => p - 1), 1000);
    } else if (qrTimer === 0 && paymentStep === 'upi-qr') {
      setPaymentStep('upi-form');
    }
    return () => clearInterval(interval);
  }, [paymentStep, qrTimer]);

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    const disc = VALID_COUPONS[couponCode.toLowerCase()];
    if (disc) {
      setAppliedDiscount(disc);
      setCouponSuccess(`Coupon Applied: ${disc}% Discount Active!`);
      setCouponError('');
    } else {
      setAppliedDiscount(0);
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(0);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  const resetAllForms = () => {
    setActivePaymentTier(null);
    setPaymentStep('cart');
    setSelectedMonths(48);
    setCheckoutData({ businessName: '', ownerName: '', email: '', username: '' });
    setUpiDetails({ upiId: '', email: '' });
    setCouponCode('');
    setAppliedDiscount(0);
    setCouponSuccess('');
    setCouponError('');
    setIsUsernameAvailable(null);
    setIsCheckingUsername(false);
    setIsPaymentSuccess(false);
  };

  const currentPeriod = PERIODS.find(p => p.months === selectedMonths) || PERIODS[3];
  const monthlyBase = activePaymentTier?.price || 0;
  
  const discountedMonthly = Math.round(monthlyBase * (1 - currentPeriod.discount / 100));
  const planSubtotal = discountedMonthly * selectedMonths;
  const couponSavings = Math.round(planSubtotal * (appliedDiscount / 100));
  const afterCouponSubtotal = planSubtotal - couponSavings;

  const taxableAmount = afterCouponSubtotal;
  const cgst = Math.round(taxableAmount * 0.09);
  const sgst = Math.round(taxableAmount * 0.09);
  const totalTaxes = cgst + sgst;
  const grandTotal = taxableAmount + totalTaxes;

  const handleStartPlan = (tier: string, price: number) => {
    setActivePaymentTier({ name: tier, price });
    setIsPaymentSuccess(false);
    setPaymentStep('cart');
    setSelectedMonths(48); 
    setQrTimer(60); 
    setCouponCode('');
    setAppliedDiscount(0);
    setCouponError('');
    setCouponSuccess('');
    setIsUsernameAvailable(null);
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.businessName || !checkoutData.ownerName || !checkoutData.email || !checkoutData.username) {
      alert("Please fill all identity fields.");
      return;
    }
    if (isUsernameAvailable === false) {
      alert("Hub Identity already taken. Please choose another one.");
      return;
    }
    if (isCheckingUsername) {
      alert("Still checking identity availability...");
      return;
    }

    if (isFreePlan) {
      finalizeRequest();
    } else {
      setPaymentStep('method');
    }
  };

  const finalizeRequest = async () => {
    if (!isFreePlan && paymentStep === 'upi-form' && (!upiDetails.upiId || !upiDetails.email)) {
      alert("Please provide manual payment details for verification.");
      return;
    }
    setIsProcessing(true);
    try {
      await submitPendingRequest({
        businessName: checkoutData.businessName,
        ownerName: checkoutData.ownerName,
        email: checkoutData.email,
        username: checkoutData.username.includes('@') ? checkoutData.username : `${checkoutData.username}@ft.in`,
        plan: activePaymentTier?.name as PlanTier,
        amount: monthlyBase.toString(),
        durationMonths: selectedMonths,
        totalAmount: planSubtotal + (Math.round(planSubtotal * 0.18)), 
        finalAmount: isFreePlan ? 0 : grandTotal,
        couponCode: appliedDiscount > 0 ? couponCode : undefined,
        discountPercentage: appliedDiscount,
        upiId: upiDetails.upiId || undefined,
        upiEmail: upiDetails.email || undefined
      });
      setIsProcessing(false);
      setIsPaymentSuccess(true);
      
      // Values are cleared when "Close Hub" is clicked, but resetting core data here too
      setCheckoutData({ businessName: '', ownerName: '', email: '', username: '' });
      setUpiDetails({ upiId: '', email: '' });
      setIsUsernameAvailable(null);
    } catch (err) {
      alert("Submission error.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-blue-100 font-sans">
      <header className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-xl border-b border-gray-100 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 overflow-hidden rounded-xl shadow-lg bg-white p-1">
               <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tighter">FleetOps360</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLoginClick} className="px-6 md:px-8 py-3 bg-blue-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">Launch App</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase border border-blue-100">
              <ShieldCheck size={14} /> Unified Logistics Ecosystem
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.95]">
              Seamless <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Automation</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 font-medium max-w-lg leading-relaxed">
              Connect Windows Desktop, Web Dashboard, and Phone Apps to a single cloud source. AI-powered diagnostics for every trip.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
               <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})} className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 group">
                 View Pricing <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
               </button>
               <button onClick={onLoginClick} className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-4 hover:bg-slate-50 transition-all">
                 Live Demo
               </button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-slate-900 aspect-square rounded-[4rem] p-12 flex items-center justify-center shadow-4xl overflow-hidden border-4 border-slate-800">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-900/10"></div>
               <div className="grid grid-cols-2 gap-8 relative z-10">
                  <FeatureBox icon={Database} label="Cloud Sync" color="bg-blue-600" />
                  <FeatureBox icon={SmartphoneIcon} label="Mobile Node" color="bg-indigo-600" />
                  <FeatureBox icon={Zap} label="AI Engine" color="bg-amber-500" />
                  <FeatureBox icon={Monitor} label="Desktop App" color="bg-emerald-600" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-32 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
              <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Ecosystem</h2>
              <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900">Platform Pillars</h3>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto">One registry, multiple endpoints. FleetOps360 synchronizes across every device in your workspace.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <PlatformCard icon={Monitor} title="Desktop Node" desc="High-performance Windows app for heavy data entry, offline registry support, and enterprise reporting." color="text-blue-600" tag="OPERATIONS" />
              <PlatformCard icon={Globe2} title="Cloud Hub" desc="Centralized web dashboard for fleet masters. Real-time monitoring and administrative control from anywhere." color="text-indigo-600" tag="MANAGEMENT" />
              <PlatformCard icon={Smartphone} title="Field Pulse" desc="Lightweight mobile UI for drivers and site supervisors. Submit trip logs and allowances on the go." color="text-emerald-600" tag="DRIVERS" />
           </div>
        </div>
      </section>

      {/* Journey History Section */}
      <section className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-10 order-2 lg:order-1">
              <div className="space-y-4">
                 <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Intelligence</h2>
                 <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900">Journey History</h3>
                 <p className="text-slate-500 font-medium leading-relaxed italic">"Transforming raw trip data into actionable logistics intelligence."</p>
              </div>
              <div className="space-y-8">
                 <ValueRow icon={Compass} title="Route Diagnostics" desc="Every mission is logged with precise route details and staff assignments." />
                 <ValueRow icon={Activity} title="Status Lifecycle" desc="Track journeys from 'Pending Authorization' to 'Verified Completion' seamlessly." />
                 <ValueRow icon={ServerCog} title="Registry Lock" desc="Enterprise-grade security ensuring mission data remains immutable and audited." />
              </div>
              <button onClick={onLoginClick} className="px-12 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-4xl hover:bg-blue-600 transition-all flex items-center gap-4">
                 Explore History <ArrowRight size={20}/>
              </button>
           </div>
           <div className="order-1 lg:order-2">
              <div className="relative p-2 bg-slate-100 rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden group">
                 <div className="bg-white rounded-[3rem] p-8 md:p-12 space-y-10">
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Missions</p>
                       <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                          <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <MockupRow route="Mumbai Port -> Pune Hub" personnel="Rahul Sharma" amount="₹2,400" status="Completed" statusColor="bg-emerald-100 text-emerald-700" />
                       <MockupRow route="Chennai Cluster -> Bangalore" personnel="David K." amount="₹1,850" status="Pending" statusColor="bg-amber-100 text-amber-700" />
                       <MockupRow route="Delhi Terminal -> Jaipur" personnel="Amit V." amount="₹3,200" status="Completed" statusColor="bg-emerald-100 text-emerald-700" />
                    </div>
                    <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Activity size={18} className="text-blue-500 animate-pulse" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Node Activity</span>
                       </div>
                       <span className="text-xs font-black text-slate-800">12 Missions Active</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 md:px-12 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Scaling</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter">Choose Your Cluster</h3>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto">All plans include standard cloud backup and node sync as default.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <PricingCard tier="Basic Hub" price={0} period={48} symbol={symbol} desc="Entry-level digitization." features={['2 Driver Slots', 'Manual Logs', 'No AI Support']} onAction={() => handleStartPlan('Basic Hub', 0)} />
            <PricingCard tier="Pro Cluster" price={149} period={48} symbol={symbol} desc="Growing fleet control." features={['10 Drivers', 'AI Diagnostics', 'Email Support']} onAction={() => handleStartPlan('Pro Cluster', 149)} />
            <PricingCard tier="Elite Network" price={299} period={48} symbol={symbol} featured desc="Professional logistics." features={['25 Drivers', 'AI Advisor+', 'Priority Hub']} onAction={() => handleStartPlan('Elite Network', 299)} />
            <PricingCard tier="Enterprise" price={499} period={48} symbol={symbol} desc="Unlimited global scale." features={['Unlimited Slots', 'Custom AI Models', '24/7 Node Support']} onAction={() => handleStartPlan('Enterprise', 499)} />
          </div>
        </div>
      </section>

      {activePaymentTier && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-100/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                 <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">{isPaymentSuccess ? 'Provisioning Success' : 'Deployment Hub'}</h1>
                 <button onClick={resetAllForms} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-full shadow-sm transition-all"><X size={24} /></button>
              </div>

              {!isPaymentSuccess && paymentStep === 'cart' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in slide-in-from-bottom duration-500">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200">
                       <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight uppercase">{activePaymentTier.name}</h2>
                       <div className="space-y-10">
                          <div className="max-w-xs">
                             <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Period</label>
                             <div className="relative group">
                               <select 
                                 value={selectedMonths}
                                 onChange={(e) => setSelectedMonths(parseInt(e.target.value))}
                                 className="w-full appearance-none bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                               >
                                 {PERIODS.map(p => (
                                   <option key={p.months} value={p.months}>{p.label}</option>
                                 ))}
                               </select>
                               <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-500 transition-colors pointer-events-none" size={20} />
                             </div>
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8 border-t border-slate-100">
                             <div><p className="text-slate-400 text-sm font-medium">Standard provisioning for the selected {selectedMonths} month cycle.</p></div>
                             <div className="text-right flex flex-col items-end">
                                <div className="text-right">
                                   <p className="text-3xl font-black text-slate-900">{symbol}{discountedMonthly.toLocaleString()}/mo</p>
                                   {currentPeriod.discount > 0 && <p className="text-slate-400 text-sm font-bold line-through">{symbol}{monthlyBase.toLocaleString()}/mo</p>}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-200 sticky top-10">
                       <h3 className="text-2xl font-black text-slate-800 mb-10 tracking-tight">Order summary</h3>
                       <div className="space-y-8">
                          <div className="space-y-5">
                             <SummaryRow label="Plan Total" original={monthlyBase * selectedMonths} discounted={planSubtotal} symbol={symbol} />
                             <SummaryRow label="Taxes (GST 18%)" original={0} discounted={totalTaxes} symbol={symbol} />
                             {appliedDiscount > 0 && (
                               <div className="flex justify-between items-center text-sm font-black text-emerald-600 pt-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                  <div className="flex items-center gap-2"><Tag size={14} /><span>Discount ({appliedDiscount}%)</span></div>
                                  <span>-{symbol}{couponSavings.toLocaleString()}</span>
                               </div>
                             )}
                          </div>
                          <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                             <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Subtotal</span>
                             <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{symbol}{isFreePlan ? '0' : grandTotal.toLocaleString()}</p>
                          </div>
                          {!isFreePlan && (
                             <div className="space-y-4">
                                <div className="flex gap-2">
                                   <div className="relative flex-1">
                                      <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${appliedDiscount > 0 ? 'text-emerald-500' : 'text-slate-300'}`} size={18} />
                                      <input placeholder="Promo Code" value={couponCode} readOnly={appliedDiscount > 0} onChange={(e) => setCouponCode(e.target.value)} className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-blue-100 transition-all ${appliedDiscount > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : couponError ? 'border-rose-200' : 'border-slate-50'}`} />
                                   </div>
                                   {appliedDiscount > 0 ? <button onClick={handleRemoveCoupon} className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-colors border border-rose-100">Remove</button> : <button onClick={handleApplyCoupon} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg">Apply</button>}
                                </div>
                                {couponError && <p className="text-[10px] font-bold text-rose-500 ml-4 italic">{couponError}</p>}
                                {couponSuccess && <p className="text-[10px] font-bold text-emerald-600 ml-4 italic flex items-center gap-2"><CheckCircle2 size={12}/> {couponSuccess}</p>}
                             </div>
                          )}
                          <button onClick={() => setPaymentStep('info')} className="w-full py-6 bg-blue-600 text-white rounded-[1.8rem] font-black text-lg shadow-2xl hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center gap-4">Continue <ChevronRight size={26}/></button>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {!isPaymentSuccess && paymentStep === 'info' && (
                <div className="max-w-xl mx-auto bg-white rounded-[4rem] p-12 md:p-16 shadow-3xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                   <h2 className="text-4xl font-black text-slate-900 mb-12 text-center tracking-tighter">Identity Registry</h2>
                   <form onSubmit={handleInfoSubmit} className="space-y-8">
                      <InputField label="Business Legal Name" placeholder="Logistics Global Inc." value={checkoutData.businessName} onChange={(v: string) => {
                        const generatedUsername = v.toLowerCase().replace(/\s+/g, '').substring(0, 10) + Math.floor(10 + Math.random()*89);
                        setCheckoutData({...checkoutData, businessName:v, username: generatedUsername});
                      }} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputField label="Fleet Master" placeholder="Owner Name" value={checkoutData.ownerName} onChange={(v: string) => setCheckoutData({...checkoutData, ownerName: v})} />
                        <InputField label="Registry Email" placeholder="ops@entity.io" type="email" value={checkoutData.email} onChange={(v: string) => setCheckoutData({...checkoutData, email: v})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-3 flex items-center justify-between">
                          Hub Identity
                          {isCheckingUsername && <span className="flex items-center gap-1 text-[8px] text-blue-500 animate-pulse"><Loader2 size={8} className="animate-spin" /> SCANNING...</span>}
                          {isUsernameAvailable === true && <span className="text-[8px] text-emerald-500 flex items-center gap-1"><CheckCircle2 size={8}/> IDENTITY AVAILABLE</span>}
                          {isUsernameAvailable === false && <span className="text-[8px] text-rose-500 flex items-center gap-1"><AlertCircle size={8}/> IDENTITY TAKEN</span>}
                        </label>
                        <div className="relative group">
                          <input 
                            className={`w-full px-8 py-6 bg-slate-50 border-2 rounded-[2.2rem] outline-none font-black text-sm transition-all pr-24 shadow-inner focus:bg-white ${isUsernameAvailable === true ? 'border-emerald-100 focus:border-emerald-500' : isUsernameAvailable === false ? 'border-rose-100 focus:border-rose-500' : 'border-slate-100 focus:border-blue-500'}`} 
                            value={checkoutData.username} 
                            onChange={(e) => setCheckoutData({...checkoutData, username: e.target.value.toLowerCase().replace(/\s+/g, '')})} 
                          />
                          <span className={`absolute right-8 top-1/2 -translate-y-1/2 font-black text-[10px] tracking-widest uppercase transition-colors ${isUsernameAvailable === true ? 'text-emerald-500' : isUsernameAvailable === false ? 'text-rose-500' : 'text-blue-600'}`}>@ft.in</span>
                        </div>
                      </div>
                      <div className="flex gap-6 pt-10">
                         <button type="button" onClick={() => setPaymentStep('cart')} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-[1.8rem] font-black text-xs uppercase tracking-widest transition-all">Back</button>
                         <button 
                           type="submit" 
                           disabled={isProcessing || isUsernameAvailable === false || isCheckingUsername} 
                           className={`flex-[2] py-6 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all ${isUsernameAvailable === false ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                         >
                            {isProcessing ? <Loader2 className="animate-spin inline" size={20}/> : (isFreePlan ? 'Complete Registry' : 'Initialize Hub')}
                         </button>
                      </div>
                   </form>
                </div>
              )}

              {!isPaymentSuccess && !isFreePlan && (paymentStep === 'method' || paymentStep === 'upi-app' || paymentStep === 'upi-qr' || paymentStep === 'upi-form') && (
                <div className="max-w-xl mx-auto bg-white rounded-[4rem] p-12 shadow-4xl border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                  {paymentStep === 'method' && (
                    <div className="text-center space-y-12">
                      <div className="space-y-2"><h2 className="text-4xl font-black tracking-tighter">Gateway Node</h2><p className="text-slate-400 font-medium italic">Authorized settlement gateways only.</p></div>
                      <div className="grid grid-cols-2 gap-8">
                        <button onClick={() => setPaymentStep('upi-app')} className="p-12 bg-slate-50 border-2 border-slate-100 rounded-[3rem] flex flex-col items-center gap-6 hover:border-blue-600 transition-all hover:scale-105 shadow-sm group">
                           <Smartphone size={48} className="text-slate-400 group-hover:text-blue-600 transition-colors" /><span className="font-black text-[10px] uppercase tracking-widest">Instant UPI</span>
                        </button>
                        <button onClick={() => alert('Card payments under security audit. Please use UPI.')} className="p-12 bg-slate-50 border-2 border-slate-100 rounded-[3rem] flex flex-col items-center gap-6 opacity-40 grayscale cursor-not-allowed">
                           <CreditCard size={48} className="text-slate-400" /><span className="font-black text-[10px] uppercase tracking-widest">Global Card</span>
                        </button>
                      </div>
                      <button onClick={() => setPaymentStep('info')} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500">Back to Identity</button>
                    </div>
                  )}
                  {paymentStep === 'upi-app' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                       <div className="text-center"><h3 className="text-3xl font-black tracking-tight">Authorized App Nodes</h3></div>
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {UPI_APPS.map(app => (
                            <button key={app.id} onClick={() => { setSelectedUpiApp(app.label); setPaymentStep('upi-qr'); setQrTimer(60); }} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col items-center gap-3 hover:border-blue-600 transition-all hover:scale-105 shadow-sm">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-xs shadow-inner uppercase">{app.label.charAt(0)}</div>
                               <span className="text-[10px] font-black uppercase tracking-widest">{app.label}</span>
                            </button>
                          ))}
                       </div>
                       <button onClick={() => setPaymentStep('method')} className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center hover:text-slate-500">Back</button>
                    </div>
                  )}
                  {paymentStep === 'upi-qr' && (
                    <div className="text-center space-y-12 py-10 animate-in zoom-in duration-500">
                       <div className="relative inline-block p-12 bg-white border-[12px] border-slate-50 rounded-[4.5rem] shadow-4xl">
                          <QrCode size={250} className="text-slate-900" />
                          <div className="absolute -top-10 -right-10 w-22 h-22 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-3xl border-8 border-white shadow-2xl">{qrTimer}</div>
                       </div>
                       <div className="space-y-4 px-4">
                          <h4 className="text-3xl font-black tracking-tight">Authorize with {selectedUpiApp}</h4>
                          <p className="text-slate-400 font-medium text-lg">Verification Node Listening... {qrTimer}s remaining.</p>
                          <div className="pt-8 flex flex-col gap-4">
                            <button onClick={() => setPaymentStep('upi-form')} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Already paid? Enter details manually</button>
                            <button onClick={() => setPaymentStep('upi-app')} className="text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-slate-500">Back</button>
                          </div>
                       </div>
                    </div>
                  )}
                  {paymentStep === 'upi-form' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                       <div className="text-center"><h3 className="text-4xl font-black tracking-tighter">Submission Node</h3><p className="text-slate-400 text-sm font-medium mt-2 italic">Manual settlement entry.</p></div>
                       <div className="space-y-8">
                          <InputField label="Transaction Ref / UPI ID" placeholder="TXN-XXXX-XXXX" value={upiDetails.upiId} onChange={(v:string) => setUpiDetails({...upiDetails, upiId:v})} />
                          <InputField label="Audit Verification Email" placeholder="ops@entity.io" value={upiDetails.email} onChange={(v:string) => setUpiDetails({...upiDetails, email:v})} />
                          <button onClick={finalizeRequest} disabled={isProcessing} className="w-full py-7 bg-slate-950 text-white rounded-[2.2rem] font-black text-xs uppercase tracking-[0.2em] shadow-4xl flex items-center justify-center gap-4 transition-all transform active:scale-95">{isProcessing ? <Loader2 className="animate-spin" size={26} /> : <ShieldCheck size={26} />}Commit Settlement Proof</button>
                          <button onClick={() => setPaymentStep('upi-qr')} className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest text-center hover:text-slate-500">Back to QR</button>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {isPaymentSuccess && (
                <div className="max-w-xl mx-auto p-20 text-center space-y-12 bg-white rounded-[5rem] shadow-4xl animate-in zoom-in duration-500 border-[12px] border-emerald-50">
                  <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[4rem] flex items-center justify-center mx-auto shadow-inner"><PartyPopper size={72} /></div>
                  <div className="space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Hub Provisioned!</h2>
                    <p className="text-slate-400 font-medium text-lg italic">{isFreePlan ? 'Your basic network cluster is now initializing.' : 'Proof of settlement submitted for audit.'}</p>
                  </div>
                  <div className="p-12 bg-blue-50/50 border border-blue-100 rounded-[3.5rem] text-blue-900 font-bold space-y-4 shadow-sm">
                     {isFreePlan ? (
                       <p className="text-xl leading-relaxed">Registration for <span className="text-blue-600 font-black">{activePaymentTier.name}</span> successful. Your hub is ready for use.</p>
                     ) : (
                       <div className="space-y-6">
                         <p className="text-sm font-black uppercase text-slate-500 tracking-widest">Audit Policy Notification</p>
                         <p className="text-lg leading-relaxed font-black text-blue-800">Due to a technical verification delay, our team will manually confirm your payment.</p>
                         <p className="text-sm font-medium italic text-blue-600">Your hub credentials will be delivered to your registry email within 1 hour.</p>
                       </div>
                     )}
                  </div>
                  <button onClick={resetAllForms} className="px-16 py-8 bg-slate-950 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-4xl hover:scale-105 transition-all">Close Hub</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-32 px-6 md:px-12 mt-20">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-16 mb-20">
               <div className="space-y-8">
                  <div className="flex items-center gap-3"><div className="w-12 h-12 overflow-hidden rounded-xl shadow-lg bg-white p-1"><img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" /></div><span className="font-black text-2xl tracking-tighter">FleetOps360</span></div>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">The global standard for logistics automation. Cloud-powered hub intelligence for enterprise fleets.</p>
               </div>
               <div className="space-y-8"><h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Registry Product</h4><ul className="space-y-4 text-sm font-bold text-slate-300"><li><a href="#home" className="hover:text-blue-500 transition-colors">Ecosystem Overview</a></li><li><a href="#pricing" className="hover:text-blue-500 transition-colors">Cluster Pricing</a></li><li><a href="#" className="hover:text-blue-500 transition-colors">Journey Diagnostics</a></li></ul></div>
               <div className="space-y-8"><h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Global Hub</h4><ul className="space-y-4 text-sm font-bold text-slate-300"><li><a href="#" className="hover:text-blue-500 transition-colors">About Cluster</a></li><li><a href="#" className="hover:text-blue-500 transition-colors">Privacy Registry</a></li></ul></div>
               <div className="space-y-8"><h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Authorized Support</h4><div className="space-y-6"><div className="flex items-start gap-4"><Mail size={18} className="text-blue-500 mt-1" /><div><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email Registry</p><p className="text-sm font-bold">ops@fleetops360.com</p></div></div><div className="flex items-start gap-4"><Phone size={18} className="text-blue-500 mt-1" /><div><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Support</p><p className="text-sm font-bold">+91 98765 43210</p></div></div></div></div>
            </div>
            <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8"><p className="text-xs font-black uppercase tracking-widest text-slate-500">&copy; 2025 FleetOps360 Unified Logistics OS. All cluster data audited.</p><div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500"><a href="#" className="hover:text-white transition-colors">Status</a><a href="#" className="hover:text-white transition-colors">Security Node</a></div></div>
         </div>
      </footer>
    </div>
  );
};

const PlatformCard = ({ icon: Icon, title, desc, color, tag }: any) => (
  <div className="p-10 bg-white border border-slate-100 rounded-[3.5rem] shadow-xl hover:shadow-2xl transition-all group">
     <div className="flex justify-between items-start mb-10"><div className={`w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}><Icon size={32} /></div><span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md">{tag}</span></div>
     <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">{title}</h3>
     <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const ValueRow = ({ icon: Icon, title, desc }: any) => (
  <div className="flex items-start gap-6 group"><div className="mt-1 p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><Icon size={20} /></div><div className="space-y-1"><h4 className="font-black text-slate-800 text-sm tracking-tight">{title}</h4><p className="text-[11px] text-slate-400 font-medium leading-relaxed">{desc}</p></div></div>
);

const MockupRow = ({ route, personnel, amount, status, statusColor }: any) => (
  <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
     <div className="flex items-center gap-4"><div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600"><Navigation size={18} /></div><div><p className="text-xs font-black text-slate-900 leading-none mb-1">{route}</p><p className="text-[10px] text-slate-400 font-medium">{personnel}</p></div></div>
     <div className="text-right space-y-2"><p className="text-xs font-black text-slate-900">{amount}</p><span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${statusColor}`}>{status}</span></div>
  </div>
);
