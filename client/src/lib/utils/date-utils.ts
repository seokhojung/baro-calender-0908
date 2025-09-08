import * as React from 'react';
import {
  format,
  parse,
  isValid,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isWithinInterval,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  getDay,
  getWeek,
  getMonth,
  getYear,
  getDaysInMonth,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  parseISO,
  formatISO,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  isToday,
  isBefore,
  isAfter,
  min as minDate,
  max as maxDate
} from 'date-fns';
import { ViewMode } from '@/types/store';

/**
 * CalendarDateUtils provides comprehensive date calculation utilities
 * for calendar operations with support for different view modes and preferences
 */
export class CalendarDateUtils {
  private weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday

  constructor(weekStartsOn: 0 | 1 = 0) {
    this.weekStartsOn = weekStartsOn;
  }

  /**
   * Set week start preference
   */
  setWeekStartsOn(day: 0 | 1) {
    this.weekStartsOn = day;
  }

  /**
   * Get the date range for a specific view mode and date
   */
  getDateRangeForView(date: Date, viewMode: ViewMode): { start: Date; end: Date } {
    switch (viewMode) {
      case 'day':
        return {
          start: startOfDay(date),
          end: endOfDay(date)
        };
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: this.weekStartsOn }),
          end: endOfWeek(date, { weekStartsOn: this.weekStartsOn })
        };
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        };
      case 'year':
        return {
          start: startOfYear(date),
          end: endOfYear(date)
        };
      default:
        throw new Error(`Unsupported view mode: ${viewMode}`);
    }
  }

  /**
   * Get calendar grid days for month view (includes previous/next month days)
   * Always returns 42 days (6 weeks) for consistent grid layout
   */
  getMonthViewDays(date: Date): Date[] {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: this.weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: this.weekStartsOn });
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Ensure we always have 42 days (6 weeks)
    while (days.length < 42) {
      const lastDay = days[days.length - 1];
      days.push(addDays(lastDay, 1));
    }
    
    return days;
  }

  /**
   * Get week days for week view
   */
  getWeekViewDays(date: Date): Date[] {
    const weekStart = startOfWeek(date, { weekStartsOn: this.weekStartsOn });
    const weekEnd = endOfWeek(date, { weekStartsOn: this.weekStartsOn });
    
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }

  /**
   * Get months for year view
   */
  getYearViewMonths(date: Date): Date[] {
    const yearStart = startOfYear(date);
    return eachMonthOfInterval({ 
      start: yearStart, 
      end: endOfYear(date) 
    });
  }

  /**
   * Navigate to next period based on view mode
   */
  navigateNext(date: Date, viewMode: ViewMode): Date {
    switch (viewMode) {
      case 'day':
        return addDays(date, 1);
      case 'week':
        return addWeeks(date, 1);
      case 'month':
        return addMonths(date, 1);
      case 'year':
        return addYears(date, 1);
      default:
        return date;
    }
  }

  /**
   * Navigate to previous period based on view mode
   */
  navigatePrevious(date: Date, viewMode: ViewMode): Date {
    switch (viewMode) {
      case 'day':
        return subDays(date, 1);
      case 'week':
        return subWeeks(date, 1);
      case 'month':
        return subMonths(date, 1);
      case 'year':
        return subYears(date, 1);
      default:
        return date;
    }
  }

  /**
   * Navigate to today
   */
  navigateToday(): Date {
    return new Date();
  }

  /**
   * Check if a date is in the current view period
   */
  isDateInView(date: Date, viewDate: Date, viewMode: ViewMode): boolean {
    switch (viewMode) {
      case 'day':
        return isSameDay(date, viewDate);
      case 'week':
        return isSameWeek(date, viewDate, { weekStartsOn: this.weekStartsOn });
      case 'month':
        return isSameMonth(date, viewDate);
      case 'year':
        return isSameYear(date, viewDate);
      default:
        return false;
    }
  }

  /**
   * Get time slots for day/week view (24 hours in 30-minute intervals)
   */
  getTimeSlots(intervalMinutes: number = 30): Array<{ time: string; hour: number; minutes: number }> {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
        const timeString = format(setMinutes(setHours(new Date(), hour), minutes), 'HH:mm');
        slots.push({
          time: timeString,
          hour,
          minutes
        });
      }
    }
    return slots;
  }

  /**
   * Calculate event positioning for time-based views
   */
  calculateEventPosition(
    startDate: Date,
    endDate: Date,
    dayStart: Date = startOfDay(startDate)
  ): { top: number; height: number } {
    const minutesInDay = 24 * 60;
    const pixelsPerMinute = 100 / 60; // Assuming 100px per hour
    
    const startMinutes = differenceInMinutes(startDate, dayStart);
    const durationMinutes = differenceInMinutes(endDate, startDate);
    
    return {
      top: Math.max(0, startMinutes * pixelsPerMinute),
      height: Math.max(20, durationMinutes * pixelsPerMinute) // Minimum 20px height
    };
  }

  /**
   * Check if events overlap
   */
  eventsOverlap(event1: { startDate: Date; endDate: Date }, event2: { startDate: Date; endDate: Date }): boolean {
    return (
      isBefore(event1.startDate, event2.endDate) && 
      isAfter(event1.endDate, event2.startDate)
    );
  }

  /**
   * Group overlapping events for layout calculation
   */
  groupOverlappingEvents(events: Array<{ id: string; startDate: Date; endDate: Date }>): Array<Array<{ id: string; startDate: Date; endDate: Date }>> {
    const groups: Array<Array<{ id: string; startDate: Date; endDate: Date }>> = [];
    const processedEvents = new Set<string>();
    
    events.forEach(event => {
      if (processedEvents.has(event.id)) return;
      
      const group = [event];
      processedEvents.add(event.id);
      
      // Find all overlapping events
      events.forEach(otherEvent => {
        if (
          !processedEvents.has(otherEvent.id) && 
          this.eventsOverlap(event, otherEvent)
        ) {
          group.push(otherEvent);
          processedEvents.add(otherEvent.id);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  }

  /**
   * Format date for display
   */
  formatForDisplay(date: Date, formatString: string): string {
    return format(date, formatString);
  }

  /**
   * Format date for API
   */
  formatForAPI(date: Date): string {
    return formatISO(date);
  }

  /**
   * Parse API date string
   */
  parseFromAPI(dateString: string): Date {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    return parsed;
  }

  /**
   * Get relative date string (Today, Yesterday, Tomorrow, etc.)
   */
  getRelativeDateString(date: Date): string {
    if (isToday(date)) {
      return 'Today';
    }
    
    const yesterday = subDays(new Date(), 1);
    if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    }
    
    const tomorrow = addDays(new Date(), 1);
    if (isSameDay(date, tomorrow)) {
      return 'Tomorrow';
    }
    
    // Return formatted date for other cases
    const daysDiff = differenceInDays(date, new Date());
    if (daysDiff > 0 && daysDiff <= 7) {
      return format(date, 'EEEE'); // Day name
    }
    
    return format(date, 'MMM d, yyyy');
  }

  /**
   * Get view mode title (e.g., "January 2024", "Week of Jan 15, 2024")
   */
  getViewModeTitle(date: Date, viewMode: ViewMode): string {
    switch (viewMode) {
      case 'day':
        return format(date, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(date, { weekStartsOn: this.weekStartsOn });
        const weekEnd = endOfWeek(date, { weekStartsOn: this.weekStartsOn });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(date, 'MMMM yyyy');
      case 'year':
        return format(date, 'yyyy');
      default:
        return format(date, 'MMMM yyyy');
    }
  }

  /**
   * Utility functions for common date operations
   */
  static readonly utils = {
    isValid,
    isToday,
    isSameDay,
    isSameWeek,
    isSameMonth,
    isSameYear,
    isWithinInterval,
    isBefore,
    isAfter,
    minDate,
    maxDate,
    format,
    parse,
    parseISO,
    formatISO,
    startOfDay,
    endOfDay,
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    subDays,
    subWeeks,
    subMonths,
    subYears
  };
}

/**
 * Default instance with Sunday start
 */
export const defaultDateUtils = new CalendarDateUtils(0);

/**
 * Convenience hooks for common operations
 */
export const useDateUtils = (weekStartsOn: 0 | 1 = 0) => {
  return React.useMemo(() => new CalendarDateUtils(weekStartsOn), [weekStartsOn]);
};

export default CalendarDateUtils;