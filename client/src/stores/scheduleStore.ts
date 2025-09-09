import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  Schedule, 
  ScheduleState, 
  ConflictCheckResult, 
  ConflictResolution,
  ScheduleUpdate,
  ApiError,
  DateRange
} from '@/types/schedule'
import { startOfWeek, endOfWeek } from 'date-fns'

interface ScheduleStoreState extends ScheduleState {
  // Additional internal state
  _isInitialized: boolean
  _conflictDialogOpen: boolean
  _pendingConflictResolution: ConflictCheckResult | null
}

export const useScheduleStore = create<ScheduleStoreState>()(
  devtools(
    (set, get) => ({
      // Schedule data
      schedules: new Map(),
      selectedDateRange: {
        start: startOfWeek(new Date()).toISOString(),
        end: endOfWeek(new Date()).toISOString()
      },
      selectedProjectIds: [],
      
      // UI state
      selectedSchedule: null,
      draggedSchedule: null,
      isLoading: false,
      error: null,
      
      // View state
      viewMode: 'week',
      showAllDay: true,
      showPrivate: true,
      
      // Internal state
      _isInitialized: false,
      _conflictDialogOpen: false,
      _pendingConflictResolution: null,
      
      // Basic CRUD actions
      setSchedules: (schedules) => {
        const scheduleMap = new Map()
        schedules.forEach(schedule => scheduleMap.set(schedule.id, schedule))
        set({ 
          schedules: scheduleMap,
          _isInitialized: true,
          isLoading: false 
        })
      },
      
      addSchedule: (schedule) => {
        const { schedules } = get()
        const newSchedules = new Map(schedules)
        newSchedules.set(schedule.id, schedule)
        set({ schedules: newSchedules })
      },
      
      updateSchedule: (id, updates) => {
        const { schedules } = get()
        const existingSchedule = schedules.get(id)
        if (!existingSchedule) return
        
        const newSchedules = new Map(schedules)
        newSchedules.set(id, { 
          ...existingSchedule, 
          ...updates,
          updatedAt: new Date().toISOString(),
          version: existingSchedule.version + 1
        })
        set({ schedules: newSchedules })
      },
      
      deleteSchedule: (id) => {
        const { schedules } = get()
        const newSchedules = new Map(schedules)
        newSchedules.delete(id)
        set({ schedules: newSchedules })
      },
      
      // Drag and drop
      startDrag: (schedule) => {
        set({ draggedSchedule: schedule })
      },
      
      updateDraggedSchedule: (updates) => {
        const { draggedSchedule } = get()
        if (!draggedSchedule) return
        
        set({
          draggedSchedule: {
            ...draggedSchedule,
            ...updates
          }
        })
      },
      
      commitDrag: async () => {
        const { draggedSchedule, updateSchedule, checkConflicts } = get()
        if (!draggedSchedule) return
        
        try {
          // Check for conflicts
          const conflictResult = await checkConflicts(draggedSchedule)
          
          if (conflictResult.hasConflicts) {
            // Store conflict info for dialog
            set({ 
              _conflictDialogOpen: true,
              _pendingConflictResolution: conflictResult
            })
            return
          }
          
          // No conflicts, proceed with update
          updateSchedule(draggedSchedule.id, {
            startDateTime: draggedSchedule.startDateTime,
            endDateTime: draggedSchedule.endDateTime
          })
          
          set({ draggedSchedule: null })
          
          // Show success toast
          if (typeof window !== 'undefined') {
            const { toast } = await import('sonner')
            toast.success(`일정이 이동되었습니다: ${draggedSchedule.title}`)
          }
          
        } catch (error) {
          set({ 
            draggedSchedule: null,
            error: {
              message: '일정 이동 중 오류가 발생했습니다',
              code: 500
            } as ApiError
          })
          
          if (typeof window !== 'undefined') {
            const { toast } = await import('sonner')
            toast.error('일정 이동에 실패했습니다')
          }
        }
      },
      
      cancelDrag: () => {
        set({ draggedSchedule: null })
      },
      
      // Conflict management
      checkConflicts: async (schedule) => {
        const { schedules } = get()
        
        // This would normally call an API, but for now we'll do client-side checking
        return new Promise<ConflictCheckResult>((resolve) => {
          setTimeout(() => {
            const conflicts = []
            const existingSchedules = Array.from(schedules.values())
            
            for (const existing of existingSchedules) {
              // Skip same schedule
              if (existing.id === schedule.id) continue
              
              // Check time overlap
              const scheduleStart = new Date(schedule.startDateTime!)
              const scheduleEnd = new Date(schedule.endDateTime!)
              const existingStart = new Date(existing.startDateTime)
              const existingEnd = new Date(existing.endDateTime)
              
              const hasOverlap = scheduleStart < existingEnd && existingStart < scheduleEnd
              
              if (hasOverlap) {
                // Check attendee overlap
                const scheduleAttendees = schedule.attendees?.map(a => a.email) || []
                const existingAttendees = existing.attendees.map(a => a.email)
                const commonAttendees = scheduleAttendees.filter(email => 
                  existingAttendees.includes(email)
                )
                
                if (commonAttendees.length > 0) {
                  conflicts.push({
                    scheduleId: existing.id,
                    title: existing.title,
                    startDateTime: existing.startDateTime,
                    endDateTime: existing.endDateTime,
                    severity: 'high' as const,
                    conflictingAttendees: commonAttendees
                  })
                }
              }
            }
            
            // Generate suggestions (simplified)
            const suggestions = []
            if (conflicts.length > 0) {
              const originalStart = new Date(schedule.startDateTime!)
              const duration = new Date(schedule.endDateTime!).getTime() - originalStart.getTime()
              
              // Suggest 1 hour later
              const suggestion1Start = new Date(originalStart.getTime() + 60 * 60 * 1000)
              const suggestion1End = new Date(suggestion1Start.getTime() + duration)
              
              suggestions.push({
                startDateTime: suggestion1Start.toISOString(),
                endDateTime: suggestion1End.toISOString(),
                reason: `${suggestion1Start.getHours()}:${suggestion1Start.getMinutes().toString().padStart(2, '0')} - ${suggestion1End.getHours()}:${suggestion1End.getMinutes().toString().padStart(2, '0')} 시간대 가능`
              })
            }
            
            resolve({
              hasConflicts: conflicts.length > 0,
              conflicts,
              suggestions
            })
          }, 300) // Simulate API call
        })
      },
      
      resolveConflict: (scheduleId, resolution) => {
        const { draggedSchedule, updateSchedule } = get()
        
        set({ 
          _conflictDialogOpen: false,
          _pendingConflictResolution: null
        })
        
        if (resolution === 'cancel') {
          set({ draggedSchedule: null })
          return
        }
        
        if (resolution === 'force' && draggedSchedule) {
          updateSchedule(draggedSchedule.id, {
            startDateTime: draggedSchedule.startDateTime,
            endDateTime: draggedSchedule.endDateTime
          })
          set({ draggedSchedule: null })
          return
        }
        
        if (typeof resolution === 'object' && resolution.type === 'reschedule' && draggedSchedule) {
          updateSchedule(draggedSchedule.id, {
            startDateTime: resolution.timeSlot.startDateTime,
            endDateTime: resolution.timeSlot.endDateTime
          })
          set({ draggedSchedule: null })
          return
        }
      },
      
      // Real-time updates
      handleRealtimeUpdate: (update) => {
        const { schedules } = get()
        const newSchedules = new Map(schedules)
        
        switch (update.type) {
          case 'CREATED':
            newSchedules.set(update.schedule.id, update.schedule)
            if (typeof window !== 'undefined') {
              import('sonner').then(({ toast }) => {
                toast.info(`새 일정이 추가되었습니다: ${update.schedule.title}`)
              })
            }
            break
            
          case 'UPDATED':
            const existing = newSchedules.get(update.schedule.id)
            if (existing && existing.version < update.schedule.version) {
              newSchedules.set(update.schedule.id, update.schedule)
              if (typeof window !== 'undefined') {
                import('sonner').then(({ toast }) => {
                  toast.info(`일정이 업데이트되었습니다: ${update.schedule.title}`)
                })
              }
            }
            break
            
          case 'DELETED':
            newSchedules.delete(update.schedule.id)
            if (typeof window !== 'undefined') {
              import('sonner').then(({ toast }) => {
                toast.warning(`일정이 삭제되었습니다: ${update.schedule.title}`)
              })
            }
            break
            
          case 'CONFLICT':
            if (typeof window !== 'undefined' && update.conflictInfo) {
              import('sonner').then(({ toast }) => {
                toast.error(`일정 충돌이 발생했습니다: ${update.schedule.title}`)
              })
            }
            break
        }
        
        set({ schedules: newSchedules })
      },
      
      // View state updates
      setViewMode: (viewMode) => set({ viewMode }),
      setSelectedDateRange: (dateRange) => set({ selectedDateRange: dateRange }),
      setSelectedProjectIds: (projectIds) => set({ selectedProjectIds: projectIds }),
      toggleShowAllDay: () => set((state) => ({ showAllDay: !state.showAllDay })),
      toggleShowPrivate: () => set((state) => ({ showPrivate: !state.showPrivate })),
      
      // Error handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Loading state
      setLoading: (isLoading) => set({ isLoading }),
      
      // Selection
      setSelectedSchedule: (schedule) => set({ selectedSchedule: schedule }),
      
      // Conflict dialog state
      openConflictDialog: (conflictResult) => set({ 
        _conflictDialogOpen: true,
        _pendingConflictResolution: conflictResult 
      }),
      closeConflictDialog: () => set({ 
        _conflictDialogOpen: false,
        _pendingConflictResolution: null 
      })
      
    }),
    {
      name: 'schedule-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        showAllDay: state.showAllDay,
        showPrivate: state.showPrivate,
        selectedProjectIds: state.selectedProjectIds
      })
    }
  )
)

// Selectors
export const useScheduleStoreSelectors = () => {
  const store = useScheduleStore()
  
  return {
    // Computed values
    schedulesArray: Array.from(store.schedules.values()),
    selectedScheduleIds: store.selectedProjectIds,
    hasConflictDialog: store._conflictDialogOpen,
    pendingConflictResolution: store._pendingConflictResolution,
    isInitialized: store._isInitialized,
    
    // Filtered schedules
    getSchedulesByDateRange: (start: string, end: string) => {
      return Array.from(store.schedules.values()).filter(schedule => {
        const scheduleStart = new Date(schedule.startDateTime)
        const scheduleEnd = new Date(schedule.endDateTime)
        const rangeStart = new Date(start)
        const rangeEnd = new Date(end)
        
        return scheduleStart < rangeEnd && scheduleEnd > rangeStart
      })
    },
    
    getSchedulesByProject: (projectId: string) => {
      return Array.from(store.schedules.values()).filter(
        schedule => schedule.projectId === projectId
      )
    },
    
    getSchedulesByDate: (date: string) => {
      const targetDate = new Date(date).toDateString()
      return Array.from(store.schedules.values()).filter(schedule => {
        const scheduleDate = new Date(schedule.startDateTime).toDateString()
        return scheduleDate === targetDate
      })
    }
  }
}