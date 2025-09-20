"use client";

import React, { memo, useMemo, useCallback, useState } from 'react';
import { List } from 'react-window';
import { useDrop } from 'react-dnd';
import { format, differenceInMinutes, isToday } from 'date-fns';
import { useOptimizedCalendar } from '@/hooks/useOptimizedCalendar';
import EventCard, { DragItem } from './EventCard';
import TimeGrid from './TimeGrid';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface OptimizedDayViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date, time?: Date) => void;
  onEventSelect?: (event: Event) => void;
  enableVirtualization?: boolean;
}

interface EventLayoutInfo extends Event {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

interface TimeSlotProps {
  hour: number;
  minute?: number;
  date: Date;
  events: EventLayoutInfo[];
  isToday: boolean;
  onTimeSlotClick: (hour: number, minute: number) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventSelect?: (event: Event) => void;
  onEventResize?: (eventId: string, newStartDate: Date, newEndDate: Date) => void;
  selectedEventId: string | null;
  projectColors: Record<string, string>;
}

interface VirtualTimeSlotProps {
  index: number;
  style: any;
  data: {
    date: Date;
    events: EventLayoutInfo[];
    isToday: boolean;
    onTimeSlotClick: (hour: number, minute: number) => void;
    onEventEdit?: (event: Event) => void;
    onEventDelete?: (event: Event) => void;
    onEventSelect?: (event: Event) => void;
    onEventResize?: (eventId: string, newStartDate: Date, newEndDate: Date) => void;
    selectedEventId: string | null;
    projectColors: Record<string, string>;
  };
}

const PIXELS_PER_MINUTE = 1;
const HOUR_HEIGHT = 60;
const ALL_DAY_HEIGHT = 60;
const HALF_HOUR_HEIGHT = 30;

// Individual time slot component (30-minute slots)
const TimeSlot = memo<TimeSlotProps>(({
  hour,
  minute = 0,
  date,
  events,
  isToday: dayIsToday,
  onTimeSlotClick,
  onEventEdit,
  onEventDelete,
  onEventSelect,
  onEventResize,
  selectedEventId,
  projectColors
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Filter events that intersect with this time slot
  const slotEvents = useMemo(() => {
    const slotStart = hour * 60 + minute;
    const slotEnd = slotStart + 30;
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const eventStartMinutes = differenceInMinutes(eventStart, dayStart);
      const eventEndMinutes = differenceInMinutes(eventEnd, dayStart);
      
      return eventStartMinutes < slotEnd && eventEndMinutes > slotStart;
    });
  }, [events, hour, minute, date]);

  const getEventProjectColor = useCallback((event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  }, [projectColors]);

  const currentTime = useMemo(() => {
    if (dayIsToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour === hour && currentMinute >= minute && currentMinute < minute + 30) {
        return { hour: currentHour, minute: currentMinute };
      }
    }
    return null;
  }, [dayIsToday, hour, minute]);

  return (
    <div 
      className={cn(
        "relative border-b border-border/20 transition-colors",
        isHovered && "bg-blue-50/30 dark:bg-blue-900/20",
        minute === 0 ? "border-b-border" : "border-b-border/40"
      )}
      style={{ height: `${HALF_HOUR_HEIGHT}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Clickable area */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => onTimeSlotClick(hour, minute)}
        data-hour={hour}
        data-minute={minute}
        data-time={format(new Date().setHours(hour, minute), 'HH:mm')}
      />

      {/* Add event button on hover */}
      {isHovered && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-80 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            const newDateTime = new Date(date);
            newDateTime.setHours(hour, minute, 0, 0);
            onEventEdit?.({} as Event); // This should open create modal
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}

      {/* Events in this time slot */}
      {slotEvents.map((eventInfo) => {
        const eventTop = eventInfo.top - (hour * HOUR_HEIGHT + minute * PIXELS_PER_MINUTE);
        const isEventInSlot = eventTop >= -eventInfo.height && eventTop <= HALF_HOUR_HEIGHT;
        
        if (!isEventInSlot) return null;

        return (
          <div
            key={eventInfo.id}
            className="absolute px-1"
            style={{
              top: `${Math.max(0, eventTop)}px`,
              height: `${Math.min(eventInfo.height, HALF_HOUR_HEIGHT - Math.max(0, eventTop))}px`,
              left: `${eventInfo.left}%`,
              width: `${eventInfo.width}%`,
              zIndex: eventInfo.zIndex
            }}
          >
            <EventCard
              event={eventInfo}
              projectColor={getEventProjectColor(eventInfo)}
              isCompact={eventInfo.height < 40}
              isSelected={selectedEventId === eventInfo.id}
              onEdit={onEventEdit}
              onDelete={onEventDelete}
              onSelect={onEventSelect}
              onResize={onEventResize}
              isResizable={true}
              showTime={true}
              className="h-full"
            />
          </div>
        );
      })}

      {/* Current time indicator */}
      {currentTime && (
        <div 
          className="absolute left-0 right-0 h-0.5 bg-red-500 z-50"
          style={{
            top: `${((currentTime.minute - minute) / 30) * HALF_HOUR_HEIGHT}px`
          }}
        >
          <div className="absolute left-0 w-2 h-2 bg-red-500 rounded-full -translate-x-1 -translate-y-1/2" />
        </div>
      )}
    </div>
  );
});

TimeSlot.displayName = 'TimeSlot';

// Virtual time slot for react-window
const VirtualTimeSlot = memo<VirtualTimeSlotProps>(({ index, style, data }) => {
  const hour = Math.floor(index / 2);
  const minute = (index % 2) * 30;

  return (
    <div style={style}>
      <TimeSlot
        hour={hour}
        minute={minute}
        date={data.date}
        events={data.events}
        isToday={data.isToday}
        onTimeSlotClick={data.onTimeSlotClick}
        onEventEdit={data.onEventEdit}
        onEventDelete={data.onEventDelete}
        onEventSelect={data.onEventSelect}
        onEventResize={data.onEventResize}
        selectedEventId={data.selectedEventId}
        projectColors={data.projectColors}
      />
    </div>
  );
});

VirtualTimeSlot.displayName = 'VirtualTimeSlot';

const OptimizedDayView: React.FC<OptimizedDayViewProps> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect,
  enableVirtualization = true
}) => {
  const {
    store,
    isReady,
    projectColors,
    dayViewData,
    handleEventMove,
    performanceStats
  } = useOptimizedCalendar('day');

  const [{ isOver }, drop] = useDrop({
    accept: 'event',
    drop: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const dropElement = document.elementFromPoint(clientOffset.x, clientOffset.y);
      const timeSlot = dropElement?.closest('[data-time]') as HTMLElement;
      
      if (timeSlot) {
        const hour = parseInt(timeSlot.dataset.hour || '0');
        const minute = parseInt(timeSlot.dataset.minute || '0');
        
        const newDateTime = new Date(store.currentDate);
        newDateTime.setHours(hour, minute, 0, 0);
        
        handleEventMove(item.id, store.currentDate, newDateTime);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Calculate event layout for the day
  const layoutEvents = useMemo((): EventLayoutInfo[] => {
    if (!dayViewData?.timedEvents.length) return [];

    const sortedEvents = [...dayViewData.timedEvents].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return sortedEvents.map(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Calculate overlapping events
      const overlappingEvents = dayViewData.timedEvents.filter((otherEvent: Event) => {
        if (otherEvent.id === event.id) return false;
        
        const otherStart = new Date(otherEvent.startDate);
        const otherEnd = new Date(otherEvent.endDate);
        
        return eventStart < otherEnd && eventEnd > otherStart;
      });
      
      const totalColumns = overlappingEvents.length + 1;
      const currentColumn = overlappingEvents.filter((otherEvent: Event) =>
        new Date(otherEvent.startDate) <= eventStart
      ).length;
      
      // Calculate position
      const dayStart = new Date(store.currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const startMinutes = Math.max(0, differenceInMinutes(eventStart, dayStart));
      const durationMinutes = differenceInMinutes(eventEnd, eventStart);
      
      return {
        ...event,
        top: ALL_DAY_HEIGHT + (startMinutes * PIXELS_PER_MINUTE),
        height: Math.max(30, durationMinutes * PIXELS_PER_MINUTE),
        left: (currentColumn / totalColumns) * 100,
        width: (1 / totalColumns) * 100,
        zIndex: 10
      };
    });
  }, [dayViewData?.timedEvents, store.currentDate]);

  const handleTimeSlotClick = useCallback((hour: number, minute: number) => {
    if (!onEventCreate) return;
    
    const newDateTime = new Date(store.currentDate);
    newDateTime.setHours(hour, minute, 0, 0);
    onEventCreate(store.currentDate, newDateTime);
  }, [store.currentDate, onEventCreate]);

  const handleEventResize = useCallback(async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      await store.updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
    } catch (error) {
      console.error('Failed to resize event:', error);
    }
  }, [store]);

  const handlePrevDay = useCallback(() => {
    const prevDay = new Date(store.currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    store.setCurrentDate(prevDay);
  }, [store]);

  const handleNextDay = useCallback(() => {
    const nextDay = new Date(store.currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    store.setCurrentDate(nextDay);
  }, [store]);

  const getEventProjectColor = useCallback((event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  }, [projectColors]);

  const virtualScrollData = useMemo(() => ({
    date: store.currentDate,
    events: layoutEvents,
    isToday: isToday(store.currentDate),
    onTimeSlotClick: handleTimeSlotClick,
    onEventEdit,
    onEventDelete,
    onEventSelect,
    onEventResize: handleEventResize,
    selectedEventId: store.selectedEventId,
    projectColors
  }), [
    store.currentDate,
    layoutEvents,
    handleTimeSlotClick,
    onEventEdit,
    onEventDelete,
    onEventSelect,
    handleEventResize,
    store.selectedEventId,
    projectColors
  ]);

  // Determine if virtual scrolling should be used
  const shouldUseVirtualScrolling = useMemo(() => {
    return enableVirtualization && layoutEvents.length > 20;
  }, [enableVirtualization, layoutEvents.length]);

  if (!isReady || !dayViewData) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  const dayIsToday = isToday(store.currentDate);

  return (
    <div ref={drop as any} className={cn("flex flex-col h-full", className, isOver && "bg-blue-100/20")}>
      {/* Performance indicator in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/20 border-b">
          Events: {dayViewData.totalEvents} | 
          Render: {performanceStats.renderMetrics.renderTime}ms |
          {shouldUseVirtualScrolling ? ' Virtual Scrolling' : ' Traditional'} |
          Memory: {performanceStats.renderMetrics.memoryUsage}MB
        </div>
      )}

      {/* Day header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h1 className={cn(
              "text-2xl font-bold",
              dayIsToday && "text-blue-600"
            )}>
              {format(store.currentDate, 'EEEE')}
            </h1>
            <p className="text-muted-foreground">
              {format(store.currentDate, 'MMMM d, yyyy')}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day statistics */}
        <div className="flex gap-6 justify-center mt-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">{dayViewData.totalEvents}</div>
            <div className="text-muted-foreground">Total Events</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{dayViewData.allDayEvents.length}</div>
            <div className="text-muted-foreground">All Day</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{dayViewData.timedEvents.length}</div>
            <div className="text-muted-foreground">Scheduled</div>
          </div>
        </div>
      </div>

      {/* All-day events section */}
      {dayViewData.allDayEvents.length > 0 && (
        <div className="flex-shrink-0 bg-muted/10 border-b border-border p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">All-day events</div>
          <div className="space-y-2">
            {dayViewData.allDayEvents.map((event: Event) => (
              <EventCard
                key={event.id}
                event={event}
                projectColor={getEventProjectColor(event)}
                isCompact={false}
                isSelected={store.selectedEventId === event.id}
                onEdit={onEventEdit}
                onDelete={onEventDelete}
                onSelect={onEventSelect}
                showTime={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Time-based events section */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time labels column */}
        <div className="w-16 border-r border-border/30 flex-shrink-0">
          <div style={{ height: `${ALL_DAY_HEIGHT}px` }} />
          <TimeGrid 
            startHour={0}
            endHour={24}
            intervalMinutes={30}
            showAllHours={true}
          />
        </div>
        
        {/* Day content */}
        <div className="flex-1 relative overflow-auto">
          {/* Top padding to align with time grid */}
          <div style={{ height: `${ALL_DAY_HEIGHT}px` }} />
          
          {shouldUseVirtualScrolling ? (
              <div style={{height: window.innerHeight - 200}}>
                {/* @ts-nocheck */}
                {/* @ts-ignore */}
                {React.createElement('div', { style: { height: window.innerHeight - 200 } },
                  React.createElement(List as any, {
                    height: window.innerHeight - 200,
                    itemCount: 48,
                    itemSize: HALF_HOUR_HEIGHT,
                    itemData: virtualScrollData,
                    className: "day-view-timeline",
                    children: VirtualTimeSlot
                  })
                )}
              </div>
          ) : (
            <div>
              {Array.from({ length: 48 }, (_, index) => {
                const hour = Math.floor(index / 2);
                const minute = (index % 2) * 30;
                
                return (
                  <TimeSlot
                    key={index}
                    hour={hour}
                    minute={minute}
                    date={store.currentDate}
                    events={layoutEvents}
                    isToday={dayIsToday}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventEdit={onEventEdit}
                    onEventDelete={onEventDelete}
                    onEventSelect={onEventSelect}
                    onEventResize={handleEventResize}
                    selectedEventId={store.selectedEventId}
                    projectColors={projectColors}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(OptimizedDayView);