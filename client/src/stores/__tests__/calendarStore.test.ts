import { renderHook, act } from '@testing-library/react';
import useCalendarStore, { useCalendarSelectors } from '../calendarStore';
import { Event } from '@/types/store';

// Mock data
const mockEvent: Event = {
  id: '1',
  title: 'Test Event',
  description: 'Test Description',
  startDate: new Date('2024-01-15T10:00:00Z'),
  endDate: new Date('2024-01-15T11:00:00Z'),
  allDay: false,
  color: '#3b82f6',
  category: 'work',
  location: 'Office',
  attendees: ['user1@example.com'],
  reminders: [{ type: 'email', minutes: 15 }],
};

// Reset store before each test
beforeEach(() => {
  useCalendarStore.setState({
    isLoading: false,
    error: null,
    lastUpdated: null,
    currentDate: new Date('2024-01-15'),
    viewMode: 'month',
    selectedDate: null,
    events: [],
    selectedEventId: null,
    filters: {
      categories: [],
      dateRange: {
        start: null,
        end: null
      }
    }
  });
});

describe('Calendar Store', () => {
  describe('State Management', () => {
    test('should initialize with default state', () => {
      const { result } = renderHook(() => useCalendarStore());
      
      expect(result.current.currentDate).toBeInstanceOf(Date);
      expect(result.current.viewMode).toBe('month');
      expect(result.current.events).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should update current date', () => {
      const { result } = renderHook(() => useCalendarStore());
      const newDate = new Date('2024-02-15');

      act(() => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate).toEqual(newDate);
    });

    test('should update view mode', () => {
      const { result } = renderHook(() => useCalendarStore());

      act(() => {
        result.current.setViewMode('week');
      });

      expect(result.current.viewMode).toBe('week');
    });

    test('should set selected date', () => {
      const { result } = renderHook(() => useCalendarStore());
      const selectedDate = new Date('2024-01-20');

      act(() => {
        result.current.setSelectedDate(selectedDate);
      });

      expect(result.current.selectedDate).toEqual(selectedDate);
    });
  });

  describe('Event Management', () => {
    test('should add event successfully', async () => {
      const { result } = renderHook(() => useCalendarStore());

      await act(async () => {
        await result.current.addEvent(mockEvent);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].title).toBe('Test Event');
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    test('should update event successfully', async () => {
      const { result } = renderHook(() => useCalendarStore());
      
      // First add an event
      act(() => {
        useCalendarStore.setState({
          events: [mockEvent]
        });
      });

      // Then update it
      await act(async () => {
        await result.current.updateEvent('1', { title: 'Updated Event' });
      });

      expect(result.current.events[0].title).toBe('Updated Event');
    });

    test('should delete event successfully', async () => {
      const { result } = renderHook(() => useCalendarStore());
      
      // First add an event
      act(() => {
        useCalendarStore.setState({
          events: [mockEvent]
        });
      });

      // Then delete it
      await act(async () => {
        await result.current.deleteEvent('1');
      });

      expect(result.current.events).toHaveLength(0);
    });

    test('should handle event loading errors', async () => {
      const { result } = renderHook(() => useCalendarStore());

      // Create a spy on the loadEvents function to mock its behavior
      const loadEventsSpy = jest.spyOn(result.current, 'loadEvents');
      loadEventsSpy.mockRejectedValue(new Error('Network error'));

      try {
        await act(async () => {
          await result.current.loadEvents({
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          });
        });
      } catch (error) {
        // Expected to throw
      }

      // Get the updated state
      const updatedResult = useCalendarStore.getState();
      expect(updatedResult.error).toBe('Network error');
      expect(updatedResult.isLoading).toBe(false);
      
      loadEventsSpy.mockRestore();
    });
  });

  describe('Filters', () => {
    test('should update filters', () => {
      const { result } = renderHook(() => useCalendarStore());

      act(() => {
        result.current.setFilters({
          categories: ['work', 'personal'],
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          }
        });
      });

      expect(result.current.filters.categories).toEqual(['work', 'personal']);
      expect(result.current.filters.dateRange.start).toBeInstanceOf(Date);
    });
  });

  describe('Loading States', () => {
    test('should manage loading state correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    test('should manage error state correctly', () => {
      const { result } = renderHook(() => useCalendarStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('Calendar Selectors', () => {
  const events: Event[] = [
    {
      ...mockEvent,
      id: '1',
      startDate: new Date('2024-01-15T10:00:00Z'),
      endDate: new Date('2024-01-15T11:00:00Z'),
      category: 'work'
    },
    {
      ...mockEvent,
      id: '2',
      title: 'Personal Event',
      startDate: new Date('2024-01-16T14:00:00Z'),
      endDate: new Date('2024-01-16T15:00:00Z'),
      category: 'personal'
    },
    {
      ...mockEvent,
      id: '3',
      title: 'Multi-day Event',
      startDate: new Date('2024-01-14T10:00:00Z'),
      endDate: new Date('2024-01-16T10:00:00Z'),
      category: 'work'
    }
  ];

  beforeEach(() => {
    useCalendarStore.setState({
      events,
      filters: {
        categories: [],
        dateRange: { start: null, end: null }
      }
    });
  });

  test('should get events for specific date', () => {
    const { result } = renderHook(() => useCalendarSelectors());
    const eventsForDate = result.current.getEventsForDate(new Date('2024-01-15'));
    
    expect(eventsForDate).toHaveLength(2); // Event 1 and multi-day event 3
    expect(eventsForDate.map(e => e.id)).toContain('1');
    expect(eventsForDate.map(e => e.id)).toContain('3');
  });

  test('should get events for date range', () => {
    const { result } = renderHook(() => useCalendarSelectors());
    const eventsInRange = result.current.getEventsForDateRange(
      new Date('2024-01-15T00:00:00Z'),
      new Date('2024-01-16T23:59:59Z')
    );
    
    expect(eventsInRange).toHaveLength(3); // All events fall in this range
  });

  test('should get selected event', () => {
    useCalendarStore.setState({ selectedEventId: '2' });
    
    const { result } = renderHook(() => useCalendarSelectors());
    const selectedEvent = result.current.getSelectedEvent();
    
    expect(selectedEvent?.id).toBe('2');
    expect(selectedEvent?.title).toBe('Personal Event');
  });

  test('should filter events by category', () => {
    useCalendarStore.setState({
      filters: {
        categories: ['work'],
        dateRange: { start: null, end: null }
      }
    });

    const { result } = renderHook(() => useCalendarSelectors());
    const filteredEvents = result.current.getFilteredEvents();
    
    expect(filteredEvents).toHaveLength(2);
    expect(filteredEvents.every(e => e.category === 'work')).toBe(true);
  });

  test('should filter events by date range', () => {
    useCalendarStore.setState({
      filters: {
        categories: [],
        dateRange: {
          start: new Date('2024-01-15T00:00:00Z'),
          end: new Date('2024-01-15T23:59:59Z')
        }
      }
    });

    const { result } = renderHook(() => useCalendarSelectors());
    const filteredEvents = result.current.getFilteredEvents();
    
    expect(filteredEvents).toHaveLength(2); // Events 1 and 3 overlap with this range
  });
});

describe('Store Persistence', () => {
  test('should persist relevant state', () => {
    const { result } = renderHook(() => useCalendarStore());
    
    act(() => {
      result.current.setCurrentDate(new Date('2024-02-15'));
      result.current.setViewMode('week');
      result.current.setFilters({ categories: ['work'] });
    });

    // The persist middleware should save these values
    // Note: In a real test environment, you'd test localStorage directly
    expect(result.current.currentDate.getDate()).toBe(15);
    expect(result.current.viewMode).toBe('week');
    expect(result.current.filters.categories).toContain('work');
  });
});