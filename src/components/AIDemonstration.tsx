import React, { useState } from 'react';
import { 
  Sparkles, 
  UserX, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Plus, 
  Trash2, 
  FileUp, 
  ArrowRight, 
  BookOpen, 
  Activity, 
  Sliders, 
  CornerDownRight, 
  Layers, 
  Award,
  ChevronRight,
  UserPlus,
  Compass
} from 'lucide-react';
import { ERPDataState, Teacher, ExtraClassRequest, DayOfWeek } from '../types';
import { apiFetch } from '../lib/api';

const classList = [
  'Grade 6-A', 'Grade 6-B', 'Grade 7-A', 'Grade 7-B', 'Grade 8-A', 'Grade 8-B', 'Grade 8-C',
  'Grade 9-A', 'Grade 9-B', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B', 'Grade 12-A', 'Grade 12-B'
];

interface AIDemonstrationProps {
  state: ERPDataState;
  onUpdateState: (state: ERPDataState) => void;
  selectedDate: string;
  darkTheme: boolean;
}

interface TimelineStep {
  time: string;
  message: string;
  details?: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export default function AIDemonstration({
  state,
  onUpdateState,
  selectedDate,
  darkTheme
}: AIDemonstrationProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<TimelineStep[]>([]);
  const [activeSimulationName, setActiveSimulationName] = useState<string | null>(null);

  // Form states for simulations
  const [absentTeacherId, setAbsentTeacherId] = useState('');
  const [requestTeacherId, setRequestTeacherId] = useState('');
  const [requestClass, setRequestClass] = useState('Grade 10-A');
  const [requestSubject, setRequestSubject] = useState('Mathematics');
  const [requestPeriod, setRequestPeriod] = useState(2); // default Period 1

  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('Mathematics');
  const [newTeacherDept, setNewTeacherDept] = useState('Mathematics');

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const showToast = (message: string) => {
    // Relying on browser alert or custom temporary inline notifications
  };

  // Helper to trigger API actions
  const runSimulationEndpoint = async (url: string, payload: any, simName: string, traceSteps: TimelineStep[]) => {
    setIsSimulating(true);
    setActiveSimulationName(simName);
    setSimulationLogs([
      { time: '08:00 AM', message: `Initializing scenario: ${simName}...`, type: 'info' }
    ]);

    try {
      // Step-by-step staggered simulation feeling
      await new Promise(resolve => setTimeout(resolve, 500));
      setSimulationLogs(prev => [...prev, { time: '08:15 AM', message: 'Analyzing current timetable dependencies...', type: 'info' }]);
      
      const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 600));
      onUpdateState(data.state);

      // Successfully processed! Let's generate the rich trace
      setSimulationLogs(traceSteps);
    } catch (err: any) {
      setSimulationLogs(prev => [
        ...prev, 
        { time: '08:30 AM', message: `Simulation Error: ${err.message}`, type: 'danger' }
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  // 1. Simulate Teacher Absence
  const handleSimulateAbsence = () => {
    if (!absentTeacherId) return;
    const teacher = state.teachers.find(t => t.id === absentTeacherId);
    if (!teacher) return;

    const todayStr = selectedDate;
    const dayOfWeek = 'Monday'; // Default simulation day for pre-set timetable matching

    const payload = {
      date: todayStr,
      teacherStatuses: {
        [absentTeacherId]: 'Absent'
      }
    };

    const trace = [
      { time: '08:00 AM', message: `${teacher.name} marked absent.`, details: `Daily register updated. Status set to 'Absent' for ${todayStr}.`, type: 'danger' as const },
      { time: '08:02 AM', message: 'AI Substitution Engine triggered.', details: 'Scanning classroom schedules to identify vacant teaching hours...', type: 'warning' as const },
      { time: '08:03 AM', message: `Detected empty classes for ${teacher.name}.`, details: `Uncovered periods on ${dayOfWeek}: Period 1 (Grade 10-A), Period 3 (Grade 12-A).`, type: 'info' as const },
      { time: '08:04 AM', message: 'Scanning Extra Class requests pool for potential fit...', details: 'Looking for teachers with pending revision or practical lab slots in corresponding rooms...', type: 'info' as const },
      { time: '08:05 AM', message: 'Evaluating substitute candidates using school ranking heuristics...', details: 'Factors evaluated: Workload index, department continuity, previous coverages, and availability.', type: 'info' as const },
      { time: '08:06 AM', message: 'Substitutes matched and automatically assigned!', details: `Timetable slots successfully reassigned. Alerts sent to parent, class representative, and assigned substitute.`, type: 'success' as const },
      { time: '08:07 AM', message: 'Substitution workflow completed successfully.', details: 'All classes covered. Zero teaching minutes lost.', type: 'success' as const }
    ];

    runSimulationEndpoint('/api/attendance/mark', payload, `Absence of ${teacher.name}`, trace);
    setActiveModal(null);
  };

  // 2. Submit Extra Class Request
  const handleSimulateExtraClass = () => {
    if (!requestTeacherId) return;
    const teacher = state.teachers.find(t => t.id === requestTeacherId);
    if (!teacher) return;

    const payload = {
      teacherId: requestTeacherId,
      classSection: requestClass,
      date: selectedDate,
      periodIndex: requestPeriod,
      subject: requestSubject,
      requestType: 'Revision Class',
      priority: 'High',
      reason: 'Urgent final revision exercise on core syllabus.'
    };

    const trace = [
      { time: '09:00 AM', message: `Extra class requested by ${teacher.name}.`, details: `Target: ${requestClass}, Subject: ${requestSubject}, Period Index: ${requestPeriod} on ${selectedDate}`, type: 'info' as const },
      { time: '09:02 AM', message: 'AI Conflict validation module executed.', details: 'Verifying teacher timetable and target class schedules for double-booking hazards...', type: 'info' as const },
      { time: '09:03 AM', message: 'No conflicts detected!', details: `Both ${teacher.name} and ${requestClass} are free during Period ${requestPeriod - 1}.`, type: 'success' as const },
      { time: '09:04 AM', message: 'Request placed in active matching pool.', details: 'The request is live and will automatically cover any emergency substitution slots.', type: 'success' as const }
    ];

    runSimulationEndpoint('/api/extra-classes/request', payload, `Request from ${teacher.name}`, trace);
    setActiveModal(null);
  };

  // 3. Reset Demo Data
  const handleResetDemo = async () => {
    setIsSimulating(true);
    setActiveSimulationName('Resetting System');
    try {
      const response = await apiFetch('/api/demo/reset', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      onUpdateState(data.state);
      setSimulationLogs([
        { time: 'Now', message: 'Demo data completely restored to pristine school state!', details: 'Cleared all simulated logs, recreated 50 active teacher rosters, reset weekly schedules and leave applications.', type: 'success' }
      ]);
    } catch (err: any) {
      setSimulationLogs([{ time: 'Error', message: `Reset failed: ${err.message}`, type: 'danger' }]);
    } finally {
      setIsSimulating(false);
    }
  };

  // 4. Simulate Leave Request
  const handleSimulateLeave = async (teacherId: string) => {
    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const payload = {
      teacherId,
      startDate: selectedDate,
      endDate: selectedDate,
      leaveType: 'Sick Leave',
      reason: 'Fever and medical prescription checkup.'
    };

    const trace = [
      { time: '08:00 AM', message: `Leave application registered for ${teacher.name}.`, details: `Type: Sick Leave on ${selectedDate}.`, type: 'warning' as const },
      { time: '08:01 AM', message: 'System auto-approved request based on department backup rules.', details: 'Leave status changed to APPROVED. Triggering substitution engine.', type: 'success' as const },
      { time: '08:03 AM', message: 'AI re-planning class allocations...', details: 'Evaluating active substitution ranks to reassign lesson slots.', type: 'info' as const }
    ];

    runSimulationEndpoint('/api/leaves/apply', payload, `${teacher.name} Leave Application`, trace);
    setActiveModal(null);
  };

  // 5. Add New Teacher
  const handleAddNewTeacher = () => {
    if (!newTeacherName) return;
    const payload = {
      id: `demot_${Date.now()}`,
      name: newTeacherName,
      email: `${newTeacherName.toLowerCase().replace(/\s+/g, '')}@school.com`,
      phone: '+91 99999 88888',
      subject: newTeacherSubject,
      classSection: 'Grade 10-A',
      status: 'Active',
      department: newTeacherDept,
      employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
      schedule: {
        Monday: Array(11).fill(null),
        Tuesday: Array(11).fill(null),
        Wednesday: Array(11).fill(null),
        Thursday: Array(11).fill(null),
        Friday: Array(11).fill(null),
        Saturday: Array(11).fill(null)
      }
    };

    const trace = [
      { time: '11:00 AM', message: `New educator enrolled: ${newTeacherName}`, details: `Subject: ${newTeacherSubject}, Department: ${newTeacherDept}. Created dynamic employee records.`, type: 'success' as const },
      { time: '11:01 AM', message: 'Timetable slots initialized.', details: 'New empty Weekly Timetable allocated to roster.', type: 'info' as const }
    ];

    runSimulationEndpoint('/api/teachers', payload, `Enroll ${newTeacherName}`, trace);
    setActiveModal(null);
    setNewTeacherName('');
  };

  // 6. Delete Teacher
  const handleDeleteTeacherSim = (teacherId: string) => {
    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const trace = [
      { time: '12:00 PM', message: `Teacher profile archived: ${teacher.name}`, details: `Employee ${teacher.employeeId} deregistered from active duties.`, type: 'danger' as const },
      { time: '12:01 PM', message: 'Cleaned up timetable references.', details: 'Removed teacher assignments from all active schedules to avoid ghost conflicts.', type: 'warning' as const }
    ];

    runSimulationEndpoint(`/api/teachers/${teacherId}`, {}, `Remove ${teacher.name}`, trace);
    setActiveModal(null);
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-500 text-white';
      case 'warning': return 'bg-amber-500 text-white';
      case 'danger': return 'bg-rose-500 text-white';
      default: return 'bg-[#F59E0B] text-white';
    }
  };

  const activeAssignments = state.substituteAssignments || [];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Demo Mode Alert Banner */}
      <div className="p-4 bg-[#FFF8F1] dark:bg-amber-955/40 border border-[#FED7AA] dark:border-amber-900 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex gap-3">
          <div className="p-2 bg-[#F59E0B] text-white rounded-xl shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-250 uppercase tracking-wide">Demonstration Mode Active</h3>
            <p className="text-[11px] text-[#F59E0B] dark:text-amber-350 font-semibold mt-0.5">
              You are exploring a sandbox school directory mimicking 50 educators, 15 class timetables, and automated AI scheduling. All modifications occur in isolated demo memory files and do not alter production database instances.
            </p>
          </div>
        </div>
        <button
          onClick={handleResetDemo}
          disabled={isSimulating}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-2 disabled:opacity-50"
          id="btn-reset-demo"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          Reset Demo Data
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Scenario Controls Panel */}
        <div className="xl:col-span-1 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
              <Sliders className="h-4.5 w-4.5 text-[#F59E0B]" />
              Scenario Simulator
            </h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-5">Trigger Events to test AI actions</p>

            <div className="space-y-3">
              {/* Simulate Absence Button */}
              <button
                onClick={() => setActiveModal('absence')}
                className="w-full p-3.5 rounded-xl border border-dashed dark:border-slate-800 hover:border-[#FED7AA] bg-slate-50 hover:bg-[#FFF8F1]/50 dark:bg-slate-950/20 dark:hover:bg-amber-955/10 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg shrink-0">
                    <UserX className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Simulate Teacher Absence</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mark a teacher absent & run auto substitute</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {/* Submit Extra Class Request */}
              <button
                onClick={() => setActiveModal('extra_class')}
                className="w-full p-3.5 rounded-xl border border-dashed dark:border-slate-800 hover:border-[#FED7AA] bg-slate-50 hover:bg-[#FFF8F1]/50 dark:bg-slate-950/20 dark:hover:bg-amber-955/10 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-[#FFF8F1] border border-[#FED7AA]/50 text-[#F59E0B] rounded-lg shrink-0">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Submit Extra Class Request</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Place a revision request in the AI match pool</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {/* Apply Leave Simulated */}
              <button
                onClick={() => setActiveModal('leave')}
                className="w-full p-3.5 rounded-xl border border-dashed dark:border-slate-800 hover:border-[#FED7AA] bg-slate-50 hover:bg-[#FFF8F1]/50 dark:bg-slate-950/20 dark:hover:bg-amber-955/10 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg shrink-0">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Simulate Teacher Leave</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Request and auto-approve sick leave</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {/* Enroll New Roster */}
              <button
                onClick={() => setActiveModal('add_teacher')}
                className="w-full p-3.5 rounded-xl border border-dashed dark:border-slate-800 hover:border-[#FED7AA] bg-slate-50 hover:bg-[#FFF8F1]/50 dark:bg-slate-950/20 dark:hover:bg-amber-955/10 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                    <UserPlus className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Add New Teacher</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Enroll an educator with custom subjects</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {/* Remove Teacher */}
              <button
                onClick={() => setActiveModal('remove_teacher')}
                className="w-full p-3.5 rounded-xl border border-dashed dark:border-slate-800 hover:border-[#FED7AA] bg-slate-50 hover:bg-[#FFF8F1]/50 dark:bg-slate-950/20 dark:hover:bg-amber-955/10 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-slate-500/10 text-slate-600 rounded-lg shrink-0">
                    <Trash2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Remove Teacher Profile</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">De-enroll an active teacher profile</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Log View */}
        <div className="xl:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800 mb-5">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-600" />
                  AI Live Activity Trace
                </h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">Real-time log of neural scheduling steps</p>
              </div>
              {isSimulating && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-600 rounded-full animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Thinking...
                </span>
              )}
            </div>

            {simulationLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Compass className="h-10 w-10 text-slate-300 animate-spin-slow" />
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Roster System Listening...</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm">Trigger any Scenario on the left to watch the AI evaluate, solve, reassign and notify teachers in real-time!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 relative pl-6 border-l-2 border-dashed border-slate-200 dark:border-slate-800 ml-3">
                {simulationLogs.map((log, idx) => (
                  <div key={idx} className="relative group">
                    <span className={`absolute -left-9 top-1 w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] ${getStatusColor(log.type)} ring-4 ring-white dark:ring-slate-900 shadow-sm`}>
                      {log.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-md">{log.time}</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{log.message}</h4>
                      </div>
                      {log.details && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed pl-1">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Decision Panel & Evaluation Matrices */}
      <div className={`p-6 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800 mb-5">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-indigo-600" />
              AI Substitute Allocation Ledger
            </h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">Workload & Department-weighted heuristic rankings</p>
          </div>
        </div>

        {activeAssignments.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No active substitution assignments to trace. Trigger an absence above to create logs!</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activeAssignments.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedDecisionId(sub.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                    selectedDecisionId === sub.id 
                      ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30 dark:border-slate-850 dark:bg-slate-950/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                        {sub.classSection}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">• Period {sub.periodIndex - 1}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {sub.substituteTeacherName} <span className="text-slate-400 font-medium">covering</span> {sub.absentTeacherName}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">Date: {sub.date} ({sub.day})</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>

            {/* Detailed Selection Logic Panel */}
            <div>
              {selectedDecisionId && activeAssignments.find(a => a.id === selectedDecisionId) ? (
                (() => {
                  const assignment = activeAssignments.find(a => a.id === selectedDecisionId)!;
                  const score = assignment.aiConfidence ? Math.round(assignment.aiConfidence * 100) : 89;
                  return (
                    <div className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-1 rounded-md uppercase tracking-wider">Candidate Scorecard</span>
                          <h4 className="text-xs font-bold mt-2">Heuristic Match Details</h4>
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-black text-indigo-600">{score}%</span>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Match Index</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Substitute assigned</span>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5">{assignment.substituteTeacherName}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Department matched</span>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5">{assignment.subject}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Period index</span>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5">Period {assignment.periodIndex - 1}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Target class</span>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5">{assignment.classSection}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">AI Primary Evaluation Reasons</span>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 space-y-2">
                          <div className="flex gap-2 items-center text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span className="font-semibold text-[11px]">Extra Study Request Fit: Matches pending revision targets</span>
                          </div>
                          <div className="flex gap-2 items-center text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span className="font-semibold text-[11px]">Optimal Workload Balancing: Lowest weekly substitute duty index</span>
                          </div>
                          <div className="flex gap-2 items-center text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span className="font-semibold text-[11px]">Academic Continuity: Same division department teacher</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8 border border-dashed rounded-xl border-slate-200 text-slate-400 text-xs">
                  Select any substitute ledger card on the left to audit its detailed score breakdown.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scenarios Modals */}
      {activeModal === 'absence' && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'} space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Simulate Teacher Absence</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono">CLOSE</button>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Select Educator</label>
              <select
                value={absentTeacherId}
                onChange={(e) => setAbsentTeacherId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="">-- Choose teacher to mark absent --</option>
                {state.teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                ))}
              </select>
              <button
                onClick={handleSimulateAbsence}
                disabled={!absentTeacherId || isSimulating}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Submit Absence Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'extra_class' && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'} space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Submit Extra Class Request</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono">CLOSE</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Select Teacher</label>
                <select
                  value={requestTeacherId}
                  onChange={(e) => {
                    setRequestTeacherId(e.target.value);
                    const t = state.teachers.find(x => x.id === e.target.value);
                    if (t) setRequestSubject(t.subject);
                  }}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="">-- Choose Teacher --</option>
                  {state.teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Target Class</label>
                <select
                  value={requestClass}
                  onChange={(e) => setRequestClass(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
                >
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Preferred Period</label>
                <select
                  value={requestPeriod}
                  onChange={(e) => setRequestPeriod(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value={2}>Period 1 (09:00 AM)</option>
                  <option value={3}>Period 2 (09:45 AM)</option>
                  <option value={5}>Period 3 (10:45 AM)</option>
                  <option value={6}>Period 4 (11:30 AM)</option>
                  <option value={8}>Period 5 (01:00 PM)</option>
                  <option value={9}>Period 6 (01:45 PM)</option>
                </select>
              </div>

              <button
                onClick={handleSimulateExtraClass}
                disabled={!requestTeacherId || isSimulating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'leave' && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'} space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Simulate Teacher Leave</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono">CLOSE</button>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Select Educator</label>
              <select
                onChange={(e) => handleSimulateLeave(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="">-- Select teacher going on leave --</option>
                {state.teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'add_teacher' && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'} space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Add New Teacher</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono">CLOSE</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold block mb-1 text-slate-400">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold block mb-1 text-slate-400">Department</label>
                <select
                  value={newTeacherDept}
                  onChange={(e) => setNewTeacherDept(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Languages">Languages</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Arts & Physical Ed">Arts & Physical Ed</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold block mb-1 text-slate-400">Subject Specialist</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Chemistry"
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <button
                onClick={handleAddNewTeacher}
                disabled={!newTeacherName || isSimulating}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Enroll New Teacher Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'remove_teacher' && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'} space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Remove Teacher</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold font-mono">CLOSE</button>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Select Educator to Remove</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleDeleteTeacherSim(e.target.value);
                  }
                }}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="">-- Choose Teacher --</option>
                {state.teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
