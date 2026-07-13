import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  UserCheck2, 
  UserX2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { Teacher, AttendanceRecord, ERPDataState } from '../types';

interface AttendanceTrackerProps {
  state: ERPDataState;
  selectedDate: string; // YYYY-MM-DD
  onSetSelectedDate: (date: string) => void;
  onSaveAttendance: (date: string, statuses: { [teacherId: string]: 'Present' | 'Absent' }) => Promise<any>;
  darkTheme: boolean;
}

export default function AttendanceTracker({
  state,
  selectedDate,
  onSetSelectedDate,
  onSaveAttendance,
  darkTheme
}: AttendanceTrackerProps) {
  const [statuses, setStatuses] = useState<{ [teacherId: string]: 'Present' | 'Absent' }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'history' | 'leaves' | 'stats'>('register');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tabId: typeof activeTab) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 250);
  };

  // Load existing attendance details for selected date
  useEffect(() => {
    const dailyRecords = state.attendance.filter(r => r.date === selectedDate);
    const loadedStatuses: { [teacherId: string]: 'Present' | 'Absent' } = {};
    
    state.teachers.forEach((teacher) => {
      const match = dailyRecords.find(r => r.teacherId === teacher.id);
      loadedStatuses[teacher.id] = match ? match.status : 'Present'; // default Present
    });

    setStatuses(loadedStatuses);
    setIsSuccess(false);
  }, [selectedDate, state.attendance, state.teachers]);

  const handleToggle = (teacherId: string, value: 'Present' | 'Absent') => {
    setStatuses(prev => ({
      ...prev,
      [teacherId]: value
    }));
    setIsSuccess(false);
  };

  const handleMarkAllPresent = () => {
    const updated: typeof statuses = {};
    state.teachers.forEach(t => {
      updated[t.id] = 'Present';
    });
    setStatuses(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsSuccess(false);
    try {
      await onSaveAttendance(selectedDate, statuses);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics summary calculated live
  const total = state.teachers.length;
  const presentCount = Object.values(statuses).filter(s => s === 'Present').length;
  const absentCount = Object.values(statuses).filter(s => s === 'Absent').length;
  const presenceRatio = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Educator Daily Register</h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Audit attendance records of the academic staff. Absences automatically initiate coverage.
          </p>
        </div>

        {activeTab === 'register' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Date Register:</label>
            <div className="relative rounded-xl shadow-sm bg-white dark:bg-slate-900 border overflow-hidden">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onSetSelectedDate(e.target.value)}
                className="px-3.5 py-1.5 focus:outline-none text-xs font-semibold text-slate-750 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Tab Navigation Toggles at the top of the page */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b dark:border-slate-800 scrollbar-thin">
        {[
          { id: 'register', label: 'Daily Register', icon: ClipboardCheck },
          { id: 'history', label: 'Attendance History Logs', icon: Calendar },
          { id: 'leaves', label: 'Staff Leave Logs & Requests', icon: Briefcase },
          { id: 'stats', label: 'Attendance Statistics', icon: UserCheck2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                  : darkTheme
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Ratios Metrics Desk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="p-3 bg-green-50 text-green-600 dark:bg-green-950/20 rounded-xl animate-pulse">
            <UserCheck2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Marked Present Today</p>
            <p className="text-xl font-black mt-0.5">{presentCount} / {total}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          absentCount > 0 
            ? 'bg-red-50/50 border-red-100 dark:bg-red-950/20' 
            : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className={`p-3 rounded-xl ${absentCount > 0 ? 'bg-red-100 text-red-600 dark:bg-red-950/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            <UserX2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Marked Absent today</p>
            <p className={`text-xl font-black mt-0.5 ${absentCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{absentCount} Teachers</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/20 rounded-xl">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Presence Ratio</p>
            <p className="text-xl font-black mt-0.5">{presenceRatio}% Roster</p>
          </div>
        </div>

      </div>

      {/* Tab Switchboard content */}
      {isTabLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold animate-pulse">Syncing staff registration matrix...</p>
        </div>
      ) : (
        <div className="transition-all duration-350">
          
          {/* TAB 1: DAILY REGISTER FORM */}
          {activeTab === 'register' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800 leading-normal">
                  <h3 className="font-bold text-base">Roster Staff Attendance • {selectedDate}</h3>
                  
                  <button
                    onClick={handleMarkAllPresent}
                    type="button"
                    className="px-3 py-1.5 bg-slate-50 border hover:bg-slate-100 text-[11px] font-bold text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Set All to Present
                  </button>
                </div>

                <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1.5">
                  {state.teachers.map((teacher) => {
                    const currentStatus = statuses[teacher.id] || 'Present';
                    
                    // Count period workload today
                    const dayStr = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) as any;
                    const todayLessons = teacher.schedule[dayStr]?.filter(slot => slot !== null).length || 0;

                    return (
                      <div 
                        key={teacher.id} 
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          currentStatus === 'Absent'
                            ? 'bg-red-50/25 border-red-200'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{teacher.name}</p>
                            <p className="text-xs text-slate-400 font-medium leading-snug">
                              Dept: {teacher.subject} • Today's Classes: {todayLessons}
                            </p>
                          </div>
                        </div>

                        <div className="flex bg-slate-150 dark:bg-slate-800 p-1 rounded-xl shadow-xs self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(teacher.id, 'Present')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              currentStatus === 'Present'
                                ? 'bg-white text-green-700 shadow-xs'
                                : 'text-slate-400 hover:text-slate-750'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(teacher.id, 'Absent')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              currentStatus === 'Absent'
                                ? 'bg-red-650 text-white shadow-xs'
                                : 'text-slate-400 hover:text-slate-750'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t dark:border-slate-800">
                  <div>
                    {isSuccess && (
                      <div className="flex items-center shrink-0 gap-1.5 text-green-700 text-xs font-bold bg-green-50 p-2 rounded-lg animate-pulse border border-green-100">
                        <CheckCircle className="h-4 w-4" /> Registers saved and cached successfully!
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:bg-blue-700 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                    id="attendance-save-register-btn"
                  >
                    {isSaving ? 'Saving Register...' : 'Save & Sync Registry'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: HISTORICAL ATTENDANCE LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search historical records by educator name..."
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-700 bg-white"
                />
              </div>

              <div className={`border rounded-2xl overflow-hidden ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className={darkTheme ? 'bg-slate-950/40' : 'bg-slate-50/50'}>
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Teacher Name</th>
                        <th className="px-6 py-3.5">Department / Specialty</th>
                        <th className="px-6 py-3.5">Roster Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {state.attendance
                        .filter(record => {
                          const t = state.teachers.find(teacher => teacher.id === record.teacherId);
                          return t && t.name.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map((record, index) => {
                          const teacher = state.teachers.find(t => t.id === record.teacherId);
                          return (
                            <tr key={index} className="hover:bg-slate-50/20">
                              <td className="px-6 py-4 font-mono font-bold">{record.date}</td>
                              <td className="px-6 py-4 font-bold">{teacher?.name || 'Unknown Staff'}</td>
                              <td className="px-6 py-4 text-slate-400 font-medium">{teacher?.subject || 'N/A'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                                  record.status === 'Present' 
                                    ? 'bg-green-50 text-green-700 dark:bg-green-950/20' 
                                    : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAFF LEAVE LOGS & REQUESTS */}
          {activeTab === 'leaves' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-blue-600" /> Dynamic Staff Leave Applications & Approvals
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3.5">Teacher</th>
                      <th className="pb-3.5">Leave Reason</th>
                      <th className="pb-3.5">Duration</th>
                      <th className="pb-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold">
                    {state.leaveRequests && state.leaveRequests.length > 0 ? (
                      state.leaveRequests.map((leave: any) => (
                        <tr key={leave.id} className="hover:bg-slate-50/20">
                          <td className="py-4.5">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">{leave.teacherName}</span>
                          </td>
                          <td className="py-4.5">
                            <div className="font-bold">{leave.reason}</div>
                            <div className="text-[10px] text-slate-400">{leave.leaveType || 'General Leave'}</div>
                          </td>
                          <td className="py-4.5">
                            <div>{leave.startDate} to {leave.endDate}</div>
                            <div className="text-[10px] text-slate-400 font-mono">3 days total</div>
                          </td>
                          <td className="py-4.5 text-right">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-wider ${
                              leave.status === 'Approved'
                                ? 'bg-green-50 text-green-700 dark:bg-green-950/20'
                                : leave.status === 'Rejected' || leave.status === 'Denied'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/20'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                            }`}>
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400 font-semibold">
                          No leaves filed on this portal. Teachers can apply leaves from their account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE STATISTICS */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-sm mb-4">Department Presence Index</h4>
                <div className="space-y-4">
                  {[
                    { dept: 'Mathematics Dept.', rate: 100 },
                    { dept: 'Physics Dept.', rate: 95 },
                    { dept: 'Chemistry Dept.', rate: 100 },
                    { dept: 'Humanities & History Dept.', rate: 85 },
                    { dept: 'Biology Dept.', rate: 90 }
                  ].map((deptItem, idx) => (
                    <div key={idx} className="space-y-1.5 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{deptItem.dept}</span>
                        <span>{deptItem.rate}% Presence</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${deptItem.rate}%` }}
                          className={`h-full rounded-full ${deptItem.rate === 100 ? 'bg-emerald-500' : deptItem.rate >= 90 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-sm mb-4">Roster Health Standing</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Sustained presence rate above 94% across all departments is required for optimal syllabus compliance.
                </p>
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Regional Compliance Goal:</span>
                    <span className="font-bold text-blue-600">95.00%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Current Standing:</span>
                    <span className="font-bold text-emerald-600">{presenceRatio}.00%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Audit Appraisal:</span>
                    <span className="font-black text-emerald-600">Fully Compliant</span>
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
