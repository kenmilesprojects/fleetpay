
import React, { useState } from 'react';
import { 
  ArrowRight, ShieldCheck, Truck, BarChart3, Clock, 
  CheckCircle2, Mail, MapPin, Phone, MessageSquare, 
  ChevronRight, Facebook, Twitter, Linkedin, Globe,
  X, CreditCard, Lock, Loader2, PartyPopper, Building2, User,
  Smartphone, Monitor, Apple, Laptop, Cpu, HardDrive, UserCog, Zap,
  History as HistoryIcon, Layers, Globe2, Infinity
} from 'lucide-react';
import { submitPendingRequest } from '../db';
import { PlanTier } from '../types';

interface LandingProps {
  onLoginClick: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLoginClick }) => {
  const [activePaymentTier, setActivePaymentTier] = useState<{name: string, price: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  const [checkoutData, setCheckoutData] = useState({
    businessName: '',
    ownerName: '',
    email: ''
  });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartPlan = (tier: string, price: string) => {
    setActivePaymentTier({ name: tier, price });
    setIsPaymentSuccess(false);
    setCheckoutData({ businessName: '', ownerName: '', email: '' });
  };

  const processPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      submitPendingRequest({
        businessName: checkoutData.businessName,
        ownerName: checkoutData.ownerName,
        email: checkoutData.email,
        plan: activePaymentTier?.name as PlanTier,
        amount: activePaymentTier?.price || '0'
      });

      setIsProcessing(false);
      setIsPaymentSuccess(true);
    }, 2000);
  };

  const isFreePlan = activePaymentTier?.price === 'Free';

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-blue-100 font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-xl border-b border-gray-100 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <span className="text-xl font-black italic">FP</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-gray-900">FleetPay</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10">
            {['home', 'about', 'history', 'platforms', 'pricing'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollTo(item)}
                className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={onLoginClick} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-800 hover:bg-gray-50 rounded-2xl transition-all">
              Sign In
            </button>
            <button onClick={onLoginClick} className="px-8 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:translate-y-[-2px] transition-all">
              Launch App
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-40 pb-20 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-50/50 rounded-full blur-[150px] -mr-96 -mt-96 pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100">
              <ShieldCheck size={14} /> Optimized Logistics Intelligence
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
              Precision <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Payroll</span> for Logistics.
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-lg leading-relaxed">
              Automate driver advances, trip allowances, and deductions across any device, anywhere your fleet operates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={onLoginClick} className="px-10 py-6 bg-gray-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:scale-105 transition-all flex items-center justify-center gap-4">
                Get Started Now <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollTo('about')} className="px-10 py-6 bg-white border-2 border-gray-100 text-gray-900 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:border-blue-200 transition-all flex items-center justify-center gap-3">
                Learn More <Zap size={20} className="text-amber-500" />
              </button>
            </div>
          </div>
          <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[4rem] p-1 shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
              <div className="bg-slate-900 w-full h-full rounded-[3.8rem] flex items-center justify-center p-12 overflow-hidden relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full blur-[100px] opacity-40"></div>
                 <div className="grid grid-cols-2 gap-6 w-full relative z-10">
                    <FeatureBox icon={<Truck />} label="Trips" color="bg-blue-500" />
                    <FeatureBox icon={<BarChart3 />} label="Analytics" color="bg-emerald-500" />
                    <FeatureBox icon={<UserCog />} label="Managers" color="bg-indigo-500" />
                    <FeatureBox icon={<ShieldCheck />} label="Compliance" color="bg-rose-500" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">The Backbone</h2>
            <h3 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900">Why FleetPay?</h3>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">We solve the complex financial friction between fleet owners and drivers through transparent, automated accounting.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <AboutCard 
              icon={<Zap size={32} />} 
              title="Instant Settlement" 
              desc="Real-time calculation of trip allowances and driver advances ensures your books are always current."
              color="text-amber-500"
            />
            <AboutCard 
              icon={<ShieldCheck size={32} />} 
              title="Audit Ready" 
              desc="Every transaction is logged with timestamps and manager signatures, making compliance effortless."
              color="text-blue-600"
            />
            <AboutCard 
              icon={<Infinity size={32} />} 
              title="Infinite Scale" 
              desc="From a single local hub to thousands of international workshops, our cloud architecture scales with you."
              color="text-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* History Section */}
      <section id="history" className="py-32 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/5 rounded-[3rem] blur-2xl"></div>
              <div className="relative p-12 bg-white rounded-[3rem] border border-gray-100 shadow-xl">
                 <HistoryIcon size={64} className="text-blue-600 mb-8" />
                 <h3 className="text-4xl font-black tracking-tight mb-6">Our Evolution</h3>
                 <div className="space-y-8">
                    <HistoryItem year="2021" event="Project Alpha: Initial fleet pilot program launches with 5 workshop nodes." />
                    <HistoryItem year="2022" event="Cloud Integration: Real-time Supabase sync introduced for global mobility." />
                    <HistoryItem year="2023" event="Enterprise Tier: Granular manager permissions and Multi-Company support added." />
                    <HistoryItem year="2024" event="Global Standard: Reached 10,000+ active drivers across 4 continents." />
                 </div>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-5xl font-black tracking-tighter leading-tight">Born in the <span className="text-blue-600">Workshop</span>, Built for the <span className="text-indigo-600">Cloud</span>.</h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                FleetPay didn't start in a boardroom. It started in a logistics hub where manual ledger errors were costing businesses thousands. We built a tool to solve our own problems, then realized the whole industry needed it.
              </p>
              <button onClick={() => scrollTo('platforms')} className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest group">
                Explore our infrastructure <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Highlight */}
      <section className="py-24 bg-indigo-900 text-white px-6 md:px-12 rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Enterprise Exclusive</div>
              <h3 className="text-5xl font-black tracking-tight">Granular Staff Control</h3>
              <p className="text-lg text-indigo-100/70 font-medium">Provision manager accounts with dedicated access rights. Disable or enable features for each staff member with a single toggle.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                 <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-sm font-bold uppercase tracking-widest">Drivers Mgmt</span>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-sm font-bold uppercase tracking-widest">Financial Entry</span>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-sm font-bold uppercase tracking-widest">Payroll Closing</span>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span className="text-sm font-bold uppercase tracking-widest">Journey Logs</span>
                 </div>
              </div>
           </div>
           <div className="flex justify-center">
              <div className="relative p-10 bg-white/5 rounded-[3rem] border border-white/10 w-full max-w-md">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center"><UserCog size={24}/></div>
                    <div>
                       <p className="font-black">Assign Permissions</p>
                       <p className="text-[10px] uppercase opacity-50">Enterprise Control Panel</p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <ToggleDemo label="Can add advances" on />
                    <ToggleDemo label="Can close payroll" />
                    <ToggleDemo label="Can manage drivers" on />
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section id="platforms" className="py-32 px-6 md:px-12 bg-slate-50 mt-20 rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Ecosystem</h2>
            <h3 className="text-5xl font-black tracking-tighter text-gray-900">Operate Everywhere.</h3>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">FleetPay is accessible across every platform your team uses, synced in real-time via our enterprise cloud.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <PlatformCard icon={<Monitor size={32} />} label="Web Dashboard" desc="Full administrative control via any modern browser." />
            <PlatformCard icon={<Smartphone size={32} />} label="Mobile App" desc="Dedicated iOS & Android apps for managers on the move." />
            <PlatformCard icon={<Apple size={32} />} label="Native macOS" desc="Optimized desktop performance for heavy accounting." />
            <PlatformCard icon={<Globe2 size={32} />} label="API Access" desc="Connect FleetPay data to your existing ERP systems." />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 md:px-12 bg-slate-900 text-white rounded-[4rem] mx-6 my-20 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Investment</h2>
            <h3 className="text-5xl font-black tracking-tighter">Enterprise Power</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <PricingCard tier="Starter" price="$49" features={['Up to 10 Drivers', 'Standard Payroll', 'Basic Reporting', 'Monthly Backup']} onAction={() => handleStartPlan('Starter', '$49')} />
            <PricingCard tier="Enterprise" price="$199" featured features={['Unlimited Drivers', 'Staff Permission Mgmt', 'Manager Role Provisioning', 'Multi-Company Sync', 'Daily Real-time Backup', 'Priority Support']} onAction={() => handleStartPlan('Enterprise', '$199')} />
            <PricingCard tier="Lite" price="Free" features={['2 Drivers Only', 'Manual Payroll', 'Basic Logs', 'No Backup']} onAction={() => handleStartPlan('Lite', 'Free')} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-24 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div className="col-span-2 space-y-8">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><span className="text-xl font-black italic">FP</span></div>
                <span className="text-xl font-black tracking-tighter">FleetPay</span>
             </div>
             <p className="text-gray-400 font-medium max-w-sm leading-relaxed">The global standard for logistics payroll automation. Precision accounting for fleets that never sleep.</p>
             <div className="flex gap-4">
                <SocialIcon icon={<Twitter size={20}/>} />
                <SocialIcon icon={<Linkedin size={20}/>} />
                <SocialIcon icon={<Facebook size={20}/>} />
             </div>
          </div>
          <div>
            <h5 className="font-black text-xs uppercase tracking-widest mb-6">Platform</h5>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Documentation</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Security</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">System Status</li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-xs uppercase tracking-widest mb-6">Company</h5>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors">Contact Support</li>
            </ul>
          </div>
        </div>
        <div className="mt-20 pt-10 border-t border-gray-100 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2025 FleetPay Systems • Enterprise Grade Platform</p>
        </div>
      </footer>

      {/* Checkout Modal */}
      {activePaymentTier && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500">
            <button onClick={() => setActivePaymentTier(null)} className="absolute top-8 right-8 p-3 bg-gray-50 text-gray-400 hover:text-rose-600 rounded-2xl transition-all z-10">
              <X size={20} />
            </button>
            {!isPaymentSuccess ? (
              <div className="p-10 md:p-14 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Provision Workspace</h2>
                  <p className="text-gray-400 font-medium">Plan: <span className="text-blue-600 font-black">{activePaymentTier.name}</span></p>
                </div>
                <form onSubmit={processPayment} className="space-y-6">
                  <div className="space-y-4">
                    <Input label="Business Name" placeholder="e.g. Swift Logistics" value={checkoutData.businessName} onChange={(v: string) => setCheckoutData({...checkoutData, businessName: v})} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Owner Name" placeholder="John Doe" value={checkoutData.ownerName} onChange={(v: string) => setCheckoutData({...checkoutData, ownerName: v})} />
                      <Input label="Work Email" placeholder="john@company.com" type="email" value={checkoutData.email} onChange={(v: string) => setCheckoutData({...checkoutData, email: v})} />
                    </div>
                  </div>
                  {!isFreePlan && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <Input label="Card Details" placeholder="4242 4242 4242 4242" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Expiry" placeholder="MM/YY" />
                        <Input label="CVV" placeholder="123" />
                      </div>
                    </div>
                  )}
                  <button disabled={isProcessing} type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 transition-all">
                    {isProcessing ? <><Loader2 className="animate-spin" /> Processing...</> : <>{isFreePlan ? 'Submit Request' : 'Activate & Pay'} <ArrowRight size={20} /></>}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-16 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><PartyPopper size={48} /></div>
                <h2 className="text-4xl font-black text-gray-900">Application Sent!</h2>
                <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 text-blue-800 font-bold">
                  The Master Admin will verify your Enterprise application. Credentials will be sent shortly.
                </div>
                <button onClick={() => setActivePaymentTier(null)} className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Return to Home</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureBox = ({ icon, label, color }: any) => (
  <div className={`p-6 ${color} text-white rounded-3xl flex flex-col items-center justify-center gap-3 shadow-2xl`}>
    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

const AboutCard = ({ icon, title, desc, color }: any) => (
  <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/20 hover:translate-y-[-8px] transition-all">
    <div className={`mb-6 ${color}`}>{icon}</div>
    <h4 className="text-xl font-black text-gray-900 mb-4 tracking-tight">{title}</h4>
    <p className="text-sm text-gray-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const HistoryItem = ({ year, event }: any) => (
  <div className="flex gap-6 items-start">
    <span className="text-blue-600 font-black text-sm">{year}</span>
    <p className="text-sm text-gray-500 font-medium leading-tight">{event}</p>
  </div>
);

const PlatformCard = ({ icon, label, desc }: any) => (
  <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-lg text-center flex flex-col items-center gap-4 hover:border-indigo-200 transition-colors">
    <div className="text-indigo-600 bg-indigo-50 p-4 rounded-2xl">{icon}</div>
    <h5 className="font-black text-gray-900 tracking-tight">{label}</h5>
    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const SocialIcon = ({ icon }: any) => (
  <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
    {icon}
  </button>
);

const ToggleDemo = ({ label, on }: any) => (
   <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
      <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${on ? 'bg-emerald-500' : 'bg-white/20'}`}>
         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${on ? 'left-6' : 'left-1'}`}></div>
      </div>
   </div>
);

const PricingCard = ({ tier, price, features, featured, onAction }: any) => (
  <div className={`p-12 rounded-[3.5rem] border-2 flex flex-col h-full transition-all duration-500 hover:scale-[1.02] ${featured ? 'bg-blue-600 border-transparent text-white shadow-2xl shadow-blue-500/30' : 'bg-slate-800 border-slate-700 text-slate-100'}`}>
    <div className="mb-10">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">{tier}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black tracking-tighter">{price}</span>
      </div>
    </div>
    <div className="flex-1 space-y-4 mb-10">
      {features.map((f: string) => (
        <div key={f} className="flex items-center gap-3">
          <CheckCircle2 size={16} className={featured ? 'text-blue-200' : 'text-blue-400'} />
          <span className="text-sm font-bold tracking-tight opacity-80">{f}</span>
        </div>
      ))}
    </div>
    <button onClick={onAction} className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${featured ? 'bg-white text-blue-600 hover:bg-gray-50' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
      Start Plan
    </button>
  </div>
);

const Input = ({ label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
      value={value}
      onChange={(e) => onChange ? onChange(e.target.value) : null}
    />
  </div>
);
