'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCalendar } from '@/contexts/CalendarContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

export function MonthView() {
  const { state, setView } = useCalendar();

  const monthData = useMemo(() => {
    const start = startOfMonth(state.view.currentDate);
    const end = endOfMonth(state.view.currentDate);
    const startDate = startOfWeek(start);
    const endDate = endOfWeek(end);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [state.view.currentDate]);

  const handlePreviousMonth = () => {
    const newDate = new Date(state.view.currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setView({ ...state.view, currentDate: newDate });
  };

  const handleNextMonth = () => {
    const newDate = new Date(state.view.currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setView({ ...state.view, currentDate: newDate });
  };

  const handleToday = () => {
    setView({ ...state.view, currentDate: new Date() });
  };

  const getEventsForDate = (date: Date) => {
    return state.events.filter(event => {
      const eventDate = new Date(event.starts_at_utc);
      return isSameDay(eventDate, date);
    });
  };

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(state.view.currentDate, 'yyyy년 M월', { locale: ko })}
          </h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>
              오늘
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 이벤트
        </Button>
      </div>

      {/* 캘린더 그리드 */}
      <div className="rounded-lg border bg-white shadow-sm">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekdays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {monthData.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, state.view.currentDate);
            const isCurrentDay = isToday(date);
            const events = getEventsForDate(date);
            
            return (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b p-2 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isCurrentDay ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${
                      isCurrentMonth
                        ? isCurrentDay
                          ? 'font-bold text-blue-600'
                          : 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(date, 'd')}
                  </span>
                  {isCurrentDay && (
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  )}
                </div>
                
                {/* 이벤트 목록 */}
                <div className="mt-2 space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="rounded px-2 py-1 text-xs text-white"
                      style={{
                        backgroundColor: state.projects.find(p => p.id === event.project_id)?.color || '#6b7280'
                      }}
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
        </div>
      </div>
    </div>
  );
}
