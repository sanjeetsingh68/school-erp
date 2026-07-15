import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  CalendarDays,
  Brain,
  Cpu,
  Gauge,
  ArrowRight
} from 'lucide-react';
import { ERPDataState, ExtraClassRequest, DayOfWeek } from '../types';

interface ExtraClassRequestCenterProps {
  state: ERPDataState;
  darkTheme: boolean;
  onUpdateState: (newState: ERPDataState) => void;
}

export default function ExtraClassRequestCenter({
  state,
  darkTheme,
  onUpdateState
}: ExtraClassRequestCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [isMatching, setIsMatching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Get departments & classes for dropdowns
  const departments = Array.from(new Set(state.extraClassRequests.map(r => r.department || 'General')));
  const classes = Array.from(new Set(state.extraClassRequests.map(r => r.classSection)));

  // Calculate matching score for visual queue display
  const getAIQueuePoints = (req: ExtraClassRequest) => {
    let score = 100; // base score
    const breakdowns: string[] = ['Base allocation score: +100'];

    if (req.priority === 'High') {
      score += 500;
      breakdowns.push('High priority bonus: +500');
    }

    // Scheduling constraint preferences
    if (req.date) {
      score += 50;
      breakdowns.push('Specific date lock: +50');
    } else if (req.preferredWeek) {
      score += 30;
      breakdowns.push('Week flex lock: +30');
    } else {
      score += 10;
      breakdowns.push('Open pool flexibility: +10');
    }

    // Dynamic workload priority estimation (using teacher data if present)
    const teacher = state.teachers.find(t => t.id === req.teacherId);
    if (teacher) {
      const monthlySubs = state.substituteAssignments.filter(s => s.substituteTeacherId === req.teacherId).length;
      if (monthlySubs === 0) {
        score += 40;
        breakdowns.push('Zero monthly subs multiplier: +40');
      } else {
        score += Math.max(5, 40 - (monthlySubs * 5));
        breakdowns.push(`Workload balancing points: +${Math.max(5, 40 - (monthlySubs * 5))}`);
      }
    }

    return { score, breakdowns };
  };

  // Filter & Search Logic
  const filteredRequests = state.extraClassRequests.filter(req => {
    // 1. Search term (Teacher Name, Subject, ClassSection)
    const matchesSearch = 
      req.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.classSection.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Status filter
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;

    // 3. Department filter
    const matchesDept = deptFilter === 'All' || req.department === deptFilter;

    // 4. Class filter
    const matchesClass = classFilter === 'All' || req.classSection === classFilter;

    return matchesSearch && matchesStatus && matchesDept && matchesClass;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#F59E0B] animate-pulse" />
            AI Substitute & Request Pool
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Autonomous matchmaking engine. Monitored extra class pool automatically pairing available slots with teacher queues.
          </p>
        </div>

        {/* Highlight Stats */}
        <div className="flex gap-4 font-mono">
          <div className={`px-4 py-2 border rounded-xl text-center shadow-sm ${
            darkTheme ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase">In Pool</p>
            <p className="text-sm font-bold text-amber-500 mt-1">
              {state.extraClassRequests.filter(r => r.status === 'Waiting for Matching').length}
            </p>
          </div>
          <div className={`px-4 py-2 border rounded-xl text-center shadow-sm ${
            darkTheme ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Matched</p>
            <p className="text-sm font-bold text-teal-500 mt-1">
              {state.extraClassRequests.filter(r => r.status === 'Matched').length}
            </p>
          </div>
          <div className={`px-4 py-2 border rounded-xl text-center shadow-sm ${
            darkTheme ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned</p>
            <p className="text-sm font-bold text-[#F59E0B] mt-1">
              {state.extraClassRequests.filter(r => r.status === 'Assigned' || r.status === 'Completed').length}
            </p>
          </div>
        </div>
      </div>

      {/* Fully Autonomous AI Engine Status Banner (No Manual Run Button!) */}
      <div className={`p-6 rounded-2xl border transition-all ${
        darkTheme ? 'bg-slate-950 border-slate-850' : 'bg-gradient-to-r from-[#FFF8F1] to-[#FED7AA]/30 border-[#FED7AA]/40'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="h-4.5 w-4.5 text-[#F59E0B] dark:text-amber-400" />
                Fully Autonomous AI Substitute Service Active
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-4xl leading-relaxed">
              The AI Substitute Engine runs fully hands-free in the background. It is triggered instantly by live scheduling updates (leaves, absences, deactivations, Excel imports, calendar edits) to eliminate vacancies, check potential collisions, and automatically notify teachers.
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 border ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-[#FED7AA] text-amber-700'
          } flex items-center gap-2`}>
            <Brain className="h-4 w-4 text-emerald-500 animate-pulse" />
            Real-time Background Dispatcher
          </div>
        </div>

        {/* Priority Assignment visual pipeline details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-850">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-[#FFF8F1] border border-[#FED7AA]/50 text-[#F59E0B] flex items-center justify-center text-[11px] font-bold">1</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Extra Class Request Match</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal pl-6">
              Scans Pool for active teacher requests matches with the vacant class, section, & subject. Self-assigns with no admin approval needed.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px] font-bold">2</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Lowest Daily Workload</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal pl-6">
              Selects available, present, qualified teachers with the fewest teaching periods assigned today to balance the workload.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-[#FFF8F1] border border-[#FED7AA]/30 text-amber-600 flex items-center justify-center text-[11px] font-bold">3</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Lowest Weekly Workload</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal pl-6">
              Compares total scheduled teaching hours for the current week. Distributes task to the teacher with lower total hours.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[11px] font-bold">4</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Fair Rotation & Month Caps</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal pl-6">
              Chooses the candidate with the fewest overall monthly substitute assignment logs to prevent burn-out and maintain equitable distribution.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-center transition-all ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search teacher, subject, class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs font-medium pl-10 pr-3.5 py-2 rounded-xl border transition-all ${
              darkTheme
                ? 'bg-slate-950 border-slate-850 text-slate-200 focus:border-[#F59E0B]'
                : 'bg-white border-slate-200 text-slate-700 focus:border-[#F59E0B]'
            }`}
          />
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            {['All', 'Waiting for Matching', 'Matched', 'Assigned', 'Completed', 'Cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  (statusFilter === s)
                    ? 'bg-white dark:bg-slate-850 text-[#F59E0B] dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Department dropdown */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className={`text-xs font-medium pl-8 pr-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                darkTheme
                  ? 'bg-slate-950 border-slate-850 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Class dropdown */}
          <div className="relative">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className={`text-xs font-medium pl-8 pr-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                darkTheme
                  ? 'bg-slate-950 border-slate-850 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Grades</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Request Grid */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className={`p-16 rounded-2xl border text-center ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <CalendarDays className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-4">No active pool requests match your criteria.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try expanding your search parameters or submit a new extra class request.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredRequests.map((req) => {
              const { score, breakdowns } = getAIQueuePoints(req);
              const timeLabel = req.preferredPeriod || `Period ${req.periodIndex + 1}`;

              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border shadow-sm transition-all relative flex flex-col justify-between ${
                    darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}
                >
                  
                  {/* Status Banner / Tags */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                        req.status === 'Matched'
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900'
                          : req.status === 'Assigned' || req.status === 'Completed'
                            ? 'bg-[#FFF8F1] dark:bg-amber-955/40 text-[#F59E0B] dark:text-amber-400 border border-[#FED7AA]/40 dark:border-amber-900'
                            : req.status === 'Cancelled' || req.status === 'Expired'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900'
                      }`}>
                        {req.status === 'Waiting for Matching' ? 'POOL QUEUE' : req.status.toUpperCase()}
                      </span>

                      {req.priority === 'High' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500 text-white font-mono">
                          HIGH
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#F59E0B] dark:text-amber-400">
                      <Gauge className="h-3.5 w-3.5" />
                      <span>{score} Queue pts</span>
                    </div>
                  </div>

                  {/* Core Card Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 dark:border-slate-800 mb-4">
                    {/* Teacher / Subj column */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA]/30 font-bold shrink-0 font-mono">
                          {(req.teacherName || '').split(' ').filter(Boolean).map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{req.teacherName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{req.department} • {req.subject}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-2 mt-3 text-slate-500 dark:text-slate-400">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        <span>Class Section: <strong className="text-[#F59E0B] font-bold">{req.classSection}</strong></span>
                      </div>

                      {req.reason && (
                        <p className="text-[11px] leading-relaxed italic text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border dark:border-slate-800">
                          "{req.reason}"
                        </p>
                      )}
                    </div>

                    {/* DateTime Column */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border dark:border-slate-850">
                        <Calendar className="h-4 w-4 text-[#F59E0B] shrink-0" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            {req.date ? req.date : req.preferredWeek ? `Week of ${req.preferredWeek}` : 'Fully Flexible / No Date'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {req.date ? req.day : req.preferredWeek ? 'Flexible Date' : 'Autonomous Matching'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border dark:border-slate-850">
                        <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{timeLabel}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{req.preferredTime || 'Flexible Period'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Ranking Explanation / Reason Details */}
                  <div className={`p-4 rounded-xl border text-xs ${
                    darkTheme ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50/50 border-slate-150'
                  }`}>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#F59E0B] animate-bounce" />
                      AI Pool Scoring Factors
                    </span>

                    <div className="space-y-1.5 text-slate-500 dark:text-slate-400 pl-1 font-medium">
                      {breakdowns.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-[#F59E0B] mt-0.5">•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                      
                      {/* Sub-info from engine validations */}
                      {req.aiValidationReasons && req.aiValidationReasons.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t dark:border-slate-850 space-y-1">
                          <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider font-mono">Real-time Matching Telemetry:</p>
                          {req.aiValidationReasons.map((vReason, vIdx) => (
                            <div key={vIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                              <span className="text-emerald-500">•</span>
                              <span>{vReason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
