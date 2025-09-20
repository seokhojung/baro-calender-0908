"use client"

import React from 'react'
import { useDrop } from 'react-dnd'
import { differenceInMinutes, parseISO, addMinutes } from 'date-fns'
import { cn } from '@/lib/utils'

import { TimeSlotDropZoneProps, DraggedSchedule } from '@/types/schedule'
import { useScheduleStore } from '@/stores/scheduleStore'

function combineDateAndTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours || 0, minutes || 0, 0, 0)
  return combined
}

function hasTimeConflict(schedule: any, timeSlot: any, date: Date): boolean {
  // This would check against existing schedules in the store
  // For now, returning false to allow all drops
  return false
}

export const TimeSlotDropZone: React.FC<TimeSlotDropZoneProps> = ({
  timeSlot,
  date
}) => {
  const { updateDraggedSchedule } = useScheduleStore()

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'SCHEDULE',
    canDrop: (item: DraggedSchedule) => {
      // Check if this time slot is available
      return !hasTimeConflict(item.schedule, timeSlot, date)
    },
    drop: (item: DraggedSchedule) => {
      const newStartDateTime = combineDateAndTime(date, timeSlot.start)
      const originalStart = parseISO(item.schedule.startDateTime)
      const originalEnd = parseISO(item.schedule.endDateTime)
      const duration = differenceInMinutes(originalEnd, originalStart)
      const newEndDateTime = addMinutes(newStartDateTime, duration)

      updateDraggedSchedule({
        startDateTime: newStartDateTime.toISOString(),
        endDateTime: newEndDateTime.toISOString()
      })
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [timeSlot, date, updateDraggedSchedule])

  return (
    <div
      ref={drop as any}
      className={cn(
        "time-slot relative h-12 border-b border-border/50 transition-all duration-200",
        "hover:bg-muted/50",
        isOver && canDrop && "bg-primary/10 border-primary/50",
        isOver && !canDrop && "bg-destructive/10 border-destructive/50",
        canDrop && "cursor-copy"
      )}
      data-testid={`time-slot-${timeSlot.start}`}
      role="button"
      aria-label={`${timeSlot.start} 시간대`}
      tabIndex={-1}
    >
      {/* Time Label */}
      <div className="absolute left-2 top-1 text-xs text-muted-foreground font-mono">
        {timeSlot.start}
      </div>

      {/* Drop Indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
            여기에 놓기
          </div>
        </div>
      )}

      {/* Cannot Drop Indicator */}
      {isOver && !canDrop && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded">
            충돌
          </div>
        </div>
      )}

      {/* Accessibility: Screen reader feedback */}
      <div className="sr-only">
        {timeSlot.start} 시간대
        {isOver && canDrop && ', 일정을 이곳에 놓을 수 있습니다'}
        {isOver && !canDrop && ', 일정 충돌로 인해 이곳에 놓을 수 없습니다'}
      </div>
    </div>
  )
}

// Optional: Hour grid component that contains multiple time slots
export const HourGrid: React.FC<{
  date: Date
  startHour?: number
  endHour?: number
}> = ({
  date,
  startHour = 0,
  endHour = 24
}) => {
  const timeSlots = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    // Create 30-minute intervals
    timeSlots.push({
      start: `${hour.toString().padStart(2, '0')}:00`,
      end: `${hour.toString().padStart(2, '0')}:30`
    })
    timeSlots.push({
      start: `${hour.toString().padStart(2, '0')}:30`,
      end: `${(hour + 1).toString().padStart(2, '0')}:00`
    })
  }

  return (
    <div className="hour-grid">
      {timeSlots.map((timeSlot, index) => (
        <TimeSlotDropZone
          key={`${date.toDateString()}-${timeSlot.start}`}
          timeSlot={timeSlot}
          date={date}
        />
      ))}
    </div>
  )
}

// Business Hours Grid (9 AM - 6 PM)
export const BusinessHoursGrid: React.FC<{
  date: Date
}> = ({ date }) => {
  return <HourGrid date={date} startHour={9} endHour={18} />
}

// Full Day Grid (24 hours)
export const FullDayGrid: React.FC<{
  date: Date
}> = ({ date }) => {
  return <HourGrid date={date} startHour={0} endHour={24} />
}