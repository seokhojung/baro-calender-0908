import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { CalendarStore, Event, ViewMode } from '@/types/store';
import { CalendarAPIClient, CalendarDataTransformer, calendarAPI } from '@/lib/api/calendar-client';
import { CalendarEventTransformed, CreateEventRequest, UpdateEventRequest } from '@/types/api';

const useCalendarStore = create<CalendarStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        isLoading: false,
        error: null,
        lastUpdated: null,
        currentDate: new Date(),
        viewMode: 'month' as ViewMode,
        selectedDate: null,
        events: [],
        selectedEventId: null,
        filters: {
          categories: [],
          dateRange: {
            start: null,
            end: null
          }
        },

        // Actions
        setCurrentDate: (date: Date) => {
          set({ currentDate: date }, false, 'calendar/setCurrentDate');
        },

        setViewMode: (mode: ViewMode) => {
          set({ viewMode: mode }, false, 'calendar/setViewMode');
        },

        setSelectedDate: (date: Date | null) => {
          set({ selectedDate: date }, false, 'calendar/setSelectedDate');
        },

        addEvent: async (eventData: Omit<Event, 'id'>) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // Transform client data to API format
            const apiData = CalendarDataTransformer.clientEventToAPI(
              eventData as CalendarEventTransformed,
              eventData.tenantId || 1, // Default tenant - should come from auth
              eventData.projectId || 1  // Default project - should come from context
            ) as CreateEventRequest;
            
            const response = await calendarAPI.createEvent(apiData);
            
            // Fetch the created event to get full data
            const createdEvent = await calendarAPI.getEvent(response.id);
            const transformedEvent = CalendarDataTransformer.apiEventToClient(createdEvent);
            
            set((state) => ({
              events: [...state.events, transformedEvent as Event],
              lastUpdated: new Date()
            }), false, 'calendar/addEvent');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create event');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        updateEvent: async (id: string, eventData: Partial<Event>) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // Transform client data to API format
            const apiData = CalendarDataTransformer.clientEventToAPI(
              eventData as CalendarEventTransformed,
              eventData.tenantId || 1, // Default tenant - should come from auth
              eventData.projectId || 1  // Default project - should come from context
            ) as UpdateEventRequest;
            
            await calendarAPI.updateEvent(Number(id), apiData);
            
            // Fetch updated event to get full data
            const updatedEvent = await calendarAPI.getEvent(Number(id));
            const transformedEvent = CalendarDataTransformer.apiEventToClient(updatedEvent);
            
            set((state) => ({
              events: state.events.map(event => 
                event.id === id ? transformedEvent as Event : event
              ),
              lastUpdated: new Date()
            }), false, 'calendar/updateEvent');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update event');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        deleteEvent: async (id: string) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await calendarAPI.deleteEvent(Number(id));
            
            set((state) => ({
              events: state.events.filter(event => event.id !== id),
              selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
              lastUpdated: new Date()
            }), false, 'calendar/deleteEvent');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to delete event');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        setSelectedEventId: (id: string | null) => {
          set({ selectedEventId: id }, false, 'calendar/setSelectedEventId');
        },

        setFilters: (filters: Partial<CalendarStore['filters']>) => {
          set((state) => ({
            filters: { ...state.filters, ...filters }
          }), false, 'calendar/setFilters');
        },

        loadEvents: async (dateRange: { start: Date; end: Date }) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // Transform date range to API format
            const { from, to } = CalendarDataTransformer.dateRangeToAPI(dateRange.start, dateRange.end);
            
            // Get events from API
            const response = await calendarAPI.getEvents({
              tenant_id: 1, // Should come from auth context
              project_id: 1, // Should come from current project context
              from,
              to,
              limit: 100 // Load more events for calendar views
            });
            
            // Transform API events to client format
            const transformedEvents = CalendarDataTransformer.transformEventsList(response.events);
            
            set({
              events: transformedEvents as Event[],
              lastUpdated: new Date()
            }, false, 'calendar/loadEvents');
            
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load events');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'calendar/setLoading');
        },

        setError: (error: string | null) => {
          set({ error }, false, 'calendar/setError');
        }
      }),
      {
        name: 'calendar-store',
        version: 1,
        partialize: (state) => ({
          currentDate: state.currentDate,
          viewMode: state.viewMode,
          filters: state.filters,
          // Don't persist events, selectedDate, selectedEventId, loading states
        })
      }
    ),
    {
      name: 'calendar-store'
    }
  )
);

// Selectors
export const useCalendarSelectors = () => {
  const store = useCalendarStore();
  
  return {
    getEventsForDate: (date: Date) => {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      return store.events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        return (
          (eventStart >= dateStart && eventStart <= dateEnd) ||
          (eventEnd >= dateStart && eventEnd <= dateEnd) ||
          (eventStart <= dateStart && eventEnd >= dateEnd)
        );
      });
    },
    
    getEventsForDateRange: (start: Date, end: Date) => {
      return store.events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        return (
          (eventStart >= start && eventStart <= end) ||
          (eventEnd >= start && eventEnd <= end) ||
          (eventStart <= start && eventEnd >= end)
        );
      });
    },
    
    getSelectedEvent: () => {
      return store.events.find(event => event.id === store.selectedEventId) || null;
    },
    
    getFilteredEvents: () => {
      let filteredEvents = [...store.events];
      
      // Filter by categories
      if (store.filters.categories.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          event.category && store.filters.categories.includes(event.category)
        );
      }
      
      // Filter by date range
      if (store.filters.dateRange.start && store.filters.dateRange.end) {
        const { start, end } = store.filters.dateRange;
        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          
          return (
            (eventStart >= start && eventStart <= end) ||
            (eventEnd >= start && eventEnd <= end) ||
            (eventStart <= start && eventEnd >= end)
          );
        });
      }
      
      return filteredEvents;
    }
  };
};

export default useCalendarStore;