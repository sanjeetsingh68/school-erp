export interface TimetableSlot {
  subject: string;
  classSection: string;
  room: string;
  isExtra?: boolean;
  isSubstitute?: boolean;
  originalTeacherId?: string;
  originalTeacherName?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface WeeklySchedule {
  Monday: (TimetableSlot | null)[]; // 6 slots representing Periods 1 to 6
  Tuesday: (TimetableSlot | null)[];
  Wednesday: (TimetableSlot | null)[];
  Thursday: (TimetableSlot | null)[];
  Friday: (TimetableSlot | null)[];
}

export interface Teacher {
  id: string;
  schoolId?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  classSection: string; // Default class assigned (e.g. "Grade 10-A")
  status: 'Active' | 'On Leave' | 'Suspended';
  schedule: WeeklySchedule;
}

export interface AttendanceRecord {
  id: string;
  schoolId?: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  status: 'Present' | 'Absent';
  substituteAssigned?: boolean;
  substitutes?: { [periodIndex: number]: string }; // periodIndex -> substituteTeacherId
}

export interface ExtraClassRequest {
  id: string;
  schoolId?: string;
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
  schoolId?: string;
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
  schoolId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
  read: boolean;
  category?: 'leave' | 'attendance' | 'student' | 'academic' | 'substitute' | 'reports' | 'system';
  priority?: 'high' | 'medium' | 'low';
  relatedRecordId?: string;
  meta?: {
    teacherName?: string;
    studentName?: string;
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
  schoolId?: string;
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

export interface Principal {
  id: string;
  name: string;
  email: string;
  phone: string;
  schoolId: string;
  status: 'Active' | 'Suspended';
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'superadmin' | 'principal' | 'teacher' | 'admin';
  schoolId?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  principal: string;
  principalEmail: string;
  board: 'CBSE' | 'ICSE' | 'State Board';
  academicYear: string;
  status: 'Active' | 'Grace Period' | 'Suspended' | 'Disabled';
  subscription: 'Trial' | 'Basic' | 'Premium' | 'Enterprise';
  subscriptionStartDate?: string;
  licenseExpiry: string;
  renewals: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Expired';
  autoRenewal?: boolean;
  gracePeriodDays?: number;
  licenseDurationMonths?: number;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  outstandingAmount?: number;
  storageUsage: number; // MB
}

export interface AuditLog {
  id: string;
  adminName: string;
  dateTime: string;
  action: string;
  reason: string;
  schoolName?: string;
}

export interface ERPDataState {
  schools?: School[];
  principals?: Principal[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  extraClassRequests: ExtraClassRequest[];
  substituteAssignments: SubstituteAssignment[];
  notifications: SystemNotification[];
  leaveRequests: LeaveRequest[];
  auditLogs?: AuditLog[];
}
