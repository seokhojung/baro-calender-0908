'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, FolderOpen, Users } from 'lucide-react';
import { useCalendar } from '@/contexts/CalendarContext';

export function Sidebar() {
  const { state, setView } = useCalendar();

  const handleViewChange = (viewType: 'month' | 'week') => {
    setView({ type: viewType, currentDate: state.view.currentDate });
  };

  return (
    <aside className="w-64 border-r bg-gray-50 p-6">
      {/* 뷰 전환 */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700">캘린더 뷰</h3>
        <div className="space-y-2">
          <Button
            variant={state.view.type === 'month' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => handleViewChange('month')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            월 뷰
          </Button>
          <Button
            variant={state.view.type === 'week' ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => handleViewChange('week')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            주 뷰
          </Button>
        </div>
      </div>

      {/* 프로젝트 목록 */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">프로젝트</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {state.projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm text-gray-700">{project.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-gray-700">빠른 액션</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            새 이벤트
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <FolderOpen className="mr-2 h-4 w-4" />
            새 프로젝트
          </Button>
        </div>
      </div>

      {/* 팀 멤버 */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-gray-700">팀 멤버</h3>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            멤버 관리
          </Button>
        </div>
      </div>
    </aside>
  );
}
