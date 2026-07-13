import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  School, 
  GraduationCap, 
  TrendingUp, 
  Filter, 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  Activity
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  grade: string;
  section: string;
  guardianName: string;
  phone: string;
  email: string;
  attendancePct: number;
  status: 'Active' | 'Inactive' | 'Suspended';
  enrolledDate: string;
  gpa: number;
}

interface StudentManagementProps {
  darkTheme: boolean;
}

const SEED_STUDENTS: Student[] = [
  { id: 's1', name: 'Aarav Mehta', rollNo: '101', grade: 'Grade 10', section: 'A', guardianName: 'Rajesh Mehta', phone: '+91 98765 43210', email: 'aarav.mehta@xyz.edu', attendancePct: 96.8, status: 'Active', enrolledDate: '2024-06-01', gpa: 3.8 },
  { id: 's2', name: 'Diya Sharma', rollNo: '102', grade: 'Grade 10', section: 'A', guardianName: 'Sunita Sharma', phone: '+91 98765 43211', email: 'diya.sharma@xyz.edu', attendancePct: 98.2, status: 'Active', enrolledDate: '2024-06-01', gpa: 3.9 },
  { id: 's3', name: 'Kabir Malhotra', rollNo: '103', grade: 'Grade 10', section: 'B', guardianName: 'Vikas Malhotra', phone: '+91 98765 43212', email: 'kabir.m@xyz.edu', attendancePct: 94.5, status: 'Active', enrolledDate: '2024-06-01', gpa: 3.2 },
  { id: 's4', name: 'Ananya Iyer', rollNo: '104', grade: 'Grade 9', section: 'A', guardianName: 'Suresh Iyer', phone: '+91 98765 43213', email: 'ananya.iyer@xyz.edu', attendancePct: 95.0, status: 'Active', enrolledDate: '2025-06-01', gpa: 3.7 },
  { id: 's5', name: 'Rohan Joshi', rollNo: '105', grade: 'Grade 9', section: 'B', guardianName: 'Deepak Joshi', phone: '+91 98765 43214', email: 'rohan.joshi@xyz.edu', attendancePct: 89.4, status: 'Active', enrolledDate: '2025-06-01', gpa: 2.8 },
  { id: 's6', name: 'Meera Sen', rollNo: '106', grade: 'Grade 11', section: 'A', guardianName: 'Amit Sen', phone: '+91 98765 43215', email: 'meera.sen@xyz.edu', attendancePct: 97.5, status: 'Active', enrolledDate: '2023-06-01', gpa: 3.65 },
  { id: 's7', name: 'Dev Patel', rollNo: '107', grade: 'Grade 11', section: 'B', guardianName: 'Kiran Patel', phone: '+91 98765 43216', email: 'dev.patel@xyz.edu', attendancePct: 91.2, status: 'Active', enrolledDate: '2023-06-01', gpa: 3.1 },
  { id: 's8', name: 'Isha Gupta', rollNo: '108', grade: 'Grade 12', section: 'A', guardianName: 'Alok Gupta', phone: '+91 98765 43217', email: 'isha.g@xyz.edu', attendancePct: 99.0, status: 'Active', enrolledDate: '2022-06-01', gpa: 4.0 },
  { id: 's9', name: 'Siddharth Rao', rollNo: '109', grade: 'Grade 12', section: 'B', guardianName: 'Madhava Rao', phone: '+91 98765 43218', email: 'siddharth.rao@xyz.edu', attendancePct: 88.0, status: 'Suspended', enrolledDate: '2022-06-01', gpa: 2.5 },
  { id: 's10', name: 'Riya Verma', rollNo: '110', grade: 'Grade 10', section: 'A', guardianName: 'Anil Verma', phone: '+91 98765 43219', email: 'riya.v@xyz.edu', attendancePct: 95.6, status: 'Active', enrolledDate: '2024-06-01', gpa: 3.4 },
  { id: 's11', name: 'Aditya Das', rollNo: '111', grade: 'Grade 12', section: 'A', guardianName: 'Bimal Das', phone: '+91 98765 43220', email: 'aditya.das@xyz.edu', attendancePct: 93.4, status: 'Active', enrolledDate: '2022-06-01', gpa: 3.5 },
  { id: 's12', name: 'Sanya Kapoor', rollNo: '112', grade: 'Grade 9', section: 'A', guardianName: 'Sanjay Kapoor', phone: '+91 98765 43221', email: 'sanya.kapoor@xyz.edu', attendancePct: 97.0, status: 'Active', enrolledDate: '2025-06-01', gpa: 3.85 }
];

export default function StudentManagement({ darkTheme }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'profile' | 'performance' | 'attendance' | 'contact' | 'class-info'>('list');
  const [profileStudentId, setProfileStudentId] = useState<string>(SEED_STUDENTS[0].id);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const handleTabChange = (tabId: typeof activeTab) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 250); // Small realistic delay for smooth feel
  };

  const selectedProfileStudent = students.find(s => s.id === profileStudentId) || students[0];

  // Filter computation
  const filteredStudents = students.filter((s) => {
    const classStr = `${s.grade}-${s.section}`;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rollNo.includes(searchQuery) ||
                          s.guardianName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'All' || classStr === filterClass;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Analytics computation
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;
  const averageAttendance = Math.round(students.reduce((acc, curr) => acc + curr.attendancePct, 0) / totalStudents * 10) / 10;
  const avgGpa = Math.round(students.reduce((acc, curr) => acc + curr.gpa, 0) / totalStudents * 100) / 100;

  // Class-wise count
  const classBreakdown = students.reduce((acc: { [key: string]: number }, curr) => {
    const key = `${curr.grade}-${curr.section}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const classSectionsList = [
    'Grade 9-A', 'Grade 9-B', 'Grade 10-A', 'Grade 10-B', 
    'Grade 11-A', 'Grade 11-B', 'Grade 12-A', 'Grade 12-B'
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Information Hub</h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Track student records, academic standings, and enrollment demographics.
          </p>
        </div>
      </div>

      {/* Dynamic Toggle Tabs / Buttons at the top of the page */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b dark:border-slate-800 scrollbar-thin">
        {[
          { id: 'list', label: 'Student List', icon: Users },
          { id: 'profile', label: 'Student Profile', icon: User },
          { id: 'performance', label: 'Academic Performance', icon: Award },
          { id: 'attendance', label: 'Attendance History', icon: Calendar },
          { id: 'contact', label: 'Contact Details', icon: Phone },
          { id: 'class-info', label: 'Class Information', icon: School }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                  : darkTheme
                    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading overlay for smooth state transition */}
      {isTabLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold animate-pulse">Syncing student roster data...</p>
        </div>
      ) : (
        <div className="transition-all duration-350">
          
          {/* TAB 1: STUDENT LIST (Original logic fully retained) */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* KPI Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border transition-all ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl">
                      <Users className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Enrolled</span>
                  </div>
                  <p className="text-2xl font-black">{totalStudents}</p>
                  <div className="mt-2 text-xs font-semibold text-slate-400">Active School Cohort</div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Status</span>
                  </div>
                  <p className="text-2xl font-black">{activeStudents} / {totalStudents}</p>
                  <div className="mt-2 text-xs font-semibold text-emerald-600">Good standing status</div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cohort Avg Attendance</span>
                  </div>
                  <p className="text-2xl font-black">{averageAttendance}%</p>
                  <div className="mt-2 text-xs font-semibold text-slate-400">Target threshold: 92%</div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cohort Average GPA</span>
                  </div>
                  <p className="text-2xl font-black">{avgGpa} / 4.0</p>
                  <div className="mt-2 text-xs font-semibold text-slate-400">Grade points index</div>
                </div>
              </div>

              {/* Two Columns: Stats breakdown & Records Table */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left Column: Demographics */}
                <div className="lg:col-span-1 space-y-6">
                  <div className={`p-5 rounded-2xl border ${
                    darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}>
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                      <School className="h-4 w-4 text-blue-600" />
                      Class Section Statistics
                    </h3>
                    <div className="space-y-3">
                      {classSectionsList.map((cls) => {
                        const count = classBreakdown[cls] || 0;
                        const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                        return (
                          <div key={cls} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{cls}</span>
                              <span className="text-slate-400">{count} pupils ({Math.round(pct)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${pct}%` }} 
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Search, Filters, and Table */}
                <div className="lg:col-span-3 space-y-6">
                  <div className={`p-4 rounded-2xl border ${
                    darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Search className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search students by name, roll..."
                          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition-all"
                        />
                      </div>

                      <div>
                        <select
                          value={filterClass}
                          onChange={(e) => setFilterClass(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-700 bg-white"
                        >
                          <option value="All">All Class Groups</option>
                          {classSectionsList.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-700 bg-white"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className={`border rounded-2xl overflow-hidden ${
                    darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                        <thead className={darkTheme ? 'bg-slate-950/40' : 'bg-slate-50/50'}>
                          <tr>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Roll No</th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Full Name</th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Class Section</th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Attendance</th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">GPA Score</th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Status</th>
                            <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                                No students found matching current filters.
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((student) => (
                              <tr 
                                key={student.id} 
                                className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 font-mono">
                                  #{student.rollNo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                      {student.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{student.name}</div>
                                      <div className="text-[10px] text-slate-400">{student.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                                  {student.grade} - {student.section}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-xs font-bold ${
                                    student.attendancePct >= 92 
                                      ? 'text-emerald-600 dark:text-emerald-400' 
                                      : 'text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {student.attendancePct}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-black">{student.gpa.toFixed(2)}</span>
                                    <span className="text-[10px] text-slate-400">/ 4.0</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-lg ${
                                    student.status === 'Active' 
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                      : student.status === 'Inactive'
                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                        : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                  }`}>
                                    {student.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                  <button
                                    onClick={() => setSelectedStudent(student)}
                                    className="text-blue-600 hover:text-blue-700 font-bold transition-all cursor-pointer"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: STUDENT PROFILE */}
          {activeTab === 'profile' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b dark:border-slate-800 mb-6">
                <div>
                  <h3 className="text-base font-bold">Detailed Student Profiles</h3>
                  <p className="text-xs text-slate-400 font-medium">Select any enrolled pupil below to review their full structural school record.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Pupil:</label>
                  <select 
                    value={profileStudentId}
                    onChange={(e) => setProfileStudentId(e.target.value)}
                    className="px-3 py-1.5 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none bg-white dark:bg-slate-900"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Roll #{s.rollNo})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Profile Card Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Avatar Banner */}
                <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 text-center flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black text-4xl flex items-center justify-center mb-4 border-2 border-white shadow-md">
                    {selectedProfileStudent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-850 dark:text-slate-100">{selectedProfileStudent.name}</h4>
                  <p className="text-xs font-bold text-slate-400 font-mono mt-1">Roll ID: #{selectedProfileStudent.rollNo}</p>
                  
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg uppercase">
                      {selectedProfileStudent.grade}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-black rounded-lg uppercase">
                      Section {selectedProfileStudent.section}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase">
                      {selectedProfileStudent.status}
                    </span>
                  </div>

                  <div className="w-full border-t dark:border-slate-800 my-5"></div>

                  <div className="w-full space-y-3.5 text-left text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Class Advisor:</span>
                      <span className="font-bold">Prof. Sneha Verma</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Extracurriculars:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">School Chess Club</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Medical Notes:</span>
                      <span className="font-bold text-slate-500">None Recorded</span>
                    </div>
                  </div>
                </div>

                {/* Right detailed stats and contact logs */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Academic Standing Index</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{selectedProfileStudent.gpa.toFixed(2)}</p>
                        <span className="text-xs text-slate-400">Cumulative GPA</span>
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> High standing bracket
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Attendance Index</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedProfileStudent.attendancePct}%</p>
                        <span className="text-xs text-slate-400">Term Presence Rate</span>
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-slate-400">
                        {selectedProfileStudent.attendancePct >= 92 ? 'Excellent attendance' : 'Needs attention'}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border dark:border-slate-800">
                    <h5 className="font-extrabold text-sm mb-3.5 text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-blue-600" />
                      Registry Demographics & Guardian
                    </h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                      <div className="space-y-1">
                        <span className="text-slate-400 block text-[11px]">Primary Guardian Name:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProfileStudent.guardianName}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 block text-[11px]">Guardian Phone Number:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProfileStudent.phone}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 block text-[11px]">Primary Email Contact:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProfileStudent.email}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 block text-[11px]">Enrollment Date:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProfileStudent.enrolledDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border dark:border-slate-800 bg-blue-50/15 dark:bg-blue-950/10">
                    <h5 className="font-extrabold text-sm mb-2 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <CheckCircle className="h-4 w-4" /> Academic Remarks & Counselor Advisories
                    </h5>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      "Student exhibits robust computational logic and mathematical proficiency. Demonstrates excellent punctuality, holds high scores across quarterly evaluations, and displays supportive peer leadership in class laboratory assignments. Highly recommended for advanced AP streams."
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Highest GPA Score</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">4.00 / 4.0</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-2">Achieved by 1 student</p>
                </div>
                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cohort Average GPA</p>
                  <p className="text-3xl font-black text-slate-850 dark:text-slate-100 mt-1">{avgGpa} / 4.0</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-2">Consistent performance curve</p>
                </div>
                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Grade Threshold Standing</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">91.6% Pass</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-2">Good academic standings</p>
                </div>
              </div>

              {/* Performance distribution charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* GPA bracket bar representation */}
                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h4 className="font-bold text-sm mb-4 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-blue-600" /> GPA Distribution Cohort Index
                  </h4>
                  
                  <div className="space-y-4">
                    {[
                      { bracket: 'Excellent (3.75 - 4.00)', count: 4, pct: 33 },
                      { bracket: 'Very Good (3.50 - 3.74)', count: 3, pct: 25 },
                      { bracket: 'Good Average (3.00 - 3.49)', count: 3, pct: 25 },
                      { bracket: 'Needs Focus (Below 3.00)', count: 2, pct: 17 }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1.5 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span>{item.bracket}</span>
                          <span className="text-slate-400">{item.count} Pupils ({item.pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${item.pct}%` }}
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top outstanding student high fliers */}
                <div className={`p-5 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h4 className="font-bold text-sm mb-4 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-blue-600" /> Outstanding Performers (Top Tier)
                  </h4>

                  <div className="divide-y dark:divide-slate-800 space-y-3">
                    {students.filter(s => s.gpa >= 3.8).map((stu, i) => (
                      <div key={stu.id} className="flex justify-between items-center pt-3 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-700 dark:bg-blue-950/40 rounded-full flex items-center justify-center font-bold text-[10px]">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-bold">{stu.name}</p>
                            <p className="text-[10px] text-slate-400">{stu.grade} - Section {stu.section}</p>
                          </div>
                        </div>
                        <div className="text-blue-600 font-extrabold text-xs">{stu.gpa.toFixed(2)} GPA</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Excellent Class Presence', value: '8 students', desc: 'Over 95% rate', color: 'text-emerald-600' },
                  { label: 'Target Standing', value: '3 students', desc: '90% - 94% rate', color: 'text-blue-600' },
                  { label: 'Support Standing', value: '1 student', desc: 'Below 90% rate', color: 'text-amber-500' },
                  { label: 'Cohort Average Rate', value: `${averageAttendance}%`, desc: 'Target limit is 92.0%', color: 'text-indigo-650' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border ${
                    darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{item.label}</p>
                    <p className={`text-2xl font-black ${item.color} mt-1`}>{item.value}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-2">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Calendar Grid representation and list */}
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-sm mb-4 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" /> Individual Student Presence Logs
                </h4>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400 font-bold">
                        <th className="pb-3 pr-3">Roll No</th>
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3">Grade Section</th>
                        <th className="pb-3">Term Presence Rate</th>
                        <th className="pb-3">Days Attended</th>
                        <th className="pb-3">Standing Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                      {students.map((stu) => {
                        const totalDays = 45;
                        const daysAttended = Math.round((stu.attendancePct / 100) * totalDays);
                        return (
                          <tr key={stu.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                            <td className="py-3 font-mono font-bold text-slate-400">#{stu.rollNo}</td>
                            <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{stu.name}</td>
                            <td className="py-3">{stu.grade} - {stu.section}</td>
                            <td className="py-3">
                              <span className={`font-black ${
                                stu.attendancePct >= 95 ? 'text-emerald-600' : stu.attendancePct >= 91 ? 'text-blue-600' : 'text-amber-500'
                              }`}>{stu.attendancePct}%</span>
                            </td>
                            <td className="py-3">{daysAttended} / {totalDays} working days</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                stu.attendancePct >= 95 ? 'bg-green-50 text-emerald-700' : stu.attendancePct >= 91 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {stu.attendancePct >= 95 ? 'Excellent' : stu.attendancePct >= 91 ? 'Regular' : 'Needs Review'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONTACT DETAILS */}
          {activeTab === 'contact' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="font-extrabold text-sm mb-4 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-blue-600" /> Parent-Guardian Emergency Directory
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold">
                      <th className="pb-3 pr-3">Student Name</th>
                      <th className="pb-3">Primary Guardian</th>
                      <th className="pb-3">Emergency Contact</th>
                      <th className="pb-3">Primary Email Correspondence</th>
                      <th className="pb-3">Roster Class</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-300">
                    {students.map((stu) => (
                      <tr key={stu.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                        <td className="py-3.5 font-extrabold text-slate-900 dark:text-slate-100">{stu.name}</td>
                        <td className="py-3.5">{stu.guardianName}</td>
                        <td className="py-3.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">{stu.phone}</td>
                        <td className="py-3.5 text-slate-500 font-medium">{stu.email}</td>
                        <td className="py-3.5">{stu.grade} - Section {stu.section}</td>
                        <td className="py-3.5">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CLASS INFORMATION */}
          {activeTab === 'class-info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Grade 9 - Standard A', strength: '18 pupils', advisor: 'Prof. Snigdha Sen', gpa: '3.62 Avg', attendance: '95.8% Attendance', color: 'border-blue-500' },
                { name: 'Grade 10 - Standard A', strength: '24 pupils', advisor: 'Prof. Aarav Sharma', gpa: '3.50 Avg', attendance: '96.2% Attendance', color: 'border-purple-500' },
                { name: 'Grade 10 - Standard B', strength: '19 pupils', advisor: 'Prof. Sunita Sharma', gpa: '3.42 Avg', attendance: '94.5% Attendance', color: 'border-emerald-500' },
                { name: 'Grade 11 - Standard A', strength: '21 pupils', advisor: 'Prof. Sneha Verma', gpa: '3.65 Avg', attendance: '97.5% Attendance', color: 'border-amber-500' },
                { name: 'Grade 11 - Standard B', strength: '22 pupils', advisor: 'Prof. Amit Patel', gpa: '3.10 Avg', attendance: '91.2% Attendance', color: 'border-indigo-500' },
                { name: 'Grade 12 - Standard A', strength: '25 pupils', advisor: 'Prof. Alok Gupta', gpa: '3.75 Avg', attendance: '96.2% Attendance', color: 'border-rose-500' }
              ].map((cls, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl border-l-4 border-y border-r transition-all ${
                    darkTheme ? 'bg-slate-900 border-slate-800 border-y-slate-800 border-r-slate-800' : 'bg-white border-slate-100 border-y-slate-100 border-r-slate-100 shadow-sm'
                  } ${cls.color}`}
                >
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-150 mb-1">{cls.name}</h4>
                  <p className="text-xs text-slate-400 font-bold font-mono">{cls.strength}</p>
                  
                  <div className="border-t dark:border-slate-800 my-3.5"></div>
                  
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Class Advisor:</span>
                      <span>{cls.advisor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Performance Standings:</span>
                      <span className="text-blue-600 dark:text-blue-400">{cls.gpa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Term Attendance Rate:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{cls.attendance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Student Details Dialog */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Detailed Pupil Dossier
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{selectedStudent.name}</h4>
                  <p className="text-xs text-slate-400">Roll: #{selectedStudent.rollNo} • {selectedStudent.grade}-{selectedStudent.section}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Guardian Name:</span>
                  <span className="font-bold">{selectedStudent.guardianName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Contact Phone:</span>
                  <span className="font-bold">{selectedStudent.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Contact Email:</span>
                  <span className="font-bold truncate max-w-[200px]">{selectedStudent.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Enrolled Roster Date:</span>
                  <span className="font-bold">{selectedStudent.enrolledDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Cumulative GPA:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedStudent.gpa.toFixed(2)} / 4.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Attendance Rate:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStudent.attendancePct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Account Status:</span>
                  <span className="font-bold uppercase tracking-wider text-[10px]">{selectedStudent.status}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Records Dossier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
