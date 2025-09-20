"use client"

import React, { useCallback } from 'react'
import { useDrag } from 'react-dnd'
import { format, parseISO } from 'date-fns'
import { MoreHorizontal, Users, MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { 
  DraggableScheduleProps, 
  PROJECT_COLORS 
} from '@/types/schedule'
import { useScheduleStore } from '@/stores/scheduleStore'

export const DraggableSchedule: React.FC<DraggableScheduleProps> = ({
  schedule,
  timeSlot,
  onEdit,
  onDelete
}) => {
  const { startDrag, commitDrag, cancelDrag } = useScheduleStore()

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'SCHEDULE',
    item: { schedule, originalTimeSlot: timeSlot },
    begin: () => {
      startDrag(schedule)
    },
    end: (item: any, monitor: any) => {
      if (monitor.didDrop()) {
        commitDrag()
      } else {
        cancelDrag()
      }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [schedule, timeSlot, startDrag, commitDrag, cancelDrag])

  const projectColor = PROJECT_COLORS[schedule.project.color] || PROJECT_COLORS['blue'] || {
    primary: '#3b82f6',
    secondary: '#dbeafe',
    text: '#1e40af'
  }

  const handleKeyboardMove = useCallback((event: React.KeyboardEvent) => {
    // Handle keyboard-based movement for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEdit(schedule)
    }
    
    if (event.key === 'Delete') {
      event.preventDefault()
      onDelete(schedule.id)
    }
  }, [schedule, onEdit, onDelete])

  const formatTime = (dateTime: string) => {
    return format(parseISO(dateTime), 'HH:mm')
  }

  const formatTimeRange = (start: string, end: string) => {
    if (schedule.isAllDay) {
      return '하루 종일'
    }
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  const getScheduleHeight = () => {
    if (schedule.isAllDay) return 'h-8'
    
    const start = parseISO(schedule.startDateTime)
    const end = parseISO(schedule.endDateTime)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    
    // Minimum height for readability
    if (durationMinutes <= 30) return 'h-12'
    if (durationMinutes <= 60) return 'h-16'
    if (durationMinutes <= 120) return 'h-24'
    return 'h-32'
  }

  return (
    <div
      ref={drag as any}
      className={cn(
        "schedule-item relative cursor-move border-l-4 p-2 rounded-r transition-all",
        "hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary",
        "group select-none",
        getScheduleHeight(),
        isDragging && "opacity-50 z-10",
        schedule.isPrivate && "opacity-80"
      )}
      style={{
        borderLeftColor: projectColor.primary,
        backgroundColor: isDragging ? `${projectColor.secondary}80` : projectColor.secondary,
      }}
      tabIndex={0}
      role="button"
      aria-label={`일정: ${schedule.title}, 프로젝트: ${schedule.project.name}, 시간: ${formatTimeRange(schedule.startDateTime, schedule.endDateTime)}`}
      onKeyDown={handleKeyboardMove}
    >
      {/* Schedule Content */}
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title */}
          <h3 
            className="font-medium text-sm truncate"
            style={{ color: projectColor.text }}
          >
            {schedule.isPrivate ? '🔒 비공개 일정' : schedule.title}
          </h3>

          {/* Time */}
          <p className="text-xs text-muted-foreground">
            {formatTimeRange(schedule.startDateTime, schedule.endDateTime)}
          </p>

          {/* Additional Info */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {schedule.location && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-20">{schedule.location}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{schedule.location}</TooltipContent>
              </Tooltip>
            )}

            {schedule.url && (
              <Tooltip>
                <TooltipTrigger>
                  <ExternalLink className="w-3 h-3" />
                </TooltipTrigger>
                <TooltipContent>외부 링크 포함</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Actions and Badges */}
        <div className="flex items-start gap-1 ml-2">
          {/* Attendees Badge */}
          {schedule.attendees.length > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge 
                  variant="secondary" 
                  className="text-xs h-5 px-1.5"
                  style={{ backgroundColor: `${projectColor.primary}20` }}
                >
                  <Users className="w-3 h-3 mr-1" />
                  {schedule.attendees.length}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">참가자:</p>
                  {schedule.attendees.map(attendee => (
                    <p key={attendee.email} className="text-xs">
                      {attendee.name} ({attendee.role})
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Status Badge */}
          {schedule.status !== 'confirmed' && (
            <Badge 
              variant={schedule.status === 'cancelled' ? 'destructive' : 'secondary'}
              className="text-xs h-5 px-1.5"
            >
              {schedule.status === 'draft' && '임시'}
              {schedule.status === 'cancelled' && '취소'}
            </Badge>
          )}

          {/* Actions Menu */}
          <ScheduleActions 
            schedule={schedule} 
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Drag Handle Indicator */}
      <div 
        className={cn(
          "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity",
          "w-1 h-4 bg-muted-foreground/30 rounded-full"
        )}
      />
    </div>
  )
}

// Schedule Actions Component
const ScheduleActions: React.FC<{
  schedule: any
  onEdit: (schedule: any) => void
  onDelete: (scheduleId: string) => void
}> = ({ schedule, onEdit, onDelete }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3" />
          <span className="sr-only">일정 옵션 열기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(schedule)}>
          일정 수정
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          if (schedule.url) {
            window.open(schedule.url, '_blank')
          }
        }} disabled={!schedule.url}>
          외부 링크 열기
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(schedule.id)}
          className="text-destructive focus:text-destructive"
        >
          일정 삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}