"use client";

import React from 'react';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import { CalendarProvider, useCalendar } from '@/contexts/CalendarContext';

function CalendarContent() {
  const { state, dispatch } = useCalendar();
  
  const handleViewChange = (view: 'month' | 'week') => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              캘린더
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              프로젝트별 일정을 관리하고 조회하세요
            </p>
          </div>
          
          {/* 뷰 전환 버튼 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewChange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.view === 'month'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="월 뷰로 전환"
            >
              월 뷰
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.view === 'week'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="주 뷰로 전환"
            >
              주 뷰
            </button>
          </div>
        </div>
      </div>

      {/* 뷰에 따라 컴포넌트 렌더링 */}
      {state.view === 'month' ? <MonthView /> : <WeekView />}
      
      {/* 성능 측정 정보 */}
      {state.viewTransitionTime && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>성능 정보:</strong> 뷰 전환 시간: {state.viewTransitionTime.toFixed(2)}ms
            {state.viewTransitionTime < 150 ? (
              <span className="ml-2 text-green-600">✅ 목표 달성!</span>
            ) : (
              <span className="ml-2 text-yellow-600">⚠️ 개선 필요</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <CalendarProvider>
      <CalendarContent />
    </CalendarProvider>
  );
}
