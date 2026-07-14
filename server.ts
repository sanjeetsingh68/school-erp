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
  School,
  Principal,
  AuditLog
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

  // Set schoolId 's_xyz' to all seeded records
  teachers.forEach(t => { if (!t.schoolId) t.schoolId = 's_xyz'; });
  attendance.forEach(a => { if (!a.schoolId) a.schoolId = 's_xyz'; });
  extraClassRequests.forEach(e => { if (!e.schoolId) e.schoolId = 's_xyz'; });
  substituteAssignments.forEach(s => { if (!s.schoolId) s.schoolId = 's_xyz'; });
  notifications.forEach(n => { if (!n.schoolId) n.schoolId = 's_xyz'; });
  leaveRequests.forEach(l => { if (!l.schoolId) l.schoolId = 's_xyz'; });

  // Add schools list
  const schools: School[] = [
    {
      id: 's_xyz',
      name: 'XYZ Public School',
      code: 'XYZ-01',
      address: '123 Academic Block, North Sector',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      phone: '+91 11 2345 6789',
      email: 'info@xyz.edu',
      principal: 'Dr. Rajesh Sharma',
      principalEmail: 'admin@xyz.edu',
      board: 'CBSE',
      academicYear: '2026-2027',
      status: 'Active',
      subscription: 'Enterprise',
      subscriptionStartDate: '2025-07-01',
      licenseExpiry: '2027-06-30',
      renewals: 1,
      paymentStatus: 'Paid',
      autoRenewal: true,
      gracePeriodDays: 7,
      licenseDurationMonths: 12,
      lastPaymentDate: '2025-06-28',
      nextBillingDate: '2026-07-01',
      outstandingAmount: 0,
      storageUsage: 45.2
    },
    {
      id: 's_abc',
      name: 'ABC International School',
      code: 'ABC-02',
      address: '78 Lotus Valley Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      phone: '+91 22 9876 5432',
      email: 'contact@abc.edu',
      principal: 'Mrs. Anjali Mehta',
      principalEmail: 'principal@abc.edu',
      board: 'ICSE',
      academicYear: '2026-2027',
      status: 'Active',
      subscription: 'Premium',
      subscriptionStartDate: '2026-01-01',
      licenseExpiry: '2026-12-31',
      renewals: 0,
      paymentStatus: 'Paid',
      autoRenewal: true,
      gracePeriodDays: 7,
      licenseDurationMonths: 12,
      lastPaymentDate: '2025-12-28',
      nextBillingDate: '2026-12-31',
      outstandingAmount: 0,
      storageUsage: 12.8
    },
    {
      id: 's_oak',
      name: 'Oakridge Global Academy',
      code: 'OGA-03',
      address: '102 Tech Corridor Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      phone: '+91 80 4321 8765',
      email: 'info@oakridge.edu',
      principal: 'Mr. David Miller',
      principalEmail: 'principal@oakridge.edu',
      board: 'CBSE',
      academicYear: '2026-2027',
      status: 'Grace Period',
      subscription: 'Basic',
      subscriptionStartDate: '2025-07-10',
      licenseExpiry: '2026-07-10', // Expired based on current July 14, 2026 date
      renewals: 0,
      paymentStatus: 'Expired',
      autoRenewal: false,
      gracePeriodDays: 7,
      licenseDurationMonths: 12,
      lastPaymentDate: '2025-07-10',
      nextBillingDate: '2026-07-10',
      outstandingAmount: 15000,
      storageUsage: 8.4
    },
    {
      id: 's_stx',
      name: "St. Xavier's High School",
      code: 'SXH-04',
      address: 'Park Street Campus',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      phone: '+91 33 2222 5555',
      email: 'office@stxaviers.edu',
      principal: 'Father Joseph Dsouza',
      principalEmail: 'principal@stxaviers.edu',
      board: 'ICSE',
      academicYear: '2026-2027',
      status: 'Suspended',
      subscription: 'Premium',
      subscriptionStartDate: '2025-06-01',
      licenseExpiry: '2026-06-01', // Expired beyond 7-day grace period
      renewals: 0,
      paymentStatus: 'Overdue',
      autoRenewal: false,
      gracePeriodDays: 7,
      licenseDurationMonths: 12,
      lastPaymentDate: '2025-05-28',
      nextBillingDate: '2026-06-01',
      outstandingAmount: 25000,
      storageUsage: 19.5
    },
    {
      id: 's_pin',
      name: 'Pinecrest Academy',
      code: 'PCA-05',
      address: 'Hills Extension Site',
      city: 'Shimla',
      state: 'Himachal Pradesh',
      country: 'India',
      phone: '+91 177 555 1234',
      email: 'admin@pinecrest.edu',
      principal: 'Mrs. Rebecca Scott',
      principalEmail: 'principal@pinecrest.edu',
      board: 'State Board',
      academicYear: '2026-2027',
      status: 'Disabled',
      subscription: 'Enterprise',
      subscriptionStartDate: '2025-01-15',
      licenseExpiry: '2026-01-15', // Manually disabled / expired
      renewals: 0,
      paymentStatus: 'Expired',
      autoRenewal: true,
      gracePeriodDays: 14,
      licenseDurationMonths: 12,
      lastPaymentDate: '2025-01-12',
      nextBillingDate: '2026-01-15',
      outstandingAmount: 50000,
      storageUsage: 5.6
    }
  ];

  // Add principals list
  const principals: Principal[] = [
    {
      id: 'p_xyz',
      name: 'Dr. Rajesh Sharma',
      email: 'admin@xyz.edu',
      phone: '+91 98111 22233',
      schoolId: 's_xyz',
      status: 'Active'
    },
    {
      id: 'p_abc',
      name: 'Mrs. Anjali Mehta',
      email: 'principal@abc.edu',
      phone: '+91 98222 33344',
      schoolId: 's_abc',
      status: 'Active'
    },
    {
      id: 'p_oak',
      name: 'Mr. David Miller',
      email: 'principal@oakridge.edu',
      phone: '+91 98333 44455',
      schoolId: 's_oak',
      status: 'Active'
    },
    {
      id: 'p_stx',
      name: 'Father Joseph Dsouza',
      email: 'principal@stxaviers.edu',
      phone: '+91 98444 55566',
      schoolId: 's_stx',
      status: 'Active'
    },
    {
      id: 'p_pin',
      name: 'Mrs. Rebecca Scott',
      email: 'principal@pinecrest.edu',
      phone: '+91 98555 66677',
      schoolId: 's_pin',
      status: 'Active'
    }
  ];

  // Add 5 teachers for ABC International
  const abcTeacherNames = ['Kabir Malhotra', 'Ananya Iyer', 'Rohan Joshi', 'Meera Sen', 'Dev Patel'];
  const abcSubjects = ['Science (Physics)', 'Mathematics', 'English Literature', 'History', 'Art & Design'];
  const abcClasses = ['Grade 10-A', 'Grade 9-A', 'Grade 11-A', 'Grade 12-A', 'Grade 9-B'];
  
  const abcTeachers: Teacher[] = abcTeacherNames.map((name, index) => {
    const id = `t_abc_${index + 1}`;
    const subject = abcSubjects[index];
    const defaultClass = abcClasses[index];
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@abc.edu`;
    const phone = `+91 99000 ${Math.floor(10000 + Math.random() * 90000)}`;
    const schedule: any = {
      Monday: Array(6).fill(null),
      Tuesday: Array(6).fill(null),
      Wednesday: Array(6).fill(null),
      Thursday: Array(6).fill(null),
      Friday: Array(6).fill(null)
    };
    
    // Quick assign standard periods
    daysOrder.forEach((day, dIdx) => {
      schedule[day][1] = {
        subject,
        classSection: defaultClass,
        room: `Lab ${200 + index + 1}`
      };
      schedule[day][3] = {
        subject,
        classSection: defaultClass,
        room: `Lab ${200 + index + 1}`
      };
    });

    return {
      id,
      schoolId: 's_abc',
      name,
      email,
      phone,
      subject,
      classSection: defaultClass,
      status: 'Active',
      schedule
    };
  });

  teachers.push(...abcTeachers);

  // Seed sample leave for ABC
  leaveRequests.push({
    id: 'lv_abc_1',
    schoolId: 's_abc',
    teacherId: 't_abc_1',
    teacherName: 'Kabir Malhotra',
    subject: 'Science (Physics)',
    startDate: '2026-05-27',
    endDate: '2026-05-28',
    leaveType: 'Casual Leave',
    reason: 'Family event',
    status: 'Pending',
    createdAt: '2026-05-25T07:15:00.000Z'
  });

  // Seed notifications for ABC
  notifications.push({
    id: 'n_abc_1',
    schoolId: 's_abc',
    title: 'New Term Registrations Open',
    message: 'Admissions and schedules for academic year 2026-2027 have been synchronized.',
    type: 'success',
    createdAt: '2026-05-25T01:00:00.000Z',
    read: false,
    category: 'system'
  });

  // Seed attendance for ABC teachers
  abcTeachers.forEach(teacher => {
    attendance.push({
      id: `att_abc_2026-05-25_${teacher.id}`,
      schoolId: 's_abc',
      date: '2026-05-25',
      teacherId: teacher.id,
      status: 'Present'
    });
  });

  const auditLogs: AuditLog[] = [
    {
      id: 'audit_init_1',
      adminName: 'SaaS Platform Engine',
      dateTime: new Date().toISOString(),
      action: 'System Initialized',
      reason: 'Seeded Multi-Tenant SaaS ecosystem. Active, Grace Period, Suspended, and Disabled sample workspaces are ready.',
      schoolName: 'All Schools'
    }
  ];

  return {
    schools,
    principals,
    teachers,
    attendance,
    extraClassRequests,
    substituteAssignments,
    notifications,
    leaveRequests,
    auditLogs
  };
}

// Helper to calculate difference in days
function getDaysDiff(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  if (isNaN(t1) || isNaN(t2)) return 0;
  return Math.ceil((t1 - t2) / (1000 * 60 * 60 * 24));
}

// Automatic subscription monitoring & status transitions
function checkSubscriptions(db: ERPDataState): boolean {
  if (!db.schools) db.schools = [];
  if (!db.notifications) db.notifications = [];
  if (!db.auditLogs) db.auditLogs = [];

  const todayStr = new Date().toISOString().split('T')[0];
  let changed = false;

  db.schools.forEach(school => {
    // Fill in default values if they are missing
    if (!school.gracePeriodDays) { school.gracePeriodDays = 7; changed = true; }
    if (school.outstandingAmount === undefined) { school.outstandingAmount = 0; changed = true; }
    if (!school.subscriptionStartDate) { school.subscriptionStartDate = '2025-07-01'; changed = true; }
    if (school.autoRenewal === undefined) { school.autoRenewal = true; changed = true; }
    if (!school.licenseDurationMonths) { school.licenseDurationMonths = 12; changed = true; }

    const daysRemaining = getDaysDiff(school.licenseExpiry, todayStr);

    // 1. Expiry Warnings (30, 15, 7, 3, 1 days)
    const warningDays = [30, 15, 7, 3, 1];
    if (daysRemaining > 0 && warningDays.includes(daysRemaining)) {
      const notifId = `sub_warn_${school.id}_${daysRemaining}`;
      const alreadyExists = db.notifications.some(n => n.id === notifId);
      if (!alreadyExists) {
        const message = `${school.name}'s ${school.subscription} subscription will expire in ${daysRemaining} day(s) on ${school.licenseExpiry}. Please renew in time.`;
        db.notifications.unshift({
          id: notifId,
          schoolId: school.id,
          title: `Subscription Expiring Soon: ${school.name}`,
          message,
          type: 'warning',
          createdAt: new Date().toISOString(),
          read: false,
          category: 'system',
          priority: 'high'
        });
        changed = true;
      }
    }

    // 2. Expiry Status Transitions
    if (daysRemaining <= 0) {
      const overdueDays = Math.abs(daysRemaining);

      if (school.status === 'Active') {
        // Transition to Grace Period
        school.status = 'Grace Period';
        school.paymentStatus = 'Expired';
        changed = true;

        const actionLog: AuditLog = {
          id: `audit_grace_${school.id}_${Date.now()}`,
          adminName: 'System Scheduler',
          dateTime: new Date().toISOString(),
          action: 'Automatic Grace Period Entrance',
          reason: `Subscription expired on ${school.licenseExpiry}. Grace period of ${school.gracePeriodDays} days started.`,
          schoolName: school.name
        };
        db.auditLogs.unshift(actionLog);

        db.notifications.unshift({
          id: `notif_grace_${school.id}_${Date.now()}`,
          schoolId: school.id,
          title: `Subscription Expired - Grace Period Entered`,
          message: `Your school's ERP subscription expired on ${school.licenseExpiry}. You have entered a ${school.gracePeriodDays}-day grace period. Please renew to avoid service suspension. Outstanding: ₹${school.outstandingAmount?.toLocaleString() || '0'}.`,
          type: 'warning',
          createdAt: new Date().toISOString(),
          read: false,
          category: 'system',
          priority: 'high'
        });
      } else if (school.status === 'Grace Period') {
        // Transition to Suspended after grace period ends
        if (overdueDays > (school.gracePeriodDays || 7)) {
          school.status = 'Suspended';
          school.paymentStatus = 'Overdue';
          changed = true;

          const actionLog: AuditLog = {
            id: `audit_auto_susp_${school.id}_${Date.now()}`,
            adminName: 'System Scheduler',
            dateTime: new Date().toISOString(),
            action: 'Automatic Suspension',
            reason: `Grace period of ${school.gracePeriodDays} days ended. Subscription expired on ${school.licenseExpiry}.`,
            schoolName: school.name
          };
          db.auditLogs.unshift(actionLog);

          db.notifications.unshift({
            id: `notif_susp_${school.id}_${Date.now()}`,
            schoolId: school.id,
            title: `ERP Access Suspended`,
            message: `Your school's ERP access has been suspended due to non-payment after the grace period ended. Contact support for reactivation.`,
            type: 'danger',
            createdAt: new Date().toISOString(),
            read: false,
            category: 'system',
            priority: 'high'
          });
        }
      }
    }
  });

  return changed;
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
    const db = JSON.parse(raw);
    
    // Automatically check subscriptions on state loading
    if (checkSubscriptions(db)) {
      saveDB(db);
    }
    
    return db;
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
  const schoolId = req.query.schoolId as string;
  
  if (schoolId) {
    // Return filtered isolated state for this school
    res.json({
      schools: db.schools || [],
      principals: db.principals || [],
      teachers: (db.teachers || []).filter(t => t.schoolId === schoolId),
      attendance: (db.attendance || []).filter(a => a.schoolId === schoolId),
      extraClassRequests: (db.extraClassRequests || []).filter(r => r.schoolId === schoolId),
      substituteAssignments: (db.substituteAssignments || []).filter(a => a.schoolId === schoolId),
      notifications: (db.notifications || []).filter(n => n.schoolId === schoolId),
      leaveRequests: (db.leaveRequests || []).filter(l => l.schoolId === schoolId)
    });
  } else {
    // Return full state for super admin
    res.json(db);
  }
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

  const db = getDB();

  // 1. Super Admin Role Authentication
  if ((role === 'superadmin' || email === 'superadmin@erp.com') && email === 'superadmin@erp.com' && password === 'super123') {
    return res.json({
      session: {
        userId: 'superadmin_sys',
        name: 'Global Super Admin',
        email: 'superadmin@erp.com',
        role: 'superadmin'
      }
    });
  }

  // 2. Principal Role Authentication
  if (role === 'principal' || role === 'admin') {
    // Backward compatibility check for default principal
    if (email === 'admin@xyz.edu' && password === 'admin123') {
      return res.json({
        session: {
          userId: 'p_xyz',
          name: 'Dr. Rajesh Sharma',
          email: 'admin@xyz.edu',
          role: 'principal',
          schoolId: 's_xyz'
        }
      });
    }

    // Dynamic search across principals list
    const foundPrincipal = (db.principals || []).find(
      p => p.email.toLowerCase() === email.toLowerCase() && password === 'admin123'
    );

    if (foundPrincipal) {
      if (foundPrincipal.status === 'Suspended') {
        return res.status(403).json({ error: 'Access denied. Your principal administrator account is suspended.' });
      }

      return res.json({
        session: {
          userId: foundPrincipal.id,
          name: foundPrincipal.name,
          email: foundPrincipal.email,
          role: 'principal',
          schoolId: foundPrincipal.schoolId
        }
      });
    }
  }

  // 3. Teacher Role Authentication
  if (role === 'teacher') {
    const teacher = db.teachers.find(
      t => t.email.toLowerCase() === email.toLowerCase() && password === 'teach123'
    );

    if (teacher) {
      if (teacher.status === 'Suspended') {
        return res.status(403).json({ error: 'Access denied. Your teacher account has been suspended.' });
      }

      return res.json({
        session: {
          userId: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: 'teacher',
          schoolId: teacher.schoolId || 's_xyz'
        }
      });
    }
  }

  return res.status(401).json({ 
    error: 'Invalid login credentials or role. For Super Admin use superadmin@erp.com/super123. For School Principal use admin@xyz.edu/admin123 or principal@abc.edu/admin123.' 
  });
});

// ---------------------- SUPER ADMIN API SUITE ----------------------

// School Management endpoints
app.post('/api/schools', (req, res) => {
  const db = getDB();
  const {
    name,
    code,
    email,
    phone,
    address,
    city,
    state,
    country,
    principalName,
    principalEmail,
    principalMobile,
    board,
    academicSession,
    logo,
    subscription,
    licenseExpiry,
    paymentStatus
  } = req.body;

  if (!name || !code || !email || !principalEmail) {
    return res.status(400).json({ error: 'Missing required school properties (Name, Code, Email, Principal Email)' });
  }

  // Check code uniqueness
  const existingSchool = (db.schools || []).find(s => s.code.toLowerCase() === code.toLowerCase());
  if (existingSchool) {
    return res.status(400).json({ error: `School Code "${code}" is already in use by another school.` });
  }

  const schoolId = `s_${code.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

  const newSchool: School = {
    id: schoolId,
    name,
    code: code.toUpperCase(),
    logo: logo || '',
    address: address || '',
    city: city || 'New Delhi',
    state: state || 'Delhi',
    country: country || 'India',
    phone: phone || '',
    email,
    principal: principalName || 'Principal Administrator',
    principalEmail,
    board: board || 'CBSE',
    academicYear: academicSession || '2026-2027',
    status: 'Active',
    subscription: subscription || 'Trial',
    licenseExpiry: licenseExpiry || '2027-07-01',
    renewals: 0,
    paymentStatus: paymentStatus || 'Pending',
    storageUsage: 0.1
  };

  if (!db.schools) db.schools = [];
  db.schools.push(newSchool);

  // Automatically create principal account
  const newPrincipal: Principal = {
    id: `p_${Date.now()}`,
    name: principalName || 'Principal Administrator',
    email: principalEmail,
    phone: principalMobile || phone || '',
    schoolId,
    status: 'Active'
  };

  if (!db.principals) db.principals = [];
  db.principals.push(newPrincipal);

  // Automatically seed ERP workspace with standard teachers
  const seededSubjects = ['Mathematics', 'Science (Physics)', 'English Literature', 'Art & Design'];
  const seededTeacherNames = [
    `${principalName || 'Adviser'} Math Faculty`,
    'Vikram Sharma',
    'Neha Iyer',
    'Arjun Patel'
  ];

  const seededTeachers: Teacher[] = seededSubjects.map((sub, i) => ({
    id: `t_${schoolId}_${i + 1}`,
    schoolId,
    name: seededTeacherNames[i],
    email: `faculty${i + 1}@${email.split('@')[1] || 'school.edu'}`,
    phone: phone || '+91 99000 00000',
    subject: sub,
    classSection: 'Grade 10-A',
    status: 'Active',
    schedule: {
      Monday: Array(6).fill(null),
      Tuesday: Array(6).fill(null),
      Wednesday: Array(6).fill(null),
      Thursday: Array(6).fill(null),
      Friday: Array(6).fill(null)
    }
  }));

  // Assign basic schedules to seed teachers
  seededTeachers.forEach((t, i) => {
    t.schedule.Monday[i % 6] = {
      subject: t.subject,
      classSection: 'Grade 10-A',
      room: `Room ${101 + i}`
    };
    t.schedule.Wednesday[(i + 2) % 6] = {
      subject: t.subject,
      classSection: 'Grade 10-A',
      room: `Room ${101 + i}`
    };
  });

  db.teachers.push(...seededTeachers);

  // Seed sample student notification
  db.notifications.unshift({
    id: `not_sys_${schoolId}_welcome`,
    schoolId,
    title: 'School ERP Workspace Ready',
    message: `Welcome to ${name}! Your isolated school database workspace, registers, and principal roles have been initialized.`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'system'
  });

  saveDB(db);
  res.status(201).json({ school: newSchool, principal: newPrincipal, state: db });
});

app.put('/api/schools/:id', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const sIndex = db.schools?.findIndex(s => s.id === id);
  if (sIndex === undefined || sIndex === -1) {
    return res.status(404).json({ error: 'School not found' });
  }

  db.schools![sIndex] = {
    ...db.schools![sIndex],
    ...req.body
  };

  // Sync Principal name/email if updated
  const principal = db.principals?.find(p => p.schoolId === id);
  if (principal) {
    if (req.body.principal) principal.name = req.body.principal;
    if (req.body.principalEmail) principal.email = req.body.principalEmail;
  }

  saveDB(db);
  res.json({ school: db.schools![sIndex], state: db });
});

app.delete('/api/schools/:id', (req, res) => {
  const db = getDB();
  const id = req.params.id;

  if (db.schools) {
    db.schools = db.schools.filter(s => s.id !== id);
  }
  if (db.principals) {
    db.principals = db.principals.filter(p => p.schoolId !== id);
  }

  // Clean all isolated tenant data associated with this school ID
  db.teachers = db.teachers.filter(t => t.schoolId !== id);
  db.attendance = db.attendance.filter(a => a.schoolId !== id);
  db.leaveRequests = db.leaveRequests.filter(l => l.schoolId !== id);
  db.notifications = db.notifications.filter(n => n.schoolId !== id);
  db.extraClassRequests = db.extraClassRequests.filter(e => e.schoolId !== id);
  db.substituteAssignments = db.substituteAssignments.filter(s => s.schoolId !== id);

  saveDB(db);
  res.json({ message: 'School and all associated tenant data deleted successfully', state: db });
});

// --- SUBSCRIPTION & SCHOOL ACCESS MANAGEMENT ENDPOINTS ---

// 1. Activate / Reactivate School
app.post('/api/schools/:id/activate', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  const previousStatus = school.status;
  school.status = 'Active';
  school.paymentStatus = 'Paid';
  school.outstandingAmount = 0;

  // Extend license if it was expired
  const todayStr = new Date().toISOString().split('T')[0];
  const daysDiff = getDaysDiff(school.licenseExpiry, todayStr);
  if (daysDiff <= 0) {
    // Extend for 1 month by default on activation
    const currentExpiry = new Date();
    currentExpiry.setMonth(currentExpiry.getMonth() + 1);
    school.licenseExpiry = currentExpiry.toISOString().split('T')[0];
  }

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: previousStatus === 'Suspended' ? 'School Reactivated' : 'School Activated',
    reason: reason || 'Manual activation & payment received.',
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 2. Suspend School
app.post('/api/schools/:id/suspend', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  school.status = 'Suspended';
  school.paymentStatus = 'Overdue';

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: 'School Suspended',
    reason: reason || 'Manual suspension due to pending invoices.',
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 3. Disable School
app.post('/api/schools/:id/disable', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  school.status = 'Disabled';

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: 'School Disabled',
    reason: reason || 'Manual disabling for administrative reasons/policy violations.',
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 4. Reactivate School
app.post('/api/schools/:id/reactivate', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  school.status = 'Active';

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: 'School Reactivated',
    reason: reason || 'Manual reactivation by Super Admin.',
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 5. Extend Subscription
app.post('/api/schools/:id/extend', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { days, reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  const extendDays = parseInt(days) || 30;
  const currentExpiry = new Date(school.licenseExpiry);
  currentExpiry.setDate(currentExpiry.getDate() + extendDays);
  school.licenseExpiry = currentExpiry.toISOString().split('T')[0];

  // If the school was suspended or in grace period, extend makes them active
  if (school.status === 'Suspended' || school.status === 'Grace Period') {
    school.status = 'Active';
    school.paymentStatus = 'Paid';
  }

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: 'Subscription Extended',
    reason: `${reason || 'Extension granted'}. Extended expiry to ${school.licenseExpiry} (${extendDays} days).`,
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 6. Renew Subscription
app.post('/api/schools/:id/renew', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { plan, durationMonths, outstandingAmount, reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  const months = parseInt(durationMonths) || 12;
  school.subscription = plan || school.subscription;
  school.licenseDurationMonths = months;
  school.outstandingAmount = parseFloat(outstandingAmount) || 0;
  school.paymentStatus = 'Paid';
  school.status = 'Active';
  school.renewals = (school.renewals || 0) + 1;
  school.lastPaymentDate = new Date().toISOString().split('T')[0];
  
  // Calculate expiry
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + months);
  school.licenseExpiry = expiryDate.toISOString().split('T')[0];
  school.nextBillingDate = school.licenseExpiry;

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: 'Payment Received & Renewed',
    reason: `Renewed plan to ${school.subscription} for ${months} months. New expiry: ${school.licenseExpiry}. Outstanding amount of ₹${outstandingAmount || 0} resolved. ${reason || ''}`,
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 7. Change Subscription Plan
app.post('/api/schools/:id/change-plan', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { plan, reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  const oldPlan = school.subscription;
  school.subscription = plan;

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: 'Plan Changed',
    reason: `Plan transitioned from ${oldPlan} to ${plan}. Reason: ${reason || 'Customer upgrade/downgrade request.'}`,
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 8. Edit Billing Profile
app.post('/api/schools/:id/edit-billing', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { gracePeriodDays, autoRenewal, licenseDurationMonths, outstandingAmount, paymentStatus, reason, adminName } = req.body;
  const school = db.schools?.find(s => s.id === id);
  if (!school) return res.status(404).json({ error: 'School not found' });

  if (gracePeriodDays !== undefined) school.gracePeriodDays = parseInt(gracePeriodDays);
  if (autoRenewal !== undefined) school.autoRenewal = autoRenewal === true || autoRenewal === 'true';
  if (licenseDurationMonths !== undefined) school.licenseDurationMonths = parseInt(licenseDurationMonths);
  if (outstandingAmount !== undefined) school.outstandingAmount = parseFloat(outstandingAmount);
  if (paymentStatus !== undefined) school.paymentStatus = paymentStatus;

  // Record audit log
  const log: AuditLog = {
    id: `audit_${Date.now()}`,
    adminName: adminName || 'Global Super Admin',
    dateTime: new Date().toISOString(),
    action: 'Billing Profile Updated',
    reason: reason || 'Super Admin adjusted billing specifications and grace boundaries.',
    schoolName: school.name
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);

  saveDB(db);
  res.json({ school, state: db });
});

// 9. Fetch Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const db = getDB();
  res.json(db.auditLogs || []);
});

// --- PRINCIPAL MANAGEMENT ENDPOINTS ---
app.post('/api/principals', (req, res) => {
  const db = getDB();
  const { name, email, phone, schoolId, status } = req.body;

  if (!name || !email || !schoolId) {
    return res.status(400).json({ error: 'Missing name, email, or school ID' });
  }

  // Check unique email across principals
  const existingPrincipal = (db.principals || []).find(p => p.email.toLowerCase() === email.toLowerCase());
  if (existingPrincipal) {
    return res.status(400).json({ error: `Principal with email "${email}" already exists.` });
  }

  const newPrincipal: Principal = {
    id: `p_${Date.now()}`,
    name,
    email,
    phone: phone || '',
    schoolId,
    status: status || 'Active'
  };

  if (!db.principals) db.principals = [];
  db.principals.push(newPrincipal);

  // Sync school table principal name and email
  const school = db.schools?.find(s => s.id === schoolId);
  if (school) {
    school.principal = name;
    school.principalEmail = email;
  }

  saveDB(db);
  res.status(201).json({ principal: newPrincipal, state: db });
});

app.put('/api/principals/:id', (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const pIndex = db.principals?.findIndex(p => p.id === id);
  if (pIndex === undefined || pIndex === -1) {
    return res.status(404).json({ error: 'Principal not found' });
  }

  db.principals![pIndex] = {
    ...db.principals![pIndex],
    ...req.body
  };

  // Sync associated school principal name and email
  const schoolId = db.principals![pIndex].schoolId;
  const school = db.schools?.find(s => s.id === schoolId);
  if (school) {
    school.principal = db.principals![pIndex].name;
    school.principalEmail = db.principals![pIndex].email;
  }

  saveDB(db);
  res.json({ principal: db.principals![pIndex], state: db });
});

app.delete('/api/principals/:id', (req, res) => {
  const db = getDB();
  const id = req.params.id;

  if (db.principals) {
    const toDelete = db.principals.find(p => p.id === id);
    if (toDelete) {
      // Set principal to empty on school
      const school = db.schools?.find(s => s.id === toDelete.schoolId);
      if (school) {
        school.principal = '';
        school.principalEmail = '';
      }
    }
    db.principals = db.principals.filter(p => p.id !== id);
  }

  saveDB(db);
  res.json({ message: 'Principal account deleted successfully', state: db });
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
