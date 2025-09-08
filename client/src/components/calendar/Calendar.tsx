"use client";

import React, { useState } from 'react';
import { CalendarProvider } from '@/components/providers/calendar-provider';
import CalendarHeader from './CalendarHeader';
import CalendarViewport from './CalendarViewport';
import CalendarSidebar from './CalendarSidebar';
import { Event } from '@/types/store';
import { cn } from '@/lib/utils';

interface CalendarProps {
  className?: string;
  initialDate?: Date;
  autoLoad?: boolean;
  showSidebar?: boolean;
  onEventEdit?: (event: Event) => void;
  onEventDelete?: (event: Event) => void;
  onEventCreate?: (date?: Date) => void;
  onEventSelect?: (event: Event) => void;
  onSettings?: () => void;
}

const CalendarContent: React.FC<Omit<CalendarProps, 'initialDate' | 'autoLoad'>> = ({
  className,
  showSidebar = true,
  onEventEdit,
  onEventDelete,
  onEventCreate,
  onEventSelect,
  onSettings
}) => {
  const [_selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    onEventSelect?.(event);
  };

  const handleEventEdit = (event: Event) => {
    onEventEdit?.(event);
  };

  const handleEventDelete = (event: Event) => {
    onEventDelete?.(event);
  };

  const handleEventCreate = (date?: Date) => {
    onEventCreate?.(date || selectedDate || new Date());
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSettings = () => {
    onSettings?.();
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Calendar Header */}
      <CalendarHeader
        onEventCreate={() => handleEventCreate()}
        onSettings={handleSettings}
      />

      {/* Main Calendar Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Calendar Viewport */}
        <CalendarViewport
          className="flex-1"
          onEventEdit={handleEventEdit}
          onEventDelete={handleEventDelete}
          onEventCreate={handleEventCreate}
          onEventSelect={handleEventSelect}
        />

        {/* Sidebar */}
        {showSidebar && (
          <CalendarSidebar
            className="w-80 flex-shrink-0"
            onEventSelect={handleEventSelect}
            onDateSelect={handleDateSelect}
          />
        )}
      </div>
    </div>
  );
};

const Calendar: React.FC<CalendarProps> = ({
  initialDate,
  autoLoad = true,
  ...props
}) => {
  return (
    <CalendarProvider initialDate={initialDate} autoLoad={autoLoad}>
      <CalendarContent {...props} />
    </CalendarProvider>
  );
};

export default Calendar;