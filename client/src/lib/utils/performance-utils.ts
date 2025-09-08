import { format, startOfDay, endOfDay, isSameDay, differenceInDays } from 'date-fns';
import { Event } from '@/types/store';

/**
 * Spatial index for efficient calendar event lookups
 */
export class EventSpatialIndex {
  private dateIndex: Map<string, Event[]> = new Map();
  private monthIndex: Map<string, Event[]> = new Map();
  private yearIndex: Map<string, Event[]> = new Map();
  private categoryIndex: Map<string, Event[]> = new Map();
  private projectIndex: Map<string, Event[]> = new Map();
  private allEvents: Event[] = [];
  private indexVersion: number = 0;

  constructor(events: Event[] = []) {
    this.rebuildIndex(events);
  }

  /**
   * Rebuilds the entire index with new events
   */
  rebuildIndex(events: Event[]) {
    this.clear();
    this.allEvents = [...events];
    this.indexVersion++;
    
    events.forEach(event => {
      this.indexEvent(event);
    });
  }

  /**
   * Adds or updates a single event in the index
   */
  addEvent(event: Event) {
    // Remove existing event if it exists
    this.removeEvent(event.id);
    
    // Add new event
    this.allEvents.push(event);
    this.indexEvent(event);
    this.indexVersion++;
  }

  /**
   * Removes an event from all indices
   */
  removeEvent(eventId: string) {
    const eventIndex = this.allEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;

    const event = this.allEvents[eventIndex];
    this.allEvents.splice(eventIndex, 1);
    
    // Remove from all indices
    this.removeEventFromIndex(event, this.dateIndex);
    this.removeEventFromIndex(event, this.monthIndex);
    this.removeEventFromIndex(event, this.yearIndex);
    this.removeEventFromIndex(event, this.categoryIndex);
    this.removeEventFromIndex(event, this.projectIndex);
    
    this.indexVersion++;
  }

  /**
   * Gets events for a specific date with O(1) lookup
   */
  getEventsForDate(date: Date): Event[] {
    const dateKey = format(date, 'yyyy-MM-dd');
    return this.dateIndex.get(dateKey) || [];
  }

  /**
   * Gets events for a date range efficiently
   */
  getEventsForDateRange(startDate: Date, endDate: Date): Event[] {
    const events = new Set<Event>();
    
    // If range is small (< 32 days), use date index
    const dayDiff = Math.abs(differenceInDays(endDate, startDate));
    if (dayDiff < 32) {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayEvents = this.getEventsForDate(currentDate);
        dayEvents.forEach(event => events.add(event));
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    } else {
      // For larger ranges, filter all events
      this.allEvents.forEach(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        if (eventStart <= endDate && eventEnd >= startDate) {
          events.add(event);
        }
      });
    }
    
    return Array.from(events);
  }

  /**
   * Gets events for a specific month
   */
  getEventsForMonth(date: Date): Event[] {
    const monthKey = format(date, 'yyyy-MM');
    return this.monthIndex.get(monthKey) || [];
  }

  /**
   * Gets events for a specific year
   */
  getEventsForYear(date: Date): Event[] {
    const yearKey = format(date, 'yyyy');
    return this.yearIndex.get(yearKey) || [];
  }

  /**
   * Gets events by category
   */
  getEventsByCategory(category: string): Event[] {
    return this.categoryIndex.get(category) || [];
  }

  /**
   * Gets events by project
   */
  getEventsByProject(projectId: string): Event[] {
    return this.projectIndex.get(projectId) || [];
  }

  /**
   * Gets filtered events efficiently using indices
   */
  getFilteredEvents(filters: {
    categories?: string[];
    projectIds?: string[];
    dateRange?: { start: Date; end: Date };
  }): Event[] {
    let candidateEvents: Set<Event>;

    // Start with the most restrictive filter
    if (filters.dateRange) {
      candidateEvents = new Set(this.getEventsForDateRange(filters.dateRange.start, filters.dateRange.end));
    } else if (filters.categories && filters.categories.length > 0) {
      candidateEvents = new Set();
      filters.categories.forEach(category => {
        this.getEventsByCategory(category).forEach(event => candidateEvents.add(event));
      });
    } else if (filters.projectIds && filters.projectIds.length > 0) {
      candidateEvents = new Set();
      filters.projectIds.forEach(projectId => {
        this.getEventsByProject(projectId).forEach(event => candidateEvents.add(event));
      });
    } else {
      candidateEvents = new Set(this.allEvents);
    }

    // Apply remaining filters
    return Array.from(candidateEvents).filter(event => {
      // Filter by categories
      if (filters.categories && filters.categories.length > 0) {
        if (!event.category || !filters.categories.includes(event.category)) {
          return false;
        }
      }

      // Filter by projects
      if (filters.projectIds && filters.projectIds.length > 0) {
        if (!event.projectId || !filters.projectIds.includes(event.projectId)) {
          return false;
        }
      }

      // Date range is already handled above
      return true;
    });
  }

  /**
   * Gets performance stats about the index
   */
  getIndexStats() {
    return {
      version: this.indexVersion,
      totalEvents: this.allEvents.length,
      dateIndices: this.dateIndex.size,
      monthIndices: this.monthIndex.size,
      yearIndices: this.yearIndex.size,
      categoryIndices: this.categoryIndex.size,
      projectIndices: this.projectIndex.size
    };
  }

  private indexEvent(event: Event) {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // Index by dates (for multi-day events, index all spanned dates)
    let currentDate = startOfDay(eventStart);
    const lastDate = startOfDay(eventEnd);
    
    while (currentDate <= lastDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      this.addToIndex(this.dateIndex, dateKey, event);
      
      // Also index by month and year
      const monthKey = format(currentDate, 'yyyy-MM');
      const yearKey = format(currentDate, 'yyyy');
      this.addToIndex(this.monthIndex, monthKey, event);
      this.addToIndex(this.yearIndex, yearKey, event);
      
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // Index by category
    if (event.category) {
      this.addToIndex(this.categoryIndex, event.category, event);
    }
    
    // Index by project
    if (event.projectId) {
      this.addToIndex(this.projectIndex, event.projectId, event);
    }
  }

  private addToIndex(index: Map<string, Event[]>, key: string, event: Event) {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(event);
  }

  private removeEventFromIndex(event: Event, index: Map<string, Event[]>) {
    index.forEach((events, key) => {
      const eventIndex = events.findIndex(e => e.id === event.id);
      if (eventIndex !== -1) {
        events.splice(eventIndex, 1);
        if (events.length === 0) {
          index.delete(key);
        }
      }
    });
  }

  private clear() {
    this.dateIndex.clear();
    this.monthIndex.clear();
    this.yearIndex.clear();
    this.categoryIndex.clear();
    this.projectIndex.clear();
    this.allEvents = [];
  }
}

/**
 * Event grouping utilities for optimized rendering
 */
export class EventGrouper {
  /**
   * Groups events by date for month view rendering
   */
  static groupEventsByDate(events: Event[]): Record<string, Event[]> {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Handle multi-day events by adding them to each day they span
      let currentDate = startOfDay(eventStart);
      const endDate = startOfDay(eventEnd);
      
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    });
    
    return grouped;
  }

  /**
   * Groups events by month for year view rendering
   */
  static groupEventsByMonth(events: Event[]): Record<string, Event[]> {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Add event to all months it spans
      let currentDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), 1);
      const endMonth = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), 1);
      
      while (currentDate <= endMonth) {
        const monthKey = format(currentDate, 'yyyy-MM');
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(event);
        
        // Move to next month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
    });
    
    return grouped;
  }

  /**
   * Groups overlapping events for week/day view layout
   */
  static groupOverlappingEvents(events: Event[]): Event[][] {
    if (events.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const groups: Event[][] = [];
    
    sortedEvents.forEach(event => {
      let placed = false;
      
      // Try to find an existing group where this event doesn't overlap
      for (const group of groups) {
        const hasOverlap = group.some(groupEvent => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          const groupEventStart = new Date(groupEvent.startDate);
          const groupEventEnd = new Date(groupEvent.endDate);
          
          return eventStart < groupEventEnd && eventEnd > groupEventStart;
        });
        
        if (!hasOverlap) {
          group.push(event);
          placed = true;
          break;
        }
      }
      
      // If no suitable group found, create a new one
      if (!placed) {
        groups.push([event]);
      }
    });

    return groups;
  }
}

/**
 * Memory-efficient cache for expensive calculations
 */
export class CalculationCache<T> {
  private cache: Map<string, { value: T; timestamp: number }> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  set(key: string, value: T): void {
    // Remove expired entries
    this.cleanup();

    // If at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttl) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.cache.delete(key));
  }
}

/**
 * Utility for chunked processing to avoid blocking the main thread
 */
export class ChunkedProcessor {
  static async processInChunks<T, R>(
    items: T[],
    processor: (chunk: T[]) => R[],
    chunkSize: number = 100,
    delayMs: number = 0
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = processor(chunk);
      results.push(...chunkResults);
      
      // Yield to the event loop between chunks
      if (delayMs > 0 || i + chunkSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  static async processWithIdleCallback<T, R>(
    items: T[],
    processor: (item: T) => R,
    deadline?: number
  ): Promise<R[]> {
    return new Promise((resolve) => {
      const results: R[] = [];
      let index = 0;

      const processChunk = (idleDeadline?: IdleDeadline) => {
        const timeLimit = idleDeadline?.timeRemaining() || deadline || 5;
        const startTime = performance.now();

        while (index < items.length && (performance.now() - startTime) < timeLimit) {
          results.push(processor(items[index]));
          index++;
        }

        if (index < items.length) {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(processChunk);
          } else {
            setTimeout(() => processChunk(), 0);
          }
        } else {
          resolve(results);
        }
      };

      processChunk();
    });
  }
}