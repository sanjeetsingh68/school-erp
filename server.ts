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
  LeaveRequest
} from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Helper to determine day order
const daysOrder: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Generate clean template schedules for the 15 teachers
// Ensures that for a given class section (e.g. "10-A"), at most one teacher has a slot assigned at any day and period index
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

    // Create a schedule template with some assigned periods and some free (null) periods
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

  // Distribute classes into standard periods to prevent overlapping for classes AND teachers
  // We have 15 teachers, 8 distinct classes: Grade 10-A, 10-B, 9-A, 9-B, 11-A, 11-B, 12-A, 12-B
  // Assign teachers to periods dynamically, avoiding conflicts.
  // Simple check matrix to track: classAvailability[day][period][classSection] = true/false (true = busy)
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
      // Each teacher gets 2-3 assigned periods per day, randomized but conflict-free
      let periodsAssigned = 0;
      const targetPeriods = 2 + (tIdx + dIdx) % 2; // either 2 or 3 periods

      for (let p = 0; p < 6; p++) {
        if (periodsAssigned >= targetPeriods) break;

        // Try assigning a period for is slot
        // Select class section to assign
        // Primary choice: the teacher's default class
        // Secondary choice: other random class to represent full load
        const targetClass = (p % 2 === 0) ? t.classSection : classList[(tIdx + p) % classList.length];
        const classIndex = classList.indexOf(targetClass);

        if (!classAvailability[day][p][classIndex]) {
          // Both teacher (currently has null at p) and class section are free at this period
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

  // Seed attendance data for the past 14 weekdays (Mon-Fri) to support rich reports and dashboard graphics
  const attendance: AttendanceRecord[] = [];
  const startDay = new Date('2026-05-10'); // previous date
  // generate days up to today
  const todayDateStr = '2026-05-25'; // today as of local time in metadata

  for (let d = 0; d < 16; d++) {
    const checkDate = new Date(startDay.getTime() + d * 24 * 60 * 60 * 1000);
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // skip weekends
    if (dayName === 'Saturday' || dayName === 'Sunday') continue;
    
    const dayOfWeek = dayName as DayOfWeek;
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dateStr > todayDateStr) break;

    // Daily Attendance seed
    // Most teachers are present (92% presence rate)
    teachers.forEach((teacher) => {
      let status: 'Present' | 'Absent' = 'Present';
      
      // Seed occasional absences (specifically seed t5/Vikram Singh absent on 2026-05-21)
      if (teacher.id === 't5' && dateStr === '2026-05-21') {
        status = 'Absent';
      } else if (teacher.id === 't2' && dateStr === '2026-05-18') {
        status = 'Absent';
      } else if (Math.random() < 0.05) { // 5% chance of absence for historical realism
        status = 'Absent';
      }

      // Add record
      const record: AttendanceRecord = {
        id: `att_${dateStr}_${teacher.id}`,
        date: dateStr,
        teacherId: teacher.id,
        status
      };

      // Seed substitute details for specific historic absences
      if (status === 'Absent') {
        record.substituteAssigned = true;
        record.substitutes = {};
        
        // Find assigned periods to substitute
        const activePeriods: number[] = [];
        teacher.schedule[dayOfWeek].forEach((slot, pIdx) => {
          if (slot) activePeriods.push(pIdx);
        });

        // Arbitrarily assign other free teachers as substitute
        activePeriods.forEach((pIdx) => {
          const eligibleSubNode = teachers.find(
            otherT => otherT.id !== teacher.id && otherT.schedule[dayOfWeek][pIdx] === null
          );
          if (eligibleSubNode) {
            record.substitutes![pIdx] = eligibleSubNode.id;
          }
        });
      }

      attendance.push(record);
    });
  }

  // Generate some sample historical substitute logs and extra class requests
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
      periodIndex: 4, // Period 5 (index 4)
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
      periodIndex: 2, // Period 3
      status: 'Pending',
      createdAt: '2026-05-25T05:00:00.000Z'
    }
  ];

  const notifications: SystemNotification[] = [
    {
      id: 'n_leave_1',
      title: 'Leave Request Pending Approval',
      message: 'Priya Sharma requested Medical Leave due to dental emergency.',
      type: 'warning',
      createdAt: '2026-05-25T08:15:00.000Z',
      read: false,
      category: 'leave',
      priority: 'high',
      relatedRecordId: 'lv_2',
      meta: { teacherName: 'Priya Sharma', date: '25 May 2026', reason: 'Medical Leave', status: 'Pending Approval' }
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
      id: 'n_stu_1',
      title: 'New Student Admission Pending',
      message: 'New student admission pending approval for registration dossier ID 1024.',
      type: 'info',
      createdAt: '2026-05-25T07:10:00.000Z',
      read: false,
      category: 'student',
      priority: 'medium',
      meta: { studentName: 'Aarav Sharma' }
    },
    {
      id: 'n_stu_2',
      title: 'Student Profile Updated',
      message: 'Student profile updated for Grade 9-A parents contact info.',
      type: 'info',
      createdAt: '2026-05-24T11:20:00.000Z',
      read: true,
      category: 'student',
      priority: 'low'
    },
    {
      id: 'n_acad_1',
      title: 'Lesson Plan Completed Check',
      message: 'Lesson plan not completed for Grade 10 Mathematics syllabus targets.',
      type: 'warning',
      createdAt: '2026-05-25T06:45:00.000Z',
      read: false,
      category: 'academic',
      priority: 'medium'
    },
    {
      id: 'n_acad_2',
      title: 'Syllabus Behind Schedule Alert',
      message: 'Science curriculum coverage is behind schedule by 3 classes.',
      type: 'danger',
      createdAt: '2026-05-24T09:30:00.000Z',
      read: false,
      category: 'academic',
      priority: 'high'
    },
    {
      id: 'n_sub_1',
      title: 'Teacher Absent Today',
      message: 'Vikram Singh (History & Civics) is absent. Substitute teacher required.',
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
      message: 'Pooja Chatterjee has accepted the physics substitution coverage slot.',
      type: 'success',
      createdAt: '2026-05-25T08:12:00.000Z',
      read: false,
      category: 'substitute',
      priority: 'medium',
      meta: { teacherName: 'Pooja Chatterjee' }
    },
    {
      id: 'n_rep_1',
      title: 'Monthly Report Ready',
      message: 'School analytics and faculty attendance report generated.',
      type: 'info',
      createdAt: '2026-05-25T05:30:00.000Z',
      read: false,
      category: 'reports',
      priority: 'low'
    },
    {
      id: 'n_rep_2',
      title: 'Attendance Below Target Warning',
      message: 'Grade 9-B weekly presence falls below the 85% safety threshold.',
      type: 'warning',
      createdAt: '2026-05-24T14:45:00.000Z',
      read: true,
      category: 'reports',
      priority: 'medium'
    },
    {
      id: 'n_sys_1',
      title: 'Backup Completed Successfully',
      message: 'Database backup successfully archived and validated in AWS S3 storage.',
      type: 'success',
      createdAt: '2026-05-25T01:00:00.000Z',
      read: false,
      category: 'system',
      priority: 'low'
    },
    {
      id: 'n_sys_2',
      title: 'New ERP Version Available',
      message: 'New XYZ ERP system update v4.2.0 is available with security patches.',
      type: 'info',
      createdAt: '2026-05-24T10:00:00.000Z',
      read: true,
      category: 'system',
      priority: 'medium'
    }
  ];

  const leaveRequests: LeaveRequest[] = [
    {
      id: 'lv_1',
      teacherId: 't5',
      teacherName: 'Vikram Singh',
      subject: 'History & Civics',
      startDate: '2026-05-21',
      endDate: '2026-05-21',
      leaveType: 'Sick Leave',
      reason: 'Suffering from severe migraine.',
      status: 'Approved',
      createdAt: '2026-05-20T16:00:00.000Z',
      reviewComment: 'Approved. Get well soon!'
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
    leaveRequests
  };
}

// Read database and return object
function getDB(): ERPDataState {
  if (!fs.existsSync(DB_FILE)) {
    const data = seedInitialData();
    saveDB(data);
    return data;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse db.json, generating new seed dataset:', error);
    const data = seedInitialData();
    saveDB(data);
    return data;
  }
}

// Write database to file
function saveDB(state: ERPDataState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to DB file:', error);
  }
}

// ---------------------- ENDPOINTS ----------------------

// Get entire ERP state
app.get('/api/state', (req, res) => {
  const db = getDB();
  res.json(db);
});

// Reset database to initial state
app.post('/api/reset', (req, res) => {
  const data = seedInitialData();
  saveDB(data);
  res.json({ message: 'Success', state: data });
});

// Teacher endpoints
app.post('/api/teachers', (req, res) => {
  const db = getDB();
  const newTeacher: Teacher = req.body;
  
  if (!newTeacher.id) {
    newTeacher.id = `t${db.teachers.length + 1}`;
  }
  
  // Clean empty schedule if missing
  if (!newTeacher.schedule) {
    newTeacher.schedule = {
      Monday: Array(6).fill(null),
      Tuesday: Array(6).fill(null),
      Wednesday: Array(6).fill(null),
      Thursday: Array(6).fill(null),
      Friday: Array(6).fill(null)
    };
  }

  db.teachers.push(newTeacher);

  // Add a notification about added teacher
  db.notifications.unshift({
    id: `not_t_${Date.now()}`,
    title: 'New Teacher Added',
    message: `${newTeacher.name} has been enrolled successfully as a ${newTeacher.subject} teacher.`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false
  });

  saveDB(db);
  res.status(201).json({ teacher: newTeacher, state: db });
});

app.put('/api/teachers/:id', (req, res) => {
  const db = getDB();
  const teacherId = req.params.id;
  const tIndex = db.teachers.findIndex(t => t.id === teacherId);

  if (tIndex === -1) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  // Update teacher properties (retaining schedule)
  const currentT = db.teachers[tIndex];
  db.teachers[tIndex] = {
    ...currentT,
    ...req.body,
    schedule: req.body.schedule || currentT.schedule // retain schedule
  };

  saveDB(db);
  res.json({ teacher: db.teachers[tIndex], state: db });
});

app.delete('/api/teachers/:id', (req, res) => {
  const db = getDB();
  const teacherId = req.params.id;
  
  const toDelete = db.teachers.find(t => t.id === teacherId);
  if (!toDelete) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  db.teachers = db.teachers.filter(t => t.id !== teacherId);
  
  // Add log notification
  db.notifications.unshift({
    id: `not_td_${Date.now()}`,
    title: 'Teacher Removed',
    message: `${toDelete.name} has been removed from the school registry.`,
    type: 'danger',
    createdAt: new Date().toISOString(),
    read: false
  });

  saveDB(db);
  res.json({ message: 'Teacher deleted', state: db });
});

// Schedule Slot Assignment (single slot edit)
app.post('/api/schedule/set-slot', (req, res) => {
  const db = getDB();
  const { teacherId, day, periodIndex, slot } = req.body; // slot is TimetableSlot | null

  const teacher = db.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  if (!daysOrder.includes(day) || periodIndex < 0 || periodIndex >= 6) {
    return res.status(400).json({ error: 'Invalid day or period index' });
  }

  // Validate class conflicts if slot is being set
  if (slot) {
    const classSec = slot.classSection;
    const sameSlotConflict = db.teachers.find(otherT => {
      if (otherT.id === teacherId) return false;
      const otherSlot = otherT.schedule[day]?.[periodIndex];
      return otherSlot && otherSlot.classSection === classSec;
    });

    if (sameSlotConflict) {
      return res.status(400).json({ 
        error: `Conflict! ${sameSlotConflict.name} is already teaching ${classSec} during Day: ${day}, Period: ${periodIndex + 1}.` 
      });
    }
  }

  // Set the slot
  teacher.schedule[day][periodIndex] = slot;
  saveDB(db);
  res.json({ teacher, state: db });
});


// Smart Substitute Suggestion Algorithm
app.get('/api/substitutes/suggest', (req, res) => {
  const db = getDB();
  const { absentTeacherId, date, periodIndex } = req.query;

  if (!absentTeacherId || !date || periodIndex === undefined) {
    return res.status(400).json({ error: 'Missing absentTeacherId, date, or periodIndex' });
  }

  const pIdx = parseInt(periodIndex as string, 10);
  const checkDate = new Date(date as string);
  const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  if (!daysOrder.includes(dayName)) {
    return res.json({ suggestions: [], message: 'Substitute recommendation is only available on weekdays.' });
  }

  // Retrieve absent teacher details
  const absentTeacher = db.teachers.find(t => t.id === absentTeacherId);
  if (!absentTeacher) {
    return res.status(404).json({ error: 'Absent teacher not found' });
  }

  // Find class target to substitute
  const targetSlot = absentTeacher.schedule[dayName][pIdx];
  if (!targetSlot) {
    return res.json({ suggestions: [], message: 'Absent teacher has a free period during that block. No substitute needed!' });
  }

  // Find users who are Present on this date
  const todaysAttendance = db.attendance.filter(att => att.date === date);
  const absentTeacherIds = todaysAttendance.filter(att => att.status === 'Absent').map(att => att.teacherId);
  const presentTeacherIds = todaysAttendance.filter(att => att.status === 'Present').map(att => att.teacherId);

  // Filter possible replacement teachers who fulfill:
  // 1. Are Active
  // 2. Are NOT the absent teacher
  // 3. Are NOT already marked Absent on that day (if attendance marked, must be Present. If attendance not marked yet, we assume active teachers are present)
  // 4. Have a FREE period (schedule is null) at this dayName & periodIndex
  const eligibleTeachers = db.teachers.filter(teacher => {
    if (teacher.id === absentTeacherId) return false;
    if (teacher.status !== 'Active') return false;
    
    // Checked status if log registered
    if (absentTeacherIds.includes(teacher.id)) return false;

    // Must be free during that slot
    const slotAtPeriod = teacher.schedule[dayName][pIdx];
    return slotAtPeriod === null;
  });

  // Calculate work metrics to rank them
  const workloadScores = eligibleTeachers.map(teacher => {
    // 1. Calculate historical substitutions taken
    const substitutionsCount = db.substituteAssignments.filter(
      sub => sub.substituteTeacherId === teacher.id
    ).length;

    // 2. Count current busy periods on this day
    const busyPeriodsToday = teacher.schedule[dayName].filter(slot => slot !== null).length;

    // 3. Subject affinity score (does this teacher share the same or similar subject category?)
    let subjectMatchWeight = 0;
    if (teacher.subject.toLowerCase() === absentTeacher.subject.toLowerCase()) {
      subjectMatchWeight = 10; // high preference
    } else if (
      (absentTeacher.subject.toLowerCase().includes('math') && teacher.subject.toLowerCase().includes('math')) ||
      (absentTeacher.subject.toLowerCase().includes('physics') && teacher.subject.toLowerCase().includes('science')) ||
      (absentTeacher.subject.toLowerCase().includes('science') && teacher.subject.toLowerCase().includes('chemistry')) ||
      (absentTeacher.subject.toLowerCase().includes('science') && teacher.subject.toLowerCase().includes('biology'))
    ) {
      subjectMatchWeight = 5; // medium group preference
    }

    // Rank recommendation: Standard criteria:
    // Minimum substitution counts (balances workload), then minimum busy periods today, then subject affinity.
    // Score formula: (substitutes * 5) + (busyPeriodsToday * 2) - subjectMatchWeight. Lower score is better!
    const recommendationScore = (substitutionsCount * 5) + (busyPeriodsToday * 2) - subjectMatchWeight;

    return {
      teacher,
      substitutionsCount,
      busyPeriodsToday,
      subjectMatchWeight,
      recommendationScore
    };
  });

  // Sort by recommendationScore ascending
  workloadScores.sort((a, b) => a.recommendationScore - b.recommendationScore);

  res.json({
    suggestions: workloadScores.map(scoreItem => ({
      teacherId: scoreItem.teacher.id,
      name: scoreItem.teacher.name,
      subject: scoreItem.teacher.subject,
      substitutionsCount: scoreItem.substitutionsCount,
      busyPeriodsToday: scoreItem.busyPeriodsToday,
      subjectMatch: scoreItem.subjectMatchWeight > 0,
      score: scoreItem.recommendationScore
    })),
    classTarget: targetSlot
  });
});

// Allocate Substitute Teacher explicitly
app.post('/api/substitutes/assign', (req, res) => {
  const db = getDB();
  const { 
    date, 
    periodIndex, 
    absentTeacherId, 
    substituteTeacherId 
  } = req.body;

  if (!date || periodIndex === undefined || !absentTeacherId || !substituteTeacherId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const pIdx = parseInt(periodIndex, 10);
  const checkDate = new Date(date);
  const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  const absentTeacher = db.teachers.find(t => t.id === absentTeacherId);
  const subTeacher = db.teachers.find(t => t.id === substituteTeacherId);

  if (!absentTeacher || !subTeacher) {
    return res.status(404).json({ error: 'Absent or Substitute teacher profile not found.' });
  }

  const targetSlot = absentTeacher.schedule[dayName][pIdx];
  if (!targetSlot) {
    return res.status(400).json({ error: 'Absent teacher has no class at this period.' });
  }

  // Create Assignment log
  const newAssignment: SubstituteAssignment = {
    id: `sub_${Date.now()}`,
    date,
    day: dayName,
    periodIndex: pIdx,
    classSection: targetSlot.classSection,
    absentTeacherId,
    absentTeacherName: absentTeacher.name,
    substituteTeacherId,
    substituteTeacherName: subTeacher.name,
    subject: targetSlot.subject,
    status: 'Assigned',
    createdAt: new Date().toISOString()
  };

  db.substituteAssignments.push(newAssignment);

  // Update attendance record details if present
  const attIndex = db.attendance.findIndex(att => att.date === date && att.teacherId === absentTeacherId);
  if (attIndex !== -1) {
    db.attendance[attIndex].substituteAssigned = true;
    if (!db.attendance[attIndex].substitutes) {
      db.attendance[attIndex].substitutes = {};
    }
    db.attendance[attIndex].substitutes![pIdx] = substituteTeacherId;
  }

  // Send alert notification
  db.notifications.unshift({
    id: `not_sub_${Date.now()}`,
    title: 'Substitute Teacher Confirmed',
    message: `${subTeacher.name} assigned substitute for ${absentTeacher.name} (${targetSlot.classSection}, Period ${pIdx + 1})`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false
  });

  saveDB(db);
  res.json({ assignment: newAssignment, state: db });
});

// Automatic smart conflict checker and suggest slots for extra classes
app.get('/api/extra-classes/suggest', (req, res) => {
  const db = getDB();
  const { teacherId, classSection, date } = req.query;

  if (!teacherId || !classSection || !date) {
    return res.status(400).json({ error: 'Missing teacherId, classSection, or date' });
  }

  const checkDate = new Date(date as string);
  const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  if (!daysOrder.includes(dayName)) {
    return res.json({ suggestions: [], message: 'Extra classes can only be schedules on weekdays.' });
  }

  const teacher = db.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher profile not found.' });
  }

  // Standard periods
  const suggestions = [];

  for (let pIdx = 0; pIdx < 6; pIdx++) {
    // 1. Is the teacher free at Day & Period?
    const isTeacherFree = teacher.schedule[dayName][pIdx] === null;

    // 2. Is the Class Section free during at Day & Period?
    // Run standard scan: no other teacher teaches this grade section at this period index
    const isClassFree = db.teachers.every(otherT => {
      const activeSlot = otherT.schedule[dayName][pIdx];
      return !activeSlot || activeSlot.classSection !== classSection;
    });

    if (isTeacherFree && isClassFree) {
      suggestions.push({
        periodIndex: pIdx,
        timeLabel: `Period ${pIdx + 1}`,
        description: `Perfect free slot: Teacher and ${classSection} are both available.`
      });
    }
  }

  res.json({ suggestions, day: dayName });
});

// Request (and auto-approve if conflict-free) an Extra Class
app.post('/api/extra-classes/request', (req, res) => {
  const db = getDB();
  const { teacherId, classSection, date, periodIndex } = req.body;

  if (!teacherId || !classSection || !date || periodIndex === undefined) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const teacher = db.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(444).json({ error: 'Teacher profile not found' });
  }

  const pIdx = parseInt(periodIndex, 10);
  const checkDate = new Date(date);
  const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  if (!daysOrder.includes(dayName)) {
    return res.status(400).json({ error: 'Only weekday schedules are supported' });
  }

  // Strict Algorithmic Safety Check (Dynamic Timetable Conflict Shield)
  // Check if teacher is free
  if (teacher.schedule[dayName][pIdx] !== null) {
    return res.status(400).json({ error: `You are already teaching a class (${teacher.schedule[dayName][pIdx]?.classSection}) during this period!` });
  }

  // Check if class is free
  const otherTConflict = db.teachers.find(other => {
    const slot = other.schedule[dayName][pIdx];
    return slot && slot.classSection === classSection;
  });

  if (otherTConflict) {
    return res.status(400).json({ 
      error: `Conflict! ${otherTConflict.name} is scheduled to teach ${classSection} during this slot.`
    });
  }

  // Auto approve if requested or add request log
  const request: ExtraClassRequest = {
    id: `ext_${Date.now()}`,
    teacherId,
    teacherName: teacher.name,
    subject: teacher.subject,
    classSection,
    date,
    day: dayName,
    periodIndex: pIdx,
    status: 'Approved', // Auto approved as it is fully validated conflict-free
    createdAt: new Date().toISOString()
  };

  db.extraClassRequests.push(request);

  // Direct append of extra slot to weekly schedule for timetable view
  const updatedSlot: TimetableSlot = {
    subject: `${teacher.subject} (Extra)`,
    classSection,
    room: 'Room A-10' + (pIdx + 1),
    isExtra: true
  };

  // Add the extra class schedule slot (This reflects temporarily on the timetable!)
  teacher.schedule[dayName][pIdx] = updatedSlot;

  // Add system notifications
  db.notifications.unshift({
    id: `not_ext_${Date.now()}`,
    title: 'Extra Class Scheduled',
    message: `${teacher.name} scheduled an extra class for ${classSection} on ${dayName} at Period ${pIdx + 1}.`,
    type: 'info',
    createdAt: new Date().toISOString(),
    read: false
  });

  saveDB(db);
  res.json({ request, state: db });
});


// Daily Register Attendance Marker
app.post('/api/attendance/mark', (req, res) => {
  const db = getDB();
  const { date, teacherStatuses } = req.body; 
  // teacherStatuses is { [teacherId]: 'Present' | 'Absent' }

  if (!date || !teacherStatuses) {
    return res.status(400).json({ error: 'Missing date or teacherStatuses registry payload' });
  }

  const checkDate = new Date(date);
  const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

  // Track absences to suggest substitutes
  const absentTeachersThisTurn: string[] = [];

  Object.entries(teacherStatuses).forEach(([teacherId, status]) => {
    const existIndex = db.attendance.findIndex(att => att.date === date && att.teacherId === teacherId);
    
    // Check if transition is from present to absent so we can trigger substitute suggestion alert
    const wasAbsent = existIndex !== -1 && db.attendance[existIndex].status === 'Absent';
    const isNowAbsent = status === 'Absent';

    if (isNowAbsent && !wasAbsent) {
      absentTeachersThisTurn.push(teacherId);
    }

    if (existIndex !== -1) {
      db.attendance[existIndex].status = status as 'Present' | 'Absent';
      // If marked present, erase any substitute logs associated
      if (status === 'Present') {
        db.attendance[existIndex].substituteAssigned = false;
        delete db.attendance[existIndex].substitutes;
      }
    } else {
      const record: AttendanceRecord = {
        id: `att_${date}_${teacherId}`,
        date,
        teacherId,
        status: status as 'Present' | 'Absent'
      };
      
      if (isNowAbsent) {
        record.substituteAssigned = false;
        record.substitutes = {};
      }

      db.attendance.push(record);
    }
  });

  // For any teacher marked absent this turn, add a warning alert and suggest immediate substitutions
  absentTeachersThisTurn.forEach(teacherId => {
    const t = db.teachers.find(teacher => teacher.id === teacherId);
    if (t) {
      db.notifications.unshift({
        id: `not_att_abs_${Date.now()}_${teacherId}`,
        title: 'Teacher Marked Absent',
        message: `${t.name} marked absent on ${date}. Automated substitute routing recommended.`,
        type: 'danger',
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  });

  saveDB(db);
  res.json({ message: 'Attendance register saved successfully', state: db });
});

// Notifications update
app.put('/api/notifications/read-all', (req, res) => {
  const db = getDB();
  db.notifications.forEach(n => n.read = true);
  saveDB(db);
  res.json({ state: db });
});

app.put('/api/notifications/:id', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const item = db.notifications.find(n => n.id === id);
  if (item) {
    item.read = true;
  }
  saveDB(db);
  res.json({ state: db });
});

app.delete('/api/notifications/:id', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  db.notifications = db.notifications.filter(n => n.id !== id);
  saveDB(db);
  res.json({ state: db });
});

// Leave Application Endpoints
app.post('/api/leaves/apply', (req, res) => {
  const db = getDB();
  const { teacherId, startDate, endDate, leaveType, reason } = req.body;

  if (!teacherId || !startDate || !endDate || !leaveType) {
    return res.status(400).json({ error: 'Missing required leave properties' });
  }

  const teacher = db.teachers.find(t => t.id === teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher profile not found' });
  }

  const id = `lv_${Date.now()}`;
  const newLeave: LeaveRequest = {
    id,
    teacherId,
    teacherName: teacher.name,
    subject: teacher.subject,
    startDate,
    endDate,
    leaveType,
    reason: reason || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  if (!db.leaveRequests) {
    db.leaveRequests = [];
  }
  db.leaveRequests.unshift(newLeave);

  // Send a Notification to Principal (admin)
  db.notifications.unshift({
    id: `not_lv_apply_${Date.now()}`,
    title: 'New Leave Request From Faculty',
    message: `${teacher.name} requested ${leaveType} from ${startDate} to ${endDate}.`,
    type: 'info',
    createdAt: new Date().toISOString(),
    read: false
  });

  saveDB(db);
  res.status(201).json({ leave: newLeave, state: db });
});

app.post('/api/leaves/:id/review', (req, res) => {
  const db = getDB();
  const leaveId = req.params.id;
  const { status, reviewComment } = req.body; // status is 'Approved' | 'Rejected'

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid leave review status choice' });
  }

  if (!db.leaveRequests) {
    db.leaveRequests = [];
  }
  const leaveIndex = db.leaveRequests.findIndex(lv => lv.id === leaveId);
  if (leaveIndex === -1) {
    return res.status(404).json({ error: 'Leave application not found' });
  }

  const leave = db.leaveRequests[leaveIndex];
  leave.status = status;
  leave.reviewComment = reviewComment || '';

  // Notify the system
  db.notifications.unshift({
    id: `not_lv_rev_${Date.now()}`,
    title: `Leave Request ${status}`,
    message: `${leave.teacherName}'s request for ${leave.leaveType} has been ${status.toLowerCase()}.`,
    type: status === 'Approved' ? 'success' : 'danger',
    createdAt: new Date().toISOString(),
    read: false
  });

  if (status === 'Approved') {
    // Optionally change teacher status
    const teacher = db.teachers.find(t => t.id === leave.teacherId);
    if (teacher) {
      // If leave encapsulates today's date, update teacher's current status
      const todayStr = '2026-05-25'; // Default focus date 
      if (todayStr >= leave.startDate && todayStr <= leave.endDate) {
        teacher.status = 'On Leave';
      }

      // Automatically add/update attendance record for days of leave to be "Absent"
      // to trigger substitute management suggestions.
      let current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
        if (dayName !== 'Saturday' && dayName !== 'Sunday') {
          const existIndex = db.attendance.findIndex(att => att.date === dateStr && att.teacherId === teacher.id);
          if (existIndex !== -1) {
            db.attendance[existIndex].status = 'Absent';
          } else {
            db.attendance.push({
              id: `att_${dateStr}_${teacher.id}`,
              date: dateStr,
              teacherId: teacher.id,
              status: 'Absent',
              substituteAssigned: false,
              substitutes: {}
            });
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }
  }

  saveDB(db);
  res.json({ leave, state: db });
});

// Simple Secure Session login endpoint
app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  // Pre-seed admin credentials check
  if (role === 'admin' && email === 'admin@xyz.edu' && password === 'admin123') {
    return res.json({
      session: {
        userId: 'admin_sys',
        name: 'Principal Office',
        email: 'admin@xyz.edu',
        role: 'admin'
      }
    });
  }

  // If role is teacher, cross-verify teacher emails from database
  const db = getDB();
  const teacher = db.teachers.find(
    t => t.email.toLowerCase() === email.toLowerCase() && password === 'teach123'
  );

  if (role === 'teacher' && teacher) {
    return res.json({
      session: {
        userId: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid school credentials or role combination. Use admin@xyz.edu / admin123 OR any teacher email (e.g., aaravsharma@xyz.edu) with password teach123.' });
});

// Single point start function to support Express + Vite Middleware for Dev and production bundling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`XYZ School ERP server running at http://localhost:${PORT}`);
    console.log(`Dev environment mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
