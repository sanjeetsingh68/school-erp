/**
 * Centralized, timezone-aware date/time utilities for Asia/Kolkata (IST).
 */

/**
 * Returns a live string representation of the current system time in IST (Asia/Kolkata).
 * Format example: "16 Jul 2026 10:42:35 AM"
 */
export function formatISTClock(date: Date = new Date()): string {
  // Use "en-GB" or manual mapping to ensure day-of-month short-month-name year sequence
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  
  // Format matching: "16 Jul 2026 10:42:35 AM"
  // Note: some environments output "AM"/"PM" or "am"/"pm". Standardize to uppercase.
  const day = partMap.day;
  const month = partMap.month;
  const year = partMap.year;
  const hour = partMap.hour;
  const minute = partMap.minute;
  const second = partMap.second;
  const dayPeriod = (partMap.dayPeriod || '').toUpperCase();

  return `${day} ${month} ${year} ${hour}:${minute}:${second} ${dayPeriod}`;
}

/**
 * Returns the current date in Asia/Kolkata timezone in YYYY-MM-DD format.
 */
export function getISTDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

/**
 * Formats a YYYY-MM-DD date string to DD-MM-YYYY format.
 * Example: "2026-07-16" -> "16-07-2026"
 */
export function formatISTDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const resParts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(resParts.map(p => [p.type, p.value]));
  return `${partMap.day}-${partMap.month}-${partMap.year}`;
}

/**
 * Returns the weekday name (e.g. "Monday") for a date in Asia/Kolkata timezone.
 */
export function getISTDayName(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // Construct local Date to avoid timezone shift on plain date strings
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  });
}
