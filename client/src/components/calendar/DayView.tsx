"use client";

import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { format, isToday, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import { useCalendar } from '@/components/providers/calendar-provider';
import { useProjectStore } from '@/stores/projectStore';
import EventCard, { DragItem } from './EventCard';
import TimeGrid from './TimeGrid';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DayViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
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
const ALL_DAY_HEIGHT = 60; // Larger all-day section for single day view

const DayView: React.FC<DayViewProps> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect
}) => {
  const { store, selectors, dateUtils, isReady } = useCalendar();
  const projectStore = useProjectStore();
  
  const currentDate = store.currentDate;
  const dayIsToday = isToday(currentDate);

  // Create project color mapping
  const projectColors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    projectStore.projects.forEach(project => {
      colorMap[project.id] = project.color;
    });
    return colorMap;
  }, [projectStore.projects]);

  // Get events for current date (with project filtering)
  const dayEvents = useMemo(() => {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    
    // Filter events based on selected projects
    const filteredEvents = projectStore.selectedProjectIds.length > 0
      ? store.events.filter(event => 
          projectStore.selectedProjectIds.includes(event.projectId || '')
        )
      : store.events;
    
    // Get events for this specific day
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);
      
      // Event overlaps with this day
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  }, [store.events, projectStore.selectedProjectIds, currentDate]);

  // Separate all-day and timed events
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: Event[] = [];
    const timed: Event[] = [];
    
    dayEvents.forEach(event => {
      if (event.allDay) {
        allDay.push(event);
      } else {
        timed.push(event);
      }
    });
    
    return { allDayEvents: allDay, timedEvents: timed };
  }, [dayEvents]);

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
    const dayStart = startOfDay(currentDate);
    
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
          height: Math.max(30, durationMinutes * PIXELS_PER_MINUTE), // Minimum 30px height for day view
          left: (currentColumn / totalColumns) * 100,
          width: (1 / totalColumns) * 100,
          zIndex: 10 + groupIndex
        });
      });
    });
    
    return layoutInfos;
  }, [timedEvents, currentDate]);

  const [{ isOver }, drop] = useDrop({
    accept: 'event',
    drop: (item: DragItem, monitor: any) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Get the drop target element
      const dropElement = document.elementFromPoint(clientOffset.x, clientOffset.y);
      const timeSlot = dropElement?.closest('[data-time]') as HTMLElement;
      
      if (timeSlot) {
        const hour = parseInt(timeSlot.dataset.hour || '0');
        const minute = parseInt(timeSlot.dataset.minute || '0');
        
        // Create new date with specific time
        const newDateTime = new Date(currentDate);
        newDateTime.setHours(hour, minute, 0, 0);
        
        handleEventMove(item.id, currentDate, newDateTime);
      } else {
        handleEventMove(item.id, currentDate);
      }
    },
    collect: (monitor: any) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getEventProjectColor = (event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  };

  const handleTimeSlotClick = (hour: number, minute: number) => {
    if (!onEventCreate) return;
    
    const newDateTime = new Date(currentDate);
    newDateTime.setHours(hour, minute, 0, 0);
    onEventCreate(newDateTime);
  };

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
    <div
      ref={drop as any}
      className={cn(
        "flex flex-col h-full",
        "hover:bg-muted/10 transition-colors",
        dayIsToday && "bg-blue-50 dark:bg-blue-900/10",
        isOver && "bg-blue-100 dark:bg-blue-800/20",
        className
      )}
    >
      {/* Day header */}
      <div className="border-b border-border bg-background p-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            {format(currentDate, 'EEEE')}
          </div>
          <div className={cn(
            "text-2xl font-medium mt-1",
            dayIsToday && "text-blue-600"
          )}>
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* All-day events section */}
      <div 
        className="border-b border-border/20 bg-muted/10 p-3"
        style={{ minHeight: `${ALL_DAY_HEIGHT}px` }}
      >
        <div className="text-xs text-muted-foreground mb-2 font-medium">All-day events</div>
        
        <div className="space-y-2">
          {allDayEvents.map((event) => (
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
          
          {/* Add all-day event button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 opacity-60 hover:opacity-100 transition-opacity text-xs border-2 border-dashed border-muted-foreground/30"
            onClick={() => onEventCreate?.(currentDate)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add all-day event
          </Button>
        </div>
      </div>

      {/* Time-based events */}
      <div className="flex flex-1 overflow-auto">
        {/* Time labels column */}
        <div className="w-20 border-r border-border/30 flex-shrink-0">
          <TimeGrid 
            startHour={0}
            endHour={24}
            intervalMinutes={30}
            showAllHours={false}
          />
        </div>
        
        {/* Events content */}
        <div className="flex-1 relative">
          {/* Time grid background - clickable areas */}
          <div className="absolute inset-0">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="relative h-[60px] border-t border-border/10 first:border-t-0">
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
                  className="absolute inset-0 top-1/2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-t border-dashed border-border/10"
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
              className="absolute px-2"
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
                isCompact={eventInfo.height < 80}
                isSelected={store.selectedEventId === eventInfo.id}
                onEdit={onEventEdit}
                onDelete={onEventDelete}
                onSelect={onEventSelect}
                onResize={handleEventResize}
                isResizable={true}
                showTime={true}
                className="h-full shadow-sm"
              />
            </div>
          ))}

          {/* Current time indicator for today */}
          {dayIsToday && (
            <CurrentTimeIndicator 
              date={currentDate}
              pixelsPerMinute={PIXELS_PER_MINUTE}
              showLabel={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DayView;