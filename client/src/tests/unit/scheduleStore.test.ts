/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useScheduleStore } from '@/stores/scheduleStore'
import { Schedule } from '@/types/schedule'

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}))

describe('ScheduleStore', () => {
  const mockSchedule: Schedule = {
    id: '1',
    title: 'Test Schedule',
    description: 'Test Description',
    startDateTime: '2024-12-09T10:00:00.000Z',
    endDateTime: '2024-12-09T11:00:00.000Z',
    isAllDay: false,
    timezone: 'Asia/Seoul',
    projectId: 'project1',
    project: { id: 'project1', name: 'Test Project', color: 'blue' },
    attendees: [
      {
        userId: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'organizer',
        status: 'accepted'
      }
    ],
    status: 'confirmed',
    isPrivate: false,
    location: 'Test Location',
    attachments: [],
    createdBy: 'user1',
    updatedBy: 'user1',
    createdAt: '2024-12-09T09:00:00.000Z',
    updatedAt: '2024-12-09T09:00:00.000Z',
    version: 1
  }

  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useScheduleStore())
    act(() => {
      result.current.setSchedules([])
    })
  })

  describe('Basic CRUD Operations', () => {
    it('should set schedules correctly', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      act(() => {
        result.current.setSchedules([mockSchedule])
      })

      expect(result.current.schedules.get('1')).toEqual(mockSchedule)
      expect(result.current._isInitialized).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should add a new schedule', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      act(() => {
        result.current.addSchedule(mockSchedule)
      })

      expect(result.current.schedules.get('1')).toEqual(mockSchedule)
      expect(result.current.schedules.size).toBe(1)
    })

    it('should update an existing schedule', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Add initial schedule
      act(() => {
        result.current.addSchedule(mockSchedule)
      })

      // Update schedule
      const updates = { title: 'Updated Title' }
      act(() => {
        result.current.updateSchedule('1', updates)
      })

      const updatedSchedule = result.current.schedules.get('1')
      expect(updatedSchedule?.title).toBe('Updated Title')
      expect(updatedSchedule?.version).toBe(2) // Version should increment
      expect(new Date(updatedSchedule?.updatedAt || '')).toBeInstanceOf(Date)
    })

    it('should delete a schedule', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Add initial schedule
      act(() => {
        result.current.addSchedule(mockSchedule)
      })

      expect(result.current.schedules.size).toBe(1)

      // Delete schedule
      act(() => {
        result.current.deleteSchedule('1')
      })

      expect(result.current.schedules.size).toBe(0)
      expect(result.current.schedules.get('1')).toBeUndefined()
    })
  })

  describe('Drag and Drop Operations', () => {
    it('should start drag operation', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      act(() => {
        result.current.startDrag(mockSchedule)
      })

      expect(result.current.draggedSchedule).toEqual(mockSchedule)
    })

    it('should update dragged schedule', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Start drag
      act(() => {
        result.current.startDrag(mockSchedule)
      })

      // Update dragged schedule
      const updates = {
        startDateTime: '2024-12-09T11:00:00.000Z',
        endDateTime: '2024-12-09T12:00:00.000Z'
      }
      
      act(() => {
        result.current.updateDraggedSchedule(updates)
      })

      expect(result.current.draggedSchedule?.startDateTime).toBe(updates.startDateTime)
      expect(result.current.draggedSchedule?.endDateTime).toBe(updates.endDateTime)
    })

    it('should cancel drag operation', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Start drag
      act(() => {
        result.current.startDrag(mockSchedule)
      })

      expect(result.current.draggedSchedule).toEqual(mockSchedule)

      // Cancel drag
      act(() => {
        result.current.cancelDrag()
      })

      expect(result.current.draggedSchedule).toBeNull()
    })
  })

  describe('Conflict Detection', () => {
    it('should detect time conflicts', async () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Add existing schedule
      act(() => {
        result.current.addSchedule(mockSchedule)
      })

      // Check for conflict with overlapping time
      const conflictingSchedule = {
        id: '2',
        title: 'Conflicting Schedule',
        description: 'Test conflict',
        startDateTime: '2024-12-09T10:30:00.000Z',
        endDateTime: '2024-12-09T11:30:00.000Z',
        isAllDay: false,
        timezone: 'Asia/Seoul',
        projectId: '1',
        project: { id: '1', name: 'Test Project', color: 'blue' },
        attendees: [
          {
            userId: 'user1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'required' as const,
            status: 'accepted' as const
          }
        ],
        status: 'confirmed' as const,
        isPrivate: false,
        attachments: [],
        createdBy: 'user1',
        updatedBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      let conflictResult
      await act(async () => {
        conflictResult = await result.current.checkConflicts(conflictingSchedule)
      })

      expect(conflictResult).toBeDefined()
      expect(conflictResult!.hasConflicts).toBe(true)
      expect(conflictResult!.conflicts).toHaveLength(1)
      expect(conflictResult!.conflicts[0].scheduleId).toBe('1')
      expect(conflictResult!.suggestions).toHaveLength(1)
    })

    it('should not detect conflicts for non-overlapping times', async () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Add existing schedule
      act(() => {
        result.current.addSchedule(mockSchedule)
      })

      // Check for conflict with non-overlapping time
      const nonConflictingSchedule = {
        id: '2',
        title: 'Non-conflicting Schedule',
        description: 'Test non-conflict',
        startDateTime: '2024-12-09T12:00:00.000Z',
        endDateTime: '2024-12-09T13:00:00.000Z',
        isAllDay: false,
        timezone: 'Asia/Seoul',
        projectId: '1',
        project: { id: '1', name: 'Test Project', color: 'blue' },
        attendees: [
          {
            userId: 'user1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'required' as const,
            status: 'accepted' as const
          }
        ],
        status: 'confirmed' as const,
        isPrivate: false,
        attachments: [],
        createdBy: 'user1',
        updatedBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }

      let conflictResult
      await act(async () => {
        conflictResult = await result.current.checkConflicts(nonConflictingSchedule)
      })

      expect(conflictResult).toBeDefined()
      expect(conflictResult!.hasConflicts).toBe(false)
      expect(conflictResult!.conflicts).toHaveLength(0)
    })
  })

  describe('Real-time Updates', () => {
    it('should handle schedule creation update', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      const updatePayload = {
        type: 'CREATED' as const,
        schedule: mockSchedule
      }

      act(() => {
        result.current.handleRealtimeUpdate(updatePayload)
      })

      expect(result.current.schedules.get('1')).toEqual(mockSchedule)
    })

    it('should handle schedule update only if version is newer', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Add initial schedule
      act(() => {
        result.current.addSchedule(mockSchedule)
      })

      // Update with newer version
      const updatedSchedule = { ...mockSchedule, title: 'Updated', version: 2 }
      const updatePayload = {
        type: 'UPDATED' as const,
        schedule: updatedSchedule
      }

      act(() => {
        result.current.handleRealtimeUpdate(updatePayload)
      })

      expect(result.current.schedules.get('1')?.title).toBe('Updated')
      expect(result.current.schedules.get('1')?.version).toBe(2)
    })

    it('should ignore updates with older version', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Add initial schedule with version 2
      const newerSchedule = { ...mockSchedule, version: 2 }
      act(() => {
        result.current.addSchedule(newerSchedule)
      })

      // Try to update with older version
      const olderSchedule = { ...mockSchedule, title: 'Should Not Update', version: 1 }
      const updatePayload = {
        type: 'UPDATED' as const,
        schedule: olderSchedule
      }

      act(() => {
        result.current.handleRealtimeUpdate(updatePayload)
      })

      expect(result.current.schedules.get('1')?.title).toBe('Test Schedule')
      expect(result.current.schedules.get('1')?.version).toBe(2)
    })

    it('should handle schedule deletion update', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      // Add initial schedule
      act(() => {
        result.current.addSchedule(mockSchedule)
      })

      expect(result.current.schedules.size).toBe(1)

      // Delete via real-time update
      const deletePayload = {
        type: 'DELETED' as const,
        schedule: mockSchedule
      }

      act(() => {
        result.current.handleRealtimeUpdate(deletePayload)
      })

      expect(result.current.schedules.size).toBe(0)
    })
  })

  describe('View State Management', () => {
    it('should set view mode', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      act(() => {
        result.current.setViewMode('day')
      })

      expect(result.current.viewMode).toBe('day')
    })

    it('should set selected date range', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      const dateRange = {
        start: '2024-12-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z'
      }

      act(() => {
        result.current.setSelectedDateRange(dateRange)
      })

      expect(result.current.selectedDateRange).toEqual(dateRange)
    })

    it('should toggle show all day', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      const initialValue = result.current.showAllDay
      
      act(() => {
        result.current.toggleShowAllDay()
      })

      expect(result.current.showAllDay).toBe(!initialValue)
    })

    it('should toggle show private', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      const initialValue = result.current.showPrivate
      
      act(() => {
        result.current.toggleShowPrivate()
      })

      expect(result.current.showPrivate).toBe(!initialValue)
    })
  })

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      const error = { message: 'Test Error', code: 500 }

      act(() => {
        result.current.setError(error)
      })

      expect(result.current.error).toEqual(error)

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useScheduleStore())
      
      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})