/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleCreateForm } from '@/components/calendar/ScheduleCreateForm'
import { CreateScheduleInput } from '@/types/schedule'

// Mock dependencies
jest.mock('@/stores/scheduleStore', () => ({
  useScheduleStore: () => ({
    checkConflicts: jest.fn().mockResolvedValue({
      hasConflicts: false,
      conflicts: [],
      suggestions: []
    })
  })
}))

jest.mock('lodash', () => ({
  debounce: (fn: any) => fn
}))

// Mock date-fns to avoid timezone issues in tests
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  parseISO: jest.fn((dateString) => new Date(dateString)),
  addHours: jest.fn((date, hours) => {
    const result = new Date(date)
    result.setHours(result.getHours() + hours)
    return result
  })
}))

describe('ScheduleCreateForm', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      render(<ScheduleCreateForm {...defaultProps} />)

      expect(screen.getByLabelText(/제목/)).toBeInTheDocument()
      expect(screen.getByLabelText(/프로젝트/)).toBeInTheDocument()
      expect(screen.getByLabelText(/하루 종일/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /일정 생성/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /취소/ })).toBeInTheDocument()
    })

    it('should render with initial data when provided', () => {
      const initialData = {
        title: 'Test Event',
        description: 'Test Description',
        projectId: '1',
        location: 'Test Location'
      }

      render(<ScheduleCreateForm {...defaultProps} initialData={initialData} />)

      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument()
    })

    it('should show additional fields when expanded', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      // Expand additional information section
      const expandButton = screen.getByRole('button', { name: /추가 정보/ })
      await user.click(expandButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/설명/)).toBeInTheDocument()
        expect(screen.getByLabelText(/장소/)).toBeInTheDocument()
        expect(screen.getByLabelText(/URL/)).toBeInTheDocument()
        expect(screen.getByLabelText(/비공개 일정/)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for empty title', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /일정 생성/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/제목을 입력해주세요/)).toBeInTheDocument()
      })

      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it('should show validation error for empty project selection', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      // Fill title but leave project empty
      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'Test Event')

      const submitButton = screen.getByRole('button', { name: /일정 생성/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/프로젝트를 선택해주세요/)).toBeInTheDocument()
      })

      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it('should validate URL format', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      // Expand additional information section
      const expandButton = screen.getByRole('button', { name: /추가 정보/ })
      await user.click(expandButton)

      await waitFor(async () => {
        const urlInput = screen.getByLabelText(/URL/)
        await user.type(urlInput, 'invalid-url')
      })

      const submitButton = screen.getByRole('button', { name: /일정 생성/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/올바른 URL을 입력해주세요/)).toBeInTheDocument()
      })
    })

    it('should validate that end time is after start time', async () => {
      const user = userEvent.setup()
      const initialData = {
        startDateTime: '2024-12-09T10:00:00.000Z',
        endDateTime: '2024-12-09T09:00:00.000Z' // End before start
      }

      render(<ScheduleCreateForm {...defaultProps} initialData={initialData} />)

      // Fill required fields
      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'Test Event')

      // Select project (assuming first option)
      const projectSelect = screen.getByRole('combobox')
      await user.click(projectSelect)

      const submitButton = screen.getByRole('button', { name: /일정 생성/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/종료 시간은 시작 시간보다 늦어야 합니다/)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      // Fill required fields
      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'Test Event')

      // Select project
      const projectSelect = screen.getByRole('combobox')
      await user.click(projectSelect)
      
      // Assuming first project option is available
      const firstProject = screen.getAllByRole('option')[0]
      if (firstProject) {
        await user.click(firstProject)
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /일정 생성/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Event',
            isAllDay: false,
            isPrivate: false,
            attendees: []
          })
        )
      })
    })

    it('should handle form cancellation', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /취소/ })
      await user.click(cancelButton)

      expect(defaultProps.onCancel).toHaveBeenCalled()
    })
  })

  describe('All Day Toggle', () => {
    it('should hide time pickers when all day is enabled', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      // Enable all day toggle
      const allDayToggle = screen.getByRole('switch', { name: /하루 종일/ })
      await user.click(allDayToggle)

      // Time pickers should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText(/시작 시간/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/종료 시간/)).not.toBeInTheDocument()
      })
    })

    it('should show time pickers when all day is disabled', async () => {
      const user = userEvent.setup()
      const initialData = { isAllDay: true }
      render(<ScheduleCreateForm {...defaultProps} initialData={initialData} />)

      // Disable all day toggle
      const allDayToggle = screen.getByRole('switch', { name: /하루 종일/ })
      await user.click(allDayToggle)

      // Time pickers should be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/시작 시간/)).toBeInTheDocument()
        expect(screen.getByLabelText(/종료 시간/)).toBeInTheDocument()
      })
    })
  })

  describe('Conflict Detection', () => {
    it('should show conflict warning when conflicts are detected', async () => {
      // Mock conflict detection to return conflicts
      const mockCheckConflicts = jest.fn().mockResolvedValue({
        hasConflicts: true,
        conflicts: [
          {
            scheduleId: '1',
            title: 'Existing Event',
            startDateTime: '2024-12-09T10:00:00.000Z',
            endDateTime: '2024-12-09T11:00:00.000Z',
            severity: 'high',
            conflictingAttendees: ['test@example.com']
          }
        ],
        suggestions: []
      })

      jest.doMock('@/stores/scheduleStore', () => ({
        useScheduleStore: () => ({
          checkConflicts: mockCheckConflicts
        })
      }))

      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      // Fill form to trigger conflict check
      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'Test Event')

      // Wait for conflict detection
      await waitFor(() => {
        expect(screen.getByText(/일정 충돌/)).toBeInTheDocument()
        expect(screen.getByText(/1개의 다른 일정과 시간이 겹칩니다/)).toBeInTheDocument()
      })
    })

    it('should show suggestion buttons when alternatives are available', async () => {
      const mockCheckConflicts = jest.fn().mockResolvedValue({
        hasConflicts: true,
        conflicts: [
          {
            scheduleId: '1',
            title: 'Existing Event',
            startDateTime: '2024-12-09T10:00:00.000Z',
            endDateTime: '2024-12-09T11:00:00.000Z',
            severity: 'high',
            conflictingAttendees: ['test@example.com']
          }
        ],
        suggestions: [
          {
            startDateTime: '2024-12-09T11:00:00.000Z',
            endDateTime: '2024-12-09T12:00:00.000Z',
            reason: '11:00 - 12:00 시간대 가능'
          }
        ]
      })

      jest.doMock('@/stores/scheduleStore', () => ({
        useScheduleStore: () => ({
          checkConflicts: mockCheckConflicts
        })
      }))

      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      // Fill form and expand conflict details
      const titleInput = screen.getByLabelText(/제목/)
      await user.type(titleInput, 'Test Event')

      await waitFor(async () => {
        const detailsButton = screen.getByRole('button', { name: /자세히 보기/ })
        await user.click(detailsButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/11:00 - 12:00 시간대 가능/)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ScheduleCreateForm {...defaultProps} />)

      expect(screen.getByLabelText(/제목/)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/프로젝트/)).toBeInTheDocument()
      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup()
      render(<ScheduleCreateForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /일정 생성/ })
      await user.click(submitButton)

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/제목/)
        const errorMessage = screen.getByText(/제목을 입력해주세요/)
        
        expect(titleInput).toHaveAttribute('aria-invalid', 'true')
        expect(errorMessage).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(<ScheduleCreateForm {...defaultProps} />)

      const titleInput = screen.getByLabelText(/제목/)
      titleInput.focus()

      // Tab to next field
      fireEvent.keyDown(titleInput, { key: 'Tab' })
      
      // Should be able to navigate through form fields
      expect(document.activeElement).not.toBe(titleInput)
    })
  })
})