import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Layers, 
  HelpCircle,
  X,
  FileCheck2,
  CalendarDays,
  Check,
  ArrowLeft,
  Download,
  AlertCircle,
  Sparkles,
  School,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line
} from 'recharts';

interface Lesson {
  id: string;
  subject: string;
  topic: string;
  classSection: string;
  teacherName: string;
  date: string;
  durationMinutes: number;
  status: 'Completed' | 'Pending' | 'Ongoing';
  progressPct: number;
  remarks: string;
}

interface LessonsLearnedProps {
  darkTheme: boolean;
}

const SEED_LESSONS: Lesson[] = [
  { id: 'l1', subject: 'Mathematics', topic: 'Quadratic Equations & Polynomials', classSection: 'Grade 10-A', teacherName: 'Aarav Sharma', date: '2026-05-20', durationMinutes: 50, status: 'Completed', progressPct: 100, remarks: 'Syllabus chapter fully summarized. Assessments assigned.' },
  { id: 'l2', subject: 'Chemistry', topic: 'Organic Compounds & Hydrocarbons', classSection: 'Grade 11-A', teacherName: 'Sneha Kapoor', date: '2026-05-21', durationMinutes: 50, status: 'Completed', progressPct: 100, remarks: 'Completed functional groups chemistry and safe lab protocols.' },
  { id: 'l3', subject: 'Physics', topic: 'Electromagnetic Induction', classSection: 'Grade 12-A', teacherName: 'Neha Deshmukh', date: '2026-05-22', durationMinutes: 50, status: 'Completed', progressPct: 100, remarks: 'Faradays law of induction fully verified.' },
  { id: 'l4', subject: 'English Literature', topic: 'Shakespearean Sonnets & Prose', classSection: 'Grade 9-A', teacherName: 'Rahul Verma', date: '2026-05-25', durationMinutes: 50, status: 'Ongoing', progressPct: 60, remarks: 'Act 3 Scene 2 discussion ongoing. Class engagement is strong.' },
  { id: 'l5', subject: 'Biology', topic: 'Mendelian Genetics & Inheritance', classSection: 'Grade 10-B', teacherName: 'Priya Patel', date: '2026-05-25', durationMinutes: 50, status: 'Ongoing', progressPct: 40, remarks: 'Punnett squares exercises in progress.' },
  { id: 'l6', subject: 'Computer Science', topic: 'Graph Algorithms & Trees', classSection: 'Grade 12-B', teacherName: 'Rajesh Nair', date: '2026-05-26', durationMinutes: 50, status: 'Pending', progressPct: 0, remarks: 'Slotted for tomorrow. Prerequisites shared.' },
  { id: 'l7', subject: 'History & Civics', topic: 'The Indian Independence Struggle', classSection: 'Grade 10-A', teacherName: 'Vikram Singh', date: '2026-05-26', durationMinutes: 50, status: 'Pending', progressPct: 0, remarks: 'Reading assignment on Simon Commission set.' },
  { id: 'l8', subject: 'Geography', topic: 'Plate Tectonics & Seismic Faultlines', classSection: 'Grade 9-B', teacherName: 'Ananya Roy', date: '2026-05-24', durationMinutes: 50, status: 'Completed', progressPct: 100, remarks: 'Pacific ring of fire seismology completed.' },
  { id: 'l9', subject: 'Economics & Commerce', topic: 'Demand Elasticity & Pricing Curves', classSection: 'Grade 11-B', teacherName: 'Amit Verma', date: '2026-05-27', durationMinutes: 50, status: 'Pending', progressPct: 0, remarks: 'Pending starting session next Wednesday.' }
];

export default function LessonsLearned({ darkTheme }: LessonsLearnedProps) {
  const [lessons, setLessons] = useState<Lesson[]>(SEED_LESSONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'completed' | 'pending' | 'timeline' | 'summary' | 'subject' | 'stats'>('completed');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = (type: string, kpiName: string) => {
    showToast(`Successfully generated and downloaded ${kpiName} records as ${type.toUpperCase()}!`);
  };

  // 1. Total Courses Detail
  const renderTotalCoursesDetails = () => {
    const countsBySubject: { [key: string]: number } = {};
    lessons.forEach(l => {
      countsBySubject[l.subject] = (countsBySubject[l.subject] || 0) + 1;
    });
    const barData = Object.keys(countsBySubject).map(sub => ({
      name: sub,
      lessons: countsBySubject[sub]
    }));

    return (
      <div className={`p-6 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      } space-y-6`}>
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md">Drilldown Insight</span>
            <h3 className="text-lg font-bold mt-1">Total Courses Academic Dossier</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleExport('pdf', 'Total Courses')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
            >
              <Download className="h-3 w-3" /> Export PDF
            </button>
            <button 
              onClick={() => setSelectedKpi(null)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Course Distribution by Subject</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkTheme ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkTheme ? '#0f172a' : '#ffffff', 
                      borderColor: darkTheme ? '#1e293b' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }} 
                  />
                  <Bar dataKey="lessons" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#4f46e5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Syllabus Breakdown</h4>
            <div className="space-y-3">
              {lessons.map(l => (
                <div key={l.id} className="p-3 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold">{l.subject}</p>
                    <p className="text-[10px] text-slate-400">{l.classSection}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                    l.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                    l.status === 'Ongoing' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800'
                  }`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Completed Detail
  const renderCompletedDetails = () => {
    const completedList = lessons.filter(l => l.status === 'Completed');
    return (
      <div className={`p-6 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      } space-y-6`}>
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">Drilldown Insight</span>
            <h3 className="text-lg font-bold mt-1">Completed Curriculum Logs</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleExport('pdf', 'Completed Lessons')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
            >
              <Download className="h-3 w-3" /> Export Archive
            </button>
            <button 
              onClick={() => setSelectedKpi(null)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Chapters Timeline</h4>
            <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 ml-2 space-y-5">
              {completedList.map(l => (
                <div key={l.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                  <div className="text-xs">
                    <span className="font-mono text-[10px] text-slate-400">{l.date}</span>
                    <p className="font-bold text-slate-900 dark:text-white">{l.subject} — {l.topic}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Educated by {l.teacherName} in {l.durationMinutes} mins.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-500/10 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-xs font-black">Quality Standing Summary</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                Syllabus benchmarks successfully archived with zero backlog. Class response logs indicate high scholastic performance, particularly within physical and natural science components.
              </p>
            </div>
            <div className="mt-6 border-t dark:border-slate-800 pt-4 flex justify-between items-center text-xs">
              <span className="text-slate-400">Archived Units:</span>
              <span className="font-bold text-emerald-600">{completedList.length} Chapters</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. Ongoing Detail
  const renderOngoingDetails = () => {
    const ongoingList = lessons.filter(l => l.status === 'Ongoing');
    return (
      <div className={`p-6 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      } space-y-6`}>
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">Drilldown Insight</span>
            <h3 className="text-lg font-bold mt-1">Ongoing Subject Tracks</h3>
          </div>
          <button 
            onClick={() => setSelectedKpi(null)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Syllabus Progress Indicators</h4>
            <div className="space-y-4">
              {ongoingList.map(l => (
                <div key={l.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{l.subject}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({l.classSection})</span>
                    </div>
                    <span className="font-black font-mono text-indigo-600">{l.progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${l.progressPct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Topic: {l.topic} • Led by {l.teacherName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Academic Pacing Remarks</h4>
            <div className="space-y-2">
              {ongoingList.map(l => (
                <div key={l.id} className="flex gap-2 items-start text-xs">
                  <span className="p-1 bg-indigo-100 text-indigo-600 dark:bg-indigo-950 rounded-lg mt-0.5">
                    <School className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{l.subject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{l.remarks}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 4. Pending Detail
  const renderPendingDetails = () => {
    const pendingList = lessons.filter(l => l.status === 'Pending');
    return (
      <div className={`p-6 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      } space-y-6`}>
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md">Drilldown Insight</span>
            <h3 className="text-lg font-bold mt-1">Upcoming Scheduled Units</h3>
          </div>
          <button 
            onClick={() => setSelectedKpi(null)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Calendar Roster</h4>
            <div className="space-y-3">
              {pendingList.map(l => (
                <div key={l.id} className="p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{l.subject} ({l.classSection})</span>
                    <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> {l.date}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Scheduled Instructor: <span className="font-semibold text-slate-700 dark:text-slate-300">{l.teacherName}</span></p>
                  <div className="border-t dark:border-slate-800 pt-2 mt-1">
                    <p className="text-[10px] font-bold text-slate-400">Scheduled Topic Objective:</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 italic">{l.topic}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/20 dark:bg-amber-950/10 border border-amber-500/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
              <AlertCircle className="h-4 w-4" /> Curriculum Prep Checklist
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Lesson material review and syllabus alignments
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Shared slide decks and digital resources
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Prep worksheets and student prerequisite handouts
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // 5. Total Completion Detail
  const renderSyllabusProgressDetails = () => {
    // Dummy progression trends
    const lineData = [
      { week: 'Week 1', completed: 1 },
      { week: 'Week 2', completed: 2 },
      { week: 'Week 3', completed: 3 },
      { week: 'Week 4', completed: 4 },
      { week: 'Week 5', completed: 5 }
    ];

    return (
      <div className={`p-6 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      } space-y-6`}>
        <div className="flex justify-between items-center pb-4 border-b dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md">Drilldown Insight</span>
            <h3 className="text-lg font-bold mt-1">Syllabus Progression Analytics</h3>
          </div>
          <button 
            onClick={() => setSelectedKpi(null)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cumulative Semester Syllabus Progress Curve</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkTheme ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkTheme ? '#0f172a' : '#ffffff', 
                      borderColor: darkTheme ? '#1e293b' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }} 
                  />
                  <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Progression Metrics Breakdown</h4>
            <div className="p-4 rounded-2xl border dark:border-slate-800 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>Syllabus Completed</span>
                  <span className="text-emerald-500">74%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>Student Syllabus Contentment</span>
                  <span className="text-blue-500">89%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '89%' }} />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t dark:border-slate-800">
                Pacing targets for the standard midterm examinations are well on course with an average curriculum fulfillment rate of 74% across all subjects.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleTabChange = (tabId: typeof activeTab) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 250);
  };

  // Filters logic
  const filteredLessons = lessons.filter((l) => {
    const matchesSearch = l.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.remarks.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'All' || l.subject === filterSubject;
    const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Unique subjects list
  const uniqueSubjectsList = ['All', ...Array.from(new Set(lessons.map(l => l.subject)))];

  // Calculation metrics
  const totalLessons = lessons.length;
  const completedLessonsCount = lessons.filter(l => l.status === 'Completed').length;
  const ongoingLessonsCount = lessons.filter(l => l.status === 'Ongoing').length;
  const pendingLessonsCount = lessons.filter(l => l.status === 'Pending').length;

  const syllabusProgress = totalLessons > 0 
    ? Math.round((lessons.reduce((acc, curr) => acc + curr.progressPct, 0) / (totalLessons * 100)) * 100) 
    : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Academic Syllabus Tracker</h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Audit syllabus course completions, logged daily topics, and pending lesson plans.
          </p>
        </div>
      </div>

      {/* Dynamic Toggle Tabs / Buttons at the top of the page */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b dark:border-slate-800 scrollbar-thin">
        {[
          { id: 'completed', label: 'Completed Lessons', icon: CheckCircle },
          { id: 'pending', label: 'Pending Lessons', icon: Clock },
          { id: 'timeline', label: 'Lesson Timeline', icon: Calendar },
          { id: 'summary', label: 'Progress Summary', icon: Layers },
          { id: 'subject', label: 'Subject-wise Progress', icon: BookOpen },
          { id: 'stats', label: 'Completion Statistics', icon: TrendingUp }
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

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Courses Card */}
        <div 
          id="kpi-lessons-total"
          onClick={() => setSelectedKpi(selectedKpi === 'total' ? null : 'total')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
            selectedKpi === 'total'
              ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
              : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl">
              <Layers className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Courses</span>
          </div>
          <p className="text-2xl font-black">{totalLessons}</p>
          <div className="mt-2 text-xs font-semibold text-slate-400">Tracked Units</div>
        </div>

        {/* Completed Card */}
        <div 
          id="kpi-lessons-completed"
          onClick={() => setSelectedKpi(selectedKpi === 'completed' ? null : 'completed')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
            selectedKpi === 'completed'
              ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
              : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completed</span>
          </div>
          <p className="text-2xl font-black">{completedLessonsCount}</p>
          <div className="mt-2 text-xs font-semibold text-emerald-600">Archived Chapters</div>
        </div>

        {/* Ongoing Card */}
        <div 
          id="kpi-lessons-ongoing"
          onClick={() => setSelectedKpi(selectedKpi === 'ongoing' ? null : 'ongoing')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
            selectedKpi === 'ongoing'
              ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
              : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ongoing</span>
          </div>
          <p className="text-2xl font-black">{ongoingLessonsCount}</p>
          <div className="mt-2 text-xs font-semibold text-indigo-650">In Progress Active</div>
        </div>

        {/* Pending Card */}
        <div 
          id="kpi-lessons-pending"
          onClick={() => setSelectedKpi(selectedKpi === 'pending' ? null : 'pending')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
            selectedKpi === 'pending'
              ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
              : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl">
              <Calendar className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pending Slotted</span>
          </div>
          <p className="text-2xl font-black">{pendingLessonsCount}</p>
          <div className="mt-2 text-xs font-semibold text-slate-400">Future scheduled periods</div>
        </div>

        {/* Completion Card */}
        <div 
          id="kpi-lessons-completion"
          onClick={() => setSelectedKpi(selectedKpi === 'completion' ? null : 'completion')}
          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-blue-500 ${
            selectedKpi === 'completion'
              ? 'bg-blue-50/30 border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-600/50'
              : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Completion</span>
          </div>
          <p className="text-2xl font-black">{syllabusProgress}%</p>
          <div className="mt-2 text-xs font-semibold text-blue-600">Syllabus Progress Metric</div>
        </div>

      </div>

      {/* Dynamic Tab or Drilldown Content Rendering with Smooth Transitions */}
      <AnimatePresence mode="wait">
        {selectedKpi !== null ? (
          <motion.div
            key={`kpi-drilldown-${selectedKpi}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.28 }}
          >
            {selectedKpi === 'total' && renderTotalCoursesDetails()}
            {selectedKpi === 'completed' && renderCompletedDetails()}
            {selectedKpi === 'ongoing' && renderOngoingDetails()}
            {selectedKpi === 'pending' && renderPendingDetails()}
            {selectedKpi === 'completion' && renderSyllabusProgressDetails()}
          </motion.div>
        ) : (
          <motion.div
            key="tab-content-container"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.28 }}
            className="space-y-6"
          >
            {isTabLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-semibold animate-pulse">Syncing syllabus progression matrix...</p>
              </div>
            ) : (
              <div className="transition-all duration-350">
          
          {/* TAB 1 & 2: COMPLETED & PENDING LESSONS LISTS */}
          {(activeTab === 'completed' || activeTab === 'pending') && (
            <div className="space-y-6">
              {/* Search Panel */}
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
                      placeholder="Search lessons by topic or keywords..."
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition-all"
                    />
                  </div>

                  <div>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-700 bg-white"
                    >
                      <option value="All">All Subjects</option>
                      {uniqueSubjectsList.filter(s => s !== 'All').map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 px-3 flex items-center h-full">
                      Filtered by tab: <span className="text-blue-600 ml-1 capitalize font-black">{activeTab} List</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Table list */}
              <div className={`border rounded-2xl overflow-hidden ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className={darkTheme ? 'bg-slate-950/40' : 'bg-slate-50/50'}>
                      <tr>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Date</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Subject & Class</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Chapter / Topic</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Educator</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Syllabus Progress</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Status</th>
                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLessons
                        .filter(l => activeTab === 'completed' ? l.status === 'Completed' : l.status !== 'Completed')
                        .length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 font-semibold">
                            No {activeTab} syllabus records found.
                          </td>
                        </tr>
                      ) : (
                        filteredLessons
                          .filter(l => activeTab === 'completed' ? l.status === 'Completed' : l.status !== 'Completed')
                          .map((lesson) => (
                            <tr 
                              key={lesson.id} 
                              className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono font-bold">
                                {lesson.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{lesson.subject}</div>
                                <div className="text-[10px] text-slate-400">{lesson.classSection} • {lesson.durationMinutes} mins</div>
                              </td>
                              <td className="px-6 py-4 max-w-[200px] truncate">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {lesson.topic}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                                {lesson.teacherName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 max-w-[150px]">
                                  <span className="text-xs font-bold font-mono">{lesson.progressPct}%</span>
                                  <div className="w-20 bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden shrink-0">
                                    <div 
                                      style={{ width: `${lesson.progressPct}%` }}
                                      className={`h-full rounded-full ${
                                        lesson.status === 'Completed' 
                                          ? 'bg-emerald-500' 
                                          : lesson.status === 'Ongoing' 
                                            ? 'bg-indigo-500' 
                                            : 'bg-slate-300'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-lg ${
                                  lesson.status === 'Completed' 
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                    : lesson.status === 'Ongoing'
                                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                }`}>
                                  {lesson.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                <button
                                  onClick={() => setSelectedLesson(lesson)}
                                  className="text-blue-600 hover:text-blue-700 font-bold transition-all cursor-pointer"
                                >
                                  View Objectives
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
          )}

          {/* TAB 3: LESSON TIMELINE */}
          {activeTab === 'timeline' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="font-extrabold text-sm mb-6 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-600" /> Syllabus Execution Timeline & Historical Logs
              </h3>

              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8 py-3">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="relative group">
                    {/* Circle badge indicator */}
                    <div className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 flex items-center justify-center transition-all ${
                      lesson.status === 'Completed' 
                        ? 'bg-emerald-500 border-white dark:border-slate-900' 
                        : lesson.status === 'Ongoing'
                          ? 'bg-indigo-500 border-white dark:border-slate-900'
                          : 'bg-slate-300 border-white dark:border-slate-900'
                    }`} />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{lesson.date}</span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">
                          {lesson.topic}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {lesson.subject} • Class: {lesson.classSection} • Prof. {lesson.teacherName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          lesson.status === 'Completed' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' 
                            : lesson.status === 'Ongoing'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {lesson.status}
                        </span>
                        <div className="text-[11px] font-bold text-slate-400 font-mono">
                          {lesson.progressPct}% done
                        </div>
                      </div>
                    </div>
                    {lesson.remarks && (
                      <p className="mt-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950/30 text-slate-500 leading-relaxed font-medium">
                        "{lesson.remarks}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROGRESS SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Curriculum Summary Panel */}
                <div className={`p-6 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h4 className="font-bold text-sm mb-4">Term Syllabus Coverage</h4>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold inline-block py-1 px-2.5 uppercase rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-950/30">
                          Primary Term Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-blue-600">
                          {syllabusProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-3.5 text-xs flex rounded-full bg-slate-150 dark:bg-slate-800">
                      <div 
                        style={{ width: `${syllabusProgress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 rounded-full transition-all duration-700"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed font-semibold">
                    The current term contains 9 core textbook subjects. Cumulative progress tracking shows we are operating 4% ahead of the regional target curriculum timeline.
                  </p>
                </div>

                {/* Course Coverage breakdown */}
                <div className={`p-6 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h4 className="font-bold text-sm mb-4">Course Execution Standing</h4>
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled Term Topics:</span>
                      <span>{lessons.length} Modules</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Finished & Archived:</span>
                      <span className="text-emerald-600">{completedLessonsCount} Chapters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Classroom Sessions:</span>
                      <span className="text-indigo-650">{ongoingLessonsCount} Chapters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Upcoming Syllabi Pending:</span>
                      <span className="text-slate-400">{pendingLessonsCount} Chapters</span>
                    </div>
                  </div>
                </div>

                {/* Regional Syllabus Compliance audit */}
                <div className={`p-6 rounded-2xl border ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h4 className="font-bold text-sm mb-3 text-emerald-600">Syllabus Compliance Status</h4>
                  <div className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-100/50 flex gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-emerald-400">Classrooms in Good Compliance</h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Teachers have maintained lesson logs successfully. Internal board evaluation places current progress in Tier-1 standing quality.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: SUBJECT-WISE PROGRESS */}
          {activeTab === 'subject' && (
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <h3 className="font-bold text-sm mb-6 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-blue-600" /> Subject-wise Curriculum Metrics & Completion Rates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { subject: 'Mathematics', rate: 100, lessons: '1 textbook unit', teacher: 'Aarav Sharma', desc: 'Fully covered algebraic quadratics.' },
                  { subject: 'Chemistry', rate: 100, lessons: '1 textbook unit', teacher: 'Sneha Kapoor', desc: 'Finished hydro-carbons lab syllabus.' },
                  { subject: 'Physics', rate: 100, lessons: '1 textbook unit', teacher: 'Neha Deshmukh', desc: 'Completed induction experiments.' },
                  { subject: 'Biology', rate: 40, lessons: '1 textbook unit', teacher: 'Priya Patel', desc: 'Inheritance genetics chapters ongoing.' },
                  { subject: 'English Literature', rate: 60, lessons: '1 textbook unit', teacher: 'Rahul Verma', desc: 'Shakespeare sonnets reading in class.' },
                  { subject: 'Geography', rate: 100, lessons: '1 textbook unit', teacher: 'Ananya Roy', desc: 'Tectonics maps completed.' },
                  { subject: 'Computer Science', rate: 0, lessons: '1 textbook unit', teacher: 'Rajesh Nair', desc: 'Graph trees scheduled next term.' },
                  { subject: 'History & Civics', rate: 0, lessons: '1 textbook unit', teacher: 'Vikram Singh', desc: 'Independence chapters pending start.' }
                ].map((sub, idx) => (
                  <div key={idx} className="space-y-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-850 dark:text-slate-150">{sub.subject}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Faculty: Prof. {sub.teacher} • {sub.lessons}</p>
                      </div>
                      <span className={`text-xs font-black ${sub.rate === 100 ? 'text-emerald-600' : sub.rate > 0 ? 'text-indigo-650' : 'text-slate-400'}`}>
                        {sub.rate}% Covered
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${sub.rate}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.rate === 100 ? 'bg-emerald-500' : sub.rate > 0 ? 'bg-indigo-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 italic">"{sub.desc}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: COMPLETION STATISTICS */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Statistical indices */}
              <div className={`p-6 rounded-2xl border lg:col-span-1 ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-sm mb-4">Curriculum Indexes</h4>
                
                <div className="space-y-4">
                  {[
                    { label: 'Completed Syllabus Ratio', value: `${completedLessonsCount} / ${totalLessons}`, rate: Math.round((completedLessonsCount/totalLessons)*100) },
                    { label: 'In-flight Sessions Ratio', value: `${ongoingLessonsCount} / ${totalLessons}`, rate: Math.round((ongoingLessonsCount/totalLessons)*100) },
                    { label: 'Pending Syllabus Ratio', value: `${pendingLessonsCount} / ${totalLessons}`, rate: Math.round((pendingLessonsCount/totalLessons)*100) }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-1.5 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{stat.label}</span>
                        <span className="font-bold">{stat.value} ({stat.rate}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${stat.rate}%` }}
                          className="bg-blue-600 h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject progression rankings */}
              <div className={`p-6 rounded-2xl border lg:col-span-2 ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-sm mb-4">Course Execution Standings by Section</h4>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b dark:border-slate-800 text-slate-400 font-semibold">
                        <th className="pb-2.5">Subject</th>
                        <th className="pb-2.5">Target Section</th>
                        <th className="pb-2.5">Primary Teacher</th>
                        <th className="pb-2.5">Execution Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold">
                      {lessons.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/20">
                          <td className="py-2.5 font-bold text-slate-850 dark:text-slate-100">{l.subject}</td>
                          <td className="py-2.5">{l.classSection}</td>
                          <td className="py-2.5 text-slate-500">Prof. {l.teacherName}</td>
                          <td className="py-2.5">
                            <span className={`text-[10px] font-bold ${
                              l.status === 'Completed' ? 'text-emerald-600' : l.status === 'Ongoing' ? 'text-indigo-650' : 'text-slate-400'
                            }`}>{l.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Details Dialog */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Lesson Outline & Summary
              </h3>
              <button onClick={() => setSelectedLesson(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  {selectedLesson.subject.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{selectedLesson.topic}</h4>
                  <p className="text-xs text-slate-400">{selectedLesson.subject} • {selectedLesson.classSection}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Educator Name:</span>
                  <span className="font-bold">{selectedLesson.teacherName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Scheduled Date:</span>
                  <span className="font-bold">{selectedLesson.date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Session Duration:</span>
                  <span className="font-bold">{selectedLesson.durationMinutes} minutes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Chapter Progress:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedLesson.progressPct}% Completed</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-medium">Syllabus Status:</span>
                  <span className="font-bold uppercase tracking-wider text-[10px]">{selectedLesson.status}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Lesson Log Remarks:</span>
                <p className="text-xs p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                  {selectedLesson.remarks}
                </p>
              </div>

              <button
                onClick={() => setSelectedLesson(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Objectives Outline
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
