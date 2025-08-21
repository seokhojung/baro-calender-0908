"use client";

import React, { useMemo, useCallback } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import ScreenReaderAnnouncement from '@/components/ui/screen-reader-announcement';
import ErrorBoundary from '@/components/ui/error-boundary';

function MonthViewContent() {
  const { state, dispatch, getMonthGrid, formatDate, getEventsForDate } = useCalendar();
  
  const monthGrid = useMemo(() => getMonthGrid(state.currentDate), [getMonthGrid, state.currentDate]);
  const weekDays = useMemo(() => ['일', '월', '화', '수', '목', '금', '토'], []);

  const handleDateClick = useCallback((date: Date) => {
    // 날짜 클릭 시 처리 (예: 이벤트 생성 모달 열기)
    console.log('Selected date:', formatDate(date, 'yyyy-MM-dd'));
  }, [formatDate]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, date: Date) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDateClick(date);
    }
  }, [handleDateClick]);

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
      {/* 스크린 리더 알림 */}
      <ScreenReaderAnnouncement 
        message={state.screenReaderAnnouncement}
        onAnnouncementComplete={() => dispatch({ type: 'SET_SCREEN_READER_ANNOUNCEMENT', payload: null })}
      />
      
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {format(state.currentDate, 'yyyy년 M월', { locale: ko })}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={navigatePrevious}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            aria-label="이전 달"
            title="이전 달"
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
            aria-label="다음 달"
            title="다음 달"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7">
        {monthGrid.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((date, dayIndex) => {
              const isCurrentMonth = isSameMonth(date, state.currentDate);
              const isCurrentDay = isToday(date);
              const events = getEventsForDate(date);
              
              return (
                                 <div
                   key={dayIndex}
                   className={`min-h-[120px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 ${
                     !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                   }`}
                   onClick={() => handleDateClick(date)}
                   onKeyDown={(e) => handleKeyDown(e, date)}
                   tabIndex={0}
                   role="button"
                   aria-label={`${formatDate(date, 'yyyy년 M월 d일')} 선택`}
                   aria-pressed={false}
                 >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isCurrentDay
                          ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                          : isCurrentMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {format(date, 'd')}
                    </span>
                  </div>
                  
                  {/* 이벤트 표시 */}
                  <div className="space-y-1">
                    {events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded truncate"
                        style={{
                          backgroundColor: event.project?.color || '#6b7280',
                          color: 'white'
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{events.length - 3} 더보기
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function MonthView() {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-red-600 text-lg font-medium mb-2">
            캘린더 뷰를 불러오는 중 오류가 발생했습니다
          </div>
          <p className="text-gray-600 mb-4">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      }
    >
      <MonthViewContent />
    </ErrorBoundary>
  );
}
