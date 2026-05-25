import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  BookOpen, 
  Clipboard, 
  Check, 
  X,
  UserCheck2,
  AlertTriangle
} from 'lucide-react';
import { Teacher, DayOfWeek } from '../types';

interface TeacherManagementProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (id: string, updated: Partial<Teacher>) => void;
  onDeleteTeacher: (id: string) => void;
  darkTheme: boolean;
}

export default function TeacherManagement({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  darkTheme
}: TeacherManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSubject, setFormSubject] = useState('Mathematics');
  const [formClass, setFormClass] = useState('Grade 10-A');
  const [formStatus, setFormStatus] = useState<'Active' | 'On Leave' | 'Suspended'>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  // Subject and Class Lists for Options
  const subjectList = [
    'Mathematics', 'Science (Physics)', 'English Literature', 'Chemistry', 'History & Civics',
    'Computer Science', 'Biology', 'Geography', 'Art & Design',
    'Physical Education', 'English Grammar', 'Economics & Commerce', 'French Language', 'Physics'
  ];

  const classList = [
    'Grade 10-A', 'Grade 10-B', 'Grade 9-A', 'Grade 9-B', 
    'Grade 11-A', 'Grade 11-B', 'Grade 12-A', 'Grade 12-B'
  ];

  // Search and filter logic
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'All' || t.subject === filterSubject;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Unique subjects for filter list
  const uniqueSubjects = ['All', ...Array.from(new Set(teachers.map(t => t.subject)))];

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingTeacherId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormSubject('Mathematics');
    setFormClass('Grade 10-A');
    setFormStatus('Active');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacherId(t.id);
    setFormName(t.name);
    setFormEmail(t.email);
    setFormPhone(t.phone);
    setFormSubject(t.subject);
    setFormClass(t.classSection);
    setFormStatus(t.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Minor validation
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setFormError('Please fill out all mandatory fields.');
      return;
    }

    if (!formEmail.includes('@')) {
      setFormError('Please input a valid school email address.');
      return;
    }

    if (editingTeacherId) {
      // Editing
      onUpdateTeacher(editingTeacherId, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        subject: formSubject,
        classSection: formClass,
        status: formStatus
      });
    } else {
      // Adding New
      const initialSchedule: any = {
        Monday: Array(6).fill(null),
        Tuesday: Array(6).fill(null),
        Wednesday: Array(6).fill(null),
        Thursday: Array(6).fill(null),
        Friday: Array(6).fill(null)
      };

      const newTeacher: Teacher = {
        id: `t_${Date.now()}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        subject: formSubject,
        classSection: formClass,
        status: formStatus,
        schedule: initialSchedule
      };
      onAddTeacher(newTeacher);
    }

    setIsFormOpen(false);
  };

  // Workload calculation
  const calculateWorkload = (t: Teacher) => {
    let count = 0;
    Object.values(t.schedule).forEach((daySched) => {
      daySched.forEach((slot) => {
        if (slot) count++;
      });
    });
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Faculty Registry</h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Configure school educators, contact metrics, and core lesson workloads.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
          id="teacher-add-new-btn"
        >
          <Plus className="h-4 w-4" /> Enroll New Teacher
        </button>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className={`p-4 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div className="relative rounded-xl shadow-sm md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name or certified subjects..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all"
              id="faculty-search-input"
            />
          </div>

          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs selection:bg-blue-200 text-slate-700 bg-white"
            >
              <option value="All">All Subjects</option>
              {uniqueSubjects.filter(sub => sub !== 'All').map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-slate-700 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Duty</option>
              <option value="On Leave">Sabbatical/Leave</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

        </div>
      </div>

      {/* FORM MODAL COMPONENT */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl border transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">
                {editingTeacherId ? 'Modify Educator Details' : 'Enroll New Educator'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Teacher Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Priyesh Shah"
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Internal School Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. name@xyz.edu"
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mobile Contact <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 9192939495"
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 bg-white"
                  >
                    {subjectList.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Class Charge / Homeroom</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 bg-white"
                  >
                    {classList.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">ERP Clearance Status</label>
                <div className="flex gap-4">
                  {['Active', 'On Leave', 'Suspended'].map((status) => (
                    <label key={status} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <input
                        type="radio"
                        name="formStatus"
                        value={status}
                        checked={formStatus === status}
                        onChange={() => setFormStatus(status as any)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-150 p-2.5 rounded-lg">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-xs shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  {editingTeacherId ? 'Apply Edits' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHERS CARDS CATALOG */}
      {filteredTeachers.length === 0 ? (
        <div className={`p-10 text-center rounded-2xl border ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <Users className="h-10 w-10 text-slate-350 mx-auto stroke-1" />
          <p className="text-slate-400 text-sm font-semibold mt-3">No matching educators found.</p>
          <p className="text-xs text-slate-400 mt-1">Refine your search parameters or enroll a new profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((t) => {
            const workload = calculateWorkload(t);
            return (
              <div
                key={t.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all group hover:border-blue-300 dark:hover:border-slate-750 ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300 flex items-center justify-center font-bold text-sm tracking-wide">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{t.name}</h4>
                        <span className={`inline-block text-[10px] uppercase font-bold tracking-wider mt-0.5 px-2 py-0.5 rounded-md ${
                          t.status === 'Active' 
                            ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                            : t.status === 'On Leave'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-805 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${t.name} from the school roster? This is destructive.`)) {
                            onDeleteTeacher(t.id);
                          }
                        }}
                        className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-805 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 mb-4 text-xs font-semibold">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Certified: {t.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clipboard className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Home Class: {t.classSection}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{t.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{t.phone}</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-3 pt-3.5 border-t flex justify-between items-center text-xs ${
                  darkTheme ? 'border-slate-800' : 'border-slate-50'
                }`}>
                  <span className="font-bold text-slate-400">Active Workload:</span>
                  <span className={`font-black uppercase tracking-wider ${
                    workload > 12 ? 'text-blue-600' : workload > 6 ? 'text-indigo-600' : 'text-slate-500'
                  }`}>
                    {workload} periods / wk
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
