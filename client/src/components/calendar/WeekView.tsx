"use client";

import React, { useMemo, useCallback } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { format, isSameDay, isToday, addHours, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function WeekView() {
  const { state, dispatch, getWeekGrid, formatDate, getEventsForDate } = useCalendar();
  
  const weekGrid = useMemo(() => getWeekGrid(state.currentDate), [getWeekGrid, state.currentDate]);
  const weekDays = useMemo(() => ['일', '월', '화', '수', '목', '금', '토'], []);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const handleDateClick = useCallback((date: Date) => {
    console.log('Selected date:', formatDate(date, 'yyyy-MM-dd'));
  }, [formatDate]);

  const getEventsForDateAndHour = useCallback((date: Date, hour: number) => {
    const startOfHour = addHours(startOfDay(date), hour);
    const endOfHour = addHours(startOfHour, 1);
    
    return state.events.filter(event => {
      const eventStart = new Date(event.starts_at_utc);
      const eventEnd = new Date(event.ends_at_utc);
      
      // 이벤트가 해당 시간대와 겹치는지 확인
      return eventStart < endOfHour && eventEnd > startOfHour;
    });
  }, [state.events]);

  const navigatePrevious = useCallback(() => {
    dispatch({ type: 'NAVIGATE_PREVIOUS' });
  }, [dispatch]);

  const navigateNext = useCallback(() => {
    dispatch({ type: 'NAVIGATE_NEXT' });
  }, [dispatch]);

  const goToToday = useCallback(() => {
    dispatch({ type: 'GO_TO_TODAY' });
  }, [dispatch]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">오류: {state.error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {format(weekGrid[0], 'yyyy년 M월 d일', { locale: ko })} - {format(weekGrid[6], 'M월 d일', { locale: ko })}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={navigatePrevious}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
          >
            오늘
          </button>
          <button
            onClick={navigateNext}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 주간 뷰 */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 border-r">
              시간
            </div>
            {weekGrid.map((date, index) => (
              <div
                key={index}
                className={`p-3 text-center text-sm font-medium border-r cursor-pointer hover:bg-gray-50 ${
                  isToday(date)
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-gray-50 text-gray-500'
                }`}
                onClick={() => handleDateClick(date)}
              >
                <div className="font-semibold">{weekDays[index]}</div>
                <div className="text-xs">{format(date, 'M/d')}</div>
              </div>
            ))}
          </div>

          {/* 시간별 그리드 */}
          <div className="grid grid-cols-8">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                {/* 시간 라벨 */}
                <div className="p-2 text-xs text-gray-500 bg-gray-50 border-r border-b text-center">
                  {format(addHours(new Date(), hour), 'HH:mm')}
                </div>
                
                {/* 각 요일별 셀 */}
                {weekGrid.map((date, dayIndex) => {
                  const events = getEventsForDateAndHour(date, hour);
                  
                  return (
                    <div
                      key={dayIndex}
                      className="min-h-[60px] p-1 border-r border-b relative hover:bg-gray-50"
                    >
                      {/* 이벤트 표시 */}
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded mb-1 truncate"
                          style={{
                            backgroundColor: event.project?.color || '#6b7280',
                            color: 'white'
                          }}
                          title={`${event.title} (${format(new Date(event.starts_at_utc), 'HH:mm')})`}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
