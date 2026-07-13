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
  Printer
} from 'lucide-react';
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
              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Monitored Days</p>
                  <p className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-200">{totalMarkedDaysCount} weekdays</p>
                  <div className="mt-3 text-xs font-semibold text-slate-400">Continuous tracking cycle</div>
                </div>

                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Average Presence Rate</p>
                  <p className="text-3xl font-black mt-1 text-blue-600 dark:text-blue-400">{avgPresenceRatio}%</p>
                  <div className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 shrink-0" /> Target: Over 90% set threshold
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Classes Missed due to Absences</p>
                  <p className="text-3xl font-black mt-1 text-red-655">{totalMissedClasses} lessons</p>
                  <div className="mt-3 text-xs font-semibold text-slate-400">Representing canceled blocks</div>
                </div>

                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Substitute Cover Rate</p>
                  <p className="text-3xl font-black mt-1 text-emerald-600">{coverageRate}% solved</p>
                  <div className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> {totalSubstitutionsDone} alternate covers mapped
                  </div>
                </div>

              </div>

              {/* DETAILED SUBSTITUTE LOGS TABLE */}
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}>
                <h3 className="font-bold text-base mb-4">Historical Substitute Classes Log</h3>
                
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 font-bold">
                        <th className="p-3">Coverage Date</th>
                        <th className="p-3">Absent Teacher</th>
                        <th className="p-3">Assigned Substitute</th>
                        <th className="p-3">Class Section</th>
                        <th className="p-3">Subject Module</th>
                        <th className="p-3 font-mono">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {state.substituteAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 text-xs font-semibold">No historical coverages logged in DB.</td>
                        </tr>
                      ) : (
                        state.substituteAssignments.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-3 font-medium text-slate-650">{sub.date}</td>
                            <td className="p-3 font-semibold text-red-600">{sub.absentTeacherName}</td>
                            <td className="p-3 font-semibold text-green-700">{sub.substituteTeacherName}</td>
                            <td className="p-3">{sub.classSection}</td>
                            <td className="p-3 text-slate-500 font-medium">{sub.subject}</td>
                            <td className="p-3">
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">
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
