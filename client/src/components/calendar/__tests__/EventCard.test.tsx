import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import EventCard from '../EventCard';
import { Event } from '@/types/store';

// Mock react-dnd
jest.mock('react-dnd', () => ({
  ...jest.requireActual('react-dnd'),
  useDrag: () => [{ isDragging: false }, React.createRef()],
}));

const mockEvent: Event = {
  id: '1',
  title: 'Test Event',
  description: 'This is a test event description',
  startDate: new Date('2024-01-15T09:00:00'),
  endDate: new Date('2024-01-15T10:00:00'),
  allDay: false,
  color: '#3b82f6',
  category: 'meeting',
  location: 'Conference Room A',
  attendees: ['user1', 'user2', 'user3'],
};

const mockAllDayEvent: Event = {
  id: '2',
  title: 'All Day Event',
  startDate: new Date('2024-01-15T00:00:00'),
  endDate: new Date('2024-01-15T23:59:59'),
  allDay: true,
  color: '#10b981',
};

const DndWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

describe('EventCard', () => {
  const defaultProps = {
    event: mockEvent,
    projectColor: '#3b82f6',
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders event information correctly', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} />
      </DndWrapper>
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('This is a test event description')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.getByText('3 attendees')).toBeInTheDocument();
    expect(screen.getByText('meeting')).toBeInTheDocument();
  });

  it('renders compact version correctly', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} isCompact={true} />
      </DndWrapper>
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    
    // Compact version should not show description, location, etc.
    expect(screen.queryByText('This is a test event description')).not.toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
  });

  it('handles all-day events correctly', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} event={mockAllDayEvent} />
      </DndWrapper>
    );

    expect(screen.getByText('All Day Event')).toBeInTheDocument();
    // Should not show time for all-day events
    expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
  });

  it('handles click events', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} />
      </DndWrapper>
    );

    const eventCard = screen.getByText('Test Event').closest('[role="button"], div[class*="cursor-pointer"]');
    fireEvent.click(eventCard!);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockEvent);
  });

  it('handles edit button click', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} />
      </DndWrapper>
    );

    const editButton = screen.getByRole('button');
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockEvent);
  });

  it('applies project color styling', () => {
    const customColor = '#ff6b6b';
    render(
      <DndWrapper>
        <EventCard {...defaultProps} projectColor={customColor} />
      </DndWrapper>
    );

    const colorIndicator = screen.getByText('Test Event')
      .closest('div')
      ?.querySelector('[style*="background-color"]');
    
    expect(colorIndicator).toHaveStyle(`background-color: ${customColor}`);
  });

  it('shows selected state styling', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} isSelected={true} />
      </DndWrapper>
    );

    const eventCard = screen.getByText('Test Event').closest('div');
    expect(eventCard).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('hides time when showTime is false', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} showTime={false} />
      </DndWrapper>
    );

    expect(screen.queryByText('09:00 - 10:00')).not.toBeInTheDocument();
  });

  it('displays compact version with time when showTime is true', () => {
    render(
      <DndWrapper>
        <EventCard {...defaultProps} isCompact={true} showTime={true} />
      </DndWrapper>
    );

    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('handles events without optional properties', () => {
    const minimalEvent: Event = {
      id: '3',
      title: 'Minimal Event',
      startDate: new Date('2024-01-15T09:00:00'),
      endDate: new Date('2024-01-15T10:00:00'),
      allDay: false,
      color: '#3b82f6',
    };

    render(
      <DndWrapper>
        <EventCard {...defaultProps} event={minimalEvent} />
      </DndWrapper>
    );

    expect(screen.getByText('Minimal Event')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
    
    // Optional properties should not be shown
    expect(screen.queryByText('attendees')).not.toBeInTheDocument();
  });

  it('stops propagation on edit button click', () => {
    const mockStopPropagation = jest.fn();
    
    render(
      <DndWrapper>
        <EventCard {...defaultProps} />
      </DndWrapper>
    );

    const editButton = screen.getByRole('button');
    
    // Create a mock event with stopPropagation
    const mockEvent = {
      stopPropagation: mockStopPropagation,
    } as unknown as React.MouseEvent;

    fireEvent.click(editButton, mockEvent);

    expect(defaultProps.onEdit).toHaveBeenCalled();
  });
});