"use client";

import React, { useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import { format, isSameDay, isToday, startOfDay, endOfDay, differenceInMinutes, addMinutes } from 'date-fns';
import { useCalendar } from '@/components/providers/calendar-provider';
import { useProjectStore } from '@/stores/projectStore';
import EventCard, { DragItem } from './EventCard';
import TimeGrid from './TimeGrid';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface WeekViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
}

interface DayColumnProps {
  date: Date;
  events: Event[];
  isToday: boolean;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventSelect?: (event: Event) => void;
  onEventMove: (eventId: string, newDate: Date, newTime?: Date) => void;
  onEventCreate?: (date: Date, time?: Date) => void;
  selectedEventId: string | null;
  projectColors: Record<string, string>;
}

interface EventLayoutInfo extends Event {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

const PIXELS_PER_MINUTE = 1;
const HOUR_HEIGHT = 60;
const ALL_DAY_HEIGHT = 40;

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  events,
  isToday: dayIsToday,
  onEventEdit,
  onEventDelete,
  onEventSelect,
  onEventMove,
  onEventCreate,
  selectedEventId,
  projectColors
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'event',
    drop: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Get the drop target element
      const dropElement = document.elementFromPoint(clientOffset.x, clientOffset.y);
      const timeSlot = dropElement?.closest('[data-time]') as HTMLElement;
      
      if (timeSlot) {
        const hour = parseInt(timeSlot.dataset.hour || '0');
        const minute = parseInt(timeSlot.dataset.minute || '0');
        
        // Create new date with specific time
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

  // Separate all-day and timed events
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: Event[] = [];
    const timed: Event[] = [];
    
    events.forEach(event => {
      if (event.allDay) {
        allDay.push(event);
      } else {
        timed.push(event);
      }
    });
    
    return { allDayEvents: allDay, timedEvents: timed };
  }, [events]);

  // Calculate layout for timed events (handle overlapping)
  const layoutEvents = useMemo((): EventLayoutInfo[] => {
    if (timedEvents.length === 0) return [];

    // Sort events by start time
    const sortedEvents = [...timedEvents].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Group overlapping events
    const eventGroups: Event[][] = [];
    
    sortedEvents.forEach(event => {
      let placed = false;
      
      // Try to find an existing group where this event doesn't overlap
      for (const group of eventGroups) {
        const hasOverlap = group.some(groupEvent => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          const groupEventStart = new Date(groupEvent.startDate);
          const groupEventEnd = new Date(groupEvent.endDate);
          
          return (
            eventStart < groupEventEnd && eventEnd > groupEventStart
          );
        });
        
        if (!hasOverlap) {
          group.push(event);
          placed = true;
          break;
        }
      }
      
      // If no suitable group found, create a new one
      if (!placed) {
        eventGroups.push([event]);
      }
    });

    // Calculate positions for each event
    const layoutInfos: EventLayoutInfo[] = [];
    const dayStart = startOfDay(date);
    
    eventGroups.forEach((group, groupIndex) => {
      // Find all overlapping events within this group
      group.forEach(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        // Calculate overlapping events for column layout
        const overlappingEvents = timedEvents.filter(otherEvent => {
          if (otherEvent.id === event.id) return false;
          
          const otherStart = new Date(otherEvent.startDate);
          const otherEnd = new Date(otherEvent.endDate);
          
          return (
            eventStart < otherEnd && eventEnd > otherStart
          );
        });
        
        const totalColumns = overlappingEvents.length + 1;
        const currentColumn = overlappingEvents.filter(otherEvent => 
          new Date(otherEvent.startDate) <= eventStart
        ).length;
        
        // Calculate position
        const startMinutes = Math.max(0, differenceInMinutes(eventStart, dayStart));
        const durationMinutes = differenceInMinutes(eventEnd, eventStart);
        
        layoutInfos.push({
          ...event,
          top: ALL_DAY_HEIGHT + (startMinutes * PIXELS_PER_MINUTE),
          height: Math.max(20, durationMinutes * PIXELS_PER_MINUTE),
          left: (currentColumn / totalColumns) * 100,
          width: (1 / totalColumns) * 100,
          zIndex: 10 + groupIndex
        });
      });
    });
    
    return layoutInfos;
  }, [timedEvents, date]);

  const getEventProjectColor = (event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  };

  const handleTimeSlotClick = (hour: number, minute: number) => {
    if (!onEventCreate) return;
    
    const newDateTime = new Date(date);
    newDateTime.setHours(hour, minute, 0, 0);
    onEventCreate(date, newDateTime);
  };

  return (
    <div
      ref={drop}
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
        
        {/* Add all-day event button */}
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

      {/* Time-based events */}
      <div className="relative">
        {/* Time grid background - clickable areas */}
        <div className="absolute inset-0">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="relative h-[60px]">
              {/* Hour slot */}
              <div
                className="absolute inset-0 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                onClick={() => handleTimeSlotClick(hour, 0)}
                data-hour={hour}
                data-minute={0}
                data-time={format(new Date().setHours(hour, 0), 'HH:mm')}
              />
              
              {/* Half-hour slot */}
              <div
                className="absolute inset-0 top-1/2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                onClick={() => handleTimeSlotClick(hour, 30)}
                data-hour={hour}
                data-minute={30}
                data-time={format(new Date().setHours(hour, 30), 'HH:mm')}
              />
            </div>
          ))}
        </div>

        {/* Timed events */}
        {layoutEvents.map((eventInfo) => (
          <div
            key={eventInfo.id}
            className="absolute px-1"
            style={{
              top: `${eventInfo.top}px`,
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
              onResize={handleEventResize}
              isResizable={true}
              showTime={true}
              className="h-full"
            />
          </div>
        ))}

        {/* Current time indicator for today */}
        {dayIsToday && (
          <CurrentTimeIndicator 
            date={date}
            pixelsPerMinute={PIXELS_PER_MINUTE}
            showLabel={false}
          />
        )}
      </div>
    </div>
  );
};

const WeekView: React.FC<WeekViewProps> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect
}) => {
  const { store, selectors, dateUtils, isReady } = useCalendar();
  const projectStore = useProjectStore();

  // Get week days
  const weekDays = useMemo(() => {
    return dateUtils.getWeekViewDays(store.currentDate);
  }, [store.currentDate, dateUtils]);

  // Create project color mapping
  const projectColors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    projectStore.projects.forEach(project => {
      colorMap[project.id] = project.color;
    });
    return colorMap;
  }, [projectStore.projects]);

  // Group events by date (with project filtering)
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    
    // Filter events based on selected projects
    const filteredEvents = projectStore.selectedProjectIds.length > 0
      ? store.events.filter(event => 
          projectStore.selectedProjectIds.includes(event.projectId || '')
        )
      : store.events;
    
    filteredEvents.forEach(event => {
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
  }, [store.events, projectStore.selectedProjectIds]);

  const handleEventMove = async (eventId: string, newDate: Date, newTime?: Date) => {
    try {
      const event = store.events.find(e => e.id === eventId);
      if (!event) return;

      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const duration = endDate.getTime() - startDate.getTime();

      let newStartDate: Date;
      
      if (newTime) {
        // Use specific time if provided (from time slot drop)
        newStartDate = new Date(newTime);
      } else {
        // Keep same time, change date only
        newStartDate = new Date(newDate);
        newStartDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      }
      
      const newEndDate = new Date(newStartDate.getTime() + duration);

      await store.updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
    } catch (error) {
      console.error('Failed to move event:', error);
    }
  };

  const handleEventResize = async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      await store.updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
    } catch (error) {
      console.error('Failed to resize event:', error);
    }
  };

  if (!isReady) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Week view header */}
      <div className="flex border-b border-border bg-background">
        {/* Time column header */}
        <div className="w-16 border-r border-border/30 p-2">
          <div className="text-xs text-muted-foreground">Time</div>
        </div>
        
        {/* Day headers */}
        {weekDays.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const dayIsToday = isToday(date);

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
                events={dayEvents}
                isToday={dayIsToday}
                onEventEdit={onEventEdit}
                onEventDelete={onEventDelete}
                onEventSelect={onEventSelect}
                onEventMove={handleEventMove}
                onEventCreate={onEventCreate}
                selectedEventId={store.selectedEventId}
                projectColors={projectColors}
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
        
        {/* Days content */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex">
            {weekDays.map((date, index) => (
              <div 
                key={format(date, 'yyyy-MM-dd')}
                className="flex-1 border-r border-border/10 last:border-r-0"
                style={{ minHeight: `${24 * HOUR_HEIGHT + ALL_DAY_HEIGHT}px` }}
              >
                {/* Time grid lines */}
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

export default WeekView;