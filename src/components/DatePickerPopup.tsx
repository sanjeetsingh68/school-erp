import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';
import { formatISTDateToDDMMYYYY, getISTDateString } from '../utils/dateUtils';

interface DatePickerPopupProps {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  darkTheme: boolean;
}

export default function DatePickerPopup({
  selectedDate,
  onChange,
  darkTheme
}: DatePickerPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current state date
  const [year, month, day] = selectedDate.split('-').map(Number);
  const [viewMonth, setViewMonth] = useState(month - 1); // 0-indexed
  const [viewYear, setViewYear] = useState(year);

  // Keep view in sync when selectedDate changes externally
  useEffect(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    setViewMonth(m - 1);
    setViewYear(y);
  }, [selectedDate]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Calculate days in the viewMonth
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  // Get first day weekday offset (0 = Sunday, 1 = Monday, etc)
  const getFirstDayOffset = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const targetDateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(targetDateStr);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = getISTDateString();
    onChange(todayStr);
    setIsOpen(false);
  };

  // Generate grid days
  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const offset = getFirstDayOffset(viewYear, viewMonth);
  
  const gridCells = [];
  // Empty cells for offset
  for (let i = 0; i < offset; i++) {
    gridCells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }
  // Days of the month
  const actualTodayStr = getISTDateString();
  for (let d = 1; d <= totalDays; d++) {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const cellDateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    const isSelected = cellDateStr === selectedDate;
    const isToday = cellDateStr === actualTodayStr;

    gridCells.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => handleSelectDay(d)}
        className={`h-8 w-8 text-xs font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          isSelected
            ? 'bg-[#F59E0B] text-white shadow-md shadow-orange-500/20'
            : isToday
            ? 'border-2 border-[#F59E0B] text-[#F59E0B] bg-orange-50/30'
            : darkTheme
            ? 'text-slate-300 hover:bg-slate-800'
            : 'text-slate-700 hover:bg-orange-50 hover:text-[#F59E0B]'
        }`}
      >
        {d}
      </button>
    );
  }

  // Daily Navigation step helpers
  const handleStepDay = (step: number) => {
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + step);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayVal = String(d.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${dayVal}`);
  };

  // Day Name for display (e.g., Monday, Tuesday)
  const getDayName = () => {
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div ref={containerRef} className="flex items-center gap-1.5" id="date-picker-container">
      {/* Step Left (Previous Day) Button */}
      <button
        onClick={() => handleStepDay(-1)}
        type="button"
        className="h-[34px] px-2.5 rounded-lg border border-[#FED7AA]/30 bg-[#FFF8F1] hover:bg-[#FEEFDD] dark:bg-amber-955/20 dark:hover:bg-amber-950/45 text-[#F59E0B] hover:text-[#D97706] transition-colors flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
        title="Previous Day"
      >
        <ChevronLeft className="h-4 w-4 shrink-0 mr-0.5" />
        <span className="hidden xl:inline">Prev Day</span>
      </button>

      {/* Main Clicking Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className={`flex items-center gap-2 px-3 h-[34px] bg-[#FFF8F1] hover:bg-[#FEEFDD] dark:bg-amber-955/20 dark:hover:bg-amber-950/45 border border-[#FED7AA]/30 hover:border-[#F59E0B] rounded-lg text-slate-700 dark:text-slate-200 font-mono font-bold text-xs cursor-pointer transition-all shadow-xs ${
            isOpen ? 'border-[#F59E0B] ring-2 ring-orange-500/10' : ''
          }`}
          id="global-date-picker-button"
        >
          <Calendar className="h-4 w-4 text-[#F59E0B]" />
          <span>📅 {formatISTDateToDDMMYYYY(selectedDate)} ({getDayName().slice(0, 3)})</span>
        </button>

        {/* Floating Calendar Dropdown Popup */}
        {isOpen && (
          <div
            className={`absolute right-0 mt-2 p-4 w-72 rounded-2xl shadow-2xl border transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
              darkTheme
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-slate-100 text-slate-800'
            }`}
            id="calendar-popup-box"
          >
            {/* Header: Month & Year Picker */}
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={handlePrevMonth}
                type="button"
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  darkTheme
                    ? 'border-slate-850 hover:bg-slate-800'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-sm">
                {months[viewMonth]} {viewYear}
              </span>
              <button
                onClick={handleNextMonth}
                type="button"
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  darkTheme
                    ? 'border-slate-850 hover:bg-slate-800'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono font-bold text-[10px] text-slate-400 mb-2">
              {daysOfWeek.map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {gridCells}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleSetToday}
                type="button"
                className="px-3 py-1.5 text-[11px] font-bold text-[#F59E0B] bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <CornerDownLeft className="h-3 w-3" /> Today
              </button>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step Right (Next Day) Button */}
      <button
        onClick={() => handleStepDay(1)}
        type="button"
        className="h-[34px] px-2.5 rounded-lg border border-[#FED7AA]/30 bg-[#FFF8F1] hover:bg-[#FEEFDD] dark:bg-amber-955/20 dark:hover:bg-amber-950/45 text-[#F59E0B] hover:text-[#D97706] transition-colors flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
        title="Next Day"
      >
        <span className="hidden xl:inline mr-0.5">Next Day</span>
        <ChevronRight className="h-4 w-4 shrink-0 ml-0.5" />
      </button>

      {/* Quick Today Button */}
      <button
        onClick={(e) => {
          const todayStr = getISTDateString();
          onChange(todayStr);
        }}
        type="button"
        className="h-[34px] px-2.5 rounded-lg border border-[#FED7AA]/30 bg-[#FFF8F1] hover:bg-[#FEEFDD] dark:bg-amber-955/20 dark:hover:bg-amber-950/45 text-[#F59E0B] hover:text-[#D97706] transition-colors flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
        title="Go to Today"
      >
        Today
      </button>
    </div>
  );
}
