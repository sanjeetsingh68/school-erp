import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Sparkles, 
  Clock, 
  User, 
  Briefcase, 
  Tag, 
  Send,
  Loader2,
  ListRestart
} from 'lucide-react';
import { ERPDataState, UserSession, DayOfWeek, ExtraClassRequest } from '../types';
import { apiFetch } from '../lib/api';

interface ExtraClassRequestsProps {
  state: ERPDataState;
  session: UserSession;
  selectedDate: string;
  darkTheme: boolean;
  onUpdateState: (newState: ERPDataState) => void;
}

const REQUEST_TYPES = [
  'Revision Class',
  'Doubt Clearing',
  'Remedial Class',
  'Extra Practice',
  'Test Preparation',
  'Competition Coaching',
  'Olympiad Training',
  'Lab Session',
  'Project Guidance',
  'Custom'
] as const;

export default function ExtraClassRequests({
  state,
  session,
  selectedDate,
  darkTheme,
  onUpdateState
}: ExtraClassRequestsProps) {
  const currentTeacher = state.teachers.find(t => t.id === session.userId);
  const teacherSubject = currentTeacher?.subject || 'Mathematics';

  // Form States
  const [date, setDate] = useState(selectedDate);
  const [classGrade, setClassGrade] = useState('Grade 10');
  const [classSection, setClassSection] = useState('A');
  const [periodIndex, setPeriodIndex] = useState(2); // Default Period 1 (index 2)
  const [requestType, setRequestType] = useState<typeof REQUEST_TYPES[number]>('Revision Class');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High'>('Normal');
  const [customTime, setCustomTime] = useState('');
  const [customSubject, setCustomSubject] = useState(teacherSubject);
  const [schedulingType, setSchedulingType] = useState<'exact' | 'week' | 'flexible'>('exact');
  const [preferredWeek, setPreferredWeek] = useState(selectedDate);

  // Sync customSubject with profile loaded
  useEffect(() => {
    if (teacherSubject) {
      setCustomSubject(teacherSubject);
    }
  }, [teacherSubject]);

  // AI Validation States
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    reason?: string;
    suggestions?: { day: DayOfWeek; periodIndex: number; label: string; date: string }[];
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Combined ClassSection (e.g. "Grade 10-A")
  const fullClassSection = `${classGrade}-${classSection}`;

  // Get active teacher profile info
  const teacherName = session.name;
  const employeeId = currentTeacher?.employeeId || `EMP0${session.userId.substring(1)}`;
  const department = currentTeacher?.department || 'General';

  // Find all requests submitted by this teacher
  const teacherRequests = state.extraClassRequests.filter(req => req.teacherId === session.userId);

  // Auto-run validation when form key fields change
  useEffect(() => {
    if (session.userId) {
      if (schedulingType === 'exact' && date) {
        validateFormFields();
      } else {
        setValidationResult({
          valid: true,
          reason: schedulingType === 'week' 
            ? 'Flexible week matching. AI will automatically monitor and schedule in vacant slots during the selected week.'
            : 'Fully flexible matching. Request queued in AI Pool to auto-schedule on any empty vacant periods.'
        });
      }
    }
  }, [date, classGrade, classSection, periodIndex, schedulingType, preferredWeek]);

  const validateFormFields = async () => {
    setIsValidating(true);
    setValidationResult(null);
    setErrorMsg('');
    try {
      const resp = await apiFetch('/api/extra-classes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: session.userId,
          classSection: fullClassSection,
          date,
          periodIndex
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setValidationResult(data);
      } else {
        setValidationResult({ valid: false, reason: data.reason || 'Failed to run AI validations.' });
      }
    } catch (err) {
      console.error('Validation fetch error', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const preferredPeriodLabel = state.settings.scheduleSlots?.[periodIndex]?.name || `Period ${periodIndex - 1}`;
    const isExact = schedulingType === 'exact';
    const isWeek = schedulingType === 'week';

    try {
      const resp = await apiFetch('/api/extra-classes/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: session.userId,
          classSection: fullClassSection,
          date: isExact ? date : '',
          periodIndex: isExact ? periodIndex : 0,
          requestType,
          priority,
          reason,
          preferredPeriod: isExact ? preferredPeriodLabel : 'Flexible',
          preferredTime: isExact ? (customTime || state.settings.scheduleSlots?.[periodIndex]?.start || '') : 'Flexible',
          preferredWeek: isWeek ? preferredWeek : '',
          subject: customSubject
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.reason || data.error || 'Conflict detected! Your extra class request has timetable collisions.');
        if (data.suggestions) {
          setValidationResult({
            valid: false,
            reason: data.reason,
            suggestions: data.suggestions
          });
        }
      } else {
        setSuccessMsg('Your request has been successfully saved and entered into the AI Substitute Request Pool for automatic matching!');
        onUpdateState(data.state);
        // Clear form fields that are optional
        setReason('');
        setCustomTime('');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to school server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyAlternative = (alt: { date: string; periodIndex: number }) => {
    setDate(alt.date);
    setPeriodIndex(alt.periodIndex);
    setValidationResult(null);
    setSuccessMsg('Form updated with the suggested collision-free alternative slot!');
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#F59E0B] animate-pulse" />
            Extra Class Requests Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Volunteer to schedule additional doubt clearing, remedial, or revision sessions. The AI automatically validates timetable boundaries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-3 mb-5 flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#F59E0B]" />
              Schedule a Session
            </h3>

            {successMsg && (
              <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-950 text-xs flex gap-3 items-start">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Success!</span> {successMsg}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-950 text-xs flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Timetable Conflict:</span> {errorMsg}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Profile Readonly block */}
              <div className={`p-4 rounded-xl grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-4 ${
                darkTheme ? 'bg-slate-950/60' : 'bg-slate-50'
              }`}>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 font-bold font-mono uppercase tracking-wider text-[9px]">Teacher</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{teacherName}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 font-bold font-mono uppercase tracking-wider text-[9px]">Employee ID</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{employeeId}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 font-bold font-mono uppercase tracking-wider text-[9px]">Department / Subject</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{department} ({teacherSubject})</p>
                </div>
              </div>

              {/* Form Row 1: Target Class & Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Class / Grade</label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                      darkTheme
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                    }`}
                  >
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Section</label>
                  <select
                    value={classSection}
                    onChange={(e) => setClassSection(e.target.value)}
                    className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                      darkTheme
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                    }`}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              {/* Customizable Subject Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                    darkTheme
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                      : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                  }`}
                  required
                />
              </div>

              {/* Scheduling Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Scheduling Constraint Preference (Optional)</label>
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-950">
                  {(['exact', 'week', 'flexible'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSchedulingType(type)}
                      className={`text-[11px] font-bold py-2 rounded-lg transition-all cursor-pointer ${
                        schedulingType === type
                          ? 'bg-white dark:bg-slate-850 text-[#F59E0B] dark:text-amber-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {type === 'exact' ? 'Exact Date' : type === 'week' ? 'Preferred Week' : 'Fully Flexible'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Row 2: Date & Period Selection */}
              {schedulingType === 'exact' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Preferred Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border transition-all ${
                          darkTheme
                            ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                            : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                        }`}
                        required
                      />
                      <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Preferred Period</label>
                    <select
                      value={periodIndex}
                      onChange={(e) => setPeriodIndex(parseInt(e.target.value, 10))}
                      className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                        darkTheme
                          ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                      }`}
                    >
                      {state.settings.scheduleSlots?.map((slot, idx) => (
                        <option key={slot.id} value={idx}>
                          {slot.name} ({slot.start} - {slot.end}) [{slot.type.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {schedulingType === 'week' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Preferred Week (Start Date)</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={preferredWeek}
                      onChange={(e) => setPreferredWeek(e.target.value)}
                      className={`w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border transition-all ${
                        darkTheme
                          ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                      }`}
                      required
                    />
                    <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">The AI will continuously search and auto-match this request into any vacant periods during the week containing this date.</p>
                </div>
              )}

              {schedulingType === 'flexible' && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  darkTheme ? 'bg-amber-955/20 border-amber-900/30 text-amber-300' : 'bg-[#FFF8F1] border-[#FED7AA] text-amber-700'
                }`}>
                  <Sparkles className="h-4.5 w-4.5 shrink-0 text-[#F59E0B] animate-pulse" />
                  <div>
                    <span className="font-bold">Fully Autonomous Matching Mode Active</span>
                    <p className="text-[10px] leading-relaxed mt-0.5 text-slate-500 dark:text-slate-400 font-medium">No date constraints. This extra class request will enter the permanent AI Pool. The AI Engine will auto-match and instantly schedule this class into the very first vacant session that matches Grade and Subject.</p>
                  </div>
                </div>
              )}

              {/* Optional Preferred Time or Time Override */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Preferred Time <span className="text-[10px] text-slate-400 font-normal">(Optional, overrides period default)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:15 AM"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                    darkTheme
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                      : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                  }`}
                />
              </div>

              {/* Request Type and Priority Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Request Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value as any)}
                    className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                      darkTheme
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                    }`}
                  >
                    {REQUEST_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Priority</label>
                  <div className="flex gap-4 items-center mt-2.5">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value="Normal"
                        checked={priority === 'Normal'}
                        onChange={() => setPriority('Normal')}
                        className="text-[#F59E0B] focus:ring-[#F59E0B]"
                      />
                      Normal
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-red-500">
                      <input
                        type="radio"
                        name="priority"
                        value="High"
                        checked={priority === 'High'}
                        onChange={() => setPriority('High')}
                        className="text-red-600 focus:ring-red-500"
                      />
                      High Priority
                    </label>
                  </div>
                </div>
              </div>

              {/* Reason Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Reason / Topic Cover <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Explain why you need this extra class (e.g., Olympiad practice, revision of Chapter 4)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border transition-all ${
                    darkTheme
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#F59E0B]'
                      : 'bg-white border-slate-200 text-slate-800 focus:border-[#F59E0B]'
                  }`}
                />
              </div>

              {/* Validation Status Box */}
              <div className={`p-4 rounded-xl border ${
                isValidating 
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
                  : validationResult?.valid
                    ? 'border-emerald-200 dark:border-emerald-950/50 bg-emerald-500/5 dark:bg-emerald-950/10'
                    : validationResult?.valid === false
                      ? 'border-rose-200 dark:border-rose-950/50 bg-rose-500/5 dark:bg-rose-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
              }`}>
                {isValidating ? (
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#F59E0B]" />
                    <span>AI validating timetable slot & workloads...</span>
                  </div>
                ) : validationResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <>
                           <CheckCircle className="h-4 w-4 text-emerald-500" />
                           <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">AI Validation Passed: Collision-Free Slot!</span>
                        </>
                      ) : (
                        <>
                           <AlertCircle className="h-4 w-4 text-rose-500" />
                           <span className="text-xs font-bold text-rose-600 dark:text-rose-400">AI Collision Warning!</span>
                        </>
                      )}
                    </div>
                    {validationResult.reason && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6 font-medium">
                        {validationResult.reason}
                      </p>
                    )}

                    {/* Suggestions Box */}
                    {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                      <div className="mt-2.5 pl-6 space-y-2">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#F59E0B] dark:text-amber-400 font-mono">Suggested Alternatives:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {validationResult.suggestions.map((alt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleApplyAlternative(alt)}
                              className={`flex items-center justify-between text-[11px] font-bold px-3 py-2 rounded-lg border transition-all text-left cursor-pointer ${
                                darkTheme
                                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-amber-955/40 hover:border-amber-900'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-[#FFF8F1] hover:border-[#FED7AA]'
                              }`}
                            >
                              <span className="truncate">{alt.date} ({alt.label})</span>
                              <ListRestart className="h-3.5 w-3.5 text-[#F59E0B] shrink-0 ml-1.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-2">Select a date, class, and period to run instant AI conflict evaluations.</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isValidating || (validationResult !== null && !validationResult.valid)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isSubmitting || isValidating || (validationResult !== null && !validationResult.valid)
                    ? 'bg-slate-100 dark:bg-slate-850 text-slate-400 cursor-not-allowed border dark:border-slate-800'
                    : 'bg-[#F59E0B] hover:bg-[#FBBF24] text-white cursor-pointer shadow-lg shadow-amber-500/10'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Extra Class Request
                  </>
                )}
              </button>
              
            </form>
          </div>
        </div>

        {/* Right Requests History Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-2xl border shadow-sm transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-3 mb-5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              Your Request History
            </h3>

            {teacherRequests.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-3">You haven't submitted any extra class requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {teacherRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border text-xs relative ${
                      darkTheme ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    {/* Priority Badge */}
                    {req.priority === 'High' && (
                      <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                        HIGH
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                        req.status === 'Approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                          : req.status === 'Rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] font-mono">{req.submittedOn || 'Just now'}</span>
                    </div>

                    <div className="space-y-1.5 mt-2.5">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{req.requestType}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium pl-5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{req.date} ({req.day})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium pl-5">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{req.preferredPeriod || `Period ${req.periodIndex + 1}`} ({req.preferredTime || 'Standard Time'})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium pl-5">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Class Section: <strong className="text-[#F59E0B]">{req.classSection}</strong></span>
                      </div>
                      {req.reason && (
                        <div className="mt-3 p-2.5 rounded bg-white dark:bg-slate-900 border dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                          "{req.reason}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
