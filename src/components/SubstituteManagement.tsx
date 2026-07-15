import { useState, useEffect } from 'react';
import { 
  UserCheck2, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Clock, 
  BookOpen, 
  GraduationCap, 
  CalendarRange, 
  ChevronRight,
  UserCheck,
  Check,
  MapPin,
  RefreshCw,
  Info,
  Lock,
  Unlock,
  Trash2,
  History,
  Sliders,
  ShieldAlert,
  Sparkles,
  CheckSquare,
  XSquare,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Teacher, ERPDataState, DayOfWeek, SubstituteAssignment } from '../types';
import { apiFetch } from '../lib/api';

interface SubstituteManagementProps {
  state: ERPDataState;
  selectedDate: string; // YYYY-MM-DD
  onAssignSubstitute: (payload: { date: string; periodIndex: number; absentTeacherId: string; substituteTeacherId: string; operator?: string }) => Promise<any>;
  onUpdateState?: (newState: ERPDataState) => void;
  darkTheme: boolean;
}

export default function SubstituteManagement({
  state,
  selectedDate,
  onAssignSubstitute,
  onUpdateState,
  darkTheme
}: SubstituteManagementProps) {
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'audit_logs'>('dashboard');

  // Calculate current weekday DayOfWeek
  const checkDate = new Date(selectedDate);
  const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  // Selected class for active coverage
  const [activeCoveragePeriod, setActiveCoveragePeriod] = useState<{
    teacherId: string;
    periodIndex: number;
    classSection: string;
    subject: string;
  } | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string | null>(null);
  
  // Controls states
  const [operatorName, setOperatorName] = useState('Administrator');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditFilterType, setAuditFilterType] = useState('all');

  // Staff search state
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  const timings = state.settings?.scheduleSlots && state.settings.scheduleSlots.length > 0
    ? state.settings.scheduleSlots.map(s => `${s.start} - ${s.end}`)
    : [
        '08:30 AM - 09:20 AM',
        '09:20 AM - 10:10 AM',
        '10:30 AM - 11:20 AM',
        '11:20 AM - 12:10 PM',
        '01:00 PM - 01:50 PM',
        '01:50 PM - 02:40 PM',
        '02:40 PM - 03:30 PM',
        '03:30 PM - 04:20 PM'
      ];

  // Retrieve absent or non-present educators marked on selectedDate (needing cover)
  const todaysAttendance = state.attendance.filter(att => att.date === selectedDate);
  const absentTeacherRecords = todaysAttendance.filter(att => att.status !== 'Present');

  // Fetch smart suggestions from backend
  const fetchSmartSuggestions = async (absentId: string, periodIdx: number) => {
    setIsLoadingSuggestions(true);
    setFormError(null);
    setSelectedSubstituteId(null);
    try {
      const resp = await apiFetch(`/api/substitutes/suggest?absentTeacherId=${absentId}&date=${selectedDate}&periodIndex=${periodIdx}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed suggestions lookup');
      
      setSuggestions(data.suggestions || []);
      
      // Auto-select the top recommendation if available
      if (data.suggestions && data.suggestions.length > 0) {
        setSelectedSubstituteId(data.suggestions[0].teacherId);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error executing suggestion query.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Select slot
  const handleSelectClassToSubstitute = (teacherId: string, pIndex: number, classSec: string, sub: string) => {
    setActiveCoveragePeriod({
      teacherId,
      periodIndex: pIndex,
      classSection: classSec,
      subject: sub
    });
    setSuggestions([]);
    fetchSmartSuggestions(teacherId, pIndex);
  };

  // Submit assign (Standard AI or Manual Select)
  const handleAssignConfirm = async () => {
    if (!activeCoveragePeriod || !selectedSubstituteId) {
      setFormError('Please select a substitute Educator from the suggestions list.');
      return;
    }

    try {
      setIsPerformingAction(true);
      setFormError(null);
      setFormSuccess(null);

      const response = await apiFetch('/api/substitutes/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          periodIndex: activeCoveragePeriod.periodIndex,
          absentTeacherId: activeCoveragePeriod.teacherId,
          substituteTeacherId: selectedSubstituteId,
          operator: operatorName
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to complete assignment.');

      if (onUpdateState) {
        onUpdateState(data.state);
      }

      setFormSuccess('Substitute assigned and timetable updated in real-time!');
      setTimeout(() => {
        setActiveCoveragePeriod(null);
        setSuggestions([]);
        setFormSuccess(null);
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || 'Failed to register assignment.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  // Toggle Lock
  const handleToggleLock = async (assignmentId: string) => {
    try {
      setIsPerformingAction(true);
      const resp = await apiFetch('/api/substitutes/toggle-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, operator: operatorName })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to lock assignment.');
      
      if (onUpdateState) {
        onUpdateState(data.state);
      }
      setFormSuccess('Lock status updated.');
      setTimeout(() => setFormSuccess(null), 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to lock.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  // Toggle Block status
  const handleToggleBlock = async (teacherId: string) => {
    try {
      const resp = await apiFetch('/api/substitutes/toggle-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to toggle block.');
      
      if (onUpdateState) {
        onUpdateState(data.state);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle block status.');
    }
  };

  // Reject Assignment
  const handleRejectAssignment = async () => {
    if (!activeCoveragePeriod) return;
    if (!confirm('Are you sure you want to reject this substitution coverage? This will vacate the slot.')) return;

    try {
      setIsPerformingAction(true);
      setFormError(null);
      const resp = await apiFetch('/api/substitutes/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          periodIndex: activeCoveragePeriod.periodIndex,
          absentTeacherId: activeCoveragePeriod.teacherId,
          operator: operatorName
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to reject assignment.');
      
      if (onUpdateState) {
        onUpdateState(data.state);
      }
      setFormSuccess('Substitute assignment rejected and slot vacated.');
      setTimeout(() => {
        setActiveCoveragePeriod(null);
        setSuggestions([]);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to reject.');
    } finally {
      setIsPerformingAction(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoadingAuditLogs(true);
    try {
      const resp = await apiFetch('/api/substitutes/audit-logs');
      const data = await resp.json();
      setAuditLogs(data.auditLogs || []);
    } catch (err) {
      console.error('Failed fetching audit logs:', err);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  // Load audit logs on tab change
  useEffect(() => {
    if (activeTab === 'audit_logs') {
      fetchAuditLogs();
    }
  }, [activeTab, state.substituteAssignments]);

  // Find active substitute assignment for currently selected coverage slot
  const currentAssignment = activeCoveragePeriod ? state.substituteAssignments.find(
    sub => sub.date === selectedDate && 
           sub.periodIndex === activeCoveragePeriod.periodIndex && 
           sub.absentTeacherId === activeCoveragePeriod.teacherId
  ) : null;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dynamic Tab Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b dark:border-slate-850">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#F59E0B] animate-pulse" />
            AI Substitute Assignment Engine
          </h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Automated coverage scheduler running continuous workload fairness & preference scoring.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-800 text-[#F59E0B] dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Coverage Dashboard
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-white dark:bg-slate-800 text-[#F59E0B] dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Staff Controls
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit_logs'
                ? 'bg-white dark:bg-slate-800 text-[#F59E0B] dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            AI Audit Logs
          </button>
        </div>
      </div>

      {/* ----------------- TAB 1: COVERAGE DASHBOARD ----------------- */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Active Coverages List */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-red-500 rounded-full"></span>
                  Educators Needing Replacement Cover • {selectedDate}
                </h3>
                <span className="text-xs px-2.5 py-1 font-bold rounded-lg bg-[#FFF8F1] dark:bg-amber-955/40 text-[#F59E0B] dark:text-amber-400 border border-[#FED7AA]/30">
                  {dayName}
                </span>
              </div>

              {/* Operator details configuration */}
              <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl flex items-center gap-3 border dark:border-slate-800">
                <label className="text-xs font-bold text-slate-400 shrink-0">Operator Name:</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-100 focus:ring-1 focus:ring-[#F59E0B] outline-none w-48 font-semibold"
                />
              </div>

              {absentTeacherRecords.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                  <CheckCircle className="h-12 w-12 text-emerald-500 animate-bounce" />
                  <div>
                    <p className="font-bold text-slate-755 text-base">Perfect Staff Attendance Today!</p>
                    <p className="text-xs text-slate-400 mt-1">No teachers are marked Absent, On Leave, or Half Day. Replacement schedules are fully clear.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {absentTeacherRecords.map((attRec) => {
                    const absentTeacher = state.teachers.find(t => t.id === attRec.teacherId);
                    if (!absentTeacher) return null;

                    // Find active schedule periods today
                    const dailyLessons = absentTeacher.schedule[dayName] || [];                    // Status Badge Coloring
                    const statusColor = 
                      attRec.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20' :
                      attRec.status === 'On Leave' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/20' :
                      attRec.status === 'Half Day' ? 'bg-[#FFF8F1] text-amber-700 border-[#FED7AA]/40 dark:bg-amber-955/20' :
                      'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20';

                    return (
                      <div key={attRec.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3.5">
                        <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800 leading-normal">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{absentTeacher.name}</h4>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">{absentTeacher.subject} Advisor • {absentTeacher.department || 'General'} Dept</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 border font-bold rounded-full ${statusColor}`}>
                            {attRec.status}
                          </span>
                        </div>

                        {/* Display each of his periods needing cover */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {dailyLessons.map((slot, pIdx) => {
                            if (!slot) return null; // free index, doesn't need cover
                            
                            // Check if substitute class is already scheduled in database
                            const matchedAssignment = state.substituteAssignments.find(
                              sub => sub.date === selectedDate && 
                                     sub.periodIndex === pIdx && 
                                     sub.absentTeacherId === absentTeacher.id
                            );
                            
                            const isActiveSelected = activeCoveragePeriod?.teacherId === absentTeacher.id && 
                                                      activeCoveragePeriod?.periodIndex === pIdx;

                            return (
                              <div 
                                key={pIdx} 
                                onClick={() => {
                                  handleSelectClassToSubstitute(absentTeacher.id, pIdx, slot.classSection, slot.subject);
                                }}
                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
                                  matchedAssignment 
                                    ? matchedAssignment.isLocked
                                      ? 'bg-[#FFF8F1]/20 border-[#FED7AA] dark:border-amber-900'
                                      : 'bg-emerald-50/15 border-emerald-200 dark:border-emerald-900'
                                    : isActiveSelected
                                      ? 'bg-orange-50/25 border-[#F59E0B] ring-1 ring-[#F59E0B]'
                                      : 'bg-slate-50/50 hover:border-[#FED7AA] dark:bg-slate-950/20'
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                                    <span>Period {pIdx + 1} ({(timings[pIdx] || '00:00 AM - 00:00 AM').split('-')[0].trim()})</span>
                                    {matchedAssignment ? (
                                      matchedAssignment.isLocked ? (
                                        <span className="text-[#F59E0B] dark:text-amber-400 font-bold flex items-center gap-0.5 uppercase tracking-wide">
                                          <Lock className="h-2.5 w-2.5" /> SECURED
                                        </span>
                                      ) : (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 uppercase tracking-wide">
                                          <Check className="h-3 w-3" /> Assigned
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-red-500 font-bold uppercase tracking-wide animate-pulse">Needs Cover</span>
                                    )}
                                  </div>
                                  <h5 className="font-bold text-xs mt-1.5 truncate">{slot.classSection} • {slot.subject}</h5>
                                </div>

                                {matchedAssignment ? (
                                  <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate max-w-[140px]">
                                      Sub: {matchedAssignment.substituteTeacherName}
                                    </p>
                                    <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                                      {matchedAssignment.aiConfidence}% AI
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-[#F59E0B] font-bold flex items-center gap-0.5 mt-auto">
                                    Run AI suggestions check <ChevronRight className="h-3 w-3" />
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Recommendation Engine & Assignment Panel */}
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              
              {activeCoveragePeriod ? (
                <div className="space-y-4">
                  
                  {/* Selected target info */}
                  <div className="p-3.5 bg-[#FFF8F1]/40 dark:bg-slate-950/20 border border-[#FED7AA]/40 dark:border-slate-800 rounded-xl text-xs">
                    <p className="font-bold text-[#F59E0B] dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Target Coverage Slot:
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
                      <p><span className="font-semibold text-slate-400">Class:</span> {activeCoveragePeriod.classSection}</p>
                      <p><span className="font-semibold text-slate-400">Subject:</span> {activeCoveragePeriod.subject}</p>
                      <p className="col-span-2"><span className="font-semibold text-slate-400">Period:</span> Period {activeCoveragePeriod.periodIndex + 1} ({timings[activeCoveragePeriod.periodIndex]})</p>
                    </div>
                  </div>

                  {/* CASE A: COVERAGE IS ALREADY ASSIGNED -> SHOW AI DECISION PANEL */}
                  {currentAssignment ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Decision Breakdown</p>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                          Status: Active Cover
                        </span>
                      </div>

                      {/* circular circular gauge / progress confidence metrics */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-850/50 border dark:border-slate-800 rounded-xl flex items-center gap-4">
                        <div className="relative flex items-center justify-center shrink-0">
                          {/* Circle visualization */}
                          <svg className="w-14 h-14 transform -rotate-90">
                            <circle cx="28" cy="28" r="24" strokeWidth="4" stroke="currentColor" className="text-slate-200 dark:text-slate-800" fill="transparent" />
                            <circle cx="28" cy="28" r="24" strokeWidth="4" stroke="currentColor" className="text-emerald-500" fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 24}`}
                              strokeDashoffset={`${2 * Math.PI * 24 * (1 - (currentAssignment.aiConfidence || 90) / 100)}`}
                            />
                          </svg>
                          <span className="absolute text-xs font-black text-slate-800 dark:text-slate-100">{currentAssignment.aiConfidence || 90}%</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{currentAssignment.substituteTeacherName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Assigned Substitute Educator</p>
                        </div>
                      </div>

                      {/* AI Priority selection explanation */}
                      <div className="p-3 bg-[#FFF8F1]/40 dark:bg-slate-955/10 border border-[#FED7AA]/40 dark:border-slate-950 rounded-xl leading-relaxed">
                        <p className="text-[10px] font-bold text-[#F59E0B] flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5" /> AI Engine Selection Reason:
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 font-medium leading-normal">
                          {currentAssignment.aiSelectionReason || "Selected automatically based on fair workload balance and departmental subject compatibility."}
                        </p>
                      </div>

                      {/* Decision breakdown detailed checklist */}
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Scoring Criteria Audit:</p>
                        
                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/30">
                            <span className="flex items-center gap-1.5">
                              {currentAssignment.decisionBreakdown?.extraClassFulfilled ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <X className="h-4 w-4 text-slate-300" />
                              )}
                              Priority 1: Extra Class Request matched
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {currentAssignment.decisionBreakdown?.extraClassFulfilled ? 'Match (+200)' : 'No Request'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/30">
                            <span className="flex items-center gap-1.5">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Priority 2 & 3: Daily Workload Protect
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {currentAssignment.decisionBreakdown?.dailyWorkload || 'Safe Load'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/30">
                            <span className="flex items-center gap-1.5">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Priority 4: Weekly Total Workload
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {currentAssignment.decisionBreakdown?.weeklyWorkload || 'Safe Load'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/30">
                            <span className="flex items-center gap-1.5">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Priority 5: Contiguous Free Slots
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {currentAssignment.decisionBreakdown?.contiguousFreeSlots || 1} slot(s)
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/30">
                            <span className="flex items-center gap-1.5">
                              {currentAssignment.decisionBreakdown?.sameDepartment ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <X className="h-4 w-4 text-slate-300" />
                              )}
                              Priority 6: Subject/Dept Match
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {currentAssignment.decisionBreakdown?.sameDepartment ? 'Boost (+30)' : 'General'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lock, Unlock, Reject, Re-assign Manual Override Actions */}
                      <div className="pt-4 border-t dark:border-slate-800 space-y-3">
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Toggle Lock */}
                          <button
                            type="button"
                            disabled={isPerformingAction}
                            onClick={() => handleToggleLock(currentAssignment.id)}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              currentAssignment.isLocked
                                ? 'bg-[#FFF8F1] border-[#FED7AA] text-[#F59E0B] hover:bg-orange-100/40 dark:bg-amber-955/20 dark:border-amber-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800'
                            }`}
                          >
                            {currentAssignment.isLocked ? (
                              <>
                                <Unlock className="h-3.5 w-3.5 text-[#F59E0B]" />
                                Unlock AI Cover
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5 text-slate-400" />
                                Secure/Lock AI Cover
                              </>
                            )}
                          </button>

                          {/* Reject Coverage / De-assign */}
                          <button
                            type="button"
                            disabled={isPerformingAction || currentAssignment.isLocked}
                            onClick={handleRejectAssignment}
                            className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              currentAssignment.isLocked
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-850 dark:border-slate-800'
                                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900'
                            }`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Reject/De-Assign
                          </button>
                        </div>

                        {/* Manual override / re-assign to another teacher dropdown */}
                        {!currentAssignment.isLocked && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-2 border dark:border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Manual Administrator Override</p>
                            <div className="flex gap-2">
                              <select
                                value={selectedSubstituteId || ''}
                                onChange={(e) => setSelectedSubstituteId(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg outline-none cursor-pointer"
                              >
                                <option value="">-- Choose Educator --</option>
                                {suggestions.map(t => (
                                  <option key={t.teacherId} value={t.teacherId}>
                                    {t.name} ({t.subject})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={!selectedSubstituteId || isPerformingAction}
                                onClick={handleAssignConfirm}
                                className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-white text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0"
                              >
                                Re-Assign
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    /* CASE B: COVERAGE NOT ASSIGNED YET -> SMART SUGGESTION CALCULATIONS LIST */
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Cover Engine Suggestions</p>
                        <span className="text-[10px] font-bold text-amber-600 animate-pulse bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                          AI Auto-Calculating...
                        </span>
                      </div>

                      {isLoadingSuggestions ? (
                        <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                          <RefreshCw className="h-7 w-7 animate-spin text-[#F59E0B]" />
                          <p className="font-semibold">Searching multi-tier priority matrices...</p>
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="py-10 text-center text-rose-600 text-xs bg-rose-50/50 dark:bg-rose-950/15 border dark:border-rose-950 rounded-xl leading-snug">
                          <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-rose-500 animate-pulse" />
                          <p className="font-bold">No substitution coverage candidates found free!</p>
                          <p className="text-[10px] text-slate-400 mt-1">All qualified educators are already busy teaching during Period {activeCoveragePeriod.periodIndex + 1}.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Candidate Priorities:</p>
                          
                          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                            {suggestions.map((item, index) => {
                              const isSel = selectedSubstituteId === item.teacherId;
                              return (
                                <div
                                  key={item.teacherId}
                                  onClick={() => setSelectedSubstituteId(item.teacherId)}
                                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                                    isSel
                                      ? 'bg-[#F59E0B] border-[#F59E0B] text-white shadow-md'
                                      : 'bg-slate-50 dark:bg-slate-850 hover:border-[#FED7AA]'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-xs flex items-center gap-1">
                                        {index === 0 && <Sparkles className={`h-3 w-3 ${isSel ? 'text-white' : 'text-yellow-500'}`} />}
                                        {item.name}
                                      </p>
                                      <p className={`text-[10px] mt-0.5 font-medium ${isSel ? 'text-orange-100' : 'text-slate-400'}`}>
                                        {item.subject} advisor
                                      </p>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                      isSel 
                                        ? 'bg-white/20 text-white' 
                                        : item.confidence >= 85 
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' 
                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30'
                                    }`}>
                                      {item.confidence}% Match
                                    </span>
                                  </div>

                                  {/* AI Score Booster indicators */}
                                  <div className="space-y-1">
                                    {item.reasons.slice(0, 2).map((reason: string, rIdx: number) => (
                                      <p key={rIdx} className={`text-[9px] flex items-center gap-1 font-bold ${
                                        isSel ? 'text-orange-50' : 'text-slate-655 dark:text-slate-300'
                                      }`}>
                                        <Check className="h-2.5 w-2.5 shrink-0" /> {reason}
                                      </p>
                                    ))}
                                  </div>

                                  {/* Metrics parameters */}
                                  <div className="flex gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                                    <span className={`text-[8.5px] px-1 py-0.5 rounded font-black uppercase tracking-wider ${
                                      isSel ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                    }`}>
                                      Sub Count: {item.historicalSubstitutions}
                                    </span>
                                    <span className={`text-[8.5px] px-1 py-0.5 rounded font-black uppercase tracking-wider ${
                                      isSel ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                    }`}>
                                      Load Today: {item.busyCountToday}
                                    </span>
                                    {item.breakdown.sameDepartment && (
                                      <span className={`text-[8.5px] px-1 py-0.5 rounded font-black uppercase tracking-wider ${
                                        isSel ? 'bg-white/20 text-white' : 'bg-green-100 text-green-800 dark:bg-green-950/20'
                                      }`}>
                                        Dept Match
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Submit actions */}
                          <div className="pt-3 border-t dark:border-slate-800 space-y-2">
                            {formError && (
                              <p className="text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/20 border border-red-150 p-2.5 text-center rounded-lg">
                                {formError}
                              </p>
                            )}
                            
                            {formSuccess && (
                              <p className="text-xs text-green-700 font-bold bg-green-50 border border-green-150 p-2.5 text-center rounded-lg">
                                {formSuccess}
                              </p>
                            )}

                            <button
                              onClick={handleAssignConfirm}
                              disabled={isPerformingAction || !selectedSubstituteId}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <UserCheck className="h-4 w-4" /> Save & Finalize Cover
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Info className="h-8 w-8 text-slate-350" />
                  <p className="font-bold text-slate-750">No active coverage slot selected</p>
                  <p className="text-[10px] text-slate-400">Click on any of the active class sections needing cover on the left dashboard to calculate recommendations.</p>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ----------------- TAB 2: STAFF SUBSTITUTION CONTROLS ----------------- */}
      {activeTab === 'staff' && (
        <div className={`p-6 rounded-2xl border ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#F59E0B] rounded-full"></span>
                Staff Substitution Status & Blocklist Control
              </h3>
              <p className="text-xs text-slate-400 mt-1">Prevent certain educators from being recommended or automatically assigned for substitutions.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search faculty name..."
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800 outline-none focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          {/* Teacher Substitution Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4">Educator Name</th>
                  <th className="py-3 px-4">Subject Specialty</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Historical Covers Taken</th>
                  <th className="py-3 px-4 text-center">Substitution Mode</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.teachers
                  .filter(t => t.name.toLowerCase().includes(staffSearchQuery.toLowerCase()))
                  .map(teacher => {
                    const substitutionsCount = state.substituteAssignments.filter(
                      sub => sub.substituteTeacherId === teacher.id
                    ).length;

                    const isBlocked = teacher.blockedFromSubstitutions || false;

                    return (
                      <tr key={teacher.id} className="border-b dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{teacher.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">{teacher.subject}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{teacher.department || 'General'}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono">{substitutionsCount} coverage(s)</td>
                        <td className="py-3 px-4 text-center">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/20">
                              <XSquare className="h-3 w-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950/20">
                              <CheckSquare className="h-3 w-3" /> Eligible (Auto)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(teacher.id)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border ${
                              isBlocked
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/10 dark:border-green-900'
                                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950/10 dark:border-red-900'
                            }`}
                          >
                            {isBlocked ? 'Unlock Recommendations' : 'Block Substitutions'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: AI ENGINE AUDIT LOGS ----------------- */}
      {activeTab === 'audit_logs' && (
        <div className={`p-6 rounded-2xl border ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                AI Substitute Engine Audit Logs
              </h3>
              <p className="text-xs text-slate-400 mt-1">Full historical log of automatic assignments, manual overrides, secure locks, and administrator adjustments.</p>
            </div>

            {/* Sync Refresh Button */}
            <button
              onClick={fetchAuditLogs}
              disabled={isLoadingAuditLogs}
              className="px-3.5 py-1.5 border dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAuditLogs ? 'animate-spin' : ''}`} />
              Sync Logs
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {/* Search filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by teacher name..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800 outline-none focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>

            {/* Action Type Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <select
                value={auditFilterType}
                onChange={(e) => setAuditFilterType(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Action Types</option>
                <option value="Auto Assigned">Auto Assigned (AI)</option>
                <option value="Manual Override">Manual Override</option>
                <option value="Locked">Secured / Locked</option>
                <option value="Unlocked">Unlocked</option>
                <option value="Rejected">Rejected / Vacated</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          {isLoadingAuditLogs ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-[#F59E0B]" />
              <p className="font-bold">Retrieving chronological logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2 border border-dashed rounded-xl dark:border-slate-800">
              <History className="h-8 w-8 text-slate-350" />
              <p className="font-bold">No substitution logs recorded yet</p>
              <p className="text-[10px] mt-0.5">Logs will automatically populate when substitutions are scheduled or adjusted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Class Slot</th>
                    <th className="py-3 px-4">Absent Teacher</th>
                    <th className="py-3 px-4">Assigned substitute</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Log Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter(log => {
                      // Match search query against absent teacher or assigned teacher name
                      const nameMatch = 
                        log.absentTeacherName.toLowerCase().includes(auditSearchQuery.toLowerCase()) || 
                        log.assignedTeacherName.toLowerCase().includes(auditSearchQuery.toLowerCase());
                      
                      // Match action type
                      const typeMatch = auditFilterType === 'all' || log.actionType === auditFilterType;

                      return nameMatch && typeMatch;
                    })
                    .map(log => {
                      const actionBadgeColor = 
                        log.actionType === 'Auto Assigned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                        log.actionType === 'Manual Override' ? 'bg-[#FFF8F1] text-amber-700 dark:bg-amber-955/20' :
                        log.actionType === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                        'bg-orange-50 text-[#F59E0B] dark:bg-amber-955/20';

                      return (
                        <tr key={log.id} className="border-b dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-black uppercase tracking-wider text-[9px] ${actionBadgeColor}`}>
                              {log.actionType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {log.classSection} (Period {log.periodIndex + 1})
                          </td>
                          <td className="py-3 px-4 text-slate-655 font-medium">{log.absentTeacherName}</td>
                          <td className="py-3 px-4 text-slate-655 font-bold">{log.assignedTeacherName}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 font-bold">{log.operator}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium max-w-[220px] truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
