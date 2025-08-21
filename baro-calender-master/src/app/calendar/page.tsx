'use client';

import React from 'react';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { useCalendar } from '@/contexts/CalendarContext';

export default function CalendarPage() {
  const { state } = useCalendar();

  return (
    <div className="space-y-6">
      {state.view.type === 'month' ? <MonthView /> : <WeekView />}
    </div>
  );
}
