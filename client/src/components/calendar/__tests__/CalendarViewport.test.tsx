import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarViewport from '../CalendarViewport';

// Mock the calendar provider
jest.mock('@/components/providers/calendar-provider', () => ({
  useCalendar: () => ({
    store: {
      viewMode: 'month',
      isLoading: false,
      error: null,
    },
    isReady: true,
  }),
}));

// Mock react-dnd
jest.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-provider">{children}</div>,
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

// Mock the view components
jest.mock('../MonthView', () => {
  return function MockMonthView() {
    return <div data-testid="month-view">Month View</div>;
  };
});

describe('CalendarViewport', () => {
  const defaultProps = {
    onEventEdit: jest.fn(),
    onEventDelete: jest.fn(),
    onEventCreate: jest.fn(),
    onEventSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the DndProvider wrapper', () => {
    render(<CalendarViewport {...defaultProps} />);
    
    expect(screen.getByTestId('dnd-provider')).toBeInTheDocument();
  });

  it('renders MonthView when viewMode is month', () => {
    render(<CalendarViewport {...defaultProps} />);
    
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
    expect(screen.getByText('Month View')).toBeInTheDocument();
  });

  it('renders WeekView when viewMode is week', () => {
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        viewMode: 'week',
        isLoading: false,
        error: null,
      },
      isReady: true,
    });

    render(<CalendarViewport {...defaultProps} />);
    
    expect(screen.getByText('Week View - Coming Soon')).toBeInTheDocument();
  });

  it('renders DayView when viewMode is day', () => {
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        viewMode: 'day',
        isLoading: false,
        error: null,
      },
      isReady: true,
    });

    render(<CalendarViewport {...defaultProps} />);
    
    expect(screen.getByText('Day View - Coming Soon')).toBeInTheDocument();
  });

  it('renders YearView when viewMode is year', () => {
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        viewMode: 'year',
        isLoading: false,
        error: null,
      },
      isReady: true,
    });

    render(<CalendarViewport {...defaultProps} />);
    
    expect(screen.getByText('Year View - Coming Soon')).toBeInTheDocument();
  });

  it('shows loading state when not ready', () => {
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        viewMode: 'month',
        isLoading: false,
        error: null,
      },
      isReady: false,
    });

    render(<CalendarViewport {...defaultProps} />);
    
    expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
  });

  it('defaults to MonthView for unknown viewMode', () => {
    const useCalendarSpy = jest.spyOn(require('@/components/providers/calendar-provider'), 'useCalendar');
    useCalendarSpy.mockReturnValue({
      store: {
        viewMode: 'unknown' as any,
        isLoading: false,
        error: null,
      },
      isReady: true,
    });

    render(<CalendarViewport {...defaultProps} />);
    
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
  });

  it('passes props to view components', () => {
    const mockProps = {
      onEventEdit: jest.fn(),
      onEventDelete: jest.fn(),
      onEventCreate: jest.fn(),
      onEventSelect: jest.fn(),
      className: 'custom-class',
    };

    render(<CalendarViewport {...mockProps} />);
    
    // The view should receive the props (we can't directly test prop passing with current setup,
    // but we can verify the component renders without errors)
    expect(screen.getByTestId('month-view')).toBeInTheDocument();
  });
});