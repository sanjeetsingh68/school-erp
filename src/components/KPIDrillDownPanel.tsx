import React, { useState, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  X, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Printer, 
  Loader2, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Lock, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Users, 
  BookOpen, 
  Info, 
  RefreshCw, 
  Phone, 
  Mail, 
  Eye, 
  Edit3, 
  FileSpreadsheet, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Layers,
  Activity,
  UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { School, Principal, ERPDataState, AuditLog } from '../types';

interface KPIDrillDownPanelProps {
  activeCard: string;
  schools: School[];
  principals: Principal[];
  stateData: ERPDataState;
  onClose: () => void;
  onRefresh: () => void;
  onToast: (msg: string) => void;
  
  // Callbacks to open existing parent modals or invoke parent state mutations
  onEditSchool: (school: School) => void;
  onOpenBilling: (school: School) => void;
  onOpenRenew: (school: School) => void;
  onOpenExtend: (school: School) => void;
  onOpenPlanChange: (school: School) => void;
  onModifyStatus: (school: School, action: 'activate' | 'suspend' | 'disable' | 'reactivate', reason: string) => Promise<void>;
  onDeleteSchool: (schoolId: string) => Promise<void>;
}

export default function KPIDrillDownPanel({
  activeCard,
  schools,
  principals,
  stateData,
  onClose,
  onRefresh,
  onToast,
  onEditSchool,
  onOpenBilling,
  onOpenRenew,
  onOpenExtend,
  onOpenPlanChange,
  onModifyStatus,
  onDeleteSchool
}: KPIDrillDownPanelProps) {

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [boardFilter, setBoardFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Revenue tab specific states
  const [revenueFilter, setRevenueFilter] = useState<'Monthly' | 'Quarterly' | 'Yearly' | 'Custom'>('Yearly');
  const [revStartDate, setRevStartDate] = useState('2026-01-01');
  const [revEndDate, setRevEndDate] = useState('2026-12-31');

  // Sorting state
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Helper date parsing
  const getDaysDiffLocal = (d1: string, d2: string): number => {
    const t1 = new Date(d1).getTime();
    const t2 = new Date(d2).getTime();
    if (isNaN(t1) || isNaN(t2)) return 0;
    return Math.ceil((t1 - t2) / (1000 * 60 * 60 * 24));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 1. FILTER & ENRICH SCHOOL DATA DYNAMICALLY FOR THE RENDERED VIEWS
  const enrichedSchools = useMemo(() => {
    return schools.map((s, index) => {
      const teachersList = stateData.teachers.filter(t => t.schoolId === s.id);
      const teachersCount = teachersList.length || Math.floor((s.code.charCodeAt(0) % 10) + 12);
      const studentsCount = teachersCount * 38 + Math.floor(s.code.charCodeAt(1) % 40);
      const classesCount = Math.floor(teachersCount / 2) + 3;
      const erpVersion = s.code.charCodeAt(0) % 2 === 0 ? 'v2.5.0' : 'v2.4.1';
      const lastLogin = s.code.charCodeAt(1) % 2 === 0 ? 'Today, 10:15 AM' : 'Yesterday, 04:30 PM';
      const createdDate = s.subscriptionStartDate || `2025-04-${String((s.code.charCodeAt(2) % 20) + 10).padStart(2, '0')}`;
      
      // Calculate remaining license days
      const daysRemaining = getDaysDiffLocal(s.licenseExpiry, todayStr);

      // Associated principal name
      const assocP = principals.find(p => p.schoolId === s.id);
      const principalName = assocP ? assocP.name : (s.principal || 'Unassigned');
      const principalPhone = assocP ? assocP.phone : (s.phone || 'N/A');

      // Outstanding invoice mockup index
      const invoiceNumber = `INV-2026-0${100 + index}`;

      return {
        ...s,
        teachersCount,
        studentsCount,
        classesCount,
        erpVersion,
        lastLogin,
        createdDate,
        daysRemaining,
        principalName,
        principalPhone,
        invoiceNumber
      };
    });
  }, [schools, principals, stateData.teachers, todayStr]);

  // Derived filter options
  const uniqueStates = useMemo(() => {
    const sts = new Set<string>();
    schools.forEach(s => { if (s.state) sts.add(s.state); });
    return Array.from(sts);
  }, [schools]);

  // Filter school based on card type + page criteria
  const finalFilteredData = useMemo(() => {
    let data = enrichedSchools;

    // A. Apply Card-specific Filters
    if (activeCard === 'active_schools') {
      data = data.filter(s => s.status === 'Active');
    } else if (activeCard === 'grace_period') {
      data = data.filter(s => s.status === 'Grace Period');
    } else if (activeCard === 'suspended') {
      data = data.filter(s => s.status === 'Suspended');
    } else if (activeCard === 'disabled') {
      data = data.filter(s => s.status === 'Disabled');
    } else if (activeCard === 'expiring') {
      data = data.filter(s => s.daysRemaining > 0 && s.daysRemaining <= 30);
    } else if (activeCard === 'outstanding') {
      data = data.filter(s => (s.outstandingAmount || 0) > 0);
    }

    // B. Apply User Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      data = data.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.code.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.principalName.toLowerCase().includes(q)
      );
    }

    // C. Apply Dropdown Filters
    if (boardFilter !== 'All') {
      data = data.filter(s => s.board === boardFilter);
    }
    if (stateFilter !== 'All') {
      data = data.filter(s => s.state === stateFilter);
    }
    if (planFilter !== 'All') {
      data = data.filter(s => s.subscription === planFilter);
    }
    if (statusFilter !== 'All' && activeCard === 'total_schools') {
      data = data.filter(s => s.status === statusFilter);
    }

    // D. Apply Sorting
    return [...data].sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nested values or case-insensitive string compare
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [enrichedSchools, activeCard, searchQuery, boardFilter, stateFilter, planFilter, statusFilter, sortField, sortDirection]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return finalFilteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [finalFilteredData, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(finalFilteredData.length / itemsPerPage));

  // Switch page safe
  const setPageSafe = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper: Card Panel Title configuration
  const cardConfig = useMemo(() => {
    switch (activeCard) {
      case 'total_schools':
        return {
          title: 'Total Schools Register Ledger',
          desc: 'Audit directory of all registered school multi-tenant spaces, system board compliance, locations, and creation history.',
          accentColor: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-slate-900',
          icon: <SchoolIcon className="h-5 w-5 text-blue-600" />
        };
      case 'active_schools':
        return {
          title: 'Active Subscription Spaces',
          desc: 'Review tenants with full active cloud ERP permissions, active licensing models, local school sizes, and platform versions.',
          accentColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-slate-900',
          icon: <CheckCircle className="h-5 w-5 text-emerald-600" />
        };
      case 'grace_period':
        return {
          title: 'Licensing Grace Period Monitor',
          desc: 'Observe workspaces pending fee renewal with active grace duration extensions, outstanding balances, and reminder controls.',
          accentColor: 'text-amber-500',
          bgColor: 'bg-amber-50 dark:bg-slate-900',
          icon: <AlertCircle className="h-5 w-5 text-amber-500" />
        };
      case 'suspended':
        return {
          title: 'Suspended Access Ledger',
          desc: 'Supervise schools restricted due to prolonged invoice delay, policy deactivations, or administrative locks.',
          accentColor: 'text-rose-600',
          bgColor: 'bg-rose-50 dark:bg-slate-900',
          icon: <XCircle className="h-5 w-5 text-rose-600" />
        };
      case 'disabled':
        return {
          title: 'Disabled Administrative Workspaces',
          desc: 'Archived or inactive school nodes with terminated tenant status due to legal, policy, or client-deactivated actions.',
          accentColor: 'text-slate-500',
          bgColor: 'bg-slate-100 dark:bg-slate-900',
          icon: <Lock className="h-5 w-5 text-slate-500" />
        };
      case 'expiring':
        return {
          title: 'Sub-30 Day Upcoming Expiries Tracker',
          desc: 'Urgent renewals board displaying workspaces with licensing terminating within 30 days. Dispatch reminders.',
          accentColor: 'text-indigo-600',
          bgColor: 'bg-indigo-50 dark:bg-slate-900',
          icon: <Calendar className="h-5 w-5 text-indigo-600" />
        };
      case 'revenue':
        return {
          title: 'SaaS Revenue Analytics & Ledger Dashboard',
          desc: 'Corporate finance matrix outlining plan package income pipelines, geographic distributions, state-by-state collection, and refund offsets.',
          accentColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-slate-900',
          icon: <DollarSign className="h-5 w-5 text-emerald-600" />
        };
      case 'outstanding':
        return {
          title: 'Unresolved SaaS Invoice Balances',
          desc: 'Financial ledger of all accounts with overdue balances, overdue age buckets, and automated collection notification triggers.',
          accentColor: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-slate-900',
          icon: <CreditCard className="h-5 w-5 text-amber-600" />
        };
      default:
        return {
          title: 'KPI Drilled View',
          desc: 'Interactive platform analysis workspace.',
          accentColor: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-slate-900',
          icon: <Info className="h-5 w-5 text-blue-600" />
        };
    }
  }, [activeCard]);

  // 2. EXPORT IMPLEMENTATIONS (PDF & EXCEL CSV SEEDERS)
  const handleExportCSV = () => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        let headers: string[] = [];
        let rows: string[][] = [];

        if (activeCard === 'revenue') {
          headers = ['Period', 'Plan Tier', 'Region State', 'Board Affiliation', 'Amount Collected (₹)', 'Payment Status'];
          revenueTimelineData.forEach(item => {
            rows.push([item.month, 'Enterprise/Premium/Basic', 'All States', 'All Boards', String(item.revenue), 'Collected']);
          });
        } else {
          headers = ['School Name', 'Code', 'Principal', 'Board Affiliation', 'City', 'State', 'License Plan', 'Account Status', 'Expiry Date', 'Outstanding Balance (INR)'];
          finalFilteredData.forEach(s => {
            rows.push([
              s.name,
              s.code,
              s.principalName,
              s.board,
              s.city,
              s.state,
              s.subscription,
              s.status,
              s.licenseExpiry,
              String(s.outstandingAmount || 0)
            ]);
          });
        }

        const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ERP_SaaS_Audit_Export_${activeCard}_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onToast(`SaaS Ledger successfully exported as CSV: ERP_SaaS_Audit_Export_${activeCard}_${todayStr}.csv`);
      } catch (err) {
        onToast('Failed to compile spreadsheet download.');
      } finally {
        setIsLoading(false);
      }
    }, 450);
  };

  const handlePrint = () => {
    window.print();
    onToast('Dispatched formatted grid ledger to system print queue/PDF driver.');
  };

  // 3. STATS COMPILATIONS
  const totalSchoolsThisMonth = useMemo(() => {
    // Schools added since 2026-06-01 (simulated target dates)
    return enrichedSchools.filter(s => new Date(s.createdDate) >= new Date('2026-06-01')).length;
  }, [enrichedSchools]);

  const boardSummaryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { CBSE: 0, ICSE: 0, 'State Board': 0 };
    schools.forEach(s => {
      counts[s.board] = (counts[s.board] || 0) + 1;
    });
    return counts;
  }, [schools]);

  const stateSummaryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    schools.forEach(s => {
      const st = s.state || 'Other';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }, [schools]);

  // Active state counts chart data
  const activeSchoolsStateChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    enrichedSchools.filter(s => s.status === 'Active').forEach(s => {
      counts[s.state] = (counts[s.state] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, value: count }));
  }, [enrichedSchools]);

  const activeSchoolsBoardChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    enrichedSchools.filter(s => s.status === 'Active').forEach(s => {
      counts[s.board] = (counts[s.board] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, value: count }));
  }, [enrichedSchools]);

  // Grace Period countdowns
  const graceCountdownRange = useMemo(() => {
    let countdown7Days = 0;
    let countdown15Days = 0;
    enrichedSchools.filter(s => s.status === 'Grace Period').forEach(s => {
      const remaining = s.gracePeriodDays ?? 7;
      if (remaining <= 3) countdown7Days++;
      else countdown15Days++;
    });
    return { urgent: countdown7Days, warning: countdown15Days };
  }, [enrichedSchools]);

  // 4. REVENUE CHARTS MOCKUP TIMELINE
  const revenueTimelineData = useMemo(() => {
    // Construct rich month-by-month financial timeline
    const multiplier = revenueFilter === 'Monthly' ? 0.3 : revenueFilter === 'Quarterly' ? 0.8 : 1.0;
    return [
      { month: 'Jul 2025', revenue: Math.round(180000 * multiplier), growth: 5.2, enterprise: 1, premium: 1, basic: 1 },
      { month: 'Aug 2025', revenue: Math.round(195000 * multiplier), growth: 8.3, enterprise: 1, premium: 2, basic: 1 },
      { month: 'Sep 2025', revenue: Math.round(210000 * multiplier), growth: 7.6, enterprise: 1, premium: 2, basic: 2 },
      { month: 'Oct 2025', revenue: Math.round(240000 * multiplier), growth: 14.2, enterprise: 2, premium: 2, basic: 2 },
      { month: 'Nov 2025', revenue: Math.round(290000 * multiplier), growth: 20.8, enterprise: 2, premium: 3, basic: 3 },
      { month: 'Dec 2025', revenue: Math.round(310000 * multiplier), growth: 6.8, enterprise: 2, premium: 3, basic: 4 },
      { month: 'Jan 2026', revenue: Math.round(340000 * multiplier), growth: 9.6, enterprise: 3, premium: 3, basic: 4 },
      { month: 'Feb 2026', revenue: Math.round(380000 * multiplier), growth: 11.7, enterprise: 3, premium: 4, basic: 5 },
      { month: 'Mar 2026', revenue: Math.round(410000 * multiplier), growth: 7.8, enterprise: 3, premium: 5, basic: 5 },
      { month: 'Apr 2026', revenue: Math.round(450000 * multiplier), growth: 9.7, enterprise: 4, premium: 5, basic: 6 },
      { month: 'May 2026', revenue: Math.round(520000 * multiplier), growth: 15.5, enterprise: 4, premium: 6, basic: 7 },
      { month: 'Jun 2026', revenue: Math.round(580000 * multiplier), growth: 11.5, enterprise: 5, premium: 6, basic: 8 },
      { month: 'Jul 2026', revenue: Math.round(620000 * multiplier), growth: 6.9, enterprise: 5, premium: 7, basic: 8 },
    ];
  }, [revenueFilter]);

  const planRevenueDistribution = useMemo(() => {
    let enterpriseS = 0;
    let premiumS = 0;
    let basicS = 0;

    schools.forEach(s => {
      if (s.paymentStatus === 'Paid') {
        if (s.subscription === 'Enterprise') enterpriseS += 250000;
        else if (s.subscription === 'Premium') premiumS += 120000;
        else if (s.subscription === 'Basic') basicS += 50000;
      }
    });

    return [
      { name: 'Enterprise (₹2.5L)', value: enterpriseS },
      { name: 'Premium (₹1.2L)', value: premiumS },
      { name: 'Basic (₹50k)', value: basicS }
    ].filter(item => item.value > 0);
  }, [schools]);

  const topPayingSchools = useMemo(() => {
    return enrichedSchools
      .filter(s => s.paymentStatus === 'Paid')
      .map(s => {
        let amount = 0;
        if (s.subscription === 'Enterprise') amount = 250000;
        else if (s.subscription === 'Premium') amount = 120000;
        else if (s.subscription === 'Basic') amount = 50000;
        return { name: s.name, amount };
      })
      .sort((a,b) => b.amount - a.amount)
      .slice(0, 5);
  }, [enrichedSchools]);

  // Outstanding buckets
  const outstandingBuckets = useMemo(() => {
    let bucket0to30 = 0;
    let bucket31to60 = 0;
    let bucket61to90 = 0;
    let bucket91plus = 0;

    enrichedSchools.filter(s => (s.outstandingAmount || 0) > 0).forEach(s => {
      const days = Math.abs(s.daysRemaining); // Expiry to today diff represents overdue age
      const amount = s.outstandingAmount || 0;
      if (days <= 30) bucket0to30 += amount;
      else if (days <= 60) bucket31to60 += amount;
      else if (days <= 90) bucket61to90 += amount;
      else bucket91plus += amount;
    });

    return [
      { name: '1-30 Days Overdue', value: bucket0to30 },
      { name: '31-60 Days Overdue', value: bucket31to60 },
      { name: '61-90 Days Overdue', value: bucket61to90 },
      { name: '90+ Days Overdue', value: bucket91plus }
    ].filter(item => item.value > 0);
  }, [enrichedSchools]);

  const outstandingTimeline = [
    { name: 'Jan', outstanding: 120000, resolved: 80000 },
    { name: 'Feb', outstanding: 150000, resolved: 110000 },
    { name: 'Mar', outstanding: 190000, resolved: 130000 },
    { name: 'Apr', outstanding: 220000, resolved: 150000 },
    { name: 'May', outstanding: 310000, resolved: 210000 },
    { name: 'Jun', outstanding: 380000, resolved: 270000 },
    { name: 'Jul', outstanding: 450000, resolved: 310000 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.28 }}
      className="bg-white dark:bg-slate-900 border-2 border-blue-500/80 dark:border-blue-500/60 rounded-3xl p-6 shadow-xl space-y-6 overflow-hidden relative"
      id="kpi-drilldown-panel"
    >
      {/* 4. TITLE BAR HEADER */}
      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-2xl shrink-0">
            {cardConfig.icon}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              {cardConfig.title}
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                Interactive Drilldown
              </span>
            </h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              {cardConfig.desc}
            </p>
          </div>
        </div>
        
        {/* Actions Button Row */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="Export Grid to CSV Spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden md:inline">CSV Excel</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="Export Format to System Print/PDF Driver"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden md:inline">Print / PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/20 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-black"
            title="Close Drilldown and Return to main KPI view"
          >
            <X className="h-4 w-4" />
            <span>Collapse</span>
          </button>
        </div>
      </div>

      {/* 5. SUMMARY STATS WIDGETS */}
      {activeCard === 'total_schools' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Workspaces</span>
            <div className="text-xl font-black text-slate-800 dark:text-white mt-1">{schools.length} Spaces</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Added This Month</span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">+{totalSchoolsThisMonth} School</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Affiliated Boards</span>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
              CBSE: {boardSummaryCounts.CBSE} • ICSE: {boardSummaryCounts.ICSE} • State: {boardSummaryCounts['State Board']}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Location</span>
            <div className="text-sm font-bold text-slate-800 dark:text-white mt-1">
              {stateSummaryCounts[0]?.name || 'N/A'} ({stateSummaryCounts[0]?.count || 0} spaces)
            </div>
          </div>
        </div>
      )}

      {activeCard === 'active_schools' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Workspace Counts</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{finalFilteredData.length} active nodes</div>
              <p className="text-[10px] text-slate-400 mt-2">Currently loaded in the global cluster with real-time access permission.</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Schools By State</span>
            <div className="h-32 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeSchoolsStateChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Schools By Board</span>
            <div className="h-32 mt-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeSchoolsBoardChartData}
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {activeSchoolsBoardChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeCard === 'grace_period' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Grace Warning Overview</span>
            <div className="text-2xl font-black text-amber-500 mt-1">{finalFilteredData.length} pending spaces</div>
            <div className="flex gap-4 mt-2 font-semibold">
              <div className="text-[10px] text-rose-500">🔴 Urgent (≤3 Days): {graceCountdownRange.urgent}</div>
              <div className="text-[10px] text-amber-500">🟡 Alert (&gt;3 Days): {graceCountdownRange.warning}</div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overdue Grace Remaining Breakdown</span>
            <div className="h-32 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finalFilteredData.map(s => ({ name: s.name, days: s.gracePeriodDays ?? 7 }))}>
                  <XAxis dataKey="name" fontSize={9} stroke="#94a3b8" />
                  <YAxis fontSize={9} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="days" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeCard === 'suspended' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Access Lock-Outs</span>
            <div className="text-xl font-black text-rose-600 mt-1">{finalFilteredData.length} Suspended</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Suspension Volume</span>
            <div className="text-xl font-black text-slate-800 dark:text-white mt-1">
              ₹{finalFilteredData.reduce((acc,s) => acc + (s.outstandingAmount || 0), 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lock enforcement strategy</span>
            <div className="text-xs text-slate-500 mt-1">Tenant isolation. Full administrative portal access is terminated until fee release.</div>
          </div>
        </div>
      )}

      {activeCard === 'disabled' && (
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Administrative Policy Deactivations</span>
          <div className="text-xl font-black text-slate-800 dark:text-white mt-1">{finalFilteredData.length} Terminated nodes</div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            These school spaces are locked permanently or scheduled for complete filesystem delete. Principal accounts are suspended and databases are cold.
          </p>
        </div>
      )}

      {activeCard === 'expiring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 dark:bg-slate-850 p-4 rounded-2xl border border-indigo-100/50 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Urgent Action Board</span>
            <div className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{finalFilteredData.length} Expiring In &lt;30 Days</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Revenue Renewal Pipe</span>
            <div className="text-xl font-black text-slate-800 dark:text-white mt-1">
              ₹{finalFilteredData.length * 150000} value estimate
            </div>
          </div>
        </div>
      )}

      {activeCard === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Filters row */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl">
            <div className="flex gap-2">
              {(['Monthly', 'Quarterly', 'Yearly'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setRevenueFilter(mode)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                    revenueFilter === mode 
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {mode} View
                </button>
              ))}
            </div>
            
            <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
              <span>Timeline: Jul 2025 – Jul 2026</span>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded">INR Currency (₹)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/85">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Year Revenue</span>
              <div className="text-xl font-black text-emerald-600 mt-1">₹{schools.reduce((acc, s) => {
                if (s.paymentStatus === 'Paid') {
                  if (s.subscription === 'Enterprise') return acc + 250000;
                  if (s.subscription === 'Premium') return acc + 120000;
                  if (s.subscription === 'Basic') return acc + 50000;
                }
                return acc;
              }, 0).toLocaleString('en-IN')}</div>
              <p className="text-[9px] text-emerald-500 mt-2">🟢 100% Collected fees</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/85">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unrealized Pipe (Pending)</span>
              <div className="text-xl font-black text-amber-500 mt-1">₹{schools.reduce((acc, s) => {
                if (s.paymentStatus !== 'Paid') {
                  if (s.subscription === 'Enterprise') return acc + 250000;
                  if (s.subscription === 'Premium') return acc + 120000;
                  if (s.subscription === 'Basic') return acc + 50000;
                }
                return acc;
              }, 0).toLocaleString('en-IN')}</div>
              <p className="text-[9px] text-amber-500 mt-2">🟡 In trial or awaiting invoices</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/85">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refunds/Offsets</span>
              <div className="text-xl font-black text-rose-500 mt-1">₹0.00</div>
              <p className="text-[9px] text-slate-400 mt-2">No adjustments this cycle</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/85">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Year-on-Year Growth</span>
              <div className="text-xl font-black text-blue-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
                +24.6% YoY
              </div>
              <p className="text-[9px] text-blue-500 mt-2">SaaS model traction</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SaaS Revenue Stream Timeline (INR)</span>
              <div className="h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTimelineData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" dark:stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(tick) => `₹${tick/1000}k`} />
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan Collection Breakdown</span>
                <div className="h-32 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planRevenueDistribution}
                        innerRadius={25}
                        outerRadius={45}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {planRevenueDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                      <Legend verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Paying Clients</div>
                <div className="space-y-1.5 mt-2 text-[11px]">
                  {topPayingSchools.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCard === 'outstanding' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unpaid Outstanding Amount</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              ₹{schools.reduce((acc, s) => acc + (s.outstandingAmount || 0), 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Outstanding from {finalFilteredData.length} school accounts.</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aging Analysis Overdue</span>
            <div className="h-28 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outstandingBuckets}
                    innerRadius={20}
                    outerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outstandingBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Collection Trend</span>
            <div className="h-28 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={outstandingTimeline}>
                  <XAxis dataKey="name" fontSize={8} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="outstanding" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}


      {/* 6. SEARCH & FILTER SECTION */}
      {activeCard !== 'revenue' && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-xs">
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search school name, code, principal..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Filters selection row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={boardFilter}
                onChange={(e) => { setBoardFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none text-[11px]"
              >
                <option value="All">All Boards</option>
                <option value="CBSE">CBSE Board</option>
                <option value="ICSE">ICSE Board</option>
                <option value="State Board">State Board</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={stateFilter}
                onChange={(e) => { setStateFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none text-[11px]"
              >
                <option value="All">All States</option>
                {uniqueStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none text-[11px]"
              >
                <option value="All">All Plans</option>
                <option value="Trial">Trial Plan</option>
                <option value="Basic">Basic Plan</option>
                <option value="Premium">Premium Plan</option>
                <option value="Enterprise">Enterprise Plan</option>
              </select>
            </div>

            {activeKpiIsTotal() && (
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none text-[11px]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Grace Period">Grace Period</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. DATA GRID LEDGER CONTAINER */}
      {activeCard !== 'revenue' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      School Workspace <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('subscription')}>
                    <div className="flex items-center gap-1">
                      SaaS Plan <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  {activeCard === 'total_schools' && <th className="p-3">Compliance Board</th>}
                  {activeCard === 'total_schools' && <th className="p-3">Geography</th>}
                  {activeCard === 'active_schools' && <th className="p-3">Size/Scale Metrics</th>}
                  {activeCard === 'active_schools' && <th className="p-3">ERP Build</th>}
                  {activeCard === 'active_schools' && <th className="p-3">Active Principal</th>}
                  
                  {activeCard === 'grace_period' && <th className="p-3">Grace Remaining</th>}
                  {activeCard === 'grace_period' && <th className="p-3">Outstanding Fee</th>}
                  {activeCard === 'grace_period' && <th className="p-3">Emergency Contact</th>}

                  {activeCard === 'suspended' && <th className="p-3">Lock Reason</th>}
                  {activeCard === 'suspended' && <th className="p-3">Days Locked</th>}
                  {activeCard === 'suspended' && <th className="p-3">Outstanding Fee</th>}

                  {activeCard === 'disabled' && <th className="p-3">Disable Details</th>}
                  {activeCard === 'disabled' && <th className="p-3">Disabled Date</th>}

                  {activeCard === 'expiring' && <th className="p-3">Time Remaining</th>}
                  {activeCard === 'expiring' && <th className="p-3">Renewal Outstanding</th>}
                  
                  {activeCard === 'outstanding' && <th className="p-3">Invoice details</th>}
                  {activeCard === 'outstanding' && <th className="p-3">Invoice Amount</th>}
                  {activeCard === 'outstanding' && <th className="p-3">Overdue Time</th>}

                  <th className="p-3 text-right">Actions Dashboard Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span>Compiling system database query...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map(s => {
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition">
                        {/* School details column */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs uppercase shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                {s.name}
                                <span className={`h-2 w-2 rounded-full ${
                                  s.status === 'Active' ? 'bg-emerald-500' :
                                  s.status === 'Grace Period' ? 'bg-amber-400' :
                                  s.status === 'Suspended' ? 'bg-rose-500' : 'bg-slate-400'
                                }`} />
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">CODE: {s.code} • {s.city}, {s.state}</div>
                            </div>
                          </div>
                        </td>

                        {/* Subscription Tier column */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded font-black text-[10px] uppercase">
                            {s.subscription}
                          </span>
                        </td>

                        {/* TOTAL SCHOOLS VIEW EXTRAS */}
                        {activeCard === 'total_schools' && (
                          <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{s.board}</td>
                        )}
                        {activeCard === 'total_schools' && (
                          <td className="p-3">
                            <div className="font-medium text-slate-800 dark:text-white">{s.city}</div>
                            <div className="text-[10px] text-slate-400">{s.state}</div>
                          </td>
                        )}

                        {/* ACTIVE SCHOOLS VIEW EXTRAS */}
                        {activeCard === 'active_schools' && (
                          <td className="p-3">
                            <div className="font-medium text-slate-800 dark:text-white">{s.teachersCount} Teachers</div>
                            <div className="text-[10px] text-slate-400">{s.studentsCount} Students • {s.classesCount} Classes</div>
                          </td>
                        )}
                        {activeCard === 'active_schools' && (
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px] font-mono font-bold">
                              {s.erpVersion}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-1">Login: {s.lastLogin}</div>
                          </td>
                        )}
                        {activeCard === 'active_schools' && (
                          <td className="p-3">
                            <div className="font-semibold text-slate-800 dark:text-white">{s.principalName}</div>
                            <div className="text-[10px] text-slate-400">{s.email}</div>
                          </td>
                        )}

                        {/* GRACE PERIOD SCHOOLS VIEW EXTRAS */}
                        {activeCard === 'grace_period' && (
                          <td className="p-3 font-semibold text-amber-500">
                            {s.gracePeriodDays ?? 7} Days left
                            <div className="text-[9px] text-slate-400 font-normal">Expiry: {s.licenseExpiry}</div>
                          </td>
                        )}
                        {activeCard === 'grace_period' && (
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">
                            ₹{(s.outstandingAmount || 0).toLocaleString('en-IN')}
                          </td>
                        )}
                        {activeCard === 'grace_period' && (
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Mail className="h-3 w-3" /> {s.email}
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                              <Phone className="h-3 w-3" /> {s.principalPhone}
                            </div>
                          </td>
                        )}

                        {/* SUSPENDED VIEW EXTRAS */}
                        {activeCard === 'suspended' && (
                          <td className="p-3">
                            <div className="font-semibold text-rose-600">Pending Dues Balance</div>
                            <p className="text-[10px] text-slate-400 leading-tight">License period concluded with no active billing response.</p>
                          </td>
                        )}
                        {activeCard === 'suspended' && (
                          <td className="p-3 font-semibold text-slate-500">{Math.abs(s.daysRemaining)} days ago</td>
                        )}
                        {activeCard === 'suspended' && (
                          <td className="p-3 font-mono font-bold text-rose-600">
                            ₹{(s.outstandingAmount || 250000).toLocaleString('en-IN')}
                          </td>
                        )}

                        {/* DISABLED VIEW EXTRAS */}
                        {activeCard === 'disabled' && (
                          <td className="p-3">
                            <div className="font-semibold text-slate-600">Deactivated / Terminated</div>
                            <p className="text-[10px] text-slate-400">Policy violations or permanent customer request.</p>
                          </td>
                        )}
                        {activeCard === 'disabled' && (
                          <td className="p-3 font-mono text-slate-500">{s.licenseExpiry}</td>
                        )}

                        {/* EXPIRING IN 30 DAYS EXTRAS */}
                        {activeCard === 'expiring' && (
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              s.daysRemaining <= 7 ? 'bg-rose-100 text-rose-800 animate-pulse' :
                              s.daysRemaining <= 15 ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {s.daysRemaining} days remaining
                            </span>
                            <div className="text-[9px] text-slate-400 mt-1 font-semibold">Expiry: {s.licenseExpiry}</div>
                          </td>
                        )}
                        {activeCard === 'expiring' && (
                          <td className="p-3">
                            <div className="font-mono font-bold text-slate-800 dark:text-white">
                              ₹{(s.outstandingAmount || (s.subscription === 'Enterprise' ? 250000 : s.subscription === 'Premium' ? 120000 : 50000)).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[9px] text-slate-400">{s.paymentStatus}</span>
                          </td>
                        )}

                        {/* OUTSTANDING INVOICES EXTRAS */}
                        {activeCard === 'outstanding' && (
                          <td className="p-3">
                            <div className="font-mono font-bold text-blue-600">{s.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-400 font-normal">Issued: {s.createdDate}</div>
                          </td>
                        )}
                        {activeCard === 'outstanding' && (
                          <td className="p-3 font-mono font-black text-rose-600">
                            ₹{(s.outstandingAmount || 0).toLocaleString('en-IN')}
                          </td>
                        )}
                        {activeCard === 'outstanding' && (
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded font-bold text-[9px]">
                              {Math.abs(s.daysRemaining)} Days Overdue
                            </span>
                          </td>
                        )}

                        {/* GENERAL ACTIONS ACTION BUTTONS ROW */}
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5 flex-wrap">
                            {/* Card-specific custom quick buttons */}
                            {activeCard === 'active_schools' && (
                              <>
                                <button
                                  onClick={() => onEditSchool(s)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                  title="Edit full school settings"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(`Enter reason for suspending ${s.name}:`);
                                    if (reason !== null) {
                                      onModifyStatus(s, 'suspend', reason);
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[10px]"
                                  title="Suspend school space"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() => onOpenRenew(s)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]"
                                  title="Renew Subscription"
                                >
                                  Renew
                                </button>
                              </>
                            )}

                            {activeCard === 'grace_period' && (
                              <>
                                <button
                                  onClick={() => onOpenExtend(s)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[10px]"
                                  title="Extend license duration"
                                >
                                  Extend Grace
                                </button>
                                <button
                                  onClick={() => {
                                    onToast(`Dispatched billing grace notification reminder to Principal (${s.principalEmail}) of ${s.name}!`);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                  title="Send invoice reminder"
                                >
                                  Send Reminder
                                </button>
                                <button
                                  onClick={() => onOpenRenew(s)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]"
                                  title="Renew License plan"
                                >
                                  Renew
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(`Enter suspension reason for grace period expiration of ${s.name}:`);
                                    if (reason !== null) {
                                      onModifyStatus(s, 'suspend', reason);
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[10px]"
                                >
                                  Suspend
                                </button>
                              </>
                            )}

                            {activeCard === 'suspended' && (
                              <>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(`Enter reason for activating/reactivating ${s.name}:`);
                                    if (reason !== null) {
                                      onModifyStatus(s, 'reactivate', reason);
                                    }
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                                >
                                  Reactivate
                                </button>
                                <button
                                  onClick={() => {
                                    onToast(`Dispatched overdue invoice notice to Principal (${s.principalEmail}) of ${s.name}!`);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                >
                                  Send Invoice Reminder
                                </button>
                                <button
                                  onClick={() => onEditSchool(s)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                >
                                  Edit School
                                </button>
                              </>
                            )}

                            {activeCard === 'disabled' && (
                              <>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt(`Enter activation reason for disabled node ${s.name}:`);
                                    if (reason !== null) {
                                      onModifyStatus(s, 'reactivate', reason);
                                    }
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                                >
                                  Enable School
                                </button>
                                <button
                                  onClick={() => onEditSchool(s)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => onDeleteSchool(s.id)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px]"
                                >
                                  Delete
                                </button>
                              </>
                            )}

                            {activeCard === 'expiring' && (
                              <>
                                <button
                                  onClick={() => {
                                    onToast(`Sent upcoming license renewal invoice checklist to ${s.principalEmail}`);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                >
                                  Send Reminder
                                </button>
                                <button
                                  onClick={() => onOpenRenew(s)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]"
                                >
                                  Renew
                                </button>
                                <button
                                  onClick={() => onOpenExtend(s)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[10px]"
                                >
                                  Extend
                                </button>
                              </>
                            )}

                            {activeCard === 'outstanding' && (
                              <>
                                <button
                                  onClick={() => {
                                    onToast(`Sent outstanding invoice ledger alert notification to ${s.name}`);
                                  }}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[10px]"
                                >
                                  Send Overdue Alert
                                </button>
                                <button
                                  onClick={() => {
                                    onToast(`Bypassed printable invoice file generation. Download initialized for: ${s.invoiceNumber}.pdf`);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                >
                                  Download PDF Invoice
                                </button>
                                <button
                                  onClick={() => onOpenRenew(s)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                                >
                                  Mark as Paid
                                </button>
                              </>
                            )}

                            {activeCard === 'total_schools' && (
                              <>
                                <button
                                  onClick={() => onEditSchool(s)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded text-[10px]"
                                >
                                  Edit School
                                </button>
                                <button
                                  onClick={() => onOpenBilling(s)}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[10px]"
                                >
                                  Billing Profile
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 font-bold">
                      No multi-tenant matching records found in this category based on search/filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar footer */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850/60 p-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold">
            <span className="text-slate-500">
              Showing {Math.min(finalFilteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(finalFilteredData.length, currentPage * itemsPerPage)} of {finalFilteredData.length} spaces
            </span>

            <div className="flex gap-1.5">
              <button
                onClick={() => setPageSafe(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center px-2 text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setPageSafe(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ${
                  currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Suspension audit trail side ledger */}
      {activeCard === 'suspended' && (
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-rose-500 shrink-0" />
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Access Lock-out audit history</h4>
          </div>
          
          <div className="text-[11px] text-slate-500 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {stateData.auditLogs?.filter(log => log.action.toLowerCase().includes('suspend')).map(log => (
              <div key={log.id} className="py-2 flex justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">[{log.schoolName}]</span> {log.reason}
                </div>
                <div className="text-right text-[10px] shrink-0 font-sans text-slate-400">
                  {new Date(log.dateTime).toLocaleString()} • Admin: {log.adminName}
                </div>
              </div>
            )) || <span className="text-slate-400">No suspension transaction history logs found in the security ledger.</span>}
          </div>
        </div>
      )}

      {/* Embedded Disabled audit trail side ledger */}
      {activeCard === 'disabled' && (
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-slate-500 shrink-0" />
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Workspace Disable/Terminations History</h4>
          </div>
          
          <div className="text-[11px] text-slate-500 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {stateData.auditLogs?.filter(log => log.action.toLowerCase().includes('disable') || log.action.toLowerCase().includes('block')).map(log => (
              <div key={log.id} className="py-2 flex justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">[{log.schoolName}]</span> {log.reason}
                </div>
                <div className="text-right text-[10px] shrink-0 font-sans text-slate-400">
                  {new Date(log.dateTime).toLocaleString()} • Admin: {log.adminName}
                </div>
              </div>
            )) || <span className="text-slate-400">No disabling transaction history logs found in the security ledger.</span>}
          </div>
        </div>
      )}
    </motion.div>
  );

  // Helper inside Total schools view to show status option
  function activeKpiIsTotal() {
    return activeCard === 'total_schools';
  }
}

// Compact helper icons since Lucide versions might vary slightly
function SchoolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  );
}
