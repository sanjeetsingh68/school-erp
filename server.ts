import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { AsyncLocalStorage } from 'async_hooks';
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
  SystemSettings,
  SubstituteAuditLog
} from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

export const asyncLocalStorage = new AsyncLocalStorage<any>();

app.use(express.json());

app.use((req, res, next) => {
  asyncLocalStorage.run(req, next);
});

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
  periodDuration: 45,
  schoolTimings: {
    start: "08:00 AM",
    end: "02:30 PM",
    lunchStart: "12:15 PM",
    lunchEnd: "01:00 PM"
  },
  timetableVersion: 1,
  scheduleSlots: [
    { id: "s1", name: "Morning Assembly", type: "assembly", start: "08:00 AM", end: "08:15 AM", requiresAssignment: false },
    { id: "s2", name: "Zero Period", type: "zero_period", start: "08:15 AM", end: "09:00 AM", requiresAssignment: false },
    { id: "s3", name: "Period 1", type: "teaching", start: "09:00 AM", end: "09:45 AM", requiresAssignment: true },
    { id: "s4", name: "Period 2", type: "teaching", start: "09:45 AM", end: "10:30 AM", requiresAssignment: true },
    { id: "s5", name: "Short Break", type: "break", start: "10:30 AM", end: "10:45 AM", requiresAssignment: false },
    { id: "s6", name: "Period 3", type: "teaching", start: "10:45 AM", end: "11:30 AM", requiresAssignment: true },
    { id: "s7", name: "Period 4", type: "teaching", start: "11:30 AM", end: "12:15 PM", requiresAssignment: true },
    { id: "s8", name: "Lunch Break", type: "break", start: "12:15 PM", end: "01:00 PM", requiresAssignment: false },
    { id: "s9", name: "Period 5", type: "teaching", start: "01:00 PM", end: "01:45 PM", requiresAssignment: true },
    { id: "s10", name: "Period 6", type: "teaching", start: "01:45 PM", end: "02:30 PM", requiresAssignment: true },
    { id: "s11", name: "School Over", type: "school_over", start: "02:30 PM", end: "02:30 PM", requiresAssignment: false }
  ],
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
      Monday: Array(11).fill(null),
      Tuesday: Array(11).fill(null),
      Wednesday: Array(11).fill(null),
      Thursday: Array(11).fill(null),
      Friday: Array(11).fill(null),
      Saturday: Array(11).fill(null)
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

  const teachingIndices = [2, 3, 5, 6, 8, 9];

  const classAvailability: { [day: string]: boolean[][] } = {};
  daysOrder.forEach(day => {
    classAvailability[day] = Array(11).fill(0).map(() => Array(20).fill(false)); 
  });

  const classList = [
    'Grade 10-A', 'Grade 10-B', 'Grade 9-A', 'Grade 9-B', 
    'Grade 11-A', 'Grade 11-B', 'Grade 12-A', 'Grade 12-B'
  ];

  teachers.forEach((t, tIdx) => {
    daysOrder.forEach((day, dIdx) => {
      let periodsAssigned = 0;
      const targetPeriods = 2 + (tIdx + dIdx) % 2; // either 2 or 3 periods

      for (let i = 0; i < teachingIndices.length; i++) {
        if (periodsAssigned >= targetPeriods) break;
        const p = teachingIndices[i];

        const targetClass = (i % 2 === 0) ? t.classSection : classList[(tIdx + i) % classList.length];
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
      employeeId: 'EMP003',
      department: 'Languages',
      subject: 'English Literature',
      classSection: 'Grade 9-A',
      date: '2026-05-26',
      day: 'Tuesday',
      periodIndex: 4,
      requestType: 'Revision Class',
      priority: 'Normal',
      status: 'Approved',
      createdAt: '2026-05-25T03:30:00.000Z',
      submittedOn: '2026-05-25 11:30 AM',
      aiStatus: 'No conflict',
      aiValidationReasons: ['Teacher free during Period 5', 'Class Grade 9-A free during Period 5']
    },
    {
      id: 'ext_2',
      teacherId: 't4',
      teacherName: 'Sneha Kapoor',
      employeeId: 'EMP004',
      department: 'Science',
      subject: 'Chemistry',
      classSection: 'Grade 11-A',
      date: '2026-05-27',
      day: 'Wednesday',
      periodIndex: 2,
      requestType: 'Doubt Clearing',
      priority: 'High',
      status: 'Pending',
      createdAt: '2026-05-25T05:00:00.000Z',
      submittedOn: '2026-05-25 01:00 PM',
      aiStatus: 'No conflict',
      aiValidationReasons: ['Teacher free during Period 3', 'Class Grade 11-A free during Period 3']
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

function seedDemoData(): ERPDataState {
  const teacherNames = [
    'Rahul Sharma', 'Priya Singh', 'Amit Verma', 'Neha Gupta',
    'Aarav Sharma', 'Siddharth Malhotra', 'Kavya Iyer', 'Ananya Sen',
    'Rajesh Patel', 'Sunita Rao', 'Karan Johar', 'Vikram Malhotra',
    'Meera Nair', 'Swati Deshmukh', 'Manish Yadav', 'Kavya Menon',
    'Arjun Patel', 'Sanjay Dutt', 'Deepika Padukone', 'Ranbir Kapoor',
    'Alia Bhatt', 'Varun Dhawan', 'Shraddha Kapoor', 'Ayushmann Khurrana',
    'Bhumi Pednekar', 'Rajkummar Rao', 'Kriti Sanon', 'Kartik Aaryan',
    'Sara Ali Khan', 'Janhvi Kapoor', 'Ishaan Khatter', 'Ananya Panday',
    'Aditya Roy Kapur', 'Kiara Advani', 'Sidharth Malhotra', 'Vicky Kaushal',
    'Katrina Kaif', 'Ranveer Singh', 'Anushka Sharma', 'Virat Kohli',
    'Mahendra Dhoni', 'Sachin Tendulkar', 'Rohit Sharma', 'Shikhar Dhawan',
    'Hardik Pandya', 'Jasprit Bumrah', 'Ravindra Jadeja', 'Ravichandran Ashwin',
    'Cheteshwar Pujara', 'Ajinkya Rahane'
  ];

  const subjects = [
    'Mathematics', 'Science (Physics)', 'English Literature', 'Computer Science',
    'Mathematics', 'History & Civics', 'Chemistry', 'Biology',
    'Geography', 'Economics & Commerce', 'Art & Design', 'Physical Education',
    'French Language', 'English Grammar', 'Physics', 'Mathematics',
    'Chemistry', 'Biology', 'French Language', 'English Literature',
    'English Grammar', 'Art & Design', 'Geography', 'Computer Science',
    'Economics & Commerce', 'History & Civics', 'Mathematics', 'Physical Education',
    'Biology', 'Chemistry', 'Physics', 'English Literature',
    'History & Civics', 'Science (Physics)', 'Mathematics', 'Geography',
    'French Language', 'Physical Education', 'English Grammar', 'Physical Education',
    'Mathematics', 'Physical Education', 'Mathematics', 'English Literature',
    'Physical Education', 'Science (Physics)', 'Biology', 'Computer Science',
    'Economics & Commerce', 'History & Civics'
  ];

  const departments = [
    'Mathematics', 'Science', 'Languages', 'Computer Science',
    'Mathematics', 'Social Sciences', 'Science', 'Science',
    'Social Sciences', 'Social Sciences', 'Art & Design', 'Physical Education',
    'Languages', 'Languages', 'Science', 'Mathematics',
    'Science', 'Science', 'Languages', 'Languages',
    'Languages', 'Arts & Physical Ed', 'Social Sciences', 'Computer Science',
    'Social Sciences', 'Social Sciences', 'Mathematics', 'Arts & Physical Ed',
    'Science', 'Science', 'Science', 'Languages',
    'Social Sciences', 'Science', 'Mathematics', 'Social Sciences',
    'Languages', 'Arts & Physical Ed', 'Languages', 'Arts & Physical Ed',
    'Mathematics', 'Arts & Physical Ed', 'Mathematics', 'Languages',
    'Arts & Physical Ed', 'Science', 'Science', 'Computer Science',
    'Social Sciences', 'Social Sciences'
  ];

  const classList = [
    'Grade 6-A', 'Grade 6-B', 'Grade 7-A', 'Grade 7-B', 'Grade 8-A', 'Grade 8-B', 'Grade 8-C',
    'Grade 9-A', 'Grade 9-B', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B', 'Grade 12-A', 'Grade 12-B'
  ];

  const teachers: Teacher[] = teacherNames.map((name, index) => {
    const id = `demot${index + 1}`;
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@school.com`;
    const phone = `+91 ${Math.floor(9000000000 + Math.random() * 1000000000)}`;
    const schedule: any = {
      Monday: Array(11).fill(null),
      Tuesday: Array(11).fill(null),
      Wednesday: Array(11).fill(null),
      Thursday: Array(11).fill(null),
      Friday: Array(11).fill(null),
      Saturday: Array(11).fill(null)
    };

    return {
      id,
      name,
      email,
      phone,
      subject: subjects[index],
      classSection: classList[index % classList.length],
      status: 'Active',
      schedule,
      department: departments[index],
      employeeId: `DEMO${String(100 + index + 1).padStart(3, '0')}`,
      maxDailyHours: 5,
      maxWeeklyHours: 25,
      blockedFromSubstitutions: false
    };
  });

  const teachingIndices = [2, 3, 5, 6, 8, 9];
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  days.forEach((day, dIdx) => {
    teachingIndices.forEach((pIdx, pSeq) => {
      classList.forEach((classSec, cIdx) => {
        const tIdx = (cIdx + pSeq * 7 + dIdx * 3) % teachers.length;
        const teacher = teachers[tIdx];
        if (teacher && teacher.schedule[day][pIdx] === null) {
          teacher.schedule[day][pIdx] = {
            subject: teacher.subject,
            classSection: classSec,
            room: `Room ${101 + cIdx}`
          };
        }
      });
    });
  });

  const leaveRequests: LeaveRequest[] = [
    {
      id: 'demolv_1',
      teacherId: 'demot6',
      teacherName: 'Siddharth Malhotra',
      subject: 'History & Civics',
      startDate: '2026-05-24',
      endDate: '2026-05-28',
      leaveType: 'Casual Leave',
      reason: 'Family wedding ceremonies',
      status: 'Approved',
      createdAt: '2026-05-20T10:00:00.000Z'
    },
    {
      id: 'demolv_2',
      teacherId: 'demot14',
      teacherName: 'Swati Deshmukh',
      subject: 'English Grammar',
      startDate: '2026-05-26',
      endDate: '2026-05-26',
      leaveType: 'Sick Leave',
      reason: 'Dental appointment and checkup',
      status: 'Pending',
      createdAt: '2026-05-24T14:30:00.000Z'
    },
    {
      id: 'demolv_3',
      teacherId: 'demot25',
      teacherName: 'Bhumi Pednekar',
      subject: 'Economics & Commerce',
      startDate: '2026-05-22',
      endDate: '2026-05-23',
      leaveType: 'Duty Leave',
      reason: 'National economics pedagogy seminar',
      status: 'Rejected',
      createdAt: '2026-05-18T09:00:00.000Z',
      reviewComment: 'Insufficient notice and clashing with midterm examination scheduling.'
    }
  ];

  const extraClassRequests: ExtraClassRequest[] = [
    {
      id: 'demoext_1',
      teacherId: 'demot1',
      teacherName: 'Rahul Sharma',
      employeeId: 'DEMO001',
      department: 'Mathematics',
      subject: 'Mathematics',
      classSection: 'Grade 10-A',
      date: '2026-05-25',
      day: 'Monday',
      periodIndex: 5,
      requestType: 'Revision Class',
      reason: 'Mathematics Pre-Board revision on calculus theorems.',
      priority: 'High',
      status: 'Waiting for Matching',
      createdAt: '2026-05-24T08:00:00.000Z',
      submittedOn: '2026-05-24 10:00 AM'
    },
    {
      id: 'demoext_2',
      teacherId: 'demot2',
      teacherName: 'Priya Singh',
      employeeId: 'DEMO002',
      department: 'Science',
      subject: 'Science (Physics)',
      classSection: 'Grade 9-B',
      date: '2026-05-25',
      day: 'Monday',
      periodIndex: 6,
      requestType: 'Lab Session',
      reason: 'Science Practical: Ray optics experiment exercises.',
      priority: 'Normal',
      status: 'Waiting for Matching',
      createdAt: '2026-05-24T09:15:00.000Z',
      submittedOn: '2026-05-24 11:15 AM'
    },
    {
      id: 'demoext_3',
      teacherId: 'demot4',
      teacherName: 'Neha Gupta',
      employeeId: 'DEMO004',
      department: 'Computer Science',
      subject: 'Computer Science',
      classSection: 'Grade 11-A',
      date: '2026-05-27',
      day: 'Wednesday',
      periodIndex: 2,
      requestType: 'Competition Coaching',
      reason: 'Robotics Workshop prep for national challenge.',
      priority: 'High',
      status: 'Waiting for Matching',
      createdAt: '2026-05-24T15:00:00.000Z',
      submittedOn: '2026-05-24 05:00 PM'
    },
    {
      id: 'demoext_4',
      teacherId: 'demot3',
      teacherName: 'Amit Verma',
      employeeId: 'DEMO003',
      department: 'Languages',
      subject: 'English Literature',
      classSection: 'Grade 8-C',
      date: '2026-05-27',
      day: 'Wednesday',
      periodIndex: 3,
      requestType: 'Remedial Class',
      reason: 'Remedial English sentence structures for struggling students.',
      priority: 'Normal',
      status: 'Waiting for Matching',
      createdAt: '2026-05-25T02:00:00.000Z',
      submittedOn: '2026-05-25 10:00 AM'
    }
  ];

  const attendance: AttendanceRecord[] = [];
  const startDay = new Date('2026-05-18');
  const todayDateStr = '2026-05-25';

  for (let d = 0; d < 8; d++) {
    const checkDate = new Date(startDay.getTime() + d * 24 * 60 * 60 * 1000);
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (dayName === 'Sunday') continue;
    
    const dayOfWeek = dayName as DayOfWeek;
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dateStr > todayDateStr) break;

    teachers.forEach((teacher) => {
      let status: any = 'Present';
      if (teacher.id === 'demot1' && dateStr === '2026-05-25') {
        status = 'Absent';
      } else if (teacher.id === 'demot6' && dateStr >= '2026-05-24' && dateStr <= '2026-05-28') {
        status = 'On Leave';
      } else if (Math.random() < 0.03) {
        status = 'Absent';
      }

      const record: AttendanceRecord = {
        id: `demo_att_${dateStr}_${teacher.id}`,
        date: dateStr,
        teacherId: teacher.id,
        status,
        substitutes: {}
      };
      attendance.push(record);
    });
  }

  const notifications: SystemNotification[] = [
    {
      id: 'demon_1',
      title: 'Demo Mode Activated',
      message: 'Welcome to the Smart School Timetable & substitution planner. Explore all simulation controls under the AI Demonstration tab!',
      type: 'success',
      createdAt: new Date().toISOString(),
      read: false,
      category: 'system',
      priority: 'high'
    }
  ];

  const settings: SystemSettings = {
    ...defaultSettings,
    schoolInfo: {
      name: "Smart Oak Academy (Demo)",
      address: "Oak Valley Campus, New Delhi",
      email: "demo@school.com",
      phone: "+91 11 9876 5432",
      board: "CBSE"
    }
  };

  const state: ERPDataState = {
    teachers,
    attendance,
    extraClassRequests,
    substituteAssignments: [],
    notifications,
    leaveRequests,
    settings,
    substituteAuditLogs: []
  };

  runAutomatedAIEngine(state);
  return state;
}

// Low level file persistence helper
function loadState(): ERPDataState {
  const req = asyncLocalStorage.getStore();
  const isDemo = req && req.headers && req.headers['x-demo-mode'] === 'true';
  const file = isDemo ? path.join(process.cwd(), 'demo_db.json') : DB_FILE;

  try {
    if (!fs.existsSync(file)) {
      const data = isDemo ? seedDemoData() : seedInitialData();
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return data;
    }
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    
    // Safety check for outdated models
    if (!parsed.teachers || !parsed.settings) {
      const data = isDemo ? seedDemoData() : seedInitialData();
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return data;
    }
    return parsed;
  } catch (e) {
    console.error("Failed loading JSON database state, re-seeding.", e);
    const data = isDemo ? seedDemoData() : seedInitialData();
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return data;
  }
}

function saveState(state: ERPDataState) {
  const req = asyncLocalStorage.getStore();
  const isDemo = req && req.headers && req.headers['x-demo-mode'] === 'true';
  const file = isDemo ? path.join(process.cwd(), 'demo_db.json') : DB_FILE;
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
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
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Please supply email and password.' });
  }

  // 0. Demo Mode Verification
  if (email.toLowerCase() === 'demo@school.com' && password === 'demo123') {
    const demoDbFile = path.join(process.cwd(), 'demo_db.json');
    if (fs.existsSync(demoDbFile)) {
      try {
        fs.unlinkSync(demoDbFile);
      } catch (e) {}
    }
    return res.json({
      session: {
        userId: 'demo_admin',
        name: 'Demo Administrator',
        email: 'demo@school.com',
        role: 'admin',
        isDemo: true
      }
    });
  }

  if (!role) {
    return res.status(400).json({ error: 'Please supply portal role.' });
  }

  const state = loadState();

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

app.post('/api/demo/reset', (req, res) => {
  const file = path.join(process.cwd(), 'demo_db.json');
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    const data = seedDemoData();
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    res.json({ success: true, state: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed resetting demo data' });
  }
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
  runAutomatedAIEngine(state);
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

  runAutomatedAIEngine(state);
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
  runAutomatedAIEngine(state);
  saveState(state);
  res.json({ success: true, state });
});

// 4a. Class Timetable Bulk Import
app.post('/api/schedule/import-timetable-data', (req, res) => {
  const state = loadState();
  const { classSection, slots } = req.body;

  if (!classSection) {
    return res.status(400).json({ error: 'Please supply a classSection name.' });
  }

  // 1. Clear previous slots for this classSection across all teachers
  state.teachers.forEach(teacher => {
    Object.keys(teacher.schedule).forEach(day => {
      const dayName = day as DayOfWeek;
      if (teacher.schedule[dayName]) {
        teacher.schedule[dayName].forEach((slot, idx) => {
          if (slot && slot.classSection === classSection) {
            teacher.schedule[dayName][idx] = null;
          }
        });
      }
    });
  });

  // 2. Assign the new slots
  let assignedCount = 0;
  if (Array.isArray(slots)) {
    slots.forEach(slot => {
      const teacher = state.teachers.find(t => t.id === slot.teacherId);
      if (teacher) {
        const day = slot.day as DayOfWeek;
        // Ensure day array exists and has length 8
        if (!teacher.schedule[day]) {
          teacher.schedule[day] = Array(8).fill(null);
        }
        if (teacher.schedule[day].length < 8) {
          const extension = Array(8 - teacher.schedule[day].length).fill(null);
          teacher.schedule[day] = [...teacher.schedule[day], ...extension];
        }

        teacher.schedule[day][slot.periodIndex] = {
          subject: slot.subject,
          classSection: classSection,
          room: slot.room
        };
        assignedCount++;
      }
    });
  }

  // Log Notification
  state.notifications.unshift({
    id: `n_sys_import_${Date.now()}`,
    title: `Timetable Imported: ${classSection}`,
    message: `Uploaded new academic schedule for ${classSection} containing ${assignedCount} periods.`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'system'
  });

  runAutomatedAIEngine(state);
  saveState(state);
  res.json({ success: true, state });
});

// 4b. Teacher Profiles Bulk Import
app.post('/api/teachers/import-bulk', (req, res) => {
  const state = loadState();
  const { teachers } = req.body;

  if (!Array.isArray(teachers) || teachers.length === 0) {
    return res.status(400).json({ error: 'Supply an array of teacher profiles to import.' });
  }

  let importedCount = 0;
  let updatedCount = 0;

  teachers.forEach(row => {
    const email = String(row.Email || row.email || '').trim().toLowerCase();
    const name = String(row.TeacherName || row.name || '').trim();
    if (!name || !email) return;

    // Split subjects
    const subjectsRaw = String(row.Subjects || row.subjects || row.subject || '');
    const subjects = subjectsRaw ? subjectsRaw.split(',').map(s => s.trim()) : [];
    const primarySubject = subjects[0] || 'Mathematics';

    const phone = String(row.Phone || row.phone || `+91 ${Math.floor(8000000000 + Math.random() * 2000000000)}`);
    const homeClass = String(row.HomeClass || row.classSection || 'Grade 10-A');
    const employeeId = String(row.EmployeeID || row.employeeId || `EMP${Date.now()}_${Math.floor(Math.random() * 100)}`);
    const department = String(row.Department || row.department || 'Science');
    const designation = String(row.Designation || row.designation || 'Teacher');
    const qualification = String(row.Qualification || row.qualification || 'B.Ed.');
    const experience = row.Experience !== undefined ? row.Experience : 3;
    const maxDailyHours = row.MaxDailyHours !== undefined ? parseInt(row.MaxDailyHours, 10) : 6;
    const maxWeeklyHours = row.MaxWeeklyHours !== undefined ? parseInt(row.MaxWeeklyHours, 10) : 30;

    const existingIdx = state.teachers.findIndex(t => t.email.toLowerCase() === email);
    if (existingIdx !== -1) {
      // Update existing
      state.teachers[existingIdx] = {
        ...state.teachers[existingIdx],
        name,
        phone,
        subject: primarySubject,
        classSection: homeClass,
        employeeId,
        department,
        designation,
        qualification,
        experience,
        subjects,
        maxDailyHours,
        maxWeeklyHours
      };
      updatedCount++;
    } else {
      // Create new with blank dynamic schedule
      const slotCount = state.settings.scheduleSlots?.length || 11;
      const initialSchedule: any = {
        Monday: Array(slotCount).fill(null),
        Tuesday: Array(slotCount).fill(null),
        Wednesday: Array(slotCount).fill(null),
        Thursday: Array(slotCount).fill(null),
        Friday: Array(slotCount).fill(null),
        Saturday: Array(slotCount).fill(null)
      };

      state.teachers.push({
        id: `t_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        name,
        email,
        phone,
        subject: primarySubject,
        classSection: homeClass,
        status: 'Active',
        schedule: initialSchedule,
        employeeId,
        department,
        designation,
        qualification,
        experience,
        subjects,
        classesAssigned: [homeClass],
        sectionsAssigned: [homeClass.split('-')[1] || 'A'],
        maxDailyHours,
        maxWeeklyHours
      });
      importedCount++;
    }
  });

  state.notifications.unshift({
    id: `n_sys_teachers_${Date.now()}`,
    title: 'Faculty Registry Imported',
    message: `Successfully bulk-processed ${importedCount + updatedCount} teacher profiles (${importedCount} new, ${updatedCount} updated).`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'system'
  });

  runAutomatedAIEngine(state);
  saveState(state);
  res.json({ success: true, state });
});

// Helper to find alternative free periods for the teacher and class
function getSmartAlternatives(state: ERPDataState, teacherId: string, classSection: string, originalDateStr: string) {
  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) return [];

  const alternatives: { day: DayOfWeek; periodIndex: number; label: string; date: string }[] = [];
  const baseDate = new Date(originalDateStr);

  // Scan next 7 days
  for (let offset = 0; offset < 7; offset++) {
    if (alternatives.length >= 4) break;

    const checkDate = new Date(baseDate);
    checkDate.setDate(baseDate.getDate() + offset);
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (dayName === 'Sunday') continue;

    const checkDateStr = checkDate.toISOString().split('T')[0];
    const dayOfWeek = dayName as DayOfWeek;

    // Check teacher leave/absence on checkDate
    const isAbsent = state.attendance.some(att => att.date === checkDateStr && att.teacherId === teacherId && att.status !== 'Present');
    const hasApprovedLeave = state.leaveRequests.some(lv => 
      lv.teacherId === teacherId && 
      lv.status === 'Approved' && 
      checkDateStr >= lv.startDate && 
      checkDateStr <= lv.endDate
    );
    if (isAbsent || hasApprovedLeave) continue;

    // Check periods
    const slotCount = state.settings.scheduleSlots?.length || 11;
    for (let pIdx = 0; pIdx < slotCount; pIdx++) {
      if (alternatives.length >= 4) break;

      const slotConfig = state.settings.scheduleSlots?.[pIdx];
      if (!slotConfig || (!slotConfig.requiresAssignment && slotConfig.type !== 'zero_period')) continue;
      if (slotConfig.type === 'break' || slotConfig.type === 'assembly' || slotConfig.type === 'school_over') continue;

      // 1. Is teacher free in standard schedule?
      if (teacher.schedule[dayOfWeek]?.[pIdx] !== null) continue;

      // 2. Is teacher subbing?
      const isSubbing = state.substituteAssignments.some(sub => 
        sub.date === checkDateStr && 
        sub.periodIndex === pIdx && 
        sub.substituteTeacherId === teacherId
      );
      if (isSubbing) continue;

      // 3. Is classSection free?
      const classOccupied = state.teachers.some(other => {
        const slot = other.schedule[dayOfWeek]?.[pIdx];
        return slot && slot.classSection === classSection;
      });
      if (classOccupied) continue;

      // 4. Any other extra classes for this teacher or class at this time?
      const hasOtherExtra = state.extraClassRequests.some(ext => 
        ext.date === checkDateStr && 
        ext.periodIndex === pIdx && 
        (ext.teacherId === teacherId || ext.classSection === classSection) && 
        ext.status === 'Approved'
      );
      if (hasOtherExtra) continue;

      // 5. Workload checks
      let dailyWorkloadCount = 0;
      teacher.schedule[dayOfWeek]?.forEach(slot => { if (slot) dailyWorkloadCount++; });
      const subCountToday = state.substituteAssignments.filter(sub => 
        sub.date === checkDateStr && 
        sub.substituteTeacherId === teacherId
      ).length;
      const extraCountToday = state.extraClassRequests.filter(ext => 
        ext.date === checkDateStr && 
        ext.teacherId === teacherId && 
        ext.status === 'Approved'
      ).length;
      if (dailyWorkloadCount + subCountToday + extraCountToday >= (teacher.maxDailyHours || 6)) continue;

      // Found a safe candidate!
      const label = `${dayOfWeek} ${slotConfig.name}`;
      alternatives.push({
        day: dayOfWeek,
        periodIndex: pIdx,
        label,
        date: checkDateStr
      });
    }
  }

  return alternatives;
}

// Full AI validations function for Extra Class Request
function validateExtraClassRequest(state: ERPDataState, payload: {
  teacherId: string;
  classSection: string;
  date: string;
  periodIndex: number;
}) {
  const { teacherId, classSection, date, periodIndex } = payload;
  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return { valid: false, reason: "Teacher profile not found." };
  }

  if (!date) {
    return { valid: true };
  }

  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  if (dayName === 'Sunday') {
    return { valid: false, reason: "Cannot schedule classes on Sundays." };
  }
  const dayOfWeek = dayName as DayOfWeek;

  // 1. Leave / Attendance
  const isAbsent = state.attendance.some(att => att.date === date && att.teacherId === teacherId && att.status !== 'Present');
  const hasApprovedLeave = state.leaveRequests.some(lv => 
    lv.teacherId === teacherId && 
    lv.status === 'Approved' && 
    date >= lv.startDate && 
    date <= lv.endDate
  );
  if (isAbsent || hasApprovedLeave) {
    return { valid: false, reason: `You are marked as absent or on leave on ${date}.` };
  }

  // 2. Timetable / Free periods
  const currentSlot = teacher.schedule[dayOfWeek]?.[periodIndex];
  if (currentSlot !== null) {
    return { 
      valid: false, 
      reason: `You are already teaching Grade ${currentSlot.classSection.replace(/Grade\s*/gi, '')} during ${state.settings.scheduleSlots?.[periodIndex]?.name || `Period ${periodIndex + 1}`}.`
    };
  }

  // 3. School working hours / special periods
  const slotConfig = state.settings.scheduleSlots?.[periodIndex];
  if (slotConfig) {
    if (slotConfig.type === 'break') {
      return { valid: false, reason: `${slotConfig.name} is a designated non-teaching break.` };
    }
    if (slotConfig.type === 'assembly') {
      return { valid: false, reason: `${slotConfig.name} is scheduled for Morning Assembly.` };
    }
    if (slotConfig.type === 'school_over') {
      return { valid: false, reason: "Selected slot is outside of school working hours." };
    }
  }

  // 4. Double Bookings / Student availability
  const classOccupied = state.teachers.some(other => {
    const slot = other.schedule[dayOfWeek]?.[periodIndex];
    return slot && slot.classSection === classSection;
  });
  if (classOccupied) {
    return { valid: false, reason: `${classSection} already has another standard class scheduled during this period.` };
  }

  // 5. Existing Substitute Assignments
  const alreadySubbing = state.substituteAssignments.some(sub => 
    sub.date === date && 
    sub.periodIndex === periodIndex && 
    sub.substituteTeacherId === teacherId
  );
  if (alreadySubbing) {
    return { valid: false, reason: "You are already assigned as a substitute during this period." };
  }

  // 6. Max Workloads
  let dailyWorkloadCount = 0;
  teacher.schedule[dayOfWeek]?.forEach(slot => { if (slot) dailyWorkloadCount++; });
  const subCountToday = state.substituteAssignments.filter(sub => 
    sub.date === date && 
    sub.substituteTeacherId === teacherId
  ).length;
  const extraCountToday = state.extraClassRequests.filter(ext => 
    ext.date === date && 
    ext.teacherId === teacherId && 
    ext.status === 'Approved'
  ).length;
  const totalDaily = dailyWorkloadCount + subCountToday + extraCountToday;
  const maxDaily = teacher.maxDailyHours || 6;
  if (totalDaily >= maxDaily) {
    return { valid: false, reason: `This request pushes you over your maximum daily workload of ${maxDaily} periods.` };
  }

  // Weekly Workload
  let weeklyWorkloadCount = 0;
  Object.keys(teacher.schedule).forEach(day => {
    teacher.schedule[day as DayOfWeek]?.forEach(slot => { if (slot) weeklyWorkloadCount++; });
  });

  const startOfWeek = new Date(dateObj);
  startOfWeek.setDate(dateObj.getDate() - dateObj.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5); // Saturday
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  const subCountThisWeek = state.substituteAssignments.filter(sub => 
    sub.substituteTeacherId === teacherId && 
    sub.date >= startOfWeekStr && 
    sub.date <= endOfWeekStr
  ).length;
  const extraCountThisWeek = state.extraClassRequests.filter(ext => 
    ext.teacherId === teacherId && 
    ext.status === 'Approved' && 
    ext.date >= startOfWeekStr && 
    ext.date <= endOfWeekStr
  ).length;
  const totalWeekly = weeklyWorkloadCount + subCountThisWeek + extraCountThisWeek;
  const maxWeekly = teacher.maxWeeklyHours || 30;
  if (totalWeekly >= maxWeekly) {
    return { valid: false, reason: `This request pushes you over your maximum weekly workload of ${maxWeekly} periods.` };
  }

  return { valid: true };
}

// 1. Validate Extra Class On-The-Fly API
app.post('/api/extra-classes/validate', (req, res) => {
  const state = loadState();
  const { teacherId, classSection, date, periodIndex } = req.body;

  const result = validateExtraClassRequest(state, { teacherId, classSection, date, periodIndex: parseInt(periodIndex, 10) });
  
  if (!result.valid) {
    const suggestions = getSmartAlternatives(state, teacherId, classSection, date);
    return res.json({ valid: false, reason: result.reason, suggestions });
  }

  res.json({ valid: true });
});

// 2. Submit Extra Class Request API
app.post('/api/extra-classes/request', (req, res) => {
  const state = loadState();
  const { 
    teacherId, 
    classSection, 
    date, 
    periodIndex, 
    requestType, 
    priority, 
    reason,
    preferredPeriod,
    preferredTime,
    preferredWeek,
    subject
  } = req.body;

  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Educator profile not found.' });
  }

  const pIdx = periodIndex !== undefined ? parseInt(periodIndex, 10) : 0;
  
  if (date) {
    const result = validateExtraClassRequest(state, { teacherId, classSection, date, periodIndex: pIdx });

    if (!result.valid) {
      const suggestions = getSmartAlternatives(state, teacherId, classSection, date);
      return res.status(400).json({ 
        error: 'AI Validation Conflict', 
        reason: result.reason, 
        suggestions 
      });
    }
  }

  let dayName: DayOfWeek = 'Monday';
  if (date) {
    const dateObj = new Date(date);
    dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  }

  const newRequest: ExtraClassRequest = {
    id: `ext_${Date.now()}`,
    teacherId,
    teacherName: teacher.name,
    employeeId: teacher.employeeId || `EMP0${teacherId.substring(1)}`,
    department: teacher.department || 'Academic',
    subject: subject || teacher.subject,
    classSection,
    date: date || '',
    day: date ? dayName : 'Monday',
    periodIndex: pIdx,
    preferredPeriod,
    preferredTime,
    preferredWeek: preferredWeek || '',
    requestType: requestType || 'Revision Class',
    priority: priority || 'Normal',
    status: 'Waiting for Matching', // Automatically waiting for matching - no approval workflow!
    reason,
    createdAt: new Date().toISOString(),
    submittedOn: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    aiStatus: 'No conflict',
    aiValidationReasons: ['Request queued in AI Substitute Pool', 'Active and awaiting empty matching slots']
  };

  state.extraClassRequests.unshift(newRequest);

  // Notify admin of a new extra class request in pool
  state.notifications.unshift({
    id: `n_acad_req_${Date.now()}`,
    title: 'Extra Class Request Pool Update',
    message: `${teacher.name} added an extra class request for ${classSection} (${teacher.subject}) into the AI matching pool.`,
    type: 'info',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'academic',
    priority: 'medium'
  });

  // Run the automated matchmaking engine immediately!
  runAutomatedAIEngine(state);

  saveState(state);
  res.json({ success: true, state });
});

// 3. Trigger Automated AI Substitute Matching Engine API
app.post('/api/extra-classes/run-ai-engine', (req, res) => {
  const state = loadState();
  
  // Run the matching & priority substitution logic
  runAutomatedAIEngine(state);
  
  saveState(state);
  res.json({ success: true, message: 'AI matchmaking process completed successfully!', state });
});

// AI Substitute Assignment Engine Helpers
function getSuggestionsForSlot(state: ERPDataState, absentTeacherId: string, date: string, pIdx: number) {
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  const absentTeacher = state.teachers.find(t => t.id === absentTeacherId);
  if (!absentTeacher) return [];

  // Find daily absences on this date (not 'Present')
  const absentTeacherIdsToday = state.attendance
    .filter(att => att.date === date && att.status !== 'Present')
    .map(att => att.teacherId);

  // Filter eligible teachers: active, not absent/leave today, free during this period, not the absent teacher
  const candidates = state.teachers.filter(t => {
    if (t.id === absentTeacherId) return false;
    if (t.status !== 'Active') return false;
    if (t.blockedFromSubstitutions === true) return false;
    if (absentTeacherIdsToday.includes(t.id)) return false;

    // Check leave requests
    const hasApprovedLeave = state.leaveRequests.some(lv => 
      lv.teacherId === t.id && 
      lv.status === 'Approved' && 
      date >= lv.startDate && 
      date <= lv.endDate
    );
    if (hasApprovedLeave) return false;

    // Period must be free in standard schedule
    const scheduleSlot = t.schedule[dayName]?.[pIdx];
    if (scheduleSlot !== null) return false;

    // Not already assigned as a substitute for that period
    const alreadySubbing = state.substituteAssignments.some(sub => 
      sub.date === date && 
      sub.periodIndex === pIdx && 
      sub.substituteTeacherId === t.id
    );
    if (alreadySubbing) return false;

    // Daily workload limit is not exceeded
    let dailyWorkloadCount = 0;
    t.schedule[dayName]?.forEach(slot => { if (slot) dailyWorkloadCount++; });
    const subCountToday = state.substituteAssignments.filter(sub => 
      sub.date === date && 
      sub.substituteTeacherId === t.id
    ).length;
    const totalDailyWorkload = dailyWorkloadCount + subCountToday;
    const maxDaily = t.maxDailyHours || 6;
    if (totalDailyWorkload >= maxDaily) return false;

    // Weekly workload limit is not exceeded
    let weeklyWorkloadCount = 0;
    Object.keys(t.schedule).forEach(day => {
      t.schedule[day as DayOfWeek]?.forEach(slot => { if (slot) weeklyWorkloadCount++; });
    });
    
    // Determine start and end of week
    const startOfWeek = new Date(dateObj);
    startOfWeek.setDate(dateObj.getDate() - dateObj.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 5); // Saturday
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    const subCountThisWeek = state.substituteAssignments.filter(sub => 
      sub.substituteTeacherId === t.id && 
      sub.date >= startOfWeekStr && 
      sub.date <= endOfWeekStr
    ).length;
    const totalWeeklyWorkload = weeklyWorkloadCount + subCountThisWeek;
    const maxWeekly = t.maxWeeklyHours || 30;
    if (totalWeeklyWorkload >= maxWeekly) return false;

    return true;
  });

  const targetSlot = absentTeacher.schedule[dayName]?.[pIdx];
  if (!targetSlot) return [];

  // Calculate start & end of week for scoring
  const startOfWeek = new Date(dateObj);
  startOfWeek.setDate(dateObj.getDate() - dateObj.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  const suggestions = candidates.map(t => {
    let score = 0;
    const reasons: string[] = [];

    // Priority 1: Approved Extra Class Requests matching same class & section on this date
    const approvedExtraClassMatch = state.extraClassRequests.find(ext => 
      ext.teacherId === t.id && 
      ext.classSection === targetSlot.classSection &&
      ext.date === date &&
      ext.status === 'Approved'
    );

    let priorityTier = 6;
    let extraClassFulfilled = false;

    if (approvedExtraClassMatch) {
      score += 10000000; // Tier 1 Priority
      extraClassFulfilled = true;
      priorityTier = 1;
      reasons.push(`✓ Priority 1: Approved Extra Class request for ${targetSlot.classSection}`);
    }

    // Priority 2: Teachers who requested that subject for another section of the same grade
    const targetGrade = targetSlot.classSection.split('-')[0]; // e.g. "Grade 10"
    const hasPriority2Request = state.extraClassRequests.some(ext => 
      ext.teacherId === t.id &&
      ext.subject === targetSlot.subject &&
      ext.classSection.startsWith(targetGrade) &&
      ext.classSection !== targetSlot.classSection &&
      (ext.status === 'Approved' || ext.status === 'Pending')
    );

    if (!extraClassFulfilled && hasPriority2Request) {
      score += 1000000; // Tier 2 Priority
      priorityTier = 2;
      reasons.push(`✓ Priority 2: Requested ${targetSlot.subject} for another section of ${targetGrade}`);
    }

    // Priority 3: Teachers with the lowest teaching load for that day.
    let dailyWorkloadCount = 0;
    t.schedule[dayName]?.forEach(slot => { if (slot) dailyWorkloadCount++; });
    const subCountToday = state.substituteAssignments.filter(sub => 
      sub.date === date && 
      sub.substituteTeacherId === t.id
    ).length;
    const totalDaily = dailyWorkloadCount + subCountToday;
    const maxDaily = t.maxDailyHours || 6;
    const dailyBuffer = Math.max(0, maxDaily - totalDaily);
    score += (dailyBuffer * 10000); 
    reasons.push(`✓ Priority 3: Low Daily Workload (${totalDaily}/${maxDaily} Periods)`);

    // Priority 4: Teachers with the lowest weekly teaching load.
    let weeklyWorkloadCount = 0;
    Object.keys(t.schedule).forEach(d => {
      t.schedule[d as DayOfWeek]?.forEach(slot => { if (slot) weeklyWorkloadCount++; });
    });
    const subCountThisWeek = state.substituteAssignments.filter(sub => 
      sub.substituteTeacherId === t.id && 
      sub.date >= startOfWeekStr && 
      sub.date <= endOfWeekStr
    ).length;
    const totalWeekly = weeklyWorkloadCount + subCountThisWeek;
    const maxWeekly = t.maxWeeklyHours || 30;
    const weeklyBuffer = Math.max(0, maxWeekly - totalWeekly);
    score += (weeklyBuffer * 100);
    reasons.push(`✓ Priority 4: Low Weekly Workload (${totalWeekly}/${maxWeekly} Periods)`);

    // Priority 5: Teachers from the same department (or subject discipline)
    let sameDepartment = false;
    if (t.department && absentTeacher.department && t.department.toLowerCase() === absentTeacher.department.toLowerCase()) {
      score += 10;
      sameDepartment = true;
      reasons.push(`✓ Priority 5: Same Department (${t.department})`);
    } else if (t.subject.toLowerCase() === absentTeacher.subject.toLowerCase()) {
      score += 5;
      sameDepartment = true;
      reasons.push(`✓ Priority 5: Same Subject discipline`);
    }

    // Priority 6: Teachers with the fewest substitute assignments this month.
    const currentMonthStr = date.substring(0, 7);
    const monthlySubstituteCount = state.substituteAssignments.filter(sub => 
      sub.substituteTeacherId === t.id && 
      sub.date.startsWith(currentMonthStr)
    ).length;
    score -= (monthlySubstituteCount * 1);
    reasons.push(`✓ Priority 6: Fair Rotation (${monthlySubstituteCount} substitutions this month)`);

    // Calculate dynamic confidence %
    let confidence = 85;
    if (extraClassFulfilled) {
      confidence = 98;
    } else {
      if (sameDepartment) confidence += 5;
      if (totalDaily <= 3) confidence += 5;
      confidence = Math.min(97, confidence);
    }

    return {
      teacherId: t.id,
      name: t.name,
      subject: t.subject,
      classSection: t.classSection,
      score,
      confidence,
      reasons,
      breakdown: {
        extraClassFulfilled,
        freePeriod: true,
        presentToday: true,
        dailyWorkload: `${totalDaily}/${t.maxDailyHours || 6} Periods`,
        weeklyWorkload: `${totalWeekly}/${t.maxWeeklyHours || 30} Periods`,
        sameDepartment,
        reasons,
        contiguousFreeSlots: 1,
        monthlySubstituteCount
      }
    };
  });

  suggestions.sort((a, b) => b.score - a.score);
  return suggestions;
}

function isSameWeek(date1Str: string, date2Str: string): boolean {
  try {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    
    // Get Monday of d1's week
    const monday1 = new Date(d1);
    monday1.setDate(d1.getDate() - ((d1.getDay() + 6) % 7));
    const monday1Str = monday1.toISOString().split('T')[0];

    // Get Monday of d2's week
    const monday2 = new Date(d2);
    monday2.setDate(d2.getDate() - ((d2.getDay() + 6) % 7));
    const monday2Str = monday2.toISOString().split('T')[0];

    return monday1Str === monday2Str;
  } catch (err) {
    return false;
  }
}

function updateExtraClassRequestLifecycles(state: ERPDataState) {
  const todayStr = new Date().toISOString().split('T')[0];
  state.extraClassRequests.forEach(req => {
    if (req.status === 'Assigned' && req.date && req.date < todayStr) {
      req.status = 'Completed';
    } else if (req.status === 'Waiting for Matching' && req.date && req.date < todayStr) {
      req.status = 'Expired';
    }
  });
}

function runAutomatedAIEngine(state: ERPDataState) {
  updateExtraClassRequestLifecycles(state);

  // Determine all unique dates present in attendance, plus today's date
  const uniqueDates = Array.from(new Set(state.attendance.map(att => att.date)));
  const todayStr = new Date().toISOString().split('T')[0];
  if (!uniqueDates.includes(todayStr)) {
    uniqueDates.push(todayStr);
  }

  uniqueDates.forEach(date => {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

    // Identify all non-Present attendance teacher IDs for this date
    const nonPresentAttendance = state.attendance.filter(att => att.date === date && att.status !== 'Present');
    const nonPresentTeacherIds = new Set(nonPresentAttendance.map(att => att.teacherId));

    // Also treat any Inactive teachers as absent so their slots get automatically substituted
    const inactiveTeachers = state.teachers.filter(t => t.status !== 'Active');
    inactiveTeachers.forEach(t => {
      nonPresentTeacherIds.add(t.id);
      let att = state.attendance.find(a => a.date === date && a.teacherId === t.id);
      if (!att) {
        att = {
          id: `att_${date}_${t.id}`,
          date,
          teacherId: t.id,
          status: 'Absent',
          substitutes: {}
        };
        state.attendance.push(att);
      }
    });

    // Run matching for each non-present teacher
    nonPresentTeacherIds.forEach(absentTeacherId => {
      const absentTeacher = state.teachers.find(t => t.id === absentTeacherId);
      if (!absentTeacher) return;

      const lessons = absentTeacher.schedule[dayName] || [];
      
      let att = state.attendance.find(a => a.date === date && a.teacherId === absentTeacherId);
      if (!att) {
        att = {
          id: `att_${date}_${absentTeacherId}`,
          date,
          teacherId: absentTeacherId,
          status: 'Absent',
          substitutes: {}
        };
        state.attendance.push(att);
      }
      if (!att.substitutes) att.substitutes = {};

      lessons.forEach((slot, pIdx) => {
        if (!slot) return; // Empty slot on the timetable

        // Check if there is already a locked substitution
        const existingSub = state.substituteAssignments.find(sub => 
          sub.date === date && 
          sub.periodIndex === pIdx && 
          sub.absentTeacherId === absentTeacherId
        );
        if (existingSub && existingSub.isLocked) return;

        const eligibleCandidates: {
          teacher: Teacher;
          hasP1Request: boolean;
          p1Request?: ExtraClassRequest;
          p1MatchesSubject: boolean;
          dailyWorkload: number;
          weeklyWorkload: number;
          monthlySubs: number;
        }[] = [];

        state.teachers.forEach(teacher => {
          if (teacher.id === absentTeacherId) return;
          if (teacher.status !== 'Active') return;
          if (teacher.blockedFromSubstitutions === true) return;

          // 1. Is present today
          const isCandAbsent = state.attendance.some(a => 
            a.date === date && 
            a.teacherId === teacher.id && 
            a.status !== 'Present'
          );
          if (isCandAbsent) return;

          // 2. Is not on leave today
          const hasApprovedLeave = state.leaveRequests.some(lv => 
            lv.teacherId === teacher.id && 
            lv.status === 'Approved' && 
            date >= lv.startDate && 
            date <= lv.endDate
          );
          if (hasApprovedLeave) return;

          // 3. Is not already teaching another class during this period
          if (teacher.schedule[dayName]?.[pIdx] !== null) return;

          // 4. Is not already assigned as a substitute during this period
          const alreadyAssignedSub = state.substituteAssignments.some(sub => 
            sub.date === date && 
            sub.periodIndex === pIdx && 
            sub.substituteTeacherId === teacher.id
          );
          if (alreadyAssignedSub) return;

          // 5. Is not scheduled for lunch, assembly, zero period, or another protected event
          const slotConfig = state.settings.scheduleSlots?.[pIdx];
          if (slotConfig && (!slotConfig.requiresAssignment || ['break', 'assembly', 'zero_period', 'school_over'].includes(slotConfig.type))) {
            return;
          }

          // 6. Does not exceed maximum daily workload
          let dailyCount = 0;
          teacher.schedule[dayName]?.forEach(s => { if (s) dailyCount++; });
          const subCountToday = state.substituteAssignments.filter(sub => 
            sub.date === date && 
            sub.substituteTeacherId === teacher.id
          ).length;
          const extraCountToday = state.extraClassRequests.filter(ext => 
            ext.date === date && 
            ext.teacherId === teacher.id && 
            ext.status === 'Assigned'
          ).length;
          if (dailyCount + subCountToday + extraCountToday >= (teacher.maxDailyHours || 6)) return;

          // 7. Does not exceed maximum weekly workload
          let weeklyCount = 0;
          Object.keys(teacher.schedule).forEach(d => {
            teacher.schedule[d as DayOfWeek]?.forEach(s => { if (s) weeklyCount++; });
          });
          const startOfWeek = new Date(dateObj);
          startOfWeek.setDate(dateObj.getDate() - ((dateObj.getDay() + 6) % 7)); // Monday
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 5); // Saturday
          const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
          const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

          const subCountThisWeek = state.substituteAssignments.filter(sub => 
            sub.substituteTeacherId === teacher.id && 
            sub.date >= startOfWeekStr && 
            sub.date <= endOfWeekStr
          ).length;
          const extraCountThisWeek = state.extraClassRequests.filter(ext => 
            ext.teacherId === teacher.id && 
            ext.status === 'Assigned' && 
            ext.date >= startOfWeekStr && 
            ext.date <= endOfWeekStr
          ).length;
          if (weeklyCount + subCountThisWeek + extraCountThisWeek >= (teacher.maxWeeklyHours || 30)) return;

          // Check Extra Class Request (Priority 1)
          const matchingRequest = state.extraClassRequests.find(req => 
            req.teacherId === teacher.id && 
            req.status === 'Waiting for Matching' && 
            req.classSection === slot.classSection &&
            (!req.date || req.date === date) &&
            (req.periodIndex === undefined || req.periodIndex === pIdx)
          );

          // Check monthly substitutions (Priority 4)
          const currentMonthStr = date.substring(0, 7);
          const monthlySubs = state.substituteAssignments.filter(sub => 
            sub.substituteTeacherId === teacher.id && 
            sub.date.startsWith(currentMonthStr)
          ).length;

          eligibleCandidates.push({
            teacher,
            hasP1Request: !!matchingRequest,
            p1Request: matchingRequest,
            p1MatchesSubject: matchingRequest ? matchingRequest.subject.toLowerCase() === slot.subject.toLowerCase() : false,
            dailyWorkload: dailyCount + subCountToday + extraCountToday,
            weeklyWorkload: weeklyCount + subCountThisWeek + extraCountThisWeek,
            monthlySubs
          });
        });

        if (eligibleCandidates.length === 0) {
          const alreadyNotified = state.notifications.some(
            n => n.id === `n_sub_fail_${date}_${absentTeacherId}_${pIdx}`
          );
          if (!alreadyNotified) {
            state.notifications.unshift({
              id: `n_sub_fail_${date}_${absentTeacherId}_${pIdx}`,
              title: 'AI Substitute Match Failed',
              message: `Could not find an available substitute for Period ${pIdx + 1} of ${absentTeacher.name} (Class ${slot.classSection}). Manual intervention required.`,
              type: 'danger',
              createdAt: new Date().toISOString(),
              read: false,
              category: 'substitute',
              priority: 'high',
              meta: { 
                teacherName: absentTeacher.name, 
                date, 
                classSection: slot.classSection,
                time: `Period ${pIdx + 1}`,
                reason: 'No available teachers met the substitution criteria.'
              }
            });
          }
          return;
        }

        // Sort candidates based on priorities
        eligibleCandidates.sort((a, b) => {
          // Priority 1: Teacher Requested an Extra Class
          if (a.hasP1Request && !b.hasP1Request) return -1;
          if (!a.hasP1Request && b.hasP1Request) return 1;
          if (a.hasP1Request && b.hasP1Request) {
            if (a.p1MatchesSubject && !b.p1MatchesSubject) return -1;
            if (!a.p1MatchesSubject && b.p1MatchesSubject) return 1;
          }

          // Priority 2: Lowest Daily Workload
          if (a.dailyWorkload !== b.dailyWorkload) {
            return a.dailyWorkload - b.dailyWorkload;
          }

          // Priority 3: Lowest Weekly Workload
          if (a.weeklyWorkload !== b.weeklyWorkload) {
            return a.weeklyWorkload - b.weeklyWorkload;
          }

          // Priority 4: Fair Rotation (monthly caps)
          if (a.monthlySubs !== b.monthlySubs) {
            return a.monthlySubs - b.monthlySubs;
          }

          return a.teacher.name.localeCompare(b.teacher.name);
        });

        const best = eligibleCandidates[0];
        const subTeacher = best.teacher;

        let reason = "Fair Rotation";
        if (best.hasP1Request) {
          reason = "Extra Class Request matched.";
        } else if (best.dailyWorkload !== (eligibleCandidates[1]?.dailyWorkload ?? -1)) {
          reason = "Lowest Daily Workload";
        } else if (best.weeklyWorkload !== (eligibleCandidates[1]?.weeklyWorkload ?? -1)) {
          reason = "Lowest Weekly Workload";
        }

        // Update Extra Class request state to Assigned if matched
        if (best.hasP1Request && best.p1Request) {
          best.p1Request.status = 'Assigned';
          best.p1Request.date = date;
          best.p1Request.periodIndex = pIdx;
          best.p1Request.aiValidationReasons = [
            `AI automatically matched with priority rank 1: Extra Class Request`,
            `Subject Match: ${best.p1MatchesSubject ? 'Yes' : 'No'}`
          ];
        }

        const assignmentId = existingSub ? existingSub.id : `sub_${Date.now()}_${pIdx}`;
        let aiConfidence = 85;
        if (best.hasP1Request) {
          aiConfidence = 98;
        } else {
          if (subTeacher.department === absentTeacher.department) aiConfidence += 5;
          if (best.dailyWorkload <= 3) aiConfidence += 5;
          aiConfidence = Math.min(97, aiConfidence);
        }

        const assignment: SubstituteAssignment = {
          id: assignmentId,
          date,
          day: dayName,
          periodIndex: pIdx,
          classSection: slot.classSection,
          absentTeacherId,
          absentTeacherName: absentTeacher.name,
          substituteTeacherId: subTeacher.id,
          substituteTeacherName: subTeacher.name,
          subject: slot.subject,
          status: 'Assigned',
          createdAt: new Date().toISOString(),
          isLocked: existingSub ? existingSub.isLocked : false,
          aiConfidence,
          aiSelectionReason: `Automatically allocated by the AI Substitute Engine. Reason: ${reason}`,
          decisionBreakdown: {
            extraClassFulfilled: best.hasP1Request,
            freePeriod: true,
            presentToday: true,
            dailyWorkload: `${best.dailyWorkload}/${subTeacher.maxDailyHours || 6} Periods`,
            weeklyWorkload: `${best.weeklyWorkload}/${subTeacher.maxWeeklyHours || 30} Periods`,
            sameDepartment: subTeacher.department === absentTeacher.department,
            reasons: [
              `Priority Match: ${reason}`,
              `Daily Workload: ${best.dailyWorkload} periods`,
              `Weekly Workload: ${best.weeklyWorkload} periods`,
              `Monthly substitute duty count: ${best.monthlySubs}`
            ],
            contiguousFreeSlots: 1,
            monthlySubstituteCount: best.monthlySubs
          }
        };

        if (existingSub) {
          const idx = state.substituteAssignments.findIndex(sub => sub.id === existingSub.id);
          if (idx !== -1) state.substituteAssignments[idx] = assignment;
        } else {
          state.substituteAssignments.unshift(assignment);
        }

        // Mark substitution covered in attendance record
        att.substitutes[pIdx] = subTeacher.id;
        att.substituteAssigned = true;

        // Automatically update the substitute teacher's local schedule
        if (!subTeacher.schedule[dayName]) {
          subTeacher.schedule[dayName] = Array(11).fill(null);
        }
        subTeacher.schedule[dayName][pIdx] = {
          subject: slot.subject,
          classSection: slot.classSection,
          room: slot.room || `Room ${101 + Math.floor(Math.random() * 20)}`,
          isExtra: true
        };

        // Audit Trail
        if (!state.substituteAuditLogs) state.substituteAuditLogs = [];
        state.substituteAuditLogs.unshift({
          id: `log_${Date.now()}_${pIdx}`,
          timestamp: new Date().toISOString(),
          date,
          day: dayName,
          periodIndex: pIdx,
          classSection: slot.classSection,
          absentTeacherName: absentTeacher.name,
          assignedTeacherName: subTeacher.name,
          actionType: 'Auto Assigned',
          details: `AI automatically assigned ${subTeacher.name} as substitute. Reason: ${reason}. Workloads: Daily ${best.dailyWorkload}, Weekly ${best.weeklyWorkload}.`,
          operator: 'AI Substitute Engine'
        });

        // Administrator Non-intrusive Notification
        const adminNotifId = `n_admin_auto_${date}_${absentTeacherId}_${pIdx}`;
        const hasAdminNotif = state.notifications.some(n => n.id === adminNotifId);
        if (!hasAdminNotif) {
          state.notifications.unshift({
            id: adminNotifId,
            title: 'AI Assignment Completed',
            message: `${slot.classSection} — ${slot.subject} (Period ${pIdx + 1}) required a substitute because ${absentTeacher.name} was absent.\nAssigned Teacher: ${subTeacher.name}\nReason: ${reason}\nStatus: Automatically Assigned`,
            type: 'success',
            createdAt: new Date().toISOString(),
            read: false,
            category: 'substitute',
            priority: 'medium',
            relatedRecordId: assignmentId
          });
        }

        // Teacher Notification
        const teacherNotifId = `n_teacher_auto_${date}_${subTeacher.id}_${pIdx}`;
        const hasTeacherNotif = state.notifications.some(n => n.id === teacherNotifId);
        if (!hasTeacherNotif) {
          const slotConfig = state.settings.scheduleSlots?.[pIdx];
          const timeLabel = slotConfig ? `${slotConfig.start} – ${slotConfig.end}` : "10:30 AM – 11:15 AM";
          
          state.notifications.unshift({
            id: teacherNotifId,
            title: 'New Substitute Assignment',
            message: `Grade ${slot.classSection}\n${slot.subject}\nPeriod ${pIdx + 1}\nTime: ${timeLabel}\nAssignment Reason: Automatically allocated by the AI Substitute Engine.`,
            type: 'info',
            createdAt: new Date().toISOString(),
            read: false,
            category: 'substitute',
            priority: 'high',
            relatedRecordId: assignmentId,
            meta: {
              teacherName: subTeacher.name,
              date,
              classSection: slot.classSection,
              time: `Period ${pIdx + 1} (${timeLabel})`,
              reason: 'Automatically allocated by the AI Substitute Engine.',
              status: 'Assigned'
            }
          });
        }
      });
    });
  });
}

function autoAssignSubstitutes(state: ERPDataState, date: string, teacherId: string, status: string) {
  runAutomatedAIEngine(state);
}

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
      state.attendance[existingIndex].status = status as any;
      
      // If changed to present, clean up existing substitutes
      if (status === 'Present' && prevStatus !== 'Present') {
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
        status: status as any,
        substitutes: {}
      };
      state.attendance.push(record);
    }

    // Trigger AI substitution automatically if teacher is marked Absent or other leave type
    if (['Absent', 'On Leave', 'Half Day', 'Emergency Leave', 'Medical Leave'].includes(status as string)) {
      autoAssignSubstitutes(state, date, tId, status as string);
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
            message: `${teacher.name} is marked absent on ${date}. AI engine has automatically scheduled substitutes where possible.`,
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

// 6. Substitution suggestions lookup using the new multi-priority AI model
app.get('/api/substitutes/suggest', (req, res) => {
  const state = loadState();
  const { absentTeacherId, date, periodIndex } = req.query;

  if (!absentTeacherId || !date || periodIndex === undefined) {
    return res.status(400).json({ error: 'Supply absentTeacherId, date and periodIndex.' });
  }

  const pIdx = parseInt(periodIndex as string, 10);
  const suggestions = getSuggestionsForSlot(state, absentTeacherId as string, date as string, pIdx);
  res.json({ suggestions });
});

// 7. Assign or Override substitute coverage
app.post('/api/substitutes/assign', (req, res) => {
  const state = loadState();
  const { date, periodIndex, absentTeacherId, substituteTeacherId, operator } = req.body;

  const absentTeacher = state.teachers.find(t => t.id === absentTeacherId);
  const substituteTeacher = state.teachers.find(t => t.id === substituteTeacherId);

  if (!absentTeacher || !substituteTeacher) {
    return res.status(404).json({ error: 'Educator profiles missing.' });
  }

  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  const pIdx = parseInt(periodIndex, 10);

  const targetSlot = absentTeacher.schedule[dayName]?.[pIdx];
  if (!targetSlot) {
    return res.status(400).json({ error: 'This slot is already free in the absent teacher schedule.' });
  }

  // Check if there is an existing substitute assignment
  const existingIndex = state.substituteAssignments.findIndex(sub => 
    sub.date === date && 
    sub.periodIndex === pIdx && 
    sub.absentTeacherId === absentTeacherId
  );

  let isOverride = false;
  let oldSubstituteName = '';

  if (existingIndex !== -1) {
    const existing = state.substituteAssignments[existingIndex];
    if (existing.isLocked) {
      return res.status(400).json({ error: 'This assignment is locked. Unlock it before overriding.' });
    }
    isOverride = true;
    oldSubstituteName = existing.substituteTeacherName;
  }

  // Find dynamic details from suggestions for breakdown
  const suggestions = getSuggestionsForSlot(state, absentTeacherId, date, pIdx);
  const matchedSuggestion = suggestions.find(s => s.teacherId === substituteTeacherId);

  const assignment: SubstituteAssignment = {
    id: isOverride ? state.substituteAssignments[existingIndex].id : `sub_${Date.now()}`,
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
    createdAt: new Date().toISOString(),
    isLocked: false,
    aiConfidence: matchedSuggestion ? matchedSuggestion.confidence : 100,
    aiSelectionReason: matchedSuggestion ? matchedSuggestion.reasons[0] : 'Manually assigned by administrator',
    decisionBreakdown: matchedSuggestion ? matchedSuggestion.breakdown : {
      extraClassFulfilled: false,
      freePeriod: true,
      presentToday: true,
      dailyWorkload: 'Manual assignment',
      weeklyWorkload: 'Manual assignment',
      sameDepartment: substituteTeacher.department === absentTeacher.department,
      reasons: ['Selected manually by Administrator'],
      contiguousFreeSlots: 1,
      monthlySubstituteCount: 0
    }
  };

  if (isOverride) {
    state.substituteAssignments[existingIndex] = assignment;
  } else {
    state.substituteAssignments.unshift(assignment);
  }

  // Update attendance record coverage map
  let attRecord = state.attendance.find(a => a.date === date && a.teacherId === absentTeacherId);
  if (!attRecord) {
    attRecord = {
      id: `att_${date}_${absentTeacherId}`,
      date,
      teacherId: absentTeacherId,
      status: 'Absent',
      substitutes: {}
    };
    state.attendance.push(attRecord);
  }
  
  attRecord.substituteAssigned = true;
  if (!attRecord.substitutes) attRecord.substitutes = {};
  attRecord.substitutes[pIdx] = substituteTeacherId;

  // Audit logging
  if (!state.substituteAuditLogs) state.substituteAuditLogs = [];
  state.substituteAuditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    date,
    day: dayName,
    periodIndex: pIdx,
    classSection: targetSlot.classSection,
    absentTeacherName: absentTeacher.name,
    assignedTeacherName: substituteTeacher.name,
    actionType: isOverride ? 'Manual Override' : 'Auto Assigned',
    details: isOverride 
      ? `Manual override by ${operator || 'Administrator'}: Replaced ${oldSubstituteName} with ${substituteTeacher.name}.`
      : `Manual assignment by ${operator || 'Administrator'}.`,
    operator: operator || 'Administrator'
  });

  // Log Notification
  state.notifications.unshift({
    id: `n_sub_${Date.now()}`,
    title: isOverride ? 'Substitution Overridden' : 'Substitution Assigned',
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

// Reject substitute suggestion (De-assign)
app.post('/api/substitutes/reject', (req, res) => {
  const state = loadState();
  const { date, periodIndex, absentTeacherId, operator } = req.body;

  const absentTeacher = state.teachers.find(t => t.id === absentTeacherId);
  if (!absentTeacher) {
    return res.status(404).json({ error: 'Absent teacher profile missing.' });
  }

  const pIdx = parseInt(periodIndex, 10);
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
  const targetSlot = absentTeacher.schedule[dayName]?.[pIdx];

  const existingIndex = state.substituteAssignments.findIndex(sub => 
    sub.date === date && 
    sub.periodIndex === pIdx && 
    sub.absentTeacherId === absentTeacherId
  );

  if (existingIndex === -1) {
    return res.status(404).json({ error: 'No active assignment to reject.' });
  }

  const existing = state.substituteAssignments[existingIndex];
  if (existing.isLocked) {
    return res.status(400).json({ error: 'This assignment is locked. Unlock it first.' });
  }

  state.substituteAssignments.splice(existingIndex, 1);

  const attRecord = state.attendance.find(a => a.date === date && a.teacherId === absentTeacherId);
  if (attRecord && attRecord.substitutes) {
    delete attRecord.substitutes[pIdx];
    const remaining = Object.keys(attRecord.substitutes).length;
    if (remaining === 0) {
      attRecord.substituteAssigned = false;
    }
  }

  if (!state.substituteAuditLogs) state.substituteAuditLogs = [];
  state.substituteAuditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    date,
    day: dayName,
    periodIndex: pIdx,
    classSection: targetSlot ? targetSlot.classSection : 'Unknown',
    absentTeacherName: absentTeacher.name,
    assignedTeacherName: existing.substituteTeacherName,
    actionType: 'Rejected',
    details: `AI/Manual substitution recommendation of ${existing.substituteTeacherName} was rejected by ${operator || 'Administrator'}.`,
    operator: operator || 'Administrator'
  });

  runAutomatedAIEngine(state);
  saveState(state);
  res.json({ success: true, state });
});

// Toggle Lock Status
app.post('/api/substitutes/toggle-lock', (req, res) => {
  const state = loadState();
  const { assignmentId, operator } = req.body;

  const assignment = state.substituteAssignments.find(sub => sub.id === assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Substitute assignment not found.' });
  }

  assignment.isLocked = !assignment.isLocked;

  if (!state.substituteAuditLogs) state.substituteAuditLogs = [];
  state.substituteAuditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    date: assignment.date,
    day: assignment.day,
    periodIndex: assignment.periodIndex,
    classSection: assignment.classSection,
    absentTeacherName: assignment.absentTeacherName,
    assignedTeacherName: assignment.substituteTeacherName,
    actionType: assignment.isLocked ? 'Locked' : 'Unlocked',
    details: `Substitution coverage of ${assignment.substituteTeacherName} was ${assignment.isLocked ? 'locked (secured)' : 'unlocked'} by ${operator || 'Administrator'}.`,
    operator: operator || 'Administrator'
  });

  saveState(state);
  res.json({ success: true, state });
});

// Toggle Teacher Substitution Block Status
app.post('/api/substitutes/toggle-block', (req, res) => {
  const state = loadState();
  const { teacherId } = req.body;

  const teacher = state.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher profile not found.' });
  }

  teacher.blockedFromSubstitutions = !teacher.blockedFromSubstitutions;

  saveState(state);
  res.json({ success: true, state });
});

// Retrieve Substitute Audit Logs
app.get('/api/substitutes/audit-logs', (req, res) => {
  const state = loadState();
  res.json({ auditLogs: state.substituteAuditLogs || [] });
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

  // If approved, dynamically update teacher's status and schedule substitutions for that range
  if (status === 'Approved') {
    const teacher = state.teachers.find(t => t.id === leave.teacherId);
    if (teacher) {
      teacher.status = 'On Leave';

      // Auto-assign substitutes for each date of this leave!
      try {
        let current = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
          
          // Check if this day has scheduled lessons
          const hasLessons = teacher.schedule[dayName] && teacher.schedule[dayName].some(slot => slot !== null);
          if (hasLessons) {
            autoAssignSubstitutes(state, dateStr, teacher.id, leave.leaveType || 'On Leave');
          }
          current.setDate(current.getDate() + 1);
        }
      } catch (err) {
        console.error('Error running leave auto-substitutions:', err);
      }
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
  const oldSlots = state.settings?.scheduleSlots || defaultSettings.scheduleSlots || [];
  const newSlots = req.body.scheduleSlots || [];

  if (newSlots.length > 0 && JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
    state.teachers.forEach(teacher => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.forEach(day => {
        const oldDaySchedule = [...(teacher.schedule[day] || [])];
        const newDaySchedule = newSlots.map((newS: any) => {
          const oldIdx = oldSlots.findIndex(s => s.id === newS.id);
          if (oldIdx !== -1 && oldIdx < oldDaySchedule.length) {
            return oldDaySchedule[oldIdx];
          }
          return null;
        });
        teacher.schedule[day] = newDaySchedule;
      });
    });
  }

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
