import React, { useState, useRef, useEffect } from 'react';
import { 
  CalendarRange, 
  User, 
  GraduationCap, 
  Printer, 
  Plus, 
  MapPin, 
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Check,
  AlertCircle,
  Upload,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Teacher, TimetableSlot, DayOfWeek, ExtraClassRequest, SystemSettings, ScheduleSlotConfig, ERPDataState } from '../types';
import { apiFetch } from '../lib/api';
import {
  parseExcelFile,
  processClassTimetable,
  generateClassTemplateExcel,
  validateScheduleMatch,
  ClassImportResult,
  ImportPreviewSlot
} from '../utils/excelParser';

interface TimetableManagementProps {
  state: ERPDataState;
  teachers: Teacher[];
  selectedDate: string; // YYYY-MM-DD
  onScheduleExtraClass: (req: { teacherId: string; classSection: string; date: string; periodIndex: number }) => Promise<any>;
  onUpdateSlot: (teacherId: string, day: DayOfWeek, periodIndex: number, slot: TimetableSlot | null) => Promise<any>;
  onImportTimetable: (classSection: string, slots: any[]) => Promise<any>;
  darkTheme: boolean;
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => Promise<any>;
}

export default function TimetableManagement({
  state,
  teachers,
  selectedDate,
  onScheduleExtraClass,
  onUpdateSlot,
  onImportTimetable,
  darkTheme,
  settings,
  onUpdateSettings
}: TimetableManagementProps) {
  const [viewMode, setViewMode] = useState<'teacher' | 'class' | 'section' | 'daily'>('teacher');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [selectedGrade, setSelectedGrade] = useState<string>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTeacherQuery, setSearchTeacherQuery] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Track real-time synchronization updates
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, [state, selectedDate]);

  // Sync active day of week with globally selected date
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        let dayName = d.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
        if (dayName === 'Sunday' as any) {
          dayName = 'Monday';
        }
        setSelectedDay(dayName);
      }
    }
  }, [selectedDate]);

  // Top Synchronized Scrollbar & Horizontal Navigation State and Refs
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  // Synchronization event tracking
  const isScrollingTop = useRef(false);
  const isScrollingBottom = useRef(false);

  useEffect(() => {
    if (viewMode !== 'daily') return;
    
    const topEl = topScrollRef.current;
    const bottomEl = bottomScrollRef.current;
    if (!topEl || !bottomEl) return;

    const handleTopScroll = () => {
      if (isScrollingBottom.current) {
        isScrollingBottom.current = false;
        return;
      }
      isScrollingTop.current = true;
      bottomEl.scrollLeft = topEl.scrollLeft;
    };

    const handleBottomScroll = () => {
      if (isScrollingTop.current) {
        isScrollingTop.current = false;
        return;
      }
      isScrollingBottom.current = true;
      topEl.scrollLeft = bottomEl.scrollLeft;
    };

    topEl.addEventListener('scroll', handleTopScroll, { passive: true });
    bottomEl.addEventListener('scroll', handleBottomScroll, { passive: true });

    return () => {
      topEl.removeEventListener('scroll', handleTopScroll);
      bottomEl.removeEventListener('scroll', handleBottomScroll);
    };
  }, [viewMode, selectedDay, scrollWidth]);

  useEffect(() => {
    if (viewMode !== 'daily') return;
    const bottomEl = bottomScrollRef.current;
    if (!bottomEl) return;

    const updateWidth = () => {
      setScrollWidth(bottomEl.scrollWidth);
    };

    // Delay slightly to allow DOM layout to stabilize
    const timer = setTimeout(updateWidth, 150);

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(bottomEl);

    // Also watch any nested tables or elements that could resize
    const tableEl = bottomEl.querySelector('table');
    if (tableEl) {
      observer.observe(tableEl);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [viewMode, selectedDay, teachers.length, settings]);

  const scrollDistance = 220; // Scrolling increment (approx. 1 column)

  const handleScrollLeft = () => {
    const container = bottomScrollRef.current;
    if (container) {
      container.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    const container = bottomScrollRef.current;
    if (container) {
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  const handleScrollFirst = () => {
    const container = bottomScrollRef.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleScrollLast = () => {
    const container = bottomScrollRef.current;
    if (container) {
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = bottomScrollRef.current;
    if (!container) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      container.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
    }
  };

  // Excel Import State
  const [selectedImportYear, setSelectedImportYear] = useState('2026-2027');
  const [selectedImportClass, setSelectedImportClass] = useState('');
  const [selectedImportSection, setSelectedImportSection] = useState('');
  const [importResult, setImportResult] = useState<ClassImportResult | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation Mismatch State
  const [mismatchData, setMismatchData] = useState<{
    currentNames: string[];
    uploadedNames: string[];
    uploadedRows: any[];
  } | null>(null);

  // Schedule Builder State
  const [isScheduleBuilderOpen, setIsScheduleBuilderOpen] = useState(false);
  const [localSlots, setLocalSlots] = useState<ScheduleSlotConfig[]>([]);
  const [localPeriodDuration, setLocalPeriodDuration] = useState<number>(settings.periodDuration || 45);
  const [selectedPresetType, setSelectedPresetType] = useState<string>('teaching');
  const [builderSuccess, setBuilderSuccess] = useState<string | null>(null);

  const downloadClassTemplate = () => {
    try {
      const workingDays = settings.workingDays && settings.workingDays.length > 0 ? settings.workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const scheduleSlots = settings.scheduleSlots || [];
      const blob = generateClassTemplateExcel(workingDays, scheduleSlots);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Class_Timetable_Template_${selectedImportClass || 'General'}_${selectedImportSection || 'A'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setMismatchData(null);
    setIsUploading(true);

    try {
      const rows = await parseExcelFile(file);
      if (!rows || rows.length === 0) {
        throw new Error('The uploaded file is empty or formatted incorrectly.');
      }

      // Check structure matching if in Grid format
      const firstRowKeys = Object.keys(rows[0]);
      const isListFormat = firstRowKeys.some(k => k.toLowerCase() === 'period');

      if (!isListFormat && settings.scheduleSlots) {
        const matchResult = validateScheduleMatch(firstRowKeys, settings.scheduleSlots);
        if (!matchResult.matches) {
          setMismatchData({
            currentNames: matchResult.currentNames,
            uploadedNames: matchResult.uploadedNames,
            uploadedRows: rows
          });
          setIsUploading(false);
          return;
        }
      }

      const classSection = `${selectedImportClass}-${selectedImportSection}`;
      const workingDays = settings.workingDays && settings.workingDays.length > 0 ? settings.workingDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      const result = processClassTimetable(rows, teachers, classSection, workingDays, settings.scheduleSlots);
      setImportResult(result);
      setImportPreviewOpen(true);
    } catch (err: any) {
      setImportError(err.message || 'Error processing Excel file. Check format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult || importResult.errors.some(e => e.type === 'error')) return;

    try {
      setIsUploading(true);
      const classSection = `${selectedImportClass}-${selectedImportSection}`;
      
      await onImportTimetable(classSection, importResult.slots);
      
      setImportPreviewOpen(false);
      setImportResult(null);
      setSelectedImportClass('');
      setSelectedImportSection('');
    } catch (err: any) {
      setImportError(err.message || 'Failed saving imported timetable.');
    } finally {
      setIsUploading(false);
    }
  };

  // Time conversion helper
  const addMinutesToTime = (timeStr: string, mins: number): string => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return timeStr;
    let hrs = parseInt(match[1], 10);
    let minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hrs < 12) hrs += 12;
    if (ampm === 'AM' && hrs === 12) hrs = 0;
    
    const totalMins = hrs * 60 + minutes + mins;
    let newHrs = Math.floor(totalMins / 60) % 24;
    let newMins = totalMins % 60;
    
    const newAmpm = newHrs >= 12 ? 'PM' : 'AM';
    let displayHrs = newHrs % 12;
    if (displayHrs === 0) displayHrs = 12;
    
    return `${String(displayHrs).padStart(2, '0')}:${String(newMins).padStart(2, '0')} ${newAmpm}`;
  };

  // Schedule slot builder handler functions
  const moveSlotUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localSlots];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setLocalSlots(updated);
  };

  const moveSlotDown = (index: number) => {
    if (index === localSlots.length - 1) return;
    const updated = [...localSlots];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setLocalSlots(updated);
  };

  const removeSlot = (index: number) => {
    const updated = localSlots.filter((_, idx) => idx !== index);
    setLocalSlots(updated);
  };

  const handleAddSlotPreset = () => {
    const type = selectedPresetType;
    let name = 'New Slot';
    let requiresAssignment = false;
    
    switch (type) {
      case 'teaching':
        name = `Period ${localSlots.filter(s => s.type === 'teaching').length + 1}`;
        requiresAssignment = true;
        break;
      case 'assembly':
        name = 'Morning Assembly';
        break;
      case 'zero_period':
        name = 'Zero Period';
        break;
      case 'break':
        name = localSlots.some(s => s.name.includes('Lunch')) ? 'Short Break' : 'Lunch Break';
        break;
      case 'activity':
        name = 'Activity Period';
        break;
      case 'sports':
        name = 'Sports Period';
        requiresAssignment = true;
        break;
      case 'library':
        name = 'Library Period';
        requiresAssignment = true;
        break;
      case 'laboratory':
        name = 'Laboratory Period';
        requiresAssignment = true;
        break;
      case 'free_period':
        name = 'Free Period';
        break;
      case 'school_over':
        name = 'School Over';
        break;
      default:
        name = 'Custom Slot';
    }

    let start = '08:00 AM';
    if (localSlots.length > 0) {
      start = localSlots[localSlots.length - 1].end;
    }
    const end = addMinutesToTime(start, localPeriodDuration);

    const newSlot: ScheduleSlotConfig = {
      id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      type: type as any,
      start,
      end,
      requiresAssignment
    };

    setLocalSlots([...localSlots, newSlot]);
  };

  const handleSaveScheduleBuilder = async () => {
    try {
      setBuilderSuccess(null);
      
      const hasInvalidTimes = localSlots.some(s => !s.start || !s.end || !s.name);
      if (hasInvalidTimes) {
        alert('Please fill in all slot names and times correctly.');
        return;
      }

      const updatedSettings = {
        ...settings,
        scheduleSlots: localSlots,
        periodDuration: localPeriodDuration,
        timetableVersion: (settings.timetableVersion || 1) + 1
      };

      await onUpdateSettings(updatedSettings);
      setBuilderSuccess(`Daily Schedule Configuration synchronized. Active schedule layout is now v${updatedSettings.timetableVersion}.`);
    } catch (err: any) {
      console.error(err);
      alert('Failed saving schedule slots: ' + err.message);
    }
  };

  // Extra Class Form State
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || '');
  const [formClass, setFormClass] = useState('Grade 10-A');
  const [formDate, setFormDate] = useState(selectedDate);
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([]);
  const [selectedSuggestedPeriod, setSelectedSuggestedPeriod] = useState<number | null>(null);
  const [extraClassError, setExtraClassError] = useState<string | null>(null);
  const [extraClassSuccess, setExtraClassSuccess] = useState<string | null>(null);

  // Manual Slot Edit Form State
  const [isEditSlotOpen, setIsEditSlotOpen] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editDay, setEditDay] = useState<DayOfWeek>('Monday');
  const [editPeriodIdx, setEditPeriodIdx] = useState(0);
  const [editSubject, setEditSubject] = useState('');
  const [editClass, setEditClass] = useState('Grade 10-A');
  const [editRoom, setEditRoom] = useState('Room 101');
  const [editError, setEditError] = useState<string | null>(null);

  const daysOrder: DayOfWeek[] = (settings.workingDays && settings.workingDays.length > 0
    ? settings.workingDays
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) as DayOfWeek[];

  const timings = settings.scheduleSlots && settings.scheduleSlots.length > 0
    ? settings.scheduleSlots.map(s => `${s.start} - ${s.end}`)
    : [
        '08:30 AM - 09:20 AM',
        '09:20 AM - 10:10 AM',
        '10:30 AM - 11:20 AM',
        '11:20 AM - 12:10 PM',
        '01:00 PM - 01:50 PM',
        '01:50 PM - 02:40 PM',
        '02:40 PM - 03:30 PM',
        '03:30 PM - 04:20 PM'
      ];

  const classList = [
    'Grade 6-A', 'Grade 6-B', 'Grade 7-A', 'Grade 7-B', 'Grade 8-A', 'Grade 8-B',
    'Grade 9-A', 'Grade 9-B', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B',
    'Grade 12-A', 'Grade 12-B'
  ];

  const resolveSlotState = (day: DayOfWeek, pIdx: number, classSec: string) => {
    // 1. Regular Teacher for this class section during this day and period
    const regularTeacher = teachers.find(t => t.schedule[day]?.[pIdx]?.classSection === classSec);
    const regularSlot = regularTeacher?.schedule[day]?.[pIdx];

    // 2. Is there a substitute assignment for this class section and period index on selectedDate?
    const subAssignment = state.substituteAssignments?.find(
      sub => sub.date === selectedDate && sub.periodIndex === pIdx && sub.classSection === classSec
    );

    // 3. Is the regular teacher absent?
    const isRegularAbsent = regularTeacher 
      ? state.attendance?.some(att => att.date === selectedDate && att.teacherId === regularTeacher.id && att.status !== 'Present')
      : false;

    // 4. Special periods (non-teaching) from settings
    const slotConf = settings.scheduleSlots?.[pIdx];
    const isSpecial = slotConf && !slotConf.requiresAssignment;

    let status: 'Regular' | 'Substitute' | 'Absent' | 'Free' | 'Break' | 'Cancelled' = 'Free';
    let subject = '';
    let teacherName = '';
    let teacherId = '';
    let substituteName = '';
    let substituteId = '';
    let room = '';
    let details = '';

    if (isSpecial) {
      status = 'Break';
      subject = slotConf?.name || 'Break';
    } else if (subAssignment) {
      status = 'Substitute';
      subject = subAssignment.subject || regularSlot?.subject || '';
      teacherName = subAssignment.absentTeacherName;
      teacherId = subAssignment.absentTeacherId;
      substituteName = subAssignment.substituteTeacherName;
      substituteId = subAssignment.substituteTeacherId;
      room = regularSlot?.room || 'Room 101';
      details = `Substitution for ${subAssignment.absentTeacherName}`;
    } else if (regularSlot) {
      subject = regularSlot.subject;
      teacherName = regularTeacher?.name || '';
      teacherId = regularTeacher?.id || '';
      room = regularSlot.room;
      if (isRegularAbsent) {
        status = 'Absent';
        details = `Absent today: ${teacherName}. Pending substitute.`;
      } else {
        status = 'Regular';
      }
    } else {
      status = 'Free';
      subject = 'Free Period';
    }

    return {
      status,
      subject,
      teacherName,
      teacherId,
      substituteName,
      substituteId,
      room,
      details,
      isSpecial,
      regularTeacher
    };
  };

  const resolveTeacherSlotState = (day: DayOfWeek, pIdx: number, teacherIdStr: string) => {
    const t = teachers.find(other => other.id === teacherIdStr) || teachers[0];
    if (!t) return null;

    const regularSlot = t.schedule[day]?.[pIdx];
    
    // Check if they are absent on selectedDate
    const isAbsent = state.attendance?.some(
      att => att.date === selectedDate && att.teacherId === t.id && att.status !== 'Present'
    );

    // Check if they are substitute for someone else on selectedDate at pIdx
    const isSubbing = state.substituteAssignments?.find(
      sub => sub.date === selectedDate && sub.periodIndex === pIdx && sub.substituteTeacherId === t.id
    );

    // Check if they are absent and have a substitute assigned
    const subAssigned = state.substituteAssignments?.find(
      sub => sub.date === selectedDate && sub.periodIndex === pIdx && sub.absentTeacherId === t.id
    );

    const slotConf = settings.scheduleSlots?.[pIdx];
    const isSpecial = slotConf && !slotConf.requiresAssignment;

    let status: 'Regular' | 'Substitute' | 'Absent' | 'Free' | 'Break' | 'Cancelled' = 'Free';
    let subject = '';
    let classSection = '';
    let room = '';
    let details = '';

    if (isSpecial) {
      status = 'Break';
      subject = slotConf?.name || 'Break';
    } else if (isSubbing) {
      status = 'Substitute';
      subject = isSubbing.subject;
      classSection = isSubbing.classSection;
      room = 'Room 101'; // or look up regular room
      details = `Substitution for ${isSubbing.absentTeacherName}`;
    } else if (regularSlot) {
      subject = regularSlot.subject;
      classSection = regularSlot.classSection;
      room = regularSlot.room;
      if (isAbsent) {
        status = 'Absent';
        if (subAssigned) {
          details = `Absent. Subbed by ${subAssigned.substituteTeacherName}`;
        } else {
          details = `Absent. Pending substitution.`;
        }
      } else {
        status = 'Regular';
      }
    } else {
      status = 'Free';
      subject = 'Available / Free';
    }

    return {
      status,
      subject,
      classSection,
      room,
      details,
      isSpecial,
      isSubbing,
      subAssigned,
      isAbsent
    };
  };

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Trigger browser print for printable timetable block
  const handlePrint = () => {
    window.print();
  };

  // Run Smart Conflict-free Slot Suggestion search
  const handleRunSmartSuggestion = async () => {
    setExtraClassError(null);
    setSelectedSuggestedPeriod(null);
    try {
      const resp = await apiFetch(`/api/extra-classes/suggest?teacherId=${formTeacherId}&classSection=${formClass}&date=${formDate}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to suggestion');
      
      setSuggestedSlots(data.suggestions || []);
      if (data.suggestions && data.suggestions.length === 0) {
        setExtraClassError(`No conflict-free slots found for Day: ${data.day}. Both Teacher and Class are fully occupied with normal lessons.`);
      }
    } catch (err: any) {
      setExtraClassError(err.message || 'Error scheduling');
    }
  };

  // Submit approved extra class booking
  const handleBookExtraClass = async () => {
    if (selectedSuggestedPeriod === null) {
      setExtraClassError('Please select one of the suggested conflict-free periods.');
      return;
    }

    try {
      setExtraClassError(null);
      setExtraClassSuccess(null);
      await onScheduleExtraClass({
        teacherId: formTeacherId,
        classSection: formClass,
        date: formDate,
        periodIndex: selectedSuggestedPeriod
      });

      setExtraClassSuccess('Extra class successfully scheduled with automatic conflict protection!');
      setTimeout(() => {
        setIsExtraModalOpen(false);
        setExtraClassSuccess(null);
        setSuggestedSlots([]);
      }, 1500);

    } catch (err: any) {
      setExtraClassError(err.message || 'Failed booking slot');
    }
  };

  const getSlotBgStyle = (name: string, isDark: boolean) => {
    const normalized = (name || '').toLowerCase();
    if (normalized.includes('lunch')) {
      return {
        bg: 'bg-[#F59E0B] text-white',
        text: 'text-white font-bold',
        badgeBg: 'bg-[#D97706]/35 text-white border border-[#FBBF24]/30'
      };
    }
    if (normalized.includes('short break') || normalized.includes('break') || normalized.includes('recess')) {
      return {
        bg: 'bg-[#FFEDD5] text-amber-850 dark:bg-amber-950/45 dark:text-amber-200',
        text: 'text-amber-850 dark:text-amber-200 font-bold',
        badgeBg: 'bg-[#FED7AA]/50 text-amber-900 dark:bg-amber-900/45 dark:text-amber-300 border border-[#FED7AA]/20'
      };
    }
    if (normalized.includes('assembly')) {
      return {
        bg: 'bg-[#FEF3C7] text-amber-900 dark:bg-amber-950/20 dark:text-amber-300',
        text: 'text-amber-900 dark:text-amber-300 font-bold',
        badgeBg: 'bg-[#FDE68A]/60 text-amber-950 dark:bg-amber-900/30 border border-[#FDE68A]/20'
      };
    }
    if (normalized.includes('zero')) {
      return {
        bg: 'bg-[#FEF9C3] text-amber-900 dark:bg-yellow-950/20 dark:text-yellow-350',
        text: 'text-amber-900 dark:text-yellow-350 font-bold',
        badgeBg: 'bg-[#FEF08A]/60 text-amber-950 dark:bg-yellow-900/30 border border-[#FEF08A]/20'
      };
    }
    if (normalized.includes('activity')) {
      return {
        bg: 'bg-[#FED7AA] text-amber-950 dark:bg-orange-950/30 dark:text-orange-200',
        text: 'text-amber-950 dark:text-orange-200 font-bold',
        badgeBg: 'bg-[#FDBA74]/60 text-amber-950 dark:bg-orange-900/30 border border-[#FDBA74]/20'
      };
    }
    if (normalized.includes('over') || normalized.includes('dismiss') || normalized.includes('end')) {
      return {
        bg: 'bg-[#E5E7EB] text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        text: 'text-slate-700 dark:text-slate-300 font-bold',
        badgeBg: 'bg-slate-300 text-slate-800 dark:bg-slate-700 border border-slate-400/20'
      };
    }
    return {
      bg: 'bg-slate-100/50 dark:bg-slate-950/40 text-slate-550',
      text: 'text-slate-550 dark:text-slate-400 font-bold',
      badgeBg: 'bg-slate-200/60 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-300/20'
    };
  };

  // Edit manual schedule slot action
  const handleOpenEditSlot = (tId: string, d: DayOfWeek, pId: number) => {
    const teacher = teachers.find(t => t.id === tId);
    if (!teacher) return;
    
    const currSlot = teacher.schedule[d]?.[pId];
    
    setEditTeacherId(tId);
    setEditDay(d);
    setEditPeriodIdx(pId);
    setEditSubject(currSlot ? currSlot.subject : teacher.subject);
    setEditClass(currSlot ? currSlot.classSection : classList[0]);
    setEditRoom(currSlot ? currSlot.room : `Room ${100 + pId + 1}`);
    setEditError(null);
    setIsEditSlotOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const slotPayload = editSubject.trim() ? {
      subject: editSubject,
      classSection: editClass,
      room: editRoom
    } : null;

    try {
      await onUpdateSlot(editTeacherId, editDay, editPeriodIdx, slotPayload);
      setIsEditSlotOpen(false);
    } catch (err: any) {
      setEditError(err.message || 'Timetable conflict detected.');
    }
  };

  // Get current active schedule weekday
  const currentWeekDay = (() => {
    const d = new Date(selectedDate);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
    return daysOrder.includes(dayName) ? dayName : 'Monday';
  })();

  const activeTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  return (
    <div className="space-y-6">
      
      {/* Upper Action controller */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aura Academic Timetable Management</h2>
          <p className={`text-sm ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            Audit lessons, schedule extra classes with dynamic conflict protection, or print sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLocalSlots(settings.scheduleSlots || []);
              setLocalPeriodDuration(settings.periodDuration || 45);
              setIsScheduleBuilderOpen(!isScheduleBuilderOpen);
              setBuilderSuccess(null);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer flex items-center gap-1 ${
              isScheduleBuilderOpen 
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300' 
                : darkTheme ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-750'
            }`}
          >
            <Clock className="h-4 w-4" /> ⚙️ Configure Schedule Slots
          </button>

          <button
            onClick={handlePrint}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer flex items-center gap-1 ${
              darkTheme ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-750'
            }`}
            id="timetable-print-btn"
          >
            <Printer className="h-4 w-4" /> Print / Export PDF
          </button>
          
          <button
            onClick={() => {
              setIsExtraModalOpen(true);
              setFormTeacherId(teachers[0]?.id || '');
              setSuggestedSlots([]);
              setExtraClassError(null);
              setExtraClassSuccess(null);
            }}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
            id="timetable-extra-alloc-btn"
          >
            <Sparkles className="h-4 w-4" /> Book Extra Class (Conflict-Free)
          </button>
        </div>
      </div>

      {isScheduleBuilderOpen && (
        <div className={`p-5 rounded-2xl border ${
          darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500 animate-spin-slow" /> School Daily Schedule Slots Builder
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure your school's daily timings, lessons, breaks, zero period, and assemblies.
              </p>
            </div>
            <button 
              onClick={() => setIsScheduleBuilderOpen(false)}
              className="text-slate-400 hover:text-slate-650 cursor-pointer text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
            >
              Close
            </button>
          </div>

          {builderSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {builderSuccess}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Standard Period Duration (Minutes)</label>
                <input
                  type="number"
                  value={localPeriodDuration}
                  onChange={(e) => setLocalPeriodDuration(parseInt(e.target.value, 10) || 45)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Add Preset Slot Type</label>
                <div className="flex gap-2">
                  <select
                    value={selectedPresetType}
                    onChange={(e) => setSelectedPresetType(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white text-slate-800"
                  >
                    <option value="teaching">Teaching Period</option>
                    <option value="assembly">Morning Assembly</option>
                    <option value="zero_period">Zero Period</option>
                    <option value="break">Recess/Lunch Break</option>
                    <option value="activity">Activity Period</option>
                    <option value="sports">Sports Period</option>
                    <option value="library">Library Period</option>
                    <option value="laboratory">Laboratory Period</option>
                    <option value="free_period">Free Period</option>
                    <option value="school_over">School Over</option>
                  </select>
                  <button
                    onClick={handleAddSlotPreset}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Preset
                  </button>
                </div>
              </div>
            </div>

            {/* Slots List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
              {localSlots.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No slots configured. Use the preset tool above to build your daily timetable layout!
                </div>
              ) : (
                localSlots.map((slot, index) => {
                  const isTeaching = slot.type === 'teaching';
                  return (
                    <div 
                      key={slot.id} 
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isTeaching 
                          ? 'bg-blue-50/10 border-blue-100 dark:border-blue-900/30' 
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Order Controls */}
                        <div className="flex flex-col gap-1">
                          <button
                            disabled={index === 0}
                            onClick={() => moveSlotUp(index)}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-[10px] hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            disabled={index === localSlots.length - 1}
                            onClick={() => moveSlotDown(index)}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-[10px] hover:bg-slate-300 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2">
                            Slot {index + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            slot.type === 'teaching' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                            slot.type === 'break' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {slot.type}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 flex-1 w-full sm:w-auto sm:ml-4">
                        {/* Name Edit */}
                        <div className="col-span-1 sm:col-span-2">
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => {
                              const updated = [...localSlots];
                              updated[index].name = e.target.value;
                              setLocalSlots(updated);
                            }}
                            className="w-full px-2.5 py-1 border border-slate-200 dark:border-slate-850 rounded-lg text-xs bg-white text-slate-800"
                            placeholder="Slot Name"
                          />
                        </div>

                        {/* Start/End Time */}
                        <div>
                          <input
                            type="text"
                            value={slot.start}
                            onChange={(e) => {
                              const updated = [...localSlots];
                              updated[index].start = e.target.value;
                              setLocalSlots(updated);
                            }}
                            className="w-full px-2.5 py-1 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-mono bg-white text-slate-800"
                            placeholder="08:30 AM"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={slot.end}
                            onChange={(e) => {
                              const updated = [...localSlots];
                              updated[index].end = e.target.value;
                              setLocalSlots(updated);
                            }}
                            className="w-full px-2.5 py-1 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-mono bg-white text-slate-800"
                            placeholder="09:20 AM"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 mt-2 sm:mt-0">
                        {/* Require Assignment */}
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold select-none">
                          <input
                            type="checkbox"
                            checked={!!slot.requiresAssignment}
                            onChange={(e) => {
                              const updated = [...localSlots];
                              updated[index].requiresAssignment = e.target.checked;
                              setLocalSlots(updated);
                            }}
                            className="rounded text-blue-600 focus:ring-0"
                          />
                          Requires Assignment
                        </label>

                        {/* Delete Slot */}
                        <button
                          onClick={() => removeSlot(index)}
                          className="p-1 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/20 rounded cursor-pointer"
                          title="Remove Slot"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t dark:border-slate-800">
              <button
                onClick={handleSaveScheduleBuilder}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg cursor-pointer flex items-center gap-1"
              >
                💾 Save and Regenerate Slots (v{(settings.timetableVersion || 1) + 1})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Mismatch Modal Overlay */}
      {mismatchData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-2xl p-6 rounded-2xl shadow-2xl border transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="h-5 w-5" /> Template Mismatch Detected
              </h3>
              <button 
                onClick={() => setMismatchData(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 leading-normal text-xs">
              <p className="text-slate-400">
                The uploaded spreadsheet's columns do not match the current <strong>School Schedule Configuration</strong>.
                Please review the differences below. You must download and use the latest template to import timetables successfully.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Active Structure */}
                <div className={`p-4 rounded-xl border ${darkTheme ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-bold text-slate-550 mb-2 flex items-center gap-1 text-emerald-600">
                    <Check className="h-4 w-4" /> Active School Schedule Configuration
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[10px]">
                    {mismatchData.currentNames.map((name, idx) => (
                      <li key={idx} className="p-1 px-2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Slot {idx + 1}: {name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Uploaded File Structure */}
                <div className={`p-4 rounded-xl border ${darkTheme ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-bold text-slate-550 mb-2 flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" /> Uploaded File Columns
                  </h4>
                  <ul className="space-y-1.5 font-mono text-[10px]">
                    {mismatchData.uploadedNames.map((name, idx) => {
                      const isMatched = mismatchData.currentNames[idx] === name;
                      return (
                        <li 
                          key={idx} 
                          className={`p-1 px-2 rounded-md ${
                            isMatched 
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                          }`}
                        >
                          Col {idx + 1}: {name || ' (Empty/Unmapped Slot)'}
                        </li>
                      );
                    })}
                    {mismatchData.uploadedNames.length < mismatchData.currentNames.length && (
                      <li className="text-red-500 font-bold p-1 italic text-[9px]">
                        Missing {mismatchData.currentNames.length - mismatchData.uploadedNames.length} slot column(s) in uploaded file!
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-end pt-3 border-t dark:border-slate-800">
                <button
                  onClick={() => setMismatchData(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel Import
                </button>
                
                <button
                  onClick={() => {
                    downloadClassTemplate();
                    setMismatchData(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Download Updated Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL TIMETABLE IMPORT & ASSIGNMENT PANEL */}
      <div className={`p-5 rounded-2xl border ${
        darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
      }`}>
        {settings.timetableVersion && settings.timetableVersion > 1 && (
          <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-2.5">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-amber-850 dark:text-amber-400">Timetable Configuration Updated (v{settings.timetableVersion})</h5>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                The school schedule timings, periods, or breaks were recently modified. Previously downloaded template files are now <strong>outdated</strong>. Please click <strong>Download Template</strong> to grab the latest configuration before running future imports.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              <CalendarRange className="h-4 w-4 text-blue-600" />
              Spreadsheet Timetable Import & Intelligent Assignment
            </h3>
            <p className="text-xs text-slate-400">
              Select academic year, class, and section to unlock bulk spreadsheet scheduling with instant validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Academic Year */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[120px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Year</label>
              <select
                value={selectedImportYear}
                onChange={(e) => setSelectedImportYear(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>
            </div>

            {/* Class Selection */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[120px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Class</label>
              <select
                value={selectedImportClass}
                onChange={(e) => setSelectedImportClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            {/* Section Selection */}
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[100px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Section</label>
              <select
                value={selectedImportSection}
                onChange={(e) => setSelectedImportSection(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            {/* Upload & Template Buttons - Only visible if class and section are selected */}
            {selectedImportClass && selectedImportSection && (
              <div className="flex items-end gap-2 pt-4 sm:pt-0">
                <button
                  onClick={downloadClassTemplate}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer flex items-center gap-1 ${
                    darkTheme ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-750'
                  }`}
                  title="Download template Excel file"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template
                </button>

                <button
                  onClick={handleFileUploadClick}
                  disabled={isUploading}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> {isUploading ? 'Uploading...' : '➕ Upload Timetable (.xlsx)'}
                </button>
              </div>
            )}
          </div>
        </div>

        {importError && (
          <p className="text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/30 p-2.5 rounded-xl mt-3 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {importError}
          </p>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />
      </div>

      {/* FILTER BUTTONS & VIEW CHOOSE */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl">
        <div className="flex flex-wrap bg-white dark:bg-slate-950 p-1 rounded-xl shadow-xs w-full xl:w-auto gap-1">
          <button
            onClick={() => setViewMode('teacher')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'teacher' ? 'bg-[#F59E0B] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
            id="timetable-view-teacher"
          >
            🧑‍🏫 Teacher Timetable
          </button>
          <button
            onClick={() => setViewMode('class')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'class' ? 'bg-[#F59E0B] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
            id="timetable-view-class"
          >
            🏫 Class Timetable
          </button>
          <button
            onClick={() => setViewMode('section')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'section' ? 'bg-[#F59E0B] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
            id="timetable-view-section"
          >
            📋 Section Timetable
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'daily' ? 'bg-[#F59E0B] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
            id="timetable-view-daily"
          >
            🌐 Daily School Grid
          </button>
        </div>

        {/* Dynamic Filters per ViewMode */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {viewMode === 'teacher' && (
            <>
              {/* Search Teacher Input */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Teacher..."
                  value={searchTeacherQuery}
                  onChange={(e) => setSearchTeacherQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] w-full sm:w-44"
                />
              </div>

              {/* Select Teacher Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Teacher:</span>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] w-full sm:w-auto"
                >
                  {teachers
                    .filter(t => 
                      t.name.toLowerCase().includes(searchTeacherQuery.toLowerCase()) ||
                      t.subject.toLowerCase().includes(searchTeacherQuery.toLowerCase())
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                    ))
                  }
                  {teachers.filter(t => 
                    t.name.toLowerCase().includes(searchTeacherQuery.toLowerCase()) ||
                    t.subject.toLowerCase().includes(searchTeacherQuery.toLowerCase())
                  ).length === 0 && (
                    <option value="">No teachers match</option>
                  )}
                </select>
              </div>

              {/* Select Day Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Day:</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] w-full sm:w-auto"
                >
                  {daysOrder.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(viewMode === 'class' || viewMode === 'section') && (
            <>
              {/* Select Class Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Class:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] w-full sm:w-auto"
                >
                  {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Select Section Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] w-full sm:w-auto"
                >
                  {['A', 'B'].map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>

              {/* Select Day Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Day:</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] w-full sm:w-auto"
                >
                  {daysOrder.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] w-full sm:w-auto"
                >
                  <option value="All">All Classes</option>
                  <option value="Regular">Regular Classes</option>
                  <option value="Substitute">Substitute Assigned</option>
                  <option value="Absent">Teacher Absent</option>
                  <option value="Free">Free Period</option>
                  <option value="Break">Break</option>
                </select>
              </div>
            </>
          )}

          {viewMode === 'daily' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Day View:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
              >
                {daysOrder.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}

          {/* Pulsing Live Sync Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>Live Sync Active</span>
          </div>
        </div>
      </div>

      {/* RENDER VIEW MODE CHASSIS */}
      <div id="printable-timetable-registry-wrapper" ref={printAreaRef}>
        {viewMode === 'daily' && (
          <div className="space-y-4">
            {/* Custom styling style block for thin, modern scrollbar with hover effects */}
            <style dangerouslySetInnerHTML={{__html: `
              .scrollbar-custom::-webkit-scrollbar {
                height: 8px;
              }
              .scrollbar-custom::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollbar-custom::-webkit-scrollbar-thumb {
                background: rgba(59, 130, 246, 0.4);
                border-radius: 9999px;
              }
              .scrollbar-custom::-webkit-scrollbar-thumb:hover {
                background: rgba(59, 130, 246, 0.85);
              }
              
              .table-scroll-custom::-webkit-scrollbar {
                height: 10px;
              }
              .table-scroll-custom::-webkit-scrollbar-track {
                background: transparent;
              }
              .table-scroll-custom::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.3);
                border-radius: 9999px;
              }
              .table-scroll-custom::-webkit-scrollbar-thumb:hover {
                background: rgba(59, 130, 246, 0.6);
              }
            `}} />

            {/* STICKY TOP SCROLLBAR & CONTROLS PANEL */}
            <div className={`sticky top-0 z-20 p-3 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
              darkTheme 
                ? 'bg-slate-900/95 border-slate-800 backdrop-blur-md shadow-lg shadow-slate-950/20' 
                : 'bg-white/95 border-slate-100 shadow-md shadow-slate-100/10 backdrop-blur-md'
            }`}>
              <div className="flex items-center gap-1 shrink-0 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleScrollFirst}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${
                      darkTheme 
                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-655'
                    }`}
                    title="First Column (Home)"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="hidden lg:inline ml-1 text-[11px]">First</span>
                  </button>
                  <button
                    onClick={handleScrollLeft}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${
                      darkTheme 
                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-655'
                    }`}
                    title="Scroll Left (Left Arrow)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1 text-[11px]">Scroll Left</span>
                  </button>
                </div>
                
                <span className="inline-block md:hidden text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  ← Swipe Table →
                </span>
              </div>

              {/* Top Horizontal Scrollbar container */}
              <div className="flex-1 min-w-0 w-full px-2">
                <div 
                  ref={topScrollRef} 
                  className="overflow-x-auto overflow-y-hidden w-full scrollbar-custom"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {/* Dummy scroll container matching table width */}
                  <div style={{ width: `${scrollWidth}px`, height: '8px' }} />
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 w-full md:w-auto justify-end">
                <span className="hidden md:inline text-[10px] font-bold text-slate-400 mr-2 uppercase tracking-wide">
                  Use Shift + Wheel or ◀ Arrow keys ▶
                </span>
                
                <button
                  onClick={handleScrollRight}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${
                    darkTheme 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-655'
                  }`}
                  title="Scroll Right (Right Arrow)"
                >
                  <span className="hidden sm:inline mr-1 text-[11px]">Scroll Right</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleScrollLast}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${
                    darkTheme 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-655'
                  }`}
                  title="Last Column (End)"
                >
                  <span className="hidden lg:inline mr-1 text-[11px]">Last</span>
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* DAILY TIMETABLE MATRIX TABLE */}
            <div 
              ref={bottomScrollRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className={`p-6 rounded-2xl border overflow-x-auto table-scroll-custom focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 ${
                darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-center mb-5 shrink-0">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                    Daily Lessons Distribution Grid ({selectedDay})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Double click any cell or click edit to overwrite lessons. Empty slots representation is prep/free time.
                  </p>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${darkTheme ? 'border-slate-800 bg-slate-950/40' : 'bg-slate-50/50 border-slate-100'}`}>
                    <th className="p-3.5 font-bold text-slate-550 w-44">Educator Name</th>
                    {timings.map((time, idx) => {
                      const slotConf = settings.scheduleSlots?.[idx];
                      const label = slotConf ? slotConf.name : `Period ${idx + 1}`;
                      return (
                        <th key={idx} className="p-3.5 font-bold text-slate-550 min-w-44 border-l dark:border-slate-800">
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{time}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-850">
                        <div className="flex flex-col">
                          <span>{teacher.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{teacher.subject}</span>
                        </div>
                      </td>
                      
                      {Array(timings.length).fill(null).map((_, pIdx) => {
                        const slot = teacher.schedule[selectedDay]?.[pIdx];
                        const slotConf = settings.scheduleSlots?.[pIdx];
                        const isSpecial = slotConf && !slotConf.requiresAssignment;

                        return (
                          <td 
                            key={pIdx} 
                            onClick={() => {
                              if (!isSpecial) {
                                handleOpenEditSlot(teacher.id, selectedDay, pIdx);
                              }
                            }}
                            className={`p-3.5 border-l dark:border-slate-800 transition-colors ${
                              isSpecial 
                                ? `${getSlotBgStyle(slotConf.name, darkTheme).bg} cursor-not-allowed select-none` 
                                : 'cursor-pointer group hover:bg-[#FFF8F1]/50 dark:hover:bg-slate-800/10'
                            }`}
                          >
                            {isSpecial ? (
                              <div className="py-2 flex flex-col items-center justify-center font-bold">
                                <span className={`text-[9px] tracking-wide uppercase px-2 py-0.5 rounded-md ${getSlotBgStyle(slotConf.name, darkTheme).badgeBg}`}>
                                  {slotConf.name}
                                </span>
                              </div>
                            ) : slot ? (
                              <div className="space-y-1 relative">
                                <div className="flex justify-between items-start gap-1">
                                  <span className={`font-bold text-xs ${slot.isExtra ? 'text-[#F59E0B]' : 'text-[#F59E0B]'}`}>
                                    {slot.classSection}
                                  </span>
                                  {slot.isExtra && (
                                    <span className="text-[9px] bg-[#FFF8F1] text-[#F59E0B] border border-[#FED7AA] px-1.5 py-0.5 rounded-sm font-black">
                                      EXTRA
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate leading-snug">{slot.subject}</p>
                                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold pt-1">
                                  <MapPin className="h-3 w-3 inline text-slate-300" />
                                  <span>{slot.room}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="py-2 flex flex-col items-center justify-center text-slate-350 dark:text-slate-600 font-bold group-hover:text-[#F59E0B]/50 transition-colors">
                                <span className="text-[10px] tracking-wide uppercase">- FREE -</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'teacher' && (
          <div className="space-y-6">
            {/* Educator Summary Info Box */}
            {(() => {
              const activeTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
              if (!activeTeacher) return null;
              
              const isAbsentToday = state.attendance?.some(
                att => att.date === selectedDate && att.teacherId === activeTeacher.id && att.status !== 'Present'
              );

              return (
                <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
                }`}>
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      Educator Profile
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {activeTeacher.name}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        isAbsentToday 
                          ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isAbsentToday ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                        {isAbsentToday ? 'Absent Today' : 'Present & Active'}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <p><span className="font-bold text-slate-400">Department:</span> {activeTeacher.subject} Dept</p>
                      <p><span className="font-bold text-slate-400">Phone:</span> {activeTeacher.phone || '+91 98765 43210'}</p>
                      <p><span className="font-bold text-slate-400">Email:</span> {activeTeacher.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="text-center px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl min-w-[85px]">
                      <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Weekly periods</p>
                      <p className="text-lg font-black text-slate-850 mt-0.5">
                        {Object.values(activeTeacher.schedule).reduce((acc, curr) => acc + curr.filter(Boolean).length, 0)}
                      </p>
                    </div>
                    <div className="text-center px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl min-w-[85px]">
                      <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Default Room</p>
                      <p className="text-sm font-black text-slate-850 mt-1 font-mono">
                        {Object.values(activeTeacher.schedule)
                          .flatMap(x => x)
                          .find(x => x && x.room)?.room || 'Room 101'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TABULAR DETAILED TIMELINE FOR SELECTED DAY */}
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-base flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <CalendarRange className="h-4 w-4 text-blue-600" />
                    Daily Schedule Breakdown — {selectedDay}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Displays teaching loads, substitution directives, or free periods linked to active attendance logs.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b ${darkTheme ? 'border-slate-800 bg-slate-950/40' : 'bg-slate-50/50 border-slate-100'}`}>
                      <th className="p-3.5 font-bold text-slate-550 w-24">Period</th>
                      <th className="p-3.5 font-bold text-slate-550 w-44">Time</th>
                      <th className="p-3.5 font-bold text-slate-550 w-40">Class & Section</th>
                      <th className="p-3.5 font-bold text-slate-550">Subject</th>
                      <th className="p-3.5 font-bold text-slate-550 w-32">Room</th>
                      <th className="p-3.5 font-bold text-slate-550 w-64">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array(timings.length).fill(null).map((_, pIdx) => {
                      const slotConf = settings.scheduleSlots?.[pIdx];
                      const time = timings[pIdx];
                      const label = slotConf ? slotConf.name : `Period ${pIdx + 1}`;
                      
                      const teacherState = resolveTeacherSlotState(selectedDay, pIdx, selectedTeacherId);
                      if (!teacherState) return null;

                      const { status, subject, classSection, room, details, isSpecial, isSubbing, isAbsent } = teacherState;

                      let rowBg = '';
                      if (status === 'Substitute') rowBg = 'bg-amber-50/40 dark:bg-amber-950/5';
                      if (status === 'Absent') rowBg = 'bg-red-50/40 dark:bg-red-950/5';

                      return (
                        <tr 
                          key={pIdx} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors cursor-pointer ${rowBg}`}
                          onClick={() => {
                            if (!isSpecial) {
                              handleOpenEditSlot(selectedTeacherId, selectedDay, pIdx);
                            }
                          }}
                        >
                          <td className="p-3.5 font-bold text-slate-500 font-mono">
                            {label}
                          </td>
                          <td className="p-3.5 font-medium text-slate-600 font-mono">
                            {time}
                          </td>
                          <td className="p-3.5 font-bold text-[#F59E0B]">
                            {classSection || '-'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-850">
                            {subject}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-550 font-mono">
                            {room || '-'}
                          </td>
                          <td className="p-3.5">
                            {isSpecial ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getSlotBgStyle(slotConf.name, darkTheme).badgeBg}`}>
                                {slotConf.name}
                              </span>
                            ) : isSubbing ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                  <Sparkles className="h-2.5 w-2.5 text-amber-600" /> Assigned Substitute
                                </span>
                                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">{details}</p>
                              </div>
                            ) : isAbsent ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                  <XCircle className="h-2.5 w-2.5" /> Absent today
                                </span>
                                <p className="text-[10px] text-red-600 font-medium leading-relaxed">{details}</p>
                              </div>
                            ) : status === 'Regular' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                <Check className="h-2.5 w-2.5" /> Scheduled / Present
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-650 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-md text-[10px] font-semibold uppercase">
                                Free Period
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* WEEKLY OVERVIEW TIMETABLE MATRIX TABLE */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-base flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Printer className="h-4 w-4 text-blue-600" />
                  Weekly Overview Matrix
                </h4>
                <p className="text-xs text-slate-400">
                  Full 6-day planner distribution for the selected educator. Highlighted column indicates active scheduling day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-6 gap-4">
                {daysOrder.map((day) => {
                  const activeTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
                  return (
                    <div 
                      key={day} 
                      className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                        day === selectedDay 
                          ? 'bg-[#FFF8F1] border-[#FED7AA] ring-2 ring-[#F59E0B]/15' 
                          : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800 mb-4">
                        <h4 className="font-black text-xs tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${day === selectedDay ? 'bg-[#F59E0B] animate-ping' : 'bg-slate-400'}`}></span>
                          {day}
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {Array(timings.length).fill(null).map((_, pIdx) => {
                          const slotConf = settings.scheduleSlots?.[pIdx];
                          const isSpecial = slotConf && !slotConf.requiresAssignment;
                          
                          const slotState = resolveTeacherSlotState(day, pIdx, selectedTeacherId);
                          if (!slotState) return null;

                          const { status, subject, classSection, room, isSubbing, isAbsent } = slotState;

                          return (
                            <div 
                              key={pIdx}
                              onClick={() => {
                                if (!isSpecial) {
                                  handleOpenEditSlot(selectedTeacherId, day, pIdx);
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer group ${
                                isSpecial 
                                  ? `${getSlotBgStyle(slotConf.name, darkTheme).bg} border-slate-200 dark:border-slate-855 cursor-not-allowed`
                                  : isSubbing
                                    ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30'
                                    : isAbsent
                                      ? 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-900/30'
                                      : status === 'Regular'
                                        ? 'bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-855'
                                        : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-855'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1 text-[10px] font-bold text-slate-400">
                                <span>P{pIdx + 1}</span>
                                <span className="font-mono">{slotConf?.start || '00:00'}</span>
                              </div>

                              {isSpecial ? (
                                <p className={`text-[9px] font-semibold py-1 text-center rounded-md uppercase tracking-wider ${getSlotBgStyle(slotConf.name, darkTheme).badgeBg}`}>
                                  {slotConf.name}
                                </p>
                              ) : status === 'Substitute' ? (
                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-center">
                                    <span className="font-black text-[11px] text-amber-700 uppercase tracking-tight">{classSection}</span>
                                    <span className="text-[8px] bg-amber-100 text-amber-805 font-extrabold px-1 rounded">SUB</span>
                                  </div>
                                  <p className="font-semibold text-[10px] text-amber-800 truncate leading-relaxed">{subject}</p>
                                </div>
                              ) : status === 'Absent' ? (
                                <div className="space-y-0.5">
                                  <span className="font-black text-[11px] text-red-600 line-through tracking-tight">{classSection}</span>
                                  <p className="font-semibold text-[10px] text-red-500 line-through truncate leading-relaxed">{subject}</p>
                                </div>
                              ) : status === 'Regular' ? (
                                <div className="space-y-0.5">
                                  <span className="font-black text-[11px] text-slate-700 dark:text-slate-350 tracking-tight">{classSection}</span>
                                  <p className="font-semibold text-[10px] text-slate-800 dark:text-slate-350 truncate leading-relaxed">{subject}</p>
                                  <p className="text-[9px] text-slate-400 font-medium font-mono">{room}</p>
                                </div>
                              ) : (
                                <p className="text-[9px] text-slate-350 dark:text-slate-600 font-bold uppercase py-2.5 text-center tracking-wide">
                                  Available
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'class' && (
          <div className="space-y-6">
            {/* Class summary statistics card */}
            {(() => {
              const classSection = `${selectedGrade}-${selectedSection}`;
              
              // Count status types
              let totalScheduled = 0;
              let totalSubs = 0;
              let totalAbsents = 0;
              let totalFrees = 0;

              Array(timings.length).fill(null).forEach((_, pIdx) => {
                const slotConf = settings.scheduleSlots?.[pIdx];
                if (slotConf && !slotConf.requiresAssignment) return; // ignore breaks
                
                const slotState = resolveSlotState(selectedDay, pIdx, classSection);
                if (slotState.status === 'Regular') totalScheduled++;
                else if (slotState.status === 'Substitute') totalSubs++;
                else if (slotState.status === 'Absent') totalAbsents++;
                else totalFrees++;
              });

              return (
                <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      Standard Timetable View
                    </span>
                    <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                      {selectedGrade}-{selectedSection}
                    </h3>
                    <p className="text-xs text-slate-505 leading-normal">
                      Lessons plan schedule for <span className="font-bold text-slate-700 dark:text-slate-350">{selectedDay}</span> synced to substitution engine.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl min-w-[85px]">
                      <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wide">Regular</p>
                      <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{totalScheduled}</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl min-w-[85px]">
                      <p className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wide">Substituted</p>
                      <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">{totalSubs}</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl min-w-[85px]">
                      <p className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 tracking-wide">Absent/Pending</p>
                      <p className="text-lg font-black text-red-700 dark:text-red-400 mt-0.5">{totalAbsents}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl min-w-[85px]">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wide">Free periods</p>
                      <p className="text-lg font-black text-slate-850 mt-0.5">{totalFrees}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CLASS TIMETABLE TABLE VIEW */}
            <div className={`p-6 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b ${darkTheme ? 'border-slate-800 bg-slate-955/40' : 'bg-slate-50/50 border-slate-100'}`}>
                      <th className="p-3.5 font-bold text-slate-555 w-24">Period</th>
                      <th className="p-3.5 font-bold text-slate-555 w-44">Time</th>
                      <th className="p-3.5 font-bold text-slate-555 w-64">Subject</th>
                      <th className="p-3.5 font-bold text-slate-555 w-64">Educator / Instructor</th>
                      <th className="p-3.5 font-bold text-slate-555 w-32">Room</th>
                      <th className="p-3.5 font-bold text-slate-555">Status Indicator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array(timings.length).fill(null).map((_, pIdx) => {
                      const slotConf = settings.scheduleSlots?.[pIdx];
                      const time = timings[pIdx];
                      const label = slotConf ? slotConf.name : `Period ${pIdx + 1}`;
                      const classSection = `${selectedGrade}-${selectedSection}`;
                      
                      const slotState = resolveSlotState(selectedDay, pIdx, classSection);
                      const { status, subject, teacherName, teacherId, substituteName, room, details, isSpecial } = slotState;

                      // Apply Status Filter
                      if (statusFilter !== 'All' && status !== statusFilter) return null;

                      let rowBg = '';
                      if (status === 'Substitute') rowBg = 'bg-amber-50/40 dark:bg-amber-950/5';
                      if (status === 'Absent') rowBg = 'bg-red-50/40 dark:bg-red-950/5';

                      return (
                        <tr 
                          key={pIdx} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors cursor-pointer ${rowBg}`}
                          onClick={() => {
                            if (!isSpecial && teacherId) {
                              handleOpenEditSlot(teacherId, selectedDay, pIdx);
                            }
                          }}
                        >
                          <td className="p-3.5 font-bold text-slate-500 font-mono">
                            {label}
                          </td>
                          <td className="p-3.5 font-medium text-slate-600 font-mono">
                            {time}
                          </td>
                          <td className="p-3.5">
                            <span className="font-black text-xs text-slate-805 dark:text-slate-100">{subject}</span>
                          </td>
                          <td className="p-3.5">
                            {isSpecial ? (
                              <span className="text-slate-400">-</span>
                            ) : status === 'Substitute' ? (
                              <div className="flex flex-col">
                                <span className="font-extrabold text-amber-700 dark:text-amber-400">{substituteName} (Substitute)</span>
                                <span className="text-[10px] text-slate-400 line-through">{teacherName} (Regular)</span>
                              </div>
                            ) : status === 'Absent' ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-red-500 line-through">{teacherName}</span>
                                <span className="text-[9px] text-red-650 font-medium">Teacher Absent (No Sub)</span>
                              </div>
                            ) : status === 'Regular' ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{teacherName}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-555 font-mono">
                            {room || '-'}
                          </td>
                          <td className="p-3.5">
                            {isSpecial ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getSlotBgStyle(slotConf.name, darkTheme).badgeBg}`}>
                                {slotConf.name}
                              </span>
                            ) : status === 'Substitute' ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                  <Sparkles className="h-2.5 w-2.5 text-amber-600" /> Substitute Assigned
                                </span>
                                <p className="text-[10px] text-amber-600 font-medium leading-relaxed">{details}</p>
                              </div>
                            ) : status === 'Absent' ? (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                  <AlertCircle className="h-2.5 w-2.5" /> Absent (Pending Sub)
                                </span>
                                <p className="text-[10px] text-red-500 font-medium leading-relaxed">No teaching coverage assigned yet.</p>
                              </div>
                            ) : status === 'Regular' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Regular Class
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-550 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-md text-[10px] font-semibold uppercase">
                                Free period
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'section' && (
          <div className="space-y-6">
            {/* Section Header Card */}
            <div className={`p-5 rounded-2xl border ${
              darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xs'
            }`}>
              <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                🏫 Weekly Master View: {selectedGrade}-{selectedSection}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing weekly periods. Highlighted column matches globally selected scheduling day.
              </p>
            </div>

            {/* WEEKLY COLUMNS FOR SELECTED SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-6 gap-4">
              {daysOrder.map((day) => (
                <div 
                  key={day} 
                  className={`p-5 rounded-2xl border transition-all ${
                    day === selectedDay 
                      ? 'bg-[#FFF8F1] border-[#FED7AA] ring-2 ring-[#F59E0B]/15 shadow-sm' 
                      : darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800 mb-4">
                    <h4 className="font-black text-xs tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${day === selectedDay ? 'bg-[#F59E0B] animate-ping' : 'bg-slate-400'}`}></span>
                      {day}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {Array(timings.length).fill(null).map((_, pIdx) => {
                      const slotConf = settings.scheduleSlots?.[pIdx];
                      const isSpecial = slotConf && !slotConf.requiresAssignment;
                      const classSection = `${selectedGrade}-${selectedSection}`;
                      
                      const slotState = resolveSlotState(day, pIdx, classSection);
                      const { status, subject, teacherName, teacherId, substituteName, room } = slotState;

                      // Filter Status
                      if (statusFilter !== 'All' && status !== statusFilter) return null;

                      return (
                        <div 
                          key={pIdx}
                          onClick={() => {
                            if (!isSpecial && teacherId) {
                              handleOpenEditSlot(teacherId, day, pIdx);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSpecial 
                              ? `${getSlotBgStyle(slotConf.name, darkTheme).bg} border-slate-200 dark:border-slate-855 cursor-not-allowed`
                              : status === 'Substitute'
                                ? 'bg-amber-50/65 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30'
                                : status === 'Absent'
                                  ? 'bg-red-50/65 border-red-200 dark:bg-red-950/20 dark:border-red-900/30'
                                  : status === 'Regular'
                                    ? 'bg-white border-slate-100 dark:bg-slate-950 dark:border-slate-855'
                                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-855'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 text-[10px] font-bold text-slate-400">
                            <span>P{pIdx + 1}</span>
                            <span className="font-mono">{slotConf?.start || '00:00'}</span>
                          </div>

                          {isSpecial ? (
                            <p className={`text-[9px] font-semibold py-1 text-center rounded-md uppercase tracking-wider ${getSlotBgStyle(slotConf.name, darkTheme).badgeBg}`}>
                              {slotConf.name}
                            </p>
                          ) : status === 'Substitute' ? (
                            <div className="space-y-0.5">
                              <span className="font-black text-[11px] text-amber-700 dark:text-amber-400">{subject}</span>
                              <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold leading-relaxed">{substituteName}</p>
                              <p className="text-[9px] text-slate-400 line-through leading-relaxed">{teacherName}</p>
                            </div>
                          ) : status === 'Absent' ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-[11px] text-red-600 line-through">{subject}</span>
                              <p className="text-[10px] text-red-500 font-black leading-relaxed">{teacherName}</p>
                            </div>
                          ) : status === 'Regular' ? (
                            <div className="space-y-0.5">
                              <span className="font-black text-[11px] text-slate-800 dark:text-slate-150 leading-relaxed">{subject}</span>
                              <p className="text-[10px] text-slate-650 dark:text-slate-450 leading-relaxed font-semibold">{teacherName}</p>
                              <p className="text-[9px] text-slate-400 font-medium font-mono">{room}</p>
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-350 dark:text-slate-600 font-bold uppercase py-2 text-center">
                              Free period
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MANUALLY EDIT SINGLE TIMETABLE SLOT MODAL */}
      {isEditSlotOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Edit Class Slot</h3>
              <button onClick={() => setIsEditSlotOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div className="p-3.5 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-950 rounded-xl leading-normal text-xs text-slate-600 dark:text-slate-400">
                <p><span className="font-bold">Educator:</span> {teachers.find(t => t.id === editTeacherId)?.name}</p>
                <p><span className="font-bold">Timing:</span> {editDay}, Period {editPeriodIdx + 1} ({timings[editPeriodIdx]})</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Subject Name (leave blank to delete lesson)</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="e.g. Mathematics, Free"
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 bg-white"
                />
              </div>

              {editSubject.trim() && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Class Section</label>
                    <select
                      value={editClass}
                      onChange={(e) => setEditClass(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white"
                    >
                      {classList.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Room Assignment</label>
                    <input
                      type="text"
                      value={editRoom}
                      onChange={(e) => setEditRoom(e.target.value)}
                      className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}

              {editError && (
                <p className="text-xs text-red-600 font-bold bg-red-100/50 border border-red-200 p-2.5 rounded-xl">
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditSlotOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-xs shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  Save Timetable Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTELLIGENT COMPREHENSIVE EXTRA CLASS MODAL */}
      {isExtraModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-xl p-6 rounded-2xl shadow-2xl border transition-all ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Automatic Extra Class Allocation Assistant</h3>
              <button onClick={() => setIsExtraModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-normal">
                Determine completely clean and conflict-free study slots. The scheduler will check that both the educator AND target student block have 100% available slots in their respective timelines.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Teacher Office</label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Student Block</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white"
                  >
                    {classList.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-750 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleRunSmartSuggestion}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FBBF24] text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-4 w-4" /> Run Conflict Check
                </button>
              </div>

              {/* Suggestions grid of free slots */}
              {suggestedSlots.length > 0 && (
                <div className="space-y-3 pt-3 border-t dark:border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Conflict-Free Timetable Slots:</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedSlots.map((item) => (
                      <button
                        key={item.periodIndex}
                        onClick={() => setSelectedSuggestedPeriod(item.periodIndex)}
                        className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                          selectedSuggestedPeriod === item.periodIndex
                            ? 'bg-[#F59E0B] border-[#F59E0B] text-white shadow-md'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-900 text-slate-800 dark:text-slate-200 hover:border-[#FBBF24]'
                        }`}
                        type="button"
                      >
                        <div>
                          <p className="text-xs font-bold">{item.timeLabel}</p>
                          <p className={`text-[10px] mt-0.5 ${selectedSuggestedPeriod === item.periodIndex ? 'text-amber-105' : 'text-slate-400'}`}>
                            {timings[item.periodIndex]}
                          </p>
                        </div>
                        {selectedSuggestedPeriod === item.periodIndex && (
                          <Check className="h-4 w-4 text-white shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                    <button
                      onClick={() => setIsExtraModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      Close Roster
                    </button>
                    <button
                      onClick={handleBookExtraClass}
                      className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FBBF24] text-white rounded-xl font-bold text-xs"
                    >
                      Approve & Register Slot
                    </button>
                  </div>
                </div>
              )}

              {extraClassError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 animate-bounce" />
                  <span>{extraClassError}</span>
                </div>
              )}

              {extraClassSuccess && (
                <div className="p-3.5 bg-green-50 dark:bg-green-955/20 border border-green-200 dark:border-green-900 rounded-xl text-xs text-green-700 dark:text-green-400 flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{extraClassSuccess}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SPREADSHEET TIMETABLE IMPORT PREVIEW MODAL */}
      {importPreviewOpen && importResult && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-2xl border transition-all my-8 ${
            darkTheme ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-blue-600" />
                  Timetable Import Review: {selectedImportClass}-{selectedImportSection}
                </h3>
                <p className="text-xs text-slate-400">
                  Review the parsed schedule and resolve warnings before confirming changes.
                </p>
              </div>
              <button onClick={() => setImportPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Statistics block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Periods Parsed</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">{importResult.slots.length}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Educators</p>
                  <p className="text-lg font-bold mt-1">
                    {new Set(importResult.slots.map(s => s.teacherId)).size}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-[10px] font-bold text-red-500 uppercase">Errors</p>
                  <p className="text-lg font-bold text-red-600 mt-1">
                    {importResult.errors.filter(e => e.type === 'error').length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[10px] font-bold text-amber-500 uppercase">Warnings</p>
                  <p className="text-lg font-bold text-amber-600 mt-1">
                    {importResult.errors.filter(e => e.type === 'warning').length}
                  </p>
                </div>
              </div>

              {/* Errors & Warnings List */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Validation Issues:</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 p-2 rounded-xl">
                    {importResult.errors.map((err, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                          err.type === 'error'
                            ? 'bg-red-50 dark:bg-red-955/20 border-red-150 dark:border-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-amber-50 dark:bg-amber-955/20 border-amber-150 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {err.type === 'error' ? (
                          <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                        )}
                        <div>
                          <span className="font-bold">Row {err.row}: </span>
                          <span>{err.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timetable Preview Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Weekly Class Timetable Preview:</h4>
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-3 w-24">Day</th>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <th key={i} className="p-3 text-center min-w-[100px]">Period {i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                        <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50">
                          <td className="p-3 font-bold text-xs text-slate-500 dark:text-slate-400">{day}</td>
                          {Array.from({ length: 8 }).map((_, periodIdx) => {
                            const slot = importResult.slots.find(
                              s => s.day === day && s.periodIndex === periodIdx
                            );
                            const teacherObj = slot ? teachers.find(t => t.id === slot.teacherId) : null;
                            return (
                              <td key={periodIdx} className="p-2 text-center">
                                {slot ? (
                                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl space-y-0.5">
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-tight">
                                      {slot.subject}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[120px] mx-auto">
                                      {teacherObj?.name || 'Assigned Educator'}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-semibold uppercase">
                                      {slot.room || 'No Room'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="py-3 px-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-300 dark:text-slate-700 text-[10px] font-semibold">
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setImportPreviewOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importResult.errors.some(e => e.type === 'error') || isUploading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Confirm & Import Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles for clean Export */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root {
            background-color: white !important;
          }
          #sidebar-container-element {
            display: none !important;
          }
          #timetable-print-btn, #timetable-extra-alloc-btn, #timetable-view-daily, #timetable-view-weekly {
            display: none !important;
          }
          #printable-timetable-registry-wrapper, #printable-timetable-registry-wrapper * {
            visibility: visible;
          }
          #printable-timetable-registry-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
