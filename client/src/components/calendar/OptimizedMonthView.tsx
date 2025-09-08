"use client";

import React, { memo, useMemo, useState, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { useDrop } from 'react-dnd';
import { format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useOptimizedCalendar } from '@/hooks/useOptimizedCalendar';
import EventCard, { DragItem } from './EventCard';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus } from 'lucide-react';

interface OptimizedMonthViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
  enableVirtualization?: boolean;
}

interface DayCellProps {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onDayClick: (date: Date) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventSelect?: (event: Event) => void;
  onEventMove: (eventId: string, newDate: Date) => void;
  selectedEventId: string | null;
  projectColors: Record<string, string>;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: any;
  data: {
    days: Date[];
    eventsByDate: Record<string, Event[]>;
    store: any;
    projectColors: Record<string, string>;
    onDayClick: (date: Date) => void;
    onEventEdit?: (event: Event) => void;
    onEventDelete?: (event: Event) => void;
    onEventSelect?: (event: Event) => void;
    onEventMove: (eventId: string, newDate: Date) => void;
    onEventCreate?: (date: Date) => void;
  };
}

const MAX_VISIBLE_EVENTS = 3;

// Memoized day cell component for optimal performance
const DayCell = memo<DayCellProps>(({
  date,
  events,
  isCurrentMonth,
  isToday: dayIsToday,
  isSelected,
  onDayClick,
  onEventEdit,
  onEventDelete,
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

  const { visibleEvents, hiddenEventsCount } = useMemo(() => {
    const visible = showAllEvents ? events : events.slice(0, MAX_VISIBLE_EVENTS);
    const hidden = Math.max(0, events.length - MAX_VISIBLE_EVENTS);
    return { visibleEvents: visible, hiddenEventsCount: hidden };
  }, [events, showAllEvents]);

  const handleDayClick = useCallback(() => {
    onDayClick(date);
  }, [onDayClick, date]);

  const handleShowMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllEvents(true);
  }, []);

  const handleEventCreate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEventCreate?.(date);
  }, [onEventCreate, date]);

  const getEventProjectColor = useCallback((event: Event) => {
    return projectColors[event.category || 'default'] || event.color || '#3b82f6';
  }, [projectColors]);

  return (
    <div
      ref={drop}
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
          onClick={handleEventCreate}
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
            onClick={handleShowMore}
          >
            <ChevronDown className="h-3 w-3 inline mr-1" />
            +{hiddenEventsCount} more
          </button>
        )}
      </div>
    </div>
  );
});

DayCell.displayName = 'DayCell';

// Grid item component for react-window
const GridItem = memo<GridItemProps>(({ columnIndex, rowIndex, style, data }) => {
  const dayIndex = rowIndex * 7 + columnIndex;
  const date = data.days[dayIndex];
  
  if (!date) return null;

  const dateKey = format(date, 'yyyy-MM-dd');
  const dayEvents = data.eventsByDate[dateKey] || [];
  const isCurrentMonth = isSameMonth(date, data.store.currentDate);
  const dayIsToday = isToday(date);
  const isSelected = data.store.selectedDate ? isSameDay(date, data.store.selectedDate) : false;

  return (
    <div style={style}>
      <DayCell
        date={date}
        events={dayEvents}
        isCurrentMonth={isCurrentMonth}
        isToday={dayIsToday}
        isSelected={isSelected}
        onDayClick={data.onDayClick}
        onEventEdit={data.onEventEdit}
        onEventDelete={data.onEventDelete}
        onEventSelect={data.onEventSelect}
        onEventMove={data.onEventMove}
        selectedEventId={data.store.selectedEventId}
        projectColors={data.projectColors}
      />
    </div>
  );
});

GridItem.displayName = 'GridItem';

// Traditional grid component for non-virtualized rendering
const TraditionalGrid = memo<{
  days: Date[];
  eventsByDate: Record<string, Event[]>;
  store: any;
  projectColors: Record<string, string>;
  onDayClick: (date: Date) => void;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventSelect?: (event: Event) => void;
  onEventMove: (eventId: string, newDate: Date) => void;
  onEventCreate?: (date: Date) => void;
}>(({
  days,
  eventsByDate,
  store,
  projectColors,
  onDayClick,
  onEventEdit,
  onEventDelete,
  onEventSelect,
  onEventMove,
  onEventCreate
}) => (
  <div className="flex-1 grid grid-cols-7 border-border">
    {days.map((date) => {
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
          onDayClick={onDayClick}
          onEventEdit={onEventEdit}
          onEventDelete={onEventDelete}
          onEventSelect={onEventSelect}
          onEventMove={onEventMove}
          selectedEventId={store.selectedEventId}
          projectColors={projectColors}
        />
      );
    })}
  </div>
));

TraditionalGrid.displayName = 'TraditionalGrid';

const OptimizedMonthView: React.FC<OptimizedMonthViewProps> = ({
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
    monthViewData,
    handleEventMove,
    performanceStats
  } = useOptimizedCalendar('month');

  const handleDayClick = useCallback((date: Date) => {
    store.setSelectedDate(date);
  }, [store]);

  const gridData = useMemo(() => ({
    days: monthViewData?.days || [],
    eventsByDate: monthViewData?.eventsByDate || {},
    store,
    projectColors,
    onDayClick: handleDayClick,
    onEventEdit,
    onEventDelete,
    onEventSelect,
    onEventMove: handleEventMove,
    onEventCreate
  }), [
    monthViewData?.days,
    monthViewData?.eventsByDate,
    store,
    projectColors,
    handleDayClick,
    onEventEdit,
    onEventDelete,
    onEventSelect,
    handleEventMove,
    onEventCreate
  ]);

  // Determine if virtualization should be used
  const shouldVirtualize = useMemo(() => {
    return enableVirtualization && (monthViewData?.totalEvents || 0) > 100;
  }, [enableVirtualization, monthViewData?.totalEvents]);

  if (!isReady || !monthViewData) {
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
          {shouldVirtualize ? ' Virtualized' : ' Traditional'} |
          Memory: {performanceStats.renderMetrics.memoryUsage}MB
        </div>
      )}

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

      {/* Calendar grid - virtualized or traditional */}
      {shouldVirtualize ? (
        <div className="flex-1">
          <Grid
            columnCount={7}
            columnWidth={200}
            height={600}
            rowCount={Math.ceil(gridData.days.length / 7)}
            rowHeight={120}
            itemData={gridData}
            className="calendar-grid"
          >
            {GridItem}
          </Grid>
        </div>
      ) : (
        <TraditionalGrid
          days={gridData.days}
          eventsByDate={gridData.eventsByDate}
          store={gridData.store}
          projectColors={gridData.projectColors}
          onDayClick={gridData.onDayClick}
          onEventEdit={gridData.onEventEdit}
          onEventDelete={gridData.onEventDelete}
          onEventSelect={gridData.onEventSelect}
          onEventMove={gridData.onEventMove}
          onEventCreate={gridData.onEventCreate}
        />
      )}
    </div>
  );
};

export default memo(OptimizedMonthView);