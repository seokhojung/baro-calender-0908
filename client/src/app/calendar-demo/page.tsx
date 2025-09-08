"use client";

import React from 'react';
import { Calendar } from '@/components/calendar';

export default function CalendarDemoPage() {
  const handleEventEdit = (event: any) => {
    console.log('Edit event:', event);
  };

  const handleEventDelete = (event: any) => {
    console.log('Delete event:', event);
  };

  const handleEventCreate = (date?: Date) => {
    console.log('Create event for date:', date);
  };

  const handleEventSelect = (event: any) => {
    console.log('Select event:', event);
  };

  const handleSettings = () => {
    console.log('Open settings');
  };

  return (
    <div className="h-screen p-4">
      <div className="h-full">
        <Calendar
          onEventEdit={handleEventEdit}
          onEventDelete={handleEventDelete}
          onEventCreate={handleEventCreate}
          onEventSelect={handleEventSelect}
          onSettings={handleSettings}
        />
      </div>
    </div>
  );
}