import * as XLSX from 'xlsx';
import { Teacher, DayOfWeek, TimetableSlot } from '../types';

export interface ClassImportRow {
  Day: string;
  Period: string | number;
  Subject: string;
  TeacherName: string;
  Room: string;
}

export interface ImportError {
  type: 'error' | 'warning';
  message: string;
  row?: number;
  cell?: string;
}

export interface ImportPreviewSlot {
  day: DayOfWeek;
  periodIndex: number; // 0 to 7
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
}

export interface ClassImportResult {
  slots: ImportPreviewSlot[];
  errors: ImportError[];
  warnings: ImportError[];
  teacherSchedulesToUpdate: { [teacherId: string]: { day: DayOfWeek; periodIndex: number; slot: TimetableSlot }[] };
}

// Parse string content in cell like "Subject | Teacher Name | Room" or "Subject - Teacher Name - Room"
export function parseCellContent(content: string): { subject: string; teacherName: string; room: string } | null {
  if (!content || typeof content !== 'string') return null;
  const val = content.trim();
  if (!val) return null;

  // Split on pipe (|), slash (/), or comma (,)
  let parts = val.split(/[|/,]/).map(s => s.trim());
  if (parts.length < 2) {
    // Split on dash if not found
    parts = val.split('-').map(s => s.trim());
  }

  // Parse parenthesized teacher e.g. "Math (Aarav Sharma) Room 101"
  if (parts.length < 2) {
    const parenRegex = /([^(]+)\(([^)]+)\)\s*(.*)/;
    const match = val.match(parenRegex);
    if (match) {
      return {
        subject: match[1].trim(),
        teacherName: match[2].trim(),
        room: match[3].trim() || 'Room 101'
      };
    }
  }

  if (parts.length >= 2) {
    return {
      subject: parts[0],
      teacherName: parts[1],
      room: parts[2] || 'Room 101'
    };
  }

  // Fallback
  return {
    subject: val,
    teacherName: '',
    room: 'Room 101'
  };
}

// Convert Excel file upload to JSON rows
export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

// Validates and processes a parsed Class Timetable
export function processClassTimetable(
  rows: any[],
  teachers: Teacher[],
  classSection: string,
  workingDays: string[]
): ClassImportResult {
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const slots: ImportPreviewSlot[] = [];
  const teacherSchedulesToUpdate: { [teacherId: string]: { day: DayOfWeek; periodIndex: number; slot: TimetableSlot }[] } = {};

  if (!rows || rows.length === 0) {
    errors.push({ type: 'error', message: 'The uploaded file is empty or formatted incorrectly.' });
    return { slots, errors, warnings, teacherSchedulesToUpdate };
  }

  // Check if first row is Grid Format (has column keys like "Period 1" or contains "Day" and "Period 1")
  const firstRowKeys = Object.keys(rows[0]);
  const isGridFormat = firstRowKeys.some(k => k.toLowerCase().includes('period'));

  const parsedEntries: { day: string; period: number; subject: string; teacherName: string; room: string; sourceRowIdx: number }[] = [];

  if (isGridFormat) {
    // Process Grid format: Days as rows, Period columns
    rows.forEach((row, rowIdx) => {
      const dayVal = String(row.Day || row.day || '').trim();
      if (!dayVal) return;

      // Extract values from Period columns (Period 1 to Period 8)
      for (let pNum = 1; pNum <= 8; pNum++) {
        const key = firstRowKeys.find(k => k.toLowerCase().replace(/\s+/g, '') === `period${pNum}`);
        if (key && row[key]) {
          const parsedCell = parseCellContent(String(row[key]));
          if (parsedCell) {
            parsedEntries.push({
              day: dayVal,
              period: pNum,
              subject: parsedCell.subject,
              teacherName: parsedCell.teacherName,
              room: parsedCell.room,
              sourceRowIdx: rowIdx + 2 // 1-indexed Excel row offset
            });
          }
        }
      }
    });
  } else {
    // Process list/row format: Day, Period, Subject, Teacher Name, Room
    rows.forEach((row, rowIdx) => {
      // Find keys (case-insensitive)
      const keys = Object.keys(row);
      const dayKey = keys.find(k => k.toLowerCase() === 'day') || 'Day';
      const periodKey = keys.find(k => k.toLowerCase() === 'period') || 'Period';
      const subjectKey = keys.find(k => k.toLowerCase() === 'subject') || 'Subject';
      const teacherKey = keys.find(k => k.toLowerCase() === 'teachername' || k.toLowerCase() === 'teacher' || k.toLowerCase() === 'educator') || 'TeacherName';
      const roomKey = keys.find(k => k.toLowerCase() === 'room' || k.toLowerCase() === 'classroom') || 'Room';

      const dayVal = String(row[dayKey] || '').trim();
      const periodVal = parseInt(row[periodKey], 10);
      const subjectVal = String(row[subjectKey] || '').trim();
      const teacherVal = String(row[teacherKey] || '').trim();
      const roomVal = String(row[roomKey] || 'Room 101').trim();

      if (!dayVal && !periodVal && !subjectVal) return; // skip empty rows

      parsedEntries.push({
        day: dayVal,
        period: periodVal,
        subject: subjectVal,
        teacherName: teacherVal,
        room: roomVal,
        sourceRowIdx: rowIdx + 2
      });
    });
  }

  // Validate parsed slots
  const uniquePeriodsCheck: { [key: string]: number } = {}; // "Day_Period" -> Row Index

  parsedEntries.forEach((entry) => {
    const { day, period, subject, teacherName, room, sourceRowIdx } = entry;

    // 1. Check valid day names
    const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
    const validDays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (!validDays.includes(capitalizedDay as DayOfWeek)) {
      errors.push({
        type: 'error',
        row: sourceRowIdx,
        message: `Invalid weekday "${day}". Supported: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.`
      });
      return;
    }

    const matchedDay = capitalizedDay as DayOfWeek;

    // 2. Check if day is within school settings working days
    const isWorkingDay = workingDays.map(d => d.toLowerCase()).includes(matchedDay.toLowerCase());
    if (!isWorkingDay) {
      warnings.push({
        type: 'warning',
        row: sourceRowIdx,
        message: `Lesson is scheduled on "${matchedDay}", which is currently not in your school working days settings.`
      });
    }

    // 3. Validate period index (1 to 8)
    if (isNaN(period) || period < 1 || period > 8) {
      errors.push({
        type: 'error',
        row: sourceRowIdx,
        message: `Invalid Period value "${period}". Period must be between 1 and 8.`
      });
      return;
    }

    const periodIdx = period - 1;

    // 4. Check for duplicate period entries in the same sheet
    const dupKey = `${matchedDay}_${period}`;
    if (uniquePeriodsCheck[dupKey] !== undefined) {
      errors.push({
        type: 'error',
        row: sourceRowIdx,
        message: `Duplicate slot definition! Period ${period} on ${matchedDay} is defined on both row ${uniquePeriodsCheck[dupKey]} and row ${sourceRowIdx}.`
      });
      return;
    }
    uniquePeriodsCheck[dupKey] = sourceRowIdx;

    if (!subject) {
      errors.push({
        type: 'error',
        row: sourceRowIdx,
        message: `Subject is empty for Period ${period} on ${matchedDay}.`
      });
      return;
    }

    // 5. Match Teacher
    let matchedTeacher = teachers.find(t => t.name.toLowerCase() === teacherName.toLowerCase());
    
    // Fuzzy search fallback: search if teacher certified subjects include this subject
    if (!matchedTeacher && teacherName) {
      matchedTeacher = teachers.find(t => 
        (t.name.toLowerCase().includes(teacherName.toLowerCase()) || teacherName.toLowerCase().includes(t.name.toLowerCase()))
      );
    }

    if (!matchedTeacher) {
      if (teacherName) {
        errors.push({
          type: 'error',
          row: sourceRowIdx,
          message: `Teacher "${teacherName}" was not found in the Faculty Registry. Register them first or fix the spelling.`
        });
      } else {
        errors.push({
          type: 'error',
          row: sourceRowIdx,
          message: `Teacher Name is required for Period ${period} on ${matchedDay}.`
        });
      }
      return;
    }

    // Verify if subject matches teacher capabilities (warning if not)
    const teacherSubjects = matchedTeacher.subjects || [matchedTeacher.subject];
    const teachesSubject = teacherSubjects.some(s => s.toLowerCase() === subject.toLowerCase());
    if (!teachesSubject && teacherName) {
      warnings.push({
        type: 'warning',
        row: sourceRowIdx,
        message: `Teacher "${matchedTeacher.name}" is not certified/assigned to teach "${subject}". (Primary subject: ${matchedTeacher.subject}).`
      });
    }

    // 6. Check teacher workload limit
    // Daily workload count (current in database + this new slot)
    let dailyWorkCount = matchedTeacher.schedule[matchedDay]?.filter(s => s !== null).length || 0;
    // check if this is an override of an existing slot
    const existingSlot = matchedTeacher.schedule[matchedDay]?.[periodIdx];
    if (!existingSlot) dailyWorkCount += 1;

    const maxDaily = matchedTeacher.maxDailyHours || 6;
    if (dailyWorkCount > maxDaily) {
      warnings.push({
        type: 'warning',
        row: sourceRowIdx,
        message: `Workload warning! Adding this slot puts "${matchedTeacher.name}" at ${dailyWorkCount} periods on ${matchedDay}, exceeding their limit of ${maxDaily}.`
      });
    }

    // 7. Check for double bookings (this teacher teaching another class at this period)
    const isDoubleBooked = teachers.some(otherT => {
      if (otherT.id === matchedTeacher!.id) return false;
      const otherSlot = otherT.schedule[matchedDay]?.[periodIdx];
      return otherSlot && otherSlot.classSection === classSection; // Wait, this class is double-booked with another teacher
    });

    const teacherBusyWithOtherClass = teachers.some(otherT => {
      // Check if our matched teacher is busy teaching some OTHER class at this period
      if (otherT.id !== matchedTeacher!.id) return false;
      const otherSlot = otherT.schedule[matchedDay]?.[periodIdx];
      return otherSlot && otherSlot.classSection !== classSection;
    });

    if (teacherBusyWithOtherClass) {
      const busySlot = matchedTeacher.schedule[matchedDay]?.[periodIdx];
      errors.push({
        type: 'error',
        row: sourceRowIdx,
        message: `Conflict! Teacher "${matchedTeacher.name}" is already scheduled to teach "${busySlot?.classSection}" in "${busySlot?.room}" during Period ${period} on ${matchedDay}.`
      });
      return;
    }

    // 8. Room conflict check (another class occupying this room at the same time)
    const roomOccupied = teachers.some(otherT => {
      // Skip the current teacher's own slots
      const otherSlot = otherT.schedule[matchedDay]?.[periodIdx];
      return otherSlot && otherSlot.room.toLowerCase() === room.toLowerCase() && otherSlot.classSection !== classSection;
    });

    if (roomOccupied) {
      warnings.push({
        type: 'warning',
        row: sourceRowIdx,
        message: `Room conflict! "${room}" is already assigned to another class during Period ${period} on ${matchedDay}.`
      });
    }

    // If all is good, prepare to save!
    slots.push({
      day: matchedDay,
      periodIndex: periodIdx,
      subject,
      teacherId: matchedTeacher.id,
      teacherName: matchedTeacher.name,
      room
    });

    // Track schedule update payloads
    if (!teacherSchedulesToUpdate[matchedTeacher.id]) {
      teacherSchedulesToUpdate[matchedTeacher.id] = [];
    }
    teacherSchedulesToUpdate[matchedTeacher.id].push({
      day: matchedDay,
      periodIndex: periodIdx,
      slot: {
        subject,
        classSection,
        room
      }
    });
  });

  return { slots, errors, warnings, teacherSchedulesToUpdate };
}

// Generate an Excel sheet as downloadable Blob
export function generateClassTemplateExcel(workingDays: string[]): Blob {
  // We will generate the Row/List template
  const headers = ['Day', 'Period', 'Subject', 'TeacherName', 'Room'];
  const sampleData = [
    { Day: 'Monday', Period: 1, Subject: 'Mathematics', TeacherName: 'Aarav Sharma', Room: 'Room 101' },
    { Day: 'Monday', Period: 2, Subject: 'Science (Physics)', TeacherName: 'Priya Mehta', Room: 'Room 102' },
    { Day: 'Tuesday', Period: 3, Subject: 'Chemistry', TeacherName: 'Sneha Kapoor', Room: 'Room 104' },
    { Day: 'Wednesday', Period: 4, Subject: 'English Literature', TeacherName: 'Rahul Verma', Room: 'Room 105' },
    { Day: 'Thursday', Period: 5, Subject: 'Computer Science', TeacherName: 'Ananya Das', Room: 'Room 106' },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Class Timetable');

  const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  const buf = new ArrayBuffer(excelBuf.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < excelBuf.length; i++) {
    view[i] = excelBuf.charCodeAt(i) & 0xFF;
  }
  return new Blob([buf], { type: 'application/octet-stream' });
}

export function generateTeacherTemplateExcel(): Blob {
  const headers = [
    'TeacherName', 'Email', 'Phone', 'Subjects', 'HomeClass', 
    'EmployeeID', 'Department', 'Designation', 'Qualification', 
    'Experience', 'MaxDailyHours', 'MaxWeeklyHours'
  ];
  const sampleData = [
    {
      TeacherName: 'Hiren Patel',
      Email: 'hirenpatel@xyz.edu',
      Phone: '+91 9876543210',
      Subjects: 'Mathematics, Science',
      HomeClass: 'Grade 10-A',
      EmployeeID: 'EMP202601',
      Department: 'Mathematics',
      Designation: 'Senior TGT',
      Qualification: 'M.Sc. B.Ed.',
      Experience: 8,
      MaxDailyHours: 5,
      MaxWeeklyHours: 25
    },
    {
      TeacherName: 'Shreya Iyer',
      Email: 'shreyaiyer@xyz.edu',
      Phone: '+91 9123456789',
      Subjects: 'Computer Science',
      HomeClass: 'Grade 9-B',
      EmployeeID: 'EMP202602',
      Department: 'Science',
      Designation: 'PGT Lecturer',
      Qualification: 'M.Tech CSE',
      Experience: 5,
      MaxDailyHours: 6,
      MaxWeeklyHours: 30
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculty Registry Bulk');

  const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  const buf = new ArrayBuffer(excelBuf.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < excelBuf.length; i++) {
    view[i] = excelBuf.charCodeAt(i) & 0xFF;
  }
  return new Blob([buf], { type: 'application/octet-stream' });
}
