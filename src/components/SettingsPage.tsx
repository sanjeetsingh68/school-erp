import { useState } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  RotateCcw, 
  Building2, 
  BookOpen, 
  Clock, 
  UserCheck, 
  Check, 
  ShieldAlert,
  HelpCircle,
  Database
} from 'lucide-react';

interface SettingsPageProps {
  darkTheme: boolean;
  onToggleTheme: () => void;
  onResetDB: () => Promise<any>;
  darkThemeOnly?: boolean;
}

export default function SettingsPage({
  darkTheme,
  onToggleTheme,
  onResetDB
}: SettingsPageProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetFinished, setResetFinished] = useState(false);

  const handleReset = async () => {
    if (confirm('Are you absolutely certain you want to clear the entire school record? This will re-seed the default 15 instructors, daily class schedules, and past attendance histories.')) {
      setIsResetting(true);
      setResetFinished(false);
      try {
        await onResetDB();
        setResetFinished(true);
        setTimeout(() => setResetFinished(false), 2000);
      } catch (err) {
        console.error(err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const periodTimings = [
    { num: 1, label: 'Period 1', time: '08:30 AM - 09:20 AM' },
    { num: 2, label: 'Period 2', time: '09:20 AM - 10:10 AM' },
    { num: 3, label: 'Period 3', time: '10:30 AM - 11:20 AM' },
    { num: 4, label: 'Period 4', time: '11:20 AM - 12:10 PM' },
    { num: 5, label: 'Period 5', time: '01:00 PM - 01:50 PM' },
    { num: 6, label: 'Period 6', time: '01:50 PM - 02:40 PM' }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          Configure theme configurations, view period indices, or reset database parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Double Columns: Visuals & Parameters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Theme Setup */}
          <div className={`p-6 rounded-2xl border ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Sun className="h-5 w-5 text-blue-600" />
              Theme Settings
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Toggle Color Scheme</p>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  Toggle between high-contrast Slate Dark and the default soft Blue-White ERP color layouts.
                </p>
              </div>

              <button
                onClick={onToggleTheme}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 cursor-pointer transition-all ${
                  darkTheme 
                    ? 'bg-slate-850 hover:bg-slate-800 text-yellow-400 border-slate-700' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
                id="settings-theme-toggle-btn"
                type="button"
              >
                {darkTheme ? (
                  <>
                    <Sun className="h-4 w-4" /> Switch to Light theme
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" /> Switch to Dark theme
                  </>
                )}
              </button>
            </div>
          </div>

          {/* School Params Info */}
          <div className={`p-6 rounded-2xl border ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Academic ERP Configurations
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">School Name</label>
                  <input
                    type="text"
                    value="XYZ School"
                    className="block w-full px-3.5 py-2 border border-slate-250 rounded-xl text-xs text-slate-800 bg-slate-50 cursor-not-allowed font-bold"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">School Domain</label>
                  <input
                    type="text"
                    value="xyz.edu"
                    className="block w-full px-3.5 py-2 border border-slate-250 rounded-xl text-xs text-slate-800 bg-slate-50 cursor-not-allowed font-semibold"
                    disabled
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-105 rounded-xl flex gap-2 text-xs leading-normal font-semibold text-slate-550">
                <ShieldAlert className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>XYZ School's security policy restricts master parameters. Contact Central Administrator Offices for domain custom modifications.</span>
              </div>
            </div>
          </div>

          {/* Database Control Re-Seeds */}
          <div className={`p-6 rounded-2xl border ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-red-655">
              <Database className="h-5 w-5" />
              Destructive Database Actions
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-dashed border-red-200 rounded-2xl bg-red-50/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Re-seed Roster Database</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-sm">
                  Wipes out all custom edits, substitute cover logs, marked attendance records and re-syncs the system back to standard demo state.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="px-4 py-2.5 bg-red-650 text-white font-bold text-xs rounded-xl shadow-lg hover:bg-red-700 cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                {isResetting ? (
                  'Flushing...'
                ) : resetFinished ? (
                  <>
                    <Check className="h-4 w-4" /> Systems Re-seeded!
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" /> Reset DB to default seed
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right Columns: Period Timings Summary */}
        <div className="space-y-6">
          
          <div className={`p-6 rounded-2xl border ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-blue-600" />
              Configured Academic Hours
            </h3>
            
            <div className="space-y-2">
              {periodTimings.map((p) => (
                <div key={p.num} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">{p.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
