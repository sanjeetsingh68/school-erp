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
      </div>

      {/* Ratios Metrics Desk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
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
          <div className={`p-3 rounded-xl ${absentCount > 0 ? 'bg-red-100 text-red-655' : 'bg-slate-100 text-slate-400'}`}>
            <UserX2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Marked Absent today</p>
            <p className={`text-xl font-black mt-0.5 ${absentCount > 0 ? 'text-red-600' : ''}`}>{absentCount} Teachers</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Presence Ratio</p>
            <p className="text-xl font-black mt-0.5">{presenceRatio}% Roster</p>
          </div>
        </div>

      </div>

      {/* MAIN ATTENDANCE SWITCHBOARD */}
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

                  <div className="flex bg-slate-100 p-1 rounded-xl shadow-xs self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(teacher.id, 'Present')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
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
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        currentStatus === 'Absent'
                          ? 'bg-red-600 text-white shadow-xs'
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

    </div>
  );
}
