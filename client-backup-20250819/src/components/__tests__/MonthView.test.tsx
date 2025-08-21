import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MonthView from '@/components/calendar/MonthView'

// Mock CalendarContext
const mockDispatch = jest.fn()
const mockUseCalendar = {
  state: {
    currentDate: new Date('2025-01-15'),
    view: 'month',
    events: [
      {
        id: '1',
        title: 'Test Event',
        starts_at_utc: '2025-01-15T10:00:00Z',
        ends_at_utc: '2025-01-15T11:00:00Z',
        project_id: '1',
        tenant_id: '1',
        timezone: 'UTC',
        is_all_day: false,
        created_by: '1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        project: {
          id: '1',
          name: 'Test Project',
          color: '#3b82f6'
        }
      },
    ],
    projects: [
      {
        id: '1',
        name: 'Test Project',
        color: '#3b82f6',
        tenant_id: '1',
        owner_id: '1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ],
    filters: {
      projects: [],
      assignees: [],
      tags: []
    },
    loading: false,
    error: null,
  },
  dispatch: mockDispatch,
  getMonthGrid: jest.fn((date) => {
    // 간단한 월 그리드 생성 로직
    const weeks = [];
    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(date);
        dayDate.setDate(date.getDate() + (week * 7) + day - 15);
        days.push(dayDate);
      }
      weeks.push(days);
    }
    return weeks;
  }),
  getWeekGrid: jest.fn(),
  formatDate: jest.fn((date) => date.toISOString().split('T')[0]),
  getEventsForDate: jest.fn((date) => {
    // 테스트용 이벤트 반환
    return mockUseCalendar.state.events.filter(event => {
      const eventDate = new Date(event.starts_at_utc);
      return eventDate.toISOString().split('T')[0] === date.toISOString().split('T')[0];
    });
  })
}

jest.mock('@/contexts/CalendarContext', () => ({
  useCalendar: () => mockUseCalendar,
}))

describe('MonthView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders month view with current month', () => {
    render(<MonthView />)
    expect(screen.getByText('2025년 1월')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<MonthView />)
    expect(screen.getByText('오늘')).toBeInTheDocument()
  })

  it('renders calendar grid', () => {
    render(<MonthView />)
    // 캘린더 그리드가 렌더링되어야 함
    expect(screen.getByText('일')).toBeInTheDocument()
    expect(screen.getByText('월')).toBeInTheDocument()
  })

  it('handles navigation actions', () => {
    render(<MonthView />)
    
    // 이전 버튼 클릭
    const prevButton = screen.getByRole('button', { name: /이전/i })
    fireEvent.click(prevButton)
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_PREVIOUS' })
    
    // 다음 버튼 클릭
    const nextButton = screen.getByRole('button', { name: /다음/i })
    fireEvent.click(nextButton)
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NAVIGATE_NEXT' })
    
    // 오늘 버튼 클릭
    const todayButton = screen.getByText('오늘')
    fireEvent.click(todayButton)
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'GO_TO_TODAY' })
  })
})
