"use client";

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useCalendar } from '@/components/providers/calendar-provider';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import YearView from './YearView';
import { Event, ViewMode } from '@/types/store';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface CalendarViewportProps {
  className?: string;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
}


const CalendarViewport: React.FC<CalendarViewportProps> = ({
  className,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect
}) => {
  const { store, isReady } = useCalendar();

  const renderView = () => {
    if (!isReady) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading calendar...</div>
        </div>
      );
    }

    const viewProps = {
      onEventEdit,
      onEventDelete,
      onEventCreate,
      onEventSelect,
      className: "h-full"
    };

    switch (store.viewMode) {
      case 'month':
        return <MonthView {...viewProps} />;
      case 'week':
        return <WeekView {...viewProps} />;
      case 'day':
        return <DayView {...viewProps} />;
      case 'year':
        return <YearView {...viewProps} />;
      default:
        return <MonthView {...viewProps} />;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className={cn("flex-1 overflow-hidden", className)}>
        <div className="h-full">
          {renderView()}
        </div>
      </Card>
    </DndProvider>
  );
};

export default CalendarViewport;