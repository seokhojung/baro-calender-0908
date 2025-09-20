"use client";

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useCalendar } from '@/components/providers/calendar-provider';
import { useAccessibility, useAriaLiveRegion } from '@/hooks/useAccessibility';
import { ViewMode, Event } from '@/types/store';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format, isSameDay } from 'date-fns';

interface KeyboardNavigationContextType {
  focusedDate: Date | null;
  focusedEventId: string | null;
  navigationMode: 'date' | 'event';
  isKeyboardNavigationActive: boolean;
  setFocusedDate: (date: Date | null) => void;
  setFocusedEventId: (eventId: string | null) => void;
  setNavigationMode: (mode: 'date' | 'event') => void;
  handleKeyboardShortcut: (key: string, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean) => boolean;
  registerKeyboardElement: (element: HTMLElement, type: 'date' | 'event', data: any) => void;
  unregisterKeyboardElement: (element: HTMLElement) => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | null>(null);

export interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
  onViewModeChange?: (viewMode: ViewMode) => void;
  enableShortcuts?: boolean;
}

export const KeyboardNavigationProvider: React.FC<KeyboardNavigationProviderProps> = ({
  children,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect,
  onViewModeChange,
  enableShortcuts = true,
}) => {
  const { store } = useCalendar();
  const { announce } = useAriaLiveRegion();
  const { generateAriaLabel } = useAccessibility();
  
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [navigationMode, setNavigationMode] = useState<'date' | 'event'>('date');
  const [isKeyboardNavigationActive, setIsKeyboardNavigationActive] = useState(false);
  
  const keyboardElementsRef = useRef<Map<HTMLElement, { type: 'date' | 'event', data: any }>>(new Map());

  // Initialize focused date when store changes
  useEffect(() => {
    if (store?.currentDate && !focusedDate) {
      setFocusedDate(store.currentDate);
    }
  }, [store?.currentDate, focusedDate]);

  const navigateDate = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'pageup' | 'pagedown') => {
    if (!store || !focusedDate) return;

    let newDate = focusedDate;
    const viewMode = store.viewMode;

    switch (direction) {
      case 'left':
        newDate = subDays(focusedDate, 1);
        break;
      case 'right':
        newDate = addDays(focusedDate, 1);
        break;
      case 'up':
        if (viewMode === 'month') {
          newDate = subDays(focusedDate, 7);
        } else if (viewMode === 'week') {
          newDate = subDays(focusedDate, 1);
        } else {
          newDate = subDays(focusedDate, 1);
        }
        break;
      case 'down':
        if (viewMode === 'month') {
          newDate = addDays(focusedDate, 7);
        } else if (viewMode === 'week') {
          newDate = addDays(focusedDate, 1);
        } else {
          newDate = addDays(focusedDate, 1);
        }
        break;
      case 'home':
        // Go to first day of current view period
        if (viewMode === 'month') {
          newDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), 1);
        } else if (viewMode === 'week') {
          newDate = subDays(focusedDate, focusedDate.getDay());
        } else {
          newDate = new Date(focusedDate);
          newDate.setHours(0, 0, 0, 0);
        }
        break;
      case 'end':
        // Go to last day of current view period
        if (viewMode === 'month') {
          newDate = new Date(focusedDate.getFullYear(), focusedDate.getMonth() + 1, 0);
        } else if (viewMode === 'week') {
          newDate = addDays(subDays(focusedDate, focusedDate.getDay()), 6);
        } else {
          newDate = new Date(focusedDate);
          newDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'pageup':
        if (viewMode === 'month') {
          newDate = subMonths(focusedDate, 1);
        } else if (viewMode === 'week') {
          newDate = subWeeks(focusedDate, 1);
        } else {
          newDate = subDays(focusedDate, 7);
        }
        break;
      case 'pagedown':
        if (viewMode === 'month') {
          newDate = addMonths(focusedDate, 1);
        } else if (viewMode === 'week') {
          newDate = addWeeks(focusedDate, 1);
        } else {
          newDate = addDays(focusedDate, 7);
        }
        break;
    }

    setFocusedDate(newDate);
    store.setSelectedDate(newDate);
    
    // Announce the navigation
    announce(`Navigated to ${format(newDate, 'EEEE, MMMM d, yyyy')}`);
  }, [store, focusedDate, announce]);

  const getEventsForDate = useCallback((date: Date): Event[] => {
    // This should be implemented based on your calendar store structure
    // For now, returning empty array
    return [];
  }, []);

  const navigateEvents = useCallback((direction: 'next' | 'prev') => {
    if (!focusedDate) return;

    const events = getEventsForDate(focusedDate);
    if (events.length === 0) return;

    const currentIndex = focusedEventId 
      ? events.findIndex(e => e.id === focusedEventId)
      : -1;

    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = currentIndex < events.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : events.length - 1;
    }

    const newEvent = events[newIndex];
    if (newEvent) {
      setFocusedEventId(newEvent.id);
      setNavigationMode('event');

      announce(`Selected event: ${newEvent.title}`);
    }
  }, [focusedDate, focusedEventId, getEventsForDate, announce]);

  const handleKeyboardShortcut = useCallback((key: string, ctrlKey = false, shiftKey = false, altKey = false): boolean => {
    if (!enableShortcuts) return false;

    // Handle view mode shortcuts (Ctrl + number)
    if (ctrlKey && !shiftKey && !altKey) {
      switch (key) {
        case '1':
          onViewModeChange?.('day');
          announce('Switched to day view');
          return true;
        case '2':
          onViewModeChange?.('week');
          announce('Switched to week view');
          return true;
        case '3':
          onViewModeChange?.('month');
          announce('Switched to month view');
          return true;
        case '4':
          onViewModeChange?.('year');
          announce('Switched to year view');
          return true;
        case 'n':
        case 'N':
          if (focusedDate) {
            onEventCreate?.(focusedDate);
            announce(`Creating new event for ${format(focusedDate, 'MMMM d, yyyy')}`);
          }
          return true;
        case 't':
        case 'T':
          const today = new Date();
          setFocusedDate(today);
          store?.setCurrentDate(today);
          announce('Navigated to today');
          return true;
      }
    }

    // Handle navigation shortcuts
    switch (key) {
      case 'ArrowLeft':
        if (!ctrlKey && !shiftKey && !altKey) {
          navigateDate('left');
          return true;
        }
        break;
      case 'ArrowRight':
        if (!ctrlKey && !shiftKey && !altKey) {
          navigateDate('right');
          return true;
        }
        break;
      case 'ArrowUp':
        if (!ctrlKey && !shiftKey && !altKey) {
          navigateDate('up');
          return true;
        }
        break;
      case 'ArrowDown':
        if (!ctrlKey && !shiftKey && !altKey) {
          navigateDate('down');
          return true;
        }
        break;
      case 'Home':
        navigateDate('home');
        return true;
      case 'End':
        navigateDate('end');
        return true;
      case 'PageUp':
        navigateDate('pageup');
        return true;
      case 'PageDown':
        navigateDate('pagedown');
        return true;
      case 'Tab':
        if (navigationMode === 'date') {
          navigateEvents('next');
        } else {
          if (shiftKey) {
            navigateEvents('prev');
          } else {
            navigateEvents('next');
          }
        }
        return true;
      case 'Enter':
      case ' ':
        if (navigationMode === 'event' && focusedEventId) {
          const events = getEventsForDate(focusedDate!);
          const event = events.find(e => e.id === focusedEventId);
          if (event) {
            onEventSelect?.(event);
            announce(`Selected event: ${event.title}`);
          }
        } else if (focusedDate) {
          onEventCreate?.(focusedDate);
          announce(`Creating new event for ${format(focusedDate, 'MMMM d, yyyy')}`);
        }
        return true;
      case 'e':
      case 'E':
        if (navigationMode === 'event' && focusedEventId && !ctrlKey) {
          const events = getEventsForDate(focusedDate!);
          const event = events.find(e => e.id === focusedEventId);
          if (event) {
            onEventEdit?.(event);
            announce(`Editing event: ${event.title}`);
          }
        }
        return true;
      case 'Delete':
      case 'Backspace':
        if (navigationMode === 'event' && focusedEventId) {
          const events = getEventsForDate(focusedDate!);
          const event = events.find(e => e.id === focusedEventId);
          if (event) {
            onEventDelete?.(event);
            announce(`Deleted event: ${event.title}`);
            setFocusedEventId(null);
            setNavigationMode('date');
          }
        }
        return true;
      case 'Escape':
        setNavigationMode('date');
        setFocusedEventId(null);
        return true;
    }

    return false;
  }, [
    enableShortcuts,
    focusedDate,
    focusedEventId,
    navigationMode,
    navigateDate,
    navigateEvents,
    onViewModeChange,
    onEventCreate,
    onEventEdit,
    onEventDelete,
    onEventSelect,
    getEventsForDate,
    announce,
    store
  ]);

  const registerKeyboardElement = useCallback((element: HTMLElement, type: 'date' | 'event', data: any) => {
    keyboardElementsRef.current.set(element, { type, data });
  }, []);

  const unregisterKeyboardElement = useCallback((element: HTMLElement) => {
    keyboardElementsRef.current.delete(element);
  }, []);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard events if focus is in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="textbox"]')
      ) {
        return;
      }

      const wasHandled = handleKeyboardShortcut(
        event.key,
        event.ctrlKey,
        event.shiftKey,
        event.altKey
      );

      if (wasHandled) {
        event.preventDefault();
        event.stopPropagation();
        setIsKeyboardNavigationActive(true);
      }
    };

    // Detect when keyboard navigation becomes inactive
    const handleMouseDown = () => {
      setIsKeyboardNavigationActive(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleKeyboardShortcut]);

  const contextValue: KeyboardNavigationContextType = {
    focusedDate,
    focusedEventId,
    navigationMode,
    isKeyboardNavigationActive,
    setFocusedDate,
    setFocusedEventId,
    setNavigationMode,
    handleKeyboardShortcut,
    registerKeyboardElement,
    unregisterKeyboardElement,
  };

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {children}
      
      {/* Keyboard shortcuts help - shown when keyboard navigation is active */}
      {isKeyboardNavigationActive && (
        <div
          className="sr-only"
          aria-live="polite"
          aria-label="Keyboard shortcuts available"
        >
          Use arrow keys to navigate dates, Tab to cycle through events, 
          Enter to select, Ctrl+N to create new event, Ctrl+1-4 to change views, 
          Ctrl+T to go to today, E to edit event, Delete to remove event
        </div>
      )}
    </KeyboardNavigationContext.Provider>
  );
};

export const useKeyboardNavigation = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigationProvider');
  }
  return context;
};

export default KeyboardNavigationProvider;