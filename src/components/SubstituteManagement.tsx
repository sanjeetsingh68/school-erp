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
  Info
} from 'lucide-react';
import { Teacher, ERPDataState, DayOfWeek } from '../types';

interface SubstituteManagementProps {
  state: ERPDataState;
  selectedDate: string; // YYYY-MM-DD
  onAssignSubstitute: (payload: { date: string; periodIndex: number; absentTeacherId: string; substituteTeacherId: string }) => Promise<any>;
  darkTheme: boolean;
}

export default function SubstituteManagement({
  state,
  selectedDate,
  onAssignSubstitute,
  darkTheme
}: SubstituteManagementProps) {
  
  // Calculate current weekday DayOfWeek
  const checkDate = new Date(selectedDate);
  const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  // Active status lists
  const [activeCoveragePeriod, setActiveCoveragePeriod] = useState<{
    teacherId: string;
    periodIndex: number;
    classSection: string;
    subject: string;
  } | null>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const timings = [
    '08:30 AM - 09:20 AM',
    '09:20 AM - 10:10 AM',
    '10:30 AM - 11:20 AM',
    '11:20 AM - 12:10 PM',
    '01:00 PM - 01:50 PM',
    '01:50 PM - 02:40 PM'
  ];

  // Retrieve absent educators marked on selectedDate
  const todaysAttendance = state.attendance.filter(att => att.date === selectedDate);
  const absentTeacherRecords = todaysAttendance.filter(att => att.status === 'Absent');

  // Trigger recommendation alg in backend
  const fetchSmartSuggestions = async (absentId: string, periodIdx: number) => {
    setIsLoadingSuggestions(true);
    setFormError(null);
    setSelectedSubstituteId(null);
    try {
      const resp = await fetch(`/api/substitutes/suggest?absentTeacherId=${absentId}&date=${selectedDate}&periodIndex=${periodIdx}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed suggestions lookup');
      
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setFormError(err.message || 'Error executing suggestion query.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

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

  // Submit assign
  const handleAssignConfirm = async () => {
    if (!activeCoveragePeriod || !selectedSubstituteId) {
      setFormError('Please select a substitute Educator from the suggestions list.');
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);
      await onAssignSubstitute({
        date: selectedDate,
        periodIndex: activeCoveragePeriod.periodIndex,
        absentTeacherId: activeCoveragePeriod.teacherId,
        substituteTeacherId: selectedSubstituteId
      });

      setFormSuccess('Substitute assigned and timetable updated in real-time!');
      setTimeout(() => {
        setActiveCoveragePeriod(null);
        setSuggestions([]);
        setFormSuccess(null);
      }, 1500);

    } catch (err: any) {
      setFormError(err.message || 'Failed to register assignment.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Substitute Scheduler Node</h2>
        <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
          Intelligent educator cover system. Suggests present, available faculty sorted by minimum alternate coverage workloads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Active Coverages List */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-red-500 rounded-full"></span>
              Classes Needing Cover Today • {selectedDate} ({dayName})
            </h3>

            {absentTeacherRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle className="h-10 w-10 text-emerald-500 animate-bounce" />
                <p className="font-semibold text-slate-750">Roster Attendance is clear</p>
                <p className="text-xs">No educators are marked absent. No replacement scheduling required today.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {absentTeacherRecords.map((attRec) => {
                  const absentTeacher = state.teachers.find(t => t.id === attRec.teacherId);
                  if (!absentTeacher) return null;

                  // Find active schedule periods today
                  const dailyLessons = absentTeacher.schedule[dayName] || [];

                  return (
                    <div key={attRec.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3.5">
                      <div className="flex justify-between items-start pb-2 border-b dark:border-slate-805 leading-normal">
                        <div>
                          <h4 className="font-bold text-sm text-red-655">{absentTeacher.name} (Absent Today)</h4>
                          <p className="text-xs text-slate-400 font-medium">{absentTeacher.subject} Advisor Office</p>
                        </div>
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
                                if (!matchedAssignment) {
                                  handleSelectClassToSubstitute(absentTeacher.id, pIdx, slot.classSection, slot.subject);
                                }
                              }}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
                                matchedAssignment 
                                  ? 'bg-emerald-50/20 border-emerald-150 cursor-not-allowed'
                                  : isActiveSelected
                                    ? 'bg-blue-50/25 border-blue-400 ring-1 ring-blue-500'
                                    : 'bg-slate-50/50 hover:border-blue-400 dark:bg-slate-950/20'
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                                  <span>Period {pIdx + 1} ({timings[pIdx].split('-')[0].trim()})</span>
                                  {matchedAssignment ? (
                                    <span className="text-emerald-600 font-bold flex items-center gap-0.5 uppercase tracking-wide">
                                      <Check className="h-3 w-3" /> Cover Assigned
                                    </span>
                                  ) : (
                                    <span className="text-red-500 font-bold uppercase tracking-wide">Needs Cover</span>
                                  )}
                                </div>
                                <h5 className="font-bold text-xs mt-1.5">{slot.classSection} • {slot.subject}</h5>
                              </div>

                              {matchedAssignment ? (
                                <p className="text-[10px] text-emerald-700 font-bold truncate">
                                  Substitute: {matchedAssignment.substituteTeacherName}
                                </p>
                              ) : (
                                <p className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                                  Click to run smart check <ChevronRight className="h-3 w-3" />
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
            <h3 className="font-bold text-base mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              Recommended Substitute
            </h3>

            {activeCoveragePeriod ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-105 rounded-xl leading-normal text-xs">
                  <p className="font-bold text-blue-700 dark:text-blue-300">Targeting Class Coverage:</p>
                  <p className="mt-1"><span className="font-bold">Subject:</span> {activeCoveragePeriod.subject}</p>
                  <p><span className="font-bold">Class Section:</span> {activeCoveragePeriod.classSection}</p>
                  <p><span className="font-bold">Period Index:</span> Period {activeCoveragePeriod.periodIndex + 1} ({timings[activeCoveragePeriod.periodIndex]})</p>
                </div>

                {isLoadingSuggestions ? (
                  <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <p className="font-semibold">Calculating ideal workloads...</p>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="py-8 text-center text-red-600 text-xs bg-red-50/50 border border-red-100 rounded-xl leading-snug">
                    <AlertTriangle className="h-4 w-4 shrink-0 mx-auto mb-2 text-red-500 animate-pulse" />
                    No active educator was found free during this period index today. All present teachers are fully occupied with schedules.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimized Recommendations:</p>
                    
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {suggestions.map((item) => (
                        <div
                          key={item.teacherId}
                          onClick={() => setSelectedSubstituteId(item.teacherId)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-center ${
                            selectedSubstituteId === item.teacherId
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'bg-slate-50 dark:bg-slate-950 hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-xs">{item.name}</p>
                            <p className="text-[10px] opacity-75 mt-0.5 truncate">{item.subject}</p>
                            
                            {/* Workload badges */}
                            <div className="flex gap-1.5 mt-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                selectedSubstituteId === item.teacherId 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-blue-50 text-blue-700 dark:bg-slate-800'
                              }`}>
                                Sub covers taken: {item.substitutionsCount}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                selectedSubstituteId === item.teacherId 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}>
                                Load today: {item.busyPeriodsToday}
                              </span>
                            </div>
                          </div>

                          {selectedSubstituteId === item.teacherId ? (
                            <Check className="h-4 w-4 text-white shrink-0" />
                          ) : item.subjectMatch ? (
                            <span className="text-[9px] bg-green-100 text-green-800 dark:bg-green-950/40 px-2 py-1 rounded font-black uppercase tracking-wider select-none h-5 flex items-center">
                              Dept Match
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t dark:border-slate-800 space-y-2">
                      {formError && (
                        <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-150 p-2 text-center rounded-lg">
                          {formError}
                        </p>
                      )}
                      
                      {formSuccess && (
                        <p className="text-xs text-green-700 font-bold bg-green-50 border border-green-150 p-2 text-center rounded-lg">
                          {formSuccess}
                        </p>
                      )}

                      <button
                        onClick={handleAssignConfirm}
                        className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="h-4 w-4" /> Finalize Substitute Assignment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                <Info className="h-6 w-6 text-slate-350" />
                <p>No active slot selected for cover.</p>
                <p className="text-[10px]">Select any of the "Needs Cover" cells on the left menu.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
