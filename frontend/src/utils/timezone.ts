/**
 * Timezone utilities for consistent IST handling in frontend
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date/time in IST
 */
export const getISTNow = (): Date => {
  return new Date();
};

/**
 * Parse a date string and ensure it's treated as IST
 */
export const parseISTDate = (dateString: string): Date => {
  // If the date string doesn't have timezone info, treat it as IST
  if (!dateString.includes('T') || (!dateString.includes('+') && !dateString.includes('Z'))) {
    // Add IST offset (+05:30) to the date string
    return new Date(dateString + '+05:30');
  }
  return new Date(dateString);
};

/**
 * Format date in IST for display
 */
export const formatISTDate = (date: Date): string => {
  return date.toLocaleString('en-IN', { 
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Get time difference in milliseconds accounting for IST
 */
export const getTimeDifferenceMs = (startDate: Date, endDate: Date): number => {
  return endDate.getTime() - startDate.getTime();
};
