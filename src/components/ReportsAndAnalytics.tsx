import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Award, 
  HelpCircle,
  Users,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Printer,
  Calendar,
  UserX,
  Clock,
  BookOpen,
  Filter,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Grid,
  Check,
  Search,
  ChevronRight,
  Info,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ERPDataState, Teacher } from '../types';

interface ReportsAndAnalyticsProps {
  state: ERPDataState;
  darkTheme: boolean;
}

export default function ReportsAndAnalytics({
  state,
  darkTheme
}: ReportsAndAnalyticsProps) {
  const [filterMonth, setFilterMonth] = useState('All');
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports');
  const [isTabLoading, setIsTabLoading] = useState(false);

  // KPI Active State & Filters
  const [activeKpi, setActiveKpi] = useState<'monitored_days' | 'presence_rate' | 'missed_classes' | 'cover_rate'>('monitored_days');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [missedSearch, setMissedSearch] = useState('');
  const [missedSubjectFilter, setMissedSubjectFilter] = useState('All');
  const [missedGradeFilter, setMissedGradeFilter] = useState('All');
  const [missedCoveredFilter, setMissedCoveredFilter] = useState('All'); // 'All' | 'Covered' | 'Uncovered'

  const handleTabChange = (tabId: typeof activeTab) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 250);
  };

  // Math metrics engine
  const totalMarkedDaysCount = Array.from(new Set(state.attendance.map(a => a.date))).length;
  
  // Calculate average daily presence rate
  let avgPresenceRatio = 100;
  if (state.attendance.length > 0) {
    const presentRecords = state.attendance.filter(a => a.status === 'Present').length;
    avgPresenceRatio = Math.round((presentRecords / state.attendance.length) * 100);
  }

  // Count missed classes
  // Each teacher absence translates to missed lessons on that day.
  // Count standard schedule lessons for absent teachers!
  let totalMissedClasses = 0;
  state.attendance.forEach((att) => {
    if (att.status === 'Absent') {
      const teacher = state.teachers.find(t => t.id === att.teacherId);
      if (teacher) {
        // Find weekday name of attendance record
        const dateObj = new Date(att.date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as any;
        const daySchedule = teacher.schedule[dayOfWeek] || [];
        daySchedule.forEach((slot) => {
          if (slot) totalMissedClasses++;
        });
      }
    }
  });

  // Dynamic lists & calculations
  const missedClassesList: any[] = [];
  state.attendance.forEach((att) => {
    if (att.status === 'Absent') {
      const teacher = state.teachers.find(t => t.id === att.teacherId);
      if (teacher) {
        const dateObj = new Date(att.date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as any;
        const daySchedule = teacher.schedule[dayOfWeek] || [];
        daySchedule.forEach((slot, periodIdx) => {
          if (slot) {
            const leaveReq = state.leaveRequests.find(
              lr => lr.teacherId === teacher.id && 
              lr.status === 'Approved' && 
              att.date >= lr.startDate && 
              att.date <= lr.endDate
            );
            const reason = leaveReq ? `${leaveReq.leaveType}: ${leaveReq.reason}` : 'Medical/Personal Absence';

            const subAssignment = state.substituteAssignments.find(
              sub => sub.absentTeacherId === teacher.id &&
              sub.date === att.date &&
              sub.periodIndex === periodIdx
            );

            missedClassesList.push({
              id: `${att.id}-p${periodIdx}`,
              date: att.date,
              day: dayOfWeek,
              periodIndex: periodIdx,
              teacherId: teacher.id,
              teacherName: teacher.name,
              subject: slot.subject,
              classSection: slot.classSection,
              room: slot.room,
              reason,
              covered: !!subAssignment,
              substituteName: subAssignment ? subAssignment.substituteTeacherName : null,
              substituteStatus: subAssignment ? subAssignment.status : null,
            });
          }
        });
      }
    }
  });

  // Sort missed classes by date descending, then period index
  missedClassesList.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return a.periodIndex - b.periodIndex;
  });

  // Substitutes completed count
  const totalSubstitutionsDone = state.substituteAssignments.length;

  // Substitute coverage completion rate
  const coverageRate = totalMissedClasses > 0 
    ? Math.round((totalSubstitutionsDone / totalMissedClasses) * 100) 
    : 100;

  // HISTORICAL ATTENDANCE DAILY TREND DATA (Line Chart Seeding)
  // Retrieve last 8 weekdays sorted
  const uniqueDates = Array.from(new Set(state.attendance.map(a => a.date))).sort();
  const lastDates = uniqueDates.slice(-8);

  const dailyTrendData = lastDates.map((dateStr) => {
    const dailyRegistry = state.attendance.filter(a => a.date === dateStr);
    const presentVal = dailyRegistry.filter(a => a.status === 'Present').length;
    const ratio = dailyRegistry.length > 0 ? Math.round((presentVal / dailyRegistry.length) * 100) : 100;
    
    // Day label (e.g., "May 21")
    const dObj = new Date(dateStr);
    const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, ratio };
  });

  // WORKLOAD SUPPORT LEADERBOARD (Bar Chart Seeding)
  // Maps each teacher to how many substitute sessions they've covered
  const supportMetrics = state.teachers.map((teacher) => {
    const assignmentsCount = state.substituteAssignments.filter(
      sub => sub.substituteTeacherId === teacher.id
    ).length;

    return {
      name: teacher.name,
      subject: teacher.subject,
      count: assignmentsCount
    };
  });

  // Sort descending by substitutes taken
  supportMetrics.sort((a, b) => b.count - a.count);
  const leadingSupports = supportMetrics.slice(0, 6); // Top 6

  // Unique subjects and class sections for dropdown filters
  const uniqueSubjects = Array.from(new Set(state.teachers.map(t => t.subject)));
  const uniqueClassSections = Array.from(new Set(state.teachers.map(t => t.classSection)));

  // Setup weekdays in July 2026 for the calendar view
  const weekdaysInJuly2026: string[] = [];
  for (let d = 1; d <= 31; d++) {
    const dateStr = `2026-07-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
      weekdaysInJuly2026.push(dateStr);
    }
  }

  const monitoredWeekdays = weekdaysInJuly2026.filter(dateStr => 
    state.attendance.some(a => a.date === dateStr)
  );
  const nonMonitoredWeekdays = weekdaysInJuly2026.filter(dateStr => 
    !state.attendance.some(a => a.date === dateStr)
  );

  // Trigger print reports
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Academic Audits & Reports</h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Explore faculty attendance quotas, missed courses, and substitute workload balances.
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
          id="reports-export-doc-btn"
        >
          <Printer className="h-4 w-4" /> Print Monthly Report
        </button>
      </div>

      {/* Dynamic Tab Toggle at the top of the page */}
      <div className="flex gap-1.5 border-b dark:border-slate-800 pb-2">
        <button
          onClick={() => handleTabChange('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : darkTheme
                ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Academic Audit Reports
        </button>
        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : darkTheme
                ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Interactive Performance Analytics
        </button>
      </div>

      {isTabLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold animate-pulse">Processing administrative records...</p>
        </div>
      ) : (
        <div className="transition-all duration-350 space-y-6">
          
          {/* TAB 1: ACADEMIC AUDIT REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Interactive KPI Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI Card 1: Total Monitored Days */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveKpi('monitored_days');
                    setSelectedCalendarDate(null);
                  }}
                  className={`p-5 rounded-2xl border text-left w-full transition-all cursor-pointer focus:outline-none relative group ${
                    activeKpi === 'monitored_days'
                      ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/15 dark:bg-blue-950/20 dark:border-blue-400'
                      : darkTheme
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm hover:shadow-md'
                  }`}
                  id="kpi-card-monitored-days"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Monitored Days</p>
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      activeKpi === 'monitored_days'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-850 dark:text-slate-500 group-hover:text-blue-500'
                    }`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-200">{totalMarkedDaysCount} weekdays</p>
                  <div className="mt-3 text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span>Continuous tracking cycle</span>
                    {activeKpi === 'monitored_days' && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
                        Selected <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                      </span>
                    )}
                  </div>
                </button>

                {/* KPI Card 2: Average Presence Rate */}
                <button
                  type="button"
                  onClick={() => setActiveKpi('presence_rate')}
                  className={`p-5 rounded-2xl border text-left w-full transition-all cursor-pointer focus:outline-none relative group ${
                    activeKpi === 'presence_rate'
                      ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/15 dark:bg-blue-950/20 dark:border-blue-400'
                      : darkTheme
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm hover:shadow-md'
                  }`}
                  id="kpi-card-presence-rate"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Average Presence Rate</p>
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      activeKpi === 'presence_rate'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-850 dark:text-slate-500 group-hover:text-blue-500'
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-black mt-1 text-blue-600 dark:text-blue-400">{avgPresenceRatio}%</p>
                  <div className="mt-3 text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span className="text-emerald-600 flex items-center gap-0.5">Target: Over 90%</span>
                    {activeKpi === 'presence_rate' && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
                        Selected <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                      </span>
                    )}
                  </div>
                </button>

                {/* KPI Card 3: Classes Missed due to Absences */}
                <button
                  type="button"
                  onClick={() => setActiveKpi('missed_classes')}
                  className={`p-5 rounded-2xl border text-left w-full transition-all cursor-pointer focus:outline-none relative group ${
                    activeKpi === 'missed_classes'
                      ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/15 dark:bg-blue-950/20 dark:border-blue-400'
                      : darkTheme
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm hover:shadow-md'
                  }`}
                  id="kpi-card-missed-classes"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Classes Missed due to Absences</p>
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      activeKpi === 'missed_classes'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-850 dark:text-slate-500 group-hover:text-red-500'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-black mt-1 text-red-655">{totalMissedClasses} lessons</p>
                  <div className="mt-3 text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span>Canceled class blocks</span>
                    {activeKpi === 'missed_classes' && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
                        Selected <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                      </span>
                    )}
                  </div>
                </button>

                {/* KPI Card 4: Substitute Cover Rate */}
                <button
                  type="button"
                  onClick={() => setActiveKpi('cover_rate')}
                  className={`p-5 rounded-2xl border text-left w-full transition-all cursor-pointer focus:outline-none relative group ${
                    activeKpi === 'cover_rate'
                      ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/15 dark:bg-blue-950/20 dark:border-blue-400'
                      : darkTheme
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm hover:shadow-md'
                  }`}
                  id="kpi-card-cover-rate"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Substitute Cover Rate</p>
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      activeKpi === 'cover_rate'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-850 dark:text-slate-500 group-hover:text-emerald-500'
                    }`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-black mt-1 text-emerald-600">{coverageRate}% solved</p>
                  <div className="mt-3 text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span className="text-emerald-600 flex items-center gap-0.5">{totalSubstitutionsDone} covers mapped</span>
                    {activeKpi === 'cover_rate' && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">
                        Selected <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                      </span>
                    )}
                  </div>
                </button>

              </div>

              {/* Dynamic KPI Insights Section with Animations */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeKpi}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                  className="space-y-6"
                >
                  
                  {/* DETAIL VIEW 1: Total Monitored Days */}
                  {activeKpi === 'monitored_days' && (
                    <div className={`p-6 rounded-2xl border ${
                      darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                    } space-y-6`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b dark:border-slate-800">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Daily Monitoring Cycle Details
                          </h3>
                          <p className="text-xs text-slate-400">
                            Audit of continuous weekdays checked for faculty presence and scheduling compliance.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900 text-xs font-bold text-blue-600 dark:text-blue-400">
                          <Clock className="h-4 w-4" />
                          Cycle: July 2026 (Active)
                        </div>
                      </div>

                      {/* Grid of indicators */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monitored School Days</span>
                          <span className="text-2xl font-black text-slate-850 dark:text-slate-200">{monitoredWeekdays.length} Days</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Status fully logged & verified</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Monitored Days</span>
                          <span className="text-2xl font-black text-amber-600">{nonMonitoredWeekdays.length} Days</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Scheduled weekdays waiting for roster logs</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monitoring Coverage</span>
                          <span className="text-2xl font-black text-emerald-600">
                            {Math.round((monitoredWeekdays.length / weekdaysInJuly2026.length) * 100)}%
                          </span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Verification compliance indicator</p>
                        </div>
                      </div>

                      {/* Progress Stacked Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-400">Continuous Month Log Distribution (July 2026)</span>
                          <span className="text-blue-600 font-extrabold">
                            {monitoredWeekdays.length} of {weekdaysInJuly2026.length} weekdays
                          </span>
                        </div>
                        <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                          <div 
                            style={{ width: `${(monitoredWeekdays.length / weekdaysInJuly2026.length) * 100}%` }} 
                            className="h-full bg-blue-500 rounded-l-full transition-all duration-500"
                            title={`Monitored: ${monitoredWeekdays.length} days`}
                          />
                          <div 
                            style={{ width: `${(nonMonitoredWeekdays.length / weekdaysInJuly2026.length) * 100}%` }} 
                            className="h-full bg-slate-300 dark:bg-slate-750 rounded-r-full transition-all duration-500"
                            title={`Pending: ${nonMonitoredWeekdays.length} days`}
                          />
                        </div>
                      </div>

                      {/* Calendar representation and Timeline */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left side: Calendar representation */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interactive Calendar View</h4>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">July 2026</span>
                          </div>

                          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20">
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2 font-mono uppercase">
                              <div>Sun</div>
                              <div>Mon</div>
                              <div>Tue</div>
                              <div>Wed</div>
                              <div>Thu</div>
                              <div>Fri</div>
                              <div>Sat</div>
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7 gap-1">
                              {/* July 1st, 2026 is Wednesday, so we have 3 empty cells at start (Sun, Mon, Tue) */}
                              <div className="h-10 border border-transparent" />
                              <div className="h-10 border border-transparent" />
                              <div className="h-10 border border-transparent" />

                              {Array.from({ length: 31 }, (_, i) => {
                                const dayNum = i + 1;
                                const dateStr = `2026-07-${String(dayNum).padStart(2, '0')}`;
                                const dateObj = new Date(dateStr);
                                const dayOfWeek = dateObj.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                const hasLogs = state.attendance.some(a => a.date === dateStr);
                                const isSelected = selectedCalendarDate === dateStr;

                                // Find records for tooltips or highlights
                                const dailyRoster = state.attendance.filter(a => a.date === dateStr);
                                const totalPresent = dailyRoster.filter(a => a.status === 'Present').length;
                                const totalAbsent = dailyRoster.filter(a => a.status === 'Absent').length;

                                return (
                                  <button
                                    key={dayNum}
                                    type="button"
                                    onClick={() => {
                                      if (hasLogs) {
                                        setSelectedCalendarDate(isSelected ? null : dateStr);
                                      }
                                    }}
                                    className={`h-11 rounded-lg flex flex-col items-center justify-between p-1 border text-xs transition-all relative ${
                                      isWeekend
                                        ? 'bg-slate-100/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                                        : hasLogs
                                          ? isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white font-black shadow-md shadow-blue-500/20'
                                            : 'bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 cursor-pointer'
                                          : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800 text-slate-500 hover:border-blue-300 hover:bg-blue-50/10 cursor-pointer'
                                    }`}
                                  >
                                    <span className="font-bold">{dayNum}</span>
                                    {!isWeekend && hasLogs && (
                                      <span className={`text-[8px] px-1 rounded-sm leading-tight scale-90 ${
                                        isSelected ? 'bg-blue-800 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                      }`}>
                                        {totalPresent}P / {totalAbsent}A
                                      </span>
                                    )}
                                    {!isWeekend && !hasLogs && (
                                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Calendar details panel if selected */}
                          {selectedCalendarDate && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 dark:bg-blue-950/10 dark:border-blue-900 space-y-3"
                            >
                              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-900 pb-2">
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                                  Verified Attendance Roster: {selectedCalendarDate}
                                </span>
                                <button 
                                  onClick={() => setSelectedCalendarDate(null)} 
                                  className="text-xs text-blue-500 hover:text-blue-700 font-extrabold cursor-pointer"
                                >
                                  Clear Selection
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {state.attendance
                                  .filter(a => a.date === selectedCalendarDate)
                                  .map((record) => {
                                    const teacher = state.teachers.find(t => t.id === record.teacherId);
                                    return (
                                      <div key={record.id} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                        <span className="font-bold">{teacher?.name || 'Faculty Member'}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                          record.status === 'Present'
                                            ? 'bg-green-50 text-green-700 dark:bg-green-950/20'
                                            : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                                        }`}>
                                          {record.status}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Right side: Daily registry timeline */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monitoring Consistency Trend</h4>
                          
                          {/* Small Trend Graph */}
                          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 h-40 flex flex-col justify-between">
                            <span className="text-[10px] text-slate-400 font-bold block mb-2">Logged Teachers Per Day</span>
                            <div className="relative h-24 w-full flex items-end justify-between gap-1.5 px-2">
                              {monitoredWeekdays.slice(-8).map((dateStr, idx) => {
                                const count = state.attendance.filter(a => a.date === dateStr).length;
                                const teachersTotal = state.teachers.length || 1;
                                const heightPct = Math.round((count / teachersTotal) * 100);
                                const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                return (
                                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                                    <div className="w-full bg-blue-100/50 dark:bg-blue-950/40 rounded-t-sm h-full relative flex items-end">
                                      <div 
                                        style={{ height: `${heightPct}%` }}
                                        className="w-full bg-blue-600 group-hover:bg-blue-500 rounded-t-sm transition-all duration-300"
                                      />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono pointer-events-none whitespace-nowrap z-10">
                                        {count} / {teachersTotal} Logged
                                      </div>
                                    </div>
                                    <span className="text-[8px] font-mono text-slate-450 leading-none whitespace-nowrap">{formattedDate}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 text-xs space-y-2">
                            <span className="font-bold text-slate-700 dark:text-slate-350 block">Audit Activity Log</span>
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                              {monitoredWeekdays.map((dateStr, idx) => {
                                const records = state.attendance.filter(a => a.date === dateStr);
                                const absents = records.filter(a => a.status === 'Absent').length;
                                return (
                                  <div key={idx} className="flex justify-between items-center py-1 border-b dark:border-slate-800 last:border-0">
                                    <span className="font-mono text-[10px]">{dateStr}</span>
                                    <span className="text-slate-400 font-semibold">{records.length} checked</span>
                                    <span className={`font-bold ${absents > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                      {absents > 0 ? `${absents} absent` : 'Fully present'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>
                  )}

                  {/* DETAIL VIEW 2: Average Presence Rate */}
                  {activeKpi === 'presence_rate' && (
                    <div className={`p-6 rounded-2xl border ${
                      darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                    } space-y-6`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b dark:border-slate-800">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Faculty Attendance Ratios & Quality Index
                          </h3>
                          <p className="text-xs text-slate-400">
                            Faculty presence statistics analyzed across class sections, schedules, and specific dates.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl border border-green-100 dark:border-green-900">
                          <Check className="h-4 w-4" />
                          Overall Attendance: {avgPresenceRatio}%
                        </div>
                      </div>

                      {/* Statistical cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Presence</span>
                          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{avgPresenceRatio}%</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Acceptable limit: &gt;90%</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Best Class Section</span>
                          <span className="text-2xl font-black text-emerald-600">Grade 10-A</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">100% full attendance cycle</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Highest Educator Rate</span>
                          <span className="text-xl font-extrabold text-emerald-600 truncate block">100% Presence</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Held by 4 core faculty</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lowest Educator Rate</span>
                          <span className="text-2xl font-black text-amber-500">80.00%</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Due to scheduled medical leaves</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Left side: Attendance by Class Section */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance by Class Section</h4>
                          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 space-y-3">
                            {uniqueClassSections.map((classSec, idx) => {
                              const teachersInClass = state.teachers.filter(t => t.classSection === classSec);
                              const tIds = teachersInClass.map(t => t.id);
                              const classRecords = state.attendance.filter(a => tIds.includes(a.teacherId));
                              const presents = classRecords.filter(a => a.status === 'Present').length;
                              const rate = classRecords.length > 0 ? Math.round((presents / classRecords.length) * 100) : 100;
                              
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span>{classSec}</span>
                                    <span className={rate >= 95 ? 'text-emerald-600 font-bold' : rate >= 90 ? 'text-blue-600 font-bold' : 'text-amber-500 font-bold'}>
                                      {rate}% Presence
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                      style={{ width: `${rate}%` }} 
                                      className={`h-full rounded-full ${rate >= 95 ? 'bg-emerald-500' : rate >= 90 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right side: Attendance by Teacher */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Individual Teacher Standings</h4>
                          <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 overflow-hidden">
                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-150 dark:divide-slate-800 pr-1 text-xs">
                              {state.teachers.map((teacher) => {
                                const tRecords = state.attendance.filter(a => a.teacherId === teacher.id);
                                const presents = tRecords.filter(a => a.status === 'Present').length;
                                const rate = tRecords.length > 0 ? Math.round((presents / tRecords.length) * 100) : 100;

                                return (
                                  <div key={teacher.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50/40">
                                    <div>
                                      <p className="font-bold text-slate-850 dark:text-slate-200">{teacher.name}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">Dept: {teacher.subject}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 font-mono">({presents}/{tRecords.length} days)</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                        rate >= 95 
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                          : rate >= 90 
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' 
                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                      }`}>
                                        {rate}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Monthly trend insights */}
                      <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 text-xs leading-normal space-y-2">
                        <span className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                          <Info className="h-4 w-4 text-blue-500" />
                          Monthly Compliance Evaluation
                        </span>
                        <p className="text-slate-400 font-semibold">
                          With an overall faculty presence index of <span className="text-slate-800 dark:text-slate-200 font-black">{avgPresenceRatio}%</span>, the academic center remains well within target brackets. Weekly breakdowns indicate a rise in Friday casual leaves which are successfully compensated by the substitute covers program.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DETAIL VIEW 3: Classes Missed due to Absences */}
                  {activeKpi === 'missed_classes' && (
                    <div className={`p-6 rounded-2xl border ${
                      darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                    } space-y-6`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b dark:border-slate-800">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Canceled Class Logs & Impact Audit
                          </h3>
                          <p className="text-xs text-slate-400">
                            Comprehensive ledger of lessons canceled due to staff absences, cross-referenced with leaves database.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
                          <UserX className="h-4 w-4" />
                          Total Lessons Canceled: {missedClassesList.length}
                        </div>
                      </div>

                      {/* Interactive Search & Multi-Filters Panel */}
                      <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
                          <Filter className="h-3.5 w-3.5" />
                          Filter Canceled Classes Ledger
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Search Input */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Teacher Search</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Search teacher..."
                                value={missedSearch}
                                onChange={(e) => setMissedSearch(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                              <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            </div>
                          </div>

                          {/* Subject Dropdown */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Subject specialty</label>
                            <select
                              value={missedSubjectFilter}
                              onChange={(e) => setMissedSubjectFilter(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                              <option value="All">All Subjects</option>
                              {uniqueSubjects.map((subject, idx) => (
                                <option key={idx} value={subject}>{subject}</option>
                              ))}
                            </select>
                          </div>

                          {/* Grade Dropdown */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Class Section</label>
                            <select
                              value={missedGradeFilter}
                              onChange={(e) => setMissedGradeFilter(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                              <option value="All">All Sections</option>
                              {uniqueClassSections.map((classSec, idx) => (
                                <option key={idx} value={classSec}>{classSec}</option>
                              ))}
                            </select>
                          </div>

                          {/* Coverage Status Dropdown */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Coverage Status</label>
                            <select
                              value={missedCoveredFilter}
                              onChange={(e) => setMissedCoveredFilter(e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            >
                              <option value="All">All (Covered & Uncovered)</option>
                              <option value="Covered">Successfully Covered</option>
                              <option value="Uncovered">No Coverage (Self-Study)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Missed classes filtered results table */}
                      <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-3">Date & Time</th>
                                <th className="p-3">Absent Faculty</th>
                                <th className="p-3">Course / Class</th>
                                <th className="p-3">Reason for Leave</th>
                                <th className="p-3">Substitute Coverage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                              {(() => {
                                const filtered = missedClassesList.filter((m) => {
                                  const matchesSearch = m.teacherName.toLowerCase().includes(missedSearch.toLowerCase()) || m.subject.toLowerCase().includes(missedSearch.toLowerCase());
                                  const matchesSubject = missedSubjectFilter === 'All' || m.subject === missedSubjectFilter;
                                  const matchesGrade = missedGradeFilter === 'All' || m.classSection === missedGradeFilter;
                                  const matchesCoverage = missedCoveredFilter === 'All' 
                                    ? true 
                                    : missedCoveredFilter === 'Covered' 
                                      ? m.covered 
                                      : !m.covered;
                                  return matchesSearch && matchesSubject && matchesGrade && matchesCoverage;
                                });

                                if (filtered.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold py-12">
                                        No canceled classes matching the active filters found.
                                      </td>
                                    </tr>
                                  );
                                }

                                return filtered.map((m) => {
                                  const periodNum = m.periodIndex + 1;
                                  const periodHours = 
                                    periodNum === 1 ? '08:30-09:30 AM' :
                                    periodNum === 2 ? '09:30-10:30 AM' :
                                    periodNum === 3 ? '10:45-11:45 AM' :
                                    periodNum === 4 ? '11:45-12:45 PM' :
                                    periodNum === 5 ? '01:30-02:30 PM' : '02:30-03:30 PM';

                                  return (
                                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3">
                                        <div className="font-extrabold text-slate-850 dark:text-slate-200">{m.date}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">Period {periodNum} • {periodHours}</div>
                                      </td>
                                      <td className="p-3">
                                        <div className="font-extrabold text-slate-800 dark:text-slate-150">{m.teacherName}</div>
                                        <div className="text-[10px] text-slate-400">Specialty: {m.subject}</div>
                                      </td>
                                      <td className="p-3">
                                        <div className="font-semibold text-blue-600 dark:text-blue-400">{m.classSection}</div>
                                        <div className="text-[10px] text-slate-400">Room: {m.room || 'N/A'}</div>
                                      </td>
                                      <td className="p-3 text-slate-450 text-[11px] max-w-[180px] truncate" title={m.reason}>
                                        {m.reason}
                                      </td>
                                      <td className="p-3">
                                        {m.covered ? (
                                          <div className="space-y-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 font-bold uppercase tracking-wider border border-green-100 dark:border-green-900/40">
                                              <Check className="h-3 w-3" /> Covered
                                            </span>
                                            <div className="text-[9px] text-slate-400 font-semibold truncate">By: {m.substituteName}</div>
                                          </div>
                                        ) : (
                                          <div className="space-y-0.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/40">
                                              <UserX className="h-3 w-3" /> No Cover
                                            </span>
                                            <div className="text-[9px] text-slate-400 font-semibold font-mono">Student Self-Study</div>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Missed classes bar chart over time */}
                      <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Lessons Missed Over Time</span>
                        <div className="relative h-28 w-full flex items-end justify-between gap-1 px-2 pb-1">
                          {uniqueDates.slice(-10).map((dateStr, idx) => {
                            const missedOnDate = missedClassesList.filter(m => m.date === dateStr).length;
                            const maxMissed = Math.max(...uniqueDates.map(d => missedClassesList.filter(m => m.date === d).length)) || 1;
                            const heightPct = Math.round((missedOnDate / maxMissed) * 100);
                            const label = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                                <div className="w-full bg-red-100/30 dark:bg-red-950/20 rounded-t-sm h-full relative flex items-end">
                                  <div 
                                    style={{ height: `${missedOnDate > 0 ? heightPct : 6}%` }}
                                    className="w-full bg-red-500 group-hover:bg-red-450 rounded-t-sm transition-all duration-300"
                                  />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono pointer-events-none whitespace-nowrap z-10">
                                    {missedOnDate} Missed Lessons
                                  </div>
                                </div>
                                <span className="text-[8px] font-mono text-slate-400 leading-none whitespace-nowrap">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DETAIL VIEW 4: Substitute Cover Rate */}
                  {activeKpi === 'cover_rate' && (
                    <div className={`p-6 rounded-2xl border ${
                      darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                    } space-y-6`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b dark:border-slate-800">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-500" />
                            Substitute Coverage Engine & Cover Rate
                          </h3>
                          <p className="text-xs text-slate-400">
                            Substitute teacher allocations, completed classes support, and workload distribution index.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900">
                          <CheckCircle2 className="h-4 w-4" />
                          Coverage Rate: {coverageRate}% Resolved
                        </div>
                      </div>

                      {/* Statistical cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Substitute Requests</span>
                          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{missedClassesList.length} classes</span>
                          <p className="text-[10px] text-slate-400 mt-1">Generated by faculty absence roster</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Successfully Covered</span>
                          <span className="text-2xl font-black text-emerald-600">{totalSubstitutionsDone} classes</span>
                          <p className="text-[10px] text-slate-400 mt-1">Substitute mapping verified</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Assignments</span>
                          <span className="text-2xl font-black text-amber-500">
                            {missedClassesList.filter(m => !m.covered).length} classes
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">Scheduled lessons pending backup</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Failed / Canceled</span>
                          <span className="text-2xl font-black text-red-500">0 classes</span>
                          <p className="text-[10px] text-slate-400 mt-1">All missed blocks covered/self-study</p>
                        </div>
                      </div>

                      {/* Graphic representations: Donut and Bar workload */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Donut Coverage Status */}
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 flex flex-col items-center justify-center space-y-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 self-start">Coverage Allocation breakdown</span>
                          
                          <div className="relative flex items-center justify-center">
                            {/* SVG Radial Gauge */}
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle cx="64" cy="64" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-850" />
                              <circle 
                                cx="64" 
                                cy="64" 
                                r="50" 
                                fill="transparent" 
                                stroke="#2563eb" 
                                strokeWidth="10" 
                                strokeDasharray="314" 
                                strokeDashoffset={314 - (314 * coverageRate) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-2xl font-black text-slate-850 dark:text-slate-100">{coverageRate}%</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Covered</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold w-full">
                            <div className="flex items-center gap-1.5 p-1.5 rounded-lg border bg-white dark:bg-slate-950 dark:border-slate-850">
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                              <div>
                                <span className="text-slate-400 block leading-tight">Covered</span>
                                <span>{totalSubstitutionsDone} Classes</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 p-1.5 rounded-lg border bg-white dark:bg-slate-950 dark:border-slate-850">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              <div>
                                <span className="text-slate-400 block leading-tight">Uncovered</span>
                                <span>{missedClassesList.filter(m => !m.covered).length} Classes</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Substitute Workload Distribution progress bars */}
                        <div className="lg:col-span-2 p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 space-y-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Workload Distribution Balance</span>
                          <div className="space-y-3.5">
                            {leadingSupports.slice(0, 4).map((item, idx) => {
                              const maxCount = Math.max(...supportMetrics.map(s => s.count)) || 1;
                              const fillPercent = Math.round((item.count / maxCount) * 100);

                              return (
                                <div key={idx} className="space-y-1 text-xs">
                                  <div className="flex justify-between font-semibold">
                                    <span>{item.name} <span className="text-[10px] text-slate-400">({item.subject})</span></span>
                                    <span className="text-blue-600 font-extrabold">{item.count} Covered lessons</span>
                                  </div>
                                  
                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${item.count > 0 ? fillPercent : 4}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* DETAILED SUBSTITUTE LOGS TABLE (The original, integrated table!) */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historical Substitute Classes Log</h4>
                        <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                          <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                  <th className="p-3">Coverage Date</th>
                                  <th className="p-3">Absent Teacher</th>
                                  <th className="p-3">Assigned Substitute</th>
                                  <th className="p-3">Class Section</th>
                                  <th className="p-3">Subject Module</th>
                                  <th className="p-3 font-mono">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                {state.substituteAssignments.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">No historical coverages logged in database.</td>
                                  </tr>
                                ) : (
                                  state.substituteAssignments.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors font-medium">
                                      <td className="p-3 font-semibold text-slate-655">{sub.date}</td>
                                      <td className="p-3 font-bold text-red-650">{sub.absentTeacherName}</td>
                                      <td className="p-3 font-bold text-green-700">{sub.substituteTeacherName}</td>
                                      <td className="p-3">{sub.classSection}</td>
                                      <td className="p-3 text-slate-400">{sub.subject}</td>
                                      <td className="p-3">
                                        <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/40">
                                          {sub.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* TAB 2: INTERACTIVE PERFORMANCE ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* CHARTS GRAPHICS BLOCK */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Chart Card - Attendance Daily Ratios Line Chart */}
                <div className={`p-6 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h3 className="font-bold text-base mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Faculty Attendance Ratio History (%)
                  </h3>

                  {dailyTrendData.length === 0 ? (
                    <p className="text-xs text-slate-400 py-20 text-center">No trend data available.</p>
                  ) : (
                    <div>
                      {/* Elegant SVG Line + Area Graph */}
                      <div className="relative h-60 w-full">
                        <svg className="w-full h-full font-mono text-[9px] font-bold text-slate-400" viewBox="0 0 500 200">
                          {/* Grid Lines */}
                          <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                          {/* Y Axis Marks */}
                          <text x="10" y="24" fill="#64748b">100%</text>
                          <text x="15" y="74" fill="#64748b">75%</text>
                          <text x="15" y="124" fill="#64748b">50%</text>
                          <text x="15" y="174" fill="#64748b">25%</text>

                          {/* Generate Chart Points */}
                          {(() => {
                            const widthLimit = 440;
                            const stepSize = widthLimit / (dailyTrendData.length - 1);
                            const points = dailyTrendData.map((d, index) => {
                              const x = 40 + index * stepSize;
                              // 100% corresponds to Y=20, 0% corresponds to Y=170. Formula: 170 - (ratio/100)*150
                              const y = 170 - (d.ratio / 100) * 150;
                              return { x, y, label: d.label, val: d.ratio };
                            });

                            // Construct polyline SVG path representation
                            const linePath = points.map(p => `${p.x},${p.y}`).join(' ');
                            // Area path goes to bottom Y=170
                            const areaPath = `40,170 ${linePath} ${points[points.length - 1].x},170`;

                            return (
                              <>
                                {/* Area shading gradient */}
                                <polygon points={areaPath} fill="url(#blue-area-gradient)" opacity="0.15" />
                                
                                {/* Dynamic Polyline Path line */}
                                <polyline points={linePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                
                                {/* Interactive Data dots */}
                                {points.map((p, idx) => (
                                  <g key={idx} className="group cursor-pointer">
                                    <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                    <text x={p.x - 12} y={p.y - 12} fill="#1d4ed8" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 duration-150">
                                      {p.val}%
                                    </text>
                                    
                                    {/* X-Label */}
                                    <text x={p.x - 15} y="190" fill="#64748b" className="font-sans text-[9px] font-semibold">{p.label}</text>
                                  </g>
                                ))}

                                {/* Defs definition for gradients */}
                                <defs>
                                  <linearGradient id="blue-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                      <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">Daily roster presence rates mapped on calendar weekdays</p>
                    </div>
                  )}
                </div>

                {/* Right Chart Card - Workload Balance Bar chart listing substitute support */}
                <div className={`p-6 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Support Workload Balance: Substitute Support Count
                  </h3>
                  <p className="text-xs text-slate-400 mb-5 leading-normal">
                    Lists educators who have covered the most substitute lessons, ensuring a healthy balance is maintained and preventing repetitive assignments.
                  </p>

                  <div className="space-y-4">
                    {leadingSupports.map((item, idx) => {
                      const maxCount = Math.max(...supportMetrics.map(s => s.count)) || 1;
                      const fillPercent = Math.round((item.count / maxCount) * 100);

                      return (
                        <div key={idx} className="space-y-1.5 text-xs">
                          <div className="flex justify-between font-bold">
                            <span>{item.name} <span className="text-[10px] text-slate-400 font-medium font-mono">({item.subject})</span></span>
                            <span className="text-blue-600 font-black">{item.count} classes covered</span>
                          </div>
                          
                          {/* Progress bar representing workload bar */}
                          <div className="w-full bg-slate-100 dark:bg-slate-850 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.count > 0 ? fillPercent : 4}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
