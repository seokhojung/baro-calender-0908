import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useCalendar } from '@/components/providers/calendar-provider';
import { useProjectStore } from '@/stores/projectStore';
import { EventSpatialIndex, EventGrouper, CalculationCache } from '@/lib/utils/performance-utils';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { Event, ViewMode } from '@/types/store';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, addDays } from 'date-fns';

/**
 * Performance-optimized calendar hook with spatial indexing and caching
 */
export const useOptimizedCalendar = (viewMode: ViewMode = 'month') => {
  const { store, selectors, dateUtils, isReady } = useCalendar();
  const projectStore = useProjectStore();
  
  // Performance monitoring
  const { metrics } = usePerformanceMonitor(store.events.length, {
    enableMemoryTracking: true,
    componentName: `OptimizedCalendar-${viewMode}`
  });

  // Refs for persistent instances
  const spatialIndexRef = useRef<EventSpatialIndex>();
  const calculationCacheRef = useRef(new CalculationCache<any>(200, 10 * 60 * 1000)); // 10 min TTL
  const lastEventsHashRef = useRef<string>('');

  // Create or update spatial index when events change
  const spatialIndex = useMemo(() => {
    const eventsHash = JSON.stringify(store.events.map(e => ({ id: e.id, startDate: e.startDate, endDate: e.endDate })));
    
    if (!spatialIndexRef.current || eventsHash !== lastEventsHashRef.current) {
      spatialIndexRef.current = new EventSpatialIndex(store.events);
      lastEventsHashRef.current = eventsHash;
      
      // Clear calculation cache when events change
      calculationCacheRef.current.clear();
    }
    
    return spatialIndexRef.current;
  }, [store.events]);

  // Memoized project colors mapping
  const projectColors = useMemo(() => {
    const cacheKey = `projectColors-${projectStore.projects.map(p => p.id + p.color).join(',')}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const colorMap: Record<string, string> = {};
    projectStore.projects.forEach(project => {
      colorMap[project.id] = project.color;
    });
    
    calculationCacheRef.current.set(cacheKey, colorMap);
    return colorMap;
  }, [projectStore.projects]);

  // Optimized filtered events using spatial index
  const getFilteredEvents = useCallback((filters?: {
    categories?: string[];
    projectIds?: string[];
    dateRange?: { start: Date; end: Date };
  }) => {
    const actualFilters = {
      projectIds: filters?.projectIds || (projectStore.selectedProjectIds.length > 0 ? projectStore.selectedProjectIds : undefined),
      categories: filters?.categories,
      dateRange: filters?.dateRange
    };

    const cacheKey = `filteredEvents-${JSON.stringify(actualFilters)}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const filtered = spatialIndex.getFilteredEvents(actualFilters);
    calculationCacheRef.current.set(cacheKey, filtered);
    
    return filtered;
  }, [spatialIndex, projectStore.selectedProjectIds]);

  // Optimized events by date using spatial index
  const getEventsForDate = useCallback((date: Date) => {
    const cacheKey = `eventsForDate-${format(date, 'yyyy-MM-dd')}-${projectStore.selectedProjectIds.join(',')}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const dateEvents = spatialIndex.getEventsForDate(date);
    const filtered = projectStore.selectedProjectIds.length > 0
      ? dateEvents.filter(event => projectStore.selectedProjectIds.includes(event.projectId || ''))
      : dateEvents;
    
    calculationCacheRef.current.set(cacheKey, filtered);
    return filtered;
  }, [spatialIndex, projectStore.selectedProjectIds]);

  // Optimized events by date range using spatial index
  const getEventsForDateRange = useCallback((startDate: Date, endDate: Date) => {
    const cacheKey = `eventsForRange-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}-${projectStore.selectedProjectIds.join(',')}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const rangeEvents = spatialIndex.getEventsForDateRange(startDate, endDate);
    const filtered = projectStore.selectedProjectIds.length > 0
      ? rangeEvents.filter(event => projectStore.selectedProjectIds.includes(event.projectId || ''))
      : rangeEvents;
    
    calculationCacheRef.current.set(cacheKey, filtered);
    return filtered;
  }, [spatialIndex, projectStore.selectedProjectIds]);

  // Month view optimized data
  const monthViewData = useMemo(() => {
    if (viewMode !== 'month') return null;

    const cacheKey = `monthView-${format(store.currentDate, 'yyyy-MM')}-${projectStore.selectedProjectIds.join(',')}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const monthStart = startOfWeek(startOfMonth(store.currentDate));
    const monthEnd = endOfWeek(endOfMonth(store.currentDate));
    const monthDays = dateUtils.getMonthViewDays(store.currentDate);
    
    const events = getEventsForDateRange(monthStart, monthEnd);
    const eventsByDate = EventGrouper.groupEventsByDate(events);

    const data = {
      days: monthDays,
      eventsByDate,
      totalEvents: events.length
    };
    
    calculationCacheRef.current.set(cacheKey, data);
    return data;
  }, [viewMode, store.currentDate, dateUtils, getEventsForDateRange, projectStore.selectedProjectIds]);

  // Week view optimized data
  const weekViewData = useMemo(() => {
    if (viewMode !== 'week') return null;

    const cacheKey = `weekView-${format(store.currentDate, 'yyyy-MM-dd')}-${projectStore.selectedProjectIds.join(',')}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const weekStart = startOfWeek(store.currentDate);
    const weekEnd = endOfWeek(store.currentDate);
    const weekDays = dateUtils.getWeekViewDays(store.currentDate);
    
    const events = getEventsForDateRange(weekStart, weekEnd);
    const eventsByDate = EventGrouper.groupEventsByDate(events);

    // Pre-calculate overlapping event groups for each day
    const eventGroupsByDate: Record<string, Event[][]> = {};
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayEvents = eventsByDate[dayKey] || [];
      const timedEvents = dayEvents.filter(event => !event.allDay);
      eventGroupsByDate[dayKey] = EventGrouper.groupOverlappingEvents(timedEvents);
    });

    const data = {
      days: weekDays,
      eventsByDate,
      eventGroupsByDate,
      totalEvents: events.length
    };
    
    calculationCacheRef.current.set(cacheKey, data);
    return data;
  }, [viewMode, store.currentDate, dateUtils, getEventsForDateRange, projectStore.selectedProjectIds]);

  // Day view optimized data
  const dayViewData = useMemo(() => {
    if (viewMode !== 'day') return null;

    const cacheKey = `dayView-${format(store.currentDate, 'yyyy-MM-dd')}-${projectStore.selectedProjectIds.join(',')}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const dayEvents = getEventsForDate(store.currentDate);
    const { allDayEvents, timedEvents } = dayEvents.reduce(
      (acc, event) => {
        if (event.allDay) {
          acc.allDayEvents.push(event);
        } else {
          acc.timedEvents.push(event);
        }
        return acc;
      },
      { allDayEvents: [] as Event[], timedEvents: [] as Event[] }
    );

    const eventGroups = EventGrouper.groupOverlappingEvents(timedEvents);

    const data = {
      date: store.currentDate,
      allDayEvents,
      timedEvents,
      eventGroups,
      totalEvents: dayEvents.length
    };
    
    calculationCacheRef.current.set(cacheKey, data);
    return data;
  }, [viewMode, store.currentDate, getEventsForDate, projectStore.selectedProjectIds]);

  // Year view optimized data
  const yearViewData = useMemo(() => {
    if (viewMode !== 'year') return null;

    const cacheKey = `yearView-${format(store.currentDate, 'yyyy')}-${projectStore.selectedProjectIds.join(',')}`;
    
    const cached = calculationCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const yearStart = startOfYear(store.currentDate);
    const yearEnd = endOfYear(store.currentDate);
    const yearMonths = dateUtils.getYearViewMonths(store.currentDate);
    
    const events = getEventsForDateRange(yearStart, yearEnd);
    const eventsByMonth = EventGrouper.groupEventsByMonth(events);

    // Calculate event density for heat map
    const eventDensityByMonth: Record<string, number> = {};
    const maxEventsInMonth = Math.max(...Object.values(eventsByMonth).map(events => events.length), 1);
    
    yearMonths.forEach(month => {
      const monthKey = format(month, 'yyyy-MM');
      const monthEvents = eventsByMonth[monthKey] || [];
      eventDensityByMonth[monthKey] = monthEvents.length / maxEventsInMonth;
    });

    const data = {
      months: yearMonths,
      eventsByMonth,
      eventDensityByMonth,
      totalEvents: events.length,
      maxEventsInMonth
    };
    
    calculationCacheRef.current.set(cacheKey, data);
    return data;
  }, [viewMode, store.currentDate, dateUtils, getEventsForDateRange, projectStore.selectedProjectIds]);

  // Optimized event handlers
  const handleEventMove = useCallback(async (eventId: string, newDate: Date, newTime?: Date) => {
    try {
      const event = store.events.find(e => e.id === eventId);
      if (!event) return;

      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const duration = endDate.getTime() - startDate.getTime();

      let newStartDate: Date;
      
      if (newTime) {
        newStartDate = new Date(newTime);
      } else {
        newStartDate = new Date(newDate);
        newStartDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      }
      
      const newEndDate = new Date(newStartDate.getTime() + duration);

      await store.updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate
      });

      // Clear related caches
      calculationCacheRef.current.clear();
    } catch (error) {
      console.error('Failed to move event:', error);
    }
  }, [store]);

  // Performance statistics
  const performanceStats = useMemo(() => ({
    eventsCount: store.events.length,
    spatialIndexStats: spatialIndex.getIndexStats(),
    cacheStats: calculationCacheRef.current.getStats(),
    renderMetrics: metrics
  }), [store.events.length, spatialIndex, metrics]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      calculationCacheRef.current.clear();
    };
  }, []);

  return {
    // Core store data
    store,
    isReady,
    projectColors,
    
    // Optimized data getters
    getEventsForDate,
    getEventsForDateRange,
    getFilteredEvents,
    
    // View-specific optimized data
    monthViewData,
    weekViewData,
    dayViewData,
    yearViewData,
    
    // Event handlers
    handleEventMove,
    
    // Performance data
    performanceStats,
    
    // Utilities
    spatialIndex,
    dateUtils,
    selectors
  };
};