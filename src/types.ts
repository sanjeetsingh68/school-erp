export interface TimetableSlot {
  subject: string;
  classSection: string;
  room: string;
  isExtra?: boolean;
  isSubstitute?: boolean;
  originalTeacherId?: string;
  originalTeacherName?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface WeeklySchedule {
  Monday: (TimetableSlot | null)[]; // 6 slots representing Periods 1 to 6
  Tuesday: (TimetableSlot | null)[];
  Wednesday: (TimetableSlot | null)[];
  Thursday: (TimetableSlot | null)[];
  Friday: (TimetableSlot | null)[];
  Saturday?: (TimetableSlot | null)[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  classSection: string; // Default class assigned (e.g. "Grade 10-A")
  status: 'Active' | 'On Leave' | 'Suspended';
  schedule: WeeklySchedule;
  employeeId?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience?: string | number;
  subjects?: string[];
  classesAssigned?: string[];
  sectionsAssigned?: string[];
  maxDailyHours?: number;
  maxWeeklyHours?: number;
  preferredFreePeriods?: { day: DayOfWeek; periodIndex: number }[];
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  status: 'Present' | 'Absent';
  substituteAssigned?: boolean;
  substitutes?: { [periodIndex: number]: string }; // periodIndex -> substituteTeacherId
}

export interface ExtraClassRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  classSection: string;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  periodIndex: number; // 0 to 5 (representing Period 1 - 6)
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface SubstituteAssignment {
  id: string;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  periodIndex: number; // 0 to 5
  classSection: string;
  absentTeacherId: string;
  absentTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  subject: string;
  status: 'Assigned' | 'Completed';
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
  read: boolean;
  category?: 'leave' | 'attendance' | 'academic' | 'substitute' | 'reports' | 'system';
  priority?: 'high' | 'medium' | 'low';
  relatedRecordId?: string;
  meta?: {
    teacherName?: string;
    date?: string;
    reason?: string;
    status?: string;
    role?: string;
    classSection?: string;
    time?: string;
  };
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Maternity Leave' | 'Duty Leave' | 'Other';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  reviewComment?: string;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
}

export interface ScheduleSlotConfig {
  id: string;
  name: string;
  type: 'teaching' | 'break' | 'assembly' | 'zero_period' | 'activity' | 'sports' | 'library' | 'laboratory' | 'free_period' | 'school_over' | 'custom';
  start: string;
  end: string;
  requiresAssignment: boolean;
}

export interface SystemSettings {
  schoolInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
    board: string;
  };
  academicSession: {
    year: string;
    term: string;
  };
  departments: string[];
  subjects: string[];
  workingDays: string[]; // e.g. ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  periodDuration: number; // in minutes
  schoolTimings: {
    start: string; // e.g. "08:30 AM"
    end: string;   // e.g. "02:40 PM"
    lunchStart: string; // e.g. "12:10 PM"
    lunchEnd: string;   // e.g. "01:00 PM"
  };
  scheduleSlots?: ScheduleSlotConfig[];
  timetableVersion?: number;
  holidayCalendar: { id: string; name: string; date: string }[];
  notificationSettings: {
    emailAlerts: boolean;
    slackAlerts: boolean;
    systemLogsLevel: 'all' | 'high' | 'none';
  };
}

export interface ERPDataState {
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  extraClassRequests: ExtraClassRequest[];
  substituteAssignments: SubstituteAssignment[];
  notifications: SystemNotification[];
  leaveRequests: LeaveRequest[];
  settings: SystemSettings;
}
