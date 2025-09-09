// Recurring Schedule Store Tests for Story 1.8
// Comprehensive tests for the recurring schedule store

import { renderHook, act } from '@testing-library/react'
import { useRecurringScheduleStore, useRecurringScheduleStoreSelectors } from '../recurringScheduleStore'
import { RecurringSchedule, RecurrenceRule, EditScope } from '../../types/recurrence'

// Mock performance optimization functions
jest.mock('../../lib/recurrence/performanceOptimization', () => ({
  OptimizedRecurrenceEngine: {
    generateInstancesOptimized: jest.fn().mockResolvedValue([])
  },
  RecurringScheduleCache: {
    getCachedInstances: jest.fn().mockReturnValue(null),
    setCachedInstances: jest.fn(),
    invalidateCache: jest.fn(),
    cleanup: jest.fn(),
    getCacheStats: jest.fn().mockReturnValue({
      entries: 0,
      memoryUsageMB: 0,
      hitRate: 0
    })
  },
  PerformanceMonitor: {
    getAverageMetric: jest.fn().mockReturnValue(0)
  }
}))

// Mock conflict detection
jest.mock('../../lib/recurrence/conflictDetection', () => ({
  RecurringConflictDetector: {
    detectRecurringConflicts: jest.fn().mockReturnValue({
      hasConflicts: false,
      conflicts: [],
      suggestions: []
    })
  }
}))

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

describe('useRecurringScheduleStore', () => {
  const mockRecurringSchedule: RecurringSchedule = {
    id: 'test-recurring-1',
    title: 'Test Recurring Schedule',
    description: 'Test description',
    startDateTime: '2024-01-01T10:00:00.000Z',
    endDateTime: '2024-01-01T11:00:00.000Z',
    duration: 60,
    isAllDay: false,
    timezone: 'UTC',
    projectId: 'test-project',
    project: {
      id: 'test-project',
      name: 'Test Project',
      color: '#3b82f6'
    },
    recurrenceRule: {
      frequency: 'weekly',
      interval: 1,
      byWeekDay: ['MO', 'WE', 'FR']
    },
    attendees: [],
    status: 'confirmed',
    isPrivate: false,
    attachments: [],
    exceptions: [],
    modifiedInstances: [],
    createdBy: 'test-user',
    updatedBy: 'test-user',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    version: 1
  }

  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useRecurringScheduleStore())
    act(() => {
      result.current.setRecurringSchedules([])
    })
  })

  describe('setRecurringSchedules', () => {
    test('should set recurring schedules', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      act(() => {
        result.current.setRecurringSchedules([mockRecurringSchedule])
      })

      expect(result.current.recurringSchedules.size).toBe(1)
      expect(result.current.recurringSchedules.get('test-recurring-1')).toEqual(mockRecurringSchedule)
      expect(result.current._isInitialized).toBe(true)
      expect(result.current.isGenerating).toBe(false)
    })

    test('should handle multiple schedules', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      const schedule2 = { ...mockRecurringSchedule, id: 'test-recurring-2', title: 'Second Schedule' }

      act(() => {
        result.current.setRecurringSchedules([mockRecurringSchedule, schedule2])
      })

      expect(result.current.recurringSchedules.size).toBe(2)
    })
  })

  describe('addRecurringSchedule', () => {
    test('should add a recurring schedule', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      act(() => {
        result.current.addRecurringSchedule(mockRecurringSchedule)
      })

      expect(result.current.recurringSchedules.size).toBe(1)
      expect(result.current.recurringSchedules.get('test-recurring-1')).toEqual(mockRecurringSchedule)
    })

    test('should replace existing schedule with same id', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      const updatedSchedule = { ...mockRecurringSchedule, title: 'Updated Title' }

      act(() => {
        result.current.addRecurringSchedule(mockRecurringSchedule)
        result.current.addRecurringSchedule(updatedSchedule)
      })

      expect(result.current.recurringSchedules.size).toBe(1)
      expect(result.current.recurringSchedules.get('test-recurring-1')?.title).toBe('Updated Title')
    })
  })

  describe('updateRecurringSchedule', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      act(() => {
        result.current.setRecurringSchedules([mockRecurringSchedule])
      })
    })

    test('should update single instance', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await act(async () => {
        await result.current.updateRecurringSchedule(
          'test-recurring-1',
          { title: 'Updated Title' },
          'this',
          '2024-01-01'
        )
      })

      const updatedSchedule = result.current.recurringSchedules.get('test-recurring-1')
      expect(updatedSchedule?.modifiedInstances).toHaveLength(1)
      expect(updatedSchedule?.modifiedInstances[0].originalDate).toBe('2024-01-01')
      expect(updatedSchedule?.modifiedInstances[0].modifiedSchedule.title).toBe('Updated Title')
    })

    test('should update all instances', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await act(async () => {
        await result.current.updateRecurringSchedule(
          'test-recurring-1',
          { title: 'Updated Title for All' },
          'all'
        )
      })

      const updatedSchedule = result.current.recurringSchedules.get('test-recurring-1')
      expect(updatedSchedule?.title).toBe('Updated Title for All')
      expect(updatedSchedule?.version).toBe(2)
    })

    test('should throw error for non-existent schedule', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await expect(
        result.current.updateRecurringSchedule(
          'non-existent',
          { title: 'Updated' },
          'all'
        )
      ).rejects.toThrow('Recurring schedule not found')
    })

    test('should require fromDate for single instance update', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await expect(
        result.current.updateRecurringSchedule(
          'test-recurring-1',
          { title: 'Updated' },
          'this'
        )
      ).rejects.toThrow('From date required for single instance update')
    })
  })

  describe('deleteRecurringSchedule', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      act(() => {
        result.current.setRecurringSchedules([mockRecurringSchedule])
      })
    })

    test('should delete single instance by adding exception', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await act(async () => {
        await result.current.deleteRecurringSchedule(
          'test-recurring-1',
          'this',
          '2024-01-01'
        )
      })

      const updatedSchedule = result.current.recurringSchedules.get('test-recurring-1')
      expect(updatedSchedule?.exceptions).toHaveLength(1)
      expect(updatedSchedule?.exceptions[0].date).toBe('2024-01-01')
      expect(updatedSchedule?.exceptions[0].type).toBe('cancelled')
    })

    test('should delete following instances by setting until date', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await act(async () => {
        await result.current.deleteRecurringSchedule(
          'test-recurring-1',
          'following',
          '2024-06-01'
        )
      })

      const updatedSchedule = result.current.recurringSchedules.get('test-recurring-1')
      expect(updatedSchedule?.recurrenceRule.until).toBe('2024-06-01')
    })

    test('should delete all instances by removing schedule', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await act(async () => {
        await result.current.deleteRecurringSchedule(
          'test-recurring-1',
          'all'
        )
      })

      expect(result.current.recurringSchedules.has('test-recurring-1')).toBe(false)
    })

    test('should require instanceDate for single instance deletion', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      await expect(
        result.current.deleteRecurringSchedule('test-recurring-1', 'this')
      ).rejects.toThrow('Instance date required for single instance deletion')
    })
  })

  describe('addException', () => {
    test('should add exception to schedule', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      act(() => {
        result.current.setRecurringSchedules([mockRecurringSchedule])
        result.current.addException('test-recurring-1', {
          date: '2024-01-15',
          type: 'cancelled'
        })
      })

      const updatedSchedule = result.current.recurringSchedules.get('test-recurring-1')
      expect(updatedSchedule?.exceptions).toHaveLength(1)
      expect(updatedSchedule?.exceptions[0].date).toBe('2024-01-15')
    })

    test('should handle non-existent schedule gracefully', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      expect(() => {
        result.current.addException('non-existent', {
          date: '2024-01-15',
          type: 'cancelled'
        })
      }).not.toThrow()
    })
  })

  describe('removeException', () => {
    test('should remove exception from schedule', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      const scheduleWithException = {
        ...mockRecurringSchedule,
        exceptions: [{
          date: '2024-01-15',
          type: 'cancelled' as const
        }]
      }

      act(() => {
        result.current.setRecurringSchedules([scheduleWithException])
        result.current.removeException('test-recurring-1', '2024-01-15')
      })

      const updatedSchedule = result.current.recurringSchedules.get('test-recurring-1')
      expect(updatedSchedule?.exceptions).toHaveLength(0)
    })
  })

  describe('generateInstances', () => {
    test('should generate instances and update cache', async () => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }

      act(() => {
        result.current.isGenerating = false
      })

      await act(async () => {
        await result.current.generateInstances(mockRecurringSchedule, dateRange)
      })

      expect(result.current.isGenerating).toBe(false)
      expect(result.current.scheduleInstances.has('test-recurring-1')).toBe(true)
    })

    test('should handle generation errors gracefully', async () => {
      const { OptimizedRecurrenceEngine } = require('../../lib/recurrence/performanceOptimization')
      OptimizedRecurrenceEngine.generateInstancesOptimized.mockRejectedValueOnce(new Error('Test error'))

      const { result } = renderHook(() => useRecurringScheduleStore())
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }

      await expect(
        result.current.generateInstances(mockRecurringSchedule, dateRange)
      ).rejects.toThrow('Test error')

      expect(result.current.isGenerating).toBe(false)
    })
  })

  describe('UI state management', () => {
    test('should manage editing instance state', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      const mockInstance = {
        id: 'instance-1',
        parentId: 'test-recurring-1',
        originalDate: '2024-01-01'
      } as any

      act(() => {
        result.current.setEditingInstance(mockInstance)
      })

      expect(result.current.editingInstance).toBe(mockInstance)

      act(() => {
        result.current.setEditingInstance(null)
      })

      expect(result.current.editingInstance).toBeNull()
    })

    test('should manage edit scope', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())

      act(() => {
        result.current.setEditScope('following')
      })

      expect(result.current.editScope).toBe('following')
    })

    test('should manage conflict dialog state', () => {
      const { result } = renderHook(() => useRecurringScheduleStore())
      const mockConflict = {
        hasConflicts: true,
        conflicts: [],
        suggestions: []
      }

      act(() => {
        result.current.openConflictDialog(mockConflict)
      })

      expect(result.current._conflictDialogOpen).toBe(true)
      expect(result.current._pendingConflictResolution).toBe(mockConflict)

      act(() => {
        result.current.closeConflictDialog()
      })

      expect(result.current._conflictDialogOpen).toBe(false)
      expect(result.current._pendingConflictResolution).toBeNull()
    })
  })

  describe('cache management', () => {
    test('should invalidate cache for specific schedule', () => {
      const { RecurringScheduleCache } = require('../../lib/recurrence/performanceOptimization')
      const { result } = renderHook(() => useRecurringScheduleStore())

      act(() => {
        result.current.scheduleInstances.set('test-schedule', [])
        result.current.invalidateCache('test-schedule')
      })

      expect(RecurringScheduleCache.invalidateCache).toHaveBeenCalledWith('test-schedule')
      expect(result.current.scheduleInstances.has('test-schedule')).toBe(false)
    })

    test('should invalidate all cache', () => {
      const { RecurringScheduleCache } = require('../../lib/recurrence/performanceOptimization')
      const { result } = renderHook(() => useRecurringScheduleStore())

      act(() => {
        result.current.scheduleInstances.set('test1', [])
        result.current.scheduleInstances.set('test2', [])
        result.current.invalidateCache()
      })

      expect(RecurringScheduleCache.invalidateCache).toHaveBeenCalledWith(undefined)
      expect(result.current.scheduleInstances.size).toBe(0)
    })
  })
})

describe('useRecurringScheduleStoreSelectors', () => {
  const mockSchedules: RecurringSchedule[] = [
    {
      id: 'schedule-1',
      title: 'Schedule 1',
      projectId: 'project-1',
      recurrenceRule: { frequency: 'weekly', interval: 1 }
    } as RecurringSchedule,
    {
      id: 'schedule-2', 
      title: 'Schedule 2',
      projectId: 'project-2',
      recurrenceRule: { frequency: 'daily', interval: 1 }
    } as RecurringSchedule
  ]

  beforeEach(() => {
    const { result } = renderHook(() => useRecurringScheduleStore())
    act(() => {
      result.current.setRecurringSchedules(mockSchedules)
    })
  })

  test('should return recurring schedules array', () => {
    const { result } = renderHook(() => useRecurringScheduleStoreSelectors())

    expect(result.current.recurringSchedulesArray).toHaveLength(2)
    expect(result.current.recurringSchedulesArray[0].id).toBe('schedule-1')
  })

  test('should return initialization state', () => {
    const { result } = renderHook(() => useRecurringScheduleStoreSelectors())

    expect(result.current.isInitialized).toBe(true)
  })

  test('should get instances for specific schedule', () => {
    const { result: storeResult } = renderHook(() => useRecurringScheduleStore())
    const { result: selectorsResult } = renderHook(() => useRecurringScheduleStoreSelectors())

    const mockInstances = [{ id: 'instance-1' }] as any[]

    act(() => {
      storeResult.current.scheduleInstances.set('schedule-1', mockInstances)
    })

    expect(selectorsResult.current.getInstancesForSchedule('schedule-1')).toBe(mockInstances)
    expect(selectorsResult.current.getInstancesForSchedule('non-existent')).toEqual([])
  })

  test('should get schedules by project', () => {
    const { result } = renderHook(() => useRecurringScheduleStoreSelectors())

    const projectSchedules = result.current.getSchedulesByProject('project-1')
    expect(projectSchedules).toHaveLength(1)
    expect(projectSchedules[0].id).toBe('schedule-1')
  })

  test('should get all instances in range', () => {
    const { result: storeResult } = renderHook(() => useRecurringScheduleStore())
    const { result: selectorsResult } = renderHook(() => useRecurringScheduleStoreSelectors())

    const mockInstances1 = [{
      id: 'instance-1',
      startDateTime: '2024-01-15T10:00:00.000Z',
      endDateTime: '2024-01-15T11:00:00.000Z'
    }] as any[]

    const mockInstances2 = [{
      id: 'instance-2',
      startDateTime: '2024-01-10T10:00:00.000Z',
      endDateTime: '2024-01-10T11:00:00.000Z'
    }] as any[]

    act(() => {
      storeResult.current.scheduleInstances.set('schedule-1', mockInstances1)
      storeResult.current.scheduleInstances.set('schedule-2', mockInstances2)
    })

    const allInstances = selectorsResult.current.getAllInstancesInRange({
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.000Z'
    })

    expect(allInstances).toHaveLength(2)
    expect(allInstances[0].id).toBe('instance-2') // Earlier date should come first
    expect(allInstances[1].id).toBe('instance-1')
  })
})