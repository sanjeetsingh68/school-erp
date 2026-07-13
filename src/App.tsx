import { useState, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  Sun, 
  Moon, 
  UserCheck, 
  Mail,
  School,
  LogOut,
  Calendar,
  ChevronRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  ERPDataState, 
  UserSession, 
  Teacher, 
  TimetableSlot, 
  DayOfWeek, 
  SystemNotification 
} from './types';

// Pages
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import TimetableManagement from './components/TimetableManagement';
import TeacherManagement from './components/TeacherManagement';
import AttendanceTracker from './components/AttendanceTracker';
import SubstituteManagement from './components/SubstituteManagement';
import ReportsAndAnalytics from './components/ReportsAndAnalytics';
import SettingsPage from './components/SettingsPage';
import LeaveManagement from './components/LeaveManagement';
import StudentManagement from './components/StudentManagement';
import LessonsLearned from './components/LessonsLearned';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState('2026-05-25'); // Anchored on metadata date
  const [darkTheme, setDarkTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Master State representing all DB modules
  const [state, setState] = useState<ERPDataState>({
    teachers: [],
    attendance: [],
    extraClassRequests: [],
    substituteAssignments: [],
    notifications: []
  });

  // Load Session and DB on startup
  useEffect(() => {
    const savedSession = localStorage.getItem('erp_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        // If teacher, default their entry view to teacher-dashboard
        if (parsed.role === 'teacher') {
          setCurrentTab('teacher-dashboard');
        }
      } catch (e) {
        console.error('Failed parsing cached session', e);
      }
    }

    const savedTheme = localStorage.getItem('erp_theme');
    if (savedTheme) {
      setDarkTheme(savedTheme === 'dark');
    }

    fetchState();
  }, []);

  const fetchState = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/state');
      const data = await resp.json();
      if (resp.ok) {
        setState(data);
      }
    } catch (err) {
      console.error('Failed to sync ERP state from backend', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    localStorage.setItem('erp_session', JSON.stringify(userSession));
    if (userSession.role === 'teacher') {
      setCurrentTab('teacher-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('erp_session');
    setCurrentTab('dashboard');
  };

  const handleToggleTheme = () => {
    const nextTheme = !darkTheme;
    setDarkTheme(nextTheme);
    localStorage.setItem('erp_theme', nextTheme ? 'dark' : 'light');
  };

  // ------------------ SERVER ENDPOINT HANDLERS ------------------

  const handleAddTeacher = async (teacher: Teacher) => {
    const resp = await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed adding teacher');
    setState(data.state);
  };

  const handleUpdateTeacher = async (id: string, updated: Partial<Teacher>) => {
    const resp = await fetch(`/api/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed updating teacher');
    setState(data.state);
  };

  const handleDeleteTeacher = async (id: string) => {
    const resp = await fetch(`/api/teachers/${id}`, {
      method: 'DELETE'
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed deleting teacher');
    setState(data.state);
  };

  const handleUpdateScheduleSlot = async (
    teacherId: string, 
    day: DayOfWeek, 
    periodIndex: number, 
    slot: TimetableSlot | null
  ) => {
    const resp = await fetch('/api/schedule/set-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, day, periodIndex, slot })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed updating timetable');
    setState(data.state);
  };

  const handleScheduleExtraClass = async (payload: {
    teacherId: string;
    classSection: string;
    date: string;
    periodIndex: number;
  }) => {
    const resp = await fetch('/api/extra-classes/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed booking extra class');
    setState(data.state);
  };

  const handleSaveAttendance = async (
    date: string, 
    teacherStatuses: { [teacherId: string]: 'Present' | 'Absent' }
  ) => {
    const resp = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, teacherStatuses })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed saving attendance register');
    setState(data.state);
  };

  const handleAssignSubstitute = async (payload: {
    date: string;
    periodIndex: number;
    absentTeacherId: string;
    substituteTeacherId: string;
  }) => {
    const resp = await fetch('/api/substitutes/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed assigning substitute');
    setState(data.state);
  };

  const handleApplyLeave = async (payload: {
    teacherId: string;
    startDate: string;
    endDate: string;
    leaveType: any;
    reason: string;
  }) => {
    const resp = await fetch('/api/leaves/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to apply leave');
    setState(data.state);
  };

  const handleReviewLeave = async (id: string, status: 'Approved' | 'Rejected', comment: string) => {
    const resp = await fetch(`/api/leaves/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewComment: comment })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to review leave');
    setState(data.state);
  };

  const handleMarkNotificationRead = async (id: string) => {
    const resp = await fetch(`/api/notifications/${id}`, {
      method: 'PUT'
    });
    const data = await resp.json();
    if (resp.ok) {
      setState(data.state);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const resp = await fetch('/api/notifications/read-all', {
      method: 'PUT'
    });
    const data = await resp.json();
    if (resp.ok) {
      setState(data.state);
    }
  };

  const handleResetDB = async () => {
    const resp = await fetch('/api/reset', {
      method: 'POST'
    });
    const data = await resp.json();
    if (resp.ok) {
      setState(data.state);
      if (session?.role === 'teacher') {
        setCurrentTab('teacher-dashboard');
      } else {
        setCurrentTab('dashboard');
      }
    }
  };

  // If no active login session exists, render login component
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Pre-load layout
  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen flex font-sans ${darkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-800'}`}>
      
      {/* Desktop Sidebar Navigation panel representing school ERP drawer */}
      <div className="hidden md:block">
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          session={session} 
          onLogout={handleLogout}
          darkTheme={darkTheme}
        />
      </div>

      {/* Main Panel Chassis */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Navbar Header */}
        <header className={`px-6 py-4 border-b flex justify-between items-center transition-colors shrink-0 ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden text-slate-500"
              title="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Info indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span className="text-slate-500 dark:text-slate-300">XYZ ERP SYSTEM</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-55" />
              <span className="capitalize text-blue-600 font-bold">{currentTab.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4.5">
            {/* Live Clock Timing indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-850 rounded-lg text-slate-500 font-mono font-semibold text-[11px]">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span>UTC: {selectedDate} 08:00 AM</span>
            </div>

            {/* Quick theme toggles */}
            <button
              onClick={handleToggleTheme}
              className="p-2 text-slate-400 hover:text-slate-655 dark:hover:text-yellow-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle layout theme color"
            >
              {darkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Quick notifications bell status panel */}
            <div className="relative">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="p-2 text-slate-400 hover:text-slate-655 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Responsive Menu Drawer drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 md:hidden flex justify-start">
            <div className="w-64 h-full relative" onClick={(e) => e.stopPropagation()}>
              <Sidebar 
                currentTab={currentTab} 
                setCurrentTab={(tab) => { setCurrentTab(tab); setMobileMenuOpen(false); }} 
                session={session} 
                onLogout={() => { handleLogout(); setMobileMenuOpen(false); }}
                darkTheme={darkTheme}
              />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 text-slate-400 p-1.5 focus:outline-none bg-slate-50 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Inner views container */}
        <main className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="font-semibold text-sm">Synchronizing XYZ ERP Systems...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentTab === 'dashboard' && (
                <DashboardView 
                  state={state} 
                  session={session} 
                  selectedDate={selectedDate} 
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onNavigate={setCurrentTab}
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'teacher-dashboard' && (
                <DashboardView 
                  state={state} 
                  session={session} 
                  selectedDate={selectedDate} 
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onNavigate={setCurrentTab}
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'timetable' && (
                <TimetableManagement 
                  teachers={state.teachers} 
                  selectedDate={selectedDate}
                  onScheduleExtraClass={handleScheduleExtraClass}
                  onUpdateSlot={handleUpdateScheduleSlot}
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'teachers' && (
                <TeacherManagement 
                  teachers={state.teachers} 
                  onAddTeacher={handleAddTeacher}
                  onUpdateTeacher={handleUpdateTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceTracker 
                  state={state} 
                  selectedDate={selectedDate}
                  onSetSelectedDate={setSelectedDate}
                  onSaveAttendance={handleSaveAttendance}
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'substitute' && (
                <SubstituteManagement 
                  state={state} 
                  selectedDate={selectedDate}
                  onAssignSubstitute={handleAssignSubstitute}
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsAndAnalytics 
                  state={state} 
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'students' && (
                <StudentManagement 
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'lessons-learned' && (
                <LessonsLearned 
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'leaves' && (
                <LeaveManagement 
                  state={state}
                  session={session}
                  onSubmitLeave={handleApplyLeave}
                  onReviewLeave={handleReviewLeave}
                  darkTheme={darkTheme}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsPage 
                  darkTheme={darkTheme} 
                  onToggleTheme={handleToggleTheme}
                  onResetDB={handleResetDB}
                />
              )}
            </div>
          )}
        </main>

      </div>

    </div>
  );
}
