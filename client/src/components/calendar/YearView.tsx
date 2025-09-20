"use client";

import React, { useMemo } from 'react';
import { format, startOfMonth, isToday } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useCalendar } from '@/components/providers/calendar-provider';
import useProjectStore from '@/stores/projectStore';
import MiniMonth from './MiniMonth';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';
import { CalendarDateUtils } from '@/lib/utils/date-utils';

interface YearViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
}

const YearView: React.FC<YearViewProps> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect
}) => {
  const { store, isReady } = useCalendar();
  const projectStore = useProjectStore();

  const dateUtils = useMemo(() => new CalendarDateUtils(0), []);

  // Get all months for the current year
  const yearMonths = useMemo(() => {
    return dateUtils.getYearViewMonths(store.currentDate);
  }, [store.currentDate, dateUtils]);

  // Create project color mapping
  const projectColors = useMemo(() => {
    const colorMap: Record<string, string> = {};
    projectStore.projects.forEach(project => {
      colorMap[project.id] = project.color;
    });
    return colorMap;
  }, [projectStore.projects]);

  // Filter events based on selected projects
  const filteredEvents = useMemo(() => {
    return projectStore.selectedProjectIds.length > 0
      ? store.events.filter(event => 
          projectStore.selectedProjectIds.includes(event.projectId || '')
        )
      : store.events;
  }, [store.events, projectStore.selectedProjectIds]);

  // Group events by month for efficient lookup
  const eventsByMonth = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    
    yearMonths.forEach(month => {
      const monthKey = format(month, 'yyyy-MM');
      grouped[monthKey] = [];
    });

    filteredEvents.forEach(event => {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      
      // Add event to all months it spans
      yearMonths.forEach(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        // Check if event overlaps with this month
        if (eventStartDate <= monthEnd && eventEndDate >= monthStart) {
          const monthKey = format(month, 'yyyy-MM');
          grouped[monthKey]?.push(event);
        }
      });
    });
    
    return grouped;
  }, [filteredEvents, yearMonths]);

  // Calculate total events for the year
  const totalEvents = useMemo(() => {
    return filteredEvents.length;
  }, [filteredEvents]);

  // Calculate busiest month
  const busiestMonth = useMemo(() => {
    let maxEvents = 0;
    let busiestMonthDate = null;
    
    Object.entries(eventsByMonth).forEach(([monthKey, events]) => {
      if (events.length > maxEvents) {
        maxEvents = events.length;
        busiestMonthDate = new Date(monthKey + '-01');
      }
    });
    
    return { date: busiestMonthDate, eventCount: maxEvents };
  }, [eventsByMonth]);

  const handleDayClick = (date: Date) => {
    store.setSelectedDate(date);
    store.setViewMode('day');
  };

  const handleMonthClick = (date: Date) => {
    store.setCurrentDate(date);
    store.setViewMode('month');
  };

  if (!isReady) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full overflow-auto", className)}>
      {/* Year header with statistics */}
      <div className="flex-shrink-0 p-6 bg-muted/20 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {format(store.currentDate, 'yyyy')}
            </h1>
            <p className="text-muted-foreground mt-1">
              Annual Calendar Overview
            </p>
          </div>
          
          {/* Year statistics */}
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{totalEvents}</div>
              <div className="text-muted-foreground">Total Events</div>
            </div>
            {busiestMonth.date && (
              <div className="text-center">
                <div className="font-semibold text-lg">{busiestMonth.eventCount}</div>
                <div className="text-muted-foreground">
                  Busiest ({format(busiestMonth.date, 'MMM')})
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="font-semibold text-lg">
                {projectStore.selectedProjectIds.length || projectStore.projects.length}
              </div>
              <div className="text-muted-foreground">
                {projectStore.selectedProjectIds.length ? 'Filtered' : 'Total'} Projects
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar grid container */}
      <div className="flex-1 p-6">
        {/* 12-month grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {yearMonths.map((month) => {
            const monthKey = format(month, 'yyyy-MM');
            const monthEvents = eventsByMonth[monthKey] || [];
            const isCurrentMonth = format(new Date(), 'yyyy-MM') === monthKey;

            return (
              <div
                key={monthKey}
                className={cn(
                  "transition-all duration-200 hover:scale-105",
                  isCurrentMonth && "ring-2 ring-blue-500 ring-opacity-50"
                )}
              >
                <MiniMonth
                  date={month}
                  events={monthEvents}
                  onDayClick={handleDayClick}
                  onMonthClick={handleMonthClick}
                  projectColors={projectColors}
                  showEventDensity={true}
                  maxEventDensity={5}
                  className="h-full shadow-sm hover:shadow-md transition-shadow"
                />
              </div>
            );
          })}
        </div>

        {/* Event density legend */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Event Density:</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0.1, 0.3, 0.5, 0.7, 1.0].map((intensity, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-sm border border-border"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${intensity})`
                  }}
                />
              ))}
            </div>
            <span className="ml-2">Less → More</span>
          </div>
        </div>

        {/* Navigation hints */}
        <div className="mt-6 text-center text-base text-muted-foreground flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Click on a month header to view that month • Click on a day to view that day</span>
          </div>
        </div>
        {projectStore.selectedProjectIds.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            <p className="mt-1">
              Showing events from {projectStore.selectedProjectIds.length} selected project{projectStore.selectedProjectIds.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearView;