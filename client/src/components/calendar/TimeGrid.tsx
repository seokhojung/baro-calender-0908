"use client";

import React, { useMemo } from 'react';
import { format, setHours, setMinutes, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeGridProps {
  className?: string;
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
  showAllHours?: boolean;
}

interface TimeSlot {
  hour: number;
  minute: number;
  timeString: string;
  isHourBoundary: boolean;
}

/**
 * TimeGrid component renders the time-based grid layout for day and week views
 * Displays hours from startHour to endHour with specified interval
 */
const TimeGrid: React.FC<TimeGridProps> = ({
  className,
  startHour = 0,
  endHour = 24,
  intervalMinutes = 30,
  showAllHours = false
}) => {
  // Generate time slots based on configuration
  const timeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Always add hour boundaries
      slots.push({
        hour,
        minute: 0,
        timeString: format(setHours(setMinutes(new Date(), 0), hour), 'HH:mm'),
        isHourBoundary: true
      });
      
      // Add interval slots within the hour
      if (intervalMinutes < 60) {
        for (let minute = intervalMinutes; minute < 60; minute += intervalMinutes) {
          slots.push({
            hour,
            minute,
            timeString: format(setHours(setMinutes(new Date(), minute), hour), 'HH:mm'),
            isHourBoundary: false
          });
        }
      }
    }
    
    return slots;
  }, [startHour, endHour, intervalMinutes]);

  const formatTimeForDisplay = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div 
      className={cn("relative flex flex-col", className)}
      style={{ 
        height: `${timeSlots.length * 60}px` // 60px per time slot
      }}
    >
      {timeSlots.map((slot, index) => (
        <div
          key={`${slot.hour}-${slot.minute}`}
          className={cn(
            "relative flex items-start border-border/20",
            slot.isHourBoundary ? "border-t h-[60px]" : "border-t border-dashed h-[60px]",
            index === 0 && "border-t-0"
          )}
          data-hour={slot.hour}
          data-minute={slot.minute}
          data-time={slot.timeString}
        >
          {/* Time label - only show for hour boundaries or when showAllHours is true */}
          {(slot.isHourBoundary || showAllHours) && (
            <div className="absolute -top-3 left-0 text-xs text-muted-foreground bg-background px-2 min-w-[60px]">
              {slot.isHourBoundary ? formatTimeForDisplay(slot.hour) : slot.timeString}
            </div>
          )}
          
          {/* Grid line */}
          <div className="absolute inset-0 border-r border-border/10" />
        </div>
      ))}
      
      {/* All-day events area */}
      <div 
        className="absolute top-0 left-0 right-0 bg-muted/20 border-b border-border/30 z-10"
        style={{ height: '40px' }}
      >
        <div className="absolute -top-3 left-0 text-xs text-muted-foreground bg-background px-2">
          All day
        </div>
      </div>
    </div>
  );
};

export default TimeGrid;