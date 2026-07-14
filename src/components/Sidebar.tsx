import { 
  LayoutDashboard, 
  CalendarRange, 
  Users, 
  ClipboardCheck, 
  UserPlus, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  School,
  Sparkles,
  FileText,
  GraduationCap,
  BookOpen,
  Shield
} from 'lucide-react';
import { UserSession } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  session: UserSession;
  onLogout: () => void;
  darkTheme: boolean;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  session, 
  onLogout,
  darkTheme
}: SidebarProps) {
  
  const menuItems = [
    { id: 'superadmin-panel', label: 'Super Admin', icon: Shield, roles: ['superadmin'] },
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['admin', 'principal'] },
    { id: 'teacher-dashboard', label: 'Teacher Hub', icon: Sparkles, roles: ['teacher'] },
    { id: 'leaves', label: 'Leave Center', icon: FileText, roles: ['admin', 'principal', 'teacher'] },
    { id: 'timetable', label: 'Timetable Grid', icon: CalendarRange, roles: ['admin', 'principal', 'teacher'] },
    { id: 'teachers', label: 'Teacher Management', icon: Users, roles: ['admin', 'principal'] },
    { id: 'students', label: 'Student Records', icon: GraduationCap, roles: ['admin', 'principal', 'teacher'] },
    { id: 'lessons-learned', label: 'Lessons Learned', icon: BookOpen, roles: ['admin', 'principal', 'teacher'] },
    { id: 'attendance', label: 'Attendance Tracker', icon: ClipboardCheck, roles: ['admin', 'principal'] },
    { id: 'substitute', label: 'Substitute Manager', icon: UserPlus, roles: ['admin', 'principal'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['admin', 'principal', 'teacher'] },
    { id: 'settings', label: 'ERP Settings', icon: SettingsIcon, roles: ['superadmin', 'admin', 'principal', 'teacher'] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(session.role));

  return (
    <aside className={`w-64 border-r transition-colors shrink-0 flex flex-col justify-between h-screen sticky top-0 ${
      darkTheme 
        ? 'bg-slate-900 border-slate-800 text-slate-200' 
        : 'bg-white border-slate-100 text-slate-800'
    }`} id="sidebar-container-element">
      
      {/* Upper Logo block & Scrollable Navigation */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`p-6 border-b flex items-center gap-3 shrink-0 ${
          darkTheme ? 'border-slate-800' : 'border-slate-50'
        }`}>
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
            {session.role === 'superadmin' ? <Shield className="h-6 w-6" /> : <School className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg text-blue-600">
              {session.role === 'superadmin' ? 'Master Admin' : 'XYZ School'}
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
              {session.role === 'superadmin' ? 'Cloud Control' : 'Academic ERP v2.4'}
            </p>
          </div>
        </div>

        {/* Dynamic Navigation Links (Scrollable) */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1 min-h-0">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15'
                    : darkTheme
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                id={`sidebar-tab-${item.id}`}
                type="button"
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Profile & Fixed Logout Button */}
      <div className={`p-4 border-t shrink-0 ${
        darkTheme ? 'border-slate-800 bg-slate-950/40' : 'border-slate-50 bg-slate-50/50'
      }`}>
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-mono shrink-0">
            {session.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold truncate leading-tight text-slate-900 dark:text-white">
              {session.name}
            </h4>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${
              session.role === 'superadmin' 
                ? 'text-indigo-500' 
                : session.role === 'principal' || session.role === 'admin' 
                  ? 'text-red-500' 
                  : 'text-green-500'
            }`}>
              {session.role}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
            darkTheme
              ? 'text-red-400 hover:bg-red-950/30 hover:text-red-300'
              : 'text-red-600 hover:bg-red-50 hover:text-red-750'
          }`}
          id="sidebar-logout-button"
          type="button"
        >
          <LogOut className="h-5 w-5 shrink-0 text-red-500/80" />
          Logout
        </button>
      </div>
    </aside>
  );
}
