'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { CalendarView, CalendarFilters, Event, Project } from '@/types/calendar';

interface CalendarState {
  view: CalendarView;
  filters: CalendarFilters;
  events: Event[];
  projects: Project[];
  loading: boolean;
  error: string | null;
}

type CalendarAction =
  | { type: 'SET_VIEW'; payload: CalendarView }
  | { type: 'SET_FILTERS'; payload: CalendarFilters }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string };

const initialState: CalendarState = {
  view: { type: 'month', currentDate: new Date() },
  filters: { projects: [], assignees: [], tags: [] },
  events: [],
  projects: [],
  loading: false,
  error: null,
};

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        ),
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
      };
    default:
      return state;
  }
}

interface CalendarContextType {
  state: CalendarState;
  dispatch: React.Dispatch<CalendarAction>;
  setView: (view: CalendarView) => void;
  setFilters: (filters: CalendarFilters) => void;
  setEvents: (events: Event[]) => void;
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  const setView = (view: CalendarView) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const setFilters = (filters: CalendarFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setEvents = (events: Event[]) => {
    dispatch({ type: 'SET_EVENTS', payload: events });
  };

  const setProjects = (projects: Project[]) => {
    dispatch({ type: 'SET_PROJECTS', payload: projects });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const addEvent = (event: Event) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
  };

  const updateEvent = (event: Event) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event });
  };

  const deleteEvent = (eventId: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: eventId });
  };

  const value: CalendarContextType = {
    state,
    dispatch,
    setView,
    setFilters,
    setEvents,
    setProjects,
    setLoading,
    setError,
    addEvent,
    updateEvent,
    deleteEvent,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
