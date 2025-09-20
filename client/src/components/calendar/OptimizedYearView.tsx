"use client";

import React, { memo, useMemo, useCallback } from 'react';
import { Grid } from 'react-window';
import { format, isToday } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useOptimizedCalendar } from '@/hooks/useOptimizedCalendar';
import MiniMonth from './MiniMonth';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';

interface OptimizedYearViewProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
  enableVirtualization?: boolean;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: any;
  data: {
    months: Date[];
    eventsByMonth: Record<string, Event[]>;
    eventDensityByMonth: Record<string, number>;
    projectColors: Record<string, string>;
    onDayClick: (date: Date) => void;
    onMonthClick: (date: Date) => void;
  };
}

interface YearStatsProps {
  currentDate: Date;
  totalEvents: number;
  maxEventsInMonth: number;
  busiestMonth: { date: Date | null; eventCount: number };
  totalProjects: number;
  filteredProjects: number;
}

// Memoized year statistics component
const YearStats = memo<YearStatsProps>(({
  currentDate,
  totalEvents,
  maxEventsInMonth,
  busiestMonth,
  totalProjects,
  filteredProjects
}) => (
  <div className="flex-shrink-0 p-6 bg-muted/20 border-b border-border">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">
          {format(currentDate, 'yyyy')}
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
            {filteredProjects || totalProjects}
          </div>
          <div className="text-muted-foreground">
            {filteredProjects ? 'Filtered' : 'Total'} Projects
          </div>
        </div>
      </div>
    </div>
  </div>
));

YearStats.displayName = 'YearStats';

// Grid item component for react-window
const GridItem = memo<GridItemProps>(({ columnIndex, rowIndex, style, data }) => {
  const monthIndex = rowIndex * 4 + columnIndex; // 4 columns per row for year view
  const month = data.months[monthIndex];
  
  if (!month) return null;

  const monthKey = format(month, 'yyyy-MM');
  const monthEvents = data.eventsByMonth[monthKey] || [];
  const eventDensity = data.eventDensityByMonth[monthKey] || 0;
  const isCurrentMonth = format(new Date(), 'yyyy-MM') === monthKey;

  return (
    <div style={style} className="p-2">
      <div
        className={cn(
          "h-full transition-all duration-200 hover:scale-105",
          isCurrentMonth && "ring-2 ring-blue-500 ring-opacity-50"
        )}
      >
        <MiniMonth
          date={month}
          events={monthEvents}
          onDayClick={data.onDayClick}
          onMonthClick={data.onMonthClick}
          projectColors={data.projectColors}
          showEventDensity={true}
          maxEventDensity={5}
          className="h-full shadow-sm hover:shadow-md transition-shadow"
        />
      </div>
    </div>
  );
});

GridItem.displayName = 'GridItem';

// Traditional grid component for non-virtualized rendering
const TraditionalGrid = memo<{
  months: Date[];
  eventsByMonth: Record<string, Event[]>;
  eventDensityByMonth: Record<string, number>;
  projectColors: Record<string, string>;
  onDayClick: (date: Date) => void;
  onMonthClick: (date: Date) => void;
}>(({
  months,
  eventsByMonth,
  eventDensityByMonth,
  projectColors,
  onDayClick,
  onMonthClick
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
    {months.map((month) => {
      const monthKey = format(month, 'yyyy-MM');
      const monthEvents = eventsByMonth[monthKey] || [];
      const eventDensity = eventDensityByMonth[monthKey] || 0;
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
            onDayClick={onDayClick}
            onMonthClick={onMonthClick}
            projectColors={projectColors}
            showEventDensity={true}
            maxEventDensity={5}
            className="h-full shadow-sm hover:shadow-md transition-shadow"
          />
        </div>
      );
    })}
  </div>
));

TraditionalGrid.displayName = 'TraditionalGrid';

// Legend component for event density
const EventDensityLegend = memo(() => (
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
));

EventDensityLegend.displayName = 'EventDensityLegend';

// Navigation hints component
const NavigationHints = memo<{ filteredProjectsCount: number }>(({ filteredProjectsCount }) => (
  <div className="mt-6 text-center">
    <div className="text-base text-muted-foreground flex items-center justify-center gap-2">
      <Calendar className="h-4 w-4" />
      <span>Click on a month header to view that month • Click on a day to view that day</span>
    </div>
    {filteredProjectsCount > 0 && (
      <p className="mt-1 text-sm text-muted-foreground">
        Showing events from {filteredProjectsCount} selected project{filteredProjectsCount === 1 ? '' : 's'}
      </p>
    )}
  </div>
));

NavigationHints.displayName = 'NavigationHints';

const OptimizedYearView: React.FC<OptimizedYearViewProps> = ({
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
    yearViewData,
    performanceStats
  } = useOptimizedCalendar('year');

  const handleDayClick = useCallback((date: Date) => {
    store.setSelectedDate(date);
    store.setViewMode('day');
  }, [store]);

  const handleMonthClick = useCallback((date: Date) => {
    store.setCurrentDate(date);
    store.setViewMode('month');
  }, [store]);

  // Calculate busiest month from year data
  const busiestMonth = useMemo(() => {
    if (!yearViewData?.eventsByMonth) return { date: null, eventCount: 0 };

    let maxEvents = 0;
    let busiestMonthDate: Date | null = null;
    
    Object.entries(yearViewData.eventsByMonth).forEach(([monthKey, events]) => {
      const eventsArray = events as Event[];
      if (eventsArray.length > maxEvents) {
        maxEvents = eventsArray.length;
        busiestMonthDate = new Date(monthKey + '-01');
      }
    });
    
    return { date: busiestMonthDate, eventCount: maxEvents };
  }, [yearViewData?.eventsByMonth]);

  const gridData = useMemo(() => ({
    months: yearViewData?.months || [],
    eventsByMonth: yearViewData?.eventsByMonth || {},
    eventDensityByMonth: yearViewData?.eventDensityByMonth || {},
    projectColors,
    onDayClick: handleDayClick,
    onMonthClick: handleMonthClick
  }), [
    yearViewData?.months,
    yearViewData?.eventsByMonth,
    yearViewData?.eventDensityByMonth,
    projectColors,
    handleDayClick,
    handleMonthClick
  ]);

  // Determine if virtualization should be used (for very large datasets)
  const shouldVirtualize = useMemo(() => {
    return enableVirtualization && (yearViewData?.totalEvents || 0) > 500;
  }, [enableVirtualization, yearViewData?.totalEvents]);

  if (!isReady || !yearViewData) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full overflow-auto", className)}>
      {/* Performance indicator in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/20 border-b">
          Events: {performanceStats.eventsCount} | 
          Render: {performanceStats.renderMetrics.renderTime}ms |
          {shouldVirtualize ? ' Virtualized' : ' Traditional'} |
          Memory: {performanceStats.renderMetrics.memoryUsage}MB
        </div>
      )}

      {/* Year header with statistics */}
      <YearStats
        currentDate={store.currentDate}
        totalEvents={yearViewData.totalEvents}
        maxEventsInMonth={yearViewData.maxEventsInMonth}
        busiestMonth={busiestMonth}
        totalProjects={performanceStats.spatialIndexStats.projectIndices}
        filteredProjects={0} // TODO: Get filtered projects count from store
      />

      {/* Calendar grid container */}
      <div className="flex-1 p-6">
        {/* 12-month grid */}
        {shouldVirtualize ? (
          <div className="max-w-7xl mx-auto">
              <div style={{height: 800, width: 1120}}>
                {/* @ts-ignore */}
                <Grid
                  height={800}
                  width={1120}
                  columnCount={4}
                  columnWidth={280}
                  rowCount={Math.ceil(gridData.months.length / 4)}
                  rowHeight={200}
                  itemData={gridData}
                  className="year-grid"
                >
                  {GridItem as any}
                </Grid>
              </div>
          </div>
        ) : (
          <TraditionalGrid
            months={gridData.months}
            eventsByMonth={gridData.eventsByMonth}
            eventDensityByMonth={gridData.eventDensityByMonth}
            projectColors={gridData.projectColors}
            onDayClick={gridData.onDayClick}
            onMonthClick={gridData.onMonthClick}
          />
        )}

        <EventDensityLegend />
        <NavigationHints filteredProjectsCount={0} />
      </div>
    </div>
  );
};

export default memo(OptimizedYearView);