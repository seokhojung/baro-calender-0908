"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend'
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns'
import { Plus, Calendar, Settings, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

import { DraggableSchedule } from './DraggableSchedule'
import { TimeSlotDropZone, BusinessHoursGrid } from './TimeSlotDropZone'
import { ScheduleCreateForm } from './ScheduleCreateForm'
import { ConflictResolutionDialog, DragConflictDialog } from './ConflictResolutionDialog'

import { 
  Schedule, 
  CreateScheduleInput,
  PROJECT_COLORS 
} from '@/types/schedule'
import { useScheduleStore, useScheduleStoreSelectors } from '@/stores/scheduleStore'

// Detect touch device (safe for SSR)
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Mock schedules data for development
const mockSchedules: Schedule[] = [
  {
    id: '1',
    title: '팀 미팅',
    description: '주간 팀 미팅',
    startDateTime: new Date(2024, 11, 9, 10, 0).toISOString(),
    endDateTime: new Date(2024, 11, 9, 11, 0).toISOString(),
    isAllDay: false,
    timezone: 'Asia/Seoul',
    projectId: '1',
    project: { id: '1', name: '웹 개발 프로젝트', color: 'blue' },
    attendees: [
      { userId: '1', email: 'john@example.com', name: '김철수', role: 'organizer', status: 'accepted' }
    ],
    status: 'confirmed',
    isPrivate: false,
    location: '회의실 A',
    attachments: [],
    createdBy: 'user1',
    updatedBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  },
  {
    id: '2',
    title: '클라이언트 프레젠테이션',
    description: '프로젝트 진행상황 발표',
    startDateTime: new Date(2024, 11, 9, 14, 0).toISOString(),
    endDateTime: new Date(2024, 11, 9, 15, 30).toISOString(),
    isAllDay: false,
    timezone: 'Asia/Seoul',
    projectId: '2',
    project: { id: '2', name: '마케팅 캠페인', color: 'green' },
    attendees: [
      { userId: '2', email: 'jane@example.com', name: '이영희', role: 'required', status: 'pending' }
    ],
    status: 'confirmed',
    isPrivate: false,
    location: '온라인',
    url: 'https://meet.google.com/abc-defg-hij',
    attachments: [],
    createdBy: 'user1',
    updatedBy: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  }
]

export const CalendarContainer: React.FC = () => {
  const scheduleStore = useScheduleStore()
  const { 
    schedulesArray, 
    hasConflictDialog, 
    pendingConflictResolution 
  } = useScheduleStoreSelectors()

  // Local UI state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [createFormInitialData, setCreateFormInitialData] = useState<Partial<CreateScheduleInput>>()

  // Initialize mock data
  useEffect(() => {
    if (!scheduleStore._isInitialized) {
      scheduleStore.setSchedules(mockSchedules)
    }
  }, [scheduleStore])

  // Get current week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Filter schedules for current week
  const weekSchedules = schedulesArray.filter(schedule => {
    const scheduleDate = new Date(schedule.startDateTime)
    return scheduleDate >= weekStart && scheduleDate < addDays(weekStart, 7)
  })

  // Group schedules by date
  const schedulesByDate = weekSchedules.reduce((acc, schedule) => {
    const dateKey = format(new Date(schedule.startDateTime), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  // Handle schedule creation
  const handleCreateSchedule = useCallback(async (data: CreateScheduleInput) => {
    try {
      // In a real app, this would call an API
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        ...data,
        project: { 
          id: data.projectId, 
          name: 'Selected Project', 
          color: 'blue' 
        },
        attendees: data.attendees.map(attendee => ({
          ...attendee,
          userId: `user-${Date.now()}`
        })),
        createdBy: 'current-user',
        updatedBy: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      scheduleStore.addSchedule(newSchedule)
      setIsCreateFormOpen(false)
      setCreateFormInitialData(undefined)
      
      // Success toast would be handled by the store
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }, [scheduleStore])

  // Handle schedule edit
  const handleEditSchedule = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule)
    setIsCreateFormOpen(true)
  }, [])

  // Handle schedule delete
  const handleDeleteSchedule = useCallback((scheduleId: string) => {
    if (confirm('이 일정을 삭제하시겠습니까?')) {
      scheduleStore.deleteSchedule(scheduleId)
    }
  }, [scheduleStore])

  // Handle time slot click for creating new schedule
  const handleTimeSlotClick = useCallback((date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const startDateTime = new Date(date)
    startDateTime.setHours(hours, minutes, 0, 0)
    
    const endDateTime = new Date(startDateTime)
    endDateTime.setHours(hours + 1, minutes, 0, 0) // Default 1 hour duration

    setCreateFormInitialData({
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    })
    setIsCreateFormOpen(true)
  }, [])

  // DnD Backend selection based on device
  const dndBackend = isTouchDevice() ? TouchBackend : HTML5Backend

  return (
    <TooltipProvider>
      <DndProvider backend={dndBackend}>
        <div className="calendar-container w-full h-full flex flex-col">
          {/* Calendar Header */}
          <div className="calendar-header border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold">
                  {format(selectedDate, 'yyyy년 MM월')}
                </h1>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    오늘
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                  >
                    이전 주
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  >
                    다음 주
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      필터
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>일정 필터</SheetTitle>
                    </SheetHeader>
                    {/* Filter controls would go here */}
                  </SheetContent>
                </Sheet>

                <Button
                  onClick={() => setIsCreateFormOpen(true)}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  일정 추가
                </Button>
              </div>
            </div>

            {/* Week View Header */}
            <div className="grid grid-cols-8 border-t">
              <div className="p-2 text-sm font-medium text-center border-r">
                시간
              </div>
              {weekDays.map((day, index) => (
                <div 
                  key={day.toISOString()}
                  className={`p-2 text-sm text-center border-r ${
                    isSameDay(day, new Date()) ? 'bg-primary/5 font-medium' : ''
                  }`}
                >
                  <div className="font-medium">
                    {format(day, 'E', { locale: undefined })}
                  </div>
                  <div className={`text-lg ${
                    isSameDay(day, new Date()) ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  {/* Schedule count badge */}
                  {schedulesByDate[format(day, 'yyyy-MM-dd')] && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {schedulesByDate[format(day, 'yyyy-MM-dd')].length}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid flex-1 overflow-auto">
            <div className="grid grid-cols-8 min-h-full">
              {/* Time Column */}
              <div className="time-column border-r bg-muted/30">
                {Array.from({ length: 10 }, (_, i) => (
                  <div 
                    key={i}
                    className="time-slot h-24 border-b border-border/50 p-2 text-xs text-muted-foreground"
                  >
                    {`${(9 + i).toString().padStart(2, '0')}:00`}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="day-column border-r relative">
                  {/* Time Slots */}
                  <div className="time-slots">
                    {Array.from({ length: 20 }, (_, i) => {
                      const hour = 9 + Math.floor(i / 2)
                      const minute = (i % 2) * 30
                      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                      
                      return (
                        <TimeSlotDropZone
                          key={`${day.toDateString()}-${timeString}`}
                          timeSlot={{ start: timeString, end: timeString }}
                          date={day}
                        />
                      )
                    })}
                  </div>

                  {/* Schedules for this day */}
                  <div className="schedules absolute inset-0 pointer-events-none">
                    {schedulesByDate[format(day, 'yyyy-MM-dd')]?.map((schedule, index) => {
                      const startHour = new Date(schedule.startDateTime).getHours()
                      const startMinute = new Date(schedule.startDateTime).getMinutes()
                      const topOffset = ((startHour - 9) * 48) + (startMinute / 60 * 48)
                      
                      return (
                        <div
                          key={schedule.id}
                          className="absolute left-1 right-1 pointer-events-auto"
                          style={{ 
                            top: `${topOffset}px`,
                            zIndex: 1 
                          }}
                        >
                          <DraggableSchedule
                            schedule={schedule}
                            timeSlot={{ start: format(new Date(schedule.startDateTime), 'HH:mm'), end: format(new Date(schedule.endDateTime), 'HH:mm') }}
                            onEdit={handleEditSchedule}
                            onDelete={handleDeleteSchedule}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create/Edit Schedule Sheet */}
          <Sheet open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {editingSchedule ? '일정 수정' : '새 일정 만들기'}
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6">
                <ScheduleCreateForm
                  initialData={editingSchedule || createFormInitialData}
                  onSubmit={handleCreateSchedule}
                  onCancel={() => {
                    setIsCreateFormOpen(false)
                    setEditingSchedule(null)
                    setCreateFormInitialData(undefined)
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Conflict Resolution Dialog */}
          {hasConflictDialog && pendingConflictResolution && (
            <DragConflictDialog
              isOpen={hasConflictDialog}
              conflicts={pendingConflictResolution}
              onResolve={scheduleStore.resolveConflict}
              onOpenChange={scheduleStore.closeConflictDialog}
            />
          )}
        </div>
      </DndProvider>
    </TooltipProvider>
  )
}

export default CalendarContainer