"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addMonths, subMonths, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { calendarApi } from '@/lib/api/calendar';

// 타입 정의
export interface Event {
  id: string;
  tenant_id: string;
  project_id: string;
  title: string;
  starts_at_utc: string;
  ends_at_utc: string;
  timezone: string;
  is_all_day: boolean;
  rrule_json?: string;
  exdates_json?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface Project {
  id: string;
  tenant_id: string;
  owner_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarState {
  currentDate: Date;
  view: 'month' | 'week';
  events: Event[];
  projects: Project[];
  filters: {
    projects: string[];
    assignees: string[];
    tags: string[];
  };
  loading: boolean;
  error: string | null;
  // 접근성: 스크린 리더 알림
  screenReaderAnnouncement: string | null;
  // 성능 측정: 뷰 전환 시간
  viewTransitionTime: number | null;
}

export type CalendarAction =
  | { type: 'SET_CURRENT_DATE'; payload: Date }
  | { type: 'SET_VIEW'; payload: 'month' | 'week' }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_FILTERS'; payload: Partial<CalendarState['filters']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SCREEN_READER_ANNOUNCEMENT'; payload: string | null }
  | { type: 'SET_VIEW_TRANSITION_TIME'; payload: number }
  | { type: 'NAVIGATE_PREVIOUS' }
  | { type: 'NAVIGATE_NEXT' }
  | { type: 'GO_TO_TODAY' };

// 초기 상태
const initialState: CalendarState = {
  currentDate: new Date(),
  view: 'month',
  events: [],
  projects: [],
  filters: {
    projects: [],
    assignees: [],
    tags: [],
  },
  loading: false,
  error: null,
  screenReaderAnnouncement: null,
  viewTransitionTime: null,
};

// 리듀서
function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_CURRENT_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_VIEW':
      const startTime = performance.now();
      // 뷰 전환 시간 측정을 위한 지연 처리
      setTimeout(() => {
        const endTime = performance.now();
        const transitionTime = endTime - startTime;
        dispatch({ type: 'SET_VIEW_TRANSITION_TIME', payload: transitionTime });
      }, 0);
      return { ...state, view: action.payload };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SCREEN_READER_ANNOUNCEMENT':
      return { ...state, screenReaderAnnouncement: action.payload };
    case 'SET_VIEW_TRANSITION_TIME':
      return { ...state, viewTransitionTime: action.payload };
    case 'NAVIGATE_PREVIOUS':
      const prevDate = state.view === 'month' 
        ? subMonths(state.currentDate, 1)
        : subWeeks(state.currentDate, 1);
      return { ...state, currentDate: prevDate, screenReaderAnnouncement: `${state.view === 'month' ? '이전 달' : '이전 주'}로 이동했습니다` };
    case 'NAVIGATE_NEXT':
      const nextDate = state.view === 'month'
        ? addMonths(state.currentDate, 1)
        : addWeeks(state.currentDate, 1);
      return { ...state, currentDate: nextDate, screenReaderAnnouncement: `${state.view === 'month' ? '다음 달' : '다음 주'}로 이동했습니다` };
    case 'GO_TO_TODAY':
      return { ...state, currentDate: new Date(), screenReaderAnnouncement: '오늘로 이동했습니다' };
    default:
      return state;
  }
}

// 유틸리티 함수들
function getMonthGrid(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startWeek = startOfWeek(start);
  const endWeek = endOfWeek(end);
  
  const weeks = [];
  let current = startWeek;
  
  while (current <= endWeek) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  
  return weeks;
}

// 이벤트 인덱싱 함수 (성능 최적화)
function createEventIndex(events: Event[]) {
  const index = new Map<string, Event[]>();
  
  events.forEach(event => {
    const eventDate = new Date(event.starts_at_utc);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    
    if (!index.has(dateKey)) {
      index.set(dateKey, []);
    }
    index.get(dateKey)!.push(event);
  });
  
  return index;
}

function getWeekGrid(date: Date) {
  const start = startOfWeek(date);
  const week = [];
  
  for (let i = 0; i < 7; i++) {
    week.push(new Date(start));
    start.setDate(start.getDate() + 1);
  }
  
  return week;
}

function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd') {
  return format(date, formatStr, { locale: ko });
}

// 한국어 로케일 설정을 위한 유틸리티 함수
function getKoreanLocale() {
  return ko;
}

// 시간대 처리를 위한 유틸리티 함수
function formatDateWithTimezone(date: Date, formatStr: string = 'yyyy-MM-dd', timezone: string = 'Asia/Seoul') {
  // 간단한 시간대 변환 (실제 프로덕션에서는 moment-timezone 같은 라이브러리 사용 권장)
  const koreanDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return format(koreanDate, formatStr, { locale: ko });
}

// Context 생성
const CalendarContext = createContext<{
  state: CalendarState;
  dispatch: React.Dispatch<CalendarAction>;
  getMonthGrid: (date: Date) => Date[][];
  getWeekGrid: (date: Date) => Date[];
  formatDate: (date: Date, formatStr?: string) => string;
  formatDateWithTimezone: (date: Date, formatStr?: string, timezone?: string) => string;
  getKoreanLocale: () => Locale;
  getEventsForDate: (date: Date) => Event[];
  performance: {
    eventIndexSize: number;
    totalEvents: number;
    eventsPerDate: string;
  };
} | null>(null);

// Provider 컴포넌트
export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  // 프로젝트 목록 로딩 (테스트 데이터 포함)
  useEffect(() => {
    const loadProjects = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // 백엔드 연결 시도
        try {
          const projects = await calendarApi.getProjects();
          dispatch({ type: 'SET_PROJECTS', payload: projects });
        } catch (error) {
          // 백엔드 연결 실패 시 테스트 데이터 사용
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          console.warn('백엔드 연결 실패, 테스트 데이터 사용:', {
            error: errorMessage,
            timestamp: new Date().toISOString(),
            endpoint: 'projects'
          });
          
          // 사용자에게 친화적인 에러 메시지 표시
          dispatch({ type: 'SET_ERROR', payload: '백엔드 연결에 실패했습니다. 테스트 데이터를 사용합니다.' });
          
          const testProjects: Project[] = [
            { id: "1", tenant_id: "1", owner_id: "1", name: "프로젝트 A", color: "#3b82f6", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: "2", tenant_id: "1", owner_id: "1", name: "프로젝트 B", color: "#ef4444", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: "3", tenant_id: "1", owner_id: "1", name: "프로젝트 C", color: "#10b981", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ];
          dispatch({ type: 'SET_PROJECTS', payload: testProjects });
          
          // 3초 후 에러 메시지 자동 제거
          setTimeout(() => {
            dispatch({ type: 'SET_ERROR', payload: null });
          }, 3000);
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '프로젝트 로딩 실패' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadProjects();
  }, []);

  // 이벤트 로딩 (현재 월/주 기준, 테스트 데이터 포함)
  useEffect(() => {
    const loadEvents = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // 백엔드 연결 시도
        try {
          const from = state.view === 'month' 
            ? startOfMonth(state.currentDate).toISOString()
            : startOfWeek(state.currentDate).toISOString();
          
          const to = state.view === 'month'
            ? endOfMonth(state.currentDate).toISOString()
            : endOfWeek(state.currentDate).toISOString();

          const events = await calendarApi.getTimeline(from, to);
          dispatch({ type: 'SET_EVENTS', payload: events });
        } catch (error) {
          // 백엔드 연결 실패 시 테스트 데이터 사용
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          console.warn('백엔드 연결 실패, 테스트 이벤트 데이터 사용:', {
            error: errorMessage,
            timestamp: new Date().toISOString(),
            endpoint: 'timeline',
            params: { from, to }
          });
          
          // 사용자에게 친화적인 에러 메시지 표시
          dispatch({ type: 'SET_ERROR', payload: '이벤트 데이터 로딩에 실패했습니다. 테스트 데이터를 사용합니다.' });
          
          const testEvents: Event[] = [
            {
              id: "1",
              tenant_id: "1",
              project_id: "1",
              title: "팀 미팅",
              starts_at_utc: new Date().toISOString(),
              ends_at_utc: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              timezone: "Asia/Seoul",
              is_all_day: false,
              rrule_json: null,
              exdates_json: null,
              created_by: "1",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              project: { id: "1", name: "프로젝트 A", color: "#3b82f6" }
            },
            {
              id: "2",
              tenant_id: "1",
              project_id: "2",
              title: "코드 리뷰",
              starts_at_utc: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              ends_at_utc: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
              timezone: "Asia/Seoul",
              is_all_day: false,
              rrule_json: null,
              exdates_json: null,
              created_by: "1",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              project: { id: "2", name: "프로젝트 B", color: "#ef4444" }
            }
          ];
          dispatch({ type: 'SET_EVENTS', payload: testEvents });
          
          // 3초 후 에러 메시지 자동 제거
          setTimeout(() => {
            dispatch({ type: 'SET_ERROR', payload: null });
          }, 3000);
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '이벤트 로딩 실패' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadEvents();
  }, [state.currentDate, state.view, state.filters]);

  // 이벤트 인덱스 생성 (성능 최적화)
  const eventIndex = useMemo(() => createEventIndex(state.events), [state.events]);
  
  // 최적화된 이벤트 조회 함수
  const getEventsForDate = useCallback((date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventIndex.get(dateKey) || [];
  }, [eventIndex]);
  
  // 성능 측정: 이벤트 인덱스 크기
  const eventIndexSize = useMemo(() => eventIndex.size, [eventIndex]);
  const totalEvents = useMemo(() => state.events.length, [state.events]);
  
  const value = {
    state,
    dispatch,
    getMonthGrid,
    getWeekGrid,
    formatDate,
    formatDateWithTimezone,
    getKoreanLocale,
    getEventsForDate,
    // 성능 측정 정보
    performance: {
      eventIndexSize,
      totalEvents,
      eventsPerDate: totalEvents > 0 ? (totalEvents / eventIndexSize).toFixed(2) : '0'
    }
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

// Hook
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
