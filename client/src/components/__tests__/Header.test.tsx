import React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/layout/Header'

// Mock CalendarContext
jest.mock('@/contexts/CalendarContext', () => ({
  useCalendar: () => ({
    state: {
      view: { type: 'month', currentDate: new Date() },
      filters: { projects: [], assignees: [], tags: [] },
      events: [],
      projects: [],
      loading: false,
      error: null,
    },
    setView: jest.fn(),
    setFilters: jest.fn(),
    setEvents: jest.fn(),
    setProjects: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    addEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  }),
}))

describe('Header', () => {
  it('renders header with title', () => {
    render(<Header />)
    expect(screen.getByText('Baro Calendar')).toBeInTheDocument()
  })

  it('renders notification bell', () => {
    render(<Header />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})
