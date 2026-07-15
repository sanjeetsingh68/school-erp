import { 
  LayoutDashboard, 
  CalendarRange, 
  Users, 
  ClipboardCheck, 
  UserPlus, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Sparkles,
  FileText,
  School
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'teacher-dashboard', label: 'Teacher Hub', icon: Sparkles, roles: ['teacher'] },
    ...(session.isDemo ? [{ id: 'ai-demo', label: 'AI Demonstration', icon: Sparkles, roles: ['admin'] }] : []),
    { id: 'extra-classes', label: 'Extra Class Requests', icon: CalendarRange, roles: ['teacher'] },
    { id: 'extra-class-center', label: 'Extra Class Center', icon: Sparkles, roles: ['admin'] },
    { id: 'teachers', label: 'Teacher Management', icon: Users, roles: ['admin'] },
    { id: 'attendance', label: 'Attendance Tracker', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
    { id: 'leaves', label: 'Leave Management', icon: FileText, roles: ['admin', 'teacher'] },
    { id: 'timetable', label: 'Timetable Manager', icon: CalendarRange, roles: ['admin', 'teacher'] },
    { id: 'substitute', label: 'Substitute Assigner', icon: UserPlus, roles: ['admin'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(session.role));

  return (
    <aside className={`w-64 border-r transition-colors shrink-0 flex flex-col justify-between h-screen sticky top-0 ${
      darkTheme 
        ? 'bg-slate-900 border-slate-800 text-slate-200' 
        : 'bg-white border-slate-100 text-slate-800'
    }`} id="sidebar-container-element">
      
      {/* Upper Logo block */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className={`p-6 border-b flex items-center gap-3 shrink-0 ${
          darkTheme ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="p-2 bg-[#F59E0B] text-white rounded-xl shadow-lg shadow-amber-500/20">
            <School className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-sm text-[#F59E0B] leading-tight font-sans">
              Aura Academic
            </h1>
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono mt-0.5">
              Smart Timetable v2.5
            </p>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1 min-h-0">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#FFF8F1] text-[#F59E0B] border-l-4 border-[#F59E0B] rounded-r-xl pl-3 shadow-sm'
                    : darkTheme
                      ? 'text-slate-400 hover:bg-slate-800/60 hover:text-[#FBBF24] pl-4 rounded-xl'
                      : 'text-slate-500 hover:bg-[#FFF8F1]/60 hover:text-[#FBBF24] pl-4 rounded-xl'
                }`}
                id={`sidebar-tab-${item.id}`}
                type="button"
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#F59E0B]' : 'text-slate-400 group-hover:text-[#FBBF24]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Profile & Logout */}
      <div className={`p-4 border-t shrink-0 ${
        darkTheme ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-[#FFF8F1]/20'
      }`}>
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA] flex items-center justify-center font-bold font-mono shrink-0">
            {(session?.name || '').split(' ').filter(Boolean).map(n => n[0]).join('')}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold truncate leading-tight text-slate-900 dark:text-white">
              {session.name}
            </h4>
            <p className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 ${
              session.role === 'admin' ? 'text-[#F59E0B]' : 'text-green-500'
            }`}>
              {session.role === 'admin' ? 'Administrator' : 'Teacher'}
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
          <LogOut className="h-5 w-5 shrink-0 text-red-500/85" />
          Logout
        </button>
      </div>
    </aside>
  );
}
