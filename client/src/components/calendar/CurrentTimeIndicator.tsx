"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfDay, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

interface CurrentTimeIndicatorProps {
  className?: string;
  date?: Date;
  pixelsPerMinute?: number;
  showLabel?: boolean;
}

/**
 * CurrentTimeIndicator displays a horizontal line showing the current time
 * Updates every minute to stay accurate
 */
const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
  className,
  date = new Date(),
  pixelsPerMinute = 1, // Default to 1px per minute (60px per hour)
  showLabel = true
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if current time is within the displayed date
      const startOfDisplayDate = startOfDay(date);
      const minutesFromStart = differenceInMinutes(now, startOfDisplayDate);
      
      // Show indicator only if the current time is within today and within 24 hours
      setIsVisible(
        minutesFromStart >= 0 && 
        minutesFromStart < (24 * 60) && 
        format(now, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
    };

    // Initial update
    updateTime();

    // Set interval to update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [date]);

  if (!isVisible) {
    return null;
  }

  // Calculate position from start of day
  const startOfCurrentDay = startOfDay(currentTime);
  const minutesFromDayStart = differenceInMinutes(currentTime, startOfCurrentDay);
  const topPosition = minutesFromDayStart * pixelsPerMinute;

  // Add offset for all-day events area (40px)
  const adjustedTopPosition = topPosition + 40;

  const currentTimeString = format(currentTime, 'HH:mm');

  return (
    <div
      className={cn(
        "absolute left-0 right-0 z-20 pointer-events-none",
        className
      )}
      style={{ top: `${adjustedTopPosition}px` }}
    >
      {/* Time indicator line */}
      <div className="relative">
        {/* Red circle at the beginning */}
        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full border border-background shadow-sm" />
        
        {/* Red line */}
        <div className="h-0.5 bg-red-500 shadow-sm" />
        
        {/* Time label */}
        {showLabel && (
          <div className="absolute -top-3 -left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded shadow-sm">
            {currentTimeString}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentTimeIndicator;