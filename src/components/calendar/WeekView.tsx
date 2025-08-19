'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCalendar } from '@/contexts/CalendarContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, isSameDay, isToday, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export function WeekView() {
  const { state, setView } = useCalendar();

  const weekData = useMemo(() => {
    const start = startOfWeek(state.view.currentDate, { weekStartsOn: 1 }); // 월요일부터 시작
    const end = endOfWeek(state.view.currentDate, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start, end });
  }, [state.view.currentDate]);

  const hours = useMemo(() => {
    return eachHourOfInterval({
      start: new Date().setHours(0, 0, 0, 0),
      end: new Date().setHours(23, 0, 0, 0),
    });
  }, []);

  const handlePreviousWeek = () => {
    const newDate = addDays(state.view.currentDate, -7);
    setView({ ...state.view, currentDate: newDate });
  };

  const handleNextWeek = () => {
    const newDate = addDays(state.view.currentDate, 7);
    setView({ ...state.view, currentDate: newDate });
  };

  const handleToday = () => {
    setView({ ...state.view, currentDate: new Date() });
  };

  const getEventsForTimeSlot = (date: Date, hour: number) => {
    return state.events.filter(event => {
      const eventDate = new Date(event.starts_at_utc);
      const eventHour = eventDate.getHours();
      return isSameDay(eventDate, date) && eventHour === hour;
    });
  };

  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(weekData[0], 'yyyy년 M월 d일', { locale: ko })} - {format(weekData[6], 'M월 d일', { locale: ko })}
          </h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>
              오늘
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 이벤트
        </Button>
      </div>

      {/* 주간 타임라인 */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-8 border-b bg-gray-50">
          <div className="p-3 text-sm font-medium text-gray-500"></div>
          {weekData.map((date, index) => (
            <div
              key={index}
              className={`p-3 text-center text-sm font-medium ${
                isToday(date) ? 'text-blue-600 font-bold' : 'text-gray-500'
              }`}
            >
              <div>{weekdays[index]}</div>
              <div className="text-xs">{format(date, 'd')}</div>
            </div>
          ))}
        </div>

        {/* 시간대별 그리드 */}
        <div className="overflow-auto max-h-[600px]">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              {/* 시간 표시 */}
              <div className="p-2 text-xs text-gray-500 border-r bg-gray-50">
                {format(hour, 'HH:mm')}
              </div>
              
              {/* 각 요일별 셀 */}
              {weekData.map((date, dayIndex) => {
                const events = getEventsForTimeSlot(date, hour);
                const isCurrentDay = isToday(date);
                
                return (
                  <div
                    key={dayIndex}
                    className={`p-1 border-r min-h-[60px] ${
                      isCurrentDay ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded px-2 py-1 text-xs text-white mb-1 truncate"
                        style={{
                          backgroundColor: state.projects.find(p => p.id === event.project_id)?.color || '#6b7280'
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
