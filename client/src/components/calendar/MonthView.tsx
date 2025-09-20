"use client";

import React, { useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import { format, isSameMonth, isToday, isSameDay, startOfDay } from 'date-fns';
import { useCalendar } from '@/components/providers/calendar-provider';
import { useProjectStore } from '@/stores/projectStore';
import EventCard, { DragItem } from './EventCard';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus } from 'lucide-react';

interface MonthViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
}

interface DayProps {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onDayClick: (date: Date) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
  onEventMove: (eventId: string, newDate: Date) => void;
  selectedEventId: string | null;
  projectColors: Record<string, string>;
}

const MAX_VISIBLE_EVENTS = 3;

const DayCell: React.FC<DayProps> = ({
  date,
  events,
  isCurrentMonth,
  isToday: dayIsToday,
  isSelected,
  onDayClick,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect,
  onEventMove,
  selectedEventId,
  projectColors
}) => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'event',
    drop: (item: DragItem) => {
      onEventMove(item.id, date);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const visibleEvents = showAllEvents ? events : events.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenEventsCount = Math.max(0, events.length - MAX_VISIBLE_EVENTS);

  const handleDayClick = () => {
    onDayClick(date);
  };

  const getEventProjectColor = (event: Event) => {
    // Try to get project color, fallback to event color
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  };

  return (
    <div
      ref={drop as any}
      className={cn(
        "relative min-h-[120px] p-2 border-r border-b border-border/50 transition-colors",
        "hover:bg-muted/30 cursor-pointer",
        !isCurrentMonth && "bg-muted/20 text-muted-foreground",
        dayIsToday && "bg-blue-50 dark:bg-blue-900/20",
        isSelected && "bg-blue-100 dark:bg-blue-800/30",
        isOver && "bg-blue-200 dark:bg-blue-700/40"
      )}
      onClick={handleDayClick}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "text-sm font-medium",
            dayIsToday && "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
          )}
        >
          {format(date, 'd')}
        </span>
        
        {/* Add event button - show on hover */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onEventCreate?.(date);
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Events */}
      <div className="space-y-1">
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
            showTime={!event.allDay}
          />
        ))}
        
        {/* Show more button */}
        {hiddenEventsCount > 0 && !showAllEvents && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllEvents(true);
            }}
          >
            <ChevronDown className="h-3 w-3 inline mr-1" />
            +{hiddenEventsCount} more
          </button>
        )}
      </div>
    </div>
  );
};

const MonthView: React.FC<MonthViewProps> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect
}) => {
  const { store, selectors, dateUtils, isReady } = useCalendar();
  const projectStore = useProjectStore();

  // Get month grid days
  const monthDays = useMemo(() => {
    return dateUtils.getMonthViewDays(store.currentDate);
  }, [store.currentDate, dateUtils]);

  // Create project color mapping
  const projectColors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    projectStore.projects.forEach(project => {
      colorMap[project.id] = project.color;
    });
    return colorMap;
  }, [projectStore.projects]);

  // Group events by date for efficient lookup (with project filtering)
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

  const handleDayClick = (date: Date) => {
    store.setSelectedDate(date);
  };

  const handleEventMove = async (eventId: string, newDate: Date) => {
    try {
      const event = store.events.find(e => e.id === eventId);
      if (!event) return;

      // Calculate the duration of the event
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const duration = endDate.getTime() - startDate.getTime();

      // Set new start time to the same time of day on the new date
      const newStartDate = new Date(newDate);
      newStartDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      
      // Set new end date maintaining the same duration
      const newEndDate = new Date(newStartDate.getTime() + duration);

      await store.updateEvent(eventId, {
        startDate: newStartDate,
        endDate: newEndDate
      });
    } catch (error) {
      console.error('Failed to move event:', error);
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
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border/50 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 border-border">
        {monthDays.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(date, store.currentDate);
          const dayIsToday = isToday(date);
          const isSelected = store.selectedDate ? isSameDay(date, store.selectedDate) : false;

          return (
            <DayCell
              key={dateKey}
              date={date}
              events={dayEvents}
              isCurrentMonth={isCurrentMonth}
              isToday={dayIsToday}
              isSelected={isSelected}
              onDayClick={handleDayClick}
              onEventEdit={onEventEdit}
              onEventDelete={onEventDelete}
              onEventCreate={onEventCreate}
              onEventSelect={onEventSelect}
              onEventMove={handleEventMove}
              selectedEventId={store.selectedEventId}
              projectColors={projectColors}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;