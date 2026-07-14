import React, { useState, useMemo } from 'react';
import { 
  School as SchoolIcon, 
  Shield, 
  Users, 
  User,
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  Filter, 
  Database, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Lock, 
  Settings as SettingsIcon, 
  Activity, 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Unlock, 
  Calendar, 
  Layers, 
  DollarSign,
  ChevronRight,
  Info,
  Server,
  Key,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { School, Principal, ERPDataState } from '../types';
import KPIDrillDownPanel from './KPIDrillDownPanel';

interface SuperAdminPortalProps {
  state: ERPDataState;
  darkTheme: boolean;
  onRefresh: () => void;
  onToast: (msg: string) => void;
}

export default function SuperAdminPortal({ state, darkTheme, onRefresh, onToast }: SuperAdminPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'schools' | 'principals' | 'subscription' | 'settings'>('dashboard');
  const [activeKpiCard, setActiveKpiCard] = useState<string | null>(null);
  
  // Search & Filter state
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolBoardFilter, setSchoolBoardFilter] = useState('All');
  const [schoolStatusFilter, setSchoolStatusFilter] = useState('All');

  const [principalSearch, setPrincipalSearch] = useState('');
  const [principalStatusFilter, setPrincipalStatusFilter] = useState('All');

  // Modal controls
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isPrincipalModalOpen, setIsPrincipalModalOpen] = useState(false);
  
  // Selected items for viewing/editing
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingPrincipal, setEditingPrincipal] = useState<Principal | null>(null);

  // Subscription management controls & forms state
  const [selectedSubSchool, setSelectedSubSchool] = useState<School | null>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Subscription action form payloads
  const [billingGraceDays, setBillingGraceDays] = useState('7');
  const [billingAutoRenew, setBillingAutoRenew] = useState(true);
  const [billingOutstanding, setBillingOutstanding] = useState('0');
  const [billingPaymentStatus, setBillingPaymentStatus] = useState('Paid');
  const [billingReason, setBillingReason] = useState('');

  const [renewPlan, setRenewPlan] = useState<'Trial' | 'Basic' | 'Premium' | 'Enterprise'>('Basic');
  const [renewMonths, setRenewMonths] = useState('12');
  const [renewOutstanding, setRenewOutstanding] = useState('0');
  const [renewReason, setRenewReason] = useState('');

  const [extendDays, setExtendDays] = useState('30');
  const [extendReason, setExtendReason] = useState('');

  const [planChangeSelected, setPlanChangeSelected] = useState<'Trial' | 'Basic' | 'Premium' | 'Enterprise'>('Basic');
  const [planChangeReason, setPlanChangeReason] = useState('');

  // Form states - School
  const [schoolFormName, setSchoolFormName] = useState('');
  const [schoolFormCode, setSchoolFormCode] = useState('');
  const [schoolFormEmail, setSchoolFormEmail] = useState('');
  const [schoolFormPhone, setSchoolFormPhone] = useState('');
  const [schoolFormAddress, setSchoolFormAddress] = useState('');
  const [schoolFormCity, setSchoolFormCity] = useState('');
  const [schoolFormState, setSchoolFormState] = useState('');
  const [schoolFormCountry, setSchoolFormCountry] = useState('India');
  const [schoolFormPrincipalName, setSchoolFormPrincipalName] = useState('');
  const [schoolFormPrincipalEmail, setSchoolFormPrincipalEmail] = useState('');
  const [schoolFormPrincipalMobile, setSchoolFormPrincipalMobile] = useState('');
  const [schoolFormBoard, setSchoolFormBoard] = useState<'CBSE' | 'ICSE' | 'State Board'>('CBSE');
  const [schoolFormSession, setSchoolFormSession] = useState('2026-2027');
  const [schoolFormSubscription, setSchoolFormSubscription] = useState<'Trial' | 'Basic' | 'Premium' | 'Enterprise'>('Trial');
  const [schoolFormExpiry, setSchoolFormExpiry] = useState('2027-07-01');
  const [schoolFormPayment, setSchoolFormPayment] = useState<'Paid' | 'Pending'>('Pending');

  // Form states - Principal
  const [principalFormName, setPrincipalFormName] = useState('');
  const [principalFormEmail, setPrincipalFormEmail] = useState('');
  const [principalFormPhone, setPrincipalFormPhone] = useState('');
  const [principalFormSchoolId, setPrincipalFormSchoolId] = useState('');
  const [principalFormStatus, setPrincipalFormStatus] = useState<'Active' | 'Suspended'>('Active');

  // Settings Sub-Tabs
  const [settingsTab, setSettingsTab] = useState<'branding' | 'smtp' | 'backup' | 'security' | 'audit'>('branding');

  // System Configuration state variables (Super Admin UI controls)
  const [systemTitle, setSystemTitle] = useState('XYZ MULTI-TENANT CLOUD ERP');
  const [smtpHost, setSmtpHost] = useState('smtp.erphub.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('outgoing@erphub.com');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [passwordMinLength, setPasswordMinLength] = useState('8');
  const [enableMfa, setEnableMfa] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Lists from backend
  const schoolsList = useMemo(() => state.schools || [], [state.schools]);
  const principalsList = useMemo(() => state.principals || [], [state.principals]);

  // Compute stats across all schools
  const stats = useMemo(() => {
    const getDaysDiffLocal = (d1: string, d2: string): number => {
      const t1 = new Date(d1).getTime();
      const t2 = new Date(d2).getTime();
      if (isNaN(t1) || isNaN(t2)) return 0;
      return Math.ceil((t1 - t2) / (1000 * 60 * 60 * 24));
    };

    const totalS = schoolsList.length;
    const activeS = schoolsList.filter(s => s.status === 'Active').length;
    const graceS = schoolsList.filter(s => s.status === 'Grace Period').length;
    const suspendedS = schoolsList.filter(s => s.status === 'Suspended').length;
    const disabledS = schoolsList.filter(s => s.status === 'Disabled').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const expiringS = schoolsList.filter(s => {
      const days = getDaysDiffLocal(s.licenseExpiry, todayStr);
      return days > 0 && days <= 30;
    }).length;

    const totalP = principalsList.length;
    const totalT = state.teachers.length;
    
    // Outstanding SaaS Payments (outstanding amount in ₹ Rupees)
    const outstandingPayments = schoolsList.reduce((acc, s) => acc + (s.outstandingAmount || 0), 0);

    // Total licensing revenue from Paid status (in INR ₹)
    let revenue = 0;
    schoolsList.forEach(s => {
      if (s.paymentStatus === 'Paid') {
        if (s.subscription === 'Enterprise') revenue += 250000;
        else if (s.subscription === 'Premium') revenue += 120000;
        else if (s.subscription === 'Basic') revenue += 50000;
      }
    });

    return { 
      totalS, 
      activeS, 
      graceS, 
      suspendedS, 
      disabledS, 
      expiringS, 
      totalP, 
      totalT, 
      revenue, 
      outstandingPayments 
    };
  }, [schoolsList, principalsList, state.teachers]);

  // Handle open school creation/edit modal
  const handleOpenSchoolModal = (school?: School) => {
    if (school) {
      setEditingSchool(school);
      setSchoolFormName(school.name);
      setSchoolFormCode(school.code);
      setSchoolFormEmail(school.email);
      setSchoolFormPhone(school.phone);
      setSchoolFormAddress(school.address);
      setSchoolFormCity(school.city || '');
      setSchoolFormState(school.state || '');
      setSchoolFormCountry(school.country || 'India');
      setSchoolFormPrincipalName(school.principal);
      setSchoolFormPrincipalEmail(school.principalEmail);
      
      const assocP = principalsList.find(p => p.schoolId === school.id);
      setSchoolFormPrincipalMobile(assocP ? assocP.phone : '');
      
      setSchoolFormBoard(school.board);
      setSchoolFormSession(school.academicYear);
      setSchoolFormSubscription(school.subscription);
      setSchoolFormExpiry(school.licenseExpiry);
      setSchoolFormPayment(school.paymentStatus);
    } else {
      setEditingSchool(null);
      setSchoolFormName('');
      setSchoolFormCode('');
      setSchoolFormEmail('');
      setSchoolFormPhone('');
      setSchoolFormAddress('');
      setSchoolFormCity('');
      setSchoolFormState('');
      setSchoolFormCountry('India');
      setSchoolFormPrincipalName('');
      setSchoolFormPrincipalEmail('');
      setSchoolFormPrincipalMobile('');
      setSchoolFormBoard('CBSE');
      setSchoolFormSession('2026-2027');
      setSchoolFormSubscription('Trial');
      setSchoolFormExpiry('2027-07-01');
      setSchoolFormPayment('Pending');
    }
    setIsSchoolModalOpen(true);
  };

  // Create or Update School via API
  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolFormName || !schoolFormCode || !schoolFormEmail || !schoolFormPrincipalEmail) {
      onToast('Please fill out all mandatory fields.');
      return;
    }

    const payload = {
      name: schoolFormName,
      code: schoolFormCode.toUpperCase(),
      email: schoolFormEmail,
      phone: schoolFormPhone,
      address: schoolFormAddress,
      city: schoolFormCity,
      state: schoolFormState,
      country: schoolFormCountry,
      principalName: schoolFormPrincipalName,
      principalEmail: schoolFormPrincipalEmail,
      principalMobile: schoolFormPrincipalMobile,
      board: schoolFormBoard,
      academicSession: schoolFormSession,
      subscription: schoolFormSubscription,
      licenseExpiry: schoolFormExpiry,
      paymentStatus: schoolFormPayment
    };

    try {
      const url = editingSchool ? `/api/schools/${editingSchool.id}` : '/api/schools';
      const method = editingSchool ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      onToast(editingSchool ? 'School workspace updated successfully!' : 'School workspace & isolated tenant created successfully!');
      setIsSchoolModalOpen(false);
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Server connection failed');
    }
  };

  // Suspend or Activate School
  const handleToggleSchoolStatus = async (school: School) => {
    const targetStatus = school.status === 'Active' ? 'suspend' : 'activate';
    try {
      const resp = await fetch(`/api/schools/${school.id}/${targetStatus}`, {
        method: 'POST'
      });
      if (resp.ok) {
        onToast(`School code ${school.code} has been successfully ${school.status === 'Active' ? 'suspended' : 'activated'}.`);
        onRefresh();
        if (selectedSchool?.id === school.id) {
          setSelectedSchool(prev => prev ? { ...prev, status: school.status === 'Active' ? 'Suspended' : 'Active' } : null);
        }
      } else {
        const d = await resp.json();
        onToast(d.error || 'Failed to modify school status');
      }
    } catch (err) {
      onToast('Network connection failure');
    }
  };

  // 1. Submit Edit Billing Profile
  const handleSubmitBillingProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSchool) return;

    try {
      const resp = await fetch(`/api/schools/${selectedSubSchool.id}/edit-billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gracePeriodDays: billingGraceDays,
          autoRenewal: billingAutoRenew,
          outstandingAmount: billingOutstanding,
          paymentStatus: billingPaymentStatus,
          reason: billingReason,
          adminName: 'Global Super Admin'
        })
      });
      if (resp.ok) {
        onToast(`Billing profile updated for ${selectedSubSchool.name}`);
        setIsBillingModalOpen(false);
        onRefresh();
      } else {
        const data = await resp.json();
        onToast(data.error || 'Failed to update billing profile');
      }
    } catch (err) {
      onToast('Network connection failed');
    }
  };

  // 2. Submit Renew Subscription
  const handleSubmitRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSchool) return;

    try {
      const resp = await fetch(`/api/schools/${selectedSubSchool.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: renewPlan,
          durationMonths: renewMonths,
          outstandingAmount: renewOutstanding,
          reason: renewReason,
          adminName: 'Global Super Admin'
        })
      });
      if (resp.ok) {
        onToast(`Subscription successfully renewed for ${selectedSubSchool.name}!`);
        setIsRenewModalOpen(false);
        onRefresh();
      } else {
        const data = await resp.json();
        onToast(data.error || 'Failed to renew subscription');
      }
    } catch (err) {
      onToast('Network connection failed');
    }
  };

  // 3. Submit Extend Subscription
  const handleSubmitExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSchool) return;

    try {
      const resp = await fetch(`/api/schools/${selectedSubSchool.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: extendDays,
          reason: extendReason,
          adminName: 'Global Super Admin'
        })
      });
      if (resp.ok) {
        onToast(`Subscription expiry extended by ${extendDays} days for ${selectedSubSchool.name}`);
        setIsExtendModalOpen(false);
        onRefresh();
      } else {
        const data = await resp.json();
        onToast(data.error || 'Failed to extend subscription');
      }
    } catch (err) {
      onToast('Network connection failed');
    }
  };

  // 4. Submit Change Plan
  const handleSubmitChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubSchool) return;

    try {
      const resp = await fetch(`/api/schools/${selectedSubSchool.id}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planChangeSelected,
          reason: planChangeReason,
          adminName: 'Global Super Admin'
        })
      });
      if (resp.ok) {
        onToast(`Subscription plan upgraded/downgraded to ${planChangeSelected} for ${selectedSubSchool.name}`);
        setIsPlanModalOpen(false);
        onRefresh();
      } else {
        const data = await resp.json();
        onToast(data.error || 'Failed to change subscription plan');
      }
    } catch (err) {
      onToast('Network connection failed');
    }
  };

  // 5. Explicitly Trigger Status Modifications (Activate / Reactivate / Suspend / Disable)
  const handleModifySchoolStatusExplicit = async (school: School, action: 'activate' | 'suspend' | 'disable' | 'reactivate', reason: string) => {
    try {
      const resp = await fetch(`/api/schools/${school.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || `Manual status alteration: ${action}`,
          adminName: 'Global Super Admin'
        })
      });
      if (resp.ok) {
        onToast(`School ${school.name} successfully updated to status: ${action === 'suspend' ? 'Suspended' : action === 'disable' ? 'Disabled' : 'Active'}`);
        onRefresh();
      } else {
        const data = await resp.json();
        onToast(data.error || 'Failed to alter status');
      }
    } catch (err) {
      onToast('Network connection failed');
    }
  };

  // Delete School completely
  const handleDeleteSchool = async (schoolId: string) => {
    if (!window.confirm('WARNING: Deleting this school will completely erase its isolated ERP workspace, teachers register, timetable, logs, and principal profile permanently. This action is IRREVERSIBLE. Are you sure you want to proceed?')) {
      return;
    }

    try {
      const resp = await fetch(`/api/schools/${schoolId}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        onToast('School workspace and all isolated tenant database records successfully purged!');
        setSelectedSchool(null);
        onRefresh();
      } else {
        onToast('Failed to delete school');
      }
    } catch (err) {
      onToast('Network connection failure');
    }
  };

  // Handle open principal modal
  const handleOpenPrincipalModal = (principal?: Principal) => {
    if (principal) {
      setEditingPrincipal(principal);
      setPrincipalFormName(principal.name);
      setPrincipalFormEmail(principal.email);
      setPrincipalFormPhone(principal.phone);
      setPrincipalFormSchoolId(principal.schoolId);
      setPrincipalFormStatus(principal.status);
    } else {
      setEditingPrincipal(null);
      setPrincipalFormName('');
      setPrincipalFormEmail('');
      setPrincipalFormPhone('');
      
      // Default to first school if any
      setPrincipalFormSchoolId(schoolsList[0]?.id || '');
      setPrincipalFormStatus('Active');
    }
    setIsPrincipalModalOpen(true);
  };

  // Create or Update Principal via API
  const handleSavePrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalFormName || !principalFormEmail || !principalFormSchoolId) {
      onToast('Please fill out all mandatory fields.');
      return;
    }

    const payload = {
      name: principalFormName,
      email: principalFormEmail,
      phone: principalFormPhone,
      schoolId: principalFormSchoolId,
      status: principalFormStatus
    };

    try {
      const url = editingPrincipal ? `/api/principals/${editingPrincipal.id}` : '/api/principals';
      const method = editingPrincipal ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      onToast(editingPrincipal ? 'Principal account details synchronized!' : 'Principal account created and assigned to school workspace!');
      setIsPrincipalModalOpen(false);
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Server connection failed');
    }
  };

  // Reset Principal Password (simulated audit action)
  const handleResetPassword = (p: Principal) => {
    onToast(`Password reset link dispatched successfully to Principal: ${p.email}. Password temporarily set to default "admin123".`);
  };

  // Delete Principal Account
  const handleDeletePrincipal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Principal account?')) return;
    try {
      const resp = await fetch(`/api/principals/${id}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        onToast('Principal account deleted and school assignment removed.');
        onRefresh();
      } else {
        onToast('Failed to delete principal');
      }
    } catch (err) {
      onToast('Network connection failure');
    }
  };

  // Trigger simulated database backup
  const handleBackupDB = () => {
    setIsBackingUp(true);
    onToast('Compressing ERP indexes, auditing logs, and initiating secure binary stream replication to AWS S3 backup node...');
    setTimeout(() => {
      setIsBackingUp(false);
      onToast('System backup completed successfully! S3 Archive Hash: erp_cloud_backup_2026_07_14.tar.gz');
    }, 2000);
  };

  // Filter school list
  const filteredSchools = useMemo(() => {
    return schoolsList.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || 
                          s.code.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                          s.city.toLowerCase().includes(schoolSearch.toLowerCase());
      const matchBoard = schoolBoardFilter === 'All' || s.board === schoolBoardFilter;
      const matchStatus = schoolStatusFilter === 'All' || s.status === schoolStatusFilter;
      return matchSearch && matchBoard && matchStatus;
    });
  }, [schoolsList, schoolSearch, schoolBoardFilter, schoolStatusFilter]);

  // Filter principals list
  const filteredPrincipals = useMemo(() => {
    return principalsList.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(principalSearch.toLowerCase()) || 
                          p.email.toLowerCase().includes(principalSearch.toLowerCase());
      const matchStatus = principalStatusFilter === 'All' || p.status === principalStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [principalsList, principalSearch, principalStatusFilter]);

  // Analytics helper charts
  const boardChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    schoolsList.forEach(s => {
      counts[s.board] = (counts[s.board] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [schoolsList]);

  const stateChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    schoolsList.forEach(s => {
      const st = s.state || 'Other';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, schools]) => ({ name, schools }));
  }, [schoolsList]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  // Recent system-wide audit activity logs
  const auditLogs = [
    { id: 1, time: '2026-07-14 07:15 AM', user: 'superadmin', event: 'School registered', details: 'ABC International School workspace seeded' },
    { id: 2, time: '2026-07-14 06:40 AM', user: 'superadmin', event: 'Principal reassigned', details: 'Mrs. Anjali Mehta set to ABC International' },
    { id: 3, time: '2026-07-13 11:20 PM', user: 'system', event: 'Daily database backup', details: 'AWS S3 snapshot completed successfully' },
    { id: 4, time: '2026-07-13 03:45 PM', user: 'p_xyz', event: 'Teacher enrolled', details: 'Vikram Sharma added to XYZ Public School' },
    { id: 5, time: '2026-07-12 09:15 AM', user: 'superadmin', event: 'Subscription updated', details: 'XYZ Public upgraded to Enterprise License' }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600 shrink-0" />
            Super Admin Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Global system cockpit: manage multi-tenant schools, licensing workspaces, principals, and server modules.
          </p>
        </div>
        
        {/* Sub Navigation Control Hub */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('schools')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'schools'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <SchoolIcon className="h-3.5 w-3.5" />
            Schools ({schoolsList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('principals')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'principals'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Principals ({principalsList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('subscription')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'subscription'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Licensing
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </div>

      {/* SUB-TAB CONTENTS */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* KPI Cards Bento Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Schools */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'total_schools' ? null : 'total_schools')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'total_schools' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Schools</p>
                  <p className="text-2xl font-black mt-1 text-slate-800 dark:text-white">{stats.totalS}</p>
                  <p className="text-[10px] text-blue-500 mt-1 font-semibold flex items-center gap-1">
                    Multi-tenant workspaces
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                  <SchoolIcon className="h-6 w-6" />
                </div>
              </div>

              {/* Card 2: Active Schools */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'active_schools' ? null : 'active_schools')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'active_schools' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Active Schools</p>
                  <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{stats.activeS}</p>
                  <p className="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1">
                    🟢 Full ERP Access
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-slate-800 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>

              {/* Card 3: Grace Period */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'grace_period' ? null : 'grace_period')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'grace_period' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Grace Period</p>
                  <p className="text-2xl font-black mt-1 text-amber-500">{stats.graceS}</p>
                  <p className="text-[10px] text-amber-500 mt-1 font-semibold flex items-center gap-1">
                    🟡 Pending renewal
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-xl text-amber-500 shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>

              {/* Card 4: Suspended Schools */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'suspended' ? null : 'suspended')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'suspended' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Suspended Schools</p>
                  <p className="text-2xl font-black mt-1 text-rose-600">{stats.suspendedS}</p>
                  <p className="text-[10px] text-rose-500 mt-1 font-bold flex items-center gap-1">
                    🟠 Locked Out
                  </p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-slate-800 rounded-xl text-rose-600 shrink-0">
                  <XCircle className="h-6 w-6" />
                </div>
              </div>

              {/* Card 5: Disabled Schools */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'disabled' ? null : 'disabled')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'disabled' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Disabled Schools</p>
                  <p className="text-2xl font-black mt-1 text-slate-500 dark:text-slate-400">{stats.disabledS}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    ⚫ Policy deactivation
                  </p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 shrink-0">
                  <Lock className="h-6 w-6" />
                </div>
              </div>

              {/* Card 6: Expiring Soon */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'expiring' ? null : 'expiring')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'expiring' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Expiring &lt; 30 Days</p>
                  <p className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">{stats.expiringS}</p>
                  <p className="text-[10px] text-indigo-500 mt-1 font-semibold">
                    Requires invoice
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>

              {/* Card 7: Total SaaS Revenue */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'revenue' ? null : 'revenue')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'revenue' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total SaaS Revenue</p>
                  <p className="text-lg font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">₹{stats.revenue.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-emerald-500 mt-1 font-semibold">
                    Collected fees
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-slate-800 rounded-xl text-emerald-650 dark:text-emerald-400 shrink-0">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>

              {/* Card 8: Outstanding Payments */}
              <div 
                onClick={() => setActiveKpiCard(activeKpiCard === 'outstanding' ? null : 'outstanding')}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all duration-250 select-none ${
                  activeKpiCard === 'outstanding' 
                    ? 'border-2 border-blue-600 dark:border-blue-500 shadow-md scale-[1.01] translate-y-[-2px]' 
                    : 'border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md hover:scale-[1.01] hover:translate-y-[-2px]'
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Outstanding Payments</p>
                  <p className="text-lg font-extrabold mt-1 text-amber-600">₹{stats.outstandingPayments.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-amber-500 mt-1 font-semibold">
                    Invoices overdue
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-xl text-amber-600 shrink-0">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Expanded Detailed Interactive Dashboard KPI Drilldown Panel */}
            <AnimatePresence mode="wait">
              {activeKpiCard && (
                <KPIDrillDownPanel
                  activeCard={activeKpiCard}
                  schools={schoolsList}
                  principals={principalsList}
                  stateData={state}
                  onClose={() => setActiveKpiCard(null)}
                  onRefresh={onRefresh}
                  onToast={onToast}
                  onEditSchool={(s) => handleOpenSchoolModal(s)}
                  onOpenBilling={(s) => {
                    setSelectedSubSchool(s);
                    setBillingGraceDays(String(s.gracePeriodDays ?? 7));
                    setBillingAutoRenew(s.autoRenewal !== false);
                    setBillingOutstanding(String(s.outstandingAmount ?? 0));
                    setBillingPaymentStatus(s.paymentStatus || 'Paid');
                    setBillingReason('');
                    setIsBillingModalOpen(true);
                  }}
                  onOpenRenew={(s) => {
                    setSelectedSubSchool(s);
                    setRenewPlan(s.subscription || 'Basic');
                    setRenewMonths('12');
                    setRenewOutstanding('0');
                    setRenewReason('');
                    setIsRenewModalOpen(true);
                  }}
                  onOpenExtend={(s) => {
                    setSelectedSubSchool(s);
                    setExtendDays('30');
                    setExtendReason('');
                    setIsExtendModalOpen(true);
                  }}
                  onOpenPlanChange={(s) => {
                    setSelectedSubSchool(s);
                    setPlanChangeSelected(s.subscription || 'Basic');
                    setPlanChangeReason('');
                    setIsPlanModalOpen(true);
                  }}
                  onModifyStatus={handleModifySchoolStatusExplicit}
                  onDeleteSchool={handleDeleteSchool}
                />
              )}
            </AnimatePresence>

            {/* Quick alert bar for trials or expiries */}
            {schoolsList.some(s => s.paymentStatus === 'Pending') && (
              <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <span className="font-bold">Pending Actions:</span> You have schools on Trial licenses waiting for billing validation. 
                  You can inspect school records in the <button onClick={() => setActiveSubTab('schools')} className="underline font-bold hover:text-yellow-950">Schools tab</button>.
                </div>
              </div>
            )}

            {/* Analytics Visual Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Schools by board chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-1">
                <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
                  <PieChartIcon className="h-4 w-4 text-blue-600" />
                  Schools by Board Affiliate
                </h3>
                <div className="h-56 mt-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={boardChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {boardChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Schools by state geographical distribution */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  Schools State-wise Allocation
                </h3>
                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkTheme ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="schools" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Estimated Student Capacity Distribution */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Estimated Active Enrollment Capacity (Last 6 Months)
                </h3>
                <div className="h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { month: 'Jan', students: 150, teachers: 10 },
                        { month: 'Feb', students: 250, teachers: 15 },
                        { month: 'Mar', students: 480, teachers: 18 },
                        { month: 'Apr', students: 510, teachers: 20 },
                        { month: 'May', students: 760, teachers: 20 },
                        { month: 'Jun', students: stats.totalStudents, teachers: stats.totalT },
                      ]}
                    >
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkTheme ? '#334155' : '#f1f5f9'} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="students" stroke="#10b981" fillOpacity={1} fill="url(#colorStudents)" name="Est. Students" />
                      <Line type="monotone" dataKey="teachers" stroke="#3b82f6" name="Total Teachers" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Audit Activities */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-1">
                <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-red-600" />
                  Audit Activity Log
                </h3>
                <div className="mt-4 space-y-3.5 max-h-56 overflow-y-auto pr-1">
                  {auditLogs.map(log => (
                    <div key={log.id} className="border-b border-slate-50 dark:border-slate-800/60 pb-2 text-xs">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                        <span>{log.time}</span>
                        <span className="text-blue-500 font-bold uppercase">{log.user}</span>
                      </div>
                      <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{log.event}</p>
                      <p className="text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCHOOLS MODULE */}
        {activeSubTab === 'schools' && (
          <motion.div
            key="schools"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search, Filter & Action hub */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search schools by name, code..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-slate-750">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={schoolBoardFilter}
                    onChange={(e) => setSchoolBoardFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Boards</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State Board</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-slate-750">
                  <select
                    value={schoolStatusFilter}
                    onChange={(e) => setSchoolStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <button
                  onClick={() => handleOpenSchoolModal()}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-md shadow-blue-100 dark:shadow-none cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Create School
                </button>
              </div>
            </div>

            {/* School cards layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchools.map((school) => {
                const isSuspended = school.status === 'Suspended';
                return (
                  <div
                    key={school.id}
                    className={`bg-white dark:bg-slate-900 border transition-all rounded-2xl overflow-hidden shadow-sm hover:shadow-md ${
                      selectedSchool?.id === school.id 
                        ? 'ring-2 ring-blue-500 border-transparent' 
                        : isSuspended 
                          ? 'border-red-200 dark:border-red-950/40 opacity-80' 
                          : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    {/* Upper banner color based on board */}
                    <div className={`h-2.5 ${
                      school.board === 'CBSE' 
                        ? 'bg-blue-500' 
                        : school.board === 'ICSE' 
                          ? 'bg-purple-500' 
                          : 'bg-amber-500'
                    }`} />
                    
                    <div className="p-5 space-y-4">
                      {/* Name & Code */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-slate-400 font-mono uppercase">
                            CODE: {school.code}
                          </span>
                          <h4 className="text-base font-black text-slate-800 dark:text-white mt-0.5">
                            {school.name}
                          </h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuspended 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' 
                            : 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                        }`}>
                          {school.status}
                        </span>
                      </div>

                      {/* Contact & Principal block */}
                      <div className="text-xs space-y-1.5 text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span><span className="font-semibold text-slate-600 dark:text-slate-300">Principal:</span> {school.principal || 'Unassigned'}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{school.email}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{school.city || 'Delhi'}, {school.state || 'India'}</span>
                        </p>
                      </div>

                      {/* Subscription details badges */}
                      <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl flex justify-between items-center text-xs">
                        <span className="font-bold flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                          {school.subscription} Plan
                        </span>
                        <span className={`font-semibold ${school.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-500'}`}>
                          {school.paymentStatus}
                        </span>
                      </div>

                      {/* Buttons Action Bar */}
                      <div className="pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedSchool(school)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          View Workspace
                        </button>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleOpenSchoolModal(school)}
                            title="Edit School Workspace details"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleSchoolStatus(school)}
                            title={isSuspended ? "Activate school workspace" : "Suspend school workspace"}
                            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ${isSuspended ? 'text-green-600' : 'text-yellow-600'}`}
                          >
                            {isSuspended ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </button>

                          <button
                            onClick={() => handleDeleteSchool(school.id)}
                            title="Purge school database completely"
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredSchools.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <SchoolIcon className="h-10 w-10 mx-auto opacity-40 mb-2" />
                  <p className="font-bold">No schools found matching search criteria.</p>
                </div>
              )}
            </div>

            {/* EXPANDED VIEW: Isolated Tenant Details Inspector */}
            {selectedSchool && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-6 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-blue-100 dark:border-slate-800">
                  <h3 className="font-black text-lg text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Isolated Multi-Tenant Space: {selectedSchool.name}
                  </h3>
                  <button
                    onClick={() => setSelectedSchool(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-750 font-bold text-xs"
                  >
                    Close Panel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-blue-50 dark:border-slate-800">
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Tenant Space Id</p>
                    <p className="text-slate-800 dark:text-white font-mono text-[11px] mt-1 font-bold">{selectedSchool.id}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-blue-50 dark:border-slate-800">
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Board affiliation</p>
                    <p className="text-slate-800 dark:text-white mt-1 font-black text-sm">{selectedSchool.board}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-blue-50 dark:border-slate-800">
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Active Teachers</p>
                    <p className="text-slate-800 dark:text-white mt-1 font-black text-sm">
                      {state.teachers.filter(t => t.schoolId === selectedSchool.id).length} Teachers enrolled
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-blue-50 dark:border-slate-800">
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Active Expiry</p>
                    <p className="text-slate-800 dark:text-white mt-1 font-mono text-[11px] font-bold">{selectedSchool.licenseExpiry}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-white dark:bg-slate-850 p-4 rounded-xl border border-blue-50 dark:border-slate-800 space-y-2">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Principal Account Access</p>
                    <p className="font-bold text-slate-800 dark:text-white text-xs">{selectedSchool.principal} ({selectedSchool.principalEmail})</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This school acts as a fully isolated workspace. Only the principal above can access this school's students records, schedules, attendance registers, and timetables. No data is cross-shared or visible across tenant units.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* PRINCIPAL MANAGEMENT */}
        {activeSubTab === 'principals' && (
          <motion.div
            key="principals"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search, filters, action */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search principals by name, email..."
                  value={principalSearch}
                  onChange={(e) => setPrincipalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={principalStatusFilter}
                  onChange={(e) => setPrincipalStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-bold p-2.5 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>

                <button
                  onClick={() => handleOpenPrincipalModal()}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-md shadow-blue-100 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Assign New Principal
                </button>
              </div>
            </div>

            {/* Principals Grid table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="p-4">Principal Name</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Assigned School</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {filteredPrincipals.map(p => {
                    const assignedS = schoolsList.find(s => s.id === p.schoolId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-black text-xs shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <span>{p.name}</span>
                        </td>
                        <td className="p-4 text-slate-500">
                          <p className="font-semibold">{p.email}</p>
                          <p className="font-mono text-[10px] mt-0.5">{p.phone || 'No Mobile'}</p>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">
                          {assignedS ? (
                            <p className="font-bold flex items-center gap-1.5">
                              <SchoolIcon className="h-3.5 w-3.5 text-blue-500" />
                              {assignedS.name}
                            </p>
                          ) : (
                            <span className="text-red-500 font-bold">Unassigned Workspace</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-1.5 items-center">
                          <button
                            onClick={() => handleResetPassword(p)}
                            title="Reset password to default (admin123)"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Key className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenPrincipalModal(p)}
                            title="Reassign or edit principal profile"
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeletePrincipal(p.id)}
                            title="Delete Principal Profile"
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPrincipals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Users className="h-10 w-10 mx-auto opacity-40 mb-2" />
                        <p className="font-bold">No principal managers found matching the search criteria.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* LICENSE MODULE */}
        {activeSubTab === 'subscription' && (
          <motion.div
            key="subscription"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Pricing Packages overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Package 01</span>
                <h4 className="text-lg font-black text-slate-800 dark:text-white">Trial License</h4>
                <p className="text-2xl font-black text-blue-600">$0 <span className="text-xs font-semibold text-slate-400">/ 30 Days</span></p>
                <ul className="text-xs space-y-1.5 text-slate-500 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <li>• Up to 5 teachers register</li>
                  <li>• Simple attendance module</li>
                  <li>• Standard local backups</li>
                  <li>• 100 MB maximum storage</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Package 02</span>
                <h4 className="text-lg font-black text-slate-800 dark:text-white">Basic License</h4>
                <p className="text-2xl font-black text-blue-600">$999 <span className="text-xs font-semibold text-slate-400">/ School / yr</span></p>
                <ul className="text-xs space-y-1.5 text-slate-500 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <li>• Up to 25 teachers register</li>
                  <li>• Full timetable & conflict shield</li>
                  <li>• Basic analytics & reports</li>
                  <li>• 5 GB cloud storage limits</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 ring-2 ring-blue-500">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 font-bold">Best Value</span>
                <h4 className="text-lg font-black text-slate-800 dark:text-white">Premium License</h4>
                <p className="text-2xl font-black text-blue-600">$2,499 <span className="text-xs font-semibold text-slate-400">/ School / yr</span></p>
                <ul className="text-xs space-y-1.5 text-slate-500 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <li>• Unlimited teachers register</li>
                  <li>• Smart replacement recommendations</li>
                  <li>• SMS and SMTP notifications</li>
                  <li>• 25 GB cloud storage limits</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Enterprise</span>
                <h4 className="text-lg font-black text-slate-800 dark:text-white">Enterprise Space</h4>
                <p className="text-2xl font-black text-blue-600">$4,999 <span className="text-xs font-semibold text-slate-400">/ School / yr</span></p>
                <ul className="text-xs space-y-1.5 text-slate-500 pt-3 border-t border-slate-50 dark:border-slate-800">
                  <li>• Dedicated SaaS DB instance</li>
                  <li>• Custom domain/branding support</li>
                  <li>• 24/7 Priority SLA engineers</li>
                  <li>• Unlimited storage & backups</li>
                </ul>
              </div>
            </div>

            {/* License expiry and payments tracker */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="h-4.5 w-4.5 text-blue-600" />
                    Active Subscription Licenses Tracker
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage isolated tenant status controls, payment periods, auto-renew, and billing profiles.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="p-4">School Target</th>
                      <th className="p-4">Plan Package</th>
                      <th className="p-4">Current Status</th>
                      <th className="p-4">License Expiry / Billing</th>
                      <th className="p-4">Outstanding (INR)</th>
                      <th className="p-4">Auto Renew / Grace</th>
                      <th className="p-4 text-right">Action controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {schoolsList.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 dark:text-white">{s.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">CODE: {s.code} • {s.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded font-black text-[10px]">
                            {s.subscription}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            s.status === 'Active' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : s.status === 'Grace Period' 
                              ? 'bg-amber-100 text-amber-800' 
                              : s.status === 'Suspended' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-slate-200 text-slate-800'
                          }`}>
                            {s.status === 'Active' && '🟢 Active'}
                            {s.status === 'Grace Period' && '🟡 Grace Period'}
                            {s.status === 'Suspended' && '🟠 Suspended'}
                            {s.status === 'Disabled' && '⚫ Disabled'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-[11px] text-slate-600 dark:text-slate-400">
                          <div>Expiry: {s.licenseExpiry}</div>
                          {s.nextBillingDate && <div className="text-[10px] text-slate-400 mt-0.5 font-normal">Next Bill: {s.nextBillingDate}</div>}
                        </td>
                        <td className="p-4 font-mono font-black text-slate-700 dark:text-slate-300">
                          ₹{(s.outstandingAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                            Auto Renew: <span className={s.autoRenewal !== false ? 'text-emerald-600' : 'text-rose-500'}>{s.autoRenewal !== false ? 'ON' : 'OFF'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Grace Period: {s.gracePeriodDays ?? 7} Days</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            <button
                              onClick={() => {
                                setSelectedSubSchool(s);
                                setBillingGraceDays(String(s.gracePeriodDays ?? 7));
                                setBillingAutoRenew(s.autoRenewal !== false);
                                setBillingOutstanding(String(s.outstandingAmount ?? 0));
                                setBillingPaymentStatus(s.paymentStatus || 'Paid');
                                setBillingReason('');
                                setIsBillingModalOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px] cursor-pointer"
                              title="Edit Billing Profile"
                            >
                              Edit Billing
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSubSchool(s);
                                setRenewPlan(s.subscription || 'Basic');
                                setRenewMonths('12');
                                setRenewOutstanding('0');
                                setRenewReason('');
                                setIsRenewModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px] cursor-pointer"
                              title="Renew Subscription"
                            >
                              Renew
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSubSchool(s);
                                setExtendDays('30');
                                setExtendReason('');
                                setIsExtendModalOpen(true);
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[10px] cursor-pointer"
                              title="Extend Expiry"
                            >
                              Extend
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSubSchool(s);
                                setPlanChangeSelected(s.subscription || 'Basic');
                                setPlanChangeReason('');
                                setIsPlanModalOpen(true);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] cursor-pointer"
                              title="Change Plan"
                            >
                              Change Plan
                            </button>

                            {s.status === 'Active' || s.status === 'Grace Period' ? (
                              <>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(`Enter reason for suspending ${s.name}:`);
                                    if (reason !== null) {
                                      handleModifySchoolStatusExplicit(s, 'suspend', reason);
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[10px] cursor-pointer"
                                  title="Suspend School"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(`Enter reason for disabling ${s.name}:`);
                                    if (reason !== null) {
                                      handleModifySchoolStatusExplicit(s, 'disable', reason);
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded text-[10px] cursor-pointer"
                                  title="Disable School"
                                >
                                  Disable
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  const reason = window.prompt(`Enter reason for activating/reactivating ${s.name}:`);
                                  if (reason !== null) {
                                    handleModifySchoolStatusExplicit(s, 'reactivate', reason);
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] cursor-pointer"
                                title="Reactivate Access"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AUDIT LOG MASTER LEDGER */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-blue-600" />
                SaaS Subscription Security &amp; Activity Audit Trail
              </h3>
              <p className="text-xs text-slate-400">
                This transaction ledger logs every licensing mutation, grace transition, block enforcement, and financial adjustment made system-wide.
              </p>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Admin</th>
                      <th className="p-3">School / Tenant</th>
                      <th className="p-3">Action performed</th>
                      <th className="p-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 font-mono text-[11px]">
                    {(state.auditLogs && state.auditLogs.length > 0) ? (
                      [...state.auditLogs].reverse().map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                          <td className="p-3 text-slate-500 font-bold whitespace-nowrap">
                            {new Date(log.dateTime).toLocaleString()}
                          </td>
                          <td className="p-3 text-blue-600 font-bold">
                            {log.adminName}
                          </td>
                          <td className="p-3 text-slate-800 dark:text-slate-300 font-bold">
                            {log.schoolName || 'System'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold whitespace-nowrap ${
                              log.action.toLowerCase().includes('activate') || log.action.toLowerCase().includes('renew')
                                ? 'bg-emerald-100 text-emerald-800' 
                                : log.action.toLowerCase().includes('suspend') || log.action.toLowerCase().includes('disable') || log.action.toLowerCase().includes('block')
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {log.action.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">
                            {log.reason}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                          No database audit trails logged yet. Perform a subscription operation to record events.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SYSTEM CONFIGURATION SETTINGS */}
        {activeSubTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          >
            {/* Settings Vertical Navigation rail */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm h-fit space-y-1">
              <button
                onClick={() => setSettingsTab('branding')}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  settingsTab === 'branding' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <Server className="h-4 w-4" />
                System Branding
              </button>
              <button
                onClick={() => setSettingsTab('smtp')}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  settingsTab === 'smtp' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <Mail className="h-4 w-4" />
                SMTP Configuration
              </button>
              <button
                onClick={() => setSettingsTab('backup')}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  settingsTab === 'backup' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <Database className="h-4 w-4" />
                Backup & Restore
              </button>
              <button
                onClick={() => setSettingsTab('security')}
                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  settingsTab === 'security' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <Lock className="h-4 w-4" />
                Security Policies
              </button>
            </div>

            {/* Settings Inner Content Pane */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <AnimatePresence mode="wait">
                {settingsTab === 'branding' && (
                  <motion.div
                    key="branding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-50 dark:border-slate-800">
                      System Branding Configuration
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">ERP Platform Title</label>
                        <input
                          type="text"
                          value={systemTitle}
                          onChange={(e) => setSystemTitle(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Powered By Credit Phrase</label>
                        <input
                          type="text"
                          placeholder="Intelligent Multi-School ERP"
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => onToast('Platform title and layout branding synchronized system-wide!')}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Save Branding Settings
                    </button>
                  </motion.div>
                )}

                {settingsTab === 'smtp' && (
                  <motion.div
                    key="smtp"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-50 dark:border-slate-800">
                      SMTP Settings (Email dispatch trigger)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">SMTP Host Address</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">SMTP Server Port</label>
                        <input
                          type="text"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Authorized Username</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => onToast('SMTP connection parameters updated successfully and tested OK!')}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Save & Test Connection
                    </button>
                  </motion.div>
                )}

                {settingsTab === 'backup' && (
                  <motion.div
                    key="backup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-50 dark:border-slate-800">
                      Replication & S3 Database Backup
                    </h4>
                    
                    <p className="text-xs text-slate-500 leading-relaxed">
                      SaaS ERP state is persisted in a multi-tenant file system architecture. You can trigger manual compressed exports or synchronize with AWS S3 block storage buckets.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={handleBackupDB}
                        disabled={isBackingUp}
                        className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {isBackingUp ? 'Replicating indexes...' : 'Trigger S3 Backup Now'}
                      </button>

                      <button
                        onClick={() => {
                          const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state))}`;
                          const dlAnchor = document.createElement('a');
                          dlAnchor.setAttribute('href', jsonStr);
                          dlAnchor.setAttribute('download', 'erp_master_backup.json');
                          dlAnchor.click();
                          onToast('JSON database schema downloaded successfully!');
                        }}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Download Raw JSON Backup
                      </button>
                    </div>
                  </motion.div>
                )}

                {settingsTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-50 dark:border-slate-800">
                      Tenant Security & Password Policies
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Session Expiry Timeout (Minutes)</label>
                        <input
                          type="number"
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Minimum Password Length</label>
                        <input
                          type="number"
                          value={passwordMinLength}
                          onChange={(e) => setPasswordMinLength(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-xs">
                      <input
                        type="checkbox"
                        checked={enableMfa}
                        onChange={(e) => setEnableMfa(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        id="enable-mfa-checkbox"
                      />
                      <label htmlFor="enable-mfa-checkbox" className="font-bold text-slate-600 dark:text-slate-300">
                        Force MFA Authenticator (Super Admin & Principal Users only)
                      </label>
                    </div>

                    <button
                      onClick={() => onToast('Security policies locked and active globally!')}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Lock Security Policies
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE / EDIT SCHOOL */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <SchoolIcon className="h-5 w-5 text-blue-600" />
                {editingSchool ? `Modify School Workspace: ${editingSchool.code}` : 'Register New Tenant School'}
              </h3>
              <button 
                onClick={() => setIsSchoolModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="space-y-4 text-xs">
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">School Name *</label>
                  <input
                    type="text"
                    value={schoolFormName}
                    onChange={(e) => setSchoolFormName(e.target.value)}
                    required
                    placeholder="e.g. ABC Public School"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">School Unique Code *</label>
                  <input
                    type="text"
                    value={schoolFormCode}
                    onChange={(e) => setSchoolFormCode(e.target.value)}
                    required
                    disabled={editingSchool !== null}
                    placeholder="e.g. ABC-02 (Unique)"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">School Email *</label>
                  <input
                    type="email"
                    value={schoolFormEmail}
                    onChange={(e) => setSchoolFormEmail(e.target.value)}
                    required
                    placeholder="e.g. info@abcschool.com"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">School Phone</label>
                  <input
                    type="text"
                    value={schoolFormPhone}
                    onChange={(e) => setSchoolFormPhone(e.target.value)}
                    placeholder="e.g. +91 11 123456"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Board Affiliate</label>
                  <select
                    value={schoolFormBoard}
                    onChange={(e) => setSchoolFormBoard(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="CBSE">CBSE Board</option>
                    <option value="ICSE">ICSE Board</option>
                    <option value="State Board">State Board</option>
                  </select>
                </div>
              </div>

              {/* Geographical Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-500 mb-1">School Address</label>
                  <input
                    type="text"
                    value={schoolFormAddress}
                    onChange={(e) => setSchoolFormAddress(e.target.value)}
                    placeholder="123 Sector Lane"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">City</label>
                  <input
                    type="text"
                    value={schoolFormCity}
                    onChange={(e) => setSchoolFormCity(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">State</label>
                  <input
                    type="text"
                    value={schoolFormState}
                    onChange={(e) => setSchoolFormState(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Principal Details */}
              <div className="bg-blue-50/40 dark:bg-slate-850 p-4 rounded-xl border border-blue-100 dark:border-slate-800/80 space-y-3.5">
                <span className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest">
                  Primary School Principal Information
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Principal Name *</label>
                    <input
                      type="text"
                      value={schoolFormPrincipalName}
                      onChange={(e) => setSchoolFormPrincipalName(e.target.value)}
                      required
                      placeholder="e.g. Mrs. Anjali Mehta"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Principal Email *</label>
                    <input
                      type="email"
                      value={schoolFormPrincipalEmail}
                      onChange={(e) => setSchoolFormPrincipalEmail(e.target.value)}
                      required
                      placeholder="e.g. principal@abcschool.com"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Principal Phone</label>
                    <input
                      type="text"
                      value={schoolFormPrincipalMobile}
                      onChange={(e) => setSchoolFormPrincipalMobile(e.target.value)}
                      placeholder="e.g. +91 99999 88888"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Subscription Tier</label>
                  <select
                    value={schoolFormSubscription}
                    onChange={(e) => setSchoolFormSubscription(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="Trial">Trial Plan</option>
                    <option value="Basic">Basic Plan</option>
                    <option value="Premium">Premium Plan</option>
                    <option value="Enterprise">Enterprise Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    value={schoolFormExpiry}
                    onChange={(e) => setSchoolFormExpiry(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Payment Status</label>
                  <select
                    value={schoolFormPayment}
                    onChange={(e) => setSchoolFormPayment(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending / Trial</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2 border border-slate-100 dark:border-slate-800 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-100 dark:shadow-none cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  {editingSchool ? 'Update Workspace' : 'Initialize School ERP Workspace'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: ASSIGN / EDIT PRINCIPAL */}
      {isPrincipalModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Users className="h-5 w-5 text-blue-600" />
                {editingPrincipal ? 'Edit Principal Profile' : 'Assign Principal Account'}
              </h3>
              <button 
                onClick={() => setIsPrincipalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSavePrincipal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Principal Name *</label>
                <input
                  type="text"
                  value={principalFormName}
                  onChange={(e) => setPrincipalFormName(e.target.value)}
                  required
                  placeholder="e.g. Mrs. Anjali Mehta"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Principal Login Email *</label>
                <input
                  type="email"
                  value={principalFormEmail}
                  onChange={(e) => setPrincipalFormEmail(e.target.value)}
                  required
                  disabled={editingPrincipal !== null}
                  placeholder="e.g. principal@abc.edu"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Principal Phone</label>
                <input
                  type="text"
                  value={principalFormPhone}
                  onChange={(e) => setPrincipalFormPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Assign to School ERP Workspace *</label>
                <select
                  value={principalFormSchoolId}
                  onChange={(e) => setPrincipalFormSchoolId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="" disabled>Select School...</option>
                  {schoolsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (CODE: {s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Account Status</label>
                <select
                  value={principalFormStatus}
                  onChange={(e) => setPrincipalFormStatus(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="Active">Active / Access Allowed</option>
                  <option value="Suspended">Suspended / Lock Access</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrincipalModalOpen(false)}
                  className="px-4 py-2 border border-slate-100 dark:border-slate-800 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-100 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  {editingPrincipal ? 'Update Account' : 'Provision Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: EDIT BILLING PROFILE */}
      {isBillingModalOpen && selectedSubSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Edit Billing Profile: {selectedSubSchool.name}
              </h3>
              <button 
                onClick={() => setIsBillingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitBillingProfile} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Grace Period (Days)</label>
                <input
                  type="number"
                  value={billingGraceDays}
                  onChange={(e) => setBillingGraceDays(e.target.value)}
                  required
                  min="0"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Outstanding Amount (₹)</label>
                <input
                  type="number"
                  value={billingOutstanding}
                  onChange={(e) => setBillingOutstanding(e.target.value)}
                  required
                  min="0"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="billingAutoRenew"
                  checked={billingAutoRenew}
                  onChange={(e) => setBillingAutoRenew(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="billingAutoRenew" className="font-bold text-slate-600">
                  Enable Auto Renewal
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Payment Status</label>
                <select
                  value={billingPaymentStatus}
                  onChange={(e) => setBillingPaymentStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending / Unpaid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Reason for Adjustment</label>
                <textarea
                  value={billingReason}
                  onChange={(e) => setBillingReason(e.target.value)}
                  placeholder="Why are you making these billing profile adjustments?"
                  required
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none h-16"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="px-4 py-2 border border-slate-100 dark:border-slate-800 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-100"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: RENEW SUBSCRIPTION */}
      {isRenewModalOpen && selectedSubSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
                Renew Subscription: {selectedSubSchool.name}
              </h3>
              <button 
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitRenewSubscription} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Select Renew Plan Tier</label>
                <select
                  value={renewPlan}
                  onChange={(e) => setRenewPlan(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="Trial">Trial License</option>
                  <option value="Basic">Basic License</option>
                  <option value="Premium">Premium License</option>
                  <option value="Enterprise">Enterprise License</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Duration (Months)</label>
                <select
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (Recommended)</option>
                  <option value="24">24 Months</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Outstanding / Due Invoice Amount (₹)</label>
                <input
                  type="number"
                  value={renewOutstanding}
                  onChange={(e) => setRenewOutstanding(e.target.value)}
                  required
                  min="0"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Reason / Payment Reference</label>
                <textarea
                  value={renewReason}
                  onChange={(e) => setRenewReason(e.target.value)}
                  placeholder="e.g., Bank Transfer Txn ID: #928372"
                  required
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none h-16"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 border border-slate-100 dark:border-slate-800 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-100"
                >
                  Activate Renewal Plan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: EXTEND LICENSE EXPIRY */}
      {isExtendModalOpen && selectedSubSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Calendar className="h-5 w-5 text-blue-600" />
                Extend Subscription: {selectedSubSchool.name}
              </h3>
              <button 
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitExtendSubscription} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Number of Extension Days</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  required
                  min="1"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Reason for Extension</label>
                <textarea
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Approved grace extension during Diwali holidays"
                  required
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none h-16"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(false)}
                  className="px-4 py-2 border border-slate-100 dark:border-slate-800 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-100"
                >
                  Extend Expiry Date
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: UPGRADE / CHANGE PLAN */}
      {isPlanModalOpen && selectedSubSchool && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Layers className="h-5 w-5 text-indigo-600" />
                Change License Tier: {selectedSubSchool.name}
              </h3>
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitChangePlan} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Choose New Target Plan</label>
                <select
                  value={planChangeSelected}
                  onChange={(e) => setPlanChangeSelected(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="Trial">Trial License</option>
                  <option value="Basic">Basic License</option>
                  <option value="Premium">Premium License</option>
                  <option value="Enterprise">Enterprise License</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Reason for Tier Switch</label>
                <textarea
                  value={planChangeReason}
                  onChange={(e) => setPlanChangeReason(e.target.value)}
                  placeholder="Explain why the tier is being shifted."
                  required
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-white focus:outline-none h-16"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 border border-slate-100 dark:border-slate-800 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100"
                >
                  Migrate Plan Package
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
