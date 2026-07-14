import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  Upload,
  Download,
  Shield,
  Clock as ClockIcon
} from 'lucide-react';
import { Teacher, DayOfWeek } from '../types';
import { parseExcelFile, generateTeacherTemplateExcel } from '../utils/excelParser';

interface TeacherManagementProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (id: string, updated: Partial<Teacher>) => void;
  onDeleteTeacher: (id: string) => void;
  onBulkImportTeachers: (teachersList: any[]) => Promise<any>;
  darkTheme: boolean;
}

export default function TeacherManagement({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onBulkImportTeachers,
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
  
  // Extended Profile Form States
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDepartment, setFormDepartment] = useState('Science');
  const [formDesignation, setFormDesignation] = useState('Teacher');
  const [formQualification, setFormQualification] = useState('B.Ed.');
  const [formExperience, setFormExperience] = useState(3);
  const [formSubjects, setFormSubjects] = useState<string[]>(['Mathematics']);
  const [formMaxDailyHours, setFormMaxDailyHours] = useState(6);
  const [formMaxWeeklyHours, setFormMaxWeeklyHours] = useState(30);

  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Ingestion State
  const [isImportingRegistry, setIsImportingRegistry] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const registryFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadRegistryTemplate = () => {
    try {
      const blob = generateTeacherTemplateExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Teacher_Registry_Bulk_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRegistryUploadClick = () => {
    if (registryFileInputRef.current) {
      registryFileInputRef.current.value = '';
      registryFileInputRef.current.click();
    }
  };

  const handleRegistryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRegistryError(null);
    setIsImportingRegistry(true);

    try {
      const rows = await parseExcelFile(file);
      const validRows = rows.filter(r => (r.TeacherName || r.name) && (r.Email || r.email));
      if (validRows.length === 0) {
        throw new Error("No valid educator rows found. Ensure 'TeacherName' and 'Email' headers are present in the Excel file.");
      }

      await onBulkImportTeachers(validRows);
    } catch (err: any) {
      setRegistryError(err.message || 'Error processing teacher spreadsheet.');
    } finally {
      setIsImportingRegistry(false);
    }
  };

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

    // new fields
    setFormEmployeeId(`EMP${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDepartment('Science');
    setFormDesignation('Teacher');
    setFormQualification('B.Ed.');
    setFormExperience(3);
    setFormSubjects(['Mathematics']);
    setFormMaxDailyHours(6);
    setFormMaxWeeklyHours(30);

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

    // new fields
    setFormEmployeeId(t.employeeId || `EMP${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDepartment(t.department || 'Science');
    setFormDesignation(t.designation || 'Teacher');
    setFormQualification(t.qualification || 'B.Ed.');
    setFormExperience(t.experience !== undefined ? t.experience : 3);
    setFormSubjects(t.subjects && t.subjects.length > 0 ? t.subjects : [t.subject]);
    setFormMaxDailyHours(t.maxDailyHours || 6);
    setFormMaxWeeklyHours(t.maxWeeklyHours || 30);

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
        status: formStatus,
        employeeId: formEmployeeId,
        department: formDepartment,
        designation: formDesignation,
        qualification: formQualification,
        experience: formExperience,
        subjects: formSubjects,
        maxDailyHours: formMaxDailyHours,
        maxWeeklyHours: formMaxWeeklyHours
      });
    } else {
      // Adding New
      const initialSchedule: any = {
        Monday: Array(8).fill(null),
        Tuesday: Array(8).fill(null),
        Wednesday: Array(8).fill(null),
        Thursday: Array(8).fill(null),
        Friday: Array(8).fill(null),
        Saturday: Array(8).fill(null)
      };

      const newTeacher: Teacher = {
        id: `t_${Date.now()}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        subject: formSubject,
        classSection: formClass,
        status: formStatus,
        schedule: initialSchedule,
        employeeId: formEmployeeId,
        department: formDepartment,
        designation: formDesignation,
        qualification: formQualification,
        experience: formExperience,
        subjects: formSubjects,
        classesAssigned: [formClass],
        sectionsAssigned: [formClass.split('-')[1] || 'A'],
        maxDailyHours: formMaxDailyHours,
        maxWeeklyHours: formMaxWeeklyHours
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

      {/* FACULTY BULK INGESTION REGISTRY PANEL */}
      <div className={`p-4.5 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              Bulk Faculty Registry Spreadsheet Ingestion
            </h3>
            <p className="text-xs text-slate-400">
              Ingest or synchronize multiple teacher profiles from an Excel or CSV file.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadRegistryTemplate}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer flex items-center gap-1 w-full sm:w-auto ${
                darkTheme ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-750'
              }`}
              title="Download standard Excel layout format"
            >
              <Download className="h-3.5 w-3.5" /> Download Template
            </button>

            <button
              onClick={handleRegistryUploadClick}
              disabled={isImportingRegistry}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 w-full sm:w-auto shrink-0"
            >
              <Upload className="h-3.5 w-3.5" /> {isImportingRegistry ? 'Importing...' : '➕ Bulk Import Registry (.xlsx)'}
            </button>
          </div>
        </div>

        {registryError && (
          <p className="text-xs text-red-600 font-bold bg-red-50 dark:bg-red-955/20 border border-red-150 dark:border-red-900 p-2.5 rounded-xl mt-3 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {registryError}
          </p>
        )}

        <input
          type="file"
          ref={registryFileInputRef}
          onChange={handleRegistryFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />
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
          <div className={`w-full max-w-2xl p-6 rounded-2xl shadow-2xl border transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold">
                {editingTeacherId ? 'Modify Faculty Educator Profile' : 'Enroll New Faculty Educator'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[65vh] overflow-y-auto pr-1">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Core Personal Info</h4>
                  
                  {/* Employee ID & Designation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formEmployeeId}
                        onChange={(e) => setFormEmployeeId(e.target.value)}
                        placeholder="e.g. EMP409"
                        className="block w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                      <input
                        type="text"
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                        placeholder="e.g. Senior Teacher"
                        className="block w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teacher Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Priyesh Shah"
                      className="block w-full px-3.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                      required
                    />
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="e.g. name@school.com"
                        className="block w-full px-3.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="e.g. +91 9000000001"
                        className="block w-full px-3.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Department, Qualification, Experience */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dept</label>
                      <input
                        type="text"
                        value={formDepartment}
                        onChange={(e) => setFormDepartment(e.target.value)}
                        placeholder="e.g. Science"
                        className="block w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Qualif.</label>
                      <input
                        type="text"
                        value={formQualification}
                        onChange={(e) => setFormQualification(e.target.value)}
                        placeholder="e.g. M.Sc, B.Ed"
                        className="block w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exp (Yrs)</label>
                      <input
                        type="number"
                        value={formExperience}
                        onChange={(e) => setFormExperience(parseInt(e.target.value, 10) || 0)}
                        className="block w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ERP Clearance Status</label>
                    <div className="flex gap-4 mt-1.5">
                      {['Active', 'On Leave', 'Suspended'].map((status) => (
                        <label key={status} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                          <input
                            type="radio"
                            name="formStatus"
                            value={status}
                            checked={formStatus === status}
                            onChange={() => setFormStatus(status as any)}
                            className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Academic Profile & Limits</h4>

                  {/* Subject & Class Charge */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Subject</label>
                      <select
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 bg-white"
                      >
                        {subjectList.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Homeroom</label>
                      <select
                        value={formClass}
                        onChange={(e) => setFormClass(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none text-xs text-slate-700 bg-white"
                      >
                        {classList.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Multi Certified Subjects List */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Certified Subjects (Multi-select)
                    </label>
                    <div className="border border-slate-200 rounded-xl p-2.5 max-h-28 overflow-y-auto bg-slate-50/50 grid grid-cols-2 gap-2">
                      {subjectList.map(subj => {
                        const isChecked = formSubjects.includes(subj);
                        return (
                          <label key={subj} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFormSubjects(formSubjects.filter(s => s !== subj));
                                } else {
                                  setFormSubjects([...formSubjects, subj]);
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            {subj}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Workload hour limits */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/20 dark:bg-slate-950 border border-blue-100/50 dark:border-slate-850 rounded-2xl">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5 text-blue-500" /> Max Daily Hours
                      </label>
                      <input
                        type="number"
                        value={formMaxDailyHours}
                        onChange={(e) => setFormMaxDailyHours(parseInt(e.target.value, 10) || 6)}
                        className="block w-full px-3 py-1 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-blue-500" /> Max Weekly Hours
                      </label>
                      <input
                        type="number"
                        value={formMaxWeeklyHours}
                        onChange={(e) => setFormMaxWeeklyHours(parseInt(e.target.value, 10) || 30)}
                        className="block w-full px-3 py-1 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-150 p-2.5 rounded-lg">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold"
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
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300 flex items-center justify-center font-bold text-sm tracking-wide shrink-0">
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

                  {/* Metadata Row */}
                  <div className="mb-3 text-[10px] text-slate-400 font-bold flex items-center gap-1.5 flex-wrap">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                      {t.employeeId || 'FAC-ERP'}
                    </span>
                    {t.qualification && (
                      <span className="bg-blue-50/50 dark:bg-slate-800/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        {t.qualification}
                      </span>
                    )}
                    {t.experience !== undefined && (
                      <span className="bg-indigo-50/50 dark:bg-slate-850 text-indigo-700 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        {t.experience} Yrs Exp
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-2 mb-4 text-xs font-semibold">
                    <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                      <BookOpen className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                      <span>Certified: {t.subjects && t.subjects.length > 0 ? t.subjects.join(', ') : t.subject}</span>
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

                <div className={`mt-3 pt-3 border-t flex flex-col gap-1 text-xs ${
                  darkTheme ? 'border-slate-800' : 'border-slate-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Weekly Workload:</span>
                    <span className={`font-mono font-bold ${
                      workload > (t.maxWeeklyHours || 30) ? 'text-red-500 font-black' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {workload} / {t.maxWeeklyHours || 30} periods
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Max Daily Limit:</span>
                    <span>{t.maxDailyHours || 6} hours/day</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
