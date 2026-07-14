import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  ERPDataState, 
  Teacher, 
  AttendanceRecord, 
  ExtraClassRequest, 
  SubstituteAssignment, 
  SystemNotification,
  DayOfWeek,
  TimetableSlot,
  LeaveRequest,
  SystemSettings
} from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Helper to determine day order
const daysOrder: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Default Settings
const defaultSettings: SystemSettings = {
  schoolInfo: {
    name: "XYZ Public School",
    address: "123 Academic Block, North Sector",
    email: "admin@xyz.edu",
    phone: "+91 11 2345 6789",
    board: "CBSE"
  },
  academicSession: {
    year: "2026-2027",
    term: "Term 1"
  },
  departments: [
    "Mathematics", "Science", "Languages", "Social Sciences", "Arts & Physical Ed"
  ],
  subjects: [
    "Mathematics", "Science (Physics)", "English Literature", "Chemistry", "History & Civics",
    "Computer Science", "Biology", "Geography", "Art & Design",
    "Physical Education", "English Grammar", "Economics & Commerce", "French Language", "Physics"
  ],
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periodDuration: 50,
  schoolTimings: {
    start: "08:30 AM",
    end: "02:40 PM",
    lunchStart: "12:10 PM",
    lunchEnd: "01:00 PM"
  },
  holidayCalendar: [
    { id: "h1", name: "Independence Day", date: "2026-08-15" },
    { id: "h2", name: "Gandhi Jayanti", date: "2026-10-02" },
    { id: "h3", name: "Christmas Day", date: "2026-12-25" }
  ],
  notificationSettings: {
    emailAlerts: true,
    slackAlerts: false,
    systemLogsLevel: "all"
  }
};

// Generate clean template schedules for the 15 teachers
function seedInitialData(): ERPDataState {
  const teacherNames = [
    'Aarav Sharma', 'Priya Mehta', 'Rahul Verma', 'Sneha Kapoor', 'Vikram Singh',
    'Ananya Das', 'Rohan Gupta', 'Neha Iyer', 'Karan Malhotra', 'Ishita Roy',
    'Aditya Nair', 'Pooja Chatterjee', 'Manish Yadav', 'Kavya Menon', 'Arjun Patel'
  ];

  const subjects = [
    'Mathematics', 'Science (Physics)', 'English Literature', 'Chemistry', 'History & Civics',
    'Computer Science', 'Mathematics', 'Biology', 'Geography', 'Art & Design',
    'Physical Education', 'English Grammar', 'Economics & Commerce', 'French Language', 'Physics'
  ];

  const classes = [
    'Grade 10-A', 'Grade 10-B', 'Grade 9-A', 'Grade 11-A', 'Grade 12-A',
    'Grade 12-B', 'Grade 9-B', 'Grade 11-B', 'Grade 9-A', 'Grade 10-B',
    'Grade 11-A', 'Grade 10-A', 'Grade 12-A', 'Grade 11-B', 'Grade 12-B'
  ];

  const teachers: Teacher[] = teacherNames.map((name, index) => {
    const id = `t${index + 1}`;
    const subject = subjects[index];
    const defaultClass = classes[index];
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@xyz.edu`;
    const phone = `+91 ${Math.floor(8000000000 + Math.random() * 2000000000)}`;

    const schedule: any = {
      Monday: Array(6).fill(null),
      Tuesday: Array(6).fill(null),
      Wednesday: Array(6).fill(null),
      Thursday: Array(6).fill(null),
      Friday: Array(6).fill(null)
    };

    return {
      id,
      name,
      email,
      phone,
      subject,
      classSection: defaultClass,
      status: 'Active',
      schedule
    };
  });

  const classAvailability: { [day: string]: boolean[][] } = {};
  daysOrder.forEach(day => {
    classAvailability[day] = Array(6).fill(0).map(() => Array(20).fill(false)); 
  });

  const classList = [
    'Grade 10-A', 'Grade 10-B', 'Grade 9-A', 'Grade 9-B', 
    'Grade 11-A', 'Grade 11-B', 'Grade 12-A', 'Grade 12-B'
  ];

  teachers.forEach((t, tIdx) => {
    daysOrder.forEach((day, dIdx) => {
      let periodsAssigned = 0;
      const targetPeriods = 2 + (tIdx + dIdx) % 2; // either 2 or 3 periods

      for (let p = 0; p < 6; p++) {
        if (periodsAssigned >= targetPeriods) break;

        const targetClass = (p % 2 === 0) ? t.classSection : classList[(tIdx + p) % classList.length];
        const classIndex = classList.indexOf(targetClass);

        if (!classAvailability[day][p][classIndex]) {
          t.schedule[day][p] = {
            subject: t.subject,
            classSection: targetClass,
            room: `Room ${100 + classIndex + 1}`
          };
          classAvailability[day][p][classIndex] = true;
          periodsAssigned++;
        }
      }
    });
  });

  const attendance: AttendanceRecord[] = [];
  const startDay = new Date('2026-05-10');
  const todayDateStr = '2026-05-25'; // Fixed anchor date

  for (let d = 0; d < 16; d++) {
    const checkDate = new Date(startDay.getTime() + d * 24 * 60 * 60 * 1000);
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (dayName === 'Saturday' || dayName === 'Sunday') continue;
    
    const dayOfWeek = dayName as DayOfWeek;
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dateStr > todayDateStr) break;

    teachers.forEach((teacher) => {
      let status: 'Present' | 'Absent' = 'Present';
      
      if (teacher.id === 't5' && dateStr === '2026-05-21') {
        status = 'Absent';
      } else if (teacher.id === 't2' && dateStr === '2026-05-18') {
        status = 'Absent';
      } else if (Math.random() < 0.05) {
        status = 'Absent';
      }

      const record: AttendanceRecord = {
        id: `att_${dateStr}_${teacher.id}`,
        date: dateStr,
        teacherId: teacher.id,
        status
      };

      if (status === 'Absent') {
        record.substituteAssigned = true;
        record.substitutes = {};
        
        const activePeriods: number[] = [];
        teacher.schedule[dayOfWeek].forEach((slot, pIdx) => {
          if (slot) activePeriods.push(pIdx);
        });

        activePeriods.forEach((pIdx) => {
          const eligibleSub = teachers.find(
            otherT => otherT.id !== teacher.id && otherT.schedule[dayOfWeek][pIdx] === null
          );
          if (eligibleSub) {
            record.substitutes![pIdx] = eligibleSub.id;
          }
        });
      }

      attendance.push(record);
    });
  }

  const substituteAssignments: SubstituteAssignment[] = [
    {
      id: 'sub_1',
      date: '2026-05-21',
      day: 'Thursday',
      periodIndex: 1,
      classSection: 'Grade 12-A',
      absentTeacherId: 't5',
      absentTeacherName: 'Vikram Singh',
      substituteTeacherId: 't1',
      substituteTeacherName: 'Aarav Sharma',
      subject: 'History & Civics',
      status: 'Completed',
      createdAt: '2026-05-21T08:00:00.000Z'
    },
    {
      id: 'sub_2',
      date: '2026-05-21',
      day: 'Thursday',
      periodIndex: 3,
      classSection: 'Grade 12-A',
      absentTeacherId: 't5',
      absentTeacherName: 'Vikram Singh',
      substituteTeacherId: 't12',
      substituteTeacherName: 'Pooja Chatterjee',
      subject: 'History & Civics',
      status: 'Completed',
      createdAt: '2026-05-21T08:00:00.000Z'
    }
  ];

  const extraClassRequests: ExtraClassRequest[] = [
    {
      id: 'ext_1',
      teacherId: 't3',
      teacherName: 'Rahul Verma',
      subject: 'English Literature',
      classSection: 'Grade 9-A',
      date: '2026-05-26',
      day: 'Tuesday',
      periodIndex: 4,
      status: 'Approved',
      createdAt: '2026-05-25T03:30:00.000Z'
    },
    {
      id: 'ext_2',
      teacherId: 't4',
      teacherName: 'Sneha Kapoor',
      subject: 'Chemistry',
      classSection: 'Grade 11-A',
      date: '2026-05-27',
      day: 'Wednesday',
      periodIndex: 2,
      status: 'Pending',
      createdAt: '2026-05-25T05:00:00.000Z'
    }
  ];

  const notifications: SystemNotification[] = [
    {
      id: 'n_leave_1',
      title: 'Leave Request Pending Approval',
      message: 'Priya Mehta requested Casual Leave due to family wedding.',
      type: 'warning',
      createdAt: '2026-05-25T08:15:00.000Z',
      read: false,
      category: 'leave',
      priority: 'high',
      relatedRecordId: 'lv_2',
      meta: { teacherName: 'Priya Mehta', date: '25 May 2026', reason: 'Casual Leave', status: 'Pending Approval' }
    },
    {
      id: 'n_att_1',
      title: 'Teacher Attendance Not Submitted',
      message: 'Daily classroom teacher attendance register has not been finalized yet.',
      type: 'danger',
      createdAt: '2026-05-25T08:00:00.000Z',
      read: false,
      category: 'attendance',
      priority: 'high'
    },
    {
      id: 'n_att_2',
      title: 'Attendance Correction Requested',
      message: 'Rohan Gupta requested morning session status correction.',
      type: 'warning',
      createdAt: '2026-05-24T15:30:00.000Z',
      read: true,
      category: 'attendance',
      priority: 'medium'
    },
    {
      id: 'n_sub_1',
      title: 'Teacher Absent Today',
      message: 'Vikram Singh (Physics) is absent today. Coverage auto-generated.',
      type: 'danger',
      createdAt: '2026-05-25T08:05:00.000Z',
      read: false,
      category: 'substitute',
      priority: 'high',
      meta: { teacherName: 'Vikram Singh' }
    },
    {
      id: 'n_sub_2',
      title: 'Assigned Substitute Accepted',
      message: 'Pooja Chatterjee has accepted the substitute coverage slot.',
      type: 'success',
      createdAt: '2026-05-25T08:12:00.000Z',
      read: false,
      category: 'substitute',
      priority: 'medium',
      meta: { teacherName: 'Pooja Chatterjee' }
    },
    {
      id: 'n_rep_1',
      title: 'Weekly Attendance Report Ready',
      message: 'Faculties coverage ratios and attendance statistics have been updated.',
      type: 'info',
      createdAt: '2026-05-25T05:30:00.000Z',
      read: false,
      category: 'reports',
      priority: 'low'
    },
    {
      id: 'n_sys_1',
      title: 'System State Backup Completed',
      message: 'Weekly secure server parameters and schedules backup succeeded.',
      type: 'success',
      createdAt: '2026-05-25T01:00:00.000Z',
      read: false,
      category: 'system',
      priority: 'low'
    }
  ];

  const leaveRequests: LeaveRequest[] = [
    {
      id: 'lv_1',
      teacherId: 't5',
      teacherName: 'Vikram Singh',
      subject: 'Physics',
      startDate: '2026-05-21',
      endDate: '2026-05-21',
      leaveType: 'Sick Leave',
      reason: 'Severe health checkup required.',
      status: 'Approved',
      createdAt: '2026-05-20T16:00:00.000Z',
      reviewComment: 'Approved by Administration. Get well soon!'
    },
    {
      id: 'lv_2',
      teacherId: 't2',
      teacherName: 'Priya Mehta',
      subject: 'Science (Physics)',
      startDate: '2026-05-27',
      endDate: '2026-05-28',
      leaveType: 'Casual Leave',
      reason: 'Attending family wedding out of station.',
      status: 'Pending',
      createdAt: '2026-05-25T07:15:00.000Z'
    }
  ];

  return {
    teachers,
    attendance,
    extraClassRequests,
    substituteAssignments,
    notifications,
    leaveRequests,
    settings: defaultSettings
  };
}

// Low level file persistence helper
function loadState(): ERPDataState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const data = seedInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return data;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    
    // Safety check for outdated models
    if (!parsed.teachers || !parsed.settings) {
      const data = seedInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return data;
    }
    return parsed;
  } catch (e) {
    console.error("Failed loading JSON database state, re-seeding.", e);
    const data = seedInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return data;
  }
}

function saveState(state: ERPDataState) {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

// ------------------- API CONTROLLERS -------------------

// 1. Get full state
app.get('/api/state', (req, res) => {
  const state = loadState();
  res.json(state);
});

// 2. User Authentication (Simplified to Admin and Teacher)
app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;
  const state = loadState();

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Please supply email, password, and portal role.' });
  }

  // 1. Admin Verification
  if (role === 'admin' || role === 'principal' || role === 'superadmin') {
    if (email.toLowerCase() === 'admin@xyz.edu' && password === 'admin123') {
      return res.json({
        session: {
          userId: 'admin_1',
          name: 'Administrator',
          email: 'admin@xyz.edu',
          role: 'admin'
        }
      });
    }
  }

  // 2. Teacher Verification
  if (role === 'teacher') {
    const matched = state.teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
    if (matched && password === 'teach123') {
      return res.json({
        session: {
          userId: matched.id,
          name: matched.name,
          email: matched.email,
          role: 'teacher'
        }
      });
    }
  }

  return res.status(401).json({ error: 'Invalid school credentials or portal mismatch.' });
});

// 3. Teachers CRUD
app.post('/api/teachers', (req, res) => {
  const state = loadState();
  const newT = req.body as Teacher;
  
  if (!newT.name || !newT.email) {
    return res.status(400).json({ error: 'Name and email are mandatory properties.' });
  }

  state.teachers.push(newT);
  
  // Log notification
  state.notifications.unshift({
    id: `n_sys_${Date.now()}`,
    title: 'New Teacher Profile Registered',
    message: `${newT.name} (${newT.subject}) enrolled under homeroom class ${newT.classSection}.`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'system'
  });

  saveState(state);
  res.json({ success: true, state });
});

app.put('/api/teachers/:id', (req, res) => {
  const state = loadState();
  const { id } = req.params;
  const index = state.teachers.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Educator profile not found.' });
  }

  state.teachers[index] = { ...state.teachers[index], ...req.body };
  saveState(state);
  res.json({ success: true, state });
});

app.delete('/api/teachers/:id', (req, res) => {
  const state = loadState();
  const { id } = req.params;
  const index = state.teachers.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Educator profile not found.' });
  }

  const name = state.teachers[index].name;
  state.teachers.splice(index, 1);
  
  // Remove future substitute assignments as well
  state.substituteAssignments = state.substituteAssignments.filter(
    sub => sub.substituteTeacherId !== id && sub.absentTeacherId !== id
  );

  state.notifications.unshift({
    id: `n_sys_${Date.now()}`,
    title: 'Teacher Roster Deletion',
    message: `${name} has been removed from the school faculty registry.`,
    type: 'danger',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'system'
  });

  saveState(state);
  res.json({ success: true, state });
});

// 4. Timetable management
app.post('/api/schedule/set-slot', (req, res) => {
  const state = loadState();
  const { teacherId, day, periodIndex, slot } = req.body;

  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Educator profile not found.' });
  }

  // Conflict test: check if other teacher has the SAME classSection scheduled at the SAME day/periodIndex
  if (slot) {
    const conflict = state.teachers.find(other => {
      if (other.id === teacherId) return false;
      const targetSlot = other.schedule[day as DayOfWeek]?.[periodIndex];
      return targetSlot && targetSlot.classSection === slot.classSection;
    });

    if (conflict) {
      return res.status(400).json({ 
        error: `Conflict! ${conflict.name} is already scheduled with class ${slot.classSection} at this period on ${day}.` 
      });
    }
  }

  teacher.schedule[day as DayOfWeek][periodIndex] = slot as TimetableSlot | null;
  saveState(state);
  res.json({ success: true, state });
});

// Extra Class Bookings
app.post('/api/extra-classes/request', (req, res) => {
  const state = loadState();
  const { teacherId, classSection, date, periodIndex } = req.body;

  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Educator profile not found.' });
  }

  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  // Real-time conflict checks:
  // 1. Is the teacher busy?
  if (teacher.schedule[dayName]?.[periodIndex] !== null) {
    return res.status(400).json({ error: 'Conflict! You already have a standard class slotted at this hour.' });
  }

  // 2. Is the student classSection busy?
  const classOccupied = state.teachers.some(other => {
    const slot = other.schedule[dayName]?.[periodIndex];
    return slot && slot.classSection === classSection;
  });

  if (classOccupied) {
    return res.status(400).json({ error: `Conflict! ${classSection} has another standard subject class scheduled during Period ${periodIndex + 1}.` });
  }

  const newRequest: ExtraClassRequest = {
    id: `ext_${Date.now()}`,
    teacherId,
    teacherName: teacher.name,
    subject: teacher.subject,
    classSection,
    date,
    day: dayName,
    periodIndex,
    status: 'Approved', // Auto-approved for rapid smart flow
    createdAt: new Date().toISOString()
  };

  state.extraClassRequests.unshift(newRequest);

  state.notifications.unshift({
    id: `n_acad_${Date.now()}`,
    title: 'Extra Study Session Booked',
    message: `${teacher.name} scheduled an extra session for ${classSection} on ${date} (Period ${periodIndex + 1}).`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'academic'
  });

  saveState(state);
  res.json({ success: true, state });
});

// 5. Daily Attendance Marking
app.post('/api/attendance/mark', (req, res) => {
  const state = loadState();
  const { date, teacherStatuses } = req.body; // { 't1': 'Present', 't2': 'Absent' }

  if (!date || !teacherStatuses) {
    return res.status(400).json({ error: 'Supply valid date and teacherStatuses map.' });
  }

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  Object.entries(teacherStatuses).forEach(([tId, status]) => {
    const existingIndex = state.attendance.findIndex(a => a.date === date && a.teacherId === tId);
    
    if (existingIndex !== -1) {
      const prevStatus = state.attendance[existingIndex].status;
      state.attendance[existingIndex].status = status as 'Present' | 'Absent';
      
      // If changed to present, clean up existing substitutes
      if (status === 'Present' && prevStatus === 'Absent') {
        state.attendance[existingIndex].substituteAssigned = false;
        state.attendance[existingIndex].substitutes = {};
        state.substituteAssignments = state.substituteAssignments.filter(
          sub => !(sub.date === date && sub.absentTeacherId === tId)
        );
      }
    } else {
      const record: AttendanceRecord = {
        id: `att_${date}_${tId}`,
        date,
        teacherId: tId,
        status: status as 'Present' | 'Absent',
        substitutes: {}
      };
      state.attendance.push(record);
    }

    // Auto-generate system alarm for absences
    if (status === 'Absent') {
      const teacher = state.teachers.find(t => t.id === tId);
      if (teacher) {
        const alreadyNotified = state.notifications.some(
          n => n.category === 'substitute' && n.meta?.date === date && n.meta?.teacherName === teacher.name
        );
        if (!alreadyNotified) {
          state.notifications.unshift({
            id: `n_abs_${Date.now()}_${tId}`,
            title: 'Teacher Marked Absent',
            message: `${teacher.name} is marked absent on ${date}. Open substitute manager to configure class coverage.`,
            type: 'danger',
            createdAt: new Date().toISOString(),
            read: false,
            category: 'substitute',
            priority: 'high',
            meta: { teacherName: teacher.name, date }
          });
        }
      }
    }
  });

  saveState(state);
  res.json({ success: true, state });
});

// 6. Substitution suggestions lookup
app.get('/api/substitutes/suggest', (req, res) => {
  const state = loadState();
  const { absentTeacherId, date, periodIndex } = req.query;

  if (!absentTeacherId || !date || periodIndex === undefined) {
    return res.status(400).json({ error: 'Supply absentTeacherId, date and periodIndex.' });
  }

  const pIdx = parseInt(periodIndex as string, 10);
  const dateObj = new Date(date as string);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  const absentTeacher = state.teachers.find(t => t.id === absentTeacherId);
  if (!absentTeacher) {
    return res.status(404).json({ error: 'Absent teacher not found.' });
  }

  // Find daily absences on this date
  const absentTeacherIdsToday = state.attendance
    .filter(att => att.date === date && att.status === 'Absent')
    .map(att => att.teacherId);

  // Filter eligible teachers: active, not absent today, free during this period, not the absent teacher
  const candidates = state.teachers.filter(t => {
    if (t.id === absentTeacherId) return false;
    if (t.status !== 'Active') return false;
    if (absentTeacherIdsToday.includes(t.id)) return false;
    
    // Period must be free
    const scheduleSlot = t.schedule[dayName]?.[pIdx];
    return scheduleSlot === null;
  });

  // Calculate recommendation scores
  const suggestions = candidates.map(t => {
    let score = 50; // baseline

    // 1. Subject Category compatibility
    const sameSubject = t.subject.toLowerCase() === absentTeacher.subject.toLowerCase();
    if (sameSubject) {
      score += 30;
    } else {
      // similar department (e.g. Science / Physics / Chemistry / Biology)
      const depts = [
        ['mathematics', 'computer science'],
        ['physics', 'chemistry', 'biology', 'science (physics)'],
        ['english literature', 'english grammar', 'french language'],
        ['history & civics', 'geography', 'economics & commerce']
      ];
      const sameDept = depts.some(d => d.includes(t.subject.toLowerCase()) && d.includes(absentTeacher.subject.toLowerCase()));
      if (sameDept) score += 15;
    }

    // 2. Count today's total active (busy) classes to protect teacher from over-work
    let busyCount = 0;
    t.schedule[dayName]?.forEach(slot => { if (slot) busyCount++; });
    score -= (busyCount * 5); // penalty for busy day today

    // 3. Count weekly workload (total periods)
    let weeklyWorkload = 0;
    Object.values(t.schedule).forEach(daySched => {
      daySched.forEach(slot => { if (slot) weeklyWorkload++; });
    });
    score -= (weeklyWorkload * 1); // slight penalty for heavy weekly load

    // 4. Balanced historical workload (substitute assignments)
    const historicalSubs = state.substituteAssignments.filter(sub => sub.substituteTeacherId === t.id).length;
    score -= (historicalSubs * 8); // penalty for taking too many substitutions in the past

    return {
      id: t.id,
      name: t.name,
      subject: t.subject,
      classSection: t.classSection,
      busyCount,
      weeklyWorkload,
      historicalSubs,
      score: Math.max(10, score)
    };
  });

  // Sort by score descending
  suggestions.sort((a, b) => b.score - a.score);

  res.json({ suggestions });
});

// 7. Assign substitute coverage
app.post('/api/substitutes/assign', (req, res) => {
  const state = loadState();
  const { date, periodIndex, absentTeacherId, substituteTeacherId } = req.body;

  const absentTeacher = state.teachers.find(t => t.id === absentTeacherId);
  const substituteTeacher = state.teachers.find(t => t.id === substituteTeacherId);

  if (!absentTeacher || !substituteTeacher) {
    return res.status(404).json({ error: 'Educator profiles missing.' });
  }

  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  const pIdx = parseInt(periodIndex, 10);

  // Target slot details being covered
  const targetSlot = absentTeacher.schedule[dayName]?.[pIdx];
  if (!targetSlot) {
    return res.status(400).json({ error: 'This slot is already free in the absent teacher schedule.' });
  }

  const assignment: SubstituteAssignment = {
    id: `sub_${Date.now()}`,
    date,
    day: dayName,
    periodIndex: pIdx,
    classSection: targetSlot.classSection,
    absentTeacherId,
    absentTeacherName: absentTeacher.name,
    substituteTeacherId,
    substituteTeacherName: substituteTeacher.name,
    subject: targetSlot.subject,
    status: 'Assigned',
    createdAt: new Date().toISOString()
  };

  // Insert assignment
  state.substituteAssignments.unshift(assignment);

  // Update attendance record coverage map
  const attRecord = state.attendance.find(a => a.date === date && a.teacherId === absentTeacherId);
  if (attRecord) {
    attRecord.substituteAssigned = true;
    if (!attRecord.substitutes) attRecord.substitutes = {};
    attRecord.substitutes[pIdx] = substituteTeacherId;
  }

  // Log Notification
  state.notifications.unshift({
    id: `n_sub_${Date.now()}`,
    title: 'Substitution Assigned',
    message: `${substituteTeacher.name} successfully assigned to cover ${targetSlot.classSection} (Period ${pIdx + 1}) for ${absentTeacher.name}.`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'substitute',
    priority: 'medium',
    relatedRecordId: assignment.id,
    meta: { teacherName: substituteTeacher.name, date, classSection: targetSlot.classSection }
  });

  saveState(state);
  res.json({ success: true, state });
});

// 8. Leave Management Application
app.post('/api/leaves/apply', (req, res) => {
  const state = loadState();
  const { teacherId, startDate, endDate, leaveType, reason } = req.body;

  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Educator profile not found.' });
  }

  const newRequest: LeaveRequest = {
    id: `lv_${Date.now()}`,
    teacherId,
    teacherName: teacher.name,
    subject: teacher.subject,
    startDate,
    endDate,
    leaveType,
    reason,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  state.leaveRequests.unshift(newRequest);

  // Notify admin
  state.notifications.unshift({
    id: `n_lv_req_${Date.now()}`,
    title: 'New Leave Request Registered',
    message: `${teacher.name} requested ${leaveType} from ${startDate} to ${endDate}.`,
    type: 'warning',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'leave',
    priority: 'high',
    relatedRecordId: newRequest.id,
    meta: { teacherName: teacher.name, date: `${startDate} to ${endDate}`, reason: leaveType, status: 'Pending Approval' }
  });

  saveState(state);
  res.json({ success: true, state });
});

app.post('/api/leaves/:id/review', (req, res) => {
  const state = loadState();
  const { id } = req.params;
  const { status, reviewComment } = req.body; // 'Approved' | 'Rejected'

  const leave = state.leaveRequests.find(lv => lv.id === id);
  if (!leave) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  leave.status = status;
  leave.reviewComment = reviewComment;

  // If approved, dynamically update teacher's status
  if (status === 'Approved') {
    const teacher = state.teachers.find(t => t.id === leave.teacherId);
    if (teacher) {
      teacher.status = 'On Leave';
    }
  }

  state.notifications.unshift({
    id: `n_lv_rev_${Date.now()}`,
    title: `Leave Request ${status}`,
    message: `Leave application for ${leave.teacherName} has been ${status.toLowerCase()}.`,
    type: status === 'Approved' ? 'success' : 'danger',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'leave',
    priority: 'medium'
  });

  saveState(state);
  res.json({ success: true, state });
});

// 9. Notifications R/W
app.put('/api/notifications/:id', (req, res) => {
  const state = loadState();
  const { id } = req.params;
  const item = state.notifications.find(n => n.id === id);

  if (item) {
    item.read = true;
  }

  saveState(state);
  res.json({ success: true, state });
});

app.put('/api/notifications/read-all', (req, res) => {
  const state = loadState();
  state.notifications.forEach(n => n.read = true);
  saveState(state);
  res.json({ success: true, state });
});

app.delete('/api/notifications/:id', (req, res) => {
  const state = loadState();
  const { id } = req.params;
  state.notifications = state.notifications.filter(n => n.id !== id);
  saveState(state);
  res.json({ success: true, state });
});

// 10. Database flushing
app.post('/api/reset', (req, res) => {
  const data = seedInitialData();
  saveState(data);
  res.json({ success: true, state: data });
});

// 11. Custom settings endpoints
app.get('/api/settings', (req, res) => {
  const state = loadState();
  res.json({ settings: state.settings || defaultSettings });
});

app.post('/api/settings', (req, res) => {
  const state = loadState();
  state.settings = { ...defaultSettings, ...req.body };
  saveState(state);
  res.json({ success: true, state });
});

// ------------------- PRODUCTION/DEVELOPMENT PLATFORM SERVING -------------------

async function startServer() {
  // Vite middleware for development
  if (process.env.DISABLE_HMR === "true" || process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Timetable & Teacher Server booted on http://localhost:${PORT}`);
  });
}

startServer();
