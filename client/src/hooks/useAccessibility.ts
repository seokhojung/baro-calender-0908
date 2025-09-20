"use client";

import { useCallback, useEffect, useRef, MutableRefObject, useState } from 'react';
import { ViewMode, Event } from '@/types/store';
import { format, isToday, isSameDay, isSameMonth } from 'date-fns';

export interface AccessibilityConfig {
  announceChanges?: boolean;
  enableKeyboardNavigation?: boolean;
  enableFocusManagement?: boolean;
  customLabels?: Record<string, string>;
  liveRegion?: 'polite' | 'assertive' | 'off';
}

/**
 * Hook for managing accessibility features in calendar components
 */
export const useAccessibility = (config: AccessibilityConfig = {}) => {
  const {
    announceChanges = true,
    enableKeyboardNavigation = true,
    enableFocusManagement = true,
    customLabels = {},
    liveRegion = 'polite'
  } = config;

  const liveRegionRef = useRef<HTMLDivElement>(null);
  const focusHistoryRef = useRef<HTMLElement[]>([]);

  // Announce changes to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = liveRegion as 'polite' | 'assertive') => {
    if (!announceChanges) return;

    // Create or update live region
    let liveRegionEl = liveRegionRef.current;
    if (!liveRegionEl) {
      liveRegionEl = document.createElement('div');
      liveRegionEl.setAttribute('aria-live', priority);
      liveRegionEl.setAttribute('aria-atomic', 'true');
      liveRegionEl.className = 'sr-only';
      document.body.appendChild(liveRegionEl);
      liveRegionRef.current = liveRegionEl;
    }

    // Clear previous message and announce new one
    liveRegionEl.textContent = '';
    setTimeout(() => {
      if (liveRegionEl) {
        liveRegionEl.textContent = message;
      }
    }, 100);
  }, [announceChanges, liveRegion]);

  // Generate ARIA labels for calendar elements
  const generateAriaLabel = useCallback((
    type: 'date' | 'event' | 'navigation' | 'view',
    data: any
  ): string => {
    const labels = {
      today: customLabels.today || 'Today',
      selected: customLabels.selected || 'Selected',
      hasEvents: customLabels.hasEvents || 'has events',
      noEvents: customLabels.noEvents || 'no events',
      ...customLabels
    };

    switch (type) {
      case 'date': {
        const { date, isSelected, events = [], currentMonth } = data;
        const dateStr = format(date, 'EEEE, MMMM d, yyyy');
        const todayStr = isToday(date) ? `, ${labels.today}` : '';
        const selectedStr = isSelected ? `, ${labels.selected}` : '';
        const eventsStr = events.length > 0 
          ? `, ${events.length} ${events.length === 1 ? 'event' : 'events'}`
          : `, ${labels.noEvents}`;
        const monthStr = !isSameMonth(date, currentMonth) ? `, outside current month` : '';
        
        return `${dateStr}${todayStr}${selectedStr}${eventsStr}${monthStr}`;
      }

      case 'event': {
        const { event, startTime, endTime } = data;
        const timeStr = event.allDay 
          ? 'All day' 
          : `${startTime || format(new Date(event.startDate), 'h:mm a')} to ${endTime || format(new Date(event.endDate), 'h:mm a')}`;
        
        return `${event.title}, ${timeStr}${event.description ? `, ${event.description}` : ''}`;
      }

      case 'navigation': {
        const { direction, viewMode, date } = data;
        const viewLabel = viewMode ? `${viewMode} view` : '';
        const dateLabel = date ? format(date, 'MMMM yyyy') : '';
        
        return `Navigate ${direction}${viewLabel ? ` in ${viewLabel}` : ''}${dateLabel ? ` to ${dateLabel}` : ''}`;
      }

      case 'view': {
        const { viewMode, date, totalEvents } = data;
        const dateRange = generateDateRangeLabel(viewMode, date);
        const eventsStr = totalEvents > 0 ? `, ${totalEvents} total events` : '';
        
        return `${viewMode} view, ${dateRange}${eventsStr}`;
      }

      default:
        return '';
    }
  }, [customLabels]);

  // Generate date range labels for different view modes
  const generateDateRangeLabel = useCallback((viewMode: ViewMode, date: Date): string => {
    switch (viewMode) {
      case 'day':
        return format(date, 'EEEE, MMMM d, yyyy');
      case 'week':
        // Calculate week range
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Week of ${format(startOfWeek, 'MMMM d')} to ${format(endOfWeek, 'MMMM d, yyyy')}`;
      case 'month':
        return format(date, 'MMMM yyyy');
      case 'year':
        return format(date, 'yyyy');
      default:
        return format(date, 'MMMM yyyy');
    }
  }, []);

  // Focus management
  const saveFocus = useCallback((element?: HTMLElement) => {
    const activeElement = element || document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      focusHistoryRef.current.push(activeElement);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const previousFocus = focusHistoryRef.current.pop();
    if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
  }, []);

  const trapFocus = useCallback((containerElement: HTMLElement) => {
    if (!enableFocusManagement) return;

    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    containerElement.addEventListener('keydown', handleTabKey);
    return () => containerElement.removeEventListener('keydown', handleTabKey);
  }, [enableFocusManagement]);

  // Cleanup live region on unmount
  useEffect(() => {
    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  return {
    announce,
    generateAriaLabel,
    generateDateRangeLabel,
    saveFocus,
    restoreFocus,
    trapFocus,
  };
};

/**
 * Hook for keyboard navigation in calendar components
 */
export const useKeyboardNavigation = (
  containerRef: MutableRefObject<HTMLElement | null>,
  config: {
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end') => void;
    onActivate?: (element: HTMLElement) => void;
    onEscape?: () => void;
    gridNavigation?: boolean;
    customKeyMap?: Record<string, () => void>;
  } = {}
) => {
  const {
    onNavigate,
    onActivate,
    onEscape,
    gridNavigation = true,
    customKeyMap = {}
  } = config;

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);

  // Update focusable elements when container changes
  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const elements = Array.from(
      containerRef.current.querySelectorAll(
        '[data-focusable], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      )
    ) as HTMLElement[];

    setFocusableElements(elements);
  }, [containerRef]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey } = e;

    // Custom key mappings
    const customHandler = customKeyMap[key] || customKeyMap[`${ctrlKey ? 'Ctrl+' : ''}${key}`];
    if (customHandler) {
      e.preventDefault();
      customHandler();
      return;
    }

    switch (key) {
      case 'ArrowUp':
        e.preventDefault();
        if (gridNavigation && onNavigate) {
          onNavigate('up');
        } else {
          navigateToElement('prev');
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (gridNavigation && onNavigate) {
          onNavigate('down');
        } else {
          navigateToElement('next');
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (gridNavigation && onNavigate) {
          onNavigate('left');
        } else {
          navigateToElement('prev');
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (gridNavigation && onNavigate) {
          onNavigate('right');
        } else {
          navigateToElement('next');
        }
        break;

      case 'Home':
        e.preventDefault();
        if (onNavigate) {
          onNavigate('home');
        } else {
          focusElement(0);
        }
        break;

      case 'End':
        e.preventDefault();
        if (onNavigate) {
          onNavigate('end');
        } else {
          focusElement(focusableElements.length - 1);
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && onActivate) {
          onActivate(activeElement);
        } else if (activeElement?.click) {
          activeElement.click();
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (onEscape) {
          onEscape();
        }
        break;

      case 'Tab':
        // Let default tab behavior work, but update focused index
        if (!shiftKey) {
          setFocusedIndex(prev => Math.min(prev + 1, focusableElements.length - 1));
        } else {
          setFocusedIndex(prev => Math.max(prev - 1, 0));
        }
        break;
    }
  }, [gridNavigation, onNavigate, onActivate, onEscape, customKeyMap, focusableElements]);

  const navigateToElement = useCallback((direction: 'next' | 'prev') => {
    const currentIndex = focusedIndex;
    let newIndex = currentIndex;

    if (direction === 'next') {
      newIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
    }

    focusElement(newIndex);
  }, [focusedIndex, focusableElements]);

  const focusElement = useCallback((index: number) => {
    if (index >= 0 && index < focusableElements.length) {
      const element = focusableElements[index];
      element?.focus();
      setFocusedIndex(index);
    }
  }, [focusableElements]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateFocusableElements();
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, handleKeyDown, updateFocusableElements]);

  // Update focusable elements when they change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(container, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['disabled', 'tabindex']
    });

    return () => observer.disconnect();
  }, [updateFocusableElements]);

  return {
    focusedIndex,
    focusableElements,
    updateFocusableElements,
    focusElement,
    navigateToElement,
  };
};

/**
 * Hook for managing ARIA live regions and announcements
 */
export const useAriaLiveRegion = (regionId: string = 'calendar-live-region') => {
  const regionRef = useRef<HTMLDivElement | null>(null);

  const ensureLiveRegion = useCallback(() => {
    if (!regionRef.current) {
      let existingRegion = document.getElementById(regionId) as HTMLDivElement;
      
      if (!existingRegion) {
        existingRegion = document.createElement('div');
        existingRegion.id = regionId;
        existingRegion.setAttribute('aria-live', 'polite');
        existingRegion.setAttribute('aria-atomic', 'true');
        existingRegion.className = 'sr-only';
        document.body.appendChild(existingRegion);
      }
      
      regionRef.current = existingRegion;
    }
    
    return regionRef.current;
  }, [regionId]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = ensureLiveRegion();
    
    // Update priority if needed
    if (region.getAttribute('aria-live') !== priority) {
      region.setAttribute('aria-live', priority);
    }

    // Clear and then set message to ensure it's announced
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }, [ensureLiveRegion]);

  useEffect(() => {
    ensureLiveRegion();
    
    return () => {
      // Clean up on unmount if this is the only instance
      if (regionRef.current && document.getElementById(regionId) === regionRef.current) {
        document.body.removeChild(regionRef.current);
      }
    };
  }, [ensureLiveRegion, regionId]);

  return { announce };
};