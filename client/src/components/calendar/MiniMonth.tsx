"use client";

import React, { useMemo } from 'react';
import { format, isSameMonth, isToday, isSameDay, startOfDay, getDaysInMonth } from 'date-fns';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { CalendarDateUtils } from '@/lib/utils/date-utils';

interface MiniMonthProps {
  date: Date; // Month to display
  events: Event[];
  onDayClick?: (date: Date) => void;
  onMonthClick?: (date: Date) => void;
  projectColors: Record<string, string>;
  className?: string;
  showEventDensity?: boolean;
  maxEventDensity?: number;
}

interface DayEventDensity {
  eventCount: number;
  intensity: number; // 0-1 scale for heat map
}

const MiniMonth: React.FC<MiniMonthProps> = ({
  date,
  events,
  onDayClick,
  onMonthClick,
  projectColors,
  className,
  showEventDensity = true,
  maxEventDensity = 5
}) => {
  const dateUtils = useMemo(() => new CalendarDateUtils(0), []);

  // Get calendar grid days for the month
  const monthDays = useMemo(() => {
    return dateUtils.getMonthViewDays(date);
  }, [date, dateUtils]);

  // Calculate event density for each day
  const eventDensityByDate = useMemo(() => {
    const densityMap: Record<string, DayEventDensity> = {};
    
    // Initialize all days with zero events
    monthDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      densityMap[dateKey] = { eventCount: 0, intensity: 0 };
    });

    // Count events for each day
    events.forEach(event => {
      const eventStart = startOfDay(new Date(event.startDate));
      const eventEnd = startOfDay(new Date(event.endDate));
      
      // Handle multi-day events
      let currentDate = eventStart;
      while (currentDate <= eventEnd) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        if (densityMap[dateKey]) {
          densityMap[dateKey].eventCount++;
        }
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    });

    // Calculate intensity (0-1 scale)
    Object.values(densityMap).forEach(density => {
      density.intensity = Math.min(density.eventCount / maxEventDensity, 1);
    });

    return densityMap;
  }, [events, monthDays, maxEventDensity]);

  // Get heat map color based on event density
  const getHeatMapColor = (intensity: number): string => {
    if (!showEventDensity || intensity === 0) return '';
    
    // Use blue scale for heat map
    const alpha = Math.max(0.1, intensity);
    return `rgba(59, 130, 246, ${alpha})`;
  };

  // Get dominant project color for a day
  const getDayProjectColor = (dayEvents: Event[]): string | null => {
    if (!dayEvents.length) return null;
    
    // Count events by project color
    const colorCounts: Record<string, number> = {};
    dayEvents.forEach(event => {
      const color = projectColors[event.projectId || 'default'] || event.color || '#3b82f6';
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    
    // Return the most frequent color
    const dominantColor = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    return dominantColor ? dominantColor[0] : null;
  };

  // Group events by date for efficient lookup
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const eventStart = startOfDay(new Date(event.startDate));
      const eventEnd = startOfDay(new Date(event.endDate));
      
      let currentDate = eventStart;
      while (currentDate <= eventEnd) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    });
    
    return grouped;
  }, [events]);

  const handleMonthHeaderClick = () => {
    onMonthClick?.(date);
  };

  const handleDayClick = (day: Date) => {
    onDayClick?.(day);
  };

  return (
    <div className={cn("bg-card rounded-lg border border-border overflow-hidden", className)}>
      {/* Month header */}
      <div 
        className={cn(
          "px-3 py-2 text-center border-b border-border bg-muted/30",
          onMonthClick && "cursor-pointer hover:bg-muted/50 transition-colors"
        )}
        onClick={handleMonthHeaderClick}
        aria-label={`View ${format(date, 'MMMM yyyy')} calendar`}
        role={onMonthClick ? "button" : undefined}
      >
        <h3 className="font-medium text-sm">
          {format(date, 'MMM yyyy')}
        </h3>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="p-1 text-center text-xs font-medium text-muted-foreground border-b border-border/50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, date);
          const dayIsToday = isToday(day);
          const eventDensity = eventDensityByDate[dateKey] || { eventCount: 0, intensity: 0 };
          const heatMapColor = getHeatMapColor(eventDensity.intensity);
          const projectColor = getDayProjectColor(dayEvents);

          return (
            <div
              key={dateKey}
              className={cn(
                "relative aspect-square flex items-center justify-center text-xs cursor-pointer transition-colors border-r border-b border-border/30 last:border-r-0",
                !isCurrentMonth && "text-muted-foreground",
                isCurrentMonth && "hover:bg-muted/30",
                dayIsToday && "bg-blue-100 dark:bg-blue-900/30 font-semibold"
              )}
              style={{
                backgroundColor: heatMapColor || undefined
              }}
              onClick={() => handleDayClick(day)}
              aria-label={`${format(day, 'MMMM d, yyyy')}${dayEvents.length ? ` - ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`}
            >
              {/* Day number */}
              <span
                className={cn(
                  "relative z-10",
                  dayIsToday && "text-blue-600 dark:text-blue-300"
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Event indicators */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {/* Show up to 3 event dots */}
                  {dayEvents.slice(0, 3).map((event, index) => (
                    <div
                      key={`${event.id}-${index}`}
                      className="w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: projectColors[event.projectId || 'default'] || event.color || '#3b82f6'
                      }}
                    />
                  ))}
                  {/* Show "more" indicator if more than 3 events */}
                  {dayEvents.length > 3 && (
                    <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                  )}
                </div>
              )}

              {/* Project color stripe for days with events */}
              {projectColor && !showEventDensity && (
                <div 
                  className="absolute left-0 top-0 w-1 h-full"
                  style={{ backgroundColor: projectColor }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniMonth;