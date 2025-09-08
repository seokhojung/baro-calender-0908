"use client";

import { useGesture } from '@use-gesture/react';
import { useCallback, useRef, MutableRefObject } from 'react';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { useCalendar } from '@/components/providers/calendar-provider';
import { ViewMode } from '@/types/store';

export interface TouchGestureConfig {
  enableSwipe?: boolean;
  enablePinch?: boolean;
  enableDrag?: boolean;
  swipeThreshold?: number;
  pinchThreshold?: number;
  velocityThreshold?: number;
  preventDefault?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
  onPinch?: (scale: number) => void;
  onDragStart?: (event: any) => void;
  onDragEnd?: (event: any) => void;
  onDrag?: (event: any) => void;
}

export interface SwipeNavigationConfig {
  viewMode: ViewMode;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewModeChange?: (viewMode: ViewMode) => void;
  enableViewModeSwitch?: boolean;
  customActions?: {
    swipeLeft?: () => void;
    swipeRight?: () => void;
    swipeUp?: () => void;
    swipeDown?: () => void;
  };
}

/**
 * Custom hook for handling touch gestures in calendar components
 * Provides swipe navigation, pinch-to-zoom, and drag interactions
 */
export const useTouchGestures = (
  ref: MutableRefObject<HTMLElement | null>,
  config: TouchGestureConfig = {}
) => {
  const {
    enableSwipe = true,
    enablePinch = true,
    enableDrag = true,
    swipeThreshold = 50,
    pinchThreshold = 0.2,
    velocityThreshold = 0.5,
    preventDefault = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchStart,
    onPinchEnd,
    onPinch,
    onDragStart,
    onDragEnd,
    onDrag
  } = config;

  const gestureState = useRef({
    isPinching: false,
    isDragging: false,
    initialPinchDistance: 0,
    initialScale: 1,
  });

  const bind = useGesture(
    {
      // Swipe gestures
      onDrag: ({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], cancel, first, last }) => {
        if (!enableSwipe && !enableDrag) return;

        if (first) {
          gestureState.current.isDragging = true;
          if (enableDrag && onDragStart) {
            onDragStart({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] });
          }
        }

        if (enableDrag && onDrag) {
          onDrag({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] });
        }

        if (last) {
          gestureState.current.isDragging = false;
          
          if (enableDrag && onDragEnd) {
            onDragEnd({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] });
          }

          // Handle swipe gestures
          if (enableSwipe) {
            const absX = Math.abs(mx);
            const absY = Math.abs(my);
            const hasVelocity = Math.abs(vx) > velocityThreshold || Math.abs(vy) > velocityThreshold;

            // Horizontal swipes
            if (absX > swipeThreshold && absX > absY && (hasVelocity || absX > swipeThreshold * 2)) {
              if (dx > 0 && onSwipeRight) {
                onSwipeRight();
              } else if (dx < 0 && onSwipeLeft) {
                onSwipeLeft();
              }
            }
            // Vertical swipes
            else if (absY > swipeThreshold && absY > absX && (hasVelocity || absY > swipeThreshold * 2)) {
              if (dy > 0 && onSwipeDown) {
                onSwipeDown();
              } else if (dy < 0 && onSwipeUp) {
                onSwipeUp();
              }
            }
          }
        }
      },

      // Pinch gestures
      onPinch: ({ offset: [scale], first, last }) => {
        if (!enablePinch) return;

        if (first) {
          gestureState.current.isPinching = true;
          gestureState.current.initialScale = scale;
          if (onPinchStart) onPinchStart();
        }

        if (onPinch) {
          const relativeScale = scale / gestureState.current.initialScale;
          onPinch(relativeScale);
        }

        if (last) {
          gestureState.current.isPinching = false;
          if (onPinchEnd) onPinchEnd();
        }
      },
    },
    {
      target: ref,
      eventOptions: { passive: !preventDefault },
      drag: {
        filterTaps: true,
        threshold: 10,
      },
      pinch: {
        threshold: 0.1,
      },
    }
  );

  return {
    bind,
    gestureState: gestureState.current,
  };
};

/**
 * Calendar-specific touch gesture hook for navigation
 * Provides built-in support for date navigation based on view mode
 */
export const useCalendarTouchNavigation = (config: SwipeNavigationConfig) => {
  const {
    viewMode,
    currentDate,
    onDateChange,
    onViewModeChange,
    enableViewModeSwitch = true,
    customActions
  } = config;

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    let newDate = currentDate;

    switch (viewMode) {
      case 'day':
        newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
        break;
      case 'week':
        newDate = direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        break;
      case 'year':
        newDate = direction === 'next' ? 
          new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1) :
          new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
        break;
    }

    onDateChange(newDate);
  }, [viewMode, currentDate, onDateChange]);

  const switchViewMode = useCallback((direction: 'zoom-in' | 'zoom-out') => {
    if (!enableViewModeSwitch || !onViewModeChange) return;

    const viewModes: ViewMode[] = ['year', 'month', 'week', 'day'];
    const currentIndex = viewModes.indexOf(viewMode);

    if (direction === 'zoom-in' && currentIndex < viewModes.length - 1) {
      onViewModeChange(viewModes[currentIndex + 1]);
    } else if (direction === 'zoom-out' && currentIndex > 0) {
      onViewModeChange(viewModes[currentIndex - 1]);
    }
  }, [viewMode, onViewModeChange, enableViewModeSwitch]);

  const handleSwipeLeft = useCallback(() => {
    if (customActions?.swipeLeft) {
      customActions.swipeLeft();
    } else {
      navigateDate('next');
    }
  }, [customActions?.swipeLeft, navigateDate]);

  const handleSwipeRight = useCallback(() => {
    if (customActions?.swipeRight) {
      customActions.swipeRight();
    } else {
      navigateDate('prev');
    }
  }, [customActions?.swipeRight, navigateDate]);

  const handleSwipeUp = useCallback(() => {
    if (customActions?.swipeUp) {
      customActions.swipeUp();
    } else {
      switchViewMode('zoom-out');
    }
  }, [customActions?.swipeUp, switchViewMode]);

  const handleSwipeDown = useCallback(() => {
    if (customActions?.swipeDown) {
      customActions.swipeDown();
    } else {
      switchViewMode('zoom-in');
    }
  }, [customActions?.swipeDown, switchViewMode]);

  return {
    handleSwipeLeft,
    handleSwipeRight,
    handleSwipeUp,
    handleSwipeDown,
    navigateDate,
    switchViewMode,
  };
};

/**
 * Hook for touch-friendly event dragging in calendar views
 */
export const useEventTouchDrag = (
  eventId: string,
  onEventMove?: (eventId: string, newDate: Date, newTime?: Date) => void
) => {
  const dragState = useRef({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dropTarget: null as HTMLElement | null,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    dragState.current = {
      isDragging: true,
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY },
      dropTarget: null,
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.current.isDragging) return;

    const touch = e.touches[0];
    dragState.current.currentPosition = { x: touch.clientX, y: touch.clientY };

    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = elementBelow?.closest('[data-drop-target]') as HTMLElement;
    dragState.current.dropTarget = dropTarget;

    // Add visual feedback
    if (dropTarget) {
      dropTarget.classList.add('drop-target-active');
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!dragState.current.isDragging) return;

    const dropTarget = dragState.current.dropTarget;
    if (dropTarget && onEventMove) {
      const dateStr = dropTarget.dataset.date;
      const timeStr = dropTarget.dataset.time;
      
      if (dateStr) {
        const newDate = new Date(dateStr);
        const newTime = timeStr ? new Date(`${dateStr}T${timeStr}`) : undefined;
        onEventMove(eventId, newDate, newTime);
      }
    }

    // Clean up visual feedback
    document.querySelectorAll('.drop-target-active').forEach(el => {
      el.classList.remove('drop-target-active');
    });

    dragState.current.isDragging = false;
  }, [eventId, onEventMove]);

  return {
    dragState: dragState.current,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

/**
 * Hook for handling pinch-to-zoom calendar view transitions
 */
export const usePinchZoom = (
  onViewModeChange?: (viewMode: ViewMode) => void,
  currentViewMode: ViewMode = 'month'
) => {
  const zoomState = useRef({
    isZooming: false,
    initialScale: 1,
    accumulatedScale: 1,
    scaleThreshold: 1.5,
  });

  const handlePinchStart = useCallback(() => {
    zoomState.current.isZooming = true;
    zoomState.current.accumulatedScale = 1;
  }, []);

  const handlePinch = useCallback((scale: number) => {
    zoomState.current.accumulatedScale = scale;
  }, []);

  const handlePinchEnd = useCallback(() => {
    if (!onViewModeChange) return;

    const { accumulatedScale, scaleThreshold } = zoomState.current;
    const viewModes: ViewMode[] = ['year', 'month', 'week', 'day'];
    const currentIndex = viewModes.indexOf(currentViewMode);

    if (accumulatedScale > scaleThreshold && currentIndex < viewModes.length - 1) {
      // Zoom in (pinch out gesture)
      onViewModeChange(viewModes[currentIndex + 1]);
    } else if (accumulatedScale < (1 / scaleThreshold) && currentIndex > 0) {
      // Zoom out (pinch in gesture)
      onViewModeChange(viewModes[currentIndex - 1]);
    }

    zoomState.current.isZooming = false;
    zoomState.current.accumulatedScale = 1;
  }, [onViewModeChange, currentViewMode]);

  return {
    zoomState: zoomState.current,
    handlePinchStart,
    handlePinch,
    handlePinchEnd,
  };
};