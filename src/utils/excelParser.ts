import * as XLSX from 'xlsx';
import { Teacher, DayOfWeek, TimetableSlot, ScheduleSlotConfig } from '../types';

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
  workingDays: string[],
  scheduleSlots?: ScheduleSlotConfig[]
): ClassImportResult {
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];
  const slots: ImportPreviewSlot[] = [];
  const teacherSchedulesToUpdate: { [teacherId: string]: { day: DayOfWeek; periodIndex: number; slot: TimetableSlot }[] } = {};

  if (!rows || rows.length === 0) {
    errors.push({ type: 'error', message: 'The uploaded file is empty or formatted incorrectly.' });
    return { slots, errors, warnings, teacherSchedulesToUpdate };
  }

  // Create standard slots list if none provided
  const slotsConfig = scheduleSlots && scheduleSlots.length > 0 ? scheduleSlots : Array(8).fill(null).map((_, i) => ({
    id: `s${i+1}`,
    name: `Period ${i+1}`,
    type: 'teaching' as const,
    start: '',
    end: '',
    requiresAssignment: true
  }));

  const firstRowKeys = Object.keys(rows[0]);
  const parsedEntries: { day: string; period: number; subject: string; teacherName: string; room: string; sourceRowIdx: number }[] = [];

  const isListFormat = firstRowKeys.some(k => k.toLowerCase() === 'period');

  if (isListFormat) {
    // Process list/row format: Day, Period, Subject, Teacher Name, Room
    rows.forEach((row, rowIdx) => {
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
  } else {
    // Process Grid format: Days as rows, Period/Slot columns
    const keyToSlotIdx: { [key: string]: number } = {};
    firstRowKeys.forEach(key => {
      if (key.toLowerCase() === 'day' || key.toLowerCase() === 'weekday') return;

      const cleanKey = key.replace(/\s*\(.*\)\s*/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const foundIdx = slotsConfig.findIndex(s => {
        const cleanSlotName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanSlotName === cleanKey || cleanKey.includes(cleanSlotName) || cleanSlotName.includes(cleanKey);
      });

      if (foundIdx !== -1) {
        keyToSlotIdx[key] = foundIdx;
      }
    });

    // Fallback simple matching if clean string comparison yields zero results
    if (Object.keys(keyToSlotIdx).length === 0) {
      firstRowKeys.forEach(key => {
        const numMatch = key.match(/\d+/);
        if (numMatch) {
          const pNum = parseInt(numMatch[0], 10);
          if (pNum >= 1 && pNum <= slotsConfig.length) {
            keyToSlotIdx[key] = pNum - 1;
          }
        }
      });
    }

    rows.forEach((row, rowIdx) => {
      const dayVal = String(row.Day || row.day || '').trim();
      if (!dayVal) return;

      firstRowKeys.forEach(key => {
        const slotIdx = keyToSlotIdx[key];
        if (slotIdx !== undefined && row[key]) {
          const slotConf = slotsConfig[slotIdx];
          if (slotConf.requiresAssignment) {
            const parsedCell = parseCellContent(String(row[key]));
            if (parsedCell) {
              parsedEntries.push({
                day: dayVal,
                period: slotIdx + 1, // 1-indexed representation for internal validation
                subject: parsedCell.subject,
                teacherName: parsedCell.teacherName,
                room: parsedCell.room,
                sourceRowIdx: rowIdx + 2
              });
            }
          }
        }
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

    // 3. Validate period index
    if (isNaN(period) || period < 1 || period > slotsConfig.length) {
      errors.push({
        type: 'error',
        row: sourceRowIdx,
        message: `Invalid Period value "${period}". Period must be between 1 and ${slotsConfig.length}.`
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

// Helper to compare uploaded template against current schedule
export function validateScheduleMatch(
  uploadedHeaders: string[],
  currentSlots: ScheduleSlotConfig[]
): { matches: boolean; currentNames: string[]; uploadedNames: string[] } {
  const uploadedNames = uploadedHeaders
    .filter(h => h.toLowerCase() !== 'day')
    .map(h => h.trim());

  const currentNames = currentSlots.map(s => `${s.name} (${s.start} - ${s.end})`.trim());

  let matches = uploadedNames.length === currentNames.length;
  if (matches) {
    for (let i = 0; i < currentNames.length; i++) {
      if (uploadedNames[i].toLowerCase() !== currentNames[i].toLowerCase()) {
        matches = false;
        break;
      }
    }
  }

  if (!matches) {
    const currentOnlyNames = currentSlots.map(s => s.name.trim().toLowerCase());
    const uploadedOnlyNames = uploadedNames.map(name => {
      return name.replace(/\s*\(.*\)\s*/g, '').trim().toLowerCase();
    });

    let nameMatch = uploadedOnlyNames.length === currentOnlyNames.length;
    if (nameMatch) {
      for (let i = 0; i < currentOnlyNames.length; i++) {
        if (uploadedOnlyNames[i] !== currentOnlyNames[i]) {
          nameMatch = false;
          break;
        }
      }
    }
    if (nameMatch) {
      matches = true;
    }
  }

  return {
    matches,
    currentNames: currentSlots.map(s => s.name),
    uploadedNames: uploadedNames.map(name => name.replace(/\s*\(.*\)\s*/g, '').trim())
  };
}

// Generate an Excel sheet as downloadable Blob dynamically based on current schedule slots
export function generateClassTemplateExcel(
  workingDays: string[],
  scheduleSlots: ScheduleSlotConfig[]
): Blob {
  const headers = ['Day', ...scheduleSlots.map(s => `${s.name} (${s.start} - ${s.end})`)];
  
  const sampleData = workingDays.map((day, dIdx) => {
    const row: any = { Day: day };
    scheduleSlots.forEach((s, sIdx) => {
      const colHeader = `${s.name} (${s.start} - ${s.end})`;
      if (!s.requiresAssignment) {
        row[colHeader] = s.name; // pre-fill special slots
      } else {
        if (dIdx === 0) {
          // pre-fill a single sample row
          if (sIdx === 2) row[colHeader] = 'Mathematics | Aarav Sharma | Room 101';
          else if (sIdx === 3) row[colHeader] = 'Science (Physics) | Priya Mehta | Room 102';
          else if (sIdx === 5) row[colHeader] = 'Chemistry | Sneha Kapoor | Room 104';
          else row[colHeader] = 'English Literature | Rahul Verma | Room 105';
        } else {
          row[colHeader] = 'Subject | Teacher Name | Room';
        }
      }
    });
    return row;
  });

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
