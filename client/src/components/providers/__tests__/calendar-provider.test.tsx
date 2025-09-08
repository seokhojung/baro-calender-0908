import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { CalendarProvider, useCalendar, useCalendarOptional } from '../calendar-provider';
import useCalendarStore from '@/stores/calendarStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';

// Mock the stores
jest.mock('@/stores/calendarStore', () => ({
  __esModule: true,
  default: jest.fn(),
  useCalendarSelectors: jest.fn()
}));

jest.mock('@/stores/projectStore', () => ({
  useProjectStore: jest.fn()
}));

jest.mock('@/stores/userStore', () => ({
  useUserStore: jest.fn()
}));

// Mock the date utils
jest.mock('@/lib/utils/date-utils', () => ({
  CalendarDateUtils: jest.fn().mockImplementation(() => ({
    setWeekStartsOn: jest.fn(),
    getDateRangeForView: jest.fn().mockReturnValue({
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    })
  }))
}));

const mockCalendarStore = {
  currentDate: new Date('2024-01-15'),
  viewMode: 'month' as const,
  setCurrentDate: jest.fn(),
  setViewMode: jest.fn(),
  loadEvents: jest.fn().mockResolvedValue(undefined),
  setError: jest.fn()
};

const mockProjectStore = {
  projects: [],
  loadProjects: jest.fn().mockResolvedValue(undefined)
};

const mockUserStore = {
  user: {
    preferences: {
      defaultView: 'week' as const,
      weekStartsOn: 1 as const
    }
  }
};

describe('CalendarProvider', () => {
  beforeEach(() => {
    const { default: mockUseCalendarStore, useCalendarSelectors } = require('@/stores/calendarStore');
    const { useProjectStore: mockUseProjectStore } = require('@/stores/projectStore');
    const { useUserStore: mockUseUserStore } = require('@/stores/userStore');
    
    mockUseCalendarStore.mockReturnValue(mockCalendarStore);
    useCalendarSelectors.mockReturnValue({});
    mockUseProjectStore.mockReturnValue(mockProjectStore);
    mockUseUserStore.mockReturnValue(mockUserStore);
    
    jest.clearAllMocks();
  });

  it('should render children', async () => {
    render(
      <CalendarProvider>
        <div data-testid="child">Test Child</div>
      </CalendarProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should initialize with default date', async () => {
    const initialDate = new Date('2024-02-01');
    
    render(
      <CalendarProvider initialDate={initialDate}>
        <div>Test</div>
      </CalendarProvider>
    );

    await waitFor(() => {
      expect(mockCalendarStore.setCurrentDate).toHaveBeenCalledWith(initialDate);
    });
  });

  it('should apply user preferences on initialization', async () => {
    render(
      <CalendarProvider>
        <div>Test</div>
      </CalendarProvider>
    );

    await waitFor(() => {
      expect(mockCalendarStore.setViewMode).toHaveBeenCalledWith('week');
    });
  });

  it('should auto-load events when enabled', async () => {
    render(
      <CalendarProvider autoLoad={true}>
        <div>Test</div>
      </CalendarProvider>
    );

    await waitFor(() => {
      expect(mockCalendarStore.loadEvents).toHaveBeenCalled();
    });
  });

  it('should not auto-load events when disabled', async () => {
    render(
      <CalendarProvider autoLoad={false}>
        <div>Test</div>
      </CalendarProvider>
    );

    await waitFor(() => {
      expect(mockCalendarStore.loadEvents).not.toHaveBeenCalled();
    });
  });

  it('should load projects if none exist', async () => {
    render(
      <CalendarProvider>
        <div>Test</div>
      </CalendarProvider>
    );

    await waitFor(() => {
      expect(mockProjectStore.loadProjects).toHaveBeenCalled();
    });
  });

  it('should not load projects if they already exist', async () => {
    (useProjectStore as jest.Mock).mockReturnValue({
      ...mockProjectStore,
      projects: [{ id: 1, name: 'Test Project' }]
    });

    render(
      <CalendarProvider>
        <div>Test</div>
      </CalendarProvider>
    );

    await waitFor(() => {
      expect(mockProjectStore.loadProjects).not.toHaveBeenCalled();
    });
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockCalendarStore.loadEvents.mockRejectedValueOnce(new Error('Load failed'));

    render(
      <CalendarProvider>
        <div>Test</div>
      </CalendarProvider>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize calendar:',
        expect.any(Error)
      );
      expect(mockCalendarStore.setError).toHaveBeenCalledWith('Load failed');
    });

    consoleErrorSpy.mockRestore();
  });
});

describe('useCalendar hook', () => {
  it('should provide calendar context', () => {
    const TestComponent = () => {
      const calendar = useCalendar();
      return (
        <div data-testid="store-ready">
          {calendar.isReady ? 'ready' : 'loading'}
        </div>
      );
    };

    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );

    // Initially should be loading, then become ready
    expect(screen.getByTestId('store-ready')).toBeInTheDocument();
  });

  it('should throw error when used outside provider', () => {
    const TestComponent = () => {
      useCalendar();
      return <div>Test</div>;
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useCalendar must be used within a CalendarProvider');

    consoleErrorSpy.mockRestore();
  });
});

describe('useCalendarOptional hook', () => {
  it('should return null when used outside provider', () => {
    const TestComponent = () => {
      const calendar = useCalendarOptional();
      return (
        <div data-testid="calendar-state">
          {calendar ? 'has-calendar' : 'no-calendar'}
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByTestId('calendar-state')).toHaveTextContent('no-calendar');
  });

  it('should return calendar context when inside provider', () => {
    const TestComponent = () => {
      const calendar = useCalendarOptional();
      return (
        <div data-testid="calendar-state">
          {calendar ? 'has-calendar' : 'no-calendar'}
        </div>
      );
    };

    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );

    expect(screen.getByTestId('calendar-state')).toHaveTextContent('has-calendar');
  });
});

describe('Calendar Provider Integration', () => {
  it('should reload events when current date changes', async () => {
    const TestComponent = () => {
      const { store } = useCalendar();
      
      React.useEffect(() => {
        // Simulate date change after component mounts
        setTimeout(() => {
          act(() => {
            store.setCurrentDate(new Date('2024-02-15'));
          });
        }, 100);
      }, [store]);

      return <div>Test</div>;
    };

    render(
      <CalendarProvider autoLoad={true}>
        <TestComponent />
      </CalendarProvider>
    );

    // Should be called initially and then again when date changes
    await waitFor(() => {
      expect(mockCalendarStore.loadEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('should reload events when view mode changes', async () => {
    const TestComponent = () => {
      const { store } = useCalendar();
      
      React.useEffect(() => {
        // Simulate view mode change after component mounts
        setTimeout(() => {
          act(() => {
            store.setViewMode('day');
          });
        }, 100);
      }, [store]);

      return <div>Test</div>;
    };

    render(
      <CalendarProvider autoLoad={true}>
        <TestComponent />
      </CalendarProvider>
    );

    // Should be called initially and then again when view mode changes
    await waitFor(() => {
      expect(mockCalendarStore.loadEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('should provide date utils with correct week start preference', async () => {
    const TestComponent = () => {
      const { dateUtils } = useCalendar();
      return (
        <div data-testid="date-utils">
          {dateUtils ? 'has-utils' : 'no-utils'}
        </div>
      );
    };

    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );

    expect(screen.getByTestId('date-utils')).toHaveTextContent('has-utils');
  });
});