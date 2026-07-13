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
  CalendarDays
} from 'lucide-react';

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
        
        <div className={`p-5 rounded-2xl border transition-all ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl">
              <Layers className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Courses</span>
          </div>
          <p className="text-2xl font-black">{totalLessons}</p>
          <div className="mt-2 text-xs font-semibold text-slate-400">Tracked Units</div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completed</span>
          </div>
          <p className="text-2xl font-black">{completedLessonsCount}</p>
          <div className="mt-2 text-xs font-semibold text-emerald-600">Archived Chapters</div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ongoing</span>
          </div>
          <p className="text-2xl font-black">{ongoingLessonsCount}</p>
          <div className="mt-2 text-xs font-semibold text-indigo-650">In Progress Active</div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <span className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl">
              <Calendar className="h-5 w-5" />
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pending Slotted</span>
          </div>
          <p className="text-2xl font-black">{pendingLessonsCount}</p>
          <div className="mt-2 text-xs font-semibold text-slate-400">Future scheduled periods</div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
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

      {/* Tab content container */}
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

    </div>
  );
}
