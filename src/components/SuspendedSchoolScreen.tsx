import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  LogOut, 
  Mail, 
  Phone, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  Send, 
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';
import { School } from '../types';

interface SuspendedSchoolScreenProps {
  school: School;
  onLogout: () => void;
  darkTheme: boolean;
  onRefresh: () => void;
}

export default function SuspendedSchoolScreen({ 
  school, 
  onLogout, 
  darkTheme,
  onRefresh
}: SuspendedSchoolScreenProps) {
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);
  
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'stripe'>('razorpay');

  const [loading, setLoading] = useState(false);

  // Send support message to Super Admin (registers an audit log/action)
  const handleContactSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    
    setIsSubmittingSupport(true);
    try {
      // Post to edit-billing or simply trigger a general update to record support message in audit logs
      const resp = await fetch(`/api/schools/${school.id}/edit-billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: `Support request filed by school: "${supportMessage}"`,
          adminName: `${school.name} Admin`
        })
      });
      if (resp.ok) {
        setSupportSuccess(true);
        setSupportMessage('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  // Renew / Pay Invoice simulation to instantly reactivate school in preview environment
  const handleRenewPayment = async () => {
    setIsPaying(true);
    try {
      const resp = await fetch(`/api/schools/${school.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: school.subscription,
          durationMonths: 12,
          outstandingAmount: 0,
          reason: `Self-Service Renewal Payment processed via integrated checkout gateway (${paymentMethod.toUpperCase()}).`,
          adminName: `${school.name} Administrator`
        })
      });
      if (resp.ok) {
        setPaymentSuccess(true);
        setTimeout(() => {
          onRefresh(); // Instantly reloads active status, unlocking the system!
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  const handleManualSync = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onRefresh();
    setLoading(false);
  };

  const isSuspended = school.status === 'Suspended';
  const outstanding = school.outstandingAmount || 0;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors ${
      darkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Container Card */}
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Banner Headers */}
        <div className={`px-6 py-8 text-center relative ${
          isSuspended 
            ? 'bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border-b border-red-500/20' 
            : 'bg-gradient-to-r from-slate-500/10 via-slate-700/10 to-slate-500/10 border-b border-slate-500/20'
        }`}>
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-4 animate-bounce">
            {isSuspended ? (
              <AlertTriangle className="h-8 w-8" />
            ) : (
              <ShieldAlert className="h-8 w-8" />
            )}
          </div>
          
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {isSuspended ? 'Subscription Expired & Suspended' : 'ERP Workspace Disabled'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">
            {isSuspended 
              ? `Access to ${school.name}'s school administration dashboard has been temporarily suspended due to a past-due account status.`
              : `Access to ${school.name}'s school ERP instance has been disabled by the system platform administrators.`}
          </p>

          <button 
            onClick={handleManualSync}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            title="Force status sync"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>

        {/* School Metadata Details block */}
        <div className="p-6 border-b border-slate-150 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Details</h3>
            
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-400">School Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{school.name}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-400">Current Plan</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-950">
                {school.subscription} Plan
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5">
              <span className="font-semibold text-slate-400">Auto Renewal</span>
              <span className={`font-black ${school.autoRenewal ? 'text-emerald-500' : 'text-slate-400'}`}>
                {school.autoRenewal ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Subscription Invoicing</h3>
            
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-400">Expiration Date</span>
              <span className="font-bold text-red-600 dark:text-red-400">{school.licenseExpiry}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="font-semibold text-slate-400">Outstanding Balance</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                ₹{outstanding.toLocaleString('en-IN')}.00
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5">
              <span className="font-semibold text-slate-400">Payment Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                school.paymentStatus === 'Paid' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-950'
              }`}>
                {school.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action center tabs (Payment Simulation & Help request) */}
        <div className="p-6 space-y-6">
          {isSuspended && outstanding > 0 && !paymentSuccess && (
            <div className={`p-4 rounded-xl border ${
              darkTheme ? 'bg-slate-850/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pay Invoice & Restore Service Instantly</h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Resolve the outstanding balance to immediately reactive the school's workspace access.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="text-xs font-semibold text-slate-400">Gateway Selector:</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                          paymentMethod === 'razorpay'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : darkTheme ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Razorpay
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('stripe')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                          paymentMethod === 'stripe'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : darkTheme ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Stripe
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRenewPayment}
                      disabled={isPaying}
                      className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      {isPaying ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="h-3.5 w-3.5" />
                      )}
                      Pay ₹{outstanding.toLocaleString('en-IN')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Payment Successfully Processed!</h4>
                <p className="text-xs mt-0.5 text-emerald-500/90 dark:text-emerald-400/80 font-semibold">
                  Invoice resolved. Restoring full school ERP workspace modules, please wait...
                </p>
              </div>
            </div>
          )}

          {/* Contact Support communications section */}
          <div className={`p-4 rounded-xl border ${
            darkTheme ? 'bg-slate-850/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-slate-400" />
              Contact Platform Administrators
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
              Submit a support ticket regarding your account status directly to the SaaS Global Super Admin.
            </p>

            {supportSuccess ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Support request logged successfully. Super Admin has been notified.
              </div>
            ) : (
              <form onSubmit={handleContactSupport} className="space-y-3">
                <textarea
                  required
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Explain why you need an extension or provide details regarding pending payments..."
                  className={`w-full p-3 rounded-lg border text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all ${
                    darkTheme 
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-white border-slate-300 text-slate-850 placeholder-slate-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer ml-auto transition-colors"
                >
                  {isSubmittingSupport ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Send Ticket
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer controls */}
        <div className={`px-6 py-4 flex justify-between items-center ${
          darkTheme ? 'bg-slate-900/40 border-t border-slate-800' : 'bg-slate-100/50 border-t border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 font-bold">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>UTC TIMESTAMP: {new Date().toISOString().split('T')[0]}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-red-500 hover:bg-red-600 text-white hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout of Platform
          </button>
        </div>

      </div>
    </div>
  );
}
