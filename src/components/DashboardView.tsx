import { 
  Users, 
  BookOpen, 
  ArrowRight, 
  Bell, 
  X,
  CheckCircle,
  Clock,
  Briefcase,
  FileText,
  ClipboardCheck,
  TrendingUp,
  CalendarPlus
} from 'lucide-react';
import { 
  ERPDataState, 
  UserSession, 
  DayOfWeek 
} from '../types';
import { formatISTDateToDDMMYYYY } from '../utils/dateUtils';

interface DashboardViewProps {
  state: ERPDataState;
  session: UserSession;
  selectedDate: string; // YYYY-MM-DD
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (tab: string) => void;
  darkTheme: boolean;
}

export default function DashboardView({
  state,
  session,
  selectedDate,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  darkTheme
}: DashboardViewProps) {
  const isAdmin = session.role === 'admin';
  
  // Calculate current weekday
  const currentCheckDate = new Date(selectedDate);
  const currentDayName = currentCheckDate.toLocaleDateString('en-US', { weekday: 'long' });
  const isWeekend = currentDayName === 'Saturday' || currentDayName === 'Sunday';

  // State metrics calculation
  const totalTeachers = state.teachers.length;

  // Total classes today from standard timetable
  const activeWeekDay: DayOfWeek = isWeekend ? 'Monday' : currentDayName as DayOfWeek;
  
  let standardClassesToday = 0;
  state.teachers.forEach(t => {
    if (t.status === 'Active') {
      const daySchedule = t.schedule[activeWeekDay] || [];
      daySchedule.forEach(slot => {
        if (slot) standardClassesToday++;
      });
    }
  });

  // Today's specific attendance records
  const todaysAttendance = state.attendance.filter(att => att.date === selectedDate);
  const absentTeachersToday = todaysAttendance.filter(att => att.status === 'Absent');
  const absentCount = absentTeachersToday.length;

  // Extra classes scheduled today
  const todaysApprovedExtras = state.extraClassRequests.filter(
    req => req.date === selectedDate && req.status === 'Approved'
  );
  const extraClassesCount = todaysApprovedExtras.length;

  // Substitutes assigned today
  const todaysSubstitutes = state.substituteAssignments.filter(sub => sub.date === selectedDate);
  const substitutesCount = todaysSubstitutes.length;

  // Leave requests relevant to selected date
  const leavesForSelectedDate = (state.leaveRequests || []).filter(lv => {
    return selectedDate >= lv.startDate && selectedDate <= lv.endDate;
  });
  const pendingLeavesCount = leavesForSelectedDate.filter(lv => lv.status === 'Pending').length;
  const approvedLeavesCount = leavesForSelectedDate.filter(lv => lv.status === 'Approved').length;

  // Unread notifications count
  const unreadNotifications = state.notifications.filter(n => !n.read);

  // TEACHER HUB SPECIFIC METRICS
  const activeTeacher = state.teachers.find(t => t.id === session.userId);
  
  let personalClassesTodayCount = 0;
  let teacherWeeklyWorkload = 0;
  let substituteClassesTutorsTodayCount = 0;

  if (activeTeacher) {
    // Standard classes today
    const teacherTodaySchedule = activeTeacher.schedule[activeWeekDay] || [];
    teacherTodaySchedule.forEach(slot => {
      if (slot) personalClassesTodayCount++;
    });

    // Weekly workload
    Object.values(activeTeacher.schedule).forEach(daySched => {
      daySched.forEach(slot => {
        if (slot) teacherWeeklyWorkload++;
      });
    });

    // Substitutions assigned to this teacher today
    substituteClassesTutorsTodayCount = state.substituteAssignments.filter(
      sub => sub.date === selectedDate && sub.substituteTeacherId === activeTeacher.id
    ).length;
  }

  const schoolName = state.settings?.schoolInfo?.name || "Aura Academic";

  return (
    <div className="space-y-6" id="dashboard-view-main">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {isAdmin ? 'Academic Administration Dashboard' : `Welcome Back, ${session.name}!`}
          </h2>
          <p className={`text-xs font-semibold ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            System Date Focus: <span className="text-[#F59E0B] font-bold">{formatISTDateToDDMMYYYY(selectedDate)}</span> ({currentDayName})
            {isWeekend && ' - Showing Monday Schedule Preview (Weekend)'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('timetable')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#F59E0B] hover:bg-[#FBBF24] rounded-xl transition-all shadow-lg shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
            id="dash-quick-timetable-btn"
            type="button"
          >
            <BookOpen className="h-4 w-4 shrink-0" /> View Live Timetable Grid
          </button>
        </div>
      </div>

      {isAdmin ? (
        /* ADMIN DASHBOARD */
        <div className="space-y-6">
          {/* Dashboard Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Faculty */}
            <div 
              onClick={() => onNavigate('teachers')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md border-t-4 border-t-[#F59E0B] ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
              id="dash-card-faculty"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="p-2 bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA] rounded-xl">
                  <Users className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Faculty</span>
              </div>
              <p className="text-2xl font-black text-[#F59E0B]">{totalTeachers}</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Teachers Enrolled</h4>
            </div>

            {/* Attendance */}
            <div 
              onClick={() => onNavigate('attendance')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md border-t-4 border-t-[#F59E0B] ${
                absentCount > 0 
                  ? 'bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-950/30'
                  : darkTheme ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-100 shadow-sm'
              }`}
              id="dash-card-attendance"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`p-2 rounded-xl ${
                  absentCount > 0 
                    ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' 
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                }`}>
                  <ClipboardCheck className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Attendance</span>
              </div>
              <p className={`text-2xl font-black ${absentCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-450'}`}>
                {absentCount > 0 ? `${totalTeachers - absentCount} / ${totalTeachers} Present` : `${totalTeachers} / ${totalTeachers} Present`}
              </p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                {absentCount > 0 ? `${absentCount} Absent` : '100% Present'}
              </h4>
            </div>

            {/* Scheduled Extras */}
            <div 
              onClick={() => onNavigate('timetable')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md border-t-4 border-t-[#F59E0B] ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
              id="dash-card-extras"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="p-2 bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA] rounded-xl">
                  <CalendarPlus className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Extra Hours</span>
              </div>
              <p className="text-2xl font-black text-[#F59E0B]">{extraClassesCount} Extra Hours</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Scheduled on {formatISTDateToDDMMYYYY(selectedDate)}</h4>
            </div>

            {/* Substitutions */}
            <div 
              onClick={() => onNavigate('substitute')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md border-t-4 border-t-[#F59E0B] ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
              id="dash-card-substitute"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="p-2 bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA] rounded-xl">
                  <TrendingUp className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Substitutions</span>
              </div>
              <p className="text-2xl font-black text-[#F59E0B]">{substitutesCount} Slots</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Assigned on {formatISTDateToDDMMYYYY(selectedDate)}</h4>
            </div>

            {/* Pending Leaves */}
            <div 
              onClick={() => onNavigate('leaves')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md border-t-4 border-t-[#F59E0B] ${
                pendingLeavesCount > 0 
                  ? 'bg-amber-50/45 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/45 text-amber-900 dark:text-amber-105'
                  : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
              id="dash-card-leaves"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`p-2 rounded-xl ${
                  pendingLeavesCount > 0 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' 
                    : 'bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA]'
                }`}>
                  <FileText className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Leaves</span>
              </div>
              <p className={`text-2xl font-black ${pendingLeavesCount > 0 ? 'text-[#F59E0B]' : ''}`}>
                {pendingLeavesCount > 0 
                  ? `${pendingLeavesCount} Pending` 
                  : approvedLeavesCount > 0 
                    ? `${approvedLeavesCount} Approved Leave` 
                    : '0 Leaves'}
              </p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">For {formatISTDateToDDMMYYYY(selectedDate)}</h4>
            </div>

            {/* Slotted Classes */}
            <div 
              onClick={() => onNavigate('timetable')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md border-t-4 border-t-[#F59E0B] ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
              id="dash-card-lessons-slotted"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="p-2 bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA] rounded-xl">
                  <BookOpen className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Lessons</span>
              </div>
              <p className="text-2xl font-black text-[#F59E0B]">{standardClassesToday} Slotted</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Periods Active on {formatISTDateToDDMMYYYY(selectedDate)}</h4>
            </div>

          </div>

          {/* Secondary Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Block: Critical Daily Alarms & Actionable Absences */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Absent teachers coordination panel */}
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-red-500 rounded-full"></div>
                    <h3 className="font-bold text-base text-slate-850 dark:text-white">Active Absences (Requires Substitute Coverage)</h3>
                  </div>
                  <button 
                    onClick={() => onNavigate('attendance')}
                    className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                    type="button"
                  >
                    Open Attendance
                  </button>
                </div>

                {absentCount === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500 animate-pulse" />
                    <p className="font-bold text-slate-800 dark:text-white">All Scheduled Faculty are Present</p>
                    <p className="text-xs text-slate-500">Every lesson hour on {formatISTDateToDDMMYYYY(selectedDate)} is covered by primary assigned teachers.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {absentTeachersToday.map((att) => {
                      const teacher = state.teachers.find(t => t.id === att.teacherId);
                      if (!teacher) return null;
                      
                      const activeSlotsCount = teacher.schedule[activeWeekDay]?.filter(slot => slot !== null).length || 0;
                      const coverageCompleted = Object.keys(att.substitutes || {}).length;

                      return (
                        <div key={att.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          coverageCompleted >= activeSlotsCount 
                            ? 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/10'
                            : 'bg-red-50/20 border-red-100 dark:bg-red-950/10 dark:border-red-900/10'
                        }`}>
                          <div>
                            <p className="font-bold text-sm text-slate-855 dark:text-white">{teacher.name}</p>
                            <p className="text-[11px] text-slate-450 font-bold mt-0.5">
                              Subject: {teacher.subject} • {activeSlotsCount} classes slotted on {activeWeekDay}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                              coverageCompleted >= activeSlotsCount
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-450'
                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
                            }`}>
                              Covered: {coverageCompleted} / {activeSlotsCount}
                            </span>
                            
                            <button
                              onClick={() => onNavigate('substitute')}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                              type="button"
                            >
                              Substitution Assigner <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions Grid */}
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-850 dark:text-white">
                  <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                  Quick Administrator Operations
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => onNavigate('teachers')}
                    className="p-4 bg-slate-50 hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-850 transition-all cursor-pointer group"
                    type="button"
                  >
                    <h4 className="font-black text-xs uppercase tracking-wider group-hover:text-blue-600 transition-colors">Add Teacher Profile</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">Register new teachers and configure initial weekly timetables.</p>
                  </button>

                  <button
                    onClick={() => onNavigate('timetable')}
                    className="p-4 bg-slate-50 hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-850 transition-all cursor-pointer group"
                    type="button"
                  >
                    <h4 className="font-black text-xs uppercase tracking-wider group-hover:text-blue-600 transition-colors">Book Extra Hour</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">Run auto-conflict tests and assign extra study blocks.</p>
                  </button>

                  <button
                    onClick={() => onNavigate('attendance')}
                    className="p-4 bg-slate-50 hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-xl text-left border border-slate-100 dark:border-slate-850 transition-all cursor-pointer group"
                    type="button"
                  >
                    <h4 className="font-black text-xs uppercase tracking-wider group-hover:text-blue-600 transition-colors">Audit Register</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">Mark today's present and absent teachers roster.</p>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Block: Live Alerts Log */}
            <div className="space-y-6">
              
              <div className={`p-6 rounded-2xl border flex flex-col h-[400px] shrink-0 ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-base text-slate-850 dark:text-white font-sans">Live System Log ({unreadNotifications.length})</h3>
                  </div>
                  {unreadNotifications.length > 0 && (
                    <button 
                      onClick={onMarkAllRead}
                      className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                      type="button"
                    >
                      Dismiss All
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {state.notifications.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs py-10">
                      System notifications registry is entirely clear.
                    </div>
                  ) : (
                    state.notifications.map((not) => (
                      <div 
                        key={not.id} 
                        className={`p-3.5 rounded-xl border relative transition-all ${
                          not.read 
                            ? 'bg-slate-50/40 border-slate-100 dark:bg-slate-950/20' 
                            : 'bg-blue-50/30 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 shadow-sm'
                        }`}
                      >
                        {!not.read && (
                          <button
                            onClick={() => onMarkRead(not.id)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Mark as read"
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <h4 className="font-bold text-xs pr-4 text-slate-900 dark:text-white leading-normal">{not.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {not.message}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-2 font-mono font-semibold">
                          {new Date(not.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* TEACHER HUB DASHBOARD */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div 
              onClick={() => onNavigate('timetable')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl">
                  <Briefcase className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Weekly</span>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{teacherWeeklyWorkload} Classes</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Weekly Workload Load</h4>
            </div>

            <div 
              onClick={() => onNavigate('timetable')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl">
                  <Clock className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Today</span>
              </div>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{personalClassesTodayCount} Sessions</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Lessons Slotted Today</h4>
            </div>

            <div 
              onClick={() => onNavigate('timetable')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl">
                  <CalendarPlus className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Substitutions</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{substituteClassesTutorsTodayCount} Covered</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Assigned Coverages Today</h4>
            </div>

            <div 
              onClick={() => onNavigate('leaves')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="p-2 bg-indigo-50 text-indigo-655 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold font-mono text-slate-400">Leaves</span>
              </div>
              <p className="text-2xl font-black">{(state.leaveRequests || []).filter(lv => lv.teacherId === session.userId).length} Filed</p>
              <h4 className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">My Leave Register</h4>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Teacher's daily schedule overview */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                  My Timetable Slots For Today ({activeWeekDay})
                </h3>

                {activeTeacher ? (
                  <div className="space-y-3">
                    {activeTeacher.schedule[activeWeekDay]?.map((slot, pIdx) => {
                      const timings = [
                        '08:30 AM - 09:20 AM',
                        '09:20 AM - 10:10 AM',
                        '10:30 AM - 11:20 AM',
                        '11:20 AM - 12:10 PM',
                        '01:00 PM - 01:50 PM',
                        '01:50 PM - 02:40 PM'
                      ];

                      return (
                        <div key={pIdx} className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                          slot 
                            ? 'bg-blue-50/20 border-blue-100 dark:bg-blue-950/10' 
                            : 'bg-slate-50/30 border-dashed border-slate-200 dark:bg-slate-950/10 dark:border-slate-800'
                        }`}>
                          <div className="flex gap-4 items-center">
                            <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                              P{pIdx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-400">{timings[pIdx]}</p>
                              <h4 className="font-bold text-sm mt-0.5 text-slate-900 dark:text-white">
                                {slot ? `${slot.subject} - ${slot.classSection}` : 'Free Prep Period'}
                              </h4>
                            </div>
                          </div>

                          {slot ? (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded-lg font-bold">
                              {slot.room}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Available</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Teacher profile missing.</p>
                )}
              </div>

            </div>

            {/* Right block: Extra class request */}
            <div className="space-y-6">
              
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h3 className="font-bold text-base mb-3 text-slate-900 dark:text-white">Scheduling Assist</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Request an extra study session block dynamically. Our automatic timetable logic will check student-group schedules in real time to prevent any standard course overlaps.
                </p>

                <button
                  onClick={() => onNavigate('timetable')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/15 hover:bg-blue-700 transition-all cursor-pointer"
                  type="button"
                >
                  Request Extra Class Block <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
