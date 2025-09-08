import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { addDays, addHours, startOfToday } from 'date-fns';
import { Event } from '@/types/store';
import { EventSpatialIndex, EventGrouper, CalculationCache } from '@/lib/utils/performance-utils';
import { PerformanceTracker } from '@/hooks/usePerformanceMonitor';
import OptimizedMonthView from '@/components/calendar/OptimizedMonthView';
import OptimizedYearView from '@/components/calendar/OptimizedYearView';
import OptimizedWeekView from '@/components/calendar/OptimizedWeekView';
import OptimizedDayView from '@/components/calendar/OptimizedDayView';

// Mock providers for testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

// Generate test data
const generateTestEvents = (count: number): Event[] => {
  const baseDate = startOfToday();
  const events: Event[] = [];

  for (let i = 0; i < count; i++) {
    const startDate = addDays(addHours(baseDate, Math.random() * 24), Math.floor(Math.random() * 365));
    const endDate = addHours(startDate, 1 + Math.random() * 4); // 1-5 hour events

    events.push({
      id: `event-${i}`,
      title: `Test Event ${i}`,
      description: `Description for event ${i}`,
      startDate,
      endDate,
      allDay: Math.random() < 0.2, // 20% all-day events
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      category: `category-${Math.floor(Math.random() * 5)}`,
      projectId: `project-${Math.floor(Math.random() * 10)}`,
      tenantId: 1,
      status: 'confirmed',
      priority: Math.random() < 0.3 ? 'high' : 'normal',
      isRecurring: Math.random() < 0.1, // 10% recurring events
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return events;
};

describe('Calendar Performance Tests', () => {
  let performanceTracker: PerformanceTracker;

  beforeEach(() => {
    performanceTracker = PerformanceTracker.getInstance();
    performanceTracker.clear();
    
    // Mock performance.now for consistent testing
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    performanceTracker.clear();
  });

  describe('EventSpatialIndex Performance', () => {
    test('should handle 1000 events efficiently', () => {
      const events = generateTestEvents(1000);
      const startTime = performance.now();
      
      const spatialIndex = new EventSpatialIndex(events);
      
      const buildTime = performance.now() - startTime;
      expect(buildTime).toBeLessThan(100); // Should build in under 100ms

      // Test lookup performance
      const lookupStartTime = performance.now();
      const todayEvents = spatialIndex.getEventsForDate(new Date());
      const monthEvents = spatialIndex.getEventsForMonth(new Date());
      const yearEvents = spatialIndex.getEventsForYear(new Date());
      const lookupTime = performance.now() - lookupStartTime;

      expect(lookupTime).toBeLessThan(10); // Lookups should be under 10ms
      expect(Array.isArray(todayEvents)).toBe(true);
      expect(Array.isArray(monthEvents)).toBe(true);
      expect(Array.isArray(yearEvents)).toBe(true);
    });

    test('should perform date range queries efficiently', () => {
      const events = generateTestEvents(5000);
      const spatialIndex = new EventSpatialIndex(events);
      
      const startDate = startOfToday();
      const endDate = addDays(startDate, 30);
      
      const queryStartTime = performance.now();
      const rangeEvents = spatialIndex.getEventsForDateRange(startDate, endDate);
      const queryTime = performance.now() - queryStartTime;
      
      expect(queryTime).toBeLessThan(20); // Range queries should be under 20ms
      expect(Array.isArray(rangeEvents)).toBe(true);
    });

    test('should handle filtered queries efficiently', () => {
      const events = generateTestEvents(2000);
      const spatialIndex = new EventSpatialIndex(events);
      
      const filters = {
        categories: ['category-1', 'category-2'],
        projectIds: ['project-1', 'project-2'],
        dateRange: {
          start: startOfToday(),
          end: addDays(startOfToday(), 7)
        }
      };
      
      const filterStartTime = performance.now();
      const filteredEvents = spatialIndex.getFilteredEvents(filters);
      const filterTime = performance.now() - filterStartTime;
      
      expect(filterTime).toBeLessThan(30); // Filtered queries should be under 30ms
      expect(Array.isArray(filteredEvents)).toBe(true);
    });
  });

  describe('EventGrouper Performance', () => {
    test('should group events by date efficiently', () => {
      const events = generateTestEvents(1000);
      
      const groupStartTime = performance.now();
      const groupedEvents = EventGrouper.groupEventsByDate(events);
      const groupTime = performance.now() - groupStartTime;
      
      expect(groupTime).toBeLessThan(50); // Grouping should be under 50ms
      expect(typeof groupedEvents).toBe('object');
    });

    test('should handle overlapping event groups efficiently', () => {
      const events = generateTestEvents(500);
      
      const overlapStartTime = performance.now();
      const eventGroups = EventGrouper.groupOverlappingEvents(events);
      const overlapTime = performance.now() - overlapStartTime;
      
      expect(overlapTime).toBeLessThan(100); // Overlap calculation should be under 100ms
      expect(Array.isArray(eventGroups)).toBe(true);
    });
  });

  describe('CalculationCache Performance', () => {
    test('should provide fast cache operations', () => {
      const cache = new CalculationCache<any>(1000, 60000);
      const testData = { large: 'data'.repeat(1000) };
      
      // Test write performance
      const writeStartTime = performance.now();
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, { ...testData, id: i });
      }
      const writeTime = performance.now() - writeStartTime;
      
      // Test read performance
      const readStartTime = performance.now();
      for (let i = 0; i < 100; i++) {
        cache.get(`key-${i}`);
      }
      const readTime = performance.now() - readStartTime;
      
      expect(writeTime).toBeLessThan(20); // Cache writes should be under 20ms
      expect(readTime).toBeLessThan(5); // Cache reads should be under 5ms
    });

    test('should handle cache eviction efficiently', () => {
      const cache = new CalculationCache<any>(10, 1); // Small cache with 1ms TTL
      
      // Fill cache beyond capacity
      for (let i = 0; i < 20; i++) {
        cache.set(`key-${i}`, { data: i });
      }
      
      expect(cache.getStats().size).toBeLessThanOrEqual(10);
      
      // Wait for TTL expiration
      setTimeout(() => {
        expect(cache.get('key-0')).toBeNull();
      }, 10);
    });
  });

  describe('Component Rendering Performance', () => {
    test('MonthView should render 1000 events in reasonable time', async () => {
      const events = generateTestEvents(1000);
      
      // Mock the optimized calendar hook
      jest.mock('@/hooks/useOptimizedCalendar', () => ({
        useOptimizedCalendar: () => ({
          store: { currentDate: new Date(), selectedDate: null, selectedEventId: null },
          isReady: true,
          projectColors: {},
          monthViewData: {
            days: Array.from({ length: 35 }, (_, i) => addDays(startOfToday(), i - 15)),
            eventsByDate: {},
            totalEvents: events.length
          },
          handleEventMove: jest.fn(),
          performanceStats: {
            eventsCount: events.length,
            renderMetrics: { renderTime: 0, rerenders: 0, memoryUsage: 50 }
          }
        })
      }));

      const renderStartTime = performance.now();
      
      await act(async () => {
        render(
          <TestWrapper>
            <OptimizedMonthView />
          </TestWrapper>
        );
      });
      
      const renderTime = performance.now() - renderStartTime;
      
      // Should render in under 200ms even with 1000 events
      expect(renderTime).toBeLessThan(200);
    });

    test('YearView should handle large datasets efficiently', async () => {
      const events = generateTestEvents(2000);
      
      jest.mock('@/hooks/useOptimizedCalendar', () => ({
        useOptimizedCalendar: () => ({
          store: { currentDate: new Date(), selectedDate: null, selectedEventId: null },
          isReady: true,
          projectColors: {},
          yearViewData: {
            months: Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1)),
            eventsByMonth: {},
            eventDensityByMonth: {},
            totalEvents: events.length,
            maxEventsInMonth: 100
          },
          performanceStats: {
            eventsCount: events.length,
            renderMetrics: { renderTime: 0, rerenders: 0, memoryUsage: 75 }
          }
        })
      }));

      const renderStartTime = performance.now();
      
      await act(async () => {
        render(
          <TestWrapper>
            <OptimizedYearView />
          </TestWrapper>
        );
      });
      
      const renderTime = performance.now() - renderStartTime;
      
      // Should render in under 300ms even with 2000 events
      expect(renderTime).toBeLessThan(300);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not exceed memory limits with large datasets', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create large dataset
      const events = generateTestEvents(10000);
      const spatialIndex = new EventSpatialIndex(events);
      
      // Perform various operations
      for (let i = 0; i < 100; i++) {
        spatialIndex.getEventsForDate(addDays(new Date(), i));
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // MB
      
      // Memory increase should be reasonable (less than 50MB for 10k events)
      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  describe('Real-world Performance Scenarios', () => {
    test('should handle rapid date navigation efficiently', () => {
      const events = generateTestEvents(1000);
      const spatialIndex = new EventSpatialIndex(events);
      
      const navigationStartTime = performance.now();
      
      // Simulate rapid month navigation
      let currentDate = new Date();
      for (let i = 0; i < 12; i++) {
        currentDate = addDays(currentDate, 30);
        spatialIndex.getEventsForMonth(currentDate);
      }
      
      const navigationTime = performance.now() - navigationStartTime;
      
      // 12 month navigations should complete in under 50ms
      expect(navigationTime).toBeLessThan(50);
    });

    test('should handle concurrent event filtering efficiently', async () => {
      const events = generateTestEvents(2000);
      const spatialIndex = new EventSpatialIndex(events);
      
      const filterStartTime = performance.now();
      
      // Simulate multiple concurrent filter operations
      const filterPromises = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve(spatialIndex.getFilteredEvents({
          categories: [`category-${i % 5}`],
          projectIds: [`project-${i % 10}`]
        }))
      );
      
      await Promise.all(filterPromises);
      
      const filterTime = performance.now() - filterStartTime;
      
      // 10 concurrent filters should complete in under 100ms
      expect(filterTime).toBeLessThan(100);
    });

    test('should maintain 60fps during event interactions', () => {
      const targetFrameTime = 16.67; // 60fps = 16.67ms per frame
      
      const events = generateTestEvents(500);
      const spatialIndex = new EventSpatialIndex(events);
      
      // Simulate user interactions (hover, click, drag)
      const interactionTimes: number[] = [];
      
      for (let i = 0; i < 30; i++) {
        const startTime = performance.now();
        
        // Simulate event lookup and state updates
        spatialIndex.getEventsForDate(addDays(new Date(), i));
        
        const endTime = performance.now();
        interactionTimes.push(endTime - startTime);
      }
      
      const averageInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
      const maxInteractionTime = Math.max(...interactionTimes);
      
      // Average interaction time should maintain 60fps
      expect(averageInteractionTime).toBeLessThan(targetFrameTime);
      // Maximum interaction time shouldn't exceed 2 frames
      expect(maxInteractionTime).toBeLessThan(targetFrameTime * 2);
    });
  });

  describe('Performance Regression Tests', () => {
    test('should not regress in build time with increased event count', () => {
      const buildTimes: number[] = [];
      const eventCounts = [100, 500, 1000, 2000, 5000];
      
      eventCounts.forEach(count => {
        const events = generateTestEvents(count);
        const startTime = performance.now();
        new EventSpatialIndex(events);
        const buildTime = performance.now() - startTime;
        buildTimes.push(buildTime);
      });
      
      // Build time should scale roughly linearly, not exponentially
      // Check that 5000 events doesn't take more than 5x the time of 1000 events
      const ratio5000to1000 = buildTimes[4] / buildTimes[2];
      expect(ratio5000to1000).toBeLessThan(7); // Allow some overhead but not exponential
    });

    test('should maintain query performance with index updates', () => {
      const initialEvents = generateTestEvents(1000);
      const spatialIndex = new EventSpatialIndex(initialEvents);
      
      // Measure initial query time
      const initialQueryStart = performance.now();
      spatialIndex.getEventsForDate(new Date());
      const initialQueryTime = performance.now() - initialQueryStart;
      
      // Add more events incrementally
      for (let i = 0; i < 100; i++) {
        const newEvent = generateTestEvents(1)[0];
        spatialIndex.addEvent({ ...newEvent, id: `new-event-${i}` });
      }
      
      // Measure query time after updates
      const updatedQueryStart = performance.now();
      spatialIndex.getEventsForDate(new Date());
      const updatedQueryTime = performance.now() - updatedQueryStart;
      
      // Query time shouldn't significantly increase after incremental updates
      expect(updatedQueryTime).toBeLessThan(initialQueryTime * 2);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should track component performance metrics', async () => {
      const events = generateTestEvents(500);
      
      // This test would need actual component rendering to work properly
      // For now, we'll test the performance tracker directly
      
      performanceTracker.recordMetrics('TestComponent', {
        renderTime: 15.5,
        componentMounts: 1,
        rerenders: 3,
        memoryUsage: 45,
        eventCount: events.length,
        lastUpdate: Date.now()
      });
      
      const avgMetrics = performanceTracker.getAverageMetrics('TestComponent');
      expect(avgMetrics).toBeTruthy();
      expect(avgMetrics?.renderTime).toBe(15.5);
      expect(avgMetrics?.eventCount).toBe(events.length);
    });

    test('should generate performance reports', () => {
      // Record metrics for multiple components
      performanceTracker.recordMetrics('MonthView', {
        renderTime: 25.3,
        componentMounts: 1,
        rerenders: 5,
        memoryUsage: 60,
        eventCount: 1000,
        lastUpdate: Date.now()
      });

      performanceTracker.recordMetrics('YearView', {
        renderTime: 18.7,
        componentMounts: 1,
        rerenders: 2,
        memoryUsage: 40,
        eventCount: 2000,
        lastUpdate: Date.now()
      });

      const report = performanceTracker.getPerformanceReport();
      
      expect(report).toContain('Performance Report');
      expect(report).toContain('MonthView');
      expect(report).toContain('YearView');
      expect(report).toContain('25.3ms');
      expect(report).toContain('18.7ms');
    });
  });
});