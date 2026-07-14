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
  Activity,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';

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
  status: 'Active' | 'Inactive' | 'Suspended' | 'Transferred' | 'Alumni';
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
  { id: 's12', name: 'Sanya Kapoor', rollNo: '112', grade: 'Grade 9', section: 'A', guardianName: 'Sanjay Kapoor', phone: '+91 98765 43221', email: 'sanya.kapoor@xyz.edu', attendancePct: 97.0, status: 'Active', enrolledDate: '2025-06-01', gpa: 3.85 },
  { id: 's13', name: 'Ishaan Khattar', rollNo: '113', grade: 'Grade 12', section: 'A', guardianName: 'Neelam Khattar', phone: '+91 98765 43222', email: 'ishaan.k@xyz.edu', attendancePct: 85.0, status: 'Transferred', enrolledDate: '2022-06-01', gpa: 3.1 },
  { id: 's14', name: 'Tara Sutaria', rollNo: '114', grade: 'Grade 12', section: 'B', guardianName: 'Piyush Sutaria', phone: '+91 98765 43223', email: 'tara.s@xyz.edu', attendancePct: 99.4, status: 'Alumni', enrolledDate: '2021-06-01', gpa: 3.95 }
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

  // New states for interactive profile search and filtering
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [profileClassFilter, setProfileClassFilter] = useState('All');
  const [profileSectionFilter, setProfileSectionFilter] = useState('All');
  const [profileStatusFilter, setProfileStatusFilter] = useState('All');
  const [profileQuickFilter, setProfileQuickFilter] = useState('All');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const [selectedKpi, setSelectedKpi] = useState<'total' | 'active' | 'attendance' | 'gpa' | null>(null);

  // States for KPI Total Enrolled drilldown
  const [enrolledPage, setEnrolledPage] = useState(1);
  const [enrolledSearch, setEnrolledSearch] = useState('');
  const [enrolledClass, setEnrolledClass] = useState('All');
  const [enrolledGender, setEnrolledGender] = useState('All');
  const [enrolledStatus, setEnrolledStatus] = useState('All');
  const [enrolledSort, setEnrolledSort] = useState('rollNo');

  // States for KPI Active Status drilldown
  const [activeClassFilter, setActiveClassFilter] = useState('All');

  // Toast notifications for export actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTabChange = (tabId: typeof activeTab) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    setSelectedKpi(null); // Reset KPI drill-down
    setTimeout(() => {
      setIsTabLoading(false);
    }, 250); // Small realistic delay for smooth feel
  };

  const selectedProfileStudent = students.find(s => s.id === profileStudentId) || students[0];

  // Dynamic available sections based on chosen grade filter for profile view
  const availableSections = React.useMemo(() => {
    if (profileClassFilter === 'All') {
      const sections = new Set(students.map(s => s.section));
      return Array.from(sections).sort();
    } else {
      const matchingStudents = students.filter(s => s.grade === profileClassFilter);
      const sections = new Set(matchingStudents.map(s => s.section));
      return Array.from(sections).sort();
    }
  }, [students, profileClassFilter]);

  // Sync profile section filter with available sections
  React.useEffect(() => {
    if (profileSectionFilter !== 'All' && !availableSections.includes(profileSectionFilter)) {
      setProfileSectionFilter('All');
    }
  }, [availableSections, profileSectionFilter]);

  // Advanced search and filters for profile list
  const filteredProfileStudents = React.useMemo(() => {
    return students.filter(s => {
      // Class Filter
      if (profileClassFilter !== 'All' && s.grade !== profileClassFilter) return false;
      // Section Filter
      if (profileSectionFilter !== 'All' && s.section !== profileSectionFilter) return false;
      // Status Filter
      if (profileStatusFilter !== 'All' && s.status !== profileStatusFilter) return false;

      // Quick Chips Filter
      if (profileQuickFilter === 'Active' && s.status !== 'Active') return false;
      if (profileQuickFilter === 'Top Performers' && s.gpa < 3.7) return false;
      if (profileQuickFilter === 'Low Attendance' && s.attendancePct >= 92) return false;
      if (profileQuickFilter === 'Recent Admissions') {
        const year = new Date(s.enrolledDate).getFullYear();
        if (year < 2025) return false;
      }

      // Input Search box
      if (profileSearchQuery.trim() !== '') {
        const query = profileSearchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesRoll = s.rollNo.toLowerCase().includes(query);
        const matchesId = s.id.toLowerCase().includes(query);
        if (!matchesName && !matchesRoll && !matchesId) return false;
      }

      return true;
    });
  }, [students, profileClassFilter, profileSectionFilter, profileStatusFilter, profileQuickFilter, profileSearchQuery]);

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

  // Dynamic additional attributes for students in enrolled drilldown
  const enrichedStudents = students.map((s, idx) => ({
    ...s,
    admissionNo: `ADM-2024-${s.rollNo}`,
    admissionDate: s.enrolledDate,
    gender: (idx % 2 === 0 ? 'Male' : 'Female') as 'Male' | 'Female',
    age: 14 + (idx % 4),
    photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`
  }));

  const handleExport = (type: string, kpiName: string) => {
    showToast(`Successfully generated and downloaded ${kpiName} records as ${type.toUpperCase()}!`);
  };

  // Render Total Enrolled Dashboard drilldown
  const renderTotalEnrolled = () => {
    // 1. Filter
    const query = enrolledSearch.toLowerCase();
    const matchesQuery = (s: typeof enrichedStudents[0]) =>
      s.name.toLowerCase().includes(query) ||
      s.rollNo.includes(query) ||
      s.admissionNo.toLowerCase().includes(query);

    const matchesClass = (s: typeof enrichedStudents[0]) =>
      enrolledClass === 'All' || `${s.grade}-${s.section}` === enrolledClass;

    const matchesGender = (s: typeof enrichedStudents[0]) =>
      enrolledGender === 'All' || s.gender === enrolledGender;

    const matchesStatus = (s: typeof enrichedStudents[0]) =>
      enrolledStatus === 'All' || s.status === enrolledStatus;

    let filtered = enrichedStudents.filter(
      (s) => matchesQuery(s) && matchesClass(s) && matchesGender(s) && matchesStatus(s)
    );

    // 2. Sort
    filtered.sort((a, b) => {
      if (enrolledSort === 'name') return a.name.localeCompare(b.name);
      if (enrolledSort === 'gpa') return b.gpa - a.gpa;
      if (enrolledSort === 'attendancePct') return b.attendancePct - a.attendancePct;
      return a.rollNo.localeCompare(b.rollNo);
    });

    // 3. Paginate
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentPageIndex = Math.min(enrolledPage, totalPages || 1);
    const startIndex = (currentPageIndex - 1) * itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

    const maleCount = enrichedStudents.filter(s => s.gender === 'Male').length;
    const femaleCount = enrichedStudents.filter(s => s.gender === 'Female').length;

    return (
      <div className={`p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md'} space-y-6`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl">
                <Users className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold">Total Enrolled Student Registry</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Detailed list of all registered students with full profile fields.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExport('csv', 'Enrolled Students')}
              className="px-3 py-1.5 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button 
              onClick={() => handleExport('pdf', 'Enrolled Students')}
              className="px-3 py-1.5 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button 
              onClick={() => setSelectedKpi(null)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
              title="Close drilldown"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border dark:border-slate-800/85">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Enrolled</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{totalStudents}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border dark:border-slate-800/85">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active standing</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{activeStudents}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border dark:border-slate-800/85">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gender - Male</p>
            <p className="text-lg font-black text-indigo-650 dark:text-indigo-400 mt-0.5">{maleCount} pupils</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border dark:border-slate-800/85">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gender - Female</p>
            <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">{femaleCount} pupils</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-950/10 border dark:border-slate-800/50 rounded-xl">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, roll, or admission..."
              value={enrolledSearch}
              onChange={(e) => { setEnrolledSearch(e.target.value); setEnrolledPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select 
              value={enrolledClass} 
              onChange={(e) => { setEnrolledClass(e.target.value); setEnrolledPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Classes</option>
              {classSectionsList.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <select 
              value={enrolledGender} 
              onChange={(e) => { setEnrolledGender(e.target.value); setEnrolledPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <select 
              value={enrolledSort} 
              onChange={(e) => setEnrolledSort(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rollNo">Sort: Roll Number</option>
              <option value="name">Sort: Full Name</option>
              <option value="gpa">Sort: Top GPA</option>
              <option value="attendancePct">Sort: Attendance</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="border rounded-xl overflow-hidden dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-950/40">
                <tr className="text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Roll No</th>
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-5 py-3 text-left">Class & Section</th>
                  <th className="px-5 py-3 text-left">Admission No</th>
                  <th className="px-5 py-3 text-left">Admission Date</th>
                  <th className="px-5 py-3 text-left">Gender</th>
                  <th className="px-5 py-3 text-left">Age</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                      No matching student records found.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-slate-500">#{s.rollNo}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={s.photoUrl} 
                            alt={s.name} 
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full bg-slate-100 border dark:border-slate-850"
                            onError={(e) => {
                              (e.target as any).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`;
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold">{s.grade} - {s.section}</td>
                      <td className="px-5 py-3 font-mono">{s.admissionNo}</td>
                      <td className="px-5 py-3 text-slate-450 dark:text-slate-400">{s.admissionDate}</td>
                      <td className="px-5 py-3 font-medium">{s.gender}</td>
                      <td className="px-5 py-3">{s.age} yrs</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          s.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                            : s.status === 'Inactive'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 text-slate-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {Math.min(startIndex + itemsPerPage, filtered.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> students
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setEnrolledPage(p => Math.max(1, p - 1))}
                disabled={currentPageIndex === 1}
                className="p-1.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold px-2">Page {currentPageIndex} of {totalPages}</span>
              <button 
                onClick={() => setEnrolledPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPageIndex === totalPages}
                className="p-1.5 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 rounded-lg cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Active Status Drilldown View
  const renderActiveStatus = () => {
    const activeCount = enrichedStudents.filter(s => s.status === 'Active').length;
    const inactiveCount = enrichedStudents.filter(s => s.status === 'Inactive').length;
    const suspendedCount = enrichedStudents.filter(s => s.status === 'Suspended').length;
    const alumniCount = 45;
    const transferCount = 12;

    const statusData = [
      { name: 'Active Students', value: activeCount, color: '#10B981' },
      { name: 'Inactive Students', value: inactiveCount, color: '#64748B' },
      { name: 'Suspended Students', value: suspendedCount, color: '#EF4444' },
      { name: 'Alumni Cohorts', value: alumniCount, color: '#3B82F6' },
      { name: 'Transfer Students', value: transferCount, color: '#8B5CF6' }
    ];

    const matchesClass = (s: typeof enrichedStudents[0]) =>
      activeClassFilter === 'All' || `${s.grade}-${s.section}` === activeClassFilter;

    const filtered = enrichedStudents.filter(matchesClass);

    return (
      <div className={`p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md'} space-y-6`}>
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg">
                <CheckCircle className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold">Enrollment Status Distribution</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Status demographics including alumni and external transfers.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExport('csv', 'Status Distribution')}
              className="px-3 py-1.5 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button 
              onClick={() => setSelectedKpi(null)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          
          {/* Pie Chart Representation */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-850 rounded-xl min-h-[300px]">
            <p className="text-xs font-bold text-slate-500 mb-2">Cohort Status Distribution Ratio</p>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkTheme ? '#0F172A' : '#FFFFFF',
                      borderColor: darkTheme ? '#1E293B' : '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2 text-[10px] font-bold">
              {statusData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-500">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status summaries and class-level filters */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Class Cohort Status Filter:</span>
                <select 
                  value={activeClassFilter} 
                  onChange={(e) => setActiveClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 focus:outline-none"
                >
                  <option value="All">All Class Groups</option>
                  {classSectionsList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="divide-y dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Active Standing:</span>
                  <span className="text-emerald-600 font-extrabold">{filtered.filter(s => s.status === 'Active').length} pupils</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Inactive Standing:</span>
                  <span className="text-slate-500 dark:text-slate-400">{filtered.filter(s => s.status === 'Inactive').length} pupils</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Suspended Standing:</span>
                  <span className="text-red-500 font-bold">{filtered.filter(s => s.status === 'Suspended').length} pupils</span>
                </div>
                {activeClassFilter === 'All' && (
                  <>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Alumni Registers:</span>
                      <span className="text-blue-500 font-bold">45 graduates</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">External Transfers:</span>
                      <span className="text-purple-500 font-bold">12 pupils</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-50/15 dark:bg-blue-950/10 border border-blue-500/10 rounded-xl text-xs space-y-2">
              <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Standing Advisor Note
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-normal">
                Alumni rosters track graduated students from the preceding academic years. Inactive students represent deferred admissions or long absences, which automatically raise parent inquiry logs.
              </p>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Render Attendance Trends view
  const renderAttendanceDetails = () => {
    const monthlyData = [
      { month: 'Jan', rate: 94.5 },
      { month: 'Feb', rate: 95.8 },
      { month: 'Mar', rate: 95.2 },
      { month: 'Apr', rate: 96.8 },
      { month: 'May', rate: averageAttendance }
    ];

    const classAttendanceData = classSectionsList.map(cls => {
      const clsStudents = enrichedStudents.filter(s => `${s.grade}-${s.section}` === cls);
      const avg = clsStudents.length > 0 
        ? Math.round(clsStudents.reduce((acc, curr) => acc + curr.attendancePct, 0) / clsStudents.length * 10) / 10
        : 95.0;
      return { class: cls, rate: avg };
    });

    const lowestAttendanceStudents = [...enrichedStudents]
      .sort((a, b) => a.attendancePct - b.attendancePct)
      .slice(0, 3);

    const highestAttendanceStudents = [...enrichedStudents]
      .sort((a, b) => b.attendancePct - a.attendancePct)
      .slice(0, 3);

    return (
      <div className={`p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md'} space-y-6`}>
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold">Attendance Trends & Student Standings</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Comprehensive monthly, class-by-class metrics and pupil risk alerts.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExport('csv', 'Attendance Analytics')}
              className="px-3 py-1.5 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export Report
            </button>
            <button 
              onClick={() => setSelectedKpi(null)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-500">Monthly Roster Presence Trend (Cumulative %)</p>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkTheme ? '#1E293B' : '#E2E8F0'} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: darkTheme ? '#0F172A' : '#FFFFFF', borderColor: darkTheme ? '#1E293B' : '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="rate" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" name="Attendance Rate" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-500">Classwise Attendance standing (Average %)</p>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classAttendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkTheme ? '#1E293B' : '#E2E8F0'} />
                  <XAxis dataKey="class" tick={{ fontSize: 8 }} stroke="#94A3B8" />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: darkTheme ? '#0F172A' : '#FFFFFF', borderColor: darkTheme ? '#1E293B' : '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="rate" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Avg Attendance" maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Highlight Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border dark:border-slate-800 rounded-xl">
            <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Outstanding Attendance (Top 3 Students)
            </h4>
            <div className="divide-y dark:divide-slate-800 space-y-2.5">
              {highestAttendanceStudents.map((stu) => (
                <div key={stu.id} className="flex justify-between items-center pt-2.5 text-xs font-semibold">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{stu.name}</p>
                    <p className="text-[10px] text-slate-400">{stu.grade} - {stu.section} (Roll #{stu.rollNo})</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 rounded font-black text-[11px]">{stu.attendancePct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border dark:border-slate-800 rounded-xl">
            <h4 className="text-xs font-black text-red-500 mb-3 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> Attendance Support Alerts (Needs Intervention)
            </h4>
            <div className="divide-y dark:divide-slate-800 space-y-2.5">
              {lowestAttendanceStudents.map((stu) => (
                <div key={stu.id} className="flex justify-between items-center pt-2.5 text-xs font-semibold">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{stu.name}</p>
                    <p className="text-[10px] text-slate-450 dark:text-red-400">{stu.grade} - {stu.section} • Parent: {stu.guardianName}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-red-50 text-red-500 dark:bg-red-950/30 rounded font-black text-[11px]">{stu.attendancePct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render GPA drilldown view
  const renderGpaDetails = () => {
    const semesterData = [
      { semester: 'Term 1', gpa: 3.25 },
      { semester: 'Term 2', gpa: 3.38 },
      { semester: 'Term 3', gpa: 3.42 },
      { semester: 'Term 4', gpa: avgGpa }
    ];

    const bracketData = [
      { bracket: '3.8 - 4.0', count: enrichedStudents.filter(s => s.gpa >= 3.8).length },
      { bracket: '3.5 - 3.79', count: enrichedStudents.filter(s => s.gpa >= 3.5 && s.gpa < 3.8).length },
      { bracket: '3.0 - 3.49', count: enrichedStudents.filter(s => s.gpa >= 3.0 && s.gpa < 3.5).length },
      { bracket: 'Below 3.0', count: enrichedStudents.filter(s => s.gpa < 3.0).length }
    ];

    const topRankedGpa = [...enrichedStudents].sort((a, b) => b.gpa - a.gpa);

    return (
      <div className={`p-6 rounded-2xl border ${darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md'} space-y-6`}>
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-lg">
                <GraduationCap className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold">Academic GPA Leaderboards & Charts</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Track cohort averages, grade point distributions, and overall class standing indexes.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExport('csv', 'GPA Ranking')}
              className="px-3 py-1.5 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export GPA List
            </button>
            <button 
              onClick={() => setSelectedKpi(null)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-500">Academic Term Cumulative GPA Progression</p>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={semesterData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkTheme ? '#1E293B' : '#E2E8F0'} />
                  <XAxis dataKey="semester" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis domain={[2.0, 4.0]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: darkTheme ? '#0F172A' : '#FFFFFF', borderColor: darkTheme ? '#1E293B' : '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="gpa" stroke="#D97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGpa)" name="Cumulative GPA" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-500">Cohort Distribution Brackets (Pupils count)</p>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bracketData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkTheme ? '#1E293B' : '#E2E8F0'} />
                  <XAxis dataKey="bracket" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: darkTheme ? '#0F172A' : '#FFFFFF', borderColor: darkTheme ? '#1E293B' : '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Students Count" maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border dark:border-slate-800 rounded-xl md:col-span-1">
            <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1">
              <Award className="h-4 w-4" /> Subject-wise Average GPAs
            </h4>
            <div className="space-y-3.5 text-xs font-semibold">
              {[
                { subject: 'Mathematics', score: '3.68', pct: 92 },
                { subject: 'Physics & Lab', score: '3.42', pct: 85 },
                { subject: 'Chemistry', score: '3.55', pct: 88 },
                { subject: 'Biology & Life Science', score: '3.62', pct: 90 },
                { subject: 'English & Literature', score: '3.75', pct: 94 }
              ].map((sub, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{sub.subject}</span>
                    <span className="text-amber-600 font-extrabold">{sub.score} / 4.0</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${sub.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border dark:border-slate-800 rounded-xl md:col-span-2">
            <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1">
              <Activity className="h-4 w-4" /> Top Student Honor Roll Leaderboard (GPA Rankings)
            </h4>
            <div className="max-h-[220px] overflow-y-auto divide-y dark:divide-slate-800 pr-1 text-xs">
              {topRankedGpa.map((stu, index) => (
                <div key={stu.id} className="flex justify-between items-center py-2 font-semibold">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-100 text-slate-700' :
                      index === 2 ? 'bg-orange-50 text-orange-700' : 'text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{stu.name}</p>
                      <p className="text-[9px] text-slate-400">{stu.grade} - Section {stu.section} (Roll #{stu.rollNo})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{stu.gpa.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400">/ 4.00</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                {/* Enrolled Card */}
                <div 
                  id="kpi-student-total"
                  onClick={() => setSelectedKpi(selectedKpi === 'total' ? null : 'total')}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
                    selectedKpi === 'total'
                      ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
                      : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl">
                      <Users className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Enrolled</span>
                  </div>
                  <p className="text-2xl font-black">{totalStudents}</p>
                  <div className="mt-2 text-xs font-semibold text-slate-400">Active School Cohort</div>
                </div>

                {/* Active Card */}
                <div 
                  id="kpi-student-active"
                  onClick={() => setSelectedKpi(selectedKpi === 'active' ? null : 'active')}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
                    selectedKpi === 'active'
                      ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
                      : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Status</span>
                  </div>
                  <p className="text-2xl font-black">{activeStudents} / {totalStudents}</p>
                  <div className="mt-2 text-xs font-semibold text-emerald-600">Good standing status</div>
                </div>

                {/* Attendance Card */}
                <div 
                  id="kpi-student-attendance"
                  onClick={() => setSelectedKpi(selectedKpi === 'attendance' ? null : 'attendance')}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
                    selectedKpi === 'attendance'
                      ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
                      : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="p-2 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cohort Avg Attendance</span>
                  </div>
                  <p className="text-2xl font-black">{averageAttendance}%</p>
                  <div className="mt-2 text-xs font-semibold text-slate-400">Target threshold: 92%</div>
                </div>

                {/* GPA Card */}
                <div 
                  id="kpi-student-gpa"
                  onClick={() => setSelectedKpi(selectedKpi === 'gpa' ? null : 'gpa')}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
                    selectedKpi === 'gpa'
                      ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
                      : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
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

              {/* Dynamic content rendering with smooth motion transitions */}
              <AnimatePresence mode="wait">
                {selectedKpi === null ? (
                  <motion.div
                    key="original-demographics-table"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28 }}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                  >
                
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

                  </motion.div>
                ) : (
                  <motion.div
                    key={`kpi-drilldown-${selectedKpi}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28 }}
                  >
                    {selectedKpi === 'total' && renderTotalEnrolled()}
                    {selectedKpi === 'active' && renderActiveStatus()}
                    {selectedKpi === 'attendance' && renderAttendanceDetails()}
                    {selectedKpi === 'gpa' && renderGpaDetails()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 2: STUDENT PROFILE */}
          {activeTab === 'profile' && (() => {
            const highlightMatch = (text: string, query: string) => {
              if (!query.trim()) return <span>{text}</span>;
              try {
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escaped})`, 'gi');
                const parts = text.split(regex);
                return (
                  <span>
                    {parts.map((part, i) => 
                      regex.test(part) ? (
                        <mark key={i} className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 rounded px-0.5 font-bold">
                          {part}
                        </mark>
                      ) : (
                        part
                      )
                    )}
                  </span>
                );
              } catch (e) {
                return <span>{text}</span>;
              }
            };

            return (
              <div className={`p-6 rounded-2xl border ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                {/* Header */}
                <div className="pb-4 border-b dark:border-slate-800 mb-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold">Detailed Student Profiles</h3>
                    <p className="text-xs text-slate-400 font-medium">Search or filter below to retrieve any pupil's full structural school record.</p>
                  </div>
                  <div className="text-xs font-mono text-slate-450 dark:text-slate-500 hidden sm:block">
                    Matching: <span className="font-bold text-blue-600 dark:text-blue-400">{filteredProfileStudents.length}</span> students
                  </div>
                </div>

                {/* Search & Filters Panel */}
                <div className="p-5 rounded-2xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 mb-6 space-y-4">
                  
                  {/* Search Bar & Dropdowns Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    
                    {/* Search Box */}
                    <div className="lg:col-span-6 relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450 dark:text-slate-550">
                        <Search className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        id="profile-search-input"
                        value={profileSearchQuery}
                        onChange={(e) => setProfileSearchQuery(e.target.value)}
                        placeholder="Search student by Name, Roll Number, Admission No..."
                        className="block w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold transition-all shadow-sm"
                      />
                      {profileSearchQuery && (
                        <button
                          onClick={() => setProfileSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-655 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Class Filter Dropdown */}
                    <div className="lg:col-span-2">
                      <select
                        value={profileClassFilter}
                        onChange={(e) => {
                          setProfileClassFilter(e.target.value);
                          setProfileQuickFilter('All');
                        }}
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <option value="All">All Classes</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    </div>

                    {/* Section Filter Dropdown */}
                    <div className="lg:col-span-2">
                      <select
                        value={profileSectionFilter}
                        onChange={(e) => {
                          setProfileSectionFilter(e.target.value);
                          setProfileQuickFilter('All');
                        }}
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <option value="All">All Sections</option>
                        {availableSections.map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="lg:col-span-2">
                      <select
                        value={profileStatusFilter}
                        onChange={(e) => {
                          setProfileStatusFilter(e.target.value);
                          setProfileQuickFilter('All');
                        }}
                        className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <option value="All">All Students</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Transferred">Transferred</option>
                        <option value="Alumni">Alumni</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>

                  </div>

                  {/* Quick Filters - Badges/Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs select-none">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Quick Filters:</span>
                    {[
                      { id: 'All', label: 'All Students', color: 'blue' },
                      { id: 'Active', label: 'Active', color: 'emerald' },
                      { id: 'Top Performers', label: 'Top Performers', color: 'amber' },
                      { id: 'Low Attendance', label: 'Low Attendance', color: 'red' },
                      { id: 'Recent Admissions', label: 'Recent Admissions', color: 'purple' }
                    ].map((chip) => {
                      const isSelected = profileQuickFilter === chip.id;
                      const baseStyle = "px-3 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all border";
                      let activeStyles = "";
                      let inactiveStyles = "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-755 dark:text-slate-300 dark:hover:bg-slate-700";

                      if (isSelected) {
                        if (chip.color === 'blue') activeStyles = "bg-blue-600 border-blue-650 text-white shadow-sm shadow-blue-500/20";
                        else if (chip.color === 'emerald') activeStyles = "bg-emerald-600 border-emerald-650 text-white shadow-sm shadow-emerald-500/20";
                        else if (chip.color === 'amber') activeStyles = "bg-amber-500 border-amber-550 text-white shadow-sm shadow-amber-500/20";
                        else if (chip.color === 'red') activeStyles = "bg-red-650 border-red-700 text-white shadow-sm shadow-red-500/20";
                        else if (chip.color === 'purple') activeStyles = "bg-purple-650 border-purple-700 text-white shadow-sm shadow-purple-500/20";
                      }

                      return (
                        <button
                          key={chip.id}
                          onClick={() => {
                            setProfileQuickFilter(chip.id);
                            if (chip.id === 'All') {
                              setProfileClassFilter('All');
                              setProfileSectionFilter('All');
                              setProfileStatusFilter('All');
                              setProfileSearchQuery('');
                            } else if (chip.id === 'Active') {
                              setProfileStatusFilter('Active');
                              setProfileClassFilter('All');
                              setProfileSectionFilter('All');
                              setProfileSearchQuery('');
                            } else {
                              setProfileClassFilter('All');
                              setProfileSectionFilter('All');
                              setProfileStatusFilter('All');
                              setProfileSearchQuery('');
                            }
                          }}
                          className={`${baseStyle} ${isSelected ? activeStyles : inactiveStyles}`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* Main Workspace: 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Matching Search Results list */}
                  <div className="lg:col-span-4 border dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50/20 dark:bg-slate-950/10">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-450 pb-2 border-b dark:border-slate-800">
                      <span>Search Results ({filteredProfileStudents.length})</span>
                      {filteredProfileStudents.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-normal">Click to review profile</span>
                      )}
                    </div>

                    <div className="max-h-[34.5rem] overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
                      {filteredProfileStudents.length === 0 ? (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-2.5">
                          <span className="text-3xl text-slate-400">🔍</span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">No student found</h4>
                          <p className="text-[11px] text-slate-400 font-semibold leading-normal max-w-[14rem]">
                            No pupils match your search query or filters.
                          </p>
                          <button
                            onClick={() => {
                              setProfileSearchQuery('');
                              setProfileClassFilter('All');
                              setProfileSectionFilter('All');
                              setProfileStatusFilter('All');
                              setProfileQuickFilter('All');
                            }}
                            className="px-3 py-1.5 text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
                          >
                            Reset Filters
                          </button>
                        </div>
                      ) : (
                        filteredProfileStudents.map((s) => {
                          const isSelected = s.id === profileStudentId;
                          const statusColor = s.status === 'Active' 
                            ? 'bg-emerald-500' 
                            : s.status === 'Inactive' 
                              ? 'bg-slate-400' 
                              : s.status === 'Suspended'
                                ? 'bg-red-500'
                                : s.status === 'Transferred'
                                  ? 'bg-purple-500'
                                  : 'bg-blue-500'; // Alumni

                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                if (!isSelected) {
                                  setIsProfileLoading(true);
                                  setProfileStudentId(s.id);
                                  setTimeout(() => {
                                    setIsProfileLoading(false);
                                  }, 280);
                                }
                              }}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 select-none ${
                                isSelected
                                  ? 'bg-blue-50/15 border-blue-600 shadow-md ring-1 ring-blue-600/50 dark:bg-blue-950/20'
                                  : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                  {highlightMatch(s.name, profileSearchQuery)}
                                </h4>
                                <span className="text-[9px] text-slate-400 font-mono shrink-0 font-bold">
                                  #{highlightMatch(s.rollNo, profileSearchQuery)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                                <span>
                                  {s.grade} • Sec {s.section}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450">{s.status}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Student Profile Display */}
                  <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                      {isProfileLoading ? (
                        <motion.div
                          key="skeleton-pulse"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {/* Profile Loading Skeleton */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                            {/* Skeleton Left Card */}
                            <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-100/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 text-center flex flex-col items-center space-y-4">
                              <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                              <div className="flex gap-2 w-full justify-center">
                                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                              </div>
                              <div className="w-full border-t dark:border-slate-800 my-5"></div>
                              <div className="w-full space-y-3">
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/6" />
                              </div>
                            </div>

                            {/* Skeleton Right Cards */}
                            <div className="lg:col-span-2 space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border dark:border-slate-800 bg-slate-100/20 dark:bg-slate-900/10 space-y-3">
                                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                                </div>
                                <div className="p-4 rounded-xl border dark:border-slate-800 bg-slate-100/20 dark:bg-slate-900/10 space-y-3">
                                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                                </div>
                              </div>

                              <div className="p-5 rounded-xl border dark:border-slate-800 space-y-4">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {[1, 2, 3, 4].map(n => (
                                    <div key={n} className="space-y-2">
                                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="p-5 rounded-xl border dark:border-slate-800 bg-slate-150/5 dark:bg-slate-900/5 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={selectedProfileStudent.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                          {/* Visual Avatar Banner */}
                          <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 text-center flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black text-4xl flex items-center justify-center mb-4 border-2 border-white shadow-md">
                              {selectedProfileStudent.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <h4 className="font-extrabold text-lg text-slate-850 dark:text-slate-100 leading-tight">{selectedProfileStudent.name}</h4>
                            <p className="text-xs font-bold text-slate-400 font-mono mt-1.5">Roll ID: #{selectedProfileStudent.rollNo}</p>
                            
                            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg uppercase">
                                {selectedProfileStudent.grade}
                              </span>
                              <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-black rounded-lg uppercase">
                                Section {selectedProfileStudent.section}
                              </span>
                              <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase ${
                                selectedProfileStudent.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                  : selectedProfileStudent.status === 'Inactive'
                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                    : selectedProfileStudent.status === 'Suspended'
                                      ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                                      : selectedProfileStudent.status === 'Transferred'
                                        ? 'bg-purple-50 text-purple-750 dark:bg-purple-950/30 dark:text-purple-400'
                                        : 'bg-blue-50 text-blue-750 dark:bg-blue-950/30 dark:text-blue-400' // Alumni
                              }`}>
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
                                  <Award className="h-3.5 w-3.5" /> {selectedProfileStudent.gpa >= 3.6 ? 'High standing bracket' : 'Satisfactory standing bracket'}
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

                            <div className="p-5 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
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
                              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                                {selectedProfileStudent.gpa >= 3.7 
                                  ? '"Student exhibits robust computational logic and mathematical proficiency. Demonstrates excellent punctuality, holds high scores across quarterly evaluations, and displays supportive peer leadership in class laboratory assignments. Highly recommended for advanced AP streams."'
                                  : selectedProfileStudent.gpa >= 3.0
                                    ? '"Student has made positive academic progress this term. Class attendance is consistent and they engage actively in team modules. Focus on spelling and advanced proofreading will consolidate their B-grade threshold into higher brackets."'
                                    : '"Student shows good practical aptitude but has missed multiple assignment deadlines due to absences. Requires supportive counselor advisories and structured math laboratory practice to recover missing grade thresholds."'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

              </div>
            );
          })()}

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

      {toastMessage && (
        <div id="toast-message" className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl border dark:border-slate-800 flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="h-4 w-4 text-emerald-500 animate-pulse" />
          {toastMessage}
        </div>
      )}

    </div>
  );
}
