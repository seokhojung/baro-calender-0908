"use client";

import React, { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { format, isSameMonth, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useOptimizedCalendar } from '@/hooks/useOptimizedCalendar';
import { useTouchGestures, useCalendarTouchNavigation } from '@/hooks/useTouchGestures';
import { useAccessibility, useKeyboardNavigation, useAriaLiveRegion } from '@/hooks/useAccessibility';
import EventCard, { DragItem } from './EventCard';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { TouchOptimizedButton } from '@/components/ui/responsive-layout';
import { ChevronDown, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResponsiveMonthViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
  enableVirtualization?: boolean;
  compactMode?: boolean;
}

interface DayCellProps {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isMobile: boolean;
  compactMode: boolean;
  onDayClick: (date: Date) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventSelect?: (event: Event) => void;
  onEventMove: (eventId: string, newDate: Date) => void;
  onEventCreate?: (date: Date) => void;
  selectedEventId: string | null;
  projectColors: Record<string, string>;
}

const MOBILE_MAX_EVENTS = 2;
const DESKTOP_MAX_EVENTS = 3;

// Mobile-optimized day cell component
const ResponsiveDayCell = memo<DayCellProps>(({
  date,
  events,
  isCurrentMonth,
  isToday: dayIsToday,
  isSelected,
  isMobile,
  compactMode,
  onDayClick,
  onEventEdit,
  onEventDelete,
  onEventSelect,
  onEventMove,
  onEventCreate,
  selectedEventId,
  projectColors
}) => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showEventSheet, setShowEventSheet] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const { announce } = useAriaLiveRegion();
  const { generateAriaLabel } = useAccessibility();
  
  const [{ isOver }, drop] = useDrop({
    accept: 'event',
    drop: (item: DragItem) => {
      onEventMove(item.id, date);
      announce(`Moved event to ${format(date, 'MMMM d, yyyy')}`);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Touch gesture handling for mobile
  const { bind: touchBind } = useTouchGestures(cellRef, {
    enableSwipe: false, // Disable swipe on individual cells to avoid conflicts
    enableDrag: false,
    onPinch: (scale) => {
      if (scale > 1.5) {
        handleDayClick();
      }
    },
  });

  const maxEvents = isMobile ? MOBILE_MAX_EVENTS : DESKTOP_MAX_EVENTS;
  const { visibleEvents, hiddenEventsCount } = useMemo(() => {
    const visible = showAllEvents ? events : events.slice(0, maxEvents);
    const hidden = Math.max(0, events.length - maxEvents);
    return { visibleEvents: visible, hiddenEventsCount: hidden };
  }, [events, showAllEvents, maxEvents]);

  const handleDayClick = useCallback(() => {
    onDayClick(date);
    announce(`Selected ${format(date, 'EEEE, MMMM d, yyyy')}${events.length > 0 ? `, ${events.length} events` : ''}`);
  }, [onDayClick, date, events.length, announce]);

  const handleShowMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      setShowEventSheet(true);
    } else {
      setShowAllEvents(true);
    }
  }, [isMobile]);

  const handleEventCreate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEventCreate?.(date);
    announce(`Creating new event for ${format(date, 'MMMM d, yyyy')}`);
  }, [onEventCreate, date, announce]);

  const getEventProjectColor = useCallback((event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  }, [projectColors]);

  const dayAriaLabel = generateAriaLabel('date', {
    date,
    isSelected,
    events,
    currentMonth: new Date() // This should come from store
  });

  const cellHeight = compactMode 
    ? (isMobile ? 'min-h-[80px]' : 'min-h-[100px]') 
    : (isMobile ? 'min-h-[120px]' : 'min-h-[140px]');

  return (
    <>
      <div
        ref={(node) => {
          drop(node);
          cellRef.current = node;
        }}
        className={cn(
          "relative p-1 sm:p-2 border-r border-b border-border/50 transition-all duration-200",
          "cursor-pointer select-none",
          cellHeight,
          !isCurrentMonth && "bg-muted/20 text-muted-foreground",
          dayIsToday && "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20",
          isSelected && "bg-blue-100 dark:bg-blue-800/30 ring-2 ring-blue-500/50",
          isOver && "bg-blue-200 dark:bg-blue-700/40 ring-2 ring-blue-400/60",
          "hover:bg-muted/30 active:bg-muted/50",
          "touch:hover:bg-muted/40", // Enhanced hover for touch devices
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1"
        )}
        onClick={handleDayClick}
        role="gridcell"
        aria-label={dayAriaLabel}
        aria-selected={isSelected}
        tabIndex={isSelected ? 0 : -1}
        data-date={format(date, 'yyyy-MM-dd')}
        data-drop-target
        {...(isMobile ? touchBind() : {})}
      >
        {/* Date number */}
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span
            className={cn(
              "text-xs sm:text-sm font-medium transition-all",
              dayIsToday && "bg-blue-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs font-semibold",
              !dayIsToday && isSelected && "text-blue-600 dark:text-blue-400 font-semibold"
            )}
            aria-hidden="true"
          >
            {format(date, 'd')}
          </span>
          
          {/* Add event button - larger touch target on mobile */}
          <TouchOptimizedButton
            variant="ghost"
            size="sm"
            className={cn(
              "opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity",
              "focus:opacity-100",
              isMobile ? "h-8 w-8 p-0" : "h-6 w-6 p-0",
              "touch:opacity-60" // Always slightly visible on touch devices
            )}
            onClick={handleEventCreate}
            touchTarget={isMobile ? "large" : "normal"}
            aria-label={`Add event on ${format(date, 'MMMM d, yyyy')}`}
          >
            <Plus className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")} />
          </TouchOptimizedButton>
        </div>

        {/* Events */}
        <div className="space-y-0.5 sm:space-y-1">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              projectColor={getEventProjectColor(event)}
              isCompact={true}
              isSelected={selectedEventId === event.id}
              onEdit={onEventEdit}
              onDelete={onEventDelete}
              onSelect={onEventSelect}
              showTime={!event.allDay && !isMobile} // Hide time on mobile for space
              className={cn(
                "text-xs",
                isMobile && "px-1 py-0.5 min-h-[20px]",
                !isMobile && "px-2 py-1 min-h-[24px]"
              )}
              isMobile={isMobile}
            />
          ))}
          
          {/* Show more button */}
          {hiddenEventsCount > 0 && !showAllEvents && (
            <TouchOptimizedButton
              variant="ghost"
              size="sm"
              className={cn(
                "w-full text-xs text-muted-foreground hover:text-foreground transition-colors",
                "justify-start p-1",
                isMobile && "min-h-touch"
              )}
              onClick={handleShowMore}
              aria-label={`Show ${hiddenEventsCount} more events for ${format(date, 'MMMM d, yyyy')}`}
            >
              <MoreHorizontal className="h-3 w-3 mr-1" />
              +{hiddenEventsCount} more
            </TouchOptimizedButton>
          )}
        </div>

        {/* Today indicator dot for mobile */}
        {dayIsToday && isMobile && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />
        )}
      </div>

      {/* Mobile event sheet */}
      {isMobile && (
        <Sheet open={showEventSheet} onOpenChange={setShowEventSheet}>
          <SheetContent side="bottom" className="h-[70vh]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {events.length} {events.length === 1 ? 'event' : 'events'}
              </p>
            </div>
            
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    projectColor={getEventProjectColor(event)}
                    isCompact={false}
                    isSelected={selectedEventId === event.id}
                    onEdit={onEventEdit}
                    onDelete={onEventDelete}
                    onSelect={onEventSelect}
                    showTime={true}
                    className="border rounded-lg p-3"
                  />
                ))}
                
                {events.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No events on this day</p>
                    <TouchOptimizedButton
                      className="mt-4"
                      onClick={() => {
                        onEventCreate?.(date);
                        setShowEventSheet(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </TouchOptimizedButton>
                  </div>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
});

ResponsiveDayCell.displayName = 'ResponsiveDayCell';

const ResponsiveMonthView: React.FC<ResponsiveMonthViewProps> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect,
  enableVirtualization = true,
  compactMode = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { announce } = useAriaLiveRegion();
  
  const {
    store,
    isReady,
    projectColors,
    monthViewData,
    handleEventMove,
    performanceStats
  } = useOptimizedCalendar('month');

  // Set up touch navigation
  const {
    handleSwipeLeft,
    handleSwipeRight,
  } = useCalendarTouchNavigation({
    viewMode: 'month',
    currentDate: store?.currentDate || new Date(),
    onDateChange: (date) => store?.setCurrentDate(date),
  });

  // Set up touch gestures for the whole view
  const { bind: containerTouchBind } = useTouchGestures(containerRef, {
    enableSwipe: true,
    swipeThreshold: 50,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
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

  const handleDayClick = useCallback((date: Date) => {
    store?.setSelectedDate(date);
    if (isMobile) {
      // On mobile, we might want to navigate to day view
      announce(`Selected ${format(date, 'MMMM d, yyyy')}. Tap again to view day details.`);
    }
  }, [store, isMobile, announce]);

  // Generate calendar grid data
  const calendarDays = useMemo(() => {
    if (!store?.currentDate) return [];
    
    const monthStart = startOfMonth(store.currentDate);
    const monthEnd = endOfMonth(store.currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [store?.currentDate]);

  // Keyboard navigation
  const { focusElement } = useKeyboardNavigation(containerRef, {
    gridNavigation: true,
    onNavigate: (direction) => {
      const currentIndex = calendarDays.findIndex(day => 
        store?.selectedDate && isSameDay(day, store.selectedDate)
      );
      
      let newIndex = currentIndex;
      switch (direction) {
        case 'left':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'right':
          newIndex = Math.min(calendarDays.length - 1, currentIndex + 1);
          break;
        case 'up':
          newIndex = Math.max(0, currentIndex - 7);
          break;
        case 'down':
          newIndex = Math.min(calendarDays.length - 1, currentIndex + 7);
          break;
        case 'home':
          newIndex = 0;
          break;
        case 'end':
          newIndex = calendarDays.length - 1;
          break;
      }
      
      if (newIndex !== currentIndex && calendarDays[newIndex]) {
        handleDayClick(calendarDays[newIndex]);
      }
    },
  });

  if (!isReady || !monthViewData || !store) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  const weekDays = isMobile 
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] 
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col h-full", className)}
      role="grid"
      aria-label={`Calendar for ${format(store.currentDate, 'MMMM yyyy')}`}
      {...containerTouchBind()}
    >
      {/* Performance indicator in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/20 border-b">
          Events: {performanceStats.eventsCount} | 
          Render: {performanceStats.renderMetrics.renderTime}ms |
          {isMobile ? ' Mobile' : ' Desktop'} |
          Memory: {performanceStats.renderMetrics.memoryUsage}MB
        </div>
      )}

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/10" role="row">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              "p-2 sm:p-3 text-center font-medium text-muted-foreground border-r border-border/50 last:border-r-0",
              isMobile ? "text-xs" : "text-sm"
            )}
            role="columnheader"
            aria-label={isMobile ? 
              ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index] : 
              day
            }
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 border-border group" role="row">
        {calendarDays.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayEvents = monthViewData.eventsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(date, store.currentDate);
          const dayIsToday = isToday(date);
          const isSelected = store.selectedDate ? isSameDay(date, store.selectedDate) : false;

          return (
            <ResponsiveDayCell
              key={dateKey}
              date={date}
              events={dayEvents}
              isCurrentMonth={isCurrentMonth}
              isToday={dayIsToday}
              isSelected={isSelected}
              isMobile={isMobile}
              compactMode={compactMode}
              onDayClick={handleDayClick}
              onEventEdit={onEventEdit}
              onEventDelete={onEventDelete}
              onEventSelect={onEventSelect}
              onEventMove={handleEventMove}
              onEventCreate={onEventCreate}
              selectedEventId={store.selectedEventId}
              projectColors={projectColors}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(ResponsiveMonthView);