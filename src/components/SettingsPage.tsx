import React, { useState, useRef } from 'react';
import { 
  Settings, 
  RotateCcw, 
  Building2, 
  Clock, 
  Check, 
  ShieldAlert,
  Database,
  Calendar,
  Download,
  Upload,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { ERPDataState } from '../types';

interface SettingsPageProps {
  state: ERPDataState;
  darkTheme: boolean;
  onToggleTheme: () => void;
  onResetDB: () => Promise<any>;
  onUpdateSettings: (settings: any) => Promise<any>;
  onRestoreBackup: (state: any) => Promise<any>;
}

export default function SettingsPage({
  state,
  darkTheme,
  onResetDB,
  onUpdateSettings,
  onRestoreBackup
}: SettingsPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'hours' | 'holidays' | 'backup'>('info');
  const [isResetting, setIsResetting] = useState(false);
  const [resetFinished, setResetFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFinished, setSaveFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local states for settings form
  const [schoolName, setSchoolName] = useState(state.settings?.schoolInfo?.name || "Aura Academic");
  const [schoolAddress, setSchoolAddress] = useState(state.settings?.schoolInfo?.address || "77 Innovation Drive, Silicon Valley");
  const [schoolEmail, setSchoolEmail] = useState(state.settings?.schoolInfo?.email || "admin@aura-academic.com");
  const [schoolPhone, setSchoolPhone] = useState(state.settings?.schoolInfo?.phone || "+1 415 555 0199");
  const [schoolBoard, setSchoolBoard] = useState(state.settings?.schoolInfo?.board || "CBSE");

  const [academicYear, setAcademicYear] = useState(state.settings?.academicSession?.year || "2026-2027");
  const [academicTerm, setAcademicTerm] = useState(state.settings?.academicSession?.term || "Term 1");

  const [timingsStart, setTimingsStart] = useState(state.settings?.schoolTimings?.start || "08:30 AM");
  const [timingsEnd, setTimingsEnd] = useState(state.settings?.schoolTimings?.end || "02:40 PM");
  const [timingsLunchStart, setTimingsLunchStart] = useState(state.settings?.schoolTimings?.lunchStart || "12:10 PM");
  const [timingsLunchEnd, setTimingsLunchEnd] = useState(state.settings?.schoolTimings?.lunchEnd || "01:00 PM");

  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  const handleReset = async () => {
    if (window.confirm('Are you absolutely certain you want to clear the entire school record? This will re-seed the default 15 instructors, daily class schedules, and past attendance histories.')) {
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveFinished(false);
    setErrorMsg(null);
    try {
      const payload = {
        ...state.settings,
        schoolInfo: {
          name: schoolName,
          address: schoolAddress,
          email: schoolEmail,
          phone: schoolPhone,
          board: schoolBoard
        },
        academicSession: {
          year: academicYear,
          term: academicTerm
        },
        schoolTimings: {
          start: timingsStart,
          end: timingsEnd,
          lunchStart: timingsLunchStart,
          lunchEnd: timingsLunchEnd
        }
      };
      await onUpdateSettings(payload);
      setSaveFinished(true);
      setTimeout(() => setSaveFinished(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed saving academic parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    try {
      const updatedHolidays = [
        ...(state.settings?.holidayCalendar || []),
        { id: `h_${Date.now()}`, name: newHolidayName, date: newHolidayDate }
      ];
      await onUpdateSettings({
        ...state.settings,
        holidayCalendar: updatedHolidays
      });
      setNewHolidayName('');
      setNewHolidayDate('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHoliday = async (hId: string) => {
    try {
      const updatedHolidays = (state.settings?.holidayCalendar || []).filter(h => h.id !== hId);
      await onUpdateSettings({
        ...state.settings,
        holidayCalendar: updatedHolidays
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `timetable_system_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.teachers || !parsed.settings) {
          throw new Error('Invalid backup file. Missing teachers or settings nodes.');
        }
        await onRestoreBackup(parsed);
      } catch (err: any) {
        alert(`Failed to restore backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
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
    <div className="space-y-6 font-sans" id="settings-view-main">
      
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-black tracking-tight">System Settings</h2>
        <p className={`text-xs font-semibold ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          Configure core parameters, set school times, define academic holidays, or execute master backups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation panel */}
        <div className="space-y-2 lg:col-span-1">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${
              activeSubTab === 'info'
                ? 'bg-blue-600 text-white shadow-md'
                : darkTheme
                  ? 'bg-slate-900 text-slate-350 hover:bg-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
            type="button"
          >
            <Building2 className="h-4.5 w-4.5 shrink-0" />
            School Information
          </button>

          <button
            onClick={() => setActiveSubTab('hours')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${
              activeSubTab === 'hours'
                ? 'bg-blue-600 text-white shadow-md'
                : darkTheme
                  ? 'bg-slate-900 text-slate-350 hover:bg-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
            type="button"
          >
            <Clock className="h-4.5 w-4.5 shrink-0" />
            Academic Working Hours
          </button>

          <button
            onClick={() => setActiveSubTab('holidays')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${
              activeSubTab === 'holidays'
                ? 'bg-blue-600 text-white shadow-md'
                : darkTheme
                  ? 'bg-slate-900 text-slate-350 hover:bg-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
            type="button"
          >
            <Calendar className="h-4.5 w-4.5 shrink-0" />
            Holiday Calendar
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${
              activeSubTab === 'backup'
                ? 'bg-blue-600 text-white shadow-md'
                : darkTheme
                  ? 'bg-slate-900 text-slate-350 hover:bg-slate-800'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
            }`}
            type="button"
          >
            <Database className="h-4.5 w-4.5 shrink-0" />
            Data Backup & Restore
          </button>
        </div>

        {/* Content Box */}
        <div className="lg:col-span-3 space-y-6">
          
          {activeSubTab === 'info' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="font-bold text-base mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                <Building2 className="h-5 w-5 text-blue-600" />
                School Profile Parameters
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">School Name</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Affiliated Board</label>
                    <input
                      type="text"
                      value={schoolBoard}
                      onChange={(e) => setSchoolBoard(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Administrative Email</label>
                    <input
                      type="email"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Address</label>
                  <input
                    type="text"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Active Academic Year</label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Term</label>
                    <input
                      type="text"
                      value={academicTerm}
                      onChange={(e) => setAcademicTerm(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs font-bold text-red-500">{errorMsg}</p>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                    type="button"
                  >
                    {isSaving ? 'Saving parameters...' : saveFinished ? (
                      <>
                        <Check className="h-4.5 w-4.5 animate-bounce" /> Academic Info Saved!
                      </>
                    ) : (
                      'Save Academic Info'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'hours' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="font-bold text-base mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                <Clock className="h-5 w-5 text-blue-600" />
                Working Hours & Lunch Slots
              </h3>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">School Clock Start Time</label>
                    <input
                      type="text"
                      value={timingsStart}
                      onChange={(e) => setTimingsStart(e.target.value)}
                      placeholder="e.g. 08:30 AM"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">School Clock End Time</label>
                    <input
                      type="text"
                      value={timingsEnd}
                      onChange={(e) => setTimingsEnd(e.target.value)}
                      placeholder="e.g. 02:40 PM"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lunch Interval Start</label>
                    <input
                      type="text"
                      value={timingsLunchStart}
                      onChange={(e) => setTimingsLunchStart(e.target.value)}
                      placeholder="e.g. 12:10 PM"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lunch Interval End</label>
                    <input
                      type="text"
                      value={timingsLunchEnd}
                      onChange={(e) => setTimingsLunchEnd(e.target.value)}
                      placeholder="e.g. 01:00 PM"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold mb-3 uppercase tracking-wider text-slate-400">Standard Period Indices Preview</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {periodTimings.map((p) => (
                      <div key={p.num} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-xs">
                        <span className="font-bold block text-slate-800 dark:text-slate-200">{p.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold mt-1 block">{p.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-60"
                    type="button"
                  >
                    {isSaving ? 'Saving timings...' : saveFinished ? 'Timings Updated!' : 'Save Timings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'holidays' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="font-bold text-base mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                <Calendar className="h-5 w-5 text-blue-600" />
                School Holidays Calendar
              </h3>

              <div className="space-y-4">
                {/* Form to add */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Holiday Name / Description</label>
                    <input
                      type="text"
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      placeholder="e.g. Independence Day"
                      className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Holiday Date</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                        className="block w-full px-2 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none font-semibold"
                      />
                      <button
                        onClick={handleAddHoliday}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer shrink-0"
                        title="Add Holiday"
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Holiday Listing */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {(state.settings?.holidayCalendar || []).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10">No upcoming scheduled holidays defined.</p>
                  ) : (
                    (state.settings?.holidayCalendar || []).map((hol) => (
                      <div key={hol.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{hol.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold block mt-0.5">{hol.date}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteHoliday(hol.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg shrink-0 cursor-pointer"
                          title="Delete Holiday"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'backup' && (
            <div className="space-y-6">
              
              {/* Export/Import panel */}
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Database className="h-5 w-5 text-blue-600" />
                  JSON Data Management
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                  Secure backup and restoring capabilities allow school administrative users to archive all teacher workloads, active substitution registries, and leaves parameters. This produces standard serialized `.json` data blobs that can be re-imported on any deployment instance.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 mb-1.5">Backup Database</h4>
                      <p className="text-[11px] text-slate-400 leading-normal mb-4">Export the entire local database state as a single file.</p>
                    </div>
                    <button
                      onClick={handleExportBackup}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 shrink-0"
                      type="button"
                    >
                      <Download className="h-4 w-4" /> Export Backup File
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl flex flex-col justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-450 mb-1.5">Restore Database</h4>
                      <p className="text-[11px] text-slate-400 leading-normal mb-4">Import a previously exported JSON backup to overwrite current state.</p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportBackup}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5 shrink-0"
                      type="button"
                    >
                      <Upload className="h-4 w-4" /> Import Backup File
                    </button>
                  </div>
                </div>
              </div>

              {/* Destructive Database Reset */}
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-red-655">
                  <RotateCcw className="h-5 w-5 animate-spin-slow" />
                  Destructive Parameters Reset
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-dashed border-red-200 rounded-2xl bg-red-50/10">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600">Re-seed System Database</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal max-w-sm">
                      Wipes out all custom edits, substitute cover logs, marked attendance records and re-syncs the system back to standard demo seed state.
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
          )}

        </div>

      </div>

    </div>
  );
}
