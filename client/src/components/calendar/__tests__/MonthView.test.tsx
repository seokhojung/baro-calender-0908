import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { format } from 'date-fns';
import MonthView from '../MonthView';
import { CalendarProvider } from '@/components/providers/calendar-provider';
import { Event, Project } from '@/types/store';

// Mock the calendar provider and stores
jest.mock('@/components/providers/calendar-provider', () => ({
  useCalendar: () => ({
    store: {
      currentDate: new Date('2024-01-15'),
      viewMode: 'month',
      selectedDate: null,
      events: mockEvents,
      selectedEventId: null,
      isLoading: false,
      error: null,
      setSelectedDate: jest.fn(),
      setSelectedEventId: jest.fn(),
      updateEvent: jest.fn().mockResolvedValue(undefined),
    },
    selectors: {
      getEventsForDate: jest.fn(() => []),
      getEventsForDateRange: jest.fn(() => mockEvents),
    },
    dateUtils: {
      getMonthViewDays: jest.fn(() => {
        // Return a mock month grid (January 2024)
        const days: Date[] = [];
        for (let i = 1; i <= 31; i++) {
          days.push(new Date(2024, 0, i));
        }
        return days;
      }),
    },
    isReady: true,
  }),
  CalendarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/stores/projectStore', () => ({
  useProjectStore: () => ({
    projects: mockProjects,
  }),
}));

// Mock react-dnd
jest.mock('react-dnd', () => ({
  useDrop: () => [{ isOver: false }, React.createRef()],
  useDrag: () => [{ isDragging: false }, React.createRef()],
}));

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team standup',
    startDate: new Date('2024-01-15T09:00:00'),
    endDate: new Date('2024-01-15T10:00:00'),
    allDay: false,
    color: '#3b82f6',
    category: 'work',
  },
  {
    id: '2',
    title: 'All Day Event',
    description: 'Conference day',
    startDate: new Date('2024-01-16T00:00:00'),
    endDate: new Date('2024-01-16T23:59:59'),
    allDay: true,
    color: '#10b981',
    category: 'conference',
  },
];

const mockProjects: Project[] = [
  {
    id: 'work',
    name: 'Work Project',
    color: '#3b82f6',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      defaultDuration: 60,
      defaultReminders: [15],
      allowOverlap: true,
    },
  },
];

describe('MonthView', () => {
  const defaultProps = {
    onEventEdit: jest.fn(),
    onEventDelete: jest.fn(),
    onEventCreate: jest.fn(),
    onEventSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the month view with calendar grid', () => {
    render(<MonthView {...defaultProps} />);
    
    // Check for weekday headers
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('displays events in the calendar grid', () => {
    render(<MonthView {...defaultProps} />);
    
    // Check for events in the calendar
    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    expect(screen.getByText('All Day Event')).toBeInTheDocument();
  });

  it('handles day click to select date', () => {
    const mockSetSelectedDate = jest.fn();
    
    // Mock the calendar hook to return our spy
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        currentDate: new Date('2024-01-15'),
        selectedDate: null,
        events: mockEvents,
        selectedEventId: null,
        isLoading: false,
        error: null,
        setSelectedDate: mockSetSelectedDate,
      },
      selectors: {
        getEventsForDate: jest.fn(() => []),
      },
      dateUtils: {
        getMonthViewDays: jest.fn(() => [new Date('2024-01-15')]),
      },
      isReady: true,
    });

    render(<MonthView {...defaultProps} />);
    
    // Find and click on a day
    const dayCell = screen.getByText('15');
    fireEvent.click(dayCell.closest('[role="button"], div[class*="cursor-pointer"]') || dayCell);
    
    expect(mockSetSelectedDate).toHaveBeenCalled();
  });

  it('shows loading state when not ready', () => {
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      isReady: false,
      store: {},
      selectors: {},
      dateUtils: {},
    });

    render(<MonthView {...defaultProps} />);
    
    expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
  });

  it('handles event overflow with "show more" functionality', () => {
    // Create many events for a single day to test overflow
    const manyEvents: Event[] = Array.from({ length: 5 }, (_, i) => ({
      id: `event-${i}`,
      title: `Event ${i + 1}`,
      startDate: new Date('2024-01-15T09:00:00'),
      endDate: new Date('2024-01-15T10:00:00'),
      allDay: false,
      color: '#3b82f6',
    }));

    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        currentDate: new Date('2024-01-15'),
        events: manyEvents,
        selectedEventId: null,
        isLoading: false,
        error: null,
        setSelectedDate: jest.fn(),
      },
      selectors: {
        getEventsForDate: jest.fn(() => manyEvents),
      },
      dateUtils: {
        getMonthViewDays: jest.fn(() => [new Date('2024-01-15')]),
      },
      isReady: true,
    });

    render(<MonthView {...defaultProps} />);
    
    // Should show "more" button for overflow events
    expect(screen.getByText(/\+\d+ more/)).toBeInTheDocument();
  });

  it('applies project colors to events', () => {
    render(<MonthView {...defaultProps} />);
    
    // The event cards should have the project colors applied
    const eventCard = screen.getByText('Team Meeting').closest('div');
    expect(eventCard).toHaveStyle('border-left: 3px solid #3b82f6');
  });

  it('highlights today\'s date', () => {
    const today = new Date();
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        currentDate: today,
        events: [],
        selectedEventId: null,
        isLoading: false,
        error: null,
        setSelectedDate: jest.fn(),
      },
      selectors: {
        getEventsForDate: jest.fn(() => []),
      },
      dateUtils: {
        getMonthViewDays: jest.fn(() => [today]),
      },
      isReady: true,
    });

    render(<MonthView {...defaultProps} />);
    
    // Today's date should have special styling
    const todayElement = screen.getByText(format(today, 'd'));
    expect(todayElement).toHaveClass('bg-blue-500', 'text-white');
  });
});