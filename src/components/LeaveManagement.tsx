import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Clock, 
  User, 
  PlusCircle, 
  ArrowRight, 
  History, 
  MessageSquare,
  Sparkles,
  ClipboardList,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'motion/react';
import { ERPDataState, UserSession, LeaveRequest } from '../types';

interface LeaveManagementProps {
  state: ERPDataState;
  session: UserSession;
  onSubmitLeave: (payload: {
    teacherId: string;
    startDate: string;
    endDate: string;
    leaveType: LeaveRequest['leaveType'];
    reason: string;
  }) => Promise<void>;
  onReviewLeave: (id: string, status: 'Approved' | 'Rejected', comment: string) => Promise<void>;
  darkTheme: boolean;
}

export default function LeaveManagement({
  state,
  session,
  onSubmitLeave,
  onReviewLeave,
  darkTheme
}: LeaveManagementProps) {
  const isAdmin = session.role === 'admin';
  const leaves = state.leaveRequests || [];
  
  // Tab within leave management
  const [activeSubTab, setActiveSubTab] = useState<'apply' | 'history'>(isAdmin ? 'history' : 'apply');

  // Teacher Form State
  const [startDate, setStartDate] = useState('2026-05-26');
  const [endDate, setEndDate] = useState('2026-05-26');
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Sick Leave');
  const [reason, setReason] = useState('');
  
  // UI States
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Administrative Review Comments State
  const [reviewComments, setReviewComments] = useState<{ [key: string]: string }>({});
  const [reviewSubmitting, setReviewSubmitting] = useState<string | null>(null);

  // Filter leaves
  const teacherLeaves = leaves.filter(lv => lv.teacherId === session.userId);
  const pendingLeaves = leaves.filter(lv => lv.status === 'Pending');
  const processedLeaves = leaves.filter(lv => lv.status !== 'Pending');

  // Handle Apply Leave Submit
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormIsSubmitting(true);
    setFormSuccessMessage(null);
    setFormErrorMessage(null);

    if (new Date(startDate) > new Date(endDate)) {
      setFormErrorMessage('Error: Leave Start Date cannot be after End Date!');
      setFormIsSubmitting(false);
      return;
    }

    try {
      await onSubmitLeave({
        teacherId: session.userId,
        startDate,
        endDate,
        leaveType,
        reason
      });
      setFormSuccessMessage(`Success! Your request for ${leaveType} has been submitted to the Principal Office.`);
      // Reset reason
      setReason('');
      // Delay transition to history
      setTimeout(() => {
        setActiveSubTab('history');
        setFormSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setFormErrorMessage(err.message || 'Failed to submit leave request');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // Helper to preclose date choices
  const applyQuickDate = (offset: number) => {
    const d = new Date('2026-05-25'); // Anchored UTC project focus Date
    d.setDate(d.getDate() + offset);
    const formatted = d.toISOString().split('T')[0];
    setStartDate(formatted);
    setEndDate(formatted);
  };

  // Handle Administrative Decisions
  const handleReviewAction = async (id: string, status: 'Approved' | 'Rejected') => {
    setReviewSubmitting(id);
    const comment = reviewComments[id] || '';
    try {
      await onReviewLeave(id, status, comment);
      // Clear specific comments field from dictionary
      setReviewComments(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error(err);
      alert('Could not update leave request');
    } finally {
      setReviewSubmitting(null);
    }
  };

  // Calculate Duration in Days
  const getDaysCount = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 Day' : `${diffDays} Days`;
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            {isAdmin ? 'Faculty Leave Management' : 'Apply For Leave'}
          </h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAdmin 
              ? 'Authorize staff leave applications, approve scheduling slots, & automatically trigger substitute requests.' 
              : 'Submit applications to the administrator and track real-time approval status.'}
          </p>
        </div>

        {/* Action controllers */}
        {!isAdmin && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveSubTab('apply')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeSubTab === 'apply'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Apply Leave
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeSubTab === 'history'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              My History ({teacherLeaves.length})
            </button>
          </div>
        )}
      </div>

      {isAdmin ? (
        /* ==================== PRINCIPAL/ADMIN VIEW ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Action Area: Pending Requests */}
          <div className="lg:col-span-2 space-y-5">
            <div className={`p-5 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4.5">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-amber-500" />
                  Pending Requests ({pendingLeaves.length})
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-200/30">
                  Awaiting Decision
                </span>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-sm font-semibold">Excellent! No pending leaves to process.</p>
                  <p className="text-xs">All classes and faculty schedules are aligned stable.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingLeaves.map((leave, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={leave.id}
                      className={`p-4 rounded-xl border transition-all ${
                        darkTheme 
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' 
                          : 'bg-slate-50/50 border-slate-150 hover:border-slate-200'
                      }`}
                      id={`leave-pending-${leave.id}`}
                    >
                      {/* Request Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-sm">
                            {leave.teacherName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {leave.teacherName}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium">
                              {leave.subject} Faculty
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-center">
                          <span className="text-[11px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-100/30">
                            {leave.leaveType}
                          </span>
                        </div>
                      </div>

                      {/* Request Details */}
                      <div className="py-3 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 font-mono font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            <span>Dates:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {leave.startDate}
                            </span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {leave.endDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black uppercase text-blue-600">
                            Duration: {getDaysCount(leave.startDate, leave.endDate)}
                          </div>
                        </div>

                        {leave.reason && (
                          <div className="p-3 bg-slate-100/65 dark:bg-slate-900/60 rounded-lg text-xs leading-relaxed max-w-2xl border border-slate-200/20">
                            <span className="font-bold text-slate-400 block mb-0.5 text-[10px] uppercase font-mono">Reason:</span>
                            "{leave.reason}"
                          </div>
                        )}
                      </div>

                      {/* Review Actions */}
                      <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="flex-1 max-w-md relative">
                          <input 
                            type="text"
                            placeholder="Add memo (e.g. substitutes mapped, recover on Sat)"
                            value={reviewComments[leave.id] || ''}
                            onChange={(e) => setReviewComments(prev => ({ ...prev, [leave.id]: e.target.value }))}
                            disabled={reviewSubmitting === leave.id}
                            className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            id={`leave-comment-${leave.id}`}
                          />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            onClick={() => handleReviewAction(leave.id, 'Rejected')}
                            disabled={reviewSubmitting !== null}
                            className="px-3.5 py-1.8 border border-red-250 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                            id={`leave-reject-btn-${leave.id}`}
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => handleReviewAction(leave.id, 'Approved')}
                            disabled={reviewSubmitting !== null}
                            className="px-4 py-1.8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1"
                            id={`leave-approve-btn-${leave.id}`}
                          >
                            <Check className="h-3.5 w-3.5" /> Approve Leave
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area: processed leaves registry */}
          <div className="space-y-5">
            <div className={`p-5 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-500" />
                Registry History ({processedLeaves.length})
              </h3>

              {processedLeaves.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No historical entries registered yet.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {processedLeaves.map((leave) => {
                    const approved = leave.status === 'Approved';
                    return (
                      <div 
                        key={leave.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          darkTheme ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-55/30 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {leave.teacherName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-0.5 ${
                            approved 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' 
                              : 'bg-red-50 dark:bg-red-950/30 text-red-600'
                          }`}>
                            {approved ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {leave.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono">
                          {leave.leaveType} ({leave.startDate} to {leave.endDate})
                        </div>

                        {leave.reviewComment && (
                          <div className="text-[11px] bg-slate-100 dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-200/30 text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-400 mr-1 uppercase text-[9px] font-mono">Comment:</span>
                            "{leave.reviewComment}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ==================== TEACHER INTERFACE ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: apply leave form */}
          {activeSubTab === 'apply' ? (
            <div className="lg:col-span-7">
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h3 className="text-base font-bold mb-5 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-blue-600" />
                  Fill Application Details
                </h3>

                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {formSuccessMessage && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 px-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {formSuccessMessage}
                    </div>
                  )}

                  {formErrorMessage && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 px-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {formErrorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                        Leave Type
                      </label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as LeaveRequest['leaveType'])}
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="leave-type-select"
                      >
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Maternity Leave">Maternity Leave</option>
                        <option value="Duty Leave">Duty Leave</option>
                        <option value="Other">Other Category</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                        Leave Category Guide
                      </label>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/20 text-[11px] text-slate-400 leading-normal">
                        Casual leaves must be submitted 24h prior. Sick leaves require medical log validation upon completion.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="leave-start-date"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="leave-end-date"
                      />
                    </div>
                  </div>

                  {/* Date Quick Fills to simplify user interaction */}
                  <div>
                    <span className="text-[10px] font-bold uppercase font-mono text-slate-400 mr-2">Quick Date Fills:</span>
                    <span className="inline-flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => applyQuickDate(1)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                      >
                        Tomorrow (May 26)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDate(2)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                      >
                        Wednesday (May 27)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDate(3)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 transition-colors"
                      >
                        Thursday (May 28)
                      </button>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                      Applicant's Reason & Explanatory Memo
                    </label>
                    <textarea
                      placeholder="Specify your medical condition, family emergencies, or duty objectives in detail."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={4}
                      className="block w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed"
                      id="leave-reason-textarea"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={formIsSubmitting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer tracking-wider shadow-lg shadow-blue-600/10 flex items-center gap-1.5 active:scale-95 transition-all"
                      id="leave-submit-button"
                    >
                      {formIsSubmitting ? 'Submitting...' : 'Transmit Request to Principal'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Teacher history view is loaded when SubTab === 'history' */
            <div className="lg:col-span-8">
              <div className={`p-5 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h3 className="text-base font-bold mb-4.5 flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-505" />
                  Your Historical Leave Log ({teacherLeaves.length})
                </h3>

                {teacherLeaves.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                    You have not submitted any leave applications.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teacherLeaves.map((leave) => {
                      const isPending = leave.status === 'Pending';
                      const isApproved = leave.status === 'Approved';
                      return (
                        <div 
                          key={leave.id}
                          className={`p-4 rounded-xl border ${
                            darkTheme ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50/40 border-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2.5 mb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                  {leave.leaveType}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Filed on {new Date(leave.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="mt-2 text-xs font-mono font-black flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                <span>{leave.startDate}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span>{leave.endDate}</span>
                                <span className="ml-1 px-1.5 bg-blue-50 dark:bg-blue-900/30 text-[10px] text-blue-600 rounded">
                                  {getDaysCount(leave.startDate, leave.endDate)}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-0.5 border ${
                                isPending 
                                  ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 border-amber-200/30' 
                                  : isApproved 
                                    ? 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 border-emerald-250/30'
                                    : 'bg-red-50 dark:bg-red-955/20 text-red-650 border-red-200/30'
                              }`}>
                                {isPending && <Clock className="h-3 w-3" />}
                                {isApproved && <CheckCircle2 className="h-3 w-3" />}
                                {!isPending && !isApproved && <XCircle className="h-3 w-3" />}
                                {leave.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                            <span className="font-extrabold font-mono text-slate-400 block text-[9px] uppercase">Your Reason Description:</span>
                            "{leave.reason}"
                          </div>

                          {leave.reviewComment && (
                            <div className="text-xs bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/40 text-slate-655 dark:text-slate-300 flex items-start gap-2">
                              <MessageSquare className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold font-mono text-slate-400 uppercase text-[9px] block">Principal Response Comment:</span>
                                "{leave.reviewComment}"
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Column (General info on leaves / instructions) */}
          <div className="lg:col-span-4 space-y-5">
            <div className={`p-5 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3.5 font-mono flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Key Leave Framework
              </h3>

              <ul className="text-xs space-y-3 leading-relaxed text-slate-550 list-disc pl-4 select-none">
                <li>Approved leaves automatically label your profile as <span className="font-semibold text-amber-600">On Leave</span> on the administrative dashboard for those dates.</li>
                <li>Your timetable slots will automatically flag for surrogate substitute distribution.</li>
                <li>Ensure backup materials for sessions are attached in your lesson plans.</li>
                <li>For prolonged medical absences exceeding 3 calendar days, formal documentation is required.</li>
              </ul>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
