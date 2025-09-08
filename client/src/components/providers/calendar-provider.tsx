"use client";

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { CalendarStore } from '@/types/store';
import useCalendarStore, { useCalendarSelectors } from '@/stores/calendarStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import { CalendarDateUtils } from '@/lib/utils/date-utils';

/**
 * CalendarContext provides calendar state and actions throughout the application
 */
interface CalendarContextValue {
  store: CalendarStore;
  selectors: ReturnType<typeof useCalendarSelectors>;
  dateUtils: CalendarDateUtils;
  isReady: boolean;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

/**
 * CalendarProvider manages calendar state initialization and provides context
 */
interface CalendarProviderProps {
  children: ReactNode;
  initialDate?: Date;
  autoLoad?: boolean;
}

export function CalendarProvider({ 
  children, 
  initialDate = new Date(),
  autoLoad = true 
}: CalendarProviderProps) {
  const store = useCalendarStore();
  const selectors = useCalendarSelectors();
  const projectStore = useProjectStore();
  const userStore = useUserStore();
  const dateUtils = new CalendarDateUtils(userStore.user?.preferences?.weekStartsOn || 0);

  const [isReady, setIsReady] = React.useState(false);

  // Initialize calendar with user preferences
  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        // Set initial date if provided
        if (initialDate) {
          store.setCurrentDate(initialDate);
        }

        // Apply user preferences
        if (userStore.user?.preferences) {
          const { defaultView, weekStartsOn } = userStore.user.preferences;
          if (defaultView && defaultView !== store.viewMode) {
            store.setViewMode(defaultView);
          }
          
          // Update date utils with user preference
          dateUtils.setWeekStartsOn(weekStartsOn || 0);
        }

        // Auto-load events for the current view if enabled
        if (autoLoad) {
          const dateRange = dateUtils.getDateRangeForView(
            store.currentDate, 
            store.viewMode
          );
          await store.loadEvents(dateRange);
        }

        // Load projects if needed
        if (projectStore.projects.length === 0) {
          await projectStore.loadProjects();
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize calendar:', error);
        store.setError(error instanceof Error ? error.message : 'Failed to initialize calendar');
        setIsReady(true); // Still set ready to avoid blocking UI
      }
    };

    initializeCalendar();
  }, [userStore.user?.preferences, initialDate, autoLoad]);

  // Auto-reload events when view or date changes
  useEffect(() => {
    if (!isReady || !autoLoad) return;

    const dateRange = dateUtils.getDateRangeForView(store.currentDate, store.viewMode);
    store.loadEvents(dateRange).catch(error => {
      console.error('Failed to load events:', error);
    });
  }, [store.currentDate, store.viewMode, isReady, autoLoad]);

  const contextValue: CalendarContextValue = {
    store,
    selectors,
    dateUtils,
    isReady
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}

/**
 * Hook to access calendar context
 */
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}

/**
 * Hook to access calendar context with null safety (for optional usage)
 */
export function useCalendarOptional() {
  return useContext(CalendarContext);
}

/**
 * HOC to wrap components with CalendarProvider
 */
export function withCalendarProvider<P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Omit<CalendarProviderProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <CalendarProvider {...providerProps}>
        <Component {...props} />
      </CalendarProvider>
    );
  };
}

export default CalendarProvider;