"use client";

import React, { memo, useMemo, useState, useCallback, useRef } from 'react';
import { List } from 'react-window';
import { useDrop } from 'react-dnd';
import { format, isSameDay, isToday, differenceInMinutes, addMinutes } from 'date-fns';
import { useOptimizedCalendar } from '@/hooks/useOptimizedCalendar';
import EventCard, { DragItem } from './EventCard';
import TimeGrid from './TimeGrid';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ChunkedProcessor } from '@/lib/utils/performance-utils';

interface OptimizedWeekViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
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

interface DayColumnProps {
  date: Date;
  events: Event[];
  layoutEvents: EventLayoutInfo[];
  allDayEvents: Event[];
  isToday: boolean;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventSelect?: (event: Event) => void;
  onEventMove: (eventId: string, newDate: Date, newTime?: Date) => void;
  onEventCreate?: (date: Date, time?: Date) => void;
  selectedEventId: string | null;
  projectColors: Record<string, string>;
  enableVirtualScrolling?: boolean;
}

interface TimeSlotProps {
  hour: number;
  date: Date;
  events: EventLayoutInfo[];
  isToday: boolean;
  onTimeSlotClick: (hour: number, minute: number) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventSelect?: (event: Event) => void;
  selectedEventId: string | null;
  projectColors: Record<string, string>;
}

const PIXELS_PER_MINUTE = 1;
const HOUR_HEIGHT = 60;
const ALL_DAY_HEIGHT = 40;

// Memoized time slot component for virtual scrolling
const TimeSlot = memo<TimeSlotProps>(({
  hour,
  date,
  events,
  isToday: dayIsToday,
  onTimeSlotClick,
  onEventEdit,
  onEventDelete,
  onEventSelect,
  selectedEventId,
  projectColors
}) => {
  const hourEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventHour = eventStart.getHours();
      return eventHour === hour;
    });
  }, [events, hour]);

  const getEventProjectColor = useCallback((event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  }, [projectColors]);

  return (
    <div className="relative h-[60px]">
      {/* Hour slot background */}
      <div
        className="absolute inset-0 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
        onClick={() => onTimeSlotClick(hour, 0)}
        data-hour={hour}
        data-minute={0}
        data-time={format(new Date().setHours(hour, 0), 'HH:mm')}
      />
      
      {/* Half-hour slot background */}
      <div
        className="absolute inset-0 top-1/2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
        onClick={() => onTimeSlotClick(hour, 30)}
        data-hour={hour}
        data-minute={30}
        data-time={format(new Date().setHours(hour, 30), 'HH:mm')}
      />

      {/* Time slot border */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/10" />
      <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/10" />

      {/* Events in this hour */}
      {hourEvents.map((eventInfo) => (
        <div
          key={eventInfo.id}
          className="absolute px-1"
          style={{
            top: `${eventInfo.top - (hour * HOUR_HEIGHT)}px`,
            height: `${eventInfo.height}px`,
            left: `${eventInfo.left}%`,
            width: `${eventInfo.width}%`,
            zIndex: eventInfo.zIndex
          }}
        >
          <EventCard
            event={eventInfo}
            projectColor={getEventProjectColor(eventInfo)}
            isCompact={eventInfo.height < 60}
            isSelected={selectedEventId === eventInfo.id}
            onEdit={onEventEdit}
            onDelete={onEventDelete}
            onSelect={onEventSelect}
            showTime={true}
            className="h-full"
          />
        </div>
      ))}

      {/* Current time indicator for today */}
      {dayIsToday && new Date().getHours() === hour && (
        <CurrentTimeIndicator 
          date={date}
          pixelsPerMinute={PIXELS_PER_MINUTE}
          showLabel={false}
        />
      )}
    </div>
  );
});

TimeSlot.displayName = 'TimeSlot';

// Virtualized list item renderer
const VirtualTimeSlot = memo<{ index: number; style: any; data: any }>(({ index, style, data }) => {
  const { date, events, isToday, onTimeSlotClick, onEventEdit, onEventDelete, onEventSelect, selectedEventId, projectColors } = data;

  return (
    <div style={style}>
      <TimeSlot
        hour={index}
        date={date}
        events={events}
        isToday={isToday}
        onTimeSlotClick={onTimeSlotClick}
        onEventEdit={onEventEdit}
        onEventDelete={onEventDelete}
        onEventSelect={onEventSelect}
        selectedEventId={selectedEventId}
        projectColors={projectColors}
      />
    </div>
  );
});

VirtualTimeSlot.displayName = 'VirtualTimeSlot';

// Optimized day column with virtual scrolling
const DayColumn = memo<DayColumnProps>(({
  date,
  events,
  layoutEvents,
  allDayEvents,
  isToday: dayIsToday,
  onEventEdit,
  onEventDelete,
  onEventSelect,
  onEventMove,
  onEventCreate,
  selectedEventId,
  projectColors,
  enableVirtualScrolling = false
}) => {
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
        
        const newDateTime = new Date(date);
        newDateTime.setHours(hour, minute, 0, 0);
        
        onEventMove(item.id, date, newDateTime);
      } else {
        onEventMove(item.id, date);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getEventProjectColor = useCallback((event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  }, [projectColors]);

  const handleTimeSlotClick = useCallback((hour: number, minute: number) => {
    if (!onEventCreate) return;
    
    const newDateTime = new Date(date);
    newDateTime.setHours(hour, minute, 0, 0);
    onEventCreate(date, newDateTime);
  }, [date, onEventCreate]);

  const virtualScrollData = useMemo(() => ({
    date,
    events: layoutEvents,
    isToday: dayIsToday,
    onTimeSlotClick: handleTimeSlotClick,
    onEventEdit,
    onEventDelete,
    onEventSelect,
    selectedEventId,
    projectColors
  }), [date, layoutEvents, dayIsToday, handleTimeSlotClick, onEventEdit, onEventDelete, onEventSelect, selectedEventId, projectColors]);

  return (
    <div
      ref={drop as any}
      className={cn(
        "relative flex-1 border-r border-border/30 min-w-0",
        "hover:bg-muted/20 transition-colors",
        dayIsToday && "bg-blue-50 dark:bg-blue-900/10",
        isOver && "bg-blue-100 dark:bg-blue-800/20"
      )}
    >
      {/* Date header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border/30 p-2 text-center">
        <div className="text-sm text-muted-foreground">
          {format(date, 'EEE')}
        </div>
        <div className={cn(
          "text-lg font-medium",
          dayIsToday && "bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto"
        )}>
          {format(date, 'd')}
        </div>
      </div>

      {/* All-day events section */}
      <div 
        className="relative bg-muted/10 border-b border-border/20 min-h-[40px] p-1"
        style={{ minHeight: `${ALL_DAY_HEIGHT}px` }}
      >
        {allDayEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            projectColor={getEventProjectColor(event)}
            isCompact={true}
            isSelected={selectedEventId === event.id}
            onEdit={onEventEdit}
            onDelete={onEventDelete}
            onSelect={onEventSelect}
            showTime={false}
            className="mb-1"
          />
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-full opacity-0 hover:opacity-100 transition-opacity text-xs"
          onClick={() => onEventCreate?.(date)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add all-day event
        </Button>
      </div>

      {/* Time-based events container */}
      <div className="relative">
        {enableVirtualScrolling && layoutEvents.length > 50 ? (
          // Use virtual scrolling for many events
          <div style={{height: 24 * HOUR_HEIGHT}}>
            {/* @ts-ignore */}
            <List
              height={24 * HOUR_HEIGHT}
              itemCount={24}
              itemSize={HOUR_HEIGHT}
              itemData={virtualScrollData}
              className="week-view-timeline"
            >
              {VirtualTimeSlot as any}
            </List>
          </div>
        ) : (
          // Traditional rendering for fewer events
          <div>
            {Array.from({ length: 24 }, (_, hour) => (
              <TimeSlot
                key={hour}
                hour={hour}
                date={date}
                events={layoutEvents}
                isToday={dayIsToday}
                onTimeSlotClick={handleTimeSlotClick}
                onEventEdit={onEventEdit}
                onEventDelete={onEventDelete}
                onEventSelect={onEventSelect}
                selectedEventId={selectedEventId}
                projectColors={projectColors}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

DayColumn.displayName = 'DayColumn';

const OptimizedWeekView: React.FC<OptimizedWeekViewProps> = ({
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
    weekViewData,
    handleEventMove,
    performanceStats
  } = useOptimizedCalendar('week');

  // Process event layouts using chunked processing to avoid blocking
  const processedEventLayouts = useMemo(() => {
    if (!weekViewData?.eventGroupsByDate) return {};
    
    const layoutMap: Record<string, { layoutEvents: EventLayoutInfo[], allDayEvents: Event[] }> = {};
    
    Object.entries(weekViewData.eventsByDate).forEach(([dateKey, events]) => {
      const eventsArray = events as Event[];
      const { allDayEvents, timedEvents } = eventsArray.reduce(
        (acc: { allDayEvents: Event[], timedEvents: Event[] }, event: Event) => {
          if (event.allDay) {
            acc.allDayEvents.push(event);
          } else {
            acc.timedEvents.push(event);
          }
          return acc;
        },
        { allDayEvents: [] as Event[], timedEvents: [] as Event[] }
      );

      // Calculate layout for timed events
      const layoutEvents = calculateEventLayout(timedEvents, new Date(dateKey));
      
      layoutMap[dateKey] = { layoutEvents, allDayEvents };
    });
    
    return layoutMap;
  }, [weekViewData?.eventsByDate, weekViewData?.eventGroupsByDate]);

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

  // Determine if virtual scrolling should be enabled
  const shouldUseVirtualScrolling = useMemo(() => {
    return enableVirtualization && (weekViewData?.totalEvents || 0) > 200;
  }, [enableVirtualization, weekViewData?.totalEvents]);

  if (!isReady || !weekViewData) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Performance indicator in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/20 border-b">
          Events: {performanceStats.eventsCount} | 
          Render: {performanceStats.renderMetrics.renderTime}ms |
          {shouldUseVirtualScrolling ? ' Virtual Scrolling' : ' Traditional'} |
          Memory: {performanceStats.renderMetrics.memoryUsage}MB
        </div>
      )}

      {/* Week view header */}
      <div className="flex border-b border-border bg-background">
        {/* Time column header */}
        <div className="w-16 border-r border-border/30 p-2">
          <div className="text-xs text-muted-foreground">Time</div>
        </div>
        
        {/* Day headers */}
        {weekViewData.days.map((date: Date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayIsToday = isToday(date);
          const dayLayout = processedEventLayouts[dateKey] || { layoutEvents: [], allDayEvents: [] };

          return (
            <div
              key={dateKey}
              className={cn(
                "flex-1 border-r border-border/30 last:border-r-0",
                dayIsToday && "bg-blue-50 dark:bg-blue-900/10"
              )}
            >
              <DayColumn
                date={date}
                events={weekViewData.eventsByDate[dateKey] || []}
                layoutEvents={dayLayout.layoutEvents}
                allDayEvents={dayLayout.allDayEvents}
                isToday={dayIsToday}
                onEventEdit={onEventEdit}
                onEventDelete={onEventDelete}
                onEventSelect={onEventSelect}
                onEventMove={handleEventMove}
                onEventCreate={onEventCreate}
                selectedEventId={store.selectedEventId}
                projectColors={projectColors}
                enableVirtualScrolling={shouldUseVirtualScrolling}
              />
            </div>
          );
        })}
      </div>

      {/* Time grid and content */}
      <div className="flex flex-1 overflow-auto">
        {/* Time labels column */}
        <div className="w-16 border-r border-border/30 flex-shrink-0">
          <TimeGrid 
            startHour={0}
            endHour={24}
            intervalMinutes={30}
            showAllHours={false}
          />
        </div>
        
        {/* Days content - this provides the scrollable area */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex">
            {weekViewData.days.map((date: Date, index: number) => (
              <div 
                key={format(date, 'yyyy-MM-dd')}
                className="flex-1 border-r border-border/10 last:border-r-0"
                style={{ minHeight: `${24 * HOUR_HEIGHT + ALL_DAY_HEIGHT}px` }}
              >
                {/* This provides the visual grid lines */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="relative h-[60px] border-t border-border/10 first:border-t-0">
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/10" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate event layout with overlap handling
function calculateEventLayout(events: Event[], date: Date): EventLayoutInfo[] {
  if (events.length === 0) return [];

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const layoutInfos: EventLayoutInfo[] = [];
  
  sortedEvents.forEach(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // Calculate overlapping events for column layout
    const overlappingEvents = events.filter(otherEvent => {
      if (otherEvent.id === event.id) return false;
      
      const otherStart = new Date(otherEvent.startDate);
      const otherEnd = new Date(otherEvent.endDate);
      
      return eventStart < otherEnd && eventEnd > otherStart;
    });
    
    const totalColumns = overlappingEvents.length + 1;
    const currentColumn = overlappingEvents.filter(otherEvent => 
      new Date(otherEvent.startDate) <= eventStart
    ).length;
    
    // Calculate position
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const startMinutes = Math.max(0, differenceInMinutes(eventStart, dayStart));
    const durationMinutes = differenceInMinutes(eventEnd, eventStart);
    
    layoutInfos.push({
      ...event,
      top: ALL_DAY_HEIGHT + (startMinutes * PIXELS_PER_MINUTE),
      height: Math.max(20, durationMinutes * PIXELS_PER_MINUTE),
      left: (currentColumn / totalColumns) * 100,
      width: (1 / totalColumns) * 100,
      zIndex: 10
    });
  });
  
  return layoutInfos;
}

export default memo(OptimizedWeekView);