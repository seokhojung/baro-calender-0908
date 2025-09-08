"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CalendarProvider } from '@/components/providers/calendar-provider';
import { ResponsiveLayout, MobileHeader, MobileBottomBar, TouchOptimizedButton } from '@/components/ui/responsive-layout';
import { useTouchGestures, useCalendarTouchNavigation } from '@/hooks/useTouchGestures';
import { useAccessibility, useAriaLiveRegion } from '@/hooks/useAccessibility';
import CalendarViewport from './CalendarViewport';
import CalendarSidebar from './CalendarSidebar';
import { Event, ViewMode } from '@/types/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Settings,
  Grid3X3,
  Calendar1,
  CalendarDays,
  CalendarRange
} from 'lucide-react';

interface ResponsiveCalendarProps {
  className?: string;
  initialDate?: Date;
  autoLoad?: boolean;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date?: Date) => void;
  onEventSelect?: (event: Event) => void;
  onSettings?: () => void;
}

const ResponsiveCalendarContent: React.FC<Omit<ResponsiveCalendarProps, 'initialDate' | 'autoLoad'>> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect,
  onSettings
}) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { announce } = useAriaLiveRegion();
  const { generateAriaLabel } = useAccessibility({
    announceChanges: true,
    enableKeyboardNavigation: true,
  });

  // Mock store for demo - replace with actual store
  const mockStore = {
    viewMode: 'month' as ViewMode,
    currentDate: new Date(),
    setViewMode: (viewMode: ViewMode) => {
      announce(`Switched to ${viewMode} view`);
    },
    setCurrentDate: (date: Date) => {
      announce(`Navigated to ${date.toLocaleDateString()}`);
    },
  };

  // Set up touch navigation
  const {
    handleSwipeLeft,
    handleSwipeRight,
    handleSwipeUp,
    handleSwipeDown,
  } = useCalendarTouchNavigation({
    viewMode: mockStore.viewMode,
    currentDate: mockStore.currentDate,
    onDateChange: mockStore.setCurrentDate,
    onViewModeChange: mockStore.setViewMode,
    enableViewModeSwitch: true,
  });

  // Set up touch gestures
  const { bind } = useTouchGestures(containerRef, {
    enableSwipe: true,
    enablePinch: true,
    swipeThreshold: 50,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
  });

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event);
    onEventSelect?.(event);
    announce(`Selected event: ${event.title}`);
  }, [onEventSelect, announce]);

  const handleEventEdit = useCallback((event: Event) => {
    onEventEdit?.(event);
    announce(`Editing event: ${event.title}`);
  }, [onEventEdit, announce]);

  const handleEventDelete = useCallback((event: Event) => {
    onEventDelete?.(event);
    announce(`Deleted event: ${event.title}`);
  }, [onEventDelete, announce]);

  const handleEventCreate = useCallback((date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    onEventCreate?.(targetDate);
    announce(`Creating new event for ${targetDate.toLocaleDateString()}`);
  }, [onEventCreate, selectedDate, announce]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    announce(`Selected date: ${date.toLocaleDateString()}`);
  }, [announce]);

  const handleViewModeChange = useCallback((viewMode: ViewMode) => {
    mockStore.setViewMode(viewMode);
    setShowSidebar(false); // Close sidebar on mobile when changing view
  }, [mockStore]);

  const handleNavigation = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      handleSwipeRight();
    } else {
      handleSwipeLeft();
    }
  }, [handleSwipeLeft, handleSwipeRight]);

  const getViewModeIcon = (viewMode: ViewMode) => {
    switch (viewMode) {
      case 'day': return Calendar1;
      case 'week': return CalendarDays;
      case 'month': return CalendarIcon;
      case 'year': return Grid3X3;
      default: return CalendarIcon;
    }
  };

  const getViewModeLabel = (viewMode: ViewMode) => {
    return viewMode.charAt(0).toUpperCase() + viewMode.slice(1);
  };

  const formatDateForHeader = () => {
    const date = mockStore.currentDate;
    switch (mockStore.viewMode) {
      case 'day':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  const viewModes: ViewMode[] = ['day', 'week', 'month', 'year'];

  return (
    <ResponsiveLayout
      ref={containerRef}
      className={cn("h-full", className)}
      touchOptimized={true}
      safeArea={true}
      {...bind()}
    >
      {/* Mobile Header */}
      <MobileHeader
        title={formatDateForHeader()}
        subtitle={`${getViewModeLabel(mockStore.viewMode)} View`}
        leftAction={
          <div className="flex items-center space-x-2">
            <TouchOptimizedButton
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('prev')}
              aria-label={generateAriaLabel('navigation', { 
                direction: 'previous', 
                viewMode: mockStore.viewMode,
                date: mockStore.currentDate 
              })}
            >
              <ChevronLeft className="h-5 w-5" />
            </TouchOptimizedButton>
            
            <TouchOptimizedButton
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('next')}
              aria-label={generateAriaLabel('navigation', { 
                direction: 'next', 
                viewMode: mockStore.viewMode,
                date: mockStore.currentDate 
              })}
            >
              <ChevronRight className="h-5 w-5" />
            </TouchOptimizedButton>
          </div>
        }
        rightAction={
          <div className="flex items-center space-x-2">
            <TouchOptimizedButton
              variant="ghost"
              size="sm"
              onClick={() => handleEventCreate()}
              aria-label="Create new event"
            >
              <Plus className="h-5 w-5" />
            </TouchOptimizedButton>

            {isMobile && (
              <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
                <SheetTrigger asChild>
                  <TouchOptimizedButton
                    variant="ghost"
                    size="sm"
                    aria-label="Open calendar menu"
                  >
                    <Menu className="h-5 w-5" />
                  </TouchOptimizedButton>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <CalendarSidebar
                    onEventSelect={handleEventSelect}
                    onDateSelect={handleDateSelect}
                    className="border-0 p-0"
                  />
                </SheetContent>
              </Sheet>
            )}

            {!isMobile && (
              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={onSettings}
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </TouchOptimizedButton>
            )}
          </div>
        }
      />

      {/* Main Calendar Area */}
      <div className="flex-1 flex min-h-0">
        {/* Calendar Viewport */}
        <div className="flex-1 min-w-0">
          <CalendarViewport
            className="h-full"
            onEventEdit={handleEventEdit}
            onEventDelete={handleEventDelete}
            onEventCreate={handleEventCreate}
            onEventSelect={handleEventSelect}
          />
        </div>

        {/* Desktop Sidebar */}
        {!isMobile && (
          <CalendarSidebar
            className="w-80 flex-shrink-0 border-l"
            onEventSelect={handleEventSelect}
            onDateSelect={handleDateSelect}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomBar
          actions={viewModes.map((viewMode) => {
            const Icon = getViewModeIcon(viewMode);
            return (
              <TouchOptimizedButton
                key={viewMode}
                variant={mockStore.viewMode === viewMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange(viewMode)}
                className="flex-col gap-1 h-16"
                aria-label={`Switch to ${viewMode} view`}
                aria-pressed={mockStore.viewMode === viewMode}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs capitalize">{viewMode}</span>
              </TouchOptimizedButton>
            );
          })}
        />
      )}

      {/* Skip Link for Accessibility */}
      <a
        href="#calendar-main-content"
        className="skip-link"
        onFocus={() => announce('Skip to main calendar content')}
      >
        Skip to main content
      </a>

      {/* Hidden element for main content landmark */}
      <div id="calendar-main-content" className="sr-only">
        Main calendar content
      </div>
    </ResponsiveLayout>
  );
};

const ResponsiveCalendar: React.FC<ResponsiveCalendarProps> = ({
  initialDate,
  autoLoad = true,
  ...props
}) => {
  return (
    <CalendarProvider initialDate={initialDate} autoLoad={autoLoad}>
      <ResponsiveCalendarContent {...props} />
    </CalendarProvider>
  );
};

export default ResponsiveCalendar;