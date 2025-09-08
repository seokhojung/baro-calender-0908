import { CalendarDateUtils } from '../date-utils';

describe('CalendarDateUtils', () => {
  let dateUtils: CalendarDateUtils;

  beforeEach(() => {
    dateUtils = new CalendarDateUtils(0); // Sunday start
  });

  describe('initialization', () => {
    it('should initialize with Sunday start by default', () => {
      const utils = new CalendarDateUtils();
      expect(utils).toBeInstanceOf(CalendarDateUtils);
    });

    it('should initialize with Monday start when specified', () => {
      const utils = new CalendarDateUtils(1);
      expect(utils).toBeInstanceOf(CalendarDateUtils);
    });
  });

  describe('getDateRangeForView', () => {
    const testDate = new Date('2024-01-15'); // Monday

    it('should return correct range for day view', () => {
      const range = dateUtils.getDateRangeForView(testDate, 'day');
      
      expect(range.start).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      expect(range.end).toEqual(new Date('2024-01-15T23:59:59.999Z'));
    });

    it('should return correct range for week view with Sunday start', () => {
      const range = dateUtils.getDateRangeForView(testDate, 'week');
      
      // Week should start on Sunday (Jan 14)
      expect(range.start.getDate()).toBe(14);
      expect(range.end.getDate()).toBe(20);
    });

    it('should return correct range for week view with Monday start', () => {
      const mondayUtils = new CalendarDateUtils(1);
      const range = mondayUtils.getDateRangeForView(testDate, 'week');
      
      // Week should start on Monday (Jan 15)
      expect(range.start.getDate()).toBe(15);
      expect(range.end.getDate()).toBe(21);
    });

    it('should return correct range for month view', () => {
      const range = dateUtils.getDateRangeForView(testDate, 'month');
      
      expect(range.start).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(range.end.getMonth()).toBe(0); // January
      expect(range.end.getDate()).toBe(31);
    });

    it('should return correct range for year view', () => {
      const range = dateUtils.getDateRangeForView(testDate, 'year');
      
      expect(range.start).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(range.end.getFullYear()).toBe(2024);
      expect(range.end.getMonth()).toBe(11); // December
    });

    it('should throw error for invalid view mode', () => {
      expect(() => {
        dateUtils.getDateRangeForView(testDate, 'invalid' as any);
      }).toThrow('Unsupported view mode: invalid');
    });
  });

  describe('getMonthViewDays', () => {
    it('should return all days for month view including padding', () => {
      const testDate = new Date('2024-01-15');
      const days = dateUtils.getMonthViewDays(testDate);
      
      // Should return 42 days (6 weeks * 7 days) for complete calendar grid
      expect(days.length).toBe(42);
      
      // First day should be from previous month if month doesn't start on week start
      const firstDay = days[0];
      const lastDay = days[days.length - 1];
      
      expect(firstDay.getTime()).toBeLessThanOrEqual(new Date('2024-01-01').getTime());
      expect(lastDay.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-31').getTime());
    });
  });

  describe('navigation methods', () => {
    const testDate = new Date('2024-01-15');

    it('should navigate to next day', () => {
      const next = dateUtils.navigateNext(testDate, 'day');
      expect(next.getDate()).toBe(16);
    });

    it('should navigate to next week', () => {
      const next = dateUtils.navigateNext(testDate, 'week');
      expect(next.getDate()).toBe(22);
    });

    it('should navigate to next month', () => {
      const next = dateUtils.navigateNext(testDate, 'month');
      expect(next.getMonth()).toBe(1); // February
    });

    it('should navigate to next year', () => {
      const next = dateUtils.navigateNext(testDate, 'year');
      expect(next.getFullYear()).toBe(2025);
    });

    it('should navigate to previous day', () => {
      const prev = dateUtils.navigatePrevious(testDate, 'day');
      expect(prev.getDate()).toBe(14);
    });

    it('should navigate to today', () => {
      const today = dateUtils.navigateToday();
      const now = new Date();
      
      expect(today.toDateString()).toBe(now.toDateString());
    });
  });

  describe('event positioning', () => {
    it('should calculate correct position for events', () => {
      const dayStart = new Date('2024-01-15T00:00:00.000Z');
      const eventStart = new Date('2024-01-15T09:30:00.000Z'); // 9:30 AM
      const eventEnd = new Date('2024-01-15T11:00:00.000Z'); // 11:00 AM
      
      const position = dateUtils.calculateEventPosition(eventStart, eventEnd, dayStart);
      
      // 9.5 hours * (100px/60min) = 950px from top
      expect(position.top).toBe(570); // 9.5 * 60 minutes * (100/60) pixels per minute
      // 1.5 hours duration = 150px height
      expect(position.height).toBe(150); // 1.5 * 60 * (100/60)
    });

    it('should ensure minimum height for short events', () => {
      const dayStart = new Date('2024-01-15T00:00:00.000Z');
      const eventStart = new Date('2024-01-15T09:00:00.000Z');
      const eventEnd = new Date('2024-01-15T09:05:00.000Z'); // 5 minutes
      
      const position = dateUtils.calculateEventPosition(eventStart, eventEnd, dayStart);
      
      expect(position.height).toBe(20); // Minimum height
    });
  });

  describe('event overlap detection', () => {
    const event1 = {
      startDate: new Date('2024-01-15T09:00:00.000Z'),
      endDate: new Date('2024-01-15T10:00:00.000Z')
    };

    it('should detect overlapping events', () => {
      const event2 = {
        startDate: new Date('2024-01-15T09:30:00.000Z'),
        endDate: new Date('2024-01-15T10:30:00.000Z')
      };

      expect(dateUtils.eventsOverlap(event1, event2)).toBe(true);
    });

    it('should detect non-overlapping events', () => {
      const event2 = {
        startDate: new Date('2024-01-15T10:00:00.000Z'),
        endDate: new Date('2024-01-15T11:00:00.000Z')
      };

      expect(dateUtils.eventsOverlap(event1, event2)).toBe(false);
    });

    it('should handle touching events correctly', () => {
      const event2 = {
        startDate: new Date('2024-01-15T10:00:00.000Z'),
        endDate: new Date('2024-01-15T11:00:00.000Z')
      };

      // Events that touch at the boundary should not be considered overlapping
      expect(dateUtils.eventsOverlap(event1, event2)).toBe(false);
    });
  });

  describe('view mode titles', () => {
    const testDate = new Date('2024-01-15');

    it('should return correct title for day view', () => {
      const title = dateUtils.getViewModeTitle(testDate, 'day');
      expect(title).toContain('Monday');
      expect(title).toContain('January');
      expect(title).toContain('15');
      expect(title).toContain('2024');
    });

    it('should return correct title for week view', () => {
      const title = dateUtils.getViewModeTitle(testDate, 'week');
      expect(title).toContain('Jan');
      expect(title).toContain('2024');
    });

    it('should return correct title for month view', () => {
      const title = dateUtils.getViewModeTitle(testDate, 'month');
      expect(title).toBe('January 2024');
    });

    it('should return correct title for year view', () => {
      const title = dateUtils.getViewModeTitle(testDate, 'year');
      expect(title).toBe('2024');
    });
  });

  describe('time slot generation', () => {
    it('should generate correct number of 30-minute slots', () => {
      const slots = dateUtils.getTimeSlots(30);
      expect(slots).toHaveLength(48); // 24 hours * 2 slots per hour
    });

    it('should generate correct number of 15-minute slots', () => {
      const slots = dateUtils.getTimeSlots(15);
      expect(slots).toHaveLength(96); // 24 hours * 4 slots per hour
    });

    it('should format time slots correctly', () => {
      const slots = dateUtils.getTimeSlots(30);
      expect(slots[0]).toEqual({ time: '00:00', hour: 0, minutes: 0 });
      expect(slots[1]).toEqual({ time: '00:30', hour: 0, minutes: 30 });
      expect(slots[2]).toEqual({ time: '01:00', hour: 1, minutes: 0 });
    });
  });

  describe('relative date strings', () => {
    beforeAll(() => {
      // Mock current date for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return "Today" for current date', () => {
      const today = new Date('2024-01-15');
      expect(dateUtils.getRelativeDateString(today)).toBe('Today');
    });

    it('should return "Yesterday" for previous day', () => {
      const yesterday = new Date('2024-01-14');
      expect(dateUtils.getRelativeDateString(yesterday)).toBe('Yesterday');
    });

    it('should return "Tomorrow" for next day', () => {
      const tomorrow = new Date('2024-01-16');
      expect(dateUtils.getRelativeDateString(tomorrow)).toBe('Tomorrow');
    });

    it('should return day name for dates within a week', () => {
      const wednesday = new Date('2024-01-17'); // 2 days from Monday
      const result = dateUtils.getRelativeDateString(wednesday);
      expect(result).toBe('Wednesday');
    });

    it('should return formatted date for dates beyond a week', () => {
      const nextWeek = new Date('2024-01-25');
      const result = dateUtils.getRelativeDateString(nextWeek);
      expect(result).toBe('Jan 25, 2024');
    });
  });
});