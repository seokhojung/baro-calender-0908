// Recurring Schedule Store for Story 1.8
// Zustand store for managing recurring schedules with caching and performance optimization

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { toast } from 'sonner'
import { 
  RecurringSchedule,
  EnhancedScheduleInstance,
  RecurrenceState,
  EditScope,
  RecurringEditOperation,
  UpdateRecurringScheduleInput,
  CreateRecurringScheduleInput,
  ScheduleException,
  RecurringConflictResult,
  RecurrencePerformanceMetrics
} from '../types/recurrence'
import { ApiError } from '../types/schedule'
import { OptimizedRecurrenceEngine, RecurringScheduleCache, PerformanceMonitor } from '../lib/recurrence/performanceOptimization'
import { RecurringConflictDetector } from '../lib/recurrence/conflictDetection'

interface RecurringScheduleStoreState extends RecurrenceState {
  // Additional internal state
  _isInitialized: boolean
  _conflictDialogOpen: boolean
  _pendingConflictResolution: RecurringConflictResult | null
  
  // Store actions not in interface
  setLoading: (isLoading: boolean) => void
  setError: (error: ApiError | null) => void
  clearError: () => void
  openConflictDialog: (conflictResult: RecurringConflictResult) => void
  closeConflictDialog: () => void
  setEditingInstance: (instance: EnhancedScheduleInstance | null) => void
  setEditScope: (scope: EditScope) => void
}

export const useRecurringScheduleStore = create<RecurringScheduleStoreState>()(
  devtools(
    (set, get) => ({
      // Data
      recurringSchedules: new Map(),
      scheduleInstances: new Map(),
      
      // Cache
      instanceCache: new Map(),
      
      // UI State
      isGenerating: false,
      editingInstance: null,
      editScope: 'this',
      
      // Performance
      performanceMetrics: {
        generationTime: 0,
        instanceCount: 0,
        cacheHitRate: 0,
        memoryUsage: 0
      },
      
      // Internal state
      _isInitialized: false,
      _conflictDialogOpen: false,
      _pendingConflictResolution: null,
      
      // Actions
      setRecurringSchedules: (schedules) => {
        const scheduleMap = new Map()
        schedules.forEach(schedule => scheduleMap.set(schedule.id, schedule))
        set({ 
          recurringSchedules: scheduleMap,
          _isInitialized: true,
          isGenerating: false 
        })
      },
      
      addRecurringSchedule: (schedule) => {
        const { recurringSchedules } = get()
        const newSchedules = new Map(recurringSchedules)
        newSchedules.set(schedule.id, schedule)
        set({ recurringSchedules: newSchedules })
        
        // Invalidate cache for this schedule
        RecurringScheduleCache.invalidateCache(schedule.id)
        
        toast.success(`반복 일정이 추가되었습니다: ${schedule.title}`)
      },
      
      updateRecurringSchedule: async (id, updates, scope, fromDate) => {
        const { recurringSchedules } = get()
        const existingSchedule = recurringSchedules.get(id)
        if (!existingSchedule) {
          throw new Error('Recurring schedule not found')
        }
        
        try {
          set({ isGenerating: true })
          
          const newSchedules = new Map(recurringSchedules)
          let updatedSchedule: RecurringSchedule
          
          switch (scope) {
            case 'this':
              // For single instance updates, add to modifiedInstances
              if (fromDate) {
                const modifiedInstances = [...existingSchedule.modifiedInstances]
                const existingModIndex = modifiedInstances.findIndex(
                  m => m.originalDate === fromDate
                )
                
                if (existingModIndex >= 0) {
                  // Update existing modification
                  modifiedInstances[existingModIndex] = {
                    ...modifiedInstances[existingModIndex],
                    modifiedSchedule: { 
                      ...modifiedInstances[existingModIndex].modifiedSchedule,
                      ...updates 
                    },
                    modifiedAt: new Date().toISOString()
                  }
                } else {
                  // Add new modification
                  modifiedInstances.push({
                    originalDate: fromDate,
                    modifiedSchedule: updates,
                    modifiedAt: new Date().toISOString()
                  })
                }
                
                updatedSchedule = {
                  ...existingSchedule,
                  modifiedInstances,
                  updatedAt: new Date().toISOString(),
                  version: (existingSchedule.version || 0) + 1
                }
              } else {
                throw new Error('From date required for single instance update')
              }
              break
              
            case 'following':
              // Split the recurring schedule
              // This would typically involve creating a new recurring schedule
              // For now, we'll update the existing one and handle the split logic later
              updatedSchedule = {
                ...existingSchedule,
                ...updates,
                updatedAt: new Date().toISOString(),
                version: (existingSchedule.version || 0) + 1
              }
              break
              
            case 'all':
              // Update the entire recurring schedule
              updatedSchedule = {
                ...existingSchedule,
                ...updates,
                updatedAt: new Date().toISOString(),
                version: (existingSchedule.version || 0) + 1
              }
              break
          }
          
          newSchedules.set(id, updatedSchedule)
          set({ recurringSchedules: newSchedules })
          
          // Invalidate cache
          RecurringScheduleCache.invalidateCache(id)
          
          toast.success('반복 일정이 업데이트되었습니다')
          
        } catch (error) {
          console.error('Failed to update recurring schedule:', error)
          set({ 
            isGenerating: false,
            error: {
              message: '반복 일정 업데이트 중 오류가 발생했습니다',
              code: 500
            } as ApiError
          })
          toast.error('반복 일정 업데이트에 실패했습니다')
          throw error
        } finally {
          set({ isGenerating: false })
        }
      },
      
      deleteRecurringSchedule: async (id, scope, instanceDate) => {
        const { recurringSchedules } = get()
        const existingSchedule = recurringSchedules.get(id)
        if (!existingSchedule) {
          throw new Error('Recurring schedule not found')
        }
        
        try {
          set({ isGenerating: true })
          
          const newSchedules = new Map(recurringSchedules)
          
          switch (scope) {
            case 'this':
              if (!instanceDate) {
                throw new Error('Instance date required for single instance deletion')
              }
              
              // Add exception for this date
              const updatedSchedule = {
                ...existingSchedule,
                exceptions: [
                  ...existingSchedule.exceptions,
                  {
                    date: instanceDate,
                    type: 'cancelled' as const
                  }
                ],
                updatedAt: new Date().toISOString(),
                version: (existingSchedule.version || 0) + 1
              }
              
              newSchedules.set(id, updatedSchedule)
              toast.success('일정 인스턴스가 삭제되었습니다')
              break
              
            case 'following':
              // End the recurring schedule at the specified date
              const followingUpdatedSchedule = {
                ...existingSchedule,
                recurrenceRule: {
                  ...existingSchedule.recurrenceRule,
                  until: instanceDate
                },
                updatedAt: new Date().toISOString(),
                version: (existingSchedule.version || 0) + 1
              }
              
              newSchedules.set(id, followingUpdatedSchedule)
              toast.success('이후 모든 반복 일정이 삭제되었습니다')
              break
              
            case 'all':
              // Delete the entire recurring schedule
              newSchedules.delete(id)
              toast.success(`반복 일정이 삭제되었습니다: ${existingSchedule.title}`)
              break
          }
          
          set({ recurringSchedules: newSchedules })
          
          // Invalidate cache
          RecurringScheduleCache.invalidateCache(id)
          
        } catch (error) {
          console.error('Failed to delete recurring schedule:', error)
          set({
            isGenerating: false,
            error: {
              message: '반복 일정 삭제 중 오류가 발생했습니다',
              code: 500
            } as ApiError
          })
          toast.error('반복 일정 삭제에 실패했습니다')
          throw error
        } finally {
          set({ isGenerating: false })
        }
      },
      
      // Instance Management
      generateInstances: async (recurringSchedule, dateRange) => {
        set({ isGenerating: true })
        
        try {
          const instances = await OptimizedRecurrenceEngine.generateInstancesOptimized(
            recurringSchedule,
            dateRange
          )
          
          // Update scheduleInstances cache
          const { scheduleInstances } = get()
          const newInstancesMap = new Map(scheduleInstances)
          newInstancesMap.set(recurringSchedule.id, instances)
          
          set({ 
            scheduleInstances: newInstancesMap,
            isGenerating: false
          })
          
          return instances
        } catch (error) {
          console.error('Failed to generate instances:', error)
          set({ isGenerating: false })
          throw error
        }
      },
      
      // Exception Handling
      addException: (scheduleId, exception) => {
        const { recurringSchedules } = get()
        const schedule = recurringSchedules.get(scheduleId)
        if (!schedule) return
        
        const newSchedules = new Map(recurringSchedules)
        const updatedSchedule = {
          ...schedule,
          exceptions: [...schedule.exceptions, exception],
          updatedAt: new Date().toISOString(),
          version: (schedule.version || 0) + 1
        }
        
        newSchedules.set(scheduleId, updatedSchedule)
        set({ recurringSchedules: newSchedules })
        
        // Invalidate cache
        RecurringScheduleCache.invalidateCache(scheduleId)
        
        toast.success('예외 날짜가 추가되었습니다')
      },
      
      removeException: (scheduleId, date) => {
        const { recurringSchedules } = get()
        const schedule = recurringSchedules.get(scheduleId)
        if (!schedule) return
        
        const newSchedules = new Map(recurringSchedules)
        const updatedSchedule = {
          ...schedule,
          exceptions: schedule.exceptions.filter(ex => ex.date !== date),
          updatedAt: new Date().toISOString(),
          version: (schedule.version || 0) + 1
        }
        
        newSchedules.set(scheduleId, updatedSchedule)
        set({ recurringSchedules: newSchedules })
        
        // Invalidate cache
        RecurringScheduleCache.invalidateCache(scheduleId)
        
        toast.success('예외 날짜가 제거되었습니다')
      },
      
      // Conflict Detection
      detectRecurringConflicts: async (schedule, dateRange) => {
        try {
          const { recurringSchedules } = get()
          const existingSchedules = Array.from(recurringSchedules.values())
          
          const conflicts = RecurringConflictDetector.detectRecurringConflicts(
            schedule,
            existingSchedules,
            dateRange
          )
          
          return conflicts
        } catch (error) {
          console.error('Failed to detect conflicts:', error)
          return {
            hasConflicts: false,
            conflicts: [],
            suggestions: []
          }
        }
      },
      
      // Cache Management
      getCachedInstances: (scheduleId, dateRange) => {
        const { recurringSchedules } = get()
        const schedule = recurringSchedules.get(scheduleId)
        if (!schedule) return null
        
        return RecurringScheduleCache.getCachedInstances(schedule, dateRange)
      },
      
      setCachedInstances: (scheduleId, dateRange, instances) => {
        const { recurringSchedules } = get()
        const schedule = recurringSchedules.get(scheduleId)
        if (!schedule) return
        
        RecurringScheduleCache.setCachedInstances(schedule, dateRange, instances)
      },
      
      invalidateCache: (scheduleId) => {
        RecurringScheduleCache.invalidateCache(scheduleId)
        
        if (scheduleId) {
          // Remove from local instance cache too
          const { scheduleInstances } = get()
          const newInstancesMap = new Map(scheduleInstances)
          newInstancesMap.delete(scheduleId)
          set({ scheduleInstances: newInstancesMap })
        } else {
          // Clear all
          set({ scheduleInstances: new Map() })
        }
      },
      
      cleanupExpiredCache: () => {
        RecurringScheduleCache.cleanup()
        
        // Update performance metrics
        const stats = RecurringScheduleCache.getCacheStats()
        const performanceMetrics: RecurrencePerformanceMetrics = {
          generationTime: PerformanceMonitor.getAverageMetric('generation-time'),
          instanceCount: PerformanceMonitor.getAverageMetric('instance-count'),
          cacheHitRate: stats.hitRate,
          memoryUsage: stats.memoryUsageMB * 1024 * 1024
        }
        
        set({ performanceMetrics })
      },
      
      // UI Actions
      setLoading: (isLoading) => set({ isGenerating: isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      setEditingInstance: (instance) => set({ editingInstance: instance }),
      
      setEditScope: (scope) => set({ editScope: scope }),
      
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
      name: 'recurring-schedule-store',
      partialize: (state) => ({
        editScope: state.editScope
      })
    }
  )
)

// Selectors
export const useRecurringScheduleStoreSelectors = () => {
  const store = useRecurringScheduleStore()
  
  return {
    // Computed values
    recurringSchedulesArray: Array.from(store.recurringSchedules.values()),
    isInitialized: store._isInitialized,
    hasConflictDialog: store._conflictDialogOpen,
    pendingConflictResolution: store._pendingConflictResolution,
    
    // Get instances for a specific schedule
    getInstancesForSchedule: (scheduleId: string) => {
      return store.scheduleInstances.get(scheduleId) || []
    },
    
    // Get all instances across schedules for a date range
    getAllInstancesInRange: (dateRange: { start: string; end: string }) => {
      const instances: EnhancedScheduleInstance[] = []
      const rangeStart = new Date(dateRange.start)
      const rangeEnd = new Date(dateRange.end)
      
      for (const scheduleInstances of store.scheduleInstances.values()) {
        const filteredInstances = scheduleInstances.filter(instance => {
          const instanceStart = new Date(instance.startDateTime)
          const instanceEnd = new Date(instance.endDateTime)
          
          return instanceStart < rangeEnd && instanceEnd > rangeStart
        })
        
        instances.push(...filteredInstances)
      }
      
      return instances.sort((a, b) => 
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      )
    },
    
    // Get schedules by project
    getSchedulesByProject: (projectId: string) => {
      return Array.from(store.recurringSchedules.values()).filter(
        schedule => schedule.projectId === projectId
      )
    },
    
    // Get performance statistics
    getPerformanceStats: () => {
      const cacheStats = RecurringScheduleCache.getCacheStats()
      const metricsReport = PerformanceMonitor.getMetricsReport()
      
      return {
        cache: cacheStats,
        metrics: metricsReport,
        current: store.performanceMetrics
      }
    }
  }
}

// Initialize cleanup intervals
let cleanupInterval: NodeJS.Timeout | null = null

export const initializeRecurringScheduleStore = () => {
  // Cleanup expired cache every 5 minutes
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  
  cleanupInterval = setInterval(() => {
    useRecurringScheduleStore.getState().cleanupExpiredCache()
  }, 5 * 60 * 1000)
}

export const destroyRecurringScheduleStore = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}